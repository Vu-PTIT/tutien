const getProfile: nkruntime.RpcFunction = function (ctx, _logger, nk, _payload) {
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

function InitModule(_ctx: nkruntime.Context, _logger: nkruntime.Logger, _nk: nkruntime.Nakama, initializer: nkruntime.Initializer): void {
  initializer.registerRpc("get_profile", getProfile);
  registerAuth(initializer);
  registerFriends(initializer);
  registerGroups(initializer);
  registerChat(initializer);
  // Prevent a client creating a forged character BEFORE get_profile first runs.
  initializer.registerBeforeWriteStorageObjects(denyNativeWrite);
  initializer.registerBeforeDeleteStorageObjects(denyNativeWrite);
}
