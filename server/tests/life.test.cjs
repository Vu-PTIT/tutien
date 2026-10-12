const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {setup,clone,A,rejectsCode} = require('./helpers/assets.cjs');
const B = '22222222-2222-4222-8222-222222222222';
const now = 1800000000000;
function clock(s,time=now) { s.scope.testNow=time;vm.runInContext('Date.now=function(){return testNow;}',s.scope); }
function at(s,siteId='new_fish_01',actor=A) {
  const p=s.rpc('life_get',{},actor).sites.find(p=>p.id===siteId);
  const id={collection:'world_sessions',key:'main',userId:actor};
  s.nk.storageWrite([{...id,value:{mapId:p.mapId,x:p.x,y:p.y,seq:1,updatedAt:s.scope.testNow},
    version:s.rows.get(`${actor}/world_sessions/main`)?.version||'*',permissionRead:0,permissionWrite:0}]);return p;
}
function life(actor=A) { const s=setup();clock(s);s.rpc('world_get',{preferredMapId:'m_lang_que'},actor);
  s.rpc('life_claim_starter',{operationId:'life_starter_0001'},actor);return s; }
function start(s,extra={},actor=A) { return s.rpc('activity_start',{operationId:'activity_start_0001',siteId:'new_fish_01',...extra},actor); }
function command(s,action,session,op='activity_command_0001',extra={}) {
  return s.rpc('activity_'+action,{operationId:op,sessionId:session.sessionId,stateVersion:session.stateVersion,...extra});
}
const quantity=(s,id)=>s.state().inventory.filter(p=>p.itemId===id).reduce((a,p)=>a+p.quantity,0);
test('life RPCs require authentication and reject forged times, yields, owners and unexpected fields',()=>{
  const s=setup();
  for(const name of ['life_get','garden_get','activity_get','life_claim_starter','activity_start','activity_claim','activity_cancel','activity_control']) rejectsCode(()=>s.rpc(name,{},''),16);
  for(const extra of [{userId:B},{startedAt:now-99999},{yield:999},{items:[]},{mapId:'m_co_tinh'}])
    rejectsCode(()=>s.rpc('activity_start',{operationId:'forged_request_0001',siteId:'new_fish_01',...extra}),3);
  for(const name of ['life_get','garden_get','activity_get'])rejectsCode(()=>s.rpc(name,{time:now}),3);
  for(const id of ['bad',null,'a'.repeat(81)])rejectsCode(()=>s.rpc('life_claim_starter',{operationId:id}),3);
  assert.equal(s.rows.size,0);
});
test('map manifest matches current village anchors and safe B1/open pit work points',()=>{
  const s=setup(),v=s.rpc('life_get');
  assert.equal(v.sites.length,20);assert.equal(v.sites.filter(p=>p.type==='gardening').length,12);
  for(const p of v.sites)assert.equal(s.scope.worldWalkable(s.scope.WORLD_MAPS[p.mapId],[p.x,p.y]),true,p.id);
  // Freeze the village access-anchor contract used by the deleted client layout.
  for(let i=0;i<4;i++){const site=v.sites.find(s=>s.id==='new_fish_0'+(i+1));assert.deepEqual([site.x,site.y],[(169+i*6)*32,150*32]);}
  for(let i=0;i<12;i++){const site=v.sites.find(s=>s.plotId===i);assert.deepEqual([site.x,site.y],[(65+(i%4)*6)*32,(166+Math.floor(i/4)*5)*32]);}
  assert.equal(s.scope.worldMapReachable('m_mo_ngam'),true);assert.equal(s.scope.worldMapReachable('m_tram_thien_mach'),false);
  assert.equal(s.scope.worldWalkable(s.scope.WORLD_MAPS.m_lang_que,[177*32,165*32]),false,'lake is blocked');
  assert.equal(s.scope.worldWalkable(s.scope.WORLD_MAPS.m_lang_que,[116*32,151*32]),true,'garden bridge is walkable');
});
test('life starter is separate from combat starter, grants tools and supplies exactly once, and tools do not stack',()=>{
  const s=life();assert.equal(quantity(s,'it_fishing_rod'),1);assert.equal(quantity(s,'it_pickaxe'),1);assert.equal(quantity(s,'it_bait'),30);
  assert.equal(s.rpc('life_get').starterClaimed,true);
  assert.equal(s.rpc('life_claim_starter',{operationId:'life_starter_0001'}).replayed,true);
  rejectsCode(()=>s.rpc('life_claim_starter',{operationId:'life_starter_again'}),6);
  s.rpc('inventory_claim_starter',{operationId:'combat_starter_001'});assert.equal(quantity(s,'it_fishing_rod'),1);
  for(const id of ['it_fishing_rod','it_pickaxe'])assert.equal(s.rpc('inventory_get').catalog.find(p=>p.id===id).stackMax,1);
});
test('12 plots preserve the released six-plot save and compute ready state from server time',()=>{
  const s=life(),p=s.state();p.gardenPlots=Array.from({length:6},(_,i)=>({plotId:i,state:'empty',version:7}));s.put(p);at(s,'new_plot_12');
  const planted=s.rpc('garden_action',{operationId:'plant_last_plot_01',action:'plant',plotId:11,cropId:'crop_tinh_tam'});
  assert.equal(planted.profile.gardenPlots.length,12);assert.equal(planted.profile.gardenPlots[0].version,7);
  assert.equal(quantity(s,'it_seed_tinh_tam'),2);assert.equal(quantity(s,'it_water'),11);
  rejectsCode(()=>s.rpc('garden_action',{operationId:'harvest_early_001',action:'harvest',plotId:11}),9);
  clock(s,now+2700000);assert.equal(s.rpc('garden_get').plots[11].state,'ready');
  const harvested=s.rpc('garden_action',{operationId:'harvest_last_001',action:'harvest',plotId:11});assert.equal(quantity(s,'it_herb_tinh_tam'),4);
  assert.equal(harvested.garden.plots[11].state,'empty');
  s.rpc('world_travel',{mapId:'m_mo_lo_thien'});
  assert.equal(s.rpc('garden_action',{operationId:'harvest_last_001',action:'harvest',plotId:11}).replayed,true);
  rejectsCode(()=>s.rpc('garden_action',{operationId:'invalid_plot_0001',action:'plant',plotId:12,cropId:'crop_cam_lo'}),3);
});
test('gardening validates crop state and rolls back seed removal when water is missing',()=>{
  const s=life();at(s,'new_plot_01');const p=s.state();p.inventory=p.inventory.filter(p=>p.itemId!=='it_water');s.put(p);const before=s.state();
  rejectsCode(()=>s.rpc('garden_action',{operationId:'no_water_0001',action:'plant',plotId:0,cropId:'crop_cam_lo'}),9);assert.deepEqual(s.state(),before);
  rejectsCode(()=>s.rpc('garden_action',{operationId:'bad_crop_0001',action:'plant',plotId:0,cropId:'__proto__'}),3);
  p.gardenPlots=Array.from({length:12},(_,i)=>({plotId:i,state:'empty',version:0}));p.gardenPlots[0]={plotId:0,state:'growing',version:1,cropId:'crop_cam_lo',readyAt:null};s.put(p);
  rejectsCode(()=>s.rpc('garden_get'),9);
});
test('direct fishing requires the map, access point, tool and bait; one cast has no minigame',()=>{
  const s=life();rejectsCode(()=>start(s),9);at(s);
  const before=s.state();const p=s.state();p.inventory=p.inventory.filter(p=>p.itemId!=='it_fishing_rod');s.put(p);rejectsCode(()=>start(s),9);s.put(before);
  rejectsCode(()=>start(s,{cycles:2}),3);rejectsCode(()=>start(s,{controlMode:'autonomous',cycles:121}),3);
  const result=start(s);assert.equal(result.session.state,'active');assert.equal(quantity(s,'it_bait'),29);
  assert.equal(start(s).replayed,true);assert.equal(quantity(s,'it_bait'),29);
  rejectsCode(()=>start(s,{operationId:'another_start_0001'}),9);
  rejectsCode(()=>command(s,'claim',result.session),9);
  clock(s,result.session.expectedEndAt);
  const claim=command(s,'claim',result.session);assert.equal(claim.granted.items.reduce((n,p)=>n+p.quantity,0),1);
  assert.equal(quantity(s,'it_fish_carp')+quantity(s,'it_fish_tilapia'),1);assert.equal(s.state().cultivationXp,0);
  assert.equal(command(s,'claim',result.session).replayed,true);
  rejectsCode(()=>command(s,'claim',claim.session,'different_claim_0001'),9);
});
test('mining uses its own tool and timer and grants two server-picked ore units per cycle',()=>{
  const s=life();at(s,'ml_iron_01');const v=start(s,{siteId:'ml_iron_01',controlMode:'autonomous',cycles:3});
  assert.equal(v.session.intervalMs,45000);assert.equal(quantity(s,'it_bait'),30);
  clock(s,v.session.expectedEndAt);const r=command(s,'claim',v.session);
  assert.equal(r.granted.items.reduce((n,p)=>n+p.quantity,0),6);assert.equal(quantity(s,'it_iron')+quantity(s,'it_copper'),6);
  assert.equal(s.state().cultivationXp,0);
});
test('autonomous fishing routes around blockers and reconnect reconstructs the same avatar and progress',()=>{
  const s=life(),v=start(s,{controlMode:'autonomous',cycles:3});assert.equal(v.session.state,'travelling');
  const stored=s.state().activitySession;
  for(let i=1;i<stored.route.length;i++){const a=stored.route[i-1],b=stored.route[i];if(a.mapId===b.mapId)
    assert.equal(s.scope.worldPathWalkable(s.scope.WORLD_MAPS[a.mapId],[a.x,a.y],[b.x,b.y]),true);}
  const r=setup();for(const [k,row] of s.rows)r.rows.set(k,clone(row));clock(r,v.session.activeAt+60000);
  const current=r.rpc('activity_get').session;assert.equal(current.sessionId,v.session.sessionId);assert.equal(current.avatarId,A);assert.equal(current.completedCycles,2);
  const world=r.rpc('world_get');assert.equal(world.activity.sessionId,v.session.sessionId);assert.deepEqual([world.x,world.y],[169*32,150*32]);
  clock(r,v.session.expectedEndAt);const reward=command(r,'claim',current);assert.equal(reward.granted.items.reduce((a,p)=>a+p.quantity,0),3);
});
test('cross-map assignment follows open gates to B1 and does not unlock boss or B2 routes',()=>{
  const s=life(),v=start(s,{siteId:'ng_iron_b1_01',controlMode:'autonomous',cycles:1});
  const route=s.state().activitySession.route;assert.deepEqual([...new Set(route.map(p=>p.mapId))],['m_lang_que','m_vanh_dai_tay','m_mo_lo_thien','m_mo_ngam']);
  for(let i=1;i<route.length;i++)if(route[i-1].mapId!==route[i].mapId){const a=route[i-1],b=route[i];
    assert.ok(s.scope.WORLD_MAPS[a.mapId].points.some(p=>p.kind==='gate'&&p.destination===b.mapId&&p.arrivalX===b.x&&p.arrivalY===b.y));}
  clock(s,v.session.expectedEndAt);command(s,'claim',v.session);assert.equal(s.rpc('world_get').mapId,'m_mo_ngam');
});
test('slot lease blocks another actor and is released on cancel or server expiry without stealing a replacement lease',()=>{
  const s=life();s.rpc('world_get',{preferredMapId:'m_lang_que'},B);s.rpc('life_claim_starter',{operationId:'life_starter_0001'},B);at(s,'new_fish_01');at(s,'new_fish_01',B);
  const a=start(s);rejectsCode(()=>start(s,{},B),8);
  clock(s,a.session.expectedEndAt);const b=start(s,{},B);assert.ok(b.session.sessionId!==a.session.sessionId);
  command(s,'claim',a.session);
  const slot=[...s.rows.values()].find(p=>p.collection==='life_slots');assert.equal(slot.value.sessionId,b.session.sessionId);
});
test('cancellation keeps full-cycle results, returns unused bait, and freezes the route at its last position',()=>{
  const s=life();at(s);const v=start(s,{controlMode:'autonomous',cycles:4});clock(s,v.session.activeAt+65000);
  const cancelled=command(s,'cancel',v.session);assert.equal(cancelled.session.state,'cancelled');assert.equal(cancelled.session.completedCycles,2);
  const reward=command(s,'claim',cancelled.session,'claim_cancelled_0001');assert.equal(quantity(s,'it_bait'),28);
  assert.equal(reward.granted.items.filter(p=>p.itemId!=='it_bait').reduce((a,p)=>a+p.quantity,0),2);
  assert.equal(command(s,'claim',cancelled.session,'claim_cancelled_0001').replayed,true);
  s.rpc('world_travel',{mapId:'m_lang_que'});const next=start(s,{operationId:'route_cancel_0001',controlMode:'autonomous'});clock(s,next.session.startedAt+1000);
  const stop=command(s,'cancel',next.session,'route_stop_0001');const position=stop.session.position;clock(s,next.session.expectedEndAt+10000);
  assert.deepEqual(s.rpc('activity_get').session.position,position);
});
test('control changes keep the session ID and accrued cycles, reject stale versions and guard moving during an activity',()=>{
  const s=life();at(s);const v=start(s,{controlMode:'autonomous',cycles:3});clock(s,v.session.activeAt+30000);
  const direct=command(s,'control',v.session,'control_direct_0001',{controlMode:'direct'});assert.equal(direct.session.sessionId,v.session.sessionId);assert.equal(direct.session.completedCycles,1);
  rejectsCode(()=>command(s,'control',v.session,'stale_control_0001',{controlMode:'autonomous'}),10);
  const auto=command(s,'control',direct.session,'control_auto_0001',{controlMode:'autonomous'});assert.equal(auto.session.stateVersion,3);
  rejectsCode(()=>s.rpc('world_travel',{mapId:'m_mo_lo_thien'}),9);
  rejectsCode(()=>s.rpc('world_move',{x:169*32,y:150*32,seq:2}),9);
  rejectsCode(()=>s.rpc('activity_claim',{operationId:'foreign_claim_0001',sessionId:auto.session.sessionId,stateVersion:3},B),5);
});
test('garden activity consumes once, grows offline, and settles the same plot only once',()=>{
  const s=life();at(s,'new_plot_01');const v=start(s,{siteId:'new_plot_01',cropId:'crop_cam_lo'});assert.equal(quantity(s,'it_seed_cam_lo'),2);
  clock(s,v.session.expectedEndAt);assert.equal(s.rpc('garden_get').plots[0].state,'ready');
  rejectsCode(()=>s.rpc('garden_action',{operationId:'duplicate_harvest_01',action:'harvest',plotId:0}),9);
  const result=command(s,'claim',v.session);assert.equal(result.garden.plots[0].state,'empty');assert.equal(quantity(s,'it_herb_cam_lo'),4);
  command(s,'claim',v.session);assert.equal(quantity(s,'it_herb_cam_lo'),4);
});
test('cancelling while travelling to plant returns seeds/water; cancelling after planting preserves the growing crop',()=>{
  const s=life(),v=start(s,{siteId:'new_plot_01',cropId:'crop_cam_lo',controlMode:'autonomous'});
  assert.ok(v.session.activeAt>now);const cancelled=command(s,'cancel',v.session);assert.equal(cancelled.garden.plots[0].state,'empty');
  command(s,'claim',cancelled.session,'refund_seed_0001');assert.equal(quantity(s,'it_seed_cam_lo'),3);assert.equal(quantity(s,'it_water'),12);
  at(s,'new_plot_01');const next=start(s,{operationId:'next_garden_0001',siteId:'new_plot_01',cropId:'crop_cam_lo'});
  clock(s,next.session.activeAt+10000);const stop=command(s,'cancel',next.session,'cancel_crop_0001');command(s,'claim',stop.session,'claim_crop_cancel_01');
  assert.equal(s.rpc('garden_get').plots[0].state,'growing');clock(s,next.session.expectedEndAt);
  s.rpc('garden_action',{operationId:'manual_harvest_0001',action:'harvest',plotId:0});assert.equal(quantity(s,'it_herb_cam_lo'),4);
});
test('full inventory leaves rewards pending without partial settlement, and the same claim succeeds after making room',()=>{
  const s=life();at(s);const v=start(s);const p=s.state();p.inventory=[{itemId:'it_fishing_rod',quantity:1},...Array.from({length:23},()=>({itemId:'it_water',quantity:99}))];s.put(p);
  clock(s,v.session.expectedEndAt);const before=s.state();rejectsCode(()=>command(s,'claim',v.session),8);assert.deepEqual(s.state(),before);
  assert.equal(s.rpc('activity_get').session.settlement,'pending');
  s.rpc('inventory_discard',{operationId:'make_room_0001',itemId:'it_water',quantity:99});
  const claimed=command(s,'claim',v.session);assert.equal(claimed.session.settlement,'settled');assert.equal(quantity(s,'it_fish_carp')+quantity(s,'it_fish_tilapia'),1);
});
test('atomic commands recover lost acknowledgements, reject changed replays, and survive concurrent starter/claim writes',()=>{
  const s=life();at(s);const write=s.nk.storageWrite;s.nk.storageWrite=w=>{write(w);throw Error('lost acknowledgement');};
  const v=start(s);assert.equal(v.replayed,true);assert.equal(quantity(s,'it_bait'),29);
  s.nk.storageWrite=write;rejectsCode(()=>start(s,{siteId:'new_fish_02'}),6);clock(s,v.session.expectedEndAt);
  s.nk.storageWrite=w=>{s.nk.storageWrite=write;s.rpc('inventory_claim_starter',{operationId:'concurrent_starter_01'});return write(w);};
  const r=command(s,'claim',v.session);assert.equal(r.session.settlement,'settled');assert.equal(s.state().spiritStones,12);
  assert.equal(quantity(s,'it_fish_carp')+quantity(s,'it_fish_tilapia'),1);
});
test('competing starts cannot create two sessions or reserve the same supplies twice',()=>{
  const s=life();at(s);const write=s.nk.storageWrite;
  s.nk.storageWrite=w=>{s.nk.storageWrite=write;start(s,{operationId:'competing_start_01'});return write(w);};
  rejectsCode(()=>start(s),9);assert.equal(quantity(s,'it_bait'),29);assert.equal([...s.rows.values()].filter(p=>p.collection==='life_slots').length,1);
});
test('a movement that races activity_start cannot move its avatar or bypass the activity lease',()=>{
  const s=life();at(s);clock(s,now+1000);const write=s.nk.storageWrite;
  s.nk.storageWrite=w=>{s.nk.storageWrite=write;start(s);return write(w);};
  rejectsCode(()=>s.rpc('world_move',{x:169*32+1,y:150*32,seq:2}),9);
  assert.equal(s.rpc('world_get').x,169*32);assert.equal(s.state().activitySession.settlement,'pending');
});
test('failed storage never consumes supplies or creates a partial lease and lost claim acknowledgement never duplicates loot',()=>{
  const s=life();at(s);const before=s.state(),count=s.rows.size,write=s.nk.storageWrite;
  s.nk.storageWrite=()=>{throw Error('unavailable');};rejectsCode(()=>start(s),14);
  assert.deepEqual(s.state(),before);assert.equal(s.rows.size,count);
  s.nk.storageWrite=write;const v=start(s);clock(s,v.session.expectedEndAt);
  s.nk.storageWrite=w=>{write(w);throw Error('response lost');};const result=command(s,'claim',v.session);
  assert.equal(result.replayed,true);assert.equal(quantity(s,'it_fish_carp')+quantity(s,'it_fish_tilapia'),1);
  assert.equal(command(s,'claim',v.session).replayed,true);
});
test('life shop supports replenishment and sale at the real new-village stall, with session timing supplied only by the server',()=>{
  const s=life(),world=s.rpc('world_get'),p=s.state();p.spiritStones=20;s.put(p);
  const shop=s.scope.WORLD_MAPS.m_lang_que.points.find(p=>p.id==='ak.market.village');assert.ok(shop);
  const row=s.rows.get(`${A}/world_sessions/main`);
  s.nk.storageWrite([{...row,value:{...row.value,x:shop.x,y:shop.y},version:row.version}]);
  const purchased=s.rpc('economy_action',{operationId:'buy_bait_0001',action:'buy',itemId:'it_bait',quantity:10});assert.equal(quantity(s,'it_bait'),40);assert.equal(purchased.profile.spiritStones,10);
  at(s);const v=start(s,{controlMode:'autonomous',cycles:1});clock(s,v.session.expectedEndAt);const r=command(s,'claim',v.session);
  const fish=r.granted.items[0].itemId;const current=s.rows.get(`${A}/world_sessions/main`);
  s.nk.storageWrite([{...current,value:{...current.value,x:shop.x,y:shop.y},version:current.version}]);
  assert.ok(s.rpc('economy_action',{operationId:'sell_fish_0001',action:'sell',itemId:fish,quantity:1}).profile.spiritStones>10);
});
