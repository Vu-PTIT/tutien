class_name MapWaterRipple
extends Node2D
## Small, crisp shimmer marks provide motion over otherwise painted water.

var tint := Color("8eeaff")
var phase_offset: float = 0.0
var _clock: float = 0.0

func configure(tile_position: Vector2, tile_size_px: int, color_value: String, phase: float) -> void:
	position = (tile_position + Vector2(0.5, 0.5)) * tile_size_px
	tint = Color.from_string(color_value, Color("8eeaff"))
	phase_offset = phase

func _process(delta: float) -> void:
	_clock += delta
	queue_redraw()

func _draw() -> void:
	for index in range(3):
		var phase := fposmod(_clock * 0.42 + phase_offset + float(index) / 3.0, 1.0)
		var width := maxi(3, roundi(4.0 + phase * 10.0))
		var alpha := tint.a * (1.0 - phase) * 0.38
		var offset_y := float(index - 1) * 3.0
		var color := Color(tint.r, tint.g, tint.b, alpha)
		draw_rect(Rect2(Vector2(-float(width) / 2.0, offset_y), Vector2(width, 1)), color, true)
