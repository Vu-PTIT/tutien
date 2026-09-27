// Stable IDs from game-design/07. Definitions do not imply usable items yet.
interface ItemDefinition {
  id: string; name: string; stackMax: number; instance: boolean; bound: boolean;
  equipSlot?: string; attackBonus?: number; defenseBonus?: number; healAmount?: number;
}
const ITEM_CATALOG: ItemDefinition[] = [
  itemDefinition("it_seed_cam_lo", "Hạt Cam Lộ"), itemDefinition("it_herb_cam_lo", "Cam Lộ"),
  itemDefinition("it_seed_tinh_tam", "Hạt Tĩnh Tâm"), itemDefinition("it_herb_tinh_tam", "Tĩnh Tâm"),
  itemDefinition("it_seed_ich_khi", "Hạt Ích Khí"), itemDefinition("it_herb_ich_khi", "Ích Khí"),
  itemDefinition("it_water", "Nước"), itemDefinition("it_bamboo", "Trúc"),
  itemDefinition("it_iron", "Thiết quặng"), itemDefinition("it_spirit_dust", "Linh sa"),
  itemDefinition("it_spider_silk", "Tơ nhện"), itemDefinition("it_boar_hide", "Da Sơn Trư"),
  itemDefinition("it_venom", "Độc dịch"), itemDefinition("it_heal_pill", "Hồi Nguyên Hoàn"),
  itemDefinition("it_qi_pill", "Ích Khí Tán"), itemDefinition("it_ward_talisman", "Hộ Thân Phù"),
  itemDefinition("it_escape_talisman", "Thoát Thân Phù"),
  itemDefinition("it_iron_sword", "Thanh Thiết Kiếm", true, false, {equipSlot: "weapon", attackBonus: 5}),
  itemDefinition("it_cloth_armor", "Áo vải", true, false, {equipSlot: "armor", defenseBonus: 15}),
  itemDefinition("it_mach_ban", "Mạch Bàn", true, true),
  itemDefinition("it_water_sample", "Mẫu nước", false, true),
  itemDefinition("it_ledger", "Sổ ghi chép", false, true),
  itemDefinition("it_array_shard", "Mảnh trận", false, true),
  itemDefinition("it_well_key", "Chìa khóa Cổ Tỉnh", false, true)
];
function itemDefinition(id: string, name: string, instance: boolean = false, bound: boolean = false,
    stats: {[key: string]: unknown} = {}): ItemDefinition {
  const definition: ItemDefinition = { id: id, name: name, stackMax: instance || bound ? 1 : 99, instance: instance, bound: bound };
  if (typeof stats.equipSlot === "string") definition.equipSlot = stats.equipSlot;
  if (typeof stats.attackBonus === "number") definition.attackBonus = stats.attackBonus;
  if (typeof stats.defenseBonus === "number") definition.defenseBonus = stats.defenseBonus;
  if (id === "it_heal_pill") definition.healAmount = 40;
  return definition;
}
function catalogItem(id: string): ItemDefinition {
  for (let i = 0; i < ITEM_CATALOG.length; i++) if (ITEM_CATALOG[i].id === id) return ITEM_CATALOG[i];
  return fail(nkruntime.Codes.FAILED_PRECONDITION, "Unknown item: " + id);
}
interface RewardBundle { spiritStones: number; items: { itemId: string; quantity: number }[]; cultivationXp?: number; }
// Prototype starter budget stays immutable; repeatable encounter XP is server bounded.
const STARTER_REWARD: RewardBundle = { spiritStones: 12, items: [
  { itemId: "it_seed_cam_lo", quantity: 2 }, { itemId: "it_water", quantity: 4 },
  { itemId: "it_heal_pill", quantity: 2 }, { itemId: "it_cloth_armor", quantity: 1 }
] };
