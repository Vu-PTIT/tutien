import {
 ACTIVITY_CATALOG, CATEGORY_COLORS, CATEGORY_NAMES, DEFAULT_SETTINGS, addLifeEntry, approximateMoonAge,
 canChiDay, canChiYear, dateParts, dateRange, dayFromISO, entriesForDay, formatDate, formatDuration,
 formatTime, getActivity, initialState, loadState, lunarForISO, pauseTimer, planOccurs, plansForDay,
 resumeTimer, safeText, saveState, shiftDate, startTimer, startWeek, stopTimer, timerElapsed,
 totalDuration, uid, weeklySummary, zonedDate,
} from './core.mjs';

const paths = ['app','app/journal','app/calendar','app/insights','app/world','app/community','app/settings'];
const ico = {
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 book:'<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1zM12 6v14"/><path d="M6 9h3M15 9h3M6 12h3M15 12h3"/>',
 run:'<circle cx="15" cy="4" r="2"/><path d="m11 8 4 2 3 4M11 8 8 12l-4 1m7-5-1 6-4 6m4-6 4 2 1 5"/>',
 bowl:'<path d="M3 13h18c0 6-4 8-9 8s-9-2-9-8ZM6 13l2-4 4 4 3-5 3 5"/><path d="m7 5 1 1m5-4 1 3m5-1-1 2"/>',
 school:'<path d="M3 10h18M5 10v11h14V10M7 10V5l5-3 5 3v5M9 21v-6h6v6M8 7h1m6 0h1"/>',
 briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18M10 13v2h4v-2"/>',
 moon:'<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5Z"/><path d="m17 3 .5 1.5L19 5l-1.5.5L17 7l-.5-1.5L15 5l1.5-.5Z"/>',
 drop:'<path d="M12 2c-3 5-7 9-7 13a7 7 0 0 0 14 0c0-4-4-8-7-13Z"/><path d="M8.5 16a4 4 0 0 0 4 3"/>',
 spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
 bed:'<rect x="3" y="11" width="18" height="9" rx="1"/><path d="M3 16h18M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/>',
 lotus:'<path d="M12 20c-4-4-4-8 0-13 4 5 4 9 0 13zM12 20C5 20 2 16 3 11c6 1 9 4 9 9zm0 0c7 0 10-4 9-9-6 1-9 4-9 9zM4 21h16"/>',
 footprints:'<path d="M8 3c-2 0-3 2-3 5s1 5 3 5 3-2 3-5-1-5-3-5ZM16 11c-2 0-3 2-3 5s1 5 3 5 3-2 3-5-1-5-3-5Z"/>',
 gamepad:'<path d="M8 7h8c3 0 5 2 5 6v3a3 3 0 0 1-5 2l-2-2h-4l-2 2a3 3 0 0 1-5-2v-3c0-4 2-6 5-6Z"/><path d="M7 12h4m-2-2v4m7-2h.1m2 2h.1"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-12 4h2m3 0h2m-7 4h2"/>',
 chart:'<path d="M4 20V11h4v9M10 20V4h4v16M16 20v-7h4v7M2 20h20"/>',
 world:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18m0-18c5 5 5 13 0 18"/>',
 people:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5v1"/>',
 settings:'<path d="M10 2h4l.8 2.7 2.4 1 2.5-1.3 2.5 2.6-1.3 2.5 1 2.4 2.7.8v3.6l-2.7.8-1 2.4 1.3 2.5-2.5 2.5-2.5-1.3-2.4 1-.8 2.7h-4l-.8-2.7-2.4-1-2.5 1.3-2.5-2.5 1.3-2.5-1-2.4-2.7-.8v-3.6l2.7-.8 1-2.4-1.3-2.5 2.5-2.6 2.5 1.3 2.4-1z" transform="translate(1 -1) scale(.92)"/><circle cx="12" cy="12" r="3"/>',
 plus:'<path d="M12 4v16M4 12h16"/>', close:'<path d="M5 5l14 14M19 5 5 19"/>',
 left:'<path d="m15 5-7 7 7 7"/>', right:'<path d="m9 5 7 7-7 7"/>',
 check:'<path d="m4 12 5 5L20 6"/>', play:'<path d="m8 5 11 7-11 7z"/>', pause:'<path d="M8 5v14M16 5v14"/>',
 stop:'<rect x="6" y="6" width="12" height="12" rx="2"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
 pin:'<path d="m9 3 6 0-1 6 4 4v2H6v-2l4-4zm3 12v7"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/>',
 star:'<path d="m12 2 3 7 7 .5-5.5 5 1.8 7.5-6.3-4-6.3 4 1.8-7.5L2 9.5 9 9Z"/>',
 bell:'<path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9m4 12h4"/>',
 edit:'<path d="M3 21h5L21 8l-5-5L3 16zM13 6l5 5"/>',
 trash:'<path d="M4 7h16M10 4h4m-8 3 1 14h10l1-14M10 11v6m4-6v6"/>',
 download:'<path d="M12 3v13m-5-5 5 5 5-5M4 18v3h16v-3"/>',
 shield:'<path d="m12 2 9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6z"/><path d="m8 12 3 3 5-6"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.1"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 arrow:'<path d="M4 12h16m-7-7 7 7-7 7"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 filter:'<path d="M4 6h16M7 12h10m-7 6h4"/>',
 mountain:'<path d="m2 19 7-11 4 5 3-4 6 10H2Zm8-12 2-3 3 5"/>',
 cloud:'<path d="M6 18h13a4 4 0 0 0 .3-8 6 6 0 0 0-11-2.2A5 5 0 0 0 6 18Z"/>',
 heart:'<path d="M20 8c0 5-8 11-8 11S4 13 4 8a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3Z"/>',
 refresh:'<path d="M4 12a8 8 0 0 1 14-5l2 2m0-5v5h-5M20 12a8 8 0 0 1-14 5l-2-2m0 5v-5h5"/>',
 feather:'<path d="M21 3C12 2 5 5 3 13l5 2 2 6c8-2 11-9 11-18ZM8 16l10-9"/>',
 list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1"/>',
 eye:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
};
function icon(name, size=20, cls='') { return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ico[name] || ico.star}</svg>`; }
function logo(){return `<span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 42 42" fill="none"><defs><linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#72E4CF"/><stop offset="1" stop-color="#1D789F"/></linearGradient></defs><path d="m2 29 11-15 7 10 9-15 11 20-1 8H3z" fill="url(#logo-grad)"/><path d="m13 14 7 10 4-6 5-9 7 14-7-5-5 6-4 5-7-8-7 8" fill="#F8E6AE"/><path d="M2 31c10 6 24 7 38 0v5H2z" fill="#79B69F"/></svg></span>`}

const D = {
 vi: {
  home:'Sảnh',journal:'Nhật ký',calendar:'Lịch huyền học',insights:'Thống kê',world:'Thế giới game',community:'Cộng đồng',settings:'Cài đặt',
  homeShort:'Trang chủ', calendarShort:'Lịch', insightsShort:'Thống kê', more:'Thêm', brandTag:'Mỗi ngày, một bước tu dưỡng',
  greet:'Hôm nay bạn đang làm gì?', greetSub:'Mỗi việc nhỏ hôm nay đều đáng được ghi lại.', quick:'Check-in nhanh', quickSub:'Chạm để ghi lại một khoảnh khắc',
  current:'Đang thực hiện', journalToday:'Nhật ký hôm nay', viewAll:'Xem tất cả', add:'Thêm', addActivity:'Thêm hoạt động',
  calendarQuick:'Lịch của bạn', insightsQuick:'Tuần này của bạn', yourWorld:'Góc tu tiên', week:'Tuần', month:'Tháng', day:'Ngày', year:'Năm',
  today:'Hôm nay', date:'Ngày', categories:'Danh mục', done:'Đã ghi', planned:'Kế hoạch', noEntries:'Chưa ghi nhận hoạt động nào trong ngày này.',
  noEntriesHint:'Chọn một biểu tượng để bắt đầu nhật ký của bạn.', noPlans:'Chưa có kế hoạch trong ngày này.',
  createPlan:'Tạo kế hoạch', title:'Tên hoạt động', time:'Giờ bắt đầu', duration:'Thời lượng', notes:'Ghi chú', save:'Lưu', cancel:'Hủy', delete:'Xóa', edit:'Sửa',
  start:'Bắt đầu', pause:'Tạm dừng', resume:'Tiếp tục', finish:'Kết thúc & lưu', logDone:'Ghi đã làm',
  recordNow:'Ghi nhận ngay', startTimer:'Bắt đầu tính giờ', logManual:'Ghi thời lượng đã làm', minutes:'Số phút',
  all:'Tất cả', selectDate:'Chọn ngày', chooseActivity:'Chọn một hoạt động', recorded:'Đã ghi nhận hoạt động', undone:'Đã hoàn tác', undo:'Hoàn tác',
  localNotice:'Bản dùng thử lưu trên thiết bị này. Chưa đồng bộ với tài khoản hoặc game.',
  emptyStats:'Hãy check-in để thấy nhịp sống của bạn hiện lên tại đây.',
  totalTime:'Tổng thời gian', moments:'Khoảnh khắc', activeDays:'Ngày có ghi nhận', activities:'Hoạt động',
  categoriesTime:'Thời gian theo lĩnh vực', rhythm:'Nhịp sống trong tuần', thisWeek:'7 ngày vừa qua', thisMonth:'Tháng này',
  calendarCulture:'Thông tin lịch truyền thống', culturalNote:'Các thông tin âm lịch/Can Chi mang tính văn hóa tham khảo, không dự báo vận mệnh.',
  solar:'Dương lịch', lunar:'Âm lịch', canChi:'Can Chi', moonPhase:'Pha trăng', planForDay:'Kế hoạch trong ngày', realLog:'Nhật ký đã ghi',
  planRepeat:'Lặp lại', never:'Không lặp', daily:'Hằng ngày', weekly:'Hằng tuần', status:'Trạng thái',
  startDay:'Ngày bắt đầu', private:'Riêng tư', privacy:'Quyền riêng tư',
  worldState:'Liên kết thế giới Tu Tiên', worldSub:'Đời thực và hành trình trong game, mỗi nơi một nhịp sống.',
  worldUnavailable:'Chưa kết nối máy chủ game', worldText:'Trang này sẽ đọc trạng thái avatar từ Nakama. Check-in đời thực không tự điều khiển nhân vật hay cấp thưởng.',
  worldAction:'Hoạt động trong game', worldProgress:'Đồng bộ phiên hoạt động', worldExamples:'Những khu vực dự kiến',
  friendStatus:'Đạo hữu đang làm gì?', sect:'Tông môn', companion:'Đồng tu', feed:'Nhật ký cộng đồng',
  socialUnavailable:'Cộng đồng chưa được kết nối', socialText:'Kết bạn, tông môn và trò chuyện cần phiên đăng nhập Nakama. Nhật ký của bạn vẫn riêng tư.',
  account:'Tài khoản', appearance:'Giao diện', language:'Ngôn ngữ', location:'Ngôn ngữ & thời gian', privacyAndData:'Riêng tư & dữ liệu', mystical:'Lịch truyền thống',
  theme:'Chế độ màu', light:'Sáng',dark:'Tối',system:'Theo thiết bị', chooseLang:'Ngôn ngữ hiển thị',timezone:'Múi giờ',
  fontSize:'Cỡ chữ',motion:'Giảm chuyển động', showLunar:'Hiện ngày âm lịch', showMoon:'Hiện pha trăng',showCanChi:'Hiện Can Chi',showTips:'Hiện ghi chú văn hóa',
  sharing:'Chia sẻ trạng thái mặc định',sharePrivate:'Chỉ mình tôi',shareFriends:'Bạn bè',exportData:'Xuất dữ liệu JSON',exportCsv:'Xuất nhật ký CSV',
  eraseData:'Xóa dữ liệu trên thiết bị',eraseConfirm:'Bạn muốn xóa nhật ký, lịch và các tùy chỉnh được lưu ở trình duyệt này?',
  noAccount:'Chưa liên kết tài khoản',accountText:'Giai đoạn này dữ liệu chỉ nằm trên trình duyệt. Đồng bộ Nakama cần được triển khai với quyền sở hữu và phiên bảo mật trước khi bật.',
  okay:'Đã hiểu',emptySocial:'Chưa có dữ liệu để hiển thị.', demo:'Minh họa giao diện · Chưa kết nối',
  manage:'Quản lý',summary:'Tổng quan',startANew:'Bắt đầu hôm nay',
 },
 en: {
  home:'Home',journal:'Journal',calendar:'Mystic Calendar',insights:'Insights',world:'Game World',community:'Community',settings:'Settings',
  homeShort:'Home',calendarShort:'Calendar',insightsShort:'Insights',more:'More',brandTag:'A little cultivation, every day',
  greet:'What are you doing today?',greetSub:'The little moments are worth remembering.',quick:'Quick check-in',quickSub:'Tap to capture a moment',
  current:'Current activity',journalToday:"Today's journal",viewAll:'View all',add:'Add',addActivity:'Add activity',
  calendarQuick:'Your calendar',insightsQuick:'Your week',yourWorld:'Cultivation corner',week:'Week',month:'Month',day:'Day',year:'Year',
  today:'Today',date:'Date',categories:'Categories',done:'Logged',planned:'Plans',noEntries:'Nothing logged for this day yet.',
  noEntriesHint:'Tap an icon to begin your personal journal.',noPlans:'No plans for this day yet.',
  createPlan:'Create plan',title:'Activity name',time:'Start time',duration:'Duration',notes:'Notes',save:'Save',cancel:'Cancel',delete:'Delete',edit:'Edit',
  start:'Start',pause:'Pause',resume:'Resume',finish:'Finish & save',logDone:'Log as done',
  recordNow:'Log now',startTimer:'Start timer',logManual:'Log time manually',minutes:'Minutes',
  all:'All',selectDate:'Choose date',chooseActivity:'Select an activity',recorded:'Activity logged',undone:'Undone',undo:'Undo',
  localNotice:'Preview mode: data lives on this device only, not synchronized with an account or the game.',
  emptyStats:'Check in to reveal the rhythm of your week here.',
  totalTime:'Total time',moments:'Moments',activeDays:'Active days',activities:'Activities',
  categoriesTime:'Time by activity type',rhythm:'Your weekly rhythm',thisWeek:'Past 7 days',thisMonth:'This month',
  calendarCulture:'Traditional calendar details',culturalNote:'Lunar/Can Chi details are provided as cultural references, not predictions.',
  solar:'Solar date',lunar:'Lunar date',canChi:'Heavenly stems & branches',moonPhase:'Moon phase',planForDay:'Plans for the day',realLog:'Logged moments',
  planRepeat:'Repeat',never:'Never',daily:'Daily',weekly:'Weekly',status:'Status',
  startDay:'Start date',private:'Private',privacy:'Privacy',
  worldState:'Connected to the cultivation world',worldSub:'Real life and the game world, each with their own rhythm.',
  worldUnavailable:'Game server not connected',worldText:'This page will read your authoritative avatar state from Nakama. Real-life check-ins never control the game character or award items by themselves.',
  worldAction:'In-game activities',worldProgress:'Session synchronization',worldExamples:'Planned locations',
  friendStatus:'What friends are doing',sect:'Sects',companion:'Cultivate together',feed:'Community journal',
  socialUnavailable:'Community is not connected yet',socialText:'Friends, groups and chat require a Nakama account session. Your personal journal remains private.',
  account:'Account',appearance:'Appearance',language:'Language',location:'Language & time',privacyAndData:'Privacy & data',mystical:'Traditional calendar',
  theme:'Color mode',light:'Light',dark:'Dark',system:'System',chooseLang:'Display language',timezone:'Time zone',
  fontSize:'Font size',motion:'Reduce motion',showLunar:'Show lunar dates',showMoon:'Show moon phase',showCanChi:'Show Can Chi',showTips:'Show cultural notes',
  sharing:'Default status visibility',sharePrivate:'Only me',shareFriends:'Friends',exportData:'Export JSON',exportCsv:'Export journal CSV',
  eraseData:'Delete data on this device',eraseConfirm:'Delete the journal, plans and preferences saved in this browser?',
  noAccount:'Account not linked',accountText:'During this phase, data is stored in the browser only. Nakama synchronization must enforce identity and permissions before it can be enabled.',
  okay:'Got it',emptySocial:'No content yet.',demo:'UI preview · Not connected',
  manage:'Manage',summary:'Overview',startANew:'Begin your day',
 }
};
let state = loadState();
const ui = {route: normalizeRoute(location.pathname), selectedDate: zonedDate(new Date(), state.settings.timezone),
  monthAnchor: zonedDate(new Date(),state.settings.timezone).slice(0,7), filter:'all', plannerView:'month', insightsPeriod:'week',
  section:'appearance', communityTab:'friends', pendingActivity:null, lastUndo:null, toast:'', userDateNav:false };
const t = key => D[state.settings.locale]?.[key] || D.vi[key] || key;
const loc=(vi,en)=>state.settings.locale==='vi'?vi:en;
const label=a=>(a?.[state.settings.locale]||a?.vi||a?.en||'');
const tz=()=>state.settings.timezone;
const isToday=iso=>iso===zonedDate(new Date(),tz());
function normalizeRoute(path){ const p=path.replace(/^\/+|\/+$/g,'');return paths.includes(p)?p:'app'; }
function href(route){return `/${route}`;}
function renderNavLink(route,iconName,text,cls=''){return `<a class="nav-item ${ui.route===route?'is-active':''} ${cls}" href="${href(route)}" data-nav="${route}" ${ui.route===route?'aria-current="page"':''}>${icon(iconName,21)}<span>${safeText(text)}</span>${ui.route===route?'<i class="nav-mark"></i>':''}</a>`;}
function renderSidebar(){return `<aside class="sidebar" aria-label="${safeText(loc('Điều hướng chính','Primary navigation'))}">
 <div class="sidebar-top"><a href="/app" data-nav="app" class="brand">${logo()}<span>TuTien<small>${safeText(t('brandTag'))}</small></span></a></div>
 <nav class="side-nav" aria-label="${safeText(loc('Điều hướng','Navigation'))}">
 ${renderNavLink('app','home',t('home'))}${renderNavLink('app/calendar','calendar',t('calendar'))}
 ${renderNavLink('app/journal','book',t('journal'))}${renderNavLink('app/insights','chart',t('insights'))}
 <span class="side-divider"></span>
 ${renderNavLink('app/world','mountain',t('world'))}${renderNavLink('app/community','people',t('community'))}
 </nav><div class="side-bottom"><a class="side-paint" href="/app/world" data-nav="app/world"><span class="side-paint-caption">${loc('Mỗi ngày tốt hơn một chút.','A little better every day.')}<small>${loc('Hành trình tu dưỡng','A cultivation journey')}</small></span></a>
 <div class="side-language"><button data-action="lang" data-value="vi" class="${state.settings.locale==='vi'?'active':''}">VI</button><button data-action="lang" data-value="en" class="${state.settings.locale==='en'?'active':''}">EN</button></div>
 ${renderNavLink('app/settings','settings',t('settings'))}<a href="/app/settings" data-nav="app/settings" class="side-profile"><img src="/assets/avatar-portrait.webp" alt=""/><span><strong>${loc('Hành giả','Traveler')}</strong><small>${loc('Chưa liên kết tài khoản','Local profile')}</small></span></a></div></aside>`;}
function renderMobileNav(){let current=ui.route;return `<nav class="mobile-nav" aria-label="${safeText(loc('Điều hướng dưới','Bottom navigation'))}">
 ${renderMobileItem('app','home',t('homeShort'))}${renderMobileItem('app/calendar','calendar',t('calendarShort'))}
 <button class="mobile-add" type="button" data-action="show-quick" aria-label="${safeText(t('addActivity'))}">${icon('plus',24)}</button>
 ${renderMobileItem('app/journal','book',t('journal'))}${renderMobileItem('app/insights','chart',t('insightsShort'))}
 <button class="mobile-item ${['app/world','app/community','app/settings'].includes(current)?'is-active':''}" type="button" data-action="more-menu">${icon('menu',21)}<small>${safeText(t('more'))}</small></button></nav>`;}
function renderMobileItem(route,icoName,txt){return `<a class="mobile-item ${ui.route===route?'is-active':''}" href="${href(route)}" data-nav="${route}">${icon(icoName,20)}<small>${safeText(txt)}</small></a>`;}
function renderTopbar(){const today=zonedDate(new Date(),tz());return `<header class="topbar"><a class="topbar-mobile-brand" href="/app" data-nav="app">${logo()}<strong>TuTien</strong></a><div class="crumb"><span>${icon('sun',14)} ${safeText(formatDate(today,state.settings.locale,{weekday:'long',day:'numeric',month:'long'}))}</span></div>
 <div class="top-actions"><button type="button" class="top-search" data-action="show-quick">${icon('search',18)} <span>${loc('Tìm hoạt động nhanh...','Find an activity...')}</span><kbd>⌘ K</kbd></button>
 <button class="lang-quick" data-action="toggle-lang" title="${safeText(t('chooseLang'))}">${state.settings.locale.toUpperCase()} ${icon('refresh',13)}</button>
 <span class="top-notifications" title="${loc('Thông báo chưa kết nối','Notifications are not connected')}">${icon('bell',19)}</span>
 <a href="/app/settings" data-nav="app/settings" class="top-avatar" aria-label="${safeText(t('settings'))}"><img src="/assets/avatar-portrait.webp" alt=""/></a></div></header>`;}
function hero(title,subtitle,{eyebrow='',compact=false,quote=''}={}){
 const page=ui.route==='app'?'home':ui.route.split('/').at(-1);
 return `<section class="hero hero-page-${page} ${compact?'hero-compact':''}" aria-label="${safeText(title)}">
 <div class="hero-content">${eyebrow?`<div class="hero-eyebrow">${icon('spark',15)} ${safeText(eyebrow)}</div>`:''}<h1>${safeText(title)}</h1><p>${safeText(subtitle)}</p><div class="hero-chips"><span>${icon('sun',13)} ${safeText(formatDate(zonedDate(new Date(),tz()),state.settings.locale))}</span><span>${icon('moon',13)} ${state.settings.showLunar?`${lunarForISO(zonedDate(new Date(),tz())).day}/${lunarForISO(zonedDate(new Date(),tz())).month} ${loc('âm lịch','lunar')}`:loc('Ghi lại cuộc sống','Living journal')}</span></div></div>
 ${quote?`<div class="hero-quote">${icon('spark',15)} <span>${safeText(quote)}</span></div>`:''}</section>`;
}
function panelTitle(title,extra=''){return `<div class="section-heading"><h2>${safeText(title)}</h2>${extra}</div>`;}
function pillAction(action,text,icoName='plus',extra=''){return `<button class="pill-btn ${extra}" data-action="${action}" type="button">${icon(icoName,16)}<span>${safeText(text)}</span></button>`;}
function activityIllustration(activity,size=31){ const pictograms=['book','run','bowl','school','briefcase','moon','drop','spark'];
 if(pictograms.includes(activity?.icon))return `<img class="illustrated-icon" src="/assets/icon-${activity.icon}.webp" width="${size}" height="${size}" alt="" loading="lazy"/>`;
 return icon(activity?.icon||'lotus',size);
}
function phaseGlyph(day){ return day<=3?'🌑':day<=7?'🌒':day<=11?'🌓':day<=17?'🌕':day<=21?'🌖':day<=26?'🌗':'🌘'; }
function activityCard(a,opts={}){const pinned=state.pinnedIds.includes(a.id);return `<button type="button" class="activity-tile color-${safeText(a.color)}${opts.compact?' compact':''}" data-checkin="${safeText(a.id)}" title="${safeText(label(a))}"><span class="activity-icon">${activityIllustration(a,37)}</span><span class="activity-name">${safeText(label(a))}</span>${opts.manage?`<span class="tiny-pin" aria-hidden="true">${pinned?'◆':'◇'}</span>`:''}</button>`;}
function activitiesForGrid(max=8){const pool=[...ACTIVITY_CATALOG,...state.customActivities];const sorted=[...state.pinnedIds.map(id=>pool.find(a=>a.id===id)).filter(Boolean),...pool.filter(a=>!state.pinnedIds.includes(a.id))];return sorted.slice(0,max);}
function quickCheckin(isHome=false){let selected = ui.filter;
 let activities = isHome?activitiesForGrid(8):[...ACTIVITY_CATALOG,...state.customActivities].filter(a=>selected==='all'||a.category===selected);
 const filters = ['all','daily','learning','movement','work','rest','leisure'];
 return `<section class="card quick-card ${isHome?'quick-home':''}">${panelTitle(t('quick'),`<span class="section-sub">${icon('spark',14)} ${safeText(t('quickSub'))}</span>`)}
 ${!isHome?`<div class="category-filter" role="group" aria-label="${safeText(t('categories'))}">${filters.map(c=>`<button class="chip ${selected===c?'selected':''}" data-action="filter-category" data-value="${c}">${safeText(c==='all'?t('all'):(CATEGORY_NAMES[c]?.[state.settings.locale]||c))}</button>`).join('')}</div>`:''}
 <div class="activity-grid">${activities.map(a=>activityCard(a,{compact:isHome})).join('')}<button class="activity-tile add-tile" type="button" data-action="new-activity"><span class="activity-icon">${icon('plus',24)}</span><span class="activity-name">${safeText(t('addActivity'))}</span></button></div></section>`;}
function timerCard({small=false}={}){
 const a=state.timer?getActivity(state.timer.activityId,state):null;
 return `<section class="card timer-card ${small?'small':''}">${panelTitle(t('current'),`<span class="quiet-tag">${icon('clock',14)} ${a?loc('Đang tính giờ','Timer active'):loc('Chưa có phiên','No active session')}</span>`)}
 ${a?`<div class="timer-active"><div class="timer-description"><span class="mini-activity color-${a.color}">${activityIllustration(a,36)}</span><div><strong>${safeText(label(a))}</strong><small>${safeText(CATEGORY_NAMES[a.category]?.[state.settings.locale]||'')}</small></div></div><div class="timer-clock" data-timer-display>${clockText(timerElapsed(state.timer))}</div><p>${loc('Khoảnh khắc đang được ghi lại trong nhật ký cá nhân.','This moment is being recorded in your private journal.')}</p><div class="timer-actions"><button class="soft-btn" type="button" data-action="toggle-timer">${icon(state.timer.runningSince===null?'play':'pause',16)} ${t(state.timer.runningSince===null?'resume':'pause')}</button><button class="primary-btn" data-action="stop-timer" type="button">${icon('check',16)} ${t('finish')}</button></div></div>`
 :`<div class="timer-idle"><div class="lotus-mark">${icon('lotus',42)}</div><p>${loc('Một cuốn sách, một buổi chạy, hay một khoảng nghỉ... hãy chọn biểu tượng để bắt đầu.','A book, a run, or a moment of rest... choose an icon to begin.')}</p><button class="text-link" type="button" data-action="show-quick">${t('chooseActivity')} ${icon('arrow',16)}</button></div>`}</section>`;
}
function clockText(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return `${h?String(h).padStart(2,'0')+':':''}${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;}
function timeline({compact=false,day=ui.selectedDate,limit=0}={}){
 const entries=entriesForDay(state,day);const arr=limit?entries.slice(0,limit):entries;
 const preview=compact&&arr.length===0?`<div class="sample-journal-tag">${loc('VÍ DỤ NHẬT KÝ · CHƯA GHI NHẬN','JOURNAL EXAMPLE · NO ACTIVITY LOGGED')}</div><div class="sample-entry"><span>07:30</span><i>☀️</i><strong>${loc('Thức dậy','Wake up')}</strong></div><div class="sample-entry"><span>08:15</span><i>📖</i><strong>${loc('Đọc sách','Read a book')}</strong></div><div class="sample-entry"><span>12:00</span><i>🍜</i><strong>${loc('Ăn trưa','Lunch')}</strong></div><button class="sample-action" type="button" data-action="show-quick">${icon('plus',15)} ${loc('Bắt đầu nhật ký thật của bạn','Record your first real moment')}</button>`:'';
 return `<section class="card timeline-card">${panelTitle(compact?t('journalToday'):t('journal'),compact?`<a class="text-link" href="/app/journal" data-nav="app/journal">${t('viewAll')} ${icon('right',15)}</a>`:`<span class="quiet-tag">${entries.length} ${t('moments').toLowerCase()}</span>`)}
 <div class="timeline">${arr.length?arr.map(e=>entryRow(e,compact)).join(''):preview||`<div class="empty-state journal-empty">${icon('feather',34)}<strong>${safeText(t('noEntries'))}</strong><p>${safeText(t('noEntriesHint'))}</p><button class="outline-btn" data-action="show-quick">${icon('plus',16)} ${loc('Ghi hoạt động đầu tiên','Log your first activity')}</button></div>`}</div>
 ${!compact&&entries.length?`<div class="timeline-foot">${icon('shield',15)} ${loc('Nhật ký mặc định chỉ mình bạn thấy.','Your journal is private by default.')}</div>`:''}</section>`;
}
function entryRow(e,compact){const a=getActivity(e.activityId,state);if(!a)return '';const duration=e.kind==='duration'?formatDuration(e.durationSec,state.settings.locale):e.kind==='count'?`${e.quantity} ${loc('lần','times')}`:'';
 return `<div class="timeline-entry"><span class="timeline-hour">${safeText(formatTime(e.startedAt,state.settings.locale,tz()))}</span><span class="timeline-node"></span><span class="entry-icon color-${a.color}">${activityIllustration(a,24)}</span><div class="entry-body"><strong>${safeText(label(a))}</strong>${duration?`<small>${safeText(duration)}</small>`:''}${e.note?`<p>${safeText(e.note)}</p>`:''}</div>${!compact?`<button class="entry-edit" type="button" data-action="edit-entry" data-id="${safeText(e.id)}" title="${safeText(t('edit'))}" aria-label="${safeText(t('edit'))}">${icon('edit',16)}</button>`:''}</div>`;}
