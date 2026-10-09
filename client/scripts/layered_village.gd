extends Node2D

# M1 non-TileMap playable slice. Legacy village_demo.gd is kept intact.
const DATA_PATH := "res://data/layered_village_m1.json"
const PROP_SCRIPT := preload("res://scripts/layered_prop.gd")
const PLAYER_SCRIPT := preload("res://scripts/layered_player.gd")
const MINI_SCRIPT := preload("res://scripts/layered_minimap.gd")
const SURFACE_SHADER := preload("res://shaders/layered_surface.gdshader")
const FONT := preload("res://assets/fonts/BeVietnamPro-Regular.ttf")

var layout: Dictionary = {}
var player: CharacterBody2D
var props: Array[Node2D] = []
var label: Label
var _selected_seat: Node2D
var _tick := 0.0
var world_extent := Vector2(1120.0, 800.0)
var water_polygons: Dictionary = {}


func _ready() -> void:
    var data := FileAccess.get_file_as_string(DATA_PATH)
    var parsed: Variant = JSON.parse_string(data)
    if typeof(parsed) != TYPE_DICTIONARY:
        push_error("Invalid layered map: " + DATA_PATH)
        return
    layout = parsed
    world_extent = _v(layout.get("size", [1120, 800]))
    _build_surfaces()
    _build_props_and_player()
    _build_water_collision()
    _build_hud()


func _surface(name: String, points: PackedVector2Array, kind: int, order: int) -> void:
    if points.size() < 3:
        return
    var polygon := Polygon2D.new()
    polygon.name = name
    polygon.polygon = points
    polygon.z_index = order
    polygon.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    var material := ShaderMaterial.new()
    material.shader = SURFACE_SHADER
    material.set_shader_parameter("surface_kind", kind)
    polygon.material = material
    add_child(polygon)


func _spline_point(a: Vector2, b: Vector2, c: Vector2, d: Vector2, t: float) -> Vector2:
    var t2 := t * t
    var t3 := t2 * t
    return (b * 2.0 + (c - a) * t + (a * 2.0 - b * 5.0 + c * 4.0 - d) * t2 + (-a + b * 3.0 - c * 3.0 + d) * t3) * 0.5


func _smooth_path(raw: Array) -> PackedVector2Array:
    var smoothed := PackedVector2Array()
    if raw.size() < 2:
        return smoothed
    for i in range(raw.size() - 1):
        var a := _v(raw[maxi(0, i - 1)])
        var b := _v(raw[i])
        var c := _v(raw[i + 1])
        var d := _v(raw[mini(raw.size() - 1, i + 2)])
        var steps := maxi(2, ceili(b.distance_to(c) / 8.0))
        for step in range(steps):
            smoothed.append(_spline_point(a, b, c, d, float(step) / float(steps)))
    smoothed.append(_v(raw[raw.size() - 1]))
    return smoothed


func _ribbon(raw: Array, radius: float, roughness: float = 1.0) -> PackedVector2Array:
    var points := _smooth_path(raw)
    if points.size() < 2:
        return PackedVector2Array()
    var left := PackedVector2Array()
    var right := PackedVector2Array()
    for i in range(points.size()):
        var p := points[i]
        var prev := points[maxi(0, i - 1)]
        var next := points[mini(i + 1, points.size() - 1)]
        var direction := (next - prev).normalized()
        var n := Vector2(-direction.y, direction.x)
        # Bends are continuously interpolated; small irregular shore/road edges
        # are baked as world-pixel vertices, not as rectangular Wang cells.
        var a := roughness * (2.0 * sin(float(i) * 0.63) + sin(float(i) * 0.21))
        var b := roughness * (2.0 * sin(float(i) * 0.72 + 2.1) + sin(float(i) * 0.31 + 1.2))
        left.append((p + n * maxf(3.0, radius + a)).round())
        right.append((p - n * maxf(3.0, radius + b)).round())
    var polygon := PackedVector2Array()
    for p in left:
        polygon.append(p)
    for i in range(right.size() - 1, -1, -1):
        polygon.append(right[i])
    return polygon


func _ellipse(center: Vector2, radii: Vector2, seed: float = 0.0) -> PackedVector2Array:
    var points := PackedVector2Array()
    for i in range(72):
        var theta := TAU * float(i) / 72.0
        var outline := 1.0 + 0.045 * sin(5.0 * theta + seed) + 0.038 * sin(9.0 * theta + 1.7 + seed)
        points.append((center + Vector2(cos(theta) * radii.x * outline, sin(theta) * radii.y * outline)).round())
    return points


func _water_polygon(region: Dictionary, extra_radius: float = 0.0) -> PackedVector2Array:
    if str(region.get("shape", "")) == "pond":
        return _ellipse(_v(region.get("center", [])), _v(region.get("radii", [])) + Vector2.ONE * extra_radius, 4.3)
    return _ribbon(region.get("points", []), float(region.get("radius", 30.0)) + extra_radius, 1.2)


