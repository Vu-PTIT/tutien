extends Node2D

const CELL_SIZE := 32.0
const MAP_IDS: Array[String] = [
	"m_lang_que", "m_thang_long", "m_vanh_dai_tay", "m_cang_dong_bac",
	"m_mo_lo_thien", "m_mo_ngam", "m_ba_vi", "m_tram_thien_mach"
]
const MAP_DIRECTORY := "data/world/maps/"
const LINKS_PATH := "res://data/world/links.json"
const SURFACE_SHADER := preload("res://shaders/world_map_blockout.gdshader")
const FONT := preload("res://assets/fonts/BeVietnamPro-Regular.ttf")
const STYLE_IDS := {
	"grass": 0, "field": 1, "earth": 2, "packed_earth": 2, "road": 2,
	"asphalt": 7, "concrete": 3, "rock": 4, "gravel": 8,
	"shore": 5, "water": 6, "basalt": 9, "floor": 10
}
const MAP_SHORT_NAMES := {
	"m_lang_que": "Làng Quê", "m_thang_long": "Thăng Long",
	"m_vanh_dai_tay": "Vành Đai Tây", "m_cang_dong_bac": "Cảng Đông Bắc",
	"m_mo_lo_thien": "Mỏ Lộ Thiên", "m_mo_ngam": "Mỏ Ngầm",
	"m_ba_vi": "Rừng Ba Vì", "m_tram_thien_mach": "Trạm Thiên Mạch"
}

var _maps: Dictionary = {}
var _links: Dictionary = {}
var _active_map_id := "m_lang_que"
var _active_floor_id := "b1"
var _active_data: Dictionary = {}
var _floor_data: Dictionary = {}
var _world_size := Vector2.ZERO
var _map_root: Node2D
var _camera: Camera2D
var _info_label: Label
var _status_label: Label
var _route_list: VBoxContainer
var _map_button_row: HBoxContainer
var map_count := 0
var road_count := 0
var water_count := 0
var portal_marker_count := 0


func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	if get_tree().has_meta("lq_neighbor_preview"):
		_active_map_id = str(get_tree().get_meta("lq_neighbor_preview"))
	_load_data()
	_create_camera()
	_create_overlay()
	_build_map(_active_map_id)
	_frame_map()


func _load_data() -> void:
	for map_id in MAP_IDS:
		var path := "res://" + MAP_DIRECTORY + map_id + ".json"
		var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
		if typeof(parsed) != TYPE_DICTIONARY:
			push_error("Invalid map blockout JSON: " + path)
			continue
		_maps[map_id] = parsed
	var parsed_links: Variant = JSON.parse_string(FileAccess.get_file_as_string(LINKS_PATH))
	if typeof(parsed_links) != TYPE_DICTIONARY:
		push_error("Invalid world map link data: " + LINKS_PATH)
		return
	_links = parsed_links
	map_count = _maps.size()


func _create_camera() -> void:
	_camera = Camera2D.new()
	_camera.name = "PreviewCamera"
	_camera.position_smoothing_enabled = false
	add_child(_camera)
	_camera.make_current()


