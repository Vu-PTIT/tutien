const {test} = require('node:test');
const assert = require('node:assert/strict');
const {setup, A, rejectsCode} = require('./helpers/assets.cjs');

function setPosition(s, mapId, x, y, seq = 0) {
  const id = {collection:'world_sessions', key:'main', userId:A};
  const old = s.nk.storageRead([id])[0];
  s.nk.storageWrite([{...id, value:{mapId,x,y,seq,updatedAt:Date.now()}, version:old?.version || '*', permissionRead:0, permissionWrite:0}]);
}

test('world_get creates a server-owned starting point and current opening quest', () => {
  const s=setup();
  const world=s.rpc('world_get');
  assert.deepEqual([world.mapId,world.x,world.y,world.seq],['m_an_khe',768,576,0]);
  assert.equal(world.quest.questId,'q_main_001');
  assert.equal(s.rows.get(`${A}/world_sessions/main`).permissionWrite,0);
});

test('first online login keeps an offline preview on a reachable map, then respects saved progress', () => {
  const first=setup();
  const initial=first.rpc('world_get',{preferredMapId:'m_truc_am'});
  assert.deepEqual([initial.mapId,initial.x,initial.y],['m_truc_am',160,928]);
  assert.equal(initial.fieldMobs.length,4);

  const returning=setup();
  returning.rpc('world_get');
  const adopted=returning.rpc('world_get',{preferredMapId:'m_truc_am'});
  assert.deepEqual([adopted.mapId,adopted.x,adopted.y],['m_truc_am',160,928]);
  setPosition(returning,'m_truc_am',164,928,1);
  const saved=returning.rpc('world_get',{preferredMapId:'m_an_khe'});
  assert.deepEqual([saved.mapId,saved.x,saved.y],['m_truc_am',164,928]);
  rejectsCode(()=>setup().rpc('world_get',{preferredMapId:'unknown_map'}),3);
});

test('movement rejects forged position, extra fields, and stale sequence', () => {
  const s=setup(); s.rpc('world_get');
  rejectsCode(()=>s.rpc('world_move',{x:1300,y:900,seq:1}),3);
  rejectsCode(()=>s.rpc('world_move',{x:768,y:576,seq:1,mapId:'m_truc_am'}),3);
  setPosition(s,'m_an_khe',768,576,7);
  rejectsCode(()=>s.rpc('world_move',{x:768,y:576,seq:6}),10);
  assert.equal(s.rpc('world_get').mapId,'m_an_khe');
});

test('world interactions require only a known nearby object on the current server map', () => {
  const s=setup(); s.rpc('world_get');
  rejectsCode(()=>s.rpc('world_interact',{entityId:'ak.npc.ba_sam',mapId:'m_an_khe',x:272,y:432}),3);
  rejectsCode(()=>s.rpc('world_interact',{entityId:'ta.poi.water_trace_west'}),5);
  rejectsCode(()=>s.rpc('world_interact',{entityId:'ak.npc.ba_sam'}),9);
  assert.equal(s.rpc('get_profile').worldQuests,undefined);
});

test('opening quest grants Mạch Bàn, records both samples, and completes breath ritual once', () => {
  const s=setup(); s.rpc('get_profile');
  const interactAt=(map,x,y,id)=>{setPosition(s,map,x,y);return s.rpc('world_interact',{entityId:id});};
  const first=interactAt('m_an_khe',240,384,'ak.npc.ba_sam');
  assert.equal(first.quest.questId,'q_main_002');
  assert.deepEqual(first.profile.inventory,[]);
  const beforeTool=interactAt('m_truc_am',256,576,'ta.poi.water_trace_west');
  assert.match(beforeTool.message,/Mạch Bàn/);
  assert.equal(beforeTool.quest.objectives.water_west,undefined);
  const tool=interactAt('m_an_khe',768,992,'ak.npc.luc_vi');
  assert.equal(tool.profile.inventory[0].itemId,'it_mach_ban');
  assert.ok(tool.profile.learnedSkills.includes('sk_scan'));
  const west=interactAt('m_truc_am',256,576,'ta.poi.water_trace_west');
  assert.equal(west.quest.objectives.water_west,true);
  const east=interactAt('m_truc_am',448,960,'ta.poi.water_trace_east');
  assert.equal(east.quest.questId,'q_main_003');
  assert.deepEqual(east.profile.inventory.map(x=>x.itemId),['it_mach_ban','it_water_sample','it_water_sample']);
  const ritual=interactAt('m_an_khe',800,640,'ak.shrine.breathing');
  assert.equal(ritual.profile.realm,'luyen_khi');
  assert.equal(ritual.profile.realmStage,1);
  assert.equal(ritual.profile.cultivationXp,40);
  assert.ok(ritual.profile.learnedTechniques.includes('cp_tuc_mach'));
  assert.ok(ritual.profile.learnedSkills.includes('sk_phi_nhan'));
  assert.ok(ritual.profile.insightFlags.includes('insight.breath_control'));
  assert.equal(ritual.quest.questId,'q_main_complete');
  const revision=ritual.profile.revision;
  const replay=interactAt('m_an_khe',800,640,'ak.shrine.breathing');
  assert.equal(replay.profile.revision,revision);
  assert.equal(replay.profile.cultivationXp,40);
  assert.equal(replay.profile.inventory.filter(x=>x.itemId==='it_water_sample').length,2);
});

