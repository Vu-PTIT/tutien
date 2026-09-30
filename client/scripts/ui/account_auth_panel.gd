class_name AccountAuthPanel
extends Control

signal auth_completed(device_id: String, account_user: Dictionary)
signal continue_offline

var _api: SocialApi
var _device_id: String = ""
var _current_user: Dictionary = {}
var _account_context: bool = false
var _mobile: bool = false
var _state: String = "home"
var _busy: bool = false
var _notice: String = ""
var _fields: Dictionary = {}

var _card: PanelContainer
var _title: Label
var _subtitle: Label
var _status: Label
var _body: VBoxContainer
var _actions: VBoxContainer

func _ready() -> void:
	theme = load("res://themes/tutien_theme.tres")
	_build_ui()
	resized.connect(_update_geometry)
	hide()

func configure(api: SocialApi, device_id: String, mobile: bool = false) -> void:
	_api = api
	_device_id = device_id
	_mobile = mobile or OS.has_feature("mobile")

func open_entry(api: SocialApi, device_id: String, mobile: bool = false) -> void:
	configure(api, device_id, mobile)
	_account_context = false
	_current_user.clear()
	_notice = ""
	_set_state("home")
	show()
	grab_focus()

func open_account(api: SocialApi, device_id: String, account_data: Dictionary, mobile: bool = false) -> void:
	configure(api, device_id, mobile)
	_account_context = true
	_current_user = account_data.duplicate(true)
	_notice = ""
	_set_state("account")
	show()
	grab_focus()

func has_text_input_focus() -> bool:
	var focus_owner := get_viewport().gui_get_focus_owner()
	return focus_owner is LineEdit or focus_owner is TextEdit

func _build_ui() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	focus_mode = Control.FOCUS_ALL

	var shade := ColorRect.new()
	shade.name = "Shade"
	shade.color = Color(0.035, 0.075, 0.09, 0.94)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	shade.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(shade)

	_card = PanelContainer.new()
	_card.name = "Card"
	_card.anchor_left = 0.5
	_card.anchor_top = 0.5
	_card.anchor_right = 0.5
	_card.anchor_bottom = 0.5
	_card.mouse_filter = Control.MOUSE_FILTER_STOP
	var card_style := StyleBoxFlat.new()
	card_style.bg_color = Color("13282e")
	card_style.border_color = Color("b68c50")
	card_style.border_width_left = 2
	card_style.border_width_top = 2
	card_style.border_width_right = 2
	card_style.border_width_bottom = 2
	card_style.content_margin_left = 12.0
	card_style.content_margin_top = 12.0
	card_style.content_margin_right = 12.0
	card_style.content_margin_bottom = 12.0
	_card.add_theme_stylebox_override("panel", card_style)
	add_child(_card)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 10)
	margin.add_theme_constant_override("margin_top", 8)
	margin.add_theme_constant_override("margin_right", 10)
	margin.add_theme_constant_override("margin_bottom", 8)
	_card.add_child(margin)

	var column := VBoxContainer.new()
	column.name = "Column"
	column.add_theme_constant_override("separation", 6)
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	column.size_flags_vertical = Control.SIZE_EXPAND_FILL
	margin.add_child(column)

	_title = _make_label("TU TIÊN", &"UIHeading")
	_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_title.add_theme_color_override("font_color", Color("f0d493"))
	_title.custom_minimum_size.y = 24.0
	column.add_child(_title)

	_subtitle = _make_label("Hành trình của bạn bắt đầu từ đây.", &"UIBody")
	_subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_subtitle.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_subtitle.custom_minimum_size.y = 30.0
	column.add_child(_subtitle)

	_status = _make_label("", &"UISmall")
	_status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_status.custom_minimum_size.y = 18.0
	_status.add_theme_color_override("font_color", Color("e7c783"))
	column.add_child(_status)

	var scroll := ScrollContainer.new()
	scroll.name = "FormScroll"
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	column.add_child(scroll)

	_body = VBoxContainer.new()
	_body.name = "FormBody"
	_body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_body.add_theme_constant_override("separation", 7)
	scroll.add_child(_body)

	_actions = VBoxContainer.new()
	_actions.name = "Actions"
	_actions.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_actions.add_theme_constant_override("separation", 6)
	column.add_child(_actions)
	_update_geometry()

func _make_label(value: String, variation: StringName) -> Label:
	var label := Label.new()
	label.text = tr(value)
	label.theme_type_variation = variation
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return label

func _user_info() -> Dictionary:
	var user: Variant = _current_user.get("user", {})
	return user if user is Dictionary else {}

func _account_email() -> String:
	return str(_current_user.get("email", _user_info().get("email", "")))

