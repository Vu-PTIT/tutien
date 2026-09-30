class_name WorldWeatherFX
extends Control
## Screen-space pixel rain and restrained lightning, drawn under the HUD.

const RAIN_STREAM: AudioStreamWAV = preload("res://assets/audio/weather/rain_loop.wav")
const THUNDER_STREAM: AudioStreamWAV = preload("res://assets/audio/weather/thunder.wav")
const SETTINGS_PATH := "user://visual_settings.cfg"

var _state: Dictionary = {}
var _rain_intensity: float = 0.0
var _active: bool = true
var _reduce_flashes: bool = false
var _elapsed: float = 0.0
var _lightning_clock: float = 0.0
var _flash_remaining: float = 0.0
var _flash_strength: float = 0.0
var _thunder_delay: float = -1.0
var _random := RandomNumberGenerator.new()
var _rain_lines := PackedVector2Array()
var _preview_enabled: bool = false
var _rain_player: AudioStreamPlayer
var _thunder_player: AudioStreamPlayer

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	_random.randomize()
	_preview_enabled = OS.get_cmdline_user_args().has("--weather-preview")
	var settings := ConfigFile.new()
	settings.load(SETTINGS_PATH)
	_reduce_flashes = bool(settings.get_value("accessibility", "reduce_weather_flashes", false))
	if DisplayServer.get_name() == "headless":
		return
	_rain_player = AudioStreamPlayer.new()
	_rain_player.name = "RainAmbience"
	_rain_player.stream = RAIN_STREAM.duplicate()
	var rain_stream := _rain_player.stream as AudioStreamWAV
	rain_stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
	rain_stream.loop_begin = 0
	rain_stream.loop_end = rain_stream.mix_rate * 4
	_rain_player.volume_db = -24.0
	add_child(_rain_player)
	_thunder_player = AudioStreamPlayer.new()
	_thunder_player.name = "Thunder"
	_thunder_player.stream = THUNDER_STREAM
	_thunder_player.volume_db = -8.0
	add_child(_thunder_player)

func _exit_tree() -> void:
	if _rain_player != null:
		_rain_player.stop()
	if _thunder_player != null:
		_thunder_player.stop()

func set_weather_state(state: Dictionary) -> void:
	var previous_weather := str(_state.get("weather", "clear"))
	var previous_exposure := str(_state.get("weather_exposure", "outdoor"))
	_state = state.duplicate(true)
	_rain_intensity = clampf(float(_state.get("rain_intensity", 0.0)), 0.0, 1.0)
	var next_weather := str(_state.get("weather", "clear"))
	var exposed := str(_state.get("weather_exposure", "outdoor")) == "outdoor"
	var was_exposed_storm := previous_weather == "storm" and previous_exposure == "outdoor"
	var is_exposed_storm := next_weather == "storm" and exposed
	if is_exposed_storm and not was_exposed_storm:
		_lightning_clock = _random.randf_range(1.0, 2.0) if _preview_enabled else _random.randf_range(10.0, 22.0)
	elif not is_exposed_storm:
		_lightning_clock = 0.0
		_flash_remaining = 0.0
		_thunder_delay = -1.0
		if _thunder_player != null:
			_thunder_player.stop()
	_update_rain_audio()
	queue_redraw()

func set_atmosphere_active(active: bool) -> void:
	if _active == active:
		return
	_active = active
	if not active:
		_flash_remaining = 0.0
		_thunder_delay = -1.0
		if _rain_player != null:
			_rain_player.stop()
		if _thunder_player != null:
			_thunder_player.stop()
	else:
		_update_rain_audio()
	queue_redraw()

func get_reduced_flashes() -> bool:
	return _reduce_flashes

func set_reduced_flashes(enabled: bool) -> void:
	_reduce_flashes = enabled
	if enabled:
		_thunder_delay = -1.0
		if _thunder_player != null:
			_thunder_player.stop()
	var settings := ConfigFile.new()
	settings.load(SETTINGS_PATH)
	settings.set_value("accessibility", "reduce_weather_flashes", enabled)
	settings.save(SETTINGS_PATH)

func _process(delta: float) -> void:
	_elapsed += delta
	if not _active:
		return
	var redraw := _rain_intensity > 0.001
	if _flash_remaining > 0.0:
		_flash_remaining = maxf(_flash_remaining - delta, 0.0)
		redraw = true
	if _thunder_delay >= 0.0:
		_thunder_delay -= delta
		if _thunder_delay <= 0.0:
			_thunder_delay = -1.0
			if _is_exposed_storm() and _thunder_player != null:
				_thunder_player.play()
	if _is_exposed_storm():
		_lightning_clock -= delta
		if _lightning_clock <= 0.0:
			_start_lightning()
		redraw = true
	if redraw:
		queue_redraw()

func _draw() -> void:
	if not _active:
		return
	var viewport_size := size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		viewport_size = Vector2(640.0, 360.0)
	if _rain_intensity > 0.001:
		var storm := _is_exposed_storm()
		var count := roundi(lerpf(0.0, 150.0 if not storm else 250.0, _rain_intensity))
		var wind_shear := 2.0 + sin(_elapsed * 0.13) * 2.0
		_rain_lines.clear()
		for index in range(count):
			var depth := 0.52 + float(index % 5) * 0.12
			var x := fposmod(float(index * 79 + 13) + _elapsed * (38.0 + depth * 27.0), viewport_size.x)
			var y := fposmod(float(index * 47 + 7) + _elapsed * (300.0 + depth * 75.0), viewport_size.y)
			var length := 5.0 + depth * 5.0
			_rain_lines.append(Vector2(x, y))
			_rain_lines.append(Vector2(x + wind_shear, y + length))
		var opacity := 0.22 + _rain_intensity * 0.32
		if not _rain_lines.is_empty():
			draw_multiline(_rain_lines, Color(0.61, 0.82, 0.97, opacity), 1.0, false)
	if _flash_remaining > 0.0:
		var strength := _flash_strength * clampf(_flash_remaining / 0.16, 0.0, 1.0)
		draw_rect(Rect2(Vector2.ZERO, viewport_size), Color(0.78, 0.88, 1.0, strength), true)

func _start_lightning() -> void:
	_lightning_clock = _random.randf_range(24.0, 48.0)
	_flash_strength = 0.045 if _reduce_flashes else _random.randf_range(0.22, 0.38)
	_flash_remaining = 0.11 if _reduce_flashes else 0.16
	_thunder_delay = -1.0 if _reduce_flashes else _random.randf_range(0.65, 1.55)

func _is_exposed_storm() -> bool:
	return str(_state.get("weather", "")) == "storm" and str(_state.get("weather_exposure", "outdoor")) == "outdoor"

func _update_rain_audio() -> void:
	if _rain_player == null:
		return
	if not _active or _rain_intensity < 0.04 or str(_state.get("weather_exposure", "outdoor")) == "indoor":
		_rain_player.stop()
		return
	_rain_player.volume_db = lerpf(-31.0, -20.0, _rain_intensity)
	if not _rain_player.playing:
		_rain_player.play()
