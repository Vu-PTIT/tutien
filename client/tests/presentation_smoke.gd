extends SceneTree
## Offline integration smoke for the account, social, inventory, and combat UI.
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

func _capture(filename: String) -> void:
	if capture_dir.is_empty():
		return
	await RenderingServer.frame_post_draw
	DirAccess.make_dir_recursive_absolute(capture_dir)
	var image := root.get_texture().get_image()
	check(image.save_png(capture_dir.path_join(filename)) == OK, "Capture failed: " + filename)

func _run() -> void:
	var main = Main.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	check(main.get_node_or_null("Arena") != null, "Combat arena is part of the minimal client shell")
	check(main.hud.get_node_or_null("Inventory") != null, "Inventory panel remains available")
	check(main.hud.get_node_or_null("SocialPanel") != null, "Community panel remains available")
	check(main.hud.get_node_or_null("CharacterPanel") != null, "Character panel remains available")

	var theme := load("res://themes/tutien_theme.tres") as Theme
	check(theme != null, "Shared UI theme loads")
	if theme != null:
		check(theme.is_type_variation(&"UIHeading", &"Label"), "Shared heading style loads")
		check(theme.is_type_variation(&"UISmall", &"Label"), "Shared body style loads")
		check(theme.is_type_variation(&"UIButtonSmall", &"Button"), "Shared button style loads")

	main._action("character")
	await process_frame
	check(main.character_panel.visible, "Character action opens the profile panel")
	await _capture("character-panel.png")
	main._action("inventory")
	await process_frame
	check(main.inventory_panel.visible, "Inventory action opens the inventory panel")
	await _capture("inventory-panel.png")
	main._action("social")
	await process_frame
	check(main.social_panel.visible, "Community action opens the social panel")
	await _capture("community-panel.png")

	main.character_panel.set_touch_layout_enabled(true, false)
	await process_frame
	check(main.hud.get_node("Hotbar").visible, "Touch layout keeps on-screen combat actions available")
	check(not main.hud.get_node("Controls").visible, "Touch layout hides keyboard-only instructions")
	await _capture("touch-layout.png")
	main.character_panel.set_touch_layout_enabled(false, false)

	main.inventory_panel.hide()
	main.character_panel.hide()
	main.social_panel.hide()
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
	check(main.boar_sprite.visible and main.boar_sprite.texture.get_size() == Vector2(64, 64), "PvE encounter presents the transparent enemy sprite")
	check(main.boar_sprite.position.distance_to(Vector2(446, 234)) < 0.01, "Server position is converted to arena coordinates")
	await _capture("combat-arena.png")
	for actor: Node2D in main.fighters.values():
		actor.queue_free()
	main.fighters.clear()
	main.api.match_id = ""
	main.api.match_kind = ""
	main.api.snapshot = {}
	main.last_phase = ""
	main.boar_sprite.hide()
	main.get_node("Arena").hide()
	main._update_buttons()

	main.queue_free()
	await process_frame
	print("Presentation smoke: ", "PASS" if failures == 0 else "FAIL", " (", failures, " failures)")
	quit(0 if failures == 0 else 1)