function miniCalendar(){const today=zonedDate(new Date(),tz());const parts=dateParts(ui.selectedDate);const first=`${parts.y}-${String(parts.m).padStart(2,'0')}-01`;
 const offset=(dayFromISO(first).getDay()+6)%7, cells=Array.from({length:Math.ceil((new Date(parts.y,parts.m,0).getDate()+offset)/7)*7},(_,i)=>shiftDate(first,i-offset));
 return `<section class="card mini-calendar">${panelTitle(t('calendarQuick'),`<a class="text-link" href="/app/calendar" data-nav="app/calendar">${t('viewAll')} ${icon('right',14)}</a>`)}
 <div class="cal-head-inline"><strong>${safeText(formatDate(first,state.settings.locale,{month:'long',year:'numeric'}))}</strong><div class="cal-arrows"><button data-action="shift-month" data-delta="-1" aria-label="Previous month">${icon('left',15)}</button><button data-action="shift-month" data-delta="1" aria-label="Next month">${icon('right',15)}</button></div></div>
 <div class="mini-grid">${weekdayHeaders().map(d=>`<span class="weekday">${d}</span>`).join('')}${cells.map(iso=>{const month=dateParts(iso).m===parts.m;const any=entriesForDay(state,iso).length||plansForDay(state,iso).length;return `<button type="button" class="mini-day ${month?'':'is-faded'} ${iso===today?'is-today':''} ${iso===ui.selectedDate?'is-selected':''}" data-action="pick-day" data-date="${iso}"><span>${dateParts(iso).d}</span>${state.settings.showMoon?`<em class="mini-moon" aria-hidden="true">${phaseGlyph(lunarForISO(iso).day)}</em>`:''}${any?'<i></i>':''}</button>`;}).join('')}</div>
 <div class="mini-day-plan">${plansForDay(state,ui.selectedDate).slice(0,2).map(p=>`<div class="mini-plan"><span class="plan-dot"></span><span>${safeText(p.time)}</span><strong>${safeText(p.title)}</strong></div>`).join('')||`<p class="muted">${safeText(t('noPlans'))}</p>`}</div><div class="moon-cycle-strip" aria-label="${safeText(loc('Chu kỳ Mặt Trăng','Moon phases'))}">${[['🌑',loc('Trăng non','New moon')],['🌓',loc('Bán nguyệt','First quarter')],['🌕',loc('Trăng tròn','Full moon')],['🌗',loc('Trăng khuyết','Last quarter')]].map(([glyph,name])=>`<span><b>${glyph}</b><small>${safeText(name)}</small></span>`).join('')}</div></section>`;
}
function weekdayHeaders(){return state.settings.locale==='vi'?['T2','T3','T4','T5','T6','T7','CN']:['M','T','W','T','F','S','S'];}
function statsMini(){const s=weeklySummary(state,ui.selectedDate);return `<section class="card stats-mini">${panelTitle(t('insightsQuick'),`<a class="text-link" data-nav="app/insights" href="/app/insights">${t('viewAll')} ${icon('right',14)}</a>`)}
 <div class="stats-mini-value"><strong>${safeText(formatDuration(s.totalSeconds,state.settings.locale))}</strong><small>${safeText(t('totalTime'))}</small></div>
 ${bars(s.byDay,s.days,true)}<div class="stats-mini-bottom"><span>${icon('feather',15)} ${s.entries.length} ${safeText(t('moments').toLowerCase())}</span><span>${icon('sun',15)} ${s.activeDays}/7 ${safeText(t('activeDays').toLowerCase())}</span></div></section>`;}
