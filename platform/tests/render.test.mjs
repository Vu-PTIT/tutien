import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, addLifeEntry, zonedDate } from '../src/core.mjs';
// The UI renderer is templated HTML and should function on all seven routes even without records.
globalThis.location={pathname:'/app'};
globalThis.document={readyState:'loading',addEventListener:()=>{}};
const {renderPageForTests,utcISOForWall}=await import('../src/app.mjs');
test('all seven desktop/mobile page bodies render from empty data',()=>{
 for(const route of ['app','app/journal','app/calendar','app/insights','app/world','app/community','app/settings']){
  const out=renderPageForTests(route,initialState());
  assert.match(out,/<section/);assert.ok(out.length>400,route);
  assert.ok(!out.includes('undefined</strong>'),route);
 }
});
test('the calendar switches off the cultural layer in preferences',()=>{
 const state=initialState();state.settings.showLunar=false;state.settings.showCanChi=false;state.settings.showMoon=false;
 const out=renderPageForTests('app/calendar',state);
 assert.ok(!out.includes('moon-discx'));
 assert.match(out,/calendar-month-grid/);
 assert.match(out,/plan-panel/);
});
test('manual wall times resolve to accurate zoned instants',()=>{
 assert.equal(utcISOForWall('2026-10-11','09:00','Asia/Ho_Chi_Minh'),'2026-10-11T02:00:00.000Z');
});
test('home uses crisp vector activity and moon icons instead of tiny raster assets or emoji phases',()=>{
 const out=renderPageForTests('app',initialState());
 assert.match(out,/class="icon activity-picto"/);
 assert.match(out,/class="moon-phase-icon"/);
 assert.doesNotMatch(out,/assets\/icon-(?:book|run|bowl|school|briefcase|moon|drop|spark)\.webp|🌑|🌒|🌓|🌕|🌖|🌗|🌘/);
});
test('activity tile displays tally badge when user has logged actions for that day',()=>{
 const state=initialState();
 const today=zonedDate(new Date(),state.settings.timezone);
 state.entries.push({id:'e1',activityId:'read',kind:'count',quantity:1,startedAt:`${today}T08:00:00+07:00`,createdAt:`${today}T08:00:00+07:00`});
 state.entries.push({id:'e2',activityId:'read',kind:'count',quantity:1,startedAt:`${today}T10:00:00+07:00`,createdAt:`${today}T10:00:00+07:00`});
 const out=renderPageForTests('app',state);
 assert.match(out,/class="activity-badge"[^>]*>2</);
});
test('home and journal render today action tracker instead of running clock timer',()=>{
 const state=initialState();
 const out=renderPageForTests('app',state);
 assert.ok(!out.includes('timer-clock'));
 assert.ok(!out.includes('Đang tính giờ'));
 assert.match(out,/today-action-card/);
});
test('insights and stats-mini display action counts instead of time duration',()=>{
 const state=initialState();
 const today=zonedDate(new Date(),state.settings.timezone);
 addLifeEntry(state,{activityId:'work',time:`${today}T08:00:00+07:00`});
 addLifeEntry(state,{activityId:'work',time:`${today}T10:00:00+07:00`});
 addLifeEntry(state,{activityId:'read',time:`${today}T14:00:00+07:00`});

 const homeOut=renderPageForTests('app',state);
 assert.match(homeOut,/<strong>3<\/strong><small>Tổng lượt thực hiện<\/small>/);
 assert.match(homeOut,/3\s+lượt/);

 const insightsOut=renderPageForTests('app/insights',state);
 assert.ok(!insightsOut.includes('Tổng thời gian'));
 assert.match(insightsOut,/Tổng lượt thực hiện|Total actions/);
 assert.match(insightsOut,/Phân bổ theo nhóm|Actions by category/);
});
