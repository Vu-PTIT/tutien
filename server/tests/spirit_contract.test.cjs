const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {setup,A,rejectsCode}=require('./helpers/assets.cjs');
const B='22222222-2222-4222-8222-222222222222';
const C='33333333-3333-4333-8333-333333333333';
function clock(s,time){vm.runInContext(`Date.now=()=>${time}`,s.scope);}
function game(){
  const s=setup();clock(s,1000000);
  s.nk.usersGetId=ids=>ids.filter(id=>[A,B,C].includes(id)).map(userId=>({userId,username:'player_'+userId[0]}));
  s.nk.friendsList=()=>({friends:[]});
  for(const id of [A,B,C]) s.rpc('character_select_form',{operationId:'choose_form_'+id[0],kind:id===B?'spirit_beast':'human',speciesId:id===B?'cat':'human'},id);
  return s;
}
function invite(s,a=A,b=B,op='invitation_0001'){return s.rpc('contract_invite',{operationId:op,userId:b},a).contract;}
function pair(s){const c=invite(s);return s.rpc('contract_respond',{contractId:c.id,accept:true},B).contract;}
function hunt(s,c){s.rpc('contract_hunt_start',{contractId:c.id},A);return s.rpc('contract_hunt_start',{contractId:c.id},B).contract.hunt;}
function attack(s,c,h,id=A,op='hunt_attack_0001',skill=false){return s.rpc('contract_hunt_attack',{contractId:c.id,huntId:h.id,operationId:op,skill},id);}
function win(s,c,h){let result;for(let i=0;i<20;i++){
  clock(s,1000000+i*2000);result=attack(s,c,h,i%2===0?A:B,'hunt_attack_'+i,true);
  if(result.contract.hunt.phase==='victory') return result;
}assert.fail('hunt did not finish');}
test('released schema 4 receives a human default without losing any progress',()=>{
  const s=setup();s.rpc('get_profile');const p=s.state();delete p.form;p.spiritStones=50;p.note='keep';s.put(p);
  const result=s.rpc('get_profile');assert.deepEqual(result.form,{kind:'human',speciesId:'human',selected:false});assert.equal(result.spiritStones,50);assert.equal(result.note,'keep');
});
test('form selection is authenticated, permanent, replayable and grants the matching active skill',()=>{
  const s=setup(),input={operationId:'form_cat_0001',kind:'spirit_beast',speciesId:'cat'};
  rejectsCode(()=>s.rpc('character_select_form',input,''),16);
  const result=s.rpc('character_select_form',input);assert.equal(result.profile.form.speciesId,'cat');assert.equal(result.profile.equippedSkills.active_1,'sk_linh_trao');
  assert.equal(s.rpc('character_select_form',input).replayed,true);
  rejectsCode(()=>s.rpc('character_select_form',{...input,operationId:'form_cat_0002'}),9);
  rejectsCode(()=>s.rpc('character_select_form',{...input,kind:'human',speciesId:'human'}),6);
  rejectsCode(()=>s.rpc('character_select_form',{...input,speciesId:'dragon'}),3);
  rejectsCode(()=>s.rpc('character_select_form',{...input,attack:999}),3);
});
test('malformed saved form is preserved for review instead of reset',()=>{
  const s=setup();s.rpc('get_profile');const p=s.state();p.form={kind:'spirit_beast',speciesId:'dragon',selected:true};s.put(p);
  rejectsCode(()=>s.rpc('get_profile'),9);assert.deepEqual(s.state(),p);
});
test('invitation remains pending until its recipient accepts and both slots are private',()=>{
  const s=game(),c=invite(s);assert.equal(c.status,'pending');assert.equal(s.rpc('contract_get').active,null);
  assert.equal(s.rpc('contract_get',{},B).incoming[0].id,c.id);assert.equal(s.rpc('contract_get').outgoing.length,1);
  rejectsCode(()=>s.rpc('contract_respond',{contractId:c.id,accept:true}),7);
  rejectsCode(()=>s.rpc('contract_respond',{contractId:c.id,accept:true},C),7);
  const accepted=s.rpc('contract_respond',{contractId:c.id,accept:true},B);assert.equal(accepted.contract.status,'active');
  assert.equal(s.rpc('contract_get').active.id,s.rpc('contract_get',{},B).active.id);
  assert.equal(s.rpc('contract_respond',{contractId:c.id,accept:true},B).replayed,true);
  for(const row of s.rows.values())if(row.collection.startsWith('spirit_')){assert.equal(row.permissionRead,0);assert.equal(row.permissionWrite,0);}
});
test('rejects self, missing and blocked targets and incompatible invitation replays',()=>{
  const s=game();rejectsCode(()=>invite(s,A,A),3);rejectsCode(()=>invite(s,A,'44444444-4444-4444-8444-444444444444'),5);
  s.nk.friendsList=(id)=>({friends:id===B?[{user:{userId:A},state:3}]:[]});rejectsCode(()=>invite(s),7);
  s.nk.friendsList=()=>({friends:[]});invite(s);rejectsCode(()=>invite(s,A,C),6);
  assert.equal(invite(s,A,B,'second_invite_0002').id,invite(s).id);
});
test('expires invitations at server time and allows a fresh offer',()=>{
  const s=game(),c=invite(s);clock(s,c.expiresAt);
  assert.equal(s.rpc('contract_get',{},B).incoming.length,0);rejectsCode(()=>s.rpc('contract_respond',{contractId:c.id,accept:true},B),9);
  assert.notEqual(invite(s,A,B,'new_after_expiry').id,c.id);
});
test('decline, withdraw and unilateral release preserve both inventories and progression',()=>{
  const s=game(),c=invite(s);s.rpc('contract_respond',{contractId:c.id,accept:false},B);
  assert.equal(s.rpc('contract_get').outgoing.length,0);
  const pending=invite(s,A,B,'next_offer_0002');s.rpc('contract_release',{contractId:pending.id});
  const third=invite(s,A,B,'next_offer_0003');s.rpc('contract_respond',{contractId:third.id,accept:true},B);
  const beforeA=s.rpc('get_profile'),beforeB=s.rpc('get_profile',{},B);
  s.rpc('contract_release',{contractId:third.id},B);
  assert.equal(s.rpc('contract_get').active,null);assert.equal(s.rpc('contract_get',{},B).active,null);
  assert.deepEqual(s.rpc('get_profile'),beforeA);assert.deepEqual(s.rpc('get_profile',{},B),beforeB);
  assert.equal(s.rpc('contract_release',{contractId:third.id},A).replayed,true);
});
test('competing acceptances cannot bind one player to two partners',()=>{
  const s=game(),first=invite(s),second=invite(s,C,B,'competing_invite');const write=s.nk.storageWrite;
  s.nk.storageWrite=w=>{
    if(w.some(x=>x.collection==='spirit_contracts'&&x.value.status==='active')){
      s.nk.storageWrite=write;s.rpc('contract_respond',{contractId:second.id,accept:true},B);
    }
    return write(w);
  };
  rejectsCode(()=>s.rpc('contract_respond',{contractId:first.id,accept:true},B),9);
  assert.equal(s.rpc('contract_get').active,null);assert.equal(s.rpc('contract_get',{},B).active.id,second.id);
});
test('lost invitation acknowledgement reuses the committed contract and inboxes',()=>{
  const s=game(),write=s.nk.storageWrite;
  s.nk.storageWrite=w=>{const a=write(w);if(w.some(x=>x.collection==='spirit_contracts'))throw Error('lost acknowledgement');return a;};
  const c=invite(s);assert.equal(c.status,'pending');assert.equal(s.rpc('contract_get').outgoing.length,1);assert.equal(s.rpc('contract_get',{},B).incoming.length,1);
});
test('an invitation CAS retry still rejects the same operation retargeted to another player',()=>{
  const s=game(),write=s.nk.storageWrite;
  s.nk.storageWrite=w=>{
    if(w.some(x=>x.collection==='spirit_contracts')){
      s.nk.storageWrite=write;invite(s,A,C);throw Error('CAS conflict');
    }
    return write(w);
  };
  rejectsCode(()=>invite(s,A,B),6);assert.equal(s.rpc('contract_get').outgoing[0].other.userId,C);
});
test('a life activity racing a hunt attack prevents the attack from committing',()=>{
  const s=game(),c=pair(s),h=hunt(s,c),write=s.nk.storageWrite;
  s.nk.storageWrite=w=>{
    if(w.some(x=>x.collection==='spirit_contracts'&&x.value.hunt?.actions.length)){
      s.nk.storageWrite=write;s.rpc('world_get',{preferredMapId:'m_lang_que'});
      s.rpc('life_claim_starter',{operationId:'life_race_starter'});
      s.rpc('activity_start',{operationId:'life_race_fishing',siteId:'new_fish_01',controlMode:'autonomous',cycles:1});
    }
    return write(w);
  };
  rejectsCode(()=>attack(s,c,h),9);assert.equal(s.rpc('contract_get').active.hunt.mobHp,120);
});
test('online map manifest is authenticated and comes from the current server map',()=>{
  const s=game();rejectsCode(()=>s.rpc('world_map_get',{},''),16);
  s.rpc('world_get',{preferredMapId:'m_truc_am'});const map=s.rpc('world_map_get');
  assert.equal(map.mapId,'m_truc_am');assert.equal(map.width,1536);assert.equal(map.speed,72);assert.equal(map.radius,8);
  rejectsCode(()=>s.rpc('world_map_get',{mapId:'forged'}),3);
});
test('both partners must explicitly join and a third player cannot access a hunt',()=>{
  const s=game(),c=pair(s),waiting=s.rpc('contract_hunt_start',{contractId:c.id}).contract.hunt;
  assert.equal(waiting.phase,'waiting');rejectsCode(()=>attack(s,c,waiting),9);rejectsCode(()=>s.rpc('contract_hunt_start',{contractId:c.id},C),7);
  const h=s.rpc('contract_hunt_start',{contractId:c.id},B).contract.hunt;assert.equal(h.phase,'active');
  assert.equal(s.rpc('contract_hunt_start',{contractId:c.id}).replayed,true);
});
test('shared monster HP, cooldowns and a cross-player combo are server-owned',()=>{
  const s=game(),c=pair(s),h=hunt(s,c),a=attack(s,c,h);assert.equal(a.damage,15);assert.equal(a.contract.hunt.mobHp,105);assert.equal(a.combo,false);
  assert.equal(s.rpc('contract_get',{},B).active.hunt.mobHp,105);
  assert.equal(attack(s,c,h).replayed,true);rejectsCode(()=>attack(s,c,h,A,'attack_too_fast'),8);
  const b=attack(s,c,h,B,'other_attack_01');assert.equal(b.combo,true);assert.equal(b.damage,19);
  rejectsCode(()=>s.rpc('contract_hunt_attack',{contractId:c.id,huntId:h.id,operationId:'forged_attack_01',skill:false,damage:999}),3);
  rejectsCode(()=>attack(s,c,h,A,'hunt_attack_0001',true),6);
});
test('victory records separate pending loot, each claim is durable and exactly once',()=>{
  const s=game(),c=pair(s),h=hunt(s,c),result=win(s,c,h);assert.equal(result.contract.bond,1);
  for(const id of [A,B]){
    assert.equal(s.rpc('contract_get',{},id).pendingReward.huntId,h.id);
    const claim=s.rpc('contract_hunt_claim',{},id);assert.equal(claim.profile.cultivationXp,0);
    // Loot carries the boar's linh năng: the cat absorbs it, the untaught human does not.
    assert.deepEqual(claim.receipt.granted.linhNang,[{vi:'tho',motes:8,turbid:6}]);assert.equal(claim.receipt.granted.inner.ignored,id===A);assert.equal(claim.profile.inventory.find(x=>x.itemId==='it_boar_hide').quantity,1);
    assert.equal(s.rpc('contract_hunt_claim',{},id).replayed,true);assert.equal(s.rpc('get_profile',{},id).realm,'mortal');
  }
});
test('offline non-contributors receive no loot and do not share account control',()=>{
  const s=game(),c=pair(s),h=hunt(s,c);for(let i=0;i<20;i++){
    clock(s,1000000+i*2000);if(attack(s,c,h,A,'single_attack_'+i,true).contract.hunt.phase==='victory')break;
  }
  assert.ok(s.rpc('contract_get').pendingReward);assert.equal(s.rpc('contract_get',{},B).pendingReward,null);
  rejectsCode(()=>s.rpc('contract_hunt_claim',{},B),5);
});
test('full bags keep pending loot claimable after the contract has ended',()=>{
  const s=game(),c=pair(s),h=hunt(s,c),p=s.state();p.inventory=Array.from({length:24},()=>({itemId:'it_water',quantity:99}));s.put(p);
  win(s,c,h);rejectsCode(()=>s.rpc('contract_hunt_claim'),8);assert.equal(s.state().cultivationXp,0);
  s.rpc('contract_release',{contractId:c.id},B);assert.ok(s.rpc('contract_get').pendingReward);
  s.rpc('inventory_discard',{operationId:'free_one_bag_slot',itemId:'it_water',quantity:99});
  assert.equal(s.rpc('contract_hunt_claim').profile.inventory.some(x=>x.itemId==='it_boar_hide'),true);
});
test('lost kill and claim acknowledgements cannot duplicate loot or bond',()=>{
  const s=game(),c=pair(s),h=hunt(s,c),write=s.nk.storageWrite;
  s.nk.storageWrite=w=>{const a=write(w);if(w.some(x=>x.collection==='spirit_hunt_rewards'))throw Error('lost acknowledgement');return a;};
  assert.equal(win(s,c,h).contract.bond,1);assert.equal(s.rpc('contract_hunt_claim').profile.inventory.filter(x=>x.itemId==='it_boar_hide').length,1);assert.equal(s.rpc('contract_hunt_claim').replayed,true);
});
test('leaving or expiry closes the current hunt while preserving the pact',()=>{
  const s=game(),c=pair(s),h=hunt(s,c);
  s.rpc('contract_hunt_leave',{contractId:c.id,huntId:h.id},B);rejectsCode(()=>attack(s,c,h),9);assert.equal(s.rpc('contract_get').active.status,'active');
  const next=hunt(s,c);assert.notEqual(next.id,h.id);clock(s,next.expiresAt);rejectsCode(()=>attack(s,c,next),9);
  assert.equal(s.rpc('contract_get').active.hunt.phase,'expired');
});
test('database failures do not leave one-sided membership',()=>{
  const s=game(),c=invite(s),write=s.nk.storageWrite;
  s.nk.storageWrite=()=>{throw Error('offline');};rejectsCode(()=>s.rpc('contract_respond',{contractId:c.id,accept:true},B),14);
  s.nk.storageWrite=write;assert.equal(s.rpc('contract_get').active,null);assert.equal(s.rpc('contract_get',{},B).active,null);
});
