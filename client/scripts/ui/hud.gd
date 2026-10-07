class_name PixelHUD
extends Control
signal action_requested(action: String)
signal weather_flash_reduced_changed(enabled: bool)
var toast_time: float = 0.0
var touch_layout: bool = false
var equipped_skill_id: String = ""
var phi_ren_icon: Texture2D
var _last_weather_state: Dictionary = {}
var _last_map_data: Dictionary = {}
var _last_profile: Dictionary = {}
var _last_prompt := ""
var _last_position := Vector2.ZERO
var _last_map_size := Vector2(640, 360)
var _last_tile_size := 32
var _last_area_name := ""
var _last_notification := ""
var _last_notification_key := ""
var _last_notification_args: Array = []
var language_manager: Variant

@onready var touch_controls: TouchControls = $TouchControls
@onready var character_panel: CharacterPanel = $CharacterPanel
@onready var local_map_panel: CurrentMapPanel = $LocalMap
@onready var social_panel: SocialPanel = $SocialPanel

func _ready() -> void:
	language_manager = get_node_or_null("/root/LanguageManager")
	if language_manager != null:
		language_manager.locale_changed.connect(_on_language_changed)
	$WeatherInfo/EffectsToggle.toggled.connect(func(enabled: bool) -> void: weather_flash_reduced_changed.emit(enabled))
	$BagButton.pressed.connect(func() -> void: action_requested.emit("inventory"))
	$MapButton.pressed.connect(func() -> void: action_requested.emit("map"))
	$Minimap.mouse_filter = Control.MOUSE_FILTER_STOP
	$Minimap.tooltip_text = tr("Bấm hoặc chạm để xem bản đồ khu vực hiện tại")
	$Minimap.gui_input.connect(_on_minimap_gui_input)
	$CharacterButton.pressed.connect(func() -> void: action_requested.emit("character"))
	$SocialButton.pressed.connect(func() -> void: action_requested.emit("social"))
	$SparringButton.text = "Farm"
	$SparringButton.tooltip_text = "Farm trên map • xem trạng thái máy chủ và đấu tập online"
	$SparringButton.pressed.connect(func() -> void: action_requested.emit("dock"))
	$HelpButton.pressed.connect(func() -> void:
		notify("Kéo cần trái để đi • chạm Đánh / Kỹ năng khi gần quái" if touch_layout else "WASD: đi • Q / J: đánh • R: kỹ năng • M: map • C: hồ sơ • G: cộng đồng • I: túi • E: tương tác"))
	phi_ren_icon = _make_phi_ren_icon()
	$Hotbar/Slot4.icon = null
	$Hotbar/Slot4.text = "—"
	for index in range(6):
		var action_id: String = ["item_heal", "item_herb", "attack", "interact", "locked", "dodge"][index]
		get_node("Hotbar/Slot%d" % index).pressed.connect(
			func() -> void: action_requested.emit(action_id))
	$Dock/Close.pressed.connect(func() -> void: $Dock.hide())
	for entry in ["Connect", "Create", "Join", "Ready", "Leave"]:
		var action_id: String = entry.to_lower()
		get_node("Dock/" + entry).pressed.connect(
			func() -> void: action_requested.emit(action_id))
	$Toast.hide()
	for index in [0, 1]:
		var button: Button = get_node("Hotbar/Slot%d" % index)
		button.modulate = Color(0.6, 0.6, 0.6)
		button.tooltip_text = "Chọn Hồi Nguyên Hoàn trong Túi đồ để hồi tối đa 40 HP." if index == 0 else "Ô vật phẩm thứ hai chưa được gán."
	$Hotbar/Slot4.tooltip_text = "R: mở Nhân vật > Kỹ năng để trang bị Phi Nhận."
	$Hotbar/Slot2.tooltip_text = "Q / J / chuột trái: đánh quái ở gần ngay trên map"
	$Hotbar/Slot3.tooltip_text = "E / chạm: tương tác với điểm gần nhất"
	$Hotbar/Slot5.tooltip_text = "Space: né trong đấu tập online"

