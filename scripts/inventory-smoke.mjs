// Local Docker backend only. SQL fixtures touch only accounts created by this run.
import assert from 'node:assert/strict';
import {randomUUID, createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base='http://127.0.0.1:7350';
const basic='Basic '+Buffer.from('local-dev-key:').toString('base64');
const accounts=[];
async function request(path,auth,body,method='POST') {
  const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Authorization:auth},body:body===undefined?undefined:JSON.stringify(body)});
  const text=await res.text();return {status:res.status,data:text?JSON.parse(text):{}};
}
async function account() {
  const device=randomUUID(),r=await request('/v2/account/authenticate/device?create=true',basic,{id:device});
  assert.equal(r.status,200,JSON.stringify(r.data));
  const a={device,auth:'Bearer '+r.data.token,id:JSON.parse(Buffer.from(r.data.token.split('.')[1],'base64url')).uid};
  assert.match(a.id,/^[a-f0-9-]{36}$/);accounts.push(a);return a;
}
async function rpc(a,name,payload={}) {
  const r=await request('/v2/rpc/'+name,a.auth,JSON.stringify(payload));
  return {...r,value:r.status===200?JSON.parse(r.data.payload):null};
}
async function good(a,name,payload={}) {
  const r=await rpc(a,name,payload);assert.equal(r.status,200,JSON.stringify(r.data));return r.value;
}
function sql(query) {
  return execFileSync('docker',['compose','exec','-T','postgres','psql','-U','postgres','-d','nakama','-tAc',query],{encoding:'utf8'}).trim();
}
function fixture(a,value) {
  assert(accounts.includes(a));
  const json=JSON.stringify(value),escaped=json.replaceAll("'","''");
  const version=createHash('md5').update(json).digest('hex');
  sql(`INSERT INTO storage (collection,key,user_id,value,version,read,write) VALUES ('characters','main','${a.id}','${escaped}'::jsonb,'${version}',1,0) ON CONFLICT (collection,key,user_id) DO UPDATE SET value=EXCLUDED.value,version=EXCLUDED.version;`);
}
try {
  const a=await account();
  const initial=await Promise.all(Array.from({length:8},()=>good(a,'inventory_get')));
  initial.forEach(v=>{assert.equal(v.profile.schemaVersion,2);assert.equal(v.profile.realm,'mortal');assert.equal(v.capacity,24);assert.equal(v.catalog.length,24);});
  const claims=await Promise.all(Array.from({length:12},()=>rpc(a,'inventory_claim_starter',{operationId:'same_operation_001'})));
  claims.forEach(r=>assert.equal(r.status,200,JSON.stringify(r.data)));
  assert.equal(claims.filter(r=>!r.value.replayed).length,1);
  const p=(await good(a,'inventory_get')).profile;
  assert.equal(p.spiritStones,12);assert.equal(p.revision,1);assert.equal(p.inventory.length,4);
  assert.equal(sql(`SELECT count(*) FROM storage WHERE user_id='${a.id}' AND collection='asset_receipts';`),'2');
  assert.notEqual((await rpc(a,'inventory_claim_starter',{operationId:'another_operation'})).status,200);
  assert.notEqual((await rpc(a,'inventory_claim_starter',{operationId:'forged_operation',spiritStones:999999})).status,200);
  const forged=await request('/v2/storage',a.auth,{objects:[{collection:'characters',key:'main',value:JSON.stringify({...p,spiritStones:99999}),permission_write:1}]},'PUT');
  assert.equal(forged.status,403);
  assert.deepEqual(await good(a,'get_profile'),p);
  const b=await account();
  const privateRead=await request('/v2/storage/'+a.id+'/characters',b.auth,undefined,'GET');
  if(privateRead.status===200) assert.equal(privateRead.data.objects?.length||0,0);
  const receiptRead=await request('/v2/storage/'+a.id+'/asset_receipts',a.auth,undefined,'GET');
  if(receiptRead.status===200) assert.equal(receiptRead.data.objects?.length||0,0);
  const contenders=await Promise.all(Array.from({length:12},(_,i)=>rpc(b,'inventory_claim_starter',{operationId:'different_operation_'+i})));
  assert.equal(contenders.filter(r=>r.status===200).length,1);
  assert.equal((await good(b,'inventory_get')).profile.revision,1);
  const legacy=await account();fixture(legacy,{schemaVersion:1,realm:'luyen_khi',level:2,spiritStones:57,note:'preserve'});
  const migrated=await Promise.all(Array.from({length:8},()=>good(legacy,'get_profile')));
  migrated.forEach(v=>{assert.equal(v.realmStage,2);assert.equal(v.spiritStones,57);assert.equal(v.note,'preserve');});
  const invalid=await account();fixture(invalid,{schemaVersion:1,realm:'pham_nhan',level:99,spiritStones:8});
  assert.notEqual((await rpc(invalid,'get_profile')).status,200);
  assert.equal(sql(`SELECT value->>'level' FROM storage WHERE user_id='${invalid.id}' AND collection='characters' AND key='main';`),'99');
  const full=await account();const empty=await good(full,'get_profile');
  fixture(full,{...empty,spiritStones:7,inventory:Array.from({length:24},()=>({itemId:'it_water',quantity:99}))});
  assert.notEqual((await rpc(full,'inventory_claim_starter',{operationId:'full_bag_request'})).status,200);
  assert.equal((await good(full,'get_profile')).spiritStones,7);
  assert.equal(sql(`SELECT count(*) FROM storage WHERE user_id='${full.id}' AND collection='asset_receipts';`),'0');
  // Discard a successful response, restart Nakama, authenticate again and replay.
  await good(a,'inventory_claim_starter',{operationId:'same_operation_001'});
  execFileSync('docker',['compose','restart','nakama'],{stdio:'inherit'});
  let healthy=false;
  for(let i=0;i<50;i++) {
    try {const r=await request('/v2/account/authenticate/device?create=false',basic,{id:a.device});if(r.status===200){a.auth='Bearer '+r.data.token;healthy=true;break;}} catch {}
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  assert(healthy,'Nakama did not recover after restart');
  const recovered=await good(a,'inventory_claim_starter',{operationId:'same_operation_001'});
  assert.equal(recovered.replayed,true);assert.deepEqual(recovered.profile,p);
  console.log('PASS inventory: concurrent grants, source uniqueness, permissions, migration, full-bag rollback and restart/replay');
} finally {
  for(const a of accounts) { const r=await request('/v2/account',a.auth,undefined,'DELETE');assert.equal(r.status,200,JSON.stringify(r.data)); }
}
