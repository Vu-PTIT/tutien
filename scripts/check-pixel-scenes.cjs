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
const theme=read('themes/tutien_theme.tres');
const validSfnt=font=>['00010000','4f54544f','74727565','74797031'].includes(font.subarray(0,4).toString('hex'));
const uiFont=fs.readFileSync(path.join(root,'assets/fonts/BeVietnamPro-Regular.ttf'));
const uiFontSemibold=fs.readFileSync(path.join(root,'assets/fonts/BeVietnamPro-SemiBold.ttf'));
assert.ok(validSfnt(uiFont)&&validSfnt(uiFontSemibold),
  'Shared Vietnamese UI fonts must be valid TrueType/OpenType SFNT files');
assert.ok(theme.includes('res://assets/fonts/BeVietnamPro-Regular.ttf') &&
  theme.includes('res://assets/fonts/BeVietnamPro-SemiBold.ttf'),
  'Shared theme must use the bundled Be Vietnam Pro family');
for(const token of ['UIHeading','UIBody','UISmall','UIMicro','UIButtonSmall','UIChatLogMobile']) {
  assert.ok(theme.includes(token+'/base_type'), 'Shared theme defines typography token '+token);
}
assert.ok(hud.includes('theme_type_variation = &"UISmall"') &&
  hud.includes('theme_type_variation = &"UIButtonSmall"') &&
  read('scenes/ui/character.tscn').includes('theme_type_variation = &"UIHeading"'),
  'Remaining HUD and character labels must use centralized typography tokens');
const typographyFiles=[
  'scenes/ui/character.tscn','scenes/ui/inventory.tscn','scenes/ui/touch_controls.tscn',
  'scenes/an_khe.tscn','scenes/map_interactable.tscn','scenes/ui/hud.tscn',
  'scripts/ui/character_panel.gd','scripts/ui/hud.gd','scripts/game_map.gd'
];
for(const file of typographyFiles) {
  const source=read(file);
  assert.ok(!source.includes('theme_override_font_sizes/font_size') &&
    !source.includes('add_theme_font_size_override'),
    file+': font sizes must come from named shared theme tokens');
}
assert.ok(!/^@tool/m.test(main), 'Runtime must not run in editor');
assert.ok(!main.includes('_draw_editor_ui_preview'), 'No alternate/fake editor HUD');
assert.equal((read('scenes/ui/inventory.tscn').match(/name="Slot\d+" type="Button"/g)||[]).length,24);
assert.equal((hud.match(/name="Slot\d+" type="Button"/g)||[]).length,6);
for(const node of ['MapButton','WorldMap','LocalMap','Minimap','Location','FieldInfo','InteractionHint']) {
  assert.ok(!hud.includes(`name="${node}"`), 'Legacy map UI node was removed: '+node);
}
assert.ok(!read('scripts/ui/hud.gd').includes('configure_map') && !read('scripts/ui/hud.gd').includes('set_interaction_prompt'),
  'Legacy map rendering and guidance were removed from the HUD code');
assert.ok(read('scripts/map_catalog.gd').includes('maps_by_id'), 'Map runtime data loads independently of presentation');
const socialScene=read('scenes/ui/social_panel.tscn'), socialScript=read('scripts/ui/social_panel.gd');
assert.ok(hud.includes('name="SocialButton" type="Button"') && hud.includes('res://scenes/ui/social_panel.tscn'),
  'HUD has a visible entry point for player social features');
assert.ok(['FriendsPage','ChatPage','GroupsPage','GroupMembers','GroupRequests'].every(name=>socialScene.includes('name="'+name+'"')),
  'Social panel includes friends, chat, sect/guild, member and join-request views');
assert.ok(['social_find_player','list_friends','api.send_chat','api.chat_history','social_groups','social_group_create','social_group_action','social_group_members']
  .every(api=>socialScript.includes(api)), 'Social UI uses the existing authenticated social API');
assert.ok(main.includes('social_panel.set_api(api)') && main.includes('social_panel.on_backend_ready()'),
  'Social UI shares the game account and refreshes after connection');
