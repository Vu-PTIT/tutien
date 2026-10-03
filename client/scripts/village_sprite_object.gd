extends Node2D

var assets: Node
var object_data: Dictionary = {}
var canopy := false
var animations: Dictionary = {}
var _base_gid := 0
var _animation_clock := 0.0
var _redraw_clock := 0.0


func configure(asset_provider: Node, data: Dictionary, as_canopy: bool) -> void:
	assets = asset_provider
	object_data = data
	canopy = as_canopy
	_base_gid = int(object_data.get("gid", 0))
	animations = assets.get("map_data").get("animations", {})
	position = Vector2(float(object_data.get("x", 0.0)), float(object_data.get("y", 0.0)))
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	set_process(animations.has(str(_base_gid)))
	queue_redraw()


func _process(delta: float) -> void:
	_animation_clock += delta
	_redraw_clock += delta
	if _redraw_clock >= 0.06:
		_redraw_clock = 0.0
		queue_redraw()


func _draw() -> void:
	if _base_gid == 0:
		return
	var current_gid := _animated_gid(_base_gid)
	var tile: Dictionary = assets.call("resolve_gid", current_gid)
	if tile.is_empty():
		return
	var texture := tile.get("texture") as Texture2D
	var source: Rect2 = tile.get("region", Rect2())
	var width := float(object_data.get("w", source.size.x))
	var height := float(object_data.get("h", source.size.y))
	var visible_height := height
	if canopy:
		var kind := str(object_data.get("kind", ""))
		var crop_ratio := 0.62 if kind in ["building", "gate"] else 0.7
		visible_height = minf(height, maxf(1.0, height * crop_ratio))
	var draw_source := Rect2(source.position, Vector2(source.size.x, minf(source.size.y, visible_height)))
	var destination := Rect2(0.0, -height, width, visible_height)
	draw_texture_rect_region(texture, destination, draw_source)


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
