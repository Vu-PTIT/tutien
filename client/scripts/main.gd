extends Node2D
## Minimal client shell for account, social, inventory, and online combat.
const Api = preload("res://scripts/combat_api.gd")
const Actor = preload("res://scenes/player.tscn")
const InputScript = preload("res://scripts/game_input.gd")
const SON_TRU_SPRITE: Texture2D = preload("res://assets/pixel/enemies/son_tru/clean.png")
const ARENA_SCALE := 2.0 / 3.0
const PVE_SCALE := 0.6
const PVE_OFFSET := Vector2(32.0, 0.0)

@onready var hud: PixelHUD = $Presentation/HUD
@onready var inventory_panel: InventoryPanel = $Presentation/HUD/Inventory
@onready var character_panel: CharacterPanel = $Presentation/HUD/CharacterPanel
@onready var dock: Panel = $Presentation/HUD/Dock
@onready var room: LineEdit = $Presentation/HUD/Dock/Room
@onready var social_panel: SocialPanel = $Presentation/HUD/SocialPanel
@onready var account_panel: AccountAuthPanel = $Presentation/AccountAuthPanel

var language_manager: Variant
var api: CombatApi
var user_id: String = ""
var device_id: String = ""
var identity_path: String = "user://identity.cfg"
var current_account_data: Dictionary = {}
var busy: bool = false
var backend_connection_attempted: bool = false
var send_clock: float = 0.0
var snapshot_age: float = 0.0
var pending_action: String = ""
var last_phase: String = ""
var fighters: Dictionary = {}
var touch_layout_enabled: bool = false
var game_input: GameInput
var boar_sprite: Sprite2D
var _last_dock_status_source := ""
var _last_dock_status_key := ""
var _last_dock_status_args: Array = []

func _ready() -> void:
	language_manager = get_node_or_null("/root/LanguageManager")
	if language_manager != null:
		language_manager.locale_changed.connect(_on_language_changed)
	get_window().min_size = Vector2i(640, 360)

	game_input = InputScript.new() as GameInput
	add_child(game_input)
	game_input.action_requested.connect(_action)

	api = Api.new()
	add_child(api)
	social_panel.set_api(api)
	account_panel.auth_completed.connect(_on_account_auth_completed)
	account_panel.continue_offline.connect(_continue_offline)
	inventory_panel.api = api
	character_panel.api = api
	api.snapshot_received.connect(_snapshot)
	api.match_connection_lost.connect(_connection_lost)
	hud.action_requested.connect(_action)
	character_panel.inventory_requested.connect(_open_equipment_bag)
	character_panel.touch_layout_changed.connect(_on_touch_layout_changed)
	character_panel.profile_updated.connect(hud.apply_profile)
	character_panel.account_requested.connect(_open_account_panel)

	touch_layout_enabled = OS.has_feature("mobile") or character_panel.touch_layout_enabled or OS.get_cmdline_user_args().has("--touch-preview")
	character_panel.set_touch_layout_enabled(touch_layout_enabled, false)
	hud.set_touch_layout(touch_layout_enabled)

	boar_sprite = Sprite2D.new()
	boar_sprite.name = "SonTru"
	boar_sprite.texture = SON_TRU_SPRITE
	boar_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	boar_sprite.scale = Vector2(0.8, 0.8)
	boar_sprite.z_index = 1
	boar_sprite.visible = false
	$Arena.add_child(boar_sprite)
	$Arena.hide()

	identity_path = "user://identity.cfg"
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with("--guest="):
			identity_path = "user://identity_" + argument.sha256_text().left(12) + ".cfg"
	var config := ConfigFile.new()
	config.load(identity_path)
	device_id = str(config.get_value("auth", "device_id", ""))
	if not device_id.is_empty():
		account_panel.configure(api, device_id, touch_layout_enabled)
	_update_buttons()
	if OS.get_cmdline_user_args().has("--no-auto-connect"):
		account_panel.hide()
	elif DisplayServer.get_name() == "headless":
		account_panel.hide()
		_connect_backend.call_deferred()
	elif device_id.is_empty():
		account_panel.open_entry(api, device_id, touch_layout_enabled)
	else:
		_connect_backend.call_deferred()

