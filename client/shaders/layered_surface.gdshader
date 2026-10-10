shader_type canvas_item;
render_mode unshaded;

// World-space pixel art. The former UV * map-size approach used implicit
// Polygon2D UVs and repeated/stretch-painted every small polygon.
varying vec2 world_pixel;
uniform int surface_kind = 0;
uniform float ripple_strength : hint_range(0.0, 1.0) = 0.7;

// M1.6 art-directed source material sampling. Existing authored PNG sprites
// supply terrain pixels, while the polygons still own terrain silhouettes.
// Nearest-neighbor atlas sampling does not create gameplay TileMap cells.
uniform bool source_art_enabled = true;
uniform sampler2D source_grass : source_color, filter_nearest;
uniform sampler2D source_road : source_color, filter_nearest;
uniform sampler2D source_water : source_color, filter_nearest;
uniform vec4 grass_region = vec4(84.0, 54.0, 20.0, 20.0);
uniform vec4 road_region = vec4(24.0, 16.0, 24.0, 24.0);
uniform vec4 water_region = vec4(10.0, 106.0, 24.0, 24.0);
uniform vec2 grass_atlas_size = vec2(192.0, 224.0);
uniform vec2 road_atlas_size = vec2(96.0, 224.0);
uniform vec2 water_atlas_size = vec2(384.0, 208.0);
uniform float grass_art_blend : hint_range(0.0, 1.0) = 0.38;
uniform float road_art_blend : hint_range(0.0, 1.0) = 0.88;
uniform float water_art_blend : hint_range(0.0, 1.0) = 0.70;


void vertex() {
    // All generated polygons sit at the world origin; their authored vertices
    // already are world coordinates. Grass/soil/water share one texel lattice.
    world_pixel = VERTEX;
}

float noise21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float tiny_leaf(vec2 p) {
    vec2 section = floor(p / 13.0);
    vec2 in_cell = mod(p, 13.0);
    float roll = noise21(section + 27.0);
    vec2 seed = vec2(3.0 + floor(noise21(section + 12.0) * 7.0),
                     3.0 + floor(noise21(section + 18.0) * 7.0));
    float dx = abs(in_cell.x - seed.x);
    float dy = in_cell.y - seed.y;
    if (roll > 0.76 && ((dx < 1.0 && dy > -2.0 && dy < 2.0)
        || (dx < 2.0 && abs(dy) < 1.0))) {
        return 1.0;
    }
    return 0.0;
}

