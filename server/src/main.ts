const getProfile: nkruntime.RpcFunction = function (ctx, _logger, nk, _payload) {
  return JSON.stringify(loadCharacter(nk, authenticated(ctx)).state);
};

function InitModule(_ctx: nkruntime.Context, _logger: nkruntime.Logger, _nk: nkruntime.Nakama, initializer: nkruntime.Initializer): void {
  initializer.registerRpc("get_profile", getProfile);
  initializer.registerRpc("character_forms", characterFormsRpc);
  initializer.registerRpc("character_select_form", characterSelectFormRpc);
  initializer.registerRpc("contract_get", contractGetRpc);
  initializer.registerRpc("contract_invite", contractInviteRpc);
  initializer.registerRpc("contract_respond", contractRespondRpc);
  initializer.registerRpc("contract_release", contractReleaseRpc);
  initializer.registerRpc("contract_hunt_start", contractHuntStartRpc);
  initializer.registerRpc("contract_hunt_attack", contractHuntAttackRpc);
  initializer.registerRpc("contract_hunt_leave", contractHuntLeaveRpc);
  initializer.registerRpc("contract_hunt_claim", contractHuntClaimRpc);
  initializer.registerRpc("inventory_get", inventoryGetRpc);
  initializer.registerRpc("inventory_claim_starter", inventoryClaimStarterRpc);
  initializer.registerRpc("inventory_equip", inventoryEquipRpc);
  initializer.registerRpc("skill_equip", skillEquipRpc);
  initializer.registerRpc("inventory_use", inventoryUseRpc);
  initializer.registerRpc("inventory_discard", inventoryDiscardRpc);
  initializer.registerRpc("economy_action", economyActionRpc);
  initializer.registerRpc("garden_action", gardenActionRpc);
  initializer.registerRpc("garden_get", gardenGetRpc);
  initializer.registerRpc("life_get", lifeGetRpc);
  initializer.registerRpc("life_claim_starter", lifeClaimStarterRpc);
  initializer.registerRpc("activity_start", activityStartRpc);
  initializer.registerRpc("activity_get", activityGetRpc);
  initializer.registerRpc("activity_claim", activityClaimRpc);
  initializer.registerRpc("activity_cancel", activityCancelRpc);
  initializer.registerRpc("activity_control", activityControlRpc);
  initializer.registerRpc("pve_son_tru_create", pveSonTruCreateRpc);
  initializer.registerRpc("pve_son_tru_claim_pending", pveSonTruClaimPendingRpc);
  initializer.registerRpc("world_get", worldGetRpc);
  initializer.registerRpc("world_map_get", worldMapGetRpc);
  initializer.registerRpc("world_travel", worldTravelRpc);
  initializer.registerRpc("world_move", worldMoveRpc);
  initializer.registerRpc("world_interact", worldInteractRpc);
  initializer.registerRpc("world_attack", worldAttackRpc);
  initializer.registerRpc("combat_create", combatCreateRpc);
  initializer.registerMatch("sparring", {
    matchInit: combatInit, matchJoinAttempt: combatJoinAttempt, matchJoin: combatJoin,
    matchLeave: combatLeave, matchLoop: combatLoop, matchTerminate: combatTerminate,
    matchSignal: combatSignal
  });
  initializer.registerMatch("pve_son_tru", pveSonTruMatch);
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
