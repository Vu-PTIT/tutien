// Place-based life yields (docs/game-design/08-life-yields.md). Every roll is
// derived from a server seed, so retries and replays never change the loot.
interface LifeLootState { b1Cycles: number; shardFound: boolean; }
// Sessions started before loot v2 keep the table they were assigned with.
const LIFE_LOOT_VERSION = 2;
// Loot tables are rows of game_loot keyed "type:mapId"; "type:mapId:spirit_sky"
// replaces it while trời linh is active. Sessions started before v2 use "legacy:type".
// The first Mảnh Tím is a chapter 1 story beat: guaranteed within 40 B1 cycles.
const LIFE_SHARD_PITY = 40;
// One game day is two real hours, in five equal phases (doc 04 §5); Tối and
// Khuya are night. "Trời linh" is decided per 30-minute window from a hash,
// about one window in eight, so every VM agrees without stored weather.
const LIFE_DAY_MS = 7200000;
const LIFE_PHASES = ["sang_som", "trua", "chieu_vang", "toi", "khuya"];
const LIFE_SKY_WINDOW_MS = 1800000;
function lifeRoll(nk: nkruntime.Nakama, seed: string): number {
  return parseInt(nk.sha256Hash(seed).substring(0, 8), 16) % 100;
}
// Weights are relative: database rows need not sum to 100.
function lifePick(nk: nkruntime.Nakama, table: LifeLootEntry[], seed: string): LifeLootEntry {
  let total = 0;
  for (let i = 0; i < table.length; i++) total += table[i].weight;
  const roll = parseInt(nk.sha256Hash(seed).substring(0, 12), 16) % total;
  let sum = 0;
  for (let i = 0; i < table.length; i++) { sum += table[i].weight; if (roll < sum) return table[i]; }
  return table[table.length - 1];
}
function lifePhase(now: number): number {
  return Math.floor((now % LIFE_DAY_MS) / (LIFE_DAY_MS / LIFE_PHASES.length));
}
function lifeIsNight(now: number): boolean { return lifePhase(now) >= 3; }
function lifeSpiritSky(nk: nkruntime.Nakama, now: number): boolean {
  return lifeRoll(nk, "troi_linh:" + Math.floor(now / LIFE_SKY_WINDOW_MS)) % 8 === 0;
}
function lifeClockView(nk: nkruntime.Nakama, now: number): JsonObject {
  const phaseMs = LIFE_DAY_MS / LIFE_PHASES.length, phase = lifePhase(now);
  return {dayMs: LIFE_DAY_MS, phase: LIFE_PHASES[phase], night: lifeIsNight(now),
    phaseEndsAt: (Math.floor(now / phaseMs) + 1) * phaseMs, spiritSky: lifeSpiritSky(nk, now),
    skyEndsAt: (Math.floor(now / LIFE_SKY_WINDOW_MS) + 1) * LIFE_SKY_WINDOW_MS};
}
function lifeLootOf(state: CharacterState): LifeLootState {
  const loot = state.lifeLoot as LifeLootState | undefined;
  if (loot === undefined) return state.lifeLoot = {b1Cycles: 0, shardFound: false};
  if (!loot || !assetInteger(loot.b1Cycles, 0, ASSET_LIMIT) || typeof loot.shardFound !== "boolean")
    return fail(nkruntime.Codes.FAILED_PRECONDITION, "Life loot state requires review");
  return loot;
}
function lifeBundle(items: {[id: string]: number}): RewardBundle {
  return {spiritStones: 0, items: Object.keys(items).sort().map(function (id) { return {itemId: id, quantity: items[id]}; })};
}
// Rolls one fishing or mining claim. Each cycle is judged at the moment it ended.
function lifeReward(s: LifeSession, nk: nkruntime.Nakama, state: CharacterState): RewardBundle {
  const items: {[id: string]: number} = {};
  if (s.type === "meditation") return {spiritStones: 0, items: []};
  const all = gameContent().loot, key = s.type + ":" + s.mapId;
  const placed = s.lootVersion === LIFE_LOOT_VERSION && contentHas(all, key);
  const legacy = all["legacy:" + s.type];
  if (!placed && !legacy) return fail(nkruntime.Codes.FAILED_PRECONDITION, "No loot table for " + key);
  const loot = placed && s.mapId === "m_mo_ngam" ? lifeLootOf(state) : undefined;
  for (let i = 0; i < s.completedCycles; i++) {
    const seed = s.rewardSeed + ":" + i, endedAt = s.activeAt + (i + 1) * s.intervalMs;
    let entry: LifeLootEntry;
    if (!placed) entry = lifePick(nk, legacy, seed);
    else entry = lifePick(nk, contentHas(all, key + ":spirit_sky") && lifeSpiritSky(nk, endedAt) ? all[key + ":spirit_sky"] : all[key], seed);
    if (loot) {
      loot.b1Cycles = Math.min(ASSET_LIMIT, loot.b1Cycles + 1);
      if (!loot.shardFound && loot.b1Cycles >= LIFE_SHARD_PITY) entry = {itemId: "it_purple_shard", weight: 0, quantity: 1};
      if (entry.itemId === "it_purple_shard") loot.shardFound = true;
    }
    items[entry.itemId] = (items[entry.itemId] || 0) + entry.quantity;
  }
  return lifeBundle(items);
}
// A ripe plot yields its crop, maybe one Dạ Quang in place of a plain herb, and
// maybe a seed back. Night harvests glow more often.
function lifeHarvestYield(nk: nkruntime.Nakama, crop: CropDefinition, seed: string, now: number): RewardBundle {
  const items: {[id: string]: number} = {};
  const glowChance = lifeIsNight(now) ? crop.glowNightPercent : crop.glowPercent;
  const glow = crop.glow && lifeRoll(nk, seed + ":glow") < glowChance ? 1 : 0;
  items[crop.output] = crop.yield - glow;
  if (glow) items[crop.glow!] = glow;
  if (lifeRoll(nk, seed + ":seed") < crop.seedBackPercent) items[crop.seed] = 1;
  return lifeBundle(items);
}
// Hấp: a learned character dissolves Linh items into clean essence of their vị.
const innerWorldAbsorbItemRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx), input = objectPayload(payload);
  lifeFields(input, ["operationId", "itemId", "quantity"]);
  const operationId = lifeOperation(input.operationId), itemId = textField(input.itemId, "itemId", 1, 40);
  const quantity = input.quantity === undefined ? 1 : input.quantity;
  const absorbable = contentEnsure(nk).absorb;
  if (!contentHas(absorbable, itemId)) return fail(nkruntime.Codes.INVALID_ARGUMENT, "This item cannot be absorbed");
  if (!assetInteger(quantity, 1, 20)) return fail(nkruntime.Codes.INVALID_ARGUMENT, "Quantity must be 1–20");
  consumeQuota(nk, userId, "inner_absorb_item", 60, 60000);
  let absorbed: InnerAbsorbResult | undefined;
  const result = commitAssetMutation(nk, userId, operationId, "inner_absorb_item", {itemId: itemId, quantity: quantity}, function (next) {
    lifeEnsureIdle(next, Date.now());
    if (!innerOf(next).learned) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Learn Hấp Linh first");
    lifeRemove(next, itemId, quantity as number);
    const base = absorbable[itemId];
    absorbed = innerAbsorb(next, nk, [{vi: base.vi, motes: base.motes * (quantity as number), turbid: 0}]);
  }) as {[key: string]: any};
  result.innerWorld = innerView(result.profile);
  if (absorbed) result.inner = absorbed;
  return JSON.stringify(result);
};
