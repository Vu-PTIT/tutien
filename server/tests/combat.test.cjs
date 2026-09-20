const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function harness() {
  const scope = vm.createContext({});
  vm.runInContext(fs.readFileSync('build/index.js','utf8'),scope);
  let match; const rpcs = {};
  scope.InitModule({}, {}, {}, new Proxy({}, {get: (_, method) => method === 'registerRpc'
    ? (id, fn) => {rpcs[id]=fn;} : method === 'registerMatch' ? (_, fn)=>{match=fn;} : ()=>{}}));
  const nk = {uuidv4:()=> 'epoch', binaryToString: b=>Buffer.from(b).toString()};
  const snapshots=[];
  const dispatcher={broadcastMessage:(_,data)=>snapshots.push(JSON.parse(data)),matchKick:()=>{}};
  const state=match.matchInit({}, {}, nk, {owner:'a'}).state;
  let tick=0, seq=0;
  const presence=(id,session=id)=>({userId:id,sessionId:session,username:id,node:'test'});
  const join=(id,session=id,metadata={consent:'true',version:'1'})=>{
    const p=presence(id,session);
    const result=match.matchJoinAttempt({}, {}, nk, dispatcher, tick, state, p, metadata);
    if(result.accept)match.matchJoin({}, {}, nk, dispatcher, tick, state, [p]);
    return result.accept;
  };
  const message=(id,extra={},session=id)=>({sender:presence(id,session),opCode:1,data:Buffer.from(JSON.stringify({epoch:'epoch',seq:++seq,moveX:0,moveY:0,aimX:1,aimY:0,action:'',...extra}))});
  const step=(messages=[])=>match.matchLoop({}, {}, nk, dispatcher, ++tick, state, messages);
  const steps=(n)=>{for(let i=0;i<n;i++)step();};
  const leave=(id,session=id)=>match.matchLeave({}, {}, nk, dispatcher, tick, state, [presence(id,session)]);
  const active=()=>{join('a');join('b');step([message('a',{action:'ready'}),message('b',{action:'ready'})]);steps(60);assert.equal(state.phase,'active');};
  return {scope,match,rpcs,nk,dispatcher,state,snapshots,presence,join,message,step,steps,leave,active,get tick(){return tick;}};
}
test('combat creation requires authentication and consent; owner comes from session',()=>{
  const h=harness(); let params;
  assert.throws(()=>h.rpcs.combat_create({}, {}, {}, '{}'),e=>e.code===16);
  assert.throws(()=>h.rpcs.combat_create({userId:'a'}, {}, {}, '{}'),e=>e.code===3);
  const nk={storageRead:()=>[],storageWrite:()=>[],matchCreate:(name,p)=>{assert.equal(name,'sparring');params=p;return 'room';}};
  assert.equal(JSON.parse(h.rpcs.combat_create({userId:'a'}, {}, nk, '{"consent":true,"owner":"b"}')).matchId,'room');
  assert.equal(params.owner,'a');
});
test('admission requires consent/version, reserves owner slot and prevents third/duplicate sessions',()=>{
  const h=harness();
  assert.equal(h.join('a','a',{}),false);
  assert.equal(h.join('b'),true);
  assert.equal(h.join('c'),false);
  assert.equal(h.join('a'),true);
  assert.equal(h.join('a','other'),false);
  assert.equal(h.join('c'),false);
});
test('pending admissions count toward capacity before matchJoin callback',()=>{
  const h=harness();
  const attempt=id=>h.match.matchJoinAttempt({}, {}, h.nk,h.dispatcher,0,h.state,h.presence(id),{consent:'true',version:'1'}).accept;
  assert.equal(attempt('b'),true);assert.equal(attempt('c'),false);assert.equal(attempt('a'),true);
  assert.equal(attempt('a'),false);
});
test('both players must ready; input during countdown cannot pre-charge an attack',()=>{
  const h=harness();h.join('a');h.join('b');
  h.step([h.message('a',{action:'ready'})]);h.steps(65);assert.equal(h.state.phase,'waiting');
  h.step([h.message('b',{action:'ready'})]);assert.equal(h.state.phase,'countdown');
  h.steps(59);h.step([h.message('a',{action:'sk_basic'})]);
  assert.equal(h.state.phase,'active');assert.equal(h.state.players[0].mode,'idle');
});
test('normalized movement is at most 9 px per tick even with 100 input messages',()=>{
  const h=harness();h.active();const a=h.state.players[0],x=a.x,y=a.y;
  h.step(Array.from({length:100},()=>h.message('a',{moveX:1,moveY:1,x:99999,speed:99999})));
  assert(Math.abs(Math.hypot(a.x-x,a.y-y)-9)<1e-8);
  h.steps(5);const stopped=a.x;h.steps(10);assert.equal(a.x,stopped);
});
test('invalid, stale, oversized and forged-session inputs never move a player or change HP',()=>{
  const h=harness();h.active();const a=h.state.players[0],x=a.x;
  h.step([h.message('a',{moveX:2})]);
  h.step([h.message('a',{epoch:'old',moveX:1})]);
  h.step([h.message('a',{moveX:1},'fake')]);
  h.step([h.message('a',{moveX:null})]);
  h.step([h.message('a',{seq:0,moveX:1})]);
  h.step([h.message('a',{moveX:1,extra:'x'.repeat(600)})]);
  h.step([h.message('a',{action:'sk_unknown',hp:999})]);
  h.step([{sender:h.presence('a'),opCode:1,data:Buffer.from('{bad')}]);
  h.step([{sender:h.presence('a'),opCode:1,data:Buffer.from('{"epoch":"epoch","seq":999,"moveX":1e999,"moveY":0,"aimX":1,"aimY":0,"action":""}')}]);
  assert.equal(a.x,x);assert.equal(a.hp,100);
});
test('basic attack has windup, hits once, uses server damage, and obeys cooldown',()=>{
  const h=harness();h.active();const [a,b]=h.state.players;b.x=a.x+40;
  h.step([h.message('a',{action:'sk_basic',damage:999})]);assert.equal(b.hp,100);
  h.steps(2);assert.equal(b.hp,100);h.step();assert.equal(b.hp,85);
  h.steps(7);h.step([h.message('a',{action:'sk_basic'})]);assert.equal(b.hp,85);assert.equal(a.mode,'idle');
  h.steps(3);h.step([h.message('a',{action:'sk_basic'})]);h.steps(3);assert.equal(b.hp,70);
});
test('range, facing and wall occlusion prevent hits',()=>{
  for(const mode of ['range','behind','wall']) {
    const h=harness();h.active();const [a,b]=h.state.players;
    if(mode==='range') b.x=a.x+100;
    if(mode==='behind') b.x=a.x-30;
    if(mode==='wall'){a.x=455;a.y=250;b.x=505;b.y=250;}
    h.step([h.message('a',{action:'sk_basic'})]);h.steps(5);assert.equal(b.hp,100,mode);
  }
});
test('dodge does not tunnel through obstacle or leave arena',()=>{
  const h=harness();h.active();const a=h.state.players[0];a.x=440;a.y=250;
  h.step([h.message('a',{action:'sk_dodge'})]);h.steps(5);assert(a.x<=450);
  h.steps(48);a.x=915;a.y=350;h.step([h.message('a',{action:'sk_dodge'})]);h.steps(5);assert(a.x<=920);
});
test('dodge immunity is exactly ages 1..3; ages 0 and 4 can be hit',()=>{
  for(const age of [0,1,2,3,4]) {
    const h=harness();h.active();const [a,b]=h.state.players;
    a.x=850;a.y=350;b.x=875;b.y=350;
    a.mode='windup';a.since=h.tick+1-3;a.hit=[];
    b.mode='dodging';b.since=h.tick+1-age;b.faceX=0;b.faceY=0;
    h.step();assert.equal(b.hp,age>=1&&age<4?100:85,`dodge age ${age}`);
  }
});
test('dodge cancels windup but cannot cancel recovery or bypass cooldown',()=>{
  const h=harness();h.active();const a=h.state.players[0];
  h.step([h.message('a',{action:'sk_basic'})]);h.step([h.message('a',{action:'sk_dodge'})]);assert.equal(a.mode,'dodging');
  h.steps(6);h.step([h.message('a',{action:'sk_dodge'})]);assert.equal(a.mode,'idle');
  a.mode='recovery';a.since=h.tick;a.dodgeAt=0;
  h.step([h.message('a',{action:'sk_dodge'})]);assert.equal(a.mode,'recovery');
});
test('simultaneous knockout gives one draw and finished state cannot be attacked or joined',()=>{
  const h=harness();h.active();const [a,b]=h.state.players;b.x=a.x+40;a.hp=15;b.hp=15;
  h.step([h.message('a',{action:'sk_basic'}),h.message('b',{action:'sk_basic',aimX:-1})]);h.steps(3);
  assert.equal(h.state.phase,'finished');assert.equal(h.state.reason,'draw');assert.equal(h.state.winner,'');
  const finish=h.state.phaseAt;h.step([h.message('a',{action:'sk_basic'})]);assert.equal(h.state.phaseAt,finish);
  assert.equal(h.join('c'),false);assert.equal(a.hp,0);assert.equal(b.hp,0);
});
test('reconnect preserves HP/cooldowns, resets sequence, ignores old session leave/input',()=>{
  const h=harness();h.active();const a=h.state.players[0];a.hp=70;a.attackAt=150;
  h.leave('a');h.steps(20);assert.equal(h.join('a','new'),true);
  assert.equal(a.hp,70);assert.equal(a.attackAt,150);assert.equal(a.seq,-1);
  h.leave('a','a');assert.equal(a.presence.sessionId,'new');
  const x=a.x;h.step([h.message('a',{moveX:1},'a')]);assert.equal(a.x,x);
  h.step([h.message('a',{moveX:1,seq:1},'new')]);assert.equal(a.x,x+9);
});
test('disconnected body remains damageable and timeout awards opponent without persistence',()=>{
  const h=harness();h.active();const [a,b]=h.state.players;b.x=a.x+40;
  h.leave('b');h.step([h.message('a',{action:'sk_basic'})]);h.steps(3);assert.equal(b.hp,85);
  h.steps(196);assert.equal(h.state.phase,'finished');assert.equal(h.state.winner,'a');assert.equal(h.state.reason,'disconnect');
});
test('countdown disconnect returns to lobby; empty lobby and completed match expire',()=>{
  const h=harness();h.join('a');h.join('b');h.step([h.message('a',{action:'ready'}),h.message('b',{action:'ready'})]);
  h.leave('a');assert.equal(h.state.phase,'waiting');assert.equal(h.state.players[0].ready,false);
  const empty=harness();assert.equal(empty.match.matchLoop({}, {}, empty.nk,empty.dispatcher,2400,empty.state,[]),null);
  h.steps(200);const expires=h.state.phaseAt+600;
  assert.equal(h.match.matchLoop({}, {}, h.nk,h.dispatcher,expires,h.state,[]),null);
});
test('snapshot contains authoritative public state but no session credentials; tick rate 20',()=>{
  const h=harness();h.active();h.step();h.step();const snapshot=h.snapshots.at(-1);
  assert.equal(snapshot.rules.tickRate,20);assert.equal(snapshot.players.length,2);
  assert.equal(snapshot.players[0].presence,undefined);assert.equal(snapshot.players[0].sessionId,undefined);
  assert.equal(snapshot.epoch,'epoch');
});

test('coalesced movement packets preserve a one-shot action without extra simulation',()=>{
  const h=harness();h.active();const a=h.state.players[0],x=a.x;
  h.step([h.message('a',{moveX:1}),h.message('a',{action:'sk_basic'}),h.message('a',{moveX:1})]);
  assert.equal(a.mode,'windup');assert.equal(a.x,x);
  h.steps(3);assert.equal(a.mode,'active');
});

test('empty realtime payload does not crash or terminate the match',()=>{
  const h=harness();h.active();
  assert(h.step([{sender:h.presence('a'),opCode:1,data:null}]));
  assert.equal(h.state.phase,'active');
});

test('new player is fully connected before insertion into a Go-backed state slice',()=>{
  const h=harness();
  // Nakama/Goja exports inserted JS objects into Go maps. JS references to the
  // original object no longer address the stored player after push.
  Object.defineProperty(h.state.players,'push',{value:function(p){
    return Array.prototype.push.call(this,JSON.parse(JSON.stringify(p)));
  }});
  h.active();
  assert.equal(h.state.players[0].presence.sessionId,'a');
  assert.equal(h.state.players[1].presence.sessionId,'b');
});
