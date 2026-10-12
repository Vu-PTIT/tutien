extends Node
## Small REST adapter for the gameplay slice. Tokens/passwords are never saved.
var base_url := "http://127.0.0.1:7350"
var server_key := "local-dev-key"
var token := ""
var user_id := ""
var username := ""
var generation := 0

func operation_id() -> String:
	return Crypto.new().generate_random_bytes(16).hex_encode()

func _request(path: String, body: String, authorization: String, method: int = HTTPClient.METHOD_POST) -> Dictionary:
	var request := HTTPRequest.new()
	request.timeout = 8.0
	request.body_size_limit = 2097152
	add_child(request)
	var headers := PackedStringArray(["Content-Type: application/json", "Authorization: " + authorization])
	var started := request.request(base_url.trim_suffix("/") + path, headers, method, body)
	if started != OK:
		request.queue_free()
		return {"error": "Không thể bắt đầu kết nối.", "code": started}
	var response: Array = await request.request_completed
	request.queue_free()
	if int(response[0]) != HTTPRequest.RESULT_SUCCESS:
		return {"error": "Không kết nối được máy chủ. Kiểm tra địa chỉ và backend.", "code": 14}
	var parsed: Variant = JSON.parse_string((response[3] as PackedByteArray).get_string_from_utf8())
	if not parsed is Dictionary:
		return {"error": "Máy chủ trả dữ liệu không hợp lệ.", "code": 13}
	if int(response[1]) < 200 or int(response[1]) >= 300:
		return {"error": str(parsed.get("message", "Yêu cầu thất bại.")), "code": parsed.get("code", 13)}
	return parsed

func login(account: String, password: String, create: bool, email: String = "") -> Dictionary:
	var suffix := "?create=" + ("true" if create else "false")
	var credentials := {"password": password, "email": email if create else (account if "@" in account else "")}
	if create or not "@" in account:
		suffix += "&username=" + account.uri_encode()
	var result: Dictionary = await _request("/v2/account/authenticate/email" + suffix, JSON.stringify(credentials), "Basic " + Marshalls.utf8_to_base64(server_key + ":"))
	if result.has("error"):
		return result
	generation += 1
	token = str(result.get("token", ""))
	var profile: Dictionary = await _request("/v2/account", "", "Bearer " + token, HTTPClient.METHOD_GET)
	if profile.has("error"):
		logout()
		return profile
	user_id = str(profile.get("user", {}).get("id", ""))
	username = str(profile.get("user", {}).get("username", account))
	if user_id.is_empty():
		logout()
		return {"error": "Thiếu danh tính tài khoản."}
	return {"userId": user_id, "username": username}

func request_rpc(name: String, input: Dictionary = {}) -> Dictionary:
	if token.is_empty():
		return {"error": "Hãy đăng nhập để dùng chức năng này.", "code": 16}
	var stamp := generation
	var response: Dictionary = await _request("/v2/rpc/" + name, JSON.stringify(JSON.stringify(input)), "Bearer " + token)
	if stamp != generation:
		return {"error": "Phiên đăng nhập đã thay đổi.", "code": 16}
	if response.has("error"):
		return response
	var decoded: Variant = JSON.parse_string(str(response.get("payload", "")))
	if not decoded is Dictionary:
		return {"error": "RPC trả dữ liệu không hợp lệ.", "code": 13}
	return decoded

func logout() -> void:
	generation += 1
	token = ""
	user_id = ""
	username = ""
