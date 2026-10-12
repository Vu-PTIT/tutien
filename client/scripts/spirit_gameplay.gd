extends Control
## Playable human/beast slice, with real contracts and rewards through Nakama.
const Api = preload("res://scripts/nakama_api.gd")
const Field = preload("res://scripts/spirit_playfield.gd")
var api: Api
var field: Field
var online := false
var busy := false
var moving_request := false
var polling := false
var in_hunt := false
var sequence := 0
var move_timer := 0.0
var poll_timer := 0.0
var attack_ready := 0.0
var demo_hp := 100
var demo_xp := 0
var demo_loot := 0
var profile: Dictionary = {}
var contracts: Dictionary = {"active": null, "incoming": [], "outgoing": []}
var touch_direction := Vector2.ZERO
var ui: Dictionary = {}
var body: BoxContainer
var sidebar: ScrollContainer
var login_panel: Window

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	TranslationServer.set_locale("vi")
	var theme := Theme.new()
	theme.default_font = preload("res://assets/fonts/BeVietnamPro-Regular.ttf")
	theme.default_font_size = 16
	self.theme = theme
	api = Api.new()
	add_child(api)
	_build_ui()
	get_viewport().size_changed.connect(_resize)
	_resize()
	_refresh_labels()
	_message("Chọn hình dạng rồi thử đánh quái. Đăng nhập để lập khế ước và lưu phần thưởng.")

func _label(text: String, parent: Node, font_size: int = 16) -> Label:
	var label := Label.new()
	label.text = text
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_font_size_override("font_size", font_size)
	parent.add_child(label)
	return label

func _button(text: String, parent: Node, callback: Callable) -> Button:
	var button := Button.new()
	button.text = text
	button.focus_mode = Control.FOCUS_NONE
	button.custom_minimum_size.y = 44
	button.pressed.connect(callback)
	parent.add_child(button)
	return button

func _style(color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.set_corner_radius_all(12)
	style.content_margin_left = 14
	style.content_margin_right = 14
	style.content_margin_top = 12
	style.content_margin_bottom = 12
	return style

func _build_ui() -> void:
	var background := ColorRect.new()
	background.color = Color("122c30")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)
	var margins := MarginContainer.new()
	margins.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		margins.add_theme_constant_override("margin_" + side, 18)
	add_child(margins)
	var root := VBoxContainer.new()
	root.add_theme_constant_override("separation", 12)
	margins.add_child(root)
	var header := HBoxContainer.new()
	root.add_child(header)
	var title := _label("TU TIÊN / LINH THÚ & KHẾ ƯỚC", header, 23)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	ui.login = _button("Đăng nhập", header, _open_login)
	body = BoxContainer.new()
	body.add_theme_constant_override("separation", 14)
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(body)
	var play := VBoxContainer.new()
	play.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	play.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(play)
	ui.stats = _label("", play, 17)
	var frame := PanelContainer.new()
	frame.add_theme_stylebox_override("panel", _style(Color("254a43")))
	frame.size_flags_vertical = Control.SIZE_EXPAND_FILL
	play.add_child(frame)
	field = Field.new()
	field.custom_minimum_size = Vector2(300, 240)
	frame.add_child(field)
	var controls := HBoxContainer.new()
	play.add_child(controls)
	for direction in [Vector2.LEFT, Vector2.UP, Vector2.DOWN, Vector2.RIGHT]:
		var button := _button({Vector2.LEFT: "←", Vector2.UP: "↑", Vector2.DOWN: "↓", Vector2.RIGHT: "→"}[direction], controls, func(): pass)
		button.custom_minimum_size.x = 44
		button.button_down.connect(func(): touch_direction = direction)
		button.button_up.connect(func(): touch_direction = Vector2.ZERO)
	ui.attack = _button("Đánh [Space]", controls, func(): _attack(false))
	ui.skill = _button("Linh thuật [R]", controls, func(): _attack(true))
	_label("WASD / phím mũi tên: đi  •  E: tương tác  •  Săn chung: mỗi bên tự bấm tham gia", play, 13)
	sidebar = ScrollContainer.new()
	sidebar.custom_minimum_size.x = 320
	body.add_child(sidebar)
	var side := VBoxContainer.new()
	side.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	side.add_theme_constant_override("separation", 10)
	sidebar.add_child(side)
	ui.mode = _label("CHẾ ĐỘ THỬ", side, 15)
	_label("Nhân vật của bạn", side, 21)
	ui.human = _button("Người • Linh Trảm", side, func(): _select_form("human", "human"))
	ui.cat = _button("Mèo linh thú • Linh Trảo", side, func(): _select_form("spirit_beast", "cat"))
	ui.form_note = _label("Có thể đổi hình dạng khi chơi thử. Khi online, chọn một lần cho nhân vật.", side, 13)
	_label("Bạn đồng khế ước", side, 21)
	ui.contract_info = _label("Đăng nhập để mời một người chơi.", side, 14)
	ui.target = LineEdit.new()
	ui.target.placeholder_text = "Tên đăng nhập người muốn mời"
	side.add_child(ui.target)
	ui.invite = _button("Gửi lời mời khế ước", side, _invite)
	ui.refresh = _button("Làm mới lời mời", side, _refresh_contract)
	ui.invitations = VBoxContainer.new()
	side.add_child(ui.invitations)
	ui.start_hunt = _button("Tham gia săn chung", side, func(): _contract_action("contract_hunt_start"))
	ui.leave_hunt = _button("Rời trận săn / Về rừng", side, _leave_hunt)
	ui.claim = _button("Nhận phần thưởng săn", side, _claim)
	ui.release = _button("Kết thúc khế ước…", side, _confirm_release)
	ui.heal = _button("Nhận đồ khởi đầu", side, _starter)
	ui.message = _label("", root, 14)
	ui.message.custom_minimum_size.y = 42

