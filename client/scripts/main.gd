extends Node2D

const SPEED: float = 180.0
var player_position := Vector2(480, 300)
var status_label: Label
var connect_button: Button
var http: HTTPRequest
var token: String = ""
var device_id: String = ""

func _ready() -> void:
	RenderingServer.set_default_clear_color(Color("142a29"))
	var title := Label.new()
	title.text = "TU TIEN | Prototype\nWASD / Arrow keys: move"
	title.position = Vector2(24, 16)
	add_child(title)
	status_label = Label.new()
	status_label.position = Vector2(24, 470)
	status_label.text = "Offline prototype"
	add_child(status_label)
	connect_button = Button.new()
	connect_button.text = "Connect local backend"
	connect_button.position = Vector2(700, 20)
	connect_button.pressed.connect(_connect_backend)
	add_child(connect_button)
	http = HTTPRequest.new()
	http.timeout = 10.0
	add_child(http)
	var config := ConfigFile.new()
	config.load("user://identity.cfg")
	device_id = str(config.get_value("auth", "device_id", ""))
	if device_id.is_empty():
		device_id = Crypto.new().generate_random_bytes(24).hex_encode()
		config.set_value("auth", "device_id", device_id)
		config.save("user://identity.cfg")

func _process(delta: float) -> void:
	var direction := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	if Input.is_physical_key_pressed(KEY_A): direction.x -= 1
	if Input.is_physical_key_pressed(KEY_D): direction.x += 1
	if Input.is_physical_key_pressed(KEY_W): direction.y -= 1
	if Input.is_physical_key_pressed(KEY_S): direction.y += 1
	player_position += direction.limit_length() * SPEED * delta
	player_position = player_position.clamp(Vector2(40, 110), Vector2(920, 440))
	queue_redraw()

func _draw() -> void:
	for x in range(24, 960, 32):
		for y in range(96, 460, 32):
			draw_rect(Rect2(x, y, 30, 30), Color("23453c"))
	draw_circle(player_position + Vector2(0, 13), 14, Color("102c28"))
	draw_rect(Rect2(player_position - Vector2(9, 4), Vector2(18, 24)), Color("70b9ba"))
	draw_circle(player_position - Vector2(0, 7), 9, Color("ead3ae"))

func _request(path: String, authorization: String, payload: String) -> Dictionary:
	var headers := PackedStringArray(["Content-Type: application/json", "Authorization: " + authorization])
	var error := http.request("http://127.0.0.1:7350" + path, headers, HTTPClient.METHOD_POST, payload)
	if error != OK:
		return {"error": "Cannot start HTTP request"}
	var response: Array = await http.request_completed
	if response[0] != HTTPRequest.RESULT_SUCCESS or response[1] != 200:
		return {"error": "Backend unavailable or request rejected (HTTP %s)" % response[1]}
	var parsed: Variant = JSON.parse_string(response[3].get_string_from_utf8())
	if not parsed is Dictionary:
		return {"error": "Invalid backend response"}
	return parsed

func _connect_backend() -> void:
	connect_button.disabled = true
	status_label.text = "Connecting..."
	var auth: Dictionary = await _request("/v2/account/authenticate/device?create=true", "Basic " + Marshalls.utf8_to_base64("local-dev-key:"), JSON.stringify({"id": device_id}))
	if auth.has("error") or not auth.has("token"):
		status_label.text = str(auth.get("error", "Missing session token"))
		connect_button.disabled = false
		return
	token = str(auth["token"])
	var result: Dictionary = await _request("/v2/rpc/get_profile", "Bearer " + token, JSON.stringify("{}"))
	if result.has("error"):
		status_label.text = str(result["error"])
	else:
		status_label.text = "Online profile: " + str(result.get("payload", ""))
	connect_button.disabled = false
