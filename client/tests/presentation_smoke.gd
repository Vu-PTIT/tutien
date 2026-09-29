extends SceneTree
## Offline integration: run after --editor --headless --quit.
## Optional captures require a real rendering driver, not --headless.
const Main = preload("res://scenes/main.tscn")
var failures: int = 0
var capture_dir: String = ""

func _initialize() -> void:
	if root.get_node_or_null("LanguageManager") == null:
		var language_manager: Node = load("res://scripts/language_manager.gd").new()
		language_manager.name = "LanguageManager"
		root.add_child(language_manager)
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--capture-dir="):
			capture_dir = arg.trim_prefix("--capture-dir=")
	_run.call_deferred()

func check(condition: bool, message: String) -> void:
	if not condition:
		failures += 1
		push_error(message)

func check_social_typography() -> void:
	var social_theme := load("res://themes/tutien_theme.tres") as Theme
	check(social_theme != null, "Shared theme loads for social typography")
	if social_theme == null:
		return
	check(social_theme.is_type_variation(&"SocialHeader", &"Label"), "Social header is a Label theme variation")
	check(social_theme.get_font_size(&"font_size", &"SocialHeader") == 16, "Social desktop header uses the large type token")
	check(social_theme.get_color(&"font_shadow_color", &"Label").a <= 0.01, "HUD labels do not add a doubled pixel shadow")
	check(social_theme.is_type_variation(&"MapPixelText", &"Label"), "Map HUD uses a dedicated pixel text variation")
	check(social_theme.is_type_variation(&"MapPixelHeading", &"Label"), "Map HUD has a dedicated pixel heading variation")
	check(social_theme.is_type_variation(&"MapPixelButton", &"Button"), "Map HUD actions use the pixel font")
	check(social_theme.get_font_size(&"font_size", &"MapPixelText") == 8, "Map HUD body text uses the Tiny5 design size")
	check(social_theme.get_font_size(&"font_size", &"MapPixelHeading") == 16, "Map location heading uses an integer Tiny5 scale")
	var map_pixel_font := social_theme.get_font(&"font", &"MapPixelText")
	check(map_pixel_font != null, "Map HUD Tiny5 font loads")
	if map_pixel_font != null:
		for character in ["ă", "Đ", "ơ", "ư", "ẫ", "ễ", "ợ", "ỹ"]:
			check(map_pixel_font.has_char(character.unicode_at(0)), "Tiny5 includes Vietnamese glyph " + character)
	check(social_theme.get_font_size(&"font_size", &"SocialBodyMobile") == 14, "Social mobile body uses the mobile type token")
	check(social_theme.get_font_size(&"normal_font_size", &"SocialChatLogMobile") == 14, "Mobile chat history uses readable message text")
	var chat_entry := LineEdit.new()
	chat_entry.theme = social_theme
	check(SocialTypography.apply_profile(chat_entry, &"chat_entry", true), "Social typography applies a known mobile profile")
	check(chat_entry.theme_type_variation == &"SocialChatEntryMobile", "Chat entry receives its mobile theme variation")
	chat_entry.free()

func _capture(filename: String) -> void:
	if capture_dir.is_empty():
		return
	await RenderingServer.frame_post_draw
	DirAccess.make_dir_recursive_absolute(capture_dir)
	var img := root.get_texture().get_image()
	check(img.save_png(capture_dir.path_join(filename)) == OK, "Capture failed")

func _capture_touch_layout(main, filename: String) -> void:
	main.touch_layout_enabled = true
	main.hud.set_touch_layout(true)
	await process_frame
	await _capture(filename)
	main.touch_layout_enabled = false
	main.hud.set_touch_layout(false)