assert.ok(read('scripts/game_input.gd').includes('"social": [KEY_G]'), 'Social panel can open with G');
const mapCatalog=JSON.parse(fs.readFileSync(path.join(root,'data/map_catalog.json'),'utf8'));
const lucVi=mapCatalog.maps.flatMap(m=>m.interactables||[]).find(x=>x.entity_id==='ak.npc.luc_vi');
assert.ok(lucVi && lucVi.npc_texture==='res://assets/pixel/npcs/luc_vi.png','Lục Vi is configured with the generated pixel sprite');
const lucViPng=fs.readFileSync(path.join(root,'assets/pixel/npcs/luc_vi.png'));
assert.equal(lucViPng.readUInt32BE(16),128,'Lục Vi sprite has 128 px width');
assert.equal(lucViPng.readUInt32BE(20),128,'Lục Vi sprite has 128 px height');
assert.equal(lucViPng[25],6,'Lục Vi sprite has a transparent RGBA background');
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
const routeConnections=mapCatalog.route_connections||[];
assert.equal(routeConnections.length,3,'The four-map chapter route has three named connections');
const routeConnectionIds=new Set(),routeGateIds=new Set(),routeNeighbors=new Map(mapCatalog.maps.map(m=>[m.id,new Set()]));
const gateById=(mapId,gateId)=>mapCatalog.maps.find(m=>m.id===mapId)?.interactables.find(p=>p.entity_id===gateId);
for(const connection of routeConnections) {
  assert.ok(connection.id&&!routeConnectionIds.has(connection.id),'Route connection ids are unique');
  routeConnectionIds.add(connection.id);
  assert.ok(connection.label,'Each route connection has a visible label: '+connection.id);
  const from=gateById(connection.from_map_id,connection.from_gate_id);
  const to=gateById(connection.to_map_id,connection.to_gate_id);
  assert.ok(from&&to,'Connection endpoints exist: '+connection.id);
  assert.equal(from.action_kind,'gate','Connection source is an interactive gate: '+connection.id);
  assert.equal(to.action_kind,'gate','Connection destination is an interactive gate: '+connection.id);
  assert.equal(from.connection_id,connection.id,'Source gate declares its connection: '+connection.id);
  assert.equal(to.connection_id,connection.id,'Return gate declares the same connection: '+connection.id);
  assert.equal(from.counterpart_gate_id,to.entity_id,'Source points to its reciprocal gate: '+connection.id);
  assert.equal(to.counterpart_gate_id,from.entity_id,'Return gate points back to its source: '+connection.id);
  assert.equal(from.target_map_id,connection.to_map_id,'Source gate targets the paired map: '+connection.id);
  assert.equal(to.target_map_id,connection.from_map_id,'Return gate targets the paired map: '+connection.id);
  const nearGate=(arrival,gate)=>Math.hypot(arrival[0]-gate.position_tiles[0],arrival[1]-gate.position_tiles[1]);
  assert.ok(nearGate(from.target_arrival_tiles,to)<=3.2,'Source arrival lands near the reciprocal exit: '+connection.id);
  assert.ok(nearGate(to.target_arrival_tiles,from)<=3.2,'Return arrival lands near the source exit: '+connection.id);
  assert.ok(!routeGateIds.has(from.entity_id)&&!routeGateIds.has(to.entity_id),'A gate belongs to only one route: '+connection.id);
  routeGateIds.add(from.entity_id);routeGateIds.add(to.entity_id);
  routeNeighbors.get(connection.from_map_id).add(connection.to_map_id);
  routeNeighbors.get(connection.to_map_id).add(connection.from_map_id);
}
for(const map of mapCatalog.maps) for(const gate of map.interactables.filter(p=>p.action_kind==='gate')) {
  assert.ok(routeGateIds.has(gate.entity_id),'Every map gate belongs to a named reciprocal route: '+gate.entity_id);
}
for(let i=0;i<mapCatalog.maps.length-1;i++) {
  assert.ok(routeConnections.some(c=>(c.from_map_id===mapCatalog.maps[i].id&&c.to_map_id===mapCatalog.maps[i+1].id)
    ||(c.to_map_id===mapCatalog.maps[i].id&&c.from_map_id===mapCatalog.maps[i+1].id)),
    'Adjacent route cards have a gate connection');
}
const connectedMaps=new Set([mapCatalog.maps[0].id]),connectionQueue=[mapCatalog.maps[0].id];
for(let i=0;i<connectionQueue.length;i++) for(const neighbor of routeNeighbors.get(connectionQueue[i])) {
  if(!connectedMaps.has(neighbor)){connectedMaps.add(neighbor);connectionQueue.push(neighbor);}
}
assert.equal(connectedMaps.size,mapCatalog.maps.length,'The route graph connects every map');
const reachableByMapId=new Map();
const expectedPropTiles={
  m_truc_am:{ta_prop_entry_bridge:40}
};
const generatedMapProps={
  ak_prop_north_gate:'res://assets/pixel/props/generated/an_khe_north_gate/processed/clean.png',
  ak_prop_herbalist:'res://assets/pixel/props/generated/an_khe_herbalist_hut/processed/clean.png',
  ak_prop_guest_house:'res://assets/pixel/props/generated/an_khe_guest_house/processed/clean.png',
  ak_prop_village_board:'res://assets/pixel/props/generated/an_khe_notice_board/processed/clean.png',
  ak_prop_market_stall:'res://assets/pixel/props/generated/an_khe_market_stall/processed/clean.png',
  ak_prop_blacksmith:'res://assets/pixel/props/an_khe_blacksmith.png',
  tc_prop_mine_entrance:'res://assets/pixel/props/thach_can_mine_entrance.png',
  tc_prop_flow_pillar:'res://assets/pixel/props/thach_can_flow_pillar.png',
  tc_prop_ore_vein:'res://assets/pixel/props/thach_can_ore_vein.png',
  tc_prop_mine_support:'res://assets/pixel/props/thach_can_mine_support.png',
  tc_prop_rest_cart:'res://assets/pixel/props/thach_can_rest_cart.png',
  tc_prop_deep_crystal:'res://assets/pixel/props/thach_can_deep_crystal.png'
};
const trucAm=mapCatalog.maps.find(m=>m.id==='m_truc_am');
const boarSign=trucAm.interactables.find(p=>p.entity_id==='ta.trail.boar_sign');
assert.equal(boarSign.action_kind,'inspect','Sơn Trư tracks are map scenery, not a separate encounter entrance');
assert.deepEqual(boarSign.position_tiles,[33,17],'The trail sign stays clear of the field spawn points');
for(const map of mapCatalog.maps) {
  const layout=layoutByMapId.get(map.id);
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
  const actorFootprintWalkable=(x,y)=>walkable(x-1,y-1)&&walkable(x,y-1)&&walkable(x-1,y)&&walkable(x,y);
  assert.ok(walkable(spawnX,spawnY),'Map spawn is walkable over its authored terrain: '+map.id);
  assert.ok(actorFootprintWalkable(spawnX,spawnY),'Map spawn has clearance for the player collider: '+map.id);
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
      const targetSolidTileIds=new Set(targetLayout.solid_tile_ids||[]);
      const targetWalkable=(tx,ty)=>tx>=0&&tx<target.size_tiles[0]&&ty>=0&&ty<target.size_tiles[1]
        && !target.solid_rects_tiles.some(rect=>inRect(tx,ty,rect))
        && (!targetSolidTileIds.has(tileSymbols.indexOf(targetLayout.ground_rows[ty][tx]))
          || (targetLayout.collision_walkable_rects_tiles||[]).some(rect=>inRect(tx,ty,rect)));
      assert.ok(targetWalkable(ax,ay), 'Gate arrival is blocked: '+poi.entity_id);
      assert.ok([[ax-1,ay-1],[ax,ay-1],[ax-1,ay],[ax,ay]].every(([x,y])=>targetWalkable(x,y)),
        'Gate arrival has clearance for the player collider: '+poi.entity_id);
      assert.ok(target.areas.some(area=>{const [sx,sy,w,h]=area.rect_tiles;return ax>=sx&&ax<sx+w&&ay>=sy&&ay<sy+h;}), 'Gate arrival is outside named destination areas: '+poi.entity_id);
    }
  }
  const fieldIds=new Set();
  for(const mob of map.field_spawns||[]) {
    assert.ok(mob.spawn_id&&!fieldIds.has(mob.spawn_id),'Field spawn IDs are unique on '+map.id);
    fieldIds.add(mob.spawn_id);
    assert.ok(['en_boar','en_spider'].includes(mob.enemy_id),'Field spawn uses a known monster: '+mob.spawn_id);
    const [x,y]=mob.position_tiles;
    assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<map.size_tiles[0]&&y>=0&&y<map.size_tiles[1],
      'Field spawn is inside its map: '+mob.spawn_id);
    assert.ok(walkable(Math.floor(x),Math.floor(y))&&reachable.has(`${Math.floor(x)},${Math.floor(y)}`),
      'Field spawn is on reachable walkable terrain: '+mob.spawn_id);
    assert.ok(Number.isInteger(mob.max_hp)&&mob.max_hp>0,'Field spawn has a valid health value: '+mob.spawn_id);
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
const projectSettings=read('project.godot');
assert.ok(projectSettings.includes('window/stretch/scale_mode="fractional"'),
  'Windowed game must stretch cleanly at non-integer resolutions');
