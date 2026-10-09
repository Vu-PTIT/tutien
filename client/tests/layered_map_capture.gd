extends SceneTree

# Produces a real viewport screenshot in GitHub Actions (xvfb) for art review.
func _initialize() -> void:
    call_deferred("_capture_scene")


func _capture_scene() -> void:
    var packed := load("res://scenes/layered_village_m1.tscn") as PackedScene
    if packed == null:
        push_error("Could not load layered village for capture")
        quit(1)
        return
    var village := packed.instantiate()
    root.add_child(village)
    for _frame in range(8):
        await process_frame
    await RenderingServer.frame_post_draw
    var path := "/tmp/tutien-previews/layered_m1_desktop.png"
    var err := DirAccess.make_dir_recursive_absolute("/tmp/tutien-previews")
    if err != OK:
        push_error("Could not create screenshot folder: " + str(err))
        quit(1)
        return
    var screenshot := root.get_texture().get_image()
    if screenshot == null or screenshot.is_empty():
        push_error("Viewport screenshot was empty")
        quit(1)
        return
    err = screenshot.save_png(path)
    if err != OK:
        push_error("Screenshot save failed: " + str(err))
        quit(1)
        return
    print("PASS viewport screenshot captured to: " + path)

    # Actual full-map art review shot (camera-only). Both images are rendered
    # by Godot, not decorative PNG mockups.
    var camera := Camera2D.new()
    camera.name = "ArtReviewCamera"
    camera.position = Vector2(560.0, 400.0)
    camera.zoom = Vector2(0.89, 0.89)
    camera.position_smoothing_enabled = false
    village.add_child(camera)
    camera.make_current()
    for _frame in range(3):
        await process_frame
    await RenderingServer.frame_post_draw
    var overview := root.get_texture().get_image()
    var output_path := "/tmp/tutien-previews/layered_m1_overview.png"
    if overview == null or overview.is_empty() or overview.save_png(output_path) != OK:
        push_error("Full-map art review capture failed")
        quit(1)
        return
    print("PASS village overview captured to: " + output_path)
    quit(0)
