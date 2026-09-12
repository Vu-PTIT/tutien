extends SceneTree
## Run only against the local development backend. Deletes its own test accounts.
const Api = preload("res://scripts/social_api.gd")
var alice: SocialApi
var bob: SocialApi
var received: Array[Dictionary] = []

func _initialize() -> void:
	_run.call_deferred()

func _good(result: Dictionary, label: String) -> bool:
	if result.has("error"):
		push_error(label + ": " + str(result.error))
		return false
	return true

func _run() -> void:
	alice = Api.new()
	bob = Api.new()
	root.add_child(alice)
	root.add_child(bob)
	var success := await _scenario()
	for api in [alice, bob]:
		api.disconnect_chat()
		if not api.token.is_empty():
			var cleanup: Dictionary = await api._request(HTTPClient.METHOD_DELETE, "/v2/account", null, "Bearer " + api.token)
			if not _good(cleanup, "Cleanup"):
				success = false
		api.queue_free()
	if success:
		print("PASS Godot SocialApi: registration, login, friendship, group, HTTP history and realtime delivery")
	quit(0 if success else 1)

func _scenario() -> bool:
	var suffix := Crypto.new().generate_random_bytes(4).hex_encode()
	var password := Crypto.new().generate_random_bytes(20).hex_encode()
	var name := "godota_" + suffix
	if not _good(await alice.register_account(name + "@example.com", password, name), "Register Alice"):
		return false
	if not _good(await bob.register_account("godotb_" + suffix + "@example.com", password, "godotb_" + suffix), "Register Bob"):
		return false
	if not _good(await alice.login(name, password), "Username login"):
		return false
	var account_a := await alice.get_account()
	var account_b := await bob.get_account()
	if not _good(account_a, "Account A") or not _good(account_b, "Account B"):
		return false
	if not _good(await alice.add_friend(account_b.user.id), "Invite"):
		return false
	if not _good(await bob.add_friend(account_a.user.id), "Accept"):
		return false
	if not _good(await alice.call_rpc("get_profile"), "Profile"):
		return false
	var group := await alice.call_rpc("social_group_create", {"kind": "sect", "name": "Godot " + suffix})
	if not _good(group, "Create group"):
		return false
	bob.chat_message_received.connect(func(message: Dictionary) -> void: received.append(message))
	if not _good(await bob.connect_chat(), "Connect socket"):
		return false
	if not _good(await bob.join_chat("direct", account_a.user.id), "Subscribe DM"):
		return false
	var sent := await alice.send_chat("direct", "Xin chào từ Godot", account_b.user.id)
	if not _good(sent, "Send DM"):
		return false
	var deadline := Time.get_ticks_msec() + 10000
	while received.is_empty() and Time.get_ticks_msec() < deadline:
		await process_frame
	if received.is_empty() or str(received[0].get("message_id", "")) != str(sent.get("messageId", "")):
		push_error("Realtime delivery failed")
		return false
	var history := await bob.chat_history("direct", account_a.user.id)
	if not _good(history, "History") or history.get("messages", []).is_empty():
		return false
	if not _good(await alice.call_rpc("social_group_action", {"groupId": group.group.id, "action": "disband", "confirmName": group.group.name}), "Disband"):
		return false
	return _good(await alice.refresh_session(), "Refresh")