func _create_overlay() -> void:
	var canvas := CanvasLayer.new()
	canvas.name = "Overlay"
	canvas.layer = 20
	add_child(canvas)

	var header := PanelContainer.new()
	header.name = "MapInfo"
	header.position = Vector2(16, 16)
	header.custom_minimum_size = Vector2(465, 100)
	header.add_theme_stylebox_override("panel", _panel_style(Color(0.08, 0.13, 0.12, 0.94)))
	canvas.add_child(header)
	var header_stack := VBoxContainer.new()
	header.add_child(header_stack)
	_info_label = Label.new()
	_info_label.name = "InfoLabel"
	_info_label.add_theme_font_override("font", FONT)
	_info_label.add_theme_font_size_override("font_size", 15)
	_info_label.add_theme_color_override("font_color", Color(0.97, 0.94, 0.82))
	_info_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	header_stack.add_child(_info_label)
	_status_label = Label.new()
	_status_label.name = "StatusLabel"
	_status_label.add_theme_font_override("font", FONT)
	_status_label.add_theme_font_size_override("font_size", 12)
	_status_label.add_theme_color_override("font_color", Color(0.76, 0.87, 0.73))
	_status_label.text = "Preview địa hình · dữ liệu chuyển map chỉ chạy cục bộ"
	header_stack.add_child(_status_label)

	var maps_panel := PanelContainer.new()
	maps_panel.name = "MapSelector"
	maps_panel.position = Vector2(16, 126)
	maps_panel.custom_minimum_size = Vector2(465, 48)
	maps_panel.add_theme_stylebox_override("panel", _panel_style(Color(0.08, 0.13, 0.12, 0.90)))
	canvas.add_child(maps_panel)
	_map_button_row = HBoxContainer.new()
	_map_button_row.add_theme_constant_override("separation", 5)
	maps_panel.add_child(_map_button_row)
	if get_tree().has_meta("lq_neighbor_preview"):
		var back := Button.new()
		back.text = "← Làng quê"
		back.add_theme_font_override("font", FONT)
		back.pressed.connect(_return_to_village)
		_map_button_row.add_child(back)
	for index in range(MAP_IDS.size()):
		var map_button := Button.new()
		map_button.text = str(index + 1)
		map_button.tooltip_text = str(MAP_SHORT_NAMES[MAP_IDS[index]])
		map_button.custom_minimum_size = Vector2(42, 32)
		map_button.add_theme_font_override("font", FONT)
		map_button.add_theme_font_size_override("font_size", 13)
		map_button.pressed.connect(_set_map.bind(MAP_IDS[index]))
		_map_button_row.add_child(map_button)

	var links_panel := PanelContainer.new()
	links_panel.name = "LinksPanel"
	links_panel.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	links_panel.offset_left = -340
	links_panel.offset_right = -16
	links_panel.offset_top = 16
	links_panel.offset_bottom = 460
	links_panel.custom_minimum_size = Vector2(324, 0)
	links_panel.add_theme_stylebox_override("panel", _panel_style(Color(0.08, 0.13, 0.12, 0.92)))
	canvas.add_child(links_panel)
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	links_panel.add_child(scroll)
	_route_list = VBoxContainer.new()
	_route_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_route_list.add_theme_constant_override("separation", 5)
	scroll.add_child(_route_list)

	var controls := Label.new()
	controls.name = "ControlsHint"
	controls.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT)
	controls.offset_left = 16
	controls.offset_right = 700
	controls.offset_top = -36
	controls.offset_bottom = -12
	controls.add_theme_font_override("font", FONT)
	controls.add_theme_font_size_override("font_size", 12)
	controls.add_theme_color_override("font_color", Color(0.96, 0.93, 0.82))
	controls.text = "1–8: chọn map · WASD/↑↓←→: kéo · cuộn chuột: zoom · F: vừa khung · Tab: tầng hầm"
	canvas.add_child(controls)


