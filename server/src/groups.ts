const GROUP_MAX_MEMBERS = 50;

const groupCreateRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const actor = authenticated(ctx);
  consumeQuota(nk, actor, "group_create", 2, 60000);
  const data = objectPayload(payload);
  if (data.kind !== "sect" && data.kind !== "guild") fail(nkruntime.Codes.INVALID_ARGUMENT, "kind must be sect or guild");
  const name = textField(data.name, "name", 3, 32);
  const description = textField(data.description === undefined ? "" : data.description, "description", 0, 300);
  const group = nk.groupCreate(actor, name, actor, "vi", description, "", false, { kind: data.kind, schemaVersion: 1 }, GROUP_MAX_MEMBERS);
  return JSON.stringify({ group: group });
};

const groupActionRpc: nkruntime.RpcFunction = function (ctx, logger, nk, payload) {
  const actor = authenticated(ctx);
  consumeQuota(nk, actor, "group_action", 30, 60000);
  const data = objectPayload(payload);
  const id = uuidField(data.groupId, "groupId");
  return withGroupLock(nk, logger, id, function () {
    const group = socialGroup(nk, id);
    const role = groupState(nk, id, actor);
    if (data.action === "join") {
      if (role === undefined) nk.groupUserJoin(id, actor, ctx.username || "");
      return JSON.stringify({ state: groupState(nk, id, actor) });
    }
    if (data.action === "leave") {
      if (role === 0) fail(nkruntime.Codes.FAILED_PRECONDITION, "Leader must disband the group; leadership transfer is not enabled yet");
      if (role !== undefined) nk.groupUserLeave(id, actor, ctx.username || "");
      return JSON.stringify({ ok: true });
    }
    if (role === undefined || role > 1) fail(nkruntime.Codes.PERMISSION_DENIED, "Group manager required");
    if (data.action === "update") {
      const description = textField(data.description, "description", 0, 300);
      nk.groupUpdate(id, actor, null, null, null, description);
      return JSON.stringify({ group: socialGroup(nk, id) });
    }
    if (data.action === "disband") {
      if (role !== 0) fail(nkruntime.Codes.PERMISSION_DENIED, "Leader required");
      if (data.confirmName !== group.name) fail(nkruntime.Codes.INVALID_ARGUMENT, "Confirm the exact group name");
      nk.groupDelete(id);
      return JSON.stringify({ ok: true });
    }
    if (["approve", "reject", "kick", "promote", "demote"].indexOf(String(data.action)) < 0) fail(nkruntime.Codes.INVALID_ARGUMENT, "Unknown group action");
    const target = uuidField(data.userId, "userId");
    if (target === actor) fail(nkruntime.Codes.INVALID_ARGUMENT, "Cannot manage your own role");
    const targetRole = groupState(nk, id, target);
    if (data.action === "approve" || data.action === "reject") {
      if (targetRole !== 3) fail(nkruntime.Codes.FAILED_PRECONDITION, "Pending join request required");
      if (data.action === "approve") {
        if (group.edgeCount >= group.maxCount) fail(nkruntime.Codes.RESOURCE_EXHAUSTED, "Group is full");
        nk.groupUsersAdd(id, [target], actor);
      } else nk.groupUsersKick(id, [target], actor);
    } else if (data.action === "kick") {
      if (targetRole === undefined || targetRole > 2 || targetRole <= role) fail(nkruntime.Codes.PERMISSION_DENIED, "Can only remove a lower-ranked member");
      nk.groupUsersKick(id, [target], actor);
    } else {
      if (role !== 0) fail(nkruntime.Codes.PERMISSION_DENIED, "Leader required");
      const expected = data.action === "promote" ? 2 : 1;
      if (targetRole !== expected) fail(nkruntime.Codes.FAILED_PRECONDITION, "Refresh member role before changing it");
      if (data.action === "promote") nk.groupUsersPromote(id, [target], actor);
      else nk.groupUsersDemote(id, [target], actor);
    }
    return JSON.stringify({ ok: true });
  });
};

function registerGroups(initializer: nkruntime.Initializer): void {
  initializer.registerRpc("social_group_create", groupCreateRpc);
  initializer.registerRpc("social_group_action", groupActionRpc);
  initializer.registerRpc("social_groups", function (ctx, _logger, nk, payload) {
    consumeQuota(nk, authenticated(ctx), "group_read", 120, 60000);
    const data = objectPayload(payload);
    const kind = data.kind;
    if (kind !== undefined && kind !== "sect" && kind !== "guild") fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid kind");
    if (data.mine === true) {
      const result = nk.userGroupsList(ctx.userId!, pageLimit(data.limit), undefined, pageCursor(data.cursor));
      return JSON.stringify({ userGroups: (result.userGroups || []).filter(function (g) {
        return !!g.group && !!g.group.metadata && (g.group.metadata.kind === "sect" || g.group.metadata.kind === "guild") && (!kind || g.group.metadata.kind === kind);
      }), cursor: result.cursor || "" });
    }
    const query = data.query === undefined ? undefined : textField(data.query, "query", 1, 32);
    if (query && /[%_\\]/.test(query)) fail(nkruntime.Codes.INVALID_ARGUMENT, "Search wildcards are not allowed");
    const result = nk.groupsList(query ? query + "%" : undefined, undefined, undefined, undefined, pageLimit(data.limit), pageCursor(data.cursor));
    return JSON.stringify({ groups: (result.groups || []).filter(function (g) {
      return !!g.metadata && (g.metadata.kind === "sect" || g.metadata.kind === "guild") && (!kind || g.metadata.kind === kind);
    }), cursor: result.cursor || "" });
  });
  initializer.registerRpc("social_group_members", function (ctx, _logger, nk, payload) {
    const actor = authenticated(ctx);
    consumeQuota(nk, actor, "group_read", 120, 60000);
    const data = objectPayload(payload);
    const id = uuidField(data.groupId, "groupId");
    socialGroup(nk, id);
    const role = groupState(nk, id, actor);
    if (role === undefined || role > 2) fail(nkruntime.Codes.PERMISSION_DENIED, "Group membership required");
    const state = data.state;
    if (state !== undefined && [0, 1, 2, 3].indexOf(state as number) < 0) fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid state");
    if (state === 3 && role > 1) fail(nkruntime.Codes.PERMISSION_DENIED, "Only managers can see join requests");
    const result = nk.groupUsersList(id, pageLimit(data.limit), state as number | undefined, pageCursor(data.cursor));
    return JSON.stringify({ groupUsers: (result.groupUsers || []).filter(function (u) { return role <= 1 || (u.state !== undefined && u.state <= 2); }), cursor: result.cursor || "" });
  });
  // Runtime calls above bypass API hooks. Block alternate client paths so the
  // fixed capacity, private membership, roles and group lease stay authoritative.
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
}
