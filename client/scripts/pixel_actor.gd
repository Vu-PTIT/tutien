class_name PixelActor
extends Node2D
## Sprite atlas frames are presentation only; combat stays on the server.
const SHEET = preload("res://assets/pixel/cultivator.png")
var clock: float = 0.0
var row: int = 0
var frame_texture: AtlasTexture

func _ready() -> void:
	frame_texture = AtlasTexture.new()
	frame_texture.atlas = SHEET
	frame_texture.filter_clip = true
	$Sprite.texture = frame_texture
	present(Vector2.ZERO, 0.0)

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
		clock = 1.0
	var frame := int(clock) % 4
	frame_texture.region = Rect2(frame * 295.5 + 40, row * 332.5 + 20, 225, 305)
