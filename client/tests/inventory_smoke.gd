extends SceneTree
const Api = preload("res://scripts/social_api.gd")
const BagScene = preload("res://scenes/ui/inventory.tscn")
var api: SocialApi
var panel: InventoryPanel

func _initialize() -> void:
	_run.call_deferred()

func _run() -> void:
	api = Api.new()
	root.add_child(api)
	panel = BagScene.instantiate() as InventoryPanel
	panel.api = api
	root.add_child(panel)
	var success := await _scenario()
	if not api.token.is_empty():
		var cleanup := await api._request(HTTPClient.METHOD_DELETE, "/v2/account", null, "Bearer " + api.token)
		if cleanup.has("error"): success = false
	panel.queue_free()
	api.queue_free()
	if success: print("PASS Godot inventory panel: refresh, starter claim, re-open and replay")
	else: push_error("Inventory panel smoke failed")
	quit(0 if success else 1)

func _scenario() -> bool:
	var suffix := Crypto.new().generate_random_bytes(6).hex_encode()
	var login := await api.register_account("bag_" + suffix + "@example.com", suffix + "Password1!", "bag_" + suffix)
	if login.has("error"): return false
	await panel.refresh()
	if panel.claim_button.disabled or not panel.inventory.is_empty(): return false
	if panel.slot_buttons.size() != 24 or panel.preview_mode: return false
	await panel._claim()
	if not panel.claim_button.disabled or panel.inventory.size() != 4: return false
	panel.set_filter("equipment")
	if panel.filtered.size() != 1: return false
	panel.select_slot(0)
	if panel.selected_id != "it_cloth_armor": return false
	panel.set_filter("all")
	var before := await api.call_rpc("get_profile")
	await panel.refresh()
	await panel._claim()
	var after := await api.call_rpc("get_profile")
	return not before.has("error") and before == after and int(after.spiritStones) == 12 and int(after.revision) == 1