func _panel_style(background: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = Color(0.74, 0.70, 0.52, 0.94)
	style.set_border_width_all(1)
	style.set_corner_radius_all(4)
	style.content_margin_left = 10
	style.content_margin_right = 10
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	return style


func _set_map(map_id: String) -> void:
	if not _maps.has(map_id):
		return
	_build_map(map_id)
	_frame_map()


func _return_to_village() -> void:
	get_tree().remove_meta("lq_neighbor_preview")
	get_tree().change_scene_to_file("res://scenes/m_lang_que.tscn")


func _build_map(map_id: String) -> void:
	_active_map_id = map_id
	_active_data = _maps[map_id]
	var floors: Dictionary = _active_data.get("floors", {})
	if floors.size() > 0:
		if not floors.has(_active_floor_id):
			_active_floor_id = "b1"
		_floor_data = floors.get(_active_floor_id, {})
	else:
		_active_floor_id = ""
		_floor_data = _active_data
	_world_size = Vector2(
		float(_active_data.get("width_cells", 1)) * CELL_SIZE,
		float(_active_data.get("height_cells", 1)) * CELL_SIZE
	)
	if _map_root != null:
		remove_child(_map_root)
		_map_root.free()
	_map_root = Node2D.new()
	_map_root.name = "MapRoot"
	add_child(_map_root)
	road_count = 0
	water_count = 0
	portal_marker_count = 0
	_build_layers()
	_build_portal_markers()
	_refresh_overlay()


func _build_layers() -> void:
	var palette: Dictionary = _active_data.get("palette", {})
	var ground_layer := Node2D.new()
	ground_layer.name = "L00_Ground"
	ground_layer.z_index = -100
	_map_root.add_child(ground_layer)
	var ground := Polygon2D.new()
	ground.name = "GroundBase"
	ground.polygon = _rectangle_polygon(_world_size)
	ground.material = _surface_material(palette, "grass", 1.0)
	ground.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	ground_layer.add_child(ground)

	var landform_layer := Node2D.new()
	landform_layer.name = "L01_LandformsRoads"
	landform_layer.z_index = -10
	_map_root.add_child(landform_layer)
	for patch in _floor_data.get("ground_regions", []):
		var patch_polygon := Polygon2D.new()
		patch_polygon.name = _safe_name(str(patch.get("id", "GroundRegion")))
		patch_polygon.polygon = _cell_polygon(patch.get("points", []))
		patch_polygon.material = _surface_material(palette, str(patch.get("surface", "grass")), _seed_for(str(patch.get("id", ""))))
		patch_polygon.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		patch_polygon.z_index = -1
		landform_layer.add_child(patch_polygon)
	_build_water_layers(palette)
	_build_roads(landform_layer, palette)
	_build_water_collision()


func _build_water_layers(palette: Dictionary) -> void:
	var shore_layer := Node2D.new()
	shore_layer.name = "L03_ShoreLow"
	shore_layer.z_index = -12
	_map_root.add_child(shore_layer)
	var water_layer := Node2D.new()
	water_layer.name = "L02_WaterBodies"
	water_layer.z_index = -11
	_map_root.add_child(water_layer)
	for water in _floor_data.get("waters", []):
		var water_id := str(water.get("id", "Water"))
		var shape := str(water.get("shape", "ribbon"))
		var geometry := _water_polygon(water)
		if geometry.size() < 3:
			continue
		var shore_width := float(water.get("shore_width_cells", 0.5)) * CELL_SIZE
		if shore_width > 0.0:
			if shape == "ribbon":
				var shore := Line2D.new()
				shore.name = _safe_name(water_id + "_shore")
				shore.points = _smooth_points(water.get("points", []), false)
				shore.width = float(water.get("width_cells", 1.0)) * CELL_SIZE + shore_width * 2.0
				shore.default_color = Color.WHITE
				shore.joint_mode = Line2D.LINE_JOINT_ROUND
				shore.begin_cap_mode = Line2D.LINE_CAP_ROUND
				shore.end_cap_mode = Line2D.LINE_CAP_ROUND
				shore.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
				shore.material = _surface_material(palette, "shore", _seed_for(water_id + "_shore"))
				shore_layer.add_child(shore)
			elif shape == "ellipse":
				var bank := Polygon2D.new()
				bank.name = _safe_name(water_id + "_shore")
				bank.polygon = _ellipse_polygon(
					_vector(water.get("center_cell", [0, 0])) * CELL_SIZE,
					_vector(water.get("radii_cells", [1, 1])) * CELL_SIZE + Vector2.ONE * shore_width,
					_seed_for(water_id)
				)
				bank.material = _surface_material(palette, "shore", _seed_for(water_id + "_shore"))
				bank.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
				shore_layer.add_child(bank)
			else:
				var coast := Line2D.new()
				coast.name = _safe_name(water_id + "_shore")
				coast.points = _cell_polygon(water.get("points", []))
				coast.closed = true
				coast.width = shore_width
				coast.default_color = Color.WHITE
				coast.joint_mode = Line2D.LINE_JOINT_ROUND
				coast.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
				coast.material = _surface_material(palette, "shore", _seed_for(water_id + "_shore"))
				shore_layer.add_child(coast)

		var water_shape := Polygon2D.new()
		water_shape.name = _safe_name(water_id)
		water_shape.polygon = geometry
		water_shape.material = _surface_material(palette, "water", _seed_for(water_id))
		water_shape.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		water_layer.add_child(water_shape)
		water_count += 1


func _build_roads(parent: Node2D, palette: Dictionary) -> void:
	var roads_layer := Node2D.new()
	roads_layer.name = "Roads"
	parent.add_child(roads_layer)
	for road in _floor_data.get("roads", []):
		var road_id := str(road.get("id", "Road"))
		var is_closed := bool(road.get("closed", false))
		var path := _smooth_points(road.get("points", []), is_closed)
		if path.size() < 2:
			continue
		var width := float(road.get("width_cells", 3.0)) * CELL_SIZE
		var verge := Line2D.new()
		verge.name = _safe_name(road_id + "_verge")
		verge.points = path
		verge.closed = is_closed
		verge.width = width + 13.0
		verge.default_color = Color.WHITE
		verge.joint_mode = Line2D.LINE_JOINT_ROUND
		verge.begin_cap_mode = Line2D.LINE_CAP_ROUND
		verge.end_cap_mode = Line2D.LINE_CAP_ROUND
		verge.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		verge.material = _surface_material(palette, "earth", _seed_for(road_id + "_verge"))
		roads_layer.add_child(verge)
		var road_surface := Line2D.new()
		road_surface.name = _safe_name(road_id)
		road_surface.points = path
		road_surface.closed = is_closed
		road_surface.width = width
		road_surface.default_color = Color.WHITE
		road_surface.joint_mode = Line2D.LINE_JOINT_ROUND
		road_surface.begin_cap_mode = Line2D.LINE_CAP_ROUND
		road_surface.end_cap_mode = Line2D.LINE_CAP_ROUND
		road_surface.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		road_surface.material = _surface_material(palette, str(road.get("surface", "road")), _seed_for(road_id))
		roads_layer.add_child(road_surface)
		road_count += 1


func _build_water_collision() -> void:
	var data_layer := Node2D.new()
	data_layer.name = "DATA_WaterCollision"
	data_layer.z_index = 0
	_map_root.add_child(data_layer)
	for water in _floor_data.get("waters", []):
		if not bool(water.get("collision", true)):
			continue
		var body := StaticBody2D.new()
		body.name = _safe_name("SolidWater_" + str(water.get("id", "Water")))
		body.collision_layer = 1
		body.collision_mask = 0
		data_layer.add_child(body)
		var shape := str(water.get("shape", "ribbon"))
		if shape == "ribbon":
			# Rounded capsule segments avoid self-intersection at tight spline bends.
			# Their centerline and width use the same authored data as the visual ribbon.
			var points := _cell_polygon(water.get("points", []))
			var radius := float(water.get("width_cells", 1.0)) * CELL_SIZE * 0.5
			for index in range(points.size() - 1):
				var delta: Vector2 = points[index + 1] - points[index]
				if delta.length() < 1.0:
					continue
				var capsule := CapsuleShape2D.new()
				capsule.radius = radius
				capsule.height = delta.length() + radius * 2.0
				var collider := CollisionShape2D.new()
				collider.shape = capsule
				collider.position = (points[index] + points[index + 1]) * 0.5
				collider.rotation = delta.angle() + PI * 0.5
				body.add_child(collider)
		elif shape == "ellipse":
			var convex := ConvexPolygonShape2D.new()
			convex.points = Geometry2D.convex_hull(_water_polygon(water))
			var collider := CollisionShape2D.new()
			collider.shape = convex
			body.add_child(collider)
		else:
			# Triangulate the authored coastline and attach independent convex pieces.
			var polygon := _water_polygon(water)
			var indices := Geometry2D.triangulate_polygon(polygon)
			if indices.is_empty():
				push_error("Cannot triangulate water collision: " + str(water.get("id", "Water")))
				continue
			for index in range(0, indices.size(), 3):
				var triangle := PackedVector2Array([
					polygon[indices[index]], polygon[indices[index + 1]], polygon[indices[index + 2]]
				])
				var convex := ConvexPolygonShape2D.new()
				convex.points = triangle
				var collider := CollisionShape2D.new()
				collider.shape = convex
				body.add_child(collider)


func _build_portal_markers() -> void:
	var marker_layer := Node2D.new()
	marker_layer.name = "DATA_PortalMarkers"
	marker_layer.z_index = 2
	_map_root.add_child(marker_layer)
	var all_links: Array = _links.get("links", []) + _links.get("floor_links", [])
	for link in all_links:
		for side in ["a", "b"]:
			var endpoint: Dictionary = link.get(side, {})
			if str(endpoint.get("map_id", "")) != _active_map_id:
				continue
			if str(endpoint.get("floor_id", "")) != _active_floor_id:
				continue
			var trigger := _vector(endpoint.get("cell", [0, 0])) * CELL_SIZE
			var anchor := _vector(endpoint.get("entry_anchor_cell", endpoint.get("cell", [0, 0]))) * CELL_SIZE
			var tint := Color(0.37, 0.87, 0.68, 1.0)
			if str(link.get("status", "open")) != "open":
				tint = Color(0.93, 0.63, 0.28, 1.0)
			elif str(link.get("travel_mode", "")) == "transit":
				tint = Color(0.46, 0.76, 0.98, 1.0)
			var marker := Node2D.new()
			marker.name = _safe_name("Portal_" + str(link.get("id", "link")) + "_" + side)
			marker.position = trigger
			marker_layer.add_child(marker)
			var arrival_line := Line2D.new()
			arrival_line.name = "EntryAnchor"
			arrival_line.points = PackedVector2Array([Vector2.ZERO, anchor - trigger])
			arrival_line.width = 3.0
			arrival_line.default_color = tint.darkened(0.2)
			arrival_line.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
			marker.add_child(arrival_line)
			var outer := Polygon2D.new()
			outer.name = "PortalOuter"
			outer.polygon = _circle_polygon(19.0, 16)
			outer.color = Color(0.06, 0.10, 0.10, 0.96)
			marker.add_child(outer)
			var core := Polygon2D.new()
			core.name = "PortalCore"
			core.polygon = _circle_polygon(12.0, 16)
			core.color = tint
			marker.add_child(core)
			portal_marker_count += 1


func _refresh_overlay() -> void:
	if _info_label == null:
		return
	var dimensions := "%d × %d ô · %d × %d px" % [
		int(_active_data.get("width_cells", 0)), int(_active_data.get("height_cells", 0)),
		int(_world_size.x), int(_world_size.y)
	]
	var floor_label := " · Tầng " + _active_floor_id.to_upper() if _active_floor_id != "" else ""
	_info_label.text = str(_active_data.get("name", _active_map_id)) + floor_label + "\n" + dimensions + "\n" + str(_active_data.get("description", ""))
	if _route_list == null:
		return
	for child in _route_list.get_children():
		_route_list.remove_child(child)
		child.queue_free()
	var heading := Label.new()
	heading.text = "CỔNG VÀ LIÊN KẾT"
	heading.add_theme_font_override("font", FONT)
	heading.add_theme_font_size_override("font_size", 14)
	heading.add_theme_color_override("font_color", Color(0.95, 0.89, 0.68))
	_route_list.add_child(heading)
	var found := 0
	var all_links: Array = _links.get("links", []) + _links.get("floor_links", [])
	for link in all_links:
		var endpoint_index := _endpoint_index_for_current(link)
		if endpoint_index < 0:
			continue
		found += 1
		var origin: Dictionary = link["a"] if endpoint_index == 0 else link["b"]
		var destination: Dictionary = link["b"] if endpoint_index == 0 else link["a"]
		var target_map := str(destination.get("map_id", ""))
		var target_name := str(MAP_SHORT_NAMES.get(target_map, target_map))
		if target_map == _active_map_id and str(destination.get("floor_id", "")) != _active_floor_id:
			target_name += " · tầng " + str(destination.get("floor_id", "")).to_upper()
		var status := str(link.get("status", "open"))
		var mode_label := _travel_mode_label(str(link.get("travel_mode", "walk")))
		var button := Button.new()
		button.text = target_name + "\n" + str(link.get("id", "")) + " · " + mode_label
		if status != "open":
			button.text += " · KHÓA"
		button.custom_minimum_size = Vector2(292, 48)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		button.add_theme_font_override("font", FONT)
		button.add_theme_font_size_override("font_size", 12)
		button.disabled = status != "open"
		button.pressed.connect(_activate_link.bind(link, origin))
		_route_list.add_child(button)
		if status != "open":
			var condition := Label.new()
			condition.text = str(link.get("condition", "Lối này đang khóa."))
			condition.add_theme_font_override("font", FONT)
			condition.add_theme_font_size_override("font_size", 10)
			condition.add_theme_color_override("font_color", Color(0.82, 0.72, 0.57))
			condition.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			_route_list.add_child(condition)
	if found == 0:
		var empty := Label.new()
		empty.text = "Chưa có cổng nối ở tầng/khu này."
		empty.add_theme_font_override("font", FONT)
		empty.add_theme_font_size_override("font_size", 12)
		_route_list.add_child(empty)


func _endpoint_index_for_current(link: Dictionary) -> int:
	for index in [0, 1]:
		var endpoint: Dictionary = link["a"] if index == 0 else link["b"]
		if str(endpoint.get("map_id", "")) != _active_map_id:
			continue
		if str(endpoint.get("floor_id", "")) != _active_floor_id:
			continue
		return index
	return -1


func _activate_link(link: Dictionary, origin: Dictionary) -> void:
	if str(link.get("status", "open")) != "open":
		_status_label.text = str(link.get("condition", "Cổng đang khóa."))
		return
	var destination: Dictionary = link["b"] if origin == link["a"] else link["a"]
	var travel_mode := str(link.get("travel_mode", "walk"))
	var message := "Preview cục bộ: " + str(link.get("label", "đổi khu"))
	if travel_mode == "transit":
		message = "Preview cục bộ tuyến xe Đông Bắc · không ghi trạng thái server."
	elif travel_mode == "lift":
		message += " · mô phỏng thang mỏ."
	_status_label.text = message
	var destination_map := str(destination.get("map_id", ""))
	if destination_map == _active_map_id:
		_active_floor_id = str(destination.get("floor_id", "b1"))
		_build_map(_active_map_id)
		_frame_map()
	else:
		_active_floor_id = str(destination.get("floor_id", "b1"))
		_build_map(destination_map)
		_frame_map()
	_status_label.text = message


func _travel_mode_label(mode: String) -> String:
	match mode:
		"transit": return "tuyến xe"
		"lift": return "thang mỏ"
		"gated": return "có điều kiện"
		_: return "đi bộ"


func _frame_map() -> void:
	if _camera == null or _world_size == Vector2.ZERO:
		return
	var viewport_size := get_viewport_rect().size
	var fit_scale := minf((viewport_size.x - 44.0) / _world_size.x, (viewport_size.y - 44.0) / _world_size.y)
	fit_scale = clampf(fit_scale, 0.045, 0.32)
	_camera.zoom = Vector2.ONE * fit_scale
	_camera.position = _world_size * 0.5


func _process(delta: float) -> void:
	if _camera == null:
		return
	var move := Vector2.ZERO
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT): move.x -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT): move.x += 1.0
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP): move.y -= 1.0
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN): move.y += 1.0
	if move != Vector2.ZERO:
		_camera.position += move.normalized() * (620.0 / maxf(_camera.zoom.x, 0.045)) * delta


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_set_zoom(_camera.zoom.x * 1.16)
			get_viewport().set_input_as_handled()
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_set_zoom(_camera.zoom.x / 1.16)
			get_viewport().set_input_as_handled()
		return
	if not event is InputEventKey or not event.pressed or event.echo:
		return
	var key := event as InputEventKey
	if key.keycode >= KEY_1 and key.keycode <= KEY_8:
		_set_map(MAP_IDS[key.keycode - KEY_1])
		get_viewport().set_input_as_handled()
	elif key.keycode == KEY_F:
		_frame_map()
		get_viewport().set_input_as_handled()
	elif key.keycode == KEY_TAB and _active_data.has("floors"):
		_active_floor_id = "b2" if _active_floor_id == "b1" else "b1"
		_build_map(_active_map_id)
		_frame_map()
		get_viewport().set_input_as_handled()
	elif key.keycode == KEY_EQUAL or key.keycode == KEY_KP_ADD:
		_set_zoom(_camera.zoom.x * 1.2)
		get_viewport().set_input_as_handled()
	elif key.keycode == KEY_MINUS or key.keycode == KEY_KP_SUBTRACT:
		_set_zoom(_camera.zoom.x / 1.2)
		get_viewport().set_input_as_handled()


