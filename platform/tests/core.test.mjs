import test from 'node:test';
import assert from 'node:assert/strict';
import {
 initialState, loadState, saveState, addLifeEntry, entriesForDay, getActivity,
 pauseTimer, resumeTimer, startTimer, stopTimer, timerElapsed, plansForDay,
 lunarForISO, canChiYear, weeklySummary, zonedDate, formatDuration,
} from '../src/core.mjs';

test('initial journal is empty: no misleading fake data', () => {
 const s=initialState();assert.equal(s.entries.length,0);assert.equal(s.plans.length,0);
 assert.equal(s.settings.shareStatus,'private');
});
test('every meal is an independent event, and bathroom entries are private',()=>{
 const s=initialState();
 for(let i=0;i<3;i++)addLifeEntry(s,{activityId:'eat',time:`2026-10-11T0${i+1}:00:00.000Z`});
 const wc=addLifeEntry(s,{activityId:'wc',visibility:'public',time:'2026-10-11T04:00:00.000Z'});
 assert.equal(entriesForDay(s,'2026-10-11').length,4);
 assert.equal(s.entries.filter(e=>e.activityId==='eat').length,3);
 assert.equal(wc.visibility,'private');
});
test('count events do not accrue duration, statistics count only duration sessions',()=>{
 const s=initialState();
 addLifeEntry(s,{activityId:'water',quantity:1,time:'2026-10-11T01:00:00.000Z'});
 addLifeEntry(s,{activityId:'read',durationSec:1500,time:'2026-10-11T02:00:00.000Z'});
 const sum=weeklySummary(s,'2026-10-11');
 assert.equal(sum.totalSeconds,1500); assert.equal(sum.byActivity.water.count,1);
 assert.equal(sum.byActivity.read.seconds,1500);
 assert.equal(formatDuration(sum.totalSeconds),'25 phút');
});
test('timer resumes across reload and ignores paused time',()=>{
 const s=initialState();assert.equal(startTimer(s,'read',100000),true);
 assert.equal(startTimer(s,'run',101000),false);
 assert.equal(timerElapsed(s.timer,160000),60);
 pauseTimer(s,160000);assert.equal(timerElapsed(s.timer,460000),60);
 const snap=JSON.parse(JSON.stringify(s));resumeTimer(snap,500000);
 assert.equal(timerElapsed(snap.timer,530000),90);
 const entry=stopTimer(snap,530000);assert.equal(entry.durationSec,90);assert.equal(snap.timer,null);
});
test('plans recur only after start; weekly recurs same weekday',()=>{
 const s=initialState();s.plans.push({id:'p1',title:'Run',date:'2026-10-11',time:'08:00',repeat:'weekly',durationMinutes:30});
 assert.equal(plansForDay(s,'2026-10-10').length,0);
 assert.equal(plansForDay(s,'2026-10-11').length,1);
 assert.equal(plansForDay(s,'2026-10-18').length,1);
 assert.equal(plansForDay(s,'2026-10-19').length,0);
});
test('Vietnamese lunar date matches known Tet dates and can chi year',()=>{
 for(const solar of ['2023-01-22','2024-02-10','2025-01-29','2026-02-17','2027-02-06']){
  const value=lunarForISO(solar);assert.equal(value.day,1,solar);assert.equal(value.month,1,solar);
 }
 assert.equal(canChiYear(2026),'Bính Ngọ');
});
test('storage handles invalid JSON without losing defaults',()=>{
 const broken={getItem:()=>'{bad'};
 assert.equal(loadState(broken).entries.length,0);
 const map=new Map();const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 const data=initialState();data.settings.locale='en';saveState(data,storage);
 assert.equal(loadState(storage).settings.locale,'en');
});
test('date grouping respects configured Vietnam timezone',()=>{
 assert.equal(zonedDate(new Date('2026-10-10T18:00:00.000Z'),'Asia/Ho_Chi_Minh'),'2026-10-11');
});