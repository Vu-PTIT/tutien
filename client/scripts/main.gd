extends Node2D

const Api = preload("res://scripts/combat_api.gd")
const Inventory = preload("res://scripts/inventory_panel.gd")

## First playable shell for the visual bible:
## 2D pixel top-down/3-4, An Khê as a warm hub, Trúc Âm as the combat field.
## The map art is procedural for now so the product can run without imported art.
const WORLD_RECT := Rect2(8, 48, 444, 276)
const SPEED: float = 180.0
const LOGICAL_WORLD := Vector2(960, 540)
const INK := Color("#33271f")
const PAPER := Color("#f5e1b8")
const MUTED := Color("#a98b68")

var player_position := Vector2(380, 350)
var status_label: Label
var combat_label: Label
var location_label: Label
var quest_label: Label
var room: LineEdit
var connect_button: Button
var create_button: Button
var join_button: Button
var ready_button: Button
var leave_button: Button
var inventory_button: Button
var inventory_panel: InventoryPanel
var api: CombatApi
var user_id: String = ""
var device_id: String = ""
var elapsed: float = 0.0
var pending_action: String = ""
var render_positions: Dictionary = {}
var snapshot_age: float = 0.0
var busy: bool = false
var toast_until: float = 0.0

func _panel_style(fill: Color, border: Color = Color("#73543a"), radius: int = 5) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(radius)
	style.content_margin_left = 7
	style.content_margin_right = 7
	style.content_margin_top = 3
	style.content_margin_bottom = 3
	return style

func _button(text: String, position: Vector2, size: Vector2, callback: Callable, accent: bool = false) -> Button:
	var button := Button.new()
	button.text = text
	button.position = position
	button.size = size
	button.add_theme_font_size_override("font_size", 10)
	button.add_theme_color_override("font_color", INK)
	button.add_theme_color_override("font_hover_color", Color("#fff4d2"))
	button.add_theme_stylebox_override("normal", _panel_style(Color("#e7c98b") if accent else Color("#e9d7ad")))
	button.add_theme_stylebox_override("hover", _panel_style(Color("#d9a84e"), Color("#fff0bd")))
	button.add_theme_stylebox_override("pressed", _panel_style(Color("#b9893c"), Color("#fff0bd")))
	button.add_theme_stylebox_override("disabled", _panel_style(Color("#82745e"), Color("#5e5548")))
	button.pressed.connect(callback)
	add_child(button)
	return button

func _label(text: String, position: Vector2, size: Vector2, font_size: int = 10, color: Color = PAPER) -> Label:
	var label := Label.new()
	label.text = text
	label.position = position
	label.size = size
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	label.add_theme_color_override("font_shadow_color", Color("#1a1714"))
	label.add_theme_constant_override("shadow_offset_x", 1)
	label.add_theme_constant_override("shadow_offset_y", 1)
	add_child(label)
	return label

