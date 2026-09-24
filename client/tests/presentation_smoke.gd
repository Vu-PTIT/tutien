extends SceneTree
## Offline integration: run after --editor --headless --quit.
## Optional captures require a real rendering driver, not --headless.
const Main = preload("res://scenes/main.tscn")
var failures: int = 0
var capture_dir: String = ""

func _initialize() -> void:
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--capture-dir="):
			capture_dir = arg.trim_prefix("--capture-dir=")
	_run.call_deferred()

func check(condition: bool, message: String) -> void:
	if not condition:
		failures += 1
		push_error(message)

func _capture(filename: String) -> void:
	if capture_dir.is_empty():
		return
	await RenderingServer.frame_post_draw
	DirAccess.make_dir_recursive_absolute(capture_dir)
	var img := root.get_texture().get_image()
	check(img.save_png(capture_dir.path_join(filename)) == OK, "Capture failed")

func _run() -> void:
	var main = Main.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var hud = main.hud
	var bag: InventoryPanel = main.inventory_panel
	check(not main.can_walk(Vector2(240, 304)), "House footprint must block walking")
	check(main.can_walk(Vector2(768, 576)), "An Khê spawn must be walkable")
	check(main.map_world.map_size_tiles == Vector2i(48, 36), "An Khê uses the agreed map size")
	check(main.map_world.get_node("CollisionRoot").get_child_count() == 12, "Map blocker shapes are generated")
	check(main.player is CharacterBody2D, "Village player uses physics movement")
	check(main.village_camera.enabled, "Camera follows the village player")
	check(main.village_camera.limit_right == 1536 and main.village_camera.limit_bottom == 1152, "Camera clamps to An Khê world bounds")
	check(bag.slot_buttons.size() == 24, "Inventory requires exactly 24 visual slots")
	check(hud.get_node("Hotbar").get_child_count() == 12, "Six buttons + six key labels")
	check(not bag.visible and not main.dock.visible, "Modals start closed")
	var map_panel: WorldMapPanel = hud.get_node("WorldMap")
	check(not map_panel.visible, "World map starts closed")
	check(map_panel.map_entries.size() == 4, "World map reads the four-map MVP catalog")
	check(map_panel.route_buttons.size() == 4, "World map route has four selectable maps")
	check(map_panel.travel_button != null, "World map has a local travel action")
	check(hud.get_node("Vitals/Qi").value == 0, "Do not invent a Qi value")
	await _capture("an-khe-runtime.png")
	var initial_position: Vector2 = main.player.position
	main._action("map")
	await process_frame
	check(map_panel.visible, "Map action opens route panel")
	map_panel.route_buttons["m_truc_am"].emit_signal("pressed")
	check(map_panel.selected_id == "m_truc_am", "Route selection updates selected map")
	check(map_panel.info.text.contains("Ven Suối"), "Map selection shows zone information")
	check(main.player.position == initial_position, "Selecting a route card does not teleport the player")
	map_panel.travel_button.emit_signal("pressed")
	await process_frame
	await process_frame
	check(main.current_map_id == "m_truc_am", "Travel action loads Trúc Âm")
	check(main.map_world.areas_size() == 3, "Trúc Âm has three named areas")
	check(main.map_world.active_area_name == "Ven Suối", "Trúc Âm spawn is in Ven Suối")
	check(main.hud.get_node("Minimap/Map").texture.resource_path.ends_with("truc_am_world_v1.png"), "Travel updates the minimap art")
	check(main.hud.get_node("Location/Title").text == "TRÚC ÂM", "Travel updates the HUD map name")
	map_panel.open_map()
	map_panel.route_buttons["m_thach_can"].emit_signal("pressed")
	map_panel.travel_button.emit_signal("pressed")
	await process_frame
	await process_frame
	check(main.current_map_id == "m_thach_can", "Travel action loads Thạch Cạn")
	check(main.map_world.areas_size() == 2, "Thạch Cạn has two named areas")
	check(main.map_world.active_area_name == "Ngoại Vi", "Thạch Cạn spawn is in Ngoại Vi")
	map_panel.open_map()
	map_panel.route_buttons["m_co_tinh"].emit_signal("pressed")
	map_panel.travel_button.emit_signal("pressed")
	await process_frame
	await process_frame
	check(main.current_map_id == "m_co_tinh", "Travel action loads Cổ Tỉnh")
	check(main.map_world.areas_size() == 5, "Cổ Tỉnh has five named rooms")
	check(main.map_world.active_area_name == "Cửa Giếng", "Cổ Tỉnh spawn is in the entrance room")
	check(main.village_camera.limit_left == 32 and main.village_camera.limit_right == 448, "Cổ Tỉnh camera locks to the current room")
	main.map_world.update_player_context(Vector2(35 * 32, 8 * 32))
	check(main.village_camera.limit_left == 32 * 32 and main.village_camera.limit_right == 47 * 32, "Cổ Tỉnh camera follows room transitions")
	map_panel.open_map()
	map_panel.route_buttons["m_an_khe"].emit_signal("pressed")
	map_panel.travel_button.emit_signal("pressed")
	await process_frame
	await process_frame
	check(main.current_map_id == "m_an_khe", "Route returns to An Khê")
	map_panel.open_map()
	map_panel.close_button.emit_signal("pressed")
	await process_frame
	check(not map_panel.visible, "Map close button closes route panel")
	var map_key := InputEventKey.new()
	map_key.physical_keycode = KEY_M
	map_key.pressed = true
	main._unhandled_input(map_key)
	check(map_panel.visible, "M opens the map route")
	main._unhandled_input(escape_event())
	check(not map_panel.visible, "Escape closes the map route")
	main._action("inventory")
	await process_frame
	check(bag.visible and bag.preview_mode, "Offline inventory must be explicitly demo")
	check(bag.claim_button.disabled, "Offline sample cannot claim rewards")
	check(bag.selected_id == "it_iron_sword", "Initial selection")
	bag.set_filter("equipment")
	check(bag.filtered.size() == 2, "Filter equipment")
	bag.select_slot(23)
	check(bag.selected_id.is_empty(), "Empty slot clears selection")
	bag.set_filter("all")
	await _capture("inventory-runtime.png")
	var escape := InputEventKey.new()
	escape.physical_keycode = KEY_ESCAPE
	escape.pressed = true
	main._unhandled_input(escape)
	check(not bag.visible, "Escape closes inventory")
	main._action("dock")
	check(main.dock.visible, "Online dock opens")
	check(main.dock.get_node("Create").disabled, "Cannot create without connection")
	main._action("inventory")
	check(not main.dock.visible and bag.visible, "Only one modal open")
	var atlas := load("res://assets/pixel/cultivator.png") as Texture2D
	check(atlas.get_image().detect_alpha() != Image.ALPHA_NONE, "Sprite must be transparent")
	main.queue_free()
	await process_frame
	print("Presentation smoke: ", "PASS" if failures == 0 else "FAIL", " (", failures, " failures)")
	quit(0 if failures == 0 else 1)

func escape_event() -> InputEventKey:
	var event := InputEventKey.new()
	event.physical_keycode = KEY_ESCAPE
	event.pressed = true
	return event
