// Live Nakama/PostgreSQL smoke. No time override or forged position is used.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const base=process.env.NAKAMA_URL||'http://127.0.0.1:7350';
const device=randomUUID(),op=()=>randomUUID().replaceAll('-','');
async function post(path,auth,body) {
  const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:auth},body:JSON.stringify(body)});
  assert.equal(response.status,200,await response.clone().text());return response.json();
}
async function login() {return post('/v2/account/authenticate/device?create=true','Basic '+Buffer.from('local-dev-key:').toString('base64'),{id:device});}
let auth='Bearer '+(await login()).token;
async function rpc(name,input={}) {return JSON.parse((await post('/v2/rpc/'+name,auth,JSON.stringify(input))).payload);}
const quantity=(profile,id)=>profile.inventory.filter(p=>p.itemId===id).reduce((n,p)=>n+p.quantity,0);
await rpc('world_get',{preferredMapId:'m_k1_01'});
const commandId=op(),starter=await rpc('life_claim_starter',{operationId:commandId});
assert.equal(quantity(starter.profile,'it_fishing_rod'),1);
assert.equal((await rpc('life_claim_starter',{operationId:commandId})).replayed,true);
const catalog=await rpc('life_get');assert.equal(catalog.sites.length,26);assert.equal(catalog.garden.plots.length,12);
const started=(await rpc('activity_start',{operationId:op(),siteId:'k1_01_fish_01',controlMode:'autonomous',cycles:2})).session;
assert.equal(started.activityType,'fishing');
// Poll through travel, then exercise a mode change and a partial cancellation.
const deadline=Date.now()+180000;
let current;
do {
  assert.ok(Date.now()<deadline,'Activity did not make progress within 180 seconds');
  await new Promise(resolve=>setTimeout(resolve,1000));
  current=(await rpc('activity_get')).session;
} while(current.state==='travelling');
const control=(await rpc('activity_control',{operationId:op(),sessionId:current.sessionId,stateVersion:current.stateVersion,controlMode:'direct'})).session;
assert.equal(control.sessionId,started.sessionId);
// A new connection reads the same durable session without its original client.
auth='Bearer '+(await login()).token;
assert.equal((await rpc('activity_get')).session.sessionId,started.sessionId);
do {
  assert.ok(Date.now()<deadline,'Fishing did not complete a server cycle');
  await new Promise(resolve=>setTimeout(resolve,1000));current=(await rpc('activity_get')).session;
} while(current.completedCycles<1);
const cancelled=(await rpc('activity_cancel',{operationId:op(),sessionId:current.sessionId,stateVersion:current.stateVersion})).session;
const claimInput={operationId:op(),sessionId:cancelled.sessionId,stateVersion:cancelled.stateVersion};
const claimed=await rpc('activity_claim',claimInput),replayed=await rpc('activity_claim',claimInput);
assert.equal(replayed.replayed,true);assert.deepEqual(replayed.receipt,claimed.receipt);
assert.equal(['it_fish_carp','it_fish_tilapia','it_lake_weed','it_lake_junk','it_fish_glimmer'].reduce((n,id)=>n+quantity(claimed.profile,id),0),cancelled.completedCycles);
assert.equal(quantity(claimed.profile,'it_bait'),30-cancelled.completedCycles);
// Exercise the real mining lease/tool gate and garden reservation/refund without
// accelerating production timers. Unit tests cover their completed yields.
for(const job of [{mapId:'m_k1_03',siteId:'k1_03_ore_01'},
                 {mapId:'m_nha',siteId:'nha_plot_01',cropId:'crop_cam_lo'}]) {
  await rpc('world_travel',{mapId:job.mapId});
  const input={operationId:op(),siteId:job.siteId,controlMode:'autonomous',...(job.cropId?{cropId:job.cropId}:{})};
  const session=(await rpc('activity_start',input)).session;
  assert.equal(session.state,'travelling');
  const stopped=(await rpc('activity_cancel',{operationId:op(),sessionId:session.sessionId,stateVersion:session.stateVersion})).session;
  const result=await rpc('activity_claim',{operationId:op(),sessionId:stopped.sessionId,stateVersion:stopped.stateVersion});
  assert.equal(result.session.settlement,'settled');
  if(job.cropId){assert.equal(result.garden.plots[0].state,'empty');assert.equal(quantity(result.profile,'it_seed_cam_lo'),3);}
}
console.log('PASS live life activities: real server time, routing, reconnect, partial fish reward, replay, mining and planting reservations');
