shader_type canvas_item;
render_mode unshaded;
uniform bool raining = false;
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void fragment() {
    vec2 p = floor(UV / SCREEN_PIXEL_SIZE / 2.0);
    vec2 moving = p + vec2(TIME * 32.0, TIME * 145.0);
    vec2 cell = floor(moving / vec2(30.0, 42.0));
    vec2 local = mod(moving, vec2(30.0,42.0));
    float drop = float(local.x < 1.0 && local.y < 7.0) * step(0.66,hash(cell));
    COLOR = vec4(0.73,0.82,0.91,raining ? drop*0.34 : 0.0);
}
