extends SceneTree

# Live Godot 4.6.1 smoke test for the isolated, non-TileMap M1 scene.
# Run with: godot --headless --path client --script res://tests/layered_map_smoke.gd
var failures := 0


func _initialize() -> void:
    call_deferred("_run_checks")


func _check(condition: bool, message: String) -> void:
    if condition:
        return
    failures += 1
    push_error("[LayeredMapSmoke] " + message)


func _run_checks() -> void:
    var packed := load("res://scenes/layered_village_m1.tscn") as PackedScene
    if packed == null:
        push_error("[LayeredMapSmoke] Scene resource failed to load")
        quit(1)
        return
    var stage := packed.instantiate()
    root.add_child(stage)
    await process_frame
    await physics_frame

    var ground := stage.get_node_or_null("L0_Ground") as Polygon2D
    _check(ground != null, "Missing ground polygon")
    if ground != null:
        _check(ground.material is ShaderMaterial, "Ground does not use pixel shader")
    _check(stage.get_node_or_null("river_east_water") is Polygon2D, "Missing real water polygon")
    _check(stage.get_node_or_null("road_west_east") is Polygon2D, "Missing freeform road")
    _check(stage.get_node_or_null("garden_bed_a") is Polygon2D, "Missing independent garden soil")
    _check(stage.get_node_or_null("LayeredMapHUD/MapOverview") != null, "Missing shared-data minimap")

    var decals := stage.get_node_or_null("L1_RasterBrushChunks")
    _check(decals != null, "Missing authored pixel-art raster brushes")
    if decals != null:
        _check(int(decals.get("stamp_count")) >= 120, "Missing foliage and shoreline brushwork")
        _check(int(decals.get("raster_chunk_count")) > 2, "Raster brushwork was not composited into chunks")
    var info_label := stage.get_node_or_null("LayeredMapHUD/InfoPanel/InfoLabel") as Label
    _check(info_label != null, "Missing readable high-contrast HUD")
    if info_label != null:
        var text_color: Color = info_label.get_theme_color("font_color")
        _check(text_color.r > 0.8 and text_color.g > 0.8, "HUD text is not light on dark")
    var collision_root := stage.get_node_or_null("L2_WaterCollision")
    _check(collision_root != null, "Missing water collision root")
    if collision_root != null:
        _check(collision_root.get_child_count() == 2, "Expected two water collision bodies")
        for body in collision_root.get_children():
            _check(body is StaticBody2D, "Water blocker is not a static body")
            _check(body.get_child_count() == 1 && body.get_child(0) is CollisionPolygon2D,
                "Water collider must follow the coastline polygon")

    var sorted := stage.get_node_or_null("L3_YSort_Props_and_Player")
    _check(sorted != null, "Missing independent Y-sorted prop layer")
    var door: Node2D
    var tree: Node2D
    var bench: Node2D
    var prop_count := 0
    if sorted != null:
        _check(sorted.y_sort_enabled, "Y sorting is disabled")
        for child in sorted.get_children():
            _check(not child is TileMapLayer, "New stage must not load a TileMapLayer")
            if child.has_method("interact"):
                prop_count += 1
                var act := str(child.get("action"))
                if act == "door" && door == null:
                    door = child
                elif act == "tree" && tree == null:
                    tree = child
                elif act == "bench" && bench == null:
                    bench = child
        _check(prop_count >= 50, "Missing separately anchored scenery props")
    var actor := stage.get_node_or_null("L3_YSort_Props_and_Player/Player")
    _check(actor is CharacterBody2D, "Missing playable CharacterBody2D")
    if door != null:
        door.call("interact")
        _check(bool(door.get("opened")), "Door action must change local visual state")
    else:
        _check(false, "No test door")
    if tree != null:
        tree.call("interact")
        _check(bool(tree.get("changed")), "Tree action must change local visual state")
    else:
        _check(false, "No test tree")
    if bench != null:
        var result: Dictionary = bench.call("interact")
        _check(bool(result.get("sit", false)), "Bench lacks sit action")
    else:
        _check(false, "No test bench")
    if failures == 0:
        print("PASS Godot layered-map smoke: freeform surfaces, polygon collision, props, minimap, local interaction.")
    stage.queue_free()
    await process_frame
    quit(0 if failures == 0 else 1)
