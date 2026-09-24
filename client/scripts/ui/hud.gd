class_name PixelHUD
extends Control
signal action_requested(action: String)
var toast_time: float = 0.0

func _ready() -> void:
	$BagButton.pressed.connect(func() -> void: action_requested.emit("inventory"))
	$MapButton.pressed.connect(func() -> void: action_requested.emit("map"))
	$SparringButton.pressed.connect(func() -> void: action_requested.emit("dock"))
	$HelpButton.pressed.connect(func() -> void:
		notify("WASD: đi • M: tuyến map • I: túi • E: tương tác"))
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
	for index in [0, 1, 4]:
		var button: Button = get_node("Hotbar/Slot%d" % index)
		button.modulate = Color(0.6, 0.6, 0.6)
		button.tooltip_text = "Chưa có cơ chế sử dụng. Không trừ vật phẩm."
	$Hotbar/Slot2.tooltip_text = "Q / J: đánh trong đấu tập online"
	$Hotbar/Slot3.tooltip_text = "E / chạm: tương tác với điểm gần nhất"
	$Hotbar/Slot5.tooltip_text = "Space: né trong đấu tập online"

func _process(delta: float) -> void:
	$ModalShade.visible = $Inventory.visible or $Dock.visible
	if toast_time > 0:
		toast_time -= delta
		$Toast.visible = toast_time > 0

func notify(message: String) -> void:
	$Toast/Message.text = message
	$Toast/Message.clip_text = true
	$Toast.show()
	toast_time = 4.0

func configure_map(map_data: Dictionary) -> void:
	var preview_path := str(map_data.get("preview", ""))
	var texture: Texture2D = load(preview_path) if not preview_path.is_empty() else null
	$Minimap/Map.texture = texture
	$Location/Title.text = str(map_data.get("name", "Map")).to_upper()
	$Location/State.text = str(map_data.get("summary", ""))
	$Minimap/Coordinates.tooltip_text = str(map_data.get("name", "Map"))

func set_interaction_prompt(message: String) -> void:
	$InteractionHint/Message.text = message
	$InteractionHint.visible = not message.is_empty()

func update_position(
		point: Vector2,
		map_size_px: Vector2 = Vector2(640, 360),
		tile_size_px: int = 32,
		area_name: String = "") -> void:
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
	$Minimap/Coordinates.tooltip_text = "%s • %s" % [area_name, coordinates] if not area_name.is_empty() else coordinates

func set_health(hp: int) -> void:
	$Vitals/HP.value = clampi(hp, 0, 100)
	$Vitals/HPText.text = "%d / 100" % hp

func apply_profile(profile: Dictionary) -> void:
	var realm := str(profile.get("realm", "mortal"))
	$Vitals/Realm.text = "PHÀM NHÂN" if realm == "mortal" else "LUYỆN KHÍ • %d" % int(profile.get("realmStage", 1))
	# This version has no authoritative Qi field. Never invent a filled resource bar.
	$Vitals/Qi.value = 0
	$Vitals/QiText.text = "Linh lực • chưa có dữ liệu"
