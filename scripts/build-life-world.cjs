// Compile the backend map/activity contract into Nakama's ES5 bundle. The
// editable source is independent of client art/layout/runtime files.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {navigation, pointWalkable} = require('./life-navigation.cjs');
const root = path.resolve(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'server/data/life_world.json'), 'utf8'));
const population = JSON.parse(fs.readFileSync(path.join(root, 'server/data/world_population.json'), 'utf8'));
const {maps,sites} = source;
if (source.schema_version !== 1 || !maps || !Array.isArray(sites)) throw Error('Invalid life world contract');
const ids = new Set();
for (const site of sites) {
  if (!maps[site.mapId] || ids.has(site.id) || !Number.isFinite(site.x) || !Number.isFinite(site.y) ||
      !['fishing','gardening','mining','meditation'].includes(site.type) ||
      (site.type === 'meditation') !== ['kim','moc','thuy','hoa','tho','phong'].includes(site.element)) throw Error('Invalid/duplicate activity anchor: '+site.id);
  ids.add(site.id);
}
for (const map of Object.values(maps)) map.navEdges=navigation(map);

// Population: monsters, safe zones and NPCs. Source is in tiles; the server
// works in pixels. Placement rules follow docs/game-design/05-map-layouts.md §4.
const TILE = 32, GATE_CLEAR = 12, SITE_CLEAR = 6, HIT = 16;
const {enemies} = population;
if (population.schema_version !== 1 || !enemies || !population.maps) throw Error('Invalid world population');
const enemyOut = {};
for (const [id, e] of Object.entries(enemies)) {
  if (!/^en_[a-z_]+$/.test(id) || typeof e.name !== 'string' || ![1,2,3,4].includes(e.tier) ||
      !['normal','elite','boss'].includes(e.kind) || !['always','day','night'].includes(e.active) ||
      !Number.isInteger(e.hits) || e.hits < 1 || !Number.isInteger(e.damagePct) || e.damagePct < 1 || e.damagePct > 100 ||
      !Number.isInteger(e.respawnSec) || e.respawnSec < 1 || !Array.isArray(e.essence) || !e.essence.length ||
      !e.essence.every(v => ['kim','moc','thuy','hoa','tho','phong'].includes(v))) throw Error('Invalid enemy: '+id);
  enemyOut[id] = {name: e.name, tier: e.tier, kind: e.kind, active: e.active, essence: e.essence};
}
const arrivals = {};
for (const map of Object.values(maps)) for (const p of map.points) if (p.destination)
  (arrivals[p.destination] = arrivals[p.destination] || []).push([p.arrivalX, p.arrivalY]);
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
let mobTotal = 0, npcTotal = 0;
for (const [mapId, pop] of Object.entries(population.maps)) {
  const map = maps[mapId];
  if (!map || !/^[a-z0-9_]+$/.test(pop.prefix) || !Array.isArray(pop.safeZones) || !Array.isArray(pop.territories) || !Array.isArray(pop.npcs))
    throw Error('Invalid population for map: '+mapId);
  const where = mapId+': ';
  map.safeZones = pop.safeZones.map(z => {
    if (!/^[a-z_]+$/.test(z.id) || !(z.radius > 0) || !pointWalkable(map, z.x*TILE, z.y*TILE)) throw Error(where+'invalid safe zone '+z.id);
    return {id: pop.prefix+'.safe.'+z.id, x: z.x*TILE, y: z.y*TILE, radius: z.radius*TILE};
  });
  const blockers = [[map.spawnX, map.spawnY, GATE_CLEAR*TILE, 'spawn']]
    .concat((arrivals[mapId] || []).map(a => [a[0], a[1], GATE_CLEAR*TILE, 'gate arrival']))
    .concat(sites.filter(s => s.mapId === mapId).map(s => [s.x, s.y, SITE_CLEAR*TILE, 'site '+s.id]))
    .concat(map.safeZones.map(z => [z.x, z.y, z.radius, z.id]));
  const perSpecies = {};
  map.territories = [];
  map.fieldMobs = [];
  pop.territories.forEach((t, index) => {
    const e = enemies[t.enemyId];
    if (!e || !Number.isInteger(t.count) || t.count < 1 || t.count > 10 || !(t.radius > 0)) throw Error(where+'invalid territory #'+index);
    const species = t.enemyId.slice(3);
    perSpecies[species] = (perSpecies[species] || 0) + 1;
    const territoryId = pop.prefix+'.zone.'+species+'.'+String(perSpecies[species]).padStart(2, '0');
    map.territories.push({id: territoryId, enemyId: t.enemyId, x: t.x*TILE, y: t.y*TILE, radius: t.radius*TILE});
    // Members stand on a small ring around the territory centre.
    const ring = Math.min(3, t.radius/3);
    for (let i = 0; i < t.count; i++) {
      const angle = 2*Math.PI*i/t.count + index*0.7;
      const x = Math.round((t.x + (t.count > 1 ? Math.cos(angle)*ring : 0))*TILE);
      const y = Math.round((t.y + (t.count > 1 ? Math.sin(angle)*ring : 0))*TILE);
      const id = territoryId.replace('.zone.', '.mob.')+'.'+(i+1);
      if (!pointWalkable(map, x, y)) throw Error(where+id+' stands on a blocker');
      for (const [bx, by, r, label] of blockers) if (dist(x, y, bx, by) <= r) throw Error(where+id+' is too close to '+label);
      const mob = {id, enemyId: t.enemyId, name: e.name, territoryId, x, y, maxHp: e.hits*HIT, attack: e.damagePct, defense: 0,
        rewardXp: 0, respawnMs: e.respawnSec*1000};
      if (e.rewardItemId) mob.rewardItemId = e.rewardItemId;
      if (e.equipmentDrop) Object.assign(mob, {equipmentDropItemId: e.equipmentDrop.itemId,
        equipmentDropBasisPoints: e.equipmentDrop.basisPoints, equipmentDropPityKills: e.equipmentDrop.pityKills});
      map.fieldMobs.push(mob);
      mobTotal++;
    }
  });
  for (const n of pop.npcs) {
    const id = pop.prefix+'.npc.'+n.id;
    if (!/^[a-z_]+$/.test(n.id) || typeof n.name !== 'string' || typeof n.role !== 'string' || map.points.some(p => p.id === id) ||
        !pointWalkable(map, n.x*TILE, n.y*TILE)) throw Error(where+'invalid NPC '+n.id);
    map.points.push({id, kind: 'npc', x: n.x*TILE, y: n.y*TILE, radius: 1.8, name: n.name, role: n.role});
    npcTotal++;
  }
}