func _ready() -> void:
	RenderingServer.set_default_clear_color(Color("#171f24"))
	api = Api.new()
	add_child(api)
	api.snapshot_received.connect(_snapshot)
	api.match_connection_lost.connect(func() -> void:
		_show_toast("Mất kết nối — hãy kết nối lại trong 10 giây.")
		_update_buttons())

	# Persistent HUD: HP/Qi, location, and the three most-used actions.
	_label("THANH KHÊ", Vector2(16, 7), Vector2(125, 15), 12, PAPER)
	location_label = _label("AN KHÊ  ·  BÌNH YÊN", Vector2(170, 8), Vector2(210, 14), 9, Color("#d9b46c"))
	_label("Luyện Khí · tầng 1", Vector2(16, 26), Vector2(125, 13), 8, MUTED)
	_label("HP", Vector2(150, 26), Vector2(18, 12), 8, Color("#ffb09b"))
	_label("QI", Vector2(150, 37), Vector2(18, 12), 8, Color("#94d9ed"))
	connect_button = _button("Kết nối", Vector2(536, 8), Vector2(92, 22), _connect_backend, true)
	inventory_panel = Inventory.new()
	inventory_panel.api = api
	add_child(inventory_panel)
	inventory_button = _button("Túi đồ", Vector2(536, 273), Vector2(92, 24), inventory_panel.open_inventory, true)
	_button("Nhân vật", Vector2(464, 273), Vector2(66, 24), func() -> void: _show_toast("Hồ sơ nhân vật sẽ mở ở mốc tu luyện tiếp theo."))

	# Right rail: current objective and compact minimap are readable at 640×360.
	quest_label = _label("NHIỆM VỤ\n\nViệc ở An Khê\nNói chuyện với Bà Sâm\n\n▸ Khảo sát trạm nước", Vector2(472, 60), Vector2(154, 112), 9, PAPER)
	_label("BẢN ĐỒ NHỎ", Vector2(472, 181), Vector2(120, 14), 8, Color("#d9b46c"))
	_label("An Khê  ·  Trúc Âm", Vector2(472, 258), Vector2(154, 13), 8, MUTED)
	_label("Vườn linh thảo", Vector2(472, 292), Vector2(154, 13), 8, Color("#b7d79d"))

	# Online sparring remains part of the product, but lives in a slim bottom dock.
	status_label = _label("Đang ở An Khê. WASD / phím mũi tên để đi.", Vector2(16, 326), Vector2(260, 12), 7, PAPER)
	combat_label = _label("Thu thập linh thảo, rồi chuẩn bị trước khi vào Trúc Âm.", Vector2(16, 340), Vector2(260, 11), 7, MUTED)
	create_button = _button("Tạo đấu tập", Vector2(284, 330), Vector2(70, 20), _create_match)
	room = LineEdit.new()
	room.placeholder_text = "Mã phòng"
	room.position = Vector2(358, 330)
	room.size = Vector2(110, 20)
	room.add_theme_font_size_override("font_size", 9)
	room.add_theme_stylebox_override("normal", _panel_style(Color("#f2e2bd"), Color("#73543a"), 4))
	add_child(room)
	join_button = _button("Vào", Vector2(472, 330), Vector2(34, 20), _join_match)
	ready_button = _button("Sẵn sàng", Vector2(510, 330), Vector2(60, 20), _ready_match)
	leave_button = _button("Rời", Vector2(574, 330), Vector2(42, 20), _leave_match)

	var identity_path := "user://identity.cfg"
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with("--guest="):
			identity_path = "user://identity_" + argument.sha256_text().left(12) + ".cfg"
	var config := ConfigFile.new()
	config.load(identity_path)
	device_id = str(config.get_value("auth", "device_id", ""))
	if device_id.is_empty():
		device_id = Crypto.new().generate_random_bytes(24).hex_encode()
		config.set_value("auth", "device_id", device_id)
		config.save(identity_path)
	_update_buttons()
	queue_redraw()

func _connected() -> bool:
	return api._socket != null and api._socket.get_ready_state() == WebSocketPeer.STATE_OPEN

func _update_buttons() -> void:
	var in_match := not api.match_id.is_empty()
	inventory_button.disabled = busy or api.token.is_empty() or in_match
	connect_button.disabled = busy or _connected()
	connect_button.text = "Đã kết nối" if _connected() else "Kết nối"
	create_button.disabled = busy or not _connected() or in_match
	join_button.disabled = create_button.disabled
	ready_button.disabled = busy or not _connected() or not in_match or api.snapshot.get("phase", "") != "waiting"
	leave_button.disabled = busy or not in_match

func _unhandled_input(event: InputEvent) -> void:
	if inventory_panel.visible or room.has_focus() or api.snapshot.get("phase", "") != "active":
		return
	if event is InputEventKey and event.pressed and not event.echo:
		if event.physical_keycode == KEY_SPACE: pending_action = "sk_dodge"
		elif event.physical_keycode == KEY_J: pending_action = "sk_basic"
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		pending_action = "sk_basic"