assert.ok(projectSettings.includes('window/size/mode=0') &&
  projectSettings.includes('window/size/window_width_override=1280') &&
  projectSettings.includes('window/size/window_height_override=720'),
  'PC game must start in a 1280x720 window');
assert.ok(read('scripts/ui/character_panel.gd').includes('var fullscreen_enabled: bool = false') &&
  read('scripts/ui/character_panel.gd').includes('\tfullscreen_enabled = false'),
  'Character settings must not force fullscreen on startup');
assert.ok(read('project.godot').includes('window/size/viewport_width=640'));
assert.ok(read('scripts/inventory_panel.gd').includes('"operationId": "starter_claim_v1"'));
assert.ok(read('scripts/inventory_panel.gd').includes('inventory.clear()'));
for(const name of ['an_khe','cultivator','icons']) {
  const png=fs.readFileSync(path.join(root,'assets/pixel/'+name+'.png'));
  assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.ok(png.readUInt32BE(16)>0 && png.readUInt32BE(20)>0);
  if(['cultivator','icons'].includes(name)) assert.ok([3,6].includes(png[25]),'Expected transparent PNG atlas: '+name);
}
const mapWorldScene=read('scenes/map_world.tscn'), gameMap=read('scripts/game_map.gd');
assert.ok(mapWorldScene.includes('name="Background" type="Sprite2D"'), 'Map scene retains its hidden background placeholder');
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
  const terrainTresText=fs.readFileSync(terrainTres,'utf8');
  assert.ok(terrainTresText.includes('res://assets/pixel/terrain/'+name+'_terrain.png'),
    'Runtime TileSet keeps its authored terrain cells: '+name);
  const layout=layoutByMapId.get('m_'+name);
  assert.equal(layout.props_cell_px,128, 'Props must retain 128 px source detail');
  assert.equal(layout.atlas_columns,8,'Terrain atlas must use 8 columns: '+name);
  assert.ok(layout.tile_set && Array.isArray(layout.ground_rows), 'Missing authored map layout data: '+name);
  const expectedPropCount={an_khe:7,truc_am:4,thach_can:9,co_tinh:2}[name];
  assert.ok(layout.props_atlas && Array.isArray(layout.props) && layout.props.length===expectedPropCount, 'Map prop count matches its authored layout: '+name);
  for(const prop of layout.props) {
    if(prop.texture_path) {
      const assetPath=path.join(root,prop.texture_path.replace('res://',''));
      assert.ok(fs.existsSync(assetPath),'Missing standalone prop texture: '+prop.name);
      const png=fs.readFileSync(assetPath);
      const expectedSourcePx=prop.art_role==='small_environmental_detail'?96:128;
      assert.equal(png.readUInt32BE(16),expectedSourcePx,'Standalone map prop width: '+prop.name);
      assert.equal(png.readUInt32BE(20),expectedSourcePx,'Standalone map prop height: '+prop.name);
      assert.equal(png[25],6,'Standalone map prop must have RGBA transparency: '+prop.name);
      if(prop.art_role==='small_environmental_detail') {
        const [x,y]=prop.position_tiles;
        assert.ok(x>=0&&x<48&&y>=0&&y<35,'Small detail prop sits inside its map: '+prop.name);
        assert.ok(Array.isArray(prop.scale_tiles)&&prop.scale_tiles.every(value=>value>0&&value<=0.5),
          'Small detail prop uses a restrained world scale: '+prop.name);
        const anchorX=Math.floor(x+0.5),anchorY=Math.floor(y+1.0);
        const anchorTile=tileSymbols.indexOf(layout.ground_rows[anchorY][anchorX]);
        assert.ok(!(layout.solid_tile_ids||[]).includes(anchorTile),
          'Small detail prop anchor sits on walkable terrain: '+prop.name);
        assert.ok(!(layout.solid_rects_tiles||[]).some(rect=>inRect(anchorX,anchorY,rect)),
          'Small detail prop anchor clears authored blockers: '+prop.name);
      }
    } else {
      assert.ok(Number.isInteger(prop.tile)&&prop.tile>=0&&prop.tile<64,'Atlas prop must reference a valid cell: '+prop.name);
    }
  }
  if(name==='thach_can') {
    assert.ok(layout.props.every(prop=>Boolean(prop.texture_path)),'Thạch Cạn map props must not carry atlas ground squares');
    assert.ok(!layout.props.some(prop=>prop.name==='tc_prop_outer_cliff'),'Tile terrain supplies the cliff edge without a backdrop square');
    assert.ok(layout.ground_rows.every(row=>[...row].every(symbol=>tileSymbols.indexOf(symbol)<48)),
      'Thạch Cạn ground layer must not place object cells from the terrain atlas');
  }
  for(const [propName,tileIndex] of Object.entries(expectedPropTiles['m_'+name]||{})) {
    const prop=layout.props.find(candidate=>candidate.name===propName);
    assert.ok(prop,'Expected named landmark prop: '+propName);
    assert.equal(prop.tile,tileIndex,'Landmark prop must use the reviewed matching atlas cell: '+propName);
  }
  for(const [propName,texturePath] of Object.entries(generatedMapProps)) {
    const prop=layout.props.find(candidate=>candidate.name===propName);
    if(!prop) continue;
    assert.equal(prop.texture_path,texturePath,'Landmark must use its generated transparent cutout: '+propName);
    const generatedPrompts={
      ak_prop_north_gate:'assets/pixel/props/generated/an_khe_north_gate/prompt.txt',
      ak_prop_herbalist:'assets/pixel/props/generated/an_khe_herbalist_hut/prompt.txt',
      ak_prop_guest_house:'assets/pixel/props/generated/an_khe_guest_house/prompt.txt',
      ak_prop_village_board:'assets/pixel/props/generated/an_khe_notice_board/prompt.txt',
      ak_prop_market_stall:'assets/pixel/props/generated/an_khe_market_stall/prompt.txt'
    };
    const promptPath=path.join(root,generatedPrompts[propName]||texturePath.replace('res://','').replace('.png','.prompt.txt'));
    assert.ok(fs.existsSync(promptPath),'Generated prop keeps its prompt provenance: '+propName);
  }
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
const anKheLayout=JSON.parse(read('data/maps/an_khe.json'));
assert.ok(fs.existsSync(path.join(root,'assets/pixel/terrain/an_khe_meadow_base.png')),
  'Generated meadow foundation remains available as source art');
