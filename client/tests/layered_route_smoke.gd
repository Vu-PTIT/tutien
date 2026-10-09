extends SceneTree

# M1.4 layout regression: require walkable routes from the plaza to every
# house and future activity slot. Queries Godot physics, not map pixel colors.
const CELL := 16
var failures := 0


func _initialize() -> void:
    call_deferred("_run_checks")


func _check(ok: bool, reason: String) -> void:
    if ok:
        return
    failures += 1
    push_error("[VillageRoutes] " + reason)


func _cell(point: Vector2) -> Vector2i:
    return Vector2i(floori(point.x / CELL), floori(point.y / CELL))


func _v(raw: Array) -> Vector2:
    if raw.size() < 2:
        return Vector2.ZERO
    return Vector2(float(raw[0]), float(raw[1]))


func _run_checks() -> void:
    var scene := load("res://scenes/layered_village_m1.tscn") as PackedScene
    if scene == null:
        push_error("[VillageRoutes] Could not load game map")
        quit(1)
        return
    var stage := scene.instantiate() as Node2D
    root.add_child(stage)
    await process_frame
    await physics_frame
    await physics_frame
    var json: Dictionary = stage.get("layout")
    var world_size := _v(json.get("size", [1120, 800]))
    var grid := AStarGrid2D.new()
    grid.region = Rect2i(0, 0, ceili(world_size.x / CELL), ceili(world_size.y / CELL))
    grid.cell_size = Vector2(CELL, CELL)
    grid.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_NEVER
    grid.update()

    var query := PhysicsShapeQueryParameters2D.new()
    var probe := CircleShape2D.new()
    probe.radius = 5.0
    query.shape = probe
    query.collision_mask = 1
    query.collide_with_bodies = true
    query.collide_with_areas = false
    var state := stage.get_world_2d().direct_space_state
    var blocked := 0
    for y in range(grid.region.size.y):
        for x in range(grid.region.size.x):
            var p := Vector2(float(x * CELL + CELL / 2), float(y * CELL + CELL / 2))
            query.transform = Transform2D(0.0, p)
            if not state.intersect_shape(query, 1).is_empty():
                grid.set_point_solid(Vector2i(x, y), true)
                blocked += 1

    _check(blocked > 80, "Collision probe did not detect world obstacles")
    var start := _cell(_v(json.get("spawn", [493, 528])))
    _check(not grid.is_point_solid(start), "Player starts inside collision")
    var targets: Dictionary = {}
    var objects: Dictionary = {}
    for object in json.get("objects", []):
        objects[str(object.get("id", ""))] = object
    for assignment in json.get("door_routes", []):
        var object: Dictionary = objects[str(assignment.get("object_id", ""))]
        targets["entrance_" + str(object.get("id", ""))] = (
            _v(object.get("position", [])) + _v(object.get("interaction_offset", [0, 0])))
    for slot in json.get("activity_slots", []):
        targets["activity_" + str(slot.get("id", ""))] = _v(slot.get("position", []))
    targets["bridge_opposite_bank"] = Vector2(1080, 346)
    targets["plaza_market"] = Vector2(628, 573)
    targets["northern_lane"] = Vector2(423, 218)
    targets["southern_orchard"] = Vector2(710, 665)
    for name in targets:
        var destination: Vector2 = targets[name]
        var target_cell := _cell(destination)
        var walkable := grid.region.has_point(target_cell) and not grid.is_point_solid(target_cell)
        _check(walkable, "Target is embedded in a wall/water: " + str(name))
        if not walkable or grid.is_point_solid(start):
            continue
        var route := grid.get_point_path(start, target_cell)
        _check(route.size() >= 2, "No collision-free walkable route to " + str(name))
    if failures == 0:
        print("PASS Village routes: " + str(targets.size()) +
            " destinations reachable from plaza through Godot collision (" + str(blocked) +
            " blocked 16px probes).")
    stage.queue_free()
    await process_frame
    quit(0 if failures == 0 else 1)
