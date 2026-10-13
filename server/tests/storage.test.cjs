const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {setup,clone,A,rejectsCode}=require('./helpers/assets.cjs');
const B='22222222-2222-4222-8222-222222222222';
const SYSTEM='00000000-0000-0000-0000-000000000000';
const DAY=24*3600*1000,T0=1800000000000;
function clock(s,time){s.scope.testNow=time;vm.runInContext('Date.now=function(){return testNow;}',s.scope);}
const row=(s,collection,userId=A,key='main')=>s.rows.get(`${userId}/${collection}/${key}`);
function players(){
  const s=setup();clock(s,T0);
  s.nk.usersGetId=ids=>ids.filter(id=>[A,B].includes(id)).map(userId=>({userId,username:'player_'+userId[0]}));
  s.nk.friendsList=()=>({friends:[]});
  s.rpc('character_select_form',{operationId:'choose_form_A',kind:'human',speciesId:'human'},A);
  s.rpc('character_select_form',{operationId:'choose_form_B',kind:'spirit_beast',speciesId:'cat'},B);
  return s;
}
function contract(s){
  const c=s.rpc('contract_invite',{operationId:'invitation_0001',userId:B},A).contract;
  s.rpc('contract_respond',{contractId:c.id,accept:true},B);
  s.rpc('contract_hunt_start',{contractId:c.id},A);
  return {c,h:s.rpc('contract_hunt_start',{contractId:c.id},B).contract.hunt};
}
function seed(s,collection,key,value,userId=SYSTEM){
  s.nk.storageWrite([{collection,key,userId,value,version:'*',permissionRead:0,permissionWrite:0}]);
}

test('the Nội Giới is stored in its own row and untouched by unrelated profile writes',()=>{
  const s=players(),profile=row(s,'characters',B),world=row(s,'inner_worlds',B);
  assert.equal(profile.value.innerWorld,undefined);assert.equal(world.value.learned,true);assert.equal(world.permissionWrite,0);
  assert.equal(s.rpc('get_profile',{},B).innerWorld.teacher,'native');
  s.scope.saveCharacterHp(s.nk,B,40);
  assert.notEqual(row(s,'characters',B).version,profile.version);assert.equal(row(s,'inner_worlds',B).version,world.version);
  // A human who has not learned keeps no Nội Giới row at all.
  assert.equal(row(s,'inner_worlds',A),undefined);
});

test('a Nội Giới embedded by an older build moves to its own row on the next load',()=>{
  const s=players(),legacy=clone(row(s,'characters',B).value);
  legacy.innerWorld=clone(row(s,'inner_worlds',B).value);legacy.innerWorld.sky=0;legacy.innerWorld.pending={tho:3};
  s.rows.delete(`${B}/inner_worlds/main`);
  s.nk.storageWrite([{collection:'characters',key:'main',userId:B,value:legacy,version:row(s,'characters',B).version}]);
  assert.deepEqual(s.rpc('get_profile',{},B).innerWorld.pending,{tho:3});
  assert.equal(row(s,'characters',B).value.innerWorld,undefined);assert.deepEqual(row(s,'inner_worlds',B).value.pending,{tho:3});
});

test('a malformed Nội Giới row is kept for review and blocks changes',()=>{
  const s=players(),broken=clone(row(s,'inner_worlds',B));broken.value.cells=[1,2,3];s.rows.set(`${B}/inner_worlds/main`,broken);
  rejectsCode(()=>s.rpc('get_profile',{},B),9);assert.deepEqual(row(s,'inner_worlds',B).value.cells,[1,2,3]);
});

test('malformed optional profile fields are kept for review instead of trusted',()=>{
  for(const patch of [{worldQuests:{schemaVersion:1,currentQuestId:'q',completed:[],objectives:{x:'yes'}}},
      {insightFlags:['a','a']},{learnedTechniques:[7]},{resourceGatheredAt:{node:-1}},
      {activitySession:{schemaVersion:2}},{gardenPlots:[]}]) {
    const s=setup();s.rpc('get_profile');s.put({...s.state(),...patch});
    rejectsCode(()=>s.rpc('get_profile'),9);
  }
  const ok=setup();ok.rpc('get_profile');ok.put({...ok.state(),insightFlags:['insight.breath_control'],resourceGatheredAt:{n:5},note:'kept'});
  assert.equal(ok.rpc('get_profile').note,'kept');
});

test('old idempotency receipts are swept while one-time sources stay claimed',()=>{
  const s=setup();clock(s,T0);
  s.rpc('inventory_claim_starter',{operationId:'starter_request_001'});
  s.scope.grantReward(s.nk,A,'field_mob_0001','world:m_truc_am:mob:1',{spiritStones:0,items:[{itemId:'it_water',quantity:1}]});
  s.rpc('inventory_discard',{operationId:'discard_water_01',itemId:'it_water',quantity:1});
  const keys=collection=>[...s.rows.values()].filter(r=>r.userId===A&&r.collection===collection).map(r=>r.key).sort();
  s.rpc('get_profile');assert.equal(keys('asset_receipts').length,4,'recent receipts are kept');
  clock(s,T0+8*DAY);s.rpc('get_profile');
  assert.deepEqual(keys('asset_receipts'),['source:starter:v1']);assert.deepEqual(keys('asset_mutations'),[]);
  assert.equal(s.rpc('inventory_get').starterClaimed,true);
  assert.equal(s.rpc('inventory_claim_starter',{operationId:'starter_request_001'}).replayed,true);
  rejectsCode(()=>s.rpc('inventory_claim_starter',{operationId:'starter_request_002'}),6);
  // The sweep runs at most every few hours per player.
  clock(s,T0);s.scope.grantReward(s.nk,A,'field_mob_0002','world:m_truc_am:mob:2',{spiritStones:0,items:[{itemId:'it_water',quantity:1}]});
  clock(s,T0+8*DAY+3600*1000);s.rpc('get_profile');assert.equal(keys('asset_receipts').length,3);
  clock(s,T0+8*DAY+7*3600*1000);s.rpc('get_profile');assert.deepEqual(keys('asset_receipts'),['source:starter:v1']);
});