func _resize() -> void:
	var narrow := get_viewport_rect().size.x < 900
	body.vertical = narrow
	sidebar.custom_minimum_size = Vector2(0, 200) if narrow else Vector2(320, 0)
	sidebar.size_flags_horizontal = Control.SIZE_EXPAND_FILL if narrow else Control.SIZE_FILL
	sidebar.size_flags_vertical = Control.SIZE_FILL if narrow else Control.SIZE_EXPAND_FILL
	field.zoom = 1.3 if narrow else 1.65

func _message(text: String) -> void:
	ui.message.text = text

func _result(result: Dictionary) -> bool:
	if result.has("error"):
		_message(str(result.error))
		return false
	if result.get("profile") is Dictionary:
		profile = result.profile
	_refresh_labels()
	return true

func _refresh_labels() -> void:
	var selected := online and bool(profile.get("form", {}).get("selected", false))
	if online:
		field.form = str(profile.get("form", {}).get("kind", "human"))
		ui.mode.text = "ONLINE • " + api.username
		ui.stats.text = "%s  •  %s  •  XP %d  •  Túi %d/24" % ["Mèo linh thú" if field.form == "spirit_beast" else "Người", str(profile.get("realm", "mortal")), int(profile.get("cultivationXp", 0)), profile.get("inventory", []).size()]
	else:
		ui.mode.text = "CHƠI THỬ • PHẦN THƯỞNG CHƯA LƯU"
		ui.stats.text = "%s  •  HP %d  •  XP thử %d  •  Vật liệu %d" % ["Mèo linh thú" if field.form == "spirit_beast" else "Người", demo_hp, demo_xp, demo_loot]
	ui.human.disabled = busy or selected
	ui.cat.disabled = busy or selected
	ui.login.text = "Đăng xuất" if online else "Đăng nhập"
	ui.login.disabled = busy
	ui.target.editable = online and not busy
	for key in ["invite", "refresh", "heal"]:
		ui[key].disabled = not online or busy
	ui.attack.disabled = busy or (online and not selected)
	ui.skill.disabled = ui.attack.disabled
	var active: Variant = contracts.get("active")
	ui.start_hunt.disabled = not online or busy or active == null
	ui.release.disabled = ui.start_hunt.disabled
	ui.leave_hunt.disabled = not online or busy or not in_hunt
	ui.claim.disabled = not online or busy or contracts.get("pendingReward") == null
	if active is Dictionary:
		ui.contract_info.text = "Đồng hành: %s\nGắn kết: %d\n%s" % [str(active.other.username), int(active.bond), _hunt_text(active.get("hunt"))]
	else:
		ui.contract_info.text = "Khế ước cần sự đồng ý của cả hai." if online else "Đăng nhập để mời một người chơi."

func _hunt_text(h: Variant) -> String:
	if not h is Dictionary:
		return "Cùng tham gia để bắt đầu săn."
	return {"waiting": "Đang chờ người còn lại tham gia.", "active": "Sơn Trư: %d/%d HP • Ra đòn luân phiên để phối hợp." % [int(h.mobHp), int(h.maxHp)], "victory": "Đã thắng! Mỗi người nhận phần thưởng riêng.", "abandoned": "Trận săn đã kết thúc.", "expired": "Trận săn đã hết thời gian.", "defeat": "Thử lại trong trận săn mới."}.get(str(h.phase), str(h.phase))

