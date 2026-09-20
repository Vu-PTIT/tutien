extends SceneTree
## Integration against real Nakama/PostgreSQL, using the same adapter as the UI.
const Api = preload("res://scripts/combat_api.gd")
var clients: Array[CombatApi] = []
var alice: CombatApi
var bob: CombatApi
var alice_id: String
var bob_id: String
var seen_a: Dictionary = {}
var seen_b: Dictionary = {}

func _initialize() -> void:
	_run.call_deferred()

func _good(result: Dictionary, label: String) -> bool:
	if result.has("error"):
		push_error(label + ": " + str(result.error))
		return false
	return true

func _check(ok: bool, label: String) -> bool:
	if not ok: push_error(label)
	return ok

func _player(api: CombatApi, id: String) -> Dictionary:
	for p: Dictionary in api.snapshot.get("players", []):
		if p.id == id: return p
	return {}

func _wait_for(predicate: Callable, seconds: float = 10.0) -> bool:
	var deadline := Time.get_ticks_msec() + int(seconds * 1000)
	while Time.get_ticks_msec() < deadline:
		if predicate.call(): return true
		await process_frame
	return false

func _run() -> void:
	for i in range(3):
		var api := Api.new()
		root.add_child(api)
		clients.append(api)
	alice = clients[0]
	bob = clients[1]
	var success := await _scenario()
	for api in clients:
		api.disconnect_chat()
		if not api.token.is_empty():
			var cleanup: Dictionary = await api._request(HTTPClient.METHOD_DELETE, "/v2/account", null, "Bearer " + api.token)
			if not _good(cleanup, "Cleanup"): success = false
		api.queue_free()
	if success: print("PASS Godot combat: consent, capacity, movement, HP agreement, reconnect, finish and unchanged profile")
	quit(0 if success else 1)

func _scenario() -> bool:
	var suffix := Crypto.new().generate_random_bytes(4).hex_encode()
	var password := Crypto.new().generate_random_bytes(20).hex_encode()
	for i in range(3):
		var name := "duel%d_%s" % [i, suffix]
		if not _good(await clients[i].register_account(name + "@example.com", password, name), "Register"): return false
		if not _good(await clients[i].connect_chat(), "Socket"): return false
	var account_a := await alice.get_account()
	var account_b := await bob.get_account()
	if not _good(account_a, "Account A") or not _good(account_b, "Account B"): return false
	alice_id = str(account_a.user.id)
	bob_id = str(account_b.user.id)
	var profile_a := await alice.call_rpc("get_profile")
	var profile_b := await bob.call_rpc("get_profile")
	if not _good(profile_a, "Profile A") or not _good(profile_b, "Profile B"): return false
	if not _check((await alice.call_rpc("combat_create", {})).has("error"), "Missing consent accepted"): return false
	alice.snapshot_received.connect(func(s: Dictionary) -> void: seen_a[int(s.tick)] = s)
	bob.snapshot_received.connect(func(s: Dictionary) -> void: seen_b[int(s.tick)] = s)
	if not _good(await alice.create_sparring(), "Create match"): return false
	var room_id := alice.match_id
	if not _good(await bob.join_sparring(room_id), "Join match"): return false
	if not _check((await clients[2].join_sparring(room_id)).has("error"), "Third player accepted"): return false
	if not await _wait_for(func() -> bool: return not alice.epoch.is_empty() and not bob.epoch.is_empty()): return _check(false, "No initial snapshot")
	if not _check(alice.send_input(Vector2.ZERO, Vector2.RIGHT, "ready") == OK, "Send ready A failed"): return false
	if not _check(bob.send_input(Vector2.ZERO, Vector2.LEFT, "ready") == OK, "Send ready B failed"): return false
	if not await _wait_for(func() -> bool: return alice.snapshot.get("phase", "") == "active" and bob.snapshot.get("phase", "") == "active"):
		print("Combat start diagnostics: ", JSON.stringify({"a": alice.snapshot, "b": bob.snapshot}))
		return _check(false, "Match did not start")
	# Move into melee range with fresh intents; never submit positions.
	var deadline := Time.get_ticks_msec() + 6000
	while Time.get_ticks_msec() < deadline:
		var a := _player(alice, alice_id)
		var b := _player(alice, bob_id)
		if float(b.x) - float(a.x) <= 45.0: break
		alice.send_input(Vector2.RIGHT, Vector2.RIGHT)
		await create_timer(0.05).timeout
	alice.send_input(Vector2.ZERO, Vector2.RIGHT)
	await create_timer(0.3).timeout
	if not _check(float(_player(alice, alice_id).x) > 380.0, "Movement missing"): return false
	alice.send_input(Vector2.ZERO, Vector2.RIGHT, "sk_basic")
	if not await _wait_for(func() -> bool: return int(_player(bob, bob_id).get("hp", 100)) < 100): return _check(false, "Damage missing")
	var hp_before := int(_player(bob, bob_id).hp)
	# A reconnect gets existing combat state, not full HP or a new fighter.
	bob.disconnect_chat()
	if not await _wait_for(func() -> bool: return not bool(_player(alice, bob_id).get("connected", true))): return _check(false, "Disconnect missing")
	if not _good(await bob.connect_chat(), "Reconnect socket"): return false
	if not _good(await bob.join_sparring(room_id), "Rejoin"): return false
	if not await _wait_for(func() -> bool: return not _player(bob, bob_id).is_empty()): return _check(false, "Reconnect snapshot missing")
	if not _check(int(_player(bob, bob_id).hp) == hp_before, "Reconnect reset HP"): return false
	deadline = Time.get_ticks_msec() + 12000
	while Time.get_ticks_msec() < deadline and alice.snapshot.get("phase", "") != "finished":
		alice.send_input(Vector2.ZERO, Vector2.RIGHT, "sk_basic")
		await create_timer(0.75).timeout
	if not await _wait_for(func() -> bool: return bob.snapshot.get("phase", "") == "finished"): return _check(false, "No match result")
	if not _check(alice.snapshot.winner == alice_id and bob.snapshot.winner == alice_id, "Winner disagreement"): return false
	var common := 0
	for tick in seen_a:
		if seen_b.has(tick):
			# MatchJoin can broadcast twice during the same tick. Compare active ticks.
			if seen_a[tick].phase != "active" or seen_b[tick].phase != "active": continue
			var a_players: Array = seen_a[tick].players
			var b_players: Array = seen_b[tick].players
			for i in range(a_players.size()):
				if not _check(a_players[i].hp == b_players[i].hp, "Authoritative HP disagrees"): return false
			common += 1
	if not _check(common > 5, "Too few shared snapshots"): return false
	if not _check(await alice.call_rpc("get_profile") == profile_a and await bob.call_rpc("get_profile") == profile_b, "Sparring changed persistent profile"): return false
	if not _good(await alice.leave_sparring(), "Leave A"): return false
	return _good(await bob.leave_sparring(), "Leave B")
