// Nakama storage has no TTL. Idempotency receipts only need to outlive client
// retries, so old rows are swept opportunistically when a player opens their
// profile. Every rule here keeps whatever still guards against a double grant.
const PRUNE_RECEIPTS_AFTER_MS = 7 * 24 * 3600 * 1000;
const PRUNE_CONTRACTS_AFTER_MS = 30 * 24 * 3600 * 1000;
const PRUNE_PLAYER_EVERY_MS = 6 * 3600 * 1000;
const PRUNE_GLOBAL_EVERY_MS = 3600 * 1000;
const PRUNE_PAGE = 100;
const PRUNE_PAGES = 5;
// Source receipts for one-off instances (a monster generation, an encounter, a
// hunt) are safe to forget: their own state has already moved past them. Any
// other source (starter packs, future one-time grants) is kept forever.
const PRUNABLE_SOURCES = ["world:", "pve:", "contract_hunt:"];

function pruneReceipt(key: string, value: {[key: string]: any}, cutoff: number): boolean {
  if (!(Number(value.committedAt) < cutoff)) return false;
  // An op: receipt may go: a grant replay is still answered by its source receipt.
  if (key.indexOf("op:") === 0) return true;
  if (key.indexOf("source:") !== 0) return false;
  const sourceId = key.substring(7);
  return PRUNABLE_SOURCES.some(function (prefix) { return sourceId.indexOf(prefix) === 0; });
}
function prunePveOutcome(key: string, value: {[key: string]: any}, cutoff: number): boolean {
  return key.indexOf("outcome:") === 0 && value.status === "settled" && Number(value.createdAt) < cutoff;
}
function pruneSystemLimit(key: string, value: {[key: string]: any}, now: number): boolean {
  return key.indexOf("auth_") === 0 && Number(value.resetAt) <= now;
}
function pruneContract(_key: string, value: {[key: string]: any}, now: number): boolean {
  const cutoff = now - PRUNE_CONTRACTS_AFTER_MS;
  if (value.status === "ended" || value.status === "cancelled") return Number(value.endedAt) < cutoff;
  if (value.status === "declined") return Number(value.createdAt) < cutoff;
  return value.status === "pending" && Number(value.expiresAt) < cutoff;
}

// Lists one collection page by page and deletes matching rows by version, so a
// row rewritten meanwhile is left alone. Returns the cursor to resume from.
function pruneCollection(nk: nkruntime.Nakama, userId: string, collection: string, cursor: string | undefined,
    test: (key: string, value: {[key: string]: any}) => boolean, counter: {removed: number}): string {
  for (let page = 0; page < PRUNE_PAGES; page++) {
    const list = nk.storageList(userId, collection, PRUNE_PAGE, cursor);
    const objects = list.objects || [], deletes: nkruntime.StorageDeleteRequest[] = [];
    for (let i = 0; i < objects.length; i++) {
      if (test(objects[i].key, objects[i].value)) {
        deletes.push({collection: collection, key: objects[i].key, userId: userId, version: objects[i].version});
      }
    }
    if (deletes.length) {
      try { nk.storageDelete(deletes); counter.removed += deletes.length; }
      catch (_error) { /* A row changed under us; the next sweep retries. */ }
    }
    cursor = list.cursor || undefined;
    if (!cursor) return "";
  }
  return cursor || "";
}
// Claims a sweep slot with a CAS marker so concurrent requests never sweep twice.
function claimSweep(nk: nkruntime.Nakama, userId: string, every: number, now: number): {[key: string]: any} | null {
  const id = {collection: "maintenance", key: "prune", userId: userId};
  const row = nk.storageRead([id])[0];
  const previous = row ? JSON.parse(JSON.stringify(row.value)) as {[key: string]: any} : {};
  if (Number(previous.lastAt) > now - every) return null;
  previous.lastAt = now;
  try {
    nk.storageWrite([{collection: id.collection, key: id.key, userId: userId, value: previous,
      version: row ? row.version : "*", permissionRead: 0, permissionWrite: 0}]);
  } catch (_error) { return null; }
  return previous;
}
function prunePlayerStorage(nk: nkruntime.Nakama, userId: string, now: number): number {
  if (!claimSweep(nk, userId, PRUNE_PLAYER_EVERY_MS, now)) return 0;
  const cutoff = now - PRUNE_RECEIPTS_AFTER_MS, counter = {removed: 0};
  const receipts = function (key: string, value: {[key: string]: any}) { return pruneReceipt(key, value, cutoff); };
  pruneCollection(nk, userId, "asset_receipts", undefined, receipts, counter);
  pruneCollection(nk, userId, "asset_mutations", undefined, receipts, counter);
  pruneCollection(nk, userId, "pve_settlements", undefined, function (key, value) { return prunePveOutcome(key, value, cutoff); }, counter);
  return counter.removed;
}
// Shared rows (per-IP login limits, closed contracts) are swept a few pages at a
// time; the marker remembers where the last sweep stopped.
function pruneSharedStorage(nk: nkruntime.Nakama, now: number): number {
  const marker = claimSweep(nk, SYSTEM_ID, PRUNE_GLOBAL_EVERY_MS, now);
  if (!marker) return 0;
  const counter = {removed: 0}, cursors = plainObject(marker.cursors) ? marker.cursors : {};
  const next = {
    social_limits: pruneCollection(nk, SYSTEM_ID, "social_limits", cursors.social_limits || undefined,
      function (key, value) { return pruneSystemLimit(key, value, now); }, counter),
    spirit_contracts: pruneCollection(nk, SYSTEM_ID, "spirit_contracts", cursors.spirit_contracts || undefined,
      function (key, value) { return pruneContract(key, value, now); }, counter)
  };
  const id = {collection: "maintenance", key: "prune", userId: SYSTEM_ID};
  const row = nk.storageRead([id])[0];
  if (row && Number(row.value.lastAt) === now) {
    try {
      nk.storageWrite([{collection: id.collection, key: id.key, userId: SYSTEM_ID, value: {lastAt: now, cursors: next},
        version: row.version, permissionRead: 0, permissionWrite: 0}]);
    } catch (_error) { /* Losing the cursor only restarts the next sweep from the top. */ }
  }
  return counter.removed;
}
// Never fails the caller: cleanup is best effort and retried on a later login.
function maintainStorage(nk: nkruntime.Nakama, logger: nkruntime.Logger, userId: string): void {
  const now = Date.now();
  try { prunePlayerStorage(nk, userId, now); pruneSharedStorage(nk, now); }
  catch (error) {
    if (logger && logger.warn) logger.warn("Storage cleanup skipped: %s", error && (error as {message?: string}).message || String(error));
  }
}
