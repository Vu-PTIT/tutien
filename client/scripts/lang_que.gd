extends "res://scripts/world_map_blockout_preview.gd"

# Reuses only the terrain coordinate/spline contract of the eight-map blockout.
# This scene owns art, actors, physics, navigation, slots, local state and UI.
const LAYOUT_PATH := "res://data/world/lang_que_layout.json"
const VILLAGE_SURFACE := preload("res://shaders/lang_que_surface.gdshader")
const VILLAGE_PROP := preload("res://scripts/lang_que_prop.gd")
const VILLAGE_PLAYER := preload("res://scripts/lang_que_player.gd")
const VILLAGE_NPC := preload("res://scripts/lang_que_npc.gd")
const VILLAGE_MINIMAP := preload("res://scripts/lang_que_minimap.gd")
const DETAIL_CHUNK := preload("res://scripts/lang_que_detail_chunk.gd")
const SAVE_PATH := "user://lang_que_local_v1.json"

var layout: Dictionary = {}
var player: CharacterBody2D
var props: Array[Node2D] = []
var npcs: Array[CharacterBody2D] = []
var plots: Dictionary = {}
var water_polygons: Array[PackedVector2Array] = []
var blocking_polygons: Array[PackedVector2Array] = []
var navigation := AStarGrid2D.new()
var npc_frames: SpriteFrames
var state: Dictionary = {"version": 1, "map_id": "m_lang_que", "doors": {}, "plots": {}, "pump_on": false}
var save_enabled := true
var english := false
var night := false
var rainy := false
var _sorted: Node2D
var _physics_root: Node2D
var _hud: CanvasLayer
var _map_overlay: PanelContainer
var _dialog: PanelContainer
var _title: Label
var _district: Label
var _toast: Label
var _action_button: Button
var _mini: Control
var _large_mini: Control
var _touch: Control
var _nearest: Node2D
var _rest_target: Node2D
var _rest_leave := Vector2.ZERO
var _modulate: CanvasModulate
var _fishing_line: Line2D
var _bobber: Sprite2D
var _ui_labels: Array = []
var _source_cache: Dictionary = {}
var _tick_accumulator := 0.0
var _toast_until := 0
var _rain_material: ShaderMaterial
var _touch_held: Dictionary = {}


func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	layout = JSON.parse_string(FileAccess.get_file_as_string(LAYOUT_PATH))
	_active_data = layout.terrain
	_floor_data = _active_data
	_active_map_id = "m_lang_que"
	_world_size = _vector(layout.size_px)
	_links = JSON.parse_string(FileAccess.get_file_as_string(LINKS_PATH))
	_map_root = Node2D.new()
	_map_root.name = "VillageWorld"
	add_child(_map_root)
	_physics_root = Node2D.new()
	_physics_root.name = "DATA_NavigationCollision"
	_map_root.add_child(_physics_root)
	_load_local_state()
	_build_layers()
	_build_yards_and_paddies()
	_build_bridges()
	_build_actors()
	_build_plot_layer()
	_build_bounds()
	_build_navigation()
	for npc in npcs:
		npc.call("set_schedule", false)
	_build_batched_details()
	_build_environment()
	_build_village_hud()
	_update_nearest()


func local_text(vi: String, en: String) -> String:
	return en if english else vi


func _surface_material(palette: Dictionary, surface: String, seed: float) -> ShaderMaterial:
	var colors: Array = palette.get(surface, palette.get("earth", ["#a98c61", "#c8ac7a", "#776347"]))
	var kind := int(STYLE_IDS.get(surface, 2))
	if surface == "grass":
		colors = ["#78975e", "#9cb573", "#587848"]
	elif surface == "paving":
		colors = ["#c0a07d", "#d4b78e", "#8e775e"]
		kind = 3
	elif surface == "soil":
		colors = ["#886441", "#a47b4f", "#5d4936"]
		kind = 12
	elif surface == "wet_soil":
		colors = ["#674c38", "#836044", "#493b30"]
		kind = 12
	elif surface == "timber":
		colors = ["#a58356", "#c5a16c", "#65563f"]
		kind = 11
	var material := ShaderMaterial.new()
	material.shader = VILLAGE_SURFACE
	material.set_shader_parameter("base_color", _html_color(str(colors[0])))
	material.set_shader_parameter("light_color", _html_color(str(colors[1])))
	material.set_shader_parameter("dark_color", _html_color(str(colors[2])))
	material.set_shader_parameter("surface_kind", kind)
	material.set_shader_parameter("pattern_seed", seed)
	var entry: Dictionary = {}
	if surface == "grass":
		entry = {"path": "res://assets/tileset/Art/Ground Tileset/Tileset_Ground.png", "region": Vector4(84, 54, 20, 20), "blend": .06}
	elif surface in ["road", "earth", "packed_earth", "shore"]:
		entry = {"path": "res://assets/tileset/Art/Ground Tileset/Tileset_Road.png", "region": Vector4(24, 16, 24, 24), "blend": .20}
	elif surface == "water":
		entry = {"path": "res://assets/tileset/Art/Water and Sand/Tileset_Water.png", "region": Vector4(10, 106, 24, 24), "blend": .12}
	if not entry.is_empty():
		var path := str(entry.path)
		if not _source_cache.has(path):
			_source_cache[path] = load(path)
		var texture: Texture2D = _source_cache[path]
		material.set_shader_parameter("source_art", texture)
		material.set_shader_parameter("source_region", entry.region)
		material.set_shader_parameter("source_size", texture.get_size())
		material.set_shader_parameter("art_blend", entry.blend)
	return material


