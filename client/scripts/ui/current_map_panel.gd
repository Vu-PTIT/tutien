class_name CurrentMapPanel
extends Control
## Read-only overview of the currently loaded runtime map.

signal route_requested

const MAP_WORLD_SCENE: PackedScene = preload("res://scenes/map_world.tscn")

@onready var overview_viewport: SubViewport = $OverviewViewport
@onready var map_view: LocalMapView = $Window/Layout/Content/Body/MapFrame/MapView
@onready var title_label: Label = $Window/Layout/Content/Header/Title
@onready var area_label: Label = $Window/Layout/Content/Body/Details/DetailsContent/DetailsVBox/Area
@onready var coordinates_label: Label = $Window/Layout/Content/Body/Details/DetailsContent/DetailsVBox/Coordinates
@onready var details_title: Label = $Window/Layout/Content/Body/Details/DetailsContent/DetailsVBox/DetailsTitle
@onready var details_body: Label = $Window/Layout/Content/Body/Details/DetailsContent/DetailsVBox/DetailsBody
@onready var poi_list: VBoxContainer = $Window/Layout/Content/Body/Details/DetailsContent/DetailsVBox/PoiScroll/PoiList
@onready var zoom_label: Label = $Window/Layout/Content/Footer/ZoomLabel
@onready var close_button: Button = $Window/Layout/Content/Header/Close
@onready var route_button: Button = $Window/Layout/Content/Footer/Route
@onready var zoom_out_button: Button = $Window/Layout/Content/Footer/ZoomOut
@onready var fit_button: Button = $Window/Layout/Content/Footer/Fit
@onready var zoom_in_button: Button = $Window/Layout/Content/Footer/ZoomIn

var _overview_world: GameMap
var _map_data: Dictionary = {}
var _map_size_px := Vector2.ZERO
var _tile_size_px := 32
var _player_position := Vector2.ZERO
var _area_name := ""
var _selected_poi_index := -1
var _selected_tile := Vector2i.ZERO
var _has_selected_tile := false
var _poi_buttons: Array[Button] = []

func _ready() -> void:
	visible = false
	# Viewport exposes world_2d (not own_world_2d); assigning a fresh World2D
	# keeps the map snapshot's Camera2D isolated from the gameplay viewport.
	overview_viewport.world_2d = World2D.new()
	overview_viewport.render_target_update_mode = SubViewport.UPDATE_DISABLED
	map_view.point_selected.connect(_on_point_selected)
	map_view.tile_selected.connect(_on_tile_selected)
	map_view.zoom_changed.connect(func(value: float) -> void: zoom_label.text = "×%.1f" % value)
	close_button.pressed.connect(close_panel)
	route_button.pressed.connect(func() -> void: route_requested.emit())
	zoom_out_button.pressed.connect(map_view.zoom_out)
	fit_button.pressed.connect(map_view.fit_map)
	zoom_in_button.pressed.connect(map_view.zoom_in)
	_render_details()

func open_map(world: GameMap, player_position: Vector2) -> void:
	if world == null:
		return
	visible = true
	_map_data = world.map_data.duplicate(true)
	_map_size_px = world.map_size_px
	_tile_size_px = world.tile_size_px
	_player_position = player_position
	_area_name = world.active_area_name
	_selected_poi_index = -1
	_has_selected_tile = false
	map_view.set_map_texture(null)
	title_label.text = tr("BẢN ĐỒ KHU VỰC • %s") % tr(world.map_name)
	map_view.configure_map(_map_data, _map_size_px, _tile_size_px, _player_position)
	_populate_poi_list()
	_render_details()
	zoom_label.text = "×1.0"
	await _build_overview(world)

func update_position(player_position: Vector2, area_name: String) -> void:
	var position_changed := not _player_position.is_equal_approx(player_position)
	var area_changed := _area_name != area_name
	if not position_changed and not area_changed:
		return
	_player_position = player_position
	_area_name = area_name
	map_view.update_player_position(player_position)
	area_label.text = tr("Khu vực: %s") % tr(area_name) if not area_name.is_empty() else tr("Khu vực hiện tại")
	_update_coordinate_label()

func close_panel() -> void:
	visible = false
	overview_viewport.render_target_update_mode = SubViewport.UPDATE_DISABLED
	if is_instance_valid(_overview_world):
		_overview_world.free()
	_overview_world = null
	map_view.set_map_texture(null)
	overview_viewport.size = Vector2i(2, 2)

