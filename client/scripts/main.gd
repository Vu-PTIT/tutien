extends Node2D
## No @tool runtime simulation: all visual nodes are serialized in .tscn.
const Api = preload("res://scripts/combat_api.gd")
const Actor = preload("res://scenes/player.tscn")
const MapWorldScene = preload("res://scenes/map_world.tscn")
const InputScript = preload("res://scripts/game_input.gd")
const SON_TRU_BACKGROUND: Texture2D = preload("res://assets/pixel/maps/bai_son_tru.png")
const SON_TRU_SPRITE: Texture2D = preload("res://assets/pixel/enemies/son_tru/clean.png")
const ARENA_SCALE := 2.0 / 3.0
const PVE_SCALE := 0.6
const PVE_OFFSET := Vector2(32.0, 0.0)
const WALK_SPEED := 72.0

@onready var hud: PixelHUD = $Presentation/HUD
@onready var inventory_panel: InventoryPanel = $Presentation/HUD/Inventory
@onready var map_host: Node2D = $MapHost
@onready var dock: Panel = $Presentation/HUD/Dock
@onready var room: LineEdit = $Presentation/HUD/Dock/Room
@onready var world_map: WorldMapPanel = $Presentation/HUD/WorldMap
@onready var touch_controls: TouchControls = $Presentation/HUD/TouchControls
var map_world: GameMap
var player: PixelActor
var village_camera: Camera2D
var current_map_id: String = "m_an_khe"
var api: CombatApi
var user_id: String = ""
var device_id: String = ""
var busy: bool = false
var send_clock: float = 0.0
var snapshot_age: float = 0.0
var pending_action: String = ""
var last_phase: String = ""
var fighters: Dictionary = {}
var local_map_flags: Dictionary = {}
var offline_position := Vector2(768, 576)
var touch_layout_enabled := false
var game_input: GameInput
var boar_sprite: Sprite2D
var world_seq: int = 0
var world_sync_clock: float = 0.0
var world_sync_busy: bool = false
var world_field_poll_clock: float = 0.0
var world_field_poll_busy: bool = false
var world_last_synced_position := Vector2(-10000.0, -10000.0)
var world_quest: Dictionary = {}
var service_menu: PopupMenu
var service_kind: String = ""

func _ready() -> void:
	get_window().min_size = Vector2i(640, 360)
	game_input = InputScript.new() as GameInput
	add_child(game_input)
	game_input.action_requested.connect(_action)
	_load_map(current_map_id)
	offline_position = player.position
	api = Api.new()
	add_child(api)
	inventory_panel.api = api
	api.snapshot_received.connect(_snapshot)
	api.match_connection_lost.connect(_connection_lost)
	hud.action_requested.connect(_action)
	touch_controls.action_requested.connect(game_input.request_action)
	touch_layout_enabled = OS.has_feature("mobile") or OS.get_cmdline_user_args().has("--touch-preview")
	hud.set_touch_layout(touch_layout_enabled)
	world_map.map_requested.connect(_travel_to_map)
	service_menu = PopupMenu.new()
	service_menu.name = "VillageServiceMenu"
	add_child(service_menu)
	service_menu.id_pressed.connect(_service_action)
	world_map.set_current_map(current_map_id)
	var background := Sprite2D.new()
	background.name = "SonTruBackground"
	background.texture = SON_TRU_BACKGROUND
	background.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	background.position = Vector2(320, 180)
	background.scale = Vector2(576.0 / SON_TRU_BACKGROUND.get_width(), 360.0 / SON_TRU_BACKGROUND.get_height())
	background.z_index = -20
	$Arena.add_child(background)
	boar_sprite = Sprite2D.new()
	boar_sprite.name = "SonTru"
	boar_sprite.texture = SON_TRU_SPRITE
	boar_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	boar_sprite.scale = Vector2(0.8, 0.8)
	boar_sprite.z_index = 1
	boar_sprite.visible = false
	$Arena.add_child(boar_sprite)
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