func _select_form(kind: String, species: String) -> void:
	if busy:
		return
	if not online:
		field.form = kind
		_refresh_labels()
		_message("Đã chọn " + ("mèo linh thú. Linh Trảo [R] để vồ quái." if kind == "spirit_beast" else "người. Linh Trảm [R] để đánh quái."))
		return
	busy = true
	_refresh_labels()
	var result: Dictionary = await api.request_rpc("character_select_form", {"operationId": api.operation_id(), "kind": kind, "speciesId": species})
	busy = false
	if _result(result):
		_message("Đã lưu hình dạng và linh thuật vào nhân vật.")
	_refresh_labels()

func _open_login() -> void:
	if online:
		api.logout()
		online = false
		in_hunt = false
		contracts = {"active": null, "incoming": [], "outgoing": []}
		var temporary := Field.new()
		field.geometry = temporary.geometry.duplicate(true)
		temporary.free()
		field.reset_demo()
		_refresh_labels()
		_message("Đã đăng xuất. Bạn đang ở chế độ thử.")
		return
	login_panel = Window.new()
	login_panel.title = "Tài khoản Tu Tiên"
	login_panel.size = Vector2i(460, 420)
	login_panel.min_size = Vector2i(320, 380)
	login_panel.transient = true
	login_panel.exclusive = true
	login_panel.theme = theme
	add_child(login_panel)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 18)
	login_panel.add_child(margin)
	var box := VBoxContainer.new()
	margin.add_child(box)
	var address := LineEdit.new()
	address.text = api.base_url
	box.add_child(address)
	var account := LineEdit.new()
	account.placeholder_text = "Tên đăng nhập (hoặc email khi đăng nhập)"
	box.add_child(account)
	var email := LineEdit.new()
	email.placeholder_text = "Email khi tạo tài khoản"
	box.add_child(email)
	var password := LineEdit.new()
	password.secret = true
	password.placeholder_text = "Mật khẩu (tạo mới: ít nhất 10 ký tự)"
	box.add_child(password)
	var create := CheckBox.new()
	create.text = "Tạo tài khoản mới"
	box.add_child(create)
	var feedback := _label("Chạy backend bằng docker compose up --build trước khi kết nối.", box, 14)
	var submit := _button("Kết nối", box, func(): pass)
	submit.pressed.connect(func():
		submit.disabled = true
		api.base_url = address.text.strip_edges()
		var result: Dictionary = await api.login(account.text.strip_edges(), password.text, create.button_pressed, email.text.strip_edges())
		password.clear()
		if result.has("error"):
			feedback.text = str(result.error)
			submit.disabled = false
			return
		online = true
		login_panel.hide()
		login_panel.queue_free()
		await _load_online()
	)
	login_panel.close_requested.connect(func():
		# Do not let an in-flight login authenticate behind a closed dialog.
		if not submit.disabled:
			login_panel.queue_free()
	)
	login_panel.popup_centered()

func _load_online() -> void:
	busy = true
	profile = await api.request_rpc("get_profile")
	if profile.has("error"):
		busy = false
		_result(profile)
		return
	var world: Dictionary = await api.request_rpc("world_get", {"preferredMapId": "m_truc_am"})
	if _result(world):
		_apply_world(world)
		var geometry: Dictionary = await api.request_rpc("world_map_get")
		if _result(geometry):
			field.geometry = geometry
	busy = false
	await _refresh_contract()
	_refresh_labels()
	_message("Đã kết nối. Chọn hình dạng hoặc mời bạn bằng tên đăng nhập.")

func _apply_world(world: Dictionary) -> void:
	if world.has("x"):
		field.player_position = Vector2(float(world.x), float(world.y))
	sequence = int(world.get("seq", sequence))
	if world.has("fieldMobs"):
		field.mobs = world.fieldMobs

func _process(delta: float) -> void:
	if field == null:
		return
	var direction := touch_direction
	var focus := get_viewport().gui_get_focus_owner()
	if not focus is LineEdit and not is_instance_valid(login_panel):
		direction += Vector2(float(Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT)) - float(Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT)), float(Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN)) - float(Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP)))
	if not busy and not in_hunt and (not online or not profile.has("error")):
		field.move_avatar(direction, minf(delta, 0.05))
	else:
		field.moving = false
	move_timer += delta
	poll_timer += delta
	if online and move_timer > 0.3 and field.moving and not moving_request and not busy and not in_hunt:
		move_timer = 0
		_sync_move()
	if online and poll_timer > 2.0 and not polling and not busy:
		poll_timer = 0
		_refresh_contract()
	if not online:
		for mob in field.mobs:
			if int(mob.hp) <= 0 and field.time >= float(mob.respawnAt):
				mob.hp = mob.maxHp

