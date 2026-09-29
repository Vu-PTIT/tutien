class_name GameMap
extends Node2D
## Shared world runtime for the four maps.
## Gameplay uses reusable 32 px terrain and independent 128 px landmark regions.
## Painted world PNG files are retained only for route concept previews.

const TILE_SIZE_DEFAULT := 32
const TILE_SYMBOLS := "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"
const TRANSITION_NORTH := 1
const TRANSITION_EAST := 2
const TRANSITION_SOUTH := 4
const TRANSITION_WEST := 8
const INTERACTABLE_SCENE = preload("res://scenes/map_interactable.tscn")
const WATER_RIPPLE_SCENE = preload("res://scenes/map_water_ripple.tscn")
const SURFACE_STEP_FX_SCRIPT = preload("res://scripts/map_surface_step_fx.gd")
const MAP_PROP_SCENE = preload("res://scenes/map_prop.tscn")
const RESOURCE_TREE_SCENE = preload("res://scenes/map_resource_tree.tscn")
const FLOWER_SCENE = preload("res://scenes/map_flower.tscn")
const FIELD_MOB_SCENE = preload("res://scenes/field_mob_actor.tscn")

const MAP_LAYOUTS := {
	"m_an_khe": "res://data/maps/an_khe.json",
	"m_truc_am": "res://data/maps/truc_am.json",
	"m_thach_can": "res://data/maps/thach_can.json",
	"m_co_tinh": "res://data/maps/co_tinh.json",
}

var map_data: Dictionary = {}
@onready var _surface_step_player: Node2D = $Actors/Player
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
var _resource_trees: Dictionary = {}
var _flowers: Array[MapFlower] = []
var _field_mobs: Dictionary = {}
var _runtime_object_states: Dictionary = {}
var _weather_ripples: Array[MapWaterRipple] = []
var _weather_state: Dictionary = {}
var _last_surface_step_position := Vector2.ZERO
var _has_last_surface_step_position: bool = false
var _surface_step_distance: float = 0.0

func configure(data: Dictionary, tile_size: int = TILE_SIZE_DEFAULT, object_states: Dictionary = {}) -> void:
	map_data = data.duplicate(true)
	_runtime_object_states = object_states.duplicate(true)
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
	var surface_source_id := _ensure_ground_surface_atlas_source(tile_set, layout)
	var surface_columns := maxi(int(layout.get("ground_surface_columns", map_size_tiles.x)), 1)
	var surface_rows := maxi(int(layout.get("ground_surface_rows", map_size_tiles.y)), 1)
	var surface_terrain_ids: Dictionary = {}
	for terrain_id: Variant in layout.get("ground_surface_terrain_ids", []):
		surface_terrain_ids[int(terrain_id)] = true
	var water_surface_ids: Dictionary = {}
	for terrain_id: Variant in layout.get("water_surface_tile_ids", []):
		water_surface_ids[int(terrain_id)] = true
	var transition_layout: Dictionary = layout.get("terrain_transitions", {})
	var transition_source_id := _ensure_transition_atlas_source(tile_set, transition_layout)
	var transition_columns := maxi(int(transition_layout.get("columns", 4)), 1)
	var ground: TileMapLayer = $WorldLayers/GroundLayer
	var water: TileMapLayer = $WorldLayers/WaterLayer
	var detail: TileMapLayer = $WorldLayers/DetailLayer
	var shore: TileMapLayer = $WorldLayers/ShoreLayer
	var foreground: TileMapLayer = $WorldLayers/ForegroundLayer
	for layer: TileMapLayer in [ground, water, detail, shore, foreground]:
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
	var tile_rows: Array = []
	for y in range(map_size_tiles.y):
		var row := str(rows[y])
		if row.length() != map_size_tiles.x:
			return false
		var tile_row: Array[int] = []
		for x in range(map_size_tiles.x):
			tile_row.append(TILE_SYMBOLS.find(row.substr(x, 1)))
		tile_rows.append(tile_row)
	_apply_path_autoterrain(layout, tile_rows)
	var terrain_cell_alternatives := _apply_river_autoterrain(layout, tile_rows)
	var transition_layers: Dictionary = _build_terrain_transition_cells(tile_rows, transition_layout)
	for y in range(map_size_tiles.y):
		for x in range(map_size_tiles.x):
			var cell := Vector2i(x, y)
			var terrain_index := int(tile_rows[y][x])
			var tile_index := terrain_index
			var source_id := 0
			var source_columns := atlas_columns
			var alternative_tile := int(terrain_cell_alternatives.get(cell, 0))
			if water_surface_ids.has(terrain_index):
				if surface_source_id >= 0:
					tile_index = posmod(y, surface_rows) * surface_columns + posmod(x, surface_columns)
					source_id = surface_source_id
					source_columns = surface_columns
				else:
					tile_index = 0
				if not _set_atlas_cell(ground, cell, tile_index, source_columns, 0, source_id):
					return false
				if not _set_atlas_cell(water, cell, terrain_index, atlas_columns, alternative_tile):
					return false
			else:
				if surface_source_id >= 0 and surface_terrain_ids.has(terrain_index):
					tile_index = posmod(y, surface_rows) * surface_columns + posmod(x, surface_columns)
					source_id = surface_source_id
					source_columns = surface_columns
				if not _set_atlas_cell(ground, cell, tile_index, source_columns, alternative_tile, source_id):
					return false
			if solid_tile_ids.has(terrain_index):
				_solid_terrain_cells[cell] = true
	_build_river_shore_overlay(layout, ground)
	if not _place_transition_cells(detail, transition_layers.get("path", {}), transition_columns, transition_source_id):
		return false
	if not _place_transition_cells(shore, transition_layers.get("shore", {}), transition_columns, transition_source_id):
		return false
	for value: Dictionary in layout.get("detail_tiles", []):
		var tile_position: Array = value.get("position_tiles", [])
		if tile_position.size() != 2:
			return false
		if not _set_atlas_cell(detail, Vector2i(int(tile_position[0]), int(tile_position[1])), int(value.get("tile", -1)), atlas_columns):
			return false
	_build_props(layout)
	_build_resource_objects(layout)
	map_data["runtime_ground_rows"] = _encode_ground_rows(tile_rows)
	map_data["runtime_surface_step_materials"] = layout.get("surface_step_materials", {}).duplicate(true)
	return ground.get_used_cells().size() == map_size_tiles.x * map_size_tiles.y

