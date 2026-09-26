const {test} = require('node:test');
const assert = require('node:assert/strict');
const {setup, A, rejectsCode} = require('./helpers/assets.cjs');
test('rejects unauthenticated and system-owned profiles', () => {
  const s=setup();
  for(const id of ['', '00000000-0000-0000-0000-000000000000']) rejectsCode(()=>s.rpc('get_profile',{},id),16);
});
test('creates server-owned schema 2 and ignores client supplied money', () => {
  const s=setup(), profile=s.rpc('get_profile',{spiritStones:99999});
  assert.equal(profile.spiritStones,0);
  assert.equal(profile.schemaVersion,2);
  assert.equal(profile.realm,'mortal');
  assert.equal(profile.realmStage,0);
  assert.equal(profile.characterId,A);
  const row=[...s.rows.values()][0];
  assert.equal(row.permissionWrite,0);
  assert.equal(row.permissionRead,1);
});
test('existing valid progress is returned without overwrite', () => {
  const s=setup(), profile=s.rpc('get_profile');
  s.nk.storageWrite=()=>assert.fail('unexpected write');
  assert.deepEqual(s.rpc('get_profile'),profile);
});
test('concurrent initialization returns winning profile', () => {
  const s=setup(), write=s.nk.storageWrite;
  s.nk.storageWrite=w=>{
    s.nk.storageWrite=write;
    write([{...w[0],value:{...w[0].value,spiritStones:10}}]);
    throw Error('conflict');
  };
  assert.equal(s.rpc('get_profile').spiritStones,10);
});
test('persistent storage failure cannot be treated as success', () => {
  const s=setup();s.nk.storageWrite=()=>{throw Error('offline');};
  rejectsCode(()=>s.rpc('get_profile'),14);
  assert.equal(s.rows.size,0);
});
test('migration preserves money, valid cultivation and unknown fields', () => {
  const s=setup();
  s.put({schemaVersion:1,realm:'luyen_khi',level:3,spiritStones:500,note:'retain'});
  const p=s.rpc('get_profile');
  assert.equal(p.realmStage,3); assert.equal(p.spiritStones,500); assert.equal(p.note,'retain');
  assert.equal(p.level,undefined); assert.deepEqual(p.inventory,[]);
  assert.deepEqual(s.rpc('get_profile'),p);
});
test('migration maps original pham_nhan level 1 to mortal stage 0', () => {
  const s=setup();s.put({schemaVersion:1,realm:'pham_nhan',level:1,spiritStones:12});
  const p=s.rpc('get_profile');assert.equal(p.realm,'mortal');assert.equal(p.realmStage,0);assert.equal(p.spiritStones,12);
});
test('invalid and unknown schemas are preserved untouched for review', () => {
  for(const data of [
    {schemaVersion:3}, {schemaVersion:1,realm:'pham_nhan',level:9,spiritStones:50},
    {schemaVersion:1,realm:'luyen_khi',level:5,spiritStones:50},
    {schemaVersion:1,realm:'pham_nhan',level:1,spiritStones:-1},
    {schemaVersion:1,realm:'pham_nhan',level:1,spiritStones:0,inventory:[]}
  ]) {const s=setup();s.put(data);rejectsCode(()=>s.rpc('get_profile'),9);assert.deepEqual(s.state(),data);}
});
test('migration CAS retry keeps newer legacy progress', () => {
  const s=setup();s.put({schemaVersion:1,realm:'luyen_khi',level:1,spiritStones:5});
  const write=s.nk.storageWrite;
  s.nk.storageWrite=w=>{s.nk.storageWrite=write;s.put({schemaVersion:1,realm:'luyen_khi',level:2,spiritStones:20});return write(w);};
  const p=s.rpc('get_profile');assert.equal(p.realmStage,2);assert.equal(p.spiritStones,20);
});
