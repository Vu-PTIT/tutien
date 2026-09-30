class_name SocialPanel
extends Panel
## Player-facing friends, chat, and player-created sect/guild controls.
## All mutations and permissions are enforced by SocialApi on the server.

const Typography = preload("res://scripts/ui/social_typography.gd")

var api: SocialApi
var user_id: String = ""
var username: String = ""
var friends: Array[Dictionary] = []
var groups: Array[Dictionary] = []
var my_groups: Array[Dictionary] = []
var showing_my_groups: bool = true
var current_group_kind: String = "sect"
var selected_group: Dictionary = {}
var searched_player: Dictionary = {}
var current_page: String = "friends"
var touch_layout_enabled: bool = false
var chat_type: String = "world"
var chat_target_id: String = ""
var chat_target_name: String = "Thế giới"
var active_channel_id: String = ""
var _conversation_generation: int = 0
var _chat_loading: bool = false
var _conversation_reload_pending: bool = false
var _seen_messages: Dictionary = {}
var _loading: bool = false
var _refresh_had_error: bool = false
var _language_manager: Variant

func _ready() -> void:
	_language_manager = get_node_or_null("/root/LanguageManager")
	visible = false
	$Close.pressed.connect(func() -> void: hide())
	$FriendsTab.pressed.connect(func() -> void: show_page("friends"))
	$ChatTab.pressed.connect(func() -> void:
		show_page("chat")
		if chat_type.is_empty():
			_open_world_chat()
	)
	$GroupsTab.pressed.connect(func() -> void: show_page("groups"))
	$Refresh.pressed.connect(_refresh_active_page)
	$PageHost/FriendsPage/FindButton.pressed.connect(_search_player)
	$PageHost/FriendsPage/FindName.text_submitted.connect(_search_player)
	$PageHost/FriendsPage/SearchResult/Invite.pressed.connect(_invite_searched_player)
	$PageHost/ChatPage/Send.pressed.connect(_send_message)
	$PageHost/ChatPage/ChatEntry.text_submitted.connect(_send_message)
	$PageHost/GroupsPage/Mine.pressed.connect(func() -> void:
		showing_my_groups = true
		_refresh_groups.call_deferred()
	)
	$PageHost/GroupsPage/Browse.pressed.connect(func() -> void:
		showing_my_groups = false
		_refresh_groups.call_deferred()
	)
	$PageHost/GroupsPage/Sect.pressed.connect(func() -> void:
		current_group_kind = "sect"
		_refresh_groups.call_deferred()
	)
	$PageHost/GroupsPage/Guild.pressed.connect(func() -> void:
		current_group_kind = "guild"
		_refresh_groups.call_deferred()
	)
	$PageHost/GroupsPage/GroupRefresh.pressed.connect(_refresh_groups)
	$PageHost/GroupsPage/GroupSearch.pressed.connect(_refresh_groups)
	$PageHost/GroupsPage/GroupQuery.text_submitted.connect(func(_value: String) -> void: _refresh_groups.call_deferred())
	$PageHost/GroupsPage/GroupAction.pressed.connect(_perform_group_action)
	$PageHost/GroupsPage/GroupMembers.pressed.connect(_show_group_members)
	$PageHost/GroupsPage/GroupDetails/GroupRequests.pressed.connect(_show_join_requests)
	$PageHost/GroupsPage/GroupChat.pressed.connect(_chat_with_selected_group)
	$PageHost/GroupsPage/CreateGroup.pressed.connect(_create_group)
	$PageHost/FriendsPage/SearchResult.hide()
	_render_chat_channels()
	_set_page("friends")
	set_touch_layout(touch_layout_enabled)
	_sync_connection_controls()

func set_api(value: SocialApi) -> void:
	api = value
	if api == null:
		_sync_connection_controls()
		return
	if not api.chat_message_received.is_connected(_on_chat_message):
		api.chat_message_received.connect(_on_chat_message)
	if not api.socket_closed.is_connected(_on_socket_closed):
		api.socket_closed.connect(_on_socket_closed)
	if visible:
		_refresh_all.call_deferred()
	_sync_connection_controls()

func set_identity(player_id: String, player_name: String) -> void:
	user_id = player_id
	username = player_name
	if visible:
		_render_friends()
		_render_chat_channels()

