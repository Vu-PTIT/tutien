const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {setup,clone,A,rejectsCode}=require('./helpers/assets.cjs');
const B='22222222-2222-4222-8222-222222222222';
const C='33333333-3333-4333-8333-333333333333';
const now=1800000000000;
function clock(s,time){s.scope.testNow=time;vm.runInContext('Date.now=function(){return testNow;}',s.scope);}
function place(s,mapId,x,y,actor=A){
  const id={collection:'world_sessions',key:'main',userId:actor};
  s.nk.storageWrite([{...id,value:{mapId,x,y,seq:1,updatedAt:s.scope.testNow},version:s.rows.get(`${actor}/world_sessions/main`)?.version||'*',permissionRead:0,permissionWrite:0}]);
}
function atSite(s,siteId,actor=A){const p=s.rpc('life_get',{},actor).sites.find(p=>p.id===siteId);place(s,p.mapId,p.x,p.y,actor);return p;}
function player(form='human',actor=A,s=setup()){
  clock(s,now);
  s.nk.usersGetId=ids=>ids.filter(id=>[A,B,C].includes(id)).map(userId=>({userId,username:'player_'+userId[0]}));
  s.nk.friendsList=()=>({friends:[]});
  s.rpc('world_get',{preferredMapId:'m_lang_que'},actor);
  s.rpc('character_select_form',{operationId:'choose_form_'+actor[0],kind:form==='spirit'?'spirit_beast':'human',speciesId:form==='spirit'?'cat':'human'},actor);
  return s;
}
function inner(s,actor=A){return s.rpc('inner_world_get',{},actor).innerWorld;}
function meditate(s,siteId,cycles,op,actor=A){
  atSite(s,siteId,actor);
  const started=s.rpc('activity_start',{operationId:op,siteId,controlMode:'autonomous',cycles},actor).session;
  clock(s,started.expectedEndAt);
  return s.rpc('activity_claim',{operationId:op+'_claim',sessionId:started.sessionId,stateVersion:started.stateVersion},actor);
}
function putWorld(s,cells,extra={}){
  const p=s.state();
  p.innerWorld={v:1,learned:true,teacher:'native',sky:0,pending:{},grown:0,shape:0,lastLeap:null,...extra,
    cells:cells.flatMap(([x,y,kind,h=1,t=0])=>[x+30,y+30,['an','tho','thuy','thach','moc'].indexOf(kind),h,t])};
  s.put(p);
}

test('a human starts without Hấp Linh and cannot meditate or keep linh năng',()=>{
  const s=player('human');
  const w=inner(s);assert.equal(w.learned,false);assert.equal(w.cells.length,0);assert.equal(w.shape.id,'hat');
  atSite(s,'lq_med_ho');
  rejectsCode(()=>s.rpc('activity_start',{operationId:'meditate_0001',siteId:'lq_med_ho'}),9);
  s.rpc('life_claim_starter',{operationId:'life_starter_0001'});
  atSite(s,'new_fish_01');
  const fish=s.rpc('activity_start',{operationId:'fish_untaught_01',siteId:'new_fish_01',controlMode:'autonomous',cycles:8}).session;
  clock(s,fish.expectedEndAt);
  const claim=s.rpc('activity_claim',{operationId:'fish_untaught_claim',sessionId:fish.sessionId,stateVersion:fish.stateVersion});
  assert.equal(claim.granted.inner.ignored,true);assert.equal(inner(s).cells.length,0);
  rejectsCode(()=>s.rpc('inner_world_get',{shape:3}),3);
  rejectsCode(()=>s.rpc('inner_world_get',{},''),16);
});

test('a spirit beast knows Hấp Linh natively and starts from one Ẩn seed',()=>{
  const s=player('spirit');const w=inner(s);
  assert.equal(w.learned,true);assert.equal(w.teacher,'native');
  assert.deepEqual(w.cells,[{x:0,y:0,kind:'an',height:1,turbid:false}]);
  assert.equal(w.next.id,'dao');assert.equal(w.next.met,false);
});

test('Bé Mơ at the shrine teaches a human once; a spirit beast is only greeted',()=>{
  const s=player('human');
  const point=s.scope.WORLD_MAPS.m_lang_que.points.find(p=>p.id==='lq.npc.be_mo');
  place(s,'m_lang_que',point.x,point.y);
  const taught=s.rpc('world_interact',{entityId:'lq.npc.be_mo'});
  assert.equal(taught.innerWorld.learned,true);assert.equal(taught.innerWorld.teacher,'npc:lq.npc.be_mo');
  assert.equal(taught.innerWorld.cells.length,1);
  const again=s.rpc('world_interact',{entityId:'lq.npc.be_mo'});
  assert.equal(again.innerWorld.cells.length,1);assert.match(again.message,/thở chậm/);
  const spirit=player('spirit',B,s);place(spirit,'m_lang_que',point.x,point.y,B);
  assert.match(s.rpc('world_interact',{entityId:'lq.npc.be_mo'},B).message,/từ bé/);
  place(s,'m_lang_que',point.x+400,point.y);rejectsCode(()=>s.rpc('world_interact',{entityId:'lq.npc.be_mo'}),9);
});

