class_name MapInteractable
extends Area2D
## Reusable, data-configured point of interest. Actions are dispatched by the
## map host; this scene only presents proximity and the local interaction hint.

var entity_id: String = ""
var action_kind: String = "inspect"
var action_label: String = "Tương tác"
var interaction_data: Dictionary = {}
var interaction_radius_px: float = 52.0
var _animation_clock: float = 0.0

@onready var marker: Sprite2D = $Marker
@onready var title_label: Label = $Title

func configure(data: Dictionary, tile_size_px: int) -> void:
	interaction_data = data.duplicate(true)
	entity_id = str(interaction_data.get("entity_id", ""))
	name = entity_id.replace(".", "_").replace("-", "_")
	action_kind = str(interaction_data.get("action_kind", "inspect"))
	action_label = str(interaction_data.get("action_label", "Tương tác"))
	var tile_position: Array = interaction_data.get("position_tiles", [0, 0])
	if tile_position.size() >= 2:
		position = (Vector2(float(tile_position[0]), float(tile_position[1])) + Vector2(0.5, 0.5)) * tile_size_px
	interaction_radius_px = float(interaction_data.get("interaction_radius_tiles", 1.75)) * tile_size_px
	var circle := $CollisionShape2D.shape as CircleShape2D
	if circle != null:
		circle.radius = interaction_radius_px
	title_label.text = str(interaction_data.get("display_name", "Điểm tương tác"))
	var icon_path := str(interaction_data.get("icon", ""))
	if not icon_path.is_empty():
		var icon := load(icon_path) as Texture2D
		if icon != null:
			marker.texture = icon

func is_in_range(point: Vector2) -> bool:
	return position.distance_to(point) <= interaction_radius_px

func set_focused(focused: bool) -> void:
	marker.visible = focused
	title_label.visible = focused

func prompt_text() -> String:
	return "E / Chạm  •  " + action_label

func _process(delta: float) -> void:
	_animation_clock += delta
	marker.position.y = -28.0 + sin(_animation_clock * 4.0) * 1.5
