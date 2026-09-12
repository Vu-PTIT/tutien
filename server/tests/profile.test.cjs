const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function handler() {
  const scope = vm.createContext({});
  vm.runInContext(fs.readFileSync('build/index.js','utf8'),scope);
  let rpc;
  scope.InitModule({}, {}, {}, {registerRpc(id, fn){assert.equal(id,'get_profile');rpc=fn;}});
  return rpc;
}
test('rejects requests without authenticated user',()=>{
  assert.throws(()=>handler()({}, {}, {}, '{}'),e=>e.code===16);
});
test('creates server-owned profile and ignores client-supplied money',()=>{
  let write;
  const nk={storageRead:()=>[],storageWrite:w=>{write=w[0];}};
  const result=JSON.parse(handler()({userId:'u1'}, {}, nk, '{"spiritStones":99999}'));
  assert.equal(result.spiritStones,0);
  assert.equal(write.userId,'u1');
  assert.equal(write.version,'*');
  assert.equal(write.permissionWrite,0);
});
test('existing progress is returned without overwrite',()=>{
  const profile={level:9,spiritStones:500};
  const nk={storageRead:()=>[{value:profile}],storageWrite:()=>assert.fail('unexpected write')};
  assert.deepEqual(JSON.parse(handler()({userId:'u1'}, {}, nk, '{}')),profile);
});
test('concurrent initialization returns winning stored profile',()=>{
  let reads=0;
  const profile={level:2,spiritStones:10};
  const nk={storageRead:()=>++reads===1?[]:[{value:profile}],storageWrite:()=>{throw Error('conflict');}};
  assert.deepEqual(JSON.parse(handler()({userId:'u1'}, {}, nk, '{}')),profile);
});
test('storage failure is not silently treated as success',()=>{
  const nk={storageRead:()=>[],storageWrite:()=>{throw Error('database unavailable');}};
  assert.throws(()=>handler()({userId:'u1'}, {}, nk, '{}'),/database unavailable/);
});