func _make_phi_ren_icon() -> Texture2D:
	var image := Image.create(16, 16, false, Image.FORMAT_RGBA8)
	image.fill(Color(0, 0, 0, 0))
	for step in range(8):
		var x := 4 + step
		var y := 11 - step
		image.set_pixel(x, y, Color("f2dc91"))
		if x < 15 and y < 15:
			image.set_pixel(x + 1, y + 1, Color("c8924f"))
	image.set_pixel(2, 12, Color("7b5342"))
	image.set_pixel(3, 11, Color("7b5342"))
	image.set_pixel(4, 12, Color("7b5342"))
	image.set_pixel(5, 13, Color("7b5342"))
	return ImageTexture.create_from_image(image)

func _process(delta: float) -> void:
	$ModalShade.visible = $Inventory.visible or $Dock.visible or character_panel.visible or social_panel.visible
	touch_controls.set_controls_visible(touch_layout and not $Inventory.visible and not $Dock.visible and not character_panel.visible and not $WorldMap.visible and not local_map_panel.visible and not social_panel.visible)
	if toast_time > 0:
		toast_time -= delta
		$Toast.visible = toast_time > 0

func set_touch_layout(enabled: bool) -> void:
	touch_layout = enabled
	social_panel.set_touch_layout(enabled)
	$Hotbar.visible = not enabled
	$Controls.visible = not enabled
	if enabled:
		$HelpButton.set_anchors_preset(Control.PRESET_TOP_LEFT)
		$HelpButton.offset_left = 8.0
		$HelpButton.offset_top = 170.0
		$HelpButton.offset_right = 154.0
		$HelpButton.offset_bottom = 195.0
	else:
		$HelpButton.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
		$HelpButton.offset_left = 8.0
		$HelpButton.offset_top = -32.0
		$HelpButton.offset_right = 154.0
		$HelpButton.offset_bottom = -7.0
	$HelpButton.text = "Hướng dẫn" if enabled else "Hướng dẫn / trạng thái"
	touch_controls.set_controls_visible(enabled and not $Inventory.visible and not $Dock.visible and not character_panel.visible and not $WorldMap.visible and not local_map_panel.visible and not social_panel.visible)

func _on_minimap_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		if mouse_event.button_index == MOUSE_BUTTON_LEFT and mouse_event.pressed:
			action_requested.emit("current_map")
			$Minimap.accept_event()
	elif event is InputEventScreenTouch:
		var touch_event := event as InputEventScreenTouch
		if touch_event.pressed:
			action_requested.emit("current_map")
			$Minimap.accept_event()

func notify(message: String) -> void:
	_last_notification = message
	_last_notification_key = ""
	_last_notification_args.clear()
	_render_notification()
	$Toast/Message.clip_text = true
	$Toast.show()
	toast_time = 4.0

func notify_format(template: String, arguments: Array) -> void:
	_last_notification = ""
	_last_notification_key = template
	_last_notification_args = arguments.duplicate(true)
	_render_notification()
	$Toast/Message.clip_text = true
	$Toast.show()
	toast_time = 4.0

func _render_notification() -> void:
	if not _last_notification_key.is_empty():
		$Toast/Message.text = language_manager.format_message(_last_notification_key, _last_notification_args)
	else:
		$Toast/Message.text = language_manager.translate_message(_last_notification)

func set_weather(state: Dictionary) -> void:
	_last_weather_state = state.duplicate(true)
	$WeatherInfo/Time.text = tr("%s • %s") % [
		str(state.get("time_text", "08:00")), tr(str(state.get("phase_label", "BAN NGÀY")))
	]
	$WeatherInfo/Condition.text = tr(str(state.get("condition_label", "TRỜI QUANG")))
	var weather := str(state.get("weather", "clear"))
	match weather:
		"rain": $WeatherInfo/Condition.modulate = Color("c5e4f5")
		"storm": $WeatherInfo/Condition.modulate = Color("b7cced")
		_: $WeatherInfo/Condition.modulate = Color("ffe5a6") if not bool(state.get("is_night", false)) else Color("d3def8")
	$WeatherInfo.tooltip_text = tr("%s • %s. Ngày trong game kéo dài 24 phút; thời tiết vẫn tiếp diễn cả ban đêm.") % [
		tr(str(state.get("phase_label", "BAN NGÀY"))), tr(str(state.get("condition_label", "TRỜI QUANG")))
	]

