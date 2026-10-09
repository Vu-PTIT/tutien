extends Control

# Render the same authoring geometry as the playable world. No screenshot or
# alternate hand-drawn overview that drifts out of sync with map/collision.
var layout: Dictionary = {}
var actor: Node2D
var geometry_provider: Node2D


func configure(data: Dictionary, player: Node2D, world: Node2D) -> void:
    layout = data
    actor = player
    geometry_provider = world
    custom_minimum_size = Vector2(218, 168)
    texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    mouse_filter = Control.MOUSE_FILTER_IGNORE
    set_process(true)
    queue_redraw()


func _process(_delta: float) -> void:
    queue_redraw()


func _draw() -> void:
    if layout.is_empty() or not is_instance_valid(geometry_provider):
        return
    var extent := _v(layout.get("size", [1120, 800]))
    var frame := Rect2(Vector2(7, 7), size - Vector2(14, 14))
    draw_rect(Rect2(Vector2.ZERO, size), Color(0.06, 0.11, 0.10, 0.92))
    draw_rect(frame, Color(0.53, 0.75, 0.44))
    for patch in layout.get("terrain_patches", []):
        var shape: PackedVector2Array = geometry_provider.call("_ellipse", _v(patch.get("center", [])), _v(patch.get("radii", [])), float(patch.get("seed", 0)))
        var color := Color(0.71, 0.72, 0.46)
        if str(patch.get("kind")) == "soil":
            color = Color(0.53, 0.38, 0.28)
        _polygon(shape, color, frame, extent)
    for water in layout.get("waters", []):
        var bank: PackedVector2Array = geometry_provider.call("_water_polygon", water, 10.0)
        _polygon(bank, Color(0.77, 0.73, 0.49), frame, extent)
        var body: PackedVector2Array = geometry_provider.call("_water_polygon", water)
        _polygon(body, Color(0.39, 0.70, 0.80), frame, extent)
    for road in layout.get("roads", []):
        var shape: PackedVector2Array = geometry_provider.call("_ribbon", road.get("points", []), float(road.get("radius", 13.0)), 1.0)
        _polygon(shape, Color(0.84, 0.71, 0.52), frame, extent)
    for obj in layout.get("objects", []):
        var p := _pin(_v(obj.get("position", [])), frame, extent)
        var kind := str(obj.get("kind", ""))
        var dot_color := Color(0.19, 0.31, 0.23)
        var radius := 1.3
        if kind == "house":
            dot_color = Color(0.78, 0.62, 0.39)
            radius = 3.0
        elif kind in ["fishing", "plant", "bench"]:
            dot_color = Color(0.94, 0.92, 0.71)
            radius = 2.0
        draw_circle(p, radius, dot_color)
    if is_instance_valid(actor):
        draw_circle(_pin(actor.global_position, frame, extent), 3.4, Color(0.97, 0.26, 0.19))
    draw_rect(frame, Color(0.97, 0.89, 0.74), false, 2.0)


func _polygon(world_points: PackedVector2Array, paint: Color, frame: Rect2, extent: Vector2) -> void:
    if world_points.size() < 3:
        return
    var points := PackedVector2Array()
    for point in world_points:
        points.append(_pin(point, frame, extent))
    draw_colored_polygon(points, paint)


func _pin(point: Vector2, frame: Rect2, extent: Vector2) -> Vector2:
    var progress := Vector2(clampf(point.x / extent.x, 0, 1), clampf(point.y / extent.y, 0, 1))
    return frame.position + progress * frame.size


func _v(raw: Array) -> Vector2:
    if raw.size() < 2:
        return Vector2.ZERO
    return Vector2(float(raw[0]), float(raw[1]))