const digest = createHash('sha256').update(JSON.stringify({maps,sites,enemies:enemyOut})).digest('hex').slice(0,16);
// Source JSON stays readable; generated objects are compact and deterministic.
const mapEntries = Object.keys(maps).map(id=>'  '+JSON.stringify(id)+': '+JSON.stringify(maps[id]));
const output = '// Generated by scripts/build-life-world.cjs; edit server/data/life_world.json or world_population.json instead.\n'+
  'const LIFE_WORLD_REVISION = "'+digest+'";\n'+
  'const LIFE_WORLD_MAPS: {[id: string]: WorldMapDefinition} = {\n'+mapEntries.join(',\n')+'\n};\n'+
  'const LIFE_SITES: LifeSite[] = [\n'+sites.map(s=>'  '+JSON.stringify(s)).join(',\n')+'\n];\n'+
  'const WORLD_ENEMIES: {[id: string]: WorldEnemy} = {\n'+Object.keys(enemyOut).map(id=>'  '+JSON.stringify(id)+': '+JSON.stringify(enemyOut[id])).join(',\n')+'\n};\n';
const target = path.join(root, 'server/src/life_world_generated.ts');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target,'utf8')!==output) throw Error('Life world manifest is stale; run node scripts/build-life-world.cjs');
} else fs.writeFileSync(target,output);
console.log('PASS life world manifest: '+Object.keys(maps).length+' maps, '+sites.length+' activity anchors, '+
  Object.keys(enemyOut).length+' enemies, '+mobTotal+' field mobs, '+npcTotal+' NPCs');
