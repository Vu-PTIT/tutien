extends Node2D
## No @tool runtime simulation: all visual nodes are serialized in .tscn.
const Api = preload("res://scripts/combat_api.gd")
const Actor = preload("res://scenes/player.tscn")
const ARENA_SCALE := 2.0 / 3.0
const WALK_SPEED := 72.0
# Conservative walkable courtyard for the illustrated An Khê background.
const WALK_AREAS := [
	Rect2(226, 112, 134, 116), Rect2(186, 145, 226, 82),
	Rect2(95, 125, 143, 25), Rect2(259, 212, 80, 88),
	Rect2(351, 105, 79, 46)
]

@onready var hud: PixelHUD = $Presentation/HUD
@onready var inventory_panel: InventoryPanel = $Presentation/HUD/Inventory
@onready var player: PixelActor = $AnKhe/Player
@onready var dock: Panel = $Presentation/HUD/Dock
@onready var room: LineEdit = $Presentation/HUD/Dock/Room
var api: CombatApi
var user_id: String = ""
var device_id: String = ""
var busy: bool = false
var send_clock: float = 0.0
var snapshot_age: float = 0.0
var pending_action: String = ""
var last_phase: String = ""
var fighters: Dictionary = {}
var offline_position := Vector2(320, 232)

func _ready() -> void:
	get_window().min_size = Vector2i(640, 360)
	api = Api.new()
	add_child(api)
	inventory_panel.api = api
	api.snapshot_received.connect(_snapshot)
	api.match_connection_lost.connect(_connection_lost)
	hud.action_requested.connect(_action)
	$Arena.hide()
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

func _action(action: String) -> void:
	match action:
		"inventory":
			if not api.match_id.is_empty():
				hud.notify("Túi đồ bị khóa trong đấu tập.")
			elif inventory_panel.visible:
				inventory_panel.hide()
			else:
				dock.hide()
				inventory_panel.open_inventory()
		"dock":
			inventory_panel.hide()
			dock.visible = not dock.visible
		"connect":
			_connect_backend()
		"create":
			_create_match()
		"join":
			_join_match()
		"ready":
			api.send_input(Vector2.ZERO, Vector2.RIGHT, "ready")
			room.release_focus()
		"leave":
			_leave_match()
		"attack", "dodge":
			if inventory_panel.visible or dock.visible:
				return
			if api.snapshot.get("phase", "") == "active":
				pending_action = "sk_basic" if action == "attack" else "sk_dodge"
			else:
				hud.notify("Chiến đấu chỉ hoạt động trong phòng đấu tập online.")
		"interact":
			if not api.match_id.is_empty():
				return
			if player.position.distance_to(Vector2(166, 139)) < 52:
				hud.notify("Bà Sâm: Dòng nước đang yếu dần… [hội thoại mẫu]")
				hud.get_node("Quest/Body").text = "Đã xem lời nhắn Bà Sâm.\nNhiệm vụ chưa được lưu."
			else:
				hud.notify("Đến cửa hiệu thuốc Bà Sâm ở bên trái, rồi nhấn E.")
		_:
			hud.notify("Chức năng chưa mở. Không tiêu hao vật phẩm.")

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if not inventory_panel.visible and not dock.visible:
			_action("attack")
		return
	if not event is InputEventKey or not event.pressed or event.echo:
		return
	if event.physical_keycode == KEY_ESCAPE:
		inventory_panel.hide()
		dock.hide()
		get_viewport().set_input_as_handled()
		return
	if room.has_focus():
		return
	if event.physical_keycode == KEY_I:
		_action("inventory")
	elif not inventory_panel.visible and not dock.visible:
		match event.physical_keycode:
			KEY_E: _action("interact")
			KEY_J, KEY_Q: _action("attack")
			KEY_SPACE: _action("dodge")
			KEY_1, KEY_2, KEY_R: _action("locked")

func _movement() -> Vector2:
	if inventory_panel.visible or dock.visible:
		return Vector2.ZERO
	return Vector2(
		float(Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT)) -
		float(Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT)),
		float(Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN)) -
		float(Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP))
	).limit_length()

func can_walk(at: Vector2) -> bool:
	for area: Rect2 in WALK_AREAS:
		if area.has_point(at):
			return true
	return false

