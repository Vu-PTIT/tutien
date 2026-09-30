class_name LocalMapView
extends Control
## Displays the current runtime map at a whole-area scale with readable markers.

signal point_selected(index: int)
signal tile_selected(tile: Vector2i)
signal zoom_changed(value: float)

const MIN_ZOOM := 1.0
const MAX_ZOOM := 2.5
const ZOOM_STEP := 0.25
const PLAYER_COLOR := Color("ffe08a")
const GATE_COLOR := Color("f4c66e")
const GATHER_COLOR := Color("8fdda6")
const POI_COLOR := Color("edaa8d")

var _texture: Texture2D
var _map_data: Dictionary = {}
var _map_size_px := Vector2.ZERO
var _tile_size_px := 32
var _player_position := Vector2.ZERO
var _poi_positions: Array[Vector2] = []
var _poi_entry_indices: Array[int] = []
var _selected_index := -1
var _selected_tile := Vector2i(-1, -1)
var _zoom := MIN_ZOOM
var _pan := Vector2.ZERO
var _map_rect := Rect2()
var _pointer_down := false
var _dragged := false
var _pointer_origin := Vector2.ZERO
var _pan_origin := Vector2.ZERO

func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	mouse_filter = Control.MOUSE_FILTER_STOP

func set_map_texture(texture: Texture2D) -> void:
	_texture = texture
	queue_redraw()

func configure_map(data: Dictionary, map_size_px: Vector2, tile_size_px: int, player_position: Vector2) -> void:
	_map_data = data.duplicate(true)
	_map_size_px = map_size_px.max(Vector2.ONE)
	_tile_size_px = maxi(tile_size_px, 1)
	_player_position = player_position
	_selected_index = -1
	_selected_tile = Vector2i(-1, -1)
	_zoom = MIN_ZOOM
	_pan = Vector2.ZERO
	_rebuild_poi_positions()
	_update_map_rect()
	queue_redraw()

func update_player_position(point: Vector2) -> void:
	if point.is_equal_approx(_player_position):
		return
	_player_position = point
	queue_redraw()

func select_point(index: int) -> void:
	if index < -1 or index >= _poi_positions.size():
		return
	_selected_index = index
	_selected_tile = Vector2i(-1, -1)
	queue_redraw()
	if index >= 0:
		point_selected.emit(index)

func get_point_data(index: int) -> Dictionary:
	if index < 0 or index >= _poi_entry_indices.size():
		return {}
	var entries: Array = _map_data.get("interactables", [])
	var entry_index := _poi_entry_indices[index]
	if entry_index < 0 or entry_index >= entries.size() or not entries[entry_index] is Dictionary:
		return {}
	return entries[entry_index]

func zoom_in() -> void:
	_set_zoom(_zoom + ZOOM_STEP)

func zoom_out() -> void:
	_set_zoom(_zoom - ZOOM_STEP)

func fit_map() -> void:
	_zoom = MIN_ZOOM
	_pan = Vector2.ZERO
	_update_map_rect()
	queue_redraw()
	zoom_changed.emit(_zoom)

func _set_zoom(value: float) -> void:
	_zoom = clampf(value, MIN_ZOOM, MAX_ZOOM)
	_update_map_rect()
	queue_redraw()
	zoom_changed.emit(_zoom)

func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_update_map_rect()
		queue_redraw()

func _rebuild_poi_positions() -> void:
	_poi_positions.clear()
	_poi_entry_indices.clear()
	var entries: Array = _map_data.get("interactables", [])
	for entry_index in range(entries.size()):
		var value: Variant = entries[entry_index]
		if not value is Dictionary:
			continue
		var tile_position: Array = value.get("position_tiles", [])
		if tile_position.size() < 2:
			continue
		_poi_positions.append(Vector2(float(tile_position[0]) + 0.5, float(tile_position[1]) + 0.5) * _tile_size_px)
		_poi_entry_indices.append(entry_index)

func _update_map_rect() -> void:
	if size.x <= 0.0 or size.y <= 0.0 or _map_size_px.x <= 0.0 or _map_size_px.y <= 0.0:
		_map_rect = Rect2()
		return
	var fit_scale := minf(size.x / _map_size_px.x, size.y / _map_size_px.y)
	var rendered_size := _map_size_px * fit_scale * _zoom
	var max_pan := ((rendered_size - size).max(Vector2.ZERO)) * 0.5
	_pan = Vector2(clampf(_pan.x, -max_pan.x, max_pan.x), clampf(_pan.y, -max_pan.y, max_pan.y))
	_map_rect = Rect2((size - rendered_size) * 0.5 + _pan, rendered_size)

func _world_to_view(point: Vector2) -> Vector2:
	return _map_rect.position + Vector2(
		point.x / _map_size_px.x * _map_rect.size.x,
		point.y / _map_size_px.y * _map_rect.size.y
	)

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Color("101b20"), true)
	if _texture != null and _map_rect.size.x > 0.0 and _map_rect.size.y > 0.0:
		draw_texture_rect(_texture, _map_rect, false)
	else:
		var font := get_theme_default_font()
		if font != null:
			draw_string(font, Vector2(12, 24), tr("Đang dựng bản đồ…"), HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color("d8d2bd"))
	_draw_area_bounds()
	_draw_selected_tile()
	_draw_points_of_interest()
	_draw_player_marker()
	draw_rect(_map_rect, Color("b38c55"), false, 2.0)