function bars(byDay,days,mini=false){const heights=byDay.map(arr=>totalDuration(arr)),max=Math.max(...heights,3600);
 return `<div class="bars ${mini?'bars-mini':''}" role="img" aria-label="${safeText(loc('Biểu đồ thời lượng trong tuần','Weekly activity duration chart'))}">${heights.map((s,i)=>`<div class="bar-slot" title="${safeText(formatDate(days[i],state.settings.locale,{weekday:'long',day:'numeric'}))}: ${safeText(formatDuration(s,state.settings.locale))}"><div class="bar-track"><div class="bar-fill" style="height:${Math.max(s?5:2,s/max*100)}%;background:${['#a7c9e3','#76bfb5','#c8b0e8','#e6c68a','#8ebfab','#edbfae','#aec9e6'][i]}"></div></div><small>${safeText(formatDate(days[i],state.settings.locale,{weekday:'short'}))}</small></div>`).join('')}</div>`;}
function worldTeaser(){return `<section class="card world-teaser"><div class="world-teaser-art"><span>${icon('mountain',15)} ${safeText(t('yourWorld'))}</span></div><div class="world-teaser-body"><div><strong>${safeText(t('worldUnavailable'))}</strong><p>${loc('Giao hoạt động cho avatar khi backend được tích hợp.','Send activities to your avatar once backend integration is ready.')}</p></div><a class="round-arrow" href="/app/world" data-nav="app/world" aria-label="${safeText(t('world'))}">${icon('arrow',18)}</a></div></section>`;}

function mysticDayPreview(){const selected=ui.selectedDate,lunar=lunarForISO(selected);return `<section class="card day-preview">
 ${panelTitle(loc('Chi tiết ngày','Day details'),`<a href="/app/calendar" data-nav="app/calendar" class="text-link">${t('viewAll')} ${icon('right',14)}</a>`)}
 <div class="day-preview-head"><div class="day-preview-moon" role="img" aria-label="${safeText(moonLabel(lunar.day))}"></div><div><small>${safeText(formatDate(selected,state.settings.locale))}</small><strong>${loc('Âm lịch','Lunar')} ${lunar.day}/${lunar.month}</strong><span>${state.settings.showCanChi?safeText(canChiDay(selected)+' · '+canChiYear(lunar.year)):loc('Một ngày bình an','A peaceful day')}</span></div></div>
 <div class="day-preview-facts"><span>${icon('moon',16)} ${safeText(moonLabel(lunar.day))}</span><span>${icon('spark',16)} ${loc('Tiết khí & lịch truyền thống','Traditional calendar')}</span></div>
 <div class="day-preview-suggestions"><strong>${icon('lotus',17)} ${loc('Gợi ý dành thời gian cho','Make room for')}</strong><div><span>${icon('book',17)} ${loc('Đọc sách','Reading')}</span><span>${icon('run',17)} ${loc('Vận động','Movement')}</span><span>${icon('moon',17)} ${loc('Nghỉ ngơi','Rest')}</span><span>${icon('calendar',17)} ${loc('Lên kế hoạch','Planning')}</span></div></div>
 <p class="day-preview-legal">${loc('Lịch truyền thống mang tính văn hóa, không phải lời dự đoán.','Cultural calendar details are not predictions.')}</p></section>`;}
