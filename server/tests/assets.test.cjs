const {test} = require('node:test');
const assert = require('node:assert/strict');
const {setup, clone, A, rejectsCode} = require('./helpers/assets.cjs');
const op='starter_request_001';
const reward={spiritStones:3,items:[{itemId:'it_water',quantity:5}]};
const claim=s=>s.rpc('inventory_claim_starter',{operationId:op});
const grant=(s,id=op,source='test:encounter:1',bundle=reward)=>clone(s.scope.grantReward(s.nk,A,id,source,bundle));
test('catalog exposes exactly the 24 stable unique IDs and stack/instance policy',()=>{
  const s=setup(),v=s.rpc('inventory_get');assert.equal(v.capacity,24);assert.equal(v.catalog.length,24);
  assert.equal(new Set(v.catalog.map(i=>i.id)).size,24);
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
