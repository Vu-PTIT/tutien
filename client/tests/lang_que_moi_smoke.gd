extends SceneTree

var failures: Array[String] = []


func _initialize() -> void:
	call_deferred("_run")


func check(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
		push_error(message)


func _run() -> void:
	var world: Node2D=load("res://scenes/m_lang_que_moi.tscn").instantiate()
	world.save_enabled=false
	root.add_child(world)
	for _i in range(5):
		await physics_frame
	var spawn: Vector2=world.player.global_position
	check(world.layout.layout_id=="lang_que_moi","Wrong village layout loaded")
	check(world.get_script().get_base_script()==null,"New village inherits an old scene script")
	check(world.layout.source.legacy_layout_inputs.is_empty(),"Legacy geometry is an input to the new village")
	check(world._world_size==Vector2(8192,6144),"World planning dimensions drifted")
	check(world.find_children("*","TileMapLayer",true,false).is_empty(),"New map uses a TileMapLayer")
	check(world.layout.safe_zone and int(world.layout.hostile_spawn_count)==0,"Village safe-zone contract failed")
	var actor_art: AnimatedSprite2D=world.player.get_node("Character")
	check(actor_art.sprite_frames.get_frame_count("idle_down")==4,"Actor sheet is not sliced as four source columns")
	check((actor_art.sprite_frames.get_frame_texture("idle_down",2) as AtlasTexture).region.size==Vector2(40,48),"Actor source frame dimensions drifted")
	var route_checks:=0
	for target in world.props:
		if str(target.action).is_empty():
			continue
		var point: Vector2=target.call("action_world_point")
		var route: PackedVector2Array=world.route_between(spawn,point)
		check(not route.is_empty(),"Unreachable interaction: "+str(target.object_id)+" "+str(point/32))
		check(_physical_route_clear(world,route),"Navigation route intersects the actual actor footprint: "+str(target.object_id))
		route_checks+=1
	for link in world._links.links:
		for side in ["a","b"]:
			var endpoint: Dictionary=link[side]
			if str(endpoint.map_id)=="m_lang_que":
				check(not world.route_between(spawn,world._vector(endpoint.cell)*32).is_empty(),"Unreachable portal "+str(link.id))
				check(not world.route_between(spawn,world._vector(endpoint.entry_anchor_cell)*32).is_empty(),"Blocked arrival anchor "+str(link.id))
	for checkpoint in world.layout.checkpoints:
		check(not world.route_between(spawn,world._vector(checkpoint.cell)*32).is_empty(),"Unreachable checkpoint "+str(checkpoint.id))
	# Water must block feet; both bridge centerlines and all four dock slots must be clear.
	check(_overlaps(world,Vector2(176,166)*32),"Lake center is physically walkable")
	for bridge in world.layout.bridges:
		check(not _overlaps(world,world._vector(bridge.center_cell)*32),"Bridge or dock overlaps water collision: "+str(bridge.id))
	var door: Node2D=_target(world,"new_player_house")
	world.player.position=door.call("action_world_point")
	await physics_frame
	world.execute_action(door)
	check(door.opened,"Door action did not open the door")
	world.execute_action(door)
	check(not door.opened,"Door action did not close the door")
	var plot: Node2D=_target(world,"new_plot_02")
	world.player.position=plot.call("action_world_point")
	world.state.plots.new_plot_02={"stage":"empty","watered_at":0}
	await physics_frame
	world.execute_action(plot)
	check(world.state.plots.new_plot_02.stage=="seeded","Plot did not accept sowing")
	world.execute_action(plot)
	check(world.state.plots.new_plot_02.stage=="watered","Plot did not accept watering")
	world.state.plots.new_plot_02.watered_at=Time.get_unix_time_from_system()-13
	world._update_plots()
	check(world.state.plots.new_plot_02.stage=="ripe","Crop did not mature by elapsed local time")
	world.execute_action(plot)
	check(world.state.plots.new_plot_02.stage=="empty","Harvest did not reset the plot")
	# Out-of-range calls are refused rather than granting remote interactions.
	world.player.position=spawn
	world.execute_action(plot)
	check(world.state.plots.new_plot_02.stage=="empty","Out-of-range plot action was accepted")
	var bench: Node2D=_target(world,"new_sit_01")
	world.player.position=bench.call("action_world_point")
	await physics_frame
	world.execute_action(bench)
	check(world.player.resting,"Bench did not enter rest state")
	world._leave_activity()
	check(not world.player.resting and not _overlaps(world,world.player.position),"Bench exit is blocked")
	var fishing: Node2D=_target(world,"new_fish_02")
	world.player.position=fishing.call("action_world_point")
	await physics_frame
	world.execute_action(fishing)
	check(world.player.resting and world._fishing_line!=null,"Fishing slot did not create a cast")
	check(not _overlaps(world,world.player.position),"Fishing stand is inside water collision")
	world._leave_activity()
	check(not world.player.resting and world._fishing_line==null,"Fishing activity did not release its slot")
	world.set_night(true)
	world.set_rain(true)
	world._toggle_language()
	check(world.english and world._title.text.contains("COUNTRYSIDE"),"English HUD did not update")
	world.toggle_map()
	check(world._map_overlay.visible and world.player.blocked,"Detailed map did not block movement")
	world.toggle_map()
	check(not world.player.blocked,"Detailed map did not release movement")
	print("Village routes checked: ",route_checks," interactions, 2 portals, 3 checkpoints")
	world.free()
	if failures.is_empty():
		print("PASS new village: reachable POIs, bridge/water physics, doors, crops, seating, fishing, weather and EN/VI UI")
	quit(0 if failures.is_empty() else 1)


func _target(world: Node2D, id: String) -> Node2D:
	for target in world.props:
		if str(target.object_id)==id:
			return target
	return null


func _overlaps(world: Node2D, point: Vector2) -> bool:
	var query:=PhysicsShapeQueryParameters2D.new()
	var shape:=CapsuleShape2D.new()
	shape.radius=12
	shape.height=28
	query.shape=shape
	query.transform=Transform2D(0,point+Vector2(0,-12))
	query.collision_mask=1
	return not world.get_world_2d().direct_space_state.intersect_shape(query).is_empty()


func _physical_route_clear(world: Node2D, route: PackedVector2Array) -> bool:
	for i in range(route.size()-1):
		var length:=route[i].distance_to(route[i+1])
		var steps:=maxi(1,ceili(length/12))
		for step in range(steps+1):
			if _overlaps(world,route[i].lerp(route[i+1],float(step)/steps)):
				return false
	return true
