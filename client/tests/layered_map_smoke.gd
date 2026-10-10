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
        var material := ground.material as ShaderMaterial
        if material != null:
            _check(bool(material.get_shader_parameter("source_art_enabled")), "M1.6 source materials are inactive")
            _check(material.get_shader_parameter("source_grass") is Texture2D, "Missing ground pixel-art atlas")
    var road_surface := stage.get_node_or_null("road_west_east") as Polygon2D
    if road_surface != null:
        var road_mat := road_surface.material as ShaderMaterial
        _check(road_mat != null, "Road shader material missing")
        if road_mat != null:
            _check(road_mat.get_shader_parameter("source_road") is Texture2D, "Road no longer has source pixel art")
    var water_surface := stage.get_node_or_null("river_east_water") as Polygon2D
    if water_surface != null:
        var water_mat := water_surface.material as ShaderMaterial
        _check(water_mat != null, "Water shader material missing")
        if water_mat != null:
            _check(water_mat.get_shader_parameter("source_water") is Texture2D, "Water no longer has source pixel art")
    var ground_art := stage.get_node_or_null("L0_GroundArtRaster")
    _check(ground_art != null, "M1.6 layered foundation raster missing")
    if ground_art != null:
        _check(int(ground_art.get("chunk_count")) >= 12, "Ground art did not compose raster chunks")
        _check(int(ground_art.get("stamp_count")) >= 160, "Ground art atlas fragments missing")
        # Sprite coverage must stop EXACTLY at the runtime world border,
        # otherwise the last 256px texture leaks random stamps into emptiness.
        var edge_x := ground_art.get_node_or_null("GrassRaster_4_0") as Sprite2D
        _check(edge_x != null, "Last grass chunk column is missing")
        if edge_x != null:
            _check(edge_x.texture.get_width() == 96, "Rightmost grass chunk exceeds 1120px world")
        var edge_y := ground_art.get_node_or_null("GrassRaster_0_3") as Sprite2D
        _check(edge_y != null, "Last grass chunk row is missing")
        if edge_y != null:
            _check(edge_y.texture.get_height() == 32, "Bottom grass chunk exceeds 800px world")
    _check(stage.get_node_or_null("river_east_water") is Polygon2D, "Missing real water polygon")
    _check(stage.get_node_or_null("road_west_east") is Polygon2D, "Missing freeform road")
    _check(stage.get_node_or_null("garden_bed_a") is Polygon2D, "Missing independent garden soil")
    _check(stage.get_node_or_null("Lminus1_ScenicBackdrop") is Polygon2D, "Map ends abruptly outside world bounds")
    var backdrop := stage.get_node_or_null("Lminus1_ScenicBackdrop") as Polygon2D
    if backdrop != null:
        _check(backdrop.polygon[0].x < 0.0, "Scenic boundary fails to extend to the left")
        _check(backdrop.polygon[2].x > 1120.0, "Scenic boundary fails to extend beyond river")
    _check(stage.get_node_or_null("road_west_east_meadow_fringe") is Polygon2D,
        "Road-to-grass natural transition missing")
    _check(stage.get_node_or_null("river_east_meadow_fringe") is Polygon2D,
        "River-to-grass natural transition missing")
    _check(stage.get_node_or_null("river_east_shallows") is Polygon2D,
        "Shallow river margin missing")
    _check(stage.get_node_or_null("village_heart_paving") is Polygon2D, "Village center lacks shared cobblestone plaza")
    _check(stage.get_node_or_null("market_terrace_paving") is Polygon2D, "Missing outdoor market yard")
    var world_data: Dictionary = stage.get("layout")
    _check(world_data.get("districts", []).size() >= 5, "Named village districts are missing")
    _check(world_data.get("door_routes", []).size() >= 5, "Homes lack connected access routes")
    _check(world_data.get("landscape_clusters", []).size() >= 3, "No organized grove areas")
    var hall_data: Dictionary = {}
    for entry in world_data.get("objects", []):
        if str(entry.get("id", "")) == "communal_hall":
            hall_data = entry
            break
    _check(not hall_data.is_empty(), "M2.0 communal hall data missing")
    if not hall_data.is_empty():
        _check(str(hall_data.get("art_status", "")) == "generated_v1", "M2.0 communal hall not using generated art")
        var sprite_tex := load(str(hall_data.get("texture", ""))) as Texture2D
        _check(sprite_tex != null, "M2.0 Vietnamese hall texture missing")
        if sprite_tex != null:
            _check(sprite_tex.get_size() == Vector2(176, 103), "Hall sprite texture dimensions have drifted")

    var main_road: Dictionary = world_data.get("roads", [])[0]
    _check(main_road.get("width_profile", []).size() == main_road.get("points", []).size(),
        "Road width variations are missing")

    var culture := stage.get_node_or_null("L4_CulturalPlaces")
    _check(culture != null, "M1.9 cultural zone scenes missing")
    if culture != null:
        _check(int(culture.get("zone_count")) == 8, "Expected eight village identity zones")
        var square: Dictionary = culture.call("zone_at", Vector2(530, 500))
        _check(not square.is_empty(), "Player cannot discover village square")
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
    var water_accents := stage.get_node_or_null("L2_AnimatedWaterAccents")
    _check(water_accents != null, "M1.5 water effects node missing")
    if water_accents != null:
        _check(int(water_accents.get("ripple_count")) >= 30, "Too few water ripple accents")
        _check(int(water_accents.get("foam_count")) >= 8, "Shoreline foam not generated")
    var cliff_accents := stage.get_node_or_null("L2_CliffArtDetails")
    _check(cliff_accents != null, "M1.5 terrain art node missing")
    if cliff_accents != null:
        _check(int(cliff_accents.get("detail_count")) >= 10, "Cliff moss and crack details absent")
    var landforms := stage.get_node_or_null("L2_Landforms_Bridges_Shorelines")
    _check(landforms != null, "Missing separate landform renderer")
    if landforms != null:
        _check(int(landforms.get("terrace_count")) == 2, "Expected two authored ridges")
        _check(int(landforms.get("bridge_count")) == 1, "Timber bridge was not built")
        _check(int(landforms.get("shoreline_count")) == 2, "Bank outlines out of sync")
        _check(landforms.get_node_or_null("TerraceWall_northwest_hillside") is StaticBody2D, "North cliff collision missing")
        _check(landforms.get_node_or_null("BridgeRail_east_river_footbridge_1") is StaticBody2D, "Bridge rail collision missing")
    var collision_root := stage.get_node_or_null("L2_WaterCollision")
    _check(collision_root != null, "Missing water collision root")
    if collision_root != null:
        _check(collision_root.get_child_count() >= 2, "Water collision pieces missing")
        for body in collision_root.get_children():
            _check(body is StaticBody2D, "Water blocker is not a static body")
            _check(body.get_child_count() == 1 && body.get_child(0) is CollisionPolygon2D,
                "Water collider must follow the coastline polygon")

    var sorted := stage.get_node_or_null("L3_YSort_Props_and_Player")
    _check(sorted != null, "Missing independent Y-sorted prop layer")
    var door: Node2D
    var tree: Node2D
    var bench: Node2D
    var communal: Node2D
    var well: Node2D
    var market: Node2D
    var prop_count := 0
    if sorted != null:
        _check(sorted.y_sort_enabled, "Y sorting is disabled")
        for child in sorted.get_children():
            _check(not child is TileMapLayer, "New stage must not load a TileMapLayer")
            if child.has_method("interact"):
                prop_count += 1
                var act := str(child.get("action"))
                if act == "communal":
                    communal = child
                elif act == "well":
                    well = child
                elif act == "market":
                    market = child
                if act == "door" && door == null:
                    door = child
                elif act == "tree" && tree == null:
                    tree = child
                elif act == "bench" && bench == null:
                    bench = child
        _check(prop_count >= 50, "Missing separately anchored scenery props")
    var actor := stage.get_node_or_null("L3_YSort_Props_and_Player/Player")
    _check(actor is CharacterBody2D, "Missing playable CharacterBody2D")
    _check(communal != null, "Vietnamese communal hall action missing")
    _check(well != null, "Village well action missing")
    _check(market != null, "Village market action missing")
    if communal != null:
        var hall_message: Dictionary = communal.call("interact")
        _check(not str(hall_message.get("message", "")).is_empty(), "Communal hall text missing")
    if well != null:
        well.call("interact")
        _check(bool(well.get("changed")), "Village well does not change state locally")
    if market != null:
        var market_message: Dictionary = market.call("interact")
        _check(str(market_message.get("message", "")).contains("chợ phiên") or str(market_message.get("message", "")).contains("Chợ phiên"), "Market text missing")
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
