class_name WorldWeather
extends Node
## A shared accelerated world clock and deterministic weather independent of day/night.
## One real second advances one in-game minute (a complete day takes 24 minutes).

signal state_changed(state: Dictionary)

const TICKS_PER_DAY := 1440.0
const WEATHER_BLOCK_TICKS := 360.0 # Six in-game hours.
const RAIN_RAIN_INTENSITY := 0.58
const STORM_RAIN_INTENSITY := 1.0
const RAIN_FADE_SECONDS := 12.0

var _refresh_clock: float = 0.0
var _state_elapsed: float = 0.0
var _preview_clock: float = 0.0
var _preview_enabled: bool = false
var _current_state: Dictionary = {}
var _last_emitted_key: String = ""
var _last_emitted_rain: float = -1.0

func _ready() -> void:
	_preview_enabled = OS.get_cmdline_user_args().has("--weather-preview")
	if _preview_enabled:
		_refresh_state(true, 0.0, 12.0 * 60.0, "clear")
	else:
		_refresh_state(true)

func _process(delta: float) -> void:
	_refresh_clock -= delta
	_state_elapsed += delta
	if _refresh_clock > 0.0:
		return
	_refresh_clock = 0.25
	var elapsed := _state_elapsed
	_state_elapsed = 0.0
	if _preview_enabled:
		_preview_clock += elapsed
		var preview_step := posmod(floori(_preview_clock / 12.0), 4)
		var preview_ticks := [12.0 * 60.0, 2.0 * 60.0, 23.0 * 60.0, 6.0 * 60.0]
		var preview_weather := ["clear", "rain", "storm", "clear"]
		_refresh_state(false, elapsed, float(preview_ticks[preview_step]), str(preview_weather[preview_step]))
	else:
		_refresh_state(false, elapsed)

func get_current_state() -> Dictionary:
	return _current_state.duplicate(true)

## Pure state lookup used by the runtime and deterministic headless tests.
func state_at_world_ticks(world_ticks: float, weather_override: String = "") -> Dictionary:
	var day_tick := fposmod(world_ticks, TICKS_PER_DAY)
	var hour := day_tick / 60.0
	var minute := posmod(floori(day_tick), 60)
	var block_index := floori(world_ticks / WEATHER_BLOCK_TICKS)
	var weather := weather_override if weather_override in ["clear", "rain", "storm"] else _weather_for_block(block_index)
	var phase := _phase_for_hour(hour)
	var rain_target := 0.0
	if weather == "rain":
		rain_target = RAIN_RAIN_INTENSITY
	elif weather == "storm":
		rain_target = STORM_RAIN_INTENSITY
	var sun_tint := _lighting_tint_for_hour(hour)
	var weather_tint := Color.WHITE
	if weather == "rain":
		weather_tint = Color("dce8f4")
	elif weather == "storm":
		weather_tint = Color("b7c9df")
	var condition := "TRỜI QUANG"
	match weather:
		"rain": condition = "MƯA"
		"storm": condition = "MƯA GIÔNG"
		"clear":
			condition = "NẮNG" if phase == "day" else "TRỜI QUANG"
	var phase_label := "BAN ĐÊM"
	match phase:
		"dawn": phase_label = "BÌNH MINH"
		"day": phase_label = "BAN NGÀY"
		"dusk": phase_label = "HOÀNG HÔN"
	return {
		"world_ticks": world_ticks,
		"hour": hour,
		"minute": minute,
		"time_text": "%02d:%02d" % [floori(hour), minute],
		"phase": phase,
		"phase_label": phase_label,
		"is_night": phase == "night",
		"weather": weather,
		"condition_label": condition,
		"rain_target": rain_target,
		"rain_intensity": rain_target,
		"lighting_tint": sun_tint,
		"weather_tint": weather_tint,
		"map_tint": sun_tint * weather_tint,
		"weather_block": block_index,
	}

func _refresh_state(
		initial: bool,
		delta: float = 0.0,
		world_ticks_override: float = -1.0,
		weather_override: String = "") -> void:
	var world_ticks := Time.get_unix_time_from_system() if world_ticks_override < 0.0 else world_ticks_override
	var next := state_at_world_ticks(world_ticks, weather_override)
	var previous_rain := float(_current_state.get("rain_intensity", next.rain_target))
	var amount := 1.0 if initial else maxf(delta, 0.0) / RAIN_FADE_SECONDS
	var rain_now: float = next.rain_target if initial else move_toward(previous_rain, float(next.rain_target), amount)
	next.rain_intensity = rain_now
	var dynamic_weather_tint := Color.WHITE.lerp(next.weather_tint, rain_now)
	next.map_tint = next.lighting_tint * dynamic_weather_tint
	var emission_key := "%s|%s|%s" % [next.time_text, next.weather, next.phase]
	var changed := initial or emission_key != _last_emitted_key or absf(rain_now - _last_emitted_rain) >= 0.025
	_current_state = next
	if changed:
		_last_emitted_key = emission_key
		_last_emitted_rain = rain_now
		state_changed.emit(_current_state.duplicate(true))

func _weather_for_block(block_index: int) -> String:
	var context := HashingContext.new()
	context.start(HashingContext.HASH_SHA256)
	context.update(("tutien-world-weather:%d" % block_index).to_utf8_buffer())
	var digest: PackedByteArray = context.finish()
	var roll := (int(digest[0]) * 256 + int(digest[1])) % 100
	if roll < 68:
		return "clear"
	if roll < 93:
		return "rain"
	return "storm"

func _phase_for_hour(hour: float) -> String:
	if hour < 5.0 or hour >= 20.0:
		return "night"
	if hour < 7.0:
		return "dawn"
	if hour < 17.0:
		return "day"
	return "dusk"

func _lighting_tint_for_hour(hour: float) -> Color:
	# Smooth sunrise and sunset, with a small warm band near the horizon.
	var daylight := clampf(sin((hour - 5.0) / 14.0 * PI), 0.0, 1.0)
	var night_tint := Color("6578a7")
	var day_tint := Color("fff9eb")
	var tint := night_tint.lerp(day_tint, daylight)
	var dawn_warmth := clampf(1.0 - absf(hour - 6.0) / 2.2, 0.0, 1.0)
	var dusk_warmth := clampf(1.0 - absf(hour - 18.0) / 2.2, 0.0, 1.0)
	return tint.lerp(Color("ffd0a0"), maxf(dawn_warmth, dusk_warmth) * 0.22)
