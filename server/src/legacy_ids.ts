// Map, gate and activity IDs are numbered by region (m_k1_01, k1_01_med_03...) so
// places can be renamed without touching data. Saved worlds, activity sessions and
// loot rows written before the renumbering still carry the old place-name IDs;
// these tables translate them on read.
const LEGACY_MAP_IDS: {[id: string]: string} = {
  m_lang_que: "m_k1_01", m_vanh_dai_tay: "m_k1_02", m_mo_lo_thien: "m_k1_03", m_mo_ngam: "m_k1_04",
  m_ba_vi: "m_k1_05", m_tram_thien_mach: "m_k1_06", m_thang_long: "m_k1_08", m_cang_dong_bac: "m_k2_01"
};
const LEGACY_SITE_IDS: {[id: string]: string} = legacySiteIds();
function legacySiteIds(): {[id: string]: string} {
  const out: {[id: string]: string} = {};
  const pad = function (n: number): string { return n < 10 ? "0" + n : String(n); };
  const runs: [string, string, number, number][] = [
    ["lq_med_mieu", "k1_01", 0, 8], ["lq_med_ho", "k1_01", 8, 4], ["lq_med_lo_ren", "k1_01", 12, 2],
    ["vd_med_thap", "k1_02", 0, 4], ["vd_med_lua", "k1_02", 4, 4], ["mb_med_ho_tay", "k1_03", 0, 4],
    ["rs_med_goc_nam", "k1_05", 0, 3], ["rs_med_goc_bac", "k1_05", 3, 3]
  ];
  for (let r = 0; r < runs.length; r++) {
    const run = runs[r];
    for (let i = 1; i <= run[3]; i++) out[run[0] + (i === 1 ? "" : "_" + pad(i))] = run[1] + "_med_" + pad(run[2] + i);
  }
  for (let i = 1; i <= 12; i++) {
    out["new_fish_" + pad(i)] = "k1_01_fish_" + pad(i);
    out["new_plot_" + pad(i)] = "nha_plot_" + pad(i);
  }
  for (let i = 1; i <= 8; i++) out["ml_iron_" + pad(i)] = "k1_03_ore_" + pad(i);
  for (let i = 1; i <= 6; i++) out["ng_iron_b1_" + pad(i)] = "k1_04_ore_" + pad(i);
  return out;
}
function legacyMapId(id: string): string {
  return Object.prototype.hasOwnProperty.call(LEGACY_MAP_IDS, id) ? LEGACY_MAP_IDS[id] : id;
}
function legacySiteId(id: string): string {
  return Object.prototype.hasOwnProperty.call(LEGACY_SITE_IDS, id) ? LEGACY_SITE_IDS[id] : id;
}
// Loot table keys are "type:mapId" or "type:mapId:linh_trieu"; the event suffix
// was "spirit_sky" before Đêm Linh Triều got its name.
function legacyLootTableId(id: string): string {
  const parts = id.split(":");
  if (parts.length > 1) parts[1] = legacyMapId(parts[1]);
  if (parts.length > 2 && parts[2] === "spirit_sky") parts[2] = "linh_trieu";
  return parts.join(":");
}
// Item names from before the current setting. A database row still showing the
// old name takes the new one; a name edited by hand is kept.
const LEGACY_ITEM_NAMES: {[id: string]: [string, string]} = {
  it_fish_tilapia: ["Cá rô phi", "Cá rô"],
  it_copper: ["Đồng quặng", "Quặng đồng"],
  it_iron: ["Thiết quặng", "Quặng sắt"],
  it_spirit_dust: ["Linh sa", "Bụi linh"],
  it_venom: ["Độc dịch", "Nọc độc"],
  it_heal_pill: ["Hồi Nguyên Hoàn", "Thuốc Hồi Sức"],
  it_qi_pill: ["Ích Khí Tán", "Bột Ích Khí"],
  it_ward_talisman: ["Hộ Thân Phù", "Bùa Hộ Thân"],
  it_escape_talisman: ["Thoát Thân Phù", "Bùa Thoát Thân"],
  it_iron_sword: ["Thanh Thiết Kiếm", "Kiếm Sắt"],
  it_spider_robe: ["Y Phục Tơ Độc", "Áo Tơ Nhện"],
  it_mach_ban: ["Mạch Bàn", "La Bàn Linh"],
  it_lake_weed: ["Rong hồ", "Rong đầm"],
  it_lake_junk: ["Đồ rơi dưới hồ", "Đồ rơi dưới đầm"],
  it_boar_hide: ["Da Sơn Trư", "Da Lợn Gai"]
};
// Quest items of a retired prototype route: dropped from bags and the catalogue.
const RETIRED_ITEM_IDS = ["it_water_sample", "it_ledger", "it_array_shard", "it_well_key"];
// Tinh Linh players were stored as kind "spirit_beast" before the kind became "spirit".
function legacyFormKind(form: PlayerForm | undefined): void {
  if (form && form.kind === "spirit_beast") form.kind = "spirit";
}
// Player groups are a "party" (Đội) or a "guild" (Hội). Parties created before the
// rename are stored with kind "sect"; anything else is not a player group.
function socialGroupKind(kind: unknown): string {
  return kind === "party" || kind === "sect" ? "party" : kind === "guild" ? "guild" : "";
}
