class_name CharacterPanel
extends Panel
## Character overview, current combat skills and device-local settings.
signal inventory_requested
signal touch_layout_changed(enabled: bool)
signal profile_updated(profile: Dictionary)

const Visuals = preload("res://scripts/ui/item_visuals.gd")
const SETTINGS_PATH := "user://game_settings.cfg"
const REALM_THRESHOLDS := [300, 600, 1000]
const PREVIEW_SKILLS := [
	{"id": "sk_scan", "name": "Mạch Bàn • Truy Dấu", "kind": "utility",
		"description": "Dò dấu linh mạch và ghi nhận dấu nước trong nhiệm vụ.",
		"unlockText": "Mở qua nhiệm vụ khảo sát tại Trúc Âm.", "equipSlot": ""},
	{"id": "sk_phi_nhan", "name": "Phi Nhận", "kind": "active",
		"description": "Phóng phi nhận vào mục tiêu gần, tăng 18 sát thương.",
		"unlockText": "Mở sau nghi thức Hơi Thở Đầu Tiên.",
		"equipSlot": "active_1", "hotkey": "R", "powerBonus": 18, "cooldownMs": 1800}
]

var api: SocialApi
var display_name: String = ""
var profile: Dictionary = {}
var inventory: Array = []
var catalog: Dictionary = {}
var skill_definitions: Array = []
var skill_catalog: Dictionary = {}
var selected_skill_id: String = ""
var preview_mode: bool = true
var loading: bool = false
var touch_layout_enabled: bool = false
var fullscreen_enabled: bool = false
var master_volume: float = 0.8
var language_manager: Variant

func _ready() -> void:
	language_manager = get_node_or_null("/root/LanguageManager")
	$Close.pressed.connect(hide)
	$ProfileTab.pressed.connect(func() -> void: show_page("profile"))
	$SkillsTab.pressed.connect(func() -> void: show_page("skills"))
	$SettingsTab.pressed.connect(func() -> void: show_page("settings"))
	$Refresh.pressed.connect(refresh)
	$PageHost/SkillsPage/SkillDetail/EquipButton.pressed.connect(_equip_selected_skill)
	$PageHost/SkillsPage/SkillLoadoutCard/RemoveSkill.pressed.connect(
		func() -> void: _equip_skill(""))
	$PageHost/ProfilePage/EquipmentCard/OpenEquipmentBag.pressed.connect(
		func() -> void: inventory_requested.emit())
	$PageHost/SettingsPage/SettingsCard/Volume.value_changed.connect(_on_volume_changed)
	$PageHost/SettingsPage/SettingsCard/Fullscreen.toggled.connect(_on_fullscreen_toggled)
	$PageHost/SettingsPage/SettingsCard/TouchLayout.toggled.connect(_on_touch_layout_toggled)
	var language_selector: OptionButton = $PageHost/SettingsPage/SettingsCard/Language
	language_selector.add_item("Tiếng Việt")
	language_selector.set_item_metadata(0, "vi")
	language_selector.add_item("English")
	language_selector.set_item_metadata(1, "en")
	language_selector.item_selected.connect(_on_language_selected)
	if language_manager != null:
		language_manager.locale_changed.connect(_on_language_changed)
	_load_settings()
	_apply_volume()
	_apply_fullscreen()
	show_page("profile")
	_show_preview()
	if language_manager != null:
		_on_language_changed(language_manager.get_locale())

func set_display_name(value: String) -> void:
	display_name = value.strip_edges()
	_render_profile()

func open_profile() -> void:
	show_page("profile")
	show()
	await refresh()

func show_page(page: String) -> void:
	$PageHost/ProfilePage.visible = page == "profile"
	$PageHost/SkillsPage.visible = page == "skills"
	$PageHost/SettingsPage.visible = page == "settings"
	$Refresh.visible = page == "profile"
	for entry in [["ProfileTab", "profile"], ["SkillsTab", "skills"], ["SettingsTab", "settings"]]:
		get_node(entry[0]).modulate = Color("efcd87") if page == entry[1] else Color.WHITE
	if page == "profile":
		_render_profile()
	elif page == "skills":
		_render_skills()