void fragment() {
    vec2 p = floor(world_pixel);
    vec2 broad = floor(p / 47.0);
    vec2 patch = floor(p / 9.0);
    vec2 grain = floor(p / 3.0);
    float fields = noise21(broad + 4.0);
    float flower = noise21(patch + 67.0);
    float coarse = noise21(grain + 18.0);
    float soil_speck = noise21(grain + 91.0);
    vec3 color_rgb;

    if (surface_kind == 0) {
        // Meadow painted as pixel clusters rather than uniform shader noise.
        color_rgb = mix(vec3(0.53, 0.74, 0.44), vec3(0.60, 0.78, 0.49), fields);
        if (coarse > 0.81) {
            color_rgb = mix(color_rgb, vec3(0.40, 0.66, 0.37), 0.44);
        }
        if (coarse < 0.11) {
            color_rgb = mix(color_rgb, vec3(0.70, 0.83, 0.53), 0.43);
        }
        if (tiny_leaf(p) > 0.5) {
            color_rgb = vec3(0.38, 0.65, 0.35);
        }
        if (flower > 0.985 && coarse > 0.55 && mod(p.x + p.y, 7.0) < 2.0) {
            color_rgb = vec3(0.92, 0.91, 0.67);
        }
    } else if (surface_kind == 1) {
        // Sandy lane with scattered pebbles and straw-coloured flecks.
        color_rgb = mix(vec3(0.76, 0.62, 0.43), vec3(0.85, 0.72, 0.52), fields);
        if (coarse < 0.18) {
            color_rgb = vec3(0.92, 0.80, 0.59);
        } else if (coarse > 0.87) {
            color_rgb = mix(color_rgb, vec3(0.62, 0.52, 0.38), 0.51);
        }
        if (soil_speck > 0.967 && mod(p.x, 4.0) < 2.0) {
            color_rgb = vec3(0.60, 0.53, 0.43);
        }
    } else if (surface_kind == 2) {
        // Earth-and-reeds verge framing the water body.
        color_rgb = mix(vec3(0.70, 0.72, 0.47), vec3(0.82, 0.78, 0.57), fields);
        if (coarse > 0.83) {
            color_rgb *= 0.84;
        }
        if (tiny_leaf(p) > 0.5) {
            color_rgb = vec3(0.42, 0.68, 0.39);
        }
    } else if (surface_kind == 3) {
        // Water ripples are clipped naturally to the independent river polygon.
        color_rgb = mix(vec3(0.38, 0.67, 0.79), vec3(0.47, 0.75, 0.84), fields);
        if (source_art_enabled && water_art_blend > 0.0) {
            // UVs address a curated source-art fragment, not the whole animation
            // sheet. Water highlights below remain animated at game runtime.
            vec2 pixel_uv = (water_region.xy +
                mod(floor(p), water_region.zw) + vec2(0.5)) / water_atlas_size;
            vec4 sampled = texture(source_water, pixel_uv);
            color_rgb = mix(color_rgb, sampled.rgb,
                clamp(sampled.a * water_art_blend, 0.0, 0.91));
        }
        float wave = sin(p.x * 0.105 - p.y * 0.05 + TIME * 1.02);
        float back_wave = sin(p.y * 0.13 + p.x * 0.045 - TIME * 0.71);
        float crest = step(0.85, wave) * step(-0.26, back_wave) * step(0.19, coarse);
        float sparkle = step(0.968, flower) * step(0.61, coarse);
        color_rgb = mix(color_rgb, vec3(0.77, 0.89, 0.88), max(crest * 0.55, sparkle * 0.31) * ripple_strength);
        if (soil_speck > 0.95 && mod(p.x, 4.0) <= 1.0) {
            color_rgb = mix(color_rgb, vec3(0.58, 0.81, 0.85), 0.26);
        }
    } else if (surface_kind == 4) {
        // Pale trampled village grass; authored clearings have irregular outlines.
        color_rgb = mix(vec3(0.63, 0.73, 0.46), vec3(0.72, 0.78, 0.51), fields);
        if (coarse > 0.72) {
            color_rgb = mix(color_rgb, vec3(0.82, 0.75, 0.53), 0.25);
        }
        if (tiny_leaf(p) > 0.5) {
            color_rgb = vec3(0.51, 0.70, 0.39);
        }
    } else if (surface_kind == 5) {
        // Cultivated soil: a surface polygon, not a TileMapLayer or gameplay grid.
        color_rgb = mix(vec3(0.48, 0.32, 0.25), vec3(0.59, 0.41, 0.28), fields);
        if (mod(p.y, 11.0) < 2.0) {
            color_rgb = mix(color_rgb, vec3(0.36, 0.25, 0.20), 0.37);
        }
        if (soil_speck > 0.87) {
            color_rgb = mix(color_rgb, vec3(0.77, 0.58, 0.40), 0.38);
        }
    } else if (surface_kind == 7) {
        // Higher village meadow. A subtle shift in tone conveys a raised bank
        // without creating a rectangular brown "island".
        color_rgb = mix(vec3(0.49, 0.69, 0.41), vec3(0.55, 0.75, 0.46), fields);
        if (coarse > 0.82) {
            color_rgb = mix(color_rgb, vec3(0.35, 0.59, 0.34), 0.41);
        }
        if (tiny_leaf(p) > 0.5) {
            color_rgb = vec3(0.39, 0.61, 0.36);
        }
    } else if (surface_kind == 8) {
        // Side-facing exposed soil and small stone ledges. Continuous world
        // pixels keep horizontal strata aligned across an irregular cliff.
        color_rgb = mix(vec3(0.54, 0.47, 0.34), vec3(0.64, 0.54, 0.38), fields);
        float band = mod(p.y + floor(p.x / 37.0) * 2.0, 7.0);
        if (band <= 1.0) {
            color_rgb = mix(color_rgb, vec3(0.37, 0.37, 0.29), 0.54);
        } else if (band > 5.0) {
            color_rgb = mix(color_rgb, vec3(0.78, 0.67, 0.48), 0.33);
        }
        if (soil_speck > 0.91) {
            color_rgb *= 0.77;
        }
        float crack = noise21(floor(p / vec2(31.0, 9.0)) + 22.0);
        if (crack > 0.88 && mod(p.x, 31.0) < 2.0) {
            color_rgb = vec3(0.36, 0.36, 0.28);
        }
    } else if (surface_kind == 9) {
        // Shared village heart: irregular staggered cobbles, never a TileMap.
        // Pattern follows the same world-space pixel lattice as surrounding soil.
        float row = floor(p.y / 9.0);
        float shift = mod(row, 2.0) * 7.0;
        vec2 cobble_id = floor(vec2((p.x + shift) / 15.0, p.y / 9.0));
        vec2 within = mod(vec2(p.x + shift, p.y), vec2(15.0, 9.0));
        float stone = noise21(cobble_id + vec2(49.0, 12.0));
        float wear = noise21(floor(p / 3.0) + vec2(17.0, 29.0));
        color_rgb = mix(vec3(0.76, 0.72, 0.59), vec3(0.87, 0.79, 0.62), stone);
        float jagged = noise21(vec2(cobble_id.x * 7.0 + floor(p.y / 4.0), cobble_id.y * 13.0));
        if (within.y < 1.0 || within.x < (jagged > 0.72 ? 2.0 : 1.0)) {
            color_rgb = vec3(0.54, 0.52, 0.43);
        } else if (within.y > 6.0 || within.x > 12.0) {
            color_rgb *= 0.90;
        } else if (wear > 0.91) {
            color_rgb = mix(color_rgb, vec3(0.96, 0.85, 0.66), 0.28);
        }
        if (stone > 0.90 && wear > 0.86) {
            color_rgb = mix(color_rgb, vec3(0.61, 0.58, 0.48), 0.43);
        }
    } else if (surface_kind == 10) {
        // Lighter packed-earth yards; no rectangular paved pads around homes.
        color_rgb = mix(vec3(0.75, 0.67, 0.48), vec3(0.82, 0.74, 0.53), fields);
        if (coarse > 0.82) {
            color_rgb = mix(color_rgb, vec3(0.62, 0.56, 0.40), 0.38);
        }
        if (soil_speck > 0.956) {
            color_rgb = mix(color_rgb, vec3(0.92, 0.84, 0.63), 0.46);
        }
    } else if (surface_kind == 11) {
        // Transitional grass-and-sand band between roads and courtyard stones.
        color_rgb = mix(vec3(0.66, 0.70, 0.45), vec3(0.75, 0.73, 0.48), fields);
        if (coarse > 0.77) {
            color_rgb = mix(color_rgb, vec3(0.82, 0.73, 0.52), 0.53);
        }
        if (tiny_leaf(p) > 0.5) {
            color_rgb = vec3(0.48, 0.67, 0.37);
        }
    } else if (surface_kind == 12) {
        // A thin, earthy, grass-dominant contact zone, backed by real atlas
        // pixels. Shapes are authored as separate coastline/path polygons.
        color_rgb = mix(vec3(0.53, 0.68, 0.39), vec3(0.67, 0.73, 0.45), fields);
        if (coarse > 0.79) {
            color_rgb = mix(color_rgb, vec3(0.77, 0.71, 0.49), 0.33);
        }
        if (tiny_leaf(p) > 0.5) {
            color_rgb = vec3(0.43, 0.65, 0.34);
        }
    } else if (surface_kind == 13) {
        // Shallow margin, only a few pixels wide between the bank and the
        // separately collidable river. Rendered with the source water atlas.
        color_rgb = mix(vec3(0.54, 0.74, 0.70), vec3(0.59, 0.77, 0.74), fields);
        if (coarse > 0.86) {
            color_rgb = mix(color_rgb, vec3(0.78, 0.86, 0.71), 0.22);
        }
    } else {
        // Irregular sandy verge under the lane's main footprint.
        color_rgb = mix(vec3(0.65, 0.72, 0.45), vec3(0.74, 0.73, 0.48), fields);
        if (coarse > 0.83) {
            color_rgb = mix(color_rgb, vec3(0.83, 0.71, 0.52), 0.42);
        }
    }
    if (source_art_enabled) {
        if (surface_kind == 0 || surface_kind == 4 || surface_kind == 7 || surface_kind == 12) {
            vec2 pixel_uv = (grass_region.xy +
                mod(floor(p), grass_region.zw) + vec2(0.5)) / grass_atlas_size;
            vec4 source_pixel = texture(source_grass, pixel_uv);
            // The atlas also contains bare dirt and pinkish decor pixels.
            // Sample only real green foliage so the grass has no pink grids.
            float vegetation = smoothstep(0.012, 0.10,
                source_pixel.g - max(source_pixel.r, source_pixel.b));
            float opacity = grass_art_blend * (surface_kind == 4 ? 0.30 : 1.0);
            if (surface_kind == 12) {
                opacity *= 0.66;
            }
            color_rgb = mix(color_rgb, source_pixel.rgb,
                clamp(source_pixel.a * vegetation * opacity, 0.0, 0.72));
        } else if (surface_kind == 13) {
            vec2 pixel_uv = (water_region.xy +
                mod(floor(p), water_region.zw) + vec2(0.5)) / water_atlas_size;
            vec4 source_pixel = texture(source_water, pixel_uv);
            color_rgb = mix(color_rgb, source_pixel.rgb,
                clamp(source_pixel.a * water_art_blend * 0.40, 0.0, 0.55));
        } else if (surface_kind == 1 || surface_kind == 5 ||
                surface_kind == 9 || surface_kind == 10 || surface_kind == 11) {
            vec2 pixel_uv = (road_region.xy +
                mod(floor(p), road_region.zw) + vec2(0.5)) / road_atlas_size;
            vec4 source_pixel = texture(source_road, pixel_uv);
            float opacity = road_art_blend;
            if (surface_kind == 5) {
                opacity *= 0.32;
                source_pixel.rgb *= vec3(0.83, 0.66, 0.57);
            } else if (surface_kind == 9) {
                opacity *= 0.34;
            } else if (surface_kind == 10 || surface_kind == 11) {
                opacity *= 0.47;
            }
            color_rgb = mix(color_rgb, source_pixel.rgb,
                clamp(source_pixel.a * opacity, 0.0, 0.95));
        }
    }
    COLOR = vec4(color_rgb, 1.0);
}