func _process(delta: float) -> void:
	if api == null: return
	var direction := Vector2.ZERO
	if not room.has_focus() and not inventory_panel.visible:
		direction = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
		if Input.is_physical_key_pressed(KEY_A): direction.x -= 1
		if Input.is_physical_key_pressed(KEY_D): direction.x += 1
		if Input.is_physical_key_pressed(KEY_W): direction.y -= 1
		if Input.is_physical_key_pressed(KEY_S): direction.y += 1
	direction = direction.limit_length()
	if api.match_id.is_empty():
		player_position = (player_position + direction * SPEED * delta).clamp(Vector2(40, 110), Vector2(920, 440))
	else:
		snapshot_age += delta
		for p: Dictionary in api.snapshot.get("players", []):
			var target := Vector2(float(p.x), float(p.y))
			var current: Vector2 = render_positions.get(p.id, target)
			render_positions[p.id] = current.lerp(target, minf(1.0, delta * 20.0))
			if p.id == user_id: player_position = target
		elapsed += delta
		if elapsed >= 0.05:
			elapsed = 0.0
			var aim := (get_global_mouse_position() - _world_to_screen(player_position)).normalized()
			api.send_input(direction, aim, pending_action)
			pending_action = ""
		if snapshot_age > 2.0:
			status_label.text = "Đang chờ cập nhật từ server…"
	if toast_until > 0.0:
		toast_until -= delta
	queue_redraw()

func _world_to_screen(value: Vector2) -> Vector2:
	return Vector2(WORLD_RECT.position.x + value.x / LOGICAL_WORLD.x * WORLD_RECT.size.x, WORLD_RECT.position.y + value.y / LOGICAL_WORLD.y * WORLD_RECT.size.y)

func _draw_player(at: Vector2, color: Color, hp: int, facing: Vector2, mode: String) -> void:
	# Chunky sprite proxy; real sprite sheets can replace this without changing the UI/API.
	draw_rect(Rect2(at + Vector2(-8, 9), Vector2(16, 7)), Color("#19312d"))
	draw_rect(Rect2(at + Vector2(-7, -3), Vector2(14, 17)), color)
	draw_rect(Rect2(at + Vector2(-7, -3), Vector2(14, 4)), Color("#3c2d27"))
	draw_rect(Rect2(at + Vector2(-5, -12), Vector2(10, 9)), Color("#ead3ae"))
	draw_rect(Rect2(at + Vector2(-10, -19), Vector2(20, 5)), Color("#c58a4e"))
	draw_rect(Rect2(at + Vector2(-13, -15), Vector2(26, 3)), Color("#c58a4e"))
	draw_rect(Rect2(at + Vector2(-19, -27), Vector2(38, 3)), Color("#512c30"))
	draw_rect(Rect2(at + Vector2(-19, -27), Vector2(38.0 * clampf(float(hp) / 100.0, 0.0, 1.0), 3)), Color("#8cda8b"))
	draw_line(at, at + facing.normalized() * 18, Color("#fff0bb"), 2)
	if mode in ["windup", "active"]:
		var angle := facing.angle()
		draw_arc(at, 28, angle - PI / 3, angle + PI / 3, 12, Color("#ffdc7d") if mode == "active" else Color("#b28a4b"), 2)
	if mode == "dodging": draw_arc(at, 15, 0, TAU, 16, Color("#86e4ff"), 2)

func _draw_tree(at: Vector2) -> void:
	draw_rect(Rect2(at + Vector2(-2, 5), Vector2(5, 12)), Color("#714b36"))
	draw_rect(Rect2(at + Vector2(-9, -5), Vector2(18, 14)), Color("#376b4a"))
	draw_rect(Rect2(at + Vector2(-6, -11), Vector2(12, 8)), Color("#4e8650"))
	draw_rect(Rect2(at + Vector2(-6, -4), Vector2(4, 4)), Color("#6fa15d"))