func set_weather_flashes_reduced(enabled: bool) -> void:
	var toggle: Button = $WeatherInfo/EffectsToggle
	toggle.set_pressed_no_signal(enabled)
	toggle.tooltip_text = "Đang giảm nháy sấm sét" if enabled else "Giảm nháy sáng và âm thanh sấm sét"

func configure_map(map_data: Dictionary) -> void:
	_last_map_data = map_data.duplicate(true)
	var preview_path := str(map_data.get("preview", ""))
	var texture: Texture2D = load(preview_path) if not preview_path.is_empty() else null
	var authored_map := _build_authored_minimap(map_data)
	$Minimap/Map.texture = authored_map if authored_map != null else texture
	$Minimap/Map.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	$Location/Title.text = tr(str(map_data.get("name", "Map"))).to_upper()
	$Location/State.text = tr(str(map_data.get("summary", "")))
	$Minimap/Coordinates.tooltip_text = tr(str(map_data.get("name", "Map")))

const MAP_TILE_SYMBOLS := "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"

func _build_authored_minimap(data: Dictionary) -> ImageTexture:
	var layout_path := str(data.get("layout_path", ""))
	if layout_path.is_empty() or not FileAccess.file_exists(layout_path):
		return null
	var file := FileAccess.open(layout_path, FileAccess.READ)
	if file == null:
		return null
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		return null
	var layout: Dictionary = parsed
	var dimensions: Array = data.get("size_tiles", [])
	if dimensions.size() < 2:
		return null
	var width := int(dimensions[0])
	var height := int(dimensions[1])
	var rows: Array = data.get("runtime_ground_rows", layout.get("ground_rows", []))
	if width <= 0 or height <= 0 or rows.size() != height:
		return null
	var image := Image.create(width, height, false, Image.FORMAT_RGBA8)
	for y in range(height):
		var row := str(rows[y])
		if row.length() != width:
			return null
		for x in range(width):
			var tile := MAP_TILE_SYMBOLS.find(row.substr(x, 1))
			var color := Color("52794c") # grass
			if tile >= 16 and tile < 24:
				color = Color("af865b") # soil paths
			elif tile >= 24 and tile < 32:
				color = Color("aba99a") # stone plaza
			elif tile >= 32 and tile < 40:
				color = Color("34869b") # water
			elif tile >= 40 and tile < 48:
				color = Color("816443") # bridge/fence
			image.set_pixel(x, y, color)
	for values: Array in data.get("solid_rects_tiles", []):
		if values.size() < 4:
			continue
		for y in range(maxi(int(values[1]), 0), mini(int(values[1]) + int(values[3]), height)):
			for x in range(maxi(int(values[0]), 0), mini(int(values[0]) + int(values[2]), width)):
				if image.get_pixel(x, y).b <= image.get_pixel(x, y).r: # preserve the visible stream
					image.set_pixel(x, y, Color("314240"))
	for point: Dictionary in data.get("interactables", []):
		var tile_position: Array = point.get("position_tiles", [])
		if tile_position.size() >= 2:
			var x := int(tile_position[0])
			var y := int(tile_position[1])
			if x >= 0 and x < width and y >= 0 and y < height:
				image.set_pixel(x, y, Color("e7ca7b") if str(point.get("action_kind", "")) == "gate" else Color("e3a98b"))
	return ImageTexture.create_from_image(image)

func set_interaction_prompt(message: String) -> void:
	_last_prompt = message
	$InteractionHint/Message.text = message
	$InteractionHint.visible = not message.is_empty()

