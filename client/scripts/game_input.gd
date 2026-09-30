class_name GameInput
extends Node
## Translate keyboard and pointer input into shared client actions.

signal action_requested(action: String)

const KEY_BINDINGS := {
	"move_left": [KEY_A, KEY_LEFT],
	"move_right": [KEY_D, KEY_RIGHT],
	"move_up": [KEY_W, KEY_UP],
	"move_down": [KEY_S, KEY_DOWN],
	"attack": [KEY_J, KEY_Q],
	"dodge": [KEY_SPACE],
	"inventory": [KEY_I],
	"character": [KEY_C],
	"social": [KEY_G],
	"close": [KEY_ESCAPE],
	"touch_preview": [KEY_F9],
}
const COMMANDS := ["inventory", "character", "social", "attack", "dodge"]

func movement() -> Vector2:
	return Input.get_vector("move_left", "move_right", "move_up", "move_down")

func _ready() -> void:
	var needs_mouse_attack := not InputMap.has_action("attack")
	for action: String in KEY_BINDINGS:
		if InputMap.has_action(action):
			continue
		InputMap.add_action(action)
		for key: int in KEY_BINDINGS[action]:
			var binding := InputEventKey.new()
			binding.physical_keycode = key
			InputMap.action_add_event(action, binding)
	if needs_mouse_attack:
		var mouse_attack := InputEventMouseButton.new()
		mouse_attack.button_index = MOUSE_BUTTON_LEFT
		InputMap.action_add_event("attack", mouse_attack)

func aim(touch_enabled: bool, pointer: Vector2, origin: Vector2) -> Vector2:
	if touch_enabled:
		return Vector2.RIGHT
	var pointer_direction := pointer - origin
	return pointer_direction.normalized() if pointer_direction.length_squared() > 0.01 else Vector2.RIGHT

func request_action(action: String) -> void:
	action_requested.emit(action)

func handle_event(event: InputEvent, touch_enabled: bool, typing: bool) -> bool:
	if event is InputEventKey and (not event.pressed or event.echo):
		return false
	if event is InputEventMouseButton and not event.pressed:
		return false
	if event.is_action_pressed("close"):
		request_action("close")
		return true
	if event.is_action_pressed("touch_preview"):
		request_action("touch_preview")
		return true
	if typing:
		return false
	for action: String in COMMANDS:
		if event.is_action_pressed(action):
			if touch_enabled and event is InputEventMouseButton:
				return false
			request_action(action)
			return true
	return false
