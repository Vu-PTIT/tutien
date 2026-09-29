class_name MapWaterRipple
extends Node2D
## Pixel-aligned shimmer and stepped rain rings over the water surface.

var tint := Color("8eeaff")
var phase_offset: float = 0.0
var rain_intensity: float = 0.0
var _clock: float = 0.0

func configure(tile_position: Vector2, tile_size_px: int, color_value: String, phase: float) -> void:
	var center := (tile_position + Vector2(0.5, 0.5)) * tile_size_px
	position = Vector2(roundi(center.x), roundi(center.y))
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
		var width := 4 + pixel_step * 2
		var offset_y := (index - 1) * 3
		var shimmer_alpha: float = 0.36
		if phase < 0.34:
			shimmer_alpha = 1.0
		elif phase < 0.68:
			shimmer_alpha = 0.68
		var color := Color(tint.r, tint.g, tint.b, tint.a * shimmer_alpha)
		draw_rect(Rect2(Vector2(-floori(float(width) / 2.0), offset_y), Vector2(width, 1)), color, true)
		if pixel_step > 1:
			var glint_x := floori(float(width) / 2.0) - 1
			draw_rect(Rect2(Vector2(glint_x, offset_y), Vector2(1, 1)), Color("#e5fbff"), true)
	var ring_count := roundi(rain_intensity * 4.0)
	for index in range(ring_count):
		var phase := fposmod(_clock * 0.78 + phase_offset + float(index) * 0.31, 1.0)
		var radius := 2 + floori(phase * 3.0)
		var seed := int(phase_offset * 1000.0) + index * 17
		var center := Vector2i(posmod(seed, 13) - 6, posmod(seed * 3, 9) - 4)
		var ring_alpha: float = 0.35
		if phase < 0.55:
			ring_alpha = 0.65
		var color := Color(0.70, 0.91, 1.0, ring_alpha * rain_intensity)
		_draw_pixel_ring(center, radius, color)

func _draw_pixel_ring(center: Vector2i, radius: int, color: Color) -> void:
	var top_left := center + Vector2i(-1, -radius)
	var bottom_left := center + Vector2i(-1, radius)
	draw_rect(Rect2(Vector2(top_left), Vector2(3, 1)), color, true)
	draw_rect(Rect2(Vector2(bottom_left), Vector2(3, 1)), color, true)
	for offset_y in range(-radius + 2, radius - 1):
		draw_rect(Rect2(Vector2(center.x - radius, center.y + offset_y), Vector2(1, 1)), color, true)
		draw_rect(Rect2(Vector2(center.x + radius, center.y + offset_y), Vector2(1, 1)), color, true)
