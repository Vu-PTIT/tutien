// Game content lives in dedicated PostgreSQL tables. InitModule creates them and
// inserts any missing seed rows (server/data/game_content.json); edits made in
// the database are kept. Each Nakama VM caches the content and reloads it after
// GAME_CONTENT_TTL_MS, so database edits reach every VM within that window.
interface ItemDefinition {
  id: string; name: string; rarity: string; stackMax: number; instance: boolean; bound: boolean;
  equipSlot?: string; attackBonus?: number; defenseBonus?: number; healAmount?: number;
}
interface CropDefinition {
  seed: string; output: string; durationMs: number; yield: number; glow?: string;
  seedBackPercent: number; glowPercent: number; glowNightPercent: number;
}
interface LifeLootEntry { itemId: string; weight: number; quantity: number; }
interface RecipeDefinition { ingredients: {[itemId: string]: number}; fee: number; output: string; }
interface GameContent {
  revision: string; items: ItemDefinition[]; itemIndex: {[id: string]: ItemDefinition};
  buy: {[itemId: string]: number}; sell: {[itemId: string]: number}; absorb: {[itemId: string]: InnerEssence};
  crops: {[id: string]: CropDefinition}; loot: {[table: string]: LifeLootEntry[]}; recipes: {[id: string]: RecipeDefinition};
}
const GAME_CONTENT_TTL_MS = 30000;
// Column order is the insert order; the first key columns form the primary key.
const GAME_CONTENT_TABLES: {name: string; key: string[]; ddl: string}[] = [
  {name: "game_items", key: ["id"], ddl: "id TEXT PRIMARY KEY, name TEXT NOT NULL, rarity TEXT NOT NULL DEFAULT 'thuong', " +
    "stack_max INTEGER NOT NULL DEFAULT 99, instance BOOLEAN NOT NULL DEFAULT FALSE, bound BOOLEAN NOT NULL DEFAULT FALSE, " +
    "equip_slot TEXT, attack_bonus INTEGER, defense_bonus INTEGER, heal_amount INTEGER, buy_price INTEGER, sell_price INTEGER, " +
    "absorb_vi TEXT, absorb_motes INTEGER, sort_order INTEGER NOT NULL DEFAULT 0"},
  {name: "game_crops", key: ["id"], ddl: "id TEXT PRIMARY KEY, seed_item TEXT NOT NULL, output_item TEXT NOT NULL, glow_item TEXT, " +
    "duration_ms INTEGER NOT NULL, yield_count INTEGER NOT NULL, seed_back_percent INTEGER NOT NULL DEFAULT 0, " +
    "glow_percent INTEGER NOT NULL DEFAULT 0, glow_night_percent INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0"},
  {name: "game_loot", key: ["table_id", "item_id"], ddl: "table_id TEXT NOT NULL, item_id TEXT NOT NULL, weight INTEGER NOT NULL, " +
    "quantity INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (table_id, item_id)"},
  {name: "game_recipes", key: ["id"], ddl: "id TEXT PRIMARY KEY, output_item TEXT NOT NULL, fee INTEGER NOT NULL DEFAULT 0, " +
    "sort_order INTEGER NOT NULL DEFAULT 0"},
  {name: "game_recipe_ingredients", key: ["recipe_id", "item_id"], ddl: "recipe_id TEXT NOT NULL, item_id TEXT NOT NULL, " +
    "quantity INTEGER NOT NULL, PRIMARY KEY (recipe_id, item_id)"}
];
let GAME_CONTENT: GameContent | null = null;
let GAME_CONTENT_LOADED_AT = 0;
// Runs from InitModule: idempotent DDL plus seed rows that do not exist yet.
function contentMigrate(nk: nkruntime.Nakama): void {
  for (let t = 0; t < GAME_CONTENT_TABLES.length; t++)
    nk.sqlExec("CREATE TABLE IF NOT EXISTS " + GAME_CONTENT_TABLES[t].name + " (" + GAME_CONTENT_TABLES[t].ddl + ")");
  contentRenameLegacy(nk);
  for (let t = 0; t < GAME_CONTENT_TABLES.length; t++) {
    const table = GAME_CONTENT_TABLES[t], seed = GAME_CONTENT_SEED[table.name] || [];
    for (let r = 0; r < seed.length; r++) {
      const columns = Object.keys(seed[r]), args: unknown[] = [], marks: string[] = [];
      for (let c = 0; c < columns.length; c++) { args.push(seed[r][columns[c]]); marks.push("$" + (c + 1)); }
      nk.sqlExec("INSERT INTO " + table.name + " (" + columns.join(", ") + ") VALUES (" + marks.join(", ") +
        ") ON CONFLICT (" + table.key.join(", ") + ") DO NOTHING", args);
    }
  }
  // Thạch was split into Thổ (stone) and Kim (ore); ore items now carry Kim.
  nk.sqlExec("UPDATE game_items SET absorb_vi = 'kim' WHERE absorb_vi = 'thach'");
}
// Rows written under old IDs follow the renumbered maps (legacy_ids.ts). A row
// whose new key already exists is a duplicate and is dropped.
function contentRenameLegacy(nk: nkruntime.Nakama): void {
  const loot = nk.sqlQuery("SELECT * FROM game_loot") as {[column: string]: any}[], have: {[key: string]: boolean} = {};
  for (let i = 0; i < loot.length; i++) have[loot[i].table_id + "|" + loot[i].item_id] = true;
  for (let i = 0; i < loot.length; i++) {
    const from = String(loot[i].table_id), to = legacyLootTableId(from), item = String(loot[i].item_id);
    if (to === from) continue;
    if (have[to + "|" + item]) nk.sqlExec("DELETE FROM game_loot WHERE table_id = $1 AND item_id = $2", [from, item]);
    else { nk.sqlExec("UPDATE game_loot SET table_id = $1 WHERE table_id = $2 AND item_id = $3", [to, from, item]); have[to + "|" + item] = true; }
  }
  for (const id in LEGACY_ITEM_NAMES)
    nk.sqlExec("UPDATE game_items SET name = $1 WHERE id = $2 AND name = $3", [LEGACY_ITEM_NAMES[id][1], id, LEGACY_ITEM_NAMES[id][0]]);
  for (let i = 0; i < RETIRED_ITEM_IDS.length; i++) nk.sqlExec("DELETE FROM game_items WHERE id = $1", [RETIRED_ITEM_IDS[i]]);
}
function contentRows(nk: nkruntime.Nakama, table: string): {[column: string]: any}[] {
  const rows = nk.sqlQuery("SELECT * FROM " + table) as {[column: string]: any}[];
  return rows.slice().sort(function (a, b) {
    return Number(a.sort_order || 0) - Number(b.sort_order || 0) || (String(a.id || a.item_id) < String(b.id || b.item_id) ? -1 : 1);
  });
}
function contentInt(value: unknown, min: number, max: number, what: string): number {
  if (!assetInteger(value, min, max)) throw Error("Invalid " + what);
  return value as number;
}
function contentOptional(value: unknown, what: string): number | undefined {
  return value === null || value === undefined ? undefined : contentInt(value, 0, 100000, what);
}
// Validates every row before replacing the cache: a bad edit never half-applies.
function contentLoad(nk: nkruntime.Nakama): GameContent {
  const content: GameContent = {revision: "", items: [], itemIndex: {}, buy: {}, sell: {}, absorb: {}, crops: {}, loot: {}, recipes: {}};
  const itemRows = contentRows(nk, "game_items");
  for (let i = 0; i < itemRows.length; i++) {
    const r = itemRows[i], id = String(r.id);
    if (!/^[a-z0-9_]{2,60}$/.test(id) || content.itemIndex[id] || typeof r.name !== "string" || !r.name) throw Error("Invalid item " + id);
    if (["thuong", "linh", "hiem", "la"].indexOf(r.rarity) < 0) throw Error("Invalid rarity " + id);
    const item: ItemDefinition = {id: id, name: r.name, rarity: r.rarity, stackMax: contentInt(r.stack_max, 1, 99, "stack_max " + id),
      instance: r.instance === true, bound: r.bound === true};
    if (item.instance && item.stackMax !== 1) throw Error("Instance item must not stack " + id);
    if (r.equip_slot !== null && r.equip_slot !== undefined) {
      if (r.equip_slot !== "weapon" && r.equip_slot !== "armor") throw Error("Invalid equip_slot " + id);
      item.equipSlot = r.equip_slot;
    }
    const attack = contentOptional(r.attack_bonus, "attack_bonus " + id), defense = contentOptional(r.defense_bonus, "defense_bonus " + id);
    const heal = contentOptional(r.heal_amount, "heal_amount " + id);
    if (attack !== undefined) item.attackBonus = attack;
    if (defense !== undefined) item.defenseBonus = defense;
    if (heal !== undefined) item.healAmount = heal;
    const buy = contentOptional(r.buy_price, "buy_price " + id), sell = contentOptional(r.sell_price, "sell_price " + id);
    if (buy !== undefined) content.buy[id] = buy;
    if (sell !== undefined) content.sell[id] = sell;
    if (r.absorb_vi !== null && r.absorb_vi !== undefined) {
      if (INNER_ELEMENTS.indexOf(r.absorb_vi) < 0) throw Error("Invalid absorb_vi " + id);
      content.absorb[id] = {vi: r.absorb_vi, motes: contentInt(r.absorb_motes, 1, 50, "absorb_motes " + id), turbid: 0};
    }
    content.items.push(item); content.itemIndex[id] = item;
  }
  function known(id: unknown, what: string): string {
    if (typeof id !== "string" || !content.itemIndex[id]) throw Error("Unknown item in " + what);
    return id;
  }
  const cropRows = contentRows(nk, "game_crops");
  for (let i = 0; i < cropRows.length; i++) {
    const r = cropRows[i], id = String(r.id);
    const crop: CropDefinition = {seed: known(r.seed_item, id), output: known(r.output_item, id),
      durationMs: contentInt(r.duration_ms, 1000, 86400000, "duration_ms " + id), yield: contentInt(r.yield_count, 1, 99, "yield_count " + id),
      seedBackPercent: contentInt(r.seed_back_percent, 0, 100, "seed_back_percent " + id),
      glowPercent: contentInt(r.glow_percent, 0, 100, "glow_percent " + id),
      glowNightPercent: contentInt(r.glow_night_percent, 0, 100, "glow_night_percent " + id)};
    if (r.glow_item !== null && r.glow_item !== undefined) crop.glow = known(r.glow_item, id);
    content.crops[id] = crop;
  }
  const lootRows = contentRows(nk, "game_loot");
  for (let i = 0; i < lootRows.length; i++) {
    const r = lootRows[i], table = String(r.table_id);
    (content.loot[table] = content.loot[table] || []).push({itemId: known(r.item_id, table),
      weight: contentInt(r.weight, 1, 1000000, "weight " + table), quantity: contentInt(r.quantity, 1, 99, "quantity " + table)});
  }
  const recipeRows = contentRows(nk, "game_recipes"), ingredientRows = contentRows(nk, "game_recipe_ingredients");
  for (let i = 0; i < recipeRows.length; i++) {
    const r = recipeRows[i];
    content.recipes[String(r.id)] = {output: known(r.output_item, r.id), fee: contentInt(r.fee, 0, 100000, "fee " + r.id), ingredients: {}};
  }
  for (let i = 0; i < ingredientRows.length; i++) {
    const r = ingredientRows[i], recipe = content.recipes[String(r.recipe_id)];
    if (!recipe) throw Error("Ingredient for unknown recipe " + r.recipe_id);
    recipe.ingredients[known(r.item_id, r.recipe_id)] = contentInt(r.quantity, 1, 99, "ingredient " + r.recipe_id);
  }
  content.revision = nk.sha256Hash(JSON.stringify([content.items, content.buy, content.sell, content.absorb,
    content.crops, content.loot, content.recipes])).substring(0, 16);
  return content;
}
// Every RPC that reads content calls this first (loadCharacter does it for all
// profile work). A failed reload keeps serving the last valid content.
function contentEnsure(nk: nkruntime.Nakama): GameContent {
  const now = Date.now();
  if (GAME_CONTENT && now - GAME_CONTENT_LOADED_AT < GAME_CONTENT_TTL_MS && now >= GAME_CONTENT_LOADED_AT) return GAME_CONTENT;
  try { GAME_CONTENT = contentLoad(nk); }
  catch (error) {
    if (!GAME_CONTENT) return fail(nkruntime.Codes.UNAVAILABLE, "Game content is unavailable: " + String((error as Error).message || error));
  }
  GAME_CONTENT_LOADED_AT = now;
  return GAME_CONTENT!;
}
function gameContent(): GameContent {
  if (!GAME_CONTENT) return fail(nkruntime.Codes.UNAVAILABLE, "Game content is not loaded");
  return GAME_CONTENT;
}
function catalogItem(id: string): ItemDefinition {
  const item = Object.prototype.hasOwnProperty.call(gameContent().itemIndex, id) ? gameContent().itemIndex[id] : undefined;
  if (!item) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Unknown item: " + id);
  return item;
}
function contentHas(map: {[id: string]: unknown}, id: unknown): boolean {
  return typeof id === "string" && Object.prototype.hasOwnProperty.call(map, id);
}