func _set_zoom(value: float) -> void:
	_camera.zoom = Vector2.ONE * clampf(value, 0.045, 2.0)


func _surface_material(palette: Dictionary, surface: String, seed: float) -> ShaderMaterial:
	var colors: Array = palette.get(surface, palette.get("grass", ["#647b4c", "#87945e", "#46593e"]))
	var material := ShaderMaterial.new()
	material.shader = SURFACE_SHADER
	material.set_shader_parameter("base_color", _html_color(str(colors[0])))
	material.set_shader_parameter("light_color", _html_color(str(colors[1])))
	material.set_shader_parameter("dark_color", _html_color(str(colors[2])))
	material.set_shader_parameter("surface_kind", int(STYLE_IDS.get(surface, 0)))
	material.set_shader_parameter("pattern_seed", seed)
	return material


func _html_color(value: String) -> Color:
	return Color.from_string(value, Color.WHITE)


func _water_polygon(water: Dictionary) -> PackedVector2Array:
	var shape := str(water.get("shape", "ribbon"))
	if shape == "ellipse":
		return _ellipse_polygon(
			_vector(water.get("center_cell", [0, 0])) * CELL_SIZE,
			_vector(water.get("radii_cells", [1, 1])) * CELL_SIZE,
			_seed_for(str(water.get("id", "")))
		)
	if shape == "polygon":
		return _cell_polygon(water.get("points", []))
	var path := _smooth_points(water.get("points", []), false)
	return _ribbon(path, float(water.get("width_cells", 1.0)) * CELL_SIZE * 0.5)


