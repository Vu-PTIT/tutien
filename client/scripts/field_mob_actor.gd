class_name FieldMobActor
extends Node2D
## Map presentation for a server-owned monster. This actor never simulates combat.

const BOAR_SHEET: Texture2D = preload("res://assets/pixel/enemies/son_tru.png")
const SPIDER_SHEET: Texture2D = preload("res://assets/pixel/enemies/doc_chu/processed/sheet-transparent.png")
const CELL_SIZE := 64

var mob_id: String = ""
var enemy_id: String = ""
var mob_name: String = "Quái vật"
var hp: int = 0
var max_hp: int = 1
var _sprite: Sprite2D
var _label: Label
var _frame_texture: AtlasTexture
var _active_sheet: Texture2D
var _last_frame := -1
var _idle_phase: float = 0.0
var _sprite_base_y: float = -15.0

func _ready() -> void:
	_sprite = Sprite2D.new()
	_sprite.name = "Sprite"
	_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	_sprite.position = Vector2(0.0, -15.0)
	_frame_texture = AtlasTexture.new()
	_frame_texture.filter_clip = true
	_sprite.texture = _frame_texture
	add_child(_sprite)
	_label = Label.new()
	_label.name = "Name"
	_label.position = Vector2(-40.0, -51.0)
	_label.size = Vector2(80.0, 12.0)
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.add_theme_font_size_override("font_size", 8)
	_label.add_theme_color_override("font_color", Color("fff1c7"))
	_label.add_theme_color_override("font_shadow_color", Color("241e1b"))
	_label.add_theme_constant_override("shadow_offset_x", 1)
	_label.add_theme_constant_override("shadow_offset_y", 1)
	add_child(_label)

func present(snapshot: Dictionary) -> void:
	var incoming_id := str(snapshot.get("id", mob_id))
	if incoming_id != mob_id:
		_idle_phase = float(abs(incoming_id.hash() % 1000)) / 1000.0 * TAU
	mob_id = incoming_id
	enemy_id = str(snapshot.get("enemyId", enemy_id))
	mob_name = str(snapshot.get("name", mob_name))
	hp = int(snapshot.get("hp", 0))
	max_hp = maxi(int(snapshot.get("maxHp", 1)), 1)
	position = Vector2(float(snapshot.get("x", position.x)), float(snapshot.get("y", position.y)))
	visible = hp > 0
	var target_sheet: Texture2D = SPIDER_SHEET if enemy_id == "en_spider" else BOAR_SHEET
	if _frame_texture != null and _active_sheet != target_sheet:
		_active_sheet = target_sheet
		_frame_texture.atlas = target_sheet
		_frame_texture.region = Rect2(0, 0, CELL_SIZE, CELL_SIZE)
		_sprite.scale = Vector2.ONE
		_sprite_base_y = -11.0 if enemy_id == "en_spider" else -15.0
		_sprite.position.y = _sprite_base_y
		_last_frame = -1
	if _sprite != null:
		_sprite.flip_h = float(snapshot.get("faceX", -1.0)) > 0.0
		_update_animation_frame()
	if _label != null:
		_label.text = mob_name
	queue_redraw()

func _process(delta: float) -> void:
	if _sprite == null or not visible:
		return
	_idle_phase += delta * 1.8
	_sprite.position.y = _sprite_base_y + sin(_idle_phase) * 1.25
	_update_animation_frame()

func _update_animation_frame() -> void:
	if _frame_texture == null or _active_sheet == null:
		return
	var frame := int(floor(_idle_phase * 1.2)) % 2
	if frame == _last_frame:
		return
	_frame_texture.region = Rect2(frame * CELL_SIZE, 0, CELL_SIZE, CELL_SIZE)
	_last_frame = frame

func _draw() -> void:
	if hp <= 0:
		return
	var ratio := clampf(float(hp) / float(max_hp), 0.0, 1.0)
	draw_rect(Rect2(-19.0, -37.0, 38.0, 4.0), Color("3b2330"))
	draw_rect(Rect2(-18.0, -36.0, 36.0 * ratio, 2.0), Color("d97854"))
