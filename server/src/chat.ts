const WORLD_ROOM = "world:vi:1";

function chatChannel(ctx: nkruntime.Context, nk: nkruntime.Nakama, data: JsonObject): string {
  const actor = authenticated(ctx);
  if (data.type === "world") return nk.channelIdBuild(actor, WORLD_ROOM, nkruntime.ChanType.Room);
  const target = uuidField(data.targetId, "targetId");
  if (data.type === "direct") {
    if (target === actor || !acceptedFriend(nk, actor, target)) fail(nkruntime.Codes.PERMISSION_DENIED, "Direct messages require an accepted friendship");
    return nk.channelIdBuild(actor, target, nkruntime.ChanType.DirectMessage);
  }
  if (data.type === "group") {
    socialGroup(nk, target);
    const role = groupState(nk, target, actor);
    if (role === undefined || role > 2) fail(nkruntime.Codes.PERMISSION_DENIED, "Group membership required");
    return nk.channelIdBuild(actor, target, nkruntime.ChanType.Group);
  }
  return fail(nkruntime.Codes.INVALID_ARGUMENT, "Chat type must be world, direct or group");
}

function socialChatSendRpc(ctx: nkruntime.Context, _logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  const actor = authenticated(ctx);
  consumeQuota(nk, actor, "chat_burst", 5, 5000);
  consumeQuota(nk, actor, "chat_minute", 60, 60000);
  const data = objectPayload(payload);
  const text = textField(data.text, "text", 1, 500);
  const channel = chatChannel(ctx, nk, data);
  // Author and persistence are server-owned. Ignore client-supplied sender,
  // role, item links and money fields; this first version supports plain text.
  const result = nk.channelMessageSend(channel, { text: text }, actor, nk.accountGetId(actor).user.username, true);
  return JSON.stringify(result);
}

function socialChatHistoryRpc(ctx: nkruntime.Context, _logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  consumeQuota(nk, authenticated(ctx), "chat_history", 120, 60000);
  const data = objectPayload(payload);
  const channel = chatChannel(ctx, nk, data);
  const result = nk.channelMessagesList(channel, pageLimit(data.limit), false, pageCursor(data.cursor));
  return JSON.stringify({ channelId: channel, messages: result.messages || [], nextCursor: result.nextCursor || "", prevCursor: result.prevCursor || "" });
}

function rtBeforeChannelJoin(ctx: nkruntime.Context, _logger: nkruntime.Logger, nk: nkruntime.Nakama, envelope: nkruntime.EnvelopeChannelJoin): nkruntime.EnvelopeChannelJoin {
  consumeQuota(nk, authenticated(ctx), "chat_join", 30, 60000);
  const req = envelope.channelJoin;
  let type: string;
  if (req.type === 1) {
    if (req.target !== WORLD_ROOM) fail(nkruntime.Codes.PERMISSION_DENIED, "Unknown world room");
    type = "world";
  } else if (req.type === 2) type = "direct";
  else if (req.type === 3) type = "group";
  else return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid channel type");
  chatChannel(ctx, nk, { type: type, targetId: req.target });
  req.persistence = true;
  return envelope;
}