func _ribbon(path: PackedVector2Array, radius: float) -> PackedVector2Array:
	if path.size() < 2:
		return PackedVector2Array()
	var left := PackedVector2Array()
	var right := PackedVector2Array()
	for index in range(path.size()):
		var previous: Vector2 = path[maxi(0, index - 1)]
		var following: Vector2 = path[mini(path.size() - 1, index + 1)]
		var direction := (following - previous).normalized()
		var normal := Vector2(-direction.y, direction.x)
		var edge_delta := sin(float(index) * 0.53 + radius * 0.013) * minf(2.5, radius * 0.055)
		left.append((path[index] + normal * (radius + edge_delta)).round())
		right.append((path[index] - normal * (radius - edge_delta * 0.8)).round())
	var polygon := PackedVector2Array()
	for point in left:
		polygon.append(point)
	for index in range(right.size() - 1, -1, -1):
		polygon.append(right[index])
	return polygon


func _smooth_points(raw: Array, closed: bool) -> PackedVector2Array:
	var source := PackedVector2Array()
	for point in raw:
		source.append(_vector(point) * CELL_SIZE)
	if source.size() < 2:
		return source
	if closed and source.size() > 2 and source[0].distance_to(source[source.size() - 1]) < 0.1:
		source.remove_at(source.size() - 1)
	var result := PackedVector2Array()
	var segment_count := source.size() if closed else source.size() - 1
	for index in range(segment_count):
		var p0: Vector2 = source[(index - 1 + source.size()) % source.size()] if closed else source[maxi(0, index - 1)]
		var p1: Vector2 = source[index]
		var p2: Vector2 = source[(index + 1) % source.size()] if closed else source[index + 1]
		var p3: Vector2 = source[(index + 2) % source.size()] if closed else source[mini(source.size() - 1, index + 2)]
		var steps := maxi(3, ceili(p1.distance_to(p2) / 26.0))
		for step in range(steps):
			result.append(_catmull_rom(p0, p1, p2, p3, float(step) / float(steps)).round())
	if not closed:
		result.append(source[source.size() - 1])
	return result


