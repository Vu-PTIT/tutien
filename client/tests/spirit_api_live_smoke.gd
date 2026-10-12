extends SceneTree
const Api = preload("res://scripts/nakama_api.gd")

func _initialize() -> void:
	_run.call_deferred()

func _ok(result: Dictionary) -> Dictionary:
	if result.has("error"):
		push_error("Live API failure: " + str(result.error))
		quit(1)
		assert(false)
	return result

func _run() -> void:
	var a := Api.new()
	var b := Api.new()
	root.add_child(a)
	root.add_child(b)
	var endpoint := OS.get_environment("NAKAMA_URL")
	if not endpoint.is_empty():
		a.base_url = endpoint
		b.base_url = endpoint
	var suffix: String = a.operation_id().substr(0, 10)
	var name_a := "spga_" + suffix
	var name_b := "spgb_" + suffix
	_ok(await a.login(name_a, "smoke-passphrase-" + suffix, true, name_a + "@tutien.test"))
	_ok(await b.login(name_b, "smoke-passphrase-" + suffix, true, name_b + "@tutien.test"))
	var form_a := _ok(await a.request_rpc("character_select_form", {"operationId": a.operation_id(), "kind": "human", "speciesId": "human"}))
	var form_b := _ok(await b.request_rpc("character_select_form", {"operationId": b.operation_id(), "kind": "spirit_beast", "speciesId": "cat"}))
	assert(form_a.profile.form.selected and form_b.profile.form.speciesId == "cat")
	var target := _ok(await a.request_rpc("social_find_player", {"username": name_b}))
	assert(target.userId == b.user_id)
	var invitation := _ok(await a.request_rpc("contract_invite", {"operationId": a.operation_id(), "userId": target.userId}))
	var contract_id: String = invitation.contract.id
	_ok(await b.request_rpc("contract_respond", {"contractId": contract_id, "accept": true}))
	_ok(await a.request_rpc("contract_hunt_start", {"contractId": contract_id}))
	var joined := _ok(await b.request_rpc("contract_hunt_start", {"contractId": contract_id}))
	var hunt_id: String = joined.contract.hunt.id
	var won := false
	for i in range(12):
		var actor := a if i % 2 == 0 else b
		var hit := _ok(await actor.request_rpc("contract_hunt_attack", {"contractId": contract_id, "huntId": hunt_id, "operationId": actor.operation_id(), "skill": false}))
		if hit.contract.hunt.phase == "victory":
			won = true
			break
		await create_timer(0.75).timeout
	assert(won)
	for actor in [a, b]:
		var claim := _ok(await actor.request_rpc("contract_hunt_claim"))
		assert(claim.profile.cultivationXp == 10)
		assert(_ok(await actor.request_rpc("contract_hunt_claim")).replayed)
	_ok(await a.request_rpc("contract_release", {"contractId": contract_id}))
	assert(_ok(await b.request_rpc("contract_get")).active == null)
	a.logout()
	b.logout()
	a.queue_free()
	b.queue_free()
	await process_frame
	print("PASS: Godot REST auth, selected forms, contract, two-player hunt, durable claims, release")
	quit(0)
