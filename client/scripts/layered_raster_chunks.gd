extends Node2D

# M1.2: real pixel-art raster brushwork from the original licensed source PNGs.
# A zone is a freeform placement hint, not a tile grid. All small decorations in
# each 256px chunk are composited once to one RGBA ImageTexture.
const CHUNK_SIZE := 256
const WFLOWERS := preload("res://assets/tileset/Art/Props/Animation/Flowers_White.png")
const RFLOWERS := preload("res://assets/tileset/Art/Props/Animation/Flowers_Red.png")
const PLANT := preload("res://assets/tileset/Art/Props/Plant_2.png")
const BUSH_SMALL := preload("res://assets/tileset/Art/Trees and Bushes/Bush_Emerald_6.png")
const BUSH_TINY := preload("res://assets/tileset/Art/Trees and Bushes/Bush_Emerald_7.png")
const PEBBLE := preload("res://assets/tileset/Art/Rocks/Rock_Brown_9.png")

var _map: Dictionary = {}
var _water: Dictionary = {}
var _source: Dictionary = {}
var _chunks: Dictionary = {}
var stamp_count := 0
var raster_chunk_count := 0


func configure(data: Dictionary, water_polygons: Dictionary) -> void:
    _map = data
    _water = water_polygons
    texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    _load_images()
    _paint_authored_zones()
    _paint_pond_and_river_verges()
    _paint_path_pebbles()
    _commit_chunk_textures()


func _load_images() -> void:
    var sources := {
        "flower_white": WFLOWERS, "flower_red": RFLOWERS, "plant": PLANT,
        "bush": BUSH_SMALL, "small": BUSH_TINY, "pebble": PEBBLE
    }
    for key in sources:
        var texture: Texture2D = sources[key]
        var source_image := texture.get_image()
        if source_image == null or source_image.is_empty():
            push_error("Could not decode pixel-art brush: " + str(key))
            continue
        if source_image.get_format() != Image.FORMAT_RGBA8:
            source_image.convert(Image.FORMAT_RGBA8)
        _source[key] = source_image


func _paint_authored_zones() -> void:
    for zone in _map.get("brush_zones", []):
        var random := RandomNumberGenerator.new()
        random.seed = hash(str(zone.get("id", "field"))) + 2103
        var center := _v(zone.get("center", [0, 0]))
        var radii := _v(zone.get("radii", [25, 25]))
        var count := int(zone.get("count", 0))
        var theme := str(zone.get("theme", "mixed"))
        for _i in range(count):
            # sqrt gives a uniform scattering across a disc, not a tile grid.
            var angle := random.randf() * TAU
            var radius := sqrt(random.randf())
            var point := (center + Vector2(cos(angle) * radii.x, sin(angle) * radii.y) * radius).round()
            if _blocked_for_foliage(point):
                continue
            var roll := random.randf()
            if roll < 0.45:
                var source := "flower_white"
                if theme == "red" or (theme == "mixed" and random.randf() < 0.42):
                    source = "flower_red"
                var variant := random.randi_range(0, 3)
                _stamp(point, source, Rect2i(variant * 48, 0, 16, 16))
            elif roll < 0.75:
                _stamp(point, "bush")
            elif roll < 0.93:
                _stamp(point, "small")
            else:
                _stamp(point, "plant")


