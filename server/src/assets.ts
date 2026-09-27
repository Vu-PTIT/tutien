interface InventorySlot { itemId: string; quantity: number; instanceId?: string; }
interface CharacterState {
  [key: string]: any;
  schemaVersion: number; characterId: string; realm: string; realmStage: number;
  cultivationXp: number; hp: number; equipped: {[slot: string]: string};
  spiritStones: number; revision: number; inventory: InventorySlot[];
}
interface LoadedCharacter { state: CharacterState; version: string; }
const ASSET_LIMIT = 1000000000;
const BAG_SIZE = 24;

function assetInteger(value: unknown, min: number, max: number): boolean {
  return typeof value === "number" && isFinite(value) && value % 1 === 0 && value >= min && value <= max;
}
function invalidCharacter(): never {
  return fail(nkruntime.Codes.FAILED_PRECONDITION, "Character data requires review; no assets were changed");
}
function validateCharacter(state: CharacterState): void {
  if (state.schemaVersion !== 3 || typeof state.characterId !== "string" || !state.characterId ||
      !((state.realm === "mortal" && state.realmStage === 0) ||
        (state.realm === "luyen_khi" && assetInteger(state.realmStage, 1, 4))) ||
      !assetInteger(state.cultivationXp, 0, ASSET_LIMIT) || !assetInteger(state.hp, 0, 100) ||
      !state.equipped || typeof state.equipped.weapon !== "string" || typeof state.equipped.armor !== "string" ||
      !assetInteger(state.spiritStones, 0, ASSET_LIMIT) || !assetInteger(state.revision, 0, ASSET_LIMIT) ||
      !Array.isArray(state.inventory) || state.inventory.length > BAG_SIZE) invalidCharacter();
  const instances: string[] = [];
  for (let i = 0; i < state.inventory.length; i++) {
    const slot = state.inventory[i];
    if (!slot || typeof slot.itemId !== "string") invalidCharacter();
    const definition = catalogItem(slot.itemId);
    if (!assetInteger(slot.quantity, 1, definition.stackMax)) invalidCharacter();
    if (definition.instance) {
      if (typeof slot.instanceId !== "string" || !/^[0-9a-f-]{36}$/i.test(slot.instanceId) || instances.indexOf(slot.instanceId) !== -1) invalidCharacter();
      instances.push(slot.instanceId);
    } else if (slot.instanceId !== undefined) invalidCharacter();
  }
  const equipmentSlots = ["weapon", "armor"], equippedIds: string[] = [];
  for (let i = 0; i < equipmentSlots.length; i++) {
    const slotName = equipmentSlots[i], instanceId = state.equipped[slotName];
    if (!instanceId) continue;
    let equippedItem: InventorySlot | undefined;
    for (let j = 0; j < state.inventory.length; j++) {
      if (state.inventory[j].instanceId === instanceId) { equippedItem = state.inventory[j]; break; }
    }
    if (!equippedItem || catalogItem(equippedItem.itemId).equipSlot !== slotName || equippedIds.indexOf(instanceId) >= 0) invalidCharacter();
    equippedIds.push(instanceId);
  }
}
function initialCharacter(userId: string): CharacterState {
  return { schemaVersion: 3, characterId: userId, realm: "mortal", realmStage: 0,
    cultivationXp: 0, hp: 100, equipped: {weapon: "", armor: ""},
    spiritStones: 0, revision: 0, inventory: [] };
}
function migrateCharacter(value: {[key: string]: any}, userId: string): CharacterState {
  if (value.schemaVersion === 3) { validateCharacter(value as CharacterState); return value as CharacterState; }
  if (value.schemaVersion === 2) {
    const next = JSON.parse(JSON.stringify(value)) as CharacterState;
    next.schemaVersion = 3; next.cultivationXp = 0; next.hp = 100;
    next.equipped = {weapon: "", armor: ""};
    validateCharacter(next);
    return next;
  }
  // Only migrate the actually released schema. Unknown versions/invalid progress
  // stay untouched for manual review, never clamped or silently reset.
  if (value.schemaVersion !== 1 || value.inventory !== undefined || value.realmStage !== undefined ||
      !assetInteger(value.spiritStones, 0, ASSET_LIMIT) ||
      !((value.realm === "pham_nhan" && value.level === 1) ||
        (value.realm === "luyen_khi" && assetInteger(value.level, 1, 4)))) invalidCharacter();
  const next = JSON.parse(JSON.stringify(value)) as CharacterState;
  next.schemaVersion = 3;
  next.characterId = userId;
  next.realmStage = value.realm === "pham_nhan" ? 0 : value.level;
  next.realm = value.realm === "pham_nhan" ? "mortal" : "luyen_khi";
  next.cultivationXp = 0; next.hp = 100; next.equipped = {weapon: "", armor: ""};
  delete next.level;
  next.inventory = [];
  next.revision = 0;
  validateCharacter(next);
  return next;
}
function characterWrite(userId: string, state: CharacterState, version: string): nkruntime.StorageWriteRequest {
  return { collection: "characters", key: "main", userId: userId, value: state,
    version: version, permissionRead: 1, permissionWrite: 0 };
}
function loadCharacter(nk: nkruntime.Nakama, userId: string): LoadedCharacter {
  for (let attempt = 0; attempt < 5; attempt++) {
    const row = nk.storageRead([{ collection: "characters", key: "main", userId: userId }])[0];
    const state = row ? migrateCharacter(row.value, userId) : initialCharacter(userId);
    if (row && row.value.schemaVersion === 3) return { state: state, version: row.version };
    try {
      const ack = nk.storageWrite([characterWrite(userId, state, row ? row.version : "*")])[0];
      return { state: state, version: ack.version };
    } catch (_error) { /* Re-read a concurrent initializer/migration; bounded retry. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE, "Character storage busy or unavailable; retry");
}

// Pure preparation: the loaded state is never mutated, including on bag overflow.
function addReward(state: CharacterState, bundle: RewardBundle, nk: nkruntime.Nakama): CharacterState {
  validateCharacter(state);
  const offeredXp = bundle.cultivationXp === undefined ? 0 : bundle.cultivationXp;
  if (!assetInteger(bundle.spiritStones, 0, ASSET_LIMIT) || !assetInteger(offeredXp, 0, ASSET_LIMIT) ||
      !Array.isArray(bundle.items) || bundle.items.length > BAG_SIZE) {
    return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid reward");
  }
  const next = JSON.parse(JSON.stringify(state)) as CharacterState;
  if (next.spiritStones + bundle.spiritStones > ASSET_LIMIT || next.revision >= ASSET_LIMIT) {
    return fail(nkruntime.Codes.RESOURCE_EXHAUSTED, "Asset limit reached");
  }
  if (next.realm === "luyen_khi" && next.realmStage < 4) {
    const thresholds = [300, 600, 1000];
    const capacity = thresholds[next.realmStage - 1] * 2;
    next.cultivationXp += Math.min(offeredXp, Math.max(0, capacity - next.cultivationXp));
  }
  next.spiritStones += bundle.spiritStones;
  for (let i = 0; i < bundle.items.length; i++) {
    const reward = bundle.items[i];
    const definition = catalogItem(reward.itemId);
    if (!assetInteger(reward.quantity, 1, BAG_SIZE * definition.stackMax)) return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid reward quantity");
    let remaining = reward.quantity;
    if (!definition.instance) {
      for (let j = 0; j < next.inventory.length && remaining > 0; j++) {
        const slot = next.inventory[j];
        if (slot.itemId !== reward.itemId) continue;
        const count = Math.min(remaining, definition.stackMax - slot.quantity);
        slot.quantity += count;
        remaining -= count;
      }
    }
    while (remaining > 0) {
      if (next.inventory.length >= BAG_SIZE) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED, "Inventory full; reward was not claimed");
      const count = Math.min(remaining, definition.stackMax);
      const slot: InventorySlot = { itemId: definition.id, quantity: count };
      if (definition.instance) slot.instanceId = nk.uuidv4();
      next.inventory.push(slot);
      remaining -= count;
    }
  }
  next.revision++;
  validateCharacter(next);
  return next;
}

interface AssetReceipt {
  [key: string]: any;
  operationId: string; sourceId: string; fingerprint: string;
  revision: number; granted: RewardBundle; committedAt: number;
}
function receiptId(userId: string, key: string): nkruntime.StorageReadRequest {
  return { collection: "asset_receipts", key: key, userId: userId };
}
function receiptWrite(userId: string, key: string, receipt: AssetReceipt): nkruntime.StorageWriteRequest {
  return { collection: "asset_receipts", key: key, userId: userId, value: receipt,
    version: "*", permissionRead: 0, permissionWrite: 0 };
}
function assetResult(nk: nkruntime.Nakama, userId: string, receipt: AssetReceipt, replayed: boolean): JsonObject {
  return { receipt: receipt, replayed: replayed, profile: loadCharacter(nk, userId).state };
}
// INTERNAL ONLY. A future quest/encounter caller must derive eligibility, sourceId
// and bundle from authoritative state. Never expose this as a generic grant RPC.
function grantReward(nk: nkruntime.Nakama, userId: string, operationId: string, sourceId: string, bundle: RewardBundle): JsonObject {
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(operationId) || !/^[a-zA-Z0-9_:.-]{1,120}$/.test(sourceId)) {
    return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid operation or source ID");
  }
  // Canonical field order and sorted item list: fingerprint includes exact amounts.
  const items = bundle.items.map(function (item) { return { itemId: item.itemId, quantity: item.quantity }; });
  items.sort(function (a, b) { return a.itemId < b.itemId ? -1 : a.itemId > b.itemId ? 1 : a.quantity - b.quantity; });
  const offeredXp = bundle.cultivationXp === undefined ? 0 : bundle.cultivationXp;
  const fingerprintInput: {[key: string]: unknown} = { sourceId: sourceId, spiritStones: bundle.spiritStones, items: items };
  // Preserve schema-2 starter receipt replays: the original fingerprint had no zero-XP field.
  if (offeredXp > 0) fingerprintInput.cultivationXp = offeredXp;
  const fingerprint = nk.sha256Hash(JSON.stringify(fingerprintInput));
  const opKey = "op:" + operationId;
  const sourceKey = "source:" + sourceId;
  for (let attempt = 0; attempt < 5; attempt++) {
    // Read operation and source receipts together so concurrent commits do not split checks.
    const existing = nk.storageRead([receiptId(userId, opKey), receiptId(userId, sourceKey)]);
    let operation: nkruntime.StorageObject | undefined;
    let source: nkruntime.StorageObject | undefined;
    for (let i = 0; i < existing.length; i++) {
      if (existing[i].key === opKey) operation = existing[i];
      else if (existing[i].key === sourceKey) source = existing[i];
    }
    if (operation) {
      if (operation.value.fingerprint !== fingerprint) return fail(nkruntime.Codes.ALREADY_EXISTS, "Operation ID already used for another reward");
      return assetResult(nk, userId, operation.value as AssetReceipt, true);
    }
    if (source) {
      if (source.value.operationId === operationId) {
        if (source.value.fingerprint !== fingerprint) return fail(nkruntime.Codes.ALREADY_EXISTS, "Operation ID already used for another reward");
        return assetResult(nk, userId, source.value as AssetReceipt, true);
      }
      return fail(nkruntime.Codes.ALREADY_EXISTS, "Reward source already claimed");
    }
    const loaded = loadCharacter(nk, userId);
    const next = addReward(loaded.state, bundle, nk);
    const granted: RewardBundle = { spiritStones: bundle.spiritStones, items: bundle.items,
      cultivationXp: next.cultivationXp - loaded.state.cultivationXp };
    const receipt: AssetReceipt = { operationId: operationId, sourceId: sourceId, fingerprint: fingerprint,
      revision: next.revision, granted: granted, committedAt: Date.now() };
    try {
      // Nakama storageWrite batch is transactional: all CAS checks and all three
      // writes commit together, including the create-only source uniqueness gate.
      nk.storageWrite([characterWrite(userId, next, loaded.version),
        receiptWrite(userId, opKey, receipt), receiptWrite(userId, sourceKey, receipt)]);
      return { receipt: receipt, replayed: false, profile: next };
    } catch (_error) { /* Includes lost acknowledgement after commit: re-read receipt. */ }
  }
  // A final receipt lookup also handles an acknowledgement lost on the last try.
  const last = nk.storageRead([receiptId(userId, opKey), receiptId(userId, sourceKey)]);
  let receipt: nkruntime.StorageObject | undefined;
  let conflictingSource = false;
  for (let i = 0; i < last.length; i++) {
    if (last[i].key === opKey) {
      receipt = last[i];
    } else if (last[i].key === sourceKey) {
      if (last[i].value.operationId === operationId) {
        if (!receipt) receipt = last[i];
      } else {
        conflictingSource = true;
      }
    }
  }
  if (receipt && receipt.value.fingerprint === fingerprint) return assetResult(nk, userId, receipt.value as AssetReceipt, true);
  if (conflictingSource) return fail(nkruntime.Codes.ALREADY_EXISTS, "Reward source already claimed");
  return fail(nkruntime.Codes.UNAVAILABLE, "Asset storage busy or unavailable; retry with the same operation ID");
}
const inventoryGetRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, _payload) {
  const userId = authenticated(ctx);
  return JSON.stringify({ profile: loadCharacter(nk, userId).state, capacity: BAG_SIZE,
    catalogVersion: 1, catalog: ITEM_CATALOG,
    starterClaimed: nk.storageRead([receiptId(userId, "source:starter:v1")]).length > 0,
    pendingSettlement: getPvePendingSettlement(nk, userId) });
};
const inventoryClaimStarterRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx);
  const input = objectPayload(payload);
  if (Object.keys(input).some(function (key) { return key !== "operationId"; }) || typeof input.operationId !== "string") {
    return fail(nkruntime.Codes.INVALID_ARGUMENT, "Only operationId is accepted");
  }
  return JSON.stringify(grantReward(nk, userId, input.operationId, "starter:v1", STARTER_REWARD));
};

