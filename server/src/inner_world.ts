// Nội Giới: absorbed linh năng settles into a small server-owned world inside
// the character. Its size (lượng) and composition (chất) replace realm levels
// as the source of power. Growth is deterministic from the character ID and a
// growth counter, so CAS retries and receipt replays rebuild the same world.
interface InnerEssence { vi: string; motes: number; turbid: number; }
interface InnerWorld {
  v: number; learned: boolean; teacher: string;
  cells: number[]; // flattened [x, y, kind, height, turbid] with x/y in 0..2R
  sky: number; pending: {[key: string]: number}; grown: number; shape: number;
  lastLeap: {shape: number; at: number} | null;
}
interface InnerAbsorbResult { ignored: boolean; cells: number; raised: number; sky: number; leaps: string[]; }
interface InnerSummary {
  area: number; turbid: number; turbidRatio: number; height: number;
  clean: {[kind: string]: number}; total: {[kind: string]: number};
  forms: {[id: string]: boolean}; formCount: number; dominant: string; lech: boolean;
}
const INNER_KINDS = ["an", "tho", "thuy", "thach", "moc"];
const INNER_ELEMENTS = ["tho", "thuy", "thach", "moc", "phong"];
const INNER_RADIUS = 30;
const INNER_MAX_CELLS = 1600;
const INNER_MOTES_PER_CELL = 4;
const INNER_MAX_HEIGHT = 4;
const INNER_STAGE_CAP = 3; // Chapter 1 ends at Quần đảo.
const INNER_MOB_ESSENCE: {[enemyId: string]: string} = {en_boar: "tho", en_spider: "moc"};
// Every monster kill (field, solo encounter or contract hunt) releases plenty of
// linh năng, mostly turbid, carrying the species' vị.
function innerMobEssence(enemyId: string): InnerEssence[] {
  return [{vi: INNER_MOB_ESSENCE[enemyId] || "tho", motes: 8, turbid: 6}];
}
const INNER_STAGES = [
  {id: "hat", name: "Hạt", cells: 1, need: ""},
  {id: "dao", name: "Đảo", cells: 20, need: "Có Thổ và Thủy sạch"},
  {id: "dao_lon", name: "Đảo lớn", cells: 60, need: "Có Núi hoặc Rừng; đục dưới 50%"},
  {id: "quan_dao", name: "Quần đảo", cells: 150, need: "3 hình thái; Thủy từ 25%; đục dưới 35%"},
  {id: "luc_dia", name: "Lục địa", cells: 400, need: "Có Sông"},
  {id: "dai_duong", name: "Đại dương", cells: 1000, need: "Có Biển; đục dưới 20%"},
  {id: "khi_quyen", name: "Khí quyển", cells: 2500, need: "Bầu trời phủ nửa Nội Giới; có Rừng"},
  {id: "hanh_tinh", name: "Hành tinh", cells: 6000, need: "Đủ mọi vị; không lệch; gần như không đục"}
];
const INNER_FORMS: {id: string; name: string}[] = [
  {id: "suoi", name: "Suối"}, {id: "song", name: "Sông"}, {id: "ho", name: "Hồ"}, {id: "bien", name: "Biển"},
  {id: "bo_bien", name: "Bờ biển"}, {id: "nui", name: "Núi"}, {id: "day_nui", name: "Dãy núi"},
  {id: "rung", name: "Rừng"}, {id: "thung_lung", name: "Thung lũng"}, {id: "gio_long", name: "Gió lộng"},
  {id: "rung_an", name: "Rừng Ẩn"}
];
const INNER_NEIGHBORS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function innerSeedCells(): number[] { return [INNER_RADIUS, INNER_RADIUS, 0, 1, 0]; }
// A missing world is derived from the saved profile: spirit beasts know Hấp Linh
// natively; released Luyện Khí humans keep their progress as learned Thổ motes.
function innerNew(state: CharacterState): InnerWorld {
  const spirit = !!state.form && state.form.kind === "spirit_beast" && state.form.selected === true;
  const legacy = state.realm === "luyen_khi";
  const w: InnerWorld = {v: 1, learned: spirit || legacy, teacher: spirit ? "native" : legacy ? "legacy" : "",
    cells: spirit || legacy ? innerSeedCells() : [], sky: 0, pending: {}, grown: 0, shape: 0, lastLeap: null};
  if (legacy && !spirit) w.pending.tho = Number(state.realmStage) * 20;
  return w;
}
function innerInvalid(): never { return fail(nkruntime.Codes.FAILED_PRECONDITION, "Inner world requires review; no assets were changed"); }
function innerValidate(w: InnerWorld): void {
  if (!w || typeof w !== "object" || w.v !== 1 || typeof w.learned !== "boolean" || typeof w.teacher !== "string" ||
      !Array.isArray(w.cells) || w.cells.length % 5 !== 0 || w.cells.length / 5 > INNER_MAX_CELLS ||
      !assetInteger(w.sky, 0, INNER_MAX_CELLS) || !assetInteger(w.grown, 0, ASSET_LIMIT) ||
      !assetInteger(w.shape, 0, INNER_STAGES.length - 1) || !w.pending || typeof w.pending !== "object" ||
      (w.lastLeap !== null && (typeof w.lastLeap !== "object" || !assetInteger(w.lastLeap.shape, 0, INNER_STAGES.length - 1) ||
        !assetInteger(w.lastLeap.at, 0, LIFE_TIME_LIMIT)))) innerInvalid();
  if (!w.learned && w.cells.length) innerInvalid();
  const seen: {[key: string]: boolean} = {};
  for (let i = 0; i < w.cells.length; i += 5) {
    const x = w.cells[i], y = w.cells[i + 1], kind = w.cells[i + 2], h = w.cells[i + 3], t = w.cells[i + 4];
    if (!assetInteger(x, 0, INNER_RADIUS * 2) || !assetInteger(y, 0, INNER_RADIUS * 2) || !assetInteger(kind, 0, INNER_KINDS.length - 1) ||
        !assetInteger(h, 1, INNER_MAX_HEIGHT) || (t !== 0 && t !== 1) || (h > 1 && INNER_KINDS[kind] !== "thach") || seen[x + "," + y]) innerInvalid();
    seen[x + "," + y] = true;
  }
  if (w.sky > w.cells.length / 5) innerInvalid();
  for (const key in w.pending) {
    const vi = key.replace(/_d$/, "");
    if (INNER_ELEMENTS.indexOf(vi) < 0 || !assetInteger(w.pending[key], 0, ASSET_LIMIT)) innerInvalid();
  }
}
function innerOf(state: CharacterState): InnerWorld {
  if (state.innerWorld === undefined) state.innerWorld = innerNew(state);
  innerValidate(state.innerWorld);
  return state.innerWorld as InnerWorld;
}
function innerGrid(w: InnerWorld): {[key: string]: number} {
  const grid: {[key: string]: number} = {};
  for (let i = 0; i < w.cells.length; i += 5) grid[w.cells[i] + "," + w.cells[i + 1]] = i;
  return grid;
}
function innerRoll(nk: nkruntime.Nakama, state: CharacterState, w: InnerWorld): number {
  const value = parseInt(nk.sha256Hash(state.characterId + ":inner:" + w.grown).substring(0, 8), 16) / 4294967296;
  w.grown++;
  return value;
}
function innerFrontier(w: InnerWorld, grid: {[key: string]: number}, kind: number): {x: number; y: number; weight: number}[] {
  const out: {x: number; y: number; weight: number}[] = [], seen: {[key: string]: boolean} = {};
  for (let i = 0; i < w.cells.length; i += 5) {
    for (let n = 0; n < INNER_NEIGHBORS.length; n++) {
      const x = w.cells[i] + INNER_NEIGHBORS[n][0], y = w.cells[i + 1] + INNER_NEIGHBORS[n][1], key = x + "," + y;
      if (x < 0 || y < 0 || x > INNER_RADIUS * 2 || y > INNER_RADIUS * 2 || grid[key] !== undefined || seen[key]) continue;
      seen[key] = true;
      let weight = 1;
      for (let m = 0; m < INNER_NEIGHBORS.length; m++) {
        const j = grid[(x + INNER_NEIGHBORS[m][0]) + "," + (y + INNER_NEIGHBORS[m][1])];
        if (j !== undefined && w.cells[j + 2] === kind) weight += 3;
      }
      const dx = x - INNER_RADIUS, dy = y - INNER_RADIUS;
      out.push({x: x, y: y, weight: weight / (1 + Math.sqrt(dx * dx + dy * dy) * 0.08)});
    }
  }
  return out;
}
function innerGrowCell(nk: nkruntime.Nakama, state: CharacterState, w: InnerWorld, vi: string, turbid: boolean, result: InnerAbsorbResult): boolean {
  const area = w.cells.length / 5;
  if (vi === "phong") {
    if (w.sky >= area) return false;
    w.sky++; result.sky++; return true;
  }
  const kind = INNER_KINDS.indexOf(vi);
  if (vi === "thach" && !turbid) {
    const stones: number[] = [];
    for (let i = 0; i < w.cells.length; i += 5) if (w.cells[i + 2] === kind && !w.cells[i + 4] && w.cells[i + 3] < INNER_MAX_HEIGHT) stones.push(i);
    if (stones.length && innerRoll(nk, state, w) < 0.45) {
      w.cells[stones[Math.floor(innerRoll(nk, state, w) * stones.length)] + 3]++;
      result.raised++; return true;
    }
  }
  if (area >= INNER_MAX_CELLS) return false;
  const options = innerFrontier(w, innerGrid(w), kind);
  if (!options.length) return false;
  let total = 0;
  for (let i = 0; i < options.length; i++) total += options[i].weight;
  let pick = innerRoll(nk, state, w) * total, chosen = options[options.length - 1];
  for (let i = 0; i < options.length; i++) { pick -= options[i].weight; if (pick <= 0) { chosen = options[i]; break; } }
  w.cells.push(chosen.x, chosen.y, kind, 1, turbid ? 1 : 0);
  result.cells++;
  return true;
}
// Applies essence to a profile that is already inside a CAS mutation. A human
// who has not been taught Hấp Linh by a Tinh Linh lets the essence pass through.
function innerAbsorb(state: CharacterState, nk: nkruntime.Nakama, essences: InnerEssence[]): InnerAbsorbResult {
  const w = innerOf(state);
  const result: InnerAbsorbResult = {ignored: !w.learned, cells: 0, raised: 0, sky: 0, leaps: []};
  if (!w.learned) return result;
  if (!Array.isArray(essences) || essences.length > 8) return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid linh năng");
  for (let e = 0; e < essences.length; e++) {
    const essence = essences[e];
    if (!essence || INNER_ELEMENTS.indexOf(essence.vi) < 0 || !assetInteger(essence.motes, 0, 1000) ||
        !assetInteger(essence.turbid, 0, essence.motes)) return fail(nkruntime.Codes.INVALID_ARGUMENT, "Invalid linh năng");
    if (essence.motes > essence.turbid) w.pending[essence.vi] = Number(w.pending[essence.vi] || 0) + essence.motes - essence.turbid;
    if (essence.turbid) w.pending[essence.vi + "_d"] = Number(w.pending[essence.vi + "_d"] || 0) + essence.turbid;
  }
  // Grow every waiting vị in a fixed order, including essence carried over from
  // earlier claims or migrated progress.
  const keys = Object.keys(w.pending).sort();
  for (let k = 0; k < keys.length; k++) {
    const key = keys[k], vi = key.replace(/_d$/, ""), turbid = key !== vi;
    while (w.pending[key] >= INNER_MOTES_PER_CELL) {
      if (!innerGrowCell(nk, state, w, vi, turbid, result)) break;
      w.pending[key] -= INNER_MOTES_PER_CELL;
    }
    // A full world keeps a small amount of waiting essence per vị.
    if (w.pending[key] > INNER_MOTES_PER_CELL * 4) w.pending[key] = INNER_MOTES_PER_CELL * 4;
    if (!w.pending[key]) delete w.pending[key];
  }
  result.leaps = innerCheckLeap(w);
  return result;
}
function innerPurify(state: CharacterState, count: number): number {
  const w = innerOf(state);
  let done = 0;
  for (let i = 0; i < w.cells.length && done < count; i += 5) if (w.cells[i + 4]) { w.cells[i + 4] = 0; done++; }
  if (done) innerCheckLeap(w);
  return done;
}
function innerComponents(w: InnerWorld, grid: {[key: string]: number}, test: (i: number) => boolean): number[][] {
  const seen: {[index: string]: boolean} = {}, out: number[][] = [];
  for (let i = 0; i < w.cells.length; i += 5) {
    if (seen[i] || !test(i)) continue;
    const comp: number[] = [], stack = [i];
    seen[i] = true;
    while (stack.length) {
      const c = stack.pop()!;
      comp.push(c);
      for (let n = 0; n < INNER_NEIGHBORS.length; n++) {
        const j = grid[(w.cells[c] + INNER_NEIGHBORS[n][0]) + "," + (w.cells[c + 1] + INNER_NEIGHBORS[n][1])];
        if (j !== undefined && !seen[j] && test(j)) { seen[j] = true; stack.push(j); }
      }
    }
    out.push(comp);
  }
  return out;
}
function innerSummary(w: InnerWorld): InnerSummary {
  const grid = innerGrid(w), clean: {[kind: string]: number} = {}, total: {[kind: string]: number} = {};
  for (let k = 0; k < INNER_KINDS.length; k++) { clean[INNER_KINDS[k]] = 0; total[INNER_KINDS[k]] = 0; }
  let turbid = 0, height = 0;
  for (let i = 0; i < w.cells.length; i += 5) {
    const kind = INNER_KINDS[w.cells[i + 2]];
    total[kind]++;
    if (w.cells[i + 4]) turbid++; else { clean[kind]++; if (kind === "thach") height += w.cells[i + 3]; }
  }
  const area = w.cells.length / 5;
  const is = function (i: number, kind: string): boolean { return INNER_KINDS[w.cells[i + 2]] === kind && !w.cells[i + 4]; };
  const at = function (x: number, y: number): number | undefined { return grid[x + "," + y]; };
  const mountain = function (i: number | undefined): boolean { return i !== undefined && is(i, "thach") && w.cells[i + 3] >= 3; };
  const touches = function (i: number, test: (j: number) => boolean): boolean {
    for (let n = 0; n < INNER_NEIGHBORS.length; n++) {
      const j = at(w.cells[i] + INNER_NEIGHBORS[n][0], w.cells[i + 1] + INNER_NEIGHBORS[n][1]);
      if (j !== undefined && test(j)) return true;
    }
    return false;
  };
  const water = innerComponents(w, grid, function (i) { return is(i, "thuy"); });
  const sea: {[index: string]: boolean} = {};
  let suoi = false, song = false, bien = false;
  for (let c = 0; c < water.length; c++) {
    if (water[c].length >= 3) suoi = true;
    if (water[c].length >= 12) { bien = true; for (let j = 0; j < water[c].length; j++) sea[water[c][j]] = true; }
    if (water[c].length >= 6) for (let j = 0; j < water[c].length && !song; j++) if (touches(water[c][j], mountain)) song = true;
  }
  const peaks = innerComponents(w, grid, function (i) { return mountain(i); });
  const forests = innerComponents(w, grid, function (i) { return is(i, "moc"); });
  const forms: {[id: string]: boolean} = {suoi: suoi, song: song, bien: bien, nui: peaks.length > 0, ho: false, bo_bien: false,
    day_nui: false, rung: false, thung_lung: false, gio_long: false, rung_an: false};
  for (let c = 0; c < peaks.length; c++) if (peaks[c].length >= 3) forms.day_nui = true;
  for (let c = 0; c < forests.length; c++) if (forests[c].length >= 6) forms.rung = true;
  for (let i = 0; i < w.cells.length; i += 5) {
    const x = w.cells[i], y = w.cells[i + 1];
    if (is(i, "thuy")) {
      let land = 0;
      for (let n = 0; n < INNER_NEIGHBORS.length; n++) { const j = at(x + INNER_NEIGHBORS[n][0], y + INNER_NEIGHBORS[n][1]); if (j !== undefined && is(j, "tho")) land++; }
      if (land >= 3) forms.ho = true;
    } else if (is(i, "tho")) {
      if (touches(i, function (j) { return !!sea[j]; })) forms.bo_bien = true;
      if ((mountain(at(x - 1, y)) && mountain(at(x + 1, y))) || (mountain(at(x, y - 1)) && mountain(at(x, y + 1)))) forms.thung_lung = true;
    } else if (is(i, "moc") && touches(i, function (j) { return is(j, "an"); })) forms.rung_an = true;
  }
  forms.gio_long = forms.nui && w.sky >= 3;
  let formCount = 0;
  for (const id in forms) if (forms[id]) formCount++;
  let dominant = INNER_KINDS[0];
  for (let k = 1; k < INNER_KINDS.length; k++) if (total[INNER_KINDS[k]] > total[dominant]) dominant = INNER_KINDS[k];
  return {area: area, turbid: turbid, turbidRatio: area ? turbid / area : 0, height: height, clean: clean, total: total,
    forms: forms, formCount: formCount, dominant: dominant, lech: area >= 10 && total[dominant] / area > 0.8};
}
function innerStageMet(w: InnerWorld, s: InnerSummary, index: number): boolean {
  if (s.area < INNER_STAGES[index].cells || s.lech) return false;
  if (index === 1) return s.clean.tho > 0 && s.clean.thuy > 0;
  if (index === 2) return (s.forms.nui || s.forms.rung) && s.turbidRatio < 0.5;
  if (index === 3) return s.formCount >= 3 && s.total.thuy / s.area >= 0.25 && s.turbidRatio < 0.35;
  if (index === 4) return s.forms.song;
  if (index === 5) return s.forms.bien && s.turbidRatio < 0.2;
  if (index === 6) return w.sky >= s.area * 0.5 && s.forms.rung;
  if (index === 7) {
    for (let k = 0; k < INNER_KINDS.length; k++) if (!s.clean[INNER_KINDS[k]]) return false;
    return w.sky > 0 && s.turbidRatio < 0.02;
  }
  return false;
}
// Shapes only move forward. A leap needs both enough cells and the right mix.
function innerCheckLeap(w: InnerWorld): string[] {
  const leaps: string[] = [];
  while (w.shape < INNER_STAGE_CAP && innerStageMet(w, innerSummary(w), w.shape + 1)) {
    w.shape++;
    w.lastLeap = {shape: w.shape, at: Date.now()};
    leaps.push(INNER_STAGES[w.shape].id);
  }
  return leaps;
}
function innerStats(w: InnerWorld, s: InnerSummary): {[key: string]: number} {
  const cleanArea = s.area - s.turbid;
  return {
    attackBonus: Math.floor(s.height / 4) + (s.forms.day_nui ? 2 : 0),
    defenseBonus: Math.floor(s.height / 2) + (s.forms.nui ? 3 : 0) + (s.forms.thung_lung ? 2 : 0),
    maxHpBonus: Math.floor(cleanArea / 4),
    linhLuc: s.clean.thuy * 2,
    regenPerMinute: Math.floor(s.clean.moc / 3),
    speedPercent: Math.min(30, w.sky)
  };
}
// Read-only bonus for combat code; never creates or persists a world.
function innerCombatBonus(profile: CharacterState): {attack: number; defense: number} {
  if (profile.innerWorld === undefined) return {attack: 0, defense: 0};
  const w = JSON.parse(JSON.stringify(profile.innerWorld)) as InnerWorld;
  innerValidate(w);
  const stats = innerStats(w, innerSummary(w));
  return {attack: stats.attackBonus, defense: stats.defenseBonus};
}
function innerView(profile: CharacterState): JsonObject {
  const copy = JSON.parse(JSON.stringify(profile)) as CharacterState, w = innerOf(copy), s = innerSummary(w);
  const cells: JsonObject[] = [];
  for (let i = 0; i < w.cells.length; i += 5)
    cells.push({x: w.cells[i] - INNER_RADIUS, y: w.cells[i + 1] - INNER_RADIUS, kind: INNER_KINDS[w.cells[i + 2]], height: w.cells[i + 3], turbid: w.cells[i + 4] === 1});
  const next = w.shape + 1 < INNER_STAGES.length ? INNER_STAGES[w.shape + 1] : null;
  return {
    learned: w.learned, teacher: w.teacher, sky: w.sky, pending: w.pending, cells: cells,
    shape: {index: w.shape, id: INNER_STAGES[w.shape].id, name: INNER_STAGES[w.shape].name},
    next: next ? {id: next.id, name: next.name, cells: next.cells, need: next.need, locked: w.shape + 1 > INNER_STAGE_CAP,
      met: w.shape + 1 <= INNER_STAGE_CAP && innerStageMet(w, s, w.shape + 1)} : null,
    lastLeap: w.lastLeap,
    summary: {area: s.area, turbid: s.turbid, height: s.height, clean: s.clean, total: s.total, dominant: s.dominant, lech: s.lech},
    formations: INNER_FORMS.map(function (f) { return {id: f.id, name: f.name, active: !!s.forms[f.id]}; }),
    stats: innerStats(w, s),
    limits: {radius: INNER_RADIUS, maxCells: INNER_MAX_CELLS, motesPerCell: INNER_MOTES_PER_CELL, stageCap: INNER_STAGE_CAP},
    stages: INNER_STAGES
  };
}
function innerLearn(state: CharacterState, teacher: string): boolean {
  const w = innerOf(state);
  if (w.learned) return false;
  w.learned = true; w.teacher = teacher; w.cells = innerSeedCells();
  return true;
}
function innerPoint(value: unknown, name: string): number[] {
  const p = value as {[key: string]: unknown};
  if (!p || typeof p !== "object" || Object.keys(p).some(function (k) { return k !== "x" && k !== "y"; }) ||
      !assetInteger(p.x, -INNER_RADIUS, INNER_RADIUS) || !assetInteger(p.y, -INNER_RADIUS, INNER_RADIUS))
    return fail(nkruntime.Codes.INVALID_ARGUMENT, name + " must be {x,y} inside the inner world");
  return [Number(p.x) + INNER_RADIUS, Number(p.y) + INNER_RADIUS];
}
// Move a cell to an empty spot touching other land, or swap two cells. The
// world must stay one connected piece after the change.
function innerArrange(w: InnerWorld, from: number[], to: number[]): void {
  const grid = innerGrid(w), a = grid[from[0] + "," + from[1]], b = grid[to[0] + "," + to[1]];
  if (a === undefined) return fail(nkruntime.Codes.FAILED_PRECONDITION, "No inner world cell at the source");
  if (from[0] === to[0] && from[1] === to[1]) return fail(nkruntime.Codes.INVALID_ARGUMENT, "Choose a different target");
  if (b !== undefined) {
    for (let k = 2; k < 5; k++) { const t = w.cells[a + k]; w.cells[a + k] = w.cells[b + k]; w.cells[b + k] = t; }
    return;
  }
  let touching = false;
  for (let n = 0; n < INNER_NEIGHBORS.length; n++) {
    const j = grid[(to[0] + INNER_NEIGHBORS[n][0]) + "," + (to[1] + INNER_NEIGHBORS[n][1])];
    if (j !== undefined && j !== a) touching = true;
  }
  if (!touching) return fail(nkruntime.Codes.FAILED_PRECONDITION, "The target must touch the rest of the inner world");
  w.cells[a] = to[0]; w.cells[a + 1] = to[1];
  if (innerComponents(w, innerGrid(w), function () { return true; }).length !== 1)
    return fail(nkruntime.Codes.FAILED_PRECONDITION, "Moving this cell would split the inner world");
}

const innerWorldGetRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx);
  if (Object.keys(objectPayload(payload)).length) return fail(nkruntime.Codes.INVALID_ARGUMENT, "No fields are accepted");
  return JSON.stringify({innerWorld: innerView(loadCharacter(nk, userId).state), serverNow: Date.now()});
};
// A human learns Hấp Linh from the spirit beast they share an active contract with.
const innerWorldLearnRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx), input = objectPayload(payload);
  if (Object.keys(input).some(function (k) { return k !== "operationId" && k !== "contractId"; }) ||
      typeof input.operationId !== "string" || typeof input.contractId !== "string")
    return fail(nkruntime.Codes.INVALID_ARGUMENT, "Expected operationId and contractId only");
  const contract = spiritActive(nk, input.contractId, userId).value, teacherId = spiritOther(contract, userId);
  const teacherForm = peekCharacterForm(nk, teacherId);
  if (teacherForm.kind !== "spirit_beast" || !teacherForm.selected)
    return fail(nkruntime.Codes.FAILED_PRECONDITION, "Only a Tinh Linh can teach Hấp Linh");
  const result = commitAssetMutation(nk, userId, input.operationId, "inner_learn", {contractId: input.contractId}, function (next) {
    if (next.form.kind !== "human" || !next.form.selected) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Choose the human form before learning");
    if (!innerLearn(next, "contract:" + teacherId)) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Hấp Linh is already learned");
  }) as {[key: string]: any};
  result.innerWorld = innerView(result.profile);
  return JSON.stringify(result);
};
const innerWorldArrangeRpc: nkruntime.RpcFunction = function (ctx, _logger, nk, payload) {
  const userId = authenticated(ctx), input = objectPayload(payload);
  if (Object.keys(input).some(function (k) { return ["operationId", "from", "to"].indexOf(k) < 0; }) || typeof input.operationId !== "string")
    return fail(nkruntime.Codes.INVALID_ARGUMENT, "Expected operationId, from and to only");
  const from = innerPoint(input.from, "from"), to = innerPoint(input.to, "to");
  consumeQuota(nk, userId, "inner_arrange", 60, 60000);
  const result = commitAssetMutation(nk, userId, input.operationId, "inner_arrange", {from: from, to: to}, function (next) {
    const w = innerOf(next);
    if (!w.learned) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Learn Hấp Linh first");
    innerArrange(w, from, to);
    innerCheckLeap(w);
  }) as {[key: string]: any};
  result.innerWorld = innerView(result.profile);
  return JSON.stringify(result);
};
// world_interact at a teacher point (Bé Mơ at the shrine) teaches a human player.
function innerLearnFromNpc(nk: nkruntime.Nakama, userId: string, pointId: string): JsonObject {
  const profile = loadCharacter(nk, userId).state, current = innerView(profile);
  if (profile.form.kind === "spirit_beast") return {innerWorld: current, message: "Bé Mơ vẫy đuôi: \"Cậu biết Hấp Linh từ bé rồi mà!\""};
  if (current.learned) return {innerWorld: current, message: "Bé Mơ: \"Nhớ thở chậm, để linh năng tự lắng xuống nhé.\""};
  if (!profile.form.selected) return fail(nkruntime.Codes.FAILED_PRECONDITION, "Choose a character form first");
  const result = commitAssetMutation(nk, userId, "inner_learn_" + pointId.replace(/[^a-zA-Z0-9_-]/g, "_"), "inner_learn_npc", {pointId: pointId}, function (next) {
    innerLearn(next, "npc:" + pointId);
  }) as {[key: string]: any};
  return {profile: result.profile, innerWorld: innerView(result.profile),
    message: "Bé Mơ dạy bạn Hấp Linh. Một hạt sáng nhỏ hiện ra trong khoảng tối bên trong bạn."};
}
