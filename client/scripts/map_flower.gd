class_name MapFlower
extends Area2D
## Low vegetation that reacts to the player's feet and springs back.

const FLOWER_VARIANTS: Texture2D = preload("res://assets/pixel/props/generated/an_khe_interactables/flowers/sheet-transparent.png")
const CELL_SIZE := 64

@onready var sprite: Sprite2D = $Sprite
@onready var stomp_area: CollisionShape2D = $CollisionShape2D

var flower_id := ""
var stomp_count := 0
var _rest_scale := Vector2.ONE
var _squashed := false

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func configure(data: Dictionary, tile_size_px: int) -> void:
	flower_id = str(data.get("id", "flower"))
	name = flower_id.replace(".", "_").replace("-", "_")
	var tile_position: Array = data.get("position_tiles", [0.0, 0.0])
	position = (Vector2(float(tile_position[0]), float(tile_position[1])) + Vector2(0.5, 0.5)) * tile_size_px
	var variant := clampi(int(data.get("variant", 0)), 0, 3)
	var atlas := AtlasTexture.new()
	atlas.atlas = FLOWER_VARIANTS
	var cell := Vector2i(variant % 2, floori(float(variant) / 2.0))
	atlas.region = Rect2(Vector2(cell * CELL_SIZE), Vector2(CELL_SIZE, CELL_SIZE))
	atlas.filter_clip = true
	sprite.texture = atlas
	_rest_scale = Vector2.ONE * float(data.get("sprite_scale", 1.0))
	sprite.scale = _rest_scale
	sprite.position = Vector2(0.0, -float(CELL_SIZE) * _rest_scale.y * 0.5 + float(data.get("foot_padding_px", 2)))
	var circle := CircleShape2D.new()
	circle.radius = float(data.get("stomp_radius_px", 16.0))
	stomp_area.shape = circle

func _on_body_entered(body: Node2D) -> void:
	if body is PixelActor:
		stomp()

func stomp() -> void:
	if _squashed:
		return
	_squashed = true
	stomp_count += 1
	var lean := -0.12 if stomp_count % 2 == 0 else 0.12
	var tween := create_tween()
	tween.tween_property(sprite, "scale", Vector2(_rest_scale.x * 1.14, _rest_scale.y * 0.34), 0.09).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tween.parallel().tween_property(sprite, "rotation", lean, 0.09)
	tween.tween_interval(0.08)
	tween.tween_property(sprite, "scale", _rest_scale, 0.24).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.parallel().tween_property(sprite, "rotation", 0.0, 0.24)
	tween.finished.connect(_release_stomp)

func _release_stomp() -> void:
	await get_tree().create_timer(0.22).timeout
	_squashed = false
