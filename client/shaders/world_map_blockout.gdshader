shader_type canvas_item;
render_mode unshaded;

varying vec2 world_pixel;

uniform vec4 base_color : source_color = vec4(0.36, 0.48, 0.32, 1.0);
uniform vec4 light_color : source_color = vec4(0.50, 0.60, 0.39, 1.0);
uniform vec4 dark_color : source_color = vec4(0.23, 0.33, 0.25, 1.0);
uniform int surface_kind = 0;
uniform float pattern_seed = 0.0;

void vertex() {
	world_pixel = VERTEX;
}

float hash21(vec2 point) {
	return fract(sin(dot(point, vec2(127.1, 311.7)) + pattern_seed * 19.19) * 43758.5453123);
}

void fragment() {
	vec2 pixel = floor(world_pixel);
	float broad = hash21(floor(pixel / 39.0));
	float medium = hash21(floor(pixel / 11.0));
	float fine = hash21(floor(pixel / 3.0));
	vec3 color_rgb = base_color.rgb;
	color_rgb = mix(color_rgb, light_color.rgb, step(0.70, broad) * 0.42);
	color_rgb = mix(color_rgb, dark_color.rgb, step(0.84, medium) * 0.26);

	if (surface_kind == 0) {
		// Grass: uneven clusters and a few tiny pixel tufts.
		if (medium > 0.93 && fine > 0.55 && mod(pixel.x + pixel.y, 7.0) < 3.0) {
			color_rgb = mix(color_rgb, dark_color.rgb, 0.66);
		}
	} else if (surface_kind == 1) {
		// Fields: soft furrows that describe cultivated ground without a grid.
		float furrow = mod(pixel.y + floor(pixel.x / 37.0) * 3.0, 31.0);
		if (furrow < 2.0) {
			color_rgb = mix(color_rgb, dark_color.rgb, 0.34);
		} else if (furrow > 27.0 && fine > 0.68) {
			color_rgb = mix(color_rgb, light_color.rgb, 0.36);
		}
	} else if (surface_kind == 2 || surface_kind == 7) {
		// Packed earth and asphalt: sparse aggregate flecks.
		if (fine > 0.94 && mod(pixel.x + 2.0 * pixel.y, 5.0) < 2.0) {
			color_rgb = mix(color_rgb, light_color.rgb, 0.44);
		}
	} else if (surface_kind == 3 || surface_kind == 10) {
		// Concrete/floor: large slab seams and quiet repair marks.
		float vertical_seam = mod(pixel.x + floor(pixel.y / 57.0) * 13.0, 128.0);
		float horizontal_seam = mod(pixel.y, 96.0);
		if (vertical_seam < 2.0 || horizontal_seam < 2.0) {
			color_rgb = mix(color_rgb, dark_color.rgb, 0.28);
		}
		if (medium > 0.987 && fine > 0.5) {
			color_rgb = mix(color_rgb, light_color.rgb, 0.24);
		}
	} else if (surface_kind == 4 || surface_kind == 8 || surface_kind == 9) {
		// Rock, gravel and basalt: broken strata and scattered grit.
		float strata = mod(pixel.y + floor(pixel.x / 43.0) * 2.0, 19.0);
		if (strata < 2.0) {
			color_rgb = mix(color_rgb, dark_color.rgb, 0.48);
		} else if (strata > 15.0 && fine > 0.66) {
			color_rgb = mix(color_rgb, light_color.rgb, 0.34);
		}
		if (fine > 0.965 && medium > 0.42) {
			color_rgb = mix(color_rgb, dark_color.rgb, 0.54);
		}
	} else if (surface_kind == 5) {
		// Shore and damp verge: pale broken sand at the waterline.
		if (fine > 0.80 && mod(pixel.x + pixel.y, 8.0) < 3.0) {
			color_rgb = mix(color_rgb, light_color.rgb, 0.48);
		}
	} else if (surface_kind == 6) {
		// Water: broad current bands with restrained animated highlights.
		float wave = sin(pixel.x * 0.035 + pixel.y * 0.018 + TIME * 0.7);
		float ripple = step(0.82, wave) * step(0.67, medium);
		color_rgb = mix(color_rgb, light_color.rgb, ripple * 0.40);
		if (fine > 0.965 && mod(pixel.x, 5.0) < 2.0) {
			color_rgb = mix(color_rgb, light_color.rgb, 0.36);
		}
	}

	COLOR = vec4(color_rgb, base_color.a);
}
