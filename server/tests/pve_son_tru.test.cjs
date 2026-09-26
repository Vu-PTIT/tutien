const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function harness() {
  const scope = vm.createContext({});
  vm.runInContext(fs.readFileSync('build/index.js', 'utf8'), scope);
  const matches = {}, rpcs = {};
  scope.InitModule({}, {}, {}, new Proxy({}, {get: (_, method) => method === 'registerRpc'
    ? (id, fn) => {rpcs[id] = fn;} : method === 'registerMatch'
      ? (id, fn) => {matches[id] = fn;} : () => {}}));
  const match = matches.pve_son_tru;
  const writes = [], snapshots = [], kicked = [];
  const rows = new Map();
  const key = row => `${row.userId}/${row.collection}/${row.key}`;
  const nk = {
    uuidv4: () => 'pve-epoch', binaryToString: value => Buffer.from(value).toString(),
    storageRead: ids => ids.flatMap(id => rows.has(key(id)) ? [rows.get(key(id))] : []),
    storageWrite: values => values.map(value => {writes.push(value); rows.set(key(value), {...value, version:'1'}); return {version:'1'};}),
    matchCreate: (name, params) => {assert.equal(name, 'pve_son_tru'); assert.equal(params.owner, 'a'); return 'son-tru-room';}
  };
  const dispatcher = {broadcastMessage: (_op, data) => snapshots.push(JSON.parse(data)), matchKick: values => kicked.push(...values)};
  const state = match.matchInit({}, {}, nk, {owner:'a'}).state;
  let tick = 0, seq = 0;
  const presence = (id='a', session=id) => ({userId:id, sessionId:session, username:id, node:'test'});
  const metadata = {consent:'true', mode:'pve_son_tru', version:'1'};
  const join = (id='a', session=id, info=metadata) => {
    const value = presence(id, session);
    const result = match.matchJoinAttempt({}, {}, nk, dispatcher, tick, state, value, info);
    if (result.accept) match.matchJoin({}, {}, nk, dispatcher, tick, state, [value]);
    return result.accept;
  };
  const message = (id='a', extra={}, session=id) => ({sender:presence(id, session), opCode:1,
    data:Buffer.from(JSON.stringify({epoch:'pve-epoch', seq:++seq, moveX:0, moveY:0, aimX:1, aimY:0, action:'', ...extra}))});
  const step = (messages=[]) => match.matchLoop({}, {}, nk, dispatcher, ++tick, state, messages);
  const steps = count => {for (let i=0;i<count;i++) step();};
  const leave = (id='a', session=id) => match.matchLeave({}, {}, nk, dispatcher, tick, state, [presence(id, session)]);
  return {scope, match, rpcs, nk, dispatcher, state, writes, snapshots, kicked, presence, join, message, step, steps, leave, get tick(){return tick;}};
}

test('PvE creation requires authenticated opt-in and fixes the encounter owner server-side', () => {
  const h = harness();
  assert.throws(() => h.rpcs.pve_son_tru_create({}, {}, {}, '{}'), error => error.code === 16);
  assert.throws(() => h.rpcs.pve_son_tru_create({userId:'a'}, {}, h.nk, '{"consent":false}'), error => error.code === 3);
  const result = JSON.parse(h.rpcs.pve_son_tru_create({userId:'a'}, {}, h.nk, '{"consent":true,"owner":"b","enemy":"forged"}'));
  assert.deepEqual(result, {matchId:'son-tru-room', version:1, mode:'pve_son_tru', encounter:'en_boar'});
  assert(h.writes.every(write => write.collection === 'social_limits'), 'Creation only writes the request quota, not player rewards');
});

test('join requires exact owner consent and protocol; duplicate, guest and expired reconnections are rejected', () => {
  const h = harness();
  assert.equal(h.join('a','a',{}), false);
  assert.equal(h.join('b'), false);
  assert.equal(h.join('a'), true);
  assert.equal(h.join('a','second-session'), false);
  h.leave(); h.state.player.disconnectedAt = h.tick - 200;
  assert.equal(h.join('a','new-session'), false);
});

test('boar notices within five tiles, locks its tell direction, charges for four tiles, then recovers', () => {
  const h = harness(); h.join();
  const p = h.state.player, b = h.state.boar;
  p.x = 540; p.y = 300; b.x = 680; b.y = 300;
  h.step(); assert.equal(b.mode, 'notice');
  h.steps(8); assert.equal(b.mode, 'chase');
  h.step(); assert.equal(b.mode, 'windup');
  assert.equal(b.faceX, -1); assert.equal(b.faceY, 0);
  p.x = 540; p.y = 370; // The telegraph keeps its locked heading even if the target moves.
  h.steps(14); assert.equal(b.mode, 'windup');
  h.step(); assert.equal(b.mode, 'charge');
  assert.equal(b.x, 680, 'The first charge step follows the locked windup');
  assert.equal(b.faceX, -1);
  h.steps(8); assert.equal(b.mode, 'recover');
  assert.equal(b.x, 552);
  assert.equal(p.hp, 100, 'The locked line missed the moved player');
});

