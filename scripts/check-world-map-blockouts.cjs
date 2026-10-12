#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const mapDir = path.join(root, 'client/data/world/maps');
const mapSpecs = {
  m_lang_que: [256, 192],
  m_thang_long: [320, 256],
  m_vanh_dai_tay: [288, 224],
  m_cang_dong_bac: [256, 192],
  m_mo_lo_thien: [224, 192],
  m_mo_ngam: [192, 160],
  m_ba_vi: [320, 256],
  m_tram_thien_mach: [160, 128],
};
const maps = new Map();
const ids = new Set();
const checkPoint = (point, width, height, label, allowEdge = true) => {
  assert.ok(Array.isArray(point) && point.length === 2 && point.every(Number.isFinite), `${label}: invalid coordinate`);
  const edgeX = allowEdge ? width : width - 1;
  const edgeY = allowEdge ? height : height - 1;
  assert.ok(point[0] >= 0 && point[0] <= edgeX && point[1] >= 0 && point[1] <= edgeY, `${label}: outside ${width}x${height}`);
};
const distanceToSegment = (point, start, end) => {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
    ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared));
  return Math.hypot(point[0] - (start[0] + t * dx), point[1] - (start[1] + t * dy));
};
const nearestRouteDistance = (point, routes) => Math.min(...routes.flatMap(route =>
  route.points.slice(1).map((end, index) => distanceToSegment(point, route.points[index], end))));

for (const [mapId, [width, height]] of Object.entries(mapSpecs)) {
  const filename = path.join(mapDir, `${mapId}.json`);
  assert.ok(fs.existsSync(filename), `Missing map data: ${mapId}`);
  const map = JSON.parse(fs.readFileSync(filename, 'utf8'));
  assert.equal(map.map_id, mapId, `${mapId}: map id mismatch`);
  assert.equal(map.blockout_status, 'terrain_only', `${mapId}: unexpected production status`);
  assert.equal(map.scene_mode, 'layered_raster_vector', `${mapId}: invalid renderer mode`);
  assert.equal(map.cell_size_px, 32, `${mapId}: cell size drift`);
  assert.deepEqual([map.width_cells, map.height_cells], [width, height], `${mapId}: blueprint dimensions drift`);
  assert.ok(Object.keys(map.palette || {}).length >= 10, `${mapId}: missing terrain palette`);

  const layers = map.floors ? Object.values(map.floors) : [map];
  if (mapId === 'm_mo_ngam') assert.deepEqual(Object.keys(map.floors).sort(), ['b1', 'b2'], 'Underground must have B1/B2 scenes');
  else assert.ok(!map.floors, `${mapId}: unexpected floor split`);
  for (const [floorIndex, floor] of layers.entries()) {
    assert.ok(floor.ground_regions.length > 0, `${mapId}: floor ${floorIndex} has no landform regions`);
    assert.ok(floor.roads.length >= 3, `${mapId}: floor ${floorIndex} has too few routes`);
    assert.ok(Array.isArray(floor.waters), `${mapId}: floor ${floorIndex} lacks water list`);
    const localIds = new Set();
    for (const [groupName, records] of Object.entries({
      ground_regions: floor.ground_regions,
      roads: floor.roads,
      waters: floor.waters,
    })) {
      for (const item of records) {
        assert.ok(item.id && !localIds.has(item.id), `${mapId}: duplicate/missing feature id ${item.id}`);
        localIds.add(item.id);
        assert.ok(!ids.has(item.id), `Feature id is not globally unique: ${item.id}`);
        ids.add(item.id);
        if (groupName === 'ground_regions') {
          assert.ok(Array.isArray(item.points) && item.points.length >= 3, `${item.id}: landform polygon is incomplete`);
          for (const point of item.points) checkPoint(point, width, height, item.id);
        } else if (groupName === 'roads') {
          assert.ok(Array.isArray(item.points) && item.points.length >= 2, `${item.id}: route centerline is incomplete`);
          assert.ok(Number.isFinite(item.width_cells) && item.width_cells >= 2 && item.width_cells <= 6, `${item.id}: route width outside design range`);
          for (const point of item.points) checkPoint(point, width, height, item.id);
          if (item.closed) assert.deepEqual(item.points[0], item.points.at(-1), `${item.id}: closed loop must return to its start`);
        } else {
          assert.ok(['ribbon', 'ellipse', 'polygon'].includes(item.shape), `${item.id}: unsupported water shape`);
          assert.equal(typeof item.collision, 'boolean', `${item.id}: water collision intent missing`);
          if (item.shape === 'ellipse') {
            checkPoint(item.center_cell, width, height, item.id, false);
            assert.ok(item.radii_cells.length === 2 && item.radii_cells.every(n => n > 0), `${item.id}: invalid water body size`);
          } else {
            assert.ok(Array.isArray(item.points) && item.points.length >= (item.shape === 'polygon' ? 3 : 2), `${item.id}: water geometry is incomplete`);
            for (const point of item.points) checkPoint(point, width, height, item.id);
            if (item.shape === 'ribbon') assert.ok(item.width_cells > 0, `${item.id}: river has no width`);
          }
        }
      }
    }
  }
}