func refresh() -> void:
	if loading:
		return
	if api == null or api.token.is_empty():
		_show_preview()
		return
	loading = true
	$DataState.text = "ĐANG TẢI HỒ SƠ TỪ MÁY CHỦ…"
	$Refresh.disabled = true
	var result: Dictionary = await api.call_rpc("inventory_get")
	loading = false
	$Refresh.disabled = false
	if result.has("error"):
		$DataState.text = tr("CHƯA TẢI ĐƯỢC • %s") % tr(str(result.error))
		return
	profile = result.get("profile", {}).duplicate(true)
	inventory = profile.get("inventory", []).duplicate(true)
	catalog.clear()
	for definition: Variant in result.get("catalog", []):
		if definition is Dictionary and definition.has("id"):
			catalog[str(definition.id)] = definition
	_set_skill_definitions(result.get("skills", []))
	preview_mode = false
	$DataState.text = "DỮ LIỆU NHÂN VẬT • ĐÃ ĐỒNG BỘ TỪ MÁY CHỦ"
	_render_profile()
	profile_updated.emit(profile.duplicate(true))

func _show_preview() -> void:
	preview_mode = true
	profile = {
		"realm": "mortal", "realmStage": 0, "cultivationXp": 0, "hp": 100,
		"spiritStones": 0, "equipped": {"weapon": "", "armor": ""}, "inventory": [],
		"learnedSkills": ["sk_scan", "sk_phi_nhan"], "equippedSkills": {"active_1": ""}
	}
	inventory = []
	catalog.clear()
	_set_skill_definitions(PREVIEW_SKILLS)
	$DataState.text = "BẢN XEM THỬ • OFFLINE • KHÔNG PHẢI DỮ LIỆU TÀI KHOẢN"
	_render_profile()

func _render_profile() -> void:
	if not is_node_ready():
		return
	var realm_id := str(profile.get("realm", "mortal"))
	var stage := int(profile.get("realmStage", 0))
	var realm_name := tr("Phàm nhân") if realm_id == "mortal" else tr("Luyện Khí • tầng %d") % stage
	$PageHost/ProfilePage/PortraitCard/AvatarCaption.text = display_name if not display_name.is_empty() else tr("TU SĨ")
	$PageHost/ProfilePage/PortraitCard/Realm.text = realm_name.to_upper()
	$PageHost/ProfilePage/StatsCard/Name.text = display_name if not display_name.is_empty() else tr("Tu sĩ")
	$PageHost/ProfilePage/StatsCard/RealmLine.text = tr("Cảnh giới • %s") % realm_name

	var cultivation_xp := int(profile.get("cultivationXp", 0))
	var threshold := 100
	var max_realm_reached := false
	if realm_id == "luyen_khi":
		max_realm_reached = stage >= 4
		threshold = int(REALM_THRESHOLDS[clampi(stage - 1, 0, REALM_THRESHOLDS.size() - 1)]) if not max_realm_reached else 1
	$PageHost/ProfilePage/StatsCard/Cultivation.max_value = maxf(float(threshold), 1.0)
	$PageHost/ProfilePage/StatsCard/Cultivation.value = 0.0 if max_realm_reached else clampi(cultivation_xp, 0, threshold)
	if max_realm_reached:
		$PageHost/ProfilePage/StatsCard/CultivationText.text = tr("Tu vi • đã đạt cảnh giới cao nhất")
	else:
		$PageHost/ProfilePage/StatsCard/CultivationText.text = tr("Tu vi • %d / %d XP") % [cultivation_xp, threshold]

	var hp := int(profile.get("hp", 100))
	$PageHost/ProfilePage/StatsCard/Health.max_value = 100
	$PageHost/ProfilePage/StatsCard/Health.value = clampi(hp, 0, 100)
	$PageHost/ProfilePage/StatsCard/HealthText.text = tr("Sinh lực • %d / 100") % hp
	var weapon := _equipped_item("weapon")
	var armor := _equipped_item("armor")
	var weapon_definition := _definition_for(weapon)
	var armor_definition := _definition_for(armor)
	var attack_bonus := int(weapon_definition.get("attackBonus", 0))
	var defense_bonus := int(armor_definition.get("defenseBonus", 0))
	$PageHost/ProfilePage/StatsCard/Attack.text = tr("Công kích • %d") % (16 + attack_bonus)
	$PageHost/ProfilePage/StatsCard/Defense.text = tr("Phòng ngự • %d") % (5 + defense_bonus)
	$PageHost/ProfilePage/StatsCard/Stones.text = tr("Linh thạch • %d") % int(profile.get("spiritStones", 0))
	_set_equipment_slot("WeaponSlot", "Kiếm", weapon, weapon_definition, "attackBonus", "Công kích")
	_set_equipment_slot("ArmorSlot", "Áo", armor, armor_definition, "defenseBonus", "Phòng ngự")
	_render_skills()

