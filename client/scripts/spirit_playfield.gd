extends Control
## Code-drawn placeholder sprites; online geometry comes from world_map_get.
var player_position := Vector2(640, 520)
var form := "human"
var facing := Vector2.DOWN
var moving := false
var time := 0.0
var flash := 0.0
var geometry: Dictionary = {"width": 1536, "height": 1152, "tileSize": 32, "speed": 72, "solids": [[0, 0, 48, 1], [0, 35, 48, 1], [0, 0, 1, 36], [47, 0, 1, 36], [7, 5, 8, 4], [24, 8, 10, 4], [12, 24, 5, 7]], "points": []}
var mobs: Array = []
var hunt: Dictionary = {}
var partner_form := "human"
var partner_name := ""
var own_id := ""
var partner_id := ""
var zoom := 1.65

func _ready() -> void:
	clip_contents = true
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	reset_demo()

func reset_demo() -> void:
	player_position = Vector2(640, 520)
	hunt = {}
	mobs = [{"id": "demo_boar", "name": "Sơn Trư", "enemyId": "en_boar", "x": 724, "y": 520, "hp": 60, "maxHp": 60, "respawnAt": 0.0}, {"id": "demo_spider", "name": "Độc Chu", "enemyId": "en_spider", "x": 610, "y": 700, "hp": 45, "maxHp": 45, "respawnAt": 0.0}]

func _process(delta: float) -> void:
	time += delta
	flash = maxf(0.0, flash - delta)
	queue_redraw()

func world_to_screen(point: Vector2) -> Vector2:
	return size * 0.5 + (point - player_position) * zoom

func walkable(point: Vector2) -> bool:
	var radius := float(geometry.get("radius", 8))
	if point.x < radius or point.y < radius or point.x >= float(geometry.width) - radius or point.y >= float(geometry.height) - radius:
		return false
	for offset in [Vector2.ZERO, Vector2(-radius, 0), Vector2(radius, 0), Vector2(0, -radius), Vector2(0, radius)]:
		var p: Vector2 = point + offset
		for raw in geometry.get("solids", []):
			if Rect2(float(raw[0]) * 32, float(raw[1]) * 32, float(raw[2]) * 32, float(raw[3]) * 32).has_point(p):
				return false
		for raw in geometry.get("footprints", []):
			if Rect2(float(raw[0]), float(raw[1]), float(raw[2]), float(raw[3])).has_point(p):
				return false
		var bridge := false
		for raw in geometry.get("bridges", []):
			if Rect2(float(raw[0]) * 32, float(raw[1]) * 32, float(raw[2]) * 32, float(raw[3]) * 32).has_point(p):
				bridge = true
		if not bridge:
			for water in geometry.get("waters", []):
				if _in_water(water, p / 32.0):
					return false
	return true

func _in_water(water: Dictionary, p: Vector2) -> bool:
	if water.get("shape") == "ellipse":
		var center: Array = water.center_cell
		var radii: Array = water.radii_cells
		var q := (p - Vector2(float(center[0]), float(center[1]))) / Vector2(float(radii[0]), float(radii[1]))
		return q.length_squared() <= 1.0
	if water.get("shape") == "polygon":
		var polygon := PackedVector2Array()
		for raw in water.get("points", []):
			polygon.append(Vector2(float(raw[0]), float(raw[1])))
		return polygon.size() >= 3 and Geometry2D.is_point_in_polygon(p, polygon)
	if water.get("shape") == "ribbon":
		var points: Array = water.get("points", [])
		for i in range(1, points.size()):
			var a := Vector2(float(points[i - 1][0]), float(points[i - 1][1]))
			var b := Vector2(float(points[i][0]), float(points[i][1]))
			if Geometry2D.get_closest_point_to_segment(p, a, b).distance_to(p) <= float(water.get("width_cells", 1)) * 0.5:
				return true
	return false

func move_avatar(direction: Vector2, delta: float) -> void:
	moving = direction.length_squared() > 0
	if not moving:
		return
	facing = direction.normalized()
	var displacement := facing * float(geometry.get("speed", 72)) * delta
	# Axis-separated movement slides against the same footprints as the server.
	var x := player_position + Vector2(displacement.x, 0)
	if walkable(x):
		player_position = x
	var y := player_position + Vector2(0, displacement.y)
	if walkable(y):
		player_position = y

func nearest_mob() -> Dictionary:
	var nearest: Dictionary = {}
	var distance := 70.4
	for mob in mobs:
		if int(mob.hp) <= 0:
			continue
		var d := player_position.distance_to(Vector2(float(mob.x), float(mob.y)))
		if d < distance:
			distance = d
			nearest = mob
	return nearest

func _box(point: Vector2, rect: Rect2, color: Color) -> void:
	draw_rect(Rect2(point + rect.position * zoom, rect.size * zoom), color)

