extends Node2D

# M1.5 ambient art: light-weight water surface accents. The underlying
# geometry, physics and activity slots are NOT changed by these visuals.
# One canvas item draws all ripples (no per-ripple Nodes/TileMap).
var ripple_count := 0
var foam_count := 0
var _ripples: Array[Dictionary] = []
var _foam: Array[Dictionary] = []
var _time := 0.0
var _redraw_elapsed := 0.0
var _animation_enabled := true
var _world_bounds := Vector2(1120.0, 800.0)


func configure(data: Dictionary, polygons: Dictionary) -> void:
    texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    z_index = -7
    _world_bounds = _vec(data.get("size", [1120, 800]))
    _ripples.clear()
    _foam.clear()
    _time = 0.0
    var effects: Array = data.get("water_fx", [])
    for effect in effects:
        var id := str(effect.get("water_id", ""))
        if not polygons.has(id):
            push_warning("Ambient water references unknown water body: " + id)
            continue
        var outline: PackedVector2Array = polygons[id]
        if outline.size() < 3:
            continue
        var random := RandomNumberGenerator.new()
        random.seed = 21101 + absi(id.hash())
        _place_ripples(effect, outline, random)
        _place_shore_foam(effect, outline, random)
    ripple_count = _ripples.size()
    foam_count = _foam.size()
    set_process(ripple_count > 0 or foam_count > 0)
    queue_redraw()


func set_animation_enabled(value: bool) -> void:
    _animation_enabled = value
    set_process(value and (ripple_count > 0 or foam_count > 0))
    queue_redraw()


func _place_ripples(effect: Dictionary, outline: PackedVector2Array, random: RandomNumberGenerator) -> void:
    var minimum := Vector2(INF, INF)
    var maximum := Vector2(-INF, -INF)
    for point in outline:
        minimum = Vector2(minf(minimum.x, point.x), minf(minimum.y, point.y))
        maximum = Vector2(maxf(maximum.x, point.x), maxf(maximum.y, point.y))
    var target_count := clampi(int(effect.get("ripple_count", 20)), 0, 150)
    var added := 0
    var flow := float(effect.get("flow_speed", 0.3))
    for _attempt in range(target_count * 28):
        if added >= target_count:
            break
        var p := Vector2(random.randf_range(minimum.x, maximum.x),
            random.randf_range(minimum.y, maximum.y))
        if not _in_world(p) or not Geometry2D.is_point_in_polygon(p, outline):
            continue
        if _near_bridge(p):
            continue
        # Constrain ripple length so fragments stay in water, not on sand.
        var half_width := random.randf_range(3.0, 6.0)
        var left := p - Vector2(half_width + 3.0, 0.0)
        var right := p + Vector2(half_width + 3.0, 0.0)
        if not Geometry2D.is_point_in_polygon(left, outline) or not Geometry2D.is_point_in_polygon(right, outline):
            continue
        _ripples.append({
            "position": p.round(), "width": half_width,
            "phase": random.randf() * TAU,
            "speed": random.randf_range(0.72, 1.21),
            "flow": flow
        })
        added += 1


func _place_shore_foam(effect: Dictionary, polygon: PackedVector2Array, random: RandomNumberGenerator) -> void:
    var stride := clampi(int(effect.get("foam_stride", 7)), 4, 16)
    # Short, discontinuous highlights follow the actual authored coastline.
    # They are decorative only. No water collision/polygon recomputation.
    for i in range(3, polygon.size() - 5, stride):
        var p := polygon[i]
        if not _in_world(p) or _near_bridge(p):
            continue
        if random.randf() > 0.76:
            continue
        var previous := polygon[maxi(0, i - 2)]
        var next := polygon[mini(i + 2, polygon.size() - 1)]
        var tangent := (next - previous).normalized()
        if tangent.length_squared() < 0.25:
            continue
        var width := random.randf_range(2.0, 6.0)
        var center := p + tangent * random.randf_range(-2.0, 2.0)
        _foam.append({
            "from": (center - tangent * width).round(),
            "to": (center + tangent * width).round(),
            "phase": random.randf() * TAU
        })


func _near_bridge(point: Vector2) -> bool:
    # The central bridge deck already provides its own highlights.
    # Coordinates are supplied in world space via the shared map data.
    for bridge in _bridges:
        var center: Vector2 = bridge["center"]
        var size: Vector2 = bridge["size"]
        if absf(point.x - center.x) < size.x * 0.55 and absf(point.y - center.y) < size.y * 1.15:
            return true
    return false


var _bridges: Array[Dictionary] = []


func set_bridges(data: Array) -> void:
    _bridges.clear()
    for bridge in data:
        _bridges.append({
            "center": _vec(bridge.get("position", [0, 0])),
            "size": _vec(bridge.get("size", [128, 26]))
        })


func _in_world(point: Vector2) -> bool:
    return point.x >= 5.0 and point.y >= 5.0 and point.x < _world_bounds.x - 5.0 and point.y < _world_bounds.y - 5.0


func _process(delta: float) -> void:
    if not _animation_enabled:
        return
    _time += delta
    _redraw_elapsed += delta
    if _redraw_elapsed >= 0.11:
        _redraw_elapsed = 0.0
        queue_redraw()


func _draw() -> void:
    for foam in _foam:
        var phase := float(foam["phase"])
        var pulse := 0.36 + 0.16 * sin(_time * 1.25 + phase)
        var from: Vector2 = foam["from"]
        var to: Vector2 = foam["to"]
        draw_line(from, to, Color(0.83, 0.93, 0.80, pulse), 1.0, false)
    for ripple in _ripples:
        var phase := float(ripple["phase"])
        var center: Vector2 = ripple["position"]
        var width := float(ripple["width"])
        var speed := float(ripple["speed"])
        var flow := float(ripple["flow"])
        # Sub-pixel motion is snapped to whole art pixels before drawing.
        var displacement := Vector2(0.0, roundf(sin(_time * flow * speed + phase) * 2.0))
        var alpha := 0.30 + 0.21 * sin(_time * 1.1 * speed + phase)
        var a := (center - Vector2(width, 0.0) + displacement).round()
        var b := (center + Vector2(width, 0.0) + displacement).round()
        draw_line(a, b, Color(0.86, 0.96, 0.93, maxf(0.09, alpha)), 1.0, false)
        if width >= 4.3:
            var faint := Color(0.62, 0.87, 0.88, maxf(0.05, alpha * 0.43))
            draw_line(a + Vector2(2, 2), b + Vector2(-2, 2), faint, 1.0, false)


func _vec(raw: Array) -> Vector2:
    if raw.size() < 2:
        return Vector2.ZERO
    return Vector2(float(raw[0]), float(raw[1]))