func set_touch_layout(enabled: bool) -> void:
	touch_layout_enabled = enabled
	for path: String in [
		"PageHost/FriendsPage/FindName", "PageHost/ChatPage/ChatEntry",
		"PageHost/GroupsPage/GroupQuery", "PageHost/GroupsPage/CreateName",
		"PageHost/GroupsPage/CreateDescription"
	]:
		var input := get_node(path) as Control
		Typography.apply_profile(input, &"chat_entry", touch_layout_enabled)
	for label: Label in $PageHost/ChatPage/MessageScroll/MessageList.get_children():
		Typography.apply_profile(label, &"body", touch_layout_enabled)

func on_backend_ready() -> void:
	_sync_connection_controls()
	if visible:
		_refresh_all.call_deferred()

func open_panel(page: String = "friends") -> void:
	show()
	_set_page(page)
	_sync_connection_controls()
	if api == null or api.token.is_empty():
		_set_status("Chưa kết nối máy chủ. Nhấn Online để thử kết nối rồi mở lại mục này.")
		_render_friends()
		_render_chat_channels()
		return
	_set_status("Đang tải danh sách cộng đồng…")
	_refresh_all.call_deferred()

func show_page(page: String) -> void:
	_set_page(page)
	if not visible:
		return
	if page == "chat" and api != null and not api.token.is_empty():
		_load_conversation.call_deferred()
	elif page == "groups" and api != null and not api.token.is_empty():
		_refresh_groups.call_deferred()

func _set_page(page: String) -> void:
	current_page = page if page in ["friends", "chat", "groups"] else "friends"
	$PageHost/FriendsPage.visible = current_page == "friends"
	$PageHost/ChatPage.visible = current_page == "chat"
	$PageHost/GroupsPage.visible = current_page == "groups"
	for entry: Array in [["FriendsTab", "friends"], ["ChatTab", "chat"], ["GroupsTab", "groups"]]:
		var tab: Button = get_node(entry[0])
		tab.modulate = Color("efcd87") if current_page == entry[1] else Color.WHITE

func _refresh_active_page() -> void:
	if api == null or api.token.is_empty():
		_set_status("Chưa kết nối máy chủ. Nhấn Online để kết nối.")
		return
	match current_page:
		"friends": _refresh_friends.call_deferred()
		"chat": _load_conversation.call_deferred()
		"groups": _refresh_groups.call_deferred()

func _refresh_all() -> void:
	if _loading or api == null or api.token.is_empty():
		return
	_loading = true
	_refresh_had_error = false
	_set_status("Đang đồng bộ bạn bè và nhóm…")
	await _refresh_friends()
	await _refresh_chat_groups()
	await _refresh_groups()
	_loading = false
	if current_page == "chat":
		await _load_conversation()
	elif not _refresh_had_error:
		_set_status("Đã đồng bộ • %d bạn bè • %d nhóm" % [friends.size(), groups.size()])

func _refresh_friends() -> void:
	if api == null or api.token.is_empty():
		return
	var result: Dictionary = await api.list_friends(-1)
	if result.has("error"):
		_refresh_had_error = true
		_set_status("Không tải được bạn bè • %s" % _translated(str(result.error)))
		return
	var raw: Variant = result.get("friends", [])
	friends.clear()
	if raw is Array:
		for item: Variant in raw:
			if item is Dictionary:
				friends.append(item.duplicate(true))
	_render_friends()
	_render_chat_channels()

func _render_friends() -> void:
	var list: VBoxContainer = $PageHost/FriendsPage/FriendScroll/FriendList
	_clear_list(list)
	if friends.is_empty():
		_add_note(list, "Chưa có bạn bè. Tìm người chơi theo tên để gửi lời mời.")
		return
	for friend: Dictionary in friends:
		var user: Dictionary = friend.get("user", {})
		var friend_id := _user_id(user, friend)
		var friend_name := _user_name(user)
		var state := int(friend.get("state", 0))
		var row := HBoxContainer.new()
		row.custom_minimum_size = Vector2(0, 32 if touch_layout_enabled else 28)
		row.add_theme_constant_override("separation", 5)
		var title := Label.new()
		title.theme_type_variation = &"UISmall"
		title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		title.clip_text = true
		title.text = "%s  •  %s" % [friend_name, _friend_state_label(state)]
		row.add_child(title)
		if state == 0:
			_add_row_button(row, "Nhắn", _open_direct_chat.bind(friend_id, friend_name), 56)
			_add_row_button(row, "Bỏ bạn", _friend_action.bind(friend_id, "remove"), 59)
			_add_row_button(row, "Chặn", _friend_action.bind(friend_id, "block"), 50)
		elif state == 1:
			_add_row_button(row, "Hủy lời mời", _friend_action.bind(friend_id, "cancel"), 86)
		elif state == 2:
			_add_row_button(row, "Chấp nhận", _friend_action.bind(friend_id, "accept"), 80)
			_add_row_button(row, "Từ chối", _friend_action.bind(friend_id, "reject"), 67)
		elif state == 3:
			_add_row_button(row, "Bỏ chặn", _friend_action.bind(friend_id, "unblock"), 68)
		list.add_child(row)

