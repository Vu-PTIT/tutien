extends SceneTree

const MAP_IDS := [
	"m_lang_que", "m_thang_long", "m_vanh_dai_tay", "m_cang_dong_bac",
	"m_mo_lo_thien", "m_mo_ngam", "m_ba_vi", "m_tram_thien_mach"
]
const OUTPUT_DIR := "/tmp/tutien-previews"


func _initialize() -> void:
	call_deferred("_capture_maps")


func _capture_maps() -> void:
	var packed := load("res://scenes/world_map_blockout_preview.tscn") as PackedScene
	if packed == null:
		push_error("Could not load world-map blockout preview scene")
		quit(1)
		return
	var preview := packed.instantiate()
	root.add_child(preview)
	var err := DirAccess.make_dir_recursive_absolute(OUTPUT_DIR)
	if err != OK:
		push_error("Could not create preview capture directory: " + str(err))
		quit(1)
		return
	for map_id in MAP_IDS:
		preview.call("_set_map", map_id)
		await _settle_frames()
		if not _save_capture(map_id):
			quit(1)
			return
		if map_id == "m_mo_ngam":
			preview.set("_active_floor_id", "b2")
			preview.call("_build_map", map_id)
			await _settle_frames()
			if not _save_capture("m_mo_ngam_b2"):
				quit(1)
				return
	print("PASS captured eight maps and both underground floors to " + OUTPUT_DIR)
	quit(0)


func _settle_frames() -> void:
	for _frame in range(3):
		await process_frame
	await RenderingServer.frame_post_draw


func _save_capture(map_id: String) -> bool:
	var image := root.get_texture().get_image()
	if image == null or image.is_empty():
		push_error("Empty Godot preview for " + map_id)
		return false
	var output := OUTPUT_DIR.path_join("world_" + map_id + ".png")
	var result := image.save_png(output)
	if result != OK:
		push_error("Could not save Godot preview for " + map_id + ": " + str(result))
		return false
	return true
