class_name MapProp
extends Node2D
## A Y-sorted landmark. Source resolution is independent of the movement grid.

@onready var sprite: Sprite2D = $Sprite
var occlusion_radius_px := 0.0
var occlusion_height_px := 0.0
var occluded_alpha := 1.0

func configure(data: Dictionary, texture: Texture2D, tile_size_px: int, atlas_columns: int = 8, cell_px: int = 128) -> void:
	name = str(data.get("name", "MapProp"))
	var tile_position: Array = data.get("position_tiles", [0, 0])
	position = (Vector2(float(tile_position[0]), float(tile_position[1])) + Vector2(0.5, 1.0)) * tile_size_px
	var sprite_texture: Texture2D = texture
	var standalone_path := str(data.get("texture_path", ""))
	if not standalone_path.is_empty():
		sprite_texture = load(standalone_path) as Texture2D
	if sprite_texture == null:
		visible = false
		return
	if standalone_path.is_empty():
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
		sprite_texture = atlas
	sprite.texture = sprite_texture
	# The node sits at the prop's feet; transparent cutouts can supply their own padding.
	sprite.position = Vector2(0, -sprite_texture.get_height() * 0.5 + float(data.get("foot_padding_px", 0)))
	var scale_tiles: Array = data.get("scale_tiles", [1, 1])
	if scale_tiles.size() >= 2:
		sprite.scale = Vector2(float(scale_tiles[0]), float(scale_tiles[1]))
	var occlusion: Dictionary = data.get("occlusion", {})
	if str(occlusion.get("policy", "")) == "fade_when_behind":
		occlusion_radius_px = float(occlusion.get("radius_tiles", 1.5)) * tile_size_px
		occlusion_height_px = float(occlusion.get("height_tiles", 3.0)) * tile_size_px
		occluded_alpha = clampf(float(occlusion.get("opacity", 0.55)), 0.2, 1.0)

func update_player_occlusion(player_feet: Vector2) -> void:
	if occlusion_radius_px <= 0.0:
		return
	var behind := absf(player_feet.x - position.x) < occlusion_radius_px \
		and player_feet.y < position.y and player_feet.y > position.y - occlusion_height_px
	var tint := sprite.modulate
	tint.a = occluded_alpha if behind else 1.0
	sprite.modulate = tint