func _search_player(_submitted: String = "") -> void:
	if api == null or api.token.is_empty():
		_set_status("Cần kết nối máy chủ để tìm người chơi.")
		return
	var name_query := str($PageHost/FriendsPage/FindName.text).strip_edges()
	if name_query.length() < 3:
		_set_status("Tên người chơi cần có ít nhất 3 ký tự.")
		return
	$PageHost/FriendsPage/FindButton.disabled = true
	var result: Dictionary = await api.call_rpc("social_find_player", {"username": name_query})
	$PageHost/FriendsPage/FindButton.disabled = false
	if result.has("error"):
		searched_player.clear()
		$PageHost/FriendsPage/SearchResult.hide()
		_set_status("Không tìm thấy người chơi • %s" % _translated(str(result.error)))
		return
	searched_player = result.duplicate(true)
	var found_id := str(result.get("userId", result.get("id", "")))
	var found_name := str(result.get("displayName", ""))
	if found_name.is_empty():
		found_name = str(result.get("username", name_query))
	$PageHost/FriendsPage/SearchResult/Name.text = "%s%s" % [found_name, " • đang trực tuyến" if bool(result.get("online", false)) else ""]
	var invite: Button = $PageHost/FriendsPage/SearchResult/Invite
	invite.disabled = found_id.is_empty() or found_id == user_id or _friend_state_for(found_id) >= 0
	invite.text = "Lời mời đã tồn tại" if _friend_state_for(found_id) >= 0 else "Gửi lời mời"
	$PageHost/FriendsPage/SearchResult.show()
	_set_status("Đã tìm thấy @%s." % str(result.get("username", name_query)))

func _invite_searched_player() -> void:
	var target_id := str(searched_player.get("userId", searched_player.get("id", "")))
	if target_id.is_empty() or target_id == user_id:
		return
	var result: Dictionary = await api.add_friend(target_id)
	if result.has("error"):
		_set_status("Chưa gửi được lời mời • %s" % _translated(str(result.error)))
		return
	$PageHost/FriendsPage/SearchResult/Invite.disabled = true
	$PageHost/FriendsPage/SearchResult/Invite.text = "Đã gửi"
	_set_status("Đã gửi lời mời kết bạn.")
	await _refresh_friends()

func _friend_action(target_id: String, action: String) -> void:
	if api == null or target_id.is_empty():
		return
	var result: Dictionary
	if action == "accept":
		result = await api.add_friend(target_id)
	elif action == "block":
		result = await api.block_player(target_id)
	else:
		result = await api.remove_friend(target_id)
	if result.has("error"):
		_set_status("Thao tác bạn bè chưa hoàn tất • %s" % _translated(str(result.error)))
		return
	_set_status("Đã cập nhật quan hệ bạn bè.")
	await _refresh_friends()
	await _refresh_groups()

func _friend_state_for(target_id: String) -> int:
	for friend: Dictionary in friends:
		var user: Dictionary = friend.get("user", {})
		if _user_id(user, friend) == target_id:
			return int(friend.get("state", -1))
	return -1

func _friend_state_label(state: int) -> String:
	match state:
		0: return "Bạn bè"
		1: return "Đã gửi lời mời"
		2: return "Lời mời mới"
		3: return "Đã chặn"
		_: return "Trạng thái khác"

func _refresh_groups() -> void:
	if api == null or api.token.is_empty():
		_render_groups()
		return
	var payload := {"kind": current_group_kind, "limit": 30}
	if showing_my_groups:
		payload["mine"] = true
	else:
		var query := str($PageHost/GroupsPage/GroupQuery.text).strip_edges()
		if not query.is_empty():
			payload["query"] = query
	var result: Dictionary = await api.call_rpc("social_groups", payload)
	if result.has("error"):
		_refresh_had_error = true
		_set_status("Không tải được danh sách nhóm • %s" % _translated(str(result.error)))
		return
	groups.clear()
	var key := "userGroups" if showing_my_groups else "groups"
	var raw: Variant = result.get(key, [])
	if raw is Array:
		for item: Variant in raw:
			if not item is Dictionary:
				continue
			var entry: Dictionary = item.duplicate(true)
			if showing_my_groups:
				var group_data: Dictionary = entry.get("group", {})
				group_data["state"] = int(entry.get("state", 3))
				entry = group_data
			groups.append(entry)
	_render_groups()
	_render_chat_channels()
	_set_status("%s • %d kết quả" % ["Nhóm của tôi" if showing_my_groups else "Nhóm được tìm thấy", groups.size()])

