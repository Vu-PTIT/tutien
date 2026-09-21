class_name InventoryPanel
extends AcceptDialog

## Pixel inventory presentation for the 24-slot catalog.
## `items` and its item count remain as a small compatibility surface for smoke tests.
var api: SocialApi
var summary: Label
var items: ItemList
var claim_button: Button
var refresh_button: Button
var loading: bool = false
var grid: GridContainer
var detail: Label
var slot_buttons: Array[Button] = []
var definitions: Dictionary = {}

const INK := Color("#33271f")
const PAPER := Color("#f5e1b8")

func _style(fill: Color, border: Color = Color("#73543a"), radius: int = 5) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(radius)
	style.content_margin_left = 7
	style.content_margin_right = 7
	style.content_margin_top = 4
	style.content_margin_bottom = 4
	return style

func _ready() -> void:
	title = "TÚI ĐỒ  ·  24 Ô"
	size = Vector2i(560, 360)
	add_theme_font_size_override("title_font_size", 14)
	add_theme_color_override("font_color", PAPER)

	var layout := VBoxContainer.new()
	layout.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layout.add_theme_constant_override("separation", 7)
	add_child(layout)

	summary = Label.new()
	summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	summary.custom_minimum_size = Vector2(520, 42)
	summary.add_theme_font_size_override("font_size", 11)
	summary.add_theme_color_override("font_color", INK)
	layout.add_child(summary)

	var body := HBoxContainer.new()
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_theme_constant_override("separation", 10)
	layout.add_child(body)

	grid = GridContainer.new()
	grid.columns = 6
	grid.custom_minimum_size = Vector2(330, 220)
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(grid)
	for index in range(24):
		var slot := Button.new()
		slot.custom_minimum_size = Vector2(48, 48)
		slot.text = "·"
		slot.add_theme_font_size_override("font_size", 12)
		slot.add_theme_color_override("font_color", Color("#ead3ae"))
		slot.add_theme_stylebox_override("normal", _style(Color("#3b5148"), Color("#6f8a70"), 3))
		slot.add_theme_stylebox_override("hover", _style(Color("#59725c"), Color("#e5c36e"), 3))
		var slot_index := index
		slot.pressed.connect(func() -> void: _select_slot(slot_index))
		grid.add_child(slot)
		slot_buttons.append(slot)

	var side := VBoxContainer.new()
	side.custom_minimum_size = Vector2(164, 220)
	side.add_theme_constant_override("separation", 5)
	body.add_child(side)
	var detail_title := Label.new()
	detail_title.text = "CHI TIẾT"
	detail_title.add_theme_font_size_override("font_size", 9)
	detail_title.add_theme_color_override("font_color", Color("#8b643d"))
	side.add_child(detail_title)
	detail = Label.new()
	detail.text = "Chọn một vật phẩm để xem công dụng."
	detail.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	detail.size_flags_vertical = Control.SIZE_EXPAND_FILL
	detail.add_theme_font_size_override("font_size", 10)
	detail.add_theme_color_override("font_color", INK)
	side.add_child(detail)
	var hint := Label.new()
	hint.text = "Vật phẩm sẽ liên kết với\ntrồng cây · luyện đan · chiến đấu."
	hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	hint.add_theme_font_size_override("font_size", 8)
	hint.add_theme_color_override("font_color", Color("#80674f"))
	side.add_child(hint)

	# Hidden compatibility list: the smoke test uses its count while the player sees the 24-slot grid.
	items = ItemList.new()
	items.visible = false
	add_child(items)

	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 8)
	layout.add_child(actions)
	claim_button = _action_button("Nhận vật tư khởi đầu")
	claim_button.pressed.connect(_claim)
	actions.add_child(claim_button)
	refresh_button = _action_button("Tải lại túi")
	refresh_button.pressed.connect(refresh)
	actions.add_child(refresh_button)
	var close_hint := Label.new()
	close_hint.text = "Esc · đóng"
	close_hint.add_theme_font_size_override("font_size", 9)
	close_hint.add_theme_color_override("font_color", Color("#80674f"))
	close_hint.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	close_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	actions.add_child(close_hint)

func _action_button(text: String) -> Button:
	var button := Button.new()
	button.text = text
	button.add_theme_font_size_override("font_size", 9)
	button.add_theme_color_override("font_color", INK)
	button.add_theme_stylebox_override("normal", _style(Color("#e7c98b")))
	button.add_theme_stylebox_override("hover", _style(Color("#d9a84e"), Color("#fff0bd")))
	return button

func open_inventory() -> void:
	popup_centered()
	await refresh()

func _set_loading(value: bool) -> void:
	loading = value
	claim_button.disabled = true
	refresh_button.disabled = value

func _set_slot(index: int, text: String, occupied: bool) -> void:
	var slot := slot_buttons[index]
	slot.text = text
	slot.add_theme_stylebox_override("normal", _style(Color("#6a5c45") if occupied else Color("#3b5148"), Color("#d9a84e") if occupied else Color("#6f8a70"), 3))

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
	definitions.clear()
	for definition: Dictionary in result.catalog:
		definitions[definition.id] = definition
	items.clear()
	for slot: Dictionary in inventory:
		var definition: Dictionary = definitions.get(slot.itemId, {})
		var item_name := str(definition.get("name", slot.itemId))
		items.add_item("%s × %d" % [item_name, int(slot.quantity)])
		if slot.has("instanceId"):
			items.set_item_tooltip(items.item_count - 1, "Mã vật phẩm: " + str(slot.instanceId))
	if inventory.is_empty(): items.add_item("Túi đang trống")
	for index in range(24): _set_slot(index, "·", false)
	for index in range(mini(inventory.size(), 24)):
		var slot: Dictionary = inventory[index]
		var definition: Dictionary = definitions.get(slot.itemId, {})
		var short_name := str(definition.get("name", slot.itemId)).left(3)
		_set_slot(index, short_name + "\n" + str(slot.quantity), true)
	summary.text = "%d linh thạch     %d / %d ô\n%s" % [int(profile.spiritStones), inventory.size(), int(result.capacity), "Đã nhận vật tư khởi đầu." if result.starterClaimed else "Gói một lần: 12 linh thạch · hạt Cam Lộ · nước · Hồi Nguyên Hoàn · áo vải."]
	claim_button.disabled = bool(result.starterClaimed)
	detail.text = "Chọn một vật phẩm để xem công dụng.\n\nTúi đồ là nơi chuẩn bị trước khi vào Trúc Âm."

func _select_slot(index: int) -> void:
	if index >= items.item_count or index >= slot_buttons.size():
		detail.text = "Ô trống.\n\nCó thể dùng ô này cho vật phẩm mới từ khám phá, trồng cây hoặc luyện đan."
		return
	var item_text := items.get_item_text(index)
	detail.text = item_text + "\n\nVật phẩm đang nằm trong túi nhân vật. Chi tiết dùng/trang bị sẽ được mở rộng cùng vòng gameplay tài nguyên."

func _claim() -> void:
	if loading: return
	_set_loading(true)
	summary.text = "Đang nhận vật tư…"
	# Fixed ID remains safe across timeouts, re-login and app restarts.
	var result := await api.call_rpc("inventory_claim_starter", {"operationId": "starter_claim_v1"})
	_set_loading(false)
	if result.has("error"):
		summary.text = "Chưa xác nhận nhận thưởng: " + str(result.error) + "\nBấm Tải lại túi trước khi thử lại."
		return
	await refresh()
