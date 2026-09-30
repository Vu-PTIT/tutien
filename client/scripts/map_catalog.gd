class_name MapCatalog
extends RefCounted
## Runtime world data separated from the map presentation layer.

const CATALOG_PATH := "res://data/map_catalog.json"

var catalog: Dictionary = {}
var maps_by_id: Dictionary = {}

func _init(path: String = CATALOG_PATH) -> void:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("Cannot open map catalog: " + path)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		push_error("Map catalog has an invalid shape")
		return
	catalog = parsed
	var entries: Variant = catalog.get("maps", null)
	if not entries is Array:
		push_error("Map catalog is missing its maps array")
		return
	for map_data: Variant in entries:
		if map_data is Dictionary and map_data.has("id"):
			maps_by_id[str(map_data.id)] = map_data
