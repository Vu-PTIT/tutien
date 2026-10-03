extends Node2D

const MAP_PATH := "res://assets/maps/lang_linh_khe_112x96.json"
const PLAYER_SCENE_SCRIPT := "res://scripts/village_player.gd"
const TILE_LAYER_SCRIPT := "res://scripts/village_tile_layer.gd"
const OBJECT_SCENE := "res://scenes/map_sprite_object.tscn"
const MINIMAP_SCRIPT := "res://scripts/village_minimap.gd"

var map_data: Dictionary = {}
var texture_cache: Dictionary = {}
var tile_set_resource: TileSet
var tile_refs: Dictionary = {}
var _info_label: Label
var _player: CharacterBody2D
var _hud_tick := 0.0


func _ready() -> void:
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(MAP_PATH))
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("Could not read village map data: " + MAP_PATH)
		return
	map_data = parsed

	_build_tile_set()
	_build_ground_layers()
	_build_world_objects()
	_build_collisions()
	_build_canopies()
	_build_hud()


func _process(delta: float) -> void:
	_hud_tick += delta
	if _hud_tick < 0.2 or _player == null or _info_label == null:
		return
	_hud_tick = 0.0
	var tile := Vector2i(floori(_player.position.x / 16.0), floori(_player.position.y / 16.0))
	_info_label.text = "LÀNG LINH KHÊ  •  112 × 96 Ô\nWASD / phím mũi tên: di chuyển   •   Cuộn chuột: phóng to / thu nhỏ\nVị trí %d, %d   •   Nước, hoa và lửa đang chạy animation" % [tile.x, tile.y]


func texture_for(path: String) -> Texture2D:
	if not texture_cache.has(path):
		var resource: Resource = load(path)
		if resource is Texture2D:
			texture_cache[path] = resource
		else:
			push_error("Missing map texture: " + path)
			return null
	return texture_cache[path] as Texture2D


func resolve_gid(raw_gid: int) -> Dictionary:
	var gid := raw_gid & 0x1fffffff
	var tilesets: Array = map_data.get("tilesets", [])
	for index in range(tilesets.size() - 1, -1, -1):
		var tileset: Dictionary = tilesets[index]
		var first_gid := int(tileset.get("first_gid", 1))
		var local_id := gid - first_gid
		if local_id < 0:
			continue
		var atlas_path := str(tileset.get("image", ""))
		if not atlas_path.is_empty():
			if local_id >= int(tileset.get("tile_count", 0)):
				continue
			var columns := int(tileset.get("columns", 0))
			if columns <= 0:
				return {}
			var tile_width := int(tileset.get("tile_width", 16))
			var tile_height := int(tileset.get("tile_height", 16))
			var margin := int(tileset.get("margin", 0))
			var spacing := int(tileset.get("spacing", 0))
			var texture := texture_for(atlas_path)
			if texture == null:
				return {}
			var source_x := margin + (local_id % columns) * (tile_width + spacing)
			var source_y := margin + floori(float(local_id) / float(columns)) * (tile_height + spacing)
			return {
				"texture": texture,
				"region": Rect2(source_x, source_y, tile_width, tile_height),
				"size": Vector2(tile_width, tile_height),
			}
		var collection: Dictionary = tileset.get("collection", {})
		var tile_info: Dictionary = collection.get(str(local_id), {})
		if tile_info.is_empty():
			continue
		var tile_texture := texture_for(str(tile_info.get("image", "")))
		if tile_texture == null:
			return {}
		var width := int(tile_info.get("width", tile_texture.get_width()))
		var height := int(tile_info.get("height", tile_texture.get_height()))
		return {
			"texture": tile_texture,
			"region": Rect2(0, 0, width, height),
			"size": Vector2(width, height),
		}
	return {}


func _build_ground_layers() -> void:
	var layer_script: Script = load(TILE_LAYER_SCRIPT)
	for layer_data in map_data.get("layers", []):
		var layer := TileMapLayer.new()
		layer.name = str(layer_data.get("name", "TileLayer"))
		layer.set_script(layer_script)
		layer.call("configure", self, layer_data, int(map_data.get("width", 112)), int(map_data.get("tile_width", 16)))
		add_child(layer)


