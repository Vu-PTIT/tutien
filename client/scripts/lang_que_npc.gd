extends CharacterBody2D

var info: Dictionary = {}
var world: Node2D
var object_id := ""
var kind := "npc"
var action := "talk"
var interaction_radius := 110.0
var sprite: AnimatedSprite2D
var _route := PackedVector2Array()
var _target_index := 0
var _wait := 0.0
var _night := false
var _facing := "down"
var _looping := false


func configure(data: Dictionary, map_world: Node2D) -> void:
	info = data
	world = map_world
	object_id = str(data.id)
	name = object_id
	position = Vector2(float(data.cell[0]), float(data.cell[1])) * 32.0
	collision_layer = 0
	collision_mask = 1
	var collider := CollisionShape2D.new()
	var circle := CircleShape2D.new()
	circle.radius = 10
	collider.shape = circle
	collider.position.y = -10
	add_child(collider)
	sprite = AnimatedSprite2D.new()
	sprite.sprite_frames = world.npc_frames
	sprite.scale = Vector2(2, 2)
	sprite.position = Vector2(0, -48)
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	add_child(sprite)
	sprite.play("idle_down")
	if bool(data.get("service", false)):
		var tag := Label.new()
		tag.name = "NameTag"
		tag.text = display_name()
		tag.position = Vector2(-60, -92)
		tag.add_theme_font_override("font", world.FONT)
		tag.add_theme_font_size_override("font_size", 16)
		tag.add_theme_color_override("font_color", Color("ffecb5"))
		tag.add_theme_color_override("font_outline_color", Color("263c30"))
		tag.add_theme_constant_override("outline_size", 4)
		add_child(tag)


func set_schedule(night: bool) -> void:
	_night = night
	_route.clear()
	var stops: Array = [info.home_cell] if night else info.get("patrol_cells", [])
	_looping = not night and not stops.is_empty()
	if stops.is_empty():
		stops = [info.cell]
	var origin := global_position
	for stop in stops:
		var destination := Vector2(float(stop[0]), float(stop[1])) * 32
		var segment: PackedVector2Array = world.route_between(origin, destination)
		_route.append_array(segment)
		origin = destination
	if _looping:
		_route.append_array(world.route_between(origin, Vector2(float(stops[0][0]),float(stops[0][1]))*32))
	_target_index = 0
	_wait = 0


func _physics_process(delta: float) -> void:
	if world.player == null:
		return
	# Far villagers retain their role and state without ticking walk animation.
	if global_position.distance_squared_to(world.player.global_position) > 1800.0 * 1800.0:
		return
	var direction := Vector2.ZERO
	_wait -= delta
	if _wait <= 0 and not _route.is_empty() and global_position.distance_to(world.player.global_position) > 90:
		var target := _route[_target_index]
		if global_position.distance_to(target) < 8:
			_target_index += 1
			if _target_index >= _route.size():
				_target_index = 0
				_wait = 3.0
				if not _looping:
					_route.clear()
		else:
			direction = (target - global_position).normalized()
	velocity = direction * 92.0
	move_and_slide()
	if absf(direction.x) > absf(direction.y):
		_facing = "right" if direction.x > 0 else "left"
	elif direction.length_squared() > 0:
		_facing = "down" if direction.y > 0 else "up"
	var anim := ("walk_" if direction.length_squared() > 0 else "idle_") + _facing
	if sprite.animation != anim:
		sprite.play(anim)


func action_world_point() -> Vector2:
	return global_position + Vector2(0, 24)


func display_name() -> String:
	return world.local_text(str(info.name), str(info.name_en))
