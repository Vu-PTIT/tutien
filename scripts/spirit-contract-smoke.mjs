// End-to-end smoke against real Nakama/PostgreSQL; all actors are new test users.
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
  return {id:account.user.id,username,auth,rpc:async(name,input={})=>JSON.parse((await request('/v2/rpc/'+name,auth,JSON.stringify(input))).payload)};
}
const a=await actor('sph_'),b=await actor('spc_');
await a.rpc('character_select_form',{operationId:op(),kind:'human',speciesId:'human'});
await b.rpc('character_select_form',{operationId:op(),kind:'spirit',speciesId:'cat'});
const {contract}=await a.rpc('contract_invite',{operationId:op(),userId:b.id});
assert.equal((await b.rpc('contract_get')).incoming[0].id,contract.id);
await b.rpc('contract_respond',{contractId:contract.id,accept:true});
await a.rpc('contract_hunt_start',{contractId:contract.id});
const {hunt}= (await b.rpc('contract_hunt_start',{contractId:contract.id})).contract;
let victory=false;
for(let i=0;i<12;i++){
  const player=i%2===0?a:b,operationId=op(),input={contractId:contract.id,huntId:hunt.id,operationId,skill:false};
  const hit=await player.rpc('contract_hunt_attack',input);
  assert.equal((await player.rpc('contract_hunt_attack',input)).replayed,true);
  if(i>0) assert.equal(hit.combo,true);
  if(hit.contract.hunt.phase==='victory'){victory=true;break;}
  await new Promise(resolve=>setTimeout(resolve,750));
}
assert.equal(victory,true);
for(const player of [a,b]){
  const claim=await player.rpc('contract_hunt_claim');assert.equal(claim.profile.cultivationXp,undefined);
  assert.deepEqual(claim.receipt.granted.linhNang,[{vi:'tho',motes:8,turbid:6}]);
  assert.equal(claim.profile.inventory.find(item=>item.itemId==='it_boar_hide').quantity,1);
  assert.equal((await player.rpc('contract_hunt_claim')).replayed,true);
}
await a.rpc('contract_release',{contractId:contract.id});
assert.equal((await b.rpc('contract_get')).active,null);
assert.equal((await b.rpc('get_profile')).form.speciesId,'cat');
console.log('PASS: real Nakama/PostgreSQL forms, consent, shared hunt, combos, owned rewards, retry, release');
