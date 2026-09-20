// Ephemeral, consent-only sparring. Never reads/writes PvE HP or assets.
const COMBAT = {
  version: 1, tickRate: 20, snapshotEvery: 2, speed: 180, radius: 12,
  minX: 40, maxX: 920, minY: 110, maxY: 440,
  wall: { x: 462, y: 200, w: 36, h: 100 },
  hp: 100, attack: 16, defense: 5, range: 41.6,
  windup: 3, active: 2, recovery: 5, basicCooldown: 14,
  dodgeTicks: 5, dodgeDistance: 70.4, dodgeCooldown: 48,
  inputTimeout: 4, reconnectTicks: 200, countdownTicks: 60,
  lobbyTicks: 2400, duelTicks: 6000, resultTicks: 600
};
type CombatInput = { seq: number; epoch: string; moveX: number; moveY: number; aimX: number; aimY: number; action: string };
type CombatPlayer = {
  id: string; presence: nkruntime.Presence | null; disconnectedAt: number;
  x: number; y: number; hp: number; faceX: number; faceY: number;
  ready: boolean; seq: number; lastInput: number; input: CombatInput | null;
  mode: string; since: number; attackAt: number; dodgeAt: number; hit: string[];
};
type CombatState = {
  epoch: string; owner: string; players: CombatPlayer[]; reservations: {id: string; session: string; tick: number}[];
  phase: string; phaseAt: number; winner: string; reason: string;
};
function combatPlayer(state: CombatState, id: string): CombatPlayer | undefined {
  for (let i = 0; i < state.players.length; i++) if (state.players[i].id === id) return state.players[i];
  return undefined;
}
function combatFinite(value: unknown): value is number { return typeof value === "number" && isFinite(value); }
function combatUnit(x: number, y: number): {x: number; y: number} {
  const length = Math.sqrt(x * x + y * y);
  return length > 1 ? {x: x / length, y: y / length} : {x: x, y: y};
}
function combatInput(nk: nkruntime.Nakama, message: nkruntime.MatchMessage, state: CombatState, p: CombatPlayer): CombatInput | null {
  if (message.opCode !== 1 || message.data.byteLength > 512) return null;
  let v: CombatInput;
  try { v = JSON.parse(nk.binaryToString(message.data)); } catch (_) { return null; }
  if (!v || v.epoch !== state.epoch || !combatFinite(v.seq) || v.seq % 1 !== 0 || v.seq <= p.seq || v.seq > 2147483647) return null;
  if (!combatFinite(v.moveX) || !combatFinite(v.moveY) || !combatFinite(v.aimX) || !combatFinite(v.aimY)) return null;
  if (Math.abs(v.moveX) > 1 || Math.abs(v.moveY) > 1 || Math.abs(v.aimX) > 1 || Math.abs(v.aimY) > 1) return null;
  if (["", "ready", "sk_basic", "sk_dodge"].indexOf(v.action) === -1) return null;
  return v;
}
function combatBlocked(x: number, y: number): boolean {
  const w = COMBAT.wall, r = COMBAT.radius;
  return x > w.x - r && x < w.x + w.w + r && y > w.y - r && y < w.y + w.h + r;
}
function combatMove(p: CombatPlayer, dx: number, dy: number): void {
  // Axis sliding and substeps prevent a dodge tunnelling through thin walls.
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 6));
  for (let i = 0; i < steps; i++) {
    const x = Math.max(COMBAT.minX, Math.min(COMBAT.maxX, p.x + dx / steps));
    if (!combatBlocked(x, p.y)) p.x = x;
    const y = Math.max(COMBAT.minY, Math.min(COMBAT.maxY, p.y + dy / steps));
    if (!combatBlocked(p.x, y)) p.y = y;
  }
}
function combatLineClear(a: CombatPlayer, b: CombatPlayer): boolean {
  const steps = Math.max(1, Math.ceil(Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2)) / 4));
  const w = COMBAT.wall;
  for (let i = 0; i <= steps; i++) {
    const x = a.x + (b.x - a.x) * i / steps, y = a.y + (b.y - a.y) * i / steps;
    if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) return false;
  }
  return true;
}
function combatSnapshot(state: CombatState, tick: number): string {
  return JSON.stringify({version: COMBAT.version, epoch: state.epoch, tick: tick, phase: state.phase,
    phaseAt: state.phaseAt, winner: state.winner, reason: state.reason, rules: COMBAT,
    players: state.players.map(function (p) { return {id: p.id, x: p.x, y: p.y, hp: p.hp,
      faceX: p.faceX, faceY: p.faceY, ready: p.ready, connected: !!p.presence, seq: p.seq,
      mode: p.mode, since: p.since, attackAt: p.attackAt, dodgeAt: p.dodgeAt}; })});
}
function combatBroadcast(dispatcher: nkruntime.MatchDispatcher, state: CombatState, tick: number): void {
  dispatcher.broadcastMessage(2, combatSnapshot(state, tick), null, null, true);
}
function combatFinish(state: CombatState, tick: number, winner: string, reason: string): void {
  if (state.phase === "finished") return;
  state.phase = "finished"; state.phaseAt = tick; state.winner = winner; state.reason = reason;
  state.players.forEach(function (p) { p.input = null; p.mode = p.hp <= 0 ? "dead" : "idle"; });
}
const combatCreateRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx), data = objectPayload(payload);
  if (data.consent !== true) fail(nkruntime.Codes.INVALID_ARGUMENT, "Sparring consent required");
  consumeQuota(nk, userId, "combat_create", 3, 60000);
  return JSON.stringify({matchId: nk.matchCreate("sparring", {owner: userId}), version: COMBAT.version});
};
const combatInit: nkruntime.MatchInitFunction<CombatState> = function (_ctx, _logger, nk, params) {
  return {tickRate: COMBAT.tickRate, label: JSON.stringify({mode: "sparring", version: COMBAT.version}),
    state: {epoch: nk.uuidv4(), owner: params.owner, players: [], reservations: [], phase: "waiting", phaseAt: 0, winner: "", reason: ""}};
};
const combatJoinAttempt: nkruntime.MatchJoinAttemptFunction<CombatState> = function (_ctx, _logger, _nk, _d, tick, state, presence, metadata) {
  const reject = function (message: string) { return {state: state, accept: false, rejectMessage: message}; };
  if (metadata.consent !== "true" || metadata.version !== String(COMBAT.version)) return reject("Consent and matching protocol required");
  if (state.phase === "finished") return reject("Match finished");
  state.reservations = state.reservations.filter(function (r) { return tick - r.tick < 100; });
  const old = combatPlayer(state, presence.userId);
  if (old && (old.presence || tick - old.disconnectedAt >= COMBAT.reconnectTicks)) return reject("Already connected or reconnect expired");
  if (state.reservations.some(function (r) { return r.id === presence.userId; })) return reject("Join already pending");
  if (!old) {
    if (state.phase !== "waiting") return reject("Match already started");
    const occupied = state.players.length + state.reservations.filter(function (r) { return !combatPlayer(state, r.id); }).length;
    if (occupied >= 2) return reject("Match full");
    const guestExists = state.players.some(function (p) { return p.id !== state.owner; }) || state.reservations.some(function (r) { return r.id !== state.owner; });
    if (presence.userId !== state.owner && guestExists) return reject("Owner slot reserved");
  }
  state.reservations.push({id: presence.userId, session: presence.sessionId, tick: tick});
  return {state: state, accept: true};
};
const combatJoin: nkruntime.MatchJoinFunction<CombatState> = function (_ctx, _logger, _nk, dispatcher, tick, state, presences) {
  presences.forEach(function (presence) {
    const reserved = state.reservations.some(function (r) { return r.id === presence.userId && r.session === presence.sessionId; });
    state.reservations = state.reservations.filter(function (r) { return r.session !== presence.sessionId; });
    if (!reserved) { dispatcher.matchKick([presence]); return; }
    let p = combatPlayer(state, presence.userId);
    if (!p) {
      const owner = presence.userId === state.owner;
      p = {id: presence.userId, presence: null, disconnectedAt: -1, x: owner ? 380 : 580, y: 350,
        hp: COMBAT.hp, faceX: owner ? 1 : -1, faceY: 0, ready: false, seq: -1, lastInput: tick,
        input: null, mode: "idle", since: tick, attackAt: 0, dodgeAt: 0, hit: []};
      state.players.push(p);
    }
    p.presence = presence; p.disconnectedAt = -1; p.input = null; p.seq = -1;
  });
  combatBroadcast(dispatcher, state, tick);
  return {state: state};
};
const combatLeave: nkruntime.MatchLeaveFunction<CombatState> = function (_ctx, _logger, _nk, dispatcher, tick, state, presences) {
  presences.forEach(function (presence) {
    const p = combatPlayer(state, presence.userId);
    if (p && p.presence && p.presence.sessionId === presence.sessionId) {
      p.presence = null; p.disconnectedAt = tick; p.input = null;
      if (state.phase === "waiting" || state.phase === "countdown") p.ready = false;
    }
  });
  if (state.phase === "countdown") { state.phase = "waiting"; state.phaseAt = tick; }
  combatBroadcast(dispatcher, state, tick);
  return {state: state};
};
function combatStep(p: CombatPlayer, tick: number): void {
  const input = p.input && tick - p.lastInput <= COMBAT.inputTimeout ? p.input : null;
  const action = input ? input.action : "";
  if (p.input) p.input.action = ""; // One intent is consumed only once.
  const age = tick - p.since;
  if (p.mode === "dodging" && age >= COMBAT.dodgeTicks) p.mode = "idle";
  if (p.mode === "windup" && age >= COMBAT.windup) p.mode = "active";
  if (p.mode === "active" && age >= COMBAT.windup + COMBAT.active) p.mode = "recovery";
  if (p.mode === "recovery" && age >= COMBAT.windup + COMBAT.active + COMBAT.recovery) p.mode = "idle";
  const free = p.mode === "idle" || p.mode === "moving";
  if (input && (free || p.mode === "windup") && (input.aimX || input.aimY)) {
    const length = Math.sqrt(input.aimX * input.aimX + input.aimY * input.aimY);
    p.faceX = input.aimX / length; p.faceY = input.aimY / length;
  }
  if (action === "sk_dodge" && (free || p.mode === "windup") && tick >= p.dodgeAt) {
    p.mode = "dodging"; p.since = tick; p.dodgeAt = tick + COMBAT.dodgeCooldown;
  } else if (action === "sk_basic" && free && tick >= p.attackAt) {
    p.mode = "windup"; p.since = tick; p.attackAt = tick + COMBAT.basicCooldown; p.hit = [];
  }
  if (p.mode === "dodging") combatMove(p, p.faceX * COMBAT.dodgeDistance / COMBAT.dodgeTicks, p.faceY * COMBAT.dodgeDistance / COMBAT.dodgeTicks);
  else if (p.mode === "idle" || p.mode === "moving") {
    const move = input ? combatUnit(input.moveX, input.moveY) : {x: 0, y: 0};
    combatMove(p, move.x * COMBAT.speed / COMBAT.tickRate, move.y * COMBAT.speed / COMBAT.tickRate);
    p.mode = move.x || move.y ? "moving" : "idle";
  }
}
const combatLoop: nkruntime.MatchLoopFunction<CombatState> = function (_ctx, _logger, nk, dispatcher, tick, state, messages) {
  if ((state.phase === "waiting" && tick >= COMBAT.lobbyTicks) || (state.phase === "finished" && tick - state.phaseAt >= COMBAT.resultTicks)) return null;
  const counts: {[id: string]: number} = {}, actions: {[id: string]: string} = {};
  messages.forEach(function (message) {
    const p = combatPlayer(state, message.sender.userId);
    if (!p || !p.presence || p.presence.sessionId !== message.sender.sessionId) return;
    counts[p.id] = (counts[p.id] || 0) + 1;
    if (counts[p.id] > 4 || state.phase === "finished") return;
    const input = combatInput(nk, message, state, p);
    if (!input) return;
    // Coalesced packets can contain movement, then a keypress, then movement.
    // Keep the first action and newest movement; still simulate only once/tick.
    if (!actions[p.id] && input.action) actions[p.id] = input.action;
    input.action = actions[p.id] || "";
    p.seq = input.seq; p.lastInput = tick;
    p.input = state.phase === "active" ? input : null;
    if (state.phase === "waiting" && input.action === "ready") p.ready = true;
  });
  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    if (!p.presence && tick - p.disconnectedAt >= COMBAT.reconnectTicks) {
      const other = state.players.filter(function (q) { return q.id !== p.id && !!q.presence; })[0];
      combatFinish(state, tick, other ? other.id : "", "disconnect");
    }
  }
  if (state.phase === "waiting" && state.players.length === 2 && state.players.every(function (p) { return p.ready && !!p.presence; })) {
    state.phase = "countdown"; state.phaseAt = tick;
  }
  if (state.phase === "countdown" && tick - state.phaseAt >= COMBAT.countdownTicks) {
    state.phase = "active"; state.phaseAt = tick;
    state.players.forEach(function (p) { p.input = null; });
  }
  if (state.phase === "active") {
    state.players.forEach(function (p) { combatStep(p, tick); });
    const damage: {[id: string]: number} = {};
    state.players.forEach(function (a) {
      if (a.mode !== "active") return;
      state.players.forEach(function (b) {
        if (a.id === b.id || a.hit.indexOf(b.id) >= 0 || b.hp <= 0) return;
        const dodgeAge = tick - b.since;
        if (b.mode === "dodging" && dodgeAge >= 1 && dodgeAge < 4) return;
        const dx = b.x - a.x, dy = b.y - a.y, distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > COMBAT.range + COMBAT.radius || (distance > 0 && (dx * a.faceX + dy * a.faceY) / distance < 0.5) || !combatLineClear(a, b)) return;
        a.hit.push(b.id);
        damage[b.id] = (damage[b.id] || 0) + Math.max(1, Math.floor(COMBAT.attack * 100 / (100 + COMBAT.defense)));
      });
    });
    state.players.forEach(function (p) { p.hp = Math.max(0, p.hp - (damage[p.id] || 0)); });
    const alive = state.players.filter(function (p) { return p.hp > 0; });
    if (alive.length < 2) combatFinish(state, tick, alive.length ? alive[0].id : "", alive.length ? "knockout" : "draw");
    else if (tick - state.phaseAt >= COMBAT.duelTicks) combatFinish(state, tick, "", "time_limit");
  }
  if (tick % COMBAT.snapshotEvery === 0) combatBroadcast(dispatcher, state, tick);
  return {state: state};
};
const combatTerminate: nkruntime.MatchTerminateFunction<CombatState> = function (_ctx, _logger, _nk, dispatcher, tick, state) {
  combatFinish(state, tick, "", "server_shutdown"); combatBroadcast(dispatcher, state, tick); return null;
};
const combatSignal: nkruntime.MatchSignalFunction<CombatState> = function (_ctx, _logger, _nk, _d, _tick, state) {
  return {state: state, data: "unsupported"};
};
