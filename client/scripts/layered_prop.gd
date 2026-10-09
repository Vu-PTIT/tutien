extends Node2D

# A reusable world-space prop. Position == ground/feet anchor, NOT PNG top-left.
# Visuals, solid collision, interaction sensing and access point are independent.
var object_id: String = ""
var display_name: String = ""
var kind: String = ""
var action: String = ""
var access_offset := Vector2.ZERO
var interaction_radius := 48.0
var opened := false
var changed := false

var _visual: Sprite2D
var _open_door: ColorRect


func configure(info: Dictionary) -> void:
    object_id = str(info.get("id", ""))
    display_name = str(info.get("name", object_id))
    kind = str(info.get("kind", ""))
    action = str(info.get("action", ""))
    position = _vec(info.get("position", [0, 0]))
    access_offset = _vec(info.get("interaction_offset", [0, 16]))
    interaction_radius = float(info.get("radius", 48.0))
    texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    _create_visual(str(info.get("texture", "")))
    _create_collision(info.get("solid", []))
    _create_interaction_area()
    if action == "door":
        _open_door = ColorRect.new()
        _open_door.name = "OpenDoorIndicator"
        _open_door.mouse_filter = Control.MOUSE_FILTER_IGNORE
        _open_door.color = Color(0.16, 0.12, 0.08, 1.0)
        _open_door.size = Vector2(9, 13)
        _open_door.position = _vec(info.get("door_offset", [0, -16])) + Vector2(-4, 0)
        _open_door.visible = false
        add_child(_open_door)


func _create_visual(resource_path: String) -> void:
    _visual = Sprite2D.new()
    _visual.name = "Visual"
    var texture := load(resource_path) as Texture2D
    if texture == null:
        push_error("Missing layered prop texture: " + resource_path)
    else:
        _visual.texture = texture
        _visual.position = Vector2(0.0, -float(texture.get_height()) / 2.0)
    _visual.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    add_child(_visual)


func _create_collision(raw: Array) -> void:
    if raw.size() < 4 or float(raw[0]) <= 0.0 or float(raw[1]) <= 0.0:
        return
    var body := StaticBody2D.new()
    body.name = "SolidFootprint"
    body.collision_layer = 1
    body.collision_mask = 0
    var shape := RectangleShape2D.new()
    shape.size = Vector2(float(raw[0]), float(raw[1]))
    var node := CollisionShape2D.new()
    node.shape = shape
    node.position = Vector2(float(raw[2]), float(raw[3]))
    body.add_child(node)
    add_child(body)


func _create_interaction_area() -> void:
    if action.is_empty():
        return
    var area := Area2D.new()
    area.name = "InteractionArea"
    area.position = access_offset
    area.collision_layer = 0
    area.collision_mask = 2
    area.monitoring = true
    var sensor := CollisionShape2D.new()
    var circle := CircleShape2D.new()
    circle.radius = interaction_radius
    sensor.shape = circle
    area.add_child(sensor)
    add_child(area)


func action_world_point() -> Vector2:
    return global_position + access_offset


func is_in_range(actor: CharacterBody2D) -> bool:
    if action.is_empty():
        return false
    var area := get_node_or_null("InteractionArea") as Area2D
    if area == null or not area.overlaps_body(actor):
        return false
    return actor.global_position.distance_to(action_world_point()) <= interaction_radius


func interact() -> Dictionary:
    match action:
        "door":
            opened = not opened
            _open_door.visible = opened
            return {"message": display_name + (": cửa đã mở (demo offline)." if opened else ": cửa đã đóng.")}
        "bench":
            return {"message": "Đang ngồi ở " + display_name + ". Nhấn E để đứng dậy.", "sit": true}
        "tree":
            changed = not changed
            _visual.modulate = Color(0.79, 0.95, 0.76) if changed else Color.WHITE
            var tween := create_tween()
            tween.tween_property(_visual, "rotation_degrees", 6.0, 0.12)
            tween.tween_property(_visual, "rotation_degrees", -5.0, 0.14)
            tween.tween_property(_visual, "rotation_degrees", 0.0, 0.16)
            return {"message": "Bạn vừa chạm vào " + display_name + ". Không có loot online."}
        "plant":
            changed = not changed
            _visual.modulate = Color(0.69, 0.91, 0.55) if changed else Color.WHITE
            return {"message": display_name + " đã đổi trạng thái trong bản demo offline."}
        "fishing":
            return {"message": "Đây là slot câu cá mẫu; chưa có auto hoặc phần thưởng server."}
        "notice":
            return {"message": "Bảng tin thử nghiệm: hoạt động platform sẽ kết nối sau."}
        _:
            return {"message": "Chưa có hành động cho " + display_name + "."}


func _vec(raw: Array) -> Vector2:
    if raw.size() < 2:
        return Vector2.ZERO
    return Vector2(float(raw[0]), float(raw[1]))