func _place_transition_cells(layer: TileMapLayer, transition_cells: Dictionary, columns: int, source_id: int) -> bool:
	for cell_value: Variant in transition_cells.keys():
		var cell: Vector2i = cell_value
		var transition_spec: Dictionary = transition_cells[cell]
		if not _set_atlas_cell(
			layer,
			cell,
			int(transition_spec.get("tile", -1)),
			columns,
			int(transition_spec.get("alternative", 0)),
			source_id
		):
			return false
	return true

func _build_river_shore_overlay(layout: Dictionary, ground: TileMapLayer) -> void:
	var previous_overlay := ground.get_node_or_null("RiverShoreOverlay")
	if previous_overlay != null:
		ground.remove_child(previous_overlay)
		previous_overlay.free()
	var river: Dictionary = layout.get("river_autoterrain", {})
	var transitions: Dictionary = layout.get("terrain_transitions", {})
	for group_name in ["shore_land_edge_tiles", "shore_land_corner_tiles", "shore_water_edge_tiles", "shore_water_corner_tiles"]:
		var shore_group: Dictionary = transitions.get(group_name, {})
		if not shore_group.is_empty():
			return
	var texture_path := str(river.get("shore_overlay_texture", ""))
	if texture_path.is_empty():
		return
	var texture := load(texture_path) as Texture2D
	if texture == null:
		push_error("Missing generated river shoreline overlay: " + texture_path)
		return
	var overlay := Sprite2D.new()
	overlay.name = "RiverShoreOverlay"
	overlay.texture = texture
	overlay.centered = false
	overlay.position = Vector2.ZERO
	overlay.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	ground.add_child(overlay)

func _encode_ground_rows(tile_rows: Array) -> Array[String]:
	var encoded_rows: Array[String] = []
	for row_value: Variant in tile_rows:
		var encoded_row := ""
		var row: Array = row_value
		for tile_value: Variant in row:
			var tile_id := int(tile_value)
			if tile_id < 0 or tile_id >= TILE_SYMBOLS.length():
				return []
			encoded_row += TILE_SYMBOLS.substr(tile_id, 1)
		encoded_rows.append(encoded_row)
	return encoded_rows

func _set_atlas_cell(layer: TileMapLayer, cell: Vector2i, tile_index: int, columns: int, alternative_tile: int = 0, source_id: int = 0) -> bool:
	if tile_index < 0 or not Rect2i(Vector2i.ZERO, map_size_tiles).has_point(cell):
		return false
	var coords := Vector2i(tile_index % columns, floori(float(tile_index) / columns))
	var source := layer.tile_set.get_source(source_id) as TileSetAtlasSource
	if source == null or not source.has_tile(coords):
		return false
	layer.set_cell(cell, source_id, coords, alternative_tile)
	return true

func _ensure_ground_surface_atlas_source(tile_set: TileSet, layout: Dictionary) -> int:
	var texture_path := str(layout.get("ground_surface_atlas", ""))
	if texture_path.is_empty():
		return -1
	var texture := load(texture_path) as Texture2D
	if texture == null:
		push_error("Missing ground surface atlas: " + texture_path)
		return -1
	for index in range(tile_set.get_source_count()):
		var source_id := tile_set.get_source_id(index)
		var existing := tile_set.get_source(source_id) as TileSetAtlasSource
		if existing != null and existing.texture == texture:
			return source_id
	var region_px := maxi(int(layout.get("ground_surface_tile_px", tile_size_px)), 1)
	var columns := maxi(int(layout.get("ground_surface_columns", map_size_tiles.x)), 1)
	var rows := maxi(int(layout.get("ground_surface_rows", map_size_tiles.y)), 1)
	if texture.get_width() != columns * region_px or texture.get_height() != rows * region_px:
		push_error("Ground surface atlas dimensions do not match its tile contract: " + texture_path)
		return -1
	var surface_source := TileSetAtlasSource.new()
	surface_source.texture = texture
	surface_source.texture_region_size = Vector2i(region_px, region_px)
	for y in range(rows):
		for x in range(columns):
			surface_source.create_tile(Vector2i(x, y))
	return tile_set.add_source(surface_source)

