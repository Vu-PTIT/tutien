interface InventorySlot { itemId: string; quantity: number; instanceId?: string; }
interface CharacterState {
  [key: string]: any;
  schemaVersion: number; characterId: string; realm: string; realmStage: number;
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
  if (state.schemaVersion !== 2 || typeof state.characterId !== "string" || !state.characterId ||
      !((state.realm === "mortal" && state.realmStage === 0) ||
        (state.realm === "luyen_khi" && assetInteger(state.realmStage, 1, 4))) ||
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
}
function initialCharacter(userId: string): CharacterState {
  return { schemaVersion: 2, characterId: userId, realm: "mortal", realmStage: 0,
    spiritStones: 0, revision: 0, inventory: [] };
}
function migrateCharacter(value: {[key: string]: any}, userId: string): CharacterState {
  if (value.schemaVersion === 2) { validateCharacter(value as CharacterState); return value as CharacterState; }
  // Only migrate the actually released schema. Unknown versions/invalid progress
  // stay untouched for manual review, never clamped or silently reset.
  if (value.schemaVersion !== 1 || value.inventory !== undefined || value.realmStage !== undefined ||
      !assetInteger(value.spiritStones, 0, ASSET_LIMIT) ||
      !((value.realm === "pham_nhan" && value.level === 1) ||
        (value.realm === "luyen_khi" && assetInteger(value.level, 1, 4)))) invalidCharacter();
  const next = JSON.parse(JSON.stringify(value)) as CharacterState;
  next.schemaVersion = 2;
  next.characterId = userId;
  next.realmStage = value.realm === "pham_nhan" ? 0 : value.level;
  next.realm = value.realm === "pham_nhan" ? "mortal" : "luyen_khi";
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
    if (row && row.value.schemaVersion === 2) return { state: state, version: row.version };
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
  if (!assetInteger(bundle.spiritStones, 0, ASSET_LIMIT) || !Array.isArray(bundle.items) || bundle.items.length > BAG_SIZE) {
    return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid reward");
  }
  const next = JSON.parse(JSON.stringify(state)) as CharacterState;
  if (next.spiritStones + bundle.spiritStones > ASSET_LIMIT || next.revision >= ASSET_LIMIT) {
    return fail(nkruntime.Codes.RESOURCE_EXHAUSTED, "Asset limit reached");
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
  const fingerprint = nk.sha256Hash(JSON.stringify({ sourceId: sourceId, spiritStones: bundle.spiritStones, items: items }));
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
    const receipt: AssetReceipt = { operationId: operationId, sourceId: sourceId, fingerprint: fingerprint,
      revision: next.revision, granted: bundle, committedAt: Date.now() };
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
    starterClaimed: nk.storageRead([receiptId(userId, "source:starter:v1")]).length > 0 });
};
const inventoryClaimStarterRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx);
  const input = objectPayload(payload);
  if (Object.keys(input).some(function (key) { return key !== "operationId"; }) || typeof input.operationId !== "string") {
    return fail(nkruntime.Codes.INVALID_ARGUMENT, "Only operationId is accepted");
  }
  return JSON.stringify(grantReward(nk, userId, input.operationId, "starter:v1", STARTER_REWARD));
};