func _refresh_chat_groups() -> void:
	if api == null or api.token.is_empty():
		return
	var result: Dictionary = await api.call_rpc("social_groups", {"mine": true, "limit": 30})
	if result.has("error"):
		_refresh_had_error = true
		return
	my_groups.clear()
	var raw: Variant = result.get("userGroups", [])
	if raw is Array:
		for item: Variant in raw:
			if not item is Dictionary:
				continue
			var entry: Dictionary = item.duplicate(true)
			var group_data: Dictionary = entry.get("group", {})
			group_data["state"] = int(entry.get("state", 3))
			my_groups.append(group_data)
	_render_chat_channels()

func _render_groups() -> void:
	var list: VBoxContainer = $PageHost/GroupsPage/GroupScroll/GroupList
	_clear_list(list)
	$PageHost/GroupsPage/GroupQuery.visible = not showing_my_groups
	$PageHost/GroupsPage/GroupSearch.visible = not showing_my_groups
	$PageHost/GroupsPage/Mine.modulate = Color("efcd87") if showing_my_groups else Color.WHITE
	$PageHost/GroupsPage/Browse.modulate = Color.WHITE if showing_my_groups else Color("efcd87")
	$PageHost/GroupsPage/Sect.modulate = Color("efcd87") if current_group_kind == "sect" else Color.WHITE
	$PageHost/GroupsPage/Guild.modulate = Color("efcd87") if current_group_kind == "guild" else Color.WHITE
	if groups.is_empty():
		_add_note(list, "Chưa có nhóm phù hợp. Tạo nhóm mới hoặc thử tìm nhóm khác.")
		selected_group.clear()
		_render_selected_group()
		return
	var selected_id := str(selected_group.get("id", ""))
	var selection_found := false
	for group: Dictionary in groups:
		var group_id := str(group.get("id", ""))
		var group_name := str(group.get("name", "Nhóm"))
		var role := int(group.get("state", _my_group_role(group_id)))
		var button := Button.new()
		Typography.apply_profile(button, &"action", touch_layout_enabled)
		button.custom_minimum_size = Vector2(0, 30 if touch_layout_enabled else 27)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var membership_label := "  •  xin vào" if role == 3 else ("  •  đã tham gia" if role >= 0 else "")
		button.text = "%s%s" % [group_name, membership_label]
		button.tooltip_text = group_name
		button.modulate = Color("efcd87") if group_id == selected_id else Color.WHITE
		button.pressed.connect(_select_group.bind(group_id))
		list.add_child(button)
		if group_id == selected_id:
			selected_group = group
			selection_found = true
	if not selection_found:
		selected_group = groups[0]
	_render_selected_group()

func _select_group(group_id: String) -> void:
	for group: Dictionary in groups:
		if str(group.get("id", "")) == group_id:
			selected_group = group
			break
	_render_groups()

func _render_selected_group() -> void:
	var title: Label = $PageHost/GroupsPage/GroupDetails/GroupTitle
	var info: Label = $PageHost/GroupsPage/GroupDetails/GroupInfo
	var action: Button = $PageHost/GroupsPage/GroupAction
	var members: Button = $PageHost/GroupsPage/GroupMembers
	var chat: Button = $PageHost/GroupsPage/GroupChat
	var requests: Button = $PageHost/GroupsPage/GroupDetails/GroupRequests
	$PageHost/GroupsPage/GroupDetails/GroupInfo.show()
	$PageHost/GroupsPage/GroupDetails/GroupRequestScroll.hide()
	if selected_group.is_empty():
		title.text = "Chọn một nhóm"
		info.text = "Tìm nhóm, xem lời giới thiệu và trò chuyện cùng thành viên."
		action.disabled = true
		members.disabled = true
		chat.disabled = true
		requests.hide()
		return
	var group_name := str(selected_group.get("name", "Nhóm"))
	var group_id := str(selected_group.get("id", ""))
	var metadata: Dictionary = selected_group.get("metadata", {})
	var kind := str(metadata.get("kind", current_group_kind))
	var role := int(selected_group.get("state", _my_group_role(group_id)))
	var count := int(selected_group.get("edgeCount", 0))
	var max_count := int(selected_group.get("maxCount", 50))
	var role_text := _group_role_label(role)
	title.text = group_name
	info.text = "%s • %d/%d thành viên • %s\n%s" % [
		"Tông môn" if kind == "sect" else "Bang phái", count, max_count, role_text,
		str(selected_group.get("description", "Chưa có giới thiệu."))
	]
	requests.visible = showing_my_groups and role <= 1
	if showing_my_groups:
		action.text = "Hủy yêu cầu" if role == 3 else ("Rời nhóm" if role in [1, 2] else "Chủ nhóm")
		action.disabled = role == 0
		members.disabled = role > 2 or role < 0
		chat.disabled = role > 2 or role < 0
	else:
		if role == 3:
			action.text = "Đang chờ duyệt"
			action.disabled = true
		elif role >= 0:
			action.text = "Đã tham gia"
			action.disabled = true
		else:
			action.text = "Xin gia nhập"
			action.disabled = group_id.is_empty()
		members.disabled = role < 0 or role > 2
		chat.disabled = role < 0 or role > 2

