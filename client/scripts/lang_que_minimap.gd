extends Control

signal selected
var world: Node2D
var detailed := false


func _ready() -> void:
	clip_contents = true
	mouse_filter = Control.MOUSE_FILTER_STOP


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		selected.emit()
		accept_event()


func _process(_delta: float) -> void:
	queue_redraw()


func pin(point: Vector2) -> Vector2:
	var margin := Vector2(14, 14)
	return margin + point / world._world_size * (size - margin * 2)


func _draw() -> void:
	if world == null:
		return
	draw_rect(Rect2(Vector2.ZERO, size), Color("283c31"))
	var frame := Rect2(Vector2(14, 14), size - Vector2(28, 28))
	draw_rect(frame, Color("80935e"))
	for paddy in world.layout.paddies:
		var polygon := PackedVector2Array()
		for cell in paddy.points:
			polygon.append(pin(Vector2(float(cell[0]), float(cell[1])) * 32))
		draw_colored_polygon(polygon, Color("c3b36b"))
	for polygon in world.water_polygons:
		var scaled := PackedVector2Array()
		for point in polygon:
			scaled.append(pin(point))
		draw_colored_polygon(scaled, Color("69a4a2"))
	for road in world._floor_data.roads:
		var points: PackedVector2Array = world._smooth_points(road.points, bool(road.get("closed", false)))
		var scaled := PackedVector2Array()
		for point in points:
			scaled.append(pin(point))
		if scaled.size() > 1:
			draw_polyline(scaled, Color("ddbd85"), maxf(1.0, float(road.width_cells) * 32.0 / world._world_size.x * frame.size.x))
	for bridge in world.layout.bridges:
		var center := Vector2(float(bridge.center_cell[0]), float(bridge.center_cell[1])) * 32
		var dims := Vector2(float(bridge.size_cells[0]), float(bridge.size_cells[1])) * 32
		draw_rect(Rect2(pin(center - dims * 0.5), dims / world._world_size * frame.size), Color("ba986c"))
	for object in world.layout.objects:
		if object.kind == "house":
			var p := Vector2(float(object.cell[0]), float(object.cell[1])) * 32
			draw_rect(Rect2(pin(p) - Vector2(2, 2), Vector2(4, 3)), Color("d08055"))
	for point in world.layout.checkpoints:
		draw_circle(pin(Vector2(float(point.cell[0]), float(point.cell[1])) * 32), 2.5, Color("f8e4b2"))
	for link in world._links.links:
		for side in ["a", "b"]:
			var endpoint: Dictionary = link[side]
			if str(endpoint.map_id) == "m_lang_que":
				draw_circle(pin(Vector2(float(endpoint.cell[0]), float(endpoint.cell[1])) * 32), 4, Color("c9f1d3"))
	if detailed:
		for district in world.layout.districts:
			var point := pin(Vector2(float(district.center_cell[0]), float(district.center_cell[1])) * 32)
			var text: String = world.local_text(str(district.name), str(district.name_en))
			draw_string(world.FONT, point + Vector2(-28, -10), text, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color("ffefd0"))
	var actor: Node2D = world.player
	if is_instance_valid(actor):
		draw_circle(pin(actor.global_position), 4, Color("ffdb72"))
		draw_circle(pin(actor.global_position), 6, Color("594025"), false, 1.0)
	draw_rect(frame, Color("d2ba89"), false, 1)
