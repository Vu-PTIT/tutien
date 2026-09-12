class_name SocialApi
extends Node
## Add this node to a scene or autoload it. All credentials stay in memory.
## HTTP methods return a Dictionary; failures contain "error" and "status".

signal chat_message_received(message: Dictionary)
signal notification_received(notification: Dictionary)
signal socket_closed

@export var base_url: String = "http://127.0.0.1:7350"
@export var server_key: String = "local-dev-key"

var token: String = ""
var refresh_token: String = ""
var _socket: WebSocketPeer
var _socket_open: bool = false
var _replies: Dictionary = {}
var _pending: Dictionary = {}
var _sequence: int = 0
var _ping_elapsed: float = 0.0
var _auth_busy: bool = false

func _basic_auth() -> String:
	return "Basic " + Marshalls.utf8_to_base64(server_key + ":")

func _request(method: HTTPClient.Method, path: String, body: Variant = null, authorization: String = "") -> Dictionary:
	var http := HTTPRequest.new()
	http.timeout = 10.0
	add_child(http)
	var headers := PackedStringArray(["Content-Type: application/json"])
	if not authorization.is_empty():
		headers.append("Authorization: " + authorization)
	var encoded: String = "" if body == null else JSON.stringify(body)
	var start_error := http.request(base_url.trim_suffix("/") + path, headers, method, encoded)
	if start_error != OK:
		http.queue_free()
		return {"error": "Cannot start request", "status": 0}
	var response: Array = await http.request_completed
	http.queue_free()
	if response[0] != HTTPRequest.RESULT_SUCCESS:
		return {"error": "Connection failed or timed out", "status": 0}
	var parsed: Variant = JSON.parse_string(response[3].get_string_from_utf8())
	if response[1] < 200 or response[1] >= 300:
		var message: String = str(parsed.get("message", "Request rejected")) if parsed is Dictionary else "Request rejected"
		return {"error": message, "status": response[1]}
	if parsed == null and response[3].is_empty():
		return {}
	if not parsed is Dictionary:
		return {"error": "Invalid server response", "status": response[1]}
	return parsed

func register_account(email: String, password: String, username: String) -> Dictionary:
	return await _authenticate(email, password, username, true)

func login(identifier: String, password: String) -> Dictionary:
	if identifier.contains("@"):
		return await _authenticate(identifier, password, "", false)
	return await _authenticate("", password, identifier, false)

func _authenticate(email: String, password: String, username: String, create: bool) -> Dictionary:
	if _auth_busy:
		return {"error": "An authentication request is already running", "status": 0}
	_auth_busy = true
	var path := "/v2/account/authenticate/email?create=" + ("true" if create else "false")
	if not username.is_empty():
		path += "&username=" + username.uri_encode()
	var result := await _request(HTTPClient.METHOD_POST, path, {"email": email, "password": password}, _basic_auth())
	if result.has("token"):
		disconnect_chat()
		token = str(result.token)
		refresh_token = str(result.get("refresh_token", ""))
	_auth_busy = false
	return result

func refresh_session() -> Dictionary:
	if _auth_busy or refresh_token.is_empty():
		return {"error": "Session cannot be refreshed now", "status": 0}
	_auth_busy = true
	var result := await _request(HTTPClient.METHOD_POST, "/v2/account/session/refresh", {"token": refresh_token}, _basic_auth())
	if result.has("token"):
		token = str(result.token)
		refresh_token = str(result.get("refresh_token", refresh_token))
	_auth_busy = false
	return result

func logout() -> Dictionary:
	if _auth_busy:
		return {"error": "An authentication request is already running", "status": 0}
	_auth_busy = true
	var old_token := token
	var old_refresh := refresh_token
	disconnect_chat()
	token = ""
	refresh_token = ""
	var result: Dictionary = {}
	if not old_token.is_empty():
		result = await _request(HTTPClient.METHOD_POST, "/v2/session/logout", {"token": old_token, "refresh_token": old_refresh}, "Bearer " + old_token)
	_auth_busy = false
	return result

func link_email(email: String, password: String) -> Dictionary:
	return await _request(HTTPClient.METHOD_POST, "/v2/account/link/email", {"email": email, "password": password}, "Bearer " + token)

func call_rpc(id: String, payload: Dictionary = {}) -> Dictionary:
	if token.is_empty():
		return {"error": "Login required", "status": 401}
	# Nakama REST RPC body is a JSON string containing the payload JSON.
	var result := await _request(HTTPClient.METHOD_POST, "/v2/rpc/" + id.uri_encode(), JSON.stringify(payload), "Bearer " + token)
	if result.has("error"):
		return result
	var decoded: Variant = JSON.parse_string(str(result.get("payload", "{}")))
	if not decoded is Dictionary:
		return {"error": "Invalid RPC response", "status": 0}
	return decoded

func get_account() -> Dictionary:
	return await _request(HTTPClient.METHOD_GET, "/v2/account", null, "Bearer " + token)

