const {test} = require('node:test');
const assert = require('node:assert/strict');
const {setup, rejectsCode} = require('./helpers/assets.cjs');

function at(s, mapId, x, y) {
  const id={collection:'world_sessions',key:'main',userId:'11111111-1111-4111-8111-111111111111'};
  const row=s.nk.storageRead([id])[0];
  const value=row ? JSON.parse(JSON.stringify(row.value)) : {};
  value.mapId=mapId; value.x=x; value.y=y; value.seq=Number(value.seq||0); value.updatedAt=Date.now();
  s.nk.storageWrite([{...id,value,version:row?.version||'*',permissionRead:0,permissionWrite:0}]);
}
function learnPhi(s) {
  const profile=s.rpc('get_profile');
  profile.learnedSkills=['sk_phi_nhan'];
  s.put(profile);
}
test('skill catalogue exposes utility and active skills with stable IDs',()=>{
  const s=setup(),result=s.rpc('inventory_get');
  assert.ok(result.skills.some(skill=>skill.id==='sk_scan'&&skill.kind==='utility'));
  assert.ok(result.skills.some(skill=>skill.id==='sk_phi_nhan'&&skill.equipSlot==='active_1'));
});
test('active skills require unlock, persist in the server profile, and support safe equip/unequip retries',()=>{
  const s=setup();
  rejectsCode(()=>s.rpc('skill_equip',{operationId:'skill_lock_001',skillId:'sk_phi_nhan'}),9);
  assert.equal(s.state().revision,0);
  learnPhi(s);
  const equipped=s.rpc('skill_equip',{operationId:'skill_equip_001',skillId:'sk_phi_nhan'});
  assert.equal(equipped.profile.equippedSkills.active_1,'sk_phi_nhan');
  assert.equal(equipped.profile.revision,1);
  const replay=s.rpc('skill_equip',{operationId:'skill_equip_001',skillId:'sk_phi_nhan'});
  assert.equal(replay.replayed,true);
  assert.equal(replay.profile.revision,1);
  rejectsCode(()=>s.rpc('skill_equip',{operationId:'skill_bad_002',skillId:'sk_scan'}),9);
  const removed=s.rpc('skill_equip',{operationId:'skill_remove_003',skillId:''});
  assert.equal(removed.profile.equippedSkills.active_1,'');
});
test('equipped Phi Nhận increases field damage; server rejects a forged or unequipped cast',()=>{
  const castWithSkill=setup();
  castWithSkill.rpc('world_get',{preferredMapId:'m_truc_am'});
  at(castWithSkill,'m_truc_am',1136,560);
  const boar='ta.mob.son_tru.01';
  rejectsCode(()=>castWithSkill.rpc('world_attack',{targetId:boar,skillId:'sk_phi_nhan'}),9);
  learnPhi(castWithSkill);
  castWithSkill.rpc('skill_equip',{operationId:'skill_cast_equip_01',skillId:'sk_phi_nhan'});
  const powered=castWithSkill.rpc('world_attack',{targetId:boar,skillId:'sk_phi_nhan'});
  assert.equal(powered.skillId,'sk_phi_nhan');
  assert.ok(powered.damage>15);
  assert.match(powered.message,/Phi Nhận/);
  const basic=setup();
  basic.rpc('world_get',{preferredMapId:'m_truc_am'});
  at(basic,'m_truc_am',1136,560);
  const plain=basic.rpc('world_attack',{targetId:boar});
  assert.equal(plain.damage,15);
  assert.ok(powered.damage>plain.damage);
});
