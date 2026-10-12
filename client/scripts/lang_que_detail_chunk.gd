extends Node2D

# Batched, editable sprite placements. A chunk never decides terrain topology.
var stamps: Array = []


func _draw() -> void:
	for stamp in stamps:
		var texture: Texture2D = stamp.texture
		var p: Vector2 = stamp.point
		draw_texture(texture, p - texture.get_size() * Vector2(.5, 1), stamp.get("tint", Color.WHITE))