test('a human learns from a spirit beast contract partner, never from another human',()=>{
  const s=player('human');player('spirit',B,s);player('human',C,s);
  const offer=s.rpc('contract_invite',{operationId:'invite_spirit_01',userId:B}).contract;
  const contract=s.rpc('contract_respond',{contractId:offer.id,accept:true},B).contract;
  const learned=s.rpc('inner_world_learn',{operationId:'learn_from_b_01',contractId:contract.id});
  assert.equal(learned.innerWorld.teacher,'contract:'+B);assert.equal(learned.innerWorld.cells.length,1);
  assert.equal(s.rpc('inner_world_learn',{operationId:'learn_from_b_01',contractId:contract.id}).replayed,true);
  rejectsCode(()=>s.rpc('inner_world_learn',{operationId:'learn_from_b_02',contractId:contract.id}),9);
  rejectsCode(()=>s.rpc('inner_world_learn',{operationId:'learn_from_b_03',contractId:contract.id},C),7);
  rejectsCode(()=>s.rpc('inner_world_learn',{operationId:'learn_from_b_04',contractId:contract.id,cells:[]}),3);
  s.rpc('contract_release',{contractId:contract.id});
  const humans=s.rpc('contract_respond',{contractId:s.rpc('contract_invite',{operationId:'invite_human_02',userId:A},C).contract.id,accept:true});
  rejectsCode(()=>s.rpc('inner_world_learn',{operationId:'learn_from_c_01',contractId:humans.contract.id},C),9);
});

test('Hấp Linh grows clean cells of the site vị deterministically and replays without growing twice',()=>{
  const run=()=>{const s=player('spirit');return [s,meditate(s,'lq_med_ho',20,'meditate_lake_01')];};
  const [s,claim]=run();
  assert.equal(claim.granted.linhNang[0].vi,'thuy');assert.equal(claim.granted.linhNang[0].motes,60);
  const w=inner(s);
  assert.equal(w.cells.length,16);assert.equal(w.cells.filter(c=>c.kind==='thuy'&&!c.turbid).length,15);
  assert.equal(w.formations.find(f=>f.id==='suoi').active,true);
  const replay=s.rpc('activity_claim',{operationId:'meditate_lake_01_claim',sessionId:claim.session.sessionId,stateVersion:claim.session.stateVersion-1});
  assert.equal(replay.replayed,true);assert.equal(inner(s).cells.length,16);
  assert.deepEqual(inner(run()[0]).cells,w.cells,'same character + growth counter gives the same world');
  const ids=new Set(w.cells.map(c=>c.x+','+c.y));assert.equal(ids.size,16,'cells never overlap');
});

test('enough Thổ and Thủy makes the leap from Hạt to Đảo',()=>{
  const s=player('spirit');
  meditate(s,'lq_med_ho',14,'meditate_lake_02');
  assert.equal(inner(s).shape.id,'hat');
  const claim=meditate(s,'lq_med_mieu',14,'meditate_shrine_1');
  assert.deepEqual(claim.granted.inner.leaps,['dao']);
  const w=inner(s);assert.equal(w.shape.id,'dao');assert.equal(w.lastLeap.shape,1);assert.ok(w.cells.length>=20);
});

test('field kills give plenty of turbid linh năng; Hấp Linh purifies it',()=>{
  const s=player('spirit');
  place(s,'m_truc_am',1136,560);s.rpc('world_get');
  let hit;for(let i=0;i<5&&!hit?.killed;i++){clock(s,now+i*2000);hit=s.rpc('world_attack',{targetId:'ta.mob.son_tru.01'});}
  assert.equal(hit.killed,true);
  assert.deepEqual(hit.receipt.granted.linhNang,[{vi:'tho',motes:8,turbid:6}]);
  let w=inner(s);assert.equal(w.summary.turbid,1);assert.deepEqual(w.pending,{tho:2,tho_d:2});
  s.rpc('world_travel',{mapId:'m_lang_que'});
  const claim=meditate(s,'lq_med_mieu',1,'meditate_purify_1');
  assert.equal(claim.granted.purified,1);
  w=inner(s);assert.equal(w.summary.turbid,0);assert.equal(w.pending.tho,1);
});