func _ensure_transition_atlas_source(tile_set: TileSet, transition_layout: Dictionary) -> int:
	var texture_path := str(transition_layout.get("atlas", ""))
	if texture_path.is_empty():
		return -1
	var texture := load(texture_path) as Texture2D
	if texture == null:
		push_error("Missing terrain transition atlas: " + texture_path)
		return -1
	for index in range(tile_set.get_source_count()):
		var source_id := tile_set.get_source_id(index)
		var existing := tile_set.get_source(source_id) as TileSetAtlasSource
		if existing != null and existing.texture == texture:
			return source_id
	var columns := maxi(int(transition_layout.get("columns", 4)), 1)
	var rows := maxi(int(transition_layout.get("rows", 4)), 1)
	var region_px := maxi(int(transition_layout.get("tile_px", 32)), 1)
	if texture.get_width() != columns * region_px or texture.get_height() != rows * region_px:
		push_error("Terrain transition atlas dimensions do not match its tile contract: " + texture_path)
		return -1
	var source := TileSetAtlasSource.new()
	source.texture = texture
	source.texture_region_size = Vector2i(region_px, region_px)
	for y in range(rows):
		for x in range(columns):
			source.create_tile(Vector2i(x, y))
	return tile_set.add_source(source)

func _apply_river_autoterrain(layout: Dictionary, tile_rows: Array) -> Dictionary:
	var river: Dictionary = layout.get("river_autoterrain", {})
	var west_bankline: Array = river.get("west_bankline", [])
	if west_bankline.size() < 2:
		return {}
	var minimum_bank_x := int(river.get("minimum_bank_x", 2))
	var maximum_bank_x := int(river.get("maximum_bank_x", map_size_tiles.x - 3))
	var last_water_x := int(river.get("last_water_x", map_size_tiles.x - 2))
	var cleanup_start_x := int(river.get("cleanup_start_x", minimum_bank_x - 2))
	var bank_tile := int(river.get("bank_tile", 39))
	var bank_fringe_tile := int(river.get("bank_fringe_tile", 23))
	var bank_fringe_chance := int(river.get("bank_fringe_chance", 55))
	var transition_layout: Dictionary = layout.get("terrain_transitions", {})
	var has_generated_shoreline := not str(river.get("shore_overlay_texture", "")).is_empty()
	for shore_group_name in ["shore_land_edge_tiles", "shore_land_corner_tiles", "shore_water_edge_tiles", "shore_water_corner_tiles"]:
		var shore_group: Dictionary = transition_layout.get(shore_group_name, {})
		if not shore_group.is_empty():
			has_generated_shoreline = true
			break
	if has_generated_shoreline:
		bank_fringe_chance = 0
	var base_water_tiles: Array = river.get("base_water_tiles", [32, 35])
	var detail_water_tiles: Array = river.get("detail_water_tiles", [33, 34])
	var grass_tiles: Array = river.get("replacement_grass_tiles", [0, 1, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15])
	var seed := int(river.get("seed", 2901))
	var bank_columns: Array[int] = []
	var bank_alternatives: Dictionary = {}
	for y in range(map_size_tiles.y):
		var bank_x := _sample_river_bank_x(west_bankline, float(y) + 0.5)
		var row_noise := (float(posmod(_river_cell_noise(0, y, seed), 100)) / 99.0 - 0.5) * 0.3
		var bank_cell_x := clampi(floori(bank_x + row_noise), minimum_bank_x, maximum_bank_x)
		bank_columns.append(bank_cell_x)
		var bank_flip: int = TileSetAtlasSource.TRANSFORM_FLIP_H
		if posmod(_river_cell_noise(bank_cell_x, y, seed), 2) == 1:
			bank_flip = bank_flip | TileSetAtlasSource.TRANSFORM_FLIP_V
		bank_alternatives[Vector2i(bank_cell_x, y)] = bank_flip
	for y in range(map_size_tiles.y):
		var row: Array = tile_rows[y]
		var bank_x := bank_columns[y]
		for x in range(cleanup_start_x, last_water_x + 1):
			if x < 0 or x >= row.size() or x >= bank_x:
				continue
			var old_tile := int(row[x])
			if old_tile >= 32 and old_tile <= 39:
				var grass_noise := _river_cell_noise(x, y, seed)
				row[x] = int(grass_tiles[posmod(grass_noise, grass_tiles.size())])
		row[bank_x] = bank_tile
		if bank_x > 0 and posmod(_river_cell_noise(bank_x - 1, y, seed), 100) < bank_fringe_chance:
			row[bank_x - 1] = bank_fringe_tile
		for x in range(bank_x + 1, last_water_x + 1):
			var water_noise := _river_cell_noise(x, y, seed)
			var selected_tile := int(base_water_tiles[posmod(water_noise, base_water_tiles.size())])
			var interior_bank_x := bank_x
			if y > 0:
				interior_bank_x = maxi(interior_bank_x, bank_columns[y - 1])
			if y < map_size_tiles.y - 1:
				interior_bank_x = maxi(interior_bank_x, bank_columns[y + 1])
			var surrounded_by_water := x > interior_bank_x + 1 and x < last_water_x and y > 0 and y < map_size_tiles.y - 1
			var detail_noise := posmod(water_noise, 1000)
			var chance_threshold := int(float(river.get("detail_water_chance", 0.045)) * 1000.0)
			if surrounded_by_water and detail_noise < chance_threshold:
				selected_tile = int(detail_water_tiles[posmod(floori(float(water_noise) / 1000.0), detail_water_tiles.size())])
			row[x] = selected_tile
	return bank_alternatives

