extends "res://scripts/village_player.gd"

var touch_direction := Vector2.ZERO
var move_path := PackedVector2Array()
var blocked := false
var resting := false
var _spawn_framing := true


func _ready() -> void:
	super._ready()
	move_speed = 270.0
	_sprite.scale = Vector2(2, 2)
	_sprite.position.y = -48
	var collider := get_child(0) as CollisionShape2D
	var capsule := collider.shape as CapsuleShape2D
	capsule.radius = 12
	capsule.height = 28
	collider.position.y = -12
	camera.zoom = Vector2.ONE
	camera.offset = Vector2(0, -128)


func _physics_process(delta: float) -> void:
	if blocked or resting:
		velocity = Vector2.ZERO
		_update_animation(Vector2.ZERO)
		return
	var direction := touch_direction
	direction.x += float(Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT)) - float(Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT))
	direction.y += float(Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN)) - float(Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP))
	if direction.length_squared() > 0:
		move_path.clear()
	elif not move_path.is_empty():
		while not move_path.is_empty() and global_position.distance_to(move_path[0]) < 9:
			move_path.remove_at(0)
		if not move_path.is_empty():
			direction = (move_path[0] - global_position).normalized()
	direction = direction.normalized()
	if direction.length_squared() > 0:
		_spawn_framing = false
	if not _spawn_framing:
		camera.offset = camera.offset.move_toward(Vector2.ZERO, delta * 180.0)
	velocity = direction * move_speed * (1.6 if Input.is_key_pressed(KEY_SHIFT) else 1.0)
	move_and_slide()
	_update_animation(direction)


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			camera.zoom = Vector2(2, 2)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			camera.zoom = Vector2.ONE


func rest_at(point: Vector2) -> void:
	move_path.clear()
	resting = true
	velocity = Vector2.ZERO
	global_position = point
	_update_animation(Vector2(0, 1))
	_sprite.position.y = -48


func leave_rest(point: Vector2) -> void:
	global_position = point
	resting = false
	_sprite.position.y = -48
	camera.offset = Vector2.ZERO
	_spawn_framing = false