func _on_language_changed(_locale: String) -> void:
	if not _last_dock_status_key.is_empty():
		dock.get_node("Status").text = language_manager.format_message(_last_dock_status_key, _last_dock_status_args)
	elif not _last_dock_status_source.is_empty():
		dock.get_node("Status").text = language_manager.translate_message(_last_dock_status_source)
	if not character_panel.profile.is_empty():
		hud.apply_profile(character_panel.profile)

func _action(action: String) -> void:
	if account_panel.visible:
		return
	match action:
		"close":
			inventory_panel.hide()
			character_panel.hide()
			social_panel.hide()
			dock.hide()
		"touch_preview":
			character_panel.set_touch_layout_enabled(not touch_layout_enabled)
		"inventory":
			if not api.match_id.is_empty():
				hud.notify("Túi đồ bị khóa trong trận online.")
			elif inventory_panel.visible:
				inventory_panel.hide()
			else:
				character_panel.hide()
				social_panel.hide()
				dock.hide()
				inventory_panel.open_inventory()
		"character":
			if character_panel.visible:
				character_panel.hide()
			else:
				inventory_panel.hide()
				social_panel.hide()
				dock.hide()
				character_panel.open_profile()
		"social":
			if social_panel.visible:
				social_panel.hide()
			else:
				inventory_panel.hide()
				character_panel.hide()
				dock.hide()
				social_panel.open_panel("friends")
		"dock":
			character_panel.hide()
			social_panel.hide()
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
			if inventory_panel.visible or character_panel.visible or social_panel.visible or dock.visible:
				return
			if api.snapshot.get("phase", "") == "active":
				pending_action = "sk_basic" if action == "attack" else "sk_dodge"
			else:
				hud.notify("Đòn đánh và né chỉ dùng trong trận đấu.")
		_:
			hud.notify("Chức năng chưa mở.")

func _unhandled_input(event: InputEvent) -> void:
	if account_panel.visible:
		get_viewport().set_input_as_handled()
		return
	if game_input.handle_event(event, touch_layout_enabled, room.has_focus() or social_panel.has_text_input_focus() or account_panel.has_text_input_focus()):
		get_viewport().set_input_as_handled()

func _on_touch_layout_changed(enabled: bool) -> void:
	touch_layout_enabled = enabled
	hud.set_touch_layout(enabled)

func _open_equipment_bag() -> void:
	character_panel.hide()
	if not api.match_id.is_empty():
		hud.notify("Túi đồ bị khóa trong trận online.")
		return
	dock.hide()
	inventory_panel.open_equipment()

func _movement() -> Vector2:
	if busy or account_panel.visible or inventory_panel.visible or character_panel.visible or social_panel.visible or dock.visible:
		return Vector2.ZERO
	return game_input.movement()

func _process(delta: float) -> void:
	if api == null or api.match_id.is_empty():
		return
	snapshot_age += delta
	_present_fighters(delta)
	var direction := _movement()
	send_clock += delta
	if send_clock >= 0.05:
		send_clock = 0.0
		var origin := _local_arena_position()
		var aim := game_input.aim(touch_layout_enabled, _pointer_arena_position(), origin)
		api.send_input(direction, aim, pending_action)
		pending_action = ""
	if snapshot_age > 2.0:
		hud.get_node("Mode").text = "ĐANG CHỜ SERVER • chưa xác nhận"
	queue_redraw()

func _local_arena_position() -> Vector2:
	for player_data: Dictionary in api.snapshot.get("players", []):
		if str(player_data.get("id", "")) == user_id:
			return Vector2(float(player_data.get("x", 0)), float(player_data.get("y", 0)))
	return Vector2(380, 350)