func _draw() -> void:
	# Wood frame and paper-like UI surfaces.
	draw_rect(Rect2(0, 0, 640, 360), Color("#171f24"))
	draw_rect(Rect2(0, 0, 640, 48), Color("#263d39"))
	draw_line(Vector2(0, 47), Vector2(640, 47), Color("#8a6847"), 1)
	draw_rect(WORLD_RECT, Color("#23483d"))
	for x in range(8, 452, 16):
		for y in range(48, 324, 16):
			var checker := int((x / 16) + (y / 16))
			draw_rect(Rect2(x, y, 15, 15), Color("#2d5944") if checker % 2 == 0 else Color("#2a523f"))
	# River, path, house, garden, trees, lantern, and elder NPC.
	draw_rect(Rect2(42, 48, 28, 276), Color("#35778a"))
	for y in range(58, 320, 24): draw_line(Vector2(47, y), Vector2(64, y + 6), Color("#70acaa"), 2)
	draw_rect(Rect2(70, 224, 382, 30), Color("#9b815e"))
	for x in range(80, 448, 28): draw_rect(Rect2(x, 234, 19, 4), Color("#c0a478"))
	draw_rect(Rect2(105, 84, 94, 66), Color("#9a6043"))
	draw_colored_polygon(PackedVector2Array([Vector2(96, 84), Vector2(152, 58), Vector2(208, 84)]), Color("#5a3540"))
	draw_rect(Rect2(143, 111, 19, 39), Color("#4c352b"))
	draw_rect(Rect2(116, 103, 17, 16), Color("#c4dfc1"))
	for x in range(240, 334, 18):
		draw_rect(Rect2(x, 116, 12, 7), Color("#7aaf61"))
		draw_rect(Rect2(x, 128, 12, 7), Color("#d5b759"))
	for at in [Vector2(92, 72), Vector2(222, 74), Vector2(398, 92), Vector2(416, 184), Vector2(356, 294)]: _draw_tree(at)
	draw_rect(Rect2(300, 188, 4, 28), Color("#693f30"))
	draw_circle(Vector2(302, 184), 6, Color("#f3c968"))
	draw_rect(Rect2(282, 210, 14, 20), Color("#b87e54"))
	draw_circle(Vector2(289, 204), 8, Color("#e6c293"))
	# Right-side panels and minimap.
	draw_rect(Rect2(460, 48, 172, 276), Color("#30453f"))
	draw_rect(Rect2(468, 56, 156, 118), Color("#3c554a"))
	draw_rect(Rect2(468, 178, 156, 70), Color("#263b38"))
	draw_rect(Rect2(476, 187, 138, 54), Color("#5e775d"))
	draw_rect(Rect2(490, 196, 62, 35), Color("#42718a"))
	draw_rect(Rect2(552, 188, 46, 44), Color("#9b815e"))
	draw_circle(Vector2(515, 213), 4, Color("#f2d479"))
	draw_circle(Vector2(581, 207), 4, Color("#df9176"))
	# HUD bars and bottom dock.
	draw_rect(Rect2(172, 27, 74, 6), Color("#512c30"))
	draw_rect(Rect2(172, 27, 67, 6), Color("#8cda8b"))
	draw_rect(Rect2(172, 38, 74, 6), Color("#254b62"))
	draw_rect(Rect2(172, 38, 53, 6), Color("#86cfe4"))
	draw_rect(Rect2(8, 324, 624, 34), Color("#263d39"))
	# Player or server-authoritative fighters.
	if api == null or api.match_id.is_empty():
		_draw_player(_world_to_screen(player_position), Color("#70b9ba"), 100, Vector2.RIGHT, "idle")
	else:
		var wall: Dictionary = api.snapshot.get("rules", {}).get("wall", {"x": 462, "y": 200, "w": 36, "h": 100})
		var wall_pos := _world_to_screen(Vector2(float(wall.x), float(wall.y)))
		var wall_size := Vector2(float(wall.w) / LOGICAL_WORLD.x * WORLD_RECT.size.x, float(wall.h) / LOGICAL_WORLD.y * WORLD_RECT.size.y)
		draw_rect(Rect2(wall_pos, wall_size), Color("#7b8179"))
		for p: Dictionary in api.snapshot.get("players", []):
			_draw_player(_world_to_screen(render_positions.get(p.id, Vector2(p.x, p.y))), Color("#70b9ba") if p.id == user_id else Color("#df9176"), int(p.hp), Vector2(p.faceX, p.faceY), str(p.mode))
	if toast_until > 0.0:
		draw_rect(Rect2(180, 292, 280, 22), Color("#432f28"))
		draw_string(ThemeDB.fallback_font, Vector2(190, 307), status_label.text, HORIZONTAL_ALIGNMENT_LEFT, 260, 9, PAPER)