func _load_map(map_id: String, arrival_tiles: Array = []) -> bool:
	if world_map == null or not world_map.maps_by_id.has(map_id):
		return false
	var data: Dictionary = world_map.maps_by_id[map_id].duplicate(true)
	if arrival_tiles.size() >= 2:
		data["spawn_tiles"] = arrival_tiles.duplicate()
	var next_map := MapWorldScene.instantiate() as GameMap
	next_map.configure(data, int(world_map.catalog.get("tile_size_px", 32)))
	if map_world != null:
		map_host.remove_child(map_world)
		map_world.queue_free()
	map_host.add_child(next_map)
	map_world = next_map
	player = map_world.get_node("Actors/Player") as PixelActor
	village_camera = map_world.get_node("Actors/Player/Camera2D") as Camera2D
	current_map_id = map_id
	var preview_mobs: Array = []
	for spawn_value: Variant in data.get("field_spawns", []):
		if not spawn_value is Dictionary:
			continue
		var spawn: Dictionary = spawn_value
		var tile_position: Array = spawn.get("position_tiles", [0, 0])
		if tile_position.size() < 2:
			continue
		preview_mobs.append({
			"id": str(spawn.get("spawn_id", "")), "enemyId": str(spawn.get("enemy_id", "")),
			"name": str(spawn.get("name", "Quái vật")),
			"x": (float(tile_position[0]) + 0.0) * 32.0, "y": (float(tile_position[1]) + 0.0) * 32.0,
			"hp": int(spawn.get("max_hp", 1)), "maxHp": int(spawn.get("max_hp", 1)), "mode": "idle"
		})
	map_world.update_field_mobs(preview_mobs)
	offline_position = player.position
	world_map.set_current_map(map_id)
	hud.configure_map(data)
	hud.get_node("FieldInfo/Title").text = str(data.get("region_title", "THÁM HIỂM"))
	hud.get_node("FieldInfo/Body").text = str(data.get("region_body", ""))
	hud.update_position(player.position, map_world.map_size_px, map_world.tile_size_px, map_world.active_area_name)
	hud.get_node("Location/State").text = "An toàn • " + map_world.active_area_name if map_id == "m_an_khe" else map_world.active_area_name
	var focused: MapInteractable = map_world.update_interaction_focus(player.position)
	hud.set_interaction_prompt(focused.prompt_text() if focused != null else "")
	_update_field_combat_controls()
	return true

func _travel_to_map(map_id: String, arrival_tiles: Array = []) -> void:
	if not api.token.is_empty():
		hud.notify("Hãy đi tới cổng trên bản đồ để chuyển khu vực.")
		return
	if api != null and not api.match_id.is_empty():
		hud.notify("Không thể chuyển map trong đấu tập.")
		return
	if map_id == current_map_id:
		world_map.hide()
		hud.notify("Bạn đang ở " + map_world.map_name + ".")
		return
	if _load_map(map_id, arrival_tiles):
		world_map.hide()
		hud.notify("Đã chuyển map cục bộ để thử tuyến. Tiến độ chưa ghi lên server.")

func _action(action: String) -> void:
	match action:
		"close":
			inventory_panel.hide()
			dock.hide()
			world_map.hide()
			if service_menu != null:
				service_menu.hide()
		"touch_preview":
			touch_layout_enabled = not touch_layout_enabled
			hud.set_touch_layout(touch_layout_enabled)
		"inventory":
			if service_menu != null:
				service_menu.hide()
			if not api.match_id.is_empty():
				hud.notify("Túi đồ bị khóa trong trận online.")
			elif inventory_panel.visible:
				inventory_panel.hide()
			else:
				world_map.hide()
				dock.hide()
				inventory_panel.open_inventory()
		"map":
			if service_menu != null:
				service_menu.hide()
			if not api.match_id.is_empty():
				hud.notify("Bản đồ tuyến đóng trong trận online.")
			elif world_map.visible:
				world_map.hide()
			else:
				inventory_panel.hide()
				dock.hide()
				world_map.open_map()
		"dock":
			if service_menu != null:
				service_menu.hide()
			world_map.hide()
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
			if inventory_panel.visible or dock.visible or world_map.visible:
				return
			if api.snapshot.get("phase", "") == "active":
				pending_action = "sk_basic" if action == "attack" else "sk_dodge"
			elif action == "attack":
				_attack_field_mob()
		"interact":
			if not api.match_id.is_empty():
				return
			if inventory_panel.visible or dock.visible or world_map.visible:
				return
			var target: MapInteractable = map_world.update_interaction_focus(player.position)
			if target == null:
				hud.notify("Đến gần một điểm tương tác rồi nhấn E hoặc chạm nút tương tác.")
			else:
				_interact_with_world_object(target)
		_:
			hud.notify("Chức năng chưa mở. Không tiêu hao vật phẩm.")