func _equipped_item(slot_name: String) -> Dictionary:
	var equipped: Dictionary = profile.get("equipped", {})
	var instance_id := str(equipped.get(slot_name, ""))
	if instance_id.is_empty():
		return {}
	for item: Variant in inventory:
		if item is Dictionary and str(item.get("instanceId", "")) == instance_id:
			return item
	return {}

func _definition_for(item: Dictionary) -> Dictionary:
	if item.is_empty():
		return {}
	var item_id := str(item.get("itemId", ""))
	var definition: Dictionary = catalog.get(item_id, {})
	return definition

func _set_equipment_slot(node_name: String, slot_title: String, item: Dictionary,
		definition: Dictionary, bonus_key: String, bonus_title: String) -> void:
	var slot: Panel = $PageHost/ProfilePage/EquipmentCard.get_node(node_name)
	var icon: TextureRect = slot.get_node("Icon")
	var name_label: Label = slot.get_node("Name")
	var bonus_label: Label = slot.get_node("Bonus")
	if item.is_empty():
		icon.texture = null
		name_label.text = tr("%s • Chưa trang bị") % tr(slot_title)
		bonus_label.text = tr("Mở Túi đồ để chọn %s") % tr(slot_title)
		return
	var item_id := str(item.get("itemId", ""))
	var fallback: Array = Visuals.definition(item_id)
	var item_name := tr(str(definition.get("name", fallback[0])))
	var bonus := int(definition.get(bonus_key, 0))
	icon.texture = Visuals.icon(item_id)
	name_label.text = item_name
	bonus_label.text = tr("%s +%d") % [tr(bonus_title), bonus] if bonus > 0 else tr("%s đang mặc") % tr(slot_title)

func _set_skill_definitions(definitions: Array) -> void:
	skill_definitions = definitions.duplicate(true)
	skill_catalog.clear()
	for definition: Variant in skill_definitions:
		if definition is Dictionary and definition.has("id"):
			skill_catalog[str(definition.id)] = definition

func _render_skills() -> void:
	if not is_node_ready():
		return
	var list: VBoxContainer = $PageHost/SkillsPage/SkillRoster/Scroll/List
	for child: Node in list.get_children():
		list.remove_child(child)
		child.queue_free()
	var learned: Array = profile.get("learnedSkills", [])
	var equipped: Dictionary = profile.get("equippedSkills", {"active_1": ""})
	var active_id := str(equipped.get("active_1", ""))
	var active_definition: Dictionary = skill_catalog.get(active_id, {})
	var active_name := tr(str(active_definition.get("name", active_id)))
	$PageHost/SkillsPage/SkillLoadoutCard/EquippedSkill.text = (
		tr("Ô R • Chưa trang bị kỹ năng") if active_id.is_empty() else tr("Ô R • %s") % active_name)
	$PageHost/SkillsPage/SkillLoadoutCard/RemoveSkill.disabled = (
		active_id.is_empty() or preview_mode or loading)
	var first_skill := ""
	for definition: Variant in skill_definitions:
		if not definition is Dictionary:
			continue
		var skill_id := str(definition.get("id", ""))
		if skill_id.is_empty():
			continue
		if first_skill.is_empty():
			first_skill = skill_id
		var is_learned := learned.has(skill_id)
		var is_equipped := active_id == skill_id
		var button := Button.new()
		var skill_name := tr(str(definition.get("name", skill_id)))
		button.text = (tr("[R] %s") % skill_name) if is_equipped else skill_name
		if not is_learned:
			button.text += " • Chưa mở"
		button.tooltip_text = tr(str(definition.get("description", "")))
		button.custom_minimum_size = Vector2(0, 30)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.pressed.connect(_select_skill.bind(skill_id))
		list.add_child(button)
	if selected_skill_id.is_empty() or not skill_catalog.has(selected_skill_id):
		selected_skill_id = "sk_phi_nhan" if learned.has("sk_phi_nhan") else first_skill
	_render_skill_detail()