assert.ok(fs.existsSync(path.join(root,'assets/pixel/terrain/an_khe_meadow_base.prompt.txt')),
  'Meadow foundation keeps its original prompt provenance');
const transitionAtlas=fs.readFileSync(path.join(root,'assets/pixel/terrain/terrain_transition_decals.png'));
assert.equal(transitionAtlas.readUInt32BE(16),384,'Legacy terrain transition atlas has twelve 32 px columns');
assert.equal(transitionAtlas.readUInt32BE(20),256,'Legacy terrain transition atlas has eight 32 px rows');
assert.equal(transitionAtlas[25],6,'Legacy terrain transition decals preserve transparent RGBA areas');
const pixelTransitionAtlas=fs.readFileSync(path.join(root,'assets/pixel/terrain/terrain_transition_decals_pixel_v1.png'));
assert.equal(pixelTransitionAtlas.readUInt32BE(16),384,'Pixel terrain transition atlas has twelve 32 px columns');
assert.equal(pixelTransitionAtlas.readUInt32BE(20),256,'Pixel terrain transition atlas has eight 32 px rows');
assert.equal(pixelTransitionAtlas[25],6,'Pixel terrain transition decals preserve transparent RGBA areas');
assert.ok(fs.existsSync(path.join(root,'assets/pixel/terrain/terrain_transitions_source.png')),
  'Generated high-resolution transition sheet remains available alongside its runtime atlas');
assert.ok(fs.existsSync(path.join(root,'assets/pixel/terrain/terrain_transitions.prompt.txt')),
  'Generated transition atlas keeps its prompt provenance');
assert.ok(fs.existsSync(path.join(root,'assets/pixel/terrain/terrain_transitions_source.prompt.txt')),
  'Generated source sheet keeps its prompt provenance');
assert.ok(fs.existsSync(path.join(root,'assets/pixel/terrain/terrain_river_shore_source.png')),
  'A continuous generated river-shore source supplies a consistent land-to-water transition');