func _interact_with_world_object(target: MapInteractable) -> void:
	var details := target.interaction_data
	if target.entity_id in ["ak.market.village", "ak.garden.home", "ak.service.do_khe"]:
		_open_service_menu(target.entity_id)
		return
	if not api.token.is_empty():
		await _sync_world_position(true)
		var result: Dictionary = await api.call_rpc("world_interact", {"entityId": target.entity_id})
		if result.has("error"):
			hud.notify("Tương tác chưa được xác nhận: " + str(result.error))
			return
		if result.has("profile"):
			hud.apply_profile(result.profile)
		var server_map := str(result.get("mapId", current_map_id))
		if server_map != current_map_id:
			var px := float(result.get("x", 0.0))
			var py := float(result.get("y", 0.0))
			if _load_map(server_map, [floori(px / 32.0), floori(py / 32.0)]):
				player.position = Vector2(px, py)
				world_last_synced_position = player.position
				world_map.update_player_context(player.position)
				world_map.update_interaction_focus(player.position)
		if result.has("quest"):
			_apply_world_quest(result.quest)
		if result.has("fieldMobs"):
			map_world.update_field_mobs(result.fieldMobs)
		hud.notify(str(result.get("message", "Máy chủ đã xác nhận tương tác.")))
		return
	if target.action_kind == "gate":
		var destination := str(details.get("target_map_id", ""))
		if destination.is_empty():
			hud.notify("Lối chuyển map chưa có điểm đến.")
		else:
			var arrival_tiles: Array = details.get("target_arrival_tiles", [])
			_travel_to_map(destination, arrival_tiles)
		return
	var completion_flag := str(details.get("completion_flag", ""))
	var already_used := not completion_flag.is_empty() and local_map_flags.has(completion_flag)
	var message := str(details.get("repeat_message", details.get("message", ""))) if already_used else str(details.get("message", ""))
	if not completion_flag.is_empty():
		local_map_flags[completion_flag] = true
	if message.is_empty():
		message = "Đã tương tác. Thay đổi chỉ có hiệu lực trong phiên thử cục bộ."
	hud.notify(message)

func _open_service_menu(entity_id: String) -> void:
	if api.token.is_empty():
		hud.notify("Dịch vụ cần kết nối máy chủ để lưu giao dịch và vật phẩm.")
		return
	await _sync_world_position(true)
	service_kind = entity_id
	service_menu.clear()
	if entity_id == "ak.market.village":
		service_menu.add_item("Mua Hạt Cam Lộ — 3 linh thạch", 1)
		service_menu.add_item("Mua nước — 1 linh thạch", 2)
		service_menu.add_item("Mua Hồi Nguyên Hoàn — 8 linh thạch", 3)
		service_menu.add_item("Bán da Sơn Trư — 3 linh thạch", 4)
	elif entity_id == "ak.service.do_khe":
		service_menu.add_item("Luyện Hồi Nguyên Hoàn — 2 Cam Lộ + 1 nước + 2 linh thạch", 5)
		service_menu.add_item("Rèn Thanh Thiết Kiếm — 6 quặng + 2 trúc + 8 linh thạch", 6)
	else:
		service_menu.add_item("Gieo Hạt Cam Lộ ở ô 1", 7)
		service_menu.add_item("Thu hoạch ô 1 nếu đã chín", 8)
	service_menu.position = Vector2i(get_window().size.x / 2, get_window().size.y / 2)
	service_menu.popup()