func _paint_pond_and_river_verges() -> void:
    var random := RandomNumberGenerator.new()
    random.seed = 988144
    for water in _map.get("waters", []):
        if str(water.get("shape", "")) == "pond":
            var center := _v(water.get("center", [0, 0]))
            var radii := _v(water.get("radii", [50, 40]))
            for i in range(28):
                var angle := TAU * (float(i) + random.randf_range(-0.21, 0.21)) / 28.0
                var normal := Vector2(cos(angle), sin(angle))
                var point := (center + normal * radii * random.randf_range(1.16, 1.28)).round()
                _shore_plant(point, random)
            continue
        var line: Array = water.get("points", [])
        if line.size() < 2:
            continue
        var half_width := float(water.get("radius", 26.0))
        for i in range(line.size() - 1):
            var begin := _v(line[i])
            var end := _v(line[i + 1])
            var step_count := maxi(1, roundi(begin.distance_to(end) / 22.0))
            var tangent := (end - begin).normalized()
            var normal := Vector2(-tangent.y, tangent.x)
            for j in range(step_count):
                var t := (float(j) + random.randf_range(0.1, 0.8)) / float(step_count)
                var center := begin.lerp(end, clampf(t, 0.0, 1.0))
                for sign_dir: float in [-1.0, 1.0]:
                    var point: Vector2 = (center + normal * sign_dir * (half_width + random.randf_range(9.0, 19.0))).round()
                    _shore_plant(point, random)


func _shore_plant(point: Vector2, random: RandomNumberGenerator) -> void:
    if _blocked_for_foliage(point):
        return
    var roll := random.randf()
    if roll < 0.48:
        _stamp(point, "plant")
    elif roll < 0.77:
        _stamp(point, "bush")
    elif roll < 0.92:
        _stamp(point, "pebble")
    else:
        _stamp(point, "flower_white", Rect2i(48, 0, 16, 16))


func _paint_path_pebbles() -> void:
    var random := RandomNumberGenerator.new()
    random.seed = 3348245
    for road in _map.get("roads", []):
        var raw: Array = road.get("points", [])
        var width := float(road.get("radius", 15))
        for i in range(raw.size() - 1):
            var a := _v(raw[i])
            var b := _v(raw[i + 1])
            var direction := (b - a).normalized()
            var perpendicular := Vector2(-direction.y, direction.x)
            var steps := maxi(1, floori(a.distance_to(b) / 34.0))
            for j in range(steps):
                var progress := (float(j) + random.randf()) / float(steps)
                var point := (a.lerp(b, progress) + perpendicular * random.randf_range(-width * 0.54, width * 0.54)).round()
                if _in_water(point) or _at_house(point):
                    continue
                if random.randf() < 0.47:
                    _stamp(point, "pebble")


func _blocked_for_foliage(point: Vector2) -> bool:
    var extent := _v(_map.get("size", [0, 0]))
    if point.x < 6 or point.y < 6 or point.x >= extent.x - 6 or point.y >= extent.y - 6:
        return true
    if _in_water(point) or _at_house(point):
        return true
    for road in _map.get("roads", []):
        var vertices: Array = road.get("points", [])
        var clearance := float(road.get("radius", 12)) + 5.0
        for i in range(vertices.size() - 1):
            if _distance_to_segment(point, _v(vertices[i]), _v(vertices[i + 1])) <= clearance:
                return true
    for terrace in _map.get("terraces", []):
        var lip: Array = terrace.get("edge", [])
        var clearance := float(terrace.get("depth", 16.0)) + 8.0
        for i in range(lip.size() - 1):
            if _distance_to_segment(point, _v(lip[i]), _v(lip[i + 1])) < clearance:
                return true
    for bridge in _map.get("bridges", []):
        var middle := _v(bridge.get("position", []))
        var extent := _v(bridge.get("size", [120, 26]))
        if absf(point.x - middle.x) < extent.x * 0.5 + 12.0 and absf(point.y - middle.y) < extent.y * 0.5 + 15.0:
            return true
    for patch in _map.get("terrain_patches", []):
        if str(patch.get("kind", "")) != "soil":
            continue
        var center := _v(patch.get("center", []))
        var radii := _v(patch.get("radii", [30, 20])) + Vector2(6, 6)
        var v := point - center
        if v.x * v.x / (radii.x * radii.x) + v.y * v.y / (radii.y * radii.y) < 1.0:
            return true
    return false


