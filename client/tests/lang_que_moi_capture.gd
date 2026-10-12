extends SceneTree


func _initialize() -> void:
	root.mode=Window.MODE_WINDOWED
	root.size=Vector2i(1280,720)
	call_deferred("_run")


func _capture(path: String) -> void:
	for _frame in range(5):
		await process_frame
	await RenderingServer.frame_post_draw
	var screenshot:=root.get_texture().get_image()
	if screenshot==null or screenshot.is_empty() or screenshot.save_png(path)!=OK:
		push_error("Failed to capture first village: "+path)
		quit(1)
	print("Captured ",path)


func _run() -> void:
	root.mode=Window.MODE_WINDOWED
	root.size=Vector2i(1280,720)
	DirAccess.make_dir_recursive_absolute("/tmp/tutien-previews")
	var world: Node2D=load("res://scenes/m_lang_que_moi.tscn").instantiate()
	world.save_enabled=false
	root.add_child(world)
	await _capture("/tmp/tutien-previews/lang_que_moi_desktop.png")
	for target in world.props:
		if str(target.object_id)=="new_sit_02":
			world.player.position=target.call("action_world_point")
			await physics_frame
			world.execute_action(target)
			world._camera.reset_smoothing()
			await _capture("/tmp/tutien-previews/lang_que_moi_seated.png")
			world._leave_activity()
	for target in world.props:
		if str(target.object_id)=="new_npc_minh":
			world.player.position=target.call("action_world_point")
			await physics_frame
			world.execute_action(target)
			await _capture("/tmp/tutien-previews/lang_que_moi_dialogue.png")
			world._close_dialog()
	world._camera.offset=Vector2.ZERO
	world.player.position=Vector2(177,150)*32
	world._camera.reset_smoothing()
	await _capture("/tmp/tutien-previews/lang_que_moi_lake.png")
	world.player.position=Vector2(75,165)*32
	world._camera.reset_smoothing()
	await _capture("/tmp/tutien-previews/lang_que_moi_garden.png")
	world.player.position=Vector2(132,32)*32
	world._camera.reset_smoothing()
	await _capture("/tmp/tutien-previews/lang_que_moi_pump.png")
	world.player.position=Vector2(210,69)*32
	world._camera.reset_smoothing()
	await _capture("/tmp/tutien-previews/lang_que_moi_new_hamlet.png")
	world.player.position=Vector2(55,43)*32
	world._camera.reset_smoothing()
	await _capture("/tmp/tutien-previews/lang_que_moi_fields.png")
	world.player.position=Vector2(130,111)*32
	world._camera.reset_smoothing()
	world._camera.offset=Vector2(0,-128)
	world.set_night(true)
	world.set_rain(true)
	await _capture("/tmp/tutien-previews/lang_que_moi_night_rain.png")
	world.set_night(false)
	world.set_rain(false)
	world.toggle_map()
	await _capture("/tmp/tutien-previews/lang_que_moi_detailed_map.png")
	world.toggle_map()
	world._touch.visible=true
	root.size=Vector2i(960,540)
	await _capture("/tmp/tutien-previews/lang_que_moi_touch.png")
	world._hud.visible=false
	root.size=Vector2i(4096,3072)
	root.content_scale_size=Vector2i(4096,3072)
	var overview:=Camera2D.new()
	overview.position=world._world_size*.5
	overview.zoom=Vector2(.5,.5)
	world.add_child(overview)
	overview.make_current()
	await _capture("/tmp/tutien-previews/lang_que_moi_overview.png")
	world.free()
	quit(0)