func _arena_position(point: Vector2) -> Vector2:
	return PVE_OFFSET + point * PVE_SCALE if api.match_kind == "pve_son_tru" else point * ARENA_SCALE

func _pointer_arena_position() -> Vector2:
	var point := get_global_mouse_position()
	if api.match_kind == "pve_son_tru":
		return (point - PVE_OFFSET) / PVE_SCALE
	return point / ARENA_SCALE

func _present_fighters(delta: float) -> void:
	for player_data: Dictionary in api.snapshot.get("players", []):
		var id := str(player_data.get("id", ""))
		if not fighters.has(id):
			var actor := Actor.instantiate() as PixelActor
			actor.get_node("Camera2D").enabled = false
			$Arena.add_child(actor)
			actor.position = _arena_position(Vector2(float(player_data.get("x", 0)), float(player_data.get("y", 0))))
			if id != user_id:
				actor.modulate = Color(1.0, 0.76, 0.66)
			fighters[id] = actor
		var actor: PixelActor = fighters[id]
		var target := _arena_position(Vector2(float(player_data.get("x", 0)), float(player_data.get("y", 0))))
		actor.z_index = int(float(player_data.get("y", 0)))
		var motion := target - actor.position
		actor.position = actor.position.lerp(target, minf(1.0, delta * 20.0))
		actor.present(motion, delta)
	if api.match_kind == "pve_son_tru" and api.snapshot.has("boar"):
		var boar: Dictionary = api.snapshot.boar
		boar_sprite.position = _arena_position(Vector2(float(boar.get("x", 0)), float(boar.get("y", 0))))
		boar_sprite.z_index = int(float(boar.get("y", 0)))
		boar_sprite.flip_h = float(boar.get("faceX", -1)) > 0
		boar_sprite.visible = int(boar.get("hp", 0)) > 0
	else:
		boar_sprite.visible = false

func _draw() -> void:
	if api == null or api.match_id.is_empty():
		return
	var arena_color := Color("28242d") if api.match_kind == "pve_son_tru" else Color("202c30")
	draw_rect(Rect2(0, 0, 640, 360), arena_color)
	if api.match_kind == "pve_son_tru":
		var boar: Dictionary = api.snapshot.get("boar", {})
		if not boar.is_empty():
			var boar_position := _arena_position(Vector2(float(boar.get("x", 0)), float(boar.get("y", 0))))
			var boar_face := Vector2(float(boar.get("faceX", -1)), float(boar.get("faceY", 0)))
			if str(boar.get("mode", "")) == "tell":
				draw_line(boar_position, boar_position + boar_face * PVE_SCALE * 128.0, Color(1.0, 0.48, 0.24, 0.85), 6.0)
				draw_arc(boar_position, 28.0, 0.0, TAU, 24, Color("f6d38a"), 2.0)
			var bar_origin := boar_position + Vector2(-22.0, -48.0)
			draw_rect(Rect2(bar_origin, Vector2(44.0, 4.0)), Color("431f2b"))
			draw_rect(Rect2(bar_origin, Vector2(44.0 * float(boar.get("hp", 0)) / maxf(float(boar.get("maxHp", 60)), 1.0), 4.0)), Color("d87946"))
		for player_data: Dictionary in api.snapshot.get("players", []):
			var position := _arena_position(Vector2(float(player_data.get("x", 0)), float(player_data.get("y", 0))))
			draw_rect(Rect2(position + Vector2(-14, -44), Vector2(28, 3)), Color("431f2b"))
			draw_rect(Rect2(position + Vector2(-14, -44), Vector2(28 * float(player_data.get("hp", 0)) / 100.0, 3)), Color("8ab974"))
		return
	var wall: Dictionary = api.snapshot.get("rules", {}).get("wall", {"x": 462, "y": 200, "w": 36, "h": 100})
	draw_rect(Rect2(Vector2(float(wall.get("x", 0)), float(wall.get("y", 0))) * ARENA_SCALE,
		Vector2(float(wall.get("w", 0)), float(wall.get("h", 0))) * ARENA_SCALE), Color("778078"))
	for player_data: Dictionary in api.snapshot.get("players", []):
		var position := Vector2(float(player_data.get("x", 0)), float(player_data.get("y", 0))) * ARENA_SCALE
		var facing := Vector2(float(player_data.get("faceX", 1)), float(player_data.get("faceY", 0)))
		if str(player_data.get("mode", "")) in ["windup", "active"]:
			draw_arc(position, 42 * ARENA_SCALE, facing.angle() - PI / 3,
				facing.angle() + PI / 3, 16, Color("f6d38a"), 2)
		draw_rect(Rect2(position + Vector2(-14, -49), Vector2(28, 3)), Color("431f2b"))
		draw_rect(Rect2(position + Vector2(-14, -49), Vector2(28 * float(player_data.get("hp", 0)) / 100.0, 3)), Color("8ab974"))

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
	_last_dock_status_source = message
	_last_dock_status_key = ""
	_last_dock_status_args.clear()
	dock.get_node("Status").text = language_manager.translate_message(message)
	hud.notify(message)

