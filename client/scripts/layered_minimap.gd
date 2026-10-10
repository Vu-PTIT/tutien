extends Control

# Same authoring data as the world; a reduced 2D overview, not a screenshot.
# Draw curving strokes at minimap scale to avoid degenerate polygon triangulation.
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
    clip_contents = true
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
        var color := Color(0.70, 0.75, 0.48)
        if str(patch.get("kind", "")) == "soil":
            color = Color(0.52, 0.38, 0.28)
        _draw_ellipse(_v(patch.get("center", [])), _v(patch.get("radii", [])), color, frame, extent)
    for terrace in layout.get("terraces", []):
        var lip: PackedVector2Array = geometry_provider.call("_smooth_path", terrace.get("edge", []))
        var scaled := PackedVector2Array()
        for p in lip:
            scaled.append(_pin(p, frame, extent))
        if scaled.size() >= 2:
            draw_polyline(scaled, Color(0.42, 0.46, 0.34, 0.95), 2.0, false)
    for water in layout.get("waters", []):
        if str(water.get("shape", "")) == "pond":
            var center := _v(water.get("center", []))
            var radii := _v(water.get("radii", []))
            _draw_ellipse(center, radii + Vector2(10, 10), Color(0.77, 0.73, 0.50), frame, extent)
            _draw_ellipse(center, radii, Color(0.39, 0.70, 0.81), frame, extent)
        else:
            var points: Array = water.get("points", [])
            var radius := float(water.get("radius", 30.0))
            _draw_stroke(points, radius + 10.0, Color(0.77, 0.73, 0.50), frame, extent)
            _draw_stroke(points, radius, Color(0.39, 0.70, 0.81), frame, extent)
    for road in layout.get("roads", []):
        var points: Array = road.get("points", [])
        var radius := float(road.get("radius", 13.0))
        var profile: Array = road.get("width_profile", [])
        _draw_profile_stroke(points, radius + 3.0, profile, Color(0.67, 0.72, 0.45), frame, extent)
        _draw_profile_stroke(points, radius, profile, Color(0.86, 0.73, 0.53), frame, extent)
    # Central village courtyard and two smaller gathering yards share world coordinates.
    for court in layout.get("courtyards", []):
        var center := _v(court.get("center", []))
        var radii := _v(court.get("radii", [60, 35]))
        var kind := str(court.get("kind", ""))
        _draw_ellipse(center, radii + Vector2(6, 5), Color(0.65, 0.69, 0.45), frame, extent)
        var tint := Color(0.78, 0.72, 0.59) if kind == "cobblestone" else Color(0.79, 0.67, 0.48)
        _draw_ellipse(center, radii, tint, frame, extent)
    for bridge in layout.get("bridges", []):
        var center := _v(bridge.get("position", []))
        var bridge_size := _v(bridge.get("size", [128, 26]))
        var p := _pin(center - bridge_size * 0.5, frame, extent)
        var dims := bridge_size / extent * frame.size
        draw_rect(Rect2(p, dims), Color(0.47, 0.31, 0.21))
        draw_rect(Rect2(p, dims).grow(-0.7), Color(0.83, 0.62, 0.36))
    for obj in layout.get("objects", []):
        var p := _pin(_v(obj.get("position", [])), frame, extent)
        var kind := str(obj.get("kind", ""))
        var dot_color := Color(0.20, 0.31, 0.23)
        var radius := 1.3
        if kind == "house":
            dot_color = Color(0.78, 0.62, 0.39)
            radius = 3.0
        elif kind in ["fishing", "plant", "bench"]:
            dot_color = Color(0.94, 0.92, 0.71)
            radius = 2.0
        draw_circle(p, radius, dot_color)
    if is_instance_valid(actor):
        var p := actor.global_position
        var safe := Vector2(clampf(p.x, 0.0, extent.x), clampf(p.y, 0.0, extent.y))
        draw_circle(_pin(safe, frame, extent), 3.5, Color(0.97, 0.26, 0.19))
    draw_rect(frame, Color(0.96, 0.89, 0.74), false, 2.0)


func _draw_profile_stroke(raw: Array, radius_world: float, profile: Array, paint: Color, frame: Rect2, extent: Vector2) -> void:
    var smooth: PackedVector2Array = geometry_provider.call("_smooth_path", raw)
    if smooth.size() < 2:
        return
    var total := 0.0
    for i in range(smooth.size() - 1):
        total += smooth[i].distance_to(smooth[i + 1])
    var travelled := 0.0
    for i in range(smooth.size() - 1):
        var a := smooth[i]
        var b := smooth[i + 1]
        var progress := travelled / maxf(total, 1.0)
        var scale: float = geometry_provider.call("_width_scale", profile, progress)
        var width := maxf(1.0, radius_world * 2.0 * scale * frame.size.x / extent.x)
        draw_line(_pin(a, frame, extent), _pin(b, frame, extent), paint, width, false)
        travelled += a.distance_to(b)


func _draw_stroke(raw: Array, radius_world: float, paint: Color, frame: Rect2, extent: Vector2) -> void:
    var smooth: PackedVector2Array = geometry_provider.call("_smooth_path", raw)
    if smooth.size() < 2:
        return
    var points := PackedVector2Array()
    for point in smooth:
        points.append(_pin(point, frame, extent))
    var width := 2.0 * radius_world * frame.size.x / extent.x
    draw_polyline(points, paint, maxf(1.0, width), false)


func _draw_ellipse(center: Vector2, radii: Vector2, paint: Color, frame: Rect2, extent: Vector2) -> void:
    var points := PackedVector2Array()
    for i in range(24):
        var angle := TAU * float(i) / 24.0
        points.append(_pin(center + Vector2(radii.x * cos(angle), radii.y * sin(angle)), frame, extent))
    draw_colored_polygon(points, paint)


func _pin(point: Vector2, frame: Rect2, extent: Vector2) -> Vector2:
    return frame.position + Vector2(point.x / extent.x * frame.size.x, point.y / extent.y * frame.size.y)


func _v(raw: Array) -> Vector2:
    if raw.size() < 2:
        return Vector2.ZERO
    return Vector2(float(raw[0]), float(raw[1]))