func _capture_son_tru_preview(main) -> void:
	main.inventory_panel.hide()
	main.dock.hide()
	main.api.match_kind = "pve_son_tru"
	main.api.match_id = "presentation-preview"
	main.user_id = "presentation-player"
	main.api.snapshot = {
		"version": 1, "mode": "pve_son_tru", "epoch": "preview", "tick": 20, "phase": "active",
		"players": [{"id": main.user_id, "x": 405, "y": 390, "hp": 82, "faceX": 1, "faceY": 0}],
		"boar": {"id": "en_boar", "x": 690, "y": 390, "hp": 60, "maxHp": 60, "faceX": -1, "faceY": 0, "mode": "tell"}
	}
	main._snapshot(main.api.snapshot)
	main._present_fighters(0.05)
	await process_frame
	check(main.get_node("Arena/SonTruBackground").texture != null, "Sơn Trư arena uses its generated map art")
	check(main.boar_sprite.visible and main.boar_sprite.texture.get_size() == Vector2(128, 128), "PVE encounter presents the transparent boar sprite")
	check(main.boar_sprite.position.distance_to(Vector2(446, 234)) < 0.01, "Server boar position maps into the arena viewport")
	check(main.hud.get_node("Location/Title").text == "BÃI SƠN TRƯ", "PvE HUD identifies the hunting area")
	await _capture("son-tru-runtime.png")
	await _capture_touch_layout(main, "son-tru-touch-runtime.png")
	for actor: Node2D in main.fighters.values():
		actor.queue_free()
	main.fighters.clear()
	main.api.match_id = ""
	main.api.match_kind = ""
	main.api.snapshot = {}
	main.last_phase = ""
	main.boar_sprite.hide()
	main.get_node("Arena").hide()
	main.map_world.show()
	main.village_camera.enabled = true
	main.touch_controls.set_combat_mode(false)
	main.hud.get_node("Minimap").show()
	main.hud.configure_map(main.map_world.map_data)
	main._update_buttons()

func check_field_info_visible(hud: PixelHUD) -> void:
	var body: Label = hud.get_node("FieldInfo/Body")
	check(body.get_visible_line_count() == body.get_line_count(), "Field guidance must fit the HUD on " + hud.get_node("Location/Title").text)

func check_map_assets(world: GameMap) -> void:
	var ground: TileMapLayer = world.get_node("WorldLayers/GroundLayer")
	check(ground.get_used_cells().size() == world.map_size_tiles.x * world.map_size_tiles.y, "Complete terrain: " + world.map_id)
	for layer_name in ["GroundLayer", "WaterLayer", "ShoreLayer", "DetailLayer", "ForegroundLayer"]:
		var layer: TileMapLayer = world.get_node("WorldLayers/" + layer_name)
		for cell in layer.get_used_cells():
			check(layer.get_cell_tile_data(cell) != null, "Valid atlas cell: " + world.map_id)
	var props_count := 0
	for actor in world.get_node("Actors").get_children():
		if actor is MapProp:
			props_count += 1
			var texture: Texture2D = actor.get_node("Sprite").texture
			check(texture != null and texture.get_width() > 0 and texture.get_height() > 0, "Map prop loads non-empty source art")
			if texture is AtlasTexture:
				var atlas_texture := texture as AtlasTexture
				var cell_px := int(world.map_data.get("props_cell_px", 128))
				check(atlas_texture.region.size == Vector2(cell_px, cell_px), "Atlas props preserve their authored source cell")
	var area_name := world.map_id.trim_prefix("m_")
	var layout_file := FileAccess.open("res://data/maps/" + area_name + ".json", FileAccess.READ)
	var authored_props: Array = []
	if layout_file != null:
		var authored_layout: Variant = JSON.parse_string(layout_file.get_as_text())
		if authored_layout is Dictionary:
			authored_props = authored_layout.get("props", [])
	check(layout_file != null and props_count == authored_props.size(), "Map prop count matches its authored JSON: " + world.map_id)
	check(not world.get_node("Background").visible, "No painted PNG fallback: " + world.map_id)

