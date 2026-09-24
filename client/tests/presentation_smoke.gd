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
	check(not main.can_walk(Vector2(50, 50)), "Roof must not be walkable")
	check(main.can_walk(Vector2(320, 232)), "Spawn must be walkable")
	check(bag.slot_buttons.size() == 24, "Inventory requires exactly 24 visual slots")
	check(hud.get_node("Hotbar").get_child_count() == 12, "Six buttons + six key labels")
	check(not bag.visible and not main.dock.visible, "Modals start closed")
	check(hud.get_node("Vitals/Qi").value == 0, "Do not invent a Qi value")
	await _capture("an-khe-runtime.png")
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