interface PveSonTruOutcome {
  encounterId: string; generation: number; enemyId: string; operationId: string; sourceId: string;
  reward: RewardBundle; status: string; createdAt: number;
}
interface PvePendingPointer { status: string; outcomeKey?: string; }
function pvePendingRequest(userId: string): nkruntime.StorageReadRequest {
  return {collection: "pve_settlements", key: "pending", userId: userId};
}
function pveOutcomeRequest(userId: string, key: string): nkruntime.StorageReadRequest {
  return {collection: "pve_settlements", key: key, userId: userId};
}
function pveOutcomeWrite(userId: string, key: string, value: PveSonTruOutcome, version: string): nkruntime.StorageWriteRequest {
  return {collection: "pve_settlements", key: key, userId: userId, value: value,
    version: version, permissionRead: 0, permissionWrite: 0};
}
function pvePendingWrite(userId: string, value: PvePendingPointer, version: string): nkruntime.StorageWriteRequest {
  return {collection: "pve_settlements", key: "pending", userId: userId, value: value,
    version: version, permissionRead: 0, permissionWrite: 0};
}
function pveOutcomeKey(encounterId: string, generation: number): string {
  return "outcome:" + encounterId + ":" + generation;
}
function pveOutcomeSame(a: PveSonTruOutcome, b: PveSonTruOutcome): boolean {
  return a.encounterId === b.encounterId && a.generation === b.generation && a.enemyId === b.enemyId &&
    a.operationId === b.operationId && a.sourceId === b.sourceId && JSON.stringify(a.reward) === JSON.stringify(b.reward);
}
// The authoritative encounter calls this before announcing a kill. Outcome and pending pointer commit together.
function recordPveSonTruOutcome(nk: nkruntime.Nakama, userId: string, encounterId: string,
    generation: number, rewardEligible: boolean): PveSonTruOutcome {
  if (!/^[0-9a-f-]{36}$/i.test(encounterId) || !assetInteger(generation, 1, ASSET_LIMIT)) {
    return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid encounter result");
  }
  const operationId = "pve_son_tru_" + encounterId + "_" + generation;
  const sourceId = "pve:son_tru:" + encounterId + ":" + generation + ":" + userId;
  const value: PveSonTruOutcome = {encounterId: encounterId, generation: generation, enemyId: "en_boar",
    operationId: operationId, sourceId: sourceId,
    reward: {spiritStones: 0, cultivationXp: rewardEligible ? 10 : 0,
      items: rewardEligible ? [{itemId: "it_boar_hide", quantity: 1}] : []},
    status: "pending", createdAt: Date.now()};
  const key = pveOutcomeKey(encounterId, generation);
  const sessionRequest = {collection: "pve_son_tru_sessions", key: "active", userId: userId};
  for (let attempt = 0; attempt < 5; attempt++) {
    const rows = nk.storageRead([pvePendingRequest(userId), pveOutcomeRequest(userId, key), sessionRequest]);
    let pendingRow: nkruntime.StorageObject | undefined, outcomeRow: nkruntime.StorageObject | undefined;
    let sessionRow: nkruntime.StorageObject | undefined;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].key === "pending") pendingRow = rows[i];
      else if (rows[i].key === key) outcomeRow = rows[i];
      else if (rows[i].collection === sessionRequest.collection) sessionRow = rows[i];
    }
    if (outcomeRow) {
      const old = outcomeRow.value as PveSonTruOutcome;
      if (!pveOutcomeSame(old, value)) return fail(nkruntime.Codes.ALREADY_EXISTS, "Encounter result conflicts with saved outcome");
      if (old.status === "settled") return old;
      if (pendingRow && pendingRow.value.status === "pending" && pendingRow.value.outcomeKey === key) return old;
      if (pendingRow && pendingRow.value.status === "pending") return fail(nkruntime.Codes.RESOURCE_EXHAUSTED, "A previous reward is waiting");
      return fail(nkruntime.Codes.FAILED_PRECONDITION, "Saved encounter result requires review");
    }
    if (pendingRow && pendingRow.value.status === "pending") return fail(nkruntime.Codes.RESOURCE_EXHAUSTED, "A previous reward is waiting");
    const writes: nkruntime.StorageWriteRequest[] = [
      pveOutcomeWrite(userId, key, value, "*"),
      pvePendingWrite(userId, {status: "pending", outcomeKey: key}, pendingRow ? pendingRow.version : "*")
    ];
    if (sessionRow && sessionRow.value.status === "active" && sessionRow.value.encounterId === encounterId) {
      const sessionValue = JSON.parse(JSON.stringify(sessionRow.value)) as {[key: string]: any};
      sessionValue.nextSpawnAt = Date.now() + 45000;
      sessionValue.lastSpawnGeneration = generation;
      writes.push({collection: sessionRequest.collection, key: sessionRequest.key, userId: userId,
        value: sessionValue, version: sessionRow.version, permissionRead: 0, permissionWrite: 0});
    }
    try { nk.storageWrite(writes); return value; }
    catch (_error) { /* Re-read to recover a lost acknowledgement or retry a CAS race. */ }
  }
  const saved = nk.storageRead([pvePendingRequest(userId), pveOutcomeRequest(userId, key)]);
  for (let i = 0; i < saved.length; i++) {
    if (saved[i].key === key && pveOutcomeSame(saved[i].value as PveSonTruOutcome, value) && saved[i].value.status === "pending") {
      return saved[i].value as PveSonTruOutcome;
    }
  }
  return fail(nkruntime.Codes.UNAVAILABLE, "Encounter result could not be saved; retrying");
}
function getPvePendingSettlement(nk: nkruntime.Nakama, userId: string): PveSonTruOutcome | null {
  const pointer = nk.storageRead([pvePendingRequest(userId)])[0];
  if (!pointer || pointer.value.status !== "pending") return null;
  const key = pointer.value.outcomeKey;
  if (typeof key !== "string" || key.indexOf("outcome:") !== 0) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Pending settlement requires review");
  const row = nk.storageRead([pveOutcomeRequest(userId, key)])[0];
  if (!row || row.value.status !== "pending") return fail(nkruntime.Codes.FAILED_PRECONDITION, "Pending settlement requires review");
  const value = row.value as PveSonTruOutcome;
  if (value.enemyId !== "en_boar" || value.reward.spiritStones !== 0 || value.reward.items.length > 1 ||
      (value.reward.items.length === 1 && (value.reward.items[0].itemId !== "it_boar_hide" || value.reward.items[0].quantity !== 1)) ||
      (value.reward.cultivationXp !== 0 && value.reward.cultivationXp !== 10)) {
    return fail(nkruntime.Codes.FAILED_PRECONDITION, "Pending settlement requires review");
  }
  return value;
}
function pveClaimPending(nk: nkruntime.Nakama, userId: string): JsonObject {
  const outcome = getPvePendingSettlement(nk, userId);
  if (!outcome) return {pending: false, replayed: false};
  const result = grantReward(nk, userId, outcome.operationId, outcome.sourceId, outcome.reward);
  const key = pveOutcomeKey(outcome.encounterId, outcome.generation);
  for (let attempt = 0; attempt < 5; attempt++) {
    const rows = nk.storageRead([pvePendingRequest(userId), pveOutcomeRequest(userId, key)]);
    let pendingRow: nkruntime.StorageObject | undefined, outcomeRow: nkruntime.StorageObject | undefined;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].key === "pending") pendingRow = rows[i];
      else if (rows[i].key === key) outcomeRow = rows[i];
    }
    if (!outcomeRow || outcomeRow.value.status === "settled" || !pendingRow || pendingRow.value.status !== "pending" || pendingRow.value.outcomeKey !== key) {
      return {pending: false, replayed: result.replayed, receipt: result.receipt, profile: result.profile};
    }
    const settled = JSON.parse(JSON.stringify(outcomeRow.value)) as PveSonTruOutcome;
    settled.status = "settled";
    try {
      nk.storageWrite([pveOutcomeWrite(userId, key, settled, outcomeRow.version),
        pvePendingWrite(userId, {status: "none"}, pendingRow.version)]);
      return {pending: false, replayed: result.replayed, receipt: result.receipt, profile: result.profile};
    } catch (_error) { /* The asset receipt makes retry safe if this acknowledgement was lost. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE, "Reward committed; settlement will reconcile on retry");
}

interface AssetMutationReceipt { operationId: string; fingerprint: string; action: string; revision: number; committedAt: number; }
function assetMutationReceiptId(userId: string, operationId: string): nkruntime.StorageReadRequest {
  return {collection: "asset_mutations", key: "op:" + operationId, userId: userId};
}
function commitAssetMutation(nk: nkruntime.Nakama, userId: string, operationId: string, action: string,
    payload: {[key: string]: unknown}, apply: (state: CharacterState) => void): JsonObject {
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(operationId)) return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid operation ID");
  const fingerprint = nk.sha256Hash(JSON.stringify({action: action, payload: payload}));
  const receiptRequest = assetMutationReceiptId(userId, operationId);
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = nk.storageRead([receiptRequest])[0];
    if (existing) {
      if (existing.value.fingerprint !== fingerprint || existing.value.action !== action) return fail(nkruntime.Codes.ALREADY_EXISTS, "Operation ID used for another inventory change");
      return {receipt: existing.value, replayed: true, profile: loadCharacter(nk, userId).state};
    }
    const loaded = loadCharacter(nk, userId), next = JSON.parse(JSON.stringify(loaded.state)) as CharacterState;
    if (next.revision >= ASSET_LIMIT) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED, "Asset revision limit reached");
    apply(next); next.revision++; validateCharacter(next);
    const receipt: AssetMutationReceipt = {operationId: operationId, fingerprint: fingerprint, action: action, revision: next.revision, committedAt: Date.now()};
    try {
      nk.storageWrite([characterWrite(userId, next, loaded.version), {collection: "asset_mutations", key: "op:" + operationId,
        userId: userId, value: receipt, version: "*", permissionRead: 0, permissionWrite: 0}]);
      return {receipt: receipt, replayed: false, profile: next};
    } catch (_error) { /* CAS retries and lost acknowledgements share the stable operation ID. */ }
  }
  const last = nk.storageRead([receiptRequest])[0];
  if (last && last.value.fingerprint === fingerprint && last.value.action === action) return {receipt: last.value, replayed: true, profile: loadCharacter(nk, userId).state};
  return fail(nkruntime.Codes.UNAVAILABLE, "Inventory storage unavailable; retry with the same operation ID");
}
function findInventorySlot(state: CharacterState, itemId: string, instanceId?: string): number {
  for (let i = 0; i < state.inventory.length; i++) {
    if (state.inventory[i].itemId === itemId && (instanceId === undefined || state.inventory[i].instanceId === instanceId)) return i;
  }
  return -1;
}
const inventoryEquipRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx), input = objectPayload(payload);
  if (Object.keys(input).some(function (key) { return key !== "operationId" && key !== "instanceId"; }) ||
      typeof input.operationId !== "string" || typeof input.instanceId !== "string") return fail(nkruntime.Codes.INVALID_ARGUMENT, "Expected operationId and instanceId only");
  const profile = loadCharacter(nk, userId).state;
  let slot: InventorySlot | undefined;
  for (let i = 0; i < profile.inventory.length; i++) if (profile.inventory[i].instanceId === input.instanceId) slot = profile.inventory[i];
  if (!slot) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Equipment instance is not in inventory");
  const equipSlot = catalogItem(slot.itemId).equipSlot;
  if (!equipSlot) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Item cannot be equipped");
  return JSON.stringify(commitAssetMutation(nk, userId, input.operationId as string, "equip", {instanceId: input.instanceId}, function (next) {
    next.equipped[equipSlot] = next.equipped[equipSlot] === input.instanceId ? "" : input.instanceId as string;
  }));
};
const inventoryUseRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx), input = objectPayload(payload);
  if (Object.keys(input).some(function (key) { return key !== "operationId" && key !== "itemId"; }) ||
      typeof input.operationId !== "string" || typeof input.itemId !== "string") return fail(nkruntime.Codes.INVALID_ARGUMENT, "Expected operationId and itemId only");
  const definition = catalogItem(input.itemId);
  if (!definition.healAmount) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Item is not usable yet");
  return JSON.stringify(commitAssetMutation(nk, userId, input.operationId as string, "use", {itemId: input.itemId}, function (next) {
    const index = findInventorySlot(next, input.itemId as string);
    if (index < 0) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Consumable is not in inventory");
    if (next.hp >= 100) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Health is already full");
    next.hp = Math.min(100, next.hp + Number(definition.healAmount));
    next.inventory[index].quantity--;
    if (next.inventory[index].quantity === 0) next.inventory.splice(index, 1);
  }));
};
const inventoryDiscardRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx), input = objectPayload(payload);
  if (Object.keys(input).some(function (key) { return key !== "operationId" && key !== "itemId" && key !== "quantity" && key !== "instanceId"; }) ||
      typeof input.operationId !== "string" || typeof input.itemId !== "string") return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid discard request");
  const definition = catalogItem(input.itemId), quantity = input.quantity;
  if (definition.bound) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Bound items cannot be discarded");
  if (!assetInteger(quantity, 1, BAG_SIZE * definition.stackMax)) return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid discard quantity");
  const instanceId = typeof input.instanceId === "string" ? input.instanceId : undefined;
  if ((definition.instance && (quantity !== 1 || !instanceId)) || (!definition.instance && input.instanceId !== undefined)) return fail(nkruntime.Codes.INVALID_ARGUMENT, "Discard must identify one inventory slot");
  const mutationPayload: {[key: string]: unknown} = {itemId: input.itemId, quantity: quantity};
  if (instanceId) mutationPayload.instanceId = instanceId;
  return JSON.stringify(commitAssetMutation(nk, userId, input.operationId, "discard", mutationPayload, function (next) {
    const index = findInventorySlot(next, input.itemId as string, instanceId);
    if (index < 0 || next.inventory[index].quantity < (quantity as number)) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Item quantity is not in inventory");
    if (instanceId && (next.equipped.weapon === instanceId || next.equipped.armor === instanceId)) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Unequip before discarding");
    next.inventory[index].quantity -= quantity as number;
    if (next.inventory[index].quantity === 0) next.inventory.splice(index, 1);
  }));
};
function saveCharacterHp(nk: nkruntime.Nakama, userId: string, hp: number): CharacterState {
  if (!assetInteger(hp, 0, 100)) return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid checkpoint health");
  for (let attempt = 0; attempt < 5; attempt++) {
    const loaded = loadCharacter(nk, userId);
    if (loaded.state.hp === hp) return loaded.state;
    if (loaded.state.revision >= ASSET_LIMIT) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED, "Asset revision limit reached");
    const next = JSON.parse(JSON.stringify(loaded.state)) as CharacterState;
    next.hp = hp; next.revision++; validateCharacter(next);
    try { nk.storageWrite([characterWrite(userId, next, loaded.version)]); return next; }
    catch (_error) { /* Re-read after a CAS conflict; saving the latest HP is safe to retry. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE, "Checkpoint health storage unavailable; retry");
}
const pveSonTruClaimPendingRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx), input = objectPayload(payload);
  if (Object.keys(input).length !== 0) return fail(nkruntime.Codes.INVALID_ARGUMENT, "No reward fields are accepted");
  const result = pveClaimPending(nk, userId) as {[key: string]: any};
  if (result.receipt) {
    const request = {collection: "pve_son_tru_sessions", key: "active", userId: userId};
    const session = nk.storageRead([request])[0];
    if (session && session.value.status === "active" && typeof session.value.matchId === "string") {
      try { nk.matchSignal(session.value.matchId, JSON.stringify({action: "reward_claimed",
        encounterId: session.value.encounterId, granted: result.receipt.granted})); }
      catch (_error) { /* Durable receipt/outcome reconciles if the encounter already closed. */ }
    }
  }
  return JSON.stringify(result);
};
