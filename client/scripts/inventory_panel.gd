class_name InventoryPanel
extends AcceptDialog
## One shared authenticated HTTP adapter. Retrying uses a stable operation ID.
var api: SocialApi
var summary: Label
var items: ItemList
var claim_button: Button
var refresh_button: Button
var loading: bool = false

func _ready() -> void:
	title = "Túi đồ"
	size = Vector2i(660, 430)
	var layout := VBoxContainer.new()
	layout.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(layout)
	summary = Label.new()
	summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	summary.custom_minimum_size = Vector2(620, 60)
	layout.add_child(summary)
	items = ItemList.new()
	items.custom_minimum_size = Vector2(620, 235)
	items.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_child(items)
	var actions := HBoxContainer.new()
	layout.add_child(actions)
	claim_button = Button.new()
	claim_button.text = "Nhận vật tư khởi đầu"
	claim_button.pressed.connect(_claim)
	actions.add_child(claim_button)
	refresh_button = Button.new()
	refresh_button.text = "Tải lại túi"
	refresh_button.pressed.connect(refresh)
	actions.add_child(refresh_button)

func open_inventory() -> void:
	popup_centered()
	await refresh()

func _set_loading(value: bool) -> void:
	loading = value
	claim_button.disabled = true
	refresh_button.disabled = value

func refresh() -> void:
	if loading: return
	_set_loading(true)
	summary.text = "Đang tải túi đồ…"
	var result := await api.call_rpc("inventory_get")
	_set_loading(false)
	if result.has("error"):
		summary.text = "Không tải được túi: " + str(result.error)
		return
	var profile: Dictionary = result.profile
	var inventory: Array = profile.inventory
	var definitions: Dictionary = {}
	for definition: Dictionary in result.catalog:
		definitions[definition.id] = definition
	items.clear()
	for slot: Dictionary in inventory:
		var definition: Dictionary = definitions.get(slot.itemId, {})
		var label := "%s × %d" % [str(definition.get("name", slot.itemId)), int(slot.quantity)]
		if bool(definition.get("bound", false)): label += " · Gắn nhân vật"
		items.add_item(label)
		if slot.has("instanceId"):
			items.set_item_tooltip(items.item_count - 1, "Mã vật phẩm: " + str(slot.instanceId))
	if inventory.is_empty(): items.add_item("Túi đang trống")
	summary.text = "%d linh thạch · %d/%d ô\n%s" % [int(profile.spiritStones), inventory.size(), int(result.capacity),
		"Đã nhận vật tư khởi đầu." if result.starterClaimed else "Gói một lần: 12 linh thạch, 2 hạt Cam Lộ, 4 nước, 2 Hồi Nguyên Hoàn, 1 áo vải."]
	claim_button.disabled = bool(result.starterClaimed)

func _claim() -> void:
	if loading: return
	_set_loading(true)
	summary.text = "Đang nhận vật tư…"
	# Fixed ID remains safe across timeouts, re-login and app restarts. Server scopes
	# it to the authenticated account and enforces starter:v1 uniqueness as well.
	var result := await api.call_rpc("inventory_claim_starter", {"operationId": "starter_claim_v1"})
	_set_loading(false)
	if result.has("error"):
		summary.text = "Chưa xác nhận nhận thưởng: " + str(result.error) + "\nBấm Tải lại túi trước khi thử lại."
		return
	await refresh()