assert.ok(fs.existsSync(path.join(root,'assets/pixel/terrain/terrain_river_shore_source.prompt.txt')),
  'Generated river-shore source keeps its prompt provenance');
const riverOverlay=fs.readFileSync(path.join(root,'assets/pixel/terrain/an_khe_river_shore_overlay.png'));
assert.equal(riverOverlay.readUInt32BE(16),1536,'An Khê river shore overlay spans the full map width');
assert.equal(riverOverlay.readUInt32BE(20),1152,'An Khê river shore overlay spans the full map height');
assert.equal(riverOverlay[25],6,'An Khê river shore overlay keeps transparent pixels outside the shoreline ribbon');
assert.ok(fs.existsSync(path.join(root,'assets/pixel/terrain/an_khe_river_shore_overlay.prompt.txt')),
  'Continuous river-shore overlay records its generated source and build procedure');
assert.equal(anKheLayout.river_autoterrain.shore_overlay_texture,undefined,
  'An Khê uses tile-level shoreline transitions instead of the old full-map overlay');
assert.equal(anKheLayout.river_autoterrain.shore_overlay_width_px,undefined,
  'An Khê shoreline width is now encoded by tile transitions');
assert.ok(fs.existsSync(path.join(root,'..','scripts/build_terrain_transition_atlas.py')),
  'Generated transition atlas can be rebuilt from the preserved source sheet');
assert.ok(fs.existsSync(path.join(root,'..','scripts/build_terrain_transition_decals.py')),
  'Transparent transition decals can be rebuilt from the generated tile atlas');
assert.ok(fs.existsSync(path.join(root,'..','scripts/build_an_khe_river_shore_overlay.py')),
  'Continuous river shore can be rebuilt along its authored curve');
const expectedSurfaceIds={an_khe:Array.from({length:16},(_,index)=>index),truc_am:[0,1,8,9],thach_can:[0,1,2,3,4,5,6],co_tinh:[0,1,2,3,4,5]};
for(const area of Object.keys(expectedSurfaceIds)) {
  const layout=JSON.parse(read(`data/maps/${area}.json`));
  assert.equal(layout.ground_surface_atlas,`res://assets/pixel/terrain/generated/world_surfaces_v3/${area}/surface_atlas.png`,`${area} points at its map-wide pixel surface`);
  assert.equal(layout.ground_surface_tile_px,32,`${area} ground surface keeps the 32 px world grid`);
  assert.equal(layout.ground_surface_columns,48,`${area} surface has one unique tile for every map column`);
  assert.equal(layout.ground_surface_rows,36,`${area} surface has one unique tile for every map row`);
  assert.deepEqual(layout.ground_surface_terrain_ids,expectedSurfaceIds[area],`${area} replaces only its base-ground material IDs`);
  const atlasPath=path.join(root,`assets/pixel/terrain/generated/world_surfaces_v3/${area}/surface_atlas.png`);
  const atlas=fs.readFileSync(atlasPath);
  assert.equal(atlas.readUInt32BE(16),1536,`${area} surface spans the 48 tile map width`);
  assert.equal(atlas.readUInt32BE(20),1152,`${area} surface spans the 36 tile map height`);
  assert.ok(fs.existsSync(path.join(root,`assets/pixel/terrain/generated/world_surfaces_v3/${area}/surface_atlas-meta.json`)),`${area} surface keeps palette/build metadata`);
}
assert.ok(fs.existsSync(path.join(root,'..','scripts/build_pixel_world_terrain.py')),
  'All biome surfaces can be regenerated from the authored pixel-cluster builder');
const expectedTransitionConfig={
  path_edge_tiles:{west:[0,1,2,3],east:[4,5,6,7],north:[8,9,10,11],south:[12,13,14,15]},
  path_corner_tiles:{north_west:[16,17,18,19],north_east:[20,21,22,23],south_west:[24,25,26,27],south_east:[28,29,30,31]},
  shore_land_edge_tiles:{east:[32,33,34,35],west:[36,37,38,39],south:[40,41,42,43],north:[44,45,46,47]},
  shore_land_corner_tiles:{north_east:[48,49,50,51],south_east:[52,53,54,55],south_west:[56,57,58,59],north_west:[60,61,62,63]},
  shore_water_edge_tiles:{west:[64,65,66,67],east:[68,69,70,71],north:[72,73,74,75],south:[76,77,78,79]},
  shore_water_corner_tiles:{north_west:[80,81,82,83],north_east:[84,85,86,87],south_west:[88,89,90,91],south_east:[92,93,94,95]}
};
const pixelTransitionPath='res://assets/pixel/terrain/terrain_transition_decals_pixel_v1.png';
for(const [name,layout] of [['An Khê',anKheLayout],['Trúc Âm',JSON.parse(read('data/maps/truc_am.json'))]]) {
  assert.equal(layout.terrain_transitions.atlas,pixelTransitionPath,`${name} uses the crisp pixel transition atlas`);
  assert.equal(layout.terrain_transitions.tile_px,32,`${name} transitions match the 32 px world grid`);
  assert.equal(layout.terrain_transitions.columns,12,`${name} transition atlas has twelve columns`);
  assert.equal(layout.terrain_transitions.rows,8,`${name} transition atlas has eight rows`);
  for(const [group,tiles] of Object.entries(expectedTransitionConfig)) {
    assert.deepEqual(layout.terrain_transitions[group],tiles,`${name} configures ${group}`);
  }
}
const trucAmLayout=JSON.parse(read('data/maps/truc_am.json'));
assert.equal(trucAmLayout.terrain_transitions.atlas,anKheLayout.terrain_transitions.atlas,
  'Forest map uses the shared pixel transition atlas');