func _unhandled_key_input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo or is_instance_valid(login_panel):
		return
	if event.keycode == KEY_SPACE:
		_attack(false)
	elif event.keycode == KEY_R:
		_attack(true)
	elif event.keycode == KEY_E:
		_interact()

func _sync_move() -> bool:
	if moving_request:
		return false
	moving_request = true
	var destination: Vector2 = field.player_position
	var result: Dictionary = await api.request_rpc("world_move", {"x": destination.x, "y": destination.y, "seq": sequence + 1})
	moving_request = false
	if result.has("error"):
		var current: Dictionary = await api.request_rpc("world_get")
		if not current.has("error"):
			_apply_world(current)
		_message(str(result.error))
		return false
	sequence = int(result.seq)
	return true

func _attack(skill: bool) -> void:
	if busy or Time.get_ticks_msec() / 1000.0 < attack_ready:
		return
	if not online:
		var mob: Dictionary = field.nearest_mob()
		if mob.is_empty():
			_message("Tiến lại gần quái để ra đòn.")
			return
		var damage := 33 if skill else 15
		mob.hp = maxi(0, int(mob.hp) - damage)
		field.flash = 0.2
		attack_ready = Time.get_ticks_msec() / 1000.0 + (1.8 if skill else 0.7)
		if int(mob.hp) == 0:
			demo_xp += 10
			demo_loot += 1
			mob.respawnAt = field.time + 8.0
			_message("Hạ " + str(mob.name) + " • +10 XP thử • +1 vật liệu. Đăng nhập để chơi có lưu.")
		else:
			demo_hp = maxi(0, demo_hp - 6)
			_message(("Linh Trảo" if field.form == "spirit_beast" else "Linh Trảm") + " • " + str(damage) + " sát thương.")
			if demo_hp == 0:
				demo_hp = 100
				field.player_position = Vector2(640, 520)
				_message("Về điểm nghỉ và hồi phục. Tiếp tục thử đánh quái.")
		_refresh_labels()
		return
	if not bool(profile.get("form", {}).get("selected", false)):
		_message("Chọn hình dạng nhân vật trước.")
		return
	busy = true
	_refresh_labels()
	var result: Dictionary
	if in_hunt:
		var active: Dictionary = contracts.active
		result = await api.request_rpc("contract_hunt_attack", {"contractId": active.id, "huntId": active.hunt.id, "operationId": api.operation_id(), "skill": skill})
	else:
		while moving_request:
			await get_tree().process_frame
		if not await _sync_move():
			busy = false
			_refresh_labels()
			return
		var mob: Dictionary = field.nearest_mob()
		if mob.is_empty():
			busy = false
			_refresh_labels()
			_message("Tiến lại gần quái để ra đòn.")
			return
		var input := {"targetId": mob.id}
		if skill:
			input.skillId = profile.get("equippedSkills", {}).get("active_1", "")
		result = await api.request_rpc("world_attack", input)
	busy = false
	if _result(result):
		field.flash = 0.2
		attack_ready = Time.get_ticks_msec() / 1000.0 + (1.8 if skill else 0.7)
		if result.has("contract"):
			contracts.active = result.contract
			_apply_hunt()
			_message("%d sát thương%s" % [int(result.damage), " • Phối hợp khế ước!" if bool(result.combo) else ""])
			await _refresh_contract()
		else:
			_apply_world(result)
			_message(str(result.get("message", "Đã ra đòn.")))
	_refresh_labels()

func _interact() -> void:
	if not online or busy or in_hunt:
		return
	var target: Dictionary = {}
	for point in field.geometry.get("points", []):
		if field.player_position.distance_to(Vector2(float(point.x), float(point.y))) <= float(point.get("radius", 1.8)) * 32:
			target = point
			break
	if target.is_empty():
		_message("Tiến tới điểm màu vàng để tương tác.")
		return
	busy = true
	while moving_request:
		await get_tree().process_frame
	if not await _sync_move():
		busy = false
		_refresh_labels()
		return
	var result: Dictionary = await api.request_rpc("world_interact", {"entityId": target.id})
	if _result(result):
		_apply_world(result)
		var geometry: Dictionary = await api.request_rpc("world_map_get")
		if not geometry.has("error"):
			field.geometry = geometry
		_message(str(result.get("message", "Đã tương tác.")))
	busy = false
	_refresh_labels()

