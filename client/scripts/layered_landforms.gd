extends Node2D

# M1.3 terrain. These are authored landform outlines in WORLD PIXELS, not tile
# coordinates. Rendering, collision and minimap all consume the same JSON IDs.
const SURFACE_SHADER := preload("res://shaders/layered_surface.gdshader")
var _layout: Dictionary = {}
var _geometry: Node2D
var terrace_count := 0
var bridge_count := 0
var shoreline_count := 0


func configure(data: Dictionary, geometry: Node2D, water_polygons: Dictionary) -> void:
    _layout = data
    _geometry = geometry
    _build_terraces()
    _build_shoreline_contours(water_polygons)
    _build_bridges()


func _surface(name: String, outline: PackedVector2Array, kind: int, order: int) -> void:
    if outline.size() < 3:
        return
    var node := Polygon2D.new()
    node.name = name
    node.polygon = outline
    node.z_index = order
    node.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    var material := ShaderMaterial.new()
    material.shader = SURFACE_SHADER
    material.set_shader_parameter("surface_kind", kind)
    node.material = material
    add_child(node)


func _outline(name: String, positions: PackedVector2Array, color: Color, width: float, layer: int, closed_shape: bool = false) -> void:
    if positions.size() < 2:
        return
    var stroke := Line2D.new()
    stroke.name = name
    stroke.points = positions
    stroke.closed = closed_shape
    stroke.width = width
    stroke.default_color = color
    stroke.antialiased = false
    stroke.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    stroke.z_index = layer
    add_child(stroke)


func _build_terraces() -> void:
    var extent := _v(_layout.get("size", [1120, 800]))
    for terrace in _layout.get("terraces", []):
        var key := str(terrace.get("id", "terrace"))
        var edge: PackedVector2Array = _geometry.call("_smooth_path", terrace.get("edge", []))
        if edge.size() < 2:
            continue
        var depth := float(terrace.get("depth", 16.0))
        var upper := PackedVector2Array()
        if str(terrace.get("side", "north")) == "south":
            for p in edge:
                upper.append(p)
            upper.append(Vector2(edge[edge.size() - 1].x, extent.y + 20.0))
            upper.append(Vector2(edge[0].x, extent.y + 20.0))
        else:
            upper.append(Vector2(edge[0].x, -20.0))
            upper.append(Vector2(edge[edge.size() - 1].x, -20.0))
            for i in range(edge.size() - 1, -1, -1):
                upper.append(edge[i])
        _surface(key + "_grass", upper, 7, -14)

        # The vertical cut is measured from the exact top ridge points; physics
        # blocks only this narrow rock face, never the entire plateau polygon.
        var face := PackedVector2Array()
        for p in edge:
            face.append(p)
        for i in range(edge.size() - 1, -1, -1):
            face.append(edge[i] + Vector2(0.0, depth))
        _surface(key + "_stone_face", face, 8, -13)
        var lip := PackedVector2Array()
        var lower := PackedVector2Array()
        for p in edge:
            lip.append(p + Vector2(0.0, -1.0))
            lower.append(p + Vector2(0.0, depth + 1.0))
        _outline(key + "_grass_lip", lip, Color(0.37, 0.55, 0.32), 3.0, -12)
        _outline(key + "_face_shadow", lower, Color(0.29, 0.36, 0.27, 0.87), 4.0, -12)
        if bool(terrace.get("collision", false)):
            var wall := StaticBody2D.new()
            wall.name = "TerraceWall_" + key
            wall.collision_layer = 1
            wall.collision_mask = 0
            var shape := CollisionPolygon2D.new()
            shape.build_mode = CollisionPolygon2D.BUILD_SOLIDS
            shape.polygon = face
            wall.add_child(shape)
            add_child(wall)
        terrace_count += 1