const river=anKheLayout.river_autoterrain;
assert.ok(river && river.west_bankline.length>=6,'An Khê river bank follows a long, authored curve');
assert.deepEqual(river.base_water_tiles,[32,34],'River interior mostly uses plain water tiles');
assert.equal(river.bank_tile,39,'River bank keeps its blocking terrain while tile-level shore decals supply the visible transition');
const [bankMin,bankMax]=[river.minimum_bank_x,river.maximum_bank_x];
const sampledBanks=[];
for(let y=0;y<mapCatalog.maps[0].size_tiles[1];y++) {
  const sampleY=y+0.5;
  let previous=river.west_bankline[0];
  let next=river.west_bankline.find(point=>point[1]>=sampleY)||river.west_bankline.at(-1);
  const nextIndex=river.west_bankline.indexOf(next);
  previous=river.west_bankline[Math.max(0,nextIndex-1)];
  const t=Math.max(0,Math.min(1,(sampleY-previous[1])/Math.max(0.001,next[1]-previous[1])));
  const bankX=Math.max(bankMin,Math.min(bankMax,Math.floor(previous[0]+(next[0]-previous[0])*t)));
  sampledBanks.push(bankX);
  assert.ok(bankX>=bankMin&&bankX<=bankMax,'River bank remains inside its authored corridor at row '+y);
  assert.ok(river.last_water_x<mapCatalog.maps[0].size_tiles[0]-1,'Water leaves the map boundary tile intact');
}
assert.ok(Math.max(...sampledBanks)-Math.min(...sampledBanks)>=10,'River turns inland on the southern reach');
assert.ok(sampledBanks.every((x,i)=>i===0||Math.abs(x-sampledBanks[i-1])<=2),'River bank does not jump between rows');
const pathNetwork=anKheLayout.path_autoterrain;
assert.ok(pathNetwork.paths.length>=6,'An Khê paths are authored as a connected village network');
assert.deepEqual(pathNetwork.interior_tiles,[16],'Path interiors use dirt-only tiles without embedded grass islands');
assert.deepEqual(pathNetwork.edge_tiles,[16],'Path edges stay dirt-only and blend through separate detail decals');
assert.ok(pathNetwork.paths.some(path=>path.id==='north_gate_to_plaza')&&pathNetwork.paths.some(path=>path.id==='plaza_to_market_and_river'),
  'Main path links the north gate, village core, and river market');
for(const path of pathNetwork.paths) {
  assert.ok(path.points.length>=2&&path.half_width_tiles>=0.6,'Each path branch has a usable width and centerline: '+path.id);
  for(const [x,y] of path.points) assert.ok(x>=0&&x<48&&y>=0&&y<36,'Path point stays inside An Khê: '+path.id);
}
assert.ok(!mapCatalog.maps[0].solid_rects_tiles.some(([x,y,w,h])=>x===42&&y===1&&w===5&&h===34),
  'River collision comes from its connected water and bank cells');
const interactive=anKheLayout.interactive_objects;
assert.equal(interactive.trees.length,1,'An Khê prototype has one harvestable tree');
assert.equal(interactive.flowers.length,4,'An Khê prototype has four stompable flower clumps');
for(const object of [...interactive.trees,...interactive.flowers]) {
  assert.ok(object.id&&object.position_tiles.length===2,'Interactive map objects have stable ids and tile anchors');
  const [x,y]=object.position_tiles;
  const isTree=interactive.trees.includes(object);
  const cellX=Math.floor(x+0.5),cellY=Math.floor(y+(isTree?1:0.5));
  assert.ok(cellX>=0&&cellX<48&&cellY>=0&&cellY<36,'Interactive object anchor stays inside An Khê: '+object.id);
  assert.ok(reachableByMapId.get('m_an_khe').has(`${cellX},${cellY}`),'Interactive object remains reachable from the village spawn: '+object.id);
}
const treeSheet=fs.readFileSync(path.join(root,'assets/pixel/props/generated/an_khe_interactables/tree/sheet-transparent.png'));
assert.equal(treeSheet.readUInt32BE(16),256,'Interactive tree atlas has two 128 px columns');
assert.equal(treeSheet.readUInt32BE(20),256,'Interactive tree atlas has two 128 px rows');
assert.equal(treeSheet[25],6,'Interactive tree atlas has transparent RGBA pixels');
const treeQc=JSON.parse(read('assets/pixel/props/generated/an_khe_interactables/tree/pipeline-meta.json'));
assert.deepEqual(treeQc.edge_touch_frames,[],'Tree states stay inside their generated cells');
assert.deepEqual(treeQc.empty_frames,[],'Every tree state contains a visible prop');
const livingTreeScales=treeQc.frames.slice(0,3).map(frame=>frame.source_to_output_scale);
assert.ok(Math.max(...livingTreeScales)-Math.min(...livingTreeScales)<0.001,'Upright and leaning tree frames keep one shared scale');
assert.ok(treeQc.frames[3].output_size[1]<treeQc.frames[0].output_size[1]*0.5,'Stump retains its natural small scale');
const flowerSheet=fs.readFileSync(path.join(root,'assets/pixel/props/generated/an_khe_interactables/flowers/sheet-transparent.png'));
assert.equal(flowerSheet.readUInt32BE(16),128,'Flower variant atlas has two 64 px columns');
assert.equal(flowerSheet.readUInt32BE(20),128,'Flower variant atlas has two 64 px rows');
assert.equal(flowerSheet[25],6,'Flower variant atlas has transparent RGBA pixels');
const flowerQc=JSON.parse(read('assets/pixel/props/generated/an_khe_interactables/flowers/pipeline-meta.json'));
assert.deepEqual(flowerQc.empty_frames,[],'Every flower variant has a visible cluster');
assert.ok(fs.existsSync(path.join(root,'assets/pixel/props/generated/an_khe_interactables/tree-states-prompt.txt')));
assert.ok(fs.existsSync(path.join(root,'assets/pixel/props/generated/an_khe_interactables/flower-pack-prompt.txt')));
const resourceTree=read('scripts/map_resource_tree.gd');
const flowerScript=read('scripts/map_flower.gd');
const hudScript=read('scripts/ui/hud.gd');
assert.ok(gameMap.includes('_apply_river_autoterrain')&&gameMap.includes('TRANSFORM_FLIP_H')&&gameMap.includes('_sample_river_bank_x'),
  'River edge art follows a curved west bank from its authored shape');
