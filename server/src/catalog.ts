// Stable IDs from game-design/07. Definitions do not imply usable items yet.
interface ItemDefinition { id: string; name: string; stackMax: number; instance: boolean; bound: boolean; }
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
  itemDefinition("it_iron_sword", "Thanh Thiết Kiếm", true),
  itemDefinition("it_cloth_armor", "Áo vải", true), itemDefinition("it_mach_ban", "Mạch Bàn", true, true),
  itemDefinition("it_water_sample", "Mẫu nước", false, true),
  itemDefinition("it_ledger", "Sổ ghi chép", false, true),
  itemDefinition("it_array_shard", "Mảnh trận", false, true),
  itemDefinition("it_well_key", "Chìa khóa Cổ Tỉnh", false, true)
];
function itemDefinition(id: string, name: string, instance: boolean = false, bound: boolean = false): ItemDefinition {
  return { id: id, name: name, stackMax: instance || bound ? 1 : 99, instance: instance, bound: bound };
}
function catalogItem(id: string): ItemDefinition {
  for (let i = 0; i < ITEM_CATALOG.length; i++) if (ITEM_CATALOG[i].id === id) return ITEM_CATALOG[i];
  return fail(nkruntime.Codes.FAILED_PRECONDITION, "Unknown item: " + id);
}
interface RewardBundle { spiritStones: number; items: { itemId: string; quantity: number }[]; }
// Prototype budget; version is immutable once released. No cultivation/quest unlocks.
const STARTER_REWARD: RewardBundle = { spiritStones: 12, items: [
  { itemId: "it_seed_cam_lo", quantity: 2 }, { itemId: "it_water", quantity: 4 },
  { itemId: "it_heal_pill", quantity: 2 }, { itemId: "it_cloth_armor", quantity: 1 }
] };