func _avatar(at: Vector2, kind: String, tint: Color, walking: bool = false) -> void:
	var p := world_to_screen(at)
	var step := roundf(sin(time * 12.0)) if walking else 0.0
	draw_ellipse_shadow(p)
	if kind == "spirit_beast":
		_box(p, Rect2(-14, -17 + step, 26, 15), tint)
		_box(p, Rect2(-11, -28 + step, 18, 15), tint.lightened(0.2))
		_box(p, Rect2(-11, -33 + step, 5, 8), tint)
		_box(p, Rect2(2, -33 + step, 5, 8), tint)
		_box(p, Rect2(12, -16, 4, 8), tint)
		_box(p, Rect2(-11, -5, 5, 6 - step), tint.darkened(0.2))
		_box(p, Rect2(5, -5, 5, 6 + step), tint.darkened(0.2))
		_box(p, Rect2(-7, -22 + step, 3, 3), Color("162b35"))
		_box(p, Rect2(1, -22 + step, 3, 3), Color("162b35"))
		_box(p, Rect2(-10, -13, 21, 3), Color("70d9cd"))
	else:
		_box(p, Rect2(-8, -30 + step, 16, 18), tint)
		_box(p, Rect2(-9, -44 + step, 18, 15), Color("f1cca4"))
		_box(p, Rect2(-9, -46 + step, 18, 6), Color("243b49"))
		_box(p, Rect2(-12, -41 + step, 5, 13), Color("243b49"))
		_box(p, Rect2(-8, -12, 6, 12 - step), Color("203441"))
		_box(p, Rect2(2, -12, 6, 12 + step), Color("203441"))
		_box(p, Rect2(11, -32, 3, 29), Color("dde9d5"))
		_box(p, Rect2(8, -7, 9, 3), Color("d7b775"))
	if flash > 0:
		draw_arc(p, 42 * zoom, -1.1, 1.1, 10, Color("f5d998"), 3.0)

func draw_ellipse_shadow(p: Vector2) -> void:
	draw_set_transform(p, 0, Vector2(1, 0.4))
	draw_circle(Vector2.ZERO, 16 * zoom, Color(0.04, 0.12, 0.14, 0.35))
	draw_set_transform(Vector2.ZERO)

func _monster(mob: Dictionary, at: Vector2) -> void:
	var p := world_to_screen(at)
	draw_ellipse_shadow(p)
	if mob.get("enemyId", "en_boar") == "en_spider":
		for i in range(3):
			_box(p, Rect2(-19, -17 + i * 6, 36, 3), Color("8b7990"))
		_box(p, Rect2(-11, -24, 22, 24), Color("676080"))
		_box(p, Rect2(-5, -11, 3, 3), Color("f2b1a2"))
		_box(p, Rect2(3, -11, 3, 3), Color("f2b1a2"))
	else:
		_box(p, Rect2(-18, -26, 34, 23), Color("946958"))
		_box(p, Rect2(10, -19, 12, 12), Color("c2977a"))
		_box(p, Rect2(13, -6, 4, 5), Color("ecdfb6"))
		_box(p, Rect2(-14, -5, 6, 7), Color("634c43"))
		_box(p, Rect2(8, -5, 6, 7), Color("634c43"))
		_box(p, Rect2(4, -21, 3, 3), Color("201e2d"))
	var ratio := float(mob.hp) / maxf(1.0, float(mob.maxHp))
	draw_rect(Rect2(p + Vector2(-25, -54), Vector2(50, 5)), Color("243e45"))
	draw_rect(Rect2(p + Vector2(-25, -54), Vector2(50 * ratio, 5)), Color("d99b84"))
	draw_string(get_theme_default_font(), p + Vector2(-35, -64), str(mob.get("name", "Sơn Trư")), HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("e6e9cf"))

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Color("365b51"))
	for x in range(int(player_position.x / 48) - 12, int(player_position.x / 48) + 13):
		for y in range(int(player_position.y / 48) - 10, int(player_position.y / 48) + 11):
			var p := world_to_screen(Vector2(x * 48 + 12, y * 48 + 15))
			var shade := Color("426758") if (x * 13 + y * 7) % 3 == 0 else Color("31574e")
			draw_rect(Rect2(p, Vector2(3, 7)), shade)
	if not hunt.is_empty():
		draw_circle(size * 0.5, 145, Color("41675b"))
		draw_arc(size * 0.5, 147, 0, TAU, 48, Color("9db995"), 2.0)
		if int(hunt.get("mobHp", 0)) > 0:
			_monster({"hp": hunt.mobHp, "maxHp": hunt.maxHp, "name": "Sơn Trư • Săn chung"}, player_position + Vector2(0, -65))
		if hunt.get("joined", {}).get(partner_id, false):
			_avatar(player_position + Vector2(64, 12), partner_form, Color("d7b775"))
			draw_string(get_theme_default_font(), size * 0.5 + Vector2(60, 53), partner_name, HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("eee5c8"))
	else:
		for raw in geometry.get("solids", []):
			var rect := Rect2(float(raw[0]) * 32, float(raw[1]) * 32, float(raw[2]) * 32, float(raw[3]) * 32)
			var screen := Rect2(world_to_screen(rect.position), rect.size * zoom)
			if not screen.intersects(Rect2(Vector2.ZERO, size)):
				continue
			draw_rect(screen, Color("284c43"))
			for x in range(int(rect.position.x), int(rect.end.x), 48):
				for y in range(int(rect.position.y), int(rect.end.y), 48):
					var p := world_to_screen(Vector2(x + 24, y + 24))
					draw_rect(Rect2(p + Vector2(-5, 0), Vector2(10, 25)), Color("6c6450"))
					draw_rect(Rect2(p + Vector2(-25, -34), Vector2(50, 42)), Color("1d453c"))
					draw_rect(Rect2(p + Vector2(-18, -42), Vector2(36, 28)), Color("315e48"))
		for mob in mobs:
			if int(mob.hp) > 0:
				_monster(mob, Vector2(float(mob.x), float(mob.y)))
		for point in geometry.get("points", []):
			var p := world_to_screen(Vector2(float(point.x), float(point.y)))
			draw_rect(Rect2(p - Vector2(7, 7), Vector2(14, 14)), Color("caaf79"))
	_avatar(player_position, form, Color("d8ad81") if form == "spirit_beast" else Color("8dc9bc"), moving)
	draw_string(get_theme_default_font(), Vector2(20, 30), "Đấu trường khế ước" if not hunt.is_empty() else "Rừng thử nghiệm • Di chuyển và đánh quái", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color("dae5c9"))
