function passwordCredential(nk: nkruntime.Nakama, account: nkruntime.AccountEmail, creating: boolean): void {
  if (!account) fail(nkruntime.Codes.INVALID_ARGUMENT, "Credentials required");
  if (typeof account.password !== "string" || !account.password.length) fail(nkruntime.Codes.INVALID_ARGUMENT, "Password required");
  // Nakama uses bcrypt. Enforce its byte limit without trimming passwords.
  if (nk.stringToBinary(account.password).byteLength > 72 || (creating && account.password.length < 10)) {
    fail(nkruntime.Codes.INVALID_ARGUMENT, "Password: at least 10 characters and at most 72 UTF-8 bytes");
  }
}

function emailCredentials(nk: nkruntime.Nakama, account: nkruntime.AccountEmail, creating: boolean): void {
  passwordCredential(nk, account, creating);
  account.email = textField(account.email, "email", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email) || nk.stringToBinary(account.email).byteLength < 10 || nk.stringToBinary(account.email).byteLength > 254) {
    fail(nkruntime.Codes.INVALID_ARGUMENT, "Email must be valid and contain 10–254 UTF-8 bytes");
  }
}

function registerAuth(initializer: nkruntime.Initializer): void {
  initializer.registerBeforeAuthenticateEmail(function (ctx, _logger, nk, request) {
    consumeQuota(nk, SYSTEM_ID, "auth_" + nk.sha256Hash(ctx.clientIp || "unknown"), 30, 60000);
    if (request.create === false && request.account && !request.account.email) {
      passwordCredential(nk, request.account, false);
      request.username = userName(request.username);
    } else emailCredentials(nk, request.account, request.create !== false);
    if (request.create !== false) request.username = userName(request.username);
    return request;
  });
  initializer.registerBeforeLinkEmail(function (ctx, _logger, nk, request) {
    consumeQuota(nk, authenticated(ctx), "link_email", 5, 60000);
    emailCredentials(nk, request, true);
    return request;
  });
  initializer.registerBeforeAuthenticateDevice(function (ctx, _logger, nk, request) {
    if (ctx.env.ALLOW_DEVICE_AUTH !== "true") fail(nkruntime.Codes.PERMISSION_DENIED, "Guest login is disabled");
    consumeQuota(nk, SYSTEM_ID, "auth_" + nk.sha256Hash(ctx.clientIp || "unknown"), 30, 60000);
    return request;
  });
  initializer.registerBeforeAuthenticateCustom(denyNativeWrite);
  initializer.registerBeforeUpdateAccount(function (ctx, _logger, nk, request) {
    consumeQuota(nk, authenticated(ctx), "account_update", 10, 60000);
    if (request.username !== undefined) request.username = userName(request.username);
    if (request.displayName !== undefined) request.displayName = textField(request.displayName, "displayName", 1, 30);
    return request;
  });
}
