function friendMutation(ctx: nkruntime.Context, _logger: nkruntime.Logger, nk: nkruntime.Nakama, request: nkruntime.AddFriendsRequest): nkruntime.AddFriendsRequest {
  const actor = authenticated(ctx);
  consumeQuota(nk, actor, "friend_mutation", 30, 60000);
  const ids = request.ids || [];
  const names = request.usernames || [];
  if (ids.length + names.length < 1 || ids.length + names.length > 10) fail(nkruntime.Codes.INVALID_ARGUMENT, "Choose 1–10 players");
  for (let i = 0; i < ids.length; i++) {
    ids[i] = uuidField(ids[i], "userId");
    if (ids[i] === actor) fail(nkruntime.Codes.INVALID_ARGUMENT, "Cannot friend yourself");
  }
  for (let i = 0; i < names.length; i++) {
    names[i] = userName(names[i]);
    if (names[i] === ctx.username) fail(nkruntime.Codes.INVALID_ARGUMENT, "Cannot friend yourself");
  }
  return request;
}

function registerFriends(initializer: nkruntime.Initializer): void {
  initializer.registerBeforeAddFriends(friendMutation);
  initializer.registerBeforeDeleteFriends(friendMutation);
  initializer.registerBeforeBlockFriends(friendMutation);
  initializer.registerRpc("social_find_player", function (ctx, _logger, nk, payload) {
    consumeQuota(nk, authenticated(ctx), "player_lookup", 60, 60000);
    const name = userName(objectPayload(payload).username);
    const user = nk.usersGetUsername([name])[0];
    if (!user) return fail(nkruntime.Codes.NOT_FOUND, "Player not found");
    return JSON.stringify({ userId: user.userId, username: user.username, displayName: user.displayName || "", online: user.online });
  });
}