func list_friends(state: int = -1, cursor: String = "") -> Dictionary:
	var path := "/v2/friend?limit=30"
	if state >= 0:
		path += "&state=" + str(state)
	if not cursor.is_empty():
		path += "&cursor=" + cursor.uri_encode()
	return await _request(HTTPClient.METHOD_GET, path, null, "Bearer " + token)

func add_friend(user_id: String) -> Dictionary:
	# The same action accepts an incoming request.
	return await _request(HTTPClient.METHOD_POST, "/v2/friend?ids=" + user_id.uri_encode(), {}, "Bearer " + token)

func remove_friend(user_id: String) -> Dictionary:
	# Also cancels/rejects a request or unblocks a player; it does not re-add them.
	return await _request(HTTPClient.METHOD_DELETE, "/v2/friend?ids=" + user_id.uri_encode(), null, "Bearer " + token)

func block_player(user_id: String) -> Dictionary:
	return await _request(HTTPClient.METHOD_POST, "/v2/friend/block?ids=" + user_id.uri_encode(), {}, "Bearer " + token)

func connect_chat() -> Dictionary:
	if token.is_empty():
		return {"error": "Login required", "status": 401}
	disconnect_chat()
	_socket = WebSocketPeer.new()
	var socket := _socket
	var ws_url := base_url.trim_suffix("/").replace("https://", "wss://").replace("http://", "ws://")
	var error := socket.connect_to_url(ws_url + "/ws?format=json&status=true&token=" + token.uri_encode())
	if error != OK:
		return {"error": "Cannot start socket", "status": 0}
	var deadline := Time.get_ticks_msec() + 10000
	while _socket == socket and socket.get_ready_state() == WebSocketPeer.STATE_CONNECTING and Time.get_ticks_msec() < deadline:
		await get_tree().process_frame
	if _socket == socket and socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		_socket_open = true
		return {"ok": true}
	if _socket == socket:
		disconnect_chat()
	return {"error": "Socket connection failed or timed out", "status": 0}

func join_chat(type: String, target_id: String = "") -> Dictionary:
	var types := {"world": 1, "direct": 2, "group": 3}
	if not types.has(type):
		return {"error": "Invalid channel type", "status": 400}
	return await _socket_request({"channel_join": {"type": types[type], "target": "world:vi:1" if type == "world" else target_id, "persistence": true}})

func leave_chat(channel_id: String) -> Dictionary:
	return await _socket_request({"channel_leave": {"channel_id": channel_id}})

func send_chat(type: String, text: String, target_id: String = "") -> Dictionary:
	return await call_rpc("social_chat_send", {"type": type, "text": text, "targetId": target_id})

func chat_history(type: String, target_id: String = "", cursor: String = "") -> Dictionary:
	return await call_rpc("social_chat_history", {"type": type, "targetId": target_id, "cursor": cursor, "limit": 30})

func _socket_request(envelope: Dictionary) -> Dictionary:
	if _socket == null or _socket.get_ready_state() != WebSocketPeer.STATE_OPEN:
		return {"error": "Socket is not connected", "status": 0}
	_sequence += 1
	var cid := str(_sequence)
	var socket := _socket
	envelope["cid"] = cid
	_pending[cid] = true
	if socket.send_text(JSON.stringify(envelope)) != OK:
		_pending.erase(cid)
		return {"error": "Cannot send socket request", "status": 0}
	var deadline := Time.get_ticks_msec() + 10000
	while _socket == socket and socket.get_ready_state() == WebSocketPeer.STATE_OPEN and not _replies.has(cid) and Time.get_ticks_msec() < deadline:
		await get_tree().process_frame
	_pending.erase(cid)
	var result: Dictionary = _replies.get(cid, {"error": "Socket request interrupted or timed out", "status": 0})
	_replies.erase(cid)
	if result.has("error") and result.error is Dictionary:
		return {"error": str(result.error.get("message", "Socket request rejected")), "status": 0}
	return result

func disconnect_chat() -> void:
	if _socket != null:
		_socket.close()
	_socket = null
	_socket_open = false
	_pending.clear()
	_replies.clear()
	_ping_elapsed = 0.0

func _process(delta: float) -> void:
	if _socket == null:
		return
	var socket := _socket
	socket.poll()
	if socket.get_ready_state() == WebSocketPeer.STATE_CLOSED:
		if _socket_open:
			_socket_open = false
			socket_closed.emit()
		return
	if socket.get_ready_state() != WebSocketPeer.STATE_OPEN:
		return
	while _socket == socket and socket.get_available_packet_count() > 0:
		var value: Variant = JSON.parse_string(socket.get_packet().get_string_from_utf8())
		if not value is Dictionary:
			continue
		var cid := str(value.get("cid", ""))
		if _pending.has(cid):
			_replies[cid] = value
		if value.has("channel_message"):
			chat_message_received.emit(value.channel_message)
		if value.has("notifications"):
			for notification in value.notifications.get("notifications", []):
				notification_received.emit(notification)
	if _socket != socket:
		return
	_ping_elapsed += delta
	if _ping_elapsed >= 10.0:
		socket.send_text(JSON.stringify({"ping": {}}))
		_ping_elapsed = 0.0

func _exit_tree() -> void:
	disconnect_chat()