func _polygon(parent: Node2D, id: String, outline: PackedVector2Array, surface: String) -> Polygon2D:
	var node := Polygon2D.new()
	node.name = id
	node.polygon = outline
	node.material = _surface_material(_active_data.palette, surface, _seed_for(id))
	parent.add_child(node)
	return node


func _cut_walkways(outline: PackedVector2Array, cuts: Array[PackedVector2Array]) -> Array[PackedVector2Array]:
	var pieces: Array[PackedVector2Array] = [outline]
	for cut in cuts:
		var remaining: Array[PackedVector2Array] = []
		for piece in pieces:
			for result in Geometry2D.clip_polygons(piece, cut):
				if not Geometry2D.is_polygon_clockwise(result):
					remaining.append(result)
		pieces = remaining
	return pieces


func _bridge_cutouts() -> Array[PackedVector2Array]:
	var cuts: Array[PackedVector2Array] = []
	for bridge in layout.bridges:
		var center := _vector(bridge.center_cell) * CELL_SIZE
		var dims := _vector(bridge.size_cells) * CELL_SIZE
		cuts.append(PackedVector2Array([center - dims * .5, center + Vector2(dims.x, -dims.y) * .5,
			center + dims * .5, center + Vector2(-dims.x, dims.y) * .5]))
	return cuts


func _build_water_collision() -> void:
	water_polygons.clear()
	for water in _floor_data.waters:
		var outline := _water_polygon(water)
		water_polygons.append(outline)
		for piece in _cut_walkways(outline, _bridge_cutouts()):
			_block_polygon(str(water.id), piece)


func _block_polygon(id: String, outline: PackedVector2Array) -> void:
	var indices := Geometry2D.triangulate_polygon(outline)
	if indices.is_empty():
		push_error("Cannot triangulate village blocker: " + id)
		return
	blocking_polygons.append(outline)
	var body := StaticBody2D.new()
	body.name = _safe_name(id)
	body.collision_layer = 1
	body.collision_mask = 0
	_physics_root.add_child(body)
	for i in range(0, indices.size(), 3):
		var triangle := PackedVector2Array([outline[indices[i]], outline[indices[i+1]], outline[indices[i+2]]])
		var shape := ConvexPolygonShape2D.new()
		shape.points = triangle
		var collider := CollisionShape2D.new()
		collider.shape = shape
		body.add_child(collider)


func _build_yards_and_paddies() -> void:
	var layer := Node2D.new()
	layer.name = "L00_AuthoredFieldsYards"
	layer.z_index = -9
	_map_root.add_child(layer)
	for yard in layout.yards:
		var center := _vector(yard.center_cell) * CELL_SIZE
		var radius := _vector(yard.radii_cells) * CELL_SIZE
		_polygon(layer, str(yard.id) + "_fringe", _ellipse_polygon(center, radius + Vector2(20, 16), _seed_for(str(yard.id))), "earth")
		_polygon(layer, str(yard.id), _ellipse_polygon(center, radius, _seed_for(str(yard.id))), str(yard.surface))
	var roads: Array[PackedVector2Array] = []
	var fields := Node2D.new()
	fields.name="L00_RiceFields"
	fields.z_index=-20
	_map_root.add_child(fields)
	for road in _floor_data.roads:
		roads.append(_ribbon(_smooth_points(road.points, bool(road.get("closed", false))), float(road.width_cells) * 16 + 26))
	for paddy in layout.paddies:
		var field := _cell_polygon(paddy.points)
		_polygon(fields, str(paddy.id) + "_bund", field, "earth")
		for piece in _cut_walkways(field, roads):
			_polygon(fields, str(paddy.id), piece, "field")
			_block_polygon(str(paddy.id), piece)


func _rect_blocker(id: String, center: Vector2, dims: Vector2) -> void:
	_block_polygon(id, PackedVector2Array([center-dims*.5, center+Vector2(dims.x,-dims.y)*.5,
		center+dims*.5, center+Vector2(-dims.x,dims.y)*.5]))


func _build_bridges() -> void:
	var layer := Node2D.new()
	layer.name = "L05_BridgesAndDeck"
	layer.z_index = -5
	_map_root.add_child(layer)
	for bridge in layout.bridges:
		var center := _vector(bridge.center_cell) * CELL_SIZE
		var dims := _vector(bridge.size_cells) * CELL_SIZE
		var outline := PackedVector2Array([center-dims*.5, center+Vector2(dims.x,-dims.y)*.5,
			center+dims*.5, center+Vector2(-dims.x,dims.y)*.5])
		_polygon(layer, str(bridge.id), outline, "concrete" if bridge.kind == "concrete" else "timber")
		for side in [-1, 1]:
			if bridge.get("rails", "both") == "south" and side == -1:
				continue
			var y := center.y + float(side) * (dims.y * .5 - 3)
			var line := Line2D.new()
			line.name = "SafetyRail"
			line.points = PackedVector2Array([Vector2(center.x-dims.x*.5,y),Vector2(center.x+dims.x*.5,y)])
			line.width = 6
			line.default_color = Color("827860") if bridge.kind == "concrete" else Color("695239")
			layer.add_child(line)
			_rect_blocker(str(bridge.id)+"_rail", Vector2(center.x,y), Vector2(dims.x,6))


