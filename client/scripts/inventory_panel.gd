class_name InventoryPanel
extends Panel
## Shared by the main HUD, the editor-visible inventory scene and live smoke tests.
const Visuals = preload("res://scripts/ui/item_visuals.gd")
var api: SocialApi
var loading: bool = false
var preview_mode: bool = true
var inventory: Array = []
var catalog: Dictionary = {}
var filtered: Array = []
var category: String = "all"
var selected_id: String = ""
var selected_slot: Dictionary = {}
var starter_claimed: bool = false
var stones: int = 0
var cultivation_xp: int = 0
var hp: int = 100
var equipped: Dictionary = {"weapon": "", "armor": ""}
var pending_settlement: Dictionary = {}
var summary: Label
var claim_button: Button
var refresh_button: Button
var action_button: Button
var discard_button: Button
var slot_buttons: Array[Button] = []
var _confirm: ConfirmationDialog

func _ready() -> void:
	summary = $Summary
	claim_button = $Claim
	refresh_button = $Refresh
	action_button = $Detail/Action
	discard_button = $Detail/Discard
	for index in range(24):
		var slot: Button = get_node("Grid/Slot%d" % index)
		slot.pressed.connect(func() -> void: select_slot(index))
		slot_buttons.append(slot)
	$Close.pressed.connect(hide)
	$All.pressed.connect(func() -> void: set_filter("all"))
	$Equipment.pressed.connect(func() -> void: set_filter("equipment"))
	$Materials.pressed.connect(func() -> void: set_filter("material"))
	$Consumables.pressed.connect(func() -> void: set_filter("consumable"))
	claim_button.pressed.connect(_claim)
	refresh_button.pressed.connect(refresh)
	action_button.pressed.connect(_use_or_equip_selected)
	discard_button.pressed.connect(_confirm_discard)
	_confirm = ConfirmationDialog.new()
	_confirm.title = "Xác nhận bỏ vật phẩm"
	_confirm.confirmed.connect(_discard_selected)
	add_child(_confirm)
	LanguageManager.locale_changed.connect(_on_language_changed)
	show_preview()

func open_inventory() -> void:
	show()
	if api == null or api.token.is_empty():
		show_preview()
	else:
		await refresh()

func open_equipment() -> void:
	category = "equipment"
	show()
	if api == null or api.token.is_empty():
		show_preview()
	else:
		await refresh()
	set_filter("equipment")

func show_preview() -> void:
	preview_mode = true
	stones = 0
	cultivation_xp = 0
	hp = 100
	equipped = {"weapon": "", "armor": ""}
	starter_claimed = false
	pending_settlement.clear()
	catalog.clear()
	inventory = [
		{"itemId": "it_iron_sword", "quantity": 1},
		{"itemId": "it_cloth_armor", "quantity": 1},
		{"itemId": "it_heal_pill", "quantity": 2},
		{"itemId": "it_herb_cam_lo", "quantity": 3},
		{"itemId": "it_water", "quantity": 4},
		{"itemId": "it_bamboo", "quantity": 3},
		{"itemId": "it_iron", "quantity": 5},
		{"itemId": "it_seed_cam_lo", "quantity": 2},
		{"itemId": "it_mach_ban", "quantity": 1},
		{"itemId": "it_ledger", "quantity": 1}
	]
	$Mode.text = "MẪU GIAO DIỆN • không phải túi tài khoản • không lưu"
	_refresh_grid()
	select_slot(0)

func set_filter(value: String) -> void:
	category = value
	_refresh_grid()
	select_slot(0)

func _refresh_grid() -> void:
	filtered.clear()
	for slot: Dictionary in inventory:
		if category == "all" or Visuals.definition(str(slot.get("itemId", "")))[2] == category:
			filtered.append(slot)
	for index in range(24):
		var button := slot_buttons[index]
		button.icon = null
		button.tooltip_text = "Ô trống"
		button.get_node("Quantity").text = ""
		button.disabled = loading
		if index < filtered.size():
			var item: Dictionary = filtered[index]
			var item_id := str(item.get("itemId", ""))
			button.icon = Visuals.icon(item_id)
			button.get_node("Quantity").text = str(item.get("quantity", 0))
			button.tooltip_text = str(Visuals.definition(item_id)[0])
	for entry in [["All", "all"], ["Equipment", "equipment"], ["Materials", "material"], ["Consumables", "consumable"]]:
		get_node(entry[0]).modulate = Color("efcd87") if category == entry[1] else Color.WHITE
	summary.text = (tr("Mẫu • %d / 24 ô") % inventory.size()) if preview_mode else (
		tr("%d tu vi • %d HP • %d đá • %d/24 ô") % [cultivation_xp, hp, stones, inventory.size()])
	var has_pending := not pending_settlement.is_empty()
	claim_button.disabled = loading or preview_mode or (not has_pending and starter_claimed)
	claim_button.text = "Kết nối để nhận vật tư" if preview_mode else ("Nhận thưởng đang chờ" if has_pending else (
		"Đã nhận vật tư" if starter_claimed else "Nhận vật tư khởi đầu"))
	refresh_button.disabled = loading or preview_mode
	_update_item_actions()