func _select_skill(skill_id: String) -> void:
	selected_skill_id = skill_id
	_render_skill_detail()

func _render_skill_detail() -> void:
	var detail_path := "PageHost/SkillsPage/SkillDetail/"
	var definition: Dictionary = skill_catalog.get(selected_skill_id, {})
	var equip_button: Button = get_node(detail_path + "EquipButton")
	if definition.is_empty():
		$PageHost/SkillsPage/SkillDetail/Name.text = "Chọn một kỹ năng"
		$PageHost/SkillsPage/SkillDetail/Meta.text = ""
		$PageHost/SkillsPage/SkillDetail/Description.text = "Kỹ năng sẽ xuất hiện khi nhân vật học được."
		$PageHost/SkillsPage/SkillDetail/Status.text = ""
		equip_button.text = "Chưa có kỹ năng"
		equip_button.disabled = true
		return
	var learned: Array = profile.get("learnedSkills", [])
	var equipped: Dictionary = profile.get("equippedSkills", {"active_1": ""})
	var is_learned := learned.has(selected_skill_id)
	var is_equippable := str(definition.get("equipSlot", "")) == "active_1"
	var is_equipped := str(equipped.get("active_1", "")) == selected_skill_id
	$PageHost/SkillsPage/SkillDetail/Name.text = tr(str(definition.get("name", selected_skill_id)))
	$PageHost/SkillsPage/SkillDetail/Meta.text = "ĐÃ HỌC" if is_learned else "CHƯA MỞ KHÓA"
	$PageHost/SkillsPage/SkillDetail/Description.text = tr(str(definition.get("description", "")))
	if not is_learned:
		$PageHost/SkillsPage/SkillDetail/Status.text = tr(str(definition.get("unlockText", "Hoàn thành nhiệm vụ để mở kỹ năng.")))
	elif not is_equippable:
		$PageHost/SkillsPage/SkillDetail/Status.text = tr("Kỹ năng hỗ trợ • tự dùng trong nhiệm vụ, không chiếm ô R.")
	else:
		$PageHost/SkillsPage/SkillDetail/Status.text = tr("Ô R • hồi chiêu 1,8 giây • dùng khi săn quái trên bản đồ.")
	if not is_learned:
		equip_button.text = "Chưa mở khóa"
	elif not is_equippable:
		equip_button.text = "Kỹ năng hỗ trợ"
	elif is_equipped:
		equip_button.text = "Đã trang bị vào ô R"
	else:
		equip_button.text = "Trang bị vào ô R"
	equip_button.disabled = loading or preview_mode or not is_learned or not is_equippable or is_equipped

func _equip_selected_skill() -> void:
	if selected_skill_id.is_empty():
		return
	_equip_skill(selected_skill_id)

func _skill_operation_id() -> String:
	return "skill_" + Crypto.new().generate_random_bytes(12).hex_encode()

func _equip_skill(skill_id: String) -> void:
	if loading or preview_mode or api == null or api.token.is_empty():
		$PageHost/SkillsPage/SkillDetail/Status.text = "Hãy kết nối tài khoản để lưu bộ kỹ năng."
		return
	loading = true
	$Refresh.disabled = true
	$PageHost/SkillsPage/SkillDetail/Status.text = "Đang lưu bộ kỹ năng lên máy chủ…"
	var result: Dictionary = await api.call_rpc("skill_equip", {
		"operationId": _skill_operation_id(), "skillId": skill_id
	})
	loading = false
	$Refresh.disabled = false
	if result.has("error"):
		$PageHost/SkillsPage/SkillDetail/Status.text = tr("Chưa trang bị được • %s") % tr(str(result.error))
		_render_skills()
		return
	profile = result.get("profile", profile).duplicate(true)
	_render_profile()
	profile_updated.emit(profile.duplicate(true))

