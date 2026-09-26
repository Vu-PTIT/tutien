// A single-player, server-authoritative combat lesson. It never settles rewards.
const PVE_SON_TRU = {
  version: 1, mode: "pve_son_tru", tickRate: 20, snapshotEvery: 2,
  worldWidth: 960, worldHeight: 540,
  minX: 40, maxX: 920, minY: 110, maxY: 440,
  obstacles: [{id: "fallen_log", x: 450, y: 256, w: 112, h: 24, spriteTile: 59}],
  playerSpawn: {x: 280, y: 340}, boarSpawn: {x: 690, y: 300},
  playerRadius: 12, playerHp: 100, playerSpeed: 180, playerAttack: 16, playerDefense: 5,
  boarRadius: 18, boarHp: 60, boarAttack: 10, boarDefense: 5,
  attackRange: 44, basicWindup: 3, basicActive: 2, basicRecovery: 5, basicCooldown: 14,
  dodgeTicks: 5, dodgeDistance: 70.4, dodgeCooldown: 48, dodgeInvulnStart: 1, dodgeInvulnEnd: 4,
  inputTimeout: 4, reconnectTicks: 200, lobbyTicks: 2400, resultTicks: 600,
  detectRange: 160, chaseLeash: 320, noticeTicks: 8, chaseSpeed: 96,
  chargeRange: 150, tellTicks: 15, chargeTicks: 8, chargeDistance: 128,
  recoverTicks: 16, defeatResetTicks: 60, respawnTicks: 900
};

type PveSonTruInput = {
  epoch: string; seq: number; moveX: number; moveY: number;
  aimX: number; aimY: number; action: string;
};
type PveSonTruPlayer = {
  id: string; presence: nkruntime.Presence | null; disconnectedAt: number;
  x: number; y: number; hp: number; faceX: number; faceY: number;
  dodgeX: number; dodgeY: number; seq: number; lastInput: number;
  input: PveSonTruInput | null; mode: string; since: number;
  attackAt: number; dodgeAt: number; hitBoar: boolean;
};
type PveSonTruBoar = {
  x: number; y: number; hp: number; faceX: number; faceY: number;
  mode: string; since: number; hit: boolean;
};
type PveSonTruReservation = {id: string; session: string; tick: number};
type PveSonTruState = {
  epoch: string; owner: string; player: PveSonTruPlayer; boar: PveSonTruBoar;
  reservations: PveSonTruReservation[]; phase: string; phaseAt: number; reason: string;
};