func _at_house(point: Vector2) -> bool:
    for obj in _map.get("objects", []):
        if str(obj.get("kind", "")) not in ["house", "well"]:
            continue
        var center := _v(obj.get("position", [0, 0]))
        var solid: Array = obj.get("solid", [])
        var width := float(solid[0]) if solid.size() > 0 else 50.0
        if absf(point.x - center.x) < width * 0.63 + 9.0 and point.y > center.y - 130.0 and point.y < center.y + 15.0:
            return true
    return false


func _in_water(point: Vector2) -> bool:
    for outline in _water.values():
        var polygon: PackedVector2Array = outline
        if Geometry2D.is_point_in_polygon(point, polygon):
            return true
    return false


func _distance_to_segment(p: Vector2, a: Vector2, b: Vector2) -> float:
    var delta := b - a
    var len2 := delta.length_squared()
    if len2 < 1.0:
        return p.distance_to(a)
    var t := clampf((p - a).dot(delta) / len2, 0.0, 1.0)
    return p.distance_to(a + delta * t)


func _stamp(anchor: Vector2, source_key: String, region: Rect2i = Rect2i()) -> void:
    var source_img := _source.get(source_key) as Image
    if source_img == null:
        return
    if region.size == Vector2i.ZERO:
        region = Rect2i(Vector2i.ZERO, source_img.get_size())
    var top_left := Vector2i(roundi(anchor.x - float(region.size.x) * 0.5), roundi(anchor.y - region.size.y))
    var extent := Vector2i(_v(_map.get("size", [1120, 800])))
    var world_rect := Rect2i(top_left, region.size).intersection(Rect2i(Vector2i.ZERO, extent))
    if world_rect.size.x <= 0 or world_rect.size.y <= 0:
        return
    var top_chunk := Vector2i(floori(float(world_rect.position.x) / CHUNK_SIZE), floori(float(world_rect.position.y) / CHUNK_SIZE))
    var last := world_rect.end - Vector2i.ONE
    var bottom_chunk := Vector2i(floori(float(last.x) / CHUNK_SIZE), floori(float(last.y) / CHUNK_SIZE))
    for cy in range(top_chunk.y, bottom_chunk.y + 1):
        for cx in range(top_chunk.x, bottom_chunk.x + 1):
            var chunk := Vector2i(cx, cy)
            var origin := chunk * CHUNK_SIZE
            var clipped := world_rect.intersection(Rect2i(origin, Vector2i.ONE * CHUNK_SIZE))
            if clipped.size.x <= 0 or clipped.size.y <= 0:
                continue
            var src := Rect2i(region.position + clipped.position - top_left, clipped.size)
            var image := _chunk_image(chunk)
            image.blend_rect(source_img, src, clipped.position - origin)
    stamp_count += 1


func _chunk_image(key: Vector2i) -> Image:
    if not _chunks.has(key):
        var image := Image.create_empty(CHUNK_SIZE, CHUNK_SIZE, false, Image.FORMAT_RGBA8)
        image.fill(Color.TRANSPARENT)
        _chunks[key] = image
    return _chunks[key] as Image


func _commit_chunk_textures() -> void:
    var keys := _chunks.keys()
    keys.sort_custom(func(a: Vector2i, b: Vector2i) -> bool: return a.y < b.y or (a.y == b.y and a.x < b.x))
    for coord in keys:
        var chunk: Image = _chunks[coord]
        var sprite := Sprite2D.new()
        sprite.name = "Raster_%d_%d" % [coord.x, coord.y]
        sprite.position = Vector2(coord * CHUNK_SIZE)
        sprite.centered = false
        sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
        sprite.texture = ImageTexture.create_from_image(chunk)
        add_child(sprite)
        raster_chunk_count += 1
    _chunks.clear()


func _v(raw: Array) -> Vector2:
    if raw.size() < 2:
        return Vector2.ZERO
    return Vector2(float(raw[0]), float(raw[1]))
