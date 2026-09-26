class_name GameMap
extends Node2D
## Shared world runtime for the four maps.
## Gameplay uses reusable 32 px terrain and independent 128 px landmark regions.
## Painted world PNG files are retained only for route concept previews.

const TILE_SIZE_DEFAULT := 32
const TILE_SYMBOLS := "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"
const INTERACTABLE_SCENE = preload("res://scenes/map_interactable.tscn")
const WATER_RIPPLE_SCENE = preload("res://scenes/map_water_ripple.tscn")
const MAP_PROP_SCENE = preload("res://scenes/map_prop.tscn")

const MAP_LAYOUTS := {
	"m_an_khe": "res://data/maps/an_khe.json",
	"m_truc_am": "res://data/maps/truc_am.json",
	"m_thach_can": "res://data/maps/thach_can.json",
	"m_co_tinh": "res://data/maps/co_tinh.json",
}

var map_data: Dictionary = {}
var map_id: String = ""
var map_name: String = ""
var map_size_tiles := Vector2i(48, 36)
var tile_size_px: int = TILE_SIZE_DEFAULT
var map_size_px := Vector2(1536, 1152)
var spawn_position := Vector2.ZERO
var active_area_id: String = ""
var active_area_name: String = ""
var active_interactable: MapInteractable
var _solid_rects_tiles: Array[Rect2i] = []
var _collision_walkable_rects_tiles: Array[Rect2i] = []
var _solid_terrain_cells: Dictionary = {}
var _areas: Array[Dictionary] = []
var _interactables: Array[MapInteractable] = []
var _props: Array[MapProp] = []

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
	_collision_walkable_rects_tiles.clear()
	_solid_terrain_cells.clear()
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
	background.visible = false
	var tiled := _build_authored_tile_layers()
	if not tiled:
		push_error("Cannot build authored TileMap: " + map_id)
	_build_location_labels()
	_build_collision_shapes()
	_build_interactables()
	_build_water_ripples()
	var camera: Camera2D = $Actors/Player/Camera2D
	camera.position_smoothing_enabled = false
	$Actors/Player.position = spawn_position
	if not is_walkable($Actors/Player.position):
		$Actors/Player.position = map_size_px / 2.0
		spawn_position = $Actors/Player.position
	camera.limit_left = 0
	camera.limit_top = 0
	camera.limit_right = int(map_size_px.x)
	camera.limit_bottom = int(map_size_px.y)
	_update_area_and_camera($Actors/Player.position)
	_update_prop_occlusion($Actors/Player.position)
	_update_location_labels($Actors/Player.position)
	update_interaction_focus($Actors/Player.position)

func _build_authored_tile_layers() -> bool:
	var layout_path := str(MAP_LAYOUTS.get(map_id, ""))
	if layout_path.is_empty() or not FileAccess.file_exists(layout_path):
		return false
	var file := FileAccess.open(layout_path, FileAccess.READ)
	if file == null:
		return false
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		return false
	var layout: Dictionary = parsed
	var tile_set_path := str(layout.get("tile_set", ""))
	var tile_set := load(tile_set_path) as TileSet
	if tile_set == null:
		return false
	var atlas_columns := maxi(int(layout.get("atlas_columns", 8)), 1)
	var ground: TileMapLayer = $WorldLayers/GroundLayer
	var detail: TileMapLayer = $WorldLayers/DetailLayer
	var foreground: TileMapLayer = $WorldLayers/ForegroundLayer
	for layer: TileMapLayer in [ground, detail, foreground]:
		layer.tile_set = tile_set
		layer.clear()
	var rows: Array = layout.get("ground_rows", [])
	if rows.size() != map_size_tiles.y:
		return false
	_solid_terrain_cells.clear()
	_collision_walkable_rects_tiles.clear()
	var solid_tile_ids: Dictionary = {}
	for value: Variant in layout.get("solid_tile_ids", []):
		solid_tile_ids[int(value)] = true
	for values: Array in layout.get("collision_walkable_rects_tiles", []):
		if values.size() < 4:
			continue
		_collision_walkable_rects_tiles.append(Rect2i(
			Vector2i(int(values[0]), int(values[1])),
			Vector2i(int(values[2]), int(values[3]))
		))
	for y in range(map_size_tiles.y):
		var row := str(rows[y])
		if row.length() != map_size_tiles.x:
			return false
		for x in range(map_size_tiles.x):
			var tile_index := TILE_SYMBOLS.find(row.substr(x, 1))
			if not _set_atlas_cell(ground, Vector2i(x, y), tile_index, atlas_columns):
				return false
			if solid_tile_ids.has(tile_index):
				_solid_terrain_cells[Vector2i(x, y)] = true
	for value: Dictionary in layout.get("detail_tiles", []):
		var tile_position: Array = value.get("position_tiles", [])
		if tile_position.size() != 2:
			return false
		if not _set_atlas_cell(detail, Vector2i(int(tile_position[0]), int(tile_position[1])), int(value.get("tile", -1)), atlas_columns):
			return false
	_build_props(layout)
	return ground.get_used_cells().size() == map_size_tiles.x * map_size_tiles.y

