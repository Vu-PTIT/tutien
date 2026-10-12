const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const client = path.resolve(__dirname, '../client');
const read = relative => fs.readFileSync(path.join(client, relative), 'utf8');
const layout = JSON.parse(read('data/world/lang_que_moi_layout.json'));
const old = JSON.parse(read('data/world/lang_que_layout.json'));
const resource = uri => path.join(client, uri.replace(/^res:\/\//, ''));
assert.equal(layout.layout_id, 'lang_que_moi');
assert.deepEqual(layout.source.legacy_layout_inputs, []);
assert.deepEqual(layout.size_px, [8192, 6144]);
assert.equal(layout.safe_zone, true);
assert.equal(layout.hostile_spawn_count, 0);
assert.equal(layout.districts.length, 8);
assert.equal(layout.plots.length, 12);
assert.equal(layout.npcs.length, 15);
assert.equal(layout.activity_slots.filter(s => s.activity === 'fishing').length, 4);
assert.ok(read('scenes/main.tscn').includes('res://scenes/m_lang_que_moi.tscn'));
assert.ok(read('scenes/m_lang_que_moi.tscn').includes('res://scripts/lang_que_moi.gd'));
assert.ok(read('scripts/lang_que_moi.gd').startsWith('extends Node2D\n'));
assert.ok(!read('tools/build_lang_que_moi.py').includes('deepcopy'));
assert.ok(!/read_text|lang_que_layout\.json|maps\/m_lang_que\.json/.test(read('tools/build_lang_que_moi.py')));
assert.notDeepEqual(layout.terrain.roads, old.terrain.roads);
assert.notDeepEqual(layout.terrain.waters, old.terrain.waters);
assert.notDeepEqual(layout.terrain.spawn_cell, old.terrain.spawn_cell);
const oldIds = new Set(old.objects.map(o => o.id));
const ids = new Set();
for (const object of layout.objects) {
  assert.ok(!oldIds.has(object.id), `Old placement retained: ${object.id}`);
  assert.ok(!ids.has(object.id), `Duplicate placement: ${object.id}`);
  ids.add(object.id);
  assert.ok(!object.texture.includes('vietnam_village/'), `Test village building used: ${object.id}`);
  assert.ok(object.cell[0] > 0 && object.cell[0] < 256 && object.cell[1] > 0 && object.cell[1] < 192);
  assert.equal(object.art_scale, 2);
  assert.ok(fs.existsSync(resource(object.texture)), `Missing asset: ${object.texture}`);
  const png = fs.readFileSync(resource(object.texture));
  if (object.solid_px.length) {
    assert.ok(object.solid_px[0] <= png.readUInt32BE(16) * object.art_scale);
    assert.ok(object.solid_px[1] <= png.readUInt32BE(20) * object.art_scale);
  }
}
for (const slot of layout.activity_slots) {
  assert.equal(slot.capacity, 1);
  assert.ok(ids.has(slot.id) || layout.plots.some(p => p.id === slot.id));
}
const links = JSON.parse(read('data/world/links.json')).links;
for (const id of layout.portal_link_ids) {
  const link = links.find(l => l.id === id);
  assert.equal(link.status, 'open');
  const origin = [link.a, link.b].find(e => e.map_id === layout.map_id);
  const marker = layout.objects.find(o => o.link_id === id);
  assert.deepEqual(marker.cell.map((v, i) => v + marker.interaction_offset_px[i] / 32), origin.cell);
}
console.log(`PASS new village: independent geometry and placements; ${ids.size} objects, 8 districts, 12 plots, 4 fishing slots, 2 world links.`);