func _show_join_requests() -> void:
	if api == null or selected_group.is_empty():
		return
	var group_id := str(selected_group.get("id", ""))
	var result: Dictionary = await api.call_rpc("social_group_members", {"groupId": group_id, "state": 3, "limit": 20})
	if result.has("error"):
		_set_status("Không tải được đơn xin vào • %s" % _translated(str(result.error)))
		return
	var list: VBoxContainer = $PageHost/GroupsPage/GroupDetails/GroupRequestScroll/GroupRequestList
	_clear_list(list)
	$PageHost/GroupsPage/GroupDetails/GroupInfo.hide()
	$PageHost/GroupsPage/GroupDetails/GroupRequestScroll.show()
	var raw: Variant = result.get("groupUsers", [])
	var request_count := 0
	if raw is Array:
		for item: Variant in raw:
			if not item is Dictionary:
				continue
			var user: Dictionary = item.get("user", {})
			var target_id := _user_id(user, item)
			var row := HBoxContainer.new()
			row.custom_minimum_size = Vector2(0, 25)
			row.add_theme_constant_override("separation", 3)
			var name_label := Label.new()
			name_label.theme_type_variation = &"UISmall"
			name_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			name_label.clip_text = true
			name_label.text = _user_name(user)
			row.add_child(name_label)
			_add_row_button(row, "Duyệt", _resolve_group_request.bind(group_id, target_id, "approve"), 52)
			_add_row_button(row, "Từ chối", _resolve_group_request.bind(group_id, target_id, "reject"), 56)
			list.add_child(row)
			request_count += 1
	if request_count == 0:
		_add_note(list, "Hiện chưa có đơn xin gia nhập.")
	_set_status("%d đơn xin gia nhập." % request_count)

func _resolve_group_request(group_id: String, target_id: String, action_name: String) -> void:
	var result: Dictionary = await api.call_rpc("social_group_action", {
		"groupId": group_id, "action": action_name, "userId": target_id
	})
	if result.has("error"):
		_set_status("Chưa xử lý được đơn • %s" % _translated(str(result.error)))
		return
	_set_status("Đã duyệt đơn gia nhập." if action_name == "approve" else "Đã từ chối đơn gia nhập.")
	await _show_join_requests()

func _show_group_members() -> void:
	if api == null or selected_group.is_empty():
		return
	var result: Dictionary = await api.call_rpc("social_group_members", {
		"groupId": str(selected_group.get("id", "")), "limit": 20
	})
	if result.has("error"):
		_set_status("Không tải được thành viên • %s" % _translated(str(result.error)))
		return
	var names := PackedStringArray()
	var raw: Variant = result.get("groupUsers", [])
	if raw is Array:
		for item: Variant in raw:
			if not item is Dictionary:
				continue
			var user: Dictionary = item.get("user", {})
			var role: int = int(item.get("state", 2))
			names.append("%s — %s" % [_user_name(user), _group_role_label(role)])
		$PageHost/GroupsPage/GroupDetails/GroupRequestScroll.hide()
		$PageHost/GroupsPage/GroupDetails/GroupInfo.show()
		$PageHost/GroupsPage/GroupDetails/GroupInfo.text = "Thành viên đã tải (%d):\n%s" % [names.size(), "\n".join(names.slice(0, 3))]
	if names.size() > 3:
		_set_status("Đang hiển thị 3 thành viên đầu.")
	else:
		_set_status("Đã tải danh sách thành viên.")

