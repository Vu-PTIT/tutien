// Server-authoritative, solo Sơn Trư hunt. All movement, damage and kill checks run here.
const PVE_SON_TRU = {
  version: 1, tickRate: 20, snapshotEvery: 2,
  minX: 40, maxX: 920, minY: 205, maxY: 580, playerRadius: 12, boarRadius: 18,
  playerSpawn: {x: 270, y: 390}, boarSpawn: {x: 690, y: 390},
  moveSpeed: 180, attack: 16, defense: 5, boarHp: 60, boarAttack: 22, boarDefense: 5,
  attackRange: 42, attackWindup: 3, attackActive: 2, attackRecovery: 5, attackCooldown: 14,
  dodgeTicks: 5, dodgeDistance: 70, dodgeCooldown: 48, dodgeIFramesStart: 1, dodgeIFramesEnd: 4,
  inputTimeout: 4, reconnectTicks: 200, resultTicks: 100, defeatResetTicks: 60,
  boarNoticeRange: 220, boarTellTicks: 15, boarChargeTicks: 15, boarChargeDistance: 128,
  boarRecoverTicks: 24, spawnCooldownMs: 45000
};
type PveSonTruInput = {seq: number; epoch: string; moveX: number; moveY: number; aimX: number; aimY: number; action: string};
type PveSonTruPlayer = {
  id: string; presence: nkruntime.Presence | null; disconnectedAt: number;
  x: number; y: number; hp: number; faceX: number; faceY: number; attack: number; defense: number;
  seq: number; lastInput: number; input: PveSonTruInput | null; mode: string; since: number;
  attackAt: number; dodgeAt: number; hitBoar: boolean;
};
type PveSonTruBoar = {x: number; y: number; hp: number; faceX: number; faceY: number; mode: string; since: number; hit: boolean};
type PveSonTruState = {
  epoch: string; owner: string; encounterId: string; spawnGeneration: number; rewardEligible: boolean; initialHp: number;
  settlementStatus: string; settlementXp: number; settlementItems: {itemId: string; quantity: number}[];
  pendingCheckAt: number; hpCheckpointPending: boolean; hpCheckpointAt: number; hpCheckpointValue: number;
  player: PveSonTruPlayer; boar: PveSonTruBoar;
  reservations: {id: string; session: string; tick: number}[]; phase: string; phaseAt: number; reason: string;
};
function pveSonTruFinite(value: unknown): value is number { return typeof value === "number" && isFinite(value); }
function pveSonTruUnit(x: number, y: number): {x: number; y: number} {
  const length = Math.sqrt(x * x + y * y);
  return length > 1 ? {x: x / length, y: y / length} : {x: x, y: y};
}
function pveSonTruDistance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
}
function pveSonTruDamage(attack: number, defense: number): number {
  return Math.max(1, Math.floor(attack * 100 / (100 + defense)));
}
function pveSonTruMove(actor: {x: number; y: number}, dx: number, dy: number, radius: number): void {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 5));
  for (let i = 0; i < steps; i++) {
    actor.x = Math.max(PVE_SON_TRU.minX + radius, Math.min(PVE_SON_TRU.maxX - radius, actor.x + dx / steps));
    actor.y = Math.max(PVE_SON_TRU.minY + radius, Math.min(PVE_SON_TRU.maxY - radius, actor.y + dy / steps));
  }
}
function pveSonTruInput(nk: nkruntime.Nakama, message: nkruntime.MatchMessage, state: PveSonTruState): PveSonTruInput | null {
  const p = state.player;
  if (message.opCode !== 1 || !message.data || message.data.byteLength > 512 ||
      message.sender.userId !== p.id || !p.presence || message.sender.sessionId !== p.presence.sessionId) return null;
  let input: PveSonTruInput;
  try { input = JSON.parse(nk.binaryToString(message.data)); } catch (_error) { return null; }
  if (!input || input.epoch !== state.epoch || !pveSonTruFinite(input.seq) || input.seq % 1 !== 0 || input.seq <= p.seq || input.seq > 2147483647 ||
      !pveSonTruFinite(input.moveX) || !pveSonTruFinite(input.moveY) || !pveSonTruFinite(input.aimX) || !pveSonTruFinite(input.aimY) ||
      Math.abs(input.moveX) > 1 || Math.abs(input.moveY) > 1 || Math.abs(input.aimX) > 1 || Math.abs(input.aimY) > 1 ||
      ["", "sk_basic", "sk_dodge"].indexOf(input.action) < 0) return null;
  return input;
}
function pveSonTruSnapshot(state: PveSonTruState, tick: number): string {
  const p = state.player, b = state.boar;
  return JSON.stringify({version: PVE_SON_TRU.version, mode: "pve_son_tru", epoch: state.epoch, tick: tick,
    phase: state.phase, phaseAt: state.phaseAt, reason: state.reason, spawnGeneration: state.spawnGeneration,
    settlement: state.settlementStatus ? {status: state.settlementStatus, cultivationXp: state.settlementXp, items: state.settlementItems} : null,
    rules: PVE_SON_TRU,
    players: [{id: p.id, x: p.x, y: p.y, hp: p.hp, faceX: p.faceX, faceY: p.faceY,
      attack: p.attack, defense: p.defense, connected: !!p.presence, seq: p.seq,
      mode: p.mode, since: p.since, attackAt: p.attackAt, dodgeAt: p.dodgeAt}],
    boar: {id: "en_boar", x: b.x, y: b.y, hp: b.hp, maxHp: PVE_SON_TRU.boarHp,
      faceX: b.faceX, faceY: b.faceY, mode: b.mode, since: b.since, hit: b.hit}});
}
function pveSonTruBroadcast(dispatcher: nkruntime.MatchDispatcher, state: PveSonTruState, tick: number): void {
  dispatcher.broadcastMessage(2, pveSonTruSnapshot(state, tick), null, null, true);
}
function pveSonTruFinish(state: PveSonTruState, tick: number, reason: string): void {
  if (state.phase === "finished") return;
  state.phase = "finished"; state.phaseAt = tick; state.reason = reason;
  state.player.input = null; state.player.mode = state.player.hp <= 0 ? "dead" : "idle";
}
function pveSonTruReset(state: PveSonTruState, tick: number): void {
  state.spawnGeneration++; state.settlementStatus = ""; state.settlementXp = 0; state.settlementItems = []; state.pendingCheckAt = 0;
  const p = state.player, b = state.boar;
  p.x = PVE_SON_TRU.playerSpawn.x; p.y = PVE_SON_TRU.playerSpawn.y; p.hp = state.initialHp;
  p.faceX = 1; p.faceY = 0; p.mode = "idle"; p.since = tick; p.input = null; p.hitBoar = false;
  p.attackAt = tick; p.dodgeAt = tick;
  b.x = PVE_SON_TRU.boarSpawn.x; b.y = PVE_SON_TRU.boarSpawn.y; b.hp = PVE_SON_TRU.boarHp;
  b.faceX = -1; b.faceY = 0; b.mode = "idle"; b.since = tick; b.hit = false;
  state.phase = "active"; state.phaseAt = tick; state.reason = "respawn";
}
const pveSonTruCreateRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx), input = objectPayload(payload);
  if (input.consent !== true || Object.keys(input).some(function (key) { return key !== "consent"; })) return fail(nkruntime.Codes.INVALID_ARGUMENT, "PvE consent required; no client reward fields are accepted");
  if (getPvePendingSettlement(nk, userId)) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED, "Claim the pending reward before another hunt");
  consumeQuota(nk, userId, "pve_son_tru_create", 3, 60000);
  const profile = loadCharacter(nk, userId).state;
  const request = {collection: "pve_son_tru_sessions", key: "active", userId: userId};
  const previous = nk.storageRead([request])[0];
  if (previous && previous.value.status === "creating" && Date.now() - Number(previous.value.createdAt) < 30000) return fail(nkruntime.Codes.ABORTED, "Encounter is being prepared; retry shortly");
  if (previous && previous.value.status === "active" && typeof previous.value.matchId === "string") {
    const existing = nk.matchGet(previous.value.matchId);
    if (existing) return JSON.stringify({matchId: previous.value.matchId, version: PVE_SON_TRU.version, mode: "pve_son_tru", encounter: "en_boar", resumed: true});
  }
  if (previous && Number(previous.value.nextSpawnAt) > Date.now()) {
    const seconds = Math.ceil((Number(previous.value.nextSpawnAt) - Date.now()) / 1000);
    return fail(nkruntime.Codes.RESOURCE_EXHAUSTED, "Sơn Trư respawns in " + seconds + " seconds");
  }
  let attack = PVE_SON_TRU.attack, defense = PVE_SON_TRU.defense;
  for (let i = 0; i < profile.inventory.length; i++) {
    const item = profile.inventory[i], definition = catalogItem(item.itemId);
    if (item.instanceId === profile.equipped.weapon && definition.equipSlot === "weapon") attack += Number(definition.attackBonus || 0);
    if (item.instanceId === profile.equipped.armor && definition.equipSlot === "armor") defense += Number(definition.defenseBonus || 0);
  }
  const encounterId = nk.uuidv4();
  try {
    nk.storageWrite([{collection: request.collection, key: request.key, userId: userId,
      value: {status: "creating", encounterId: encounterId, matchId: "", createdAt: Date.now(), nextSpawnAt: Number(previous && previous.value.nextSpawnAt) || 0},
      version: previous ? previous.version : "*", permissionRead: 0, permissionWrite: 0}]);
  } catch (_error) { return fail(nkruntime.Codes.ABORTED, "Another encounter is already active; retry"); }
  let matchId: string;
  try {
    matchId = nk.matchCreate("pve_son_tru", {owner: userId, encounterId: encounterId,
      rewardEligible: profile.realm === "luyen_khi", initialHp: profile.hp, attack: attack, defense: defense});
  } catch (_error) {
    const current = nk.storageRead([request])[0];
    if (current && current.value.encounterId === encounterId) {
      try { nk.storageWrite([{collection: request.collection, key: request.key, userId: userId,
        value: {status: "closed", encounterId: encounterId, matchId: "", nextSpawnAt: 0}, version: current.version,
        permissionRead: 0, permissionWrite: 0}]); } catch (_ignored) { /* The creation lease expires and can be replaced. */ }
    }
    return fail(nkruntime.Codes.UNAVAILABLE, "Encounter could not be started; retry");
  }
  const creating = nk.storageRead([request])[0];
  try {
    nk.storageWrite([{collection: request.collection, key: request.key, userId: userId,
      value: {status: "active", encounterId: encounterId, matchId: matchId, createdAt: Date.now(),
        nextSpawnAt: Number(creating.value.nextSpawnAt) || 0}, version: creating.version, permissionRead: 0, permissionWrite: 0}]);
  } catch (_error) { return fail(nkruntime.Codes.UNAVAILABLE, "Encounter started; retry to resume it"); }
  return JSON.stringify({matchId: matchId, version: PVE_SON_TRU.version, mode: "pve_son_tru", encounter: "en_boar"});
};
const pveSonTruInit: nkruntime.MatchInitFunction<PveSonTruState> = function (_ctx, _logger, nk, params) {
  const initialHp = pveSonTruFinite(params.initialHp) ? Math.max(1, Math.min(100, Math.floor(params.initialHp))) : 100;
  return {tickRate: PVE_SON_TRU.tickRate, label: JSON.stringify({mode: "pve_son_tru", encounter: "en_boar", version: PVE_SON_TRU.version}),
    state: {epoch: nk.uuidv4(), owner: params.owner, encounterId: params.encounterId || nk.uuidv4(), spawnGeneration: 1,
      rewardEligible: params.rewardEligible === true, initialHp: initialHp, settlementStatus: "", settlementXp: 0,
      settlementItems: [], pendingCheckAt: 0,
      hpCheckpointPending: false, hpCheckpointAt: 0, hpCheckpointValue: initialHp,
      player: {id: params.owner, presence: null, disconnectedAt: -1, x: PVE_SON_TRU.playerSpawn.x, y: PVE_SON_TRU.playerSpawn.y,
        hp: initialHp, faceX: 1, faceY: 0, attack: pveSonTruFinite(params.attack) ? Math.max(1, Math.min(100, Math.floor(params.attack))) : PVE_SON_TRU.attack,
        defense: pveSonTruFinite(params.defense) ? Math.max(0, Math.min(100, Math.floor(params.defense))) : PVE_SON_TRU.defense,
        seq: -1, lastInput: 0, input: null, mode: "idle", since: 0, attackAt: 0, dodgeAt: 0, hitBoar: false},
      boar: {x: PVE_SON_TRU.boarSpawn.x, y: PVE_SON_TRU.boarSpawn.y, hp: PVE_SON_TRU.boarHp,
        faceX: -1, faceY: 0, mode: "idle", since: 0, hit: false},
      reservations: [], phase: "waiting", phaseAt: 0, reason: ""}};
};
const pveSonTruJoinAttempt: nkruntime.MatchJoinAttemptFunction<PveSonTruState> = function (_ctx, _logger, _nk, _dispatcher, tick, state, presence, metadata) {
  const reject = function (message: string) { return {state: state, accept: false, rejectMessage: message}; };
  if (metadata.consent !== "true" || metadata.mode !== "pve_son_tru" || metadata.version !== String(PVE_SON_TRU.version)) return reject("PvE consent and protocol required");
  if (presence.userId !== state.owner || state.phase === "finished") return reject("This hunt belongs to its creator");
  state.reservations = state.reservations.filter(function (r) { return tick - r.tick < 100; });
  if (state.player.presence || (state.player.disconnectedAt >= 0 && tick - state.player.disconnectedAt >= PVE_SON_TRU.reconnectTicks) ||
      state.reservations.some(function (r) { return r.id === presence.userId; })) return reject("Already connected or reconnect window expired");
  state.reservations.push({id: presence.userId, session: presence.sessionId, tick: tick});
  return {state: state, accept: true};
};
const pveSonTruJoin: nkruntime.MatchJoinFunction<PveSonTruState> = function (_ctx, _logger, _nk, dispatcher, tick, state, presences) {
  presences.forEach(function (presence) {
    const reserved = state.reservations.some(function (r) { return r.id === presence.userId && r.session === presence.sessionId; });
    state.reservations = state.reservations.filter(function (r) { return r.session !== presence.sessionId; });
    if (!reserved || presence.userId !== state.owner) { dispatcher.matchKick([presence]); return; }
    state.player.presence = presence; state.player.disconnectedAt = -1; state.player.input = null; state.player.seq = -1;
    if (state.phase === "waiting") { state.phase = "active"; state.phaseAt = tick; }
  });
  pveSonTruBroadcast(dispatcher, state, tick);
  return {state: state};
};
const pveSonTruLeave: nkruntime.MatchLeaveFunction<PveSonTruState> = function (_ctx, _logger, nk, dispatcher, tick, state, presences) {
  presences.forEach(function (presence) {
    const p = state.player;
    if (p.presence && p.presence.sessionId === presence.sessionId && p.presence.userId === presence.userId) {
      p.presence = null; p.disconnectedAt = tick; p.input = null; p.mode = p.hp <= 0 ? "dead" : "idle"; p.since = tick;
      if (p.hp > 0) {
        state.hpCheckpointValue = p.hp;
        try { saveCharacterHp(nk, p.id, state.hpCheckpointValue); }
        catch (_error) { state.hpCheckpointPending = true; state.hpCheckpointAt = tick + PVE_SON_TRU.tickRate; }
      }
    }
  });
  pveSonTruBroadcast(dispatcher, state, tick);
  return {state: state};
};
function pveSonTruCloseSession(nk: nkruntime.Nakama, state: PveSonTruState): void {
  const request = {collection: "pve_son_tru_sessions", key: "active", userId: state.owner};
  const row = nk.storageRead([request])[0];
  if (!row || row.value.status !== "active" || row.value.encounterId !== state.encounterId) return;
  try {
    nk.storageWrite([{collection: request.collection, key: request.key, userId: state.owner,
      value: {status: "closed", encounterId: state.encounterId, matchId: row.value.matchId,
        nextSpawnAt: Number(row.value.nextSpawnAt) || 0, lastSpawnGeneration: Number(row.value.lastSpawnGeneration) || 0,
        closedAt: Date.now()}, version: row.version, permissionRead: 0, permissionWrite: 0}]);
  } catch (_error) { /* A later create checks matchGet and the durable cooldown. */ }
}
function pveSonTruStepPlayer(p: PveSonTruPlayer, b: PveSonTruBoar, tick: number): void {
  if (!p.presence || p.hp <= 0) { p.input = null; return; }
  const input = p.input && tick - p.lastInput <= PVE_SON_TRU.inputTimeout ? p.input : null;
  const action = input ? input.action : "";
  if (p.input) p.input.action = "";
  const age = tick - p.since;
  if (p.mode === "dodging" && age >= PVE_SON_TRU.dodgeTicks) p.mode = "idle";
  if (p.mode === "windup" && age >= PVE_SON_TRU.attackWindup) p.mode = "active";
  if (p.mode === "active" && age >= PVE_SON_TRU.attackWindup + PVE_SON_TRU.attackActive) p.mode = "recovery";
  if (p.mode === "recovery" && age >= PVE_SON_TRU.attackWindup + PVE_SON_TRU.attackActive + PVE_SON_TRU.attackRecovery) p.mode = "idle";
  const free = p.mode === "idle" || p.mode === "moving";
  if (input && (free || p.mode === "windup") && (input.aimX || input.aimY)) {
    const aim = pveSonTruUnit(input.aimX, input.aimY); p.faceX = aim.x; p.faceY = aim.y;
  }
  if (action === "sk_dodge" && (free || p.mode === "windup") && tick >= p.dodgeAt) {
    p.mode = "dodging"; p.since = tick; p.dodgeAt = tick + PVE_SON_TRU.dodgeCooldown;
  } else if (action === "sk_basic" && free && tick >= p.attackAt) {
    p.mode = "windup"; p.since = tick; p.attackAt = tick + PVE_SON_TRU.attackCooldown; p.hitBoar = false;
  }
  if (p.mode === "dodging") pveSonTruMove(p, p.faceX * PVE_SON_TRU.dodgeDistance / PVE_SON_TRU.dodgeTicks,
    p.faceY * PVE_SON_TRU.dodgeDistance / PVE_SON_TRU.dodgeTicks, PVE_SON_TRU.playerRadius);
  else if (p.mode === "idle" || p.mode === "moving") {
    const move = input ? pveSonTruUnit(input.moveX, input.moveY) : {x: 0, y: 0};
    pveSonTruMove(p, move.x * PVE_SON_TRU.moveSpeed / PVE_SON_TRU.tickRate,
      move.y * PVE_SON_TRU.moveSpeed / PVE_SON_TRU.tickRate, PVE_SON_TRU.playerRadius);
    p.mode = move.x || move.y ? "moving" : "idle";
  }
  if (p.mode === "active" && !p.hitBoar && b.hp > 0 && b.mode === "recover") {
    const dx = b.x - p.x, dy = b.y - p.y, distance = pveSonTruDistance(p.x, p.y, b.x, b.y);
    if (distance <= PVE_SON_TRU.attackRange + PVE_SON_TRU.boarRadius &&
        (distance === 0 || (dx * p.faceX + dy * p.faceY) / distance >= 0.5)) {
      p.hitBoar = true; b.hp = Math.max(0, b.hp - pveSonTruDamage(p.attack, PVE_SON_TRU.boarDefense));
    }
  }
}
function pveSonTruStepBoar(b: PveSonTruBoar, p: PveSonTruPlayer, tick: number): void {
  if (b.hp <= 0 || !p.presence) return;
  const age = tick - b.since;
  if (b.mode === "idle") {
    const dx = p.x - b.x, dy = p.y - b.y, distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= PVE_SON_TRU.boarNoticeRange) {
      const direction = pveSonTruUnit(dx, dy); b.faceX = direction.x; b.faceY = direction.y;
      b.mode = "tell"; b.since = tick; b.hit = false;
    }
  } else if (b.mode === "tell" && age >= PVE_SON_TRU.boarTellTicks) {
    b.mode = "charging"; b.since = tick; b.hit = false;
  } else if (b.mode === "charging") {
    if (age >= PVE_SON_TRU.boarChargeTicks) { b.mode = "recover"; b.since = tick; return; }
    pveSonTruMove(b, b.faceX * PVE_SON_TRU.boarChargeDistance / PVE_SON_TRU.boarChargeTicks,
      b.faceY * PVE_SON_TRU.boarChargeDistance / PVE_SON_TRU.boarChargeTicks, PVE_SON_TRU.boarRadius);
    if (!b.hit && pveSonTruDistance(b.x, b.y, p.x, p.y) <= PVE_SON_TRU.boarRadius + PVE_SON_TRU.playerRadius) {
      b.hit = true;
      const dodgeAge = tick - p.since;
      if (!(p.mode === "dodging" && dodgeAge >= PVE_SON_TRU.dodgeIFramesStart && dodgeAge < PVE_SON_TRU.dodgeIFramesEnd)) {
        p.hp = Math.max(0, p.hp - pveSonTruDamage(PVE_SON_TRU.boarAttack, p.defense));
      }
      b.mode = "recover"; b.since = tick;
    }
  } else if (b.mode === "recover" && age >= PVE_SON_TRU.boarRecoverTicks) {
    b.mode = "idle"; b.since = tick;
  }
}
const pveSonTruLoop: nkruntime.MatchLoopFunction<PveSonTruState> = function (_ctx, _logger, nk, dispatcher, tick, state, messages) {
  if ((state.phase === "finished" && tick - state.phaseAt >= PVE_SON_TRU.resultTicks) ||
      (state.phase === "waiting" && tick >= PVE_SON_TRU.reconnectTicks)) { pveSonTruCloseSession(nk, state); return null; }
  const p = state.player, counts: {[id: string]: number} = {};
  messages.forEach(function (message) {
    if (!p.presence || message.sender.userId !== p.id || message.sender.sessionId !== p.presence.sessionId) return;
    counts[p.id] = (counts[p.id] || 0) + 1;
    if (counts[p.id] > 4 || state.phase !== "active") return;
    const input = pveSonTruInput(nk, message, state);
    if (!input) return;
    p.seq = input.seq; p.lastInput = tick; p.input = input;
  });
  if (!p.presence && p.disconnectedAt >= 0 && tick - p.disconnectedAt >= PVE_SON_TRU.reconnectTicks) pveSonTruFinish(state, tick, "disconnect");
  if (state.phase === "finished") pveSonTruCloseSession(nk, state);
  if (state.phase === "active") {
    pveSonTruStepPlayer(p, state.boar, tick);
    pveSonTruStepBoar(state.boar, p, tick);
    if (p.hp <= 0) {
      p.mode = "dead"; state.phase = "defeated"; state.phaseAt = tick; state.reason = "respawn";
      state.hpCheckpointValue = state.initialHp;
      state.hpCheckpointPending = true; state.hpCheckpointAt = tick;
    }
    else if (state.boar.hp <= 0) {
      state.boar.mode = "dead"; state.phaseAt = tick;
      state.hpCheckpointValue = p.hp;
      state.hpCheckpointPending = true; state.hpCheckpointAt = tick;
      if (state.rewardEligible) { state.phase = "settlement_saving"; state.reason = "saving_result"; state.settlementStatus = "saving"; }
      else { state.phase = "victory"; state.reason = "tutorial_complete"; state.settlementStatus = "training"; }
    }
  } else if (state.phase === "defeated" && tick - state.phaseAt >= PVE_SON_TRU.defeatResetTicks) {
    pveSonTruReset(state, tick); state.hpCheckpointValue = p.hp; state.hpCheckpointPending = true; state.hpCheckpointAt = tick;
  } else if (state.phase === "victory" && tick - state.phaseAt >= PVE_SON_TRU.resultTicks) {
    pveSonTruFinish(state, tick, "encounter_complete"); pveSonTruCloseSession(nk, state);
  }
  if (state.hpCheckpointPending && tick >= state.hpCheckpointAt) {
    try { saveCharacterHp(nk, state.owner, state.hpCheckpointValue); state.hpCheckpointPending = false; }
    catch (_error) { state.hpCheckpointAt = tick + PVE_SON_TRU.tickRate; }
  }
  if ((state.phase === "settlement_saving" || state.phase === "settling") && tick >= state.pendingCheckAt) {
    try {
      const outcome = recordPveSonTruOutcome(nk, state.owner, state.encounterId, state.spawnGeneration, state.rewardEligible);
      state.settlementStatus = "pending"; state.settlementXp = Number(outcome.reward.cultivationXp || 0); state.settlementItems = outcome.reward.items;
      state.phase = "settling";
      const result = pveClaimPending(nk, state.owner) as {[key: string]: any};
      if (!result.pending && result.receipt) {
        const granted = result.receipt.granted || {};
        state.settlementStatus = "claimed"; state.settlementXp = Number(granted.cultivationXp || 0);
        state.settlementItems = granted.items || []; state.phase = "victory"; state.phaseAt = tick; state.reason = "reward_claimed";
      }
    } catch (error) {
      const code = error && typeof error === "object" ? Number((error as {[key: string]: any}).code) : 0;
      if (code === nkruntime.Codes.RESOURCE_EXHAUSTED) {
        state.phase = "reward_pending"; state.reason = "inventory_full"; state.settlementStatus = "pending";
        state.pendingCheckAt = tick + PVE_SON_TRU.tickRate;
      } else { state.phase = "settlement_saving"; state.reason = "saving_result"; state.settlementStatus = "saving"; state.pendingCheckAt = tick + PVE_SON_TRU.tickRate; }
    }
  } else if (state.phase === "reward_pending" && tick >= state.pendingCheckAt) {
    state.pendingCheckAt = tick + PVE_SON_TRU.tickRate;
    try {
      if (!getPvePendingSettlement(nk, state.owner)) {
        state.phase = "victory"; state.phaseAt = tick; state.reason = "reward_claimed"; state.settlementStatus = "claimed";
      }
    } catch (_error) {
      // A temporary storage read failure must not end the encounter or drop its pending state.
    }
  }
  if (tick % PVE_SON_TRU.snapshotEvery === 0) pveSonTruBroadcast(dispatcher, state, tick);
  return {state: state};
};
const pveSonTruTerminate: nkruntime.MatchTerminateFunction<PveSonTruState> = function (_ctx, _logger, nk, dispatcher, tick, state) {
  pveSonTruFinish(state, tick, "server_shutdown"); pveSonTruCloseSession(nk, state);
  if (state.player.hp > 0) {
    try { saveCharacterHp(nk, state.owner, state.player.hp); }
    catch (_error) { /* Shutdown cannot wait on an unavailable profile store. */ }
  } else if (state.hpCheckpointPending) {
    try { saveCharacterHp(nk, state.owner, state.hpCheckpointValue); }
    catch (_error) { /* Preserve the last valid checkpoint when the player is down. */ }
  }
  pveSonTruBroadcast(dispatcher, state, tick); return null;
};
const pveSonTruSignal: nkruntime.MatchSignalFunction<PveSonTruState> = function (_ctx, _logger, _nk, _dispatcher, tick, state, data) {
  let signal: {[key: string]: any} = {};
  try { signal = JSON.parse(data || "{}"); } catch (_error) { return {state: state, data: "invalid"}; }
  if (signal.action === "reward_claimed" && signal.encounterId === state.encounterId && state.phase === "reward_pending") {
    const granted = signal.granted || {};
    state.settlementStatus = "claimed"; state.settlementXp = Number(granted.cultivationXp || 0);
    state.settlementItems = Array.isArray(granted.items) ? granted.items : [];
    state.phase = "victory"; state.phaseAt = tick; state.reason = "reward_claimed";
  }
  return {state: state, data: "ok"};
};
const pveSonTruMatch: nkruntime.MatchHandler<PveSonTruState> = {
  matchInit: pveSonTruInit, matchJoinAttempt: pveSonTruJoinAttempt, matchJoin: pveSonTruJoin,
  matchLeave: pveSonTruLeave, matchLoop: pveSonTruLoop, matchTerminate: pveSonTruTerminate, matchSignal: pveSonTruSignal
};
