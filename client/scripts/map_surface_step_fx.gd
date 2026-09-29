class_name MapSurfaceStepFx
extends Node2D
## Short, pixel-aligned surface cues for a moving actor.

var _particles: Array[Dictionary] = []
var _remaining_life: float = 0.24

func configure(surface: String, tile_size_px: int, rainy: bool, shoreline: bool, seed_value: int) -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	var rng := RandomNumberGenerator.new()
	rng.seed = abs(seed_value)
	var pixel_scale := maxi(roundi(float(tile_size_px) / 8.0), 1)
	var palette: Array[Color] = []
	match surface:
		"grass":
			palette = [Color("#458551"), Color("#4f7a3c"), Color("#5c713d")]
			if rainy:
				palette = [Color("#2b6e53"), Color("#4f7a3c"), Color("#5c713d")]
		"soil":
			palette = [Color("#887b32"), Color("#ab9050"), Color("#5c713d")]
			if rainy:
				palette = [Color("#5c713d"), Color("#887b32"), Color("#2b6e53")]
		"stone":
			palette = [Color("#aeb7c2"), Color("#d9dce0"), Color("#838b94")]
		"water":
			palette = [Color("#b6f2ff"), Color("#70d8ed"), Color("#e7fbff")]
		_:
			queue_free()
			return
	var particle_count := 4 if surface == "water" else 3
	for index in range(particle_count):
		var offset_y := rng.randi_range(-2, 4)
		if surface == "water":
			offset_y = rng.randi_range(-6, 2)
		var offset := Vector2i(rng.randi_range(-6, 6) * pixel_scale, offset_y * pixel_scale)
		var dimensions := Vector2i(2, 1) if index % 2 == 0 else Vector2i.ONE
		dimensions *= pixel_scale
		_particles.append({
			"position": Vector2(offset),
			"size": Vector2(dimensions),
			"color": palette[rng.randi_range(0, palette.size() - 1)]
		})
	if shoreline and surface != "water":
		var shore_offset := Vector2i(rng.randi_range(-5, 5), rng.randi_range(-5, 0)) * pixel_scale
		_particles.append({
			"position": Vector2(shore_offset),
			"size": Vector2(pixel_scale, pixel_scale),
			"color": Color("#9eeeff")
		})
	queue_redraw()

func _process(delta: float) -> void:
	_remaining_life -= delta
	if _remaining_life <= 0.0:
		queue_free()
		return
	if _remaining_life > 0.16:
		modulate.a = 1.0
	elif _remaining_life > 0.08:
		modulate.a = 0.68
	else:
		modulate.a = 0.34

func _draw() -> void:
	for particle: Dictionary in _particles:
		draw_rect(
			Rect2(particle["position"], particle["size"]),
			particle["color"],
			true
		)