func _build_shoreline_contours(water_polygons: Dictionary) -> void:
    for id in water_polygons:
        var polygon: PackedVector2Array = water_polygons[id]
        # Sand verge already sits behind water; these 1-3px boundaries add
        # bank depth without jagged autotiles. The same outline is used for physics.
        _outline(str(id) + "_wet_sand", polygon, Color(0.79, 0.79, 0.56), 5.0, -10, true)
        _outline(str(id) + "_deep_water_edge", polygon, Color(0.25, 0.57, 0.66, 0.83), 2.0, -9, true)
        shoreline_count += 1


func _rect(name: String, rectangle: Rect2, color: Color) -> void:
    var node := Polygon2D.new()
    node.name = name
    node.color = color
    node.polygon = PackedVector2Array([
        rectangle.position,
        Vector2(rectangle.end.x, rectangle.position.y),
        rectangle.end,
        Vector2(rectangle.position.x, rectangle.end.y)])
    node.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    node.z_index = -6
    add_child(node)


func _rail_collider(name: String, center: Vector2, width: float) -> void:
    var wall := StaticBody2D.new()
    wall.name = name
    wall.collision_layer = 1
    wall.collision_mask = 0
    wall.position = center
    var collider := CollisionShape2D.new()
    var shape := RectangleShape2D.new()
    shape.size = Vector2(width, 3.0)
    collider.shape = shape
    wall.add_child(collider)
    add_child(wall)


func _build_bridges() -> void:
    for bridge in _layout.get("bridges", []):
        var id := str(bridge.get("id", "bridge"))
        var point := _v(bridge.get("position", [0, 0]))
        var dimensions := _v(bridge.get("size", [128, 26]))
        var left := roundi(point.x - dimensions.x * 0.5)
        var half_height := roundi(dimensions.y * 0.5)
        var top := roundi(point.y) - half_height
        var span := roundi(dimensions.x)
        _rect(id + "_shadow", Rect2(left - 2, top + 2, span + 4, half_height * 2 + 6), Color(0.13, 0.29, 0.29, 0.53))
        _rect(id + "_frame", Rect2(left, top, span, half_height * 2 + 1), Color(0.31, 0.24, 0.16))
        # Perpendicular beams laid along a continuous deck. This is a handcrafted
        # scene component, NOT a 16px TileMap path or a background screenshot.
        for x in range(left + 3, left + span - 4, 8):
            var tint := Color(0.78, 0.58, 0.33) if (x / 8) % 3 == 0 else Color(0.69, 0.49, 0.29)
            _rect(id + "_plank_%d" % x, Rect2(x, top + 3, 6, half_height * 2 - 5), tint)
            _rect(id + "_plank_light_%d" % x, Rect2(x, top + 3, 6, 2), Color(0.87, 0.70, 0.43))
            _rect(id + "_plank_seam_%d" % x, Rect2(x + 6, top + 3, 1, half_height * 2 - 5), Color(0.42, 0.33, 0.20))
        for side in [-1, 1]:
            var rail_y := roundi(point.y) + side * (half_height + 4)
            _rect(id + "_rail_%d" % side, Rect2(left - 2, rail_y, span + 4, 3), Color(0.39, 0.26, 0.16))
            _rect(id + "_rail_light_%d" % side, Rect2(left - 2, rail_y, span + 4, 1), Color(0.83, 0.66, 0.38))
            for x in range(left + 3, left + span, 27):
                _rect(id + "_post_%d_%d" % [side, x], Rect2(x, rail_y - 5, 5, 12), Color(0.56, 0.37, 0.22))
                _rect(id + "_post_light_%d_%d" % [side, x], Rect2(x, rail_y - 5, 2, 9), Color(0.85, 0.63, 0.36))
            _rail_collider("BridgeRail_%s_%d" % [id, side], Vector2(point.x, rail_y + 1), dimensions.x - 5.0)
        bridge_count += 1


func _v(raw: Array) -> Vector2:
    if raw.size() < 2:
        return Vector2.ZERO
    return Vector2(float(raw[0]), float(raw[1]))
