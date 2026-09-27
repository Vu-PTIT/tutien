const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const {randomUUID, createHash} = require('node:crypto');

const OWNER = '11111111-1111-4111-8111-111111111111';
const clone = value => JSON.parse(JSON.stringify(value));

function harness(rows = new Map()) {
  const rpcHandlers = {}, matches = {}, scope = vm.createContext({});
  vm.runInContext(fs.readFileSync('build/index.js', 'utf8'), scope);
  scope.InitModule({}, {}, {}, new Proxy({}, {get: (_, method) => method === 'registerRpc'
    ? (name, fn) => { rpcHandlers[name] = fn; }
    : method === 'registerMatch' ? (name, handler) => { matches[name] = handler; } : () => {}}));
  let serial = 0, matchId = '', matchParams = null, tick = 0, seq = 0;
  const signals = [];
  const key = row => `${row.userId}/${row.collection}/${row.key}`;
  const nk = {
    storageRead(ids) { return ids.flatMap(id => rows.has(key(id)) ? [clone(rows.get(key(id)))] : []); },
    storageWrite(writes) {
      for (const write of writes) {
        const old = rows.get(key(write));
        if ((write.version === '*' && old) || (write.version !== '*' && write.version !== old?.version)) throw Error('CAS conflict');
      }
      return writes.map(write => {
        const version = String(++serial);
        rows.set(key(write), clone({...write, version}));
        return {version};
      });
    },
    uuidv4: randomUUID,
    sha256Hash: value => createHash('sha256').update(value).digest('hex'),
    binaryToString: value => Buffer.from(value).toString(),
    matchCreate(name, params) { assert.equal(name, 'pve_son_tru'); matchParams = clone(params); matchId = 'son-tru-match'; return matchId; },
    matchGet(id) { return id === matchId ? {matchId: id} : null; },
    matchSignal(id, data) { signals.push({id, value: JSON.parse(data)}); return true; }
  };
  const rpc = (name, payload = {}, userId = OWNER) => JSON.parse(rpcHandlers[name]({userId}, {}, nk, JSON.stringify(payload)));
  const put = profile => {
    const request = {collection: 'characters', key: 'main', userId: OWNER};
    const old = rows.get(key(request));
    return nk.storageWrite([{...request, value: clone(profile), version: old ? old.version : '*', permissionRead: 1, permissionWrite: 0}]);
  };
  const presence = (userId = OWNER, sessionId = 'session-1') => ({userId, sessionId, username: 'tester', node: 'test'});
  const snapshots = [], dispatcher = {broadcastMessage: (_op, data) => snapshots.push(JSON.parse(data)), matchKick: () => {}};
  let state;
  const init = (options = {}) => {
    state = matches.pve_son_tru.matchInit({}, {}, nk, {owner: OWNER, encounterId: randomUUID(), rewardEligible: true, initialHp: 100, ...options}).state;
    tick = 0; seq = 0;
    return state;
  };
  const join = (who = OWNER, session = 'session-1', metadata = {consent: 'true', mode: 'pve_son_tru', version: '1'}) => {
    const person = presence(who, session);
    const result = matches.pve_son_tru.matchJoinAttempt({}, {}, nk, dispatcher, tick, state, person, metadata);
    if (result.accept) matches.pve_son_tru.matchJoin({}, {}, nk, dispatcher, tick, state, [person]);
    return result.accept;
  };
  const message = (extra = {}, who = OWNER, session = 'session-1') => ({
    sender: presence(who, session), opCode: 1,
    data: Buffer.from(JSON.stringify({epoch: state.epoch, seq: ++seq, moveX: 0, moveY: 0, aimX: 1, aimY: 0, action: '', ...extra}))
  });
  const step = (messages = []) => {
    tick++;
    return matches.pve_son_tru.matchLoop({}, {}, nk, dispatcher, tick, state, messages);
  };
  const steps = count => { for (let i = 0; i < count; i++) step(); };
  return {rows, scope, rpcHandlers, matches, nk, rpc, put, init, join, message, step, steps, dispatcher, snapshots, signals,
    get state() { return state; }, get tick() { return tick; }, get matchParams() { return matchParams; }};
}

function profileFor(h, realm = 'luyen_khi') {
  const profile = h.rpc('get_profile');
  profile.realm = realm;
  profile.realmStage = realm === 'luyen_khi' ? 1 : 0;
  profile.hp = 73;
  h.put(profile);
  return profile;
}