func _build_terrain_transition_cells(tile_rows: Array, transition_layout: Dictionary) -> Dictionary:
	var path_transition_cells: Dictionary = {}
	var shore_transition_cells: Dictionary = {}
	if transition_layout.is_empty():
		return {"path": path_transition_cells, "shore": shore_transition_cells}
	var path_edges: Dictionary = transition_layout.get("path_edge_tiles", {})
	var path_corners: Dictionary = transition_layout.get("path_corner_tiles", {})
	var shore_land_edges: Dictionary = transition_layout.get("shore_land_edge_tiles", {})
	var shore_land_corners: Dictionary = transition_layout.get("shore_land_corner_tiles", {})
	var shore_water_edges: Dictionary = transition_layout.get("shore_water_edge_tiles", {})
	var shore_water_corners: Dictionary = transition_layout.get("shore_water_corner_tiles", {})
	var seed := int(transition_layout.get("seed", 3871))
	for y in range(map_size_tiles.y):
		for x in range(map_size_tiles.x):
			var terrain_index := int(tile_rows[y][x])
			var cell := Vector2i(x, y)
			if terrain_index >= 0 and terrain_index < 32:
				if terrain_index < 16:
					var path_mask := _terrain_neighbor_mask(tile_rows, x, y, "path")
					var path_tile_value: Variant = _path_transition_tile(path_mask, path_edges, path_corners)
					var path_tile := _choose_transition_variant(path_tile_value, cell, seed, 0)
					if path_tile >= 0:
						var along_edge_flip := _path_transition_flip(path_mask, cell, seed)
						path_transition_cells[cell] = {"tile": path_tile, "alternative": along_edge_flip}
				if not shore_land_edges.is_empty() or not shore_land_corners.is_empty():
					var water_mask := _terrain_neighbor_mask(tile_rows, x, y, "water_and_shore")
					var shore_tile_value: Variant = _shore_transition_tile(water_mask, shore_land_edges, shore_land_corners)
					var shore_tile := _choose_transition_variant(shore_tile_value, cell, seed, 71)
					if shore_tile >= 0:
						var shore_flip := 0
						if _is_single_transition_direction(water_mask):
							shore_flip = _shore_transition_flip(_first_transition_direction(water_mask), cell, seed)
						shore_transition_cells[cell] = {"tile": shore_tile, "alternative": shore_flip}
			elif terrain_index >= 32 and terrain_index <= 35:
				if shore_water_edges.is_empty() and shore_water_corners.is_empty():
					continue
				var bank_mask := _terrain_neighbor_mask(tile_rows, x, y, "shore")
				var water_tile_value: Variant = _shore_transition_tile(bank_mask, shore_water_edges, shore_water_corners)
				var water_tile := _choose_transition_variant(water_tile_value, cell, seed, 137)
				if water_tile >= 0:
					var water_flip := 0
					if _is_single_transition_direction(bank_mask):
						water_flip = _shore_transition_flip(_first_transition_direction(bank_mask), cell, seed + 19)
					shore_transition_cells[cell] = {"tile": water_tile, "alternative": water_flip}
	return {"path": path_transition_cells, "shore": shore_transition_cells}

func _choose_transition_variant(tile_value: Variant, cell: Vector2i, seed: int, salt: int) -> int:
	if tile_value is Array:
		var variants: Array = tile_value
		if variants.is_empty():
			return -1
		var selected := posmod(_river_cell_noise(cell.x + salt, cell.y - salt, seed), variants.size())
		return int(variants[selected])
	return int(tile_value)

func _is_single_transition_direction(mask: int) -> bool:
	return mask == TRANSITION_NORTH or mask == TRANSITION_EAST or mask == TRANSITION_SOUTH or mask == TRANSITION_WEST

