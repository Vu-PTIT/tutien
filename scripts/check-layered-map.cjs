// Offline branch-specific architecture and asset contract audit.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = path.resolve(__dirname, "../client");
const file = (p) => path.join(base, p);
const load = (p) => fs.readFileSync(file(p), "utf8");
const map = JSON.parse(load("data/layered_village_m1.json"));

assert.equal(map.schema_version, 1, "Data schema version");
assert.ok(Array.isArray(map.size) && map.size.length === 2);
const [w,h] = map.size;
assert.ok(w >= 320 && h >= 240);
const inside = ([x,y]) => Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= w && y >= 0 && y <= h;
assert.ok(inside(map.spawn), "Player spawn outside map");
assert.ok(map.roads.length >= 4, "Missing authored road paths");
assert.ok(map.waters.length >= 2, "Missing separate water bodies");
assert.ok(map.terrain_patches.length >= 3, "No authored grass/soil clearings");
assert.ok(map.terraces.length >= 2, "Expected two irregular terrain ridges");
assert.ok(map.bridges.length >= 1, "Missing timber river crossing");

const ids = new Set();
for (const [group,records] of Object.entries({
  roads:map.roads, waters:map.waters, terrain_patches:map.terrain_patches, terraces:map.terraces, bridges:map.bridges, objects:map.objects, activity_slots:map.activity_slots
})) {
  for (const item of records) {
    assert.ok(typeof item.id === "string" && item.id.length, group + " without ID");
    assert.ok(!ids.has(item.id), "Duplicate ID: " + item.id);
    ids.add(item.id);
    if (group === "roads" || (group === "waters" && item.shape !== "pond")) {
      assert.ok(Array.isArray(item.points) && item.points.length >= 2, "Broken freeform path: " + item.id);
      for (const p of item.points) assert.ok(Array.isArray(p) && p.length === 2 && p.every(Number.isFinite), item.id);
      assert.ok(item.radius >= 4, "Unusable road/water radius: " + item.id);
    }
    if (group === "terraces") {
      assert.ok(["north", "south"].includes(item.side), "Terrace side must face map border");
      assert.ok(Array.isArray(item.edge) && item.edge.length >= 3, "Invalid ridge edge");
      assert.ok(item.edge.every(inside), "Ridge edge is off-map: "+item.id);
      assert.ok(item.depth >= 8 && item.depth <= 32, "Invalid rockface depth");
      assert.ok(item.collision === true, "Cliff face must be solid");
    }
    if (group === "bridges") {
      assert.ok(inside(item.position), "Bridge position outside map");
      assert.ok(item.size.length === 2 && item.size[0] > 90 && item.size[1] >= 20, "Bridge deck dimensions");
      assert.ok(Number.isFinite(item.collision_gap) && item.collision_gap >= item.size[1] / 2 + 3,
        "Insufficient water crossing cutout");
    }
    if (group === "objects") {
      assert.ok(inside(item.position), "Prop outside map: " + item.id);
      assert.ok(!("gid" in item), "Legacy GID leaked to gameplay object: " + item.id);
      assert.ok(item.texture.startsWith("res://") && fs.existsSync(file(item.texture.slice(6))),
        "Missing independent sprite: " + item.texture);
    }
    if (group === "terrain_patches") {
      assert.ok(inside(item.center), "Patch outside bounds: " + item.id);
      assert.ok(item.radii.length === 2 && item.radii.every(n => n > 2), "Broken soil/clearing shape");
    }
  }
}
const objectIds = new Set(map.objects.map(o => o.id));
const waterIds = new Set(map.waters.map(o => o.id));
for (const bridge of map.bridges) assert.ok(waterIds.has(bridge.water_id), "Bridge refers to missing water body");
for (const slot of map.activity_slots) {
  assert.ok(objectIds.has(slot.object_id), "Activity slot lacks a world object: " + slot.id);
  assert.ok(inside(slot.position), "Activity slot outside world");
  assert.ok(slot.capacity > 0, "Invalid activity slot capacity");
}
for (const p of [
  "scenes/main.tscn", "scenes/layered_village_m1.tscn", "scenes/legacy_linh_khe.tscn",
  "scripts/layered_village.gd", "scripts/layered_prop.gd", "scripts/layered_player.gd",
  "scripts/layered_minimap.gd", "scripts/layered_landforms.gd", "shaders/layered_surface.gdshader"
]) assert.ok(fs.existsSync(file(p)), "Missing M1 resource: " + p);
const scene = load("scenes/layered_village_m1.tscn");
const mapScript = load("scripts/layered_village.gd");
assert.ok(!scene.includes("TileMapLayer"), "New runtime scene uses TileMapLayer");
assert.ok(!mapScript.includes("TileMapLayer.new"), "New renderer constructs TileMapLayer");
assert.ok(mapScript.includes("CollisionPolygon2D.new"), "Water collider is not freeform");
assert.ok(mapScript.includes("terrain_patches"), "Map ignores authored terrain details");
assert.ok(mapScript.includes("Geometry2D.clip_polygons"), "No collision-aware water crossing");
assert.ok(load("scripts/layered_landforms.gd").includes("CollisionPolygon2D"),
  "Terrace rock faces are not collision-backed");
assert.ok(load("scripts/layered_minimap.gd").includes('layout.get("bridges"'),
  "Minimap is missing the timber bridge");
assert.ok(load("shaders/layered_surface.gdshader").includes("world_pixel = VERTEX"),
  "Shader must paint consistently in world pixel coordinates");
assert.ok(load("scenes/legacy_linh_khe.tscn").includes("village_demo.gd"),
  "Legacy reference scene was not preserved");
console.log("PASS scene-mode map: " + map.objects.length + " independent props, " +
  map.roads.length + " roads, " + map.waters.length + " waterways, " +
  map.terrain_patches.length + " visual clearings, " + map.terraces.length +
  " ridges, " + map.bridges.length + " footbridges, " + map.activity_slots.length +
  " activity placeholders.");
