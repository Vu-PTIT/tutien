class_name PixelActor
extends CharacterBody2D
## Sprite atlas frames are presentation only; combat stays on the server.
const SHEET = preload("res://assets/pixel/cultivator.png")
const CELL_SIZE := 64
var clock: float = 0.0
var row: int = 0
var frame_texture: AtlasTexture

func _ready() -> void:
	frame_texture = AtlasTexture.new()
	frame_texture.atlas = SHEET
	frame_texture.filter_clip = true
	$Sprite.texture = frame_texture
	present(Vector2.ZERO, 0.0)

func facing_direction() -> Vector2:
	match row:
		1: return Vector2.LEFT
		2: return Vector2.RIGHT
		3: return Vector2.UP
		_: return Vector2.DOWN

func present(direction: Vector2, delta: float) -> void:
	if frame_texture == null:
		return
	if direction.length_squared() > 0.01:
		clock += delta * 7.0
		if absf(direction.x) > absf(direction.y):
			row = 2 if direction.x > 0 else 1
		else:
			row = 0 if direction.y > 0 else 3
	else:
		clock = 0.0
	var frame := int(clock) % 4
	frame_texture.region = Rect2(frame * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE)