func select_slot(index: int) -> void:
	selected_id = ""
	selected_slot.clear()
	if index < 0 or index >= filtered.size():
		$Detail/Icon.texture = null
		$Detail/Name.text = "Ô trống"
		$Detail/Body.text = "Ô này chưa có vật phẩm."
		_update_item_actions()
		return
	var slot: Dictionary = filtered[index]
	selected_slot = slot.duplicate(true)
	selected_id = str(slot.get("itemId", ""))
	var entry := Visuals.definition(selected_id)
	var definition: Dictionary = catalog.get(selected_id, {})
	$Detail/Icon.texture = Visuals.icon(selected_id)
	$Detail/Name.text = tr(str(definition.get("name", entry[0])))
	var bound := bool(definition.get("bound", selected_id in ["it_mach_ban", "it_ledger"]))
	var state_text := ""
	if slot.has("instanceId") and (str(equipped.get("weapon", "")) == str(slot.instanceId) or str(equipped.get("armor", "")) == str(slot.instanceId)):
		state_text = tr("\nĐang trang bị")
	$Detail/Body.text = tr("%s\n\nNguồn: %s\nSố lượng: %d%s%s") % [
		tr(str(entry[3])), tr(str(entry[4])), int(slot.quantity), tr("\nGắn nhân vật") if bound else "", state_text]
	$Detail/Name.tooltip_text = (tr("Instance: %s") % str(slot.instanceId)) if slot.has("instanceId") else ""
	_update_item_actions()

func _update_item_actions() -> void:
	var has_selection := not selected_id.is_empty() and not preview_mode and not loading
	action_button.disabled = true
	action_button.visible = has_selection
	discard_button.disabled = true
	discard_button.visible = has_selection
	if not has_selection:
		return
	var definition: Dictionary = catalog.get(selected_id, {})
	var equip_slot := str(definition.get("equipSlot", ""))
	if equip_slot in ["weapon", "armor"] and selected_slot.has("instanceId"):
		var instance_id := str(selected_slot.instanceId)
		var is_equipped := str(equipped.get(equip_slot, "")) == instance_id
		action_button.text = tr("Tháo trang bị") if is_equipped else tr("Trang bị")
		action_button.disabled = false
	elif selected_id == "it_heal_pill":
		action_button.text = tr("Dùng • +40 HP")
		action_button.disabled = hp >= 100 or int(selected_slot.get("quantity", 0)) <= 0
	else:
		action_button.text = tr("Chưa dùng được")
	var protected: bool = bool(definition.get("bound", false)) or str(Visuals.definition(selected_id)[2]) == "quest"
	var equipped_item := false
	if selected_slot.has("instanceId"):
		var instance_id := str(selected_slot.instanceId)
		equipped_item = str(equipped.get("weapon", "")) == instance_id or str(equipped.get("armor", "")) == instance_id
	discard_button.text = tr("Bỏ %d") % int(selected_slot.get("quantity", 1))
	discard_button.disabled = protected or equipped_item or int(selected_slot.get("quantity", 0)) <= 0

func _set_loading(value: bool) -> void:
	loading = value
	_refresh_grid()

func refresh() -> void:
	if loading:
		return
	if api == null or api.token.is_empty():
		show_preview()
		return
	# Remove sample data BEFORE the first server request; never present it as owned.
	preview_mode = false
	inventory.clear()
	filtered.clear()
	catalog.clear()
	pending_settlement.clear()
	starter_claimed = true
	stones = 0
	cultivation_xp = 0
	hp = 100
	_set_loading(true)
	select_slot(-1)
	$Mode.text = "Đang tải túi từ server…"
	var result: Dictionary = await api.call_rpc("inventory_get")
	if result.has("error"):
		$Mode.text = tr("Không tải được túi: %s") % tr(str(result.error))
		_set_loading(false)
		return
	var profile: Dictionary = result.profile
	inventory = profile.inventory
	stones = int(profile.spiritStones)
	cultivation_xp = int(profile.get("cultivationXp", 0))
	hp = int(profile.get("hp", 100))
	equipped = profile.get("equipped", {"weapon": "", "armor": ""})
	var pending: Variant = result.get("pendingSettlement", null)
	pending_settlement = pending if pending is Dictionary else {}
	starter_claimed = bool(result.starterClaimed)
	for definition: Dictionary in result.catalog:
		catalog[definition.id] = definition
	if not pending_settlement.is_empty():
		var reward: Dictionary = pending_settlement.get("reward", {})
		var items: Array = reward.get("items", [])
		var count := int(items[0].quantity) if not items.is_empty() else 0
		$Mode.text = tr("THƯỞNG ĐANG CHỜ • Da Sơn Trư ×%d • %d tu vi • bỏ bớt vật tư rồi nhận") % [count, int(reward.get("cultivationXp", 0))]
	else:
		$Mode.text = "TÚI TÀI KHOẢN • dữ liệu được xác nhận bởi server"
	_set_loading(false)
	select_slot(0)

