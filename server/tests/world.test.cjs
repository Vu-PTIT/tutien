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
  rejectsCode(()=>s.rpc('world_interact',{entityId:'ak.gate.truc_am'}),5);
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
