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

func check_map_assets(world: GameMap) -> void:
	var ground: TileMapLayer = world.get_node("WorldLayers/GroundLayer")
	check(ground.get_used_cells().size() == world.map_size_tiles.x * world.map_size_tiles.y, "Complete terrain: " + world.map_id)
	for layer_name in ["GroundLayer", "DetailLayer", "ForegroundLayer"]:
		var layer: TileMapLayer = world.get_node("WorldLayers/" + layer_name)
		for cell in layer.get_used_cells():
			check(layer.get_cell_tile_data(cell) != null, "Valid atlas cell: " + world.map_id)
	var props_count := 0
	for actor in world.get_node("Actors").get_children():
		if actor is MapProp:
			props_count += 1
			var texture: AtlasTexture = actor.get_node("Sprite").texture
			check(texture != null and texture.region.size == Vector2(128, 128), "Landmarks retain full source resolution")
	check(props_count >= 7, "Map has authored landmarks: " + world.map_id)
	check(not world.get_node("Background").visible, "No painted PNG fallback: " + world.map_id)

func _run() -> void:
	var main = Main.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var hud = main.hud
	var bag: InventoryPanel = main.inventory_panel
	check_map_assets(main.map_world)
	check(not main.can_walk(Vector2(240, 304)), "House footprint must block walking")
	check(main.can_walk(Vector2(768, 576)), "An Khê spawn must be walkable")
	check(main.map_world.map_size_tiles == Vector2i(48, 36), "An Khê uses the agreed map size")
	check(main.map_world.get_node("CollisionRoot").get_child_count() == 12, "An Khê blockers follow landmark footprints and the east stream")
	check(main.can_walk(Vector2(10 * 32, 8 * 32)) and main.can_walk(Vector2(2 * 32, 17 * 32)), "Old oversized invisible building blockers are gone")
	check(not main.can_walk(Vector2(38 * 32, 18 * 32)), "Market stall has a physical footprint")
	check(main.player is CharacterBody2D, "Village player uses physics movement")
	var ground_layer: TileMapLayer = main.map_world.get_node("WorldLayers/GroundLayer")
	check(ground_layer.get_used_cells().size() == 48 * 36, "An Khê preview is split into editable tile cells")
	check(ground_layer.get_cell_atlas_coords(Vector2i(24, 18)).y == 3, "An Khê spawn is in the stone plaza")
	check(ground_layer.get_cell_atlas_coords(Vector2i(44, 18)).y == 4 and not main.can_walk(Vector2(44 * 32, 18 * 32)), "East stream art and collision agree")
	check(not main.map_world.get_node("Background").visible, "Tile layer replaces the full-screen map sprite at runtime")
	check(main.map_world.get_node("WorldLayers/ForegroundLayer") is TileMapLayer, "Map has a dedicated foreground tile layer")
	check(main.map_world.interactables_size() == 6, "An Khê loads six data-driven interactive points")
	check(not main.map_world.get_node("LocationLabels/Landmark_1").visible, "Far landmark labels do not clutter the An Khê HUD")
	main.map_world.update_player_context(Vector2(30 * 32, 13 * 32))
	check(main.map_world.get_node("LocationLabels/Landmark_1").visible, "Landmark label appears when the player approaches")
	main.map_world.update_player_context(main.player.position)
	check(hud.get_node("Quest/Body").text.contains("nhấn E hoặc Chạm"), "Initial objective reads map data and includes touch input")
	check(not main.map_world._has_clear_interaction_path(Vector2(8 * 32, 5 * 32), Vector2(8 * 32, 13 * 32)), "Building collision also blocks interactions through its walls")
	var sakura: MapProp = main.map_world.get_node("Actors/ak_prop_sakura") as MapProp
	main.map_world.update_player_context(Vector2(19 * 32, 31 * 32))
	check(sakura.get_node("Sprite").modulate.a < 1.0, "Tall An Khê prop fades when it covers the player")
	main.map_world.update_player_context(Vector2(19 * 32, 34 * 32))
	check(sakura.get_node("Sprite").modulate.a == 1.0, "Tall prop returns to full opacity in front of player")
	check(main.map_world.get_node("AmbientFX").get_child_count() == 3, "An Khê loads animated water highlights")
	check(main.village_camera.enabled, "Camera follows the village player")
	check(main.village_camera.limit_right == 1536 and main.village_camera.limit_bottom == 1152, "Camera clamps to An Khê world bounds")
	check(bag.slot_buttons.size() == 24, "Inventory requires exactly 24 visual slots")
	check(hud.get_node("Hotbar").get_child_count() == 12, "Six buttons + six key labels")
	check(not bag.visible and not main.dock.visible, "Modals start closed")
	main.touch_layout_enabled = true
	hud.set_touch_layout(true)
	var touch: TouchControls = hud.touch_controls
	check(touch.visible and not hud.get_node("Hotbar").visible, "Touch layout shows controls without desktop hotbar")
	var finger_down := InputEventScreenTouch.new()
	finger_down.index = 2
	finger_down.pressed = true
	finger_down.position = TouchControls.JOYSTICK_CENTER
	touch._input(finger_down)
	var finger_drag := InputEventScreenDrag.new()
	finger_drag.index = 2
	finger_drag.position = TouchControls.JOYSTICK_CENTER + Vector2(48, 0)
	touch._input(finger_drag)
	check(touch.direction.x > 0.9 and main._movement().x > 0.9, "Touch drag drives the shared movement vector")
	var other_finger := InputEventScreenTouch.new()
	other_finger.index = 3
	other_finger.pressed = true
	other_finger.position = Vector2(585, 300)
	touch._input(other_finger)
	check(touch.direction.x > 0.9, "Second touch does not steal joystick movement")
	var finger_up := InputEventScreenTouch.new()
	finger_up.index = 2
	finger_up.pressed = false
	touch._input(finger_up)
	check(touch.direction == Vector2.ZERO, "Releasing the joystick stops movement")
	touch.set_combat_mode(true)
	check(touch.get_node("Attack").visible and not touch.get_node("Interact").visible, "Sparring presents touch combat actions")
	touch._input(finger_down)
	touch._input(finger_drag)
	touch.set_combat_mode(true)
	check(touch.direction.x > 0.9, "Repeated server snapshots must not reset the combat joystick")
	main.dock.show()
	await process_frame
	check(not touch.visible and touch.direction == Vector2.ZERO, "Opening a modal releases touch movement")
	main.dock.hide()
	await process_frame
	touch.set_combat_mode(false)
	await _capture("an-khe-touch-runtime.png")
	main.touch_layout_enabled = false
	hud.set_touch_layout(false)
	var map_panel: WorldMapPanel = hud.get_node("WorldMap")
	check(not map_panel.visible, "World map starts closed")
	check(map_panel.map_entries.size() == 4, "World map reads the four-map MVP catalog")
	check(map_panel.route_buttons.size() == 4, "World map route has four selectable maps")
	check(map_panel.travel_button != null, "World map has a local travel action")
	check(hud.get_node("Vitals/Qi").value == 0, "Do not invent a Qi value")
	var minimap_image: Image = hud.get_node("Minimap/Map").texture.get_image()
	check(minimap_image.get_size() == Vector2i(48, 36), "HUD minimap follows the authored map grid")
	check(minimap_image.get_pixel(24, 18).r > 0.6, "Stone plaza is visible on the true minimap")
	check(minimap_image.get_pixel(44, 18).b > minimap_image.get_pixel(44, 18).r, "Stream is blue on the true minimap")
	await _capture("an-khe-runtime.png")
	var herbalist: MapInteractable = main.map_world.get_interactable("ak.npc.ba_sam")
	check(herbalist != null, "Herbalist has a stable map entity id")
	main.player.position = herbalist.position
	check(main.map_world.update_interaction_focus(herbalist.position) == herbalist, "Nearest POI becomes the interaction target")
	hud.set_interaction_prompt(herbalist.prompt_text())
	check(hud.get_node("InteractionHint").visible, "Focused POI appears in the HUD")
	main._action("interact")
	check(main.local_map_flags.has("ak.ba_sam_intro"), "Herbalist interaction advances the local preview flag")
	check(hud.get_node("Quest/Body").text.contains("Ven Suối"), "Herbalist updates the tracked map objective")
	var village_gate: MapInteractable = main.map_world.get_interactable("ak.gate.truc_am")
	main.player.position = village_gate.position
	main._action("interact")
	await process_frame
	await process_frame
	check(main.current_map_id == "m_truc_am", "Village gate opens its configured destination")
	check_map_assets(main.map_world)
	await _capture("truc-am-runtime.png")
	check(main.player.position == Vector2(5 * 32, 26 * 32), "Village gate arrives at the Trúc Âm entrance")
	var initial_position: Vector2 = main.player.position
	check(main.map_world.interactables_size() == 5, "Trúc Âm loads its own interactive map data")
	check(main.map_world.get_node("AmbientFX").get_child_count() == 3, "Trúc Âm loads its water highlights")
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
	check(main.hud.get_node("Minimap/Map").texture.get_image().get_size() == Vector2i(48, 36), "Travel rebuilds the minimap from Trúc Âm's authored cells")
	check(main.hud.get_node("Location/Title").text == "TRÚC ÂM", "Travel updates the HUD map name")
	var mach_ban: MapInteractable = main.map_world.get_interactable("ta.mach_ban.scan")
	check(mach_ban != null and main.can_walk(mach_ban.position), "Trúc Âm Mạch Bàn is reachable on the walkable path")
	main.player.position = mach_ban.position
	main._action("interact")
	check(main.local_map_flags.has("ta.shortcut_seen"), "Mạch Bàn interaction records its local discovery")
	var thach_gate: MapInteractable = main.map_world.get_interactable("ta.gate.thach_can")
	main.player.position = thach_gate.position
	main._action("interact")
	await process_frame
	await process_frame
	check(main.current_map_id == "m_thach_can", "Trúc Âm exit gate opens Thạch Cạn")
	check_map_assets(main.map_world)
	await _capture("thach-can-runtime.png")
	check(main.player.position == Vector2(7 * 32, 18 * 32), "Trúc Âm gate arrives at the Thạch Cạn entrance")
	check(main.map_world.interactables_size() == 5, "Thạch Cạn loads its own interactive map data")
	var ore_node: MapInteractable = main.map_world.get_interactable("tc.node.iron_ore")
	check(ore_node != null and main.can_walk(ore_node.position), "Thạch Cạn ore point is reachable")
	main.player.position = ore_node.position
	main._action("interact")
	check(not main.local_map_flags.has("tc.iron_granted"), "Map exploration does not invent a server reward")
	var co_tinh_gate: MapInteractable = main.map_world.get_interactable("tc.gate.co_tinh")
	main.player.position = co_tinh_gate.position
	main._action("interact")
	await process_frame
	await process_frame
	check(main.current_map_id == "m_co_tinh", "Travel action loads Cổ Tỉnh")
	check_map_assets(main.map_world)
	await _capture("co-tinh-runtime.png")
	check(main.player.position == Vector2(11 * 32, 31 * 32), "Thạch Cạn gate arrives at the Cổ Tỉnh entrance")
	check(main.map_world.interactables_size() == 5, "Cổ Tỉnh loads its own interactive map data")
	check(main.map_world.areas_size() == 5, "Cổ Tỉnh has five named rooms")
	check(main.map_world.active_area_name == "Cửa Giếng", "Cổ Tỉnh spawn is in the entrance room")
	check(main.village_camera.limit_left == 32 and main.village_camera.limit_right == 448, "Cổ Tỉnh camera locks to the current room")
	var boss_core: MapInteractable = main.map_world.get_interactable("ct.boss.heart_well")
	check(boss_core != null and main.can_walk(boss_core.position), "Cổ Tỉnh boss arena approach is walkable")
	main.map_world.update_player_context(Vector2(35 * 32, 8 * 32))
	check(main.village_camera.limit_left == 32 * 32 and main.village_camera.limit_right == 47 * 32, "Cổ Tỉnh camera follows room transitions")
	var retreat_gate: MapInteractable = main.map_world.get_interactable("ct.retreat.thach_can")
	main.player.position = retreat_gate.position
	main._action("interact")
	await process_frame
	await process_frame
	check(main.current_map_id == "m_thach_can", "Cổ Tỉnh retreat returns to Thạch Cạn")
	check(main.player.position == Vector2(42 * 32, 24 * 32), "Cổ Tỉnh retreat arrives beside the destination gate")
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