func _refresh_contract() -> void:
	if not online or polling:
		return
	polling = true
	var result: Dictionary = await api.request_rpc("contract_get")
	polling = false
	if not online or result.has("error"):
		if result.has("error"):
			_message(str(result.error))
		return
	contracts = result
	_apply_hunt()
	for child in ui.invitations.get_children():
		child.queue_free()
	for invitation in result.incoming:
		_label("Lời mời từ " + str(invitation.other.username), ui.invitations, 14)
		var row := HBoxContainer.new()
		ui.invitations.add_child(row)
		_button("Đồng ý", row, func(): _respond(invitation.id, true))
		_button("Từ chối", row, func(): _respond(invitation.id, false))
	for invitation in result.outgoing:
		_label("Đã mời " + str(invitation.other.username), ui.invitations, 14)
		_button("Rút lời mời", ui.invitations, func(): _contract_action("contract_release", invitation.id))
	_refresh_labels()

func _apply_hunt() -> void:
	var active: Variant = contracts.get("active")
	if not active is Dictionary or not active.get("hunt") is Dictionary:
		in_hunt = false
		field.hunt = {}
		return
	var h: Dictionary = active.hunt
	if str(h.phase) in ["waiting", "active"] and bool(h.get("joined", {}).get(api.user_id, false)):
		in_hunt = true
	if str(h.phase) in ["abandoned", "expired", "defeat"]:
		in_hunt = false
	field.hunt = h if in_hunt else {}
	field.partner_form = str(active.other.form.kind)
	field.partner_name = str(active.other.username)
	field.own_id = api.user_id
	field.partner_id = str(active.other.userId)

func _invite() -> void:
	if busy or not online:
		return
	busy = true
	_refresh_labels()
	var target: Dictionary = await api.request_rpc("social_find_player", {"username": ui.target.text.strip_edges()})
	if _result(target):
		var result: Dictionary = await api.request_rpc("contract_invite", {"operationId": api.operation_id(), "userId": target.userId})
		if _result(result):
			_message("Đã gửi lời mời. Người kia cần bấm đồng ý.")
	busy = false
	await _refresh_contract()
	_refresh_labels()

func _respond(id: String, accept: bool) -> void:
	if busy:
		return
	busy = true
	var result: Dictionary = await api.request_rpc("contract_respond", {"contractId": id, "accept": accept})
	busy = false
	if _result(result):
		_message("Đã lập khế ước." if accept else "Đã từ chối lời mời.")
	await _refresh_contract()

func _contract_action(name: String, id: String = "") -> void:
	if busy or not online:
		return
	if id.is_empty():
		if not contracts.get("active") is Dictionary:
			return
		id = str(contracts.active.id)
	busy = true
	_refresh_labels()
	var result: Dictionary = await api.request_rpc(name, {"contractId": id})
	busy = false
	if _result(result):
		_message("Đã tham gia. Đợi người còn lại bấm tham gia để đánh quái." if name == "contract_hunt_start" else "Đã kết thúc khế ước / lời mời.")
	await _refresh_contract()
	_refresh_labels()

func _confirm_release() -> void:
	var dialog := ConfirmationDialog.new()
	dialog.dialog_text = "Kết thúc khế ước với người này?\nNhân vật, tiến trình và đồ của mỗi người được giữ lại."
	dialog.confirmed.connect(func(): _contract_action("contract_release"))
	dialog.canceled.connect(dialog.queue_free)
	dialog.confirmed.connect(dialog.queue_free)
	add_child(dialog)
	dialog.popup_centered()

func _leave_hunt() -> void:
	if busy or not in_hunt:
		return
	busy = true
	var active: Dictionary = contracts.active
	var result: Dictionary = await api.request_rpc("contract_hunt_leave", {"contractId": active.id, "huntId": active.hunt.id})
	busy = false
	if _result(result):
		in_hunt = false
		field.hunt = {}
		_message("Đã về rừng. Khế ước vẫn còn hiệu lực.")
	await _refresh_contract()

func _claim() -> void:
	if busy or not online:
		return
	busy = true
	_refresh_labels()
	var result: Dictionary = await api.request_rpc("contract_hunt_claim")
	busy = false
	if _result(result):
		in_hunt = false
		field.hunt = {}
		_message("Đã nhận phần thưởng vào túi của bạn.")
	await _refresh_contract()
	_refresh_labels()

func _starter() -> void:
	if busy or not online:
		return
	busy = true
	var result: Dictionary = await api.request_rpc("inventory_claim_starter", {"operationId": "spirit_demo_starter_v1"})
	busy = false
	if _result(result):
		_message("Đã nhận đồ khởi đầu. Mỗi nhân vật nhận một lần.")
	_refresh_labels()
