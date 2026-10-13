const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const {randomUUID, createHash} = require('node:crypto');
const {contentDb} = require('./content_db.cjs');
const clone = x => JSON.parse(JSON.stringify(x));
// Nakama gives JS a Go-backed view of stored values: nested edits stick, but
// assigning a JS object into it stores a snapshot. Later edits to that JS object
// are lost. Mirror that so tests catch code that mutates after assigning.
function goBacked(value) {
  if (!value || typeof value !== "object") return value;
  return new Proxy(value, {
    get: (target, prop) => goBacked(target[prop]),
    set: (target, prop, next) => { target[prop] = next && typeof next === "object" ? clone(next) : next; return true; }
  });
}
const A = '11111111-1111-4111-8111-111111111111';
function setup() {
  const handlers = {}, rows = new Map();
  const scope = vm.createContext({});
  vm.runInContext(fs.readFileSync('build/index.js', 'utf8'), scope);
  let serial = 0;
  const {sql, sqlExec, sqlQuery} = contentDb();
  const key = x => `${x.userId}/${x.collection}/${x.key}`;
  const nk = {
    storageRead(ids) { return ids.flatMap(id => rows.has(key(id)) ? [goBacked(clone(rows.get(key(id))))] : []); },
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
    // Pages ordered by key; the cursor is the index of the next row.
    storageList(userId, collection, limit = 100, cursor) {
      const all = [...rows.values()].filter(r => r.userId === userId && r.collection === collection)
        .sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
      const start = cursor ? Number(cursor) : 0, end = start + limit;
      return {objects: all.slice(start, end).map(clone), cursor: end < all.length ? String(end) : undefined};
    },
    storageDelete(deletes) {
      for (const d of deletes) if (d.version && rows.get(key(d))?.version !== d.version) throw Error('CAS conflict');
      for (const d of deletes) rows.delete(key(d));
    },
    sqlExec, sqlQuery,
    uuidv4: randomUUID,
    sha256Hash: value => createHash('sha256').update(value).digest('hex'),
  };
  const logger = {info() {}, warn() {}, error() {}, debug() {}};
  scope.InitModule({}, logger, nk, new Proxy({}, {get: (_, method) => method === 'registerRpc'
    ? (id, fn) => { handlers[id] = fn; } : () => {}}));
  // Simulates an operator editing content: the next reload sees it immediately.
  const reloadContent = () => { vm.runInContext('GAME_CONTENT_LOADED_AT = -1e15;', scope); };
  // COLD_CONTENT=1 starts every RPC with an empty content cache, like a fresh
  // Nakama VM, so an RPC that reads items before loading them fails the suite.
  const rpc = (name, data={}, userId=A) => { if (process.env.COLD_CONTENT) vm.runInContext('GAME_CONTENT = null;', scope); return JSON.parse(handlers[name]({userId}, {}, nk, JSON.stringify(data))); };
  const put = state => nk.storageWrite([{collection:'characters',key:'main',userId:A,value:state,version:rows.get(`${A}/characters/main`)?.version || '*'}]);
  // The profile as the server sees it: the Nội Giới lives in its own row.
  const state = () => {
    const value = clone(rows.get(`${A}/characters/main`)?.value);
    const inner = rows.get(`${A}/inner_worlds/main`);
    if (value && inner && value.innerWorld === undefined) value.innerWorld = clone(inner.value);
    return value;
  };
  return {handlers,scope,rows,nk,rpc,put,state,sql,reloadContent};
}
const rejectsCode = (fn, code) => assert.throws(fn, e => e.code === code);
module.exports = {setup, clone, A, rejectsCode};
