interface InventorySlot { itemId: string; quantity: number; instanceId?: string; }
interface CharacterState {
  [key: string]: any;
  form: PlayerForm;
  schemaVersion: number; characterId: string; realm: string; realmStage: number;
  cultivationXp: number; hp: number; equipped: {[slot: string]: string};
  equippedSkills: {[slot: string]: string}; learnedSkills: string[];
  spiritStones: number; revision: number; inventory: InventorySlot[];
}
// innerJson is the Nội Giới exactly as loaded ("" when it has no row yet).
interface LoadedCharacter { state: CharacterState; version: string; innerVersion: string; innerJson: string; }
const ASSET_LIMIT = 1000000000;
const BAG_SIZE = 24;

function assetInteger(value: unknown, min: number, max: number): boolean {
  return typeof value === "number" && isFinite(value) && value % 1 === 0 && value >= min && value <= max;
}
function invalidCharacter(): never {
  return fail(nkruntime.Codes.FAILED_PRECONDITION, "Character data requires review; no assets were changed");
}
function validateCharacter(state: CharacterState): void {
  if (state.schemaVersion !== 4 || !validPlayerForm(state.form) || typeof state.characterId !== "string" || !state.characterId ||
      !((state.realm === "mortal" && state.realmStage === 0) ||
        (state.realm === "luyen_khi" && assetInteger(state.realmStage, 1, 4))) ||
      !assetInteger(state.cultivationXp, 0, ASSET_LIMIT) || !assetInteger(state.hp, 0, 100) ||
      !state.equipped || typeof state.equipped.weapon !== "string" || typeof state.equipped.armor !== "string" ||
      !assetInteger(state.spiritStones, 0, ASSET_LIMIT) || !assetInteger(state.revision, 0, ASSET_LIMIT) ||
      !Array.isArray(state.learnedSkills) || !state.equippedSkills || typeof state.equippedSkills.active_1 !== "string" ||
      Object.keys(state.equippedSkills).some(function (key) { return key !== "active_1"; }) ||
      !Array.isArray(state.inventory) || state.inventory.length > BAG_SIZE) invalidCharacter();
  if (state.innerWorld !== undefined) innerValidate(state.innerWorld);
  validateOptionalFields(state);
  const learnedIds: string[] = [];
  for (let i = 0; i < state.learnedSkills.length; i++) {
    const skillId = state.learnedSkills[i];
    if (typeof skillId !== "string" || !catalogSkill(skillId) || learnedIds.indexOf(skillId) >= 0) invalidCharacter();
    learnedIds.push(skillId);
  }
  const equippedSkill = state.equippedSkills.active_1;
  const equippedDefinition = equippedSkill ? catalogSkill(equippedSkill) : undefined;
  if (equippedSkill && (!equippedDefinition || equippedDefinition.equipSlot !== "active_1" ||
      learnedIds.indexOf(equippedSkill) < 0)) invalidCharacter();
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
function plainObject(value: unknown): value is {[key: string]: any} {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function uniqueStrings(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  for (let i = 0; i < value.length; i++) if (typeof value[i] !== "string" || value.indexOf(value[i]) !== i) return false;
  return true;
}
// Shape checks for fields owned by later systems. Unknown extra keys are kept
// (released migrations preserve them); each module still validates deeply on use.
// Progress kept only for the retired An Khê prototype route (quest chain, its
// insight/technique rewards and resource nodes); dropped on load.
const RETIRED_CHARACTER_FIELDS = ["worldQuests", "insightFlags", "learnedTechniques", "resourceGatheredAt"];
function dropRetiredFields(state: CharacterState): void {
  for (let i = 0; i < RETIRED_CHARACTER_FIELDS.length; i++) delete state[RETIRED_CHARACTER_FIELDS[i]];
}
function validateOptionalFields(state: CharacterState): void {
  const session = state.activitySession;
  if (session !== undefined && (!plainObject(session) || session.schemaVersion !== 1 || typeof session.sessionId !== "string")) invalidCharacter();
  const plots = state.gardenPlots;
  if (plots !== undefined && (!Array.isArray(plots) || (plots.length !== 6 && plots.length !== 12))) invalidCharacter();
}
function initialCharacter(userId: string): CharacterState {
  return { schemaVersion: 4, form:defaultPlayerForm(), characterId: userId, realm: "mortal", realmStage: 0,
    cultivationXp: 0, hp: 100, equipped: {weapon: "", armor: ""},
    equippedSkills: {active_1: ""}, learnedSkills: [],
    spiritStones: 0, revision: 0, inventory: [] };
}
function migrateCharacter(value: {[key: string]: any}, userId: string): CharacterState {
  if (value.schemaVersion === 4) {
    const next=JSON.parse(JSON.stringify(value)) as CharacterState;
    if(next.form===undefined) next.form=defaultPlayerForm();
    dropRetiredFields(next); validateCharacter(next); return next;
  }
  if (value.schemaVersion === 3) {
    const next = JSON.parse(JSON.stringify(value)) as CharacterState;
    next.schemaVersion = 4;
    next.form = defaultPlayerForm();
    next.equippedSkills = next.equippedSkills || {active_1: ""};
    next.learnedSkills = next.learnedSkills || [];
    dropRetiredFields(next); validateCharacter(next);
    return next;
  }
  if (value.schemaVersion === 2) {
    const next = JSON.parse(JSON.stringify(value)) as CharacterState;
    next.schemaVersion = 4; next.cultivationXp = 0; next.hp = 100;
    next.form = defaultPlayerForm();
    next.equipped = {weapon: "", armor: ""};
    next.equippedSkills = {active_1: ""};
    next.learnedSkills = next.learnedSkills || [];
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
  next.schemaVersion = 4;
  next.form = defaultPlayerForm();
  next.characterId = userId;
  next.realmStage = value.realm === "pham_nhan" ? 0 : value.level;
  next.realm = value.realm === "pham_nhan" ? "mortal" : "luyen_khi";
  next.cultivationXp = 0; next.hp = 100; next.equipped = {weapon: "", armor: ""};
  next.equippedSkills = {active_1: ""}; next.learnedSkills = [];
  delete next.level;
  next.inventory = [];
  next.revision = 0;
  validateCharacter(next);
  return next;
}
function characterId(userId: string): nkruntime.StorageReadRequest {
  return { collection: "characters", key: "main", userId: userId };
}
// The Nội Giới (up to 1600 cells) lives in its own row so moves, HP checkpoints and
// inventory changes do not rewrite it. In memory it is still state.innerWorld.
function innerWorldId(userId: string): nkruntime.StorageReadRequest {
  return { collection: "inner_worlds", key: "main", userId: userId };
}
// The profile row is always written, so it serializes every character mutation;
// the Nội Giới row is written only when it actually changed.
function characterWrites(userId: string, state: CharacterState, loaded: LoadedCharacter): nkruntime.StorageWriteRequest[] {
  const profile: {[key: string]: any} = {};
  for (const key in state) if (key !== "innerWorld") profile[key] = state[key];
  const writes: nkruntime.StorageWriteRequest[] = [{ collection: "characters", key: "main", userId: userId, value: profile,
    version: loaded.version, permissionRead: 1, permissionWrite: 0 }];
  if (state.innerWorld !== undefined && JSON.stringify(state.innerWorld) !== loaded.innerJson) {
    writes.push({ collection: "inner_worlds", key: "main", userId: userId, value: state.innerWorld,
      version: loaded.innerVersion, permissionRead: 1, permissionWrite: 0 });
  }
  return writes;
}
function loadCharacter(nk: nkruntime.Nakama, userId: string): LoadedCharacter {
  contentEnsure(nk);
  for (let attempt = 0; attempt < 5; attempt++) {
    const rows = nk.storageRead([characterId(userId), innerWorldId(userId)]);
    let row: nkruntime.StorageObject | undefined, innerRow: nkruntime.StorageObject | undefined;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].collection === "characters") row = rows[i]; else innerRow = rows[i];
    }
    const state = row ? migrateCharacter(row.value, userId) : initialCharacter(userId);
    // A Nội Giới still embedded in the profile predates the split and wins.
    const embedded = !!row && row.value.innerWorld !== undefined;
    let innerJson = "";
    if (!embedded && innerRow) {
      innerJson = JSON.stringify(innerRow.value);
      state.innerWorld = JSON.parse(innerJson);
      innerValidate(state.innerWorld);
    }
    const loaded: LoadedCharacter = { state: state, version: row ? row.version : "*",
      innerVersion: innerRow ? innerRow.version : "*", innerJson: innerJson };
    if (row && row.value.schemaVersion === 4 && row.value.form !== undefined && !embedded) return loaded;
    try {
      const writes = characterWrites(userId, state, loaded), acks = nk.storageWrite(writes);
      loaded.version = acks[0].version;
      if (writes.length > 1) { loaded.innerVersion = acks[1].version; loaded.innerJson = JSON.stringify(state.innerWorld); }
      return loaded;
    } catch (_error) { /* Re-read a concurrent initializer/migration; bounded retry. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE, "Character storage busy or unavailable; retry");
}
// Read-only look at another player's form: never creates or migrates their rows.
function peekCharacterForm(nk: nkruntime.Nakama, userId: string): PlayerForm {
  const row = nk.storageRead([characterId(userId)])[0];
  const form = row && row.value.form ? JSON.parse(JSON.stringify(row.value.form)) as PlayerForm : defaultPlayerForm();
  return validPlayerForm(form) ? form : defaultPlayerForm();
}

// Pure preparation: the loaded state is never mutated, including on bag overflow.
function addReward(state: CharacterState, bundle: RewardBundle, nk: nkruntime.Nakama): {state: CharacterState; cultivationXp: number; inner?: InnerAbsorbResult} {
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
  // Realm levels are retired: power comes only from the Nội Giới. realm/realmStage/
  // cultivationXp stay frozen as legacy fields so released Luyện Khí progress can
  // migrate once. Old pending rewards that still offer XP are claimable for 0 XP;
  // nothing may promote a realm, or an untaught human would learn Hấp Linh.
  const grantedXp = 0;
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
  // Nội Giới growth commits in the same profile write as the items it came with.
  const inner = bundle.linhNang && bundle.linhNang.length ? innerAbsorb(next, nk, bundle.linhNang) : undefined;
  next.revision++;
  validateCharacter(next);
  return inner ? {state: next, cultivationXp: grantedXp, inner: inner} : {state: next, cultivationXp: grantedXp};
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
function grantReward(nk: nkruntime.Nakama, userId: string, operationId: string, sourceId: string,
    bundle: RewardBundle, additionalWrites: nkruntime.StorageWriteRequest[] = []): JsonObject {
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
  if (bundle.linhNang && bundle.linhNang.length) fingerprintInput.linhNang = bundle.linhNang;
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
    if(additionalWrites.some(function(w){return w.collection==="world_sessions";})) lifeEnsureIdle(loaded.state,Date.now());
    const applied = addReward(loaded.state, bundle, nk);
    const next = applied.state;
    const granted: RewardBundle = { spiritStones: bundle.spiritStones, items: bundle.items,
      cultivationXp: applied.cultivationXp };
    if (bundle.linhNang && bundle.linhNang.length) { granted.linhNang = bundle.linhNang; if (applied.inner) granted.inner = applied.inner; }
    const receipt: AssetReceipt = { operationId: operationId, sourceId: sourceId, fingerprint: fingerprint,
      revision: next.revision, granted: granted, committedAt: Date.now() };
    try {
      // Nakama storageWrite batch is transactional: all CAS checks and all three
      // writes commit together, including the create-only source uniqueness gate.
      nk.storageWrite(additionalWrites.concat(characterWrites(userId, next, loaded),
        [receiptWrite(userId, opKey, receipt), receiptWrite(userId, sourceKey, receipt)]));
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
    catalogVersion: 4, catalogRevision: gameContent().revision, catalog: gameContent().items, skills: SKILL_CATALOG,
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
    a.operationId === b.operationId && a.sourceId === b.sourceId && JSON.stringify(a.reward.items) === JSON.stringify(b.reward.items);
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
    reward: rewardEligible ? {spiritStones: 0, items: [{itemId: "it_boar_hide", quantity: 1}], linhNang: innerMobEssence("en_boar")}
      : {spiritStones: 0, items: []},
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
      // Outcomes saved before realms were retired still carry 0/10 XP; it is ignored on claim.
      (value.reward.cultivationXp !== undefined && value.reward.cultivationXp !== 0 && value.reward.cultivationXp !== 10) ||
      (value.reward.linhNang !== undefined && JSON.stringify(value.reward.linhNang) !== JSON.stringify(innerMobEssence("en_boar")))) {
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
      nk.storageWrite(characterWrites(userId, next, loaded).concat([{collection: "asset_mutations", key: "op:" + operationId,
        userId: userId, value: receipt, version: "*", permissionRead: 0, permissionWrite: 0}]));
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
const skillEquipRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx), input = objectPayload(payload);
  if (Object.keys(input).some(function (key) { return key !== "operationId" && key !== "skillId"; }) ||
      typeof input.operationId !== "string" || typeof input.skillId !== "string") {
    return fail(nkruntime.Codes.INVALID_ARGUMENT, "Expected operationId and skillId only");
  }
  const skillId = input.skillId as string;
  if (skillId) {
    const definition = catalogSkill(skillId);
    if (!definition || definition.equipSlot !== "active_1") {
      return fail(nkruntime.Codes.FAILED_PRECONDITION, "Skill cannot be equipped in the active slot");
    }
  }
  return JSON.stringify(commitAssetMutation(nk, userId, input.operationId as string, "skill_equip",
    {skillId: skillId}, function (next) {
      if (skillId && next.learnedSkills.indexOf(skillId) < 0) {
        return fail(nkruntime.Codes.FAILED_PRECONDITION, "Learn this skill before equipping it");
      }
      next.equippedSkills.active_1 = skillId;
    }));
};
const inventoryUseRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx), input = objectPayload(payload);
  if (Object.keys(input).some(function (key) { return key !== "operationId" && key !== "itemId"; }) ||
      typeof input.operationId !== "string" || typeof input.itemId !== "string") return fail(nkruntime.Codes.INVALID_ARGUMENT, "Expected operationId and itemId only");
  contentEnsure(nk);
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
  contentEnsure(nk);
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

// Economy prices and recipes come from the game_* tables (game_content.ts). Every
// action is committed through the same profile revision + operation receipt as inventory.
function requireServicePosition(nk: nkruntime.Nakama, userId: string, entityId: string): void {
  lifeGuardWorldAction(nk,userId);
  const current = worldReadSession(nk, userId).session, map = WORLD_MAPS[current.mapId];
  const point = worldFindPoint(map, entityId);
  if (!point || worldDistance(current.x, current.y, point.x, point.y) > point.radius * WORLD_TILE ||
      !worldPathWalkable(map, [current.x, current.y], [point.x, point.y])) {
    return fail(nkruntime.Codes.FAILED_PRECONDITION, "Move to the matching village service before using it");
  }
}
function economyAdd(state: CharacterState, itemId: string, quantity: number, nk: nkruntime.Nakama): void {
  const definition = catalogItem(itemId);
  if (!assetInteger(quantity, 1, BAG_SIZE * definition.stackMax)) return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid item quantity");
  let remaining = quantity;
  if (!definition.instance) for (let i = 0; i < state.inventory.length && remaining > 0; i++) {
    const slot = state.inventory[i]; if (slot.itemId !== itemId) continue;
    const count = Math.min(remaining, definition.stackMax - slot.quantity); slot.quantity += count; remaining -= count;
  }
  while (remaining > 0) {
    if (state.inventory.length >= BAG_SIZE) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED, "Inventory full; no assets changed");
    const count = Math.min(remaining, definition.stackMax), slot: InventorySlot = {itemId: itemId, quantity: count};
    if (definition.instance) slot.instanceId = nk.uuidv4();
    state.inventory.push(slot); remaining -= count;
  }
}
function economyRemove(state: CharacterState, itemId: string, quantity: number): void {
  const index = findInventorySlot(state, itemId);
  if (index < 0 || state.inventory[index].quantity < quantity) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Not enough " + catalogItem(itemId).name);
  if (catalogItem(itemId).bound) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Bound quest items cannot be traded or crafted");
  state.inventory[index].quantity -= quantity;
  if (state.inventory[index].quantity === 0) state.inventory.splice(index, 1);
}
const economyActionRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx), input = objectPayload(payload);
  if (Object.keys(input).some(function (key) { return ["operationId", "action", "itemId", "quantity", "recipeId"].indexOf(key) < 0; }) ||
      typeof input.operationId !== "string" || typeof input.action !== "string") return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid economy request");
  const action = input.action, itemId = typeof input.itemId === "string" ? input.itemId : "", quantity = input.quantity;
  if (!assetInteger(quantity, 1, 10)) return fail(nkruntime.Codes.INVALID_ARGUMENT, "Quantity must be 1–10");
  const details: {[key: string]: unknown} = {itemId: itemId, quantity: quantity};
  if (action === "buy" || action === "sell") {
    requireServicePosition(nk, userId, "lq.shop.market");
    const content = contentEnsure(nk), prices = action === "buy" ? content.buy : content.sell;
    const price = contentHas(prices, itemId) ? prices[itemId] : undefined;
    if (price === undefined || (action === "buy" && catalogItem(itemId).instance) || catalogItem(itemId).bound) return fail(nkruntime.Codes.FAILED_PRECONDITION, "This item is not available at the shop");
    details.price = price;
    return JSON.stringify(commitAssetMutation(nk, userId, input.operationId, "shop_" + action, details, function (next) {
      lifeEnsureIdle(next,Date.now());requireServicePosition(nk,userId,"lq.shop.market");
      const total = price * (quantity as number);
      if (action === "buy") {
        if (next.spiritStones < total) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Not enough linh thạch");
        next.spiritStones -= total; economyAdd(next, itemId, quantity as number, nk);
      } else {
        economyRemove(next, itemId, quantity as number);
        if (next.spiritStones + total > ASSET_LIMIT) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED, "Linh thạch limit reached");
        next.spiritStones += total;
      }
    }));
  }
  if (action === "craft") {
    requireServicePosition(nk, userId, "lq.npc.doran");
    const recipes = contentEnsure(nk).recipes;
    if (!contentHas(recipes, input.recipeId)) return fail(nkruntime.Codes.INVALID_ARGUMENT, "Unknown recipe");
    const recipe = recipes[input.recipeId as string]; details.recipeId = input.recipeId;
    return JSON.stringify(commitAssetMutation(nk, userId, input.operationId, "craft", details, function (next) {
      lifeEnsureIdle(next,Date.now());requireServicePosition(nk,userId,"lq.npc.doran");
      if (next.spiritStones < recipe.fee * (quantity as number)) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Not enough linh thạch for crafting");
      for (const ingredient in recipe.ingredients) economyRemove(next, ingredient, recipe.ingredients[ingredient] * (quantity as number));
      next.spiritStones -= recipe.fee * (quantity as number);
      economyAdd(next, recipe.output, quantity as number, nk);
    }));
  }
  return fail(nkruntime.Codes.INVALID_ARGUMENT, "Action must be buy, sell or craft");
};
const gardenActionRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  return lifeGardenAction(ctx,nk,payload);
};
function saveCharacterHp(nk: nkruntime.Nakama, userId: string, hp: number): CharacterState {
  if (!assetInteger(hp, 0, 100)) return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid checkpoint health");
  for (let attempt = 0; attempt < 5; attempt++) {
    const loaded = loadCharacter(nk, userId);
    if (loaded.state.hp === hp) return loaded.state;
    if (loaded.state.revision >= ASSET_LIMIT) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED, "Asset revision limit reached");
    const next = JSON.parse(JSON.stringify(loaded.state)) as CharacterState;
    next.hp = hp; next.revision++; validateCharacter(next);
    try { nk.storageWrite(characterWrites(userId, next, loaded)); return next; }
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