func _perform_group_action() -> void:
	if api == null or selected_group.is_empty():
		return
	var role := int(selected_group.get("state", -1))
	var action_name := "join" if not showing_my_groups else "leave"
	var result: Dictionary = await api.call_rpc("social_group_action", {
		"groupId": str(selected_group.get("id", "")), "action": action_name
	})
	if result.has("error"):
		_set_status("Chưa cập nhật được nhóm • %s" % _translated(str(result.error)))
		return
	if action_name == "join":
		_set_status("Đã gửi yêu cầu gia nhập.")
	else:
		_set_status("Đã hủy yêu cầu." if role == 3 else "Đã rời nhóm.")
	selected_group.clear()
	await _refresh_chat_groups()
	await _refresh_groups()

func _create_group() -> void:
	if api == null or api.token.is_empty():
		_set_status("Cần kết nối máy chủ để tạo nhóm.")
		return
	var group_name := str($PageHost/GroupsPage/CreateName.text).strip_edges()
	var description := str($PageHost/GroupsPage/CreateDescription.text).strip_edges()
	if group_name.length() < 3 or group_name.length() > 32:
		_set_status("Tên nhóm cần từ 3 đến 32 ký tự.")
		return
	$PageHost/GroupsPage/CreateGroup.disabled = true
	var result: Dictionary = await api.call_rpc("social_group_create", {
		"kind": current_group_kind, "name": group_name, "description": description
	})
	$PageHost/GroupsPage/CreateGroup.disabled = false
	if result.has("error"):
		_set_status("Chưa tạo được nhóm • %s" % _translated(str(result.error)))
		return
	$PageHost/GroupsPage/CreateName.clear()
	$PageHost/GroupsPage/CreateDescription.clear()
	showing_my_groups = true
	selected_group = result.get("group", {}).duplicate(true)
	_set_status("Đã tạo %s mới." % ("tông môn" if current_group_kind == "sect" else "bang phái"))
	await _refresh_groups()
	await _refresh_chat_groups()

func _chat_with_selected_group() -> void:
	if selected_group.is_empty():
		return
	var selected_id := str(selected_group.get("id", ""))
	var role := int(selected_group.get("state", _my_group_role(selected_id)))
	if role < 0 or role > 2:
		return
	_open_group_chat(str(selected_group.get("id", "")), str(selected_group.get("name", "Nhóm")))

func _render_chat_channels() -> void:
	var list: VBoxContainer = $PageHost/ChatPage/ChannelScroll/ChannelList
	if list == null:
		return
	_clear_list(list)
	_add_channel_button(list, "Thế giới", "world", "", true)
	_add_note(list, "BẠN BÈ")
	var accepted_count := 0
	for friend: Dictionary in friends:
		if int(friend.get("state", -1)) != 0:
			continue
		var user: Dictionary = friend.get("user", {})
		var friend_id := _user_id(user, friend)
		if friend_id.is_empty():
			continue
		_add_channel_button(list, _user_name(user), "direct", friend_id, false)
		accepted_count += 1
	if accepted_count == 0:
		_add_note(list, "Chưa có bạn để nhắn riêng.")
	_add_note(list, "NHÓM CỦA TÔI")
	var group_count := 0
	for group: Dictionary in my_groups:
		var role := int(group.get("state", 3))
		if role > 2:
			continue
		_add_channel_button(list, str(group.get("name", "Nhóm")), "group", str(group.get("id", "")), false)
		group_count += 1
	if group_count == 0:
		_add_note(list, "Chưa tham gia nhóm nào.")

func _my_group_role(group_id: String) -> int:
	for group: Dictionary in my_groups:
		if str(group.get("id", "")) == group_id:
			return int(group.get("state", -1))
	return -1

func _add_channel_button(list: VBoxContainer, label_text: String, type: String, target_id: String, highlight: bool) -> void:
	var button := Button.new()
	Typography.apply_profile(button, &"action", touch_layout_enabled)
	button.custom_minimum_size = Vector2(0, 30 if touch_layout_enabled else 27)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.text = label_text
	button.clip_text = true
	button.tooltip_text = label_text
	button.modulate = Color("efcd87") if highlight and chat_type == type else Color.WHITE
	if type == "world":
		button.pressed.connect(_open_world_chat)
	elif type == "direct":
		button.pressed.connect(_open_direct_chat.bind(target_id, label_text))
	else:
		button.pressed.connect(_open_group_chat.bind(target_id, label_text))
	list.add_child(button)

