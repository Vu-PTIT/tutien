extends SceneTree
## Live Godot/Nakama smoke for the single-player server-owned encounter.
const Api = preload("res://scripts/combat_api.gd")
var api: CombatApi

func _initialize() -> void:
	_run.call_deferred()

func _good(result: Dictionary, label: String) -> bool:
	if result.has("error"):
		push_error(label + ": " + str(result.error))
		return false
	return true

func _wait_for(predicate: Callable, seconds: float = 8.0) -> bool:
	var deadline := Time.get_ticks_msec() + int(seconds * 1000)
	while Time.get_ticks_msec() < deadline:
		if predicate.call():
			return true
		await process_frame
	return false

func _player() -> Dictionary:
	var players: Array = api.snapshot.get("players", [])
	return players[0] if not players.is_empty() else {}

func _run() -> void:
	api = Api.new()
	root.add_child(api)
	var suffix := Crypto.new().generate_random_bytes(5).hex_encode()
	var password := Crypto.new().generate_random_bytes(20).hex_encode()
	var username := "boar_" + suffix
	var success := _good(await api.register_account(username + "@example.com", password, username), "Register")
	if success:
		success = _good(await api.connect_chat(), "Socket")
	if success:
		success = await _scenario()
	if api != null:
		api.disconnect_chat()
		if not api.token.is_empty():
			var cleanup := await api._request(HTTPClient.METHOD_DELETE, "/v2/account", null, "Bearer " + api.token)
			if not _good(cleanup, "Cleanup"):
				success = false
		api.queue_free()
	if success:
		print("PASS Godot PvE: server encounter, movement, range check, brief reconnect and unchanged profile")
	else:
		push_error("Godot PvE smoke failed")
	quit(0 if success else 1)

func _scenario() -> bool:
	var before := await api.call_rpc("get_profile")
	if not _good(before, "Profile before encounter"):
		return false
	if not _check((await api.call_rpc("pve_son_tru_create", {})).has("error"), "Missing opt-in accepted"):
		return false
	if not _good(await api.create_son_tru_encounter(), "Create Sơn Trư encounter"):
		return false
	if not _check(api.match_kind == "pve_son_tru", "Client selected PvE protocol"):
		return false
	if not await _wait_for(func() -> bool:
		return api.snapshot.get("phase", "") == "active" and not api.snapshot.get("boar", {}).is_empty()):
		return _check(false, "No authoritative encounter snapshot")
	if not _check(int(api.snapshot.boar.hp) == 60 and api.snapshot.boar.id == "en_boar", "Server sent the authored boar state"):
		return false
	var x_before := float(_player().x)
	api.send_input(Vector2.ZERO, Vector2.RIGHT, "sk_basic")
	await create_timer(0.35).timeout
	if not _check(int(api.snapshot.boar.hp) == 60, "An out-of-range client attack damaged the boar"):
		return false
	for _i in range(18):
		api.send_input(Vector2.RIGHT, Vector2.RIGHT)
		await create_timer(0.05).timeout
	await create_timer(0.2).timeout
	if not _check(float(_player().x) > x_before + 60.0, "Server did not apply movement intents"):
		return false
	var hp_before := int(_player().hp)
	var position_before := Vector2(float(_player().x), float(_player().y))
	api.disconnect_chat()
	await create_timer(0.4).timeout
	if not _good(await api.connect_chat(), "Reconnect socket"):
		return false
	if not _good(await api.rejoin_current_match(), "Rejoin encounter"):
		return false
	if not await _wait_for(func() -> bool: return not _player().is_empty()):
		return _check(false, "Reconnect did not restore the player")
	if not _check(int(_player().hp) == hp_before, "Reconnect reset server health"):
		return false
	if not _check(Vector2(float(_player().x), float(_player().y)).distance_to(position_before) < 1.0, "Reconnect changed the server position"):
		return false
	var after := await api.call_rpc("get_profile")
	if not _check(after == before, "Combat changed persistent progression"):
		return false
	return _good(await api.leave_current_match(), "Leave encounter")

func _check(ok: bool, label: String) -> bool:
	if not ok:
		push_error(label)
	return ok
