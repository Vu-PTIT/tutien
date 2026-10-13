const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {setup,A,rejectsCode}=require('./helpers/assets.cjs');
const now=1800000000000;
function clock(s,time=now){s.scope.testNow=time;vm.runInContext('Date.now=function(){return testNow;}',s.scope);}
function at(s,siteId){
  const p=s.rpc('life_get').sites.find(p=>p.id===siteId),id={collection:'world_sessions',key:'main',userId:A};
  s.nk.storageWrite([{...id,value:{mapId:p.mapId,x:p.x,y:p.y,seq:1,updatedAt:s.scope.testNow},
    version:s.rows.get(`${A}/world_sessions/main`)?.version||'*',permissionRead:0,permissionWrite:0}]);
}
function life(){const s=setup();clock(s);s.rpc('world_get',{preferredMapId:'m_lang_que'});
  s.rpc('life_claim_starter',{operationId:'life_starter_0001'});return s;}
function work(s,siteId,cycles,op){
  at(s,siteId);const v=s.rpc('activity_start',{operationId:op,siteId,controlMode:'autonomous',cycles}).session;
  clock(s,v.expectedEndAt);
  return s.rpc('activity_claim',{operationId:op+'_claim',sessionId:v.sessionId,stateVersion:v.stateVersion});
}
const quantity=(s,id)=>s.state().inventory.filter(p=>p.itemId===id).reduce((a,p)=>a+p.quantity,0);
// Builds a synthetic settled session so the tables can be sampled in bulk.
function session(type,mapId,cycles,extra={}){
  return {type,mapId,completedCycles:cycles,activeAt:now,intervalMs:30000,rewardSeed:'seed_'+type+mapId,lootVersion:2,...extra};
}
function counts(bundle){return Object.fromEntries(bundle.items.map(p=>[p.itemId,p.quantity]));}