func update_position(
		point: Vector2,
		map_size_px: Vector2 = Vector2(640, 360),
		tile_size_px: int = 32,
		area_name: String = "") -> void:
	_last_position = point
	_last_map_size = map_size_px
	_last_tile_size = tile_size_px
	_last_area_name = area_name
	var map_view: TextureRect = $Minimap/Map
	var marker: ColorRect = $Minimap/Marker
	var travel := (map_view.size - marker.size).max(Vector2.ZERO)
	var normalized := Vector2(
		clampf(point.x / maxf(map_size_px.x, 1.0), 0.0, 1.0),
		clampf(point.y / maxf(map_size_px.y, 1.0), 0.0, 1.0)
	)
	marker.position = map_view.position + normalized * travel
	var coordinates := "(%d, %d)" % [
		int(point.x / maxi(tile_size_px, 1)), int(point.y / maxi(tile_size_px, 1))
	]
	$Minimap/Coordinates.text = coordinates
	$Minimap/Coordinates.tooltip_text = (tr("%s • %s") % [tr(area_name), coordinates]) if not area_name.is_empty() else coordinates

func set_health(hp: int) -> void:
	$Vitals/HP.value = clampi(hp, 0, 100)
	$Vitals/HPText.text = "%d / 100" % hp

func apply_profile(profile: Dictionary) -> void:
	_last_profile = profile.duplicate(true)
	var realm := str(profile.get("realm", "mortal"))
	$Vitals/Realm.text = tr("PHÀM NHÂN") if realm == "mortal" else tr("LUYỆN KHÍ • %d") % int(profile.get("realmStage", 1))
	set_health(int(profile.get("hp", 100)))
	if realm == "luyen_khi":
		var thresholds := [300, 600, 1000]
		var stage := clampi(int(profile.get("realmStage", 1)), 1, 4)
		var capacity := int(thresholds[stage - 1]) if stage < 4 else 1
		var xp := int(profile.get("cultivationXp", 0))
		$Vitals/Qi.max_value = capacity
		$Vitals/Qi.value = clampi(xp, 0, capacity)
		$Vitals/QiText.text = (tr("Tu vi • %d / %d XP") % [xp, capacity]) if stage < 4 else tr("Tu vi • đã đạt cảnh giới cao nhất")
	else:
		$Vitals/Qi.max_value = 100
		$Vitals/Qi.value = clampi(int(profile.get("cultivationXp", 0)), 0, 100)
		$Vitals/QiText.text = tr("Đột phá đầu tiên • %d / 100 XP") % int(profile.get("cultivationXp", 0))
	var equipped_skills: Dictionary = profile.get("equippedSkills", {"active_1": ""})
	equipped_skill_id = str(equipped_skills.get("active_1", ""))
	var skill_name := "Phi Nhận" if equipped_skill_id == "sk_phi_nhan" else "Kỹ năng"
	$Hotbar/Slot4.modulate = Color.WHITE if not equipped_skill_id.is_empty() else Color(0.6, 0.6, 0.6)
	$Hotbar/Slot4.tooltip_text = (tr("R: %s • dùng khi săn quái trên bản đồ.") % tr(skill_name)) if not equipped_skill_id.is_empty() else tr("R: trang bị Phi Nhận trong Nhân vật > Kỹ năng.")
	$Hotbar/Slot4.icon = phi_ren_icon if equipped_skill_id == "sk_phi_nhan" else null
	$Hotbar/Slot4.text = "" if equipped_skill_id == "sk_phi_nhan" else "—"
	touch_controls.set_equipped_skill(equipped_skill_id, skill_name)

func _on_language_changed(_locale: String) -> void:
	if not is_node_ready():
		return
	if not _last_weather_state.is_empty():
		set_weather(_last_weather_state)
	if not _last_map_data.is_empty():
		configure_map(_last_map_data)
	if not _last_profile.is_empty():
		apply_profile(_last_profile)
	if not _last_prompt.is_empty():
		set_interaction_prompt(_last_prompt)
	update_position(_last_position, _last_map_size, _last_tile_size, _last_area_name)
	if not _last_notification.is_empty() or not _last_notification_key.is_empty():
		_render_notification()
