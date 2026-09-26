const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const {randomUUID, createHash} = require('node:crypto');
const clone = x => JSON.parse(JSON.stringify(x));
const A = '11111111-1111-4111-8111-111111111111';
function setup() {
  const handlers = {}, rows = new Map();
  const scope = vm.createContext({});
  vm.runInContext(fs.readFileSync('build/index.js', 'utf8'), scope);
  scope.InitModule({}, {}, {}, new Proxy({}, {get: (_, method) => method === 'registerRpc'
    ? (id, fn) => { handlers[id] = fn; } : () => {}}));
  let serial = 0;
  const key = x => `${x.userId}/${x.collection}/${x.key}`;
  const nk = {
    storageRead(ids) { return ids.flatMap(id => rows.has(key(id)) ? [clone(rows.get(key(id)))] : []); },
    storageWrite(writes) {
      // Validate the WHOLE batch before mutating anything: mirror Nakama atomicity.
      for (const w of writes) {
        const old = rows.get(key(w));
        if ((w.version === '*' && old) || (w.version !== '*' && w.version !== old?.version)) throw Error('CAS conflict');
      }
      return writes.map(w => {
        const version = String(++serial);
        rows.set(key(w), clone({...w, version}));
        return {version};
      });
    },
    uuidv4: randomUUID,
    sha256Hash: value => createHash('sha256').update(value).digest('hex'),
  };
  const rpc = (name, data={}, userId=A) => JSON.parse(handlers[name]({userId}, {}, nk, JSON.stringify(data)));
  const put = state => nk.storageWrite([{collection:'characters',key:'main',userId:A,value:state,version:rows.get(`${A}/characters/main`)?.version || '*'}]);
  const state = () => clone(rows.get(`${A}/characters/main`)?.value);
  return {handlers,scope,rows,nk,rpc,put,state};
}
const rejectsCode = (fn, code) => assert.throws(fn, e => e.code === code);
module.exports = {setup, clone, A, rejectsCode};
