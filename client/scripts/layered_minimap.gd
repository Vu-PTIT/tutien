extends Control

var layout: Dictionary = {}
var actor: Node2D


func configure(data: Dictionary, player: Node2D) -> void:
    layout = data
    actor = player
    custom_minimum_size = Vector2(216, 162)
    mouse_filter = Control.MOUSE_FILTER_IGNORE
    set_process(true)
    queue_redraw()


func _process(_delta: float) -> void:
    queue_redraw()


func _draw() -> void:
    if layout.is_empty():
        return
    var extent := _v(layout.get("size", [1120, 800]))
    var frame := Rect2(8, 8, size.x - 16, size.y - 16)
    draw_rect(Rect2(Vector2.ZERO, size), Color(0.08, 0.12, 0.11, 0.89), true)
    draw_rect(frame, Color(0.49, 0.73, 0.43), true)
    for river in layout.get("waters", []):
        if river.get("shape") == "pond":
            var center := _pin(_v(river.get("center", [])), frame, extent)
            draw_circle(center, float(river.get("radii", [60, 40])[0]) * frame.size.x / extent.x, Color(0.42, 0.73, 0.82))
        else:
            _draw_polyline(river.get("points", []), float(river.get("radius", 32)) * 2.0, frame, extent, Color(0.42, 0.73, 0.82))
    for road in layout.get("roads", []):
        _draw_polyline(road.get("points", []), float(road.get("radius", 15)) * 2.0, frame, extent, Color(0.87, 0.75, 0.55))
    for obj in layout.get("objects", []):
        var point := _pin(_v(obj.get("position", [])), frame, extent)
        draw_circle(point, 2.0, Color(0.23, 0.31, 0.24))
    if is_instance_valid(actor):
        draw_circle(_pin(actor.global_position, frame, extent), 4.0, Color(0.96, 0.24, 0.20))
    draw_rect(frame, Color(0.93, 0.86, 0.66), false, 2.0)


func _draw_polyline(raw: Array, width_world: float, frame: Rect2, extent: Vector2, color: Color) -> void:
    if raw.size() < 2:
        return
    var points := PackedVector2Array()
    for p in raw:
        points.append(_pin(_v(p), frame, extent))
    draw_polyline(points, color, maxf(1, width_world * frame.size.x / extent.x), true)


func _pin(p: Vector2, frame: Rect2, extent: Vector2) -> Vector2:
    return frame.position + Vector2(p.x / extent.x * frame.size.x, p.y / extent.y * frame.size.y)


func _v(raw: Array) -> Vector2:
    if raw.size() < 2:
        return Vector2.ZERO
    return Vector2(float(raw[0]), float(raw[1]))
