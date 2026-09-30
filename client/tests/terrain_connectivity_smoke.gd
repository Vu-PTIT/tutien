extends SceneTree
## Smoke checks for connected water and shoreline map layers.

const MainScene = preload("res://scenes/main.tscn")

var failures: int = 0

func _initialize() -> void:
	_run.call_deferred()

func _check(ok: bool, label: String) -> void:
	if not ok:
		failures += 1
		push_error(label)

func _run() -> void:
	var main = MainScene.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	for map_id in ["m_an_khe", "m_truc_am"]:
		_check(main._load_map(map_id), "%s loads with its terrain layout" % map_id)
		await process_frame
		var world: GameMap = main.map_world
		if world == null:
			_check(false, "%s creates a map runtime" % map_id)
			continue
		var layers := world.get_node("WorldLayers") as Node2D
		var ground := layers.get_node("GroundLayer") as TileMapLayer
		var water := layers.get_node("WaterLayer") as TileMapLayer
		var shore := layers.get_node("ShoreLayer") as TileMapLayer
		_check(ground.get_used_cells().size() == 48 * 36, "%s retains its full ground grid" % map_id)
		_check(water.get_used_cells().size() > 0, "%s renders water on a separate layer" % map_id)
		_check(shore.get_used_cells().size() > 0, "%s places shoreline transitions" % map_id)
		_check(world.map_data.get("runtime_surface_step_materials", {}).has("grass"), "%s enables material-aware footstep cues" % map_id)
	main.queue_free()
	await process_frame
	quit(1 if failures > 0 else 0)
