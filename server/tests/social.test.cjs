const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const {randomUUID, createHash} = require('node:crypto');
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const G = '33333333-3333-4333-8333-333333333333';
const SYSTEM = '00000000-0000-0000-0000-000000000000';
const ctx = {userId: A, username: 'alice', clientIp: '127.0.0.1', env: {}};
const logger = {warn(){}};
const clone = x => JSON.parse(JSON.stringify(x));

function setup() {
  const handlers = {};
  const scope = vm.createContext({});
  vm.runInContext(fs.readFileSync('build/index.js', 'utf8'), scope);
  scope.InitModule({}, {}, {}, new Proxy({}, {get: (_, method) => (...args) => {
    const key = method === 'registerRpc' ? args[0] : method === 'registerRtBefore' ? `rt:${args[0]}` : method;
    assert.equal(handlers[key], undefined, `duplicate registration: ${key}`);
    handlers[key] = args.at(-1);
  }}));
  const rows = new Map();
  let serial = 0;
  const key = x => `${x.userId}/${x.collection}/${x.key}`;
  const nk = {
    storageRead(ids) {return ids.flatMap(id => rows.has(key(id)) ? [clone(rows.get(key(id)))] : []);},
    storageWrite(writes) {return writes.map(w => {
      const old = rows.get(key(w));
      if ((w.version === '*' && old) || (w.version !== '*' && w.version !== old?.version)) throw Error('CAS conflict');
      const version = String(++serial);
      rows.set(key(w), clone({...w, version}));
      return {version};
    });},
    storageDelete(ids) {for (const id of ids) {
      if (rows.get(key(id))?.version !== id.version) throw Error('CAS conflict');
      rows.delete(key(id));
    }},
    uuidv4: randomUUID,
    stringToBinary: value => new TextEncoder().encode(value).buffer,
    sha256Hash: value => createHash('sha256').update(value).digest('hex'),
    friendsList: () => ({friends: []}),
    groupsGetId: () => [{id: G, name:'Thanh Van', maxCount:50, edgeCount:2, metadata:{kind:'sect'}}],
    userGroupsList: () => ({userGroups: []}),
    accountGetId: id => ({user: {userId:id, username:'alice'}}),
    channelIdBuild: (actor,target,type) => `${type}:${actor}:${target}`,
  };
  const rpc = (name,data={},context=ctx) => JSON.parse(handlers[name](context,logger,nk,JSON.stringify(data)));
  return {scope,handlers,rows,nk,rpc};
}
const rejectsCode = (fn,code) => assert.throws(fn, e => e.code === code);

test('all social RPCs require an authenticated player, including S2S invocations', () => {
  const s=setup();
  for(const name of Object.keys(s.handlers).filter(x=>x.startsWith('social_'))) rejectsCode(()=>s.rpc(name,{},{}),16);
});

test('reserved storage and native group/chat APIs cannot bypass server rules', () => {
  const {handlers}=setup();
  for(const key of ['registerBeforeWriteStorageObjects','registerBeforeDeleteStorageObjects','registerBeforeCreateGroup','registerBeforeUpdateGroup','registerBeforeDeleteGroup','registerBeforeJoinGroup','registerBeforeLeaveGroup','registerBeforeAddGroupUsers','registerBeforeKickGroupUsers','registerBeforeBanGroupUsers','registerBeforePromoteGroupUsers','registerBeforeDemoteGroupUsers','registerBeforeListGroupUsers','registerBeforeListUserGroups','registerBeforeListChannelMessages','rt:ChannelMessageSend','rt:ChannelMessageUpdate','rt:ChannelMessageRemove']) {
    assert.equal(typeof handlers[key],'function',key);
    rejectsCode(()=>handlers[key](ctx,logger,{},{}),7);
  }
});

test('email registration normalizes email, preserves password, and enforces bcrypt byte limit',()=>{
  const {handlers,nk}=setup();
  const run = req => handlers.registerBeforeAuthenticateEmail(ctx,logger,nk,req);
  const password=' A strong password ';
  const result=run({account:{email:'  ALICE@example.com ',password},create:true,username:'alice'});
  assert.equal(result.account.email,'alice@example.com');
  assert.equal(result.account.password,password);
  rejectsCode(()=>run({account:{email:'alice@example.com',password:'short'},create:true,username:'alice'}),3);
  rejectsCode(()=>run({account:{email:'alice@example.com',password:'界'.repeat(25)},create:true,username:'alice'}),3);
  rejectsCode(()=>run({account:{email:'alice@example.com',password},create:true,username:'bad name'}),3);
  assert.equal(run({account:{password},create:false,username:'alice'}).username,'alice');
});

