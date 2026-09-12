// Integration test against real Nakama/PostgreSQL. Creates isolated temporary
// accounts and removes them in finally. Requires Node 22.14+ (built-in WebSocket).
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

const base = process.env.NAKAMA_URL || 'http://127.0.0.1:7350';
const basic = `Basic ${Buffer.from(`${process.env.NAKAMA_SERVER_KEY || 'local-dev-key'}:`).toString('base64')}`;
const accounts = [];
const sockets = [];
const suffix = randomUUID().replaceAll('-', '').slice(0, 10);
const password = `Test-${randomUUID()}!`;
let checks = 0;

async function request(path, {method = 'GET', token, body, auth, expected = 200} = {}) {
  const response = await fetch(base + path, {
    method, headers: {'Content-Type': 'application/json', ...(auth || token ? {Authorization: auth || `Bearer ${token}`} : {})},
    ...(body !== undefined ? {body: JSON.stringify(body)} : {}), signal: AbortSignal.timeout(10000)
  });
  const result = await response.json();
  // Never include credentials or successful session responses in assertion logs.
  assert.equal(response.status, expected, `${method} ${path}: ${response.status} ${response.ok ? '' : (result.message || result.error || '')}`);
  return result;
}

async function rpc(user, id, data = {}, expected = 200) {
  const result = await request(`/v2/rpc/${id}`, {method:'POST',token:user.token,body:JSON.stringify(data),expected});
  return expected === 200 ? JSON.parse(result.payload || '{}') : result;
}

async function register(label) {
  const username = `${label}_${suffix}`;
  const email = `${username}@example.com`;
  const session = await request(`/v2/account/authenticate/email?create=true&username=${username}`, {method:'POST',auth:basic,body:{email,password}});
  const user = {...session,username,email};
  accounts.push(user);
  const account = await request('/v2/account',{token:user.token});
  user.id = account.user.id;
  return user;
}

class Socket {
  constructor(user) {
    this.pending = new Map();
    this.messages = [];
    this.sequence = 0;
    this.ws = new WebSocket(base.replace(/^http/, 'ws') + `/ws?format=json&status=true&token=${encodeURIComponent(user.token)}`);
    this.ws.addEventListener('message',event=>{
      const value = JSON.parse(event.data);
      if(value.cid && this.pending.has(value.cid)) this.pending.get(value.cid)(value);
      if(value.channel_message) this.messages.push(value.channel_message);
    });
    this.ready = new Promise((resolve,reject)=>{
      const timer = setTimeout(()=>reject(Error('Socket connect timeout')),10000);
      this.ws.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});
      this.ws.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Socket connection failed'));},{once:true});
    });
    sockets.push(this);
  }
  async send(payload) {
    await this.ready;
    const cid = String(++this.sequence);
    return new Promise((resolve,reject)=>{
      const timer = setTimeout(()=>{this.pending.delete(cid);reject(Error('Socket reply timeout'));},10000);
      this.pending.set(cid,value=>{clearTimeout(timer);this.pending.delete(cid);resolve(value);});
      this.ws.send(JSON.stringify({cid,...payload}));
    });
  }
  async join(type,target) {
    return this.send({channel_join:{type,target,persistence:true}});
  }
  async message(id) {
    const deadline = Date.now()+10000;
    while(Date.now()<deadline) {
      const message = this.messages.find(m=>m.message_id === id);
      if(message) return message;
      await new Promise(resolve=>setTimeout(resolve,25));
    }
    throw Error('Expected real-time message was not delivered');
  }
  close() {this.ws.close();}
}

function checked(label) {checks++;console.log(`PASS ${label}`);}

