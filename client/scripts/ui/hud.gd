class_name PixelHUD
extends Control
signal action_requested(action: String)

var toast_time: float = 0.0
var touch_layout: bool = false
var _last_profile: Dictionary = {}
var _last_notification := ""
var _last_notification_key := ""
var _last_notification_args: Array = []
var language_manager: Variant

@onready var character_panel: CharacterPanel = $CharacterPanel
@onready var social_panel: SocialPanel = $SocialPanel

func _ready() -> void:
	language_manager = get_node_or_null("/root/LanguageManager")
	if language_manager != null:
		language_manager.locale_changed.connect(_on_language_changed)
	$BagButton.pressed.connect(func() -> void: action_requested.emit("inventory"))
	$CharacterButton.pressed.connect(func() -> void: action_requested.emit("character"))
	$SocialButton.pressed.connect(func() -> void: action_requested.emit("social"))
	$SparringButton.text = "Online"
	$SparringButton.tooltip_text = "Tài khoản, kết nối và đấu tập trực tuyến"
	$SparringButton.pressed.connect(func() -> void: action_requested.emit("dock"))
	$HelpButton.pressed.connect(func() -> void:
		notify("Chạm nút Đánh hoặc Né khi đang đấu." if touch_layout else "Q / J: đánh • Space: né • C: hồ sơ • G: cộng đồng • I: túi đồ")
	)
	for index in range(4):
		var action_id: String = ["item_heal", "item_herb", "attack", "dodge"][index]
		var button: Button = get_node("Hotbar/Slot%d" % index)
		button.pressed.connect(func() -> void: action_requested.emit(action_id))
	$Dock/Close.pressed.connect(func() -> void: $Dock.hide())
	for entry in ["Connect", "Create", "Join", "Ready", "Leave"]:
		var action_id: String = entry.to_lower()
		get_node("Dock/" + entry).pressed.connect(
			func() -> void: action_requested.emit(action_id))
	$Toast.hide()
	for index in [0, 1]:
		var button: Button = get_node("Hotbar/Slot%d" % index)
		button.disabled = true
		button.modulate = Color(0.6, 0.6, 0.6)
		button.tooltip_text = "Chọn Hồi Nguyên Hoàn trong Túi đồ để hồi tối đa 40 HP." if index == 0 else "Ô vật phẩm thứ hai chưa được gán."
	$Hotbar/Slot2.tooltip_text = "Q / J / chuột trái: đánh trong trận"
	$Hotbar/Slot3.tooltip_text = "Space: né trong trận đấu online"

func _process(delta: float) -> void:
	$ModalShade.visible = $Inventory.visible or $Dock.visible or character_panel.visible or social_panel.visible
	if toast_time > 0:
		toast_time -= delta
		$Toast.visible = toast_time > 0

func set_touch_layout(enabled: bool) -> void:
	touch_layout = enabled
	social_panel.set_touch_layout(enabled)
	$Hotbar.visible = true
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

func _on_language_changed(_locale: String) -> void:
	if not is_node_ready():
		return
	if not _last_profile.is_empty():
		apply_profile(_last_profile)
	if not _last_notification.is_empty() or not _last_notification_key.is_empty():
		_render_notification()
