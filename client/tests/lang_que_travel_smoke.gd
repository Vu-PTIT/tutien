extends SceneTree


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var world: Node2D=load("res://scenes/m_lang_que.tscn").instantiate()
	world.save_enabled=false
	root.add_child(world)
	current_scene=world
	for data in [["lq_portal_ln_lang_thang","m_thang_long",Vector2(245,105)],
		["lq_portal_ln_lang_vanh","m_vanh_dai_tay",Vector2(147,12)]]:
		for _i in range(3):
			await physics_frame
		var target: Node2D
		for prop in world.props:
			if str(prop.object_id)==str(data[0]):
				target=prop
		world.player.position=target.call("action_world_point")
		await physics_frame
		world.execute_action(target)
		for _i in range(3):
			await process_frame
		var preview: Node2D=current_scene
		if preview==null or str(preview._active_map_id)!=str(data[1]) or preview.map_count!=8:
			push_error("Portal did not load the intended neighbor preview")
			quit(1)
			return
		preview._return_to_village()
		for _i in range(3):
			await process_frame
		world=current_scene
		world.save_enabled=false
		if world.player.global_position.distance_to(data[2]*32)>1:
			push_error("Portal return did not use the village arrival anchor")
			quit(1)
			return
	print("PASS first village: Thang Long and West Frontier preview round trips use the shared link contract")
	world.free()
	quit(0)
