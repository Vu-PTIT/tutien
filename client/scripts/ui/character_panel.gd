class_name CharacterPanel
extends Panel
## Character overview, current combat skills and device-local settings.
signal inventory_requested
signal touch_layout_changed(enabled: bool)

const Visuals = preload("res://scripts/ui/item_visuals.gd")
const SETTINGS_PATH := "user://game_settings.cfg"
const REALM_THRESHOLDS := [300, 600, 1000]

var api: SocialApi
var display_name: String = ""
var profile: Dictionary = {}
var inventory: Array = []
var catalog: Dictionary = {}
var preview_mode: bool = true
var loading: bool = false
var touch_layout_enabled: bool = false
var fullscreen_enabled: bool = false
var master_volume: float = 0.8

func _ready() -> void:
	$Close.pressed.connect(hide)
	$ProfileTab.pressed.connect(func() -> void: show_page("profile"))
	$SkillsTab.pressed.connect(func() -> void: show_page("skills"))
	$SettingsTab.pressed.connect(func() -> void: show_page("settings"))
	$Refresh.pressed.connect(refresh)
	$PageHost/ProfilePage/EquipmentCard/OpenEquipmentBag.pressed.connect(
		func() -> void: inventory_requested.emit())
	$PageHost/SettingsPage/SettingsCard/Volume.value_changed.connect(_on_volume_changed)
	$PageHost/SettingsPage/SettingsCard/Fullscreen.toggled.connect(_on_fullscreen_toggled)
	$PageHost/SettingsPage/SettingsCard/TouchLayout.toggled.connect(_on_touch_layout_toggled)
	_load_settings()
	_apply_volume()
	_apply_fullscreen()
	show_page("profile")
	_show_preview()

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
		$DataState.text = "CHƯA TẢI ĐƯỢC • " + str(result.error)
		return
	profile = result.get("profile", {}).duplicate(true)
	inventory = profile.get("inventory", []).duplicate(true)
	catalog.clear()
	for definition: Variant in result.get("catalog", []):
		if definition is Dictionary and definition.has("id"):
			catalog[str(definition.id)] = definition
	preview_mode = false
	$DataState.text = "DỮ LIỆU NHÂN VẬT • ĐÃ ĐỒNG BỘ TỪ MÁY CHỦ"
	_render_profile()

func _show_preview() -> void:
	preview_mode = true
	profile = {
		"realm": "mortal", "realmStage": 0, "cultivationXp": 0, "hp": 100,
		"spiritStones": 0, "equipped": {"weapon": "", "armor": ""}, "inventory": []
	}
	inventory = []
	catalog.clear()
	$DataState.text = "BẢN XEM THỬ • OFFLINE • KHÔNG PHẢI DỮ LIỆU TÀI KHOẢN"
	_render_profile()

