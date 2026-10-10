extends Node2D

# M1.6 reusable raster ground dressing made solely from existing source
# pixel-art fragments. Gameplay surfaces stay independent Polygon2D nodes.
# This layer is rendered ABOVE the base grass and BELOW roads, water, yards,
# houses, collision, foliage props and the player's Y-sorted character.
const GRASS_ATLAS := preload("res://assets/tileset/Art/Ground Tileset/Tileset_Ground.png")
const CHUNK_SIZE := 256

var chunk_count := 0
var stamp_count := 0
var _image: Image
var _regions: Array[Rect2i] = []


func configure(world_size: Vector2, config: Dictionary) -> void:
    texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    var image := GRASS_ATLAS.get_image()
    if image == null or image.is_empty():
        push_error("M1.6 ground atlas cannot be decoded.")
        return
    if image.get_format() != Image.FORMAT_RGBA8:
        image.convert(Image.FORMAT_RGBA8)
    _image = image
    var regions: Array = config.get("grass_regions", [])
    for raw in regions:
        if raw.size() != 4:
            continue
        var region := Rect2i(int(raw[0]), int(raw[1]), int(raw[2]), int(raw[3]))
        if region.position.x < 0 or region.position.y < 0:
            continue
        if region.end.x > image.get_width() or region.end.y > image.get_height():
            continue
        if region.size.x < 4 or region.size.y < 4:
            continue
        _regions.append(region)
    if _regions.is_empty():
        push_error("M1.6 ground raster has no valid source art regions.")
        return

    var columns := ceili(world_size.x / float(CHUNK_SIZE))
    var rows := ceili(world_size.y / float(CHUNK_SIZE))
    var density := clampi(int(config.get("meadow_density_per_chunk", 70)), 20, 140)
    var base_seed := int(config.get("seed", 131024))
    for cy in range(rows):
        for cx in range(columns):
            var chunk_key := Vector2i(cx, cy)
            _build_chunk(chunk_key, density, base_seed)


func _build_chunk(key: Vector2i, density: int, base_seed: int) -> void:
    var canvas := Image.create_empty(CHUNK_SIZE, CHUNK_SIZE, false, Image.FORMAT_RGBA8)
    canvas.fill(Color(0.0, 0.0, 0.0, 0.0))
    var random := RandomNumberGenerator.new()
    random.seed = base_seed + key.x * 7919 + key.y * 104729
    for _i in range(density):
        var region: Rect2i = _regions[random.randi_range(0, _regions.size() - 1)]
        var left := random.randi_range(-region.size.x, CHUNK_SIZE - 1)
        var top := random.randi_range(-region.size.y, CHUNK_SIZE - 1)
        var wanted := Rect2i(left, top, region.size.x, region.size.y)
        var clipped := wanted.intersection(Rect2i(Vector2i.ZERO, Vector2i(CHUNK_SIZE, CHUNK_SIZE)))
        if clipped.size.x <= 0 or clipped.size.y <= 0:
            continue
        var source := Rect2i(region.position + clipped.position - wanted.position, clipped.size)
        canvas.blend_rect(_image, source, clipped.position)
        stamp_count += 1
    var sprite := Sprite2D.new()
    sprite.name = "GrassRaster_%d_%d" % [key.x, key.y]
    sprite.position = Vector2(key * CHUNK_SIZE)
    sprite.centered = false
    sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    sprite.texture = ImageTexture.create_from_image(canvas)
    add_child(sprite)
    chunk_count += 1