func _open_world_chat() -> void:
	_set_conversation("world", "", "Thế giới")

func _open_direct_chat(target_id: String, target_name: String) -> void:
	_set_conversation("direct", target_id, target_name)

func _open_group_chat(target_id: String, target_name: String) -> void:
	_set_conversation("group", target_id, target_name)

func _set_conversation(type: String, target_id: String, target_name: String) -> void:
	chat_type = type
	chat_target_id = target_id
	chat_target_name = target_name
	_conversation_generation += 1
	_set_page("chat")
	_load_conversation.call_deferred()

func _load_conversation() -> void:
	if api == null or api.token.is_empty():
		_set_status("Đăng nhập vào máy chủ để trò chuyện.")
		return
	if _chat_loading:
		_conversation_reload_pending = true
		return
	_chat_loading = true
	_conversation_generation += 1
	var generation := _conversation_generation
	active_channel_id = ""
	_seen_messages.clear()
	_clear_list($PageHost/ChatPage/MessageScroll/MessageList)
	$PageHost/ChatPage/ChatTitle.text = "%s  •  %s" % ["Thế giới" if chat_type == "world" else "Tin nhắn riêng" if chat_type == "direct" else "Trò chuyện nhóm", chat_target_name]
	$PageHost/ChatPage/Send.disabled = true
	$PageHost/ChatPage/ChatEntry.editable = false
	_set_status("Đang mở kênh trò chuyện…")
	var socket_ready: bool = await _ensure_socket()
	if not socket_ready:
		_finish_chat_load()
		_set_status("Chat đang ngoại tuyến. Hãy kết nối lại từ nút Online.")
		return
	var joined: Dictionary = await api.join_chat(chat_type, chat_target_id)
	if generation != _conversation_generation:
		_finish_chat_load()
		return
	if joined.has("error"):
		_finish_chat_load()
		_set_status("Không vào được kênh • %s" % _translated(str(joined.error)))
		return
	var history: Dictionary = await api.chat_history(chat_type, chat_target_id)
	if generation != _conversation_generation:
		_finish_chat_load()
		return
	if history.has("error"):
		_finish_chat_load()
		_set_status("Không tải được lịch sử chat • %s" % _translated(str(history.error)))
		return
	active_channel_id = str(history.get("channelId", history.get("channel_id", "")))
	var messages: Variant = history.get("messages", [])
	if messages is Array:
		for index in range(messages.size() - 1, -1, -1):
			if messages[index] is Dictionary:
				_append_message(messages[index])
	_finish_chat_load()
	$PageHost/ChatPage/Send.disabled = false
	$PageHost/ChatPage/ChatEntry.editable = true
	_set_status("Đang trò chuyện • tin nhắn được lưu trên máy chủ.")
	await _scroll_chat_to_bottom()

func _finish_chat_load() -> void:
	_chat_loading = false
	if _conversation_reload_pending:
		_conversation_reload_pending = false
		_load_conversation.call_deferred()

func _ensure_socket() -> bool:
	if api == null or api.token.is_empty():
		return false
	if api._socket != null and api._socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		return true
	if api is CombatApi:
		var combat_api := api as CombatApi
		if not combat_api.match_id.is_empty():
			return false
	var result: Dictionary = await api.connect_chat()
	return not result.has("error")

func _send_message(_submitted: String = "") -> void:
	if api == null or api.token.is_empty() or active_channel_id.is_empty():
		_set_status("Kênh chat chưa sẵn sàng.")
		return
	var text_value := str($PageHost/ChatPage/ChatEntry.text).strip_edges()
	if text_value.is_empty():
		return
	$PageHost/ChatPage/Send.disabled = true
	var result: Dictionary = await api.send_chat(chat_type, text_value, chat_target_id)
	$PageHost/ChatPage/Send.disabled = false
	if result.has("error"):
		_set_status("Chưa gửi được tin nhắn • %s" % _translated(str(result.error)))
		return
	var message_id := str(result.get("messageId", result.get("message_id", "")))
	_append_message({
		"message_id": message_id, "channel_id": active_channel_id,
		"sender_id": user_id, "username": username if not username.is_empty() else "Bạn",
		"content": JSON.stringify({"text": text_value})
	})
	$PageHost/ChatPage/ChatEntry.clear()
	await _scroll_chat_to_bottom()

func _on_chat_message(message: Dictionary) -> void:
	if not visible or current_page != "chat" or active_channel_id.is_empty():
		return
	var incoming_channel := str(message.get("channel_id", message.get("channelId", "")))
	if incoming_channel != active_channel_id:
		return
	_append_message(message)
	_scroll_chat_to_bottom.call_deferred()