func _build_actors() -> void:
	_sorted = Node2D.new()
	_sorted.name = "L10_YSortWorld"
	_sorted.y_sort_enabled = true
	_map_root.add_child(_sorted)
	for object in layout.objects:
		var prop := Node2D.new()
		prop.set_script(VILLAGE_PROP)
		prop.call("configure", object, self)
		_sorted.add_child(prop)
		if str(object.action) == "door":
			prop.call("set_open", bool(state.doors.get(str(object.id), false)))
		elif str(object.action) == "pump" and bool(state.pump_on):
			prop.visual.modulate=Color("c2eed2")
		props.append(prop)
	player = CharacterBody2D.new()
	player.name = "Player"
	player.set_script(VILLAGE_PLAYER)
	player.position = _vector(_active_data.spawn_cell) * CELL_SIZE
	if get_tree().has_meta("lq_return_cell"):
		player.position = _vector(get_tree().get_meta("lq_return_cell")) * CELL_SIZE
		get_tree().remove_meta("lq_return_cell")
	_sorted.add_child(player)
	_camera = player.camera
	_camera.limit_right = roundi(_world_size.x)
	_camera.limit_bottom = roundi(_world_size.y)
	_camera.reset_smoothing()
	npc_frames = _make_npc_frames()
	for data in layout.npcs:
		var npc := CharacterBody2D.new()
		npc.set_script(VILLAGE_NPC)
		npc.call("configure", data, self)
		_sorted.add_child(npc)
		npcs.append(npc)
		props.append(npc)


func _make_npc_frames() -> SpriteFrames:
	var frames := SpriteFrames.new()
	frames.remove_animation("default")
	var texture := load(str(layout.npc_texture)) as Texture2D
	for row in range(4):
		var facing: String = ["down", "left", "right", "up"][row]
		for movement in ["idle", "walk"]:
			var anim: String = movement + "_" + facing
			frames.add_animation(anim)
			frames.set_animation_speed(anim, 7)
			for column in range(1 if movement == "idle" else 4):
				var atlas := AtlasTexture.new()
				atlas.atlas = texture
				atlas.region = Rect2(column*48,row*48,48,48)
				frames.add_frame(anim, atlas)
	return frames


func _build_plot_layer() -> void:
	var ground := Node2D.new()
	ground.name = "L04_DynamicGround"
	ground.z_index = -4
	_map_root.add_child(ground)
	for plot in layout.plots:
		var center := _vector(plot.center_cell) * CELL_SIZE
		var dims := _vector(plot.size_cells) * CELL_SIZE
		var dirt := _polygon(ground, str(plot.id), PackedVector2Array([center-dims*.5,center+Vector2(dims.x,-dims.y)*.5,
			center+dims*.5,center+Vector2(-dims.x,dims.y)*.5]), "soil")
		var target := Node2D.new()
		target.set_script(VILLAGE_PROP)
		var info := {"id":plot.id,"name":"Luống vườn","name_en":"Garden plot","cell":plot.center_cell,
			"texture":layout.assets.seedling,"kind":"plot","action":"plot","art_scale":2,"solid_px":[],
			"interaction_offset_px":(_vector(plot.access_cell)-_vector(plot.center_cell))*CELL_SIZE,"radius_px":105}
		# JSON-style vector data keeps this prop compatible with ordinary placements.
		info.interaction_offset_px = [info.interaction_offset_px.x, info.interaction_offset_px.y]
		target.call("configure",info,self)
		_sorted.add_child(target)
		props.append(target)
		if not state.plots.has(str(plot.id)):
			state.plots[str(plot.id)] = {"stage":plot.initial_stage,"watered_at":0.0}
		plots[str(plot.id)] = {"target":target,"dirt":dirt,"plot":plot}
		_refresh_plot(str(plot.id))


func _refresh_plot(id: String) -> void:
	var data: Dictionary = plots[id]
	var stage := str(state.plots[id].stage)
	var target: Node2D = data.target
	var sprite: Sprite2D = target.visual
	sprite.visible = stage != "empty"
	sprite.texture = load(str(layout.assets.vegetable if stage == "ripe" else layout.assets.seedling)) as Texture2D
	sprite.position.y = -sprite.texture.get_height()
	var material: ShaderMaterial = data.dirt.material
	material.set_shader_parameter("base_color", Color("674c38") if stage == "watered" else Color("886441"))


func _build_bounds() -> void:
	for side in range(4):
		var center := Vector2.ZERO
		var dims := Vector2.ZERO
		match side:
			0: center=Vector2(-12,_world_size.y*.5); dims=Vector2(24,_world_size.y+48)
			1: center=Vector2(_world_size.x+12,_world_size.y*.5); dims=Vector2(24,_world_size.y+48)
			2: center=Vector2(_world_size.x*.5,-12); dims=Vector2(_world_size.x+48,24)
			3: center=Vector2(_world_size.x*.5,_world_size.y+12); dims=Vector2(_world_size.x+48,24)
		_rect_blocker("world_border",center,dims)


func _build_navigation() -> void:
	navigation.region = Rect2i(0,0,256,192)
	navigation.cell_size = Vector2(32,32)
	navigation.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_ONLY_IF_NO_OBSTACLES
	navigation.update()
	for polygon in blocking_polygons:
		for expanded in Geometry2D.offset_polygon(polygon, 18):
			_mark_navigation_polygon(expanded)
	for object in layout.objects:
		var raw: Array = object.get("solid_px", [])
		if raw.size() != 4:
			continue
		var center := _vector(object.cell)*CELL_SIZE + Vector2(float(raw[2]),float(raw[3]))
		var dims := Vector2(float(raw[0]),float(raw[1])) + Vector2(36,36)
		_mark_navigation_polygon(PackedVector2Array([center-dims*.5,center+Vector2(dims.x,-dims.y)*.5,
			center+dims*.5,center+Vector2(-dims.x,dims.y)*.5]))