func _terrain_neighbor_mask(tile_rows: Array, x: int, y: int, terrain_group: String) -> int:
	var mask := 0
	var offsets: Array[Vector2i] = [Vector2i(0, -1), Vector2i(1, 0), Vector2i(0, 1), Vector2i(-1, 0)]
	var bits: Array[int] = [TRANSITION_NORTH, TRANSITION_EAST, TRANSITION_SOUTH, TRANSITION_WEST]
	for index in range(offsets.size()):
		var neighbor := Vector2i(x, y) + offsets[index]
		if neighbor.x < 0 or neighbor.y < 0 or neighbor.x >= map_size_tiles.x or neighbor.y >= map_size_tiles.y:
			continue
		var neighbor_terrain := int(tile_rows[neighbor.y][neighbor.x])
		var matches := false
		match terrain_group:
			"path":
				matches = neighbor_terrain >= 16 and neighbor_terrain <= 23
			"land":
				matches = neighbor_terrain >= 0 and neighbor_terrain < 32
			"water_and_shore":
				matches = neighbor_terrain >= 32 and neighbor_terrain <= 39
			"shore":
				matches = neighbor_terrain >= 36 and neighbor_terrain <= 39
		if matches:
			mask |= bits[index]
	return mask

func _path_transition_tile(path_mask: int, path_edges: Dictionary, path_corners: Dictionary) -> Variant:
	if path_mask == 0:
		return -1
	if path_mask == (TRANSITION_NORTH | TRANSITION_WEST):
		return path_corners.get("north_west", path_corners.get("path_north_west", -1))
	if path_mask == (TRANSITION_NORTH | TRANSITION_EAST):
		return path_corners.get("north_east", path_corners.get("path_north_east", -1))
	if path_mask == (TRANSITION_SOUTH | TRANSITION_WEST):
		return path_corners.get("south_west", path_corners.get("path_south_west", -1))
	if path_mask == (TRANSITION_SOUTH | TRANSITION_EAST):
		return path_corners.get("south_east", path_corners.get("path_south_east", -1))
	if (path_mask & (TRANSITION_NORTH | TRANSITION_WEST)) == (TRANSITION_NORTH | TRANSITION_WEST):
		return path_corners.get("north_west", path_corners.get("path_north_west", -1))
	if (path_mask & (TRANSITION_NORTH | TRANSITION_EAST)) == (TRANSITION_NORTH | TRANSITION_EAST):
		return path_corners.get("north_east", path_corners.get("path_north_east", -1))
	if (path_mask & (TRANSITION_SOUTH | TRANSITION_WEST)) == (TRANSITION_SOUTH | TRANSITION_WEST):
		return path_corners.get("south_west", path_corners.get("path_south_west", -1))
	if (path_mask & (TRANSITION_SOUTH | TRANSITION_EAST)) == (TRANSITION_SOUTH | TRANSITION_EAST):
		return path_corners.get("south_east", path_corners.get("path_south_east", -1))
	if (path_mask & TRANSITION_WEST) != 0:
		return path_edges.get("west", path_edges.get("path_west", -1))
	if (path_mask & TRANSITION_EAST) != 0:
		return path_edges.get("east", path_edges.get("path_east", -1))
	if (path_mask & TRANSITION_NORTH) != 0:
		return path_edges.get("north", path_edges.get("path_north", -1))
	return path_edges.get("south", path_edges.get("path_south", -1))

func _first_transition_direction(mask: int) -> String:
	if (mask & TRANSITION_WEST) != 0:
		return "west"
	if (mask & TRANSITION_EAST) != 0:
		return "east"
	if (mask & TRANSITION_NORTH) != 0:
		return "north"
	return "south"

func _shore_transition_tile(water_mask: int, shore_edges: Dictionary, shore_corners: Dictionary) -> Variant:
	if water_mask == 0:
		return -1
	if water_mask == (TRANSITION_NORTH | TRANSITION_EAST):
		return shore_corners.get("north_east", -1)
	if water_mask == (TRANSITION_SOUTH | TRANSITION_EAST):
		return shore_corners.get("south_east", -1)
	if water_mask == (TRANSITION_SOUTH | TRANSITION_WEST):
		return shore_corners.get("south_west", -1)
	if water_mask == (TRANSITION_NORTH | TRANSITION_WEST):
		return shore_corners.get("north_west", -1)
	if (water_mask & (TRANSITION_NORTH | TRANSITION_EAST)) == (TRANSITION_NORTH | TRANSITION_EAST):
		return shore_corners.get("north_east", -1)
	if (water_mask & (TRANSITION_SOUTH | TRANSITION_EAST)) == (TRANSITION_SOUTH | TRANSITION_EAST):
		return shore_corners.get("south_east", -1)
	if (water_mask & (TRANSITION_SOUTH | TRANSITION_WEST)) == (TRANSITION_SOUTH | TRANSITION_WEST):
		return shore_corners.get("south_west", -1)
	if (water_mask & (TRANSITION_NORTH | TRANSITION_WEST)) == (TRANSITION_NORTH | TRANSITION_WEST):
		return shore_corners.get("north_west", -1)
	if (water_mask & TRANSITION_EAST) != 0:
		return shore_edges.get("east", -1)
	if (water_mask & TRANSITION_WEST) != 0:
		return shore_edges.get("west", -1)
	if (water_mask & TRANSITION_SOUTH) != 0:
		return shore_edges.get("south", -1)
	return shore_edges.get("north", -1)

