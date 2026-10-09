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
    root.add_child(packed.instantiate())
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
    print("PASS screenshot captured to: " + path)
    quit(0)