test('PvE creation requires consent, derives owner and combat stats from the server profile, and resumes the owner match', () => {
  const h = harness();
  assert.throws(() => h.rpc('pve_son_tru_create', {consent: true}, ''), error => error.code === 16);
  assert.throws(() => h.rpc('pve_son_tru_create', {consent: true, owner: 'victim'}), error => error.code === 3);
  profileFor(h);
  h.rpc('inventory_claim_starter', {operationId: 'starter_claim_001'});
  h.scope.grantReward(h.nk, OWNER, 'grant_sword_001', 'fixture:sword', {spiritStones: 0, items: [{itemId: 'it_iron_sword', quantity: 1}]});
  const sword = h.rpc('inventory_get').profile.inventory.find(item => item.itemId === 'it_iron_sword');
  const armor = h.rpc('inventory_get').profile.inventory.find(item => item.itemId === 'it_cloth_armor');
  h.rpc('inventory_equip', {operationId: 'equip_sword_001', instanceId: sword.instanceId});
  h.rpc('inventory_equip', {operationId: 'equip_armor_001', instanceId: armor.instanceId});
  const result = h.rpc('pve_son_tru_create', {consent: true});
  assert.equal(result.matchId, 'son-tru-match');
  assert.equal(result.mode, 'pve_son_tru');
  assert.equal(h.matchParams.owner, OWNER);
  assert.equal(h.matchParams.initialHp, 73);
  assert.equal(h.matchParams.attack, 21);
  assert.equal(h.matchParams.defense, 20);
  assert.equal(h.rpc('pve_son_tru_create', {consent: true}).resumed, true);
});

test('admission is owner-only and requires explicit PvE protocol consent', () => {
  const h = harness();
  const state = h.init();
  assert.equal(h.join(OWNER, 'bad', {}), false);
  assert.equal(h.join('22222222-2222-4222-8222-222222222222'), false);
  assert.equal(h.join(), true);
  assert.equal(state.phase, 'active');
  assert.equal(h.join(OWNER, 'second-session'), false);
});

test('movement is server-limited and forged, stale or out-of-range messages do not move the player', () => {
  const h = harness();
  const state = h.init();
  h.join();
  const p = state.player, x = p.x, y = p.y;
  h.step([h.message({moveX: 1, moveY: 1})]);
  assert(Math.abs(Math.hypot(p.x - x, p.y - y) - 9) < 1e-8);
  const moved = {x: p.x, y: p.y};
  h.step([h.message({moveX: 0, moveY: 0}), h.message({moveX: 1}, OWNER, 'forged-session'), h.message({moveX: 2})]);
  h.step([{sender: {userId: OWNER, sessionId: 'session-1'}, opCode: 1, data: Buffer.from('{bad')}]);
  assert.equal(p.x, moved.x);
  assert.equal(p.y, moved.y);
});

test('boar gives a readable tell, charges authoritatively, and its hit can be avoided by distance', () => {
  const h = harness();
  const state = h.init();
  h.join();
  state.player.x = 510;
  state.boar.x = 690;
  h.step();
  assert.equal(state.boar.mode, 'tell');
  h.step();
  assert.equal(h.snapshots.at(-1).boar.mode, 'tell');
  h.steps(15);
  assert.equal(state.boar.mode, 'charging');
  h.steps(15);
  assert.equal(state.boar.mode, 'recover');
  assert.equal(state.player.hp, 100);
  assert.equal(state.boar.hp, 60);
});

test('verified LK victory saves one immutable reward; full bag keeps it pending across restart until claim', () => {
  const h = harness();
  const profile = profileFor(h);
  const swordId = randomUUID();
  profile.inventory = Array.from({length: 23}, () => ({itemId: 'it_water', quantity: 99}));
  profile.inventory.push({itemId: 'it_iron_sword', quantity: 1, instanceId: swordId});
  profile.equipped = {weapon: swordId, armor: ''};
  h.put(profile);
  h.rpc('pve_son_tru_create', {consent: true});
  assert.equal(h.matchParams.attack, 21);
  const encounterId = h.matchParams.encounterId;
  const state = h.init(h.matchParams);
  h.join();
  state.player.x = 635; state.player.y = 390;
  state.boar.x = 690; state.boar.y = 390; state.boar.mode = 'recover'; state.boar.since = 0;
  for (let hit = 0; hit < 3; hit++) {
    state.boar.mode = 'recover'; state.boar.since = h.tick;
    h.step([h.message({action: 'sk_basic'})]);
    h.steps(13);
  }
  assert.equal(state.boar.hp, 0);
  assert.equal(state.phase, 'reward_pending');
  assert.equal(state.settlementStatus, 'pending');
  const inventory = h.rpc('inventory_get');
  assert.equal(inventory.pendingSettlement.generation, 1);
  assert.equal(inventory.pendingSettlement.reward.cultivationXp, 10);
  assert.equal(inventory.pendingSettlement.reward.items[0].itemId, 'it_boar_hide');
  assert.throws(() => h.rpc('pve_son_tru_claim_pending'), error => error.code === 8);
  assert.throws(() => h.rpc('pve_son_tru_create', {consent: true}), error => error.code === 8);

  h.rpc('inventory_discard', {operationId: 'discard_stack_001', itemId: 'it_water', quantity: 99});
  const restarted = harness(h.rows);
  const claim = restarted.rpc('pve_son_tru_claim_pending');
  assert.equal(claim.pending, false);
  assert.equal(claim.replayed, false);
  assert.equal(claim.profile.cultivationXp, 10);
  assert.equal(claim.profile.inventory.at(-1).itemId, 'it_boar_hide');
  assert.equal(restarted.rpc('inventory_get').pendingSettlement, null);
  assert.equal(restarted.signals[0].value.action, 'reward_claimed');
  assert.equal(restarted.signals[0].value.encounterId, encounterId);
  const replay = restarted.rpc('pve_son_tru_claim_pending');
  assert.equal(replay.pending, false);
  assert.equal(replay.receipt, undefined);
  assert.equal([...h.rows.values()].filter(row => row.collection === 'asset_receipts' && row.value.sourceId.includes(encounterId)).length, 2);
  const outcome = [...h.rows.values()].find(row => row.collection === 'pve_settlements' && row.key === `outcome:${encounterId}:1`);
  assert.equal(outcome.value.status, 'settled');
});

