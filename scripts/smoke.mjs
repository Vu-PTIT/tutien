import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const base = 'http://127.0.0.1:7350';
async function post(path, auth, body) {
  const res = await fetch(base + path, {method:'POST', headers:{'Content-Type':'application/json', Authorization:auth}, body:JSON.stringify(body)});
  assert.equal(res.status, 200, await res.clone().text());
  return res.json();
}
const session = await post('/v2/account/authenticate/device?create=true', 'Basic '+Buffer.from('local-dev-key:').toString('base64'), {id:randomUUID()});
const auth = 'Bearer '+session.token;
const first = JSON.parse((await post('/v2/rpc/get_profile', auth, '{}')).payload);
const second = JSON.parse((await post('/v2/rpc/get_profile', auth, '{}')).payload);
assert.equal(first.realm, 'pham_nhan');
assert.deepEqual(first, second);
console.log('PASS: device authentication, profile creation and repeat read');