func _render_profile() -> void:
	if not is_node_ready():
		return
	var realm_id := str(profile.get("realm", "mortal"))
	var stage := int(profile.get("realmStage", 0))
	var realm_name := "Phàm nhân" if realm_id == "mortal" else "Luyện Khí • tầng %d" % stage
	$PageHost/ProfilePage/PortraitCard/AvatarCaption.text = display_name if not display_name.is_empty() else "TU SĨ"
	$PageHost/ProfilePage/PortraitCard/Realm.text = realm_name.to_upper()
	$PageHost/ProfilePage/StatsCard/Name.text = display_name if not display_name.is_empty() else "Tu sĩ"
	$PageHost/ProfilePage/StatsCard/RealmLine.text = "Cảnh giới • " + realm_name

	var cultivation_xp := int(profile.get("cultivationXp", 0))
	var threshold := 100
	var max_realm_reached := false
	if realm_id == "luyen_khi":
		max_realm_reached = stage >= 4
		threshold = int(REALM_THRESHOLDS[clampi(stage - 1, 0, REALM_THRESHOLDS.size() - 1)]) if not max_realm_reached else 1
	$PageHost/ProfilePage/StatsCard/Cultivation.max_value = maxf(float(threshold), 1.0)
	$PageHost/ProfilePage/StatsCard/Cultivation.value = 0.0 if max_realm_reached else clampi(cultivation_xp, 0, threshold)
	if max_realm_reached:
		$PageHost/ProfilePage/StatsCard/CultivationText.text = "Tu vi • đã đạt cảnh giới cao nhất"
	else:
		$PageHost/ProfilePage/StatsCard/CultivationText.text = "Tu vi • %d / %d XP" % [cultivation_xp, threshold]

	var hp := int(profile.get("hp", 100))
	$PageHost/ProfilePage/StatsCard/Health.max_value = 100
	$PageHost/ProfilePage/StatsCard/Health.value = clampi(hp, 0, 100)
	$PageHost/ProfilePage/StatsCard/HealthText.text = "Sinh lực • %d / 100" % hp
	var weapon := _equipped_item("weapon")
	var armor := _equipped_item("armor")
	var weapon_definition := _definition_for(weapon)
	var armor_definition := _definition_for(armor)
	var attack_bonus := int(weapon_definition.get("attackBonus", 0))
	var defense_bonus := int(armor_definition.get("defenseBonus", 0))
	$PageHost/ProfilePage/StatsCard/Attack.text = "Công kích • %d" % (16 + attack_bonus)
	$PageHost/ProfilePage/StatsCard/Defense.text = "Phòng ngự • %d" % (5 + defense_bonus)
	$PageHost/ProfilePage/StatsCard/Stones.text = "Linh thạch • %d" % int(profile.get("spiritStones", 0))
	_set_equipment_slot("WeaponSlot", "Kiếm", weapon, weapon_definition, "attackBonus", "Công kích")
	_set_equipment_slot("ArmorSlot", "Áo", armor, armor_definition, "defenseBonus", "Phòng ngự")

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
		name_label.text = slot_title + " • Chưa trang bị"
		bonus_label.text = "Mở Túi đồ để chọn " + slot_title.to_lower()
		return
	var item_id := str(item.get("itemId", ""))
	var fallback: Array = Visuals.definition(item_id)
	var item_name := str(definition.get("name", fallback[0]))
	var bonus := int(definition.get(bonus_key, 0))
	icon.texture = Visuals.icon(item_id)
	name_label.text = item_name
	bonus_label.text = "%s +%d" % [bonus_title, bonus] if bonus > 0 else slot_title + " đang mặc"

func _load_settings() -> void:
	var config := ConfigFile.new()
	var status := config.load(SETTINGS_PATH)
	if status == OK:
		master_volume = clampf(float(config.get_value("audio", "master", 0.8)), 0.0, 1.0)
		fullscreen_enabled = bool(config.get_value("display", "fullscreen", false))
		touch_layout_enabled = bool(config.get_value("controls", "touch_layout", OS.has_feature("mobile")))
	else:
		touch_layout_enabled = OS.has_feature("mobile")
	$PageHost/SettingsPage/SettingsCard/Volume.set_value(master_volume)
	$PageHost/SettingsPage/SettingsCard/VolumeValue.text = "%d%%" % roundi(master_volume * 100.0)
	$PageHost/SettingsPage/SettingsCard/Fullscreen.set_pressed_no_signal(fullscreen_enabled)
	$PageHost/SettingsPage/SettingsCard/TouchLayout.set_pressed_no_signal(touch_layout_enabled)

func _save_settings() -> void:
	var config := ConfigFile.new()
	config.set_value("audio", "master", master_volume)
	config.set_value("display", "fullscreen", fullscreen_enabled)
	config.set_value("controls", "touch_layout", touch_layout_enabled)
	var status := config.save(SETTINGS_PATH)
	if status != OK:
		$PageHost/SettingsPage/SettingsCard/SettingsNote.text = "Không lưu được cài đặt trên thiết bị này."

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
