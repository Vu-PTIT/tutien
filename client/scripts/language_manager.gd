extends Node
## Applies the player's saved locale before the main scene is ready.

signal locale_changed(locale: String)

const SETTINGS_PATH := "user://game_settings.cfg"

var _locale := "vi"

func _ready() -> void:
	var config := ConfigFile.new()
	if config.load(SETTINGS_PATH) == OK:
		_locale = _normalize_locale(str(config.get_value("general", "language", "vi")))
	_apply_locale()

func get_locale() -> String:
	return _locale

func set_locale(locale: String, persist: bool = true) -> void:
	var normalized := _normalize_locale(locale)
	if normalized == _locale:
		if persist:
			_save_locale()
		return
	_locale = normalized
	_apply_locale()
	locale_changed.emit(_locale)
	if persist:
		_save_locale()

func format_message(template: String, arguments: Array) -> String:
	var translated_arguments: Array = []
	for argument: Variant in arguments:
		translated_arguments.append(tr(argument) if argument is String else argument)
	return tr(template) % translated_arguments

func translate_message(message: String) -> String:
	var exact_translation := tr(message)
	if exact_translation != message:
		return exact_translation
	var body := message
	if body.begins_with("Kết nối thất bại: "):
		return format_message("Kết nối thất bại: %s", [body.trim_prefix("Kết nối thất bại: ")])
	if body.begins_with("Not enough "):
		return format_message("Not enough %s", [body.trim_prefix("Not enough ")])
	if body.begins_with("Unknown item: "):
		return format_message("Unknown item: %s", [body.trim_prefix("Unknown item: ")])
	if body.begins_with("Sơn Trư respawns in ") and body.ends_with(" seconds"):
		var respawn_seconds := int(body.trim_prefix("Sơn Trư respawns in ").trim_suffix(" seconds"))
		return tr("Sơn Trư respawns in %d seconds") % respawn_seconds
	if _locale == "vi":
		return message
	var skill_prefix := ""
	var hit_marker := " • Đã gây "
	var kill_marker := " • Đã hạ "
	if body.contains(hit_marker):
		var hit_marker_index := body.find(hit_marker)
		skill_prefix = tr(body.substr(0, hit_marker_index)) + " • "
		body = body.substr(hit_marker_index + 3)
	elif body.contains(kill_marker):
		var kill_marker_index := body.find(kill_marker)
		skill_prefix = tr(body.substr(0, kill_marker_index)) + " • "
		body = body.substr(kill_marker_index + 3)
	if body.begins_with("Đã gây "):
		var damage_marker := " sát thương lên "
		var target_start := body.find(damage_marker)
		if target_start < 0:
			return message
		var damage := int(body.substr("Đã gây ".length(), target_start - "Đã gây ".length()))
		var damage_target_name := body.substr(target_start + damage_marker.length()).trim_suffix(".")
		return tr("%sĐã gây %d sát thương lên %s.") % [skill_prefix, damage, tr(damage_target_name)]
	if not body.begins_with("Đã hạ "):
		return message
	var sections := body.split(" • ")
	if sections.size() < 2:
		return message
	var defeated_target_name := sections[0].trim_prefix("Đã hạ ")
	var loot: String = sections[1]
	if loot.begins_with("rơi "):
		var loot_equipment_name := loot.trim_prefix("rơi ")
		var guaranteed := loot_equipment_name.contains(" (bảo đảm)")
		if guaranteed:
			loot_equipment_name = loot_equipment_name.substr(0, loot_equipment_name.find(" (bảo đảm)"))
		var loot_suffix := " và vật phẩm săn"
		if not loot_equipment_name.ends_with(loot_suffix):
			return message
		loot_equipment_name = loot_equipment_name.trim_suffix(loot_suffix)
		var loot_key := "rơi %s (bảo đảm) và vật phẩm săn" if guaranteed else "rơi %s và vật phẩm săn"
		loot = tr(loot_key) % tr(loot_equipment_name)
	elif loot == "nhận vật phẩm săn":
		loot = tr(loot)
	else:
		return message
	var translated := tr("%sĐã hạ %s • %s.") % [skill_prefix, tr(defeated_target_name), loot]
	for index in range(2, sections.size()):
		var detail: String = sections[index]
		if detail.begins_with("+") and detail.ends_with(" XP"):
			translated += tr(" • +%d XP") % int(detail.trim_prefix("+").trim_suffix(" XP"))
		elif detail.ends_with(" lượt tới mốc bảo đảm"):
			var count_end := detail.find(" lượt tới mốc bảo đảm")
			var counter_start := detail.rfind(" ", count_end)
			if counter_start < 0:
				continue
			var pity_equipment_name := detail.substr(0, counter_start)
			var counter: PackedStringArray = detail.substr(counter_start + 1, count_end - counter_start - 1).split("/")
			if counter.size() == 2:
				translated += tr(" • %s %d/%d lượt tới mốc bảo đảm") % [tr(pity_equipment_name), int(counter[0]), int(counter[1])]
	return translated

func _normalize_locale(locale: String) -> String:
	return "en" if locale.to_lower().begins_with("en") else "vi"

func _apply_locale() -> void:
	var scene_tree := get_tree()
	if scene_tree != null:
		scene_tree.root.auto_translate_mode = Node.AUTO_TRANSLATE_MODE_ALWAYS
	TranslationServer.set_locale(_locale)

func _save_locale() -> void:
	var config := ConfigFile.new()
	config.load(SETTINGS_PATH)
	config.set_value("general", "language", _locale)
	var error := config.save(SETTINGS_PATH)
	if error != OK:
		push_warning("Could not save the selected language setting.")