func _account_id() -> String:
	return str(_user_info().get("id", ""))

func _make_button(value: String, callback: Callable, primary: bool = false) -> Button:
	var button := Button.new()
	button.text = tr(value)
	button.theme_type_variation = &"UIButtonSmall"
	button.custom_minimum_size = Vector2(0.0, 42.0 if _mobile else 38.0)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.pressed.connect(callback)
	if primary:
		button.add_theme_color_override("font_color", Color("f0d493"))
	return button

func _add_action(value: String, callback: Callable, primary: bool = false) -> void:
	_actions.add_child(_make_button(value, callback, primary))

func _add_field(key: String, placeholder: String, secret: bool = false) -> LineEdit:
	var edit := LineEdit.new()
	edit.name = key.capitalize().replace(" ", "")
	edit.placeholder_text = tr(placeholder)
	edit.custom_minimum_size.y = 42.0 if _mobile else 38.0
	edit.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	edit.clear_button_enabled = true
	edit.secret = secret
	edit.secret_character = "●"
	edit.theme_type_variation = &"UIChatEntryMobile" if _mobile else &"UIChatEntry"
	if _state == "login" and key == "password":
		edit.text_submitted.connect(func(_value: String) -> void: _on_login_pressed())
	elif _state == "register" and key == "confirm":
		edit.text_submitted.connect(func(_value: String) -> void: _on_register_pressed())
	_body.add_child(edit)
	_fields[key] = edit
	return edit

func _add_show_password() -> void:
	var toggle := CheckButton.new()
	toggle.text = tr("Hiện mật khẩu")
	toggle.theme_type_variation = &"UIButtonSmall"
	toggle.toggled.connect(_on_show_password_toggled)
	_body.add_child(toggle)

func _add_note(value: String) -> void:
	var label := _make_label(value, &"UIMicro")
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_color_override("font_color", Color("b9c7bd"))
	_body.add_child(label)

func _clear_children(container: Node) -> void:
	for child in container.get_children():
		container.remove_child(child)
		child.queue_free()

func _set_state(next_state: String, clear_notice: bool = true) -> void:
	_state = next_state
	if clear_notice:
		_notice = ""
	_fields.clear()
	_clear_children(_body)
	_clear_children(_actions)
	_status.text = tr(_notice)
	_status.visible = not _notice.is_empty()

	match _state:
		"home":
			_title.text = tr("TU TIÊN")
			_subtitle.text = tr("Đăng nhập để tiếp tục hành trình trên PC và mobile.")
			_add_note("Tài khoản chơi thử sẽ lưu tiến trình trên thiết bị này. Bạn có thể liên kết email sau.")
			_add_action("Đăng nhập", _set_state.bind("login"), true)
			_add_action("Tạo tài khoản", _set_state.bind("register"))
			_add_action("Chơi thử", _on_guest_pressed)
			_add_action("Chơi ngoại tuyến", _continue_offline_pressed)
		"login":
			_title.text = tr("ĐĂNG NHẬP")
			_subtitle.text = tr("Dùng email hoặc tên người chơi cùng mật khẩu.")
			_add_field("identifier", "Email hoặc tên người chơi")
			_add_field("password", "Mật khẩu", true)
			_add_show_password()
			_add_action("Đăng nhập", _on_login_pressed, true)
			_add_action("Quay lại", _go_back)
		"register":
			_title.text = tr("TẠO TÀI KHOẢN")
			_subtitle.text = tr("Dùng cùng một tài khoản để chơi trên PC và mobile.")
			_add_field("username", "Tên người chơi • 3–20 chữ, số hoặc _")
			_add_field("email", "Email")
			_add_field("password", "Mật khẩu • tối thiểu 10 ký tự", true)
			_add_field("confirm", "Nhập lại mật khẩu", true)
			_add_show_password()
			_add_note("Bản thử nghiệm chưa có xác minh email hoặc khôi phục mật khẩu.")
			_add_action("Tạo tài khoản", _on_register_pressed, true)
			_add_action("Quay lại", _go_back)
		"account":
			_title.text = tr("TÀI KHOẢN")
			var username := str(_user_info().get("username", ""))
			var email := _account_email()
			var account_label := tr("Tên người chơi: %s") % (username if not username.is_empty() else tr("Chưa đặt"))
			_body.add_child(_make_label(account_label, &"UIBody"))
			if email.is_empty():
				_subtitle.text = tr("Đang chơi bằng tài khoản thiết bị.")
				_add_note("Liên kết email và mật khẩu để có thể đăng nhập tài khoản này trên thiết bị khác.")
				_add_action("Liên kết email", _set_state.bind("register"), true)
			else:
				_subtitle.text = tr("Tài khoản đã liên kết email.")
				_body.add_child(_make_label(tr("Email: %s") % email, &"UIBody"))
			_add_action("Đổi tài khoản", _begin_account_switch)
			_add_action("Đóng", hide)
		_update_geometry()
		return
		_:
			_state = "home"
			_set_state("home")
			return
	_update_geometry()
	_focus_first_field.call_deferred()