func _append_message(message: Dictionary) -> void:
	var message_id := str(message.get("message_id", message.get("messageId", "")))
	if not message_id.is_empty() and _seen_messages.has(message_id):
		return
	if not message_id.is_empty():
		_seen_messages[message_id] = true
	var content_value: Variant = message.get("content", "")
	var text_value := ""
	if content_value is Dictionary:
		text_value = str(content_value.get("text", ""))
	else:
		var parsed: Variant = JSON.parse_string(str(content_value))
		text_value = str(parsed.get("text", "")) if parsed is Dictionary else str(content_value)
	if text_value.is_empty():
		return
	var sender_id := str(message.get("sender_id", message.get("senderId", "")))
	var sender := str(message.get("username", message.get("sender_username", "Đạo hữu")))
	if sender_id == user_id:
		sender = username if not username.is_empty() else "Bạn"
	var label := Label.new()
	Typography.apply_profile(label, &"body", touch_layout_enabled)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.custom_minimum_size = Vector2(0, 18)
	label.text = "%s: %s" % [sender, text_value]
	if sender_id == user_id:
		label.modulate = Color("d7e8bc")
	$PageHost/ChatPage/MessageScroll/MessageList.add_child(label)

func _on_socket_closed() -> void:
	if visible and current_page == "chat":
		_set_status("Kết nối chat bị ngắt. Nhấn Online để kết nối lại.")
		$PageHost/ChatPage/Send.disabled = true

func _scroll_chat_to_bottom() -> void:
	await get_tree().process_frame
	var scroll: ScrollContainer = $PageHost/ChatPage/MessageScroll
	scroll.scroll_vertical = int(scroll.get_v_scroll_bar().max_value)

func has_text_input_focus() -> bool:
	for path: String in [
		"PageHost/FriendsPage/FindName", "PageHost/ChatPage/ChatEntry",
		"PageHost/GroupsPage/GroupQuery", "PageHost/GroupsPage/CreateName",
		"PageHost/GroupsPage/CreateDescription"
	]:
		var input: LineEdit = get_node(path)
		if input.has_focus():
			return true
	return false

func _user_id(user: Dictionary, fallback: Dictionary = {}) -> String:
	return str(user.get("id", user.get("userId", user.get("user_id", fallback.get("userId", fallback.get("user_id", ""))))))

func _user_name(user: Dictionary) -> String:
	var display_name := str(user.get("displayName", ""))
	return display_name if not display_name.is_empty() else str(user.get("username", user.get("userId", "Đạo hữu")))

func _group_role_label(role: int) -> String:
	match role:
		0: return "Tông chủ / bang chủ"
		1: return "Trưởng lão / quản lý"
		2: return "Thành viên"
		3: return "Đang chờ duyệt"
		_: return "Chưa tham gia"

func _add_row_button(row: HBoxContainer, label_text: String, callback: Callable, width: float) -> Button:
	var button := Button.new()
	Typography.apply_profile(button, &"action", touch_layout_enabled)
	button.custom_minimum_size = Vector2(width, 30 if touch_layout_enabled else 25)
	button.text = label_text
	button.pressed.connect(callback)
	row.add_child(button)
	return button

func _add_note(list: VBoxContainer, message: String) -> void:
	var label := Label.new()
	Typography.apply_profile(label, &"caption", touch_layout_enabled)
	label.text = message
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.custom_minimum_size = Vector2(0, 22)
	list.add_child(label)

func _clear_list(list: VBoxContainer) -> void:
	for child: Node in list.get_children():
		list.remove_child(child)
		child.queue_free()

func _set_status(message: String) -> void:
	$Status.text = message

func _sync_connection_controls() -> void:
	var connected := api != null and not api.token.is_empty()
	$PageHost/FriendsPage/FindButton.disabled = not connected
	$PageHost/GroupsPage/GroupSearch.disabled = not connected
	$PageHost/GroupsPage/GroupRefresh.disabled = not connected
	$PageHost/GroupsPage/CreateGroup.disabled = not connected
	$PageHost/ChatPage/ChatEntry.editable = connected
	var socket_ready := connected and api._socket != null and api._socket.get_ready_state() == WebSocketPeer.STATE_OPEN
	$PageHost/ChatPage/Send.disabled = not socket_ready or active_channel_id.is_empty()

func _translated(message: String) -> String:
	if _language_manager != null:
		return _language_manager.translate_message(message)
	return tr(message)