function pveSonTruFinite(value: unknown): value is number {
  return typeof value === "number" && isFinite(value);
}
function pveSonTruDistance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay));
}
function pveSonTruUnit(x: number, y: number): {x: number; y: number} {
  const length = Math.sqrt(x * x + y * y);
  return length > 1 ? {x: x / length, y: y / length} : {x: x, y: y};
}
function pveSonTruInput(nk: nkruntime.Nakama, message: nkruntime.MatchMessage, state: PveSonTruState, p: PveSonTruPlayer): PveSonTruInput | null {
  if (message.opCode !== 1 || !message.data || message.data.byteLength > 512) return null;
  let value: PveSonTruInput;
  try { value = JSON.parse(nk.binaryToString(message.data)); } catch (_) { return null; }
  if (!value || value.epoch !== state.epoch || !pveSonTruFinite(value.seq) || value.seq % 1 !== 0 || value.seq <= p.seq || value.seq > 2147483647) return null;
  if (!pveSonTruFinite(value.moveX) || !pveSonTruFinite(value.moveY) || !pveSonTruFinite(value.aimX) || !pveSonTruFinite(value.aimY)) return null;
  if (Math.abs(value.moveX) > 1 || Math.abs(value.moveY) > 1 || Math.abs(value.aimX) > 1 || Math.abs(value.aimY) > 1) return null;
  if (["", "sk_basic", "sk_dodge"].indexOf(value.action) < 0) return null;
  return value;
}
function pveSonTruBlocked(x: number, y: number, radius: number): boolean {
  if (x < PVE_SON_TRU.minX + radius || x > PVE_SON_TRU.maxX - radius ||
      y < PVE_SON_TRU.minY + radius || y > PVE_SON_TRU.maxY - radius) return true;
  for (let i = 0; i < PVE_SON_TRU.obstacles.length; i++) {
    const obstacle = PVE_SON_TRU.obstacles[i];
    if (x > obstacle.x - radius && x < obstacle.x + obstacle.w + radius &&
        y > obstacle.y - radius && y < obstacle.y + obstacle.h + radius) return true;
  }
  return false;
}
function pveSonTruMove(x: number, y: number, dx: number, dy: number, radius: number): {x: number; y: number} {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 6));
  for (let i = 0; i < steps; i++) {
    const nextX = Math.max(PVE_SON_TRU.minX + radius, Math.min(PVE_SON_TRU.maxX - radius, x + dx / steps));
    if (!pveSonTruBlocked(nextX, y, radius)) x = nextX;
    const nextY = Math.max(PVE_SON_TRU.minY + radius, Math.min(PVE_SON_TRU.maxY - radius, y + dy / steps));
    if (!pveSonTruBlocked(x, nextY, radius)) y = nextY;
  }
  return {x: x, y: y};
}
function pveSonTruLineClear(ax: number, ay: number, bx: number, by: number): boolean {
  const steps = Math.max(1, Math.ceil(pveSonTruDistance(ax, ay, bx, by) / 4));
  for (let i = 1; i < steps; i++) {
    const x = ax + (bx - ax) * i / steps, y = ay + (by - ay) * i / steps;
    for (let j = 0; j < PVE_SON_TRU.obstacles.length; j++) {
      const obstacle = PVE_SON_TRU.obstacles[j];
      if (x >= obstacle.x && x <= obstacle.x + obstacle.w && y >= obstacle.y && y <= obstacle.y + obstacle.h) return false;
    }
  }
  return true;
}
function pveSonTruSegmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay, lengthSq = dx * dx + dy * dy;
  const t = lengthSq > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq)) : 0;
  return pveSonTruDistance(px, py, ax + t * dx, ay + t * dy);
}
function pveSonTruDamage(attack: number, defense: number): number {
  return Math.max(1, Math.floor(attack * 100 / (100 + defense)));
}
function pveSonTruSnapshot(state: PveSonTruState, tick: number): string {
  const p = state.player, b = state.boar;
  return JSON.stringify({version: PVE_SON_TRU.version, mode: PVE_SON_TRU.mode, epoch: state.epoch, tick: tick,
    phase: state.phase, phaseAt: state.phaseAt, reason: state.reason, rules: PVE_SON_TRU,
    players: [{id: p.id, x: p.x, y: p.y, hp: p.hp, faceX: p.faceX, faceY: p.faceY,
      connected: !!p.presence, seq: p.seq, mode: p.mode, since: p.since, attackAt: p.attackAt, dodgeAt: p.dodgeAt}],
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
  const p = state.player, b = state.boar;
  p.x = PVE_SON_TRU.playerSpawn.x; p.y = PVE_SON_TRU.playerSpawn.y; p.hp = PVE_SON_TRU.playerHp;
  p.faceX = 1; p.faceY = 0; p.dodgeX = 1; p.dodgeY = 0; p.mode = "idle"; p.since = tick;
  p.input = null; p.hitBoar = false; p.attackAt = tick; p.dodgeAt = tick;
  b.x = PVE_SON_TRU.boarSpawn.x; b.y = PVE_SON_TRU.boarSpawn.y; b.hp = PVE_SON_TRU.boarHp;
  b.faceX = -1; b.faceY = 0; b.mode = "idle"; b.since = tick; b.hit = false;
  state.phase = "active"; state.phaseAt = tick; state.reason = "";
}
const pveSonTruCreateRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx), data = objectPayload(payload);
  if (data.consent !== true) fail(nkruntime.Codes.INVALID_ARGUMENT, "PvE encounter consent required");
  consumeQuota(nk, userId, "pve_son_tru_create", 3, 60000);
  return JSON.stringify({matchId: nk.matchCreate("pve_son_tru", {owner: userId}), version: PVE_SON_TRU.version,
    mode: PVE_SON_TRU.mode, encounter: "en_boar"});
};
const pveSonTruInit: nkruntime.MatchInitFunction<PveSonTruState> = function (_ctx, _logger, nk, params) {
  return {tickRate: PVE_SON_TRU.tickRate, label: JSON.stringify({mode: PVE_SON_TRU.mode, encounter: "en_boar", version: PVE_SON_TRU.version}),
    state: {epoch: nk.uuidv4(), owner: params.owner,
      player: {id: params.owner, presence: null, disconnectedAt: -1, x: PVE_SON_TRU.playerSpawn.x, y: PVE_SON_TRU.playerSpawn.y,
        hp: PVE_SON_TRU.playerHp, faceX: 1, faceY: 0, dodgeX: 1, dodgeY: 0, seq: -1, lastInput: 0,
        input: null, mode: "idle", since: 0, attackAt: 0, dodgeAt: 0, hitBoar: false},
      boar: {x: PVE_SON_TRU.boarSpawn.x, y: PVE_SON_TRU.boarSpawn.y, hp: PVE_SON_TRU.boarHp,
        faceX: -1, faceY: 0, mode: "idle", since: 0, hit: false},
      reservations: [], phase: "waiting", phaseAt: 0, reason: ""}};
};
const pveSonTruJoinAttempt: nkruntime.MatchJoinAttemptFunction<PveSonTruState> = function (_ctx, _logger, _nk, _dispatcher, tick, state, presence, metadata) {
  const reject = function (message: string) { return {state: state, accept: false, rejectMessage: message}; };
  if (metadata.consent !== "true" || metadata.mode !== PVE_SON_TRU.mode || metadata.version !== String(PVE_SON_TRU.version)) return reject("Consent and matching PvE protocol required");
  if (presence.userId !== state.owner) return reject("This encounter belongs to its creator");
  if (state.phase === "finished") return reject("Encounter finished");
  state.reservations = state.reservations.filter(function (r) { return tick - r.tick < 100; });
  const p = state.player;
  if (p.presence || (p.disconnectedAt >= 0 && tick - p.disconnectedAt >= PVE_SON_TRU.reconnectTicks)) return reject("Already connected or reconnect window expired");
  if (state.reservations.some(function (r) { return r.id === presence.userId; })) return reject("Join already pending");
  if (state.phase !== "waiting" && p.disconnectedAt < 0) return reject("Encounter already occupied");
  state.reservations.push({id: presence.userId, session: presence.sessionId, tick: tick});
  return {state: state, accept: true};
};
const pveSonTruJoin: nkruntime.MatchJoinFunction<PveSonTruState> = function (_ctx, _logger, _nk, dispatcher, tick, state, presences) {
  presences.forEach(function (presence) {
    const reserved = state.reservations.some(function (r) { return r.id === presence.userId && r.session === presence.sessionId; });
    state.reservations = state.reservations.filter(function (r) { return r.session !== presence.sessionId; });
    if (!reserved || presence.userId !== state.owner) { dispatcher.matchKick([presence]); return; }
    const p = state.player;
    p.presence = presence; p.disconnectedAt = -1; p.input = null; p.seq = -1; p.lastInput = tick;
    if (state.phase === "waiting") { state.phase = "active"; state.phaseAt = tick; }
  });
  pveSonTruBroadcast(dispatcher, state, tick);
  return {state: state};
};
const pveSonTruLeave: nkruntime.MatchLeaveFunction<PveSonTruState> = function (_ctx, _logger, _nk, dispatcher, tick, state, presences) {
  presences.forEach(function (presence) {
    const p = state.player;
    if (p.presence && p.presence.sessionId === presence.sessionId && p.presence.userId === presence.userId) {
      p.presence = null; p.disconnectedAt = tick; p.input = null; p.hitBoar = false;
      if (p.mode !== "dead") p.mode = "idle";
      p.since = tick;
    }
  });
  pveSonTruBroadcast(dispatcher, state, tick);
  return {state: state};
};
function pveSonTruStepPlayer(p: PveSonTruPlayer, b: PveSonTruBoar, tick: number, allowCombat: boolean): void {
  if (!p.presence || p.hp <= 0) { p.input = null; if (p.mode !== "dead") p.mode = "idle"; return; }
  const input = p.input && tick - p.lastInput <= PVE_SON_TRU.inputTimeout ? p.input : null;
  const action = input ? input.action : "";
  if (p.input) p.input.action = "";
  const age = tick - p.since;
  if (p.mode === "dodging" && age >= PVE_SON_TRU.dodgeTicks) p.mode = "idle";
  if (p.mode === "windup" && age >= PVE_SON_TRU.basicWindup) p.mode = "active";
  if (p.mode === "active" && age >= PVE_SON_TRU.basicWindup + PVE_SON_TRU.basicActive) p.mode = "recovery";
  if (p.mode === "recovery" && age >= PVE_SON_TRU.basicWindup + PVE_SON_TRU.basicActive + PVE_SON_TRU.basicRecovery) p.mode = "idle";
  const free = p.mode === "idle" || p.mode === "moving";
  if (input && free && (input.aimX || input.aimY)) {
    const aim = pveSonTruUnit(input.aimX, input.aimY); p.faceX = aim.x; p.faceY = aim.y;
  }
  if (allowCombat && action === "sk_dodge" && (free || p.mode === "windup") && tick >= p.dodgeAt) {
    let dodge = input ? pveSonTruUnit(input.moveX, input.moveY) : {x: 0, y: 0};
    if (!dodge.x && !dodge.y) {
      const toward = pveSonTruUnit(b.x - p.x, b.y - p.y); dodge = {x: -toward.y, y: toward.x};
    }
    p.dodgeX = dodge.x; p.dodgeY = dodge.y; p.mode = "dodging"; p.since = tick;
    p.dodgeAt = tick + PVE_SON_TRU.dodgeCooldown;
  } else if (allowCombat && action === "sk_basic" && free && tick >= p.attackAt) {
    p.mode = "windup"; p.since = tick; p.attackAt = tick + PVE_SON_TRU.basicCooldown; p.hitBoar = false;
  }
  if (p.mode === "dodging") {
    const moved = pveSonTruMove(p.x, p.y, p.dodgeX * PVE_SON_TRU.dodgeDistance / PVE_SON_TRU.dodgeTicks,
      p.dodgeY * PVE_SON_TRU.dodgeDistance / PVE_SON_TRU.dodgeTicks, PVE_SON_TRU.playerRadius);
    p.x = moved.x; p.y = moved.y;
  } else if (p.mode === "idle" || p.mode === "moving") {
    const direction = input ? pveSonTruUnit(input.moveX, input.moveY) : {x: 0, y: 0};
    const moved = pveSonTruMove(p.x, p.y, direction.x * PVE_SON_TRU.playerSpeed / PVE_SON_TRU.tickRate,
      direction.y * PVE_SON_TRU.playerSpeed / PVE_SON_TRU.tickRate, PVE_SON_TRU.playerRadius);
    p.x = moved.x; p.y = moved.y; p.mode = direction.x || direction.y ? "moving" : "idle";
  }
}
function pveSonTruStepBoar(p: PveSonTruBoar, player: PveSonTruPlayer, tick: number): void {
  if (p.hp <= 0) { p.mode = "dead"; return; }
  const distance = pveSonTruDistance(p.x, p.y, player.x, player.y);
  const visible = distance <= PVE_SON_TRU.chaseLeash && pveSonTruLineClear(p.x, p.y, player.x, player.y);
  if (p.mode === "idle") {
    if (visible && distance <= PVE_SON_TRU.detectRange) { p.mode = "notice"; p.since = tick; }
    return;
  }
  if (p.mode === "notice") {
    if (!visible) { p.mode = "idle"; p.since = tick; return; }
    const toward = pveSonTruUnit(player.x - p.x, player.y - p.y); p.faceX = toward.x; p.faceY = toward.y;
    if (tick - p.since >= PVE_SON_TRU.noticeTicks) { p.mode = "chase"; p.since = tick; }
    return;
  }
  if (p.mode === "chase") {
    if (!visible || distance > PVE_SON_TRU.chaseLeash) { p.mode = "idle"; p.since = tick; return; }
    const toward = pveSonTruUnit(player.x - p.x, player.y - p.y); p.faceX = toward.x; p.faceY = toward.y;
    if (distance <= PVE_SON_TRU.chargeRange) { p.mode = "windup"; p.since = tick; p.hit = false; return; }
    const moved = pveSonTruMove(p.x, p.y, toward.x * PVE_SON_TRU.chaseSpeed / PVE_SON_TRU.tickRate,
      toward.y * PVE_SON_TRU.chaseSpeed / PVE_SON_TRU.tickRate, PVE_SON_TRU.boarRadius);
    p.x = moved.x; p.y = moved.y; return;
  }
  if (p.mode === "windup") {
    if (tick - p.since >= PVE_SON_TRU.tellTicks) { p.mode = "charge"; p.since = tick; p.hit = false; }
    return;
  }
  if (p.mode === "charge") {
    const step = PVE_SON_TRU.chargeDistance / PVE_SON_TRU.chargeTicks;
    const nextX = p.x + p.faceX * step, nextY = p.y + p.faceY * step;
    const blocked = pveSonTruBlocked(nextX, nextY, PVE_SON_TRU.boarRadius) || !pveSonTruLineClear(p.x, p.y, nextX, nextY);
    if (!blocked && !p.hit && player.hp > 0 &&
        pveSonTruSegmentDistance(player.x, player.y, p.x, p.y, nextX, nextY) <= PVE_SON_TRU.boarRadius + PVE_SON_TRU.playerRadius) {
      p.hit = true;
      const dodgeAge = tick - player.since;
      if (!(player.mode === "dodging" && dodgeAge >= PVE_SON_TRU.dodgeInvulnStart && dodgeAge < PVE_SON_TRU.dodgeInvulnEnd)) {
        player.hp = Math.max(0, player.hp - pveSonTruDamage(PVE_SON_TRU.boarAttack, PVE_SON_TRU.playerDefense));
      }
    }
    if (blocked) { p.mode = "recover"; p.since = tick; return; }
    p.x = nextX; p.y = nextY;
    if (tick - p.since >= PVE_SON_TRU.chargeTicks) { p.mode = "recover"; p.since = tick; }
    return;
  }
  if (p.mode === "recover" && tick - p.since >= PVE_SON_TRU.recoverTicks) {
    p.mode = "chase"; p.since = tick;
  }
}
const pveSonTruLoop: nkruntime.MatchLoopFunction<PveSonTruState> = function (_ctx, _logger, nk, dispatcher, tick, state, messages) {
  if ((state.phase === "waiting" && tick >= PVE_SON_TRU.lobbyTicks) ||
      (state.phase === "finished" && tick - state.phaseAt >= PVE_SON_TRU.resultTicks)) return null;
  const p = state.player;
  const counts: {[id: string]: number} = {};
  let action = "";
  messages.forEach(function (message) {
    if (message.sender.userId !== p.id || !p.presence || message.sender.sessionId !== p.presence.sessionId) return;
    counts[p.id] = (counts[p.id] || 0) + 1;
    if (counts[p.id] > 4 || state.phase === "finished" || state.phase === "defeated") return;
    const input = pveSonTruInput(nk, message, state, p);
    if (!input) return;
    if (!action && input.action) action = input.action;
    input.action = action;
    p.seq = input.seq; p.lastInput = tick;
    p.input = state.phase === "active" || state.phase === "victory" ? input : null;
  });
  if (!p.presence && p.disconnectedAt >= 0 && tick - p.disconnectedAt >= PVE_SON_TRU.reconnectTicks) pveSonTruFinish(state, tick, "disconnect");
  if (state.phase === "active" && p.hp > 0) {
    pveSonTruStepPlayer(p, state.boar, tick, true);
    pveSonTruStepBoar(state.boar, p, tick);
    if (p.mode === "active" && !p.hitBoar && state.boar.hp > 0 && state.boar.mode === "recover") {
      const dx = state.boar.x - p.x, dy = state.boar.y - p.y;
      const distance = pveSonTruDistance(p.x, p.y, state.boar.x, state.boar.y);
      if (distance <= PVE_SON_TRU.attackRange + PVE_SON_TRU.boarRadius &&
          (distance === 0 || (dx * p.faceX + dy * p.faceY) / distance >= 0.5) &&
          pveSonTruLineClear(p.x, p.y, state.boar.x, state.boar.y)) {
        p.hitBoar = true;
        state.boar.hp = Math.max(0, state.boar.hp - pveSonTruDamage(PVE_SON_TRU.playerAttack, PVE_SON_TRU.boarDefense));
      }
    }
    if (p.hp <= 0) { p.mode = "dead"; state.phase = "defeated"; state.phaseAt = tick; state.reason = "respawn"; }
    else if (state.boar.hp <= 0) { state.boar.mode = "dead"; state.phase = "victory"; state.phaseAt = tick; state.reason = "combat_only"; }
  } else if (state.phase === "defeated" && tick - state.phaseAt >= PVE_SON_TRU.defeatResetTicks) {
    pveSonTruReset(state, tick);
  } else if (state.phase === "victory") {
    pveSonTruStepPlayer(p, state.boar, tick, false);
    if (tick - state.phaseAt >= PVE_SON_TRU.respawnTicks) pveSonTruReset(state, tick);
  }
  if (tick % PVE_SON_TRU.snapshotEvery === 0) pveSonTruBroadcast(dispatcher, state, tick);
  return {state: state};
};
const pveSonTruTerminate: nkruntime.MatchTerminateFunction<PveSonTruState> = function (_ctx, _logger, _nk, dispatcher, tick, state) {
  pveSonTruFinish(state, tick, "server_shutdown"); pveSonTruBroadcast(dispatcher, state, tick); return null;
};
const pveSonTruSignal: nkruntime.MatchSignalFunction<PveSonTruState> = function (_ctx, _logger, _nk, _dispatcher, _tick, state) {
  return {state: state, data: "unsupported"};
};
