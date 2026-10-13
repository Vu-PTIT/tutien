const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {setup, A, rejectsCode} = require('./helpers/assets.cjs');
const now = 1800000000000;
function clock(s, time = now) { s.scope.testNow = time; vm.runInContext('Date.now=function(){return testNow;}', s.scope); }
const table = (s, name) => s.sql.get(name);
const row = (s, name, match) => table(s, name).find(r => Object.entries(match).every(([k, v]) => r[k] === v));
function mine(s, siteId, cycles, op) {
  const p = s.rpc('life_get').sites.find(p => p.id === siteId), id = {collection: 'world_sessions', key: 'main', userId: A};
  s.nk.storageWrite([{...id, value: {mapId: p.mapId, x: p.x, y: p.y, seq: 1, updatedAt: s.scope.testNow},
    version: s.rows.get(`${A}/world_sessions/main`)?.version || '*', permissionRead: 0, permissionWrite: 0}]);
  const v = s.rpc('activity_start', {operationId: op, siteId, controlMode: 'autonomous', cycles}).session;
  clock(s, v.expectedEndAt);
  return s.rpc('activity_claim', {operationId: op + '_claim', sessionId: v.sessionId, stateVersion: v.stateVersion});
}

test('boot creates the game_* tables and seeds every item, crop, loot row and recipe', () => {
  const s = setup();
  assert.deepEqual([...s.sql.keys()].sort(), ['game_crops', 'game_items', 'game_loot', 'game_recipe_ingredients', 'game_recipes']);
  assert.equal(table(s, 'game_items').length, 40);assert.equal(table(s, 'game_crops').length, 3);
  assert.equal(new Set(table(s, 'game_loot').map(r => r.table_id)).size, 6);assert.equal(table(s, 'game_recipes').length, 5);
  const v = s.rpc('inventory_get');assert.equal(v.catalog.length, 40);assert.match(v.catalogRevision, /^[0-9a-f]{16}$/);
  assert.deepEqual(v.catalog.find(i => i.id === 'it_heal_pill'), {id: 'it_heal_pill', name: 'Hồi Nguyên Hoàn', rarity: 'thuong', stackMax: 99, instance: false, bound: false, healAmount: 40});
  assert.equal(v.catalog.find(i => i.id === 'it_iron_sword').attackBonus, 5);
  assert.equal(s.scope.gameContent().sell.it_fish_carp, 3);assert.equal(s.scope.gameContent().buy.it_bait, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(s.scope.gameContent().absorb.it_vein_crystal)), {vi: 'thach', motes: 4, turbid: 0});
});
test('re-running the migration keeps database edits and only adds missing seed rows', () => {
  const s = setup();
  row(s, 'game_items', {id: 'it_fish_carp'}).sell_price = 9;
  const removed = table(s, 'game_items').findIndex(r => r.id === 'it_lake_weed');table(s, 'game_items').splice(removed, 1);
  s.scope.contentMigrate(s.nk);
  assert.equal(row(s, 'game_items', {id: 'it_fish_carp'}).sell_price, 9);
  assert.ok(row(s, 'game_items', {id: 'it_lake_weed'}), 'missing seed row is restored');
  assert.equal(table(s, 'game_items').length, 40);
});
test('edited prices, names and new items reach the RPCs after a reload', () => {
  const s = setup();
  row(s, 'game_items', {id: 'it_fish_carp'}).name = 'Cá chép vàng';
  table(s, 'game_items').push({id: 'it_lotus_seed', name: 'Hạt sen', rarity: 'thuong', stack_max: 99, instance: false, bound: false,
    equip_slot: null, attack_bonus: null, defense_bonus: null, heal_amount: null, buy_price: 2, sell_price: null,
    absorb_vi: null, absorb_motes: null, sort_order: 99});
  s.reloadContent();
  const v = s.rpc('inventory_get');
  assert.equal(v.catalog.find(i => i.id === 'it_fish_carp').name, 'Cá chép vàng');
  assert.equal(v.catalog.at(-1).id, 'it_lotus_seed');assert.equal(s.scope.gameContent().buy.it_lotus_seed, 2);
});
test('loot weights are relative and edited tables change what a site yields', () => {
  const s = setup();clock(s);s.rpc('world_get', {preferredMapId: 'm_lang_que'});
  s.rpc('life_claim_starter', {operationId: 'life_starter_0001'});
  const pit = table(s, 'game_loot').filter(r => r.table_id === 'mining:m_mo_lo_thien');
  for (const r of pit) r.weight = r.item_id === 'it_glowstone' ? 7 : 0;
  s.sql.set('game_loot', table(s, 'game_loot').filter(r => r.weight > 0));s.reloadContent();
  const r = mine(s, 'ml_iron_01', 3, 'edited_pit_0001');
  assert.deepEqual(r.granted.items.filter(i => i.itemId !== 'it_bait'), [{itemId: 'it_glowstone', quantity: 3}]);
});
test('an invalid database edit is rejected whole and the last valid content keeps serving', () => {
  const s = setup(), before = s.scope.gameContent().revision;
  table(s, 'game_loot').push({table_id: 'mining:m_mo_lo_thien', item_id: 'it_missing', weight: 5, quantity: 1, sort_order: 9});
  row(s, 'game_items', {id: 'it_fish_carp'}).sell_price = 50;
  s.reloadContent();
  assert.equal(s.scope.contentEnsure(s.nk).revision, before);assert.equal(s.scope.gameContent().sell.it_fish_carp, 3);
  for (const bad of [{stack_max: 0}, {rarity: 'epic'}, {absorb_vi: 'lua', absorb_motes: 1}, {equip_slot: 'ring'}]) {
    const fresh = setup();Object.assign(row(fresh, 'game_items', {id: 'it_glowstone'}), bad);
    vm.runInContext('GAME_CONTENT = null;', fresh.scope);
    rejectsCode(() => fresh.rpc('inventory_get'), 14);
  }
});
test('removing a crop row makes planting it fail cleanly', () => {
  const s = setup();clock(s);s.rpc('world_get', {preferredMapId: 'm_lang_que'});
  s.sql.set('game_crops', table(s, 'game_crops').filter(r => r.id !== 'crop_ich_khi'));s.reloadContent();
  rejectsCode(() => s.rpc('activity_start', {operationId: 'plant_removed_01', siteId: 'new_plot_01', cropId: 'crop_ich_khi'}), 3);
  assert.equal(s.rpc('life_get').crops.crop_ich_khi, undefined);
});