func _focus_first_field() -> void:
	var key := "identifier" if _state == "login" else "username" if _state == "register" else ""
	if not key.is_empty() and _fields.has(key):
		(_fields[key] as LineEdit).grab_focus()

func _go_back() -> void:
	if _account_context:
		_set_state("account")
	else:
		_set_state("home")

func _begin_account_switch() -> void:
	if _account_email().is_empty():
		_notice = "Đây là tài khoản chơi thử. Hãy liên kết email trước khi đổi để tránh mất quyền truy cập."
	else:
		_notice = "Sau khi đăng nhập tài khoản khác, tiến trình hiện tại sẽ vẫn nằm trong tài khoản cũ."
	_set_state("login", false)

func _on_show_password_toggled(pressed: bool) -> void:
	for key in ["password", "confirm"]:
		if _fields.has(key):
			(_fields[key] as LineEdit).secret = not pressed

func _field_text(key: String) -> String:
	if not _fields.has(key):
		return ""
	return (_fields[key] as LineEdit).text

func _validate_password(password: String) -> bool:
	return password.length() >= 10 and password.to_utf8_buffer().size() <= 72

func _valid_username(username: String) -> bool:
	var regex := RegEx.new()
	regex.compile("^[A-Za-z0-9_]{3,20}$")
	return regex.search(username) != null

func _valid_email(email: String) -> bool:
	return email.length() >= 10 and email.length() <= 254 and email.contains("@") and email.get_slice("@", 1).contains(".") and not email.contains(" ")

func _on_guest_pressed() -> void:
	if _busy or _api == null:
		return
	_set_busy(true, "Đang kết nối máy chủ…")
	var candidate := _device_id if not _device_id.is_empty() else _new_device_id()
	var result: Dictionary = await _api.login_device(candidate)
	if result.has("error"):
		_show_error(result, "Không thể tạo tài khoản chơi thử.")
		_set_busy(false)
		return
	_device_id = candidate
	await _finish_authentication()

func _continue_offline_pressed() -> void:
	continue_offline.emit()
	hide()

func _on_login_pressed() -> void:
	if _busy or _api == null:
		return
	var identifier := _field_text("identifier").strip_edges()
	var password := _field_text("password")
	if identifier.is_empty() or password.is_empty():
		_set_notice("Nhập email hoặc tên người chơi và mật khẩu.")
		return
	_set_busy(true, "Đang đăng nhập…")
	var old_device_id := _device_id
	var old_user_id := _account_id()
	var result: Dictionary = await _api.login(identifier, password)
	if result.has("error"):
		_show_error(result, "Không thể đăng nhập.", true)
		_set_busy(false)
		return
	var account_result: Dictionary = await _api.get_account()
	if account_result.has("error") or not account_result.has("user"):
		_show_error(account_result, "Đăng nhập được nhưng chưa tải được hồ sơ tài khoản.")
		_set_busy(false)
		return
	var account_user: Dictionary = account_result.user
	var target_user_id := str(account_user.get("id", ""))
	var candidate_device_id := old_device_id
	if candidate_device_id.is_empty() or (_account_context and not old_user_id.is_empty() and target_user_id != old_user_id):
		candidate_device_id = _new_device_id()
	if target_user_id != old_user_id or old_user_id.is_empty():
		var link_result: Dictionary = await _api.link_device(candidate_device_id)
		if link_result.has("error") and int(link_result.get("status", 0)) == 409:
			candidate_device_id = _new_device_id()
			link_result = await _api.link_device(candidate_device_id)
		if link_result.has("error"):
			if _account_context and not old_device_id.is_empty():
				var restore: Dictionary = await _api.login_device(old_device_id)
				if not restore.has("error"):
					await _api.connect_chat()
					if _api is CombatApi:
						var combat_api := _api as CombatApi
						if not combat_api.match_id.is_empty():
							await combat_api.rejoin_current_match()
			_show_error(link_result, "Không thể ghi nhớ tài khoản trên thiết bị này.")
			_set_busy(false)
			return
	_device_id = candidate_device_id
	await _finish_authentication(account_result)