try {
  const a = await register('alice');
  const b = await register('bob');
  const c = await register('carol');
  checked('email registration creates three independent accounts');

  await request('/v2/account/authenticate/email?create=false',{method:'POST',auth:basic,body:{email:a.email,password}});
  await request(`/v2/account/authenticate/email?create=false&username=${a.username}`,{method:'POST',auth:basic,body:{password}});
  await request('/v2/account/authenticate/email?create=false',{method:'POST',auth:basic,body:{email:a.email,password:'Wrong-password!'},expected:401});
  await request('/v2/account/authenticate/email?create=false',{method:'POST',auth:basic,body:{email:`missing_${suffix}@example.com`,password},expected:404});
  checked('email/username login, incorrect password, and login without auto-registration');

  await request('/v2/storage',{method:'PUT',token:c.token,body:{objects:[{collection:'characters',key:'main',value:JSON.stringify({level:999,spiritStones:99999}),permission_read:1,permission_write:1}]},expected:403});
  assert.equal((await rpc(c,'get_profile')).spiritStones,0);
  await request('/v2/rpc/social_groups',{method:'POST',body:'{}',expected:401});
  checked('unauthenticated access and pre-creation character forgery are rejected');

  await request(`/v2/friend?ids=${b.id}`,{method:'POST',token:a.token,body:{}});
  const incoming = await request('/v2/friend?state=2',{token:b.token});
  assert(incoming.friends.some(f=>f.user.id===a.id));
  await request(`/v2/friend?ids=${a.id}`,{method:'POST',token:b.token,body:{}});
  const friends = await request('/v2/friend?state=0',{token:a.token});
  assert(friends.friends.some(f=>f.user.id===b.id));
  checked('friend request and acceptance persist in the database');

  const sa = new Socket(a), sb = new Socket(b), sc = new Socket(c);
  await Promise.all([sa.ready,sb.ready,sc.ready]);
  assert((await sb.join(2,a.id)).channel);
  assert((await sa.join(2,b.id)).channel);
  assert((await sc.join(2,a.id)).error);
  assert((await sc.join(1,'private-fake-room')).error);
  assert((await sc.join(1,'world:vi:1')).channel);
  const direct = await rpc(a,'social_chat_send',{type:'direct',targetId:b.id,text:'Xin chào đạo hữu',senderId:c.id,username:'fake'});
  const delivered = await sb.message(direct.messageId);
  assert.equal(delivered.sender_id,a.id);
  assert.equal(JSON.parse(delivered.content).text,'Xin chào đạo hữu');
  const history = await rpc(b,'social_chat_history',{type:'direct',targetId:a.id});
  assert(history.messages.some(m=>m.messageId===direct.messageId));
  await rpc(c,'social_chat_history',{type:'direct',targetId:a.id},403);
  assert((await sa.send({channel_message_send:{channel_id:history.channelId,content:JSON.stringify({text:'bypass'})}})).error);
  await request(`/v2/channel/${encodeURIComponent(history.channelId)}`,{token:a.token,expected:403});
  checked('real WebSocket DM delivery, stored history, sender identity and alternate-path denial');

  const world = await rpc(a,'social_chat_send',{type:'world',text:'Chào thế giới tu tiên'});
  await sc.message(world.messageId);
  await rpc(c,'social_chat_send',{type:'world',text:'x'.repeat(501)},400);
  checked('world chat delivery and message length validation');

  await request(`/v2/friend/block?ids=${a.id}`,{method:'POST',token:b.token,body:{}});
  await rpc(a,'social_chat_send',{type:'direct',targetId:b.id,text:'must fail'},403);
  await rpc(a,'social_chat_history',{type:'direct',targetId:b.id},403);
  await request(`/v2/friend?ids=${a.id}`,{method:'DELETE',token:b.token});
  await rpc(b,'social_chat_history',{type:'direct',targetId:a.id},403);
  checked('block revokes DM access; unblock does not silently restore friendship');

  const sect = (await rpc(a,'social_group_create',{kind:'sect',name:`Tông môn ${suffix}`,maxCount:999,open:true})).group;
  const guild = (await rpc(b,'social_group_create',{kind:'guild',name:`Bang hội ${suffix}`})).group;
  assert.equal(sect.maxCount,50);assert.equal(sect.open,false);assert.equal(sect.metadata.kind,'sect');
  await request('/v2/group',{method:'POST',token:c.token,body:{name:'bypass',open:true},expected:403});
  await request(`/v2/group/${sect.id}/join`,{method:'POST',token:c.token,body:{},expected:403});
  const act=(user,data,expected=200)=>rpc(user,'social_group_action',{groupId:sect.id,...data},expected);
  assert.equal((await act(b,{action:'join'})).state,3);
  await act(c,{action:'approve',userId:b.id},403);
  await rpc(b,'social_chat_history',{type:'group',targetId:sect.id},403);
  await act(a,{action:'approve',userId:b.id});
  assert((await rpc(b,'social_groups',{mine:true})).userGroups.some(g=>g.group.id===sect.id&&g.state===2));
  checked('separate sect/guild records, fixed limits, join requests and manager-only approval');

  assert((await sb.join(3,sect.id)).channel);
  assert((await sc.join(3,sect.id)).error);
  const groupMessage=await rpc(b,'social_chat_send',{type:'group',targetId:sect.id,text:'Chào tông môn'});
  await sb.message(groupMessage.messageId);
  await rpc(c,'social_chat_history',{type:'group',targetId:sect.id},403);
  await act(b,{action:'promote',userId:a.id},403);
  await act(a,{action:'promote',userId:b.id});
  await act(a,{action:'promote',userId:b.id},400);
  await act(c,{action:'join'});
  const requests=await rpc(b,'social_group_members',{groupId:sect.id,state:3});
  assert(requests.groupUsers.some(u=>u.user.userId===c.id));
  await act(b,{action:'reject',userId:c.id});
  await act(a,{action:'demote',userId:b.id});
  await act(a,{action:'kick',userId:b.id});
  await rpc(b,'social_chat_history',{type:'group',targetId:sect.id},403);
  await rpc(b,'social_chat_send',{type:'group',targetId:sect.id,text:'must fail'},403);
  await act(a,{action:'leave'},400);
  await act(a,{action:'disband',confirmName:sect.name});
  await rpc(b,'social_group_action',{groupId:guild.id,action:'disband',confirmName:guild.name});
  checked('group realtime chat, role promotion/demotion, rejection, kick and revoked access');

  const refreshed=await request('/v2/account/session/refresh',{method:'POST',auth:basic,body:{token:c.refresh_token}});
  c.token=refreshed.token;c.refresh_token=refreshed.refresh_token;
  await request('/v2/account',{token:c.token});
  await request('/v2/session/logout',{method:'POST',token:c.token,body:{token:c.token,refresh_token:c.refresh_token}});
  await request('/v2/account',{token:c.token,expected:401});
  await request('/v2/account/session/refresh',{method:'POST',auth:basic,body:{token:c.refresh_token},expected:401});
  // Reauthenticate for deterministic cleanup.
  const cleanup=await request('/v2/account/authenticate/email?create=false',{method:'POST',auth:basic,body:{email:c.email,password}});
  c.token=cleanup.token;
  checked('session refresh and logout invalidate access and refresh tokens');
  console.log(`Social integration: ${checks} scenarios passed`);
} finally {
  for(const socket of sockets) socket.close();
  for(const user of accounts) {
    try {await request('/v2/account',{method:'DELETE',token:user.token});}
    catch {console.error('Temporary test account cleanup failed; remove smoke accounts manually');}
  }
}
