class_name TouchControls
extends Control
## Landscape touch controls share the same movement and actions as the keyboard.
## Input is tracked by touch index so a second finger can press an action button.

signal action_requested(action: String)
signal sprint_changed(enabled: bool)

const JOYSTICK_CENTER := Vector2(78, 282)
const JOYSTICK_RADIUS := 48.0
const DEAD_ZONE := 0.16

var direction := Vector2.ZERO
var _touch_index := -1
var _mouse_held := false
var _combat_mode := false
var _field_combat_mode := false

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	$Interact.pressed.connect(func() -> void: action_requested.emit("interact"))
	$Attack.pressed.connect(func() -> void: action_requested.emit("attack"))
	$Dodge.pressed.connect(func() -> void: action_requested.emit("dodge"))
	$Hop.pressed.connect(func() -> void: action_requested.emit("hop"))
	$Run.toggled.connect(_on_run_toggled)
	set_combat_mode(false)
	visible = false

func set_controls_visible(enabled: bool) -> void:
	if visible == enabled:
		return
	visible = enabled
	if not enabled:
		clear_input(true)
	queue_redraw()

func set_combat_mode(enabled: bool) -> void:
	if _combat_mode == enabled and $Interact.visible == not enabled:
		return
	_combat_mode = enabled
	_field_combat_mode = false
	$Interact.visible = not enabled
	$Attack.visible = enabled
	$Dodge.visible = enabled
	$Dodge.text = "Né"
	$Run.visible = false
	$Hop.visible = false
	$Interact.position = Vector2(552.0, 207.0)
	$Interact.size = Vector2(80.0, 52.0)
	$Attack.position = Vector2(552.0, 207.0)
	$Attack.size = Vector2(80.0, 52.0)
	$Dodge.position = Vector2(552.0, 267.0)
	$Dodge.size = Vector2(80.0, 62.0)
	clear_input(true)

func set_field_combat_mode(enabled: bool) -> void:
	if _field_combat_mode == enabled and $Interact.visible and $Run.visible:
		return
	_combat_mode = false
	_field_combat_mode = enabled
	$Interact.visible = true
	$Attack.visible = enabled
	$Dodge.visible = true
	$Dodge.text = "Lướt"
	$Run.visible = true
	$Hop.visible = true
	$Interact.position = Vector2(468.0, 207.0) if enabled else Vector2(552.0, 207.0)
	$Interact.size = Vector2(76.0, 52.0) if enabled else Vector2(80.0, 52.0)
	$Attack.position = Vector2(552.0, 207.0)
	$Attack.size = Vector2(76.0, 52.0)
	$Dodge.position = Vector2(552.0, 267.0)
	$Dodge.size = Vector2(76.0, 62.0)
	$Hop.position = Vector2(468.0, 267.0)
	$Hop.size = Vector2(76.0, 62.0)
	$Run.position = Vector2(384.0, 267.0)
	$Run.size = Vector2(76.0, 62.0)
	clear_input(true)

func clear_input(reset_sprint: bool = false) -> void:
	direction = Vector2.ZERO
	_touch_index = -1
	_mouse_held = false
	if reset_sprint and $Run.button_pressed:
		$Run.set_pressed_no_signal(false)
		sprint_changed.emit(false)
	queue_redraw()

func _on_run_toggled(enabled: bool) -> void:
	$Run.text = "Chạy ✓" if enabled else "Chạy"
	sprint_changed.emit(enabled)

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
