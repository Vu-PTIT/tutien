import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState } from '../src/core.mjs';
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