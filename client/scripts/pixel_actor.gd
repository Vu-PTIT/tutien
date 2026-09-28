class_name PixelActor
extends CharacterBody2D
## Presentation only: collision, movement and combat stay independent of outfit art.

const IDLE_SHEET: Texture2D = preload("res://assets/pixel/cultivator.png")
const CELL_SIZE := 512
const IDLE_REGION := Vector2(225.0, 305.0)
const IDLE_SOURCE_CELL := Vector2(295.5, 332.5)
const IDLE_SHEET_OFFSET := Vector2(40.0, 20.0)
const IDLE_SPRITE_Y := -21.0
const GROUNDED_SPRITE_Y := -30.5
const HOP_SPRITE_Y := -22.0
const HOP_ARC_HEIGHT := 18.0
const APPEARANCE_LIBRARY: Dictionary = {
	"cultivator_default": {
		"idle": IDLE_SHEET,
		"walk": preload("res://assets/pixel/player_actions/walk/sheet-transparent.png"),
		"run": preload("res://assets/pixel/player_actions/run/sheet-transparent.png"),
		"dash": preload("res://assets/pixel/player_actions/dash/sheet-transparent.png"),
		"hop": preload("res://assets/pixel/player_actions/hop/sheet-transparent.png"),
	}
}
const ANIMATION_FPS := {"walk": 8.0, "run": 10.0}

var clock: float = 0.0
var row: int = 0
var current_action := "idle"
var current_frame := 1
var appearance_id := "cultivator_default"
var last_direction := Vector2.DOWN
var frame_texture: AtlasTexture

@onready var sprite: Sprite2D = $Sprite
@onready var shadow: Polygon2D = $Shadow

func _ready() -> void:
	frame_texture = AtlasTexture.new()
	frame_texture.filter_clip = true
	sprite.texture = frame_texture
	present(Vector2.ZERO, 0.0)

func available_appearances() -> Array:
	return APPEARANCE_LIBRARY.keys()

func set_appearance_id(id: String) -> bool:
	if not APPEARANCE_LIBRARY.has(id):
		return false
	appearance_id = id
	if frame_texture != null:
		if current_action == "idle":
			_render_idle_frame()
		else:
			_render_action_frame(current_frame)
	return true

func present(
	direction: Vector2,
	delta: float,
	running: bool = false,
	dash_progress: float = -1.0,
	hop_progress: float = -1.0
) -> void:
	if frame_texture == null:
		return
	if direction.length_squared() > 0.01:
		last_direction = direction.normalized()
		if absf(last_direction.x) > absf(last_direction.y):
			row = 2 if last_direction.x > 0.0 else 1
		else:
			row = 0 if last_direction.y > 0.0 else 3

	var next_action := "idle"
	if hop_progress >= 0.0:
		next_action = "hop"
	elif dash_progress >= 0.0:
		next_action = "dash"
	elif direction.length_squared() > 0.01:
		next_action = "run" if running else "walk"

	if next_action == "idle":
		current_action = "idle"
		current_frame = 1
		clock = 0.0
		_render_idle_frame()
		sprite.position = Vector2(0.0, IDLE_SPRITE_Y)
		_reset_shadow()
		return

	if next_action != current_action:
		clock = 0.0
	current_action = next_action
	var frame_count := 4
	if next_action == "dash":
		current_frame = clampi(int(floor(dash_progress * frame_count)), 0, frame_count - 1)
	elif next_action == "hop":
		current_frame = clampi(int(floor(hop_progress * frame_count)), 0, frame_count - 1)
	else:
		clock += delta * float(ANIMATION_FPS[next_action])
		current_frame = int(clock) % frame_count
	_render_action_frame(current_frame)
	if next_action == "hop":
		var lift := sin(clampf(hop_progress, 0.0, 1.0) * PI)
		sprite.position = Vector2(0.0, HOP_SPRITE_Y - HOP_ARC_HEIGHT * lift)
		shadow.scale = Vector2.ONE * (1.0 - 0.14 * lift)
		shadow.color = Color(0.035, 0.055, 0.08, 0.45 - 0.18 * lift)
	else:
		sprite.position = Vector2(0.0, GROUNDED_SPRITE_Y)
		_reset_shadow()

func _render_idle_frame() -> void:
	var appearance: Dictionary = APPEARANCE_LIBRARY[appearance_id]
	frame_texture.atlas = appearance["idle"]
	frame_texture.region = Rect2(
		float(current_frame) * IDLE_SOURCE_CELL.x + IDLE_SHEET_OFFSET.x,
		float(row) * IDLE_SOURCE_CELL.y + IDLE_SHEET_OFFSET.y,
		IDLE_REGION.x,
		IDLE_REGION.y
	)

func _render_action_frame(frame: int) -> void:
	var appearance: Dictionary = APPEARANCE_LIBRARY[appearance_id]
	var sheet: Texture2D = appearance[current_action]
	frame_texture.atlas = sheet
	frame_texture.region = Rect2(frame * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE)

func _reset_shadow() -> void:
	if shadow == null:
		return
	shadow.scale = Vector2.ONE
	shadow.color = Color(0.035, 0.055, 0.08, 0.45)
