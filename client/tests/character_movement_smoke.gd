extends SceneTree
## Offline movement and appearance smoke test. Run with --no-auto-connect.
const Main = preload("res://scenes/main.tscn")
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func _check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)

func _tick(main, frames: int) -> void:
	for _index in range(frames):
		main.call("_physics_process", 1.0 / 60.0)

func _run() -> void:
	var main = Main.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	main.set_physics_process(false)

	var player: PixelActor = main.player
	var collision_shape: CollisionShape2D = player.get_node("CollisionShape2D") as CollisionShape2D
	var body_shape: RectangleShape2D = collision_shape.shape as RectangleShape2D
	var sprite: Sprite2D = player.get_node("Sprite") as Sprite2D
	var shadow: Polygon2D = player.get_node("Shadow") as Polygon2D
	var input: GameInput = main.game_input
	# Isolate velocity limits from authored map blockers; keep the real shape present for action checks.
	player.collision_mask = 0
	main.touch_controls.direction = Vector2.RIGHT
	_tick(main, 1)
	_check(player.velocity.length() > 0.0 and player.velocity.length() < 20.0, "Walk acceleration should ramp from rest")
	_tick(main, 40)
	_check(absf(player.velocity.length() - 72.0) < 0.1, "Walk speed should settle at 72 px/s")

	input.set_touch_sprint(true)
	_check(input.is_running(), "Touch run toggle should share the keyboard run state")
	_tick(main, 40)
	_check(absf(player.velocity.length() - 96.0) < 0.1, "Run speed should settle at 96 px/s")

	main.touch_controls.direction = Vector2.ZERO
	_tick(main, 12)
	player.velocity = Vector2.ZERO
	main.call("_action", "dodge")
	_tick(main, 1)
	_check(player.velocity.length() > 149.0, "World dash should apply its short movement burst")
	_check(player.collision_layer == 2 and body_shape.size == Vector2(16, 10), "Dash must keep the normal collision body")

	_tick(main, 35)
	player.velocity = Vector2.ZERO
	var grounded_position := player.position
	var collision_size: Vector2 = body_shape.size
	main.call("_action", "hop")
	_tick(main, 15)
	_check(sprite.position.y < -35.0, "Hop should lift only the displayed sprite")
	_check(shadow.scale.x < 0.9, "Hop should keep a smaller shadow at ground level")
	_check(player.position.distance_to(grounded_position) < 0.01, "Hop must not move the collision root")
	_check(body_shape.size == collision_size, "Hop must keep the normal collision shape")

	_check(player.set_appearance_id("cultivator_default"), "Default cosmetic appearance should be registered")
	_check(not player.set_appearance_id("unknown_outfit"), "Unregistered appearance must be rejected")
	_check(player.appearance_id == "cultivator_default", "Appearance selection should remain cosmetic data")

	main.queue_free()
	await process_frame
	if failures == 0:
		print("Character movement and appearance smoke passed")
	quit(1 if failures > 0 else 0)
