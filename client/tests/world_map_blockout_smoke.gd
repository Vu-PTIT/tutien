extends SceneTree

const MAP_IDS := [
	"m_lang_que", "m_thang_long", "m_vanh_dai_tay", "m_cang_dong_bac",
	"m_mo_lo_thien", "m_mo_ngam", "m_ba_vi", "m_tram_thien_mach"
]
var failures := 0


func _initialize() -> void:
	call_deferred("_run_checks")


func _check(condition: bool, message: String) -> void:
	if condition:
		return
	failures += 1
	push_error("[WorldMapBlockoutSmoke] " + message)


func _run_checks() -> void:
	var packed := load("res://scenes/world_map_blockout_preview.tscn") as PackedScene
	if packed == null:
		push_error("[WorldMapBlockoutSmoke] Preview scene failed to load")
		quit(1)
		return
	var stage := packed.instantiate()
	root.add_child(stage)
	await process_frame
	await process_frame
	_check(int(stage.get("map_count")) == 8, "Preview did not load all eight maps")
	_check(stage.get_node_or_null("MapRoot/L00_Ground/GroundBase") is Polygon2D, "Missing independent ground surface")
	_check(stage.get_node_or_null("MapRoot/L01_LandformsRoads/Roads") is Node2D, "Missing freeform roads layer")
	_check(stage.get_node_or_null("MapRoot/L02_WaterBodies") is Node2D, "Missing separate water layer")
	_check(stage.get_node_or_null("MapRoot/DATA_WaterCollision") is Node2D, "Missing water collision data layer")
	_check(stage.get_node_or_null("Overlay/LinksPanel") is PanelContainer, "Missing connected route panel")
	var ground := stage.get_node_or_null("MapRoot/L00_Ground/GroundBase") as Polygon2D
	if ground != null:
		_check(ground.material is ShaderMaterial, "Ground does not use the pixel surface shader")
	var route_lines := stage.get_node_or_null("MapRoot/L01_LandformsRoads/Roads")
	if route_lines != null and route_lines.get_child_count() > 0:
		_check(route_lines.get_child(0) is Line2D, "Roads are not rendered as independent spline strokes")

	for map_id in MAP_IDS:
		stage.call("_set_map", map_id)
		await process_frame
		_check(int(stage.get("road_count")) >= 3, map_id + " has fewer than three authored routes")
		_check(int(stage.get("portal_marker_count")) >= 1, map_id + " has no world-link marker")
		_check(stage.get_node_or_null("MapRoot/L00_Ground/GroundBase") != null, map_id + " has no ground scene")

	stage.call("_set_map", "m_mo_ngam")
	_check(str(stage.get("_active_floor_id")) == "b1", "Underground does not start on B1")
	_check(int(stage.get("portal_marker_count")) == 2, "B1 should show the outside link and B2 stair")
	stage.set("_active_floor_id", "b2")
	stage.call("_build_map", "m_mo_ngam")
	await process_frame
	_check(int(stage.get("portal_marker_count")) == 2, "B2 should show its locked forest link and B1 stair")
	_check(int(stage.get("water_count")) == 1, "B2 cave lake is missing")

	stage.call("_set_map", "m_thang_long")
	var links: Dictionary = stage.get("_links")
	var port_link: Dictionary
	for link in links.get("links", []):
		if str(link.get("id", "")) == "ln_thang_cang":
			port_link = link
			break
	stage.call("_activate_link", port_link, port_link.get("a", {}))
	await process_frame
	_check(str(stage.get("_active_map_id")) == "m_cang_dong_bac", "Transit preview failed to switch to the port")
	_check(str(stage.get("_status_label").text).contains("cục bộ"), "Transit preview is not labeled as local-only")
	stage.call("_set_map", "m_tram_thien_mach")
	var locked_button_found := false
	var route_list := stage.get("_route_list") as VBoxContainer
	if route_list != null:
		for child in route_list.get_children():
			if child is Button and str(child.text).contains("ln_rung_tram"):
				locked_button_found = child.disabled
	_check(locked_button_found, "Locked forest-to-station route must remain unavailable in local preview")

	if failures == 0:
		print("PASS Godot world-map blockout smoke: eight terrain maps, split mine floors, local links and locked gates.")
	stage.queue_free()
	await process_frame
	quit(0 if failures == 0 else 1)
