extends Node2D

# A reusable world-space prop. Position == ground/feet anchor, NOT PNG top-left.
# Visuals, solid collision, interaction sensing and access point are independent.
var object_id: String = ""
var display_name: String = ""
var kind: String = ""
var action: String = ""
var flavor_text: String = ""
var art_role: String = ""
var art_status: String = ""
var access_offset := Vector2.ZERO
var interaction_radius := 48.0
var opened := false
var changed := false

var _visual: Sprite2D
var _sway_pivot: Node2D
var _wind_time := 0.0
var _wind_phase := 0.0
var _open_door: ColorRect


func configure(info: Dictionary) -> void:
    object_id = str(info.get("id", ""))
    display_name = str(info.get("name", object_id))
    kind = str(info.get("kind", ""))
    action = str(info.get("action", ""))
    flavor_text = str(info.get("flavor_text", ""))
    art_role = str(info.get("art_role", ""))
    art_status = str(info.get("art_status", ""))
    position = _vec(info.get("position", [0, 0]))
    access_offset = _vec(info.get("interaction_offset", [0, 16]))
    interaction_radius = float(info.get("radius", 48.0))
    texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    _create_visual(str(info.get("texture", "")))
    _create_collision(info.get("solid", []))
    _create_interaction_area()
    _wind_phase = float(absi(object_id.hash()) % 314) * 0.02
    set_process(kind == "tree" or kind == "bush")
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
    _sway_pivot = Node2D.new()
    _sway_pivot.name = "SwayPivot"
    add_child(_sway_pivot)
    _visual = Sprite2D.new()
    _visual.name = "Visual"
    var texture := load(resource_path) as Texture2D
    if texture == null:
        push_error("Missing layered prop texture: " + resource_path)
    else:
        _visual.texture = texture
        _visual.position = Vector2(0.0, -float(texture.get_height()) / 2.0)
        _create_contact_shadow(texture)
    _visual.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    _sway_pivot.add_child(_visual)


func _create_contact_shadow(texture: Texture2D) -> void:
    if kind not in ["house", "tree", "bush", "rock", "well", "bench", "crate", "haystack"]:
        return
    # Anchored to the ground footprint, independent from the tree canopy sway.
    # Three pixel-step silhouettes give depth without baked shadows in terrain.
    var size := texture.get_size()
    var width := minf(float(size.x) * 0.43, 73.0)
    var height := 9.0 if kind in ["house", "well"] else 5.0
    if kind == "rock" or kind == "bush":
        height = 3.0
    for ring in range(3):
        var ellipse := Polygon2D.new()
        ellipse.name = "ContactShadow_%d" % ring
        ellipse.color = Color(0.14, 0.24, 0.12, 0.055 + float(2 - ring) * 0.041)
        var outline := PackedVector2Array()
        var half_w := maxf(3.0, width + float(2 - ring) * 1.8)
        var half_h := maxf(2.0, height + float(2 - ring) * 1.4)
        for i in range(20):
            var angle := TAU * float(i) / 20.0
            outline.append(Vector2(roundi(cos(angle) * half_w), roundi(sin(angle) * half_h) + 1))
        ellipse.polygon = outline
        add_child(ellipse)


func _process(delta: float) -> void:
    if not is_visible_in_tree() or _sway_pivot == null:
        return
    _wind_time += delta
    var breeze := 0.014 if kind == "tree" else 0.008
    _sway_pivot.rotation = sin(_wind_time * 0.9 + _wind_phase) * breeze + sin(_wind_time * 0.4 + _wind_phase * 2.0) * breeze * 0.42


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
            var message := display_name + (": cửa đã mở (demo offline)." if opened else ": cửa đã đóng.")
            if opened and not flavor_text.is_empty():
                message = flavor_text + " (Cửa mẫu vừa mở; chưa có nội thất.)"
            return {"message": message}
        "communal":
            # The physical building remains a separate scene with its own
            # footprint. No fake interior, quest or platform RPC is triggered.
            return {"message": flavor_text if not flavor_text.is_empty() else display_name + ": điểm sinh hoạt cộng đồng."}
        "well":
            changed = true
            var glint := create_tween()
            glint.tween_property(_visual, "modulate", Color(0.72, 0.88, 1.0), 0.17)
            glint.tween_property(_visual, "modulate", Color.WHITE, 0.3)
            return {"message": flavor_text if not flavor_text.is_empty() else "Giếng làng; chưa có vật phẩm nước."}
        "market":
            return {"message": flavor_text if not flavor_text.is_empty() else "Chợ phiên mẫu, chưa có giao dịch."}
        "place_info":
            return {"message": flavor_text if not flavor_text.is_empty() else display_name}
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
            var text_message := flavor_text if not flavor_text.is_empty() else "Điểm câu cá mẫu."
            return {"message": text_message + " Chưa có auto hoặc phần thưởng server."}
        "notice":
            return {"message": flavor_text if not flavor_text.is_empty() else "Bảng tin thử nghiệm: kết nối nền tảng sẽ thực hiện sau."}
        _:
            return {"message": "Chưa có hành động cho " + display_name + "."}


func _vec(raw: Array) -> Vector2:
    if raw.size() < 2:
        return Vector2.ZERO
    return Vector2(float(raw[0]), float(raw[1]))