test('pending encounter survives temporary storage-read failures and remains pending after recovery', () => {
  const h = harness();
  const state = h.init();
  h.join();
  h.scope.recordPveSonTruOutcome(h.nk, OWNER, state.encounterId, 1, true);
  state.phase = 'reward_pending';
  state.settlementStatus = 'pending';
  state.pendingCheckAt = 0;
  const storageRead = h.nk.storageRead;
  h.nk.storageRead = ids => {
    if (ids.some(id => id.collection === 'pve_settlements')) throw Error('temporary storage outage');
    return storageRead(ids);
  };

  assert.doesNotThrow(() => h.step());
  assert.equal(state.phase, 'reward_pending');
  assert.equal(state.settlementStatus, 'pending');
  h.nk.storageRead = storageRead;
  h.steps(20);
  assert.equal(state.phase, 'reward_pending');
  assert.equal(h.rpc('inventory_get').pendingSettlement.reward.items[0].itemId, 'it_boar_hide');
});

test('mortal training kill has no XP, loot, pending settlement or repeatable reward receipt', () => {
  const h = harness();
  const profile = profileFor(h, 'mortal');
  const state = h.init({rewardEligible: false, attack: 100});
  h.join();
  state.player.x = 635; state.player.y = 390;
  state.boar.x = 690; state.boar.y = 390; state.boar.mode = 'recover'; state.boar.since = 0;
  h.step([h.message({action: 'sk_basic'})]);
  h.steps(3);
  assert.equal(state.boar.hp, 0);
  assert.equal(state.phase, 'victory');
  assert.equal(state.settlementStatus, 'training');
  assert.equal(h.rpc('inventory_get').pendingSettlement, null);
  assert.equal(h.rpc('get_profile').cultivationXp, 0);
  assert.equal(h.rpc('get_profile').inventory.length, profile.inventory.length);
  assert.equal([...h.rows.values()].filter(row => row.collection === 'asset_receipts' && row.value.sourceId.startsWith('pve:')).length, 0);
});

test('LK victory checkpoints remaining HP in the same durable profile as XP and loot', () => {
  const h = harness();
  profileFor(h);
  const state = h.init({attack: 100, initialHp: 73});
  h.join();
  state.player.x = 635; state.player.y = 390; state.player.hp = 48;
  state.boar.x = 690; state.boar.y = 390; state.boar.mode = 'recover'; state.boar.since = 0;
  h.step([h.message({action: 'sk_basic'})]);
  h.steps(3);
  const saved = h.rpc('get_profile');
  assert.equal(saved.hp, 48);
  assert.equal(saved.cultivationXp, 10);
  assert.equal(saved.inventory.at(-1).itemId, 'it_boar_hide');
  assert.equal(state.phase, 'victory');
});

test('defeat preserves the last valid checkpoint HP while the match shows zero during recovery', () => {
  const h = harness();
  profileFor(h);
  const state = h.init({initialHp: 73});
  h.join();
  state.player.x = 675; state.player.y = 390; state.player.hp = 10;
  state.boar.x = 690; state.boar.y = 390; state.boar.mode = 'charging'; state.boar.faceX = -1; state.boar.faceY = 0; state.boar.since = -1;
  h.step();
  assert.equal(state.phase, 'defeated');
  assert.equal(state.player.hp, 0);
  assert.equal(h.rpc('get_profile').hp, 73);
});
