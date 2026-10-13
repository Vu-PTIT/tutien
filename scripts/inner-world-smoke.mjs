// End-to-end Nội Giới smoke against real Nakama/PostgreSQL; all actors are new test users.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const base=process.env.NAKAMA_URL||'http://127.0.0.1:7350';
const op=()=>randomUUID().replaceAll('-','');
async function request(path,auth,body,method='POST'){
  const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Authorization:auth},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  assert.equal(response.status,200,await response.clone().text());return response.json();
}
async function actor(prefix){
  const username=prefix+op().slice(0,10),session=await request('/v2/account/authenticate/device?create=true&username='+username,'Basic '+Buffer.from('local-dev-key:').toString('base64'),{id:randomUUID()});
  const auth='Bearer '+session.token,account=await request('/v2/account',auth,undefined,'GET');
  return {id:account.user.id,auth,rpc:async(name,input={})=>JSON.parse((await request('/v2/rpc/'+name,auth,JSON.stringify(input))).payload)};
}
async function rejected(player,name,input){
  const response=await fetch(base+'/v2/rpc/'+name,{method:'POST',headers:{'Content-Type':'application/json',Authorization:player.auth},body:JSON.stringify(JSON.stringify(input))});
  assert.notEqual(response.status,200,name+' should be rejected');
}
const human=await actor('ngh_'),spirit=await actor('ngs_');
await human.rpc('character_select_form',{operationId:op(),kind:'human',speciesId:'human'});
await spirit.rpc('character_select_form',{operationId:op(),kind:'spirit_beast',speciesId:'cat'});

// A spirit beast knows Hấp Linh; a human must be taught by one.
let world=(await spirit.rpc('inner_world_get')).innerWorld;
assert.equal(world.learned,true);assert.deepEqual(world.cells,[{x:0,y:0,kind:'an',height:1,turbid:false}]);
assert.equal((await human.rpc('inner_world_get')).innerWorld.learned,false);
const {contract}=await human.rpc('contract_invite',{operationId:op(),userId:spirit.id});
await spirit.rpc('contract_respond',{contractId:contract.id,accept:true});
const learnInput={operationId:op(),contractId:contract.id};
const learned=await human.rpc('inner_world_learn',learnInput);
assert.equal(learned.innerWorld.teacher,'contract:'+spirit.id);assert.equal(learned.innerWorld.cells.length,1);
assert.equal((await human.rpc('inner_world_learn',learnInput)).replayed,true);
await rejected(human,'inner_world_learn',{operationId:op(),contractId:contract.id});
await human.rpc('contract_release',{contractId:contract.id});

// Two autonomous Hấp Linh cycles at the lake on real server time grow one clean Thủy cell.
await spirit.rpc('world_get',{preferredMapId:'m_lang_que'});
const start=await spirit.rpc('activity_start',{operationId:op(),siteId:'lq_med_ho',controlMode:'autonomous',cycles:2});
let session=start.session;assert.equal(session.activityType,'meditation');
const deadline=Date.now()+Math.max(0,session.expectedEndAt-session.serverNow)+20000;
while(session.state!=='completed'){
  assert.ok(Date.now()<deadline,'meditation did not finish on server time');
  await new Promise(resolve=>setTimeout(resolve,5000));
  session=(await spirit.rpc('activity_get')).session;
}
const claimInput={operationId:op(),sessionId:session.sessionId,stateVersion:session.stateVersion};
const claim=await spirit.rpc('activity_claim',claimInput);
assert.deepEqual(claim.granted.linhNang,[{vi:'thuy',motes:6,turbid:0}]);
assert.equal(claim.granted.inner.cells,1);
assert.equal((await spirit.rpc('activity_claim',claimInput)).replayed,true);
world=(await spirit.rpc('inner_world_get')).innerWorld;
assert.equal(world.cells.length,2);assert.deepEqual(world.pending,{thuy:2});

// Arranging swaps the seed with the new Thủy cell and keeps the world whole.
const water=world.cells.find(cell=>cell.kind==='thuy');
const arranged=(await spirit.rpc('inner_world_arrange',{operationId:op(),from:{x:0,y:0},to:{x:water.x,y:water.y}})).innerWorld;
assert.equal(arranged.cells.find(cell=>cell.x===0&&cell.y===0).kind,'thuy');
await rejected(spirit,'inner_world_arrange',{operationId:op(),from:{x:0,y:0},to:{x:20,y:20}});
console.log('PASS: real Nakama/PostgreSQL Nội Giới teaching, autonomous Hấp Linh on server time, growth, replay and arranging');