func _set_atlas_cell(layer: TileMapLayer, cell: Vector2i, tile_index: int, columns: int) -> bool:
	if tile_index < 0 or not Rect2i(Vector2i.ZERO, map_size_tiles).has_point(cell):
		return false
	var coords := Vector2i(tile_index % columns, floori(float(tile_index) / columns))
	var source := layer.tile_set.get_source(0) as TileSetAtlasSource
	if source == null or not source.has_tile(coords):
		return false
	layer.set_cell(cell, 0, coords)
	return true

func _build_props(layout: Dictionary) -> void:
	var atlas_path := str(layout.get("props_atlas", ""))
	if atlas_path.is_empty():
		return
	var columns := maxi(int(layout.get("props_columns", 8)), 1)
	var cell_px := maxi(int(layout.get("props_cell_px", 128)), 1)
	var texture := load(atlas_path) as Texture2D
	if texture == null:
		push_error("Missing props atlas: " + atlas_path)
		return
	var root: Node2D = $Actors
	_props.clear()
	for value: Variant in layout.get("props", []):
		if not value is Dictionary:
			continue
		var prop := MAP_PROP_SCENE.instantiate() as MapProp
		root.add_child(prop)
		prop.configure(value, texture, tile_size_px, columns, cell_px)
		_props.append(prop)

func _build_interactables() -> void:
	var root: Node2D = $Actors
	_interactables.clear()
	for value: Variant in map_data.get("interactables", []):
		if not value is Dictionary:
			continue
		var interactable := INTERACTABLE_SCENE.instantiate() as MapInteractable
		root.add_child(interactable)
		interactable.configure(value, tile_size_px)
		_interactables.append(interactable)

func _build_water_ripples() -> void:
	var root: Node2D = $AmbientFX
	for value: Variant in map_data.get("water_ripples", []):
		if not value is Dictionary:
			continue
		var tile_position: Array = value.get("position_tiles", [0, 0])
		if tile_position.size() < 2:
			continue
		var ripple := WATER_RIPPLE_SCENE.instantiate() as MapWaterRipple
		root.add_child(ripple)
		ripple.configure(
			Vector2(float(tile_position[0]), float(tile_position[1])),
			tile_size_px,
			str(value.get("color", "#8eeaff")),
			float(value.get("phase", 0.0))
		)

func is_walkable(point: Vector2) -> bool:
	if not Rect2(Vector2.ZERO, map_size_px).has_point(point):
		return false
	var tile_point := Vector2i(floori(point.x / tile_size_px), floori(point.y / tile_size_px))
	for tile_rect: Rect2i in _solid_rects_tiles:
		if tile_rect.has_point(tile_point):
			return false
	if _solid_terrain_cells.has(tile_point) and not _is_terrain_walkable_exception(tile_point):
		return false
	return true

func _is_terrain_walkable_exception(tile_point: Vector2i) -> bool:
	for tile_rect: Rect2i in _collision_walkable_rects_tiles:
		if tile_rect.has_point(tile_point):
			return true
	return false

func update_player_context(point: Vector2) -> String:
	_update_area_and_camera(point)
	_update_prop_occlusion(point)
	_update_location_labels(point)
	return active_area_name