test('physical gate changes server map and cannot be used from too far away', () => {
  const s=setup(); s.rpc('world_get');
  setPosition(s,'m_an_khe',704,96);
  const moved=s.rpc('world_interact',{entityId:'ak.gate.truc_am'});
  assert.equal(moved.mapId,'m_truc_am');
  assert.deepEqual([moved.x,moved.y],[160,928]);
  assert.equal(moved.seq,1);
  rejectsCode(()=>s.rpc('world_interact',{entityId:'ak.gate.truc_am'}),5);
});

test('map travel uses reachable routes, canonical arrivals, and a fresh movement sequence', () => {
  const s=setup();
  s.rpc('world_get');
  const truc=s.rpc('world_travel',{mapId:'m_truc_am'});
  assert.deepEqual([truc.mapId,truc.x,truc.y,truc.seq],['m_truc_am',160,928,1]);
  assert.equal(truc.fieldMobs.length,4);
  const same=s.rpc('world_travel',{mapId:'m_truc_am'});
  assert.deepEqual([same.mapId,same.x,same.y,same.seq],['m_truc_am',160,928,1]);
  const coTinh=s.rpc('world_travel',{mapId:'m_co_tinh'});
  assert.deepEqual([coTinh.mapId,coTinh.x,coTinh.y,coTinh.seq],['m_co_tinh',352,992,2]);
  rejectsCode(()=>s.rpc('world_travel',{mapId:'unknown_map'}),3);
  rejectsCode(()=>s.rpc('world_travel',{mapId:'m_an_khe',x:1}),3);
  assert.equal(s.rpc('world_get').mapId,'m_co_tinh');
});

test('Trúc Âm exposes its Sơn Trư and Độc Chu as live field mobs on the current map', () => {
  const s=setup();
  setPosition(s,'m_truc_am',160,928);
  const world=s.rpc('world_get');
  assert.equal(world.mapId,'m_truc_am');
  assert.deepEqual(world.fieldMobs.map(m=>m.enemyId).sort(),['en_boar','en_boar','en_spider','en_spider']);
  assert.ok(world.fieldMobs.every(m=>m.hp===m.maxHp&&m.mode==='idle'));
  assert.equal(s.rows.has(`${A}/pve_son_tru_sessions/active`),false,'field spawning does not create a solo hunt session');
});

test('field attack checks map, range, target id, cooldown, and grants one durable kill reward', async () => {
  const s=setup();
  const profile=s.rpc('get_profile');
  profile.realm='luyen_khi'; profile.realmStage=1;
  s.put(profile);
  setPosition(s,'m_truc_am',1136,560);
  const world=s.rpc('world_get');
  const boar=world.fieldMobs.find(m=>m.id==='ta.mob.son_tru.01');
  assert.ok(boar);
  rejectsCode(()=>s.rpc('world_attack',{targetId:boar.id,items:[{itemId:'it_iron_sword'}]}),3);
  setPosition(s,'m_an_khe',768,576);
  rejectsCode(()=>s.rpc('world_attack',{targetId:boar.id}),5);
  setPosition(s,'m_truc_am',700,800);
  rejectsCode(()=>s.rpc('world_attack',{targetId:boar.id}),9);
  setPosition(s,'m_truc_am',1136,560);
  s.rpc('world_get');
  let hit=s.rpc('world_attack',{targetId:boar.id});
  assert.equal(hit.damage,15);
  assert.equal(hit.killed,false);
  let lostAtomicRewardAck=false;
  const storageWrite=s.nk.storageWrite;
  s.nk.storageWrite=writes=>{
    const result=storageWrite(writes);
    if(!lostAtomicRewardAck&&writes.some(w=>w.collection==='characters')&&writes.some(w=>w.collection==='world_sessions')&&writes.some(w=>w.collection==='asset_receipts')) {
      lostAtomicRewardAck=true;
      throw Error('response lost after atomic field kill commit');
    }
    return result;
  };
  for(let strike=0;strike<3;strike++) {
    await new Promise(resolve=>setTimeout(resolve,710));
    hit=s.rpc('world_attack',{targetId:boar.id});
  }
  assert.equal(lostAtomicRewardAck,true);
  assert.equal(hit.killed,true);
  assert.equal(hit.profile.cultivationXp,10);
  assert.equal(hit.profile.inventory.find(i=>i.itemId==='it_boar_hide').quantity,1);
  const sword=hit.profile.inventory.find(i=>i.itemId==='it_iron_sword');
  assert.ok(sword&&sword.instanceId,'server loot roll can award a unique weapon instance');
  assert.match(hit.message,/rơi Thanh Thiết Kiếm/);
  assert.equal(hit.fieldMobs.find(m=>m.id===boar.id).hp,0);
  rejectsCode(()=>s.rpc('world_attack',{targetId:boar.id}),9);
  const replay=s.rpc('world_get');
  assert.equal(replay.fieldMobs.find(m=>m.id===boar.id).generation,1);
  assert.equal(s.state().inventory.find(i=>i.itemId==='it_boar_hide').quantity,1);
  assert.equal(s.state().inventory.find(i=>i.itemId==='it_iron_sword').quantity,1);
});

