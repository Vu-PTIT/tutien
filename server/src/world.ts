interface WorldPoint {
  id: string; x: number; y: number; radius: number; kind: string;
  destination?: string; arrivalX?: number; arrivalY?: number; name?: string; role?: string;
}
interface WorldFieldMobDefinition {
  id: string; enemyId: string; name: string; x: number; y: number; maxHp: number; territoryId?: string;
  attack: number; defense: number; rewardXp: number; rewardItemId?: string; respawnMs: number;
  equipmentDropItemId?: string; equipmentDropBasisPoints?: number; equipmentDropPityKills?: number;
}
interface WorldFieldMobState extends WorldFieldMobDefinition {
  hp: number; generation: number; respawnAt: number; mode: string; equipmentDropPityMisses?: number;
}
interface WorldMapDefinition {
  width: number; height: number; spawnX: number; spawnY: number; solids: number[][]; points: WorldPoint[];
  fieldMobs?: WorldFieldMobDefinition[];
  safeZones?: {id: string; x: number; y: number; radius: number}[];
  territories?: {id: string; enemyId: string; x: number; y: number; radius: number}[];
  waters?: WorldWaterRegion[]; bridges?: number[][]; footprints?: number[][];
  navEdges?: string[]; // RLE rows of hex cardinal masks (W=1,E=2,N=4,S=8).
}
// Species data compiled from server/data/world_population.json.
interface WorldEnemy {
  name: string; tier: number; kind: string; active: string; essence: string[]; storyGate?: string;
}
interface WorldWaterRegion {
  shape: string; points?: number[][]; center_cell?: number[]; radii_cells?: number[]; width_cells?: number;
}
interface WorldSession {
  mapId: string; x: number; y: number; seq: number; updatedAt: number;
  fieldMobsByMap?: {[mapId: string]: WorldFieldMobState[]}; attackReadyAt?: number;
  equipmentPity?: {[itemId: string]: number};
}