func _mark_navigation_polygon(polygon: PackedVector2Array) -> void:
	if polygon.is_empty():
		return
	var bounds := Rect2(polygon[0],Vector2.ZERO)
	for point in polygon:
		bounds = bounds.expand(point)
	var left := maxi(0,floori(bounds.position.x/32))
	var top := maxi(0,floori(bounds.position.y/32))
	var right := mini(255,ceili(bounds.end.x/32))
	var bottom := mini(191,ceili(bounds.end.y/32))
	for y in range(top,bottom+1):
		for x in range(left,right+1):
			if Geometry2D.is_point_in_polygon(Vector2(x,y)*32,polygon):
				navigation.set_point_solid(Vector2i(x,y))


func _nav_cell(point: Vector2) -> Vector2i:
	var cell := Vector2i(roundi(point.x/32),roundi(point.y/32))
	cell.x = clampi(cell.x,1,254)
	cell.y = clampi(cell.y,1,190)
	return cell


func route_between(origin: Vector2, destination: Vector2) -> PackedVector2Array:
	var start := _nav_cell(origin)
	var end := _nav_cell(destination)
	if navigation.is_point_solid(start) or navigation.is_point_solid(end):
		return PackedVector2Array()
	return navigation.get_point_path(start,end)


func _on_road(point: Vector2, margin: float) -> bool:
	for road in _floor_data.roads:
		var raw: Array = road.points
		for i in range(raw.size()-1):
			var nearest := Geometry2D.get_closest_point_to_segment(point,_vector(raw[i])*32,_vector(raw[i+1])*32)
			if nearest.distance_to(point) < float(road.width_cells)*16+margin:
				return true
	return false


func _ground_reserved(point: Vector2) -> bool:
	if _on_road(point,32):
		return true
	for polygon in water_polygons:
		if Geometry2D.is_point_in_polygon(point,polygon):
			return true
	for yard in layout.yards:
		var delta := (point-_vector(yard.center_cell)*32)/(_vector(yard.radii_cells)*32+Vector2(30,30))
		if delta.length_squared() < 1:
			return true
	return point.x > 58*32 and point.x < 86*32 and point.y > 152*32 and point.y < 170*32


func _stamp(chunks: Dictionary, point: Vector2, texture: Texture2D, tint: Color=Color.WHITE) -> void:
	var bucket := Vector2i(floori(point.x/512),floori(point.y/512))
	if not chunks.has(bucket):
		chunks[bucket] = []
	chunks[bucket].append({"texture":texture,"point":(point-Vector2(bucket)*512)*.5,"tint":tint})


func _build_batched_details() -> void:
	var layer := Node2D.new()
	layer.name = "L03_BatchedRiceGrass"
	layer.z_index = -6
	_map_root.add_child(layer)
	var chunks: Dictionary = {}
	var rice := load(str(layout.assets.rice)) as Texture2D
	var atlas := AtlasTexture.new()
	atlas.atlas = load("res://assets/tileset/Art/Ground Tileset/Tileset_Ground.png") as Texture2D
	# Use a transparent tuft, never an opaque terrain-fill fragment as a decal.
	atlas.region = Rect2(2,14,14,18)
	var rng := RandomNumberGenerator.new()
	rng.seed = 12102026
	for paddy in layout.paddies:
		var field := _cell_polygon(paddy.points)
		var bounds := Rect2(field[0],Vector2.ZERO)
		for point in field:
			bounds=bounds.expand(point)
		for y in range(roundi(bounds.position.y)+20,roundi(bounds.end.y)-10,24):
			for x in range(roundi(bounds.position.x)+20,roundi(bounds.end.x)-10,28):
				var point := Vector2(x+rng.randi_range(-5,5),y+rng.randi_range(-4,4))
				point=(point*.5).round()*2
				if Geometry2D.is_point_in_polygon(point,field) and not _on_road(point,25):
					_stamp(chunks,point,rice,Color(1.0,0.94+rng.randf()*.06,0.86+rng.randf()*.12))
	for cy in range(12):
		for cx in range(16):
			for _i in range(32):
				var point := Vector2(cx*512+rng.randi_range(0,255)*2,cy*512+rng.randi_range(0,255)*2)
				if not _ground_reserved(point):
					_stamp(chunks,point,atlas,Color(0.78,0.86,0.65,0.54))
	for bucket in chunks:
		var chunk := Node2D.new()
		chunk.name="Chunk_%d_%d"%[bucket.x,bucket.y]
		chunk.position=Vector2(bucket)*512
		chunk.scale=Vector2(2,2)
		chunk.set_script(DETAIL_CHUNK)
		chunk.stamps=chunks[bucket]
		layer.add_child(chunk)


