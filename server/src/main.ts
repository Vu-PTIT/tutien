// Narrow structural types for the Nakama APIs used by this bootstrap.
// Expand against nakama-common definitions when adding realtime match handlers.
interface RuntimeContext { userId?: string; }
interface StorageId { collection: string; key: string; userId: string; }
interface StorageObject { value: { [key: string]: unknown }; }
interface StorageWrite extends StorageId {
  value: { [key: string]: unknown }; version: string;
  permissionRead: number; permissionWrite: number;
}
interface RuntimeNakama {
  storageRead(ids: StorageId[]): StorageObject[];
  storageWrite(writes: StorageWrite[]): unknown;
}
type Rpc = (ctx: RuntimeContext, logger: unknown, nk: RuntimeNakama, payload: string) => string;
interface RuntimeInitializer { registerRpc(id: string, handler: Rpc): void; }

const getProfile: Rpc = function (ctx, _logger, nk, _payload) {
  if (!ctx.userId) throw { code: 16, message: "Authentication required" };
  const id = { collection: "characters", key: "main", userId: ctx.userId };
  let rows = nk.storageRead([id]);
  if (rows.length) return JSON.stringify(rows[0].value);
  const profile = { schemaVersion: 1, realm: "pham_nhan", level: 1, spiritStones: 0 };
  try {
    // Create-only version prevents concurrent requests from resetting progress.
    nk.storageWrite([{
      collection: id.collection, key: id.key, userId: id.userId,
      value: profile, version: "*", permissionRead: 1, permissionWrite: 0
    }]);
  } catch (error) {
    rows = nk.storageRead([id]);
    if (rows.length) return JSON.stringify(rows[0].value);
    throw error;
  }
  return JSON.stringify(profile);
};

function InitModule(_ctx: RuntimeContext, _logger: unknown, _nk: RuntimeNakama, initializer: RuntimeInitializer): void {
  initializer.registerRpc("get_profile", getProfile);
}
