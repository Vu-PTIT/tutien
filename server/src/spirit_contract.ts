interface SpiritMember { activeId:string; invitations:string[]; }
interface SpiritHunt {
  id:string; phase:string; createdAt:number; expiresAt:number; mobHp:number; maxHp:number;
  joined:{[userId:string]:boolean}; hp:{[userId:string]:number}; damage:{[userId:string]:number};
  readyAt:{[userId:string]:number}; lastActor:string; lastHitAt:number;
  actions:{operationId:string;userId:string;skill:boolean;damage:number;combo:boolean}[];
}
interface SpiritContract {
  id:string; inviterId:string; recipientId:string; status:string; createdAt:number; expiresAt:number;
  acceptedAt?:number; endedAt?:number; bond:number; hunt?:SpiritHunt;
}
interface SpiritLoaded<T> { value:T; version:string; }
const CONTRACT_INVITE_MS=15*60*1000;
const CONTRACT_HUNT_MS=10*60*1000;
function spiritMemberId(userId:string):nkruntime.StorageReadRequest {
  return {collection:"spirit_members",key:"main",userId:userId};
}
function spiritContractId(id:string):nkruntime.StorageReadRequest {
  return {collection:"spirit_contracts",key:id,userId:SYSTEM_ID};
}
function spiritWrite(id:nkruntime.StorageReadRequest,value:any,version:string):nkruntime.StorageWriteRequest {
  return {collection:id.collection,key:id.key,userId:id.userId,value:value,version:version,permissionRead:0,permissionWrite:0};
}
function spiritMember(nk:nkruntime.Nakama,userId:string):SpiritLoaded<SpiritMember> {
  const row=nk.storageRead([spiritMemberId(userId)])[0];
  return {value:row?row.value as SpiritMember:{activeId:"",invitations:[]},version:row?row.version:"*"};
}
function spiritRecord(nk:nkruntime.Nakama,id:string,userId:string):SpiritLoaded<SpiritContract> {
  if(!/^ct_[a-f0-9]{32}$/.test(id)) return fail(nkruntime.Codes.INVALID_ARGUMENT,"Invalid contract ID");
  const row=nk.storageRead([spiritContractId(id)])[0];
  if(!row) return fail(nkruntime.Codes.NOT_FOUND,"Contract not found");
  const value=row.value as SpiritContract;
  if(value.inviterId!==userId&&value.recipientId!==userId) return fail(nkruntime.Codes.PERMISSION_DENIED,"Contract belongs to other players");
  return {value:value,version:row.version};
}
function spiritOther(value:SpiritContract,userId:string):string {
  return value.inviterId===userId?value.recipientId:value.inviterId;
}
function spiritStatus(value:SpiritContract):string {
  return value.status==="pending"&&Date.now()>=value.expiresAt?"expired":value.status;
}
function spiritPrune(nk:nkruntime.Nakama,userId:string,member:SpiritMember):void {
  member.invitations=member.invitations.filter(function(id){
    const row=nk.storageRead([spiritContractId(id)])[0];
    return !!row&&spiritStatus(row.value as SpiritContract)==="pending";
  });
}
function spiritBlocked(nk:nkruntime.Nakama,a:string,b:string):boolean {
  const ids=[a,b];
  for(let i=0;i<ids.length;i++) {
    let cursor:string|undefined;
    do {
      const page=nk.friendsList(ids[i],100,3,cursor);
      for(let j=0;j<(page.friends||[]).length;j++) {
        const friend=page.friends![j];
        if(friend.user&&friend.user.userId===ids[1-i]) return true;
      }
      cursor=page.cursor;
    } while(cursor);
  }
  return false;
}
function spiritOperation(value:unknown):string {
  if(typeof value!=="string"||!/^[a-zA-Z0-9_-]{8,80}$/.test(value)) return fail(nkruntime.Codes.INVALID_ARGUMENT,"Invalid operation ID");
  return value;
}
function spiritInput(payload:string,fields:string[]):JsonObject {
  const input=objectPayload(payload);
  if(Object.keys(input).some(function(k){return fields.indexOf(k)<0;})) return fail(nkruntime.Codes.INVALID_ARGUMENT,"Unexpected input field");
  return input;
}
function spiritPendingId(userId:string):nkruntime.StorageReadRequest {
  return {collection:"spirit_hunt_rewards",key:"pending",userId:userId};
}
function spiritView(nk:nkruntime.Nakama,value:SpiritContract,userId:string):JsonObject {
  const otherId=spiritOther(value,userId),user=nk.usersGetId([otherId])[0];
  const otherProfile=loadCharacter(nk,otherId).state;
  let hunt:any=value.hunt?JSON.parse(JSON.stringify(value.hunt)):null;
  if(hunt) {
    delete hunt.actions;
    if((hunt.phase==="waiting"||hunt.phase==="active")&&Date.now()>=hunt.expiresAt) hunt.phase="expired";
  }
  return {id:value.id,status:spiritStatus(value),inviterId:value.inviterId,recipientId:value.recipientId,
    expiresAt:value.expiresAt,bond:value.bond,other:{userId:otherId,username:user?user.username:otherId,form:otherProfile.form},hunt:hunt};
}
const contractGetRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx); spiritInput(payload,[]);
  const member=spiritMember(nk,userId).value,incoming:JsonObject[]=[],outgoing:JsonObject[]=[];
  for(let i=0;i<member.invitations.length;i++) {
    const value=spiritRecord(nk,member.invitations[i],userId).value;
    if(spiritStatus(value)!=="pending") continue;
    (value.recipientId===userId?incoming:outgoing).push(spiritView(nk,value,userId));
  }
  const pending=nk.storageRead([spiritPendingId(userId)])[0];
  return JSON.stringify({active:member.activeId?spiritView(nk,spiritRecord(nk,member.activeId,userId).value,userId):null,
    incoming:incoming,outgoing:outgoing,pendingReward:pending&&pending.value.status==="pending"?pending.value:null,serverNow:Date.now()});
};
const contractInviteRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=spiritInput(payload,["operationId","userId"]);
  const operationId=spiritOperation(input.operationId),targetId=uuidField(input.userId,"userId");
  if(targetId===userId) return fail(nkruntime.Codes.INVALID_ARGUMENT,"Choose another player");
  const id="ct_"+nk.sha256Hash(userId+":"+operationId).substring(0,32);
  const old=nk.storageRead([spiritContractId(id)])[0];
  if(old) {
    if(old.value.inviterId!==userId||old.value.recipientId!==targetId) return fail(nkruntime.Codes.ALREADY_EXISTS,"Operation ID used for another invitation");
    return JSON.stringify({contract:spiritView(nk,old.value as SpiritContract,userId),replayed:true});
  }
  if(!nk.usersGetId([targetId])[0]) return fail(nkruntime.Codes.NOT_FOUND,"Player not found");
  if(spiritBlocked(nk,userId,targetId)) return fail(nkruntime.Codes.PERMISSION_DENIED,"Cannot invite a blocked player");
  if(!loadCharacter(nk,userId).state.form.selected||!loadCharacter(nk,targetId).state.form.selected)
    return fail(nkruntime.Codes.FAILED_PRECONDITION,"Both players must select their character form first");
  consumeQuota(nk,userId,"contract_invite",20,3600000);
  for(let attempt=0;attempt<5;attempt++) {
    const existing=nk.storageRead([spiritContractId(id)])[0];
    if(existing) {
      if(existing.value.inviterId!==userId||existing.value.recipientId!==targetId)
        return fail(nkruntime.Codes.ALREADY_EXISTS,"Operation ID used for another invitation");
      return JSON.stringify({contract:spiritView(nk,existing.value as SpiritContract,userId),replayed:true});
    }
    const a=spiritMember(nk,userId),b=spiritMember(nk,targetId);
    if(a.value.activeId||b.value.activeId) return fail(nkruntime.Codes.FAILED_PRECONDITION,"One player already has a contract");
    spiritPrune(nk,userId,a.value); spiritPrune(nk,targetId,b.value);
    for(let i=0;i<a.value.invitations.length;i++) {
      const invitation=spiritRecord(nk,a.value.invitations[i],userId).value;
      if(spiritOther(invitation,userId)===targetId) return JSON.stringify({contract:spiritView(nk,invitation,userId),replayed:true});
    }
    if(a.value.invitations.length>=8||b.value.invitations.length>=8) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED,"Too many pending invitations");
    const value:SpiritContract={id:id,inviterId:userId,recipientId:targetId,status:"pending",createdAt:Date.now(),expiresAt:Date.now()+CONTRACT_INVITE_MS,bond:0};
    a.value.invitations.push(id); b.value.invitations.push(id);
    try {
      nk.storageWrite([spiritWrite(spiritContractId(id),value,"*"),spiritWrite(spiritMemberId(userId),a.value,a.version),spiritWrite(spiritMemberId(targetId),b.value,b.version)]);
      return JSON.stringify({contract:spiritView(nk,value,userId),replayed:false});
    } catch(_error) { /* The invitation and both inboxes are one CAS transaction. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE,"Contract storage busy; retry with the same operation ID");
};
const contractRespondRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=spiritInput(payload,["contractId","accept"]);
  if(typeof input.contractId!=="string"||typeof input.accept!=="boolean") return fail(nkruntime.Codes.INVALID_ARGUMENT,"Expected contractId and accept");
  for(let attempt=0;attempt<5;attempt++) {
    const row=spiritRecord(nk,input.contractId,userId),value=row.value;
    if(value.recipientId!==userId) return fail(nkruntime.Codes.PERMISSION_DENIED,"Only the invited player can respond");
    const desired=input.accept?"active":"declined";
    if(value.status===desired) return JSON.stringify({contract:spiritView(nk,value,userId),replayed:true});
    if(spiritStatus(value)!=="pending") return fail(nkruntime.Codes.FAILED_PRECONDITION,"Invitation is no longer pending");
    const a=spiritMember(nk,value.inviterId),b=spiritMember(nk,userId);
    if(input.accept) {
      if(a.value.activeId||b.value.activeId) return fail(nkruntime.Codes.FAILED_PRECONDITION,"One player already has a contract");
      if(spiritBlocked(nk,userId,value.inviterId)) return fail(nkruntime.Codes.PERMISSION_DENIED,"Cannot contract with a blocked player");
      a.value.activeId=value.id; b.value.activeId=value.id; value.acceptedAt=Date.now();
    }
    value.status=desired;
    a.value.invitations=a.value.invitations.filter(function(id){return id!==value.id;});
    b.value.invitations=b.value.invitations.filter(function(id){return id!==value.id;});
    try {
      nk.storageWrite([spiritWrite(spiritContractId(value.id),value,row.version),spiritWrite(spiritMemberId(value.inviterId),a.value,a.version),spiritWrite(spiritMemberId(userId),b.value,b.version)]);
      return JSON.stringify({contract:spiritView(nk,value,userId),replayed:false});
    } catch(_error) { /* A competing acceptance must recheck both membership slots. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE,"Contract storage busy; refresh and retry");
};
const contractReleaseRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=spiritInput(payload,["contractId"]);
  if(typeof input.contractId!=="string") return fail(nkruntime.Codes.INVALID_ARGUMENT,"Expected contractId");
  for(let attempt=0;attempt<5;attempt++) {
    const row=spiritRecord(nk,input.contractId,userId),value=row.value;
    if(value.status==="ended"||value.status==="cancelled") return JSON.stringify({contract:spiritView(nk,value,userId),replayed:true});
    if(value.status!=="active"&&value.status!=="pending") return fail(nkruntime.Codes.FAILED_PRECONDITION,"Contract is already closed");
    if(value.status==="pending"&&value.inviterId!==userId) return fail(nkruntime.Codes.PERMISSION_DENIED,"Use respond to decline an invitation");
    const ids=[value.inviterId,value.recipientId],writes:nkruntime.StorageWriteRequest[]=[];
    for(let i=0;i<ids.length;i++) {
      const member=spiritMember(nk,ids[i]);
      if(member.value.activeId===value.id) member.value.activeId="";
      member.value.invitations=member.value.invitations.filter(function(id){return id!==value.id;});
      writes.push(spiritWrite(spiritMemberId(ids[i]),member.value,member.version));
    }
    value.status=value.status==="active"?"ended":"cancelled"; value.endedAt=Date.now();
    if(value.hunt&&(value.hunt.phase==="active"||value.hunt.phase==="waiting")) value.hunt.phase="abandoned";
    writes.push(spiritWrite(spiritContractId(value.id),value,row.version));
    try { nk.storageWrite(writes); return JSON.stringify({contract:spiritView(nk,value,userId),replayed:false}); }
    catch(_error) { /* Ending releases both slots together, without touching assets. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE,"Contract storage busy; refresh and retry");
};
function spiritActive(nk:nkruntime.Nakama,id:string,userId:string):SpiritLoaded<SpiritContract> {
  const row=spiritRecord(nk,id,userId);
  if(row.value.status!=="active") return fail(nkruntime.Codes.FAILED_PRECONDITION,"An active contract is required");
  return row;
}
const contractHuntStartRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=spiritInput(payload,["contractId"]);
  if(typeof input.contractId!=="string") return fail(nkruntime.Codes.INVALID_ARGUMENT,"Expected contractId");
  for(let attempt=0;attempt<5;attempt++) {
    const row=spiritActive(nk,input.contractId,userId),value=row.value;
    const ids=[value.inviterId,value.recipientId];
    for(let i=0;i<ids.length;i++) {
      const pending=nk.storageRead([spiritPendingId(ids[i])])[0];
      if(pending&&pending.value.status==="pending") return fail(nkruntime.Codes.FAILED_PRECONDITION,"Claim the previous hunt reward first");
    }
    const profile=loadCharacter(nk,userId); lifeEnsureIdle(profile.state,Date.now());
    let hunt=value.hunt;
    if(!hunt||["waiting","active"].indexOf(hunt.phase)<0||Date.now()>=hunt.expiresAt) {
      hunt={id:nk.uuidv4(),phase:"waiting",createdAt:Date.now(),expiresAt:Date.now()+CONTRACT_HUNT_MS,
        mobHp:120,maxHp:120,joined:{},hp:{},damage:{},readyAt:{},lastActor:"",lastHitAt:0,actions:[]};
      value.hunt=hunt;
    }
    if(hunt.joined[userId]) return JSON.stringify({contract:spiritView(nk,value,userId),replayed:true});
    hunt.joined[userId]=true; hunt.hp[userId]=100; hunt.damage[userId]=0; hunt.readyAt[userId]=0;
    if(hunt.joined[ids[0]]&&hunt.joined[ids[1]]) hunt.phase="active";
    try {
      nk.storageWrite([spiritWrite(spiritContractId(value.id),value,row.version),characterWrite(userId,profile.state,profile.version)]);
      return JSON.stringify({contract:spiritView(nk,value,userId),replayed:false});
    } catch(_error) { /* Joining never takes control of the partner's avatar. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE,"Hunt is busy; refresh and retry");
};
const contractHuntAttackRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=spiritInput(payload,["contractId","huntId","operationId","skill"]);
  const operationId=spiritOperation(input.operationId);
  if(typeof input.contractId!=="string"||typeof input.huntId!=="string"||typeof input.skill!=="boolean")
    return fail(nkruntime.Codes.INVALID_ARGUMENT,"Expected contractId, huntId, operationId and skill");
  for(let attempt=0;attempt<5;attempt++) {
    const row=spiritActive(nk,input.contractId,userId),value=row.value,hunt=value.hunt;
    if(!hunt||hunt.id!==input.huntId) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Hunt has changed; refresh");
    for(let i=0;i<hunt.actions.length;i++) if(hunt.actions[i].operationId===operationId&&hunt.actions[i].userId===userId) {
      if(hunt.actions[i].skill!==input.skill) return fail(nkruntime.Codes.ALREADY_EXISTS,"Operation ID used for another attack");
      return JSON.stringify({contract:spiritView(nk,value,userId),damage:hunt.actions[i].damage,combo:hunt.actions[i].combo,replayed:true});
    }
    const now=Date.now();
    if(hunt.phase!=="active"||now>=hunt.expiresAt||!hunt.joined[userId]) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Both partners must join a live hunt");
    if(hunt.hp[userId]<=0) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Your avatar is down in this hunt");
    if(now<hunt.readyAt[userId]) return fail(nkruntime.Codes.RESOURCE_EXHAUSTED,"Attack is recovering");
    const ids=[value.inviterId,value.recipientId],profiles=ids.map(function(id){return loadCharacter(nk,id);});
    const actorIndex=ids.indexOf(userId),profile=profiles[actorIndex].state;
    for(let i=0;i<profiles.length;i++) lifeEnsureIdle(profiles[i].state,now);
    let attack=16,defense=5;
    for(let i=0;i<profile.inventory.length;i++) {
      const slot=profile.inventory[i],definition=catalogItem(slot.itemId);
      if(slot.instanceId===profile.equipped.weapon) attack+=Number(definition.attackBonus||0);
      if(slot.instanceId===profile.equipped.armor) defense+=Number(definition.defenseBonus||0);
    }
    if(input.skill) {
      const skill=catalogSkill(profile.equippedSkills.active_1);
      if(!skill||profile.learnedSkills.indexOf(skill.id)<0) return fail(nkruntime.Codes.FAILED_PRECONDITION,"Equip a learned active skill first");
      attack+=Number(skill.powerBonus||0);
    }
    const combo=!!hunt.lastActor&&hunt.lastActor!==userId&&now-hunt.lastHitAt<=5000;
    const damage=Math.min(hunt.mobHp,Math.max(1,Math.floor(attack*100/105))+(combo?4:0));
    hunt.mobHp-=damage; hunt.damage[userId]+=damage; hunt.lastActor=userId; hunt.lastHitAt=now;
    hunt.readyAt[userId]=now+(input.skill?1800:700);
    if(hunt.mobHp>0) hunt.hp[userId]=Math.max(0,hunt.hp[userId]-Math.max(1,Math.floor(8*100/(100+defense))));
    hunt.actions.push({operationId:operationId,userId:userId,skill:input.skill,damage:damage,combo:combo});
    const writes=profiles.map(function(p,i){return characterWrite(ids[i],p.state,p.version);});
    if(hunt.mobHp===0) {
      hunt.phase="victory"; value.bond++;
      for(let i=0;i<ids.length;i++) if(hunt.damage[ids[i]]>0) {
        const pending=nk.storageRead([spiritPendingId(ids[i])])[0];
        if(pending&&pending.value.status==="pending") return fail(nkruntime.Codes.FAILED_PRECONDITION,"Previous hunt reward is still pending");
        writes.push(spiritWrite(spiritPendingId(ids[i]),{status:"pending",huntId:hunt.id,contractId:value.id,
          reward:{spiritStones:0,cultivationXp:10,items:[{itemId:"it_boar_hide",quantity:1}]}},pending?pending.version:"*"));
      }
    } else if(hunt.hp[ids[0]]<=0&&hunt.hp[ids[1]]<=0) hunt.phase="defeat";
    writes.push(spiritWrite(spiritContractId(value.id),value,row.version));
    try {
      nk.storageWrite(writes);
      return JSON.stringify({contract:spiritView(nk,value,userId),damage:damage,combo:combo,replayed:false});
    } catch(_error) { /* Shared HP, contribution and owned pending rewards commit together. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE,"Hunt is busy; retry the same attack operation ID");
};
const contractHuntLeaveRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx),input=spiritInput(payload,["contractId","huntId"]);
  if(typeof input.contractId!=="string"||typeof input.huntId!=="string") return fail(nkruntime.Codes.INVALID_ARGUMENT,"Expected contractId and huntId");
  for(let attempt=0;attempt<5;attempt++) {
    const row=spiritActive(nk,input.contractId,userId),value=row.value,hunt=value.hunt;
    if(!hunt||hunt.id!==input.huntId||!hunt.joined[userId]) return fail(nkruntime.Codes.FAILED_PRECONDITION,"You have not joined this hunt");
    if(hunt.phase!=="active"&&hunt.phase!=="waiting") return JSON.stringify({contract:spiritView(nk,value,userId),replayed:true});
    hunt.phase="abandoned";
    try { nk.storageWrite([spiritWrite(spiritContractId(value.id),value,row.version)]); return JSON.stringify({contract:spiritView(nk,value,userId),replayed:false}); }
    catch(_error) { /* Do not cancel another generation after a CAS retry. */ }
  }
  return fail(nkruntime.Codes.UNAVAILABLE,"Hunt is busy; refresh and retry");
};
const contractHuntClaimRpc:nkruntime.RpcFunction=function(ctx,_logger,nk,payload) {
  const userId=authenticated(ctx); spiritInput(payload,[]);
  const row=nk.storageRead([spiritPendingId(userId)])[0];
  if(!row) return fail(nkruntime.Codes.NOT_FOUND,"No hunt reward");
  const operationId="contract_hunt_"+row.value.huntId.replace(/-/g,""),sourceId="contract_hunt:"+row.value.huntId+":"+userId;
  const receipt=nk.storageRead([receiptId(userId,"source:"+sourceId)])[0];
  if(row.value.status==="settled"&&receipt) return JSON.stringify(assetResult(nk,userId,receipt.value as AssetReceipt,true));
  if(row.value.status!=="pending") return fail(nkruntime.Codes.FAILED_PRECONDITION,"Reward requires review");
  const settled=JSON.parse(JSON.stringify(row.value)); settled.status="settled";
  return JSON.stringify(grantReward(nk,userId,operationId,sourceId,row.value.reward as RewardBundle,
    [spiritWrite(spiritPendingId(userId),settled,row.version)]));
};
