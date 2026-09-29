extends SceneTree
## Offline integration coverage for the accelerated world clock and weather presentation.

const MainScene = preload("res://scenes/main.tscn")
const WeatherScript = preload("res://scripts/world_weather.gd")

var failures: int = 0

func _initialize() -> void:
	_run.call_deferred()

func _check(ok: bool, label: String) -> void:
	if not ok:
		failures += 1
		push_error(label)

func _run() -> void:
	var weather = WeatherScript.new()
	root.add_child(weather)
	await process_frame
	var noon_clear: Dictionary = weather.state_at_world_ticks(12.0 * 60.0, "clear")
	var night_clear: Dictionary = weather.state_at_world_ticks(23.0 * 60.0, "clear")
	var night_rain: Dictionary = weather.state_at_world_ticks(2.0 * 60.0, "rain")
	var night_storm: Dictionary = weather.state_at_world_ticks(2.0 * 60.0, "storm")
	_check(noon_clear.time_text == "12:00" and noon_clear.condition_label == "NẮNG", "Clear daytime reports sun and a readable in-game clock")
	_check(bool(night_clear.is_night) and night_clear.condition_label == "TRỜI QUANG", "Clear weather remains clear at night instead of forcing daytime sun")
	_check(night_rain.condition_label == "MƯA" and is_equal_approx(float(night_rain.rain_target), 0.58), "Rain can continue through the night")
	_check(night_storm.condition_label == "MƯA GIÔNG" and float(night_storm.rain_target) == 1.0, "A nighttime storm includes heavy rain")
	_check(int(weather.state_at_world_ticks(359.0).weather_block) + 1 == int(weather.state_at_world_ticks(360.0).weather_block), "Weather schedule advances in six in-game-hour blocks")
	var second_weather = WeatherScript.new()
	_check(weather.state_at_world_ticks(1234.0).weather == second_weather.state_at_world_ticks(1234.0).weather, "Independent clients resolve the same scheduled weather for a given world time")
	second_weather.free()
	weather.set_process(false)
	weather._current_state = weather.state_at_world_ticks(12.0 * 60.0, "clear")
	weather._refresh_state(false, 6.0, 2.0 * 60.0, "rain")
	_check(is_equal_approx(float(weather.get_current_state().rain_intensity), 0.5), "Rain intensity blends in instead of appearing at full strength")
	weather._refresh_state(false, 6.0, 2.0 * 60.0, "rain")
	_check(is_equal_approx(float(weather.get_current_state().rain_intensity), 0.58), "Rain reaches its target intensity after the transition")
	weather._refresh_state(false, 6.0, 12.0 * 60.0, "clear")
	_check(is_equal_approx(float(weather.get_current_state().rain_intensity), 0.08), "Rain also fades away gradually when skies clear")

	var main = MainScene.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	_check(main.world_weather != null, "Main owns a persistent world weather controller")
	var controller_id: int = main.world_weather.get_instance_id()
	var outdoor_storm: Dictionary = main.world_weather.state_at_world_ticks(12.0 * 60.0, "storm")
	main._on_weather_state_changed(outdoor_storm)
	_check(main.hud.get_node("WeatherInfo/Condition").text == "MƯA GIÔNG", "HUD displays the current weather condition")
	_check(main.map_world.get_weather_exposure() == "outdoor", "An Khê is exposed to outdoor weather")
	_check(is_equal_approx(main.map_world.modulate.r, float(outdoor_storm.map_tint.r)), "Outdoor map lighting follows time and storm tint")
	var original_flash_setting: bool = main.weather_fx.get_reduced_flashes()
	var flash_toggle: Button = main.hud.get_node("WeatherInfo/EffectsToggle")
	flash_toggle.set_pressed_no_signal(true)
	flash_toggle.emit_signal("toggled", true)
	_check(main.weather_fx.get_reduced_flashes() and flash_toggle.button_pressed, "The HUD exposes a reduced-flash accessibility setting")
	flash_toggle.set_pressed_no_signal(original_flash_setting)
	flash_toggle.emit_signal("toggled", original_flash_setting)
	var ripples: Node2D = main.map_world.get_node("AmbientFX")
	var ripple = ripples.get_child(0) as MapWaterRipple
	_check(ripple != null and is_equal_approx(ripple.rain_intensity, 1.0), "Storm rain produces stronger water ripples")

	_check(main._load_map("m_thach_can"), "The mixed outdoor and mine map loads")
	main._on_weather_state_changed(outdoor_storm)
	main.map_world.update_player_context(Vector2(30.0 * 32.0, 18.0 * 32.0))
	main._sync_weather_fx_for_map(outdoor_storm)
	_check(main.map_world.get_weather_exposure() == "sheltered", "The old mine applies its sheltered weather profile")
	var sheltered_ripple = main.map_world.get_node("AmbientFX").get_child(0) as MapWaterRipple
	_check(sheltered_ripple != null and is_equal_approx(sheltered_ripple.rain_intensity, 0.18), "Sheltered water receives only a small amount of rain")

	_check(main._load_map("m_co_tinh"), "The indoor Cổ Tỉnh map loads")
	main._on_weather_state_changed(outdoor_storm)
	_check(main.map_world.get_weather_exposure() == "indoor", "Cổ Tỉnh rooms are protected from outdoor weather")
	_check(main.weather_fx._state.weather_exposure == "indoor" and float(main.weather_fx._state.rain_intensity) == 0.0, "Indoor rooms suppress rain, lightning and storm ambience")
	_check(is_equal_approx(main.map_world.modulate.r, Color("fff1d8").r), "Indoor lighting stays warm instead of following night tint")

	_check(main._load_map("m_truc_am"), "The outdoor forest map loads")
	_check(main.world_weather.get_instance_id() == controller_id, "Clock and weather controller persist across map replacement")
	_check(main.map_world.get_weather_exposure() == "outdoor", "Trúc Âm uses its outdoor weather profile")

	main.queue_free()
	weather.queue_free()
	await process_frame
	if failures == 0:
		print("PASS Godot world weather: day/night, night rain/storm, map exposure, water ripples and persistence")
	else:
		push_error("Godot world weather smoke failed with %d issue(s)" % failures)
	quit(0 if failures == 0 else 1)
