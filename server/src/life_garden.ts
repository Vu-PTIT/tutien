interface GardenPlot {
  plotId: number; state: string; version: number; cropId?: string;
  plantedAt?: number; readyAt?: number; plantingId?: string; lootSeed?: string;
}
// A harvest settles a little clean Thổ and Mộc into the Nội Giới.
const LIFE_HARVEST_ESSENCE:InnerEssence[]=[{vi:"tho",motes:2,turbid:0},{vi:"moc",motes:1,turbid:0}];
function lifeCrop(id: unknown): CropDefinition {
  const crops=gameContent().crops;
  if(!contentHas(crops,id)) return fail(nkruntime.Codes.INVALID_ARGUMENT,"Unknown crop");
  return crops[id as string];
}
function lifePlots(state: CharacterState): GardenPlot[] {
  const old=state.gardenPlots;
  if(old!==undefined&&(!Array.isArray(old)||(old.length!==6&&old.length!==12)))
    return fail(nkruntime.Codes.FAILED_PRECONDITION,"Garden state requires review");
  const plots:GardenPlot[]=old||[];
  for(let i=0;i<plots.length;i++) {
    const p=plots[i];
    if(!p||p.plotId!==i||["empty","growing"].indexOf(p.state)<0||!assetInteger(p.version,0,ASSET_LIMIT))
      return fail(nkruntime.Codes.FAILED_PRECONDITION,"Garden state requires review");
    if(p.state==="growing"&&(!p.cropId||!contentHas(gameContent().crops,p.cropId)||
        !assetInteger(p.plantedAt,0,LIFE_TIME_LIMIT)||!assetInteger(p.readyAt,1,LIFE_TIME_LIMIT)||
        typeof p.plantingId!=="string"||!p.plantingId))
      return fail(nkruntime.Codes.FAILED_PRECONDITION,"Growing crop requires review");
  }
  for(let i=plots.length;i<12;i++) plots.push({plotId:i,state:"empty",version:0});
  state.gardenPlots=plots;
  return plots;
}
function lifeGardenView(state: CharacterState,now:number): JsonObject {
  const copy=JSON.parse(JSON.stringify(state)) as CharacterState;
  const plots=lifePlots(copy).map(function(p) {
    return {plotId:p.plotId,siteId:"new_plot_"+(p.plotId<9?"0":"")+(p.plotId+1),
      state:p.state==="growing"&&now>=Number(p.readyAt)?"ready":p.state,version:p.version,
      cropId:p.cropId||"",plantedAt:p.plantedAt||0,readyAt:p.readyAt||0,
      remainingMs:p.state==="growing"?Math.max(0,Number(p.readyAt)-now):0};
  });
  return {plots:plots,crops:gameContent().crops,serverNow:now};
}
function lifePlant(state:CharacterState,plotId:number,cropId:string,plantingId:string,now:number,nk:nkruntime.Nakama):void {
  const crop=lifeCrop(cropId),plot=lifePlots(state)[plotId];
  if(plot.state!=="empty") return fail(nkruntime.Codes.FAILED_PRECONDITION,"This plot is occupied");
  if(plot.version>=ASSET_LIMIT) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED,"Plot version limit reached");
  economyRemove(state,crop.seed,1);economyRemove(state,"it_water",1);
  plot.state="growing";plot.cropId=cropId;plot.plantedAt=now;plot.readyAt=now+crop.durationMs;
  plot.plantingId=plantingId;plot.lootSeed=nk.uuidv4();plot.version++;
}
function lifeHarvest(state:CharacterState,plotId:number,now:number,nk:nkruntime.Nakama):RewardBundle {
  const plot=lifePlots(state)[plotId];
  if(plot.state!=="growing"||now<Number(plot.readyAt)) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Crop is not ready to harvest");
  if(plot.version>=ASSET_LIMIT) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED,"Plot version limit reached");
  // Plots planted before loot v2 have no server seed; their planting ID stands in.
  const granted=lifeHarvestYield(nk,lifeCrop(plot.cropId),plot.lootSeed||plot.plantingId!,now);
  for(let i=0;i<granted.items.length;i++)economyAdd(state,granted.items[i].itemId,granted.items[i].quantity,nk);
  plot.state="empty";plot.cropId="";plot.plantedAt=0;plot.readyAt=0;plot.plantingId="";delete plot.lootSeed;plot.version++;
  return granted;
}
const gardenGetRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx);lifeFields(objectPayload(payload),[]);
  return JSON.stringify(lifeGardenView(loadCharacter(nk,userId).state,Date.now()));
};
function lifeGardenAction(ctx:nkruntime.Context,nk:nkruntime.Nakama,payload:string):string {
  const userId=authenticated(ctx),input=objectPayload(payload);
  lifeFields(input,["operationId","action","plotId","cropId"]);contentEnsure(nk);
  const operationId=lifeOperation(input.operationId);
  if(!assetInteger(input.plotId,0,11)||["plant","harvest"].indexOf(String(input.action))<0)
    return fail(nkruntime.Codes.INVALID_ARGUMENT,"Expected plant or harvest and plotId 0–11");
  const action=input.action as string,plotId=input.plotId as number;
  const cropId=action==="plant"?textField(input.cropId,"cropId",1,40):"";
  if(action==="plant") lifeCrop(cropId);
  else if(input.cropId!==undefined) return fail(nkruntime.Codes.INVALID_ARGUMENT,"Harvest does not accept cropId");
  return JSON.stringify(lifeMutation(nk,userId,operationId,"garden_"+action,{plotId:plotId,cropId:cropId},function(next,world,writes,now) {
    lifeEnsureIdle(next,now);
    if(world.mapId==="m_an_khe"&&plotId<6) lifeRequirePosition(world,"ak.garden.home");
    else {
      const site=lifeSite("new_plot_"+(plotId<9?"0":"")+(plotId+1));
      lifeRequirePosition(world,site.id);lifeCheckSlot(nk,site,now);
    }
    let granted:RewardBundle={spiritStones:0,items:[]};
    if(action==="plant") lifePlant(next,plotId,cropId,operationId,now,nk);
    else {
      granted=lifeHarvest(next,plotId,now,nk);
      granted.linhNang=LIFE_HARVEST_ESSENCE;granted.inner=innerAbsorb(next,nk,LIFE_HARVEST_ESSENCE);
    }
    return {session:null,granted:granted};
  }));
}
