@tool
extends TileMapLayer

var asset_provider: Node
var layer_data: Dictionary = {}
var map_width := 112
var animations: Dictionary = {}
var _animated_cells: Array[Dictionary] = []
var _animation_clock := 0.0


func configure(provider: Node, data: Dictionary, width: int, _tile_size: int) -> void:
	asset_provider = provider
	layer_data = data
	map_width = width
	if provider != null and provider.get("map_data") != null:
		animations = provider.get("map_data").get("animations", {})
		tile_set = provider.get("tile_set_resource") as TileSet
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	rendering_quadrant_size = 8
	
	var values: Array = layer_data.get("data", [])
	for index in range(values.size()):
		var gid := int(values[index]) & 0x1fffffff
		if gid == 0:
			continue
		var coords := Vector2i(index % map_width, floori(float(index) / float(map_width)))
		var tile: Dictionary = provider.get("tile_refs").get(gid, {})
		if tile.is_empty():
			push_error("No TileSet atlas cell for map GID %d in %s" % [gid, name])
			continue
		set_cell(coords, int(tile.get("source_id", -1)), tile.get("atlas_coords", Vector2i.ZERO))
		var frames: Array = animations.get(str(gid), [])
		if not frames.is_empty():
			_animated_cells.append({"coords": coords, "base_gid": gid, "current_gid": gid, "frames": frames, "phase": float(index % 13) * 0.027})
	set_process(not _animated_cells.is_empty())


func _get_provider() -> Node:
	if is_instance_valid(asset_provider):
		return asset_provider
	if is_instance_valid(owner) and owner.has_method("resolve_gid"):
		return owner
	var p := get_parent()
	while p != null:
		if p.has_method("resolve_gid"):
			return p
		p = p.get_parent()
	return null


func _process(delta: float) -> void:
	var provider := _get_provider()
	if provider == null or _animated_cells.is_empty():
		return
	_animation_clock += delta
	for entry in _animated_cells:
		var next_gid := _animated_gid(int(entry["base_gid"]), entry["frames"], _animation_clock + float(entry["phase"]))
		if next_gid == int(entry["current_gid"]):
			continue
		var tile: Dictionary = provider.get("tile_refs").get(next_gid, {})
		if tile.is_empty():
			continue
		set_cell(entry["coords"], int(tile.get("source_id", -1)), tile.get("atlas_coords", Vector2i.ZERO))
		entry["current_gid"] = next_gid


func _animated_gid(base_gid: int, frames: Array, elapsed: float) -> int:
	if frames.is_empty():
		return base_gid
	var total_ms := 0
	for frame in frames:
		total_ms += int(frame.get("duration", 100))	
	if total_ms <= 0:
		return base_gid
	var frame_time := int(fposmod(elapsed * 1000.0, float(total_ms)))
	for frame in frames:
		var duration := int(frame.get("duration", 100))
		if frame_time < duration:
			return int(frame.get("gid", base_gid))
		frame_time -= duration
	return base_gid
