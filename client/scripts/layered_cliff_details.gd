extends Node2D

# M1.5 static cliff-face detailing. Uses the same hand-authored ridge splines as
# the terrain walls; a single CanvasItem draws sparse stone/moss highlights.
# This does not change collider height, map coordinates or player navigation.
var detail_count := 0
var _details: Array[Dictionary] = []


func configure(layout: Dictionary, geometry: Node2D) -> void:
    texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    z_index = -11
    _details.clear()
    for terrace in layout.get("terraces", []):
        var raw: Array = terrace.get("edge", [])
        if raw.size() < 2:
            continue
        var edge: PackedVector2Array = geometry.call("_smooth_path", raw)
        var depth := float(terrace.get("depth", 16.0))
        var random := RandomNumberGenerator.new()
        random.seed = 9281 + absi(str(terrace.get("id", "terrace")).hash())
        for i in range(3, edge.size() - 2, 5):
            if random.randf() >= 0.72:
                continue
            var p := edge[i].round()
            var kind := random.randi_range(0, 2)
            _details.append({
                "point": p, "depth": depth, "kind": kind,
                "size": random.randi_range(3, 8)
            })
    detail_count = _details.size()
    queue_redraw()


func _draw() -> void:
    for item in _details:
        var p: Vector2 = item["point"]
        var depth := float(item["depth"])
        var kind := int(item["kind"])
        var size := int(item["size"])
        if kind == 0:
            # Short natural cracks, staggered rather than a continuous stripe.
            draw_line(p + Vector2(0, 3), p + Vector2(-1, 7),
                Color(0.36, 0.37, 0.28, 0.88), 1.0, false)
            draw_line(p + Vector2(-1, 7), p + Vector2(2, minf(depth - 2.0, 11.0)),
                Color(0.43, 0.39, 0.29, 0.72), 1.0, false)
            draw_line(p + Vector2(3, 2), p + Vector2(float(size), 2),
                Color(0.79, 0.70, 0.48, 0.65), 1.0, false)
        elif kind == 1:
            # Pixel-sized moss tufts growing from the ledge, not from a tile.
            draw_line(p + Vector2(-3, 1), p + Vector2(-3, -3),
                Color(0.31, 0.56, 0.29, 0.88), 2.0, false)
            draw_line(p + Vector2(1, 1), p + Vector2(1, -2),
                Color(0.40, 0.68, 0.35, 0.89), 2.0, false)
            draw_line(p + Vector2(-5, 2), p + Vector2(4, 2),
                Color(0.35, 0.54, 0.28, 0.75), 1.0, false)
        else:
            # A loose pebble with a 1px cast shadow at the base of the cliff.
            var base := p + Vector2(0, depth + 4.0)
            draw_rect(Rect2(base + Vector2(-3, 1), Vector2(7, 2)),
                Color(0.25, 0.36, 0.28, 0.33), true)
            draw_rect(Rect2(base + Vector2(-2, -1), Vector2(5, 3)),
                Color(0.63, 0.60, 0.47, 0.91), true)
            draw_line(base + Vector2(-2, -1), base + Vector2(1, -1),
                Color(0.83, 0.76, 0.58, 0.93), 1.0, false)
