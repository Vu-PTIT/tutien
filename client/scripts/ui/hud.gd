class_name PixelHUD
extends Control
signal action_requested(action: String)
var toast_time: float = 0.0

func _ready() -> void:
	$BagButton.pressed.connect(func() -> void: action_requested.emit("inventory"))
	$SparringButton.pressed.connect(func() -> void: action_requested.emit("dock"))
	$HelpButton.pressed.connect(func() -> void:
		notify("WASD: đi • I: túi • E: xem hiệu thuốc • Đấu tập: online"))
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
	$Hotbar/Slot3.tooltip_text = "E: tương tác ở An Khê"
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

func update_position(point: Vector2) -> void:
	$Minimap/Marker.position = Vector2(5, 5) + point / Vector2(640, 360) * Vector2(88, 47)
	$Minimap/Coordinates.text = "An Khê  (%d, %d)" % [int(point.x / 32), int(point.y / 32)]

func set_health(hp: int) -> void:
	$Vitals/HP.value = clampi(hp, 0, 100)
	$Vitals/HPText.text = "%d / 100" % hp

func apply_profile(profile: Dictionary) -> void:
	var realm := str(profile.get("realm", "mortal"))
	$Vitals/Realm.text = "PHÀM NHÂN" if realm == "mortal" else "LUYỆN KHÍ • %d" % int(profile.get("realmStage", 1))
	# This version has no authoritative Qi field. Never invent a filled resource bar.
	$Vitals/Qi.value = 0
	$Vitals/QiText.text = "Linh lực • chưa có dữ liệu"