test('each site rolls only from its own table, and sessions started before v2 keep the legacy table',()=>{
  const s=setup(),state={};
  const lake=counts(s.scope.lifeReward(session('fishing','m_lang_que',120),s.nk,state));
  for(const id of Object.keys(lake))assert.ok(['it_fish_carp','it_fish_tilapia','it_lake_weed','it_lake_junk','it_fish_glimmer'].includes(id),id);
  assert.equal(Object.values(lake).reduce((a,b)=>a+b,0),120);
  const pit=counts(s.scope.lifeReward(session('mining','m_mo_lo_thien',120),s.nk,state));
  for(const id of Object.keys(pit))assert.ok(['it_iron','it_copper','it_glowstone'].includes(id),id);
  assert.equal((pit.it_iron||0)/2+(pit.it_copper||0)/2+(pit.it_glowstone||0),120);
  assert.equal(state.lifeLoot,undefined,'open pit does not touch the B1 pity counter');
  const legacy=counts(s.scope.lifeReward(session('fishing','m_lang_que',120,{lootVersion:undefined}),s.nk,state));
  assert.deepEqual(Object.keys(legacy).sort(),['it_fish_carp','it_fish_tilapia']);
});
test('rewards are deterministic per seed so replays and retries never change the loot',()=>{
  const s=setup();
  const a=s.scope.lifeReward(session('mining','m_mo_ngam',30),s.nk,{}),b=s.scope.lifeReward(session('mining','m_mo_ngam',30),s.nk,{});
  assert.deepEqual(a,b);
});
test('spirit sky raises Cá Lấp Lánh from 2% to 15% at Hồ Lặng',()=>{
  const s=setup(),window=s.scope.LIFE_SKY_WINDOW_MS;
  let sky=-1,plain=-1;
  for(let w=0;w<200&&(sky<0||plain<0);w++){const t=w*window+1;if(s.scope.lifeSpiritSky(s.nk,t)){if(sky<0)sky=t;}else if(plain<0)plain=t;}
  assert.ok(sky>=0&&plain>=0);
  const one=t=>{let n=0;for(let i=0;i<40;i++){const c=counts(s.scope.lifeReward(session('fishing','m_lang_que',50,{activeAt:t,intervalMs:1,rewardSeed:'sky'+i}),s.nk,{}));n+=c.it_fish_glimmer||0;}return n/2000;};
  const skyRate=one(sky),plainRate=one(plain);
  assert.ok(skyRate>0.09&&skyRate<0.22,'sky '+skyRate);assert.ok(plainRate<0.05,'plain '+plainRate);
  assert.equal(s.scope.lifeClockView(s.nk,sky).spiritSky,true);
});
test('the first Mảnh Tím is guaranteed by the 40th B1 cycle and later drops stay possible',()=>{
  const s=life(),p=s.state();p.lifeLoot={b1Cycles:38,shardFound:false};s.put(p);
  const r=work(s,'ng_iron_b1_01',2,'b1_pity_0001');
  assert.equal(quantity(s,'it_purple_shard'),1);assert.deepEqual(s.state().lifeLoot,{b1Cycles:40,shardFound:true});
  assert.ok(r.granted.items.some(i=>i.itemId==='it_purple_shard'));
  const later={lifeLoot:{b1Cycles:40,shardFound:true}};
  const bulk=counts(s.scope.lifeReward(session('mining','m_mo_ngam',120,{rewardSeed:'after'}),s.nk,later));
  assert.ok((bulk.it_purple_shard||0)<=6);assert.equal(later.lifeLoot.b1Cycles,160);
  const bad=s.state();bad.lifeLoot={b1Cycles:-1,shardFound:false};s.put(bad);
  rejectsCode(()=>work(s,'ng_iron_b1_02',1,'b1_bad_state_01'),9);
});
test('harvest keeps four herbs in total, sometimes Dạ Quang, glows more at night, and may return a seed',()=>{
  const s=setup(),crop=s.scope.gameContent().crops.crop_cam_lo,day=1,night=s.scope.LIFE_DAY_MS*0.9;
  assert.equal(s.scope.lifeIsNight(day),false);assert.equal(s.scope.lifeIsNight(night),true);
  let glowDay=0,glowNight=0,seeds=0;
  for(let i=0;i<400;i++){
    const d=counts(s.scope.lifeHarvestYield(s.nk,crop,'plot'+i,day)),n=counts(s.scope.lifeHarvestYield(s.nk,crop,'plot'+i,night));
    assert.equal((d.it_herb_cam_lo||0)+(d.it_herb_cam_lo_glow||0),4);
    glowDay+=d.it_herb_cam_lo_glow||0;glowNight+=n.it_herb_cam_lo_glow||0;seeds+=d.it_seed_cam_lo||0;
  }
  assert.ok(glowDay>30&&glowDay<95,'day '+glowDay);assert.ok(glowNight>85&&glowNight<160,'night '+glowNight);
  assert.ok(seeds>65&&seeds<140,'seeds '+seeds);
});
test('planting stores a server loot seed and life_get exposes the server clock',()=>{
  const s=life();at(s,'new_plot_01');
  s.rpc('garden_action',{operationId:'plant_seeded_0001',action:'plant',plotId:0,cropId:'crop_cam_lo'});
  const plot=s.state().gardenPlots[0];assert.match(plot.lootSeed,/^[0-9a-f-]{36}$/);
  const c=s.rpc('life_get').clock;assert.equal(c.dayMs,7200000);assert.ok(['sang_som','trua','chieu_vang','toi','khuya'].includes(c.phase));
  assert.ok(c.phaseEndsAt>now&&c.skyEndsAt>now);
});
test('Hấp turns Linh items into clean essence of their vị and rejects plain items or unlearned characters',()=>{
  const s=life(),p=s.state();p.inventory.push({itemId:'it_glowstone',quantity:3},{itemId:'it_fish_carp',quantity:1});s.put(p);
  rejectsCode(()=>s.rpc('inner_world_absorb_item',{operationId:'absorb_unlearned_1',itemId:'it_glowstone'}),9);
  const q=s.state();q.innerWorld={v:1,learned:true,teacher:'native',sky:0,pending:{},grown:0,shape:0,lastLeap:null,cells:[30,30,0,1,0]};s.put(q);
  rejectsCode(()=>s.rpc('inner_world_absorb_item',{operationId:'absorb_plain_0001',itemId:'it_fish_carp'}),3);
  rejectsCode(()=>s.rpc('inner_world_absorb_item',{operationId:'absorb_many_0001',itemId:'it_glowstone',quantity:21}),3);
  rejectsCode(()=>s.rpc('inner_world_absorb_item',{operationId:'absorb_short_0001',itemId:'it_glowstone',quantity:4}),9);
  const r=s.rpc('inner_world_absorb_item',{operationId:'absorb_stone_0001',itemId:'it_glowstone',quantity:2});
  assert.equal(quantity(s,'it_glowstone'),1);assert.equal(r.innerWorld.learned,true);
  assert.equal(s.rpc('inner_world_absorb_item',{operationId:'absorb_stone_0001',itemId:'it_glowstone',quantity:2}).replayed,true);
  assert.equal(quantity(s,'it_glowstone'),1);
  rejectsCode(()=>s.rpc('inner_world_absorb_item',{operationId:'absorb_purple_001',itemId:'it_purple_shard'}),3);
});