func _draw_area_bounds() -> void:
	var font := get_theme_default_font()
	for value: Variant in _map_data.get("areas", []):
		if not value is Dictionary:
			continue
		var tiles: Array = value.get("rect_tiles", [])
		if tiles.size() < 4:
			continue
		var top_left := _world_to_view(Vector2(float(tiles[0]), float(tiles[1])) * _tile_size_px)
		var bottom_right := _world_to_view(Vector2(float(tiles[0] + tiles[2]), float(tiles[1] + tiles[3])) * _tile_size_px)
		var area_rect := Rect2(top_left, bottom_right - top_left)
		draw_rect(area_rect, Color(0.70, 0.84, 0.77, 0.42), false, 1.0)
		if font != null and area_rect.size.x >= 54.0 and area_rect.size.y >= 25.0:
			draw_string(font, area_rect.position + Vector2(4.0, 13.0), tr(str(value.get("name", ""))), HORIZONTAL_ALIGNMENT_LEFT, area_rect.size.x - 8.0, 9, Color("f3e7c9"))

func _draw_points_of_interest() -> void:
	for index in range(_poi_positions.size()):
		var center := _world_to_view(_poi_positions[index])
		var color := _poi_color(index)
		draw_circle(center, 6.0 if index == _selected_index else 4.5, Color("142127"))
		draw_circle(center, 3.0, color)
		if index == _selected_index:
			draw_arc(center, 7.0, 0.0, TAU, 20, Color("fff0bb"), 1.5)

func _draw_selected_tile() -> void:
	if _selected_tile.x < 0 or _selected_tile.y < 0:
		return
	var top_left := _world_to_view(Vector2(_selected_tile) * _tile_size_px)
	var bottom_right := _world_to_view(Vector2(_selected_tile + Vector2i.ONE) * _tile_size_px)
	var tile_rect := Rect2(top_left, bottom_right - top_left)
	draw_rect(tile_rect, Color(1.0, 0.91, 0.62, 0.25), true)
	draw_rect(tile_rect, Color("fff0bb"), false, 1.5)

func _draw_player_marker() -> void:
	var center := _world_to_view(_player_position)
	draw_circle(center, 8.0, Color("142127"))
	draw_colored_polygon(PackedVector2Array([
		center + Vector2(0.0, -6.0),
		center + Vector2(5.0, 0.0),
		center + Vector2(0.0, 6.0),
		center + Vector2(-5.0, 0.0)
	]), PLAYER_COLOR)
	draw_arc(center, 8.0, 0.0, TAU, 24, Color("fff5d2"), 1.0)

func _poi_color(index: int) -> Color:
	var point := get_point_data(index)
	if point.is_empty():
		return POI_COLOR
	match str(point.get("action_kind", "")):
		"gate": return GATE_COLOR
		"gather": return GATHER_COLOR
		_: return POI_COLOR

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		if mouse_event.button_index == MOUSE_BUTTON_WHEEL_UP and mouse_event.pressed:
			_set_zoom(_zoom + ZOOM_STEP)
			accept_event()
		elif mouse_event.button_index == MOUSE_BUTTON_WHEEL_DOWN and mouse_event.pressed:
			_set_zoom(_zoom - ZOOM_STEP)
			accept_event()
		elif mouse_event.button_index == MOUSE_BUTTON_LEFT:
			if mouse_event.pressed:
				_begin_pointer(_viewport_to_local(mouse_event.position))
			else:
				_end_pointer(_viewport_to_local(mouse_event.position))
			accept_event()
	elif event is InputEventMouseMotion and _pointer_down:
		_update_pointer(_viewport_to_local((event as InputEventMouseMotion).position))
		accept_event()
	elif event is InputEventScreenTouch:
		var touch_event := event as InputEventScreenTouch
		var local_point := _viewport_to_local(touch_event.position)
		if touch_event.pressed:
			_begin_pointer(local_point)
		else:
			_end_pointer(local_point)
		accept_event()
	elif event is InputEventScreenDrag and _pointer_down:
		_update_pointer(_viewport_to_local((event as InputEventScreenDrag).position))
		accept_event()

func _viewport_to_local(viewport_point: Vector2) -> Vector2:
	return get_global_transform_with_canvas().affine_inverse() * viewport_point

func _begin_pointer(point: Vector2) -> void:
	_pointer_down = true
	_dragged = false
	_pointer_origin = point
	_pan_origin = _pan

func _update_pointer(point: Vector2) -> void:
	if point.distance_to(_pointer_origin) > 5.0:
		_dragged = true
	if _dragged and _zoom > MIN_ZOOM:
		_pan = _pan_origin + point - _pointer_origin
		_update_map_rect()
		queue_redraw()

func _end_pointer(point: Vector2) -> void:
	if not _pointer_down:
		return
	_pointer_down = false
	if not _dragged:
		_select_location(point)

func _select_location(point: Vector2) -> void:
	if not _map_rect.has_point(point):
		return
	var normalized := (point - _map_rect.position) / _map_rect.size
	var tile := Vector2i(
		clampi(floori(normalized.x * _map_size_px.x / float(_tile_size_px)), 0, maxi(int(_map_size_px.x / float(_tile_size_px)) - 1, 0)),
		clampi(floori(normalized.y * _map_size_px.y / float(_tile_size_px)), 0, maxi(int(_map_size_px.y / float(_tile_size_px)) - 1, 0))
	)
	var closest_index := -1
	var closest_distance := 13.0
	for index in range(_poi_positions.size()):
		var distance := _world_to_view(_poi_positions[index]).distance_to(point)
		if distance < closest_distance:
			closest_distance = distance
			closest_index = index
	_selected_index = closest_index
	_selected_tile = tile
	queue_redraw()
	point_selected.emit(closest_index)
	tile_selected.emit(tile)