func _message_format(template: String, arguments: Array) -> void:
	_last_dock_status_source = ""
	_last_dock_status_key = template
	_last_dock_status_args = arguments.duplicate(true)
	dock.get_node("Status").text = language_manager.format_message(template, arguments)
	hud.notify_format(template, arguments)

func _connection_lost() -> void:
	pending_action = ""
	dock.show()
	hud.get_node("Mode").text = "MẤT KẾT NỐI"
	_message("Mất kết nối. Kết nối lại trong 10 giây để tiếp tục trận đấu.")
	_update_buttons()

func _snapshot(value: Dictionary) -> void:
	snapshot_age = 0.0
	var phase := str(value.get("phase", ""))
	var is_pve := api.match_kind == "pve_son_tru"
	$Arena.show()
	hud.get_node("Mode").text = "ONLINE • SERVER XÁC NHẬN"
	for player_data: Dictionary in value.get("players", []):
		if str(player_data.get("id", "")) == user_id:
			hud.set_health(int(player_data.get("hp", 100)))
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
				_message("Quan sát hướng gầm • né ngang • phản công lúc Sơn Trư hồi thế." if is_pve else "Trận đấu bắt đầu.")
			"settlement_saving", "settling":
				hud.get_node("Mode").text = "ĐANG LƯU VÀ GHI NHẬN THƯỞNG…"
				_message("Kết quả đã xác nhận; đang lưu thưởng trên server.")
			"reward_pending":
				dock.show()
				hud.get_node("Mode").text = "THƯỞNG ĐANG CHỜ • TÚI ĐẦY"
				_message("Túi đầy. Phần thưởng vẫn được giữ để nhận sau khi dọn túi.")
			"defeated":
				hud.get_node("Mode").text = "BẠN ĐÃ KIỆT SỨC • ĐANG HỒI PHỤC"
				_message("Bạn đã gục ngã. Sơn Trư sẽ trở lại sau một lát.")
			"victory":
				dock.show()
				dock.get_node("Status").text = "Đã xong • rời trận để về sảnh"
			"finished":
				dock.show()
				if is_pve:
					_message("Encounter kết thúc • rời trận để về sảnh.")
				else:
					var winner := str(value.get("winner", ""))
					_message(("Hòa" if winner.is_empty() else ("Bạn thắng" if winner == user_id else "Bạn thua")) + " • Rời trận để về sảnh.")
	if is_pve and phase == "victory":
		var settlement: Dictionary = value.get("settlement", {})
		if str(settlement.get("status", "")) == "training":
			_message("Bài luyện phàm nhân hoàn tất • không có XP hoặc loot lặp.")
		else:
			var items: Array = settlement.get("items", [])
			_message_format("Đã nhận %d tu vi và %s.", [int(settlement.get("cultivationXp", 0)), "Da Sơn Trư ×1" if not items.is_empty() else "không có loot thêm"])
	_update_buttons()

