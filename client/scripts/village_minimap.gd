extends Control

var player: Node2D
var world_size := Vector2(1792.0, 1536.0)
var map_texture: Texture2D
var _redraw_clock := 0.0


func configure(target: Node2D, map_extent: Vector2, texture: Texture2D) -> void:
	player = target
	world_size = map_extent
	map_texture = texture
	custom_minimum_size = Vector2(220.0, 190.0)
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	queue_redraw()


func _process(delta: float) -> void:
	_redraw_clock += delta
	if _redraw_clock >= 0.08:
		_redraw_clock = 0.0
		queue_redraw()


func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Color(0.04, 0.045, 0.035, 0.9))
	var map_rect := Rect2(Vector2(8.0, 8.0), size - Vector2(16.0, 16.0))
	if map_texture != null:
		draw_texture_rect(map_texture, map_rect, false)
	draw_rect(map_rect, Color(0.94, 0.84, 0.57, 0.95), false, 2.0)
	if player != null and world_size.x > 0.0 and world_size.y > 0.0:
		var progress := Vector2(player.global_position.x / world_size.x, player.global_position.y / world_size.y)
		var marker := map_rect.position + Vector2(clampf(progress.x, 0.0, 1.0), clampf(progress.y, 0.0, 1.0)) * map_rect.size
		draw_circle(marker, 5.0, Color(1.0, 0.24, 0.16, 1.0))
		draw_arc(marker, 7.0, 0.0, TAU, 24, Color(0.1, 0.07, 0.04, 1.0), 1.5)
