shader_type canvas_item;
render_mode unshaded;

// One pixel is one world unit. UVs are authored from the same world coordinates
// for grass, roads, riverbanks and water: no TileMap, tile GIDs or atlas slicing.
uniform int surface_kind = 0;
uniform vec2 world_extent = vec2(1120.0, 800.0);

float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void fragment() {
    vec2 p = floor(UV * world_extent);
    float macro = hash21(floor(p / 41.0));
    float grain = hash21(floor(p / 3.0));
    float spot = hash21(floor(p / 7.0) + vec2(41.0, 83.0));
    vec3 color_rgb;

    if (surface_kind == 0) {
        // Meadow: subtly varied, deliberately low-contrast grass pixels.
        color_rgb = mix(vec3(0.48, 0.73, 0.41), vec3(0.53, 0.78, 0.46), macro);
        if (grain > 0.91) {
            color_rgb = mix(color_rgb, vec3(0.35, 0.65, 0.34), 0.48);
        } else if (grain < 0.07) {
            color_rgb = mix(color_rgb, vec3(0.68, 0.85, 0.54), 0.47);
        }
        if (spot > 0.978 && mod(p.x + floor(p.y / 7.0), 3.0) < 1.0) {
            color_rgb = vec3(0.36, 0.66, 0.37);
        }
    } else if (surface_kind == 1) {
        // Hand-positioned ribbons, NOT repeated roadway squares.
        color_rgb = mix(vec3(0.83, 0.70, 0.49), vec3(0.88, 0.76, 0.56), macro);
        if (grain > 0.84) {
            color_rgb = mix(color_rgb, vec3(0.67, 0.54, 0.38), 0.40);
        }
        if (spot > 0.96) {
            color_rgb = vec3(0.94, 0.82, 0.65);
        }
    } else if (surface_kind == 2) {
        // Riverbanks are a separate wider shape behind the water.
        color_rgb = mix(vec3(0.66, 0.68, 0.44), vec3(0.79, 0.75, 0.52), macro);
        if (grain > 0.88) {
            color_rgb *= 0.86;
        }
    } else {
        // Animated ripple highlights live only inside the water polygon.
        color_rgb = mix(vec3(0.39, 0.69, 0.78), vec3(0.46, 0.76, 0.85), macro);
        float wave = sin(p.x * 0.084 + p.y * 0.032 + TIME * 1.1);
        float small_wave = sin(p.y * 0.19 - p.x * 0.042 - TIME * 0.7);
        if (wave > 0.88 && small_wave > -0.15 && grain > 0.23) {
            color_rgb = mix(color_rgb, vec3(0.71, 0.88, 0.87), 0.54);
        }
        if (grain > 0.95) {
            color_rgb = mix(color_rgb, vec3(0.60, 0.83, 0.88), 0.38);
        }
    }
    COLOR = vec4(color_rgb, 1.0);
}