func _process(delta: float) -> void:
	if api == null:
		return
	var direction := _movement()
	if api.match_id.is_empty():
		var old_position := offline_position
		var step := direction * WALK_SPEED * minf(delta, 0.05)
		if can_walk(offline_position + Vector2(step.x, 0)):
			offline_position.x += step.x
		if can_walk(offline_position + Vector2(0, step.y)):
			offline_position.y += step.y
		player.position = offline_position.round()
		player.present(offline_position - old_position, delta)
		hud.update_position(player.position)
	else:
		snapshot_age += delta
		_present_fighters(delta)
		send_clock += delta
		if send_clock >= 0.05:
			send_clock = 0.0
			var origin := _local_server_position()
			var aim := (get_global_mouse_position() / ARENA_SCALE - origin).normalized()
			api.send_input(direction, aim, pending_action)
			pending_action = ""
		if snapshot_age > 2.0:
			hud.get_node("Mode").text = "ĐANG CHỜ SERVER • chưa xác nhận"
	queue_redraw()

func _local_server_position() -> Vector2:
	for p: Dictionary in api.snapshot.get("players", []):
		if p.id == user_id:
			return Vector2(float(p.x), float(p.y))
	return Vector2(380, 350)

func _present_fighters(delta: float) -> void:
	for p: Dictionary in api.snapshot.get("players", []):
		var id := str(p.id)
		if not fighters.has(id):
			var actor := Actor.instantiate() as PixelActor
			$Arena.add_child(actor)
			actor.position = Vector2(float(p.x), float(p.y)) * ARENA_SCALE
			if id != user_id:
				actor.modulate = Color(1.0, 0.76, 0.66)
			fighters[id] = actor
		var actor: PixelActor = fighters[id]
		var target := Vector2(float(p.x), float(p.y)) * ARENA_SCALE
		var movement := target - actor.position
		actor.position = actor.position.lerp(target, minf(1.0, delta * 20.0))
		actor.present(movement, delta)

func _draw() -> void:
	if api == null or api.match_id.is_empty():
		return
	# The arena is deliberately separate from the illustrated village:
	# only server-defined walls block combat, not the village scenery.
	draw_rect(Rect2(0, 0, 640, 360), Color("202c30"))
	for x in range(0, 641, 32):
		draw_line(Vector2(x, 0), Vector2(x, 360), Color("2d3b3b"))
	for y in range(0, 361, 32):
		draw_line(Vector2(0, y), Vector2(640, y), Color("2d3b3b"))
	var wall: Dictionary = api.snapshot.get("rules", {}).get("wall", {"x": 462, "y": 200, "w": 36, "h": 100})
	draw_rect(Rect2(Vector2(float(wall.x), float(wall.y)) * ARENA_SCALE,
		Vector2(float(wall.w), float(wall.h)) * ARENA_SCALE), Color("778078"))
	for p: Dictionary in api.snapshot.get("players", []):
		var pos := Vector2(float(p.x), float(p.y)) * ARENA_SCALE
		var facing := Vector2(float(p.faceX), float(p.faceY))
		if p.mode in ["windup", "active"]:
			draw_arc(pos, 42 * ARENA_SCALE, facing.angle() - PI / 3,
				facing.angle() + PI / 3, 16, Color("f6d38a"), 2)
		draw_rect(Rect2(pos + Vector2(-14, -49), Vector2(28, 3)), Color("431f2b"))
		draw_rect(Rect2(pos + Vector2(-14, -49), Vector2(28 * float(p.hp) / 100, 3)), Color("8ab974"))

func _connected() -> bool:
	return api._socket != null and api._socket.get_ready_state() == WebSocketPeer.STATE_OPEN

func _update_buttons() -> void:
	var in_match := not api.match_id.is_empty()
	dock.get_node("Connect").disabled = busy or _connected()
	dock.get_node("Create").disabled = busy or not _connected() or in_match
	dock.get_node("Join").disabled = dock.get_node("Create").disabled
	dock.get_node("Ready").disabled = busy or not _connected() or not in_match or api.snapshot.get("phase", "") != "waiting"
	dock.get_node("Leave").disabled = busy or not in_match
	hud.get_node("BagButton").disabled = busy or in_match