func _service_action(action_id: int) -> void:
	var operation_id := "svc_" + str(Time.get_ticks_usec()) + "_" + str(randi())
	var result: Dictionary
	var payload: Dictionary
	if action_id in [7, 8]:
		payload = {"operationId": operation_id, "action": "plant" if action_id == 7 else "harvest", "plotId": 0}
		if action_id == 7:
			payload["cropId"] = "crop_cam_lo"
		result = await api.call_rpc("garden_action", payload)
	else:
		payload = {"operationId": operation_id, "quantity": 1}
		match action_id:
			1: payload.merge({"action": "buy", "itemId": "it_seed_cam_lo"})
			2: payload.merge({"action": "buy", "itemId": "it_water"})
			3: payload.merge({"action": "buy", "itemId": "it_heal_pill"})
			4: payload.merge({"action": "sell", "itemId": "it_boar_hide"})
			5: payload.merge({"action": "craft", "recipeId": "rc_heal"})
			6: payload.merge({"action": "craft", "recipeId": "rc_sword"})
		result = await api.call_rpc("economy_action", payload)
	if result.has("error"):
		hud.notify("Giao dịch chưa thực hiện: " + str(result.error))
		return
	if result.has("profile"):
		hud.apply_profile(result.profile)
		hud.notify("Đã cập nhật túi đồ và linh thạch.")

func _unhandled_input(event: InputEvent) -> void:
	if game_input.handle_event(event, touch_layout_enabled, room.has_focus()):
		get_viewport().set_input_as_handled()

func _movement() -> Vector2:
	if busy or inventory_panel.visible or dock.visible or world_map.visible:
		return Vector2.ZERO
	return game_input.movement(touch_controls.direction)

func can_walk(at: Vector2) -> bool:
	return map_world != null and map_world.is_walkable(at)

func _physics_process(delta: float) -> void:
	if api == null or map_world == null or not api.match_id.is_empty():
		return
	var old_position := player.position
	player.velocity = _movement() * WALK_SPEED
	player.move_and_slide()
	offline_position = player.position
	player.present(player.position - old_position, delta)
	var area_name := map_world.update_player_context(player.position)
	var focused: MapInteractable = map_world.update_interaction_focus(player.position)
	var nearby_mob := map_world.nearest_field_mob(player.position, 72.0)
	hud.set_interaction_prompt(focused.prompt_text() if focused != null else ("J / Chạm • Đánh quái gần nhất" if not nearby_mob.is_empty() else ""))
	hud.update_position(player.position, map_world.map_size_px, map_world.tile_size_px, area_name)
	hud.get_node("Location/State").text = "An toàn • " + area_name if current_map_id == "m_an_khe" else area_name
	if not api.token.is_empty() and not busy:
		world_sync_clock += delta
		if world_sync_clock >= 0.25 and not world_sync_busy:
			world_sync_clock = 0.0
			_sync_world_position()

func _sync_world_position(force: bool = false) -> Dictionary:
	if api.token.is_empty() or api.match_id.is_empty() == false:
		return {}
	while world_sync_busy:
		await get_tree().process_frame
	var here := player.position
	if not force and here.distance_to(world_last_synced_position) < 2.0:
		return {}
	world_sync_busy = true
	world_seq += 1
	var result: Dictionary = await api.call_rpc("world_move", {"x": here.x, "y": here.y, "seq": world_seq})
	if not result.has("error"):
		world_seq = int(result.get("seq", world_seq))
		world_last_synced_position = here
		if str(result.get("mapId", current_map_id)) == current_map_id:
			var authoritative := Vector2(float(result.get("x", here.x)), float(result.get("y", here.y)))
			if player.position.distance_to(authoritative) > 14.0:
				player.position = authoritative
		if result.has("fieldMobs"):
			map_world.update_field_mobs(result.fieldMobs)
	else:
		var state: Dictionary = await api.call_rpc("world_get")
		if not state.has("error"):
			world_seq = int(state.get("seq", world_seq))
			var server_map := str(state.get("mapId", current_map_id))
			if server_map != current_map_id:
				_load_map(server_map, [floori(float(state.x) / 32.0), floori(float(state.y) / 32.0)])
			player.position = Vector2(float(state.x), float(state.y))
			world_last_synced_position = player.position
			map_world.update_field_mobs(state.get("fieldMobs", []))
			hud.notify("Vị trí đã đồng bộ lại với máy chủ.")
			result = state
	world_sync_busy = false
	return result

func _apply_world_quest(quest: Dictionary) -> void:
	world_quest = quest.duplicate(true)
