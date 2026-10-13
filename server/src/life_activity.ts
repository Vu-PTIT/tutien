// Durable, server-timed life activities. Polling reconstructs progress after a
// disconnect; assets change only in an atomic claim with a command receipt.
const LIFE_TIME_LIMIT = 9007199254740991;
interface LifeSite {
  id:string;mapId:string;type:string;x:number;y:number;radius:number;facing:string;
  name:string;nameEn:string;plotId?:number;floorId?:string;element?:string;
}
interface LifeWaypoint { mapId:string;x:number;y:number;at:number; }
interface LifeSession {
  schemaVersion:number;sessionId:string;avatarId:string;type:string;siteId:string;mapId:string;
  controlMode:string;state:string;stateVersion:number;startedAt:number;activeAt:number;expectedEndAt:number;
  intervalMs:number;cycles:number;completedCycles:number;completedAt:number;settlement:string;
  cropId:string;route:LifeWaypoint[];rewardSeed:string;refundPlanting?:boolean;
}
function lifeFields(input:JsonObject,allowed:string[]):void {
  if(Object.keys(input).some(function(k){return allowed.indexOf(k)<0;})) return fail(nkruntime.Codes.INVALID_ARGUMENT,"Unexpected request fields");
}
function lifeOperation(value:unknown):string {
  if(typeof value!=="string"||!/^[a-zA-Z0-9_-]{8,80}$/.test(value)) return fail(nkruntime.Codes.INVALID_ARGUMENT,"Invalid operation ID");
  return value;
}
function lifeSite(id:string):LifeSite {
  for(let i=0;i<LIFE_SITES.length;i++) if(LIFE_SITES[i].id===id) return LIFE_SITES[i];
  return fail(nkruntime.Codes.NOT_FOUND,"Unknown activity site");
}
function lifeWaterContains(w:WorldWaterRegion,x:number,y:number):boolean {
  if(w.shape==="ellipse"&&w.center_cell&&w.radii_cells) {
    const dx=(x-w.center_cell[0])/w.radii_cells[0],dy=(y-w.center_cell[1])/w.radii_cells[1];
    return dx*dx+dy*dy<=1;
  }
  const p=w.points||[];
  if(w.shape==="polygon") {
    let inside=false;
    for(let i=0,j=p.length-1;i<p.length;j=i++)
      if((p[i][1]>y)!==(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0]) inside=!inside;
    return inside;
  }
  if(w.shape==="ribbon") {
    for(let i=1;i<p.length;i++) {
      const dx=p[i][0]-p[i-1][0],dy=p[i][1]-p[i-1][1],len=dx*dx+dy*dy;
      const t=len?Math.max(0,Math.min(1,((x-p[i-1][0])*dx+(y-p[i-1][1])*dy)/len)):0;
      if(worldDistance(x,y,p[i-1][0]+t*dx,p[i-1][1]+t*dy)<=Number(w.width_cells)/2) return true;
    }
  }
  return false;
}
function installLifeWorldMaps():void {
  for(const id in LIFE_WORLD_MAPS) WORLD_MAPS[id]=LIFE_WORLD_MAPS[id];
}
function lifeRequirePosition(world:WorldSession,id:string):void {
  const map=WORLD_MAPS[world.mapId],p=worldFindPoint(map,id);
  if(!p||worldDistance(world.x,world.y,p.x,p.y)>p.radius*WORLD_TILE||!worldPathWalkable(map,[world.x,world.y],[p.x,p.y]))
    return fail(nkruntime.Codes.FAILED_PRECONDITION,"Move to the activity's access point first");
}
function lifeValidateSession(s:LifeSession):void {
  if(!s||s.schemaVersion!==1||typeof s.sessionId!=="string"||typeof s.avatarId!=="string"||
      ["fishing","mining","gardening","meditation"].indexOf(s.type)<0||["direct","autonomous"].indexOf(s.controlMode)<0||
      ["active","cancelled","completed"].indexOf(s.state)<0||["pending","settled"].indexOf(s.settlement)<0||
      !assetInteger(s.cycles,1,120)||!assetInteger(s.completedCycles,0,s.cycles)||
      !assetInteger(s.stateVersion,1,ASSET_LIMIT)||!assetInteger(s.intervalMs,1,3600000)||
      !assetInteger(s.startedAt,0,LIFE_TIME_LIMIT)||!assetInteger(s.activeAt,s.startedAt,LIFE_TIME_LIMIT)||
      s.expectedEndAt!==s.activeAt+s.intervalMs*s.cycles||!Array.isArray(s.route)||!s.route.length||
      typeof s.rewardSeed!=="string") return fail(nkruntime.Codes.FAILED_PRECONDITION,"Activity state requires review");
  const site=lifeSite(s.siteId);
  if(site.mapId!==s.mapId||site.type!==s.type) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Activity site requires review");
}
function lifeCompleted(s:LifeSession,now:number):number {
  lifeValidateSession(s);
  return s.state==="cancelled"||s.settlement==="settled"?s.completedCycles:
    Math.min(s.cycles,Math.max(0,Math.floor((now-s.activeAt)/s.intervalMs)));
}
function lifeSessionView(s:LifeSession|undefined,now:number):any {
  if(!s) return null;
  const done=lifeCompleted(s,now);
  const state=s.state==="cancelled"?"cancelled":s.settlement==="settled"||done===s.cycles?"completed":now<s.activeAt?"travelling":"active";
  return {sessionId:s.sessionId,avatarId:s.avatarId,activityType:s.type,mapId:s.mapId,activitySlotId:s.siteId,
    controlMode:s.controlMode,state:state,stateVersion:s.stateVersion,startedAt:s.startedAt,activeAt:s.activeAt,
    expectedEndAt:s.expectedEndAt,completedAt:s.completedAt||(done===s.cycles?s.expectedEndAt:0),
    intervalMs:s.intervalMs,cycles:s.cycles,completedCycles:done,settlement:s.settlement,
    remainingMs:s.state==="cancelled"||s.settlement==="settled"?0:Math.max(0,s.expectedEndAt-now),
    position:lifePosition(s,now),cropId:s.cropId,serverNow:now};
}
function lifePosition(s:LifeSession,now:number):{mapId:string;x:number;y:number} {
  if(s.state==="cancelled")now=Math.min(now,s.completedAt);
  const route=s.route;
  for(let i=1;i<route.length;i++) {
    const a=route[i-1],b=route[i];
    if(now<b.at) {
      if(a.mapId!==b.mapId) return {mapId:a.mapId,x:a.x,y:a.y};
      const t=b.at===a.at?1:Math.max(0,Math.min(1,(now-a.at)/(b.at-a.at)));
      return {mapId:a.mapId,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
    }
  }
  const p=route[route.length-1];return {mapId:p.mapId,x:p.x,y:p.y};
}
function lifeEnsureIdle(state:CharacterState,now:number):void {
  const s=state.activitySession as LifeSession|undefined;
  if(s&&s.settlement!=="settled") return fail(nkruntime.Codes.FAILED_PRECONDITION,"Claim or cancel and claim the current activity first");
}
function lifeGuardWorldAction(nk:nkruntime.Nakama,userId:string):void {
  lifeEnsureIdle(loadCharacter(nk,userId).state,Date.now());
}
function lifeSlotRequest(site:LifeSite):nkruntime.StorageReadRequest {
  return {collection:"life_slots",key:site.mapId+":"+site.id,userId:SYSTEM_ID};
}
function lifeCheckSlot(nk:nkruntime.Nakama,site:LifeSite,now:number):nkruntime.StorageObject|undefined {
  const row=nk.storageRead([lifeSlotRequest(site)])[0];
  if(row&&Number(row.value.expiresAt)>now) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED,"This activity slot is occupied; choose another site");
  return row;
}
function lifeReleaseSlot(nk:nkruntime.Nakama,s:LifeSession,writes:nkruntime.StorageWriteRequest[]):void {
  const id=lifeSlotRequest(lifeSite(s.siteId)),row=nk.storageRead([id])[0];
  if(row&&row.value.sessionId===s.sessionId) writes.push({collection:id.collection,key:id.key,userId:id.userId,
    value:{expiresAt:0},version:row.version,permissionRead:0,permissionWrite:0});
}
// Profile, world position, slot lease and command receipt share one CAS batch.
// Apply is rerun on conflict, so every condition is checked against fresh rows.
function lifeMutation(nk:nkruntime.Nakama,userId:string,op:string,action:string,details:JsonObject,
    apply:(state:CharacterState,world:WorldSession,writes:nkruntime.StorageWriteRequest[],now:number)=>JsonObject):JsonObject {
  const fingerprint=nk.sha256Hash(JSON.stringify({action:action,payload:details}));
  const receiptId=assetMutationReceiptId(userId,op);
  function result(receipt:any,state:CharacterState,replayed:boolean):JsonObject {
    return {receipt:receipt,replayed:replayed,profile:state,session:lifeSessionView(receipt.session,Date.now()),
      granted:receipt.granted||{spiritStones:0,items:[]},garden:lifeGardenView(state,Date.now()),serverNow:Date.now()};
  }
  for(let attempt=0;attempt<5;attempt++) {
    const old=nk.storageRead([receiptId])[0];
    if(old) {
      if(old.value.fingerprint!==fingerprint||old.value.action!==action) return fail(nkruntime.Codes.ALREADY_EXISTS,"Operation ID is already used");
      return result(old.value,loadCharacter(nk,userId).state,true);
    }
    const loaded=loadCharacter(nk,userId),position=worldReadSession(nk,userId);
    const next=JSON.parse(JSON.stringify(loaded.state)) as CharacterState;
    const world=JSON.parse(JSON.stringify(position.session)) as WorldSession;
    if(next.revision>=ASSET_LIMIT) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED,"Asset revision limit reached");
    const writes:nkruntime.StorageWriteRequest[]=[],now=Date.now();
    const outcome=apply(next,world,writes,now);
    next.revision++;validateCharacter(next);
    const receipt:any={operationId:op,action:action,fingerprint:fingerprint,revision:next.revision,committedAt:now,
      session:outcome.session||null,granted:outcome.granted||{spiritStones:0,items:[]}};
    writes.push(characterWrite(userId,next,loaded.version),worldSessionWriteRequest(userId,world,position.version),
      {collection:receiptId.collection,key:receiptId.key,userId:userId,value:receipt,version:"*",permissionRead:0,permissionWrite:0});
    try {nk.storageWrite(writes);return result(receipt,next,false);}
    catch(_error) { /* Also recovers lost acknowledgements by reading the receipt. */ }
  }
  const last=nk.storageRead([receiptId])[0];
  if(last&&last.value.fingerprint===fingerprint&&last.value.action===action) return result(last.value,loadCharacter(nk,userId).state,true);
  return fail(nkruntime.Codes.UNAVAILABLE,"Activity storage is busy; retry with the same operation ID");
}
// A* over cardinal cell centers. Every edge is checked using the same water,
// bridge and footprint collision function as world_move; diagonals never cut corners.
function lifePath(map:WorldMapDefinition,from:number[],to:number[]):number[][] {
  if(!worldWalkable(map,from)||!worldWalkable(map,to)) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Activity access point is blocked");
  if(worldPathWalkable(map,from,to)) return [from,to];
  const w=map.width,h=map.height;
  const start=Math.floor(from[1]/32)*w+Math.floor(from[0]/32),goal=Math.floor(to[1]/32)*w+Math.floor(to[0]/32);
  function point(id:number):number[] {return [(id%w)*32+16,Math.floor(id/w)*32+16];}
  function estimate(id:number):number {return Math.abs(id%w-goal%w)+Math.abs(Math.floor(id/w)-Math.floor(goal/w));}
  const heap:{id:number;score:number}[]=[],cost:{[id:string]:number}={},parent:{[id:string]:number}={},closed:{[id:string]:boolean}={};
  const edgeRows:{[y:string]:string}={};
  function edgeMask(x:number,y:number):number {
    if(!edgeRows[y]) {
      const runs=map.navEdges![y].split(",");let row="";
      for(let i=0;i<runs.length;i++){const parts=runs[i].split(":");row+=new Array(parseInt(parts[0],36)+1).join(parts[1]);}
      edgeRows[y]=row;
    }
    return parseInt(edgeRows[y].charAt(x),16);
  }
  function push(node:{id:number;score:number}):void {
    let i=heap.length;heap.push(node);
    while(i>0){const p=Math.floor((i-1)/2);if(heap[p].score<=node.score)break;heap[i]=heap[p];i=p;}heap[i]=node;
  }
  function pop():number {
    const id=heap[0].id,last=heap.pop()!;
    if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].score<heap[c].score)c++;
      if(last.score<=heap[c].score)break;heap[i]=heap[c];i=c;}heap[i]=last;}return id;
  }
  if(!worldPathWalkable(map,from,point(start))||!worldPathWalkable(map,point(goal),to))
    return fail(nkruntime.Codes.FAILED_PRECONDITION,"No safe route from the current position");
  cost[start]=0;push({id:start,score:estimate(start)});
  let found=false;
  while(heap.length) {
    const id=pop();if(closed[id])continue;closed[id]=true;if(id===goal){found=true;break;}
    const x=id%w,y=Math.floor(id/w),neighbors:number[]=[];
    if(x>0)neighbors.push(id-1);if(x<w-1)neighbors.push(id+1);if(y>0)neighbors.push(id-w);if(y<h-1)neighbors.push(id+w);
    const mask=map.navEdges?edgeMask(x,y):0;
    for(let i=0;i<neighbors.length;i++) {const n=neighbors[i];if(closed[n])continue;
      const direction=n===id-1?1:n===id+1?2:n===id-w?4:8;
      if(map.navEdges?!(mask&direction):!worldPathWalkable(map,point(id),point(n)))continue;
      const g=cost[id]+1;if(cost[n]===undefined||g<cost[n]){cost[n]=g;parent[n]=id;push({id:n,score:g+estimate(n)});}}
  }
  if(!found) return fail(nkruntime.Codes.FAILED_PRECONDITION,"No walkable route to this activity site");
  const cells:number[][]=[];let id=goal;cells.push(point(id));
  while(id!==start){id=parent[id];cells.push(point(id));}cells.reverse();
  const raw=[from].concat(cells,[to]),path:number[][]=[from];
  // Every edge is already checked. Merge only consecutive collinear runs;
  // repeatedly rechecking longer runs was quadratic in the path length.
  for(let i=1;i<raw.length-1;i++) {
    const a=raw[i-1],b=raw[i],c=raw[i+1],dx=b[0]-a[0],dy=b[1]-a[1],nx=c[0]-b[0],ny=c[1]-b[1];
    if(dx*ny!==dy*nx||dx*nx+dy*ny<=0)path.push(b);
  }
  path.push(to);return path;
}
function lifeRoute(world:WorldSession,site:LifeSite,now:number):LifeWaypoint[] {
  const queue:string[]=[world.mapId],previous:{[id:string]:{mapId:string;gate:WorldPoint}}={},seen:{[id:string]:boolean}={};seen[world.mapId]=true;
  for(let q=0;q<queue.length&&queue[q]!==site.mapId;q++) {
    const mapId=queue[q],points=WORLD_MAPS[mapId].points;
    for(let i=0;i<points.length;i++){const p=points[i];if(p.kind==="gate"&&p.destination&&!seen[p.destination]){
      seen[p.destination]=true;previous[p.destination]={mapId:mapId,gate:p};queue.push(p.destination);}}
  }
  if(!seen[site.mapId]) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Travel to the village world before assigning this activity");
  const gates:{mapId:string;gate:WorldPoint}[]=[];let target=site.mapId;
  while(target!==world.mapId){const step=previous[target];gates.push(step);target=step.mapId;}gates.reverse();
  const route:LifeWaypoint[]=[{mapId:world.mapId,x:world.x,y:world.y,at:now}];
  let mapId=world.mapId,from=[world.x,world.y],at=now;
  function append(to:number[]):void {
    const path=lifePath(WORLD_MAPS[mapId],from,to);
    for(let i=1;i<path.length;i++){at+=Math.ceil(worldDistance(path[i-1][0],path[i-1][1],path[i][0],path[i][1])/WORLD_SPEED*1000);
      route.push({mapId:mapId,x:path[i][0],y:path[i][1],at:at});}from=to;
  }
  for(let i=0;i<gates.length;i++){const p=gates[i].gate;append([p.x,p.y]);mapId=p.destination!;from=[p.arrivalX!,p.arrivalY!];at+=1000;
    route.push({mapId:mapId,x:from[0],y:from[1],at:at});}
  append([site.x,site.y]);return route;
}
const LIFE_STARTER:RewardBundle={spiritStones:0,items:[
  {itemId:"it_fishing_rod",quantity:1},{itemId:"it_pickaxe",quantity:1},{itemId:"it_bait",quantity:30},
  {itemId:"it_seed_cam_lo",quantity:3},{itemId:"it_seed_tinh_tam",quantity:3},{itemId:"it_seed_ich_khi",quantity:3},{itemId:"it_water",quantity:12}
]};
const lifeClaimStarterRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=objectPayload(payload);lifeFields(input,["operationId"]);
  return JSON.stringify(grantReward(nk,userId,lifeOperation(input.operationId),"life:starter:v1",LIFE_STARTER));
};
const lifeGetRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx);lifeFields(objectPayload(payload),[]);
  const state=loadCharacter(nk,userId).state,now=Date.now();
  return JSON.stringify({serverNow:now,worldRevision:LIFE_WORLD_REVISION,sites:LIFE_SITES,crops:LIFE_CROPS,
    activities:{fishing:{intervalMs:30000,tool:"it_fishing_rod",consumes:"it_bait",maxCycles:120},
      mining:{intervalMs:45000,tool:"it_pickaxe",maxCycles:120},gardening:{maxCycles:1},
      meditation:{intervalMs:LIFE_MEDITATION_MS,maxCycles:120,motesPerCycle:3,purifyPerCycle:1,requiresHapLinh:true}},
    innerWorld:innerView(state),
    garden:lifeGardenView(state,now),session:lifeSessionView(state.activitySession,now),
    starterClaimed:nk.storageRead([receiptId(userId,"source:life:starter:v1")]).length>0});
};
const activityGetRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx);lifeFields(objectPayload(payload),[]);
  return JSON.stringify({session:lifeSessionView(loadCharacter(nk,userId).state.activitySession,Date.now()),serverNow:Date.now()});
};
const activityStartRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=objectPayload(payload);lifeFields(input,["operationId","siteId","controlMode","cycles","cropId"]);
  const op=lifeOperation(input.operationId),site=lifeSite(textField(input.siteId,"siteId",1,80));
  const mode=input.controlMode===undefined?"direct":input.controlMode;
  if(mode!=="direct"&&mode!=="autonomous") return fail(nkruntime.Codes.INVALID_ARGUMENT,"Unknown control mode");
  const cycles=input.cycles===undefined?1:input.cycles;
  if(!assetInteger(cycles,1,site.type==="gardening"||mode==="direct"?1:120)) return fail(nkruntime.Codes.INVALID_ARGUMENT,"Invalid activity cycle count");
  const cropId=site.type==="gardening"?textField(input.cropId,"cropId",1,40):"";
  if(site.type==="gardening") lifeCrop(cropId);
  else if(input.cropId!==undefined) return fail(nkruntime.Codes.INVALID_ARGUMENT,"This activity does not accept cropId");
  return JSON.stringify(lifeMutation(nk,userId,op,"life_start",{siteId:site.id,controlMode:mode,cycles:cycles,cropId:cropId},function(next,world,writes,now) {
    lifeEnsureIdle(next,now);
    if(mode==="direct") lifeRequirePosition(world,site.id);
    if(site.type==="meditation"&&!innerOf(next).learned)
      return fail(nkruntime.Codes.FAILED_PRECONDITION,"Learn Hấp Linh from a Tinh Linh before meditating");
    if(site.type==="fishing"||site.type==="mining") {
      const tool=site.type==="fishing"?"it_fishing_rod":"it_pickaxe";
      if(findInventorySlot(next,tool)<0) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Required tool is missing");
    }
    const route=mode==="autonomous"?lifeRoute(world,site,now):[{mapId:site.mapId,x:world.x,y:world.y,at:now}];
    const activeAt=route[route.length-1].at;
    const interval=site.type==="gardening"?lifeCrop(cropId).durationMs:site.type==="fishing"?30000:site.type==="meditation"?LIFE_MEDITATION_MS:45000;
    const s:LifeSession={schemaVersion:1,sessionId:nk.uuidv4(),avatarId:userId,type:site.type,siteId:site.id,mapId:site.mapId,
      controlMode:mode as string,state:"active",stateVersion:1,startedAt:now,activeAt:activeAt,expectedEndAt:activeAt+interval*(cycles as number),
      intervalMs:interval,cycles:cycles as number,completedCycles:0,completedAt:0,settlement:"pending",cropId:cropId,
      route:route,rewardSeed:nk.uuidv4()};
    if(site.type==="fishing") lifeRemove(next,"it_bait",s.cycles);
    if(site.type==="gardening") lifePlant(next,site.plotId!,cropId,s.sessionId,activeAt);
    const old=lifeCheckSlot(nk,site,now),id=lifeSlotRequest(site);
    writes.push({collection:id.collection,key:id.key,userId:id.userId,value:{sessionId:s.sessionId,expiresAt:s.expectedEndAt},
      version:old?old.version:"*",permissionRead:0,permissionWrite:0});
    next.activitySession=s;return {session:s};
  }));
};
// Unlike shop removal, activity reservations can consume across split stacks.
function lifeRemove(state:CharacterState,itemId:string,quantity:number):void {
  let available=0;for(let i=0;i<state.inventory.length;i++)if(state.inventory[i].itemId===itemId)available+=state.inventory[i].quantity;
  if(available<quantity) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Not enough "+catalogItem(itemId).name);
  for(let i=state.inventory.length-1;i>=0&&quantity>0;i--){const p=state.inventory[i];if(p.itemId!==itemId)continue;
    const take=Math.min(p.quantity,quantity);p.quantity-=take;quantity-=take;if(!p.quantity)state.inventory.splice(i,1);}
}
function lifeTarget(state:CharacterState,id:string,version:number):LifeSession {
  const s=state.activitySession as LifeSession|undefined;
  if(!s||s.sessionId!==id) return fail(nkruntime.Codes.NOT_FOUND,"Activity session not found");
  lifeValidateSession(s);
  if(s.stateVersion!==version) return fail(nkruntime.Codes.ABORTED,"Activity version changed; refresh first");
  if(s.settlement==="settled") return fail(nkruntime.Codes.FAILED_PRECONDITION,"This activity is already settled");
  if(s.stateVersion>=ASSET_LIMIT) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED,"Activity version limit reached");
  return s;
}
function lifeReward(s:LifeSession,nk:nkruntime.Nakama):RewardBundle {
  const items:{[id:string]:number}={};
  if(s.type==="meditation") return {spiritStones:0,items:[]};
  for(let i=0;i<s.completedCycles;i++) {
    const roll=parseInt(nk.sha256Hash(s.rewardSeed+":"+i).substring(0,8),16)%100;
    const id=s.type==="fishing"?(roll<35?"it_fish_carp":"it_fish_tilapia"):(roll<20?"it_copper":"it_iron");
    items[id]=(items[id]||0)+(s.type==="mining"?2:1);
  }
  return {spiritStones:0,items:Object.keys(items).sort().map(function(id){return {itemId:id,quantity:items[id]};})};
}
function lifeFinishWorld(world:WorldSession,s:LifeSession,now:number):void {
  const pos=lifePosition(s,now);world.mapId=pos.mapId;world.x=pos.x;world.y=pos.y;world.seq++;world.updatedAt=now;
}
function lifeSessionCommand(ctx:nkruntime.Context,nk:nkruntime.Nakama,payload:string,action:string):string {
  const userId=authenticated(ctx),input=objectPayload(payload);lifeFields(input,action==="control"?["operationId","sessionId","stateVersion","controlMode"]:["operationId","sessionId","stateVersion"]);
  const op=lifeOperation(input.operationId),id=uuidField(input.sessionId,"sessionId");
  if(!assetInteger(input.stateVersion,1,ASSET_LIMIT)) return fail(nkruntime.Codes.INVALID_ARGUMENT,"Invalid activity version");
  if(action==="control"&&input.controlMode!=="direct"&&input.controlMode!=="autonomous") return fail(nkruntime.Codes.INVALID_ARGUMENT,"Unknown control mode");
  const details:JsonObject={sessionId:id,stateVersion:input.stateVersion};if(action==="control")details.controlMode=input.controlMode;
  return JSON.stringify(lifeMutation(nk,userId,op,"life_"+action,details,function(next,world,writes,now) {
    const s=lifeTarget(next,id,input.stateVersion as number);
    const completed=lifeCompleted(s,now);
    if(action==="control") {
      if(s.state==="cancelled"||now>=s.expectedEndAt) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Activity has ended");
      if(now<s.activeAt) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Wait until the avatar reaches the activity site");
      s.controlMode=input.controlMode as string;
    } else if(action==="cancel") {
      if(s.state==="cancelled") return fail(nkruntime.Codes.FAILED_PRECONDITION,"Activity is already cancelled");
      s.completedCycles=completed;s.state=now>=s.expectedEndAt?"completed":"cancelled";s.completedAt=Math.min(now,s.expectedEndAt);
      // A cancelled crop keeps growing in its plot; claim is empty, harvest it later.
      if(s.type==="gardening"&&s.state==="cancelled") {
        s.completedCycles=0;
        if(now<s.activeAt) {
          const plot=lifePlots(next)[lifeSite(s.siteId).plotId!];
          if(plot.plantingId!==s.sessionId||plot.version>=ASSET_LIMIT) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Planting state requires review");
          plot.state="empty";plot.cropId="";plot.plantedAt=0;plot.readyAt=0;plot.plantingId="";plot.version++;s.refundPlanting=true;
        }
      }
      lifeReleaseSlot(nk,s,writes);lifeFinishWorld(world,s,now);
    } else {
      if(s.state!=="cancelled"&&now<s.expectedEndAt) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Activity is still in progress");
      s.completedCycles=completed;s.completedAt=s.completedAt||s.expectedEndAt;
      let granted:RewardBundle;
      if(s.type==="gardening") {
        const site=lifeSite(s.siteId),plot=lifePlots(next)[site.plotId!];
        if(s.completedCycles===1) {
          if(plot.plantingId!==s.sessionId) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Crop belongs to another planting");
          const crop=lifeCrop(s.cropId);lifeHarvest(next,site.plotId!,now,nk);
          granted={spiritStones:0,items:[{itemId:crop.output,quantity:crop.yield}]};
        } else {
          granted={spiritStones:0,items:s.refundPlanting?[{itemId:lifeCrop(s.cropId).seed,quantity:1},{itemId:"it_water",quantity:1}]:[]};
          for(let i=0;i<granted.items.length;i++)economyAdd(next,granted.items[i].itemId,granted.items[i].quantity,nk);
        }
      } else {
        granted=lifeReward(s,nk);
        // Unused reserved bait is returned with the earned rewards atomically.
        if(s.type==="fishing"&&s.cycles>s.completedCycles)granted.items.push({itemId:"it_bait",quantity:s.cycles-s.completedCycles});
        for(let i=0;i<granted.items.length;i++)economyAdd(next,granted.items[i].itemId,granted.items[i].quantity,nk);
      }
      // Every finished activity settles its linh năng into the Nội Giới in this same write.
      const essence=lifeEssence(s);
      if(s.type==="meditation") granted.purified=innerPurify(next,s.completedCycles*LIFE_MEDITATION_PURIFY);
      if(essence.length){granted.linhNang=essence;granted.inner=innerAbsorb(next,nk,essence);}
      s.state=s.state==="cancelled"?"cancelled":"completed";s.settlement="settled";s.stateVersion++;
      lifeReleaseSlot(nk,s,writes);
      // Cancellation already persisted the last position, including mid-route.
      if(s.state!=="cancelled")lifeFinishWorld(world,s,now);
      return {session:s,granted:granted};
    }
    s.stateVersion++;return {session:s};
  }));
}
const LIFE_MEDITATION_MS=60000;
const LIFE_MEDITATION_MOTES=3;
const LIFE_MEDITATION_PURIFY=1;
// Hấp Linh gives little but clean essence; life work gives a trickle of its own vị.
function lifeEssence(s:LifeSession):InnerEssence[] {
  const done=s.completedCycles;
  if(s.type==="meditation"){const site=lifeSite(s.siteId);return done?[{vi:site.element||"tho",motes:done*LIFE_MEDITATION_MOTES,turbid:0}]:[];}
  if(s.type==="fishing") return Math.floor(done/4)?[{vi:"thuy",motes:Math.floor(done/4),turbid:0}]:[];
  if(s.type==="mining") return Math.floor(done/3)?[{vi:"thach",motes:Math.floor(done/3),turbid:0}]:[];
  if(s.type==="gardening"&&done) return LIFE_HARVEST_ESSENCE;
  return [];
}
const activityClaimRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload){return lifeSessionCommand(ctx,nk,payload,"claim");};
const activityCancelRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload){return lifeSessionCommand(ctx,nk,payload,"cancel");};
const activityControlRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload){return lifeSessionCommand(ctx,nk,payload,"control");};
