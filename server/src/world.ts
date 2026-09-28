interface WorldPoint {
  id: string; x: number; y: number; radius: number; kind: string;
  destination?: string; arrivalX?: number; arrivalY?: number;
}
interface WorldMapDefinition {
  width: number; height: number; spawnX: number; spawnY: number; solids: number[][]; points: WorldPoint[];
}
interface WorldSession { mapId: string; x: number; y: number; seq: number; updatedAt: number; }

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
    {id:"ta.trail.boar_sign",x:1120,y:544,radius:1.8,kind:"encounter"},
    {id:"ta.gate.thach_can",x:1408,y:128,radius:1.8,kind:"gate",destination:"m_thach_can",arrivalX:128,arrivalY:544},
    {id:"ta.retreat.ankhe",x:160,y:992,radius:1.8,kind:"gate",destination:"m_an_khe",arrivalX:704,arrivalY:128}
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
function worldDistance(ax: number, ay: number, bx: number, by: number): number {
  const dx=ax-bx, dy=ay-by;
  return Math.sqrt(dx*dx+dy*dy);
}
function worldReadSession(nk: nkruntime.Nakama,userId: string): {session:WorldSession,version:string} {
  for(let attempt=0;attempt<5;attempt++) {
    const row=nk.storageRead([worldObject(userId)])[0];
    if(row) {
      const v=row.value;
      if(!WORLD_MAPS[v.mapId]||typeof v.x!=="number"||typeof v.y!=="number"||typeof v.seq!=="number"||typeof v.updatedAt!=="number"||!worldWalkable(WORLD_MAPS[v.mapId],[v.x,v.y]))
        return fail(nkruntime.Codes.FAILED_PRECONDITION,"World position requires review");
      return {session:v as WorldSession,version:row.version};
    }
    const map=WORLD_MAPS.m_an_khe;
    const value:WorldSession={mapId:"m_an_khe",x:map.spawnX,y:map.spawnY,seq:0,updatedAt:Date.now()};
    try {
      const version=nk.storageWrite([{collection:"world_sessions",key:"main",userId:userId,value:value,version:"*",permissionRead:0,permissionWrite:0}])[0].version;
      return {session:value,version:version};
    } catch(_error) { /* Another first request may have won the create CAS. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE,"World session is busy; retry");
}
function worldWrite(nk:nkruntime.Nakama,userId:string,value:WorldSession,version:string):string {
  return nk.storageWrite([{collection:"world_sessions",key:"main",userId:userId,value:value,version:version,permissionRead:0,permissionWrite:0}])[0].version;
}
const worldGetRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,_payload) {
  const userId=authenticated(ctx),loaded=loadCharacter(nk,userId),state=worldReadSession(nk,userId);
  return JSON.stringify({mapId:state.session.mapId,x:state.session.x,y:state.session.y,seq:state.session.seq,quest:worldQuestView(loaded.state)});
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
    const next:WorldSession={mapId:s.mapId,x:input.x,y:input.y,seq:input.seq,updatedAt:Date.now()};
    try { worldWrite(nk,userId,next,current.version); return JSON.stringify({mapId:next.mapId,x:next.x,y:next.y,seq:next.seq,replayed:false}); }
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
    if(!point.destination||!WORLD_MAPS[point.destination]||!worldWalkable(WORLD_MAPS[point.destination],[point.arrivalX!,point.arrivalY!])) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Gate destination requires review");
    const next:WorldSession={mapId:point.destination,x:point.arrivalX!,y:point.arrivalY!,seq:session.seq,updatedAt:Date.now()};
    worldWrite(nk,userId,next,current.version);
    return JSON.stringify({mapId:next.mapId,x:next.x,y:next.y,quest:worldQuestView(loadCharacter(nk,userId).state),message:"Đã đi qua cổng do máy chủ xác nhận."});
  }
  if(point.kind==="resource") {
    const gathered=gatherWorldResource(nk,userId,input.entityId);
    return JSON.stringify({mapId:session.mapId,x:session.x,y:session.y,profile:gathered.profile,
      message:"Đã thu thập tài nguyên. Nút sẽ hồi lại sau một phút."});
  }
  const result=applyWorldQuestInteraction(nk,userId,input.entityId);
  return JSON.stringify({mapId:session.mapId,x:session.x,y:session.y,quest:result.quest,profile:result.profile,message:result.message});
};
