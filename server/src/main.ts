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
  initializer.registerRpc("social_find_player", socialFindPlayerRpc);
  initializer.registerRpc("social_group_create", groupCreateRpc);
  initializer.registerRpc("social_group_action", groupActionRpc);
  initializer.registerRpc("social_groups", socialGroupsRpc);
  initializer.registerRpc("social_group_members", socialGroupMembersRpc);
  initializer.registerRpc("social_chat_send", socialChatSendRpc);
  initializer.registerRpc("social_chat_history", socialChatHistoryRpc);

  initializer.registerBeforeAuthenticateEmail(beforeAuthenticateEmail);
  initializer.registerBeforeLinkEmail(beforeLinkEmail);
  initializer.registerBeforeAuthenticateDevice(beforeAuthenticateDevice);
  initializer.registerBeforeAuthenticateCustom(denyNativeWrite);
  initializer.registerBeforeUpdateAccount(beforeUpdateAccount);

  initializer.registerBeforeAddFriends(friendMutation);
  initializer.registerBeforeDeleteFriends(friendMutation);
  initializer.registerBeforeBlockFriends(friendMutation);

  initializer.registerBeforeCreateGroup(denyNativeWrite);
  initializer.registerBeforeUpdateGroup(denyNativeWrite);
  initializer.registerBeforeDeleteGroup(denyNativeWrite);
  initializer.registerBeforeJoinGroup(denyNativeWrite);
  initializer.registerBeforeLeaveGroup(denyNativeWrite);
  initializer.registerBeforeAddGroupUsers(denyNativeWrite);
  initializer.registerBeforeKickGroupUsers(denyNativeWrite);
  initializer.registerBeforeBanGroupUsers(denyNativeWrite);
  initializer.registerBeforePromoteGroupUsers(denyNativeWrite);
  initializer.registerBeforeDemoteGroupUsers(denyNativeWrite);
  initializer.registerBeforeListGroupUsers(denyNativeWrite);
  initializer.registerBeforeListUserGroups(denyNativeWrite);

  initializer.registerRtBefore("ChannelJoin", rtBeforeChannelJoin);
  initializer.registerRtBefore("ChannelMessageSend", denyNativeWrite);
  initializer.registerRtBefore("ChannelMessageUpdate", denyNativeWrite);
  initializer.registerRtBefore("ChannelMessageRemove", denyNativeWrite);
  initializer.registerBeforeListChannelMessages(denyNativeWrite);

  // Prevent a client creating a forged character BEFORE get_profile first runs.
  initializer.registerBeforeWriteStorageObjects(denyNativeWrite);
  initializer.registerBeforeDeleteStorageObjects(denyNativeWrite);
}

