class_name PixelHUD
extends Control
signal action_requested(action: String)
var toast_time: float = 0.0
var touch_layout: bool = false

@onready var touch_controls: TouchControls = $TouchControls

func _ready() -> void:
	$BagButton.pressed.connect(func() -> void: action_requested.emit("inventory"))
	$MapButton.pressed.connect(func() -> void: action_requested.emit("map"))
	$SparringButton.pressed.connect(func() -> void: action_requested.emit("dock"))
	$LeaveEncounter.pressed.connect(func() -> void: action_requested.emit("leave"))
	$HelpButton.pressed.connect(func() -> void:
		notify("Kéo cần trái để đi • nút phải để tương tác" if touch_layout else "WASD: đi • M: tuyến map • I: túi • E: tương tác"))
	for index in range(6):
		var action_id: String = ["item_heal", "item_herb", "attack", "interact", "locked", "dodge"][index]
		get_node("Hotbar/Slot%d" % index).pressed.connect(
			func() -> void: action_requested.emit(action_id))
	$Dock/Close.pressed.connect(func() -> void: $Dock.hide())
	for entry in ["Connect", "Create", "Join", "Ready", "Leave"]:
		var action_id: String = entry.to_lower()
		get_node("Dock/" + entry).pressed.connect(
			func() -> void: action_requested.emit(action_id))
	$Toast.hide()
	for index in [0, 1, 4]:
		var button: Button = get_node("Hotbar/Slot%d" % index)
		button.modulate = Color(0.6, 0.6, 0.6)
		button.tooltip_text = "Chưa có cơ chế sử dụng. Không trừ vật phẩm."
	$Hotbar/Slot2.tooltip_text = "Q / J: đánh trong đấu tập hoặc săn Sơn Trư"
	$Hotbar/Slot3.tooltip_text = "E / chạm: tương tác với điểm gần nhất"
	$Hotbar/Slot5.tooltip_text = "Space: né trong đấu tập hoặc săn Sơn Trư"

func _process(delta: float) -> void:
	$ModalShade.visible = $Inventory.visible or $Dock.visible
	touch_controls.set_controls_visible(touch_layout and not $Inventory.visible and not $Dock.visible and not $WorldMap.visible)
	if toast_time > 0:
		toast_time -= delta
		$Toast.visible = toast_time > 0

func set_touch_layout(enabled: bool) -> void:
	touch_layout = enabled
	$Hotbar.visible = not enabled
	$Controls.visible = not enabled
	$HelpButton.position = Vector2(8, 170) if enabled else Vector2(8, 328)
	$HelpButton.text = "Hướng dẫn" if enabled else "Hướng dẫn / trạng thái"
	touch_controls.set_controls_visible(enabled and not $Inventory.visible and not $Dock.visible and not $WorldMap.visible)

func notify(message: String) -> void:
	$Toast/Message.text = message
	$Toast/Message.clip_text = true
	$Toast.show()
	toast_time = 4.0

func configure_map(map_data: Dictionary) -> void:
	var preview_path := str(map_data.get("preview", ""))
	var texture: Texture2D = load(preview_path) if not preview_path.is_empty() else null
	var authored_map := _build_authored_minimap(map_data)
	$Minimap/Map.texture = authored_map if authored_map != null else texture
	$Minimap/Map.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	$Location/Title.text = str(map_data.get("name", "Map")).to_upper()
	$Location/State.text = str(map_data.get("summary", ""))
	$Minimap/Coordinates.tooltip_text = str(map_data.get("name", "Map"))

func _build_authored_minimap(data: Dictionary) -> ImageTexture:
	var layout_path := str(GameMap.MAP_LAYOUTS.get(str(data.get("id", "")), ""))
	if layout_path.is_empty() or not FileAccess.file_exists(layout_path):
		return null
	var file := FileAccess.open(layout_path, FileAccess.READ)
	if file == null:
		return null
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		return null
	var layout: Dictionary = parsed
	var dimensions: Array = data.get("size_tiles", [])
	if dimensions.size() < 2:
		return null
	var width := int(dimensions[0])
	var height := int(dimensions[1])
	var rows: Array = layout.get("ground_rows", [])
	if width <= 0 or height <= 0 or rows.size() != height:
		return null
	var image := Image.create(width, height, false, Image.FORMAT_RGBA8)
	for y in range(height):
		var row := str(rows[y])
		if row.length() != width:
			return null
		for x in range(width):
			var tile := GameMap.TILE_SYMBOLS.find(row.substr(x, 1))
			var color := Color("52794c") # grass
			if tile >= 16 and tile < 24:
				color = Color("af865b") # soil paths
			elif tile >= 24 and tile < 32:
				color = Color("aba99a") # stone plaza
			elif tile >= 32 and tile < 40:
				color = Color("34869b") # water
			elif tile >= 40 and tile < 48:
				color = Color("816443") # bridge/fence
			image.set_pixel(x, y, color)
	for values: Array in data.get("solid_rects_tiles", []):
		if values.size() < 4:
			continue
		for y in range(maxi(int(values[1]), 0), mini(int(values[1]) + int(values[3]), height)):
			for x in range(maxi(int(values[0]), 0), mini(int(values[0]) + int(values[2]), width)):
				if image.get_pixel(x, y).b <= image.get_pixel(x, y).r: # preserve the visible stream
					image.set_pixel(x, y, Color("314240"))
	for point: Dictionary in data.get("interactables", []):
		var tile_position: Array = point.get("position_tiles", [])
		if tile_position.size() >= 2:
			var x := int(tile_position[0])
			var y := int(tile_position[1])
			if x >= 0 and x < width and y >= 0 and y < height:
				image.set_pixel(x, y, Color("e7ca7b") if str(point.get("action_kind", "")) == "gate" else Color("e3a98b"))
	return ImageTexture.create_from_image(image)

func set_interaction_prompt(message: String) -> void:
	$InteractionHint/Message.text = message
	$InteractionHint.visible = not message.is_empty()

func update_position(
		point: Vector2,
		map_size_px: Vector2 = Vector2(640, 360),
		tile_size_px: int = 32,
		area_name: String = "") -> void:
	var map_view: TextureRect = $Minimap/Map
	var marker: ColorRect = $Minimap/Marker
	var travel := (map_view.size - marker.size).max(Vector2.ZERO)
	var normalized := Vector2(
		clampf(point.x / maxf(map_size_px.x, 1.0), 0.0, 1.0),
		clampf(point.y / maxf(map_size_px.y, 1.0), 0.0, 1.0)
	)
	marker.position = map_view.position + normalized * travel
	var coordinates := "(%d, %d)" % [
		int(point.x / maxi(tile_size_px, 1)), int(point.y / maxi(tile_size_px, 1))
	]
	$Minimap/Coordinates.text = coordinates
	$Minimap/Coordinates.tooltip_text = "%s • %s" % [area_name, coordinates] if not area_name.is_empty() else coordinates

func set_health(hp: int) -> void:
	$Vitals/HP.value = clampi(hp, 0, 100)
	$Vitals/HPText.text = "%d / 100" % hp

func apply_profile(profile: Dictionary) -> void:
	var realm := str(profile.get("realm", "mortal"))
	$Vitals/Realm.text = "PHÀM NHÂN" if realm == "mortal" else "LUYỆN KHÍ • %d" % int(profile.get("realmStage", 1))
	# This version has no authoritative Qi field. Never invent a filled resource bar.
	$Vitals/Qi.value = 0
	$Vitals/QiText.text = "Linh lực • chưa có dữ liệu"
