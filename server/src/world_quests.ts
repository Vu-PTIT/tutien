interface WorldQuestState {
  schemaVersion: number;
  currentQuestId: string;
  completed: string[];
  objectives: {[key: string]: boolean};
}

function newWorldQuestState(): WorldQuestState {
  return {schemaVersion: 1, currentQuestId: "q_main_001", completed: [], objectives: {}};
}

function readWorldQuestState(profile: CharacterState): WorldQuestState {
  const value = profile.worldQuests;
  if (value === undefined) return newWorldQuestState();
  if (!value || value.schemaVersion !== 1 || typeof value.currentQuestId !== "string" ||
      !Array.isArray(value.completed) || !value.objectives || typeof value.objectives !== "object") {
    return fail(nkruntime.Codes.FAILED_PRECONDITION, "Quest progress requires review");
  }
  return JSON.parse(JSON.stringify(value)) as WorldQuestState;
}

function worldQuestView(profile: CharacterState): JsonObject {
  const quest = readWorldQuestState(profile);
  const title: {[key: string]: string} = {
    q_main_001: "VIỆC Ở AN KHÊ", q_main_002: "DẤU NƯỚC LẠ", q_main_003: "HƠI THỞ ĐẦU TIÊN",
    q_main_complete: "HÀNH TRÌNH TU LUYỆN BẮT ĐẦU"
  };
  const body: {[key: string]: string} = {
    q_main_001: "Gặp Bà Sâm tại hiệu thuốc An Khê.",
    q_main_002: quest.objectives.mach_ban
      ? "Mang Mạch Bàn tới Trúc Âm, dò hai dấu nước. (%d/2)".replace("%d", String((quest.objectives.water_west ? 1 : 0) + (quest.objectives.water_east ? 1 : 0)))
      : "Tìm Lục Vi ở cổng làng để nhận Mạch Bàn.",
    q_main_003: "Trở về An Khê, đến Bàn Tĩnh Tâm và thực hành dẫn khí.",
    q_main_complete: "Đã mở Luyện Khí 1 và Phi Nhận. Hành trình tiếp tục ở Trúc Âm."
  };
  return {questId: quest.currentQuestId, title: title[quest.currentQuestId] || title.q_main_complete,
    body: body[quest.currentQuestId] || body.q_main_complete,
    objectives: quest.objectives, completed: quest.completed.slice(),
    realm: profile.realm, realmStage: profile.realmStage};
}

// Called only after world_interact validates the server-owned map, object,
// distance, and line of sight. The profile CAS commits objective, item, XP,
// realm, skill, and insight changes together.
function applyWorldQuestInteraction(nk: nkruntime.Nakama, userId: string, entityId: string): JsonObject {
  for (let attempt = 0; attempt < 5; attempt++) {
    const loaded = loadCharacter(nk, userId);
    const before = loaded.state;
    const quest = readWorldQuestState(before);
    const next = JSON.parse(JSON.stringify(before)) as CharacterState;
    const progress = readWorldQuestState(next);
    let reward: RewardBundle | null = null;
    let message = "Không có mục tiêu nhiệm vụ mới tại điểm này.";
    if (progress.currentQuestId === "q_main_001" && entityId === "ak.npc.ba_sam") {
      progress.completed.push("q_main_001"); progress.currentQuestId = "q_main_002";
      message = "Bà Sâm nhờ bạn khảo sát dòng nước. Hãy tìm Lục Vi ở cổng làng. ";
    } else if (progress.currentQuestId === "q_main_002") {
      if (entityId === "ak.npc.luc_vi" && !progress.objectives.mach_ban) {
        reward = {spiritStones: 0, items: [{itemId: "it_mach_ban", quantity: 1}]};
        progress.objectives.mach_ban = true;
        next.learnedSkills = next.learnedSkills || [];
        if (next.learnedSkills.indexOf("sk_scan") < 0) next.learnedSkills.push("sk_scan");
        message = "Lục Vi giao Mạch Bàn. Hãy dò hai dấu nước ở Ven Suối.";
      } else if (entityId === "ta.poi.water_trace_west" || entityId === "ta.poi.water_trace_east") {
        if (!progress.objectives.mach_ban) return {profile: before, quest: worldQuestView(before), message: "Hãy gặp Lục Vi để nhận Mạch Bàn trước."};
        const objective = entityId === "ta.poi.water_trace_west" ? "water_west" : "water_east";
        if (!progress.objectives[objective]) {
          reward = {spiritStones: 0, items: [{itemId: "it_water_sample", quantity: 1}]};
          progress.objectives[objective] = true;
          message = "Đã ghi nhận một dấu nước bằng Mạch Bàn.";
          if (progress.objectives.water_west && progress.objectives.water_east) {
            progress.completed.push("q_main_002"); progress.currentQuestId = "q_main_003";
            message = "Hai dấu nước đã được đối chiếu. Trở về An Khê để dẫn khí.";
          }
        }
      }
    } else if (progress.currentQuestId === "q_main_003" && entityId === "ak.shrine.breathing") {
      if (before.realm !== "mortal") return fail(nkruntime.Codes.FAILED_PRECONDITION, "Opening quest requires a mortal character");
      next.realm = "luyen_khi"; next.realmStage = 1;
      next.insightFlags = next.insightFlags || [];
      if (next.insightFlags.indexOf("insight.breath_control") < 0) next.insightFlags.push("insight.breath_control");
      next.learnedTechniques = next.learnedTechniques || [];
      if (next.learnedTechniques.indexOf("cp_tuc_mach") < 0) next.learnedTechniques.push("cp_tuc_mach");
      next.learnedSkills = next.learnedSkills || [];
      if (next.learnedSkills.indexOf("sk_phi_nhan") < 0) next.learnedSkills.push("sk_phi_nhan");
      reward = {spiritStones: 0, cultivationXp: 40, items: []};
      progress.completed.push("q_main_003"); progress.currentQuestId = "q_main_complete";
      message = "Dẫn khí thành công: Luyện Khí 1, Tức Mạch Quyết và Phi Nhận đã mở.";
    }
    if (progress.currentQuestId === quest.currentQuestId && JSON.stringify(progress.objectives) === JSON.stringify(quest.objectives)) {
      return {profile: before, quest: worldQuestView(before), message: message};
    }
    let updated = next;
    if (reward) updated = addReward(updated, reward, nk);
    else updated.revision++;
    updated.worldQuests = progress;
    if (updated.revision >= 1000000000) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED, "Character revision limit reached");
    validateCharacter(updated);
    try {
      nk.storageWrite([characterWrite(userId, updated, loaded.version)]);
      return {profile: updated, quest: worldQuestView(updated), message: message};
    } catch (_error) { /* Retry the whole quest transaction after a concurrent profile write. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE, "Quest progress is busy; retry the interaction");
}
