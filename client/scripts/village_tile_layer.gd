extends Node2D

var assets: Node
var layer_data: Dictionary = {}
var map_width := 112
var cell_size := 16
var animations: Dictionary = {}
var _animation_clock := 0.0
var _redraw_clock := 0.0
var _has_animated_tiles := false


func configure(asset_provider: Node, data: Dictionary, width: int, tile_size: int) -> void:
	assets = asset_provider
	layer_data = data
	map_width = width
	cell_size = tile_size
	animations = assets.get("map_data").get("animations", {})
	for raw_gid in layer_data.get("data", []):
		if animations.has(str(int(raw_gid))):
			_has_animated_tiles = true
			break
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	set_process(_has_animated_tiles)
	queue_redraw()


func _process(delta: float) -> void:
	if not _has_animated_tiles:
		return
	_animation_clock += delta
	_redraw_clock += delta
	if _redraw_clock >= 0.06:
		_redraw_clock = 0.0
		queue_redraw()


func _draw() -> void:
	var values: Array = layer_data.get("data", [])
	for index in range(values.size()):
		var base_gid := int(values[index])
		if base_gid == 0:
			continue
		var gid := _animated_gid(base_gid)
		var tile: Dictionary = assets.call("resolve_gid", gid)
		if tile.is_empty():
			continue
		var texture := tile.get("texture") as Texture2D
		var region: Rect2 = tile.get("region", Rect2())
		var cell := Vector2i(index % map_width, floori(float(index) / float(map_width)))
		var destination := Rect2(Vector2(cell.x * cell_size, cell.y * cell_size), Vector2(cell_size, cell_size))
		draw_texture_rect_region(texture, destination, region)


func _animated_gid(gid: int) -> int:
	var frames: Array = animations.get(str(gid), [])
	if frames.is_empty():
		return gid
	var total_ms := 0
	for frame in frames:
		total_ms += int(frame.get("duration", 100))
	if total_ms <= 0:
		return gid
	var frame_time := int(fposmod(_animation_clock * 1000.0, float(total_ms)))
	for frame in frames:
		var duration := int(frame.get("duration", 100))
		if frame_time < duration:
			return int(frame.get("gid", gid))
		frame_time -= duration
	return gid