test('settled encounter outcomes are swept but a pending reward is never touched',()=>{
  const s=setup();clock(s,T0);s.rpc('get_profile');
  seed(s,'pve_settlements','outcome:old:1',{status:'settled',createdAt:T0-DAY},A);
  seed(s,'pve_settlements','outcome:waiting:1',{status:'pending',createdAt:T0-30*DAY},A);
  seed(s,'pve_settlements','pending',{status:'pending',outcomeKey:'outcome:waiting:1'},A);
  clock(s,T0+8*DAY);s.rpc('get_profile');
  assert.equal(row(s,'pve_settlements',A,'outcome:old:1'),undefined);
  assert.ok(row(s,'pve_settlements',A,'outcome:waiting:1'));assert.ok(row(s,'pve_settlements',A,'pending'));
});

test('shared rows: expired login limits and long-closed contracts are swept, live ones kept',()=>{
  const s=setup();clock(s,T0);
  seed(s,'social_limits','auth_expired',{count:3,resetAt:T0-1});
  seed(s,'social_limits','auth_live',{count:3,resetAt:T0+60000});
  seed(s,'spirit_contracts','ct_'+'a'.repeat(32),{status:'ended',endedAt:T0-31*DAY});
  seed(s,'spirit_contracts','ct_'+'b'.repeat(32),{status:'ended',endedAt:T0-DAY});
  seed(s,'spirit_contracts','ct_'+'c'.repeat(32),{status:'active',createdAt:T0-90*DAY});
  seed(s,'spirit_contracts','ct_'+'d'.repeat(32),{status:'pending',expiresAt:T0-31*DAY});
  s.rpc('get_profile');
  const left=collection=>[...s.rows.values()].filter(r=>r.userId===SYSTEM&&r.collection===collection).map(r=>r.key).sort();
  assert.deepEqual(left('social_limits'),['auth_live']);
  assert.deepEqual(left('spirit_contracts'),['ct_'+'b'.repeat(32),'ct_'+'c'.repeat(32)]);
});

test('cleanup failures never fail the profile request',()=>{
  const s=setup();clock(s,T0);s.nk.storageList=()=>{throw Error('list unavailable');};
  assert.equal(s.rpc('get_profile').characterId,A);
});

test('a hunt attack writes only the attacker, so the partner keeps acting freely',()=>{
  const s=players(),{c,h}=contract(s),partner=row(s,'characters',B).version;
  s.rpc('contract_hunt_attack',{contractId:c.id,huntId:h.id,operationId:'hunt_attack_0001',skill:false},A);
  assert.equal(row(s,'characters',B).version,partner);
});

test('hunt replay history keeps only a short tail',()=>{
  const s=players(),{c,h}=contract(s),stored=clone(row(s,'spirit_contracts',SYSTEM,c.id));
  stored.value.hunt.actions=Array.from({length:40},(_,i)=>({operationId:'old_attack_'+i,userId:B,skill:false,damage:1,combo:false}));
  s.rows.set(`${SYSTEM}/spirit_contracts/${c.id}`,stored);
  s.rpc('contract_hunt_attack',{contractId:c.id,huntId:h.id,operationId:'hunt_attack_0001',skill:false},A);
  const actions=row(s,'spirit_contracts',SYSTEM,c.id).value.hunt.actions;
  assert.equal(actions.length,32);assert.equal(actions.at(-1).operationId,'hunt_attack_0001');
});

test('contract_get skips a cleaned-up invitation and never creates the partner profile',()=>{
  const s=players(),c=s.rpc('contract_invite',{operationId:'invitation_0001',userId:B},A).contract;
  s.rows.delete(`${SYSTEM}/spirit_contracts/${c.id}`);
  assert.deepEqual(s.rpc('contract_get',{},B).incoming,[]);
  const fresh=players(),pending=fresh.rpc('contract_invite',{operationId:'invitation_0002',userId:B},A).contract;
  const version=row(fresh,'characters',B).version;
  assert.equal(fresh.rpc('contract_get',{},A).outgoing[0].other.form.kind,'spirit_beast');
  assert.equal(row(fresh,'characters',B).version,version);assert.equal(pending.status,'pending');
});

test('a settled hunt reward whose receipt was swept reports nothing to claim',()=>{
  const s=players();
  seed(s,'spirit_hunt_rewards','pending',{status:'settled',huntId:'11111111-2222-4333-8444-555555555555',contractId:'ct_x'},A);
  rejectsCode(()=>s.rpc('contract_hunt_claim',{},A),5);
});