func _build_environment() -> void:
	var scenic := Node2D.new()
	scenic.name="L00_ScenicContinuation"
	scenic.z_index=-110
	_map_root.add_child(scenic)
	_polygon(scenic,"Backdrop",PackedVector2Array([Vector2(-1600,-1600),Vector2(_world_size.x+1600,-1600),
		_world_size+Vector2(1600,1600),Vector2(-1600,_world_size.y+1600)]),"grass")
	var cables := Node2D.new()
	cables.name="L11_ForegroundCables"
	cables.z_index=2
	_map_root.add_child(cables)
	var poles: Array = layout.objects.filter(func(o: Dictionary)->bool: return str(o.kind)=="pole")
	for pair in [[0,1],[1,2],[2,3],[3,4],[5,6],[6,7],[8,9],[9,10],[0,11]]:
		var a := _vector(poles[pair[0]].cell)*32+Vector2(0,-270)
		var b := _vector(poles[pair[1]].cell)*32+Vector2(0,-270)
		for wire in range(2):
			var line := Line2D.new()
			for i in range(17):
				var t := float(i)/16
				line.add_point((a.lerp(b,t)+Vector2(0,sin(t*PI)*28+wire*7)).round())
			line.width=2
			line.default_color=Color(0.18,0.23,0.19,0.43)
			cables.add_child(line)
	_modulate=CanvasModulate.new()
	_modulate.name="L21_DayNight"
	_map_root.add_child(_modulate)
	var gradient:=Gradient.new()
	gradient.colors=PackedColorArray([Color(1,1,1,0.92),Color(1,1,1,0)])
	var glow:=GradientTexture2D.new()
	glow.gradient=gradient
	glow.width=128
	glow.height=128
	glow.fill=GradientTexture2D.FILL_RADIAL
	glow.fill_from=Vector2(.5,.5)
	glow.fill_to=Vector2(1,.5)
	for pole in poles:
		var light:=PointLight2D.new()
		light.position=_vector(pole.cell)*32+Vector2(31,-24)
		light.texture=glow
		light.texture_scale=3
		light.energy=.58
		light.color=Color("ffd393")
		light.visible=false
		light.add_to_group("lang_que_lights")
		_map_root.add_child(light)
	var weather:=CanvasLayer.new()
	weather.name="L20_Weather"
	weather.layer=2
	add_child(weather)
	var rain:=ColorRect.new()
	rain.name="Rain"
	rain.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	rain.mouse_filter=Control.MOUSE_FILTER_IGNORE
	_rain_material=ShaderMaterial.new()
	_rain_material.shader=load("res://shaders/lang_que_weather.gdshader")
	rain.material=_rain_material
	weather.add_child(rain)


func set_night(value: bool) -> void:
	night=value
	_modulate.color=Color("718caa") if night else Color.WHITE
	for light in get_tree().get_nodes_in_group("lang_que_lights"):
		light.visible=night
	for npc in npcs:
		npc.call("set_schedule",night)
	_title.text=local_text("LÀNG QUÊ","COUNTRYSIDE")+("  ·  18:30" if night else "  ·  09:20")


func set_rain(value: bool) -> void:
	rainy=value
	_rain_material.set_shader_parameter("raining",rainy)


func _ui_label(parent: Node, vi: String, en: String, font_size: int=16) -> Label:
	var label:=Label.new()
	label.text=local_text(vi,en)
	label.add_theme_font_override("font",FONT)
	label.add_theme_font_size_override("font_size",font_size)
	label.add_theme_color_override("font_color",Color("f4e6c7"))
	parent.add_child(label)
	_ui_labels.append([label,vi,en])
	return label


func _ui_button(parent: Node, vi: String, en: String, callback: Callable) -> Button:
	var button:=Button.new()
	button.text=local_text(vi,en)
	button.custom_minimum_size=Vector2(74,38)
	button.add_theme_font_override("font",FONT)
	button.add_theme_font_size_override("font_size",15)
	button.add_theme_stylebox_override("normal",_panel_style(Color("344d3d")))
	button.add_theme_stylebox_override("hover",_panel_style(Color("526747")))
	button.add_theme_stylebox_override("pressed",_panel_style(Color("6a7851")))
	button.add_theme_color_override("font_color",Color("ffedc3"))
	button.pressed.connect(callback)
	parent.add_child(button)
	_ui_labels.append([button,vi,en])
	return button


func _build_village_hud() -> void:
	_hud=CanvasLayer.new()
	_hud.name="VillageHUD"
	_hud.layer=10
	add_child(_hud)
	var header:=PanelContainer.new()
	header.position=Vector2(22,20)
	header.custom_minimum_size=Vector2(338,90)
	header.add_theme_stylebox_override("panel",_panel_style(Color(0.12,0.19,0.14,0.94)))
	_hud.add_child(header)
	var stack:=VBoxContainer.new()
	header.add_child(stack)
	_title=_ui_label(stack,"LÀNG QUÊ  ·  09:20","COUNTRYSIDE  ·  09:20",22)
	_district=_ui_label(stack,"Sân đình · Chợ quê  /  Vùng an toàn","Village square & market  /  Safe zone",13)
	var toolbar:=HBoxContainer.new()
	toolbar.position=Vector2(22,119)
	toolbar.add_theme_constant_override("separation",8)
	_hud.add_child(toolbar)
	_ui_button(toolbar,"Bản đồ [M]","Map [M]",toggle_map)
	_ui_button(toolbar,"Ngày / Đêm [T]","Day / Night [T]",func()->void:set_night(not night))
	_ui_button(toolbar,"Mưa [R]","Rain [R]",func()->void:set_rain(not rainy))
	_ui_button(toolbar,"EN / VI","EN / VI",_toggle_language)
	_ui_button(toolbar,"Cảm ứng","Touch",func()->void:_touch.visible=not _touch.visible)
	var mini_panel:=PanelContainer.new()
	mini_panel.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	mini_panel.offset_left=-280
	mini_panel.offset_right=-22
	mini_panel.offset_top=20
	mini_panel.add_theme_stylebox_override("panel",_panel_style(Color(0.12,0.19,0.14,0.95)))
	_hud.add_child(mini_panel)
	var mini_stack:=VBoxContainer.new()
	mini_panel.add_child(mini_stack)
	_ui_label(mini_stack,"BẢN ĐỒ LÀNG","VILLAGE MAP",13)
	_mini=Control.new()
	_mini.set_script(VILLAGE_MINIMAP)
	_mini.world=self
	_mini.custom_minimum_size=Vector2(236,177)
	mini_stack.add_child(_mini)
	_mini.selected.connect(toggle_map)
	_ui_label(mini_stack,"Chạm để mở bản đồ · M","Tap to expand · M",11)
	var footer:=HBoxContainer.new()
	footer.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
	footer.offset_left=-260
	footer.offset_right=-22
	footer.offset_top=-82
	footer.offset_bottom=-24
	_hud.add_child(footer)
	_action_button=_ui_button(footer,"F · Tương tác","F · Interact",interact_nearest)
	_action_button.custom_minimum_size=Vector2(238,58)
	var hint:=_ui_label(_hud,"WASD / ↑↓←→: đi  ·  Shift: chạy  ·  Click: tới điểm  ·  Cuộn: đổi góc nhìn","WASD / arrows: move  ·  Shift: run  ·  Click: walk to point  ·  Wheel: zoom",13)
	hint.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT)
	hint.offset_left=22
	hint.offset_top=-34
	hint.offset_right=1000
	hint.offset_bottom=-10
	_toast=_ui_label(_hud,"","",16)
	_toast.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT)
	_toast.offset_left=22
	_toast.offset_top=-75
	_toast.offset_right=950
	_toast.offset_bottom=-42
	_toast.add_theme_color_override("font_outline_color",Color("293b2d"))
	_toast.add_theme_constant_override("outline_size",5)
	_build_touch_pad()
	_build_map_overlay()