func _on_register_pressed() -> void:
	if _busy or _api == null:
		return
	var username := _field_text("username").strip_edges()
	var email := _field_text("email").strip_edges().to_lower()
	var password := _field_text("password")
	var confirmation := _field_text("confirm")
	if not _valid_username(username):
		_set_notice("Tên người chơi cần có 3–20 ký tự: chữ cái tiếng Anh số hoặc _.")
		return
	if not _valid_email(email):
		_set_notice("Nhập email hợp lệ để đăng ký.")
		return
	if not _validate_password(password):
		_set_notice("Mật khẩu cần dài ít nhất 10 ký tự và tối đa 72 byte UTF-8.")
		return
	if password != confirmation:
		_set_notice("Hai mật khẩu chưa trùng nhau.")
		return
	_set_busy(true, "Đang tạo tài khoản…")
	var result: Dictionary
	var link_guest := _account_context and _account_email().is_empty()
	if not _account_context and not _device_id.is_empty():
		var device_login: Dictionary = await _api.login_device(_device_id)
		if device_login.has("error"):
			_show_error(device_login, "Không tải được tài khoản đang lưu trên thiết bị.")
			_set_busy(false)
			return
		var device_account: Dictionary = await _api.get_account()
		if device_account.has("error") or not device_account.has("user"):
			_show_error(device_account, "Không tải được tài khoản đang lưu trên thiết bị.")
			_set_busy(false)
			return
		_current_user = device_account.duplicate(true)
		_account_context = true
		if not _account_email().is_empty():
			_notice = "Thiết bị đã liên kết tài khoản. Hãy đăng nhập để đổi sang tài khoản khác."
			_set_state("login", false)
			_set_busy(false)
			return
		link_guest = true
	if link_guest:
		result = await _api.update_account(username, username)
		if not result.has("error"):
			result = await _api.link_email(email, password)
	else:
		result = await _api.register_account(email, password, username)
		if not result.has("error"):
			var candidate := _device_id if not _device_id.is_empty() else _new_device_id()
			if _account_context:
				candidate = _new_device_id()
			var linked: Dictionary = await _api.link_device(candidate)
			if linked.has("error") and int(linked.get("status", 0)) == 409:
				candidate = _new_device_id()
				linked = await _api.link_device(candidate)
			if linked.has("error"):
				_notice = "Tài khoản đã tạo; đăng nhập để thử ghi nhớ thiết bị."
				_set_state("login", false)
				_set_busy(false)
				return
			_device_id = candidate
	if result.has("error"):
		_show_error(result, "Không thể tạo tài khoản.")
		_set_busy(false)
		return
	await _finish_authentication()

func _finish_authentication(account_data: Dictionary = {}) -> void:
	var final_account := account_data
	if final_account.is_empty():
		var result: Dictionary = await _api.get_account()
		if result.has("error") or not result.has("user"):
			_show_error(result, "Đăng nhập được nhưng chưa tải được tài khoản.")
			_set_busy(false)
			return
		final_account = result
	_current_user = final_account.duplicate(true)
	_account_context = true
	_set_busy(false)
	_notice = ""
	auth_completed.emit(_device_id, _current_user.duplicate(true))
	hide()

func _set_notice(message: String) -> void:
	_notice = message
	_status.text = tr(message)
	_status.visible = true

func _set_busy(value: bool, message: String = "") -> void:
	_busy = value
	for child in _actions.get_children():
		if child is Button:
			(child as Button).disabled = value
	if not message.is_empty():
		_status.text = tr(message)
		_status.visible = true

func _show_error(result: Dictionary, fallback: String, invalid_credentials: bool = false) -> void:
	var status_code := int(result.get("status", 0))
	var message := fallback
	if status_code == 0:
		message = "Không kết nối được máy chủ. Hãy thử lại sau."
	elif status_code == 401 and invalid_credentials:
		message = "Email hoặc tên người chơi hoặc mật khẩu chưa đúng."
	elif status_code == 409:
		message = "Email tên người chơi hoặc thiết bị đã được liên kết. Hãy đăng nhập hoặc chọn tên khác."
	_set_notice(message)

func _new_device_id() -> String:
	return Crypto.new().generate_random_bytes(24).hex_encode()

func _update_geometry() -> void:
	if _card == null:
		return
	var viewport_size := get_viewport_rect().size
	var desired_width := 460.0
	var desired_height := 310.0
	match _state:
		"login": desired_height = 324.0
		"register": desired_height = 342.0
		"account": desired_height = 320.0
		"home": desired_height = 342.0
	var card_width := minf(desired_width, maxf(viewport_size.x - 20.0, 260.0))
	var card_height := minf(desired_height, maxf(viewport_size.y - 16.0, 240.0))
	_card.custom_minimum_size = Vector2(card_width, card_height)
	_card.offset_left = -card_width / 2.0
	_card.offset_top = -card_height / 2.0
	_card.offset_right = card_width / 2.0
	_card.offset_bottom = card_height / 2.0