func _connect_backend(authenticate_device: bool = true) -> void:
	if busy:
		return
	busy = true
	backend_connection_attempted = false
	_update_buttons()
	_message("Đang kết nối backend…")
	var result: Dictionary = {"ok": true}
	if authenticate_device:
		if device_id.is_empty():
			device_id = _new_device_id()
			_save_device_id()
		result = await api.login_device(device_id)
	if not result.has("error"):
		result = await api.get_account()
		if not result.has("error"):
			current_account_data = result.duplicate(true)
			user_id = str(result.user.id)
			var account_name := str(result.user.get("username", ""))
			character_panel.set_display_name(account_name)
			social_panel.set_identity(user_id, account_name)
			result = await api.call_rpc("get_profile")
			if not result.has("error"):
				hud.apply_profile(result)
	if not result.has("error"):
		result = await api.connect_chat()
	if not result.has("error") and not api.match_id.is_empty():
		result = await api.rejoin_current_match()
	if result.has("error"):
		dock.show()
		var reason := str(result.error)
		if int(result.get("status", 0)) == 0:
			if api.token.is_empty():
				reason = "Backend chưa phản hồi. Bật Docker rồi chạy: docker compose up --build -d"
			else:
				reason = "Đăng nhập được một phần nhưng máy chủ chưa hoàn tất kết nối. Nhấn Kết nối để thử lại."
		_message("Kết nối thất bại: " + reason)
	else:
		hud.get_node("Mode").text = "ONLINE • ĐẤU TRƯỜNG"
		_message("Đã kết nối. Hồ sơ, cộng đồng và túi đồ đã đồng bộ với máy chủ.")
		social_panel.on_backend_ready()
	busy = false
	backend_connection_attempted = true
	_update_buttons()

func _new_device_id() -> String:
	return Crypto.new().generate_random_bytes(24).hex_encode()

func _save_device_id() -> void:
	if device_id.is_empty():
		return
	var config := ConfigFile.new()
	config.load(identity_path)
	config.set_value("auth", "device_id", device_id)
	config.save(identity_path)

func _on_account_auth_completed(new_device_id: String, account_data: Dictionary) -> void:
	device_id = new_device_id
	_save_device_id()
	current_account_data = account_data.duplicate(true)
	_connect_backend.call_deferred(false)

func _continue_offline() -> void:
	account_panel.hide()
	hud.get_node("Mode").text = "OFFLINE • BẢN XEM THỬ"
	_message("Đang xem bản thử ngoại tuyến. Tiến trình chưa được đồng bộ với máy chủ.")

func _open_account_panel() -> void:
	if busy:
		return
	if not api.token.is_empty():
		var result: Dictionary = await api.get_account()
		if not result.has("error") and result.has("user"):
			current_account_data = result.duplicate(true)
		account_panel.open_account(api, device_id, current_account_data, touch_layout_enabled)
	else:
		account_panel.open_entry(api, device_id, touch_layout_enabled)

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
	var was_pve := api.match_kind == "pve_son_tru"
	await api.leave_sparring()
	for actor: Node2D in fighters.values():
		actor.queue_free()
	fighters.clear()
	boar_sprite.visible = false
	pending_action = ""
	last_phase = ""
	$Arena.hide()
	if was_pve:
		var profile: Dictionary = await api.call_rpc("get_profile")
		if not profile.has("error"):
			hud.apply_profile(profile)
	else:
		hud.set_health(100)
	hud.get_node("Mode").text = "ONLINE • SẴN SÀNG" if _connected() else "BẢN XEM THỬ • OFFLINE"
	_message("Đã rời trận. Trở lại sảnh.")
	busy = false
	_update_buttons()