const WORLD_TILE = 32;
const WORLD_SPEED = 72;
const WORLD_RADIUS = 8;
// Filled from the generated life world manifest (installLifeWorldMaps).
const WORLD_MAPS: {[key: string]: WorldMapDefinition} = {};
const WORLD_START_MAP = "m_lang_que";
function worldObject(userId: string): nkruntime.StorageReadRequest {
  return {collection:"world_sessions",key:"main",userId:userId};
}
function worldSessionWriteRequest(userId: string,value:WorldSession,version:string):nkruntime.StorageWriteRequest {
  return {collection:"world_sessions",key:"main",userId:userId,value:value,version:version,permissionRead:0,permissionWrite:0};
}
function worldWalkable(map: WorldMapDefinition, point: number[]): boolean {
  const x=point[0], y=point[1];
  if (x<WORLD_RADIUS || y<WORLD_RADIUS || x>=map.width*WORLD_TILE-WORLD_RADIUS || y>=map.height*WORLD_TILE-WORLD_RADIUS) return false;
  const offsets=[[0,0],[-WORLD_RADIUS,0],[WORLD_RADIUS,0],[0,-WORLD_RADIUS],[0,WORLD_RADIUS]];
  for (let i=0;i<offsets.length;i++) {
    const tx=Math.floor((x+offsets[i][0])/WORLD_TILE), ty=Math.floor((y+offsets[i][1])/WORLD_TILE);
    for(let j=0;j<map.solids.length;j++) { const r=map.solids[j]; if(tx>=r[0]&&tx<r[0]+r[2]&&ty>=r[1]&&ty<r[1]+r[3]) return false; }
    const px=x+offsets[i][0],py=y+offsets[i][1];
    const feet=map.footprints||[];
    for(let j=0;j<feet.length;j++) { const r=feet[j]; if(px>=r[0]&&px<r[0]+r[2]&&py>=r[1]&&py<r[1]+r[3]) return false; }
    const cx=px/WORLD_TILE,cy=py/WORLD_TILE;
    const bridges=map.bridges||[];
    let onBridge=false;
    for(let j=0;j<bridges.length;j++) { const r=bridges[j]; if(cx>=r[0]&&cx<=r[0]+r[2]&&cy>=r[1]&&cy<=r[1]+r[3]) onBridge=true; }
    if(!onBridge) for(let j=0;j<(map.waters||[]).length;j++) if(lifeWaterContains(map.waters![j],cx,cy)) return false;
  }
  return true;
}
function worldPathWalkable(map: WorldMapDefinition, from: number[], to: number[]): boolean {
  const dx=to[0]-from[0],dy=to[1]-from[1],distance=Math.sqrt(dx*dx+dy*dy),steps=Math.max(1,Math.ceil(distance/8));
  for(let i=0;i<=steps;i++) { const t=i/steps; if(!worldWalkable(map,[from[0]+dx*t,from[1]+dy*t])) return false; }
  return true;
}
function worldFindPoint(map: WorldMapDefinition, id: string): WorldPoint | undefined {
  for(let i=0;i<map.points.length;i++) if(map.points[i].id===id) return map.points[i];
  return undefined;
}
function worldMapReachable(targetId: string): boolean {
  const target=WORLD_MAPS[targetId];
  if (!target || !worldWalkable(target,[target.spawnX,target.spawnY])) return false;
  const pending: string[] = [WORLD_START_MAP];
  const visited: {[mapId: string]: boolean} = {};
  visited[WORLD_START_MAP] = true;
  while (pending.length > 0) {
    const mapId = pending[0];
    pending.splice(0, 1);
    if (mapId === targetId) return true;
    const map = WORLD_MAPS[mapId];
    for (let i = 0; i < map.points.length; i++) {
      const point = map.points[i];
      if (point.kind !== "gate" || !point.destination || visited[point.destination] || !WORLD_MAPS[point.destination]) continue;
      const destination = WORLD_MAPS[point.destination];
      if (!worldWalkable(map,[point.x,point.y]) || typeof point.arrivalX !== "number" || typeof point.arrivalY !== "number" ||
          !worldWalkable(destination,[point.arrivalX,point.arrivalY])) continue;
      visited[point.destination] = true;
      pending.push(point.destination);
    }
  }
  return false;
}
function worldDistance(ax: number, ay: number, bx: number, by: number): number {
  const dx=ax-bx, dy=ay-by;
  return Math.sqrt(dx*dx+dy*dy);
}
function worldEnsureFieldMobs(session: WorldSession, mapId: string, now: number): boolean {
  let changed = false;
  if (!session.equipmentPity || typeof session.equipmentPity !== "object" || Array.isArray(session.equipmentPity)) {
    session.equipmentPity = {}; changed = true;
  }
  if (!session.fieldMobsByMap) { session.fieldMobsByMap = {}; changed = true; }
  // The map data is the roster: stored mobs keep their live hp/generation, while
  // stats, position and drops always follow the current definitions. Mobs no
  // longer defined (or still story-gated) are dropped.
  const previous = session.fieldMobsByMap[mapId] || [];
  const definitions = (WORLD_MAPS[mapId].fieldMobs || []).filter(worldMobSpawnable);
  const mobs = definitions.map(function (def): WorldFieldMobState {
    let live: WorldFieldMobState | undefined;
    for (let i = 0; i < previous.length; i++) if (previous[i].id === def.id) { live = previous[i]; break; }
    const mob: WorldFieldMobState = {id:def.id,enemyId:def.enemyId,name:def.name,x:def.x,y:def.y,maxHp:def.maxHp,
      attack:def.attack,defense:def.defense,rewardXp:def.rewardXp,rewardItemId:def.rewardItemId,respawnMs:def.respawnMs,
      territoryId:def.territoryId,equipmentDropItemId:def.equipmentDropItemId,
      equipmentDropBasisPoints:def.equipmentDropBasisPoints,equipmentDropPityKills:def.equipmentDropPityKills,
      hp:live ? Math.min(live.hp, def.maxHp) : def.maxHp,generation:live ? live.generation : 1,
      respawnAt:live ? live.respawnAt : 0,mode:live ? live.mode : "idle"};
    if (mob.hp <= 0 && mob.respawnAt > 0 && now >= mob.respawnAt) {
      mob.hp = mob.maxHp; mob.generation++; mob.respawnAt = 0; mob.mode = "idle";
    }
    return mob;
  });
  if (!session.fieldMobsByMap[mapId] || previous.length !== mobs.length) changed = true;
  // Field-by-field: stored JSON may come back with a different key order.
  for (let i = 0; i < mobs.length && !changed; i++) {
    const a = mobs[i] as unknown as {[key: string]: unknown}, b = previous[i] as unknown as {[key: string]: unknown};
    for (const key in a) if (a[key] !== b[key]) { changed = true; break; }
  }
  session.fieldMobsByMap[mapId] = mobs;
  return changed;
}
// Elites and the boss wait for the story system; until then they never spawn.
function worldMobSpawnable(def: WorldFieldMobDefinition): boolean {
  const enemy = WORLD_ENEMIES[def.enemyId];
  return !enemy || !enemy.storyGate;
}
// Day-only and night-only species are hidden (and untargetable) outside their hours.
function worldMobActive(mob: WorldFieldMobDefinition, now: number): boolean {
  const enemy = WORLD_ENEMIES[mob.enemyId];
  if (!enemy || enemy.active === "always") return true;
  return (enemy.active === "night") === lifeIsNight(now);
}
function worldFieldMobSnapshot(session: WorldSession, mapId: string): WorldFieldMobState[] {
  const now=Date.now();
  const source=((session.fieldMobsByMap && session.fieldMobsByMap[mapId]) || []).filter(function (mob) { return worldMobActive(mob, now); });
  const pity=session.equipmentPity || {};
  return source.map(function (mob): WorldFieldMobState {
    return {id:mob.id,enemyId:mob.enemyId,name:mob.name,x:mob.x,y:mob.y,maxHp:mob.maxHp,
      attack:mob.attack,defense:mob.defense,rewardXp:mob.rewardXp,rewardItemId:mob.rewardItemId,
      respawnMs:mob.respawnMs,hp:mob.hp,generation:mob.generation,respawnAt:mob.respawnAt,mode:mob.mode,
      territoryId:mob.territoryId,equipmentDropItemId:mob.equipmentDropItemId,equipmentDropBasisPoints:mob.equipmentDropBasisPoints,
      equipmentDropPityKills:mob.equipmentDropPityKills,
      equipmentDropPityMisses:mob.equipmentDropItemId ? Number(pity[mob.equipmentDropItemId] || 0) : 0};
  });
}
function worldReadSession(nk: nkruntime.Nakama,userId: string,preferredMapId: string = ""): {session:WorldSession,version:string} {
  for(let attempt=0;attempt<5;attempt++) {
    const row=nk.storageRead([worldObject(userId)])[0];
    if(row) {
      const v=row.value;
      if(typeof v.mapId!=="string"||typeof v.x!=="number"||typeof v.y!=="number"||typeof v.seq!=="number"||typeof v.updatedAt!=="number")
        return fail(nkruntime.Codes.FAILED_PRECONDITION,"World position requires review");
      if(!WORLD_MAPS[v.mapId]) {
        // The map was retired (e.g. the old An Khê prototype route): move the player
        // to the village spawn and forget field state kept for maps that are gone.
        const moved=JSON.parse(JSON.stringify(v)) as WorldSession,start=WORLD_MAPS[WORLD_START_MAP];
        moved.mapId=WORLD_START_MAP; moved.x=start.spawnX; moved.y=start.spawnY; moved.seq=v.seq+1; moved.updatedAt=Date.now();
        const kept: {[mapId: string]: WorldFieldMobState[]} = {};
        for(const id in moved.fieldMobsByMap||{}) if(WORLD_MAPS[id]) kept[id]=moved.fieldMobsByMap![id];
        moved.fieldMobsByMap=kept;
        try {
          const version=nk.storageWrite([worldSessionWriteRequest(userId,moved,row.version)])[0].version;
          return {session:moved,version:version};
        } catch(_error) { continue; }
      }
      if(!worldWalkable(WORLD_MAPS[v.mapId],[v.x,v.y])) return fail(nkruntime.Codes.FAILED_PRECONDITION,"World position requires review");
      const startingMap=WORLD_MAPS[WORLD_START_MAP];
      if(preferredMapId&&preferredMapId!==WORLD_START_MAP&&v.mapId===WORLD_START_MAP&&v.x===startingMap.spawnX&&v.y===startingMap.spawnY&&v.seq===0) {
        const preferredMap=WORLD_MAPS[preferredMapId];
        if(preferredMap&&worldMapReachable(preferredMapId)) {
          const adopted=JSON.parse(JSON.stringify(v)) as WorldSession;
          adopted.mapId=preferredMapId; adopted.x=preferredMap.spawnX; adopted.y=preferredMap.spawnY; adopted.updatedAt=Date.now();
          try {
            const version=nk.storageWrite([worldSessionWriteRequest(userId,adopted,row.version)])[0].version;
            return {session:adopted,version:version};
          } catch(_error) { continue; }
        }
      }
      return {session:v as WorldSession,version:row.version};
    }
    const initialMapId=preferredMapId&&worldMapReachable(preferredMapId)?preferredMapId:WORLD_START_MAP;
    const map=WORLD_MAPS[initialMapId];
    const value:WorldSession={mapId:initialMapId,x:map.spawnX,y:map.spawnY,seq:0,updatedAt:Date.now(),fieldMobsByMap:{},attackReadyAt:0};
    try {
      const version=nk.storageWrite([{collection:"world_sessions",key:"main",userId:userId,value:value,version:"*",permissionRead:0,permissionWrite:0}])[0].version;
      return {session:value,version:version};
    } catch(_error) { /* Another first request may have won the create CAS. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE,"World session is busy; retry");
}
function worldWrite(nk:nkruntime.Nakama,userId:string,value:WorldSession,version:string):string {
  const character=loadCharacter(nk,userId);
  lifeEnsureIdle(character.state,Date.now());
  // The unchanged profile is a CAS witness: activity_start cannot race a move.
  return nk.storageWrite([worldSessionWriteRequest(userId,value,version)].concat(
    characterWrites(userId,character.state,character)))[0].version;
}
const worldGetRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx);
  const input=objectPayload(payload);
  if(Object.keys(input).some(k=>k!=="preferredMapId")) return fail(nkruntime.Codes.INVALID_ARGUMENT,"Only preferredMapId is accepted");
  let preferredMapId="";
  if(input.preferredMapId!==undefined) {
    if(typeof input.preferredMapId!=="string"||!WORLD_MAPS[input.preferredMapId]||!worldMapReachable(input.preferredMapId))
      return fail(nkruntime.Codes.INVALID_ARGUMENT,"Preferred starting map is not reachable");
    preferredMapId=input.preferredMapId;
  }
  for(let attempt=0;attempt<5;attempt++) {
    const loaded=loadCharacter(nk,userId);
    const current=worldReadSession(nk,userId,preferredMapId),session=JSON.parse(JSON.stringify(current.session)) as WorldSession;
    const changed=worldEnsureFieldMobs(session,session.mapId,Date.now());
    if(changed&&(!loaded.state.activitySession||loaded.state.activitySession.settlement==="settled")) {
      try { worldWrite(nk,userId,session,current.version); } catch(_error) { continue; }
    }
    const activity=lifeSessionView(loaded.state.activitySession,Date.now());
    const position=activity&&activity.state!=="cancelled"&&activity.settlement!=="settled" ? lifePosition(loaded.state.activitySession,Date.now()) : session;
    return JSON.stringify({mapId:position.mapId,x:position.x,y:position.y,seq:session.seq,
      fieldMobs:worldFieldMobSnapshot(session,position.mapId),activity:activity,lifeWorldRevision:LIFE_WORLD_REVISION});
  }
  return fail(nkruntime.Codes.UNAVAILABLE,"World field state is busy; retry");
};
// The prototype client renders/collides against this server manifest, never a
// second hand-maintained copy of online map geometry.
const worldMapGetRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=objectPayload(payload);
  if(Object.keys(input).length) return fail(nkruntime.Codes.INVALID_ARGUMENT,"No input fields are accepted");
  const session=worldReadSession(nk,userId).session,map=WORLD_MAPS[session.mapId];
  return JSON.stringify({mapId:session.mapId,width:map.width*WORLD_TILE,height:map.height*WORLD_TILE,
    tileSize:WORLD_TILE,radius:WORLD_RADIUS,speed:WORLD_SPEED,solids:map.solids,
    footprints:map.footprints||[],waters:map.waters||[],bridges:map.bridges||[],points:map.points,
    safeZones:map.safeZones||[],territories:map.territories||[]});
};
const worldTravelRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=objectPayload(payload);
  if(Object.keys(input).length!==1||typeof input.mapId!=="string"||!WORLD_MAPS[input.mapId]||!worldMapReachable(input.mapId))
    return fail(nkruntime.Codes.INVALID_ARGUMENT,"Map is not reachable");
  lifeGuardWorldAction(nk,userId);
  for(let attempt=0;attempt<5;attempt++) {
    lifeGuardWorldAction(nk,userId);
    const current=worldReadSession(nk,userId),session=current.session;
    const next=JSON.parse(JSON.stringify(session)) as WorldSession;
    if(session.mapId===input.mapId) {
      if(worldEnsureFieldMobs(next,next.mapId,Date.now())) {
        try { worldWrite(nk,userId,next,current.version); } catch(_error) { continue; }
      }
      return JSON.stringify({mapId:next.mapId,x:next.x,y:next.y,seq:next.seq,
        fieldMobs:worldFieldMobSnapshot(next,next.mapId),message:"Bạn đang ở khu vực này."});
    }
    const target=WORLD_MAPS[input.mapId];
    next.mapId=input.mapId; next.x=target.spawnX; next.y=target.spawnY;
    next.seq=Number(next.seq||0)+1; next.updatedAt=Date.now();
    worldEnsureFieldMobs(next,next.mapId,Date.now());
    try {
      worldWrite(nk,userId,next,current.version);
      return JSON.stringify({mapId:next.mapId,x:next.x,y:next.y,seq:next.seq,
        fieldMobs:worldFieldMobSnapshot(next,next.mapId),message:"Đã chuyển khu vực theo tuyến bản đồ."});
    } catch(_error) { /* Retry after a concurrent world movement or map change. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE,"World map transition is busy; retry");
};
const worldMoveRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=objectPayload(payload);
  if(Object.keys(input).some(k=>["x","y","seq"].indexOf(k)<0)||typeof input.x!=="number"||!isFinite(input.x)||typeof input.y!=="number"||!isFinite(input.y)||typeof input.seq!=="number"||!isFinite(input.seq)||input.seq%1!==0||input.seq<1)
    return fail(nkruntime.Codes.INVALID_ARGUMENT,"Expected x, y and positive integer seq");
  lifeGuardWorldAction(nk,userId);
  for(let attempt=0;attempt<5;attempt++) {
    lifeGuardWorldAction(nk,userId);
    const current=worldReadSession(nk,userId),s=current.session,map=WORLD_MAPS[s.mapId];
    if(input.seq===s.seq&&input.x===s.x&&input.y===s.y) return JSON.stringify({mapId:s.mapId,x:s.x,y:s.y,seq:s.seq,replayed:true});
    if(input.seq<=s.seq) return fail(nkruntime.Codes.ABORTED,"Stale world movement sequence");
    const distance=worldDistance(input.x,input.y,s.x,s.y),elapsed=Math.max(0,(Date.now()-s.updatedAt)/1000);
    const maxDistance=WORLD_SPEED*Math.min(elapsed,3)*1.35+10;
    if(distance>maxDistance) return fail(nkruntime.Codes.INVALID_ARGUMENT,"World movement exceeds server speed limit");
    if(!worldPathWalkable(map,[s.x,s.y],[input.x,input.y])) return fail(nkruntime.Codes.INVALID_ARGUMENT,"World movement crosses a blocker");
    const next=JSON.parse(JSON.stringify(s)) as WorldSession;
    next.x=input.x; next.y=input.y; next.seq=input.seq; next.updatedAt=Date.now();
    worldEnsureFieldMobs(next,next.mapId,Date.now());
    try { worldWrite(nk,userId,next,current.version); return JSON.stringify({mapId:next.mapId,x:next.x,y:next.y,seq:next.seq,replayed:false,
      fieldMobs:worldFieldMobSnapshot(next,next.mapId)}); }
    catch(_error) { /* CAS retry */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE,"World position is busy; retry");
};
const worldInteractRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=objectPayload(payload);
  if(Object.keys(input).length!==1||typeof input.entityId!=="string") return fail(nkruntime.Codes.INVALID_ARGUMENT,"Only entityId is accepted");
  lifeGuardWorldAction(nk,userId);
  const current=worldReadSession(nk,userId),session=current.session,map=WORLD_MAPS[session.mapId];
  const point=worldFindPoint(map,input.entityId);
  if(!point) return fail(nkruntime.Codes.NOT_FOUND,"This object is not interactable in the current map");
  const centerX=point.x,centerY=point.y;
  if(worldDistance(session.x,session.y,centerX,centerY)>point.radius*WORLD_TILE) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Move closer to interact");
  if(!worldPathWalkable(map,[session.x,session.y],[centerX,centerY])) return fail(nkruntime.Codes.FAILED_PRECONDITION,"A blocker is between you and this object");
  if(point.kind==="locked") return fail(nkruntime.Codes.FAILED_PRECONDITION,"Lối này chưa mở trong phần chơi hiện tại.");
  if(point.kind==="gate") {
    for(let attempt=0;attempt<5;attempt++) {
      lifeGuardWorldAction(nk,userId);
      const latest=worldReadSession(nk,userId),latestSession=latest.session,latestMap=WORLD_MAPS[latestSession.mapId];
      const gate=worldFindPoint(latestMap,input.entityId);
      if(!gate||gate.kind!=="gate") return fail(nkruntime.Codes.NOT_FOUND,"This gate is no longer on the current map");
      if(worldDistance(latestSession.x,latestSession.y,gate.x,gate.y)>gate.radius*WORLD_TILE)
        return fail(nkruntime.Codes.FAILED_PRECONDITION,"Move closer to interact");
      if(!worldPathWalkable(latestMap,[latestSession.x,latestSession.y],[gate.x,gate.y]))
        return fail(nkruntime.Codes.FAILED_PRECONDITION,"A blocker is between you and this object");
      if(!gate.destination||!WORLD_MAPS[gate.destination]||typeof gate.arrivalX!=="number"||typeof gate.arrivalY!=="number"||
          !worldWalkable(WORLD_MAPS[gate.destination],[gate.arrivalX,gate.arrivalY]))
        return fail(nkruntime.Codes.FAILED_PRECONDITION,"Gate destination requires review");
      const next=JSON.parse(JSON.stringify(latestSession)) as WorldSession;
      next.mapId=gate.destination; next.x=gate.arrivalX; next.y=gate.arrivalY;
      next.seq=Number(next.seq||0)+1; next.updatedAt=Date.now();
      worldEnsureFieldMobs(next,next.mapId,Date.now());
      try {
        worldWrite(nk,userId,next,latest.version);
        return JSON.stringify({mapId:next.mapId,x:next.x,y:next.y,seq:next.seq,
          fieldMobs:worldFieldMobSnapshot(next,next.mapId),message:"Đã đi qua cổng do máy chủ xác nhận."});
      } catch(_error) { /* Retry after a concurrent movement or map transition. */ }
    }
    return fail(nkruntime.Codes.UNAVAILABLE,"World gate is busy; retry interaction");
  }
  if(point.kind==="teacher") return JSON.stringify(innerLearnFromNpc(nk,userId,point.id));
  if(point.kind==="npc") return JSON.stringify({mapId:session.mapId,x:session.x,y:session.y,
    npc:{id:point.id,name:point.name||"",role:point.role||""},message:(point.name||"")+" • "+(point.role||"")});
  if(point.kind==="life") return JSON.stringify({site:lifeSite(point.id),actions:lifeSite(point.id).type==="gardening"?["plant","harvest"]:["start"],serverNow:Date.now()});
  // Shops are used through economy_action while standing here.
  return JSON.stringify({mapId:session.mapId,x:session.x,y:session.y,service:point.kind,
    message:point.kind==="shop"?"Chợ phiên: mua bán ngay tại đây.":"Không có gì để làm ở đây."});
};

const worldAttackRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=objectPayload(payload);
  lifeGuardWorldAction(nk,userId);
  if(Object.keys(input).some(function(key){return key!=="targetId"&&key!=="skillId";})||
      typeof input.targetId!=="string"||(input.skillId!==undefined&&typeof input.skillId!=="string"))
    return fail(nkruntime.Codes.INVALID_ARGUMENT,"Expected targetId and optional skillId only");
  const requestedSkillId=typeof input.skillId==="string"?input.skillId:"";
  const activeSkill=requestedSkillId?catalogSkill(requestedSkillId):undefined;
  if(requestedSkillId&&(!activeSkill||activeSkill.equipSlot!=="active_1"))
    return fail(nkruntime.Codes.FAILED_PRECONDITION,"Skill cannot be used in the active slot");
  for(let attempt=0;attempt<5;attempt++) {
    const current=worldReadSession(nk,userId),session=JSON.parse(JSON.stringify(current.session)) as WorldSession;
    const map=WORLD_MAPS[session.mapId];
    worldEnsureFieldMobs(session,session.mapId,Date.now());
    const mobs=session.fieldMobsByMap![session.mapId];
    let target:WorldFieldMobState|undefined;
    for(let i=0;i<mobs.length;i++) if(mobs[i].id===input.targetId) { target=mobs[i]; break; }
    const now=Date.now();
    if(!target||!worldMobActive(target,now)) return fail(nkruntime.Codes.NOT_FOUND,"This monster is not on the current map");
    if(target.hp<=0) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Monster is down; wait for it to respawn");
    if(now<Number(session.attackReadyAt||0)) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED,"Attack is recovering");
    if(worldDistance(session.x,session.y,target.x,target.y)>WORLD_TILE*2.2||!worldPathWalkable(map,[session.x,session.y],[target.x,target.y]))
      return fail(nkruntime.Codes.FAILED_PRECONDITION,"Move closer to the monster before attacking");
    const profile=loadCharacter(nk,userId).state;
    if(activeSkill&&(profile.equippedSkills.active_1!==requestedSkillId||profile.learnedSkills.indexOf(requestedSkillId)<0))
      return fail(nkruntime.Codes.FAILED_PRECONDITION,"Equip and learn this skill before using it");
    let attack=16+(activeSkill?Number(activeSkill.powerBonus||0):0)+innerCombatBonus(profile).attack;
    for(let i=0;i<profile.inventory.length;i++) {
      const item=profile.inventory[i],definition=catalogItem(item.itemId);
      if(item.instanceId===profile.equipped.weapon&&definition.equipSlot==="weapon") attack+=Number(definition.attackBonus||0);
    }
    const damage=Math.max(1,Math.floor(attack*100/(100+target.defense)));
    target.hp=Math.max(0,target.hp-damage); target.mode=target.hp===0?"dead":"hit";
    session.attackReadyAt=now+(activeSkill?Number(activeSkill.cooldownMs||700):700);
    if(target.hp===0) {
      target.respawnAt=now+target.respawnMs;
      // Species without a catalog drop yet still release linh năng.
      const items=target.rewardItemId?[{itemId:target.rewardItemId,quantity:1}]:[];
      let equipmentDropped=false,pityGuaranteed=false,pityMisses=0,pityLimit=0;
      if(target.equipmentDropItemId&&Number(target.equipmentDropBasisPoints||0)>0) {
        const itemId=target.equipmentDropItemId;
        pityLimit=Math.max(1,Math.floor(Number(target.equipmentDropPityKills||1)));
        const pity=session.equipmentPity || (session.equipmentPity={});
        const storedMisses=Math.floor(Number(pity[itemId] || 0));
        const previousMisses=storedMisses>=0?Math.min(storedMisses,pityLimit):0;
        const lootHash=nk.sha256Hash(userId+":world:"+session.mapId+":"+target.id+":"+target.generation);
        const lootRoll=(parseInt(lootHash.substring(0,4),16)%100)*100;
        pityGuaranteed=previousMisses+1>=pityLimit;
        if(pityGuaranteed||lootRoll<Number(target.equipmentDropBasisPoints)) {
          items.push({itemId:itemId,quantity:1});
          equipmentDropped=true;
          pity[itemId]=0;
        } else {
          pityMisses=previousMisses+1;
          pity[itemId]=pityMisses;
        }
      }
      const reward=grantReward(nk,userId,"field_"+target.id.replace(/[^a-zA-Z0-9_-]/g,"_")+"_"+target.generation,
        "world:"+session.mapId+":"+target.id+":"+target.generation,
        {spiritStones:0,items:items,
          linhNang:innerMobEssence(target.enemyId)},
        [worldSessionWriteRequest(userId,session,current.version)]);
      const rewardData=reward as {[key:string]:any};
      const equipmentName=target.equipmentDropItemId?catalogItem(target.equipmentDropItemId).name:"";
      const lootText=equipmentDropped?"rơi "+equipmentName+(pityGuaranteed?" (bảo đảm)":"")+" và vật phẩm săn":items.length?"nhận vật phẩm săn":"thu linh năng";
      const pityText=!equipmentDropped&&equipmentName? " • "+equipmentName+" "+pityMisses+"/"+pityLimit+" lượt tới mốc bảo đảm":"";
      const pityStatus=equipmentName?{itemId:target.equipmentDropItemId,misses:pityMisses,guaranteedAfter:pityLimit,guaranteed:pityGuaranteed}:null;
      return JSON.stringify({mapId:session.mapId,x:session.x,y:session.y,damage:damage,killed:true,
        profile:rewardData.profile,receipt:rewardData.receipt,fieldMobs:worldFieldMobSnapshot(session,session.mapId),
        equipmentPity:pityStatus,skillId:requestedSkillId,
        message:(activeSkill?activeSkill.name+" • ":"")+"Đã hạ "+target.name+" • "+lootText+pityText+"."});
    }
    try {
      worldWrite(nk,userId,session,current.version);
      return JSON.stringify({mapId:session.mapId,x:session.x,y:session.y,damage:damage,killed:false,
        fieldMobs:worldFieldMobSnapshot(session,session.mapId),skillId:requestedSkillId,
        message:(activeSkill?activeSkill.name+" • ":"")+"Đã gây "+damage+" sát thương lên "+target.name+"."});
    } catch(_error) { /* Retry after a concurrent world movement or attack. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE,"World combat is busy; retry");
};

// Each RPC VM evaluates the bundle independently of the initializer VM.
// Install immutable map data in every VM before any RPC runs.
installLifeWorldMaps();
