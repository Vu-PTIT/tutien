extends Node2D
## Presentation only. Position, phase and health come from the server snapshot.

const SHEET: Texture2D = preload("res://assets/pixel/enemies/son_tru.png")
const CELL_SIZE := 128
const ARENA_SCALE := 2.0 / 3.0

var frame_texture: AtlasTexture
var _last_frame := -1

func _ready() -> void:
	scale = Vector2(ARENA_SCALE, ARENA_SCALE)
	frame_texture = AtlasTexture.new()
	frame_texture.atlas = SHEET
	frame_texture.filter_clip = true
	$Sprite.texture = frame_texture
	$Sprite.scale = Vector2(0.72, 0.72)
	$Sprite.position = Vector2(0, -38)

func present(snapshot: Dictionary) -> void:
	position = Vector2(float(snapshot.get("x", 0)), float(snapshot.get("y", 0))) * ARENA_SCALE
	var facing := Vector2(float(snapshot.get("faceX", -1)), float(snapshot.get("faceY", 0)))
	if facing.length_squared() > 0.01:
		$Sprite.rotation = facing.angle()
	var mode := str(snapshot.get("mode", "idle"))
	var tick := int(snapshot.get("tick", 0))
	var age := tick - int(snapshot.get("since", 0))
	var frame := 0
	match mode:
		"notice", "windup":
			frame = 2 if age < 8 else 3
		"charge":
			frame = 4
		"recover":
			frame = 5
		"dead":
			frame = 5
		_:
			frame = 0 if int(tick / 8) % 2 == 0 else 1
	if frame != _last_frame:
		frame_texture.region = Rect2((frame % 3) * CELL_SIZE, int(frame / 3) * CELL_SIZE, CELL_SIZE, CELL_SIZE)
		_last_frame = frame
	$Sprite.modulate = Color(0.62, 0.55, 0.48, 0.82) if mode == "dead" else Color.WHITE
	$Shadow.modulate.a = 0.16 if mode == "dead" else 0.42