func _message(message: String) -> void:
	dock.get_node("Status").text = message
	hud.notify(message)

func _connection_lost() -> void:
	pending_action = ""
	hud.get_node("Mode").text = "MẤT KẾT NỐI"
	_message("Mất kết nối. Mở Đấu tập và kết nối lại trong 10 giây.")
	_update_buttons()

func _snapshot(value: Dictionary) -> void:
	snapshot_age = 0.0
	var phase := str(value.phase)
	$AnKhe.hide()
	$Arena.show()
	hud.get_node("Location/Title").text = "VÕ ĐÀI"
	hud.get_node("Location/State").text = "Đấu tập • không mất đồ"
	hud.get_node("Minimap").hide()
	hud.get_node("Quest/Title").text = "ĐẤU TẬP"
	hud.get_node("Quest/Body").text = "Q / J: đánh • Space: né\nHP và vị trí từ server."
	hud.get_node("Mode").text = "ONLINE • SERVER XÁC NHẬN"
	for p: Dictionary in value.get("players", []):
		if p.id == user_id:
			hud.set_health(int(p.hp))
	if phase != last_phase:
		last_phase = phase
		match phase:
			"waiting":
				dock.show()
				_message("Chờ đủ hai người. Cả hai bấm Sẵn sàng.")
			"countdown":
				room.release_focus()
				dock.hide()
				_message("Chuẩn bị đấu tập…")
			"active":
				dock.hide()
				_message("Trận đấu bắt đầu.")
			"finished":
				dock.show()
				var winner := str(value.get("winner", ""))
				_message(("Hòa" if winner.is_empty() else ("Bạn thắng" if winner == user_id else "Bạn thua")) + " • Rời trận để trở về làng.")
	_update_buttons()

func _connect_backend() -> void:
	if busy:
		return
	busy = true
	_update_buttons()
	_message("Đang kết nối backend…")
	var result: Dictionary = await api.login_device(device_id)
	if not result.has("error"):
		result = await api.get_account()
		if not result.has("error"):
			user_id = str(result.user.id)
			result = await api.call_rpc("get_profile")
			if not result.has("error"):
				hud.apply_profile(result)
	if not result.has("error"):
		result = await api.connect_chat()
	if not result.has("error") and not api.match_id.is_empty():
		result = await api.join_sparring(api.match_id)
	if result.has("error"):
		_message("Kết nối thất bại: " + str(result.error))
	else:
		hud.get_node("Mode").text = "ĐÃ KẾT NỐI • đi làng vẫn là bản thử"
		_message("Đã kết nối. Túi đồ dùng dữ liệu tài khoản.")
	busy = false
	_update_buttons()

func _create_match() -> void:
	if busy:
		return
	busy = true
	_update_buttons()
	var result: Dictionary = await api.create_sparring()
	if result.has("error"):
		_message(str(result.error))
	else:
		room.text = api.match_id
	busy = false
	_update_buttons()

func _join_match() -> void:
	if busy or room.text.strip_edges().is_empty():
		return
	busy = true
	_update_buttons()
	var result: Dictionary = await api.join_sparring(room.text.strip_edges())
	if result.has("error"):
		_message(str(result.error))
	room.release_focus()
	busy = false
	_update_buttons()

func _leave_match() -> void:
	if busy:
		return
	busy = true
	_update_buttons()
	await api.leave_sparring()
	for actor: Node2D in fighters.values():
		actor.queue_free()
	fighters.clear()
	pending_action = ""
	last_phase = ""
	$Arena.hide()
	$AnKhe.show()
	hud.set_health(100)
	hud.get_node("Minimap").show()
	hud.get_node("Location/Title").text = "AN KHÊ"
	hud.get_node("Location/State").text = "Làng khởi đầu • an toàn"
	hud.get_node("Quest/Title").text = "VIỆC Ở AN KHÊ"
	hud.get_node("Quest/Body").text = "Ghé hiệu thuốc Bà Sâm.\n[E] Xem lời nhắn tại cửa."
	hud.get_node("Mode").text = "ĐÃ KẾT NỐI • đi làng vẫn là bản thử" if _connected() else "BẢN XEM THỬ • OFFLINE"
	_message("Đã rời trận. Trở về An Khê.")
	busy = false
	_update_buttons()