func _build_surfaces() -> void:
    var ground := PackedVector2Array([
        Vector2.ZERO, Vector2(world_extent.x, 0.0), world_extent, Vector2(0.0, world_extent.y)])
    _surface("L0_Ground", ground, 0, -15)

    # Author-selected grass clearings and plantable soil; no repeating TileMap.
    for patch in layout.get("terrain_patches", []):
        var center := _v(patch.get("center", []))
        var radii := _v(patch.get("radii", [30, 18]))
        var kind := str(patch.get("kind", ""))
        var material_kind := 4
        if kind == "soil":
            material_kind = 5
        elif kind == "meadow":
            material_kind = 0
        _surface(str(patch.get("id", "patch")), _ellipse(center, radii, float(patch.get("seed", 0))), material_kind, -14)

    water_polygons.clear()
    for water in layout.get("waters", []):
        var key := str(water.get("id", "water"))
        _surface(key + "_bank", _water_polygon(water, 10.0), 2, -12)
        var body := _water_polygon(water)
        water_polygons[key] = body
        _surface(key + "_water", body, 3, -11)

    for road in layout.get("roads", []):
        var key := str(road.get("id", "road"))
        var radius := float(road.get("radius", 13))
        var points: Array = road.get("points", [])
        _surface(key + "_verge", _ribbon(points, radius + 4.0, 1.25), 6, -9)
        _surface(key, _ribbon(points, radius, 1.0), 1, -8)


func _build_props_and_player() -> void:
    var sorted := Node2D.new()
    sorted.name = "L3_YSort_Props_and_Player"
    sorted.y_sort_enabled = true
    add_child(sorted)
    for obj in layout.get("objects", []):
        var prop := Node2D.new()
        prop.set_script(PROP_SCRIPT)
        prop.call("configure", obj)
        sorted.add_child(prop)
        props.append(prop)
    player = CharacterBody2D.new()
    player.name = "Player"
    player.set_script(PLAYER_SCRIPT)
    player.position = _v(layout.get("spawn", [470, 510]))
    sorted.add_child(player)
    player.call("set_world_bounds", world_extent)


func _build_water_collision() -> void:
    var collision_root := Node2D.new()
    collision_root.name = "L2_WaterCollision"
    add_child(collision_root)
    for key in water_polygons.keys():
        var polygon: PackedVector2Array = water_polygons[key]
        if polygon.size() < 3:
            continue
        var body := StaticBody2D.new()
        body.name = "SolidWater_" + str(key)
        body.collision_layer = 1
        body.collision_mask = 0
        var collider := CollisionPolygon2D.new()
        collider.build_mode = CollisionPolygon2D.BUILD_SOLIDS
        collider.polygon = polygon
        body.add_child(collider)
        collision_root.add_child(body)


func _build_hud() -> void:
    var canvas := CanvasLayer.new()
    canvas.name = "LayeredMapHUD"
    canvas.layer = 20
    add_child(canvas)
    var panel := PanelContainer.new()
    panel.set_anchors_preset(Control.PRESET_TOP_LEFT)
    panel.position = Vector2(14, 14)
    panel.custom_minimum_size = Vector2(475, 84)
    canvas.add_child(panel)
    label = Label.new()
    label.add_theme_font_override("font", FONT)
    label.add_theme_font_size_override("font_size", 15)
    label.add_theme_color_override("font_color", Color(0.14, 0.20, 0.16))
    label.text = "Làng Linh Khê · Scene-based M1\nWASD: di chuyển · E: tương tác · Cuộn chuột: camera"
    panel.add_child(label)
    var minimap := Control.new()
    minimap.name = "MapOverview"
    minimap.set_script(MINI_SCRIPT)
    minimap.call("configure", layout, player, self)
    minimap.set_anchors_preset(Control.PRESET_TOP_RIGHT)
    minimap.set_offsets_preset(Control.PRESET_TOP_RIGHT)
    minimap.offset_left = -235
    minimap.offset_right = -16
    minimap.offset_top = 16
    minimap.offset_bottom = 184
    canvas.add_child(minimap)


func _process(delta: float) -> void:
    if player == null:
        return
    _tick += delta
    if _tick < 0.15:
        return
    _tick = 0.0
    if bool(player.get("seated")):
        return
    var closest: Node2D
    var distance := INF
    for prop in props:
        if not prop.call("is_in_range", player):
            continue
        var d: float = player.global_position.distance_to(prop.call("action_world_point"))
        if d < distance:
            closest = prop
            distance = d
    if closest != null:
        label.text = "Làng Linh Khê · M1\n[E] %s · WASD để đi lại" % str(closest.get("display_name"))


func _unhandled_input(event: InputEvent) -> void:
    if not event is InputEventKey or not event.pressed or event.echo or event.keycode != KEY_E:
        return
    if bool(player.get("seated")):
        player.call("leave_seat")
        label.text = "Bạn đã đứng dậy. Dữ liệu chưa lưu lên server."
        get_viewport().set_input_as_handled()
        return
    var nearest: Node2D
    var distance := INF
    for prop in props:
        if not prop.call("is_in_range", player):
            continue
        var d: float = player.global_position.distance_to(prop.call("action_world_point"))
        if d < distance:
            nearest = prop
            distance = d
    if nearest != null:
        var result: Dictionary = nearest.call("interact")
        if bool(result.get("sit", false)):
            player.call("sit_at", nearest.call("action_world_point") + Vector2(0, 3))
        label.text = str(result.get("message", ""))
        get_viewport().set_input_as_handled()


func _v(raw: Array) -> Vector2:
    if raw.size() < 2:
        return Vector2.ZERO
    return Vector2(float(raw[0]), float(raw[1]))