func _build_overview(source_world: GameMap) -> void:
	overview_viewport.render_target_update_mode = SubViewport.UPDATE_DISABLED
	if is_instance_valid(_overview_world):
		_overview_world.free()
	_overview_world = null
	overview_viewport.size = Vector2i(roundi(_map_size_px.x), roundi(_map_size_px.y))
	overview_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	var snapshot := MAP_WORLD_SCENE.instantiate() as GameMap
	if snapshot == null:
		push_error("Could not create current-map overview scene")
		overview_viewport.render_target_update_mode = SubViewport.UPDATE_DISABLED
		overview_viewport.size = Vector2i(2, 2)
		return
	snapshot.configure(_map_data, _tile_size_px, source_world.get_resource_tree_states())
	snapshot.process_mode = Node.PROCESS_MODE_DISABLED
	var duplicate_player := snapshot.get_node_or_null("Actors/Player") as CanvasItem
	if duplicate_player != null:
		duplicate_player.hide()
	var gameplay_camera := snapshot.get_node_or_null("Actors/Player/Camera2D") as Camera2D
	if gameplay_camera != null:
		gameplay_camera.enabled = false
	overview_viewport.add_child(snapshot)
	_overview_world = snapshot
	var actors := snapshot.get_node_or_null("Actors")
	if actors != null:
		for child: Node in actors.get_children():
			if child is MapProp or child is MapResourceTree or child is MapFlower:
				child.process_mode = Node.PROCESS_MODE_DISABLED
				if child is MapProp:
					(child as MapProp).update_player_occlusion(Vector2(-10000.0, -10000.0))
				continue
			var canvas_child := child as CanvasItem
			if canvas_child != null:
				canvas_child.hide()
	for node_name: String in ["CollisionRoot", "LocationLabels", "AmbientFX"]:
		var canvas_node := snapshot.get_node_or_null(NodePath(node_name)) as CanvasItem
		if canvas_node != null:
			canvas_node.hide()
	var overview_camera := Camera2D.new()
	overview_camera.name = "MapOverviewCamera"
	overview_camera.position = _map_size_px * 0.5
	overview_camera.zoom = Vector2.ONE
	overview_camera.position_smoothing_enabled = false
	overview_camera.limit_enabled = false
	overview_camera.process_mode = Node.PROCESS_MODE_ALWAYS
	snapshot.add_child(overview_camera)
	overview_camera.make_current()
	await RenderingServer.frame_post_draw
	if not visible or not is_instance_valid(snapshot) or _overview_world != snapshot:
		return
	overview_viewport.render_target_update_mode = SubViewport.UPDATE_DISABLED
	map_view.set_map_texture(overview_viewport.get_texture())

func _populate_poi_list() -> void:
	for child: Node in poi_list.get_children():
		child.queue_free()
	_poi_buttons.clear()
	var entries: Variant = _map_data.get("interactables", [])
	if not entries is Array or entries.is_empty():
		var empty_label := Label.new()
		empty_label.text = tr("Khu vực chưa có điểm quan tâm.")
		empty_label.theme_type_variation = &"UISmall"
		empty_label.autowrap_mode = TextServer.AUTOWRAP_WORD
		poi_list.add_child(empty_label)
		return
	var group := ButtonGroup.new()
	for index in range(entries.size()):
		var value: Variant = entries[index]
		if not value is Dictionary:
			continue
		var position_tiles: Array = value.get("position_tiles", [])
		if position_tiles.size() < 2:
			continue
		var button := Button.new()
		button.text = tr(str(value.get("display_name", value.get("action_label", "Điểm quan tâm"))))
		button.tooltip_text = tr(str(value.get("action_label", value.get("action_kind", "Điểm quan tâm"))))
		button.custom_minimum_size = Vector2(0.0, 26.0)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.theme_type_variation = &"UIButtonSmall"
		button.toggle_mode = true
		button.button_group = group
		button.pressed.connect(map_view.select_point.bind(_poi_buttons.size()))
		poi_list.add_child(button)
		_poi_buttons.append(button)
	if _poi_buttons.is_empty():
		var empty_label := Label.new()
		empty_label.text = tr("Khu vực chưa có điểm quan tâm.")
		empty_label.theme_type_variation = &"UISmall"
		empty_label.autowrap_mode = TextServer.AUTOWRAP_WORD
		poi_list.add_child(empty_label)

func _on_point_selected(index: int) -> void:
	_selected_poi_index = index
	_has_selected_tile = false
	for button_index in range(_poi_buttons.size()):
		_poi_buttons[button_index].button_pressed = button_index == index
	_render_details()

func _on_tile_selected(tile: Vector2i) -> void:
	if _selected_poi_index >= 0:
		return
	_selected_tile = tile
	_has_selected_tile = true
	_update_coordinate_label()
	if _selected_poi_index < 0:
		details_title.text = tr(_area_name) if not _area_name.is_empty() else tr(str(_map_data.get("name", "Map")))
		details_body.text = tr(str(_map_data.get("summary", "")))

func _render_details() -> void:
	area_label.text = tr("Khu vực: %s") % tr(_area_name) if not _area_name.is_empty() else tr("Khu vực hiện tại")
	_update_coordinate_label()
	var point := map_view.get_point_data(_selected_poi_index)
	if not point.is_empty():
		details_title.text = tr(str(point.get("display_name", "Điểm quan tâm")))
		var action_label := tr(str(point.get("action_label", point.get("action_kind", "Điểm quan tâm"))))
		var description := tr(str(point.get("message", point.get("description", ""))))
		details_body.text = action_label if description.is_empty() else action_label + "\n" + description
	else:
		details_title.text = tr(_area_name) if not _area_name.is_empty() else tr(str(_map_data.get("name", "Map")))
		var summary := tr(str(_map_data.get("summary", "")))
		var region_body := tr(str(_map_data.get("region_body", "")))
		details_body.text = summary if region_body.is_empty() else summary + "\n" + region_body

func _update_coordinate_label() -> void:
	var point := map_view.get_point_data(_selected_poi_index)
	if not point.is_empty():
		var position_tiles: Array = point.get("position_tiles", [])
		if position_tiles.size() >= 2:
			coordinates_label.text = tr("Điểm: (%d, %d)") % [floori(float(position_tiles[0])), floori(float(position_tiles[1]))]
			return
	if _has_selected_tile:
		coordinates_label.text = tr("Ô bản đồ: (%d, %d)") % [_selected_tile.x, _selected_tile.y]
		return
	coordinates_label.text = _format_coordinates(_player_position)

func _format_coordinates(position: Vector2) -> String:
	var tile_x := floori(position.x / float(maxi(_tile_size_px, 1)))
	var tile_y := floori(position.y / float(maxi(_tile_size_px, 1)))
	return tr("Vị trí: (%d, %d)") % [tile_x, tile_y]