func _process(delta: float) -> void:
	if api == null:
		return
	var direction := _movement()
	game_input.aim(direction, touch_layout_enabled, Vector2.RIGHT, Vector2.ZERO)
	if not api.match_id.is_empty():
		snapshot_age += delta
		_present_fighters(delta)
		send_clock += delta
		if send_clock >= 0.05:
			send_clock = 0.0
			var origin := _local_server_position()
			var aim := game_input.aim(direction, touch_layout_enabled, _pointer_world_position(), origin)
			api.send_input(direction, aim, pending_action)
			pending_action = ""
		if snapshot_age > 2.0:
			hud.get_node("Mode").text = "ĐANG CHỜ SERVER • chưa xác nhận"
	elif not api.token.is_empty() and not busy and not world_field_poll_busy:
		world_field_poll_clock += delta
		if world_field_poll_clock >= 0.75:
			world_field_poll_clock = 0.0
			_poll_world_field()
	queue_redraw()

func _poll_world_field() -> void:
	world_field_poll_busy = true
	var result: Dictionary = await api.call_rpc("world_get")
	if not result.has("error"):
		var server_map := str(result.get("mapId", current_map_id))
		if server_map != current_map_id:
			_load_map(server_map, [floori(float(result.x) / 32.0), floori(float(result.y) / 32.0)])
			player.position = Vector2(float(result.x), float(result.y))
		map_world.update_field_mobs(result.get("fieldMobs", []))
		_update_field_combat_controls()
	world_field_poll_busy = false

func _update_field_combat_controls() -> void:
	if touch_controls == null:
		return
	touch_controls.set_field_combat_mode(current_map_id == "m_truc_am" and api != null and api.match_id.is_empty())

func _attack_field_mob() -> void:
	if busy or api.match_id.is_empty() == false:
		return
	var target_id := map_world.nearest_field_mob(player.position, 70.0)
	if target_id.is_empty():
		if current_map_id != "m_truc_am":
			hud.notify("Sơn Trư và Độc Chu xuất hiện trên bản đồ Trúc Âm.")
		else:
			hud.notify("Đến gần Sơn Trư hoặc Độc Chu rồi nhấn J để đánh.")
		return
	if api.token.is_empty():
		hud.notify("Đang đăng nhập để lưu XP và vật phẩm farm…")
		await _connect_backend()
		if api.token.is_empty():
			return
		# Login restores the server-owned map position, so reacquire the target
		# instead of attacking a preview actor left behind by offline exploration.
		target_id = map_world.nearest_field_mob(player.position, 70.0)
		if target_id.is_empty():
			if current_map_id == "m_truc_am":
				hud.notify("Đã đồng bộ vị trí. Hãy tới gần Sơn Trư hoặc Độc Chu rồi đánh.")
			else:
				hud.notify("Đã đồng bộ vị trí. Quái farm hiện chỉ xuất hiện ở Trúc Âm.")
			return
	busy = true
	var sync_result: Dictionary = await _sync_world_position(true)
	if sync_result.has("error"):
		hud.notify("Chưa đồng bộ được vị trí với máy chủ.")
		busy = false
		return
	target_id = map_world.nearest_field_mob(player.position, 70.0)
	if target_id.is_empty():
		busy = false
		if current_map_id == "m_truc_am":
			hud.notify("Chưa có quái trong tầm đánh. Hãy lại gần một Sơn Trư hoặc Độc Chu.")
		else:
			hud.notify("Quái farm hiện chỉ xuất hiện ở Trúc Âm.")
		return
	var result: Dictionary = await api.call_rpc("world_attack", {"targetId": target_id})
	if result.has("error"):
		hud.notify(str(result.error))
	else:
		map_world.update_field_mobs(result.get("fieldMobs", []))
		if result.has("profile"):
			hud.apply_profile(result.profile)
		hud.notify(str(result.get("message", "Máy chủ đã xử lý đòn đánh.")))
	busy = false

func _local_server_position() -> Vector2:
	for p: Dictionary in api.snapshot.get("players", []):
		if p.id == user_id:
			return Vector2(float(p.x), float(p.y))
	return Vector2(380, 350)

func _arena_world_position(point: Vector2) -> Vector2:
	return PVE_OFFSET + point * PVE_SCALE if api.match_kind == "pve_son_tru" else point * ARENA_SCALE

func _pointer_world_position() -> Vector2:
	var point := get_global_mouse_position()
	if api.match_kind == "pve_son_tru":
		return (point - PVE_OFFSET) / PVE_SCALE
	return point / ARENA_SCALE