func _update_prop_occlusion(point: Vector2) -> void:
	for prop: MapProp in _props:
		prop.update_player_occlusion(point)

func areas_size() -> int:
	return _areas.size()

func interactables_size() -> int:
	return _interactables.size()

func props_size() -> int:
	return _props.size()

func get_interactable(entity_id: String) -> MapInteractable:
	for interactable: MapInteractable in _interactables:
		if interactable.entity_id == entity_id:
			return interactable
	return null

func update_interaction_focus(point: Vector2) -> MapInteractable:
	var nearest: MapInteractable
	var nearest_distance := INF
	for interactable: MapInteractable in _interactables:
		var distance := point.distance_to(interactable.position)
		if interactable.is_in_range(point) and distance < nearest_distance and _has_clear_interaction_path(point, interactable.position):
			nearest = interactable
			nearest_distance = distance
	for interactable: MapInteractable in _interactables:
		interactable.set_focused(interactable == nearest)
	active_interactable = nearest
	return active_interactable

func _has_clear_interaction_path(from: Vector2, to: Vector2) -> bool:
	# A nearby object must not be usable through the solid footprint of a building.
	var distance := from.distance_to(to)
	var samples := ceili(distance / (tile_size_px / 4.0))
	for step in range(1, samples):
		if not is_walkable(from.lerp(to, float(step) / samples)):
			return false
	return true

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
		var world_point := Vector2(float(tile_position[0]), float(tile_position[1])) * tile_size_px
		label.position = world_point
		label.set_meta("world_point", world_point)
		label.visible = false
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

func _update_location_labels(point: Vector2) -> void:
	for node: Node in $LocationLabels.get_children():
		var label := node as Label
		if label != null:
			var anchor: Vector2 = label.get_meta("world_point", Vector2.ZERO)
			label.visible = point.distance_to(anchor) <= tile_size_px * 5.0

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
	var camera: Camera2D = $Actors/Player/Camera2D
	var room_rect: Rect2i = next_area.get("_rect", Rect2i())
	camera.limit_left = room_rect.position.x * tile_size_px
	camera.limit_top = room_rect.position.y * tile_size_px
	camera.limit_right = room_rect.end.x * tile_size_px
	camera.limit_bottom = room_rect.end.y * tile_size_px

func _build_collision_shapes() -> void:
	var root: Node2D = $CollisionRoot
	var blocked_cells: Dictionary = {}
	for tile_rect: Rect2i in _solid_rects_tiles:
		for y in range(tile_rect.position.y, tile_rect.end.y):
			for x in range(tile_rect.position.x, tile_rect.end.x):
				blocked_cells[Vector2i(x, y)] = true
	for cell: Vector2i in _solid_terrain_cells.keys():
		if not _is_terrain_walkable_exception(cell):
			blocked_cells[cell] = true

	# Merge adjacent blocked cells into larger physics rectangles to keep the
	# authored terrain collision precise without creating one body per tile.
	var active_runs: Dictionary = {}
	var merged_rects: Array[Rect2i] = []
	for y in range(map_size_tiles.y):
		var next_runs: Dictionary = {}
		var x := 0
		while x < map_size_tiles.x:
			if not blocked_cells.has(Vector2i(x, y)):
				x += 1
				continue
			var run_start := x
			while x < map_size_tiles.x and blocked_cells.has(Vector2i(x, y)):
				x += 1
			var run_key := Vector2i(run_start, x - run_start)
			var tile_rect: Rect2i
			if active_runs.has(run_key):
				tile_rect = active_runs[run_key]
				tile_rect = Rect2i(tile_rect.position, tile_rect.size + Vector2i(0, 1))
			else:
				tile_rect = Rect2i(Vector2i(run_start, y), Vector2i(x - run_start, 1))
			next_runs[run_key] = tile_rect
		for run_key: Vector2i in active_runs:
			if not next_runs.has(run_key):
				merged_rects.append(active_runs[run_key])
		active_runs = next_runs
	for run_key: Vector2i in active_runs:
		merged_rects.append(active_runs[run_key])

	for index in range(merged_rects.size()):
		var tile_rect: Rect2i = merged_rects[index]
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
