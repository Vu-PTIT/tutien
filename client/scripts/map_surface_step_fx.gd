class_name MapSurfaceStepFx
extends Node2D
## Brief, low-density pixel cues for the surface beneath a moving actor.

var _particles: Array[Dictionary] = []
var _remaining_life: float = 0.30

func configure(surface: String, tile_size_px: int, rainy: bool, shoreline: bool, seed_value: int) -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	var rng := RandomNumberGenerator.new()
	rng.seed = abs(seed_value)
	var scale_factor := maxf(float(tile_size_px) / 32.0, 0.75)
	var palette: Array[Color] = []
	match surface:
		"grass":
			palette = [Color("#b4d96c"), Color("#d8ec9a"), Color("#8eb94e")]
		"soil":
			palette = [Color("#bd8753"), Color("#e2af70"), Color("#8d6544")]
		"stone":
			palette = [Color("#aeb7c2"), Color("#d9dce0"), Color("#838b94")]
		"water":
			palette = [Color("#b6f2ff"), Color("#70d8ed"), Color("#e7fbff")]
		_:
			queue_free()
			return
	if rainy and surface in ["grass", "soil"]:
		palette = [Color("#90b968"), Color("#9e764d"), Color("#6f8390")]
	var particle_count := 4 if surface == "water" else 3
	for index in range(particle_count):
		var offset := Vector2(
			rng.randf_range(-6.0, 6.0),
			rng.randf_range(-6.0, 2.0) if surface == "water" else rng.randf_range(-2.0, 4.0)
		) * scale_factor
		var size := Vector2(2.0, 1.0) * scale_factor if index % 2 == 0 else Vector2.ONE * scale_factor
		_particles.append({
			"position": offset,
			"size": size,
			"color": palette[rng.randi_range(0, palette.size() - 1)]
		})
	if shoreline and surface != "water":
		_particles.append({
			"position": Vector2(rng.randf_range(-5.0, 5.0), rng.randf_range(-5.0, 0.0)) * scale_factor,
			"size": Vector2.ONE * scale_factor,
			"color": Color("#9eeeff")
		})
	queue_redraw()

func _process(delta: float) -> void:
	_remaining_life -= delta
	modulate.a = clampf(_remaining_life / 0.30, 0.0, 1.0)
	if _remaining_life <= 0.0:
		queue_free()

func _draw() -> void:
	for particle: Dictionary in _particles:
		draw_rect(
			Rect2(particle["position"], particle["size"]),
			particle["color"],
			true
		)
