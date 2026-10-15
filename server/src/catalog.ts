// Items, prices, crops, loot and recipes live in the database: see game_content.ts.
interface SkillDefinition {
  id: string; name: string; kind: string; description: string; unlockText: string;
  equipSlot: string; hotkey?: string; powerBonus?: number; cooldownMs?: number;
}
const SKILL_CATALOG: SkillDefinition[] = [
  {id:"sk_linh_tram",name:"Linh Trảm",kind:"active",description:"Tung linh lực, tăng 18 sát thương.",
    unlockText:"Mở khi chọn nhân vật người.",equipSlot:"active_1",hotkey:"R",powerBonus:18,cooldownMs:1800},
  {id:"sk_linh_trao",name:"Linh Trảo",kind:"active",description:"Vồ bằng linh lực, tăng 18 sát thương.",
    unlockText:"Mở khi chọn Tinh Linh Mèo.",equipSlot:"active_1",hotkey:"R",powerBonus:18,cooldownMs:1800},
  {id:"sk_scan",name:"La Bàn Linh • Truy Dấu",kind:"utility",
    description:"Dò dấu linh mạch, dấu vết và điểm yếu của dị thú.",
    unlockText:"Mở khi nhận thẻ tập sự Hội Khai Phá.",equipSlot:""},
  {id:"sk_phi_nhan",name:"Phi Nhận",kind:"active",
    description:"Phóng phi nhận vào mục tiêu gần, tăng 18 sát thương.",
    unlockText:"Mở sau nghi thức Hơi Thở Đầu Tiên.",equipSlot:"active_1",
    hotkey:"R",powerBonus:18,cooldownMs:1800}
];
function catalogSkill(id: string): SkillDefinition | undefined {
  for (let i = 0; i < SKILL_CATALOG.length; i++) if (SKILL_CATALOG[i].id === id) return SKILL_CATALOG[i];
  return undefined;
}
interface RewardBundle {
  spiritStones: number; items: { itemId: string; quantity: number }[];
  linhNang?: InnerEssence[]; inner?: InnerAbsorbResult; purified?: number;
}
// Prototype starter budget stays immutable; repeatable encounter XP is server bounded.
const STARTER_REWARD: RewardBundle = { spiritStones: 12, items: [
  { itemId: "it_seed_cam_lo", quantity: 2 }, { itemId: "it_water", quantity: 4 },
  { itemId: "it_heal_pill", quantity: 2 }, { itemId: "it_cloth_armor", quantity: 1 }
] };