func _build_touch_pad() -> void:
	_touch=Control.new()
	_touch.name="TouchPad"
	_touch.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT)
	_touch.offset_left=24
	_touch.offset_right=234
	_touch.offset_top=-234
	_touch.offset_bottom=-59
	_touch.visible=DisplayServer.is_touchscreen_available()
	_hud.add_child(_touch)
	for data in [["↑",Vector2(0,-1),Vector2(60,0)],["←",Vector2(-1,0),Vector2(0,60)],
		["↓",Vector2(0,1),Vector2(60,120)],["→",Vector2(1,0),Vector2(120,60)]]:
		var button:=_ui_button(_touch,str(data[0]),str(data[0]),func()->void:pass)
		button.custom_minimum_size=Vector2(58,54)
		button.position=data[2]
		button.button_down.connect(_touch_press.bind(str(data[0]),data[1],true))
		button.button_up.connect(_touch_press.bind(str(data[0]),data[1],false))


func _touch_press(id: String, direction: Vector2, held: bool) -> void:
	_touch_held[id]=direction if held else Vector2.ZERO
	var combined:=Vector2.ZERO
	for value in _touch_held.values():
		combined+=value
	player.touch_direction=combined.normalized()


func _build_map_overlay() -> void:
	_map_overlay=PanelContainer.new()
	_map_overlay.name="DetailedVillageMap"
	_map_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_map_overlay.offset_left=60
	_map_overlay.offset_right=-60
	_map_overlay.offset_top=30
	_map_overlay.offset_bottom=-30
	_map_overlay.add_theme_stylebox_override("panel",_panel_style(Color("243a2d")))
	_hud.add_child(_map_overlay)
	var stack:=VBoxContainer.new()
	_map_overlay.add_child(stack)
	var row:=HBoxContainer.new()
	stack.add_child(row)
	var label:=_ui_label(row,"LÀNG QUÊ · 8 KHU SINH HOẠT","COUNTRYSIDE · 8 DISTRICTS",23)
	label.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	_ui_button(row,"Đóng [M]","Close [M]",toggle_map)
	_large_mini=Control.new()
	_large_mini.set_script(VILLAGE_MINIMAP)
	_large_mini.world=self
	_large_mini.detailed=true
	_large_mini.size_flags_vertical=Control.SIZE_EXPAND_FILL
	_large_mini.custom_minimum_size=Vector2(500,400)
	stack.add_child(_large_mini)
	_ui_label(stack,"Bắc: Vành Đai Tây  ·  Đông: Thăng Long  ·  Vàng: bạn  ·  Nâu: nhà  ·  Xanh: nước","North: West Frontier  ·  East: Thang Long  ·  Gold: you  ·  Brown: houses  ·  Blue: water",13)
	_map_overlay.visible=false


func toggle_map() -> void:
	_map_overlay.visible=not _map_overlay.visible
	player.blocked=_map_overlay.visible or is_instance_valid(_dialog)
	if _map_overlay.visible:
		player.move_path.clear()


func _toggle_language() -> void:
	english=not english
	for item in _ui_labels:
		if is_instance_valid(item[0]):
			item[0].text=local_text(str(item[1]),str(item[2]))
	_title.text=local_text("LÀNG QUÊ","COUNTRYSIDE")+("  ·  18:30" if night else "  ·  09:20")
	for prop in props:
		var label:=prop.get_node_or_null("NameTag") as Label
		if label==null:
			label=prop.get_node_or_null("Wayfinding") as Label
		if label!=null:
			label.text=prop.call("display_name")
	_update_nearest()


func _process(delta: float) -> void:
	if player==null or not is_instance_valid(_action_button):
		return
	_tick_accumulator+=delta
	if _tick_accumulator>.2:
		_tick_accumulator=0
		_update_nearest()
		_update_plots()
		var cell:=player.global_position/32
		for district in layout.districts:
			var rect: Array=district.rect_cells
			if Rect2(float(rect[0]),float(rect[1]),float(rect[2]),float(rect[3])).has_point(cell):
				_district.text=local_text(str(district.name),str(district.name_en))+local_text("  /  Vùng an toàn","  /  Safe zone")
		if Time.get_ticks_msec()>_toast_until:
			_toast.text=""
	if _fishing_line!=null:
		_fishing_line.set_point_position(0,player.global_position+Vector2(12,-44))
		_bobber.position.y=_fishing_line.points[1].y+sin(float(Time.get_ticks_msec())*.003)*2


