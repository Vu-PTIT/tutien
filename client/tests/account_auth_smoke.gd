extends SceneTree
## Offline UI contract check: godot --headless --path client --script res://tests/account_auth_smoke.gd

const AuthScene = preload("res://scenes/ui/account_auth_panel.tscn")
var failures: int = 0

func _initialize() -> void:
	_run.call_deferred()

func _check(condition: bool, message: String) -> void:
	if not condition:
		failures += 1
		push_error(message)

func _run() -> void:
	var panel := AuthScene.instantiate() as AccountAuthPanel
	root.add_child(panel)
	await process_frame

	panel.open_entry(null, "", false)
	_check(panel.visible and panel._state == "home", "First launch opens the account entry screen")
	_check(panel._actions.get_child_count() == 4, "Entry screen offers sign-in, account creation, guest and offline play")

	panel._set_state("login")
	_check(panel._fields.has("identifier") and panel._fields.has("password"), "Sign-in screen accepts email/name and password")
	panel._set_state("register")
	_check(panel._fields.has("username") and panel._fields.has("email") and
		panel._fields.has("password") and panel._fields.has("confirm"), "Registration screen exposes all required fields")
	_check(panel._valid_username("dao_huu") and not panel._valid_username("tên tu sĩ"), "Player name validation matches the server format")
	_check(panel._valid_email("dao.huu@example.com") and not panel._valid_email("invalid"), "Email field rejects malformed values")
	_check(panel._validate_password("A-long-password-123") and not panel._validate_password("short"), "Password validation matches the server minimum")

	panel.open_account(null, "device-id", {"user": {"id": "guest-user", "username": "guest"}, "email": ""})
	_check(panel._state == "account" and panel._account_email().is_empty(), "Guest account screen offers account linking")
	panel.open_account(null, "device-id", {"user": {"id": "player-user", "username": "dao_huu"}, "email": "dao.huu@example.com"})
	_check(panel._account_email() == "dao.huu@example.com", "Account screen reads the private email from the Nakama account response")

	panel.queue_free()
	await process_frame
	if failures == 0:
		print("PASS account UI smoke: entry, sign-in, registration, validation, guest linking and registered account")
	quit(0 if failures == 0 else 1)