function journalMood(){const value=state.moods?.[ui.selectedDate]||''; const items=[['joy','😊',loc('Vui vẻ','Happy')],['calm','🌿',loc('Bình tĩnh','Calm')],['focus','🎯',loc('Tập trung','Focused')],['drive','✨',loc('Hứng khởi','Motivated')],['tired','😴',loc('Mệt mỏi','Tired')]];
 return `<section class="card mood-panel">${panelTitle(loc('Tâm trạng hôm nay','Today’s mood'),`<span class="quiet-tag">${loc('Riêng tư','Private')}</span>`)}<div class="mood-grid">${items.map(([k,emoji,name])=>`<button class="mood-choice ${value===k?'selected':''}" type="button" data-action="choose-mood" data-value="${k}" aria-pressed="${value===k}"><span>${emoji}</span><small>${safeText(name)}</small></button>`).join('')}</div></section>`;
}
function journalRitual(){const today=entriesForDay(state,ui.selectedDate);const types=[['learning','book',loc('Tri thức','Knowledge')],['movement','run',loc('Luyện thể','Movement')],['rest','moon',loc('Dưỡng thần','Rest')],['work','briefcase',loc('Công việc','Work')]];
 const values=types.map(([category,iconName,label])=>{const sec=today.filter(e=>getActivity(e.activityId,state)?.category===category).reduce((sum,e)=>sum+(e.kind==='duration'?e.durationSec:0),0);return {category,iconName,label,sec};});const max=Math.max(1,...values.map(v=>v.sec));
 return `<section class="card cultivation-panel">${panelTitle(loc('Nhịp tu dưỡng trong ngày','Today’s cultivation rhythm'))}<p class="culture-caption">${loc('Từ nhật ký đời sống, không phải chỉ số sức mạnh trong game.','Based on real-life logs, not game power stats.')}</p><div class="ritual-bars">${values.map(v=>`<div class="ritual-row"><span>${icon(v.iconName,19)}</span><div><strong>${safeText(v.label)}</strong><small>${safeText(formatDuration(v.sec,state.settings.locale))}</small><i style="--progress:${Math.round(v.sec/max*100)}%"></i></div></div>`).join('')}</div></section>`;
}
function homePage(){const iso=zonedDate(new Date(),tz());ui.selectedDate ||=iso;return `${hero(t('greet'),t('greetSub'),{eyebrow:loc('TU TIEN · NHẬT KÝ ĐỜI SỐNG','TU TIEN · LIVING JOURNAL'),quote:loc('Tích tiểu thành đại, mỗi ngày đều là một bước tu hành.','Small steps, steady cultivation.')})}
 <div class="date-ribbon"><div>${icon('moon',18)} <strong>${safeText(formatDate(ui.selectedDate,state.settings.locale,{weekday:'long',day:'numeric',month:'long',year:'numeric'}))}</strong><span class="ribbon-separator"></span><span>${loc('Âm lịch','Lunar')} ${lunarForISO(ui.selectedDate).day}/${lunarForISO(ui.selectedDate).month} · ${canChiYear(lunarForISO(ui.selectedDate).year)}</span></div><span class="ribbon-note">${icon('shield',14)} ${loc('Riêng tư theo mặc định','Private by default')}</span></div>
 ${quickCheckin(true)}
 <div class="home-grid"><div class="home-left">${miniCalendar()}${worldTeaser()}</div><div class="home-middle">${mysticDayPreview()}${timerCard({small:true})}</div><div class="home-right">${timeline({compact:true,day:iso,limit:5})}${statsMini()}</div></div>`;}
function daySwitch(){return `<div class="day-switch"><button data-action="shift-day" data-delta="-1" aria-label="Previous day">${icon('left',17)}</button><strong>${safeText(formatDate(ui.selectedDate,state.settings.locale))}</strong><button data-action="shift-day" data-delta="1" aria-label="Next day">${icon('right',17)}</button><button class="today-chip" data-action="goto-today">${safeText(t('today'))}</button></div>`;}
function journalPage(){const entries=entriesForDay(state,ui.selectedDate);
 return `${hero(loc('Ghi lại hôm nay, nuôi dưỡng chính mình.','Log today, nurture a better you.'),loc('Đời sống thực là hành trình tu dưỡng mỗi ngày.','Your real life is your cultivation journey.'),{compact:true,eyebrow:'LIFE JOURNAL / NHẬT KÝ'})}
 <div class="page-overline">${daySwitch()}<span class="ghost-counter">${entries.length} ${t('moments').toLowerCase()} · ${icon('shield',14)} ${t('private')}</span></div>
 ${quickCheckin(true)}
 <div class="journal-grid"><div class="journal-quick">${timerCard()}</div><div class="journal-entries">${timeline({day:ui.selectedDate})}</div><div class="journal-aside">${journalMood()}${journalRitual()}</div></div>`;}
function planList(iso){const plans=plansForDay(state,iso);return `<div class="plan-list">${plans.length?plans.map(p=>`<div class="plan-row"><span class="plan-time">${safeText(p.time||'--:--')}</span><span class="plan-dot ${p.status==='done'?'plan-done':''}"></span><div class="plan-info"><strong>${safeText(p.title)}</strong><small>${p.repeat==='weekly'?loc('Lặp lại mỗi tuần','Weekly repeat'):p.repeat==='daily'?loc('Mỗi ngày','Daily'):safeText(p.durationMinutes)+' '+loc('phút','min')}${p.status==='done'?` · ${t('done')}`:''}</small></div><button type="button" class="plan-edit-btn" data-action="edit-plan" data-id="${safeText(p.id)}" aria-label="${safeText(t('edit'))}">${icon('edit',17)}</button></div>`).join(''):`<p class="empty-slim">${safeText(t('noPlans'))}</p>`}</div>`;}
function calendarPage(){const [y,m]=ui.monthAnchor.split('-').map(Number);const first=`${y}-${String(m).padStart(2,'0')}-01`;const end=new Date(y,m,0).getDate();const offset=(dayFromISO(first).getDay()+6)%7;const size=Math.ceil((end+offset)/7)*7;const days=Array.from({length:size},(_,i)=>shiftDate(first,i-offset));const selected=ui.selectedDate;const selectedLunar=lunarForISO(selected);const sDate=dateParts(selected);
 return `${hero(t('calendar'),loc('Thiên thời · Địa lợi · Nhân hòa — và những kế hoạch của bạn.','Heaven, earth and your own plans — in harmony.'),{compact:true,eyebrow:loc('LỊCH ÂM DƯƠNG · MYSTIC CALENDAR','MYSTIC CALENDAR · SOLAR & LUNAR')})}
 <div class="calendar-controls"><div class="calendar-title-bar"><button class="square-btn" data-action="month-go" data-delta="-1" aria-label="Previous month">${icon('left',18)}</button><h2>${safeText(formatDate(first,state.settings.locale,{month:'long',year:'numeric'}))}</h2><button class="square-btn" data-action="month-go" data-delta="1" aria-label="Next month">${icon('right',18)}</button><button class="outline-btn" data-action="goto-today">${t('today')}</button></div>
 <div class="calendar-control-end"><div class="segmented"><button class="${ui.plannerView==='month'?'current':''}" data-action="set-calendar-view" data-value="month">${t('month')}</button><button class="${ui.plannerView==='week'?'current':''}" data-action="set-calendar-view" data-value="week">${t('week')}</button><button class="${ui.plannerView==='day'?'current':''}" data-action="set-calendar-view" data-value="day">${t('day')}</button></div>${pillAction('add-plan',t('createPlan'))}</div></div>
 <div class="calendar-layout"><section class="card calendar-surface">
 ${ui.plannerView==='month'?`<div class="calendar-month-grid">${weekdayHeaders().map(d=>`<span class="cal-weekday">${d}</span>`).join('')}${days.map(iso=>calendarCell(iso, m)).join('')}</div>`:
 ui.plannerView==='week'?`<div class="week-agenda">${dateRange(startWeek(selected),7).map(iso=>`<button class="agenda-row ${iso===selected?'is-current':''}" data-action="pick-day" data-date="${iso}"><span class="agenda-number">${dateParts(iso).d}<small>${safeText(formatDate(iso,state.settings.locale,{weekday:'short'}))}</small></span><span class="agenda-label">${plansForDay(state,iso).map(p=>`<span class="agenda-plan">${safeText(p.time)} · ${safeText(p.title)}</span>`).join('')||`<em>${safeText(t('noPlans'))}</em>`}</span><span class="agenda-log">${entriesForDay(state,iso).length} ${t('done').toLowerCase()}</span></button>`).join('')}</div>`:
 `<div class="day-agenda">${daySwitch()}<h3>${t('planForDay')}</h3>${planList(selected)}<h3>${t('realLog')}</h3>${entriesForDay(state,selected).map(e=>entryRow(e,true)).join('')||`<p class="empty-slim">${t('noEntries')}</p>`}</div>`}
 <div class="calendar-legend"><span><i class="legend-dot plans"></i>${t('planned')}</span><span><i class="legend-dot logs"></i>${t('done')}</span>${state.settings.showLunar?`<span>${icon('moon',15)} ${t('lunar')}</span>`:''}</div></section>
 <aside class="calendar-aside"><section class="card mystic-day-panel"><div class="detail-ornament">${icon('sun',17)} ${safeText(t('calendarCulture'))}</div><div class="moon-date"><div class="moon-disc" aria-hidden="true"></div><div><small>${safeText(formatDate(selected,state.settings.locale))}</small><strong>${state.settings.showLunar?`${selectedLunar.day} / ${selectedLunar.month} ${loc('Âm lịch','Lunar')}`:safeText(t('solar'))}</strong>${state.settings.showCanChi?`<span>${canChiDay(selected)} · ${canChiYear(selectedLunar.year)}</span>`:''}</div></div>
 <div class="mystic-facts">${state.settings.showMoon?`<div><span>${icon('moon',17)} ${t('moonPhase')}</span><strong>${moonLabel(selectedLunar.day)}</strong></div>`:''}${state.settings.showCanChi?`<div><span>${icon('spark',17)} ${t('canChi')}</span><strong>${canChiDay(selected)}</strong></div>`:''}<div><span>${icon('calendar',17)} ${t('solar')}</span><strong>${sDate.d}/${sDate.m}/${sDate.y}</strong></div></div>
 ${state.settings.showCulturalTips?`<p class="cultural-note">${icon('info',15)} ${safeText(t('culturalNote'))}</p>`:''}</section>
 <section class="card plan-panel">${panelTitle(t('planForDay'),`<button class="icon-button" data-action="add-plan" aria-label="${t('add')}">${icon('plus',19)}</button>`)}${planList(selected)}</section>
 <section class="card logged-panel">${panelTitle(t('realLog'),`<span class="quiet-tag">${entriesForDay(state,selected).length}</span>`)}${entriesForDay(state,selected).length?entriesForDay(state,selected).slice(0,4).map(e=>entryRow(e,true)).join(''):`<p class="empty-slim">${t('noEntries')}</p>`}</section></aside></div>`;}
function calendarCell(iso,month){const d=dateParts(iso),outside=d.m!==month;const lunar=lunarForISO(iso);const plans=plansForDay(state,iso);const logs=entriesForDay(state,iso);
 return `<button class="calendar-cell ${outside?'outside':''} ${ui.selectedDate===iso?'selected':''} ${isToday(iso)?'today':''}" data-action="pick-day" data-date="${iso}" aria-label="${safeText(formatDate(iso,state.settings.locale))}"><span class="calendar-cell-top"><b>${d.d}</b>${state.settings.showMoon?`<em class="cal-moon" aria-label="${safeText(moonLabel(lunar.day))}">${phaseGlyph(lunar.day)}</em>`:''}${state.settings.showLunar?`<small>${lunar.day===1?`${lunar.day}/${lunar.month}`:lunar.day}</small>`:''}</span><span class="cal-lunar-label">${state.settings.showCanChi?`${safeText(canChiDay(iso).split(' ')[0])}`:''}</span><span class="calendar-cell-markers">${plans.length?`<i class="cal-dot plan" title="${safeText(t('planned'))}"></i>`:''}${logs.length?`<i class="cal-dot log" title="${safeText(t('done'))}"></i>`:''}</span><span class="calendar-cell-snippet">${plans.length?safeText(plans[0].title):logs.length?safeText(label(getActivity(logs[0].activityId,state))):''}</span></button>`;}
