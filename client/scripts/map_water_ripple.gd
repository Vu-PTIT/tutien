class_name MapWaterRipple
extends Node2D
## Pixel-aligned shimmer and stepped rain rings over the water surface.

var tint := Color("8eeaff")
var phase_offset: float = 0.0
var rain_intensity: float = 0.0
var _clock: float = 0.0
var _pixel_scale: int = 4

func configure(tile_position: Vector2, tile_size_px: int, color_value: String, phase: float) -> void:
	_pixel_scale = maxi(roundi(float(tile_size_px) / 8.0), 1)
	var center := (tile_position + Vector2(0.5, 0.5)) * tile_size_px
	position = Vector2(
		roundi(center.x / float(_pixel_scale)) * _pixel_scale,
		roundi(center.y / float(_pixel_scale)) * _pixel_scale
	)
	tint = Color.from_string(color_value, Color("8eeaff"))
	phase_offset = phase
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST

func set_rain_intensity(value: float) -> void:
	rain_intensity = clampf(value, 0.0, 1.0)
	queue_redraw()

func _process(delta: float) -> void:
	_clock += delta
	queue_redraw()

func _draw() -> void:
	for index in range(3):
		var phase := fposmod(_clock * (0.42 + rain_intensity * 0.48) + phase_offset + float(index) / 3.0, 1.0)
		var pixel_step := floori(phase * 5.0)
		var width := (1 + pixel_step) * _pixel_scale
		var offset_y := (index - 1) * 3 * _pixel_scale
		var shimmer_alpha: float = 0.36
		if phase < 0.34:
			shimmer_alpha = 1.0
		elif phase < 0.68:
			shimmer_alpha = 0.68
		var color := Color(tint.r, tint.g, tint.b, tint.a * shimmer_alpha)
		draw_rect(Rect2(Vector2(-floori(float(width) / 2.0), offset_y), Vector2(width, _pixel_scale)), color, true)
		if pixel_step > 1:
			var glint_cell := floori(float(width) / float(_pixel_scale) / 2.0) - 1
			var glint_x := glint_cell * _pixel_scale
			draw_rect(Rect2(Vector2(glint_x, offset_y), Vector2(_pixel_scale, _pixel_scale)), Color("#e5fbff"), true)
	var ring_count := roundi(rain_intensity * 4.0)
	for index in range(ring_count):
		var phase := fposmod(_clock * 0.78 + phase_offset + float(index) * 0.31, 1.0)
		var radius := (2 + floori(phase * 3.0)) * _pixel_scale
		var seed := int(phase_offset * 1000.0) + index * 17
		var center := Vector2i(
			(posmod(seed, 13) - 6) * _pixel_scale,
			(posmod(seed * 3, 9) - 4) * _pixel_scale
		)
		var ring_alpha: float = 0.35
		if phase < 0.55:
			ring_alpha = 0.65
		var color := Color(0.70, 0.91, 1.0, ring_alpha * rain_intensity)
		_draw_pixel_ring(center, radius, color)

func _draw_pixel_ring(center: Vector2i, radius: int, color: Color) -> void:
	var cell := _pixel_scale
	var top_left := center + Vector2i(-cell, -radius)
	var bottom_left := center + Vector2i(-cell, radius)
	draw_rect(Rect2(Vector2(top_left), Vector2(3 * cell, cell)), color, true)
	draw_rect(Rect2(Vector2(bottom_left), Vector2(3 * cell, cell)), color, true)
	for offset_y in range(-radius + cell, radius, cell):
		draw_rect(Rect2(Vector2(center.x - radius, center.y + offset_y), Vector2(cell, cell)), color, true)
		draw_rect(Rect2(Vector2(center.x + radius, center.y + offset_y), Vector2(cell, cell)), color, true)
