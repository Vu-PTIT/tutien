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
    material.set_shader_parameter("world_extent", world_extent)
    polygon.material = material
    add_child(polygon)


func _ribbon(points: Array, radius: float) -> PackedVector2Array:
    var left := PackedVector2Array()
    var right := PackedVector2Array()
    for i in range(points.size()):
        var p := _v(points[i])
        var prev := _v(points[maxi(0, i - 1)])
        var following := _v(points[mini(i + 1, points.size() - 1)])
        var tangent := (following - prev).normalized()
        var normal := Vector2(-tangent.y, tangent.x)
        left.append(p + normal * radius)
        right.append(p - normal * radius)
    var joined := PackedVector2Array()
    for p in left:
        joined.append(p)
    for i in range(right.size() - 1, -1, -1):
        joined.append(right[i])
    return joined


func _ellipse(center: Vector2, radii: Vector2) -> PackedVector2Array:
    var points := PackedVector2Array()
    for i in range(48):
        var theta := TAU * float(i) / 48.0
        points.append(center + Vector2(cos(theta) * radii.x, sin(theta) * radii.y))
    return points


func _build_surfaces() -> void:
    _surface("L0_Ground", PackedVector2Array([Vector2.ZERO, Vector2(world_extent.x, 0), world_extent, Vector2(0, world_extent.y)]), 0, -15)
    for lake in layout.get("waters", []):
        var outline := PackedVector2Array()
        if lake.get("shape") == "pond":
            outline = _ellipse(_v(lake.get("center", [])), _v(lake.get("radii", [])) + Vector2(8, 8))
            _surface(str(lake.get("id")) + "_bank", outline, 2, -12)
            outline = _ellipse(_v(lake.get("center", [])), _v(lake.get("radii", [])))
        else:
            var width := float(lake.get("radius", 30))
            _surface(str(lake.get("id")) + "_bank", _ribbon(lake.get("points", []), width + 8), 2, -12)
            outline = _ribbon(lake.get("points", []), width)
        _surface(str(lake.get("id")) + "_water", outline, 3, -11)
    for road in layout.get("roads", []):
        _surface(str(road.get("id", "path")), _ribbon(road.get("points", []), float(road.get("radius", 13))), 1, -8)


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


func _add_static_circle(root: Node2D, p: Vector2, radius: float) -> void:
    var body := StaticBody2D.new()
    body.position = p
    body.collision_layer = 1
    body.collision_mask = 0
    var collider := CollisionShape2D.new()
    var shape := CircleShape2D.new()
    shape.radius = radius
    collider.shape = shape
    body.add_child(collider)
    root.add_child(body)


func _build_water_collision() -> void:
    var collision_root := Node2D.new()
    collision_root.name = "L2_WaterCollision"
    add_child(collision_root)
    for region in layout.get("waters", []):
        if region.get("shape") == "pond":
            var radius := _v(region.get("radii", [50, 40]))
            var center := _v(region.get("center", []))
            for xi in range(-3, 4):
                for yi in range(-2, 3):
                    var offset := Vector2(float(xi) * 15.0, float(yi) * 15.0)
                    if (offset.x * offset.x) / (radius.x * radius.x) + (offset.y * offset.y) / (radius.y * radius.y) < 0.82:
                        _add_static_circle(collision_root, center + offset, 12)
        else:
            var pts: Array = region.get("points", [])
            for index in range(pts.size() - 1):
                var a := _v(pts[index])
                var b := _v(pts[index + 1])
                var steps := maxi(1, ceili(a.distance_to(b) / 21.0))
                for i in range(steps + 1):
                    _add_static_circle(collision_root, a.lerp(b, float(i) / float(steps)), float(region.get("radius", 30)) * 0.86)


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
    minimap.call("configure", layout, player)
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
