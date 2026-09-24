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
var starter_claimed: bool = false
var stones: int = 0
var summary: Label
var claim_button: Button
var refresh_button: Button
var slot_buttons: Array[Button] = []

func _ready() -> void:
	summary = $Summary
	claim_button = $Claim
	refresh_button = $Refresh
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
	show_preview()

func open_inventory() -> void:
	show()
	if api == null or api.token.is_empty():
		show_preview()
	else:
		await refresh()

func show_preview() -> void:
	preview_mode = true
	stones = 0
	starter_claimed = false
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
		if category == "all" or Visuals.definition(str(slot.itemId))[2] == category:
			filtered.append(slot)
	for index in range(24):
		var button := slot_buttons[index]
		button.icon = null
		button.tooltip_text = "Ô trống"
		button.get_node("Quantity").text = ""
		button.disabled = loading
		if index < filtered.size():
			var item: Dictionary = filtered[index]
			button.icon = Visuals.icon(str(item.itemId))
			button.get_node("Quantity").text = str(item.quantity)
			button.tooltip_text = str(Visuals.definition(str(item.itemId))[0])
	for entry in [["All", "all"], ["Equipment", "equipment"], ["Materials", "material"], ["Consumables", "consumable"]]:
		get_node(entry[0]).modulate = Color("efcd87") if category == entry[1] else Color.WHITE
	summary.text = ("Mẫu • %d / 24 ô" % inventory.size()) if preview_mode else ("%d linh thạch • %d / 24 ô" % [stones, inventory.size()])
	claim_button.disabled = loading or preview_mode or starter_claimed
	claim_button.text = "Kết nối để nhận vật tư" if preview_mode else ("Đã nhận vật tư" if starter_claimed else "Nhận vật tư khởi đầu")
	refresh_button.disabled = loading or preview_mode

func select_slot(index: int) -> void:
	selected_id = ""
	if index < 0 or index >= filtered.size():
		$Detail/Icon.texture = null
		$Detail/Name.text = "Ô trống"
		$Detail/Body.text = "Ô này chưa có vật phẩm."
		return
	var slot: Dictionary = filtered[index]
	selected_id = str(slot.itemId)
	var entry := Visuals.definition(selected_id)
	var definition: Dictionary = catalog.get(selected_id, {})
	$Detail/Icon.texture = Visuals.icon(selected_id)
	$Detail/Name.text = str(definition.get("name", entry[0]))
	var bound := bool(definition.get("bound", selected_id in ["it_mach_ban", "it_ledger"]))
	$Detail/Body.text = "%s\n\nNguồn: %s\nSố lượng: %d%s" % [
		entry[3], entry[4], int(slot.quantity), "\nGắn nhân vật" if bound else ""]
	if slot.has("instanceId"):
		$Detail/Name.tooltip_text = "Instance: " + str(slot.instanceId)
	else:
		$Detail/Name.tooltip_text = ""

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
	starter_claimed = true
	stones = 0
	_set_loading(true)
	select_slot(-1)
	$Mode.text = "Đang tải túi từ server…"
	var result: Dictionary = await api.call_rpc("inventory_get")
	if result.has("error"):
		$Mode.text = "Không tải được túi: " + str(result.error)
		_set_loading(false)
		return
	var profile: Dictionary = result.profile
	inventory = profile.inventory
	stones = int(profile.spiritStones)
	starter_claimed = bool(result.starterClaimed)
	for definition: Dictionary in result.catalog:
		catalog[definition.id] = definition
	$Mode.text = "TÚI TÀI KHOẢN • dữ liệu được xác nhận bởi server"
	_set_loading(false)
	select_slot(0)

func _claim() -> void:
	if loading or preview_mode or starter_claimed or api == null:
		return
	_set_loading(true)
	$Mode.text = "Đang xác nhận vật tư…"
	var result: Dictionary = await api.call_rpc("inventory_claim_starter", {"operationId": "starter_claim_v1"})
	_set_loading(false)
	if result.has("error"):
		$Mode.text = "Chưa xác nhận. Hãy tải lại túi trước khi thử lại."
		starter_claimed = true # Keep retry gated when a filter redraws buttons.
		claim_button.disabled = true
		return
	await refresh()
