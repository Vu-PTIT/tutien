extends Node2D

# M1.9 village identity zones. This is scene metadata / optional triggers,
# not a quest system, server state, or new collision barrier.
# Rectangular trigger footprints are broad; the UI chooses the best zone
# using the authored elliptical footprint for predictable overlaps.
var zone_count := 0
var _zones: Array[Dictionary] = []


func configure(data: Dictionary) -> void:
    _zones.clear()
    for record in data.get("cultural_zones", []):
        var info: Dictionary = record
        var id := str(info.get("id", ""))
        var center := _vec(info.get("center", []))
        var radii := _vec(info.get("radii", []))
        if id.is_empty() or radii.x <= 0.0 or radii.y <= 0.0:
            push_error("Invalid cultural zone: " + id)
            continue
        var area := Area2D.new()
        area.name = "Zone_" + id
        area.position = center
        area.collision_layer = 0
        area.collision_mask = 2
        area.monitoring = true
        area.monitorable = false
        var collider := CollisionShape2D.new()
        var rectangle := RectangleShape2D.new()
        rectangle.size = radii * 2.0
        collider.shape = rectangle
        area.add_child(collider)
        add_child(area)
        _zones.append(info)
    zone_count = _zones.size()


func zone_at(point: Vector2) -> Dictionary:
    var chosen: Dictionary = {}
    var closest := INF
    for info in _zones:
        var center := _vec(info.get("center", []))
        var radii := _vec(info.get("radii", []))
        var delta := point - center
        var normalized := delta.x * delta.x / (radii.x * radii.x) + delta.y * delta.y / (radii.y * radii.y)
        if normalized > 1.0 or normalized >= closest:
            continue
        closest = normalized
        chosen = info
    return chosen


func localized_name(info: Dictionary) -> String:
    if info.is_empty():
        return "ĐƯỜNG LÀNG"
    var use_english := TranslationServer.get_locale().begins_with("en")
    if use_english:
        return str(info.get("name_en", info.get("name", "")))
    return str(info.get("name", ""))


func _vec(raw: Array) -> Vector2:
    if raw.size() < 2:
        return Vector2.ZERO
    return Vector2(float(raw[0]), float(raw[1]))
