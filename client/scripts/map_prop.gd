class_name MapProp
extends Node2D
## A Y-sorted landmark. Source resolution is independent of the movement grid.

@onready var sprite: Sprite2D = $Sprite

func configure(data: Dictionary, texture: Texture2D, tile_size_px: int, atlas_columns: int = 8, cell_px: int = 128) -> void:
	name = str(data.get("name", "MapProp"))
	var tile_position: Array = data.get("position_tiles", [0, 0])
	position = (Vector2(float(tile_position[0]), float(tile_position[1])) + Vector2(0.5, 1.0)) * tile_size_px
	if texture == null:
		visible = false
		return
	var tile_index := int(data.get("tile", 0))
	var atlas := AtlasTexture.new()
	atlas.atlas = texture
	var columns := maxi(atlas_columns, 1)
	var atlas_y := floori(float(tile_index) / float(columns))
	atlas.region = Rect2((tile_index % columns) * cell_px, atlas_y * cell_px, cell_px, cell_px)
	if tile_index < 0 or not Rect2(Vector2.ZERO, Vector2(texture.get_size())).encloses(atlas.region):
		push_error("Prop atlas region is out of bounds: " + name)
		visible = false
		return
	atlas.filter_clip = true
	sprite.texture = atlas
	sprite.position = Vector2(0, -cell_px * 0.5)
	var scale_tiles: Array = data.get("scale_tiles", [1, 1])
	if scale_tiles.size() >= 2:
		sprite.scale = Vector2(float(scale_tiles[0]), float(scale_tiles[1]))