func _present_fighters(delta: float) -> void:
	for p: Dictionary in api.snapshot.get("players", []):
		var id := str(p.id)
		if not fighters.has(id):
			var actor := Actor.instantiate() as PixelActor
			actor.get_node("Camera2D").enabled = false
			$Arena.add_child(actor)
			actor.position = _arena_world_position(Vector2(float(p.x), float(p.y)))
			if id != user_id:
				actor.modulate = Color(1.0, 0.76, 0.66)
			fighters[id] = actor
		var actor: PixelActor = fighters[id]
		var target := _arena_world_position(Vector2(float(p.x), float(p.y)))
		actor.z_index = int(float(p.y))
		var movement := target - actor.position
		actor.position = actor.position.lerp(target, minf(1.0, delta * 20.0))
		actor.present(movement, delta)
	if api.match_kind == "pve_son_tru" and api.snapshot.has("boar"):
		var boar: Dictionary = api.snapshot.boar
		boar_sprite.position = _arena_world_position(Vector2(float(boar.x), float(boar.y)))
		boar_sprite.z_index = int(float(boar.y))
		boar_sprite.flip_h = float(boar.get("faceX", -1)) > 0
		boar_sprite.visible = int(boar.get("hp", 0)) > 0
	else:
		boar_sprite.visible = false

func _draw() -> void:
	if api == null or api.match_id.is_empty():
		return
	if api.match_kind == "pve_son_tru":
		var boar: Dictionary = api.snapshot.get("boar", {})
		if not boar.is_empty():
			var boar_position := _arena_world_position(Vector2(float(boar.x), float(boar.y)))
			var boar_face := Vector2(float(boar.get("faceX", -1)), float(boar.get("faceY", 0)))
			if str(boar.get("mode", "")) == "tell":
				draw_line(boar_position, boar_position + boar_face * PVE_SCALE * 128.0, Color(1.0, 0.48, 0.24, 0.85), 6.0)
				draw_arc(boar_position, 28.0, 0.0, TAU, 24, Color("f6d38a"), 2.0)
			var bar_origin := boar_position + Vector2(-22.0, -48.0)
			draw_rect(Rect2(bar_origin, Vector2(44.0, 4.0)), Color("431f2b"))
			draw_rect(Rect2(bar_origin, Vector2(44.0 * float(boar.get("hp", 0)) / maxf(float(boar.get("maxHp", 60)), 1.0), 4.0)), Color("d87946"))
		for p: Dictionary in api.snapshot.get("players", []):
			var pos := _arena_world_position(Vector2(float(p.x), float(p.y)))
			draw_rect(Rect2(pos + Vector2(-14, -44), Vector2(28, 3)), Color("431f2b"))
			draw_rect(Rect2(pos + Vector2(-14, -44), Vector2(28 * float(p.hp) / 100.0, 3)), Color("8ab974"))
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
	hud.get_node("MapButton").disabled = busy or in_match

func _message(message: String) -> void:
	dock.get_node("Status").text = message
	hud.notify(message)

func _connection_lost() -> void:
	pending_action = ""
	dock.show()
	hud.get_node("Mode").text = "MẤT KẾT NỐI"
	_message("Mất kết nối. Kết nối lại trong 10 giây để tiếp tục phiên thế giới.")
	_update_buttons()