function moonLabel(day){if(day<=3)return loc('Trăng non','New moon');if(day<=8)return loc('Trăng lưỡi liềm','Waxing crescent');if(day<=12)return loc('Trăng bán nguyệt','First quarter');if(day<=17)return loc('Trăng tròn','Full moon');if(day<=23)return loc('Trăng khuyết','Waning moon');return loc('Trăng cuối tháng','Balsamic moon');}
function insightsPage(){let summary,days;const selected=ui.selectedDate;
 if(ui.insightsPeriod==='month'){
  const date=dateParts(selected),daysCount=new Date(date.y,date.m,0).getDate();days=dateRange(`${date.y}-${String(date.m).padStart(2,'0')}-01`,daysCount);
  summary={days,byDay:days.map(d=>entriesForDay(state,d))};summary.entries=summary.byDay.flat();summary.totalSeconds=totalDuration(summary.entries);summary.activeDays=summary.byDay.filter(a=>a.length).length;
 }else{summary=weeklySummary(state,selected);days=summary.days;}
 const byCategory={};const byActivity={};for(const entry of summary.entries){const a=getActivity(entry.activityId,state);if(!a)continue;const c=a.category;if(entry.kind==='duration')byCategory[c]=(byCategory[c]||0)+entry.durationSec;const v=byActivity[entry.activityId]||{count:0,sec:0};v.count++;if(entry.kind==='duration')v.sec+=entry.durationSec;byActivity[entry.activityId]=v;}
 const catSorted=Object.entries(byCategory).sort((a,b)=>b[1]-a[1]);const actSorted=Object.entries(byActivity).sort((a,b)=>b[1].count-a[1].count);
 const maxSec=Math.max(1,...catSorted.map(c=>c[1]));const gridDays=ui.insightsPeriod==='month'?summary.byDay.reduce((chunks,day,i)=>{const bucket=Math.floor(i/7);if(!chunks[bucket])chunks[bucket]=[];chunks[bucket].push(day);return chunks;},[]):null;
 return `${hero(loc('Thống kê & thấu hiểu','Insights & self-discovery'),loc('Nhìn lại mỗi ngày. Mỗi con số đều là một câu chuyện nhỏ.','See your days clearly. Every number tells a little story.'),{compact:true,eyebrow:loc('NHỊP SỐNG · WEEKLY RHYTHM','LIFE RHYTHM · GENTLE INSIGHTS')})}
 <div class="insights-controls"><h2>${t('summary')}</h2><div class="segmented"><button data-action="period" data-value="week" class="${ui.insightsPeriod==='week'?'current':''}">${t('week')}</button><button data-action="period" data-value="month" class="${ui.insightsPeriod==='month'?'current':''}">${t('month')}</button></div></div>
 <div class="metrics-row"><div class="metric-card">${icon('clock',24)}<strong>${safeText(formatDuration(summary.totalSeconds,state.settings.locale))}</strong><span>${t('totalTime')}</span></div>
 <div class="metric-card">${icon('feather',24)}<strong>${summary.entries.length}</strong><span>${t('moments')}</span></div>
 <div class="metric-card">${icon('sun',24)}<strong>${summary.activeDays}<small>/${days.length}</small></strong><span>${t('activeDays')}</span></div>
 <div class="metric-card">${icon('lotus',24)}<strong>${actSorted.length}</strong><span>${t('activities')}</span></div></div>
 <div class="insights-grid"><section class="card insights-chart">${panelTitle(t('rhythm'),`<span class="quiet-tag">${ui.insightsPeriod==='month'?t('thisMonth'):t('thisWeek')}</span>`)}${summary.entries.length?(ui.insightsPeriod==='month'?`<div class="month-bars">${gridDays.map((week,i)=>`<div class="month-bar"><span>${loc('Tuần','Week')} ${i+1}</span><strong>${formatDuration(totalDuration(week.flat()),state.settings.locale)}</strong><div class="month-bar-track"><i style="width:${Math.max(1,totalDuration(week.flat())/Math.max(1,summary.totalSeconds)*100)}%"></i></div></div>`).join('')}</div>`:bars(summary.byDay,days)):`<div class="empty-visual">${icon('chart',44)}<p>${t('emptyStats')}</p></div>`}</section>
 <section class="card insights-categories">${panelTitle(t('categoriesTime'))}${catSorted.length?catSorted.map(([cat,seconds])=>`<div class="category-bar-row"><div class="category-bar-label"><strong>${safeText(CATEGORY_NAMES[cat]?.[state.settings.locale]||cat)}</strong><span>${safeText(formatDuration(seconds,state.settings.locale))}</span></div><div class="category-line"><span style="width:${Math.max(3,seconds/maxSec*100)}%;background:${CATEGORY_COLORS[cat]||'#abc'}"></span></div></div>`).join(''):`<p class="empty-slim">${t('emptyStats')}</p>`}</section>
 <section class="card insights-story">${panelTitle(loc('Những khoảnh khắc nổi bật','Moments that matter'))}<span class="story-graphic">${icon('feather',35)}</span>${actSorted.length?`<h3>${loc('Tuần này, bạn đã...','During this period, you...')}</h3><p>${loc('Ghi nhận','Logged')} <strong>${actSorted[0][1].count}</strong> ${loc('lần','times')} <strong>${safeText(label(getActivity(actSorted[0][0],state)))}</strong>. ${loc('Những thói quen nhỏ tạo nên bức tranh của riêng bạn.','Your little moments make up a picture that is uniquely yours.')}</p>`:`<h3>${loc('Hành trình bắt đầu từ một dấu mốc.','A journey begins with one moment.')}</h3><p>${t('emptyStats')}</p>`}</section>
 </div>${renderInsightCultureCards(summary,byCategory,actSorted)}<section class="card insight-table">${panelTitle(loc('Chi tiết hoạt động','Activity breakdown'))}<div class="table-wrap"><table><thead><tr><th>${t('activities')}</th><th>${loc('Số lần','Times')}</th><th>${t('totalTime')}</th></tr></thead><tbody>${actSorted.length?actSorted.map(([id,o])=>`<tr><td>${safeText(label(getActivity(id,state)))}</td><td>${o.count}</td><td>${safeText(o.sec?formatDuration(o.sec,state.settings.locale):'—')}</td></tr>`).join(''):`<tr><td colspan="3">${t('emptyStats')}</td></tr>`}</tbody></table></div></section>`;}
