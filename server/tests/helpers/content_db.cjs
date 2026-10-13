const {createHash} = require('node:crypto');
const clone = x => JSON.parse(JSON.stringify(x));
// Minimal PostgreSQL for the game_* content tables: exactly the statements
// game_content.ts issues (CREATE, INSERT … ON CONFLICT DO NOTHING, SELECT *).
function contentDb() {
  const sql = new Map();
  const sqlExec = (query, args = []) => {
    const create = query.match(/^CREATE TABLE IF NOT EXISTS (\w+) /);
    if (create) { if (!sql.has(create[1])) sql.set(create[1], []); return {rowsAffected: 0}; }
    const insert = query.match(/^INSERT INTO (\w+) \(([^)]+)\) VALUES \([^)]*\) ON CONFLICT \(([^)]+)\) DO NOTHING$/);
    if (!insert) throw Error('Unsupported SQL in test: ' + query);
    const columns = insert[2].split(', '), keys = insert[3].split(', '), table = sql.get(insert[1]);
    const row = Object.fromEntries(columns.map((c, i) => [c, args[i]]));
    if (table.some(r => keys.every(k => r[k] === row[k]))) return {rowsAffected: 0};
    table.push(row); return {rowsAffected: 1};
  };
  const sqlQuery = query => {
    const select = query.match(/^SELECT \* FROM (\w+)$/);
    if (!select || !sql.has(select[1])) throw Error('Unsupported SQL in test: ' + query);
    return clone(sql.get(select[1]));
  };
  return {sql, sqlExec, sqlQuery};
}
// What InitModule needs to migrate and load content in harnesses that keep their own nk.
function contentInit() {
  const db = contentDb();
  return {db, nk: {sqlExec: db.sqlExec, sqlQuery: db.sqlQuery, sha256Hash: v => createHash('sha256').update(v).digest('hex')},
    logger: {info() {}, warn() {}, error() {}, debug() {}}};
}
module.exports = {contentDb, contentInit};