func _snapshot(value: Dictionary) -> void:
	snapshot_age = 0.0
	var phase := str(value.phase)
	var is_pve := api.match_kind == "pve_son_tru"
	village_camera.enabled = false
	map_world.hide()
	$Arena.show()
	touch_controls.set_combat_mode(true)
	world_map.hide()
	hud.get_node("Location/Title").text = "BÃI SƠN TRƯ" if is_pve else "VÕ ĐÀI"
	hud.get_node("Location/State").text = "PvE • server xác nhận" if is_pve else "Đấu tập • không mất đồ"
	hud.get_node("Minimap").hide()
	hud.get_node("FieldInfo/Title").text = "ĐỌC CÚ LAO" if is_pve else "ĐẤU TẬP"
	hud.get_node("FieldInfo/Body").text = "Gầm 0,75 giây • khóa hướng\nNé ngang rồi phản công\nLuyện Khí nhận XP + da" if is_pve else "Q / J: đánh • Space: né\nHP và vị trí từ server."
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
				_message("Quan sát hướng gầm • né ngang • phản công lúc Sơn Trư hồi thế." if is_pve else "Trận đấu bắt đầu.")
			"settlement_saving", "settling":
				hud.get_node("Mode").text = "ĐANG LƯU VÀ GHI NHẬN THƯỞNG…"
				_message("Kết quả đã xác nhận; đang lưu thưởng trên server.")
			"reward_pending":
				dock.show()
				hud.get_node("Mode").text = "THƯỞNG ĐANG CHỜ • TÚI ĐẦY"
				hud.get_node("FieldInfo/Body").text = "Kết quả đã được lưu.\nRời bãi, dọn túi rồi\nnhận thưởng trong Túi đồ."
				_message("Túi đầy. Phần thưởng vẫn được giữ để nhận sau khi dọn túi.")
			"defeated":
				hud.get_node("Mode").text = "BẠN ĐÃ KIỆT SỨC • ĐANG HỒI PHỤC"
				_message("Bạn đã gục ngã. Sơn Trư sẽ trở lại sau một lát.")
			"victory":
				dock.show()
				dock.get_node("Status").text = "Đã xong • rời bãi để về map"
			"finished":
				dock.show()
				if is_pve:
					_message("Encounter kết thúc • rời bãi để quay lại map.")
				else:
					var winner := str(value.get("winner", ""))
					_message(("Hòa" if winner.is_empty() else ("Bạn thắng" if winner == user_id else "Bạn thua")) + " • Rời trận để quay lại map hiện tại.")
	if is_pve:
		var settlement: Dictionary = value.get("settlement", {})
		if phase == "victory":
			if str(settlement.get("status", "")) == "training":
				_message("Bài luyện phàm nhân hoàn tất • không có XP hoặc loot lặp.")
			else:
				var items: Array = settlement.get("items", [])
				_message("Đã nhận %d tu vi và %s." % [int(settlement.get("cultivationXp", 0)), "Da Sơn Trư ×1" if not items.is_empty() else "không có loot thêm"])
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
				var world_result: Dictionary = await api.call_rpc("world_get", {"preferredMapId": current_map_id})
				if not world_result.has("error"):
					world_seq = int(world_result.get("seq", 0))
					var world_map_id := str(world_result.get("mapId", current_map_id))
					if world_map_id != current_map_id:
						_load_map(world_map_id, [floori(float(world_result.x) / 32.0), floori(float(world_result.y) / 32.0)])
					player.position = Vector2(float(world_result.x), float(world_result.y))
					world_last_synced_position = player.position
					_apply_world_quest(world_result.get("quest", {}))
					map_world.update_field_mobs(world_result.get("fieldMobs", []))
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
		hud.get_node("Mode").text = "ONLINE • FARM TRÊN MAP"
		_message("Đã kết nối. Vị trí, quái trên map, tương tác và túi đồ được máy chủ xác nhận.")
	busy = false
	_update_field_combat_controls()
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
	var was_pve := api.match_kind == "pve_son_tru"
	await api.leave_sparring()
	for actor: Node2D in fighters.values():
		actor.queue_free()
	fighters.clear()
	boar_sprite.visible = false
	pending_action = ""
	last_phase = ""
	$Arena.hide()
	map_world.show()
	touch_controls.set_combat_mode(false)
	_update_field_combat_controls()
	village_camera.enabled = true
	if was_pve:
		var profile: Dictionary = await api.call_rpc("get_profile")
		if not profile.has("error"):
			hud.apply_profile(profile)
	if not api.token.is_empty():
		var world_result: Dictionary = await api.call_rpc("world_get")
		if not world_result.has("error"):
			_apply_world_quest(world_result.get("quest", {}))
			map_world.update_field_mobs(world_result.get("fieldMobs", []))
	else:
		hud.set_health(100)
	hud.get_node("Minimap").show()
	hud.configure_map(map_world.map_data)
	hud.get_node("FieldInfo/Title").text = str(map_world.map_data.get("region_title", "THÁM HIỂM"))
	hud.get_node("FieldInfo/Body").text = str(map_world.map_data.get("region_body", ""))
	hud.get_node("Mode").text = "ONLINE • FARM TRÊN MAP • server xác nhận" if _connected() else "BẢN XEM THỬ • OFFLINE"
	_message("Đã rời trận. Trở lại map hiện tại.")
	busy = false
	_update_buttons()