assert.ok(gameMap.includes('var terrain_cell_alternatives := _apply_river_autoterrain')&&gameMap.includes('bank_alternatives[Vector2i(bank_cell_x, y)] = bank_flip'),
  'Vertical shoreline tiles are flipped toward the water and varied down the bank');
assert.ok(gameMap.includes('_build_terrain_transition_cells')&&gameMap.includes('_ensure_transition_atlas_source'),
  'Grass, dirt, and water edges select generated transition tiles from neighboring cells');
assert.ok(gameMap.includes('transition_cells.keys()')&&gameMap.includes('detail,')&&gameMap.includes('transition_columns'),
  'Generated transition decals overlay the ground while base terrain stays continuous');
assert.ok(gameMap.includes('shore_water_edges')&&gameMap.includes('"shore"')&&gameMap.includes('_choose_transition_variant'),
  'River transitions use seeded tile variants on both the grassy bank and shallow-water edge');
assert.ok(gameMap.includes('_build_river_shore_overlay')&&gameMap.includes('CanvasItem.TEXTURE_FILTER_NEAREST'),
  'A continuous generated river shore renders above ground tiles and below interactive detail layers');
assert.ok(gameMap.includes('bank_fringe_chance = 0'),
  'The single-tile legacy fringe is disabled only when shoreline art actually replaces it');
assert.ok(gameMap.includes('_apply_path_autoterrain')&&gameMap.includes('_distance_to_polyline'),
  'Dirt paths form variable-width connected lanes instead of hand-placed tile strips');
assert.ok(gameMap.includes('\t\t\tvar tile_pool: Array = edge_tiles if nearest_distance > selected_width * 0.62 else interior_tiles'),
  'Each path cell chooses its dirt tile inside the per-cell loop');
assert.ok(gameMap.includes('var enclosed_path_gaps: Array[Vector2i] = []')&&gameMap.includes('if path_neighbor_count >= 3:'),
  'Path junctions fill one-cell grass gaps so the dirt network stays continuous');
assert.ok(!hudScript.includes('configure_map')&&!hudScript.includes('runtime_ground_rows'),
  'The old minimap renderer is absent from the HUD script');
assert.ok(gameMap.includes('_ensure_ground_surface_atlas_source')&&gameMap.includes('surface_terrain_ids.has(terrain_index)'),'Base ground samples a unique map-wide surface tile while paths and props keep their own atlas art');
assert.ok(gameMap.includes('_build_resource_objects(layout)')&&gameMap.includes('try_chop_tree'),'Map loads interactive resource objects from data');
assert.ok(resourceTree.includes('func chop()')&&resourceTree.includes('_finish_felling')&&resourceTree.includes('collision_layer = 0'),
  'Harvestable tree advances through hit states, falls, then releases its blocker');
assert.ok(flowerScript.includes('body_entered.connect')&&flowerScript.includes('func stomp()')&&flowerScript.includes('Tween.TRANS_BACK'),
  'Flower reacts to the player collider with a spring-back animation');
assert.ok(main.includes('try_chop_tree')&&main.includes('facing_direction()'),'World attack action can chop a tree in front of the player');
assert.ok(main.includes('local_resource_states')&&main.includes('next_map.configure(data, int(map_catalog.catalog.get("tile_size_px", 32)), local_resource_states)'),
  'Tree progress persists while changing maps during the current session');
assert.ok(resourceTree.includes('saved_state.get("hit_count", 0)')&&resourceTree.includes('if hit_count >= hits_to_fell'),
  'Resource tree restores a damaged or felled state when its map loads');
assert.ok(read('tests/presentation_smoke.gd').includes('keeps its state after leaving and returning')&&read('tests/presentation_smoke.gd').includes('remains a stump after a map transition'),
  'Runtime smoke covers resource persistence across map reloads');