func _path_transition_flip(grass_mask: int, cell: Vector2i, seed: int) -> int:
	var noise := _river_cell_noise(cell.x, cell.y, seed)
	if grass_mask == TRANSITION_WEST or grass_mask == TRANSITION_EAST:
		return TileSetAtlasSource.TRANSFORM_FLIP_V if posmod(noise, 2) == 1 else 0
	if grass_mask == TRANSITION_NORTH or grass_mask == TRANSITION_SOUTH:
		return TileSetAtlasSource.TRANSFORM_FLIP_H if posmod(noise, 2) == 1 else 0
	return 0

func _shore_transition_flip(land_side: String, cell: Vector2i, seed: int) -> int:
	var noise := _river_cell_noise(cell.x, cell.y, seed)
	if land_side == "west" or land_side == "east":
		return TileSetAtlasSource.TRANSFORM_FLIP_V if posmod(noise, 2) == 1 else 0
	return TileSetAtlasSource.TRANSFORM_FLIP_H if posmod(noise, 2) == 1 else 0

func _river_cell_noise(x: int, y: int, seed: int) -> int:
	return posmod(x * 92821 + y * 68917 + x * y * 193 + seed * 199, 65521)

func _sample_river_bank_x(bankline: Array, sample_y: float) -> float:
	var previous: Array = bankline[0]
	for index in range(1, bankline.size()):
		var next_point: Array = bankline[index]
		if sample_y <= float(next_point[1]):
			var span := maxf(float(next_point[1]) - float(previous[1]), 0.001)
			var progress := clampf((sample_y - float(previous[1])) / span, 0.0, 1.0)
			return lerpf(float(previous[0]), float(next_point[0]), progress)
		previous = next_point
	return float(previous[0])

func _apply_path_autoterrain(layout: Dictionary, tile_rows: Array) -> void:
	var path_data: Dictionary = layout.get("path_autoterrain", {})
	var paths: Array = path_data.get("paths", [])
	if paths.is_empty():
		return
	var seed := int(path_data.get("seed", 5821))
	var edge_roughness := maxf(float(path_data.get("edge_roughness_tiles", 0.34)), 0.0)
	var grass_tile := int(path_data.get("replacement_grass_tile", 0))
	var interior_tiles: Array = path_data.get("interior_tiles", [16, 17, 18, 19])
	var edge_tiles: Array = path_data.get("edge_tiles", [18, 19, 20, 21])
	for y in range(map_size_tiles.y):
		var row: Array = tile_rows[y]
		for x in range(map_size_tiles.x):
			var tile_id := int(row[x])
			if tile_id >= 16 and tile_id <= 23:
				row[x] = grass_tile
	for y in range(map_size_tiles.y):
		var row: Array = tile_rows[y]
		for x in range(map_size_tiles.x):
			var current_tile := int(row[x])
			if current_tile >= 24:
				continue
			var cell_center := Vector2(float(x) + 0.5, float(y) + 0.5)
			var tile_noise := _river_cell_noise(x, y, seed)
			var nearest_distance := INF
			var selected_width := 0.0
			for path_value: Variant in paths:
				if not path_value is Dictionary:
					continue
				var path: Dictionary = path_value
				var points: Array = path.get("points", [])
				if points.size() < 2:
					continue
				var distance := _distance_to_polyline(cell_center, points)
				var half_width := maxf(float(path.get("half_width_tiles", 0.8)), 0.1)
				var edge_noise := _sample_smooth_path_edge_noise(cell_center, seed) * edge_roughness
				var edge_width := maxf(half_width + edge_noise, 0.8)
				if distance <= edge_width and distance < nearest_distance:
					nearest_distance = distance
					selected_width = half_width
			if nearest_distance == INF:
				continue
			var tile_pool: Array = edge_tiles if nearest_distance > selected_width * 0.62 else interior_tiles
			if tile_pool.is_empty():
				continue
			row[x] = int(tile_pool[posmod(tile_noise, tile_pool.size())])
	var cardinal_offsets: Array[Vector2i] = [Vector2i(0, -1), Vector2i(1, 0), Vector2i(0, 1), Vector2i(-1, 0)]
	for _pass in range(2):
		var enclosed_path_gaps: Array[Vector2i] = []
		for y in range(1, map_size_tiles.y - 1):
			for x in range(1, map_size_tiles.x - 1):
				if int(tile_rows[y][x]) >= 16:
					continue
				var path_neighbor_count := 0
				for offset: Vector2i in cardinal_offsets:
					var neighbor_tile := int(tile_rows[y + offset.y][x + offset.x])
					if neighbor_tile >= 16 and neighbor_tile <= 23:
						path_neighbor_count += 1
				if path_neighbor_count >= 3:
					enclosed_path_gaps.append(Vector2i(x, y))
		if enclosed_path_gaps.is_empty():
			break
		for cell: Vector2i in enclosed_path_gaps:
			tile_rows[cell.y][cell.x] = int(interior_tiles[0]) if not interior_tiles.is_empty() else 16

