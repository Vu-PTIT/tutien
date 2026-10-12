shader_type canvas_item;
uniform bool foliage = false;
uniform bool opened = false;
uniform float phase = 0.0;
void vertex() {
    if (foliage) {
        VERTEX.x += floor(sin(TIME * 1.25 + phase) * 1.25) * step(UV.y, 0.72);
    }
}
void fragment() {
    // CanvasItem fragment COLOR already contains the sampled sprite texture.
    vec4 c = COLOR;
    if (opened && UV.x > 0.42 && UV.x < 0.59 && UV.y > 0.56 && UV.y < 0.91) {
        c.rgb *= vec3(0.25, 0.28, 0.30);
    }
    COLOR = c;
}
