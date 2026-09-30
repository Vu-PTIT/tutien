const {test} = require('node:test');
const assert = require('node:assert/strict');
const {setup, clone, A, rejectsCode} = require('./helpers/assets.cjs');
const op='starter_request_001';
const reward={spiritStones:3,items:[{itemId:'it_water',quantity:5}]};
const claim=s=>s.rpc('inventory_claim_starter',{operationId:op});
const grant=(s,id=op,source='test:encounter:1',bundle=reward)=>clone(s.scope.grantReward(s.nk,A,id,source,bundle));
const at=(s,x,y)=>s.nk.storageWrite([{collection:'world_sessions',key:'main',userId:A,value:{mapId:'m_an_khe',x,y,seq:1,updatedAt:Date.now()},version:'*',permissionRead:0,permissionWrite:0}]);
test('catalog v2 exposes 25 stable unique IDs and stack/instance policy',()=>{
  const s=setup(),v=s.rpc('inventory_get');assert.equal(v.capacity,24);assert.equal(v.catalogVersion,2);assert.equal(v.catalog.length,25);
  assert.equal(new Set(v.catalog.map(i=>i.id)).size,25);
  assert.equal(v.catalog.find(i=>i.id==='it_spider_robe').defenseBonus,20);
  assert.equal(v.catalog.find(i=>i.id==='it_mach_ban').bound,true);
  assert.equal(v.catalog.find(i=>i.id==='it_water').stackMax,99);
  assert.equal(v.starterClaimed,false);
});
test('asset RPCs authenticate and no arbitrary grant RPC is registered',()=>{
  const s=setup();for(const name of ['inventory_get','inventory_claim_starter']) rejectsCode(()=>s.rpc(name,{},''),16);
  assert.equal(s.handlers.grant_reward,undefined);
});
test('starter grants server amounts and both private receipts atomically',()=>{
  const s=setup(),v=claim(s);assert.equal(v.profile.spiritStones,12);assert.equal(v.profile.revision,1);
  assert.equal(v.profile.inventory.length,4);assert.match(v.profile.inventory[3].instanceId,/^[a-f0-9-]{36}$/);
  const receipts=[...s.rows.values()].filter(r=>r.collection==='asset_receipts');
  assert.equal(receipts.length,2);receipts.forEach(r=>{assert.equal(r.permissionRead,0);assert.equal(r.permissionWrite,0);});
  assert.equal(s.rpc('inventory_get').starterClaimed,true);
});
test('same operation replay returns original receipt with current profile',()=>{
  const s=setup(),first=claim(s);grant(s,'new_operation_002','test:2');
  const replay=claim(s);assert.equal(replay.replayed,true);assert.deepEqual(replay.receipt,first.receipt);
  assert.equal(replay.profile.spiritStones,15);assert.equal(replay.profile.revision,2);
});
test('new operation ID cannot claim the same source again',()=>{
  const s=setup();claim(s);const before=s.state();
  rejectsCode(()=>s.rpc('inventory_claim_starter',{operationId:'other_request_002'}),6);assert.deepEqual(s.state(),before);
});
test('reused operation with changed source or amount is rejected',()=>{
  const s=setup();grant(s);
  rejectsCode(()=>grant(s,op,'test:2'),6);
  rejectsCode(()=>grant(s,op,'test:encounter:1',{...reward,spiritStones:4}),6);
  assert.equal(s.state().spiritStones,3);
});
test('client cannot forge user, reward, quantity or source and malformed IDs fail',()=>{
  const s=setup();for(const extra of [{spiritStones:999},{userId:'victim'},{sourceId:'quest:1'},{items:[]},{quantity:-1}]) {
    rejectsCode(()=>s.rpc('inventory_claim_starter',{operationId:op,...extra}),3);
  }
  for(const operationId of ['',null,'short','a'.repeat(81),'bad!operation']) rejectsCode(()=>s.rpc('inventory_claim_starter',{operationId}),3);
  assert.equal(s.rows.size,0);
});
test('stack merging/splitting and unique equipment instances obey capacity',()=>{
  const s=setup();grant(s,op,'test:1',{spiritStones:0,items:[{itemId:'it_water',quantity:98}]});
  const v=grant(s,'another_operation','test:2',{spiritStones:0,items:[{itemId:'it_water',quantity:5},{itemId:'it_iron_sword',quantity:2}]});
  assert.deepEqual(v.profile.inventory.slice(0,2).map(i=>i.quantity),[99,4]);
  assert.notEqual(v.profile.inventory[2].instanceId,v.profile.inventory[3].instanceId);
});
test('full bag never partially adds money/items or consumes a receipt',()=>{
  const s=setup();grant(s,op,'test:fill',{spiritStones:0,items:[{itemId:'it_water',quantity:24*99}]});
  const before=s.state(),count=s.rows.size;
  rejectsCode(()=>grant(s,'overflow_operation','test:overflow',{spiritStones:10,items:[{itemId:'it_water',quantity:1}]}),8);
  assert.deepEqual(s.state(),before);assert.equal(s.rows.size,count);
});
test('full bag still permits stacking into an existing partial stack',()=>{
  const s=setup();grant(s,op,'test:fill',{spiritStones:0,items:[{itemId:'it_water',quantity:24*99-5}]});
  assert.equal(grant(s,'stack_operation_2','test:2').profile.inventory[23].quantity,99);
});
test('negative, fractional, overflow, unknown items cannot change assets',()=>{
  for(const bundle of [{spiritStones:-1,items:[]},{spiritStones:1e12,items:[]},
    ...[-1,0,1.5,1e12].map(quantity=>({spiritStones:0,items:[{itemId:'it_water',quantity}]})),
    {spiritStones:0,items:[{itemId:'it_fake',quantity:1}]}]) {
    const s=setup();s.rpc('get_profile');const before=s.state();assert.throws(()=>grant(s,op,'test:1',bundle));assert.deepEqual(s.state(),before);
  }
});
test('currency cap blocks whole reward',()=>{
  const s=setup(),p=s.rpc('get_profile');p.spiritStones=1e9;s.put(p);rejectsCode(()=>grant(s),8);assert.deepEqual(s.state(),p);
});
test('different concurrent rewards retry CAS without losing either reward',()=>{
  const s=setup();s.rpc('get_profile');const write=s.nk.storageWrite;
  s.nk.storageWrite=w=>{s.nk.storageWrite=write;grant(s,'concurrent_other','test:2');return write(w);};
  grant(s);assert.equal(s.state().spiritStones,6);assert.equal(s.state().inventory[0].quantity,10);assert.equal(s.state().revision,2);
});
test('concurrent same operation commits exactly once',()=>{
  const s=setup();s.rpc('get_profile');const write=s.nk.storageWrite;
  s.nk.storageWrite=w=>{s.nk.storageWrite=write;claim(s);return write(w);};
  assert.equal(claim(s).replayed,true);assert.equal(s.state().spiritStones,12);assert.equal(s.state().revision,1);
});
test('concurrent same operation interleaved commit replays without 409 conflict',()=>{
  const s=setup();s.rpc('get_profile');const read=s.nk.storageRead;let firstRead=true;
  s.nk.storageRead=ids=>{
    if(firstRead){firstRead=false;claim(s);}
    return read(ids);
  };
  const res=claim(s);assert.equal(res.replayed,true);assert.equal(res.profile.spiritStones,12);
});
test('concurrent different IDs cannot both claim starter',()=>{
  const s=setup();s.rpc('get_profile');const write=s.nk.storageWrite;
  s.nk.storageWrite=w=>{s.nk.storageWrite=write;s.rpc('inventory_claim_starter',{operationId:'concurrent_other'});return write(w);};
  rejectsCode(()=>claim(s),6);assert.equal(s.state().revision,1);assert.equal(s.rows.size,3);
});
test('lost acknowledgement after commit recovers receipt, reconnect replay is safe',()=>{
  const s=setup();s.rpc('get_profile');const write=s.nk.storageWrite;
  s.nk.storageWrite=w=>{write(w);throw Error('response lost');};
  const first=claim(s);assert.equal(first.replayed,true);assert.equal(first.profile.spiritStones,12);
  const reconnect=setup();reconnect.rows.clear();for(const [key,row] of s.rows) reconnect.rows.set(key,clone(row));
  assert.deepEqual(claim(reconnect).receipt,first.receipt);assert.equal(reconnect.state().revision,1);
});
test('database failure before commit leaves no partial assets or receipts',()=>{
  const s=setup();s.rpc('get_profile');const before=s.state();s.nk.storageWrite=()=>{throw Error('unavailable');};
  rejectsCode(()=>claim(s),14);assert.deepEqual(s.state(),before);assert.equal(s.rows.size,1);
});
test('same operation is scoped to each authenticated account',()=>{
  const s=setup();claim(s);const other=s.rpc('inventory_claim_starter',{operationId:op},'22222222-2222-4222-8222-222222222222');
  assert.equal(other.replayed,false);assert.equal(other.profile.spiritStones,12);
});
function luyenKhi(s, stage=1) {
  const profile=s.rpc('get_profile');profile.realm='luyen_khi';profile.realmStage=stage;
  s.put(profile);return profile;
}
test('monster XP opens cultivation and advances stages while max stage keeps loot without XP',()=>{
  const one=setup();luyenKhi(one,1);
  const first=grant(one,'repeatable_xp_001','pve:boar:one',{spiritStones:0,cultivationXp:700,items:[{itemId:'it_boar_hide',quantity:1}]});
  assert.equal(first.profile.realmStage,2);assert.equal(first.profile.cultivationXp,400);assert.equal(first.receipt.granted.cultivationXp,700);
  const two=setup();luyenKhi(two,2);
  const second=grant(two,'repeatable_xp_002','pve:boar:two',{spiritStones:0,cultivationXp:1500,items:[{itemId:'it_boar_hide',quantity:1}]});
  assert.equal(second.profile.realmStage,3);assert.equal(second.profile.cultivationXp,900);assert.equal(second.receipt.granted.cultivationXp,1500);
  const nearMax=setup();const advanced=luyenKhi(nearMax,3);advanced.cultivationXp=999;nearMax.put(advanced);
  const finalStep=grant(nearMax,'repeatable_xp_003','pve:boar:near-max',{spiritStones:0,cultivationXp:5000,items:[{itemId:'it_boar_hide',quantity:1}]});
  assert.equal(finalStep.profile.realmStage,4);assert.equal(finalStep.profile.cultivationXp,0);assert.equal(finalStep.receipt.granted.cultivationXp,1);
  const four=setup();luyenKhi(four,4);
  const max=grant(four,'repeatable_xp_004','pve:boar:four',{spiritStones:0,cultivationXp:10,items:[{itemId:'it_boar_hide',quantity:1}]});
  assert.equal(max.profile.cultivationXp,0);assert.equal(max.receipt.granted.cultivationXp,0);
  assert.equal(max.profile.inventory[0].itemId,'it_boar_hide');
  const mortal=setup();
  const training=grant(mortal,'repeatable_xp_000','pve:boar:mortal',{spiritStones:0,cultivationXp:10,items:[{itemId:'it_boar_hide',quantity:1}]});
  assert.equal(training.profile.realm,'mortal');assert.equal(training.profile.cultivationXp,10);
  const breakthrough=grant(mortal,'repeatable_xp_005','pve:boar:mortal:2',{spiritStones:0,cultivationXp:90,items:[{itemId:'it_spider_silk',quantity:1}]});
  assert.equal(breakthrough.profile.realm,'luyen_khi');assert.equal(breakthrough.profile.realmStage,1);
  assert.equal(breakthrough.profile.cultivationXp,0);assert.equal(breakthrough.receipt.granted.cultivationXp,90);
});
test('equip toggles server-owned instances and has idempotent mutation receipts',()=>{
  const s=setup();
  const starter=claim(s),armor=starter.profile.inventory.find(item=>item.itemId==='it_cloth_armor');
  const equipped=s.rpc('inventory_equip',{operationId:'equip_armor_001',instanceId:armor.instanceId});
  assert.equal(equipped.profile.equipped.armor,armor.instanceId);assert.equal(equipped.replayed,false);
  const revision=equipped.profile.revision;
  const replay=s.rpc('inventory_equip',{operationId:'equip_armor_001',instanceId:armor.instanceId});
  assert.equal(replay.replayed,true);assert.equal(replay.profile.revision,revision);
  const removed=s.rpc('inventory_equip',{operationId:'unequip_armor_001',instanceId:armor.instanceId});
  assert.equal(removed.profile.equipped.armor,'');
});
test('healing consumes one Hồi Nguyên Hoàn, respects HP cap and replays once',()=>{
  const s=setup();claim(s);const p=s.state();p.hp=65;s.put(p);
  const healed=s.rpc('inventory_use',{operationId:'use_heal_001',itemId:'it_heal_pill'});
  assert.equal(healed.profile.hp,100);assert.equal(healed.profile.inventory.find(item=>item.itemId==='it_heal_pill').quantity,1);
  const replay=s.rpc('inventory_use',{operationId:'use_heal_001',itemId:'it_heal_pill'});
  assert.equal(replay.replayed,true);assert.equal(replay.profile.hp,100);
  rejectsCode(()=>s.rpc('inventory_use',{operationId:'use_heal_002',itemId:'it_heal_pill'}),9);
});
test('discard removes only requested ordinary items and protects bound/equipped gear',()=>{
  const s=setup();claim(s);
  const first=s.rpc('inventory_discard',{operationId:'discard_water_01',itemId:'it_water',quantity:2});
  assert.equal(first.profile.inventory.find(item=>item.itemId==='it_water').quantity,2);
  const armor=s.state().inventory.find(item=>item.itemId==='it_cloth_armor');
  s.rpc('inventory_equip',{operationId:'equip_armor_002',instanceId:armor.instanceId});
  rejectsCode(()=>s.rpc('inventory_discard',{operationId:'discard_armor_01',itemId:'it_cloth_armor',quantity:1,instanceId:armor.instanceId}),9);
  const profile=s.state();grant(s,'grant_bound_01','fixture:quest',{spiritStones:0,items:[{itemId:'it_mach_ban',quantity:1}]});
  const bound=s.state().inventory.find(item=>item.itemId==='it_mach_ban');
  rejectsCode(()=>s.rpc('inventory_discard',{operationId:'discard_bound_01',itemId:'it_mach_ban',quantity:1,instanceId:bound.instanceId}),9);
  assert.equal(s.state().spiritStones,profile.spiritStones);
});
test('shop buy and sell use fixed server prices and operation receipts',()=>{
  const s=setup();claim(s);at(s,1248,672);
  const bought=s.rpc('economy_action',{operationId:'shop_buy_water_01',action:'buy',itemId:'it_water',quantity:2});
  assert.equal(bought.profile.spiritStones,10);assert.equal(bought.profile.inventory.find(i=>i.itemId==='it_water').quantity,6);
  const replay=s.rpc('economy_action',{operationId:'shop_buy_water_01',action:'buy',itemId:'it_water',quantity:2});
  assert.equal(replay.replayed,true);assert.equal(replay.profile.spiritStones,10);
  const sold=s.rpc('economy_action',{operationId:'shop_sell_seed_02',action:'sell',itemId:'it_seed_cam_lo',quantity:1});
  assert.equal(sold.profile.spiritStones,11);
  rejectsCode(()=>s.rpc('economy_action',{operationId:'shop_fake_price_03',action:'buy',itemId:'it_iron',quantity:1}),9);
});
test('economy RPCs cannot be used remotely without reaching their server-owned service',()=>{
  const s=setup();claim(s);const before=s.state();
  rejectsCode(()=>s.rpc('economy_action',{operationId:'remote_shop_001',action:'buy',itemId:'it_water',quantity:1}),9);
  rejectsCode(()=>s.rpc('garden_action',{operationId:'remote_garden_001',action:'plant',plotId:0,cropId:'crop_cam_lo'}),9);
  assert.deepEqual(s.state(),before);
});
test('craft checks every ingredient and commits output, fee and inputs together',()=>{
  const s=setup();claim(s);at(s,1024,480);
  const before=s.state();before.inventory.find(i=>i.itemId==='it_seed_cam_lo').quantity=2;
  before.inventory.push({itemId:'it_herb_cam_lo',quantity:2});s.put(before);
  const crafted=s.rpc('economy_action',{operationId:'craft_heal_001',action:'craft',recipeId:'rc_heal',quantity:1});
  assert.equal(crafted.profile.spiritStones,10);assert.equal(crafted.profile.inventory.find(i=>i.itemId==='it_herb_cam_lo'),undefined);
  assert.equal(crafted.profile.inventory.find(i=>i.itemId==='it_heal_pill').quantity,3);
  rejectsCode(()=>s.rpc('economy_action',{operationId:'craft_empty_002',action:'craft',recipeId:'rc_sword',quantity:1}),9);
});
test('garden planting consumes seed and water once; early harvest is blocked; ready harvest replays safely',()=>{
  const s=setup();claim(s);at(s,320,864);
  const planted=s.rpc('garden_action',{operationId:'plant_camlo_001',action:'plant',plotId:0,cropId:'crop_cam_lo'});
  assert.equal(planted.profile.inventory.find(i=>i.itemId==='it_seed_cam_lo').quantity,1);
  assert.equal(planted.profile.inventory.find(i=>i.itemId==='it_water').quantity,3);
  rejectsCode(()=>s.rpc('garden_action',{operationId:'harvest_early_01',action:'harvest',plotId:0}),9);
  const ready=s.state();ready.gardenPlots[0].readyAt=Date.now()-1;s.put(ready);
  const harvested=s.rpc('garden_action',{operationId:'harvest_camlo_01',action:'harvest',plotId:0});
  assert.equal(harvested.profile.inventory.find(i=>i.itemId==='it_herb_cam_lo').quantity,4);
  assert.equal(harvested.profile.gardenPlots[0].state,'empty');
  assert.equal(s.rpc('garden_action',{operationId:'harvest_camlo_01',action:'harvest',plotId:0}).replayed,true);
});
