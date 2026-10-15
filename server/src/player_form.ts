interface PlayerForm { kind: string; speciesId: string; selected: boolean; }
interface PlayerFormDefinition { kind: string; speciesId: string; name: string; starterSkillId: string; }
const PLAYER_FORMS: PlayerFormDefinition[] = [
  {kind:"human",speciesId:"human",name:"Người",starterSkillId:"sk_linh_tram"},
  {kind:"spirit",speciesId:"cat",name:"Tinh Linh Mèo",starterSkillId:"sk_linh_trao"}
];
function defaultPlayerForm(): PlayerForm { return {kind:"human",speciesId:"human",selected:false}; }
function playerFormDefinition(form: PlayerForm): PlayerFormDefinition | undefined {
  for(let i=0;i<PLAYER_FORMS.length;i++) if(PLAYER_FORMS[i].kind===form.kind&&PLAYER_FORMS[i].speciesId===form.speciesId) return PLAYER_FORMS[i];
  return undefined;
}
function validPlayerForm(form: PlayerForm): boolean {
  return !!form&&typeof form.selected==="boolean"&&!!playerFormDefinition(form)&&
    Object.keys(form).every(function(key){return key==="kind"||key==="speciesId"||key==="selected";})&&
    (form.selected||form.kind==="human");
}
const characterFormsRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,_payload) {
  return JSON.stringify({forms:PLAYER_FORMS,profile:loadCharacter(nk,authenticated(ctx)).state});
};
const characterSelectFormRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=objectPayload(payload);
  if(Object.keys(input).some(function(k){return ["operationId","kind","speciesId"].indexOf(k)<0;})||typeof input.operationId!=="string")
    return fail(nkruntime.Codes.INVALID_ARGUMENT,"Expected operationId, kind and speciesId only");
  const selected={kind:input.kind,speciesId:input.speciesId,selected:true} as PlayerForm;
  const definition=playerFormDefinition(selected);
  if(!definition) return fail(nkruntime.Codes.INVALID_ARGUMENT,"Choose human/human or spirit/cat");
  const result = commitAssetMutation(nk,userId,input.operationId,"select_form",
    {kind:selected.kind,speciesId:selected.speciesId},function(next) {
      lifeEnsureIdle(next,Date.now());
      if(next.form.selected) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Character form has already been selected");
      next.form=selected;
      // Spirit beasts know Hấp Linh from birth; humans must be taught by one.
      if(selected.kind==="spirit") innerLearn(next,"native");
      if(next.learnedSkills.indexOf(definition.starterSkillId)<0) next.learnedSkills.push(definition.starterSkillId);
      next.equippedSkills.active_1=definition.starterSkillId;
    });
  if(selected.kind==="spirit") worldRelocateSpiritSpawn(nk,userId);
  return JSON.stringify(result);
};
