extends "res://scripts/village_player.gd"

# Reuses the corrected four-direction pixel sprite sheet; removes the legacy
# camera bounds/zoom and allows one visibly seated interaction in the M1 slice.
var seated := false


func _ready() -> void:
    super._ready()
    move_speed = 112.0
    camera.zoom = Vector2(1.6, 1.6)


func set_world_bounds(bounds: Vector2) -> void:
    camera.limit_left = 0
    camera.limit_top = 0
    camera.limit_right = roundi(bounds.x)
    camera.limit_bottom = roundi(bounds.y)


func sit_at(seat_position: Vector2) -> void:
    seated = true
    collision_mask = 0
    velocity = Vector2.ZERO
    global_position = seat_position
    _update_animation(Vector2.ZERO)


func leave_seat() -> void:
    seated = false
    global_position += Vector2(0, 20)
    collision_mask = 1


func _physics_process(delta: float) -> void:
    if seated:
        velocity = Vector2.ZERO
        return
    super._physics_process(delta)
