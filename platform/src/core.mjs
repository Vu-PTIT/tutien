/** TuTien platform local-first prototype: shared journal/planner computations.
 * No account or Nakama synchronization is implied by this module.
 */
export const ACTIVITY_CATALOG = [
  { id: 'read', icon: 'book', color: 'lilac', category: 'learning', kind: 'duration', vi: 'Đọc sách', en: 'Reading' },
  { id: 'run', icon: 'run', color: 'aqua', category: 'movement', kind: 'duration', vi: 'Chạy bộ', en: 'Running' },
  { id: 'eat', icon: 'bowl', color: 'apricot', category: 'daily', kind: 'event', vi: 'Ăn uống', en: 'Eating' },
  { id: 'study', icon: 'school', color: 'sky', category: 'learning', kind: 'duration', vi: 'Đi học', en: 'Studying' },
  { id: 'work', icon: 'briefcase', color: 'sand', category: 'work', kind: 'duration', vi: 'Đi làm', en: 'Working' },
  { id: 'rest', icon: 'moon', color: 'violet', category: 'rest', kind: 'duration', vi: 'Nghỉ ngơi', en: 'Resting' },
  { id: 'water', icon: 'drop', color: 'sky', category: 'daily', kind: 'count', vi: 'Uống nước', en: 'Drinking water' },
  { id: 'wc', icon: 'spark', color: 'pink', category: 'private', kind: 'event', sensitive: true, vi: 'Đi vệ sinh', en: 'Bathroom' },
  { id: 'sleep', icon: 'bed', color: 'violet', category: 'rest', kind: 'duration', vi: 'Ngủ', en: 'Sleeping' },
  { id: 'meditate', icon: 'lotus', color: 'lilac', category: 'rest', kind: 'duration', vi: 'Thiền', en: 'Meditation' },
  { id: 'walk', icon: 'footprints', color: 'aqua', category: 'movement', kind: 'duration', vi: 'Đi bộ', en: 'Walking' },
  { id: 'game', icon: 'gamepad', color: 'apricot', category: 'leisure', kind: 'duration', vi: 'Giải trí', en: 'Leisure' },
];
export const DEFAULT_SETTINGS = {
  locale: 'vi', theme: 'light', timezone: 'Asia/Ho_Chi_Minh', showLunar: true,
  showMoon: true, showCanChi: true, showCulturalTips: true, reducedMotion: false,
  fontScale: 1, shareStatus: 'private', gameSuggestions: false,
};
export const CATEGORY_COLORS = { learning: '#7b70bf', movement: '#279b7d', daily: '#d78b47', work: '#4e7fa6', rest: '#9270ca', private: '#be7a91', leisure: '#dc9b5b' };
export const CATEGORY_NAMES = {
  learning: { vi: 'Học tập', en: 'Learning' }, movement: { vi: 'Vận động', en: 'Movement' },
  daily: { vi: 'Sinh hoạt', en: 'Daily life' }, work: { vi: 'Công việc', en: 'Work' },
  rest: { vi: 'Nghỉ ngơi', en: 'Rest' }, private: { vi: 'Riêng tư', en: 'Private' },
  leisure: { vi: 'Giải trí', en: 'Leisure' },
};
const KEY = 'tutien.platform.v1';
export const uid = () => (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
export function getActivity(id, state = null) { return (state?.customActivities || []).find(a => a.id === id) || ACTIVITY_CATALOG.find(a => a.id === id); }
export function initialState() { return { version: 1, settings: { ...DEFAULT_SETTINGS }, entries: [], plans: [], customActivities: [], pinnedIds: ACTIVITY_CATALOG.slice(0, 8).map(a => a.id), timer: null }; }
export function loadState(storage = globalThis.localStorage) {
  const initial = initialState();
  try {
    const stored = JSON.parse(storage?.getItem(KEY) || 'null');
    if (!stored || typeof stored !== 'object' || stored.version !== 1) return initial;
    return { ...initial, ...stored, settings: { ...DEFAULT_SETTINGS, ...(stored.settings || {}) },
      entries: Array.isArray(stored.entries) ? stored.entries : [],
      plans: Array.isArray(stored.plans) ? stored.plans : [],
      customActivities: Array.isArray(stored.customActivities) ? stored.customActivities : [],
      pinnedIds: Array.isArray(stored.pinnedIds) ? stored.pinnedIds : initial.pinnedIds };
  } catch { return initial; }
}
export function saveState(state, storage = globalThis.localStorage) {
  try { storage?.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}
export function zonedDate(date = new Date(), timezone = 'Asia/Ho_Chi_Minh') {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); }
  catch { return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); }
}
export function dayFromISO(iso) { return new Date(`${iso}T12:00:00`); }
export function shiftDate(iso, offset) { const d = dayFromISO(iso); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function dateParts(iso) { const [y,m,d] = iso.split('-').map(Number); return { y,m,d }; }
export function startWeek(iso) { const d = dayFromISO(iso); return shiftDate(iso, -((d.getDay() + 6) % 7)); }
export function dateRange(start, days) { return Array.from({length: days}, (_,i)=>shiftDate(start, i)); }
export function safeText(str) { return String(str ?? '').replace(/[&<>"']/g, ch=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch])); }
export function formatTime(value, locale = 'vi', timezone = 'Asia/Ho_Chi_Minh') { return new Intl.DateTimeFormat(locale === 'vi'?'vi-VN':'en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)); }
export function formatDate(iso, locale = 'vi', options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) { return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', options).format(dayFromISO(iso)); }
export function formatDuration(sec, locale = 'vi') {
  const mins = Math.max(0, Math.round(Number(sec || 0) / 60)); const h=Math.floor(mins/60), m=mins%60;
  if (!h) return `${m} ${locale === 'vi' ? 'phút' : 'min'}`;
  return `${h}${locale === 'vi' ? 'giờ' : 'h'}${m ? ` ${m}${locale === 'vi' ? 'p' : 'm'}` : ''}`;
}
export function addLifeEntry(state, { activityId, kind, time = new Date().toISOString(), durationSec = 0, quantity = 1, note = '', visibility, endTime = null }) {
  const def = getActivity(activityId, state); if (!def) throw new Error('Unknown activity');
  const entry = { id: uid(), activityId, kind: kind || def.kind, startedAt: time, endedAt: endTime,
    durationSec: Math.max(0, Math.floor(Number(durationSec) || 0)), quantity: Math.max(1, Number(quantity) || 1), note: String(note).slice(0,1000),
    visibility: def.sensitive ? 'private' : (visibility || 'private'), createdAt: new Date().toISOString() };
  state.entries.unshift(entry); return entry;
}
export function entriesForDay(state, iso) { return state.entries.filter(e=>zonedDate(new Date(e.startedAt),state.settings.timezone)===iso).sort((a,b)=>Date.parse(b.startedAt)-Date.parse(a.startedAt)); }
export function startTimer(state, activityId, now = Date.now()) {
  if (state.timer) return false;
  const def = getActivity(activityId, state); if (!def || def.kind !== 'duration') return false;
  state.timer = { activityId, startedAt: new Date(now).toISOString(), accumulatedMs: 0, pausedAt: null, runningSince: now };
  return true;
}
export function timerElapsed(timer, now = Date.now()) {
  if (!timer) return 0;
  return Math.max(0, Math.floor((timer.accumulatedMs + (timer.runningSince === null ? 0 : Math.max(0, now - timer.runningSince))) / 1000));
}
export function pauseTimer(state, now = Date.now()) {
  const t=state.timer; if(!t || t.runningSince === null) return;
  t.accumulatedMs += Math.max(0, now-t.runningSince); t.runningSince=null; t.pausedAt=new Date(now).toISOString();
}
export function resumeTimer(state, now = Date.now()) {
  const t=state.timer; if(!t || t.runningSince !== null) return;
  t.runningSince=now; t.pausedAt=null;
}
export function stopTimer(state, now = Date.now()) {
  const t=state.timer; if(!t) return null;
  const durationSec=timerElapsed(t,now);
  const entry=addLifeEntry(state,{activityId:t.activityId,kind:'duration',time:t.startedAt,endTime:new Date(now).toISOString(),durationSec});
  state.timer=null;return entry;
}
export function planOccurs(plan, iso) {
  if (plan.date > iso) return false;
  if (!plan.repeat || plan.repeat === 'none') return plan.date === iso;
  if (plan.repeat === 'daily') return true;
  if (plan.repeat === 'weekly') return dayFromISO(plan.date).getDay() === dayFromISO(iso).getDay();
  return plan.date === iso;
}
export function plansForDay(state, iso) {return state.plans.filter(p=>planOccurs(p,iso)).sort((a,b)=>(a.time||'').localeCompare(b.time||''));}
export function sumByCategory(entries, state) { const sums={}; for(const e of entries){ const a=getActivity(e.activityId,state);if(!a || e.kind !== 'duration')continue;sums[a.category]=(sums[a.category]||0)+(e.durationSec||0); }return sums; }
export function totalDuration(entries) {return entries.reduce((n,e)=>n+(e.kind === 'duration' ? (e.durationSec||0) : 0),0);}
export function weeklySummary(state, day) {
  const start=startWeek(day), days=dateRange(start,7);
  const byDay=days.map(iso=>entriesForDay(state,iso));
  const all=byDay.flat(); const byCategory=sumByCategory(all,state);
  const byActivity={}; for(const entry of all){const a=entry.activityId;const old=byActivity[a]||{count:0,seconds:0,quantity:0};old.count++;old.seconds+=entry.kind==='duration'?entry.durationSec:0;old.quantity+=entry.kind==='count'?entry.quantity:1;byActivity[a]=old;}
  return { start, days, byDay, entries:all, byActivity, byCategory, totalSeconds:totalDuration(all), activeDays:byDay.filter(v=>v.length).length };
}

// Vietnamese lunar calendar: astronomical Meeus-based algorithm, Vietnam time zone +7.
// Output describes cultural calendar data only; never use as a scientific omen.
const PI = Math.PI; const INT = Math.floor;
export function jdFromDate(dd, mm, yy) { const a=INT((14-mm)/12), y=yy+4800-a, m=mm+12*a-3;let jd=dd+INT((153*m+2)/5)+365*y+INT(y/4)-INT(y/100)+INT(y/400)-32045;if(jd<2299161)jd=dd+INT((153*m+2)/5)+365*y+INT(y/4)-32083;return jd; }
function newMoon(k) {
 const T=k/1236.85,T2=T*T,T3=T2*T,dr=PI/180;
 let Jd1=2415020.75933+29.53058868*k+0.0001178*T2-0.000000155*T3;
 Jd1+=0.00033*Math.sin((166.56+132.87*T-0.009173*T2)*dr);
 const M=359.2242+29.10535608*k-0.0000333*T2-0.00000347*T3;
 const Mpr=306.0253+385.81691806*k+0.0107306*T2+0.00001236*T3;
 const F=21.2964+390.67050646*k-0.0016528*T2-0.00000239*T3;
 const C1=(0.1734-0.000393*T)*Math.sin(M*dr)+0.0021*Math.sin(2*M*dr)-0.4068*Math.sin(Mpr*dr)+0.0161*Math.sin(2*Mpr*dr)-0.0004*Math.sin(3*Mpr*dr)+0.0104*Math.sin(2*F*dr)-0.0051*Math.sin((M+Mpr)*dr)-0.0074*Math.sin((M-Mpr)*dr)+0.0004*Math.sin((2*F+M)*dr)-0.0004*Math.sin((2*F-M)*dr)-0.0006*Math.sin((2*F+Mpr)*dr)+0.0010*Math.sin((2*F-Mpr)*dr)+0.0005*Math.sin((2*Mpr+M)*dr);
 const dt = T < -11 ? 0.001+0.000839*T+0.0002261*T2-0.00000845*T3-0.000000081*T*T3 : -0.000278+0.000265*T+0.000262*T2;
 return Jd1+C1-dt;
}
function sunLongitude(jdn) { const T=(jdn-2451545.0)/36525,T2=T*T,dr=PI/180;const M=357.52910+35999.05030*T-0.0001559*T2-0.00000048*T*T2;const L0=280.46645+36000.76983*T+0.0003032*T2;const DL=(1.914600-0.004817*T-0.000014*T2)*Math.sin(dr*M)+(0.019993-0.000101*T)*Math.sin(dr*2*M)+0.000290*Math.sin(dr*3*M);let L=(L0+DL)*dr;L=L-2*PI*INT(L/(2*PI));return L; }
function getNewMoonDay(k,tz){return INT(newMoon(k)+0.5+tz/24);}
function getSunLongitude(day,tz){return INT(sunLongitude(day-0.5-tz/24)/PI*6);}
function getLunarMonth11(yy,tz){ const off=jdFromDate(31,12,yy)-2415021,k=INT(off/29.530588853);let nm=getNewMoonDay(k,tz);if(getSunLongitude(nm,tz)>=9)nm=getNewMoonDay(k-1,tz);return nm;}
function getLeapMonthOffset(a11,tz){const k=INT(0.5+(a11-2415021.076998695)/29.530588853);let last=0,i=1,arc=getSunLongitude(getNewMoonDay(k+i,tz),tz);do{last=arc;i++;arc=getSunLongitude(getNewMoonDay(k+i,tz),tz);}while(arc!==last && i<14);return i-1;}
export function solarToLunar(dd,mm,yy,tz=7){
 const dayNumber=jdFromDate(dd,mm,yy),k=INT((dayNumber-2415021.076998695)/29.530588853);
 let monthStart=getNewMoonDay(k+1,tz);if(monthStart>dayNumber)monthStart=getNewMoonDay(k,tz);
 let a11=getLunarMonth11(yy,tz),b11=a11,lunarYear;
 if(a11>=monthStart){lunarYear=yy;a11=getLunarMonth11(yy-1,tz);}else{lunarYear=yy+1;b11=getLunarMonth11(yy+1,tz);}
 const lunarDay=dayNumber-monthStart+1,diff=INT((monthStart-a11)/29),lunarLeap=0;
 let lunarMonth=diff+11, leap=lunarLeap;
 if(b11-a11>365){const leapMonthDiff=getLeapMonthOffset(a11,tz);if(diff>=leapMonthDiff){lunarMonth=diff+10;if(diff===leapMonthDiff)leap=1;}}
 if(lunarMonth>12)lunarMonth-=12;
 if(lunarMonth>=11 && diff<4)lunarYear-=1;
 return {day:lunarDay,month:lunarMonth,year:lunarYear,leap};
}
export function lunarForISO(iso){const {y,m,d}=dateParts(iso);return solarToLunar(d,m,y,7);}
const STEMS=['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
const BRANCHES=['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
export function canChiYear(lunarYear){return `${STEMS[(lunarYear+6)%10]} ${BRANCHES[(lunarYear+8)%12]}`;}
export function canChiDay(iso){const {y,m,d}=dateParts(iso),j=jdFromDate(d,m,y);return `${STEMS[(j+9)%10]} ${BRANCHES[(j+1)%12]}`;}
export function approximateMoonAge(lunar){return lunar.day-1;}