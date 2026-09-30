class_name TouchControls
extends Control
## Landscape touch controls share the same movement and actions as the keyboard.
## Input is tracked by touch index so a second finger can press an action button.

signal action_requested(action: String)

const JOYSTICK_CENTER := Vector2(78, 282)
const JOYSTICK_RADIUS := 48.0
const DEAD_ZONE := 0.16

var direction := Vector2.ZERO
var _touch_index := -1
var _mouse_held := false
var _combat_mode := false
var _field_combat_mode := false
var equipped_skill_id: String = ""
var equipped_skill_name: String = "Kỹ năng"
var _field_action_label := "Đánh"
var language_manager: Variant

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	language_manager = get_node_or_null("/root/LanguageManager")
	if language_manager != null:
		language_manager.locale_changed.connect(_on_language_changed)
	$Interact.pressed.connect(func() -> void: action_requested.emit("interact"))
	$Attack.pressed.connect(func() -> void: action_requested.emit("attack"))
	$Dodge.pressed.connect(func() -> void: action_requested.emit("dodge"))
	$Skill.pressed.connect(func() -> void: action_requested.emit("skill_1"))
	set_combat_mode(false)
	visible = false

func set_controls_visible(enabled: bool) -> void:
	if visible == enabled:
		return
	visible = enabled
	if not enabled:
		clear_input()
	queue_redraw()

func set_combat_mode(enabled: bool) -> void:
	if _combat_mode == enabled and $Interact.visible != enabled:
		return
	_combat_mode = enabled
	_field_combat_mode = false
	_field_action_label = "Đánh"
	$Interact.visible = not enabled
	$Attack.visible = enabled
	$Dodge.visible = enabled
	$Skill.visible = false
	$Interact.position = Vector2(548.0, 268.0)
	$Interact.size = Vector2(80.0, 74.0)
	clear_input()

func set_field_combat_mode(enabled: bool, action_label: String = "Đánh") -> void:
	if _field_combat_mode == enabled and _field_action_label == action_label and $Interact.visible:
		return
	_combat_mode = false
	_field_combat_mode = enabled
	_field_action_label = action_label
	$Interact.visible = true
	$Attack.visible = enabled
	$Attack.text = tr(action_label) if enabled else tr("Đánh")
	$Dodge.visible = false
	$Skill.visible = enabled and not equipped_skill_id.is_empty()
	$Skill.text = tr(equipped_skill_name)
	$Skill.position = Vector2(548.0, 204.0)
	$Skill.size = Vector2(80.0, 54.0)
	$Interact.position = Vector2(468.0, 208.0) if enabled else Vector2(548.0, 268.0)
	$Interact.size = Vector2(72.0, 54.0) if enabled else Vector2(80.0, 74.0)
	clear_input()

func set_equipped_skill(skill_id: String, skill_name: String) -> void:
	equipped_skill_id = skill_id
	equipped_skill_name = skill_name
	if _field_combat_mode:
		$Skill.visible = not equipped_skill_id.is_empty()
		$Skill.text = tr(equipped_skill_name)

func _on_language_changed(_locale: String) -> void:
	if _field_combat_mode:
		$Attack.text = tr(_field_action_label) if $Attack.visible else tr("Đánh")
		$Skill.text = tr(equipped_skill_name)

func clear_input() -> void:
	direction = Vector2.ZERO
	_touch_index = -1
	_mouse_held = false
	queue_redraw()

func _input(event: InputEvent) -> void:
	if not visible:
		return
	if event is InputEventScreenTouch:
		if event.pressed and _touch_index < 0 and event.position.distance_to(JOYSTICK_CENTER) <= JOYSTICK_RADIUS + 12.0:
			_touch_index = event.index
			_update_direction(event.position)
			get_viewport().set_input_as_handled()
		elif not event.pressed and event.index == _touch_index:
			clear_input()
			get_viewport().set_input_as_handled()
	elif event is InputEventScreenDrag and event.index == _touch_index:
		_update_direction(event.position)
		get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and _touch_index < 0:
		if event.pressed and event.position.distance_to(JOYSTICK_CENTER) <= JOYSTICK_RADIUS + 12.0:
			_mouse_held = true
			_update_direction(event.position)
			get_viewport().set_input_as_handled()
		elif not event.pressed and _mouse_held:
			clear_input()
			get_viewport().set_input_as_handled()
	elif event is InputEventMouseMotion and _mouse_held:
		_update_direction(event.position)
		get_viewport().set_input_as_handled()

func _update_direction(point: Vector2) -> void:
	var displacement := (point - JOYSTICK_CENTER) / JOYSTICK_RADIUS
	direction = displacement.limit_length()
	if direction.length() < DEAD_ZONE:
		direction = Vector2.ZERO
	queue_redraw()

func _draw() -> void:
	if not visible:
		return
	draw_circle(JOYSTICK_CENTER, JOYSTICK_RADIUS + 9.0, Color(0.04, 0.10, 0.13, 0.55))
	draw_arc(JOYSTICK_CENTER, JOYSTICK_RADIUS + 7.0, 0, TAU, 48, Color(0.60, 0.75, 0.62, 0.8), 2.0)
	draw_circle(JOYSTICK_CENTER + direction * (JOYSTICK_RADIUS - 15.0), 20.0, Color(0.26, 0.43, 0.38, 0.85))