assert.ok(read('scripts/ui/touch_controls.gd').includes('action_label'),'Touch layout exposes a labeled world action button');
assert.ok(gameMap.includes('_build_props(layout)') && gameMap.includes('MAP_PROP_SCENE'), 'Map decorative props are data-driven and Y-sorted');
const minePack=JSON.parse(read('assets/pixel/props/thach_can_mining_props_pack.json'));
assert.deepEqual(minePack.grid,[2,2],'Thạch Cạn compact props use a 2×2 pack');
assert.deepEqual(minePack.edge_touch,[],'Accepted map props do not touch prop-pack cell edges');
assert.ok(fs.existsSync(path.join(root,minePack.prompt.replace(/^res:\/\//,''))),'Prop pack keeps its generation prompt');
const minePackSource=fs.readFileSync(path.join(root,minePack.source_image.replace(/^res:\/\//,'')));
assert.equal(minePackSource.readUInt32BE(16),1254,'Raw prop pack keeps generated width');
assert.equal(minePackSource.readUInt32BE(20),1254,'Raw prop pack keeps generated height');
for(const prop of minePack.props) {
  assert.ok(fs.existsSync(path.join(root,prop.prompt.replace(/^res:\/\//,''))),'Extracted prop keeps its prompt provenance: '+prop.id);
  const png=fs.readFileSync(path.join(root,prop.asset.replace(/^res:\/\//,'')));
  assert.equal(png.readUInt32BE(16),128,'Extracted map prop width: '+prop.id);
  assert.equal(png.readUInt32BE(20),128,'Extracted map prop height: '+prop.id);
  assert.equal(png[25],6,'Extracted map prop is transparent RGBA: '+prop.id);
}
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
assert.equal(sonTruSprite.readUInt32BE(16),192,'Sơn Trư sprite atlas has three 64 px cells per row');
assert.equal(sonTruSprite.readUInt32BE(20),128,'Sơn Trư sprite atlas has two 64 px rows');
assert.equal(sonTruSprite[25],6,'Sơn Trư body sheet must have transparent pixels');
const sonTruQc=JSON.parse(read('assets/pixel/enemies/son_tru.pipeline-meta.json'));
assert.deepEqual(sonTruQc.edge_touch_frames,[],'Sơn Trư frames must stay inside their cells');
assert.deepEqual(sonTruQc.empty_frames,[],'Every combat pose must contain the creature');
const pveMap=fs.readFileSync(path.join(root,'assets/pixel/maps/bai_son_tru.png'));
assert.equal(pveMap.readUInt32BE(16),1586,'Sơn Trư battle map keeps its generated landscape width');
assert.equal(pveMap.readUInt32BE(20),992,'Sơn Trư battle map keeps its generated landscape height');
const pveSprite=fs.readFileSync(path.join(root,'assets/pixel/enemies/son_tru/clean.png'));
assert.equal(pveSprite.readUInt32BE(16),64,'Runtime boar sprite is a single 64 px frame');
assert.equal(pveSprite.readUInt32BE(20),64,'Runtime boar sprite is a single 64 px frame');
assert.equal(pveSprite[25],6,'Runtime boar sprite has transparent RGBA pixels');
const combatApi=read('scripts/combat_api.gd');
assert.ok(!hud.includes('name="Hunt" type="Button"') && !main.includes('func _create_son_tru()'), 'The client no longer opens a separate solo hunt');
assert.ok(main.includes('api.call_rpc("world_attack"') && main.includes('map_world.update_field_mobs'), 'The client attacks and renders monsters inside the active map');
const worldServer=fs.readFileSync(path.join(__dirname,'../server/src/world.ts'),'utf8');
for(const mob of trucAm.field_spawns) assert.ok(worldServer.includes('id:"'+mob.spawn_id+'"'),'Server owns field spawn '+mob.spawn_id);
assert.ok(worldServer.includes('const worldAttackRpc')&&worldServer.includes('grantReward(nk,userId,"field_"'), 'Map combat validates attacks and uses durable reward receipts');
assert.ok(worldServer.includes('equipmentDropBasisPoints')&&worldServer.includes('equipmentDropped'), 'Map monsters can award server-rolled equipment');
assert.ok(combatApi.includes('create_son_tru') && combatApi.includes('rejoin_current_match'), 'PvE uses the shared socket and mode-aware reconnect adapter');
const pveServer=fs.readFileSync(path.join(__dirname,'../server/src/pve_son_tru.ts'),'utf8');
assert.ok(main.includes('SON_TRU_SPRITE') && main.includes('boar_sprite'), 'Battle renderer uses the transparent generated boar sprite');
assert.ok(pveServer.includes('pveSonTruStepBoar') && pveServer.includes('reward_pending') && pveServer.includes('settlement_saving'), 'PvE AI and durable reward settlement are server-side');
assert.ok(read('scripts/main.gd').includes('game_input.handle_event(') && !read('scripts/main.gd').includes('KEY_'), 'Gameplay commands are separate from hardcoded PC keys');
assert.ok(gameMap.includes('_build_interactables()') && gameMap.includes('_build_water_ripples()'), 'Map POIs and water motion are data-driven');
assert.ok(main.includes('func _travel_to_map(map_id: String, arrival_tiles: Array = [])') && main.includes('target_arrival_tiles'), 'Map gates load their configured arrival point');
assert.ok(gameMap.includes('room_lock'), 'Cổ Tỉnh camera locks by room');
assert.ok(main.includes('MapCatalogScript.new()')&&main.includes('map_catalog.maps_by_id'),
  'Map loading and travel remain independent of removed presentation panels');
assert.ok(!gameMap.includes('LocationLabels')&&!gameMap.includes('_build_location_labels'), 'Old floating map labels were removed');
console.log('PASS static map and scene audit: '+scenes+' scenes, '+references+' resource references, cleared map UI baseline, connected reciprocal routes, walkable POIs, transparent Thạch Cạn props, aligned ripples, valid PNG assets, valid centralized Be Vietnam Pro UI typography.');
console.log('Not a GDScript parser or Godot runtime test. Run presentation_smoke.gd in Godot.');