test('legacy field sessions migrate the gear table and initialize durable pity state', () => {
  const s=setup();
  setPosition(s,'m_truc_am',160,928);
  s.rpc('world_get');
  const id={collection:'world_sessions',key:'main',userId:A};
  const row=s.nk.storageRead([id])[0];
  const legacy=JSON.parse(JSON.stringify(row.value));
  delete legacy.equipmentPity;
  const mobs=legacy.fieldMobsByMap.m_truc_am;
  for(const mob of mobs) {
    delete mob.equipmentDropItemId; delete mob.equipmentDropBasisPoints; delete mob.equipmentDropPityKills;
  }
  const oldBoar=mobs.find(m=>m.id==='ta.mob.son_tru.01');
  oldBoar.equipmentDropItemId='it_iron_sword'; oldBoar.equipmentDropBasisPoints=2000;
  const oldSpider=mobs.find(m=>m.id==='ta.mob.doc_chu.02');
  oldSpider.equipmentDropItemId='it_cloth_armor'; oldSpider.equipmentDropBasisPoints=1000;
  s.nk.storageWrite([{...id,value:legacy,version:row.version,permissionRead:0,permissionWrite:0}]);

  const restored=s.rpc('world_get');
  const boars=restored.fieldMobs.filter(m=>m.enemyId==='en_boar');
  const spiders=restored.fieldMobs.filter(m=>m.enemyId==='en_spider');
  assert.equal(boars.length,2); assert.equal(spiders.length,2);
  assert.ok(boars.every(m=>m.equipmentDropItemId==='it_iron_sword'&&m.equipmentDropBasisPoints===2000&&m.equipmentDropPityKills===8));
  assert.ok(spiders.every(m=>m.equipmentDropItemId==='it_spider_robe'&&m.equipmentDropBasisPoints===1000&&m.equipmentDropPityKills===12));
  assert.deepEqual(s.nk.storageRead([id])[0].value.equipmentPity,{});
});

