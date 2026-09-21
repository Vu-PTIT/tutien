extends Node2D

const Api = preload("res://scripts/combat_api.gd")
const Inventory = preload("res://scripts/inventory_panel.gd")
const SPEED: float = 180.0
var player_position := Vector2(380, 350)
var status_label: Label
var combat_label: Label
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

func _button(text: String, x: float, y: float, callback: Callable) -> Button:
	var button := Button.new()
	button.text = text
	button.position = Vector2(x, y)
	button.pressed.connect(callback)
	add_child(button)
	return button

func _ready() -> void:
	RenderingServer.set_default_clear_color(Color("142a29"))
	api = Api.new()
	add_child(api)
	api.snapshot_received.connect(_snapshot)
	api.match_connection_lost.connect(func() -> void:
		status_label.text = "Mất kết nối. Bấm Kết nối lại trong 10 giây để trở lại trận."
		_update_buttons())
	var title := Label.new()
	title.text = "TU TIÊN | Đấu tập\nWASD / mũi tên: đi · J / chuột trái: đánh · Space: né theo hướng chuột"
	title.position = Vector2(24, 8)
	add_child(title)
	connect_button = _button("Kết nối", 800, 12, _connect_backend)
	inventory_panel = Inventory.new()
	inventory_panel.api = api
	add_child(inventory_panel)
	inventory_button = _button("Túi đồ", 700, 12, inventory_panel.open_inventory)
	create_button = _button("Tạo đấu tập", 24, 60, _create_match)
	room = LineEdit.new()
	room.placeholder_text = "Mã phòng — sao chép gửi người thứ hai"
	room.position = Vector2(150, 60)
	room.size = Vector2(460, 32)
	add_child(room)
	join_button = _button("Vào phòng", 622, 60, _join_match)
	ready_button = _button("Sẵn sàng", 737, 60, _ready_match)
	leave_button = _button("Rời trận", 847, 60, _leave_match)
	status_label = Label.new()
	status_label.position = Vector2(24, 468)
	status_label.text = "Đang thử di chuyển offline. Kết nối backend để đấu tập."
	add_child(status_label)
	combat_label = Label.new()
	combat_label.position = Vector2(24, 496)
	combat_label.text = "Hai người cùng đồng ý và sẵn sàng · Không mất đồ, không thưởng tiền"
	add_child(combat_label)
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
			var aim := (get_global_mouse_position() - player_position).normalized()
			api.send_input(direction, aim, pending_action)
			pending_action = ""
		if snapshot_age > 2.0:
			status_label.text = "Đang chờ cập nhật từ server…"
	queue_redraw()

func _draw_player(at: Vector2, color: Color, hp: int, facing: Vector2, mode: String) -> void:
	draw_circle(at + Vector2(0, 13), 14, Color("102c28"))
	draw_rect(Rect2(at - Vector2(9, 4), Vector2(18, 24)), color)
	draw_circle(at - Vector2(0, 7), 9, Color("ead3ae"))
	draw_rect(Rect2(at + Vector2(-20, -28), Vector2(40, 4)), Color("512c30"))
	draw_rect(Rect2(at + Vector2(-20, -28), Vector2(40.0 * hp / 100.0, 4)), Color("8cda8b"))
	draw_line(at, at + facing * 22, Color("fff0bb"), 2)
	if mode in ["windup", "active"]:
		var angle := facing.angle()
		draw_arc(at, 42, angle - PI / 3, angle + PI / 3, 20, Color("ffdc7d") if mode == "active" else Color("b28a4b"), 3)
	if mode == "dodging": draw_arc(at, 18, 0, TAU, 24, Color("86e4ff"), 2)

func _draw() -> void:
	for x in range(24, 960, 32):
		for y in range(104, 460, 32):
			draw_rect(Rect2(x, y, 30, 30), Color("23453c"))
	if api == null or api.match_id.is_empty():
		_draw_player(player_position, Color("70b9ba"), 100, Vector2.RIGHT, "idle")
		return
	var wall: Dictionary = api.snapshot.get("rules", {}).get("wall", {"x": 462, "y": 200, "w": 36, "h": 100})
	draw_rect(Rect2(float(wall.x), float(wall.y), float(wall.w), float(wall.h)), Color("7b8179"))
	for p: Dictionary in api.snapshot.get("players", []):
		_draw_player(render_positions.get(p.id, Vector2(p.x, p.y)), Color("70b9ba") if p.id == user_id else Color("df9176"), int(p.hp), Vector2(p.faceX, p.faceY), str(p.mode))

func _snapshot(value: Dictionary) -> void:
	snapshot_age = 0.0
	var phase := str(value.phase)
	if phase == "waiting": status_label.text = "Chờ đủ hai người. Cả hai bấm Sẵn sàng để bắt đầu."
	elif phase == "countdown": status_label.text = "Bắt đầu sau %d…" % maxi(1, ceili((60.0 - (float(value.tick) - float(value.phaseAt))) / 20.0))
	elif phase == "active": status_label.text = "Đang đấu tập — HP và vị trí do server quyết định"
	elif phase == "finished":
		var outcome := "Hòa" if str(value.winner).is_empty() else ("Bạn thắng" if value.winner == user_id else "Bạn thua")
		status_label.text = outcome + " · " + str(value.reason) + " · Rời trận để tạo trận mới"
	var hp_text: Array[String] = []
	for p: Dictionary in value.get("players", []):
		hp_text.append(("Bạn" if p.id == user_id else "Đối thủ") + ": %d HP" % int(p.hp) + ("" if p.connected else " (mất kết nối)"))
	combat_label.text = " | ".join(hp_text) + " · Không mất đồ, không thưởng tiền"
	_update_buttons()

func _connect_backend() -> void:
	busy = true
	_update_buttons()
	status_label.text = "Đang kết nối…"
	var result := await api.login_device(device_id)
	if not result.has("error"):
		result = await api.get_account()
		if not result.has("error"):
			user_id = str(result.user.id)
			result = await api.call_rpc("get_profile")
	if not result.has("error"): result = await api.connect_chat()
	if not result.has("error") and not api.match_id.is_empty(): result = await api.join_sparring(api.match_id)
	status_label.text = str(result.error) if result.has("error") else "Đã kết nối. Tạo đấu tập hoặc nhập mã phòng."
	busy = false
	_update_buttons()

func _create_match() -> void:
	busy = true
	_update_buttons()
	var result := await api.create_sparring()
	if result.has("error"): status_label.text = str(result.error)
	else: room.text = api.match_id
	busy = false
	_update_buttons()

func _join_match() -> void:
	if room.text.strip_edges().is_empty():
		status_label.text = "Nhập mã phòng trước."
		return
	busy = true
	_update_buttons()
	var result := await api.join_sparring(room.text.strip_edges())
	if result.has("error"): status_label.text = str(result.error)
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
	status_label.text = "Đã rời trận. Có thể tạo phòng mới."
	busy = false
	_update_buttons()