// Charts use the owner's actual local journal data. Blank history is always 0.
function renderInsightCultureCards(summary,byCategory,actSorted){
 const all=Math.max(0,summary.totalSeconds);const keys=['learning','movement','rest','work'];
 const palette=['#76bda5','#8a89ca','#b7c5e9','#e5bd7c','#c9c0b2'];
 const values=keys.map(k=>byCategory[k]||0);values.push(Math.max(0,all-values.reduce((n,v)=>n+v,0)));
 let start=0;const bands=values.map((v,i)=>{const a=start;start+=all?100*v/all:0;return `${palette[i]} ${a.toFixed(2)}% ${start.toFixed(2)}%`;});
 const paint=all?`conic-gradient(${bands.join(',')})`:'conic-gradient(#e8decc 0 100%)';
 let anchor=zonedDate(new Date(),tz());if(!entriesForDay(state,anchor).length)anchor=shiftDate(anchor,-1);
 let streak=0;while(streak<3650 && entriesForDay(state,anchor).length){streak++;anchor=shiftDate(anchor,-1);}
 const selected=summary.days.slice(-7),hits=selected.map(day=>entriesForDay(state,day).length>0);
 return `<div class="insight-extra"><section class="card balance-card">${panelTitle(loc('Cân bằng hoạt động','Activity balance'))}<div class="balance-visual"><div class="balance-ring ${all?'':'empty'}" style="background:${paint}"><span>${all?Math.round((values[0]+values[1])/all*100):0}%<small>${loc('Học & vận động','Learn & move')}</small></span></div><div class="balance-captions">${keys.map((k,i)=>`<span><i style="background:${palette[i]}"></i><strong>${safeText(CATEGORY_NAMES[k]?.[state.settings.locale]||k)}</strong><em>${safeText(formatDuration(values[i],state.settings.locale))}</em></span>`).join('')}</div></div><p class="culture-caption">${loc('Tổng hợp từ thời lượng đã ghi, không phải đánh giá sức khỏe.','Only logged durations; not a health score.')}</p></section>
 <section class="card streak-card">${panelTitle(loc('Chuỗi ngày ghi nhật ký','Journal streak'))}<div class="streak-sun" aria-hidden="true">☀</div><strong>${streak} <small>${loc('ngày liên tiếp','consecutive days')}</small></strong><p>${loc('Không cần hoàn hảo. Mỗi hoạt động thật đều đáng ghi lại.','No need for perfection. Your real moments matter.')}</p><div class="streak-dots">${hits.map((v,i)=>`<i class="${v?'on':''}" title="${safeText(formatDate(selected[i],state.settings.locale))}">${v?'✓':'·'}</i>`).join('')}</div></section></div>`;
}
function worldPage(){const places=[['sect-library','book',loc('Thư Phòng','Library Pavilion')],['sect-training','run',loc('Luyện Thể','Training Yard')],['sect-garden','lotus',loc('Linh Điền','Spirit Field')],['sidebar-illustration','moon',loc('Động Phủ','Resting Chamber')]];
return `${hero(loc('Thế giới Tu Tiên của bạn','Your cultivation world'),loc('Cuộc sống thật là một hành trình; thế giới tu tiên là một hành trình khác.','Your real-life journey and in-game journey complement one another.'),{compact:true,eyebrow:'TU TIEN · GAME WORLD'})}
<div class="world-notice">${icon('info',16)} ${loc('Bản xem trước giao diện. Trạng thái nhân vật thực cần kết nối Nakama; nhật ký không tự cấp phần thưởng.','Design preview. Live avatar data requires Nakama; journal entries never award game rewards.')}</div>
<div class="world-layout"><section class="card profile-card"><img class="world-portrait" src="/assets/avatar-portrait.webp" alt=""/><h2>${loc('Hành giả','The traveler')}</h2><p>${loc('Hồ sơ nhân vật sẽ xuất hiện khi đăng nhập.','Your character appears after sign-in.')}</p><div class="connection-badge offline">${icon('lock',15)} ${t('worldUnavailable')}</div><div class="profile-divider"></div><div class="profile-placeholder"><span>${loc('Cảnh giới','Cultivation')}</span><strong>—</strong><span>${loc('Kinh nghiệm','Experience')}</span><strong>—</strong></div><div class="profile-motto">${loc('Đời sống hôm nay, đạo tâm ngày mai.','Every day builds your path.')}</div></section>
<section class="card world-showcase"><div class="world-showcase-art"><div class="world-art-title">${icon('mountain',21)} <span>${loc('Cảnh giới đang chờ khám phá','A world waiting to be discovered')}</span></div><span class="world-stamp">TU TIEN</span></div><div class="world-showcase-info"><div><h2>${t('worldState')}</h2><p>${t('worldText')}</p></div><button class="disabled-action" type="button" disabled>${icon('lock',16)} ${loc('Đợi kết nối','Not connected')}</button></div><div class="world-area-grid">${places.map(([img,ico,name])=>`<div class="world-area" style="--area:url('/assets/${img}.webp')"><strong>${icon(ico,18)} ${safeText(name)}</strong><small>${loc('Minh họa khu vực','Concept artwork')}</small></div>`).join('')}</div></section>
<aside class="world-side"><section class="card game-sync-status">${panelTitle(loc('Hoạt động nhân vật','Avatar activity'))}<div class="game-offline-symbol">${icon('moon',32)}</div><strong>${loc('Hiện chưa có phiên đồng bộ','No live session yet')}</strong><p>${loc('Sau khi kết nối, tại đây sẽ hiển thị đi câu, chăm vườn hoặc thiền định theo lệnh của bạn.','Once connected, this will show server-authoritative fishing, gardening and meditation sessions.')}</p></section><section class="card">${panelTitle(t('worldProgress'))}<div class="integration-steps">${['queued','travelling','active','completed'].map((v,i)=>`<div><span>${i+1}</span><strong>${v}</strong><small>${loc('Chưa kết nối','Offline')}</small></div>`).join('')}</div></section></aside></div>`;}
function communityPage(){const tabs=[['friends',t('friendStatus')],['sects',t('sect')],['together',t('companion')],['feed',t('feed')]];
const friends=[['Linh Khí','book',loc('Đọc sách','Reading')],['Mộc Nhi','run',loc('Chạy bộ','Running')],['Thanh Phong','school',loc('Học tập','Studying')],['Yên Nhi','lotus',loc('Thiền định','Meditating')]];
const sects=[['sect-library',loc('Tàng Thư Các','Reading Club'),'📖'],['sect-training',loc('Luyện Thể Đường','Fitness Guild'),'🏃'],['sect-school',loc('Học Phủ','Study Circle'),'🎓'],['sect-garden',loc('Dưỡng Sinh Các','Wellness Group'),'🌿']];
return `${hero(loc('Cộng đồng đạo hữu','Cultivation community'),loc('Nơi những hành trình đời thực gặp nhau và cùng tiến bộ.','Life beyond the screen, together on the same path.'),{compact:true,eyebrow:'COMMUNITY · ĐỒNG TU'})}
<div class="social-preview-note">${icon('info',16)} ${loc('GIAO DIỆN MINH HỌA — bạn bè, tông môn và đồng tu chưa kết nối máy chủ. Không có trạng thái thật được chia sẻ.','DESIGN PREVIEW — no real friend, sect or co-cultivation data is connected or shared.')}</div>
<div class="social-banner"><div><strong>✦ ${loc('Đạo hữu đồng hành','Cultivate together')}</strong><span>${loc('Học chung · Đọc sách · Cùng vận động','Study · Read · Move together')}</span></div><div><strong>☯ ${loc('Tông môn','Sects')}</strong><span>${loc('Nhóm theo sở thích','Communities by interest')}</span></div><div><strong>❀ ${loc('Nhật ký chia sẻ','Shared moments')}</strong><span>${loc('Chủ động & riêng tư','Opt-in & private')}</span></div></div>
<div class="community-tabs" role="tablist">${tabs.map(([id,txt])=>`<button role="tab" class="${ui.communityTab===id?'selected':''}" data-action="community-tab" data-value="${id}" aria-selected="${ui.communityTab===id}">${icon(({friends:'people',sects:'mountain',together:'lotus',feed:'book'})[id],18)} ${safeText(txt)}</button>`).join('')}</div>
<div class="community-showcase"><section class="card social-friends">${panelTitle(t('friendStatus'),`<span class="quiet-tag">${loc('Mẫu thiết kế','Concept')}</span>`)}<div class="social-friend-list">${friends.map(([name,ico,activity],i)=>`<div class="social-friend"><span class="friend-portrait friend-portrait-${i}"></span><div><strong>${name}</strong><small>${icon(ico,14)} ${safeText(activity)}</small></div><i>${loc('Xem thử','Sample')}</i></div>`).join('')}</div></section>
<section class="card social-sects">${panelTitle(loc('Tông môn gợi ý','Community themes'),`<span class="quiet-tag">${loc('Minh họa','Preview')}</span>`)}<div class="sect-cards">${sects.map(([art,name,emoji])=>`<div class="sect-card"><div style="background-image:url('/assets/${art}.webp')"><span>${emoji}</span></div><strong>${safeText(name)}</strong><small>${loc('Không gian cộng đồng','Group concept')}</small></div>`).join('')}</div>
<div class="cultivate-together"><div class="cultivate-scene"></div><div><small>✦ ${loc('ĐỒNG TU HÔM NAY · MINH HỌA','CULTIVATE TOGETHER · PREVIEW')}</small><h3>${loc('Một buổi học cùng bạn bè','A study session with friends')}</h3><p>${loc('Tham gia hoạt động đời thực, avatar có thể gặp nhau trong game khi backend được hoàn thiện.','Meet in real life and let avatars gather in-game once the server integration is ready.')}</p><span class="disabled-pill">${icon('lock',15)} ${loc('Chưa khả dụng','Coming later')}</span></div></div></section>
<section class="card social-feed">${panelTitle(t('feed'))}<div class="sample-feed-tag">${loc('BÀI VIẾT VÍ DỤ · KHÔNG PHẢI DỮ LIỆU THẬT','SAMPLE POST · NOT REAL USER DATA')}</div><div class="social-post"><span class="friend-portrait"></span><div><strong>Linh Khí</strong><small>${loc('Hoạt động mẫu: Đọc sách','Sample activity: Reading')}</small><p>${loc('Một chương sách mới, một góc nhìn mới.','One more chapter, one more perspective.')}</p></div></div><img class="feed-illustration" src="/assets/sect-library.webp" alt="${safeText(loc('Tranh minh họa thư phòng','Illustrated library'))}"/><div class="social-post-actions">♥ ${loc('Thả cảm xúc','React')}　•　${loc('Bình luận','Comment')}　•　${loc('Đồng tu','Together')}</div></section>
<section class="card social-privacy">${icon('shield',28)}<div><h3>${loc('Chia sẻ do bạn lựa chọn','Sharing is always optional')}</h3><p>${loc('Nhật ký cá nhân mặc định riêng tư. Các hoạt động nhạy cảm không bao giờ tự hiển thị cho bạn bè.','Journal entries default to private. Sensitive activities are never published automatically.')}</p><a href="/app/settings" data-nav="app/settings" class="text-link">${t('settings')} ${icon('right',14)}</a></div></section></div>`;}
function settingsLink(section,name,icoName){return `<button class="settings-nav-item ${ui.section===section?'selected':''}" data-action="settings-section" data-value="${section}">${icon(icoName,19)}<span>${safeText(name)}</span>${icon('right',15)}</button>`;}
function settingsPage(){const sections=[['appearance',t('appearance'),'sun'],['language',t('location'),'world'],['mystical',t('mystical'),'moon'],['privacy',t('privacyAndData'),'shield'],['account',t('account'),'lock']];
 return `${hero(loc('Cài đặt','Settings'),loc('Tùy chỉnh trải nghiệm của bạn, hài hòa với thiên đạo.','Customize a peaceful space for your journey.'),{compact:true,eyebrow:'PREFERENCES · TU TIEN'})}
 <div class="settings-gallery"><section class="card settings-profile"><div class="settings-profile-top"><span>${icon('people',19)} ${loc('Hồ sơ của bạn','Your profile')}</span></div><img src="/assets/avatar-portrait.webp" alt=""/><strong>${loc('Hành giả','Traveler')}</strong><p>${loc('Bản dùng thử cục bộ · chưa đăng nhập','Local preview · no account linked')}</p></section>
 ${sections.map(([section])=>`<section class="card settings-gallery-card settings-card-${section}">${renderSettingsSection(section)}</section>`).join('')}
 <section class="card settings-game-settings">${panelTitle(loc('Đồng bộ thế giới game','Game world sync'))}<div class="sync-scene"></div><p>${loc('Khi có Nakama, bạn sẽ điều khiển riêng hoạt động nhân vật và quyền chia sẻ với đạo hữu.','Once connected to Nakama, avatar actions and sharing will have dedicated controls.')}</p><span class="connection-badge offline">${icon('lock',14)} ${loc('Chưa kết nối','Not connected')}</span></section></div>
 <div class="settings-layout settings-mobile"><aside class="card settings-nav">${panelTitle(t('settings'))}${sections.map(([section,name,i])=>settingsLink(section,name,i)).join('')}</aside><section class="card settings-content">${renderSettingsSection(ui.section)}</section></div>`;}