func _update_nearest() -> void:
	_nearest=null
	var distance:=INF
	for prop in props:
		if str(prop.action).is_empty():
			continue
		var point: Vector2=prop.call("action_world_point")
		var d:=player.global_position.distance_to(point)
		if d<float(prop.interaction_radius) and d<distance and has_clear_access(player.global_position,point):
			distance=d
			_nearest=prop
	if player.resting:
		_action_button.text=local_text("F · Rời chỗ nghỉ","F · Leave activity")
	elif _nearest!=null:
		_action_button.text="F · "+str(_nearest.call("display_name"))
	else:
		_action_button.text=local_text("F · Tương tác","F · Interact")


func has_clear_access(origin: Vector2, point: Vector2) -> bool:
	var query:=PhysicsRayQueryParameters2D.create(origin+Vector2(0,-8),point+Vector2(0,-8),1)
	return get_world_2d().direct_space_state.intersect_ray(query).is_empty()


func _unhandled_input(event: InputEvent) -> void:
	if player==null:
		return
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_F: interact_nearest()
			KEY_M: toggle_map()
			KEY_T: set_night(not night)
			KEY_R: set_rain(not rainy)
			KEY_ESCAPE:
				if is_instance_valid(_dialog):
					_close_dialog()
				elif _map_overlay.visible:
					toggle_map()
				elif player.resting:
					_leave_activity()
	if event is InputEventMouseButton and event.button_index==MOUSE_BUTTON_LEFT and event.pressed and not player.blocked and not player.resting:
		var route:=route_between(player.global_position,get_global_mouse_position())
		if not route.is_empty():
			player.move_path=route
		else:
			_notify(local_text("Điểm này đang bị chặn. Hãy chọn bờ hoặc lối đi.","That spot is blocked. Choose a bank or path."))


func _notify(message: String) -> void:
	_toast.text=message
	_toast_until=Time.get_ticks_msec()+6000


func interact_nearest() -> void:
	if player.blocked:
		return
	if player.resting:
		_leave_activity()
		return
	_update_nearest()
	if _nearest==null:
		_notify(local_text("Đến gần người, quầy hàng hoặc biển để tương tác.","Approach a person, stall or sign to interact."))
		return
	execute_action(_nearest)


func execute_action(target: Node2D) -> void:
	var point: Vector2=target.call("action_world_point")
	if player.global_position.distance_to(point)>float(target.interaction_radius) or not has_clear_access(player.global_position,point):
		_notify(local_text("Hãy đến gần lối tiếp cận.","Move closer to the access point."))
		return
	var title: String=target.call("display_name")
	match str(target.action):
		"door":
			target.call("set_open",not bool(target.opened))
			state.doors[str(target.object_id)]=target.opened
			_notify(title+local_text(" · Cửa đã mở" if target.opened else " · Cửa đã đóng"," · Door opened" if target.opened else " · Door closed"))
		"talk":
			_show_dialog(title+" · "+local_text(str(target.info.role),str(target.info.role_en)),local_text(str(target.info.dialogue),str(target.info.dialogue_en)))
		"hall":
			_show_dialog(title,local_text("Sân đình là điểm hẹn của làng. Đồng ruộng ở tây bắc, xóm mới ở đông bắc, nhà vườn ở phía tây và hồ câu ở phía nam.","The square is our meeting point. Rice fields lie northwest, the new hamlet northeast, garden homes west and the fishing lake south."))
		"notice":
			_show_dialog(title,local_text("Làng là vùng an toàn.\n↑ Đường đê đi Vành Đai Tây, nơi có dị thú.\n→ Cầu phố đi Thăng Long.\n↙ Nhà vườn và 12 luống.\n↓ Bến hồ, quán nước và ghế nghỉ.","The village is a safe zone.\n↑ Dyke road to the West Frontier: beware of beasts.\n→ Road bridge to Thang Long.\n↙ Garden home and 12 plots.\n↓ Fishing dock, tea cafe and resting seats."))
		"shop":
			_show_dialog(title,local_text("Chợ quê có hạt giống, rau và đồ dùng. Bác Minh đứng cạnh quầy phía bắc; ghé trò chuyện để biết đường tới vườn.","The village market sells seeds, vegetables and tools. Minh stands by the north stall and can show you the way to the garden."))
		"cafe":
			_show_dialog(title,local_text("Quán nước nhìn ra hồ câu. Ghế xanh ngoài hiên là chỗ nghỉ và gặp bạn bè.","The tea cafe overlooks the lake. Green seats outside are for resting and meeting friends."))
		"greenhouse":
			_show_dialog(title,local_text("Nhà kính của xóm mới dùng nước từ trạm bơm, bảo vệ cây khi trời mưa.","The new hamlet's greenhouse uses the irrigation pump and shelters plants from rain."))
		"pump":
			state.pump_on=not bool(state.pump_on)
			target.visual.modulate=Color("c2eed2") if state.pump_on else Color.WHITE
			_notify(local_text("Trạm bơm · Đang chạy" if state.pump_on else "Trạm bơm · Đã dừng","Pump · Running" if state.pump_on else "Pump · Stopped"))
		"well":
			_notify(local_text("Nước sẵn sàng. Tới luống đã gieo để tưới.","Water is ready. Visit a sown plot to water it."))
		"plot":
			_work_plot(str(target.object_id))
		"sit":
			_rest_target=target
			_rest_leave=target.global_position+_vector(target.info.get("leave_offset_px",[0,46]))
			player.call("rest_at",target.global_position+_vector(target.info.get("seat_offset_px",[0,-18])))
			target.call("set_seat_occupied",true)
			_notify(local_text("Đang nghỉ · F hoặc Esc để đứng dậy","Resting · F or Esc to stand up"))
		"fish":
			_start_fishing(target)
		"portal":
			_travel_to_neighbor(target)
	_save_local_state()