func _load_settings() -> void:
	var config := ConfigFile.new()
	var status := config.load(SETTINGS_PATH)
	if status == OK:
		master_volume = clampf(float(config.get_value("audio", "master", 0.8)), 0.0, 1.0)
		fullscreen_enabled = bool(config.get_value("display", "fullscreen", false))
		touch_layout_enabled = bool(config.get_value("controls", "touch_layout", OS.has_feature("mobile")))
	else:
		touch_layout_enabled = OS.has_feature("mobile")
	$PageHost/SettingsPage/SettingsCard/Language.select(0 if language_manager.get_locale() == "vi" else 1)
	$PageHost/SettingsPage/SettingsCard/Volume.set_value(master_volume)
	$PageHost/SettingsPage/SettingsCard/VolumeValue.text = "%d%%" % roundi(master_volume * 100.0)
	$PageHost/SettingsPage/SettingsCard/Fullscreen.set_pressed_no_signal(fullscreen_enabled)
	$PageHost/SettingsPage/SettingsCard/TouchLayout.set_pressed_no_signal(touch_layout_enabled)

func _save_settings() -> void:
	var config := ConfigFile.new()
	config.load(SETTINGS_PATH)
	config.set_value("audio", "master", master_volume)
	config.set_value("display", "fullscreen", fullscreen_enabled)
	config.set_value("controls", "touch_layout", touch_layout_enabled)
	config.set_value("general", "language", language_manager.get_locale())
	var status := config.save(SETTINGS_PATH)
	if status != OK:
		$PageHost/SettingsPage/SettingsCard/SettingsNote.text = "Không lưu được cài đặt trên thiết bị này."

func _on_language_selected(index: int) -> void:
	var selector: OptionButton = $PageHost/SettingsPage/SettingsCard/Language
	if language_manager != null:
		language_manager.set_locale(str(selector.get_item_metadata(index)))
	_save_settings()

func _on_language_changed(locale: String) -> void:
	if not is_node_ready():
		return
	$Title.text = tr("NHÂN VẬT")
	$ProfileTab.text = tr("Hồ sơ")
	$SkillsTab.text = tr("Kỹ năng")
	$SettingsTab.text = tr("Cài đặt")
	$PageHost/SettingsPage/SettingsCard/Language.select(0 if locale == "vi" else 1)
	if preview_mode:
		$DataState.text = tr("BẢN XEM THỬ • OFFLINE • KHÔNG PHẢI DỮ LIỆU TÀI KHOẢN")
	elif loading:
		$DataState.text = tr("ĐANG TẢI HỒ SƠ TỪ MÁY CHỦ…")
	else:
		$DataState.text = tr("DỮ LIỆU NHÂN VẬT • ĐÃ ĐỒNG BỘ TỪ MÁY CHỦ")
	_render_profile()
	_render_skills()

func _on_volume_changed(value: float) -> void:
	master_volume = clampf(value, 0.0, 1.0)
	$PageHost/SettingsPage/SettingsCard/VolumeValue.text = "%d%%" % roundi(master_volume * 100.0)
	_apply_volume()
	_save_settings()

func _apply_volume() -> void:
	var master_bus := AudioServer.get_bus_index("Master")
	if master_bus >= 0:
		AudioServer.set_bus_volume_db(master_bus, -80.0 if master_volume <= 0.001 else linear_to_db(master_volume))

func _on_fullscreen_toggled(enabled: bool) -> void:
	fullscreen_enabled = enabled
	_apply_fullscreen()
	_save_settings()

func _apply_fullscreen() -> void:
	var target_mode := DisplayServer.WINDOW_MODE_FULLSCREEN if fullscreen_enabled else DisplayServer.WINDOW_MODE_WINDOWED
	if DisplayServer.window_get_mode() != target_mode:
		DisplayServer.window_set_mode(target_mode)

func _on_touch_layout_toggled(enabled: bool) -> void:
	touch_layout_enabled = enabled
	_save_settings()
	touch_layout_changed.emit(touch_layout_enabled)

func set_touch_layout_enabled(enabled: bool, persist: bool = true) -> void:
	touch_layout_enabled = enabled
	$PageHost/SettingsPage/SettingsCard/TouchLayout.set_pressed_no_signal(enabled)
	if persist:
		_save_settings()
	touch_layout_changed.emit(touch_layout_enabled)