function settingsRow(iconName,title,description,control){return `<div class="setting-row"><span class="setting-icon">${icon(iconName,20)}</span><div class="setting-copy"><strong>${safeText(title)}</strong>${description?`<small>${safeText(description)}</small>`:''}</div><div class="setting-control">${control}</div></div>`;}
function switchControl(key){return `<button type="button" role="switch" aria-checked="${!!state.settings[key]}" aria-label="${safeText(t(({showLunar:'showLunar',showMoon:'showMoon',showCanChi:'showCanChi',showCulturalTips:'showTips',reducedMotion:'motion'})[key]||key))}" class="toggle-switch ${state.settings[key]?'on':''}" data-action="toggle-setting" data-key="${key}"><i></i></button>`;}
function renderSettingsSection(section){const s=state.settings;
 const settingsHeader=(title,desc)=>`<div class="settings-section-head"><span class="gold-symbol">${icon('spark',20)}</span><h2>${safeText(title)}</h2><p>${safeText(desc)}</p></div>`;
 if(section==='appearance')return `${settingsHeader(t('appearance'),loc('Một chút ánh trăng, một chút ánh ban mai.','Choose the way your journey looks and feels.'))}
 <div class="setting-group"><label class="setting-label">${t('theme')}</label><div class="theme-choices">${[['light','sun',t('light')],['dark','moon',t('dark')],['system','world',t('system')]].map(([v,i,txt])=>`<button type="button" class="theme-choice ${s.theme===v?'active':''}" data-action="theme" data-value="${v}">${icon(i,23)}<span>${safeText(txt)}</span>${s.theme===v?icon('check',14):''}</button>`).join('')}</div></div>
 ${settingsRow('feather',t('fontSize'),loc('Tăng độ dễ đọc trên mọi thiết bị.','Improve readability on any device.'),`<div class="segmented"><button data-action="font-scale" data-value="1" class="${s.fontScale===1?'current':''}">A</button><button data-action="font-scale" data-value="1.12" class="${s.fontScale===1.12?'current':''}">A+</button><button data-action="font-scale" data-value="1.23" class="${s.fontScale===1.23?'current':''}">A++</button></div>`)}
 ${settingsRow('spark',t('motion'),loc('Giảm hiệu ứng chuyển động khi cần.','Reduce interface movement when desired.'),switchControl('reducedMotion'))}`;
 if(section==='language')return `${settingsHeader(t('location'),loc('Một ngôn ngữ nhất quán, ngày giờ đúng với bạn.','One language at a time, dates and times in your region.'))}
 <div class="setting-group"><label class="setting-label">${t('chooseLang')}</label><div class="theme-choices"><button class="theme-choice ${s.locale==='vi'?'active':''}" data-action="lang" data-value="vi"><span class="lang-icon">VI</span><span>Tiếng Việt</span>${s.locale==='vi'?icon('check',15):''}</button><button class="theme-choice ${s.locale==='en'?'active':''}" data-action="lang" data-value="en"><span class="lang-icon">EN</span><span>English</span>${s.locale==='en'?icon('check',15):''}</button></div></div>
 ${settingsRow('clock',t('timezone'),loc('Áp dụng cho ngày trong nhật ký và thống kê.','Used for daily grouping across the journal.'),`<select class="form-select" data-setting-select="timezone"><option value="Asia/Ho_Chi_Minh" ${s.timezone==='Asia/Ho_Chi_Minh'?'selected':''}>Asia/Ho_Chi_Minh (UTC+7)</option><option value="Asia/Bangkok" ${s.timezone==='Asia/Bangkok'?'selected':''}>Asia/Bangkok (UTC+7)</option><option value="Asia/Tokyo" ${s.timezone==='Asia/Tokyo'?'selected':''}>Asia/Tokyo (UTC+9)</option><option value="Europe/London" ${s.timezone==='Europe/London'?'selected':''}>Europe/London</option><option value="America/New_York" ${s.timezone==='America/New_York'?'selected':''}>America/New_York</option></select>`)}`;
 if(section==='mystical')return `${settingsHeader(t('mystical'),loc('Mang nét văn hóa truyền thống vào trang lịch hiện đại.','Layer traditional calendar details over your modern plans.'))}
 ${settingsRow('moon',t('showLunar'),loc('Ngày âm bên dưới ngày dương.','Show lunar date alongside the solar date.'),switchControl('showLunar'))}
 ${settingsRow('sun',t('showCanChi'),loc('Tên ngày và năm theo Can Chi.','Show heavenly stems and earthly branches.'),switchControl('showCanChi'))}
 ${settingsRow('moon',t('showMoon'),loc('Hình tượng pha Mặt Trăng.','Display the moon phase.'),switchControl('showMoon'))}
 ${settingsRow('info',t('showTips'),loc('Giải thích văn hóa, không dự báo.','Cultural context, not predictions.'),switchControl('showCulturalTips'))}
 <p class="cultural-note">${icon('info',16)} ${t('culturalNote')}</p>`;
 if(section==='privacy')return `${settingsHeader(t('privacyAndData'),loc('Hôm nay của bạn luôn thuộc về bạn.','Your personal moments belong to you.'))}
 ${settingsRow('lock',t('sharing'),loc('Hiện tại không có chức năng chia sẻ lên máy chủ.','Social sharing is not connected in this preview.'),`<select class="form-select" data-setting-select="shareStatus"><option value="private" ${s.shareStatus==='private'?'selected':''}>${t('sharePrivate')}</option><option value="friends" ${s.shareStatus==='friends'?'selected':''} disabled>${t('shareFriends')} · ${loc('Chưa có','Unavailable')}</option></select>`)}
 <div class="settings-export">${pillAction('export-json',t('exportData'),'download','outline-btn')}${pillAction('export-csv',t('exportCsv'),'download','outline-btn')}</div>
 ${settingsRow('trash',t('eraseData'),loc('Không thể khôi phục sau khi xóa.','Cannot be restored after deletion.'),`<button class="danger-btn" data-action="clear-local">${t('delete')}</button>`)}`;
 return `${settingsHeader(t('account'),loc('Liên kết tài khoản sẽ được phát triển trong giai đoạn backend.','Account linking requires the next backend milestone.'))}
 <div class="account-warning">${icon('lock',25)}<div><h3>${t('noAccount')}</h3><p>${t('accountText')}</p></div></div><div class="connection-badge offline">${icon('shield',16)} ${loc('Dữ liệu chỉ lưu ở thiết bị','Local-only storage')}</div>`;
}
function renderApp(){const body=({'app':homePage,'app/journal':journalPage,'app/calendar':calendarPage,'app/insights':insightsPage,'app/world':worldPage,'app/community':communityPage,'app/settings':settingsPage})[ui.route]?.() || homePage();const root=document.getElementById('app');if(!root)return;
 const dark=state.settings.theme==='dark'||(state.settings.theme==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
 document.documentElement.dataset.theme=dark?'dark':'light'; document.documentElement.lang=state.settings.locale;
 document.documentElement.style.setProperty('--user-font-scale',String(state.settings.fontScale));document.documentElement.classList.toggle('reduce-motion',state.settings.reducedMotion);
 root.innerHTML=`<div class="app-shell">${renderSidebar()}<div class="main-shell">${renderTopbar()}<main id="main-content" tabindex="-1">${body}<footer class="content-footer"><span>© TuTien · Mystic Life</span><span>${icon('lock',13)} ${safeText(t('localNotice'))}</span></footer></main></div>${renderMobileNav()}</div>`;
 requestAnimationFrame(()=>animateRoute());
}
function animateRoute(){if(reduced())return;const node=document.querySelector('#main-content');if(!node)return;
 if(window.gsap){window.gsap.fromTo(node,{opacity:0,y:9},{opacity:1,y:0,duration:.32,ease:'power2.out',overwrite:'auto'});}else if(node.animate){node.animate([{opacity:.78,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});}
}
function reduced(){return state.settings.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;}
function saveRender(){saveState(state);renderApp();}
function notify(message,undoFn=null){const host=document.getElementById('toast-root');if(!host)return;ui.lastUndo=undoFn;
 host.innerHTML=`<div class="toast"><span class="toast-icon">${icon('check',17)}</span><strong>${safeText(message)}</strong>${undoFn?`<button data-action="undo">${t('undo')}</button>`:''}<button class="toast-close" data-action="hide-toast" aria-label="Close">${icon('close',14)}</button></div>`;
 if(window.gsap&&!reduced())window.gsap.fromTo(host.firstElementChild,{y:18,opacity:0},{y:0,opacity:1,duration:.25,ease:'power2.out',overwrite:'auto'});
 clearTimeout(notify.timeout);notify.timeout=setTimeout(()=>{host.innerHTML='';ui.lastUndo=null;},5500);
}
function openModal(html){const dialog=document.getElementById('app-dialog');if(!dialog)return;dialog.innerHTML=`<div class="dialog-inner">${html}</div>`;if(!dialog.open)dialog.showModal();}
function closeModal(){const dialog=document.getElementById('app-dialog');if(dialog?.open)dialog.close();}
function modalHeader(title,sub=''){return `<div class="dialog-header"><div><small>${icon('spark',15)} TU TIEN</small><h2>${safeText(title)}</h2>${sub?`<p>${safeText(sub)}</p>`:''}</div><button type="button" data-action="close-modal" class="icon-button" aria-label="${t('cancel')}">${icon('close',21)}</button></div>`;}
function formButtons(extra=''){return `<div class="form-actions">${extra}<button class="outline-btn" type="button" data-action="close-modal">${t('cancel')}</button><button class="primary-btn" type="submit">${icon('check',16)} ${t('save')}</button></div>`;}
let lastInstantCheckin={activityId:null,at:0};
function checkin(activityId){const a=getActivity(activityId,state);if(!a)return;
 if(a.kind==='event'||a.kind==='count'){
  if(a.kind==='event' && lastInstantCheckin.activityId===activityId && Date.now()-lastInstantCheckin.at<600)return;
  lastInstantCheckin={activityId,at:Date.now()};
  const entry=addLifeEntry(state,{activityId,kind:a.kind});saveRender();notify(t('recorded')+': '+label(a),()=>{state.entries=state.entries.filter(e=>e.id!==entry.id);saveRender();notify(t('undone'));});return;
 }
 ui.pendingActivity=activityId;
 openModal(`${modalHeader(label(a),loc('Ghi lại việc đang làm theo cách phù hợp.','Choose how to log this moment.'))}<div class="modal-activity"><span class="mini-activity color-${a.color}">${icon(a.icon,28)}</span><strong>${safeText(label(a))}</strong></div>
 <div class="modal-choices"><button type="button" class="choice-btn" data-action="begin-duration" data-id="${a.id}" ${state.timer?'disabled':''}>${icon('play',22)} <span><strong>${t('startTimer')}</strong><small>${state.timer?loc('Đang có một phiên khác chạy','Another timer is active'):loc('Ghi thời gian tự động','Automatically track your time')}</small></span>${icon('right',16)}</button>
 <button type="button" class="choice-btn" data-action="duration-manual" data-id="${a.id}">${icon('clock',22)}<span><strong>${t('logManual')}</strong><small>${loc('Nhập số phút hoặc ghi lại việc vừa hoàn thành','Enter minutes for a completed session')}</small></span>${icon('right',16)}</button></div>`);
}
function manualDuration(activityId){const a=getActivity(activityId,state);if(!a)return;
 openModal(`${modalHeader(t('logManual'),label(a))}<form data-form="manual-duration"><input type="hidden" name="activityId" value="${safeText(activityId)}"/><label class="field">${t('minutes')}<input type="number" name="minutes" min="1" max="1440" value="25" required autofocus/></label><label class="field">${t('notes')} <span>(${loc('tùy chọn','optional')})</span><textarea name="note" maxlength="500" rows="3" placeholder="${safeText(loc('Một dòng cho hôm nay...','A note for today...'))}"></textarea></label>${formButtons()}</form>`);
}
function entryEditor(entryId){const e=state.entries.find(e=>e.id===entryId);if(!e)return;const a=getActivity(e.activityId,state);const date=zonedDate(new Date(e.startedAt),tz());const time=formatTime(e.startedAt,state.settings.locale,tz());openModal(`${modalHeader(t('edit'),label(a))}<form data-form="edit-entry"><input name="id" type="hidden" value="${safeText(e.id)}"/><label class="field">${t('date')}<input name="date" type="date" value="${date}" required/></label><label class="field">${t('time')}<input name="time" type="time" value="${time}" required/></label>${e.kind==='duration'?`<label class="field">${t('minutes')}<input name="minutes" type="number" min="1" max="10080" value="${Math.max(1,Math.round(e.durationSec/60))}" required/></label>`:e.kind==='count'?`<label class="field">${loc('Số lần','Quantity')}<input name="quantity" type="number" min="1" max="1000" value="${e.quantity}" required/></label>`:''}<label class="field">${t('notes')}<textarea name="note" maxlength="1000" rows="3">${safeText(e.note)}</textarea></label><div class="form-actions"><button class="danger-btn" data-action="delete-entry" data-id="${safeText(e.id)}" type="button">${icon('trash',15)} ${t('delete')}</button><button class="outline-btn" type="button" data-action="close-modal">${t('cancel')}</button><button class="primary-btn" type="submit">${icon('check',15)} ${t('save')}</button></div></form>`);}
function planEditor(planId=null){const p=planId?state.plans.find(v=>v.id===planId):null;
 openModal(`${modalHeader(p?t('edit'):t('createPlan'),loc('Lên kế hoạch cho cuộc sống thật.','Plan a moment in your real life.'))}<form data-form="plan"><input name="id" type="hidden" value="${safeText(p?.id||'')}"/><label class="field">${t('title')}<input name="title" maxlength="90" required value="${safeText(p?.title||'')}" placeholder="${safeText(loc('VD: Đọc sách, đi học...','e.g. Reading, study...'))}" autofocus/></label><div class="field-grid"><label class="field">${t('startDay')}<input type="date" name="date" required value="${safeText(p?.date||ui.selectedDate)}"/></label><label class="field">${t('time')}<input type="time" name="time" value="${safeText(p?.time||'09:00')}" required/></label></div><div class="field-grid"><label class="field">${t('minutes')}<input type="number" name="durationMinutes" min="1" max="1440" value="${p?.durationMinutes||30}" required/></label><label class="field">${t('planRepeat')}<select name="repeat"><option value="none" ${!p||p.repeat==='none'?'selected':''}>${t('never')}</option><option value="daily" ${p?.repeat==='daily'?'selected':''}>${t('daily')}</option><option value="weekly" ${p?.repeat==='weekly'?'selected':''}>${t('weekly')}</option></select></label></div><label class="field">${t('notes')}<textarea name="note" maxlength="1000" rows="2">${safeText(p?.note||'')}</textarea></label><div class="form-actions">${p?`<button class="danger-btn" type="button" data-action="delete-plan" data-id="${safeText(p.id)}">${icon('trash',15)} ${t('delete')}</button>`:''}<button class="outline-btn" type="button" data-action="close-modal">${t('cancel')}</button><button class="primary-btn" type="submit">${icon('check',15)} ${t('save')}</button></div></form>`);
}
function activityEditor(){openModal(`${modalHeader(t('addActivity'),loc('Tự tạo một biểu tượng cho thói quen của bạn.','Create your own everyday activity.'))}<form data-form="create-activity"><label class="field">${t('title')}<input name="name" required maxlength="36" placeholder="${safeText(loc('Ví dụ: Chăm cây','e.g. Gardening'))}" autofocus/></label><label class="field">${t('categories')}<select name="category">${Object.entries(CATEGORY_NAMES).filter(([k])=>k!=='private').map(([k,v])=>`<option value="${k}">${safeText(v[state.settings.locale])}</option>`).join('')}</select></label><label class="field">${loc('Kiểu ghi nhận','Logging type')}<select name="kind"><option value="event">${loc('Sự kiện: chạm là ghi','Event: log with one tap')}</option><option value="count">${loc('Số lần: +1 mỗi lần chạm','Count: +1 per tap')}</option><option value="duration">${loc('Thời lượng: tính giờ / nhập phút','Duration: timer / manual')}</option></select></label><label class="field">${loc('Biểu tượng','Icon')}<select name="icon">${[['lotus',loc('Hoa sen','Lotus')],['book',loc('Sách','Book')],['feather',loc('Bút','Pen')],['run',loc('Vận động','Activity')],['moon',loc('Mặt trăng','Moon')],['drop',loc('Nước','Water')],['star',loc('Ngôi sao','Star')]].map(([k,v])=>`<option value="${k}">${safeText(v)}</option>`).join('')}</select></label>${formButtons()}</form>`);}
function quickPicker(){openModal(`${modalHeader(t('chooseActivity'),loc('Chọn một hoạt động để ghi nhận.','Pick an activity to log.'))}<div class="activity-grid modal-activity-grid">${activitiesForGrid(12).map(a=>activityCard(a,{compact:true})).join('')}</div><div class="modal-foot"><button class="outline-btn" data-action="new-activity">${icon('plus',16)} ${t('addActivity')}</button></div>`);}
function navigate(route){if(!paths.includes(route))return;closeModal();ui.route=route;window.history.pushState({route},'',href(route));renderApp();window.scrollTo({top:0,behavior:'instant'});}
function moveMonth(delta){const [year,month]=ui.monthAnchor.split('-').map(Number);const next=new Date(year,month-1+delta,1,12);ui.monthAnchor=`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`;ui.selectedDate=`${ui.monthAnchor}-01`;renderApp();}
function moveDay(delta){ui.selectedDate=shiftDate(ui.selectedDate,delta);ui.monthAnchor=ui.selectedDate.slice(0,7);renderApp();}
function selectDay(iso){ui.selectedDate=iso;ui.monthAnchor=iso.slice(0,7);renderApp();}
function switchLang(lang){if(!['vi','en'].includes(lang))return;state.settings.locale=lang;saveRender();}
function csvEscape(v){const str=String(v??'');return /[",\r\n]/.test(str)?'"'+str.replace(/"/g,'""')+'"':str;}
function download(content,name,mime){const blob=new Blob([content],{type:mime});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),500);}
function exportCsv(){const rows=[['id','activity','kind','startedAt','endedAt','durationSec','quantity','note','visibility'],...state.entries.map(e=>[e.id,label(getActivity(e.activityId,state)),e.kind,e.startedAt,e.endedAt||'',e.durationSec,e.quantity,e.note,e.visibility])];download('\ufeff'+rows.map(r=>r.map(csvEscape).join(',')).join('\r\n'),'tutien-journal.csv','text/csv;charset=utf-8');}
function utcISOForWall(date,time,timezone){
 const [year,month,day]=date.split('-').map(Number), [hours,minutes]=time.split(':').map(Number);
 const desired=Date.UTC(year,month-1,day,hours,minutes,0);let guess=desired;
 const f=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 for(let i=0;i<3;i++){
  const p=Object.fromEntries(f.formatToParts(new Date(guess)).filter(v=>v.type!=='literal').map(v=>[v.type,Number(v.value)]));
  const computed=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,0); const error=desired-computed;if(!error)break;guess+=error;
 }
 return new Date(guess).toISOString();
}
function handleAction(e){const el=e.target.closest('[data-action]');if(!el)return;const action=el.dataset.action;
 switch(action){
 case 'close-modal':closeModal();break;
 case 'hide-toast':document.getElementById('toast-root').innerHTML='';break;
 case 'toggle-lang':switchLang(state.settings.locale==='vi'?'en':'vi');break;
 case 'show-quick':quickPicker();break;
 case 'new-activity':activityEditor();break;
 case 'begin-duration':{
  if(startTimer(state,el.dataset.id)){closeModal();saveRender();notify(loc('Đã bắt đầu tính giờ.','Timer started.'));}else{notify(loc('Đang có một phiên khác.','Another timer is already running.'));}break;
 }
 case 'duration-manual':manualDuration(el.dataset.id);break;
 case 'toggle-timer':if(state.timer){state.timer.runningSince===null?resumeTimer(state):pauseTimer(state);saveRender();}break;
 case 'stop-timer':if(state.timer){stopTimer(state);saveRender();notify(t('recorded'));}break;
 case 'shift-day':moveDay(Number(el.dataset.delta));break;
 case 'goto-today':selectDay(zonedDate(new Date(),tz()));break;
 case 'month-go':case 'shift-month':moveMonth(Number(el.dataset.delta));break;
 case 'pick-day':selectDay(el.dataset.date);break;
 case 'set-calendar-view':ui.plannerView=el.dataset.value;renderApp();break;
 case 'period':ui.insightsPeriod=el.dataset.value;renderApp();break;
 case 'filter-category':ui.filter=el.dataset.value;renderApp();break;
 case 'community-tab':ui.communityTab=el.dataset.value;renderApp();break;
 case 'settings-section':ui.section=el.dataset.value;renderApp();break;
 case 'navigate-settings':ui.section='privacy';navigate('app/settings');break;
 case 'choose-mood':if(['joy','calm','focus','drive','tired'].includes(el.dataset.value)){state.moods ||= {};if(state.moods[ui.selectedDate]===el.dataset.value)delete state.moods[ui.selectedDate];else state.moods[ui.selectedDate]=el.dataset.value;saveRender();}break;
 case 'theme':if(['light','dark','system'].includes(el.dataset.value)){state.settings.theme=el.dataset.value;saveRender();}break;
 case 'lang':switchLang(el.dataset.value);break;
 case 'font-scale':state.settings.fontScale=Number(el.dataset.value)||1;saveRender();break;
 case 'toggle-setting':if(el.dataset.key in DEFAULT_SETTINGS){state.settings[el.dataset.key]=!state.settings[el.dataset.key];saveRender();}break;
 case 'add-plan':planEditor();break;
 case 'edit-plan':planEditor(el.dataset.id);break;
 case 'delete-plan':{const p=state.plans.find(p=>p.id===el.dataset.id);if(p&&window.confirm(loc(`Xóa kế hoạch “${p.title}”?`,`Delete plan “${p.title}”?`))){state.plans=state.plans.filter(v=>v.id!==p.id);closeModal();saveRender();}break;}
 case 'edit-entry':entryEditor(el.dataset.id);break;
 case 'delete-entry':{const entry=state.entries.find(v=>v.id===el.dataset.id);if(entry&&window.confirm(loc('Xóa hoạt động đã ghi?','Delete this logged activity?'))){state.entries=state.entries.filter(v=>v.id!==entry.id);closeModal();saveRender();notify(loc('Đã xóa hoạt động.','Activity deleted.'));}break;}
 case 'export-json':download(JSON.stringify({exportedAt:new Date().toISOString(),data:state},null,2),'tutien-data.json','application/json;charset=utf-8');break;
 case 'export-csv':exportCsv();break;
 case 'clear-local':if(window.confirm(t('eraseConfirm'))){state=initialState();ui.selectedDate=zonedDate(new Date(),tz());ui.monthAnchor=ui.selectedDate.slice(0,7);ui.section='appearance';saveRender();notify(loc('Đã xóa dữ liệu của thiết bị.','Local data deleted.'));}break;
 case 'undo':if(ui.lastUndo){const fn=ui.lastUndo;ui.lastUndo=null;fn();}break;
 case 'more-menu':openModal(`${modalHeader(t('more'))}<div class="mobile-more-list">${[['app/world','mountain',t('world')],['app/community','people',t('community')],['app/settings','settings',t('settings')]].map(([route,i,name])=>`<a href="/${route}" data-nav="${route}">${icon(i,21)} ${safeText(name)} ${icon('right',17)}</a>`).join('')}</div>`);break;
 }
}
function handleSubmit(event){const form=event.target.closest('form[data-form]');if(!form)return;event.preventDefault();const values=Object.fromEntries(new FormData(form).entries());const type=form.dataset.form;
 try{
  if(type==='manual-duration'){
   const minutes=Number(values.minutes);if(!Number.isFinite(minutes)||minutes<1||minutes>1440)throw Error('Invalid minutes');
   addLifeEntry(state,{activityId:values.activityId,kind:'duration',time:new Date(Date.now()-minutes*60_000).toISOString(),endTime:new Date().toISOString(),durationSec:minutes*60,note:values.note});closeModal();saveRender();notify(t('recorded'));return;
  }
  if(type==='edit-entry'){
   const entry=state.entries.find(e=>e.id===values.id);if(!entry)return;
   entry.startedAt=utcISOForWall(values.date,values.time,tz());entry.note=String(values.note||'').slice(0,1000);
   if(entry.kind==='duration'){entry.durationSec=Math.max(60,Math.round(Number(values.minutes)*60));entry.endedAt=new Date(Date.parse(entry.startedAt)+entry.durationSec*1000).toISOString();}
   if(entry.kind==='count')entry.quantity=Math.max(1,Number(values.quantity));
   closeModal();saveRender();notify(t('save'));return;
  }
  if(type==='plan'){
   const rec={title:String(values.title||'').trim().slice(0,90),date:values.date,time:values.time,
    durationMinutes:Math.max(1,Math.min(1440,Number(values.durationMinutes))),repeat:values.repeat,
    note:String(values.note||'').slice(0,1000)};
   if(!rec.title||!/^\d{4}-\d{2}-\d{2}$/.test(rec.date))throw Error('Invalid plan');
   const existing=state.plans.find(p=>p.id===values.id);
   if(existing)Object.assign(existing,rec);else state.plans.push({id:uid(),...rec,status:'planned'});
   closeModal();ui.selectedDate=rec.date;ui.monthAnchor=rec.date.slice(0,7);saveRender();notify(t('save'));return;
  }
  if(type==='create-activity'){
   const name=String(values.name||'').trim().slice(0,36);if(!name)return;
   const category=CATEGORY_NAMES[values.category]?values.category:'daily';const kind=['event','count','duration'].includes(values.kind)?values.kind:'event';
   const iconName=ico[values.icon]?values.icon:'star';const id='custom-'+uid();
   state.customActivities.push({id,kind,category,icon:iconName,color:({daily:'apricot',learning:'lilac',movement:'aqua',work:'sky',rest:'violet',leisure:'sand'})[category]||'sand',vi:name,en:name});
   state.pinnedIds=[id,...state.pinnedIds.filter(p=>p!==id)].slice(0,12);
   closeModal();saveRender();notify(t('save'));return;
  }
 }catch(err){notify(loc('Không thể lưu. Hãy kiểm tra dữ liệu.','Could not save. Please check your input.'));}
}
function setup(){document.addEventListener('click',e=>{
 const nav=e.target.closest('a[data-nav]');if(nav&&(!e.metaKey&&!e.ctrlKey&&!e.shiftKey)&&e.button===0){e.preventDefault();navigate(nav.dataset.nav);return;}
 const activity=e.target.closest('[data-checkin]');if(activity){e.preventDefault();if(document.getElementById('app-dialog')?.open)closeModal();checkin(activity.dataset.checkin);return;}
 handleAction(e);
 });
 document.addEventListener('submit',handleSubmit);
 document.addEventListener('change',e=>{const select=e.target.closest('[data-setting-select]');if(!select)return;
 if(select.dataset.settingSelect==='timezone'){state.settings.timezone=select.value;ui.selectedDate=zonedDate(new Date(),tz());ui.monthAnchor=ui.selectedDate.slice(0,7);saveRender();}
 if(select.dataset.settingSelect==='shareStatus'){state.settings.shareStatus='private';saveRender();}
 });
 window.addEventListener('popstate',()=>{ui.route=normalizeRoute(location.pathname);renderApp();});
 window.addEventListener('storage',e=>{if(e.key==='tutien.platform.v1'){state=loadState();renderApp();}});
 window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(state.settings.theme==='system')renderApp();});
 document.getElementById('app-dialog')?.addEventListener('click',e=>{if(e.target.id==='app-dialog')closeModal();});
 setInterval(()=>{if(!state.timer)return;document.querySelectorAll('[data-timer-display]').forEach(node=>{node.textContent=clockText(timerElapsed(state.timer));});},1000);
 renderApp();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
/** Internal DOM-free smoke helper used by the Node test runner. */
export function renderPageForTests(route, replacementState = null){
 if(replacementState)state=replacementState;
 ui.route=normalizeRoute('/'+route);
 return ({app:homePage,'app/journal':journalPage,'app/calendar':calendarPage,'app/insights':insightsPage,'app/world':worldPage,'app/community':communityPage,'app/settings':settingsPage})[ui.route]();
}
export {utcISOForWall};