class_name MapProp
extends Node2D
## Y-sorted decorative world object cut from a transparent 32 px props atlas.

@onready var sprite: Sprite2D = $Sprite

func configure(data: Dictionary, atlas_path: String, tile_size_px: int, atlas_columns: int = 8) -> void:
	name = str(data.get("name", "MapProp"))
	var tile_position: Array = data.get("position_tiles", [0, 0])
	position = (Vector2(float(tile_position[0]), float(tile_position[1])) + Vector2(0.5, 1.0)) * tile_size_px
	var texture := load(atlas_path) as Texture2D
	if texture == null:
		visible = false
		return
	var tile_index := int(data.get("tile", 0))
	var atlas := AtlasTexture.new()
	atlas.atlas = texture
	var columns := maxi(atlas_columns, 1)
	var atlas_y := floori(float(tile_index) / float(columns))
	atlas.region = Rect2((tile_index % columns) * tile_size_px, atlas_y * tile_size_px, tile_size_px, tile_size_px)
	sprite.texture = atlas
	sprite.position = Vector2(0, -tile_size_px * 0.5)
	var scale_tiles: Array = data.get("scale_tiles", [1, 1])
	if scale_tiles.size() >= 2:
		sprite.scale = Vector2(float(scale_tiles[0]), float(scale_tiles[1]))