const linksFile = path.join(root, 'client/data/world/links.json');
const world = JSON.parse(fs.readFileSync(linksFile, 'utf8'));
assert.equal(world.cell_size_px, 32, 'World-link coordinate scale drift');
assert.equal(world.links.length, 10, 'Expected ten external world links');
assert.equal(world.floor_links.length, 1, 'Expected one internal mine floor link');
const allLinks = [...world.links, ...world.floor_links];
const linkIds = new Set();
for (const link of allLinks) {
  assert.ok(link.id && !linkIds.has(link.id), `Duplicate/missing link id ${link.id}`);
  linkIds.add(link.id);
  assert.ok(link.a && link.b, `${link.id}: route must have both ends`);
  for (const endpoint of [link.a, link.b]) {
    const map = maps.get(endpoint.map_id) || JSON.parse(fs.readFileSync(path.join(mapDir, `${endpoint.map_id}.json`), 'utf8'));
    const floor = map.floors ? map.floors[endpoint.floor_id] : map;
    assert.ok(floor, `${link.id}: missing floor ${endpoint.floor_id}`);
    checkPoint(endpoint.cell, map.width_cells, map.height_cells, `${link.id} portal`, false);
    checkPoint(endpoint.entry_anchor_cell, map.width_cells, map.height_cells, `${link.id} arrival`, false);
    const distance = Math.hypot(endpoint.cell[0] - endpoint.entry_anchor_cell[0], endpoint.cell[1] - endpoint.entry_anchor_cell[1]);
    assert.ok(distance >= 3, `${link.id}: arrival anchor must be at least three cells inland`);
    const portalRoadDistance = nearestRouteDistance(endpoint.cell, floor.roads);
    const anchorRoadDistance = nearestRouteDistance(endpoint.entry_anchor_cell, floor.roads);
    assert.ok(portalRoadDistance <= 0.8, `${link.id}: portal is detached from a road centerline`);
    const usableRoadHalfWidth = Math.max(...floor.roads.map(route => route.width_cells)) * 0.5;
    assert.ok(anchorRoadDistance <= usableRoadHalfWidth, `${link.id}: arrival anchor falls outside the connected road network`);
  }
}
for (const mapId of Object.keys(mapSpecs)) maps.set(mapId, JSON.parse(fs.readFileSync(path.join(mapDir, `${mapId}.json`), 'utf8')));
assert.equal(world.links.find(link => link.id === 'ln_thang_cang')?.travel_mode, 'transit', 'Port route must use transit mode');
for (const id of ['ln_ngam_rung', 'ln_rung_tram']) {
  assert.equal(world.links.find(link => link.id === id)?.status, 'locked_initial', `${id} must remain locked initially`);
}
const floorLink = world.floor_links[0];
assert.equal(floorLink.id, 'ln_mg_b1_b2', 'Unexpected internal mine-floor link');
assert.equal(floorLink.a.map_id, floorLink.b.map_id, 'Mine floor link must stay inside one map');
assert.notEqual(floorLink.a.floor_id, floorLink.b.floor_id, 'Mine floor link must connect distinct floors');

const previewScript = fs.readFileSync(path.join(root, 'client/scripts/world_map_blockout_preview.gd'), 'utf8');
assert.ok(previewScript.includes('L00_Ground') && previewScript.includes('L01_LandformsRoads') && previewScript.includes('L02_WaterBodies'), 'Preview layers are missing');
assert.ok(previewScript.includes('DATA_WaterCollision') && previewScript.includes('DATA_PortalMarkers'), 'Independent map data layers are missing');
assert.ok(!previewScript.includes('TileMapLayer'), 'New map preview must stay vector/layer based');
assert.ok(fs.existsSync(path.join(root, 'client/shaders/world_map_blockout.gdshader')), 'Missing blockout pixel surface shader');
assert.ok(fs.existsSync(path.join(root, 'client/scenes/world_map_blockout_preview.tscn')), 'Missing standalone preview scene');
console.log(`PASS world-map blockouts: ${Object.keys(mapSpecs).length} maps, ${world.links.length} external links, ${world.floor_links.length} floor link, ${ids.size} terrain features.`);
