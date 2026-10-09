extends Node2D

# M1 non-TileMap playable slice. Legacy village_demo.gd is kept intact.
const DATA_PATH := "res://data/layered_village_m1.json"
const PROP_SCRIPT := preload("res://scripts/layered_prop.gd")
const PLAYER_SCRIPT := preload("res://scripts/layered_player.gd")
const MINI_SCRIPT := preload("res://scripts/layered_minimap.gd")
const RASTER_SCRIPT := preload("res://scripts/layered_raster_chunks.gd")
const LANDFORM_SCRIPT := preload("res://scripts/layered_landforms.gd")
const WATER_FX_SCRIPT := preload("res://scripts/layered_water_fx.gd")
const CLIFF_DETAIL_SCRIPT := preload("res://scripts/layered_cliff_details.gd")
const SURFACE_SHADER := preload("res://shaders/layered_surface.gdshader")
const FONT := preload("res://assets/fonts/BeVietnamPro-Regular.ttf")

var layout: Dictionary = {}
var player: CharacterBody2D
var props: Array[Node2D] = []
var label: Label
var _selected_seat: Node2D
var _tick := 0.0
var _status_until_ms := 0
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
    _build_landforms()
    _build_ambient_environment()
    _build_raster_details()
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

    # M1.4: a central gathering place and two smaller yards.
    # Edges use freeform ellipses (not rectangular pasted map snippets).
    # The courtyard ring renders over through-paths so every approach feels
    # part of one connected hamlet instead of a boxed central starter map.
    for court in layout.get("courtyards", []):
        var key := str(court.get("id", "courtyard"))
        var center := _v(court.get("center", [0, 0]))
        var radii := _v(court.get("radii", [60, 35]))
        var seed := float(court.get("seed", 0.0))
        var kind := 9 if str(court.get("kind", "")) == "cobblestone" else 10
        _surface(key + "_grass_fringe", _ellipse(center, radii + Vector2(9, 7), seed), 11, -7)
        _surface(key + "_paving", _ellipse(center, radii, seed), kind, -6)


func _build_landforms() -> void:
    var landforms := Node2D.new()
    landforms.name = "L2_Landforms_Bridges_Shorelines"
    landforms.set_script(LANDFORM_SCRIPT)
    add_child(landforms)
    landforms.call("configure", layout, self, water_polygons)


func _build_ambient_environment() -> void:
    var cliff := Node2D.new()
    cliff.name = "L2_CliffArtDetails"
    cliff.set_script(CLIFF_DETAIL_SCRIPT)
    add_child(cliff)
    cliff.call("configure", layout, self)
    var water := Node2D.new()
    water.name = "L2_AnimatedWaterAccents"
    water.set_script(WATER_FX_SCRIPT)
    add_child(water)
    water.call("set_bridges", layout.get("bridges", []))
    water.call("configure", layout, water_polygons)


func _build_raster_details() -> void:
    var brush := Node2D.new()
    brush.name = "L1_RasterBrushChunks"
    brush.set_script(RASTER_SCRIPT)
    brush.z_index = -7
    add_child(brush)
    brush.call("configure", layout, water_polygons)


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
        var visible_polygon: PackedVector2Array = water_polygons[key]
        if visible_polygon.size() < 3:
            continue
        var parts: Array[PackedVector2Array] = [visible_polygon]
        # Remove ONLY the covered bridge corridor from collision. Water
        # remains visually continuous below the independently drawn deck.
        # Geometry2D difference returns separate upstream/downstream pieces,
        # so no empty "walkable river" exists outside the bridge.
        for bridge in layout.get("bridges", []):
            if str(bridge.get("water_id", "")) != str(key):
                continue
            var center := _v(bridge.get("position", [0, 0]))
            var span := _v(bridge.get("size", [110, 24]))
            var gap := float(bridge.get("collision_gap", 23))
            var left := center.x - span.x * 0.5
            var right := center.x + span.x * 0.5
            var top := center.y - gap
            var bottom := center.y + gap
            var cutout := PackedVector2Array([
                Vector2(left, top), Vector2(right, top),
                Vector2(right, bottom), Vector2(left, bottom)])
            var remaining: Array[PackedVector2Array] = []
            for part in parts:
                var fragments: Array[PackedVector2Array] = Geometry2D.clip_polygons(part, cutout)
                for shape in fragments:
                    if shape.size() >= 3:
                        remaining.append(shape)
            parts = remaining
        for i in range(parts.size()):
            var body := StaticBody2D.new()
            body.name = "SolidWater_%s_%d" % [str(key), i]
            body.collision_layer = 1
            body.collision_mask = 0
            var collider := CollisionPolygon2D.new()
            collider.build_mode = CollisionPolygon2D.BUILD_SOLIDS
            collider.polygon = parts[i]
            body.add_child(collider)
            collision_root.add_child(body)


func _build_hud() -> void:
    var canvas := CanvasLayer.new()
    canvas.name = "LayeredMapHUD"
    canvas.layer = 20
    add_child(canvas)
    var panel := PanelContainer.new()
    panel.name = "InfoPanel"
    panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
    panel.position = Vector2(14, 14)
    panel.custom_minimum_size = Vector2(472, 78)
    var card := StyleBoxFlat.new()
    card.bg_color = Color(0.095, 0.16, 0.14, 0.91)
    card.border_color = Color(0.82, 0.75, 0.53, 0.98)
    card.set_border_width_all(2)
    card.set_corner_radius_all(3)
    card.content_margin_left = 14
    card.content_margin_right = 14
    card.content_margin_top = 9
    card.content_margin_bottom = 9
    panel.add_theme_stylebox_override("panel", card)
    canvas.add_child(panel)
    label = Label.new()
    label.name = "InfoLabel"
    label.mouse_filter = Control.MOUSE_FILTER_IGNORE
    label.add_theme_font_override("font", FONT)
    label.add_theme_font_size_override("font_size", 15)
    label.add_theme_color_override("font_color", Color(0.97, 0.94, 0.82))
    label.text = "LÀNG LINH KHÊ · BẢN THỬ PIXEL\nWASD: đi lại · E: tương tác · Cuộn chuột: zoom"
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
    if player == null or label == null:
        return
    _tick += delta
    if _tick < 0.15:
        return
    _tick = 0.0
    if Time.get_ticks_msec() < _status_until_ms:
        return
    if bool(player.get("seated")):
        label.text = "ĐANG NGỒI NGHỈ · BẢN DEMO OFFLINE\n[E] đứng dậy"
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
        label.text = "LÀNG LINH KHÊ · KHÁM PHÁ\n[E] %s" % str(closest.get("display_name"))
    else:
        label.text = "LÀNG LINH KHÊ · BẢN THỬ PIXEL\nWASD: đi lại · E: tương tác · Cuộn chuột: zoom"


func _unhandled_input(event: InputEvent) -> void:
    if not event is InputEventKey or not event.pressed or event.echo or event.keycode != KEY_E:
        return
    if bool(player.get("seated")):
        player.call("leave_seat")
        label.text = "Bạn đã đứng dậy. Dữ liệu chưa lưu lên server."
        _status_until_ms = Time.get_ticks_msec() + 2300
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
        _status_until_ms = Time.get_ticks_msec() + 3000
        get_viewport().set_input_as_handled()


func _v(raw: Array) -> Vector2:
    if raw.size() < 2:
        return Vector2.ZERO
    return Vector2(float(raw[0]), float(raw[1]))
