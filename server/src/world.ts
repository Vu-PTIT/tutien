interface WorldPoint {
  id: string; x: number; y: number; radius: number; kind: string;
  destination?: string; arrivalX?: number; arrivalY?: number;
}
interface WorldFieldMobDefinition {
  id: string; enemyId: string; name: string; x: number; y: number; maxHp: number;
  attack: number; defense: number; rewardXp: number; rewardItemId: string; respawnMs: number;
  equipmentDropItemId?: string; equipmentDropBasisPoints?: number;
}
interface WorldFieldMobState extends WorldFieldMobDefinition {
  hp: number; generation: number; respawnAt: number; mode: string;
}
interface WorldMapDefinition {
  width: number; height: number; spawnX: number; spawnY: number; solids: number[][]; points: WorldPoint[];
  fieldMobs?: WorldFieldMobDefinition[];
}
interface WorldSession {
  mapId: string; x: number; y: number; seq: number; updatedAt: number;
  fieldMobsByMap?: {[mapId: string]: WorldFieldMobState[]}; attackReadyAt?: number;
}

const WORLD_TILE = 32;
const WORLD_SPEED = 72;
const WORLD_RADIUS = 8;
const WORLD_MAPS: {[key: string]: WorldMapDefinition} = {
  m_an_khe: {width: 48, height: 36, spawnX: 768, spawnY: 576, solids: [
    [0,0,48,1],[0,35,48,1],[0,0,1,36],[47,0,1,36],[42,1,5,34],
    [5,7,4,4],[27,7,4,3],[31,16,4,2],[37,17,4,3],[5,25,4,3],[23,26,4,3],[39,8,2,2],[19,32,1,1]
  ], points: [
    {id:"ak.npc.ba_sam",x:240,y:384,radius:1.8,kind:"npc"},
    {id:"ak.npc.luc_vi",x:768,y:992,radius:1.8,kind:"npc"},
    {id:"ak.shrine.breathing",x:800,y:640,radius:1.7,kind:"shrine"},
    {id:"ak.service.do_khe",x:1024,y:480,radius:1.8,kind:"service"},
    {id:"ak.board.village",x:480,y:544,radius:1.7,kind:"service"},
    {id:"ak.market.village",x:1248,y:672,radius:1.7,kind:"shop"},
    {id:"ak.garden.home",x:320,y:864,radius:1.8,kind:"garden"},
    {id:"ak.gate.truc_am",x:704,y:96,radius:1.8,kind:"gate",destination:"m_truc_am",arrivalX:160,arrivalY:928}
  ]},
  m_truc_am: {width:48,height:36,spawnX:160,spawnY:928,solids:[
    [0,0,48,1],[0,35,48,1],[0,0,1,36],[47,0,1,36],[9,4,7,6],[20,3,10,6],
    [34,5,9,6],[18,20,9,7],[34,23,9,7],[27,13,3,4]
  ],points:[
    {id:"ta.node.cam_lo",x:160,y:544,radius:1.7,kind:"resource"},
    {id:"ta.poi.water_trace_west",x:256,y:576,radius:1.7,kind:"scan"},
    {id:"ta.mach_ban.scan",x:896,y:576,radius:1.6,kind:"scan"},
    {id:"ta.poi.water_trace_east",x:448,y:960,radius:1.7,kind:"scan"},
    {id:"ta.trail.boar_sign",x:1072,y:560,radius:1.8,kind:"encounter"},
    {id:"ta.gate.thach_can",x:1408,y:128,radius:1.8,kind:"gate",destination:"m_thach_can",arrivalX:128,arrivalY:544},
    {id:"ta.retreat.ankhe",x:160,y:992,radius:1.8,kind:"gate",destination:"m_an_khe",arrivalX:704,arrivalY:128}
  ], fieldMobs:[
    {id:"ta.mob.son_tru.01",enemyId:"en_boar",name:"Sơn Trư",x:1136,y:560,maxHp:60,attack:12,defense:5,rewardXp:10,rewardItemId:"it_boar_hide",respawnMs:45000,equipmentDropItemId:"it_iron_sword",equipmentDropBasisPoints:2000},
    {id:"ta.mob.son_tru.02",enemyId:"en_boar",name:"Sơn Trư",x:1200,y:592,maxHp:60,attack:12,defense:5,rewardXp:10,rewardItemId:"it_boar_hide",respawnMs:45000},
    {id:"ta.mob.doc_chu.01",enemyId:"en_spider",name:"Độc Chu",x:464,y:560,maxHp:45,attack:8,defense:0,rewardXp:15,rewardItemId:"it_spider_silk",respawnMs:60000},
    {id:"ta.mob.doc_chu.02",enemyId:"en_spider",name:"Độc Chu",x:528,y:592,maxHp:45,attack:8,defense:0,rewardXp:15,rewardItemId:"it_spider_silk",respawnMs:60000,equipmentDropItemId:"it_cloth_armor",equipmentDropBasisPoints:1000}
  ]},
  m_thach_can: {width:48,height:36,spawnX:288,spawnY:576,solids:[
    [0,0,48,1],[0,35,48,1],[0,0,1,36],[47,0,1,36],
    [5,4,10,5],[20,8,4,13],[28,4,7,6],[34,13,3,8],
    [8,27,10,5],[38,26,8,7],[26,30,8,4]
  ],points:[
    {id:"tc.checkpoint.ngoai_vi",x:160,y:992,radius:1.8,kind:"service"},
    {id:"tc.node.iron_ore",x:992,y:672,radius:1.8,kind:"resource"},
    {id:"tc.mach_ban.flow_pillar",x:1344,y:576,radius:1.8,kind:"scan"},
    {id:"tc.retreat.truc_am",x:96,y:576,radius:1.8,kind:"gate",destination:"m_truc_am",arrivalX:1344,arrivalY:128},
    {id:"tc.gate.co_tinh",x:1344,y:768,radius:1.8,kind:"gate",destination:"m_co_tinh",arrivalX:352,arrivalY:800}
  ]},
  m_co_tinh: {width:48,height:36,spawnX:352,spawnY:992,solids:[
    [0,0,48,1],[0,35,48,1],[0,0,1,36],[47,0,1,36],
    [1,8,3,11],[10,8,4,13],[16,1,4,9],[27,1,4,9],[33,4,2,4],[41,3,2,4],
    [36,10,2,3],[44,10,2,3],[33,22,3,2],[40,22,3,2],[32,24,2,5],
    [42,24,2,5],[33,29,3,2],[40,29,3,2],[3,27,6,5]
  ],points:[
    {id:"ct.checkpoint.entrance",x:352,y:992,radius:1.8,kind:"service"},
    {id:"ct.mach_ban.balance",x:736,y:352,radius:1.8,kind:"scan"},
    {id:"ct.formation.panel",x:1216,y:352,radius:1.8,kind:"service"},
    {id:"ct.boss.heart_well",x:1152,y:832,radius:1.8,kind:"service"},
    {id:"ct.retreat.thach_can",x:256,y:800,radius:1.8,kind:"gate",destination:"m_thach_can",arrivalX:1280,arrivalY:768}
  ]}
};
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
  const pending: string[] = ["m_an_khe"];
  const visited: {[mapId: string]: boolean} = {"m_an_khe": true};
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
  if (!session.fieldMobsByMap) { session.fieldMobsByMap = {}; changed = true; }
  if (!session.fieldMobsByMap[mapId]) {
    const definitions = WORLD_MAPS[mapId].fieldMobs || [];
    session.fieldMobsByMap[mapId] = definitions.map(function (mob): WorldFieldMobState {
      return {id:mob.id,enemyId:mob.enemyId,name:mob.name,x:mob.x,y:mob.y,maxHp:mob.maxHp,
        attack:mob.attack,defense:mob.defense,rewardXp:mob.rewardXp,rewardItemId:mob.rewardItemId,
        respawnMs:mob.respawnMs,equipmentDropItemId:mob.equipmentDropItemId,
        equipmentDropBasisPoints:mob.equipmentDropBasisPoints,hp:mob.maxHp,generation:1,respawnAt:0,mode:"idle"};
    });
    changed = true;
  }
  const mobs = session.fieldMobsByMap[mapId];
  const definitions = WORLD_MAPS[mapId].fieldMobs || [];
  for (let i = 0; i < mobs.length; i++) {
    const mob = mobs[i];
    for (let j = 0; j < definitions.length; j++) {
      if (definitions[j].id !== mob.id) continue;
      if (definitions[j].equipmentDropItemId && !mob.equipmentDropItemId) {
        mob.equipmentDropItemId = definitions[j].equipmentDropItemId;
        mob.equipmentDropBasisPoints = definitions[j].equipmentDropBasisPoints;
        changed = true;
      }
      break;
    }
    if (mob.hp <= 0 && mob.respawnAt > 0 && now >= mob.respawnAt) {
      mob.hp = mob.maxHp; mob.generation++; mob.respawnAt = 0; mob.mode = "idle"; changed = true;
    }
  }
  return changed;
}
function worldFieldMobSnapshot(session: WorldSession, mapId: string): WorldFieldMobState[] {
  const source=(session.fieldMobsByMap && session.fieldMobsByMap[mapId]) || [];
  return source.map(function (mob): WorldFieldMobState {
    return {id:mob.id,enemyId:mob.enemyId,name:mob.name,x:mob.x,y:mob.y,maxHp:mob.maxHp,
      attack:mob.attack,defense:mob.defense,rewardXp:mob.rewardXp,rewardItemId:mob.rewardItemId,
      respawnMs:mob.respawnMs,hp:mob.hp,generation:mob.generation,respawnAt:mob.respawnAt,mode:mob.mode};
  });
}
function worldReadSession(nk: nkruntime.Nakama,userId: string,preferredMapId: string = ""): {session:WorldSession,version:string} {
  for(let attempt=0;attempt<5;attempt++) {
    const row=nk.storageRead([worldObject(userId)])[0];
    if(row) {
      const v=row.value;
      if(!WORLD_MAPS[v.mapId]||typeof v.x!=="number"||typeof v.y!=="number"||typeof v.seq!=="number"||typeof v.updatedAt!=="number"||!worldWalkable(WORLD_MAPS[v.mapId],[v.x,v.y]))
        return fail(nkruntime.Codes.FAILED_PRECONDITION,"World position requires review");
      const startingMap=WORLD_MAPS.m_an_khe;
      if(preferredMapId&&preferredMapId!=="m_an_khe"&&v.mapId==="m_an_khe"&&v.x===startingMap.spawnX&&v.y===startingMap.spawnY&&v.seq===0) {
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
    const initialMapId=preferredMapId&&worldMapReachable(preferredMapId)?preferredMapId:"m_an_khe";
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
  return nk.storageWrite([worldSessionWriteRequest(userId,value,version)])[0].version;
}
const worldGetRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),loaded=loadCharacter(nk,userId);
  const input=objectPayload(payload);
  if(Object.keys(input).some(k=>k!=="preferredMapId")) return fail(nkruntime.Codes.INVALID_ARGUMENT,"Only preferredMapId is accepted");
  let preferredMapId="";
  if(input.preferredMapId!==undefined) {
    if(typeof input.preferredMapId!=="string"||!WORLD_MAPS[input.preferredMapId]||!worldMapReachable(input.preferredMapId))
      return fail(nkruntime.Codes.INVALID_ARGUMENT,"Preferred starting map is not reachable");
    preferredMapId=input.preferredMapId;
  }
  for(let attempt=0;attempt<5;attempt++) {
    const current=worldReadSession(nk,userId,preferredMapId),session=JSON.parse(JSON.stringify(current.session)) as WorldSession;
    const changed=worldEnsureFieldMobs(session,session.mapId,Date.now());
    if(changed) { try { worldWrite(nk,userId,session,current.version); } catch(_error) { continue; } }
    return JSON.stringify({mapId:session.mapId,x:session.x,y:session.y,seq:session.seq,quest:worldQuestView(loaded.state),
      fieldMobs:worldFieldMobSnapshot(session,session.mapId)});
  }
  return fail(nkruntime.Codes.UNAVAILABLE,"World field state is busy; retry");
};
const worldTravelRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=objectPayload(payload);
  if(Object.keys(input).length!==1||typeof input.mapId!=="string"||!WORLD_MAPS[input.mapId]||!worldMapReachable(input.mapId))
    return fail(nkruntime.Codes.INVALID_ARGUMENT,"Map is not reachable");
  for(let attempt=0;attempt<5;attempt++) {
    const current=worldReadSession(nk,userId),session=current.session;
    const next=JSON.parse(JSON.stringify(session)) as WorldSession;
    if(session.mapId===input.mapId) {
      if(worldEnsureFieldMobs(next,next.mapId,Date.now())) {
        try { worldWrite(nk,userId,next,current.version); } catch(_error) { continue; }
      }
      return JSON.stringify({mapId:next.mapId,x:next.x,y:next.y,seq:next.seq,quest:worldQuestView(loadCharacter(nk,userId).state),
        fieldMobs:worldFieldMobSnapshot(next,next.mapId),message:"Bạn đang ở khu vực này."});
    }
    const target=WORLD_MAPS[input.mapId];
    next.mapId=input.mapId; next.x=target.spawnX; next.y=target.spawnY;
    next.seq=Number(next.seq||0)+1; next.updatedAt=Date.now();
    worldEnsureFieldMobs(next,next.mapId,Date.now());
    try {
      worldWrite(nk,userId,next,current.version);
      return JSON.stringify({mapId:next.mapId,x:next.x,y:next.y,seq:next.seq,quest:worldQuestView(loadCharacter(nk,userId).state),
        fieldMobs:worldFieldMobSnapshot(next,next.mapId),message:"Đã chuyển khu vực theo tuyến bản đồ."});
    } catch(_error) { /* Retry after a concurrent world movement or map change. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE,"World map transition is busy; retry");
};
const worldMoveRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=objectPayload(payload);
  if(Object.keys(input).some(k=>["x","y","seq"].indexOf(k)<0)||typeof input.x!=="number"||typeof input.y!=="number"||typeof input.seq!=="number"||input.seq%1!==0||input.seq<1)
    return fail(nkruntime.Codes.INVALID_ARGUMENT,"Expected x, y and positive integer seq");
  for(let attempt=0;attempt<5;attempt++) {
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
  const current=worldReadSession(nk,userId),session=current.session,map=WORLD_MAPS[session.mapId];
  const point=worldFindPoint(map,input.entityId);
  if(!point) return fail(nkruntime.Codes.NOT_FOUND,"This object is not interactable in the current map");
  const centerX=point.x,centerY=point.y;
  if(worldDistance(session.x,session.y,centerX,centerY)>point.radius*WORLD_TILE) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Move closer to interact");
  if(!worldPathWalkable(map,[session.x,session.y],[centerX,centerY])) return fail(nkruntime.Codes.FAILED_PRECONDITION,"A blocker is between you and this object");
  if(point.kind==="locked") return fail(nkruntime.Codes.FAILED_PRECONDITION,"Lối sang Thạch Cạn chưa mở trong phần chơi hiện tại.");
  if(point.kind==="gate") {
    for(let attempt=0;attempt<5;attempt++) {
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
        return JSON.stringify({mapId:next.mapId,x:next.x,y:next.y,seq:next.seq,quest:worldQuestView(loadCharacter(nk,userId).state),
          fieldMobs:worldFieldMobSnapshot(next,next.mapId),message:"Đã đi qua cổng do máy chủ xác nhận."});
      } catch(_error) { /* Retry after a concurrent movement or map transition. */ }
    }
    return fail(nkruntime.Codes.UNAVAILABLE,"World gate is busy; retry interaction");
  }
  if(point.kind==="resource") {
    const gathered=gatherWorldResource(nk,userId,input.entityId);
    return JSON.stringify({mapId:session.mapId,x:session.x,y:session.y,profile:gathered.profile,
      message:"Đã thu thập tài nguyên. Nút sẽ hồi lại sau một phút."});
  }
  const result=applyWorldQuestInteraction(nk,userId,input.entityId);
  return JSON.stringify({mapId:session.mapId,x:session.x,y:session.y,quest:result.quest,profile:result.profile,message:result.message});
};

const worldAttackRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=objectPayload(payload);
  if(Object.keys(input).length!==1||typeof input.targetId!=="string") return fail(nkruntime.Codes.INVALID_ARGUMENT,"Only targetId is accepted");
  for(let attempt=0;attempt<5;attempt++) {
    const current=worldReadSession(nk,userId),session=JSON.parse(JSON.stringify(current.session)) as WorldSession;
    const map=WORLD_MAPS[session.mapId];
    worldEnsureFieldMobs(session,session.mapId,Date.now());
    const mobs=session.fieldMobsByMap![session.mapId];
    let target:WorldFieldMobState|undefined;
    for(let i=0;i<mobs.length;i++) if(mobs[i].id===input.targetId) { target=mobs[i]; break; }
    if(!target) return fail(nkruntime.Codes.NOT_FOUND,"This monster is not on the current map");
    const now=Date.now();
    if(target.hp<=0) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Monster is down; wait for it to respawn");
    if(now<Number(session.attackReadyAt||0)) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED,"Attack is recovering");
    if(worldDistance(session.x,session.y,target.x,target.y)>WORLD_TILE*2.2||!worldPathWalkable(map,[session.x,session.y],[target.x,target.y]))
      return fail(nkruntime.Codes.FAILED_PRECONDITION,"Move closer to the monster before attacking");
    const profile=loadCharacter(nk,userId).state;
    let attack=16;
    for(let i=0;i<profile.inventory.length;i++) {
      const item=profile.inventory[i],definition=catalogItem(item.itemId);
      if(item.instanceId===profile.equipped.weapon&&definition.equipSlot==="weapon") attack+=Number(definition.attackBonus||0);
    }
    const damage=Math.max(1,Math.floor(attack*100/(100+target.defense)));
    target.hp=Math.max(0,target.hp-damage); target.mode=target.hp===0?"dead":"hit";
    session.attackReadyAt=now+700;
    if(target.hp===0) {
      target.respawnAt=now+target.respawnMs;
      const xp=target.rewardXp;
      const items=[{itemId:target.rewardItemId,quantity:1}];
      let equipmentDropped=false;
      if(target.equipmentDropItemId&&Number(target.equipmentDropBasisPoints||0)>0) {
        const lootHash=nk.sha256Hash(userId+":world:"+session.mapId+":"+target.id+":"+target.generation);
        const lootRoll=(parseInt(lootHash.substring(0,4),16)%100)*100;
        if(lootRoll<Number(target.equipmentDropBasisPoints)) {
          items.push({itemId:target.equipmentDropItemId,quantity:1});
          equipmentDropped=true;
        }
      }
      const reward=grantReward(nk,userId,"field_"+target.id.replace(/[^a-zA-Z0-9_-]/g,"_")+"_"+target.generation,
        "world:"+session.mapId+":"+target.id+":"+target.generation,
        {spiritStones:0,cultivationXp:xp,items:items},[worldSessionWriteRequest(userId,session,current.version)]);
      const rewardData=reward as {[key:string]:any};
      const awardedXp=Number(rewardData.receipt.granted.cultivationXp||0);
      const xpText=awardedXp>0?" • +"+awardedXp+" XP":"";
      const lootText=equipmentDropped?"rơi "+catalogItem(target.equipmentDropItemId!).name+" và vật phẩm săn":"nhận vật phẩm săn";
      return JSON.stringify({mapId:session.mapId,x:session.x,y:session.y,damage:damage,killed:true,
        profile:rewardData.profile,receipt:rewardData.receipt,fieldMobs:worldFieldMobSnapshot(session,session.mapId),
        message:"Đã hạ "+target.name+" • "+lootText+xpText+"."});
    }
    try {
      worldWrite(nk,userId,session,current.version);
      return JSON.stringify({mapId:session.mapId,x:session.x,y:session.y,damage:damage,killed:false,
        fieldMobs:worldFieldMobSnapshot(session,session.mapId),message:"Đã gây "+damage+" sát thương lên "+target.name+"."});
    } catch(_error) { /* Retry after a concurrent world movement or attack. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE,"World combat is busy; retry");
};
