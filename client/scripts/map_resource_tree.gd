class_name MapResourceTree
extends StaticBody2D
## Data-driven harvestable tree with a compact trunk blocker and four art states.

signal felled(tree_id: String)

const TREE_STATES: Texture2D = preload("res://assets/pixel/props/generated/an_khe_interactables/tree/sheet-transparent.png")
const CELL_SIZE := 128

@onready var sprite: Sprite2D = $Sprite
@onready var trunk_collision: CollisionShape2D = $CollisionShape2D

var tree_id := ""
var hit_count := 0
var hits_to_fell := 3
var state_index := 0
var is_felling := false
var is_felled := false
var _sprite_anchor := Vector2(0.0, -64.0)

func configure(data: Dictionary, tile_size_px: int, saved_state: Dictionary = {}) -> void:
	tree_id = str(data.get("id", "resource_tree"))
	name = tree_id.replace(".", "_").replace("-", "_")
	var tile_position: Array = data.get("position_tiles", [0.0, 0.0])
	position = (Vector2(float(tile_position[0]), float(tile_position[1])) + Vector2(0.5, 1.0)) * tile_size_px
	hits_to_fell = maxi(int(data.get("hits_to_fell", 3)), 1)
	hit_count = clampi(int(saved_state.get("hit_count", 0)), 0, hits_to_fell)
	_sprite_anchor = Vector2(0.0, -float(CELL_SIZE) * 0.5 + float(data.get("foot_padding_px", 5)))
	sprite.scale = Vector2.ONE * float(data.get("sprite_scale", 1.0))
	sprite.position = _sprite_anchor
	var collision_size: Array = data.get("collision_size_px", [20, 12])
	var rectangle := RectangleShape2D.new()
	rectangle.size = Vector2(float(collision_size[0]), float(collision_size[1]))
	trunk_collision.shape = rectangle
	trunk_collision.position = Vector2(0.0, -rectangle.size.y * 0.5)
	if hit_count >= hits_to_fell:
		is_felled = true
		collision_layer = 0
		trunk_collision.disabled = true
		_set_stage(3)
	else:
		_set_stage(mini(hit_count, 2))

func can_be_chopped() -> bool:
	return not is_felling and not is_felled

func hits_remaining() -> int:
	return maxi(hits_to_fell - hit_count, 0)

func chop() -> Dictionary:
	if not can_be_chopped():
		return {}
	hit_count += 1
	if hit_count >= hits_to_fell:
		_begin_fall()
		return {"tree_id": tree_id, "hit_count": hit_count, "hits_remaining": 0, "falling": true}
	_set_stage(mini(hit_count, 2))
	_shake()
	return {"tree_id": tree_id, "hit_count": hit_count, "hits_remaining": hits_remaining(), "falling": false}

func _set_stage(stage: int) -> void:
	state_index = clampi(stage, 0, 3)
	var atlas := AtlasTexture.new()
	atlas.atlas = TREE_STATES
	var cell := Vector2i(state_index % 2, floori(float(state_index) / 2.0))
	atlas.region = Rect2(Vector2(cell * CELL_SIZE), Vector2(CELL_SIZE, CELL_SIZE))
	atlas.filter_clip = true
	sprite.texture = atlas
	sprite.position = _sprite_anchor

func _shake() -> void:
	var tween := create_tween()
	tween.tween_property(sprite, "rotation_degrees", 5.0, 0.05).set_trans(Tween.TRANS_SINE)
	tween.tween_property(sprite, "rotation_degrees", -4.0, 0.06).set_trans(Tween.TRANS_SINE)
	tween.tween_property(sprite, "rotation_degrees", 0.0, 0.08).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func _begin_fall() -> void:
	is_felling = true
	_set_stage(2)
	var tween := create_tween()
	tween.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN)
	tween.tween_property(sprite, "rotation_degrees", 15.0, 0.16)
	tween.parallel().tween_property(sprite, "position", _sprite_anchor + Vector2(8.0, 3.0), 0.16)
	tween.tween_callback(_finish_felling)

func _finish_felling() -> void:
	is_felling = false
	is_felled = true
	sprite.rotation = 0.0
	collision_layer = 0
	trunk_collision.set_deferred("disabled", true)
	_set_stage(3)
	felled.emit(tree_id)
