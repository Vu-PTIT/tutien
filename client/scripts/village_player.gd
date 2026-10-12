extends CharacterBody2D

const WALK_SHEET := "res://assets/tileset/Art/Characters/Main Character/Character_Walk.png"
const IDLE_SHEET := "res://assets/tileset/Art/Characters/Main Character/Character_Idle.png"
# Source sheet is 160x192: four 40x48 cells, not five 32px cells.
# Alpha component centers repeat at x=20,60,100,140 in both idle and walk.
const FRAME_WIDTH := 40
const FRAME_HEIGHT := 48

var move_speed := 88.0
var camera: Camera2D
var _sprite: AnimatedSprite2D
var _facing := "down"


func _ready() -> void:
	collision_layer = 2
	collision_mask = 1
	var collider := CollisionShape2D.new()
	var shape := CapsuleShape2D.new()
	shape.radius = 6.0
	shape.height = 16.0
	collider.shape = shape
	collider.position = Vector2(0.0, -8.0)
	add_child(collider)

	_sprite = AnimatedSprite2D.new()
	_sprite.name = "Character"
	_sprite.sprite_frames = _make_sprite_frames()
	_sprite.position = Vector2(0.0, -17.0)
	_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	add_child(_sprite)
	_sprite.play("idle_down")

	camera = Camera2D.new()
	camera.name = "VillageCamera"
	camera.position_smoothing_enabled = true
	camera.position_smoothing_speed = 7.0
	camera.zoom = Vector2(2.0, 2.0)
	camera.limit_left = 0
	camera.limit_top = 0
	camera.limit_right = 112 * 16
	camera.limit_bottom = 96 * 16
	add_child(camera)
	camera.make_current()


func _physics_process(_delta: float) -> void:
	var right := Input.is_physical_key_pressed(KEY_D) or Input.is_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT) or Input.is_key_pressed(KEY_RIGHT)
	var left := Input.is_physical_key_pressed(KEY_A) or Input.is_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT) or Input.is_key_pressed(KEY_LEFT)
	var down := Input.is_physical_key_pressed(KEY_S) or Input.is_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN) or Input.is_key_pressed(KEY_DOWN)
	var up := Input.is_physical_key_pressed(KEY_W) or Input.is_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP) or Input.is_key_pressed(KEY_UP)
	var horizontal := float(right) - float(left)
	var vertical := float(down) - float(up)
	var direction := Vector2(horizontal, vertical)
	if direction.length_squared() > 1.0:
		direction = direction.normalized()
	velocity = direction * move_speed
	move_and_slide()
	_update_animation(direction)


func _unhandled_input(event: InputEvent) -> void:
	if not event is InputEventMouseButton:
		return
	var mouse_event := event as InputEventMouseButton
	if not mouse_event.pressed:
		return
	var factor := 1.0
	if mouse_event.button_index == MOUSE_BUTTON_WHEEL_UP:
		factor = 1.15
	elif mouse_event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
		factor = 1.0 / 1.15
	else:
		return
	var zoom_level := clampf(camera.zoom.x * factor, 0.65, 4.0)
	camera.zoom = Vector2(zoom_level, zoom_level)


func _make_sprite_frames() -> SpriteFrames:
	var frames := SpriteFrames.new()
	if frames.has_animation("default"):
		frames.remove_animation("default")
	var walk_texture := load(WALK_SHEET) as Texture2D
	var idle_texture := load(IDLE_SHEET) as Texture2D
	var rows: Dictionary = {
		"down": 3,
		"up": 2,
		"left": 0,
		"right": 1,
		"side": 0,
	}
	for direction: String in rows:
		for movement: String in ["idle", "walk"]:
			var animation_name: String = movement + "_" + direction
			var texture: Texture2D = idle_texture if movement == "idle" else walk_texture
			if texture == null:
				push_error("Could not load character sprite sheet: " + animation_name)
				continue
			var frame_count := floori(float(texture.get_width()) / float(FRAME_WIDTH))
			var row_index := int(rows[direction])
			if frame_count <= 0 or texture.get_width() % FRAME_WIDTH != 0 or (row_index + 1) * FRAME_HEIGHT > texture.get_height():
				push_error("Character sprite frame or row is outside the sheet: " + animation_name)
				continue
			frames.add_animation(animation_name)
			frames.set_animation_speed(animation_name, 8.0 if movement == "walk" else 4.0)
			frames.set_animation_loop(animation_name, true)
			for column in range(frame_count):
				var frame := AtlasTexture.new()
				frame.atlas = texture
				frame.region = Rect2(column * FRAME_WIDTH, row_index * FRAME_HEIGHT, FRAME_WIDTH, FRAME_HEIGHT)
				frames.add_frame(animation_name, frame)
	return frames


func _update_animation(direction: Vector2) -> void:
	if direction.x < 0.0:
		_facing = "left"
		_sprite.flip_h = false
	elif direction.x > 0.0:
		_facing = "right"
		_sprite.flip_h = false
	elif direction.y < 0.0:
		_facing = "up"
		_sprite.flip_h = false
	elif direction.y > 0.0:
		_facing = "down"
		_sprite.flip_h = false

	if direction.length_squared() > 0.0:
		var animation_name: String = "walk_" + _facing
		if _sprite.animation != animation_name or not _sprite.is_playing():
			_sprite.play(animation_name)
	else:
		var animation_name: String = "idle_" + _facing
		if _sprite.animation != animation_name:
			_sprite.animation = animation_name
		_sprite.stop()
		_sprite.frame = 0