func _claim() -> void:
	if loading or preview_mode or api == null or (starter_claimed and pending_settlement.is_empty()):
		return
	_set_loading(true)
	var pending := not pending_settlement.is_empty()
	$Mode.text = "Đang nhận thưởng…" if pending else "Đang xác nhận vật tư…"
	var result: Dictionary
	if pending:
		result = await api.call_rpc("pve_son_tru_claim_pending")
	else:
		result = await api.call_rpc("inventory_claim_starter", {"operationId": "starter_claim_v1"})
	_set_loading(false)
	if result.has("error"):
		$Mode.text = "Túi còn đầy hoặc mạng chưa ổn. Thưởng vẫn được giữ; dọn một ô rồi thử lại." if pending else "Chưa xác nhận. Hãy tải lại túi trước khi thử lại."
		if not pending:
			starter_claimed = true
			claim_button.disabled = true
		return
	await refresh()
	if pending:
		$Mode.text = "Đã nhận XP và vật phẩm đúng một lần."

func _operation_id() -> String:
	return "inv_" + Crypto.new().generate_random_bytes(12).hex_encode()

func _use_or_equip_selected() -> void:
	if loading or preview_mode or selected_slot.is_empty() or api == null:
		return
	var definition: Dictionary = catalog.get(selected_id, {})
	var equip_slot := str(definition.get("equipSlot", ""))
	var rpc_name := "inventory_use"
	var payload: Dictionary = {"operationId": _operation_id(), "itemId": selected_id}
	if equip_slot in ["weapon", "armor"] and selected_slot.has("instanceId"):
		rpc_name = "inventory_equip"
		payload = {"operationId": _operation_id(), "instanceId": str(selected_slot.instanceId)}
	elif selected_id != "it_heal_pill":
		return
	_set_loading(true)
	var result: Dictionary = await api.call_rpc(rpc_name, payload)
	_set_loading(false)
	if result.has("error"):
		$Mode.text = tr("Không thể dùng vật phẩm: %s") % tr(str(result.error))
		return
	await refresh()
	$Mode.text = "Đã cập nhật trang bị hoặc hồi phục trên server."

func _confirm_discard() -> void:
	if loading or preview_mode or selected_slot.is_empty() or discard_button.disabled:
		return
	var name := str(catalog.get(selected_id, {}).get("name", selected_id))
	_confirm.dialog_text = tr("Bỏ %s ×%d? Hành động này không thể hoàn tác.") % [tr(name), int(selected_slot.get("quantity", 1))]
	_confirm.popup_centered()

func _discard_selected() -> void:
	if loading or preview_mode or selected_slot.is_empty() or api == null:
		return
	var payload: Dictionary = {"operationId": _operation_id(), "itemId": selected_id,
		"quantity": int(selected_slot.get("quantity", 1))}
	if selected_slot.has("instanceId"):
		payload.instanceId = str(selected_slot.instanceId)
	_set_loading(true)
	var result: Dictionary = await api.call_rpc("inventory_discard", payload)
	_set_loading(false)
	if result.has("error"):
		$Mode.text = tr("Không thể bỏ vật phẩm: %s") % tr(str(result.error))
		return
	await refresh()
	$Mode.text = "Đã bỏ vật phẩm."

func _on_language_changed(_locale: String) -> void:
	if not is_node_ready() or not visible:
		return
	_refresh_grid()
	if not selected_slot.is_empty():
		for index in range(filtered.size()):
			var slot: Dictionary = filtered[index]
			var is_selected := (
				str(slot.get("instanceId", "")) == str(selected_slot.get("instanceId", ""))
				and str(slot.get("itemId", "")) == selected_id
			)
			if is_selected:
				select_slot(index)
				break
	if preview_mode:
		$Mode.text = tr("MẪU GIAO DIỆN • không phải túi tài khoản • không lưu")
	elif not pending_settlement.is_empty():
		var reward: Dictionary = pending_settlement.get("reward", {})
		var items: Array = reward.get("items", [])
		var count := int(items[0].quantity) if not items.is_empty() else 0
		$Mode.text = tr("THƯỞNG ĐANG CHỜ • Da Sơn Trư ×%d • %d tu vi • bỏ bớt vật tư rồi nhận") % [count, int(reward.get("cultivationXp", 0))]
	else:
		$Mode.text = tr("TÚI TÀI KHOẢN • dữ liệu được xác nhận bởi server")
