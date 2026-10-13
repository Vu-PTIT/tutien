interface GardenPlot {
  plotId: number; state: string; version: number; cropId?: string;
  plantedAt?: number; readyAt?: number; plantingId?: string;
}
interface CropDefinition { seed: string; output: string; durationMs: number; yield: number; }
// A harvest settles a little clean Thổ and Mộc into the Nội Giới.
const LIFE_HARVEST_ESSENCE:InnerEssence[]=[{vi:"tho",motes:2,turbid:0},{vi:"moc",motes:1,turbid:0}];
const LIFE_CROPS: {[id: string]: CropDefinition} = {
  crop_cam_lo: {seed:"it_seed_cam_lo",output:"it_herb_cam_lo",durationMs:1200000,yield:4},
  crop_tinh_tam: {seed:"it_seed_tinh_tam",output:"it_herb_tinh_tam",durationMs:2700000,yield:4},
  crop_ich_khi: {seed:"it_seed_ich_khi",output:"it_herb_ich_khi",durationMs:3600000,yield:4}
};
function lifeCrop(id: unknown): CropDefinition {
  if(typeof id!=="string"||!Object.prototype.hasOwnProperty.call(LIFE_CROPS,id))
    return fail(nkruntime.Codes.INVALID_ARGUMENT,"Unknown crop");
  return LIFE_CROPS[id];
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
    if(p.state==="growing"&&(!p.cropId||!Object.prototype.hasOwnProperty.call(LIFE_CROPS,p.cropId)||
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
  return {plots:plots,crops:LIFE_CROPS,serverNow:now};
}
function lifePlant(state:CharacterState,plotId:number,cropId:string,plantingId:string,now:number):void {
  const crop=lifeCrop(cropId),plot=lifePlots(state)[plotId];
  if(plot.state!=="empty") return fail(nkruntime.Codes.FAILED_PRECONDITION,"This plot is occupied");
  if(plot.version>=ASSET_LIMIT) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED,"Plot version limit reached");
  economyRemove(state,crop.seed,1);economyRemove(state,"it_water",1);
  plot.state="growing";plot.cropId=cropId;plot.plantedAt=now;plot.readyAt=now+crop.durationMs;
  plot.plantingId=plantingId;plot.version++;
}
function lifeHarvest(state:CharacterState,plotId:number,now:number,nk:nkruntime.Nakama):void {
  const plot=lifePlots(state)[plotId];
  if(plot.state!=="growing"||now<Number(plot.readyAt)) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Crop is not ready to harvest");
  if(plot.version>=ASSET_LIMIT) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED,"Plot version limit reached");
  const crop=lifeCrop(plot.cropId);
  economyAdd(state,crop.output,crop.yield,nk);
  plot.state="empty";plot.cropId="";plot.plantedAt=0;plot.readyAt=0;plot.plantingId="";plot.version++;
}
const gardenGetRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx);lifeFields(objectPayload(payload),[]);
  return JSON.stringify(lifeGardenView(loadCharacter(nk,userId).state,Date.now()));
};
function lifeGardenAction(ctx:nkruntime.Context,nk:nkruntime.Nakama,payload:string):string {
  const userId=authenticated(ctx),input=objectPayload(payload);
  lifeFields(input,["operationId","action","plotId","cropId"]);
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
    const granted:RewardBundle={spiritStones:0,items:[]};
    if(action==="plant") lifePlant(next,plotId,cropId,operationId,now);
    else {
      const crop=lifeCrop(lifePlots(next)[plotId].cropId);
      lifeHarvest(next,plotId,now,nk);granted.items.push({itemId:crop.output,quantity:crop.yield});
      granted.linhNang=LIFE_HARVEST_ESSENCE;granted.inner=innerAbsorb(next,nk,LIFE_HARVEST_ESSENCE);
    }
    return {session:null,granted:granted};
  }));
}
