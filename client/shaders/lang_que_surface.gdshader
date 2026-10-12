shader_type canvas_item;

varying vec2 world_pixel;
uniform vec4 base_color : source_color;
uniform vec4 light_color : source_color;
uniform vec4 dark_color : source_color;
uniform int surface_kind = 0;
uniform float pattern_seed = 0.0;
uniform sampler2D source_art : filter_nearest, repeat_disable;
uniform vec4 source_region = vec4(0.0);
uniform vec2 source_size = vec2(1.0);
uniform float art_blend = 0.0;

void vertex() { world_pixel = VERTEX; }
float noise(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + pattern_seed) * 43758.5453); }

void fragment() {
    vec2 p = floor(world_pixel / 2.0);
    float broad = sin(p.x * 0.014) * sin(p.y * 0.019) * 0.5 + 0.5;
    float cluster = noise(floor(p / 3.0));
    vec3 color = mix(base_color.rgb, light_color.rgb, broad * 0.16);
    color = mix(color, dark_color.rgb, step(0.83, cluster) * 0.12);
    if (art_blend > 0.0) {
        vec2 uv = (source_region.xy + mod(p, source_region.zw) + vec2(0.5)) / source_size;
        vec4 tex = texture(source_art, uv);
        color = mix(color, tex.rgb, art_blend * tex.a);
    }
    if (surface_kind == 1) {
        color = mix(color, dark_color.rgb, step(mod(p.y, 12.0), 1.0) * 0.16);
    } else if (surface_kind == 3) {
        vec2 brick = vec2(mod(p.x + floor(p.y / 14.0) * 12.0, 24.0), mod(p.y, 14.0));
        color = mix(color, dark_color.rgb, float(brick.x < 1.0 || brick.y < 1.0) * 0.22);
    } else if (surface_kind == 6) {
        float wave = sin(p.x * 0.08 + p.y * 0.031 + TIME * 0.7);
        float streak = step(0.89, wave) * step(0.7, noise(floor(p / vec2(7.0, 3.0))));
        color = mix(color, light_color.rgb, streak * 0.55);
    } else if (surface_kind == 7) {
        color = mix(color, dark_color.rgb, step(0.89, noise(floor(p / 2.0))) * 0.18);
    } else if (surface_kind == 11) {
        color = mix(color, dark_color.rgb, float(mod(p.x, 10.0) < 1.0) * 0.48);
        color = mix(color, light_color.rgb, float(mod(p.y, 7.0) < 1.0) * 0.13);
    } else if (surface_kind == 12) {
        float groove = mod(p.y, 9.0);
        color = mix(color, dark_color.rgb, float(groove < 2.0) * 0.46);
        color = mix(color, light_color.rgb, float(groove > 7.0) * 0.27);
    }
    COLOR = vec4(color, base_color.a);
}