test('guest login requires explicit dev opt-in; custom auth is disabled',()=>{
  const {handlers,nk}=setup();
  rejectsCode(()=>handlers.registerBeforeAuthenticateDevice(ctx,logger,nk,{}),7);
  handlers.registerBeforeAuthenticateDevice({...ctx,env:{ALLOW_DEVICE_AUTH:'true'}},logger,nk,{});
  rejectsCode(()=>handlers.registerBeforeAuthenticateCustom(),7);
});

test('quota uses storage CAS, retries a competing write, and fails closed',()=>{
  const {scope,nk,rows}=setup();
  const original=nk.storageWrite;
  let raced=false;
  nk.storageWrite=w=>{
    if(!raced) {raced=true;original(w);throw Error('concurrent writer won');}
    return original(w);
  };
  scope.consumeQuota(nk,A,'chat',2,60000);
  assert.equal([...rows.values()][0].value.count,2);
  rejectsCode(()=>scope.consumeQuota(nk,A,'chat',2,60000),8);
  assert.equal([...rows.values()][0].permissionRead,0);
  nk.storageWrite=()=>{throw Error('db unavailable');};
  rejectsCode(()=>scope.consumeQuota(nk,A,'other',2,60000),14);
});

test('expired quota resets the existing fixed key',()=>{
  const {scope,nk,rows}=setup();
  scope.consumeQuota(nk,A,'chat',1,60000);
  [...rows.values()][0].value.resetAt=0;
  scope.consumeQuota(nk,A,'chat',1,60000);
  assert.equal(rows.size,1);
  assert.equal([...rows.values()][0].value.count,1);
});

test('friend mutation rejects self, malformed UUID and oversized batch',()=>{
  const {handlers,nk}=setup();
  const run=data=>handlers.registerBeforeAddFriends(ctx,logger,nk,data);
  rejectsCode(()=>run({ids:[A]}),3);
  rejectsCode(()=>run({ids:['wrong-id']}),3);
  rejectsCode(()=>run({ids:Array(11).fill(B)}),3);
  assert.deepEqual(run({ids:[B]}),{ids:[B]});
});

test('group creation fixes creator, privacy, kind and capacity on server',()=>{
  const {nk,rpc}=setup();
  let args;
  nk.groupCreate=(...a)=>{args=a;return {id:G};};
  rpc('social_group_create',{kind:'sect',name:'Thanh Vân',maxCount:999,open:true,userId:B,metadata:{role:'leader'}});
  assert.equal(args[0],A);assert.equal(args[2],A);assert.equal(args[6],false);assert.equal(args[8],50);
  assert.deepEqual(clone(args[7]),{kind:'sect',schemaVersion:1});
  rejectsCode(()=>rpc('social_group_create',{kind:'admin',name:'Test'}),3);
});

test('group managers only approve existing requests and pass caller to native authority check',()=>{
  const {nk,rpc}=setup();
  let targetRole=2;
  nk.userGroupsList=id=>({userGroups:[{group:{id:G},state:id===A?1:targetRole}]});
  rejectsCode(()=>rpc('social_group_action',{groupId:G,action:'approve',userId:B}),9);
  targetRole=3;
  let args;
  nk.groupUsersAdd=(...a)=>{args=a;};
  rpc('social_group_action',{groupId:G,action:'approve',userId:B});
  assert.deepEqual(clone(args),[G,[B],A]);
});

test('nonmember cannot manage; officer cannot promote; leader cannot be kicked',()=>{
  const {nk,rpc}=setup();
  rejectsCode(()=>rpc('social_group_action',{groupId:G,action:'approve',userId:B}),7);
  nk.userGroupsList=id=>({userGroups:[{group:{id:G},state:id===A?1:0}]});
  rejectsCode(()=>rpc('social_group_action',{groupId:G,action:'promote',userId:B}),7);
  rejectsCode(()=>rpc('social_group_action',{groupId:G,action:'kick',userId:B}),7);
});

test('group lock rejects concurrent promotion, then stale second promotion cannot grant leadership',()=>{
  const {nk,rpc}=setup();
  let role=2;
  nk.userGroupsList=id=>({userGroups:[{group:{id:G},state:id===A?0:role}]});
  const action={groupId:G,action:'promote',userId:B};
  nk.groupUsersPromote=()=>{
    rejectsCode(()=>rpc('social_group_action',action),10);
    role=1;
  };
  rpc('social_group_action',action);
  rejectsCode(()=>rpc('social_group_action',action),9);
  assert.equal(role,1);
});

