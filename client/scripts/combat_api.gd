class_name CombatApi
extends SocialApi
## Shares SocialApi's authenticated socket. Only intents are sent to the server.
signal snapshot_received(snapshot: Dictionary)
signal match_connection_lost
var match_id: String = ""
var epoch: String = ""
var input_sequence: int = 0
var last_tick: int = -1
var snapshot: Dictionary = {}
var _joining: bool = false

func _ready() -> void:
	match_data_received.connect(_on_match_data)
	socket_closed.connect(func() -> void: match_connection_lost.emit())

func login_device(device_id: String) -> Dictionary:
	var result := await _request(HTTPClient.METHOD_POST, "/v2/account/authenticate/device?create=true", {"id": device_id}, _basic_auth())
	if result.has("token"):
		disconnect_chat()
		token = str(result.token)
		refresh_token = str(result.get("refresh_token", ""))
	return result

func create_sparring() -> Dictionary:
	if not match_id.is_empty():
		return {"error": "Leave the current match first"}
	var result := await call_rpc("combat_create", {"consent": true})
	if result.has("error"):
		return result
	return await join_sparring(str(result.matchId))

func join_sparring(id: String) -> Dictionary:
	if _joining or (not match_id.is_empty() and match_id != id):
		return {"error": "Already joining or in another match"}
	_joining = true
	match_id = id
	epoch = ""
	last_tick = -1
	input_sequence = 0
	snapshot = {}
	var result := await _socket_request({"match_join": {"match_id": id, "metadata": {"consent": "true", "version": "1"}}})
	_joining = false
	if result.has("error"):
		match_id = ""
	return result

func leave_sparring() -> Dictionary:
	var id := match_id
	match_id = ""
	epoch = ""
	snapshot = {}
	if id.is_empty():
		return {}
	return await _socket_request({"match_leave": {"match_id": id}})

func send_input(move: Vector2, aim: Vector2, action: String = "") -> Error:
	if match_id.is_empty() or epoch.is_empty() or _socket == null or _socket.get_ready_state() != WebSocketPeer.STATE_OPEN:
		return ERR_UNAVAILABLE
	input_sequence += 1
	var input := {"epoch": epoch, "seq": input_sequence, "moveX": move.x, "moveY": move.y, "aimX": aim.x, "aimY": aim.y, "action": action}
	return _socket.send_text(JSON.stringify({"match_data_send": {"match_id": match_id, "op_code": 1, "data": Marshalls.utf8_to_base64(JSON.stringify(input)), "reliable": true}}))

func _on_match_data(message: Dictionary) -> void:
	if str(message.get("match_id", "")) != match_id or int(message.get("op_code", 0)) != 2:
		return
	var value: Variant = JSON.parse_string(Marshalls.base64_to_utf8(str(message.get("data", ""))))
	if not value is Dictionary or int(value.get("version", 0)) != 1:
		return
	var tick := int(value.get("tick", -1))
	if tick <= last_tick:
		return
	last_tick = tick
	epoch = str(value.get("epoch", ""))
	snapshot = value
	snapshot_received.emit(snapshot)
