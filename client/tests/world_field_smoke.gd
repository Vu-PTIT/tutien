extends SceneTree
## End-to-end world travel, physical gates and map-based field combat against Nakama.
const Main = preload("res://scenes/main.tscn")
const ItemVisuals = preload("res://scripts/ui/item_visuals.gd")
var failures: int = 0

func _initialize() -> void:
	_run.call_deferred()

func _check(ok: bool, label: String) -> void:
	if not ok:
		failures += 1
		push_error(label)

func _travel_from_map_panel(main, map_id: String) -> bool:
	main.world_map.open_map()
	main.world_map._select_map(map_id)
	main.world_map.travel_button.emit_signal("pressed")
	var deadline := Time.get_ticks_msec() + 20000
	while main.busy and Time.get_ticks_msec() < deadline:
		await process_frame
	await process_frame
	return not main.busy and main.current_map_id == map_id

func _move_authoritatively(main, point: Vector2) -> bool:
	main.busy = true
	main.player.position = point
	await create_timer(3.1).timeout
	var result: Dictionary = await main._sync_world_position(true)
	main.busy = false
	if result.has("error"):
		push_error("World movement failed: " + str(result.error))
		return false
	return true

func _run() -> void:
	var main = Main.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var api: CombatApi = main.api
	var connection_deadline := Time.get_ticks_msec() + 30000
	while not main.backend_connection_attempted and Time.get_ticks_msec() < connection_deadline:
		await process_frame
	_check(main.backend_connection_attempted, "Client did not finish its automatic startup backend connection")
	var connected := api != null and not api.token.is_empty()
	_check(connected, "Client did not connect to the local Nakama server on startup")
	if connected:
		var entered_farm := await _travel_from_map_panel(main, "m_truc_am")
		_check(entered_farm, "Map panel did not transfer online travel to Trúc Âm")
		var drop_state: Dictionary = await api.call_rpc("world_get")
		var boar_drop_count := 0
		var spider_drop_count := 0
		for mob_value: Variant in drop_state.get("fieldMobs", []):
			if not mob_value is Dictionary:
				continue
			var mob: Dictionary = mob_value
			if str(mob.get("enemyId", "")) == "en_boar" and str(mob.get("equipmentDropItemId", "")) == "it_iron_sword" and int(mob.get("equipmentDropPityKills", 0)) == 8:
				boar_drop_count += 1
			if str(mob.get("enemyId", "")) == "en_spider" and str(mob.get("equipmentDropItemId", "")) == "it_spider_robe" and int(mob.get("equipmentDropPityKills", 0)) == 12:
				spider_drop_count += 1
		_check(boar_drop_count == 2, "Both field boars must share the server sword drop table")
		_check(spider_drop_count == 2, "Both field spiders must share the server robe drop table")
		var robe_visual: Array = ItemVisuals.definition("it_spider_robe")
		_check(str(robe_visual[2]) == "equipment" and str(robe_visual[3]).contains("+20 thủ"), "Spider robe has a usable equipment inventory definition")
		_check(ItemVisuals.icon("it_spider_robe") != null, "Spider robe resolves its inventory icon")

		var retreat: MapInteractable = main.map_world.get_interactable("ta.retreat.ankhe")
		_check(retreat != null, "Trúc Âm retreat gate was not loaded")
		if retreat != null:
			var reached_gate := await _move_authoritatively(main, Vector2(160.0, 992.0))
			_check(reached_gate, "Could not reach the Trúc Âm gate")
			await main._interact_with_world_object(retreat)
			await process_frame
			_check(main.current_map_id == "m_an_khe", "Server-confirmed gate did not return to An Khê")
			_check(main.player.position == Vector2(704.0, 128.0), "Gate arrival did not use its paired An Khê coordinates")

		var returned_to_farm := await _travel_from_map_panel(main, "m_truc_am")
		_check(returned_to_farm, "Map panel travel back to Trúc Âm failed")
		var map_instance: int = main.map_world.get_instance_id()
		var approach_ok := await _move_authoritatively(main, Vector2(300.0, 740.0))
		_check(approach_ok, "Could not move to the first field-combat waypoint")
		if approach_ok:
			approach_ok = await _move_authoritatively(main, Vector2(464.0, 560.0))
			_check(approach_ok, "Could not reach the field spider")
		if approach_ok:
			for strike in range(3):
				await main._attack_field_mob()
				_check(main.current_map_id == "m_truc_am", "Attacking a field mob changed the current map")
				_check(main.map_world.get_instance_id() == map_instance, "Attacking a field mob reloaded the map scene")
				if strike < 2:
					await create_timer(0.75).timeout
			var profile: Dictionary = await api.call_rpc("get_profile")
			_check(int(profile.get("cultivationXp", 0)) >= 15, "Field combat did not grant the spider's cultivation XP")
			var got_silk := false
			for item: Dictionary in profile.get("inventory", []):
				if str(item.get("itemId", "")) == "it_spider_silk" and int(item.get("quantity", 0)) >= 1:
					got_silk = true
			_check(got_silk, "Field combat did not grant the spider drop")

		var reached_co_tinh := await _travel_from_map_panel(main, "m_co_tinh")
		_check(reached_co_tinh, "Online map panel travel did not load Cổ Tỉnh")
		var returned_to_village := await _travel_from_map_panel(main, "m_an_khe")
		_check(returned_to_village, "Online map panel travel could not return to An Khê")

	if api != null:
		api.disconnect_chat()
		if not api.token.is_empty():
			var cleanup: Dictionary = await api._request(
				HTTPClient.METHOD_DELETE, "/v2/account", null, "Bearer " + api.token)
			if cleanup.has("error"):
				_check(false, "Could not clean up the world smoke account: " + str(cleanup.error))
	main.queue_free()
	await process_frame
	if failures == 0:
		print("PASS Godot world: online map travel, physical gate, field attack, XP and loot")
	else:
		push_error("Godot world smoke failed with %d issue(s)" % failures)
	quit(0 if failures == 0 else 1)
