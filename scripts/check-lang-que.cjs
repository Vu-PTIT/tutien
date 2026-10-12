const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const client = path.join(root, 'client');
const layout = JSON.parse(fs.readFileSync(path.join(client, 'data/world/lang_que_layout.json')));
const links = JSON.parse(fs.readFileSync(path.join(client, 'data/world/links.json'))).links;

assert.equal(layout.map_id, 'm_lang_que');
assert.deepEqual(layout.size_px, [8192, 6144]);
assert.equal(layout.cell_size_px, 32);
assert.equal(layout.safe_zone, true);
assert.equal(layout.hostile_spawn_count, 0);
assert.equal(layout.districts.length, 8);
assert.equal(layout.plots.length, 12);
assert.equal(layout.activity_slots.filter(s => s.activity === 'fishing').length, 4);
assert.equal(layout.npcs.length, 15);
assert.ok(layout.authority.startsWith('offline'));
const ids = new Set();
const resource = uri => {
  assert.ok(uri.startsWith('res://'), `Unexpected asset path ${uri}`);
  const file = path.join(client, uri.slice(6));
  assert.ok(fs.existsSync(file), `Missing asset ${uri}`);
  return file;
};
const pngSize = uri => {
  const buffer = fs.readFileSync(resource(uri));
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
};
for (const object of layout.objects) {
  assert.ok(!ids.has(object.id), `Duplicate object ${object.id}`);
  ids.add(object.id);
  assert.ok(object.cell[0] >= 0 && object.cell[0] < 256 && object.cell[1] >= 0 && object.cell[1] < 192, `Out-of-bounds ${object.id}`);
  const dimensions = pngSize(object.texture);
  assert.equal(object.art_scale, 2, `Non-integer art scale ${object.id}`);
  if (object.solid_px.length) {
    assert.equal(object.solid_px.length, 4);
    assert.ok(object.solid_px[0] <= dimensions[0] * 2, `Footprint exceeds artwork ${object.id}`);
    assert.ok(object.solid_px[1] <= dimensions[1] * 2, `Footprint exceeds artwork height ${object.id}`);
  }
  assert.ok(object.name_en, `Missing English object label ${object.id}`);
}
for (const slot of layout.activity_slots) {
  assert.equal(slot.capacity, 1, `Slot has invalid capacity ${slot.id}`);
  assert.ok(ids.has(slot.id) || layout.plots.some(p => p.id === slot.id));
}
for (const id of layout.portal_link_ids) {
  const link = links.find(link => link.id === id);
  assert.ok(link && link.status === 'open', `Missing village route ${id}`);
  assert.ok(layout.objects.some(o => o.link_id === id));
}
assert.deepEqual(pngSize(layout.npc_texture), [192, 192]);
assert.ok(fs.readFileSync(path.join(client, 'scenes/m_lang_que.tscn'), 'utf8').includes('res://scripts/lang_que.gd'));
console.log(`PASS first village data/art: ${ids.size} props, 8 districts, 15 NPCs, 12 plots, 4 fishing slots, 2 shared portals.`);