func _sample_smooth_path_edge_noise(point: Vector2, seed: int) -> float:
	const NOISE_SCALE := 3.0
	var sample_x := point.x / NOISE_SCALE
	var sample_y := point.y / NOISE_SCALE
	var cell_x := floori(sample_x)
	var cell_y := floori(sample_y)
	var fraction_x := sample_x - float(cell_x)
	var fraction_y := sample_y - float(cell_y)
	fraction_x = fraction_x * fraction_x * (3.0 - 2.0 * fraction_x)
	fraction_y = fraction_y * fraction_y * (3.0 - 2.0 * fraction_y)
	var north_west := float(posmod(_river_cell_noise(cell_x, cell_y, seed), 1001)) / 1000.0 - 0.5
	var north_east := float(posmod(_river_cell_noise(cell_x + 1, cell_y, seed), 1001)) / 1000.0 - 0.5
	var south_west := float(posmod(_river_cell_noise(cell_x, cell_y + 1, seed), 1001)) / 1000.0 - 0.5
	var south_east := float(posmod(_river_cell_noise(cell_x + 1, cell_y + 1, seed), 1001)) / 1000.0 - 0.5
	var north_value := lerpf(north_west, north_east, fraction_x)
	var south_value := lerpf(south_west, south_east, fraction_x)
	return lerpf(north_value, south_value, fraction_y)

func _distance_to_polyline(point: Vector2, points: Array) -> float:
	if points.size() < 2:
		return INF
	var nearest := INF
	for index in range(1, points.size()):
		var start_values: Array = points[index - 1]
		var end_values: Array = points[index]
		var start_point := Vector2(float(start_values[0]), float(start_values[1]))
		var end_point := Vector2(float(end_values[0]), float(end_values[1]))
		var segment := end_point - start_point
		var segment_length_squared := maxf(segment.length_squared(), 0.001)
		var along := clampf((point - start_point).dot(segment) / segment_length_squared, 0.0, 1.0)
		nearest = minf(nearest, point.distance_to(start_point + segment * along))
	return nearest

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

func _build_resource_objects(layout: Dictionary) -> void:
	var objects: Dictionary = layout.get("interactive_objects", {})
	var root: Node2D = $Actors
	_resource_trees.clear()
	_flowers.clear()
	for value: Variant in objects.get("trees", []):
		if not value is Dictionary:
			continue
		var tree := RESOURCE_TREE_SCENE.instantiate() as MapResourceTree
		root.add_child(tree)
		var tree_id := str(value.get("id", "resource_tree"))
		var saved_state: Dictionary = _runtime_object_states.get(tree_id, {})
		tree.configure(value, tile_size_px, saved_state)
		_resource_trees[tree.tree_id] = tree
	for value: Variant in objects.get("flowers", []):
		if not value is Dictionary:
			continue
		var flower := FLOWER_SCENE.instantiate() as MapFlower
		root.add_child(flower)
		flower.configure(value, tile_size_px)
		_flowers.append(flower)

func resource_trees_size() -> int:
	return _resource_trees.size()

func flowers_size() -> int:
	return _flowers.size()

func get_resource_tree(tree_id: String) -> MapResourceTree:
	return _resource_trees.get(tree_id) as MapResourceTree

func get_resource_tree_states() -> Dictionary:
	var states: Dictionary = {}
	for tree_id: Variant in _resource_trees:
		var tree := _resource_trees[tree_id] as MapResourceTree
		if tree != null:
			states[str(tree_id)] = {"hit_count": tree.hit_count}
	return states

func nearest_choppable_tree(point: Vector2, facing: Vector2, max_distance: float = 58.0) -> MapResourceTree:
	if facing.length_squared() <= 0.01:
		return null
	var forward := facing.normalized()
	var nearest: MapResourceTree
	var nearest_distance := max_distance
	for value: Variant in _resource_trees.values():
		var tree := value as MapResourceTree
		if tree == null or not tree.can_be_chopped():
			continue
		var offset := tree.position - point
		var distance := offset.length()
		if distance > nearest_distance or offset.dot(forward) <= 0.0:
			continue
		if absf(offset.cross(forward)) > 30.0:
			continue
		nearest = tree
		nearest_distance = distance
	return nearest

func try_chop_tree(point: Vector2, facing: Vector2) -> Dictionary:
	var tree := nearest_choppable_tree(point, facing)
	return tree.chop() if tree != null else {}

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
	_weather_ripples.clear()
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
		_weather_ripples.append(ripple)
	_apply_weather_state_to_map()

func _process(_delta: float) -> void:
	if not is_instance_valid(_surface_step_player):
		return
	var current_position := to_local(_surface_step_player.global_position)
	if not _has_last_surface_step_position:
		_last_surface_step_position = current_position
		_has_last_surface_step_position = true
		return
	var moved_distance := current_position.distance_to(_last_surface_step_position)
	_last_surface_step_position = current_position
	if moved_distance > float(tile_size_px * 2):
		_surface_step_distance = 0.0
		return
	if moved_distance < 0.1:
		return
	_surface_step_distance += moved_distance
	var step_interval := maxf(float(tile_size_px) * 0.58, 12.0)
	while _surface_step_distance >= step_interval:
		_surface_step_distance -= step_interval
		_emit_surface_step(current_position)