test('a perpendicular dodge during the 0.75 second tell leaves the player outside the charge lane', () => {
  const h = harness(); h.join();
  const p = h.state.player, b = h.state.boar;
  p.x = 540; p.y = 300; b.x = 680; b.y = 300;
  h.step(); h.steps(8); h.step(); assert.equal(b.mode, 'windup');
  h.step([h.message('a',{moveY:1,action:'sk_dodge'})]);
  h.steps(38);
  assert.equal(p.hp, 100);
  assert(p.y > 350, 'Dodge follows the movement direction so mobile and keyboard controls can evade sideways');
  assert.equal(b.mode, 'chase');
});

test('charge collision is authoritative, invulnerability avoids damage, and defeat resets both actors', () => {
  const h = harness(); h.join();
  const p = h.state.player, b = h.state.boar;
  p.x = 470; p.y = 300; p.hp = 9;
  b.x = 500; b.y = 300; b.faceX = -1; b.faceY = 0; b.mode = 'charge'; b.since = h.tick;
  h.step();
  assert.equal(p.hp, 0); assert.equal(h.state.phase, 'defeated');
  h.steps(59); assert.equal(h.state.phase, 'defeated');
  h.step();
  assert.equal(h.state.phase, 'active'); assert.equal(p.hp, 100); assert.equal(b.hp, 60);
  assert.equal(p.x, 280); assert.equal(b.x, 690);

  const dodge = harness(); dodge.join();
  const dp = dodge.state.player, db = dodge.state.boar;
  dp.x = 470; dp.y = 300; db.x = 500; db.y = 300; db.faceX = -1; db.faceY = 0; db.mode = 'charge'; db.since = dodge.tick;
  dp.mode = 'dodging'; dp.since = dodge.tick; dp.dodgeX = 0; dp.dodgeY = 1;
  dodge.step();
  assert.equal(dp.hp, 100);
});

test('basic attacks only damage the boar during its recovery opening, with server damage and one hit per swing', () => {
  const h = harness(); h.join();
  const p = h.state.player, b = h.state.boar;
  p.x = 380; p.y = 350; b.x = 420; b.y = 350; b.hp = 60; b.mode = 'recover'; b.since = h.tick;
  h.step([h.message('a',{action:'sk_basic',damage:999})]); h.steps(2);
  assert.equal(b.hp, 60);
  h.step(); assert.equal(b.hp, 45);
  h.steps(6); assert.equal(b.hp, 45);

  p.mode = 'idle'; p.attackAt = h.tick; p.hitBoar = false;
  b.mode = 'windup'; b.since = h.tick;
  h.step([h.message('a',{action:'sk_basic'})]); h.steps(3);
  assert.equal(b.hp, 45, 'Attacks cannot skip the counterattack window');
});

test('server collision prevents crossing arena bounds and the fallen log; line-of-sight rejects the obstacle', () => {
  const h = harness(); h.join();
  const p = h.state.player;
  p.x = 420; p.y = 268;
  h.step([h.message('a',{moveX:1})]);
  assert(p.x < 440, 'The player capsule stops before the log');
  p.x = 910; p.y = 350; h.step([h.message('a',{moveX:1})]);
  assert(p.x <= 908);
  assert.equal(h.scope.pveSonTruLineClear(420,268,590,268), false);
  assert.equal(h.scope.pveSonTruLineClear(420,310,590,310), true);
});

test('malformed, stale, oversized and forged-session inputs cannot move or alter HP', () => {
  const h = harness(); h.join(); const p = h.state.player, x = p.x;
  h.step([h.message('a',{moveX:2})]);
  h.step([h.message('a',{epoch:'old',moveX:1})]);
  h.step([h.message('a',{moveX:1},'fake')]);
  h.step([h.message('a',{moveX:null})]);
  h.step([h.message('a',{seq:-1,moveX:1})]);
  h.step([h.message('a',{moveX:1,extra:'x'.repeat(600)})]);
  h.step([{sender:h.presence(),opCode:1,data:Buffer.from('{bad')}]);
  h.step([{sender:h.presence(),opCode:1,data:null}]);
  assert.equal(p.x,x); assert.equal(p.hp,100); assert.equal(h.state.boar.hp,60);
});

test('brief disconnect preserves HP and position, resets input sequence, and permits the same owner to rejoin', () => {
  const h = harness(); h.join(); const p = h.state.player;
  p.hp = 70; p.x = 350; p.attackAt = 99;
  h.leave(); h.steps(20);
  assert.equal(h.join('a','reconnected'), true);
  assert.equal(p.hp,70); assert.equal(p.x,350); assert.equal(p.attackAt,99); assert.equal(p.seq,-1);
  h.step([h.message('a',{moveX:1},'a')]); assert.equal(p.x,350, 'The old session cannot send inputs');
  h.step([h.message('a',{moveX:1},'reconnected')]); assert.equal(p.x,359);
});

test('disconnect timeout ends only the encounter, snapshots omit secrets and rewards, and combat never writes progression', () => {
  const h = harness(); h.join(); h.writes.length = 0;
  h.state.player.x = 280; h.state.player.y = 340;
  h.leave(); h.steps(199); assert.equal(h.state.phase,'active');
  h.step(); assert.equal(h.state.phase,'finished'); assert.equal(h.state.reason,'disconnect');
  const snap = h.snapshots.at(-1);
  assert.equal(snap.players[0].presence,undefined); assert.equal(snap.players[0].sessionId,undefined);
  assert.equal(snap.rewards,undefined); assert.equal(snap.settlement,undefined); assert.equal(snap.rules.tickRate,20);
  assert.equal(h.writes.length,0);
});