test('fishing and harvests settle a trickle of their own vị',()=>{
  const s=player('spirit');s.rpc('life_claim_starter',{operationId:'life_starter_0001'});
  atSite(s,'new_fish_01');
  const fish=s.rpc('activity_start',{operationId:'fish_essence_001',siteId:'new_fish_01',controlMode:'autonomous',cycles:16}).session;
  clock(s,fish.expectedEndAt);
  const caught=s.rpc('activity_claim',{operationId:'fish_essence_claim',sessionId:fish.sessionId,stateVersion:fish.stateVersion});
  assert.deepEqual(caught.granted.linhNang,[{vi:'thuy',motes:4,turbid:0}]);assert.equal(inner(s).summary.clean.thuy,1);
  atSite(s,'new_plot_01');
  s.rpc('garden_action',{operationId:'plant_essence_01',action:'plant',plotId:0,cropId:'crop_cam_lo'});
  clock(s,s.scope.testNow+1200000);
  const harvest=s.rpc('garden_action',{operationId:'harvest_essence_1',action:'harvest',plotId:0});
  assert.deepEqual(harvest.granted.linhNang.map(e=>e.vi),['tho','moc']);assert.deepEqual(inner(s).pending,{tho:2,moc:1});
});

test('arranging swaps or moves cells but never splits the world',()=>{
  const s=player('spirit');
  putWorld(s,[[0,0,'an'],[1,0,'thuy'],[2,0,'thuy'],[3,0,'tho']]);
  const swapped=s.rpc('inner_world_arrange',{operationId:'arrange_swap_01',from:{x:3,y:0},to:{x:0,y:0}}).innerWorld;
  assert.equal(swapped.cells.find(c=>c.x===0&&c.y===0).kind,'tho');
  const moved=s.rpc('inner_world_arrange',{operationId:'arrange_move_01',from:{x:3,y:0},to:{x:2,y:1}}).innerWorld;
  assert.equal(moved.cells.find(c=>c.x===2&&c.y===1).kind,'an');
  rejectsCode(()=>s.rpc('inner_world_arrange',{operationId:'arrange_split_1',from:{x:1,y:0},to:{x:1,y:-1}}),9);
  rejectsCode(()=>s.rpc('inner_world_arrange',{operationId:'arrange_far_001',from:{x:0,y:0},to:{x:9,y:9}}),9);
  rejectsCode(()=>s.rpc('inner_world_arrange',{operationId:'arrange_out_001',from:{x:0,y:0},to:{x:31,y:0}}),3);
  rejectsCode(()=>s.rpc('inner_world_arrange',{operationId:'arrange_empty_1',from:{x:5,y:5},to:{x:0,y:1}}),9);
  assert.equal(s.rpc('inner_world_arrange',{operationId:'arrange_swap_01',from:{x:3,y:0},to:{x:0,y:0}}).replayed,true);
  const human=player('human',B,s);
  rejectsCode(()=>human.rpc('inner_world_arrange',{operationId:'arrange_human_1',from:{x:0,y:0},to:{x:1,y:0}},B),9);
});

test('mountains in the Nội Giới strengthen field attacks',()=>{
  const s=player('spirit');
  putWorld(s,[[0,0,'an'],[1,0,'thach',4],[2,0,'thach',4],[3,0,'thach',4],[4,0,'thach',4]]);
  const w=inner(s);
  assert.equal(w.formations.find(f=>f.id==='day_nui').active,true);
  assert.equal(w.stats.attackBonus,6);assert.equal(w.stats.defenseBonus,11);
  place(s,'m_truc_am',1136,560);s.rpc('world_get');
  assert.equal(s.rpc('world_attack',{targetId:'ta.mob.son_tru.01'}).damage,Math.floor(22*100/105));
});

test('a lopsided world does not leap even when it is large enough',()=>{
  const s=player('spirit');
  const cells=[[0,0,'an'],[0,1,'tho']];for(let x=1;x<=23;x++)cells.push([x,0,'thuy']);
  putWorld(s,cells);
  let w=inner(s);assert.equal(w.summary.lech,true);assert.equal(w.next.met,false);
  const balanced=[[0,0,'an']];for(let x=1;x<=12;x++)balanced.push([x,0,'thuy'],[x,1,'tho']);
  putWorld(s,balanced);
  meditate(s,'lq_med_mieu',1,'meditate_balanced');
  w=inner(s);assert.equal(w.summary.lech,false);assert.equal(w.shape.id,'dao');
});

test('malformed saved worlds are kept for review and released Luyện Khí progress is migrated',()=>{
  const s=player('spirit');const bad=s.state();bad.innerWorld={v:1,learned:true,cells:[0,0,9,1,0]};s.put(bad);
  rejectsCode(()=>s.rpc('get_profile'),9);assert.deepEqual(s.state(),bad);
  const legacy=setup();clock(legacy,now);legacy.rpc('get_profile');const p=legacy.state();p.realm='luyen_khi';p.realmStage=2;legacy.put(p);
  const w=inner(legacy);assert.equal(w.learned,true);assert.equal(w.teacher,'legacy');assert.deepEqual(w.pending,{tho:40});
  const stored=legacy.state();assert.equal(stored.innerWorld,undefined,'reading never writes a world');
});