func _emit_surface_step(player_position: Vector2) -> void:
	var materials: Dictionary = map_data.get("runtime_surface_step_materials", {})
	if materials.is_empty():
		return
	var foot_position := player_position + Vector2(0.0, float(tile_size_px) * 0.24)
	var material := _surface_material_at(foot_position, materials)
	if material.is_empty():
		return
	var rainy := float(_weather_state.get("rain_intensity", 0.0)) > 0.2
	var shoreline := material != "water" and _has_water_neighbor(foot_position, materials)
	var effect := SURFACE_STEP_FX_SCRIPT.new() as MapSurfaceStepFx
	if effect == null:
		return
	$AmbientFX.add_child(effect)
	effect.position = Vector2(roundi(foot_position.x), roundi(foot_position.y))
	effect.configure(
		material,
		tile_size_px,
		rainy,
		shoreline,
		int(Time.get_ticks_usec()) + floori(foot_position.x * 31.0 + foot_position.y * 17.0)
	)

func _surface_material_at(point: Vector2, materials: Dictionary) -> String:
	var rows: Array = map_data.get("runtime_ground_rows", [])
	var cell_x := floori(point.x / float(tile_size_px))
	var cell_y := floori(point.y / float(tile_size_px))
	if cell_y < 0 or cell_y >= rows.size():
		return ""
	var row := str(rows[cell_y])
	if cell_x < 0 or cell_x >= row.length():
		return ""
	var tile_id := TILE_SYMBOLS.find(row.substr(cell_x, 1))
	for material_name in ["grass", "soil", "stone", "water"]:
		var material_ids: Array = materials.get(material_name, [])
		if material_ids.has(tile_id):
			return str(material_name)
	return ""

func _has_water_neighbor(point: Vector2, materials: Dictionary) -> bool:
	var rows: Array = map_data.get("runtime_ground_rows", [])
	var cell_x := floori(point.x / float(tile_size_px))
	var cell_y := floori(point.y / float(tile_size_px))
	var water_ids: Array = materials.get("water", [])
	for offset: Vector2i in [Vector2i(0, -1), Vector2i(1, 0), Vector2i(0, 1), Vector2i(-1, 0)]:
		var neighbor_x := cell_x + offset.x
		var neighbor_y := cell_y + offset.y
		if neighbor_y < 0 or neighbor_y >= rows.size():
			continue
		var row := str(rows[neighbor_y])
		if neighbor_x < 0 or neighbor_x >= row.length():
			continue
		if water_ids.has(TILE_SYMBOLS.find(row.substr(neighbor_x, 1))):
			return true
	return false

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

func get_weather_exposure() -> String:
	for area: Dictionary in _areas:
		if str(area.get("id", "")) == active_area_id:
			return str(area.get("weather_exposure", map_data.get("weather_exposure", "outdoor")))
	return str(map_data.get("weather_exposure", "outdoor"))

func apply_weather_state(state: Dictionary) -> void:
	_weather_state = state.duplicate(true)
	_apply_weather_state_to_map()

func _apply_weather_state_to_map() -> void:
	if _weather_state.is_empty():
		return
	var exposure := get_weather_exposure()
	var weather_tint: Color = _weather_state.get("map_tint", Color.WHITE)
	var rain_amount := float(_weather_state.get("rain_intensity", 0.0))
	if exposure == "indoor":
		modulate = Color("fff1d8")
		rain_amount = 0.0
	elif exposure == "sheltered":
		modulate = weather_tint.lerp(Color("fff1dc"), 0.55)
		rain_amount *= 0.18
	else:
		modulate = weather_tint
	for ripple: MapWaterRipple in _weather_ripples:
		ripple.set_rain_intensity(rain_amount)

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

func update_field_mobs(snapshots: Array) -> void:
	var wanted: Dictionary = {}
	for value: Variant in snapshots:
		if not value is Dictionary:
			continue
		var mob_id := str(value.get("id", ""))
		if mob_id.is_empty():
			continue
		var actor := _field_mobs.get(mob_id) as FieldMobActor
		if actor == null:
			actor = FIELD_MOB_SCENE.instantiate() as FieldMobActor
			$Actors.add_child(actor)
			_field_mobs[mob_id] = actor
		actor.present(value)
		wanted[mob_id] = true
	for mob_id: Variant in _field_mobs.keys():
		if wanted.has(mob_id):
			continue
		var actor := _field_mobs[mob_id] as FieldMobActor
		if actor != null:
			actor.queue_free()
		_field_mobs.erase(mob_id)

func nearest_field_mob(point: Vector2, max_distance: float) -> String:
	var best_id := ""
	var best_distance := max_distance
	for mob_id: Variant in _field_mobs.keys():
		var actor := _field_mobs[mob_id] as FieldMobActor
		if actor == null or not actor.visible or actor.hp <= 0:
			continue
		var distance := point.distance_to(actor.position)
		if distance <= best_distance:
			best_distance = distance
			best_id = str(mob_id)
	return best_id

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
	_apply_weather_state_to_map()
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
