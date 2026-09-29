extends SceneTree
## Verifies built-in scene text and runtime-generated labels in both locales.

const Main = preload("res://scenes/main.tscn")
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(condition: bool, message: String) -> void:
	if not condition:
		failures += 1
		push_error(message)

func _run() -> void:
	LanguageManager.set_locale("vi", false)
	check(LanguageManager.translate_message("Leave the current match first") == "Hãy rời trận hiện tại trước.",
		"English server errors are translated into Vietnamese")
	check(LanguageManager.translate_message("Sơn Trư respawns in 12 seconds") == "Sơn Trư hồi sinh sau 12 giây.",
		"Dynamic server cooldown errors are translated into Vietnamese")
	var main = Main.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame

	var character: CharacterPanel = main.character_panel
	character.show_page("profile")
	var character_title: Label = character.get_node("Title")
	var attack_label: Label = character.get_node("PageHost/ProfilePage/StatsCard/Attack")
	check(character_title.text == "NHÂN VẬT", "Vietnamese scene title loads from translations")
	check(attack_label.text == "Công kích • 16", "Vietnamese runtime combat stats use translated templates")

	LanguageManager.set_locale("en", false)
	await process_frame
	check(character_title.text == "CHARACTER", "English scene title switches at runtime")
	check(attack_label.text == "Attack • 16", "English runtime combat stats switch at runtime")
	check(character.get_node("PageHost/SettingsPage/SettingsCard/Language").selected == 1,
		"Language selector tracks the active English locale")

	main.inventory_panel.open_inventory()
	await process_frame
	check(main.inventory_panel.summary.text == "Preview • 10 / 24 slots",
		"English inventory summary uses translated format strings")
	main.world_map.open_map()
	await process_frame
	check(main.world_map.info.text.contains("Safe hub"), "World map description is translated")
	main.hud.notify_format("Đã nhận %d tu vi và %s.", [18, "Da Sơn Trư ×1"])
	check(main.hud.get_node("Toast/Message").text == "Received 18 Qi and Boar Hide ×1.",
		"Formatted notices translate both the template and its item name")

	LanguageManager.set_locale("vi", false)
	await process_frame
	check(character_title.text == "NHÂN VẬT" and attack_label.text == "Công kích • 16",
		"Switching back restores Vietnamese dynamic and scene text")
	check(character.get_node("PageHost/SettingsPage/SettingsCard/Language").selected == 0,
		"Language selector tracks the active Vietnamese locale")
	check(main.hud.get_node("Toast/Message").text == "Đã nhận 18 tu vi và Da Sơn Trư ×1.",
		"Formatted notices retain source values and switch back to Vietnamese")

	main.queue_free()
	await process_frame
	if failures == 0:
		print("PASS Godot localization smoke: Vietnamese and English, including runtime labels")
	quit(0 if failures == 0 else 1)