func _build_tile_set() -> void:
	var tile_width := int(map_data.get("tile_width", 16))
	var tile_height := int(map_data.get("tile_height", 16))
	tile_set_resource = TileSet.new()
	tile_set_resource.tile_size = Vector2i(tile_width, tile_height)
	tile_refs.clear()

	var required_gids: Dictionary = {}
	var animations: Dictionary = map_data.get("animations", {})
	for layer in map_data.get("layers", []):
		for raw_gid in layer.get("data", []):
			var gid := int(raw_gid) & 0x1fffffff
			if gid == 0:
				continue
			required_gids[gid] = true
			for frame in animations.get(str(gid), []):
				required_gids[int(frame.get("gid", gid))] = true

	for tileset in map_data.get("tilesets", []):
		var image_path := str(tileset.get("image", ""))
		if image_path.is_empty():
			continue
		var first_gid := int(tileset.get("first_gid", 1))
		var tile_count := int(tileset.get("tile_count", 0))
		var columns := int(tileset.get("columns", 0))
		var tw := int(tileset.get("tile_width", tile_width))
		var th := int(tileset.get("tile_height", tile_height))
		if columns <= 0 or tw <= 0 or th <= 0:
			continue

		var local_ids: Dictionary = {}
		for raw_gid in required_gids.keys():
			var local_id := int(raw_gid) - first_gid
			if local_id >= 0 and local_id < tile_count:
				local_ids[local_id] = true
		if local_ids.is_empty():
			continue

		var texture := texture_for(image_path)
		if texture == null:
			continue
		var margin := int(tileset.get("margin", 0))
		var spacing := int(tileset.get("spacing", 0))
		var source := TileSetAtlasSource.new()
		source.texture = texture
		source.texture_region_size = Vector2i(tw, th)
		source.margins = Vector2i(margin, margin)
		source.separation = Vector2i(spacing, spacing)

		var ordered_ids: Array = local_ids.keys()
		ordered_ids.sort()
		for raw_local_id in ordered_ids:
			var local_id := int(raw_local_id)
			var atlas_coords := Vector2i(local_id % columns, floori(float(local_id) / float(columns)))
			var source_x := margin + atlas_coords.x * (tw + spacing)
			var source_y := margin + atlas_coords.y * (th + spacing)
			if source_x + tw > texture.get_width() or source_y + th > texture.get_height():
				push_error("Atlas tile %s:%d is outside its source texture" % [tileset.get("name", "Tileset"), local_id])
				continue
			source.create_tile(atlas_coords)
			var tile_data := source.get_tile_data(atlas_coords, 0)
			if tile_data != null:
				tile_data.texture_origin = Vector2i(int(tileset.get("tile_offset_x", 0)), int(tileset.get("tile_offset_y", 0)))
		var source_id := tile_set_resource.add_source(source)
		for raw_local_id in ordered_ids:
			var local_id := int(raw_local_id)
			var atlas_coords := Vector2i(local_id % columns, floori(float(local_id) / float(columns)))
			var source_x := margin + atlas_coords.x * (tw + spacing)
			var source_y := margin + atlas_coords.y * (th + spacing)
			if source_x + tw <= texture.get_width() and source_y + th <= texture.get_height():
				tile_refs[first_gid + local_id] = {"source_id": source_id, "atlas_coords": atlas_coords}


func _build_world_objects() -> void:
	var world_sort := Node2D.new()
	world_sort.name = "L3_YSort_Props_and_Player"
	world_sort.y_sort_enabled = true
	add_child(world_sort)

	var object_scene := load(OBJECT_SCENE) as PackedScene
	for object_data in map_data.get("objects", []):
		var visual := object_scene.instantiate() as Node2D
		visual.call("configure", self, object_data, false)
		world_sort.add_child(visual)

	var player_script: Script = load(PLAYER_SCENE_SCRIPT)
	_player = CharacterBody2D.new()
	_player.name = "Player"
	_player.set_script(player_script)
	var spawn: Dictionary = map_data.get("player_spawn", {"x": 896, "y": 896})
	var half_tile := Vector2(float(map_data.get("tile_width", 16)), float(map_data.get("tile_height", 16))) * 0.5
	_player.position = Vector2(float(spawn.get("x", 0)), float(spawn.get("y", 0))) + half_tile
	world_sort.add_child(_player)


func _build_collisions() -> void:
	var collision_root := StaticBody2D.new()
	collision_root.name = "L2_Static_Collisions"
	collision_root.collision_layer = 1
	collision_root.collision_mask = 0
	add_child(collision_root)
	for item in map_data.get("collisions", []):
		var shape_node := CollisionShape2D.new()
		var shape := RectangleShape2D.new()
		var width := float(item.get("w", 0.0))
		var height := float(item.get("h", 0.0))
		if width <= 0.0 or height <= 0.0:
			continue
		shape.size = Vector2(width, height)
		shape_node.shape = shape
		shape_node.position = Vector2(float(item.get("x", 0.0)) + width * 0.5, float(item.get("y", 0.0)) + height * 0.5)
		collision_root.add_child(shape_node)


func _build_canopies() -> void:
	var canopy_layer := Node2D.new()
	canopy_layer.name = "L4_Canopy_Roofs"
	canopy_layer.z_index = 5
	add_child(canopy_layer)
	var object_scene := load(OBJECT_SCENE) as PackedScene
	for object_data in map_data.get("canopies", []):
		var visual := object_scene.instantiate() as Node2D
		visual.call("configure", self, object_data, true)
		canopy_layer.add_child(visual)


func _build_hud() -> void:
	var canvas := CanvasLayer.new()
	canvas.name = "Village_HUD"
	canvas.layer = 20
	add_child(canvas)

	var panel := ColorRect.new()
	panel.position = Vector2(16, 16)
	panel.size = Vector2(520, 88)
	panel.color = Color(0.035, 0.055, 0.04, 0.84)
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	canvas.add_child(panel)

	_info_label = Label.new()
	_info_label.position = Vector2(28, 23)
	_info_label.size = Vector2(496, 74)
	_info_label.add_theme_font_size_override("font_size", 16)
	_info_label.add_theme_color_override("font_color", Color(1.0, 0.96, 0.82))
	_info_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_info_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	canvas.add_child(_info_label)

	var minimap := Control.new()
	minimap.name = "Map_Overview"
	minimap.set_script(load(MINIMAP_SCRIPT))
	minimap.call("configure",
		_player,
		Vector2(float(map_data.get("width", 112)), float(map_data.get("height", 96))) * 16.0,
		texture_for("res://assets/maps/lang_linh_khe_112x96-preview.png")
	)
	minimap.anchor_left = 1.0
	minimap.anchor_right = 1.0
	minimap.anchor_top = 0.0
	minimap.anchor_bottom = 0.0
	minimap.offset_left = -238.0
	minimap.offset_right = -18.0
	minimap.offset_top = 18.0
	minimap.offset_bottom = 208.0
	canvas.add_child(minimap)