test('spider equipment pity survives world reads, guarantees an upgrade, and equips it', async () => {
  const s=setup();
  setPosition(s,'m_truc_am',464,560);
  const originalHash=s.nk.sha256Hash;
  s.nk.sha256Hash=value=>value.startsWith(A+':world:')?'ffffffffffffffffffffffffffffffff':originalHash(value);
  const world=s.rpc('world_get');
  const spider=world.fieldMobs.find(m=>m.id==='ta.mob.doc_chu.01');
  assert.ok(spider);
  assert.equal(spider.equipmentDropItemId,'it_spider_robe');
  assert.equal(spider.equipmentDropBasisPoints,1000);
  assert.equal(spider.equipmentDropPityKills,12);
  async function kill(id) {
    let hit;
    for(let strike=0;strike<3;strike++) {
      if(strike>0) await new Promise(resolve=>setTimeout(resolve,710));
      hit=s.rpc('world_attack',{targetId:id});
    }
    return hit;
  }
  let hit=await kill(spider.id);
  assert.equal(hit.killed,true);
  assert.equal(hit.equipmentPity.misses,1);
  assert.equal(hit.profile.inventory.some(i=>i.itemId==='it_spider_robe'),false);
  const sessionId={collection:'world_sessions',key:'main',userId:A};
  let stored=s.nk.storageRead([sessionId])[0];
  assert.equal(stored.value.equipmentPity.it_spider_robe,1);
  assert.equal(s.rpc('world_get').fieldMobs.find(m=>m.id===spider.id).equipmentDropPityMisses,1);

  stored=s.nk.storageRead([sessionId])[0];
  const next=JSON.parse(JSON.stringify(stored.value));
  next.equipmentPity.it_spider_robe=11;
  const target=next.fieldMobsByMap.m_truc_am.find(m=>m.id===spider.id);
  target.hp=target.maxHp; target.mode='idle'; target.respawnAt=0; target.generation++;
  next.attackReadyAt=0;
  s.nk.storageWrite([{...sessionId,value:next,version:stored.version,permissionRead:0,permissionWrite:0}]);
  hit=await kill(spider.id);
  assert.equal(hit.killed,true);
  assert.equal(hit.equipmentPity.guaranteed,true);
  assert.match(hit.message,/bảo đảm/);
  const robe=hit.profile.inventory.find(i=>i.itemId==='it_spider_robe');
  assert.ok(robe&&robe.instanceId);
  assert.equal(s.nk.storageRead([sessionId])[0].value.equipmentPity.it_spider_robe,0);
  const definition=s.rpc('inventory_get').catalog.find(i=>i.id==='it_spider_robe');
  assert.equal(definition.defenseBonus,20);
  const equipped=s.rpc('inventory_equip',{operationId:'equip_spider_robe_1',instanceId:robe.instanceId});
  assert.equal(equipped.profile.equipped.armor,robe.instanceId);
});

test('a mortal character can start farming immediately and earn XP toward the first breakthrough', async () => {
  const s=setup();
  setPosition(s,'m_truc_am',464,560);
  const spider=s.rpc('world_get').fieldMobs.find(m=>m.id==='ta.mob.doc_chu.01');
  assert.ok(spider);
  let hit;
  for(let strike=0;strike<3;strike++) {
    if(strike>0) await new Promise(resolve=>setTimeout(resolve,710));
    hit=s.rpc('world_attack',{targetId:spider.id});
  }
  assert.equal(hit.killed,true);
  assert.equal(hit.profile.realm,'mortal');
  assert.equal(hit.profile.cultivationXp,15);
  assert.equal(hit.profile.inventory.find(i=>i.itemId==='it_spider_silk').quantity,1);
});

test('the four maps form a server-authoritative, reciprocal gate route', () => {
  const s=setup(); s.rpc('world_get');
  setPosition(s,'m_truc_am',1408,128);
  const thach=s.rpc('world_interact',{entityId:'ta.gate.thach_can'});
  assert.equal(thach.mapId,'m_thach_can');
  assert.deepEqual([thach.x,thach.y],[128,544]);
  setPosition(s,'m_thach_can',96,576);
  const returnToTruc=s.rpc('world_interact',{entityId:'tc.retreat.truc_am'});
  assert.equal(returnToTruc.mapId,'m_truc_am');
  assert.deepEqual([returnToTruc.x,returnToTruc.y],[1344,128]);
  setPosition(s,'m_thach_can',1344,768);
  const coTinh=s.rpc('world_interact',{entityId:'tc.gate.co_tinh'});
  assert.equal(coTinh.mapId,'m_co_tinh');
  assert.deepEqual([coTinh.x,coTinh.y],[352,800]);
  setPosition(s,'m_co_tinh',256,800);
  const returnToThach=s.rpc('world_interact',{entityId:'ct.retreat.thach_can'});
  assert.equal(returnToThach.mapId,'m_thach_can');
  assert.deepEqual([returnToThach.x,returnToThach.y],[1280,768]);
});

test('resource nodes grant fixed yields once per operation and enforce the server position', () => {
  const s=setup();s.rpc('inventory_claim_starter',{operationId:'starter_request_001'});
  setPosition(s,'m_truc_am',160,544);
  const first=s.rpc('world_interact',{entityId:'ta.node.cam_lo'});
  assert.equal(first.profile.inventory.find(i=>i.itemId==='it_herb_cam_lo').quantity,2);
  const replay=s.rpc('world_interact',{entityId:'ta.node.cam_lo'});
  assert.equal(replay.profile.inventory.find(i=>i.itemId==='it_herb_cam_lo').quantity,2);
  setPosition(s,'m_thach_can',992,672);
  const ore=s.rpc('world_interact',{entityId:'tc.node.iron_ore'});
  assert.equal(ore.profile.inventory.find(i=>i.itemId==='it_iron').quantity,2);
});