test('lock is released on errors; old lease cannot delete a replacement owner',()=>{
  const {scope,nk,rows}=setup();
  assert.throws(()=>scope.withGroupLock(nk,logger,G,()=>{throw Error('failed');}),/failed/);
  assert.equal(rows.size,0);
  scope.withGroupLock(nk,logger,G,()=>{
    const previous=[...rows.values()][0];
    nk.storageWrite([{...previous,value:{owner:'new-owner',expiresAt:Date.now()+120000}}]);
  });
  assert.equal([...rows.values()][0].value.owner,'new-owner');
  rejectsCode(()=>scope.withGroupLock(nk,logger,G,()=>{}),10);
});

test('leaders must confirm exact name before disbanding and cannot accidentally leave',()=>{
  const {nk,rpc}=setup();
  nk.userGroupsList=()=>({userGroups:[{group:{id:G},state:0}]});
  let deleted=false; nk.groupDelete=()=>{deleted=true;};
  rejectsCode(()=>rpc('social_group_action',{groupId:G,action:'disband'}),3);
  rejectsCode(()=>rpc('social_group_action',{groupId:G,action:'leave'}),9);
  rpc('social_group_action',{groupId:G,action:'disband',confirmName:'Thanh Van'});
  assert.equal(deleted,true);
});

test('pending users cannot read chat or member lists; members cannot read requests',()=>{
  const {nk,rpc}=setup();
  nk.userGroupsList=()=>({userGroups:[{group:{id:G},state:3}]});
  rejectsCode(()=>rpc('social_chat_history',{type:'group',targetId:G}),7);
  rejectsCode(()=>rpc('social_group_members',{groupId:G}),7);
  nk.userGroupsList=()=>({userGroups:[{group:{id:G},state:2}]});
  rejectsCode(()=>rpc('social_group_members',{groupId:G,state:3}),7);
});

test('DM permissions are rechecked after friendship removal; identity comes from authenticated user',()=>{
  const {nk,rpc}=setup();
  const data={type:'direct',targetId:B,text:'  Xin chào  ',senderId:B,username:'admin',role:'leader'};
  rejectsCode(()=>rpc('social_chat_send',data),7);
  nk.friendsList=()=>({friends:[{user:{userId:B},state:0}]});
  let args; nk.channelMessageSend=(...a)=>{args=a;return {messageId:'msg'};};
  rpc('social_chat_send',data);
  assert.deepEqual(clone(args.slice(1)),[{text:'Xin chào'},A,'alice',true]);
  nk.friendsList=()=>({friends:[]});
  rejectsCode(()=>rpc('social_chat_send',data),7);
  rejectsCode(()=>rpc('social_chat_history',data),7);
});

test('pagination is followed for friend and membership authorization',()=>{
  const {scope,nk}=setup();
  nk.friendsList=(id,limit,state,cursor)=>cursor?{friends:[{user:{userId:B},state:0}]}:{friends:[],cursor:'next'};
  assert.equal(scope.acceptedFriend(nk,A,B),true);
  nk.userGroupsList=(id,limit,state,cursor)=>cursor?{userGroups:[{group:{id:G},state:2}]}:{userGroups:[],cursor:'next'};
  assert.equal(scope.groupState(nk,G,A),2);
});

test('chat rejects malformed payloads, empty/oversized/control text and invalid history limits',()=>{
  const {rpc,handlers,nk}=setup();
  rejectsCode(()=>handlers.social_chat_send(ctx,logger,nk,'['),3);
  rejectsCode(()=>rpc('social_chat_send',{type:'world',text:'   '}),3);
  rejectsCode(()=>rpc('social_chat_send',{type:'world',text:'a'.repeat(501)}),3);
  rejectsCode(()=>rpc('social_chat_send',{type:'world',text:'hello\u0000'}),3);
  rejectsCode(()=>rpc('social_chat_history',{type:'world',limit:1000}),3);
});

test('socket join allows only known world room and requires accepted group membership',()=>{
  const {handlers,nk}=setup();
  const run=req=>handlers['rt:ChannelJoin'](ctx,logger,nk,{channelJoin:req});
  rejectsCode(()=>run({type:1,target:'arbitrary'}),7);
  rejectsCode(()=>run({type:3,target:G}),7);
  const result=run({type:1,target:'world:vi:1',persistence:false});
  assert.equal(result.channelJoin.persistence,true);
});
