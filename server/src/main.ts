const getProfile: nkruntime.RpcFunction = function (ctx, _logger, nk, _payload) {
  return JSON.stringify(loadCharacter(nk, authenticated(ctx)).state);
};

function InitModule(_ctx: nkruntime.Context, _logger: nkruntime.Logger, _nk: nkruntime.Nakama, initializer: nkruntime.Initializer): void {
  initializer.registerRpc("get_profile", getProfile);
  initializer.registerRpc("inventory_get", inventoryGetRpc);
  initializer.registerRpc("inventory_claim_starter", inventoryClaimStarterRpc);
  initializer.registerRpc("combat_create", combatCreateRpc);
  initializer.registerMatch("sparring", {
    matchInit: combatInit, matchJoinAttempt: combatJoinAttempt, matchJoin: combatJoin,
    matchLeave: combatLeave, matchLoop: combatLoop, matchTerminate: combatTerminate,
    matchSignal: combatSignal
  });
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