func _work_plot(id: String) -> void:
	var data: Dictionary=state.plots[id]
	match str(data.stage):
		"empty":
			data.stage="seeded"
			_notify(local_text("Đã gieo luống. Tương tác lần nữa để tưới.","Plot sown. Interact again to water it."))
		"seeded":
			data.stage="watered"
			data.watered_at=Time.get_unix_time_from_system()
			_notify(local_text("Đã tưới · Cây mẫu lớn sau 12 giây","Watered · The sample crop grows in 12 seconds"))
		"watered":
			_notify(local_text("Luống đã tưới, hãy chờ cây lớn.","This plot is watered. Give the crop time to grow."))
		"ripe":
			data.stage="empty"
			_notify(local_text("Đã thu cây mẫu · Luống sẵn sàng gieo lại","Sample crop harvested · The plot is ready to sow again"))
	_refresh_plot(id)


func _update_plots() -> void:
	for id in plots:
		var data: Dictionary=state.plots[id]
		if str(data.stage)=="watered" and Time.get_unix_time_from_system()-float(data.watered_at)>=12:
			data.stage="ripe"
			_refresh_plot(str(id))
			_save_local_state()


func _start_fishing(target: Node2D) -> void:
	_rest_target=target
	_rest_leave=target.call("action_world_point")
	player.call("rest_at",_vector(target.info.stand_cell)*32)
	_camera.offset=Vector2(0,64)
	_fishing_line=Line2D.new()
	_fishing_line.name="FishingLine"
	_fishing_line.points=PackedVector2Array([player.global_position+Vector2(12,-44),_vector(target.info.fishing_target_cell)*32])
	_fishing_line.width=2
	_fishing_line.default_color=Color("e9dfb4")
	_fishing_line.z_index=1
	_map_root.add_child(_fishing_line)
	_bobber=Sprite2D.new()
	# The existing decorative sign atlas supplies a red marker pixel cluster.
	var marker:=AtlasTexture.new()
	marker.atlas=load(str(layout.assets.motorbike)) as Texture2D
	marker.region=Rect2(8,16,4,4)
	_bobber.texture=marker
	_bobber.position=_fishing_line.points[1]
	_bobber.scale=Vector2(2,2)
	_bobber.z_index=2
	_map_root.add_child(_bobber)
	_notify(local_text("Đang thả câu · F hoặc Esc để rời bến","Fishing · F or Esc to leave the dock"))


func _leave_activity() -> void:
	if is_instance_valid(_rest_target) and str(_rest_target.kind)=="bench":
		_rest_target.call("set_seat_occupied",false)
	player.call("leave_rest",_rest_leave)
	_rest_target=null
	if _fishing_line!=null:
		_fishing_line.queue_free()
		_fishing_line=null
		_bobber.queue_free()
		_bobber=null
	_notify(local_text("Đã rời chỗ nghỉ","Activity ended"))


func _show_dialog(title: String, message: String) -> void:
	_close_dialog()
	_dialog=PanelContainer.new()
	_dialog.name="VillageDialogue"
	_dialog.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	_dialog.offset_left=-265
	_dialog.offset_right=265
	_dialog.offset_top=-115
	_dialog.offset_bottom=115
	_dialog.custom_minimum_size=Vector2(530,230)
	_dialog.add_theme_stylebox_override("panel",_panel_style(Color("2d4433")))
	_hud.add_child(_dialog)
	var stack:=VBoxContainer.new()
	stack.add_theme_constant_override("separation",14)
	_dialog.add_child(stack)
	_ui_label(stack,title,title,22)
	var body:=_ui_label(stack,message,message,17)
	body.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	body.custom_minimum_size=Vector2(508,120)
	_ui_button(stack,"Đóng [Esc]","Close [Esc]",_close_dialog)
	player.blocked=true
	player.move_path.clear()


func _close_dialog() -> void:
	if is_instance_valid(_dialog):
		_dialog.queue_free()
		_dialog=null
	if player!=null:
		player.blocked=is_instance_valid(_map_overlay) and _map_overlay.visible


func _travel_to_neighbor(target: Node2D) -> void:
	for link in _links.links:
		if str(link.id)!=str(target.info.link_id):
			continue
		var endpoint: Dictionary=link.a if str(link.a.map_id)=="m_lang_que" else link.b
		var other: Dictionary=link.b if str(link.a.map_id)=="m_lang_que" else link.a
		_save_local_state()
		get_tree().set_meta("lq_neighbor_preview",str(other.map_id))
		get_tree().set_meta("lq_return_cell",endpoint.entry_anchor_cell)
		get_tree().change_scene_to_file("res://scenes/world_map_blockout_preview.tscn")
		return


func _load_local_state() -> void:
	if not save_enabled or not FileAccess.file_exists(SAVE_PATH):
		return
	var parsed: Variant=JSON.parse_string(FileAccess.get_file_as_string(SAVE_PATH))
	if parsed is Dictionary and int(parsed.get("version",0))==1 and str(parsed.get("map_id",""))=="m_lang_que":
		if parsed.get("doors") is Dictionary and parsed.get("plots") is Dictionary:
			state=parsed


func _save_local_state() -> void:
	if not save_enabled:
		return
	var file:=FileAccess.open(SAVE_PATH,FileAccess.WRITE)
	if file!=null:
		file.store_string(JSON.stringify(state))


func _exit_tree() -> void:
	_save_local_state()
