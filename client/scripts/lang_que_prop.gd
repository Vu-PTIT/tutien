extends Node2D

const ART_SHADER := preload("res://shaders/lang_que_prop.gdshader")
var info: Dictionary = {}
var world: Node2D
var object_id := ""
var kind := ""
var action := ""
var interaction_radius := 110.0
var visual: Sprite2D
var opened := false
var _on_screen := false
var _seat_parts: Array[Sprite2D] = []


func configure(data: Dictionary, map_world: Node2D) -> void:
	info = data
	world = map_world
	object_id = str(data.id)
	kind = str(data.get("kind", "decoration"))
	action = str(data.get("action", ""))
	interaction_radius = float(data.get("radius_px", 110))
	name = object_id
	position = Vector2(float(data.cell[0]), float(data.cell[1])) * 32.0
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	visual = Sprite2D.new()
	visual.name = "Art"
	visual.texture = load(str(data.texture)) as Texture2D
	if visual.texture == null:
		push_error("Missing village artwork: " + str(data.texture))
		return
	var magnification := float(data.get("art_scale", 2))
	visual.scale = Vector2.ONE * magnification
	visual.position.y = -float(visual.texture.get_height()) * magnification * 0.5
	var material := ShaderMaterial.new()
	material.shader = ART_SHADER
	material.set_shader_parameter("foliage", kind in ["tree", "bush"])
	material.set_shader_parameter("phase", float(absi(object_id.hash()) % 100) * 0.1)
	visual.material = material
	var shadow := Polygon2D.new()
	shadow.name = "ContactShadow"
	var width := minf(float(visual.texture.get_width()) * magnification * 0.32, 112.0)
	var depth := 10.0 if kind == "house" else 5.0
	var outline := PackedVector2Array()
	for i in range(20):
		var angle := TAU * float(i) / 20.0
		outline.append(Vector2(roundf(cos(angle) * width), roundf(sin(angle) * depth)))
	shadow.polygon = outline
	shadow.color = Color(0.13, 0.22, 0.13, 0.18)
	add_child(shadow)
	add_child(visual)
	var raw: Array = data.get("solid_px", [])
	if raw.size() == 4 and float(raw[0]) > 0:
		var body := StaticBody2D.new()
		body.name = "Footprint"
		body.collision_layer = 1
		body.collision_mask = 0
		var shape := RectangleShape2D.new()
		shape.size = Vector2(float(raw[0]), float(raw[1]))
		var collider := CollisionShape2D.new()
		collider.shape = shape
		collider.position = Vector2(float(raw[2]), float(raw[3]))
		body.add_child(collider)
		add_child(body)
	var notifier := VisibleOnScreenNotifier2D.new()
	notifier.rect = Rect2(Vector2(-visual.texture.get_width() * magnification * .5, -visual.texture.get_height() * magnification), visual.texture.get_size() * magnification)
	notifier.screen_entered.connect(func() -> void: _on_screen = true)
	notifier.screen_exited.connect(func() -> void: _on_screen = false)
	add_child(notifier)
	if kind == "pole":
		set_process(false)
	if action in ["portal", "fish"]:
		var label := Label.new()
		label.name = "Wayfinding"
		label.text = world.local_text(str(data.name), str(data.get("name_en", data.name)))
		label.add_theme_font_override("font", world.FONT)
		label.add_theme_font_size_override("font_size", 16)
		label.add_theme_color_override("font_color", Color("fff0c6"))
		label.add_theme_color_override("font_outline_color", Color("304232"))
		label.add_theme_constant_override("outline_size", 5)
		label.position = Vector2(-70, -90)
		add_child(label)


func _process(delta: float) -> void:
	if not _on_screen or not is_instance_valid(world.player):
		return
	var actor: Node2D = world.player
	var bounds := Rect2(visual.position - visual.texture.get_size() * visual.scale * 0.5, visual.texture.get_size() * visual.scale)
	var behind := actor.global_position.y < global_position.y - 10.0 and bounds.has_point(to_local(actor.global_position) + Vector2(0, -36))
	visual.modulate.a = move_toward(visual.modulate.a, 0.50 if behind and kind in ["tree", "house", "bush"] else 1.0, delta * 3.0)


func action_world_point() -> Vector2:
	var offset: Array = info.get("interaction_offset_px", [0, 32])
	return global_position + Vector2(float(offset[0]), float(offset[1]))


func display_name() -> String:
	return world.local_text(str(info.name), str(info.get("name_en", info.name)))


func set_open(value: bool) -> void:
	opened = value
	(visual.material as ShaderMaterial).set_shader_parameter("opened", value)


func set_seat_occupied(value: bool) -> void:
	for part in _seat_parts:
		part.queue_free()
	_seat_parts.clear()
	visual.visible=not value
	if not value:
		return
	# Split the authored chair at the seat line. Back is behind the actor and
	# seat/legs cover the actor's lower legs; no replacement sprite is drawn.
	var texture: Texture2D=visual.texture
	for region in [Rect2(0,0,texture.get_width(),24),Rect2(0,24,texture.get_width(),texture.get_height()-24)]:
		var atlas:=AtlasTexture.new()
		atlas.atlas=texture
		atlas.region=region
		var part:=Sprite2D.new()
		part.texture=atlas
		part.scale=Vector2(2,2)
		part.position.y=-texture.get_height()*2+region.position.y*2+region.size.y
		part.z_index=-1 if region.position.y==0 else 1
		add_child(part)
		_seat_parts.append(part)
