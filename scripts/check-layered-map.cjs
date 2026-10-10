// Offline branch-specific architecture and asset contract audit.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = path.resolve(__dirname, "../client");
const file = (p) => path.join(base, p);
const load = (p) => fs.readFileSync(file(p), "utf8");
const map = JSON.parse(load("data/layered_village_m1.json"));
const art = JSON.parse(load("data/layered_terrain_art_m16.json"));
assert.equal(art.schema, "tutien.layered-terrain-art.v1");
assert.equal(art.visual_asset_source, "existing_assets");
for (const key of ["ground","road","water"]) {
  const entry = art[key];
  assert.ok(entry.texture.startsWith("res://assets/tileset/"), "Art must come from existing source assets: "+key);
  const sourceFile = file(entry.texture.slice(6));
  assert.ok(fs.existsSync(sourceFile), "Missing source atlas: "+entry.texture);
  const png = fs.readFileSync(sourceFile);
  assert.equal(png.toString("hex",0,8),"89504e470d0a1a0a", "Bad source PNG signature");
  const width=png.readUInt32BE(16), height=png.readUInt32BE(20);
  const [left,top,w,h] = entry.region;
  assert.ok([left,top,w,h].every(Number.isInteger) && left>=0 && top>=0 && w>=8 && h>=8,
    "Non-pixel aligned art crop: "+key);
  assert.ok(left+w<=width && top+h<=height,"Source pixel crop outside atlas: "+key);
  assert.ok(entry.blend>0 && entry.blend<=1, "Art opacity out of range");
}
assert.ok(art.overlays.chunk_size === 256, "Ground raster chunk resolution changed");
assert.ok(art.overlays.seed>=1 && art.overlays.grass_regions.length>=8,
  "Insufficient licensed pixel grass art source patches");
const grassPng=fs.readFileSync(file(art.ground.texture.slice(6)));
const grassWidth=grassPng.readUInt32BE(16),grassHeight=grassPng.readUInt32BE(20);
for (const [x,y,w,h] of art.overlays.grass_regions) {
  assert.ok(x>=0 && y>=0 && w>=4 && h>=4 && x+w<=grassWidth && y+h<=grassHeight,
    "Grass raster crop outside licensed source image");
}

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
assert.ok(Array.isArray(map.water_fx) && map.water_fx.length === map.waters.length, "Missing independent water effects");
assert.ok(Array.isArray(map.courtyards) && map.courtyards.length >= 3, "No village heart and linked yards");
assert.ok(Array.isArray(map.districts) && map.districts.length >= 5, "Village lacks named neighborhoods");
assert.ok(Array.isArray(map.door_routes) && map.door_routes.length >= 5, "Entrances have no paths");

const ids = new Set();
for (const [group,records] of Object.entries({
  roads:map.roads, waters:map.waters, terrain_patches:map.terrain_patches, courtyards:map.courtyards, districts:map.districts, terraces:map.terraces, bridges:map.bridges, objects:map.objects, activity_slots:map.activity_slots
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
    if (group === "courtyards") {
      assert.ok(inside(item.center), "Courtyard outside village");
      assert.ok(item.radii.length === 2 && item.radii[0] > 35 && item.radii[1] > 20,
        "Courtyard needs intentional open space: " + item.id);
      assert.ok(["cobblestone", "packed_earth"].includes(item.kind), "Unsupported courtyard art");
    }
    if (group === "districts") {
      assert.ok(inside(item.center), "District center outside village");
      assert.ok(item.size.length === 2 && item.size.every(n => n > 0), "Invalid district dimensions");
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
for (const effect of map.water_fx) {
 assert.ok(waterIds.has(effect.water_id) && effect.ripple_count > 0 && effect.ripple_count <= 150,
   "Invalid ambient water effect: "+effect.water_id);
}
for (const bridge of map.bridges) assert.ok(waterIds.has(bridge.water_id), "Bridge refers to missing water body");
const roadById = new Map(map.roads.map(r=>[r.id,r]));
const objectById = new Map(map.objects.map(o=>[o.id,o]));
const separation = (a,b) => Math.hypot(a[0]-b[0], a[1]-b[1]);
for (const district of map.districts) assert.ok(objectById.has(district.landmark),
  "District landmark is missing: " + district.id);
for (const route of map.door_routes) {
  const road = roadById.get(route.route_id);
  const object = objectById.get(route.object_id);
  assert.ok(road && object, "Entrance route refers to missing road/prop: " + JSON.stringify(route));
  assert.ok(object.action !== "", "Entrance route must lead to an interactable prop");
  const target = [object.position[0] + object.interaction_offset[0],
    object.position[1] + object.interaction_offset[1]];
  const approach = road.points[road.points.length-1];
  assert.ok(separation(target,approach) <= 9,
    "Path ends too far from prop access: " + route.object_id + " (" +
    separation(target,approach).toFixed(1) + "px)");
}
for (const slot of map.activity_slots) {
  assert.ok(objectIds.has(slot.object_id), "Activity slot lacks a world object: " + slot.id);
  assert.ok(inside(slot.position), "Activity slot outside world");
  assert.ok(slot.capacity > 0, "Invalid activity slot capacity");
}
for (const p of [
  "scenes/main.tscn", "scenes/layered_village_m1.tscn", "scenes/legacy_linh_khe.tscn",
  "scripts/layered_village.gd", "scripts/layered_prop.gd", "scripts/layered_player.gd",
  "scripts/layered_minimap.gd", "scripts/layered_landforms.gd", "scripts/layered_ground_raster.gd", "scripts/layered_water_fx.gd",
  "scripts/layered_cliff_details.gd", "shaders/layered_surface.gdshader"
]) assert.ok(fs.existsSync(file(p)), "Missing M1 resource: " + p);
const scene = load("scenes/layered_village_m1.tscn");
const mapScript = load("scripts/layered_village.gd");
assert.ok(!scene.includes("TileMapLayer"), "New runtime scene uses TileMapLayer");
assert.ok(!mapScript.includes("TileMapLayer.new"), "New renderer constructs TileMapLayer");
assert.ok(mapScript.includes("CollisionPolygon2D.new"), "Water collider is not freeform");
assert.ok(mapScript.includes("terrain_patches"), "Map ignores authored terrain details");
assert.ok(mapScript.includes("_bind_source_art"), "Native source terrain art not integrated in runtime map");
assert.ok(mapScript.includes("_build_ground_raster_art"), "Missing real source-art ground chunks");
const surface = load("shaders/layered_surface.gdshader");
assert.ok(surface.includes("source_grass") && surface.includes("source_road") &&
 surface.includes("source_water"), "Source atlas pixels not sampled in shader");
assert.ok(load("scripts/layered_ground_raster.gd").includes("canvas.blend_rect"),
 "M1.6 ground art is not composited from the original pixel artwork");
assert.ok(mapScript.includes('layout.get("courtyards"'), "Missing non-tile village square");
assert.ok(load("scripts/layered_minimap.gd").includes('layout.get("courtyards"'),
  "Minimap does not show the village square");
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
  map.terrain_patches.length + " visual clearings, " + map.terraces.length + " ridges, " +
  map.courtyards.length + " yards, " + map.door_routes.length + " linked entrances, " +
  map.bridges.length + " footbridges, " + map.activity_slots.length +
  " activity placeholders.");