func _run() -> void:
	check_social_typography()
	var main = Main.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var hud = main.hud
	var bag: InventoryPanel = main.inventory_panel
	var map_body: Label = hud.get_node("FieldInfo/Body")
	var location_title: Label = hud.get_node("Location/Title")
	check(map_body.theme_type_variation == &"MapPixelText", "Map body uses the readable pixel font")
	check(location_title.theme_type_variation == &"MapPixelHeading", "Map title uses the heading font size")
	check_map_assets(main.map_world)
	await _capture("font-map-hud.png")
	check(main.map_world.resource_trees_size() == 1, "An Khê loads one stateful harvestable tree")
	check(main.map_world.flowers_size() == 4, "An Khê loads four foot-reactive flower clumps")
	var blacksmith: MapProp = main.map_world.get_node("Actors/ak_prop_blacksmith") as MapProp
	check(blacksmith != null and not blacksmith.get_node("Sprite").texture is AtlasTexture, "An Khê forge uses its own transparent cutout")
	check(blacksmith.get_node("Sprite").texture.get_image().detect_alpha() != Image.ALPHA_NONE, "An Khê forge cutout retains alpha")
	var village_board: MapProp = main.map_world.get_node_or_null("Actors/ak_prop_village_board") as MapProp
	check(village_board != null, "Bảng tin has a visible map prop at An Khê")
	if village_board != null:
		var board_texture: Texture2D = village_board.get_node("Sprite").texture
		check(board_texture != null and board_texture.get_size() == Vector2(128, 128) and board_texture.get_image().detect_alpha() != Image.ALPHA_NONE,
			"Village notice board loads as a transparent 128 px cutout")
	check(not main.can_walk(Vector2(240, 304)), "House footprint must block walking")
	check(main.can_walk(Vector2(768, 576)), "An Khê spawn must be walkable")
	check(main.map_world.map_size_tiles == Vector2i(48, 36), "An Khê uses the agreed map size")
	check(main.map_world._solid_terrain_cells.has(Vector2i(44, 18)) and not main.can_walk(Vector2(44 * 32, 18 * 32)), "An Khê water terrain generates collision")
	check(not main.can_walk(Vector2(19.5 * 32, 32.5 * 32)), "Sakura trunk has a compact footprint")
	check(main.can_walk(Vector2(18.5 * 32, 32.5 * 32)), "Player can pass beside the sakura canopy")
	check(main.can_walk(Vector2(10 * 32, 8 * 32)) and main.can_walk(Vector2(2 * 32, 17 * 32)), "Old oversized invisible building blockers are gone")
	check(not main.can_walk(Vector2(38 * 32, 18 * 32)), "Market stall has a physical footprint")
	check(main.player is CharacterBody2D, "Village player uses physics movement")
	var ground_layer: TileMapLayer = main.map_world.get_node("WorldLayers/GroundLayer")
	check(ground_layer.get_used_cells().size() == 48 * 36, "An Khê preview is split into editable tile cells")
	check(ground_layer.get_cell_atlas_coords(Vector2i(24, 18)).y == 3, "An Khê spawn is in the stone plaza")
	var water_layer: TileMapLayer = main.map_world.get_node("WorldLayers/WaterLayer")
	check(water_layer.get_cell_source_id(Vector2i(44, 18)) >= 0 and not main.can_walk(Vector2(44 * 32, 18 * 32)), "East stream uses its water layer and matching collision")
	check(not main.map_world.get_node("Background").visible, "Tile layer replaces the full-screen map sprite at runtime")
	check(main.map_world.get_node("WorldLayers/ForegroundLayer") is TileMapLayer, "Map has a dedicated foreground tile layer")
	check(main.map_world.interactables_size() == 8, "An Khê loads eight data-driven interactive points")
	var luc_vi: MapInteractable = main.map_world.get_interactable("ak.npc.luc_vi")
	check(luc_vi.get_node_or_null("NpcSprite") is Sprite2D, "Lục Vi uses the generated transparent NPC sprite")
	check(not main.map_world.get_node("LocationLabels/Landmark_1").visible, "Far landmark labels do not clutter the An Khê HUD")
	main.map_world.update_player_context(Vector2(30 * 32, 13 * 32))
	check(main.map_world.get_node("LocationLabels/Landmark_1").visible, "Landmark label appears when the player approaches")
	main.map_world.update_player_context(main.player.position)
	check(hud.get_node("FieldInfo/Body").text.contains("Cổng Bắc"), "An Khê HUD points toward the farm route")
	check(hud.get_node("FieldInfo/Body").autowrap_mode == TextServer.AUTOWRAP_WORD, "Long zone guidance wraps inside the HUD panel")
	check_field_info_visible(hud)
	check(not main.map_world._has_clear_interaction_path(Vector2(8 * 32, 5 * 32), Vector2(8 * 32, 13 * 32)), "Building collision also blocks interactions through its walls")
	var sakura: MapProp = main.map_world.get_node("Actors/ak_prop_sakura") as MapProp
	check(not sakura.get_node("Sprite").texture is AtlasTexture, "Sakura uses an independent transparent cutout")
	check(sakura.get_node("Sprite").texture.get_image().detect_alpha() != Image.ALPHA_NONE, "Sakura cutout has an alpha channel")
	main.map_world.update_player_context(Vector2(19 * 32, 31 * 32))
	check(sakura.get_node("Sprite").modulate.a < 1.0, "Tall An Khê prop fades when it covers the player")
	main.map_world.update_player_context(Vector2(19 * 32, 34 * 32))
	check(sakura.get_node("Sprite").modulate.a == 1.0, "Tall prop returns to full opacity in front of player")
	check(main.map_world.get_node("AmbientFX").get_child_count() == 3, "An Khê loads animated water highlights")
	check(main.village_camera.enabled, "Camera follows the village player")
	check(main.village_camera.limit_right == 1536 and main.village_camera.limit_bottom == 1152, "Camera clamps to An Khê world bounds")
	check(bag.slot_buttons.size() == 24, "Inventory requires exactly 24 visual slots")
	var character: CharacterPanel = main.character_panel
	check(not character.visible, "Character panel starts closed")
	main._action("character")
	await process_frame
	check(character.visible and character.preview_mode, "Offline character view is clearly marked as a preview")
	check(character.get_node("PageHost/ProfilePage/StatsCard/Name").text == "Tu sĩ", "Character profile shows the current display name")
	check(character.get_node("PageHost/ProfilePage/EquipmentCard/WeaponSlot/Name").text.contains("Chưa trang bị"), "Empty weapon slot is explained")
	character.profile = {
		"realm": "luyen_khi", "realmStage": 2, "cultivationXp": 240, "hp": 72, "spiritStones": 19,
		"equipped": {"weapon": "weapon-instance", "armor": "armor-instance"},
		"inventory": [
			{"itemId": "it_iron_sword", "instanceId": "weapon-instance", "quantity": 1},
			{"itemId": "it_cloth_armor", "instanceId": "armor-instance", "quantity": 1}
		]
	}
	character.inventory = character.profile.inventory
	character.catalog = {
		"it_iron_sword": {"id": "it_iron_sword", "name": "Thanh Thiết Kiếm", "attackBonus": 5},
		"it_cloth_armor": {"id": "it_cloth_armor", "name": "Áo vải", "defenseBonus": 15}
	}
	character._render_profile()
	check(character.get_node("PageHost/ProfilePage/StatsCard/Attack").text == "Công kích • 21" and
		character.get_node("PageHost/ProfilePage/StatsCard/Defense").text == "Phòng ngự • 20",
		"Profile totals include server catalog equipment bonuses")
	check(character.get_node("PageHost/ProfilePage/StatsCard/Cultivation").value == 240.0 and
		character.get_node("PageHost/ProfilePage/StatsCard/Cultivation").max_value == 600.0,
		"Cultivation progress uses the current realm threshold")
	character._show_preview()
	character.show_page("skills")
	check(character.get_node("PageHost/SkillsPage").visible and not character.get_node("PageHost/ProfilePage").visible,
		"Skills tab opens its own page")
	check(character.get_node("PageHost/SkillsPage/SkillRoster/Scroll/List").get_child_count() == 2 and
		character.get_node("PageHost/SkillsPage/SkillLoadoutCard/EquippedSkill").text == "Ô R • Chưa trang bị kỹ năng",
		"Skills page shows the known skills and the empty R loadout")
	check(character.get_node("PageHost/SkillsPage/SkillDetail/EquipButton").disabled,
		"Offline preview never saves a fake skill loadout")
	hud.apply_profile({"realm": "mortal", "realmStage": 0, "cultivationXp": 0, "hp": 100,
		"equippedSkills": {"active_1": "sk_phi_nhan"}})
	check(hud.equipped_skill_id == "sk_phi_nhan" and hud.get_node("Hotbar/Slot4").icon != null,
		"Equipped Phi Nhận appears in the pixel hotbar")
	character.show_page("settings")
	check(character.get_node("PageHost/SettingsPage").visible, "Settings tab opens its own page")
	character.set_touch_layout_enabled(true, false)
	check(main.touch_layout_enabled, "Touch layout setting reaches the game HUD")
	character.set_touch_layout_enabled(false, false)
	character.show_page("profile")
	character.get_node("PageHost/ProfilePage/EquipmentCard/OpenEquipmentBag").emit_signal("pressed")
	await process_frame
	check(bag.visible and bag.category == "equipment" and bag.filtered.size() == 2,
		"Profile opens the equipment filter in the existing inventory")
	main._action("close")
	await process_frame
	var character_key := InputEventKey.new()
	character_key.physical_keycode = KEY_C
	character_key.pressed = true
	main._unhandled_input(character_key)
	await process_frame
	check(character.visible, "C opens the character panel")
	main._unhandled_input(escape_event())
	check(not character.visible, "Escape closes the character panel")
	check(hud.get_node("Hotbar").get_child_count() == 12, "Six buttons + six key labels")
	check(not bag.visible and not main.dock.visible, "Modals start closed")
	Input.action_press("move_right")
	check(main._movement().x > 0.9, "Keyboard InputMap action drives shared movement")
	Input.action_release("move_right")
	check(main._movement() == Vector2.ZERO, "Releasing keyboard action stops movement")
	main.touch_layout_enabled = true
	hud.set_touch_layout(true)
	var touch: TouchControls = hud.touch_controls
	check(touch.visible and not hud.get_node("Hotbar").visible, "Touch layout shows controls without desktop hotbar")
	touch.set_field_combat_mode(true)
	check(touch.get_node("Attack").visible and touch.get_node("Interact").visible and
		touch.get_node("Skill").visible and not touch.get_node("Dodge").visible,
		"Touch map combat exposes attack, interaction, and the equipped skill")
	touch.set_field_combat_mode(false)
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
	check(main.game_input.aim(main._movement(), true, Vector2.ZERO, Vector2.ZERO).x > 0.9, "Touch direction drives the shared aim command")
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
	check(map_panel.route_overview.texture != null, "World map displays one continuous route overview")
	check(map_panel.route_buttons["m_an_khe"].position.x < map_panel.route_buttons["m_truc_am"].position.x and
		map_panel.route_buttons["m_truc_am"].position.x < map_panel.route_buttons["m_thach_can"].position.x and
		map_panel.route_buttons["m_thach_can"].position.x < map_panel.route_buttons["m_co_tinh"].position.x,
		"Route map selection points follow the connected journey order")
	check(map_panel.travel_button != null, "World map has a local travel action")
	check(hud.get_node("Vitals/Qi").value == 0, "Do not invent a Qi value")
	var minimap_image: Image = hud.get_node("Minimap/Map").texture.get_image()
	check(minimap_image.get_size() == Vector2i(48, 36), "HUD minimap follows the authored map grid")
	check(minimap_image.get_pixel(24, 18).r > 0.6, "Stone plaza is visible on the true minimap")
	check(minimap_image.get_pixel(44, 18).b > minimap_image.get_pixel(44, 18).r, "Stream is blue on the true minimap")
	check(minimap_image.get_pixel(35, 18).r > minimap_image.get_pixel(35, 18).b,
		"Minimap uses the connected dirt path to the east market")
	await _capture("an-khe-runtime.png")
	var village_spawn: Vector2 = main.player.position
	main.player.position = blacksmith.position + Vector2(0, 32)
	main.map_world.update_player_context(main.player.position)
	await process_frame
	await _capture("an-khe-blacksmith-runtime.png")
	check(main._load_map("m_truc_am"), "Trúc Âm can be loaded for field farming")
	check(not main.map_world.nearest_field_mob(Vector2(16.0 * 32.0, 17.0 * 32.0), 72.0).is_empty(),
		"Offline field preview presents a reachable Trúc Âm mob before backend login")
	check(main._load_map("m_an_khe"), "Presentation smoke restores the village map")
	main.player.position = village_spawn
	main.map_world.update_player_context(main.player.position)
	main.player.position = Vector2(19 * 32, 31 * 32)
	main.map_world.update_player_context(main.player.position)
	await process_frame
	await _capture("an-khe-sakura-behind.png")
	main.player.position = Vector2(19 * 32, 34 * 32)
	main.map_world.update_player_context(main.player.position)
	await process_frame
	await _capture("an-khe-sakura-front.png")
	var herbalist: MapInteractable = main.map_world.get_interactable("ak.npc.ba_sam")
	check(herbalist != null, "Herbalist has a stable map entity id")
	main.player.position = herbalist.position
	check(main.map_world.update_interaction_focus(herbalist.position) == herbalist, "Nearest POI becomes the interaction target")
	hud.set_interaction_prompt(herbalist.prompt_text())
	check(hud.get_node("InteractionHint").visible, "Focused POI appears in the HUD")
	main._action("interact")
	check(main.local_map_flags.has("ak.ba_sam_intro"), "Herbalist interaction advances the local preview flag")
	check(hud.get_node("FieldInfo/Body").text.contains("Cổng Bắc"), "Dialogue does not replace the farm guidance panel")
	var village_gate: MapInteractable = main.map_world.get_interactable("ak.gate.truc_am")
	main.player.position = village_gate.position
	main._action("interact")
	await process_frame
	await process_frame
	check(main.current_map_id == "m_truc_am", "Village gate opens its configured destination")
	check_map_assets(main.map_world)
	var entry_bridge: MapProp = main.map_world.get_node("Actors/ta_prop_entry_bridge") as MapProp
	check(entry_bridge.z_index < main.player.z_index, "Entry bridge renders below the player at Trúc Âm spawn")
	check_field_info_visible(hud)
	check(hud.get_node("FieldInfo/Title").text == "SĂN QUÁI TỰ DO", "Trúc Âm foregrounds map farming")
	check(not main.map_world.nearest_field_mob(Vector2(464, 560), 8.0).is_empty(), "Field monsters are present inside the map runtime")
	await _capture("truc-am-runtime.png")
	await _capture_touch_layout(main, "truc-am-touch-runtime.png")
	check(main.player.position == Vector2(5 * 32, 29 * 32), "An Khê gate arrives beside its paired Trúc Âm exit")
	check(main.map_world.interactables_size() == 7, "Trúc Âm loads quest POIs and both linked map gates")
	check(main.map_world.get_node("AmbientFX").get_child_count() == 3, "Trúc Âm loads its water highlights")
	check(not main.can_walk(Vector2(11 * 32, 27 * 32)), "Trúc Âm river terrain blocks walking")
	check(main.can_walk(Vector2(3 * 32, 27 * 32)), "The entry bridge keeps its authored walkable deck")
	var truc_retreat: MapInteractable = main.map_world.get_interactable("ta.retreat.ankhe")
	main.player.position = truc_retreat.position
	main._action("interact")
	await process_frame
	await process_frame
	check(main.current_map_id == "m_an_khe", "Trúc Âm return gate leads back to An Khê")
	check(main.player.position == Vector2(22 * 32, 4 * 32), "Trúc Âm return arrives beside the paired An Khê gate")
	main._action("map")
	await process_frame
	check(map_panel.visible, "Map action opens route panel")
	await _capture("world-route-overview.png")
	map_panel.route_buttons["m_truc_am"].emit_signal("pressed")
	check(map_panel.selected_id == "m_truc_am", "Route selection updates selected map")
	check(map_panel.info.text.contains("Sơn Trư"), "Map selection shows field monster information")
	var initial_position: Vector2 = main.player.position
	check(map_panel.route_connections.size() == 3, "Route panel loads all three linked map passages")
	check(map_panel._route_summary("m_truc_am").contains("Lối núi → Thạch Cạn"), "Route card shows the named link to Thạch Cạn")
	check(main.player.position == initial_position, "Selecting a route card does not teleport the player")
	await _capture("connected-route-panel.png")
	map_panel.travel_button.emit_signal("pressed")
	await process_frame
	await process_frame
	check(main.current_map_id == "m_truc_am", "Travel action loads Trúc Âm")
	check(main.local_map_travel_pending, "Offline map selection is retained for the next backend connection")
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
	check(main.player.position == Vector2(4 * 32, 17 * 32), "Trúc Âm gate arrives beside its paired Thạch Cạn exit")
	check_map_assets(main.map_world)
	var mine_entrance: MapProp = main.map_world.get_node("Actors/tc_prop_mine_entrance") as MapProp
	check(mine_entrance != null and not mine_entrance.get_node("Sprite").texture is AtlasTexture, "Thạch Cạn mine entrance uses its own cutout")
	check(mine_entrance.get_node("Sprite").texture.get_image().detect_alpha() != Image.ALPHA_NONE, "Thạch Cạn mine entrance cutout retains alpha")
	var flow_pillar: MapProp = main.map_world.get_node("Actors/tc_prop_flow_pillar") as MapProp
	check(flow_pillar != null and not flow_pillar.get_node("Sprite").texture is AtlasTexture, "Thạch Cạn flow pillar uses its own cutout")
	check(flow_pillar.get_node("Sprite").texture.get_image().detect_alpha() != Image.ALPHA_NONE, "Thạch Cạn flow pillar cutout retains alpha")
	for prop_id in ["tc_prop_ore_vein", "tc_prop_mine_support", "tc_prop_rest_cart", "tc_prop_deep_crystal"]:
		var cutout: MapProp = main.map_world.get_node("Actors/" + prop_id) as MapProp
		check(cutout != null, prop_id + " is present in Thạch Cạn")
		if cutout != null:
			check(not cutout.get_node("Sprite").texture is AtlasTexture, prop_id + " uses a separate cutout")
			check(cutout.get_node("Sprite").texture.get_image().detect_alpha() != Image.ALPHA_NONE, prop_id + " has no opaque square background")
	check(main.can_walk(flow_pillar.position), "Thạch Cạn flow pillar is reachable on dry ground")
	check_field_info_visible(hud)
	await _capture("thach-can-runtime.png")
	await _capture_touch_layout(main, "thach-can-touch-runtime.png")
	main.player.position = flow_pillar.position + Vector2(0, 32)
	main.map_world.update_player_context(main.player.position)
	await process_frame
	await _capture("thach-can-flow-pillar-runtime.png")
	check(main.map_world.interactables_size() == 5, "Thạch Cạn loads its own interactive map data")
	check(not main.can_walk(Vector2(5 * 32, 8 * 32)), "Thạch Cạn void terrain blocks walking")
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
	check_field_info_visible(hud)
	await _capture("co-tinh-runtime.png")
	await _capture_touch_layout(main, "co-tinh-touch-runtime.png")
	check(main.player.position == Vector2(11 * 32, 25 * 32), "Thạch Cạn gate arrives beside its paired Cổ Tỉnh exit")
	check(main.map_world.interactables_size() == 5, "Cổ Tỉnh loads its own interactive map data")
	check(main.map_world.areas_size() == 5, "Cổ Tỉnh has five named rooms")
	check(main.map_world.active_area_name == "Cửa Giếng", "Cổ Tỉnh spawn is in the entrance room")
	check(not main.can_walk(Vector2(24 * 32, 7 * 32)), "Cổ Tỉnh water terrain blocks walking")
	check(main.can_walk(main.map_world.get_interactable("ct.mach_ban.balance").position), "Cổ Tỉnh balance point is on a dry approach")
	check(main.can_walk(main.map_world.get_interactable("ct.formation.panel").position), "Cổ Tỉnh formation panel is on a dry approach")
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
	check(main.player.position == Vector2(40 * 32, 24 * 32), "Cổ Tỉnh retreat arrives beside the paired Thạch Cạn gate")
	var thach_retreat: MapInteractable = main.map_world.get_interactable("tc.retreat.truc_am")
	main.player.position = thach_retreat.position
	main._action("interact")
	await process_frame
	await process_frame
	check(main.current_map_id == "m_truc_am", "Thạch Cạn return gate leads back to Trúc Âm")
	check(main.player.position == Vector2(42 * 32, 4 * 32), "Thạch Cạn return arrives beside the paired Trúc Âm gate")
	var thach_gate_back: MapInteractable = main.map_world.get_interactable("ta.gate.thach_can")
	main.player.position = thach_gate_back.position
	main._action("interact")
	await process_frame
	await process_frame
	check(main.current_map_id == "m_thach_can", "Trúc Âm passage returns to Thạch Cạn")
	check(main.player.position == Vector2(4 * 32, 17 * 32), "Return passage lands beside the same linked exit")
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
	await _capture_son_tru_preview(main)
	check(main._load_map("m_an_khe"), "Runtime interaction checks reload the An Khê prototype")
	var resource_tree: MapResourceTree = main.map_world.get_resource_tree("ak.tree.woodland_01")
	check(resource_tree != null and resource_tree.state_index == 0 and resource_tree.can_be_chopped(),
		"Interactive tree starts upright and can be harvested")
	if resource_tree != null:
		main.player.position = resource_tree.position + Vector2(40.0, 0.0)
		main.player.row = 1
		main._action("attack")
		check(resource_tree.hit_count == 1 and resource_tree.state_index == 1,
			"World attack input chops a tree in front of the player")
		check(resource_tree.hits_remaining() == 2 and resource_tree.state_index == 1,
			"First axe hit changes the tree art and health")
		check(main._load_map("m_an_khe"), "Map reload preserves the local resource state")
		resource_tree = main.map_world.get_resource_tree("ak.tree.woodland_01")
		check(resource_tree != null and resource_tree.hit_count == 1 and resource_tree.state_index == 1,
			"A damaged tree keeps its state after leaving and returning to An Khê")
		resource_tree.chop()
		check(resource_tree.state_index == 2, "Second axe hit shows the leaning tree state")
		var final_hit: Dictionary = resource_tree.chop()
		check(bool(final_hit.get("falling", false)), "Final axe hit starts the fall")
		await create_timer(0.22).timeout
		check(resource_tree.is_felled and resource_tree.state_index == 3,
			"Felled tree becomes a small stump")
		var tree_collider := resource_tree.get_node("CollisionShape2D") as CollisionShape2D
		check(resource_tree.collision_layer == 0 and tree_collider.disabled,
			"Stump no longer blocks the walking path")
		check(main._load_map("m_an_khe"), "An Khê reloads after the tree falls")
		resource_tree = main.map_world.get_resource_tree("ak.tree.woodland_01")
		check(resource_tree != null and resource_tree.is_felled and resource_tree.state_index == 3,
			"A felled tree remains a stump after a map transition")
		if resource_tree != null:
			var stump_collider := resource_tree.get_node("CollisionShape2D") as CollisionShape2D
			check(resource_tree.collision_layer == 0 and stump_collider.disabled,
				"Persisted stump keeps the path clear")
	var flower: MapFlower = main.map_world.get_node("Actors/ak_flower_pink_01") as MapFlower
	check(flower != null, "Flower clump has a stable scene object")
	if flower != null:
		flower._on_body_entered(main.player)
		for _frame in range(12):
			await process_frame
		check(flower.stomp_count == 1 and flower.sprite.scale.y < 0.8,
			"Player contact compresses the flower sprite")
		await create_timer(0.55).timeout
		check(absf(flower.sprite.scale.y - 0.88) < 0.02, "Flower springs back after the player steps off")
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