func _catmull_rom(a: Vector2, b: Vector2, c: Vector2, d: Vector2, t: float) -> Vector2:
	var t2 := t * t
	var t3 := t2 * t
	return (b * 2.0 + (c - a) * t + (a * 2.0 - b * 5.0 + c * 4.0 - d) * t2 + (-a + b * 3.0 - c * 3.0 + d) * t3) * 0.5


func _cell_polygon(raw: Array) -> PackedVector2Array:
	var result := PackedVector2Array()
	for point in raw:
		result.append(_vector(point) * CELL_SIZE)
	return result


func _ellipse_polygon(center: Vector2, radii: Vector2, seed: float) -> PackedVector2Array:
	var result := PackedVector2Array()
	for index in range(48):
		var angle := TAU * float(index) / 48.0
		var variation := 1.0 + 0.035 * sin(angle * 5.0 + seed) + 0.025 * sin(angle * 9.0 + 1.2 + seed)
		result.append((center + Vector2(cos(angle) * radii.x, sin(angle) * radii.y) * variation).round())
	return result


func _circle_polygon(radius: float, count: int) -> PackedVector2Array:
	var result := PackedVector2Array()
	for index in range(count):
		var angle := TAU * float(index) / float(count)
		result.append(Vector2(cos(angle), sin(angle)) * radius)
	return result


func _rectangle_polygon(size: Vector2) -> PackedVector2Array:
	return PackedVector2Array([Vector2.ZERO, Vector2(size.x, 0), size, Vector2(0, size.y)])


func _vector(raw: Array) -> Vector2:
	if raw.size() < 2:
		return Vector2.ZERO
	return Vector2(float(raw[0]), float(raw[1]))


func _seed_for(value: String) -> float:
	var total := 0
	for index in range(value.length()):
		total = (total * 31 + value.unicode_at(index)) % 997
	return float(total)


func _safe_name(value: String) -> String:
	return value.replace("-", "_").replace(" ", "_").replace("/", "_")