func _show_toast(message: String) -> void:
	status_label.text = message
	toast_until = 3.5

func _snapshot(value: Dictionary) -> void:
	snapshot_age = 0.0
	var phase := str(value.phase)
	if phase == "waiting": _show_toast("Chờ đủ hai người — cả hai bấm Sẵn sàng.")
	elif phase == "countdown": _show_toast("Bắt đầu sau %d…" % maxi(1, ceili((60.0 - (float(value.tick) - float(value.phaseAt))) / 20.0)))
	elif phase == "active":
		location_label.text = "TRÚC ÂM  ·  ĐẤU TẬP"
		quest_label.text = "ĐẤU TẬP\n\nWASD  Di chuyển\nJ / chuột  Đánh\nSpace  Né\n\nKhông mất đồ"
		_show_toast("Đấu tập đang diễn ra — HP do server quyết định.")
	elif phase == "finished":
		var outcome := "Hòa" if str(value.winner).is_empty() else ("Bạn thắng" if value.winner == user_id else "Bạn thua")
		_show_toast(outcome + " · " + str(value.reason) + " · Rời trận để tạo trận mới")
	var hp_text: Array[String] = []
	for p: Dictionary in value.get("players", []):
		hp_text.append(("Bạn" if p.id == user_id else "Đối thủ") + ": %d HP" % int(p.hp) + ("" if p.connected else " (mất kết nối)"))
	combat_label.text = "  |  ".join(hp_text) + "  ·  Đấu tập không ảnh hưởng tài sản"
	_update_buttons()

func _connect_backend() -> void:
	busy = true
	_update_buttons()
	_show_toast("Đang kết nối tới Thanh Khê…")
	var result := await api.login_device(device_id)
	if not result.has("error"):
		result = await api.get_account()
		if not result.has("error"):
			user_id = str(result.user.id)
			result = await api.call_rpc("get_profile")
	if not result.has("error"): result = await api.connect_chat()
	if not result.has("error") and not api.match_id.is_empty(): result = await api.join_sparring(api.match_id)
	_show_toast(str(result.error) if result.has("error") else "Đã kết nối. Có thể mở túi đồ hoặc tạo đấu tập.")
	busy = false
	_update_buttons()

func _create_match() -> void:
	busy = true
	_update_buttons()
	var result := await api.create_sparring()
	if result.has("error"): _show_toast(str(result.error))
	else:
		room.text = api.match_id
		_show_toast("Đã tạo phòng. Gửi mã cho người chơi thứ hai.")
	busy = false
	_update_buttons()

func _join_match() -> void:
	if room.text.strip_edges().is_empty():
		_show_toast("Nhập mã phòng trước.")
		return
	busy = true
	_update_buttons()
	var result := await api.join_sparring(room.text.strip_edges())
	if result.has("error"): _show_toast(str(result.error))
	room.release_focus()
	busy = false
	_update_buttons()

func _ready_match() -> void:
	pending_action = "ready"
	room.release_focus()

func _leave_match() -> void:
	busy = true
	_update_buttons()
	await api.leave_sparring()
	render_positions.clear()
	pending_action = ""
	location_label.text = "AN KHÊ  ·  BÌNH YÊN"
	quest_label.text = "NHIỆM VỤ\n\nViệc ở An Khê\nNói chuyện với Bà Sâm\n\n▸ Khảo sát trạm nước"
	_show_toast("Đã rời đấu tập. Trở về An Khê.")
	busy = false
	_update_buttons()
