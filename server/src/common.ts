type JsonObject = { [key: string]: unknown };
const SYSTEM_ID = "00000000-0000-0000-0000-000000000000";

function fail(code: nkruntime.Codes, message: string): never {
  throw { code: code, message: message };
}

function authenticated(ctx: nkruntime.Context): string {
  if (!ctx.userId || ctx.userId === SYSTEM_ID) fail(nkruntime.Codes.UNAUTHENTICATED, "Authentication required");
  return ctx.userId;
}

function objectPayload(payload: string): JsonObject {
  if (payload.length > 8192) fail(nkruntime.Codes.INVALID_ARGUMENT, "Payload too large");
  let value: unknown;
  try { value = JSON.parse(payload || "{}"); }
  catch (_error) { return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid JSON"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(nkruntime.Codes.INVALID_ARGUMENT, "Expected JSON object");
  return value as JsonObject;
}

function textField(value: unknown, name: string, min: number, max: number): string {
  if (typeof value !== "string") fail(nkruntime.Codes.INVALID_ARGUMENT, name + " must be text");
  const result = value.trim();
  if (result.length < min || result.length > max || /[\u0000-\u001f\u007f]/.test(result)) {
    fail(nkruntime.Codes.INVALID_ARGUMENT, name + " must contain " + min + "–" + max + " characters without control characters");
  }
  return result;
}

function userName(value: unknown): string {
  const result = textField(value, "username", 3, 20);
  if (!/^[a-zA-Z0-9_]+$/.test(result)) fail(nkruntime.Codes.INVALID_ARGUMENT, "Username: letters, numbers and underscores only");
  return result;
}

function uuidField(value: unknown, name: string): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) || value === SYSTEM_ID) {
    fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid " + name);
  }
  return value.toLowerCase();
}

function pageLimit(value: unknown): number {
  if (value === undefined) return 30;
  if (typeof value !== "number" || value % 1 !== 0 || value < 1 || value > 100) fail(nkruntime.Codes.INVALID_ARGUMENT, "Limit must be 1–100");
  return value;
}

function pageCursor(value: unknown): string | undefined {
  if (value === undefined || value === "") return undefined;
  return textField(value, "cursor", 1, 4096);
}

// One fixed key per actor/action, reused across windows. Storage CAS works across
// Nakama JS VMs; a process-local counter would be trivially bypassed.
function consumeQuota(nk: nkruntime.Nakama, userId: string, action: string, limit: number, windowMs: number): void {
  const id = { collection: "social_limits", key: action, userId: userId };
  for (let attempt = 0; attempt < 4; attempt++) {
    const row = nk.storageRead([id])[0];
    const now = Date.now();
    const active = !!row && Number(row.value.resetAt) > now;
    const count = active ? Number(row.value.count) : 0;
    if (count >= limit) fail(nkruntime.Codes.RESOURCE_EXHAUSTED, "Too many requests; try again later");
    try {
      nk.storageWrite([{
        collection: id.collection, key: id.key, userId: id.userId,
        value: { count: count + 1, resetAt: active ? row.value.resetAt : now + windowMs },
        version: row ? row.version : "*", permissionRead: 0, permissionWrite: 0
      }]);
      return;
    } catch (_error) { /* A concurrent request may have changed the version. */ }
  }
  fail(nkruntime.Codes.UNAVAILABLE, "Request counter busy; retry shortly");
}

function denyNativeWrite(): never {
  return fail(nkruntime.Codes.PERMISSION_DENIED, "Use the Tu Tien social RPC API");
}

function acceptedFriend(nk: nkruntime.Nakama, userId: string, otherId: string): boolean {
  let cursor: string | undefined;
  do {
    const page = nk.friendsList(userId, 100, 0, cursor);
    const friends = page.friends || [];
    for (let i = 0; i < friends.length; i++) {
      if (friends[i].user && friends[i].user!.userId === otherId) return true;
    }
    cursor = page.cursor;
  } while (cursor);
  return false;
}

function socialGroup(nk: nkruntime.Nakama, groupId: string): nkruntime.Group {
  const group = nk.groupsGetId([groupId])[0];
  if (!group || !group.metadata || (group.metadata.kind !== "sect" && group.metadata.kind !== "guild")) {
    return fail(nkruntime.Codes.NOT_FOUND, "Group not found");
  }
  return group;
}

function groupState(nk: nkruntime.Nakama, groupId: string, userId: string): number | undefined {
  let cursor: string | undefined;
  do {
    const page = nk.userGroupsList(userId, 100, undefined, cursor);
    const groups = page.userGroups || [];
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].group && groups[i].group!.id === groupId) return groups[i].state;
    }
    cursor = page.cursor;
  } while (cursor);
  return undefined;
}

// Serialize read/check/mutate sequences (e.g. two promotions of the same member).
// Keep the lock private and release by version, so a stale owner cannot delete a
// replacement lease. These are short local DB calls, never external I/O.
function withGroupLock<T>(nk: nkruntime.Nakama, logger: nkruntime.Logger, groupId: string, fn: () => T): T {
  const id = { collection: "social_locks", key: groupId, userId: SYSTEM_ID };
  const row = nk.storageRead([id])[0];
  if (row && Number(row.value.expiresAt) > Date.now()) fail(nkruntime.Codes.ABORTED, "Group is busy; refresh and retry");
  let version: string;
  try {
    version = nk.storageWrite([{
      collection: id.collection, key: id.key, userId: id.userId,
      value: { owner: nk.uuidv4(), expiresAt: Date.now() + 120000 },
      version: row ? row.version : "*", permissionRead: 0, permissionWrite: 0
    }])[0].version;
  } catch (_error) { return fail(nkruntime.Codes.ABORTED, "Group is busy; refresh and retry"); }
  try { return fn(); }
  finally {
    try { nk.storageDelete([{ collection: id.collection, key: id.key, userId: id.userId, version: version }]); }
    catch (_error) { logger.warn("Group lease release failed; it will expire automatically"); }
  }
}
