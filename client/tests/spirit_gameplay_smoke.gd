extends SceneTree

func _initialize() -> void:
	_run.call_deferred()

func _run() -> void:
	var game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	await process_frame
	assert(not game.online)
	assert(game.ui.invite.disabled and game.ui.claim.disabled)
	assert(game.field.form == "human")
	game.ui.cat.pressed.emit()
	assert(game.field.form == "spirit")
	game.ui.human.pressed.emit()
	assert(game.field.form == "human")
	game.ui.cat.pressed.emit()
	assert(game.field.walkable(Vector2(640, 520)))
	assert(not game.field.walkable(Vector2(0, 0)))
	assert(not game.field.walkable(Vector2(250, 180)))
	game.field.player_position = Vector2(660, 520)
	game._attack(true)
	assert(game.field.mobs[0].hp == 27)
	game.attack_ready = 0.0
	game._attack(true)
	assert(game.field.mobs[0].hp == 0)
	assert(game.demo_xp == 10 and game.demo_loot == 1)
	game.attack_ready = 0.0
	game._attack(true)
	assert(game.demo_xp == 10 and game.demo_loot == 1)
	root.size = Vector2i(720, 1000)
	await process_frame
	await process_frame
	assert(game.body.vertical)
	assert(game.ui.attack.get_global_rect().end.x <= 720)
	assert(game.api.token.is_empty())
	game.queue_free()
	await process_frame
	print("PASS: human/cat, collision, combat/reward, mobile layout, offline contract gating")
	quit(0)
