class_name GameMap
extends Node2D
## Shared runtime for the four prototype maps. Art is a single image; blockers
## and named areas are catalog data so the route and walkability stay aligned.

const TILE_SIZE_DEFAULT := 32

var map_data: Dictionary = {}
var map_id: String = ""
var map_name: String = ""
var map_size_tiles := Vector2i(48, 36)
var tile_size_px: int = TILE_SIZE_DEFAULT
var map_size_px := Vector2(1536, 1152)
var spawn_position := Vector2.ZERO
var active_area_id: String = ""
var active_area_name: String = ""
var _solid_rects_tiles: Array[Rect2i] = []
var _areas: Array[Dictionary] = []

func configure(data: Dictionary, tile_size: int = TILE_SIZE_DEFAULT) -> void:
	map_data = data.duplicate(true)
	map_id = str(map_data.get("id", ""))
	map_name = str(map_data.get("name", "Map"))
	tile_size_px = maxi(tile_size, 1)
	var dimensions: Array = map_data.get("size_tiles", [48, 36])
	map_size_tiles = Vector2i(int(dimensions[0]), int(dimensions[1]))
	map_size_px = Vector2(map_size_tiles * tile_size_px)
	var spawn_tiles: Array = map_data.get("spawn_tiles", [1, 1])
	spawn_position = Vector2(float(spawn_tiles[0]), float(spawn_tiles[1])) * tile_size_px
	_solid_rects_tiles.clear()
	for values: Array in map_data.get("solid_rects_tiles", []):
		if values.size() < 4:
			continue
		_solid_rects_tiles.append(Rect2i(
				Vector2i(int(values[0]), int(values[1])),
				Vector2i(int(values[2]), int(values[3]))
		))
	_areas.clear()
	for area_value: Variant in map_data.get("areas", []):
		if not area_value is Dictionary:
			continue
		var area: Dictionary = area_value.duplicate(true)
		var rect_values: Array = area.get("rect_tiles", [0, 0, 0, 0])
		if rect_values.size() >= 4:
			area["_rect"] = Rect2i(
				Vector2i(int(rect_values[0]), int(rect_values[1])),
				Vector2i(int(rect_values[2]), int(rect_values[3]))
			)
			_areas.append(area)

func _ready() -> void:
	var background: Sprite2D = $Background
	var preview_path := str(map_data.get("preview", ""))
	if not preview_path.is_empty():
		var texture := load(preview_path) as Texture2D
		if texture != null:
			background.texture = texture
	background.position = map_size_px / 2.0
	if background.texture != null:
		background.scale = map_size_px / Vector2(background.texture.get_size())
	_build_location_labels()
	_build_collision_shapes()
	var camera: Camera2D = $Player/Camera2D
	camera.position_smoothing_enabled = false
	$Player.position = spawn_position
	if not is_walkable($Player.position):
		$Player.position = map_size_px / 2.0
		spawn_position = $Player.position
	camera.limit_left = 0
	camera.limit_top = 0
	camera.limit_right = int(map_size_px.x)
	camera.limit_bottom = int(map_size_px.y)
	_update_area_and_camera($Player.position)

func is_walkable(point: Vector2) -> bool:
	if not Rect2(Vector2.ZERO, map_size_px).has_point(point):
		return false
	var tile_point := Vector2i(floori(point.x / tile_size_px), floori(point.y / tile_size_px))
	for tile_rect: Rect2i in _solid_rects_tiles:
		if tile_rect.has_point(tile_point):
			return false
	return true

func update_player_context(point: Vector2) -> String:
	_update_area_and_camera(point)
	return active_area_name

func areas_size() -> int:
	return _areas.size()

func _build_location_labels() -> void:
	var root: Node2D = $LocationLabels
	for landmark_value: Variant in map_data.get("landmarks", []):
		if not landmark_value is Dictionary:
			continue
		var landmark: Dictionary = landmark_value
		var tile_position: Array = landmark.get("position_tiles", [0, 0])
		if tile_position.size() < 2:
			continue
		var label := Label.new()
		label.name = "Landmark_" + str(root.get_child_count())
		label.text = str(landmark.get("name", ""))
		label.position = Vector2(float(tile_position[0]), float(tile_position[1])) * tile_size_px
		label.offset_left -= 55.0
		label.offset_right += 55.0
		label.offset_top -= 10.0
		label.offset_bottom += 10.0
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		label.add_theme_font_size_override("font_size", 9)
		label.theme = load("res://themes/tutien_theme.tres") as Theme
		label.mouse_filter = Control.MOUSE_FILTER_IGNORE
		label.z_index = 20
		root.add_child(label)

func _update_area_and_camera(point: Vector2) -> void:
	var tile_point := Vector2i(floori(point.x / tile_size_px), floori(point.y / tile_size_px))
	var next_area: Dictionary = {}
	for area: Dictionary in _areas:
		var area_rect: Rect2i = area.get("_rect", Rect2i())
		if area_rect.has_point(tile_point):
			next_area = area
			break
	if next_area.is_empty():
		return
	var next_id := str(next_area.get("id", ""))
	active_area_name = str(next_area.get("name", map_name))
	if next_id == active_area_id:
		return
	active_area_id = next_id
	if str(map_data.get("camera_mode", "map")) != "room_lock":
		return
	var camera: Camera2D = $Player/Camera2D
	var room_rect: Rect2i = next_area.get("_rect", Rect2i())
	camera.limit_left = room_rect.position.x * tile_size_px
	camera.limit_top = room_rect.position.y * tile_size_px
	camera.limit_right = room_rect.end.x * tile_size_px
	camera.limit_bottom = room_rect.end.y * tile_size_px

func _build_collision_shapes() -> void:
	var root: Node2D = $CollisionRoot
	for index in range(_solid_rects_tiles.size()):
		var tile_rect: Rect2i = _solid_rects_tiles[index]
		var body := StaticBody2D.new()
		body.name = "Blocker_%02d" % index
		body.collision_layer = 1
		body.collision_mask = 0
		body.position = Vector2(tile_rect.position * tile_size_px) + Vector2(tile_rect.size * tile_size_px) / 2.0
		var collision := CollisionShape2D.new()
		var rectangle := RectangleShape2D.new()
		rectangle.size = Vector2(tile_rect.size * tile_size_px)
		collision.shape = rectangle
		body.add_child(collision)
		root.add_child(body)
