class_name MapWaterRipple
extends Node2D
## Small, crisp shimmer marks provide motion over otherwise painted water.

var tint := Color("8eeaff")
var phase_offset: float = 0.0
var rain_intensity: float = 0.0
var _clock: float = 0.0

func configure(tile_position: Vector2, tile_size_px: int, color_value: String, phase: float) -> void:
	position = (tile_position + Vector2(0.5, 0.5)) * tile_size_px
	tint = Color.from_string(color_value, Color("8eeaff"))
	phase_offset = phase

func set_rain_intensity(value: float) -> void:
	rain_intensity = clampf(value, 0.0, 1.0)
	queue_redraw()

func _process(delta: float) -> void:
	_clock += delta
	queue_redraw()

func _draw() -> void:
	for index in range(3):
		var phase := fposmod(_clock * (0.42 + rain_intensity * 0.48) + phase_offset + float(index) / 3.0, 1.0)
		var width := maxi(3, roundi(4.0 + phase * 10.0))
		var alpha := tint.a * (1.0 - phase) * (0.38 + rain_intensity * 0.08)
		var offset_y := float(index - 1) * 3.0
		var color := Color(tint.r, tint.g, tint.b, alpha)
		draw_rect(Rect2(Vector2(-float(width) / 2.0, offset_y), Vector2(width, 1)), color, true)
	var ring_count := roundi(rain_intensity * 5.0)
	for index in range(ring_count):
		var phase := fposmod(_clock * 0.78 + phase_offset + float(index) * 0.31, 1.0)
		var jitter := float(index) * 17.37 + phase_offset * 91.0
		var center := Vector2(sin(jitter) * 9.0, cos(jitter * 1.71) * 5.0)
		var radius := 1.0 + phase * 2.0
		var color := Color(0.70, 0.91, 1.0, (1.0 - phase) * rain_intensity * 0.42)
		draw_arc(center, radius, 0.0, TAU, 8, color, 1.0, false)
