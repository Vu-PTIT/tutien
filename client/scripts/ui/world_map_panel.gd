class_name WorldMapPanel
extends Control
## Route and local map travel for the prototype. Server unlocks are not applied.
signal close_requested
signal map_requested(map_id: String)

const CATALOG_PATH := "res://data/map_catalog.json"

@onready var route: HBoxContainer = $Window/Route
@onready var info: Label = $Window/Info
@onready var preview: TextureRect = $Window/Preview
@onready var no_preview: Label = $Window/NoPreview
@onready var close_button: Button = $Window/Close
@onready var travel_button: Button = $Window/Travel

var maps_by_id: Dictionary = {}
var route_buttons: Dictionary = {}
var map_entries: Array = []
var catalog: Dictionary = {}
var selected_id: String = ""
var current_map_id: String = "m_an_khe"
var _button_group := ButtonGroup.new()

func _ready() -> void:
	close_button.pressed.connect(func() -> void:
		visible = false
		close_requested.emit())
	travel_button.pressed.connect(func() -> void:
		if not selected_id.is_empty():
			map_requested.emit(selected_id))
	_load_catalog()
	_build_route()
	_select_map("m_an_khe")

func open_map() -> void:
	visible = true
	_select_map(current_map_id if maps_by_id.has(current_map_id) else "m_an_khe")

func set_current_map(map_id: String) -> void:
	current_map_id = map_id
	for entry: Dictionary in map_entries:
		var entry_id := str(entry.get("id", ""))
		var button: Button = route_buttons.get(entry_id)
		if button == null:
			continue
		button.text = str(entry.get("route_label", entry.get("name", "Map")))
		button.tooltip_text = str(entry.get("name", "Map"))
		if entry_id == current_map_id:
			button.text = str(entry.get("name", "Map")) + "\nĐang ở đây"
			button.tooltip_text += " • đang ở"
	if visible:
		_select_map(current_map_id)

func _load_catalog() -> void:
	var file := FileAccess.open(CATALOG_PATH, FileAccess.READ)
	if file == null:
		push_error("Cannot open map catalog: " + CATALOG_PATH)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		push_error("Map catalog has an invalid shape")
		return
	catalog = parsed
	var entries: Variant = catalog.get("maps", null)
	if not entries is Array:
		push_error("Map catalog is missing its maps array")
		return
	map_entries = entries
	for map_data: Variant in map_entries:
		if map_data is Dictionary and map_data.has("id"):
			maps_by_id[str(map_data.id)] = map_data

func _build_route() -> void:
	for child in route.get_children():
		child.queue_free()
	route_buttons.clear()
	for index in range(map_entries.size()):
		var map_data: Dictionary = map_entries[index]
		var button := Button.new()
		button.name = str(map_data.get("id", "Map%d" % index))
		button.text = str(map_data.get("route_label", map_data.get("name", "Map")))
		button.custom_minimum_size = Vector2(108, 54)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.add_theme_font_size_override("font_size", 8)
		button.toggle_mode = true
		button.button_group = _button_group
		button.pressed.connect(_select_map.bind(str(map_data.get("id", ""))))
		route.add_child(button)
		route_buttons[str(map_data.get("id", ""))] = button
		if index < map_entries.size() - 1:
			var arrow := Label.new()
			arrow.text = "›"
			arrow.custom_minimum_size = Vector2(12, 54)
			arrow.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			arrow.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
			arrow.add_theme_font_size_override("font_size", 14)
			route.add_child(arrow)

func _select_map(map_id: String) -> void:
	if not maps_by_id.has(map_id):
		return
	selected_id = map_id
	var map_data: Dictionary = maps_by_id[map_id]
	info.text = "%s  •  %s\n%s" % [
		str(map_data.get("name", "Map")),
		str(map_data.get("summary", "")),
		str(map_data.get("details", ""))
	]
	var button: Button = route_buttons.get(map_id)
	if button != null:
		button.button_pressed = true
	var preview_path := str(map_data.get("preview", ""))
	var texture: Texture2D = load(preview_path) if not preview_path.is_empty() else null
	preview.texture = texture
	preview.visible = texture != null
	no_preview.visible = texture == null
	if texture == null:
		no_preview.text = "Chưa có ảnh preview"
	travel_button.disabled = map_id == current_map_id
	travel_button.text = "Đang ở đây" if map_id == current_map_id else "Đi thử map này"
