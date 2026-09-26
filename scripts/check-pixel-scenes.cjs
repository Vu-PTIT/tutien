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
const tileSymbols='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
const layoutByMapId=new Map(mapCatalog.maps.map(map=>[
  map.id,
  JSON.parse(fs.readFileSync(path.join(root,'data/maps/'+map.id.slice(2)+'.json'),'utf8'))
]));
const reachableByMapId=new Map();
const trucAm=mapCatalog.maps.find(m=>m.id==='m_truc_am');
const boarSign=trucAm.interactables.find(p=>p.entity_id==='ta.trail.boar_sign');
assert.equal(boarSign.action_kind,'encounter','Sơn Trư sign launches the server PvE encounter');
assert.equal(boarSign.encounter_id,'en_boar');
assert.deepEqual(boarSign.position_tiles,[35,17],'The encounter entrance belongs to Bãi Sơn Trư');
for(const map of mapCatalog.maps) {
  const layout=layoutByMapId.get(map.id);
  assert.ok(map.preview, 'Every route needs a map preview: '+map.id);
  const previewPath=path.join(root,map.preview.replace(/^res:\/\//,''));
  assert.ok(fs.existsSync(previewPath), 'Missing map preview asset: '+map.preview);
  const png=fs.readFileSync(previewPath);
  assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.equal(png.readUInt32BE(16),1448);
  assert.equal(png.readUInt32BE(20),1086);
  const [spawnX,spawnY]=map.spawn_tiles;
  assert.equal(layout.ground_rows.length,map.size_tiles[1],'Terrain height matches map catalog: '+map.id);
  assert.ok(layout.ground_rows.every(row=>row.length===map.size_tiles[0]&&[...row].every(symbol=>tileSymbols.indexOf(symbol)>=0)),
    'Terrain rows use valid atlas symbols and match map width: '+map.id);
  const solidTileIds=new Set(layout.solid_tile_ids||[]);
  const terrainAt=(x,y)=>tileSymbols.indexOf(layout.ground_rows[y][x]);
  const inRect=(x,y,[rx,ry,rw,rh])=>x>=rx&&x<rx+rw&&y>=ry&&y<ry+rh;
  const hasManualBlock=(x,y)=>map.solid_rects_tiles.some(rect=>inRect(x,y,rect));
  const hasTerrainException=(x,y)=>(layout.collision_walkable_rects_tiles||[]).some(rect=>inRect(x,y,rect));
  const walkable=(x,y)=>x>=0&&x<map.size_tiles[0]&&y>=0&&y<map.size_tiles[1]
    && !hasManualBlock(x,y)
    && (!solidTileIds.has(terrainAt(x,y))||hasTerrainException(x,y));
  assert.ok(walkable(spawnX,spawnY),'Map spawn is walkable over its authored terrain: '+map.id);
  for(const [x,y,w,h] of layout.collision_walkable_rects_tiles||[]) {
    assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=map.size_tiles[0]&&y+h<=map.size_tiles[1],
      'Walkable terrain exception stays inside its map: '+map.id);
    let overlapsSolidTerrain=false;
    for(let ty=y;ty<y+h;ty++) for(let tx=x;tx<x+w;tx++) overlapsSolidTerrain ||= solidTileIds.has(terrainAt(tx,ty));
    assert.ok(overlapsSolidTerrain,'Walkable terrain exception must cross blocked terrain: '+map.id);
  }
  const reachable=new Set([`${spawnX},${spawnY}`]);
  const queue=[[spawnX,spawnY]];
  for(let i=0;i<queue.length;i++) {
    const [x,y]=queue[i];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;
      if(walkable(nx,ny)&&!reachable.has(key)) { reachable.add(key);queue.push([nx,ny]); }
    }
  }
  reachableByMapId.set(map.id,reachable);
  assert.ok(map.areas.some(area=>{
    const [x,y,w,h]=area.rect_tiles;
    return spawnX>=x&&spawnX<x+w&&spawnY>=y&&spawnY<y+h;
  }), 'Map spawn is outside all named areas: '+map.id);
  assert.ok(Array.isArray(map.interactables) && map.interactables.length>0, 'Map needs data-driven POIs: '+map.id);
  const ids=new Set();
  for(const poi of map.interactables) {
    assert.ok(poi.entity_id && !ids.has(poi.entity_id), 'POI ids must be unique within '+map.id);
    ids.add(poi.entity_id);
    assert.ok(poi.icon && fs.existsSync(path.join(root,poi.icon.replace(/^res:\/\//,''))), 'Missing POI icon for '+poi.entity_id);
    const [x,y]=poi.position_tiles;
    assert.ok(x>=0 && x<map.size_tiles[0] && y>=0 && y<map.size_tiles[1], 'POI outside map: '+poi.entity_id);
    assert.ok(walkable(Math.floor(x),Math.floor(y)), 'POI is blocked by authored terrain or a manual blocker: '+poi.entity_id);
    assert.ok(reachable.has(`${Math.floor(x)},${Math.floor(y)}`), 'POI is unreachable from its map spawn: '+poi.entity_id);
    if(poi.visual_prop_id) {
      const prop=layout.props.find(candidate=>candidate.name===poi.visual_prop_id);
      assert.ok(prop,'POI references an existing visual prop: '+poi.entity_id);
      const [px,py]=prop.position_tiles;
      const distance=Math.hypot(x-px,y-(py+0.5));
      assert.ok(distance<=3.2,'POI sits near its visible prop anchor: '+poi.entity_id+' ('+distance.toFixed(1)+' tiles)');
    }
    if(poi.action_kind==='gate') {
      const [ax,ay]=poi.target_arrival_tiles||[];
      const target=mapCatalog.maps.find(candidate=>candidate.id===poi.target_map_id);
      const targetLayout=layoutByMapId.get(poi.target_map_id);
      assert.ok(target && Number.isInteger(ax) && Number.isInteger(ay), 'Gate needs a known map and arrival tile: '+poi.entity_id);
      assert.ok(ax>=0 && ax<target.size_tiles[0] && ay>=0 && ay<target.size_tiles[1], 'Gate arrival is outside destination map: '+poi.entity_id);
      const targetBlockedByManual=target.solid_rects_tiles.some(rect=>inRect(ax,ay,rect));
      const targetTile=tileSymbols.indexOf(targetLayout.ground_rows[ay][ax]);
      const targetTerrainException=(targetLayout.collision_walkable_rects_tiles||[]).some(rect=>inRect(ax,ay,rect));
      assert.ok(!targetBlockedByManual&&(!new Set(targetLayout.solid_tile_ids||[]).has(targetTile)||targetTerrainException), 'Gate arrival is blocked: '+poi.entity_id);
      assert.ok(target.areas.some(area=>{const [sx,sy,w,h]=area.rect_tiles;return ax>=sx&&ax<sx+w&&ay>=sy&&ay<sy+h;}), 'Gate arrival is outside named destination areas: '+poi.entity_id);
    }
  }
  for(const ripple of map.water_ripples||[]) {
    const [x,y]=ripple.position_tiles;
    assert.ok(x>=0 && x<map.size_tiles[0] && y>=0 && y<map.size_tiles[1], 'Water ripple outside map: '+map.id);
    assert.ok(terrainAt(x,y)>=32&&terrainAt(x,y)<40,'Water ripple aligns with water terrain: '+map.id);
  }
}
for(const map of mapCatalog.maps) for(const poi of map.interactables) {
  if(poi.action_kind!=='gate') continue;
  const [arrivalX,arrivalY]=poi.target_arrival_tiles;
  assert.ok(reachableByMapId.get(poi.target_map_id).has(`${arrivalX},${arrivalY}`),
    'Gate arrival is reachable from the destination spawn: '+poi.entity_id);
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
const mapWorldScene=read('scenes/map_world.tscn'), gameMap=read('scripts/game_map.gd');
assert.ok(mapWorldScene.includes('name="Background" type="Sprite2D"'), 'Background placeholder stays hidden; painted art is route preview only');
assert.ok(mapWorldScene.includes('name="GroundLayer" type="TileMapLayer"'), 'Maps have an editable ground TileMapLayer');
assert.ok(mapWorldScene.includes('name="DetailLayer" type="TileMapLayer"'), 'Maps have a detail TileMapLayer');
assert.ok(mapWorldScene.includes('name="ForegroundLayer" type="TileMapLayer"'), 'Maps have a foreground TileMapLayer');
assert.ok(mapWorldScene.includes('name="Actors" type="Node2D" parent="."') && mapWorldScene.includes('y_sort_enabled = true') && gameMap.includes('var root: Node2D = $Actors'), 'Player and world objects are Y-sorted together');
assert.ok(gameMap.includes('solid_rects_tiles'), 'Map collision blockers are catalog-backed');
assert.ok(gameMap.includes('_build_authored_tile_layers()') && gameMap.includes('_set_atlas_cell('), 'Maps build from authored reusable tile layouts');
assert.ok(!gameMap.includes('source_texture.get_image()') && !gameMap.includes('atlas.create_tile('), 'Runtime must not slice the painted world PNG into one-off atlas cells');
for(const name of ['an_khe','truc_am','thach_can','co_tinh']) {
  const terrainPng=path.join(root,'assets/pixel/terrain/'+name+'_terrain.png');
  const terrainTres=path.join(root,'assets/pixel/terrain/'+name+'_terrain.tres');
  const propsPng=path.join(root,'assets/pixel/props/'+name+'_props.png');
  const propsTres=path.join(root,'assets/pixel/props/'+name+'_props.tres');
  for(const asset of [terrainPng, terrainTres, propsPng, propsTres]) assert.ok(fs.existsSync(asset), 'Missing map atlas resource: '+asset);
  for(const pngPath of [terrainPng, propsPng]) {
    const png=fs.readFileSync(pngPath);
    const expectedSize = pngPath === propsPng ? 1024 : 256;
    assert.equal(png.readUInt32BE(16),expectedSize,'Map atlas has wrong size in wide: '+pngPath);
    assert.equal(png.readUInt32BE(20),expectedSize,'Map atlas has wrong size in tall: '+pngPath);
    assert.ok(png.length>10000,'Map atlas looks suspiciously reduced/truncated: '+pngPath);
  }
  for(const tresPath of [terrainTres, propsTres]) {
    const tres=fs.readFileSync(tresPath,'utf8');
    assert.equal((tres.match(/\/0 = 0/g)||[]).length,64,'TileSet must expose 64 atlas cells: '+tresPath);
  }
  const layout=layoutByMapId.get('m_'+name);
  assert.equal(layout.props_cell_px,128, 'Props must retain 128 px source detail');
  assert.equal(layout.atlas_columns,8,'Terrain atlas must use 8 columns: '+name);
  assert.ok(layout.tile_set && Array.isArray(layout.ground_rows), 'Missing authored map layout data: '+name);
  assert.ok(layout.props_atlas && Array.isArray(layout.props) && layout.props.length>=7, 'Map needs a substantial props layer: '+name);
  if(name==='an_khe') {
    const symbols='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
    const tileAt=(x,y)=>symbols.indexOf(layout.ground_rows[y][x]);
    assert.ok(tileAt(24,18)>=24 && tileAt(24,18)<32, 'An Khê spawn must be a stone plaza, not painted water');
    for(const ripple of mapCatalog.maps[0].water_ripples) {
      const [x,y]=ripple.position_tiles;
      assert.ok(tileAt(x,y)>=32 && tileAt(x,y)<40, 'Stream ripple must align with water terrain');
    }
  }
}
assert.ok(gameMap.includes('_build_props(layout)') && gameMap.includes('MAP_PROP_SCENE'), 'Map decorative props are data-driven and Y-sorted');
const sakura=path.join(root,'assets/pixel/props/an_khe_sakura.png');
const sakuraPng=fs.readFileSync(sakura);
assert.equal(sakuraPng.readUInt32BE(16),128,'Standalone sakura has 128 px width');
assert.equal(sakuraPng.readUInt32BE(20),128,'Standalone sakura has 128 px height');
assert.equal(sakuraPng[25],6,'Standalone sakura must have transparent RGBA pixels');
assert.ok(JSON.parse(read('data/maps/an_khe.json')).props.some(p=>p.name==='ak_prop_sakura' && p.texture_path==='res://assets/pixel/props/an_khe_sakura.png'));
const sonTruBackground=fs.readFileSync(path.join(root,'assets/pixel/enemies/bai_son_tru.png'));
assert.equal(sonTruBackground.readUInt32BE(16),960,'Sơn Trư arena artwork matches the server world width');
assert.equal(sonTruBackground.readUInt32BE(20),540,'Sơn Trư arena artwork matches the server world height');
const sonTruSprite=fs.readFileSync(path.join(root,'assets/pixel/enemies/son_tru.png'));
assert.equal(sonTruSprite.readUInt32BE(16),384,'Sơn Trư sprite atlas has three 128 px cells per row');
assert.equal(sonTruSprite.readUInt32BE(20),256,'Sơn Trư sprite atlas has two rows');
assert.equal(sonTruSprite[25],6,'Sơn Trư body sheet must have transparent pixels');
const sonTruQc=JSON.parse(read('assets/pixel/enemies/son_tru.pipeline-meta.json'));
assert.deepEqual(sonTruQc.edge_touch_frames,[],'Sơn Trư frames must stay inside their cells');
assert.deepEqual(sonTruQc.empty_frames,[],'Every combat pose must contain the creature');
const pve=read('scripts/pve_son_tru_actor.gd'), combatApi=read('scripts/combat_api.gd');
assert.ok(main.includes('_create_son_tru_encounter()') && main.includes('api.match_kind == "pve_son_tru"'), 'Bãi Sơn Trư has a playable encounter entry and renderer');
assert.ok(combatApi.includes('create_son_tru_encounter') && combatApi.includes('rejoin_current_match'), 'PvE uses the shared socket and reconnect adapter');
assert.ok(pve.includes('"windup"') && pve.includes('"charge"') && pve.includes('"recover"'), 'Boar sprite follows authoritative combat states');
const pveServer=fs.readFileSync(path.join(__dirname,'../server/src/pve_son_tru.ts'),'utf8');
assert.ok(pveServer.includes('PVE_SON_TRU') && pveServer.includes('pveSonTruLineClear'), 'PvE AI and line-of-sight are server-side');
assert.ok(read('scripts/main.gd').includes('game_input.handle_event(') && !read('scripts/main.gd').includes('KEY_'), 'Gameplay commands are separate from hardcoded PC keys');
assert.ok(gameMap.includes('_build_interactables()') && gameMap.includes('_build_water_ripples()'), 'Map POIs and water motion are data-driven');
assert.ok(main.includes('func _travel_to_map(map_id: String, arrival_tiles: Array = [])') && main.includes('target_arrival_tiles'), 'Map gates load their configured arrival point');
assert.ok(gameMap.includes('room_lock'), 'Cổ Tỉnh camera locks by room');
assert.ok(read('scripts/ui/world_map_panel.gd').includes('signal map_requested'), 'Route panel emits travel requests');
assert.ok(main.includes('world_map.map_requested.connect(_travel_to_map)'), 'Main connects map travel');
console.log('PASS static map and scene audit: '+scenes+' scenes, '+references+' resource references, terrain collision, walkable POIs, reachable gates, aligned ripples, real PNG assets.');
console.log('Not a GDScript parser or Godot runtime test. Run presentation_smoke.gd in Godot.');
