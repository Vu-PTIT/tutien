// Static checks only. Godot presentation_smoke.gd is the runtime authority.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../client');
const files = [];
function scan(dir) {
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    if(e.name === '.godot') continue;
    const p=path.join(dir,e.name);
    if(e.isDirectory()) scan(p); else files.push(p);
  }
}
scan(root);
let references=0, scenes=0;
for(const file of files.filter(p=>/\.(tscn|tres|gd)$/.test(p))) {
  const src=fs.readFileSync(file,'utf8');
  for(const m of src.matchAll(/(?:path=|preload\(|load\()"(res:\/\/[^"]+)"/g)) {
    if(m[1].includes('%')) continue;
    assert.ok(fs.existsSync(path.join(root,m[1].slice(6))),file+': missing '+m[1]);
    references++;
  }
  if(!file.endsWith('.tscn')) continue;
  scenes++;
  const local=new Set(['.']);
  let rootSeen=false;
  for(const line of src.split('\n').filter(x=>x.startsWith('[node '))) {
    const name=line.match(/name="([^"]+)"/)[1], parent=line.match(/parent="([^"]+)"/)?.[1];
    if(!rootSeen){rootSeen=true;continue;}
    assert.ok(local.has(parent),file+': missing parent '+parent);
    const full=parent==='.'?name:parent+'/'+name;
    assert.ok(!local.has(full),file+': duplicate node '+full);local.add(full);
  }
}
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const main=read('scripts/main.gd'), hud=read('scenes/ui/hud.tscn');
assert.ok(!/^@tool/m.test(main), 'Runtime must not run in editor');
assert.ok(!main.includes('_draw_editor_ui_preview'), 'No alternate/fake editor HUD');
assert.equal((read('scenes/ui/inventory.tscn').match(/name="Slot\d+" type="Button"/g)||[]).length,24);
assert.equal((hud.match(/name="Slot\d+" type="Button"/g)||[]).length,6);
assert.ok(hud.includes('name="MapButton" type="Button"'), 'Map route button is present');
assert.ok(hud.includes('name="WorldMap" type="Control"'), 'World map overlay is present');
const mapCatalog=JSON.parse(fs.readFileSync(path.join(root,'data/map_catalog.json'),'utf8'));
assert.equal(mapCatalog.tile_size_px,32);
assert.deepEqual(mapCatalog.maps.map(m=>m.id),['m_an_khe','m_truc_am','m_thach_can','m_co_tinh']);
assert.deepEqual(mapCatalog.maps[0].size_tiles,[48,36]);
assert.deepEqual(mapCatalog.maps.map(m=>m.areas.length),[1,3,2,5]);
assert.deepEqual(mapCatalog.maps.slice(1).map(m=>m.size_status),['prototype_canvas_only','prototype_canvas_only','prototype_canvas_only']);
for(const map of mapCatalog.maps) {
  assert.ok(map.preview, 'Every route needs a map preview: '+map.id);
  const previewPath=path.join(root,map.preview.replace(/^res:\/\//,''));
  assert.ok(fs.existsSync(previewPath), 'Missing map preview asset: '+map.preview);
  const png=fs.readFileSync(previewPath);
  assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.equal(png.readUInt32BE(16),1448);
  assert.equal(png.readUInt32BE(20),1086);
  const [spawnX,spawnY]=map.spawn_tiles;
  assert.ok(!map.solid_rects_tiles.some(([x,y,w,h])=>spawnX>=x&&spawnX<x+w&&spawnY>=y&&spawnY<y+h),
    'Map spawn is blocked: '+map.id);
  assert.ok(map.areas.some(area=>{
    const [x,y,w,h]=area.rect_tiles;
    return spawnX>=x&&spawnX<x+w&&spawnY>=y&&spawnY<y+h;
  }), 'Map spawn is outside all named areas: '+map.id);
}
assert.ok(read('project.godot').includes('window/stretch/scale_mode="integer"'));
assert.ok(read('project.godot').includes('window/size/viewport_width=640'));
assert.ok(read('scripts/inventory_panel.gd').includes('"operationId": "starter_claim_v1"'));
assert.ok(read('scripts/inventory_panel.gd').includes('inventory.clear()'));
for(const name of ['an_khe','an_khe_world_v1','cultivator','icons']) {
  const png=fs.readFileSync(path.join(root,'assets/pixel/'+name+'.png'));
  assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.ok(png.readUInt32BE(16)>0 && png.readUInt32BE(20)>0);
  if(['cultivator','icons'].includes(name)) assert.ok([3,6].includes(png[25]),'Expected transparent PNG atlas: '+name);
}
assert.ok(read('scenes/map_world.tscn').includes('name="Background" type="Sprite2D"'), 'All maps share a scrolling background scene');
assert.ok(read('scripts/game_map.gd').includes('solid_rects_tiles'), 'Map collision blockers are catalog-backed');
assert.ok(read('scripts/game_map.gd').includes('room_lock'), 'Cổ Tỉnh camera locks by room');
assert.ok(read('scripts/ui/world_map_panel.gd').includes('signal map_requested'), 'Route panel emits travel requests');
assert.ok(main.includes('world_map.map_requested.connect(_travel_to_map)'), 'Main connects map travel');
console.log('PASS static scene audit: '+scenes+' scenes, '+references+' resource references, 24 inventory slots, 6 hotbar buttons, real PNG assets.');
console.log('Not a GDScript parser or Godot runtime test. Run presentation_smoke.gd in Godot.');
