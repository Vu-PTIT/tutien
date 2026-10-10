import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  NavLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import viLocale from "@fullcalendar/core/locales/vi";
import enLocale from "@fullcalendar/core/locales/en-gb";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "motion/react";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
  CalendarDays,
  BookOpen,
  Users,
  Settings,
  Leaf,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Heart,
  Send,
  Lock,
  Check,
  Globe,
  Download,
  WifiOff,
  ArrowUpRight,
  Fish,
  Sprout,
  Coffee,
  GraduationCap,
  BriefcaseBusiness,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { PixelScene } from "./components/PixelScene";
import { useMedia, useInstall } from "./hooks";
import {
  dateKey,
  atTime,
  readState,
  storageKey,
  friends,
  visibleEntries,
  validateEntry,
  transitionEntry,
  localeCode,
  formatTime,
  type Entry,
  type EntryState,
  type Locale,
  type AvatarActivity,
  type LifeStatus,
} from "./domain";

const navigation = [
  { path: "/", key: "today", icon: Leaf },
  { path: "/calendar", key: "calendar", icon: CalendarDays },
  { path: "/journal", key: "journal", icon: BookOpen },
  { path: "/friends", key: "friends", icon: Users },
  { path: "/settings", key: "settings", icon: Settings },
];
function Person({ name, color = "sage" }: { name: string; color?: string }) {
  return (
    <span className={`person-avatar ${color}`} aria-hidden="true">
      {name.slice(0, 1)}
    </span>
  );
}
function LifeIcon({ value }: { value: LifeStatus }) {
  const Icon =
    value === "study"
      ? GraduationCap
      : value === "work"
        ? BriefcaseBusiness
        : Coffee;
  return <Icon size={16} aria-hidden="true" />;
}

export default function App() {
  const { t, i18n } = useTranslation();
  const lang: Locale = i18n.resolvedLanguage === "en" ? "en" : "vi";
  const mobile = useMedia("(max-width: 767px)");
  const install = useInstall();
  const reduced = useReducedMotion();
  const location = useLocation(),
    navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const page =
    navigation.find((n) => n.path === location.pathname)?.key ?? "today";
  const [state, setState] = useState(readState);
  const [toast, setToast] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [scope, setScope] = useState<"self" | "shared">("self");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [calendarTitle, setCalendarTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const calendar = useRef<FullCalendar | null>(null);
  const persisted = useRef(state);
  const [installing, setInstalling] = useState(false);
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    if (state === persisted.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      persisted.current = state;
    } catch {
      setToast(t("storageFailed"));
    }
  }, [state, t]);
  useEffect(() => {
    if (params.has("friend")) setScope("shared");
  }, [params]);
  useEffect(() => {
    const api = calendar.current?.getApi();
    if (api)
      api.changeView(
        mobile
          ? view === "month"
            ? "dayGridMonth"
            : "listDay"
          : view === "month"
            ? "dayGridMonth"
            : view === "day"
              ? "timeGridDay"
              : "timeGridWeek",
      );
  }, [mobile, view]);
  const selected = state.entries.find((e) => e.id === selectedId);
  const selectedFriend = friends.find((f) => f.id === selected?.ownerId);
  const friendFilter = params.get("friend") ?? undefined;
  const friend = friends.find((f) => f.id === friendFilter);
  const titleOf = (e: Entry) => e.title ?? t(e.titleKey ?? "title");
  const noteOf = (e: Entry) => e.note ?? (e.noteKey ? t(e.noteKey) : "");
  const own = state.entries.filter((e) => e.ownerId === "self");
  const events = visibleEntries(state.entries, scope, friendFilter);
  const upcoming = own
    .filter((e) => e.state === "planned" && new Date(e.end) > new Date())
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  function changeState(id: string, value: EntryState) {
    setState((s) => ({ ...s, entries: transitionEntry(s.entries, id, value) }));
    setToast(t("saved"));
  }
  function switchScope(value: "self" | "shared") {
    setScope(value);
    if (params.has("friend")) setParams({});
  }
  function chooseLife(value: LifeStatus) {
    setState((s) => ({ ...s, life: value }));
    setToast(t("statusSet"));
  }
  function chooseAvatar(value: AvatarActivity) {
    setState((s) => ({ ...s, avatar: value }));
    setToast(t("gameSet"));
  }
  function interact(kind: "support" | "invite") {
    if (!selected) return;
    setState((s) => ({
      ...s,
      reactions: {
        ...s.reactions,
        [selected.id]: (s.reactions[selected.id] ?? 0) + 1,
      },
    }));
    setToast(t(kind === "support" ? "supportSent" : "inviteSent"));
  }
  function viewFriend(id: string) {
    setScope("shared");
    navigate(`/calendar?friend=${id}`);
  }
  function saveEntry(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const date = String(data.get("date"));
    const start = `${date}T${data.get("start")}:00`,
      end = `${date}T${data.get("end")}:00`;
    const error = validateEntry(title, start, end);
    if (error) {
      setToast(t(error));
      return;
    }
    const entry: Entry = {
      id: crypto.randomUUID(),
      ownerId: "self",
      title,
      start,
      end,
      visibility: data.get("visibility") === "friends" ? "friends" : "private",
      state: data.get("state") === "completed" ? "completed" : "planned",
      note: String(data.get("note") ?? "").trim(),
    };
    setState((s) => ({ ...s, entries: [...s.entries, entry] }));
    setAdding(false);
    setScope("self");
    setParams({});
    setSelectedDate(new Date(start));
    calendar.current?.getApi().gotoDate(start);
    setToast(t("saved"));
  }
  const friendRows = (
    <div className="friend-list">
      {friends.map((f) => (
        <button
          key={f.id}
          className="friend-row"
          onClick={() => viewFriend(f.id)}
        >
          <Person name={f.name} color={f.color} />
          <span className="friend-text">
            <strong>{f.name}</strong>
            <span>
              <LifeIcon value={f.life} />
              {t(f.life)}
              <span className="middle-dot">·</span>
              {t(f.avatar)}
            </span>
          </span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
  const world = (
    <section className="world-card">
      <div className="section-heading">
        <h2>{t("world")}</h2>
        <span className="sample-dot" aria-label={t("demo")} />
      </div>
      <PixelScene activity={state.avatar} friend={scope === "shared"} />
      <div className="world-caption">
        <span className="person-avatar self-avatar">Y</span>
        <div>
          <strong>Yến</strong>
          <span>
            {t("inGame")}: {t(state.avatar)}
          </span>
        </div>
      </div>
      <p className="hint">{t("gamePreview")}</p>
      <div className="activity-buttons" aria-label={t("chooseGame")}>
        {(
          [
            { key: "fishing", icon: Fish },
            { key: "gardening", icon: Sprout },
            { key: "idle", icon: Coffee },
          ] as const
        ).map((a) => (
          <Button
            key={a.key}
            size="sm"
            variant={state.avatar === a.key ? "default" : "outline"}
            aria-pressed={state.avatar === a.key}
            onClick={() => chooseAvatar(a.key)}
          >
            <a.icon size={14} />
            {t(a.key)}
          </Button>
        ))}
      </div>
    </section>
  );

  return (
    <div
      className={`lobby-shell ${mobile ? "mobile-layout" : "desktop-layout"} ${install.installed ? "app-mode" : "web-mode"}`}
      data-testid="lobby-shell"
    >
      <aside className="desktop-sidebar">
        <NavLink to="/" className="brand">
          <span className="brand-mark">
            <Leaf size={24} />
          </span>
          <span>
            {t("appName")}
            <small>{t("tagline")}</small>
          </span>
        </NavLink>
        <nav aria-label={t("appName")}>
          {navigation.map((n) => (
            <NavLink
              key={n.path}
              to={n.path}
              end
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <n.icon size={20} />
              {t(n.key)}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-sprig">
            <Sprout size={32} />
          </div>
          <p>{t("privacyHelp")}</p>
          <button
            className="account-button"
            onClick={() => navigate("/settings")}
          >
            <Person name="Yến" />
            <span>
              Yến<small>{t("settings")}</small>
            </span>
            <Settings size={17} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <Leaf size={22} />
            <strong>{t("appName")}</strong>
          </div>
          <span className="environment-label">
            {t(mobile ? "mobile" : "desktop")} <span>/</span>{" "}
            {t(install.installed ? "app" : "web")}
          </span>
          <div className="topbar-actions">
            <label className="language-picker">
              <Globe size={15} aria-hidden="true" />
              <select
                aria-label={t("language")}
                value={lang}
                onChange={(e) => void i18n.changeLanguage(e.target.value)}
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </label>
            <Button
              variant="outline"
              size="icon"
              className="mobile-settings"
              aria-label={t("settings")}
              onClick={() => navigate("/settings")}
            >
              <Settings size={19} />
            </Button>
          </div>
        </header>
        <div className="demo-notice">
          <span className="sample-dot" />
          <span>{t("demo")}</span>
          <button onClick={() => navigate("/settings")} aria-label={t("more")}>
            <ArrowUpRight size={15} />
          </button>
        </div>
        {!online && (
          <div className="connection-notice" role="status">
            <WifiOff size={16} />
            {t("offline")}
          </div>
        )}
        {needRefresh && (
          <div className="connection-notice" role="status">
            {t("update")}
            <Button size="sm" onClick={() => void updateServiceWorker(true)}>
              {t("reload")}
            </Button>
          </div>
        )}
        <div
          className={`content-layout ${page === "today" || page === "calendar" ? "with-rail" : ""}`}
        >
          <main className="main-content">
            <motion.div
              key={page}
              initial={reduced ? false : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16 }}
            >
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    {new Intl.DateTimeFormat(localeCode(lang), {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }).format(new Date())}
                  </span>
                  <h1>{page === "today" ? t("hello") : t(page)}</h1>
                  <p>
                    {t(
                      page === "today"
                        ? "intro"
                        : page === "journal"
                          ? "journalIntro"
                          : page === "friends"
                            ? "friendPrivacy"
                            : page === "settings"
                              ? "tagline"
                              : "calendarIntro",
                    )}
                  </p>
                </div>
                {page !== "settings" && (
                  <Button
                    onClick={() => setAdding(true)}
                    className="add-button"
                    aria-label={t("add")}
                  >
                    <Plus size={18} />
                    <span>{t("add")}</span>
                  </Button>
                )}
              </div>
              {(page === "today" || page === "calendar") && (
                <>
                  {page === "today" && (
                    <section className="life-card">
                      <div>
                        <h2>{t("chooseStatus")}</h2>
                        <p className="hint">
                          {t("realLife")}:{" "}
                          <strong>{t(state.life ?? "statusNone")}</strong>
                        </p>
                      </div>
                      <div className="life-choices">
                        {(["study", "work", "rest"] as const).map((value) => (
                          <Button
                            key={value}
                            variant={
                              state.life === value ? "default" : "outline"
                            }
                            aria-pressed={state.life === value}
                            onClick={() => chooseLife(value)}
                          >
                            <LifeIcon value={value} />
                            {t(value)}
                          </Button>
                        ))}
                      </div>
                    </section>
                  )}
                  <section className="calendar-card">
                    <div className="calendar-top">
                      <div className="segmented" aria-label={t("calendar")}>
                        <button
                          className={scope === "self" ? "selected" : ""}
                          aria-pressed={scope === "self"}
                          onClick={() => switchScope("self")}
                        >
                          {t("myCalendar")}
                        </button>
                        <button
                          className={scope === "shared" ? "selected" : ""}
                          aria-pressed={scope === "shared"}
                          onClick={() => switchScope("shared")}
                        >
                          <Users size={15} />
                          {t("sharedCalendar")}
                        </button>
                      </div>
                      {!mobile && (
                        <div className="view-picker">
                          {(["day", "week", "month"] as const).map((v) => (
                            <button
                              key={v}
                              className={view === v ? "selected" : ""}
                              aria-pressed={view === v}
                              onClick={() => setView(v)}
                            >
                              {t(v)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {friend && (
                      <div className="friend-filter">
                        <Person name={friend.name} color={friend.color} />
                        <span>
                          {t("friendSchedule", { name: friend.name })}
                        </span>
                        <button
                          aria-label={t("close")}
                          onClick={() => setParams({})}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    )}
                    <div className="calendar-heading">
                      <h2>{calendarTitle || t("schedule")}</h2>
                      <div className="date-controls">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => calendar.current?.getApi().today()}
                        >
                          {t("today")}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label={t("previous")}
                          onClick={() => calendar.current?.getApi().prev()}
                        >
                          <ChevronLeft size={17} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label={t("next")}
                          onClick={() => calendar.current?.getApi().next()}
                        >
                          <ChevronRight size={17} />
                        </Button>
                      </div>
                    </div>
                    {mobile && (
                      <div className="mobile-date-strip">
                        {Array.from({ length: 7 }, (_, i) => {
                          const d = new Date(selectedDate);
                          const weekday = (d.getDay() + 6) % 7;
                          d.setDate(d.getDate() - weekday + i);
                          return (
                            <button
                              key={i}
                              className={
                                dateKey(d) === dateKey(selectedDate)
                                  ? "selected"
                                  : ""
                              }
                              onClick={() =>
                                calendar.current?.getApi().gotoDate(d)
                              }
                            >
                              <span>
                                {new Intl.DateTimeFormat(localeCode(lang), {
                                  weekday: "short",
                                }).format(d)}
                              </span>
                              <strong>{d.getDate()}</strong>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <FullCalendar
                      ref={calendar}
                      plugins={[
                        dayGridPlugin,
                        timeGridPlugin,
                        interactionPlugin,
                        listPlugin,
                      ]}
                      initialView={mobile ? "listDay" : "timeGridWeek"}
                      initialDate={selectedDate}
                      locales={[viLocale, enLocale]}
                      locale={lang === "vi" ? "vi" : "en-gb"}
                      firstDay={1}
                      headerToolbar={false}
                      height="auto"
                      nowIndicator
                      allDaySlot={false}
                      slotMinTime="06:00:00"
                      slotMaxTime="22:00:00"
                      slotDuration="01:00:00"
                      expandRows={false}
                      eventMinHeight={48}
                      eventShortHeight={50}
                      dayMaxEvents={2}
                      editable={false}
                      noEventsContent={
                        <div className="empty-state">
                          <CalendarDays size={30} />
                          <strong>{t("noEvents")}</strong>
                          <span>{t("emptyHint")}</span>
                        </div>
                      }
                      events={events.map((e) => ({
                        id: e.id,
                        title: titleOf(e),
                        start: e.start,
                        end: e.end,
                        classNames: [`entry-${e.ownerId}`, `state-${e.state}`],
                        extendedProps: { entry: e },
                      }))}
                      datesSet={(arg) => {
                        setCalendarTitle((previous) =>
                          previous === arg.view.title
                            ? previous
                            : arg.view.title,
                        );
                        setSelectedDate((previous) =>
                          dateKey(previous) ===
                          dateKey(arg.view.calendar.getDate())
                            ? previous
                            : arg.view.calendar.getDate(),
                        );
                      }}
                      dateClick={(arg) => {
                        setSelectedDate(arg.date);
                        setAdding(true);
                      }}
                      eventClick={(arg) => setSelectedId(arg.event.id)}
                      eventDidMount={(arg) => {
                        const e = arg.event.extendedProps.entry as Entry;
                        arg.el.setAttribute(
                          "title",
                          `${titleOf(e)} · ${formatTime(e.start, lang)}–${formatTime(e.end, lang)} · ${t(e.state)}`,
                        );
                        arg.el.setAttribute("role", "button");
                        arg.el.setAttribute("tabindex", "0");
                        arg.el.setAttribute(
                          "aria-label",
                          `${titleOf(e)}, ${t(e.state)}`,
                        );
                        arg.el.addEventListener("keydown", (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedId(e.id);
                          }
                        });
                      }}
                      eventContent={(arg) => {
                        const e = arg.event.extendedProps.entry as Entry;
                        const f = friends.find((x) => x.id === e.ownerId);
                        return (
                          <div className="calendar-event">
                            <span className="event-owner">
                              {f?.name ?? t("self")}
                            </span>
                            <strong>{titleOf(e)}</strong>
                            <span className="event-meta">
                              {t(e.state)}
                              {e.ownerId === "self" &&
                              e.visibility === "private" ? (
                                <Lock size={11} />
                              ) : null}
                            </span>
                          </div>
                        );
                      }}
                    />
                    <div className="calendar-footnote">
                      <Lock size={13} />
                      {t(scope === "self" ? "privacyHelp" : "friendPrivacy")}
                    </div>
                  </section>
                  {mobile && page === "today" && (
                    <div className="mobile-world">{world}</div>
                  )}
                  {mobile && (
                    <section className="mobile-friends card">
                      <div className="section-heading">
                        <h2>{t("friendsNow")}</h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("/friends")}
                        >
                          {t("allFriends")}
                        </Button>
                      </div>
                      {friendRows}
                    </section>
                  )}
                </>
              )}
              {page === "journal" && (
                <div className="journal-list">
                  {own
                    .filter((e) => e.state === "completed" || !!noteOf(e))
                    .sort((a, b) => b.start.localeCompare(a.start))
                    .map((e) => (
                      <button
                        className="journal-entry"
                        key={e.id}
                        onClick={() => setSelectedId(e.id)}
                      >
                        <span className="journal-icon">
                          <BookOpen size={21} />
                        </span>
                        <span>
                          <small>
                            {new Intl.DateTimeFormat(localeCode(lang), {
                              day: "numeric",
                              month: "long",
                            }).format(new Date(e.start))}{" "}
                            · {t(e.state)}
                          </small>
                          <strong>{titleOf(e)}</strong>
                          <p>{noteOf(e)}</p>
                        </span>
                        <ChevronRight size={18} />
                      </button>
                    ))}
                  {!own.some((e) => e.state === "completed" || !!noteOf(e)) && (
                    <div className="empty-state">{t("journalEmpty")}</div>
                  )}
                </div>
              )}
              {page === "friends" && (
                <div className="friend-grid">
                  {friends.map((f) => (
                    <section className="friend-card" key={f.id}>
                      <div className="friend-card-heading">
                        <Person name={f.name} color={f.color} />
                        <div>
                          <h2>{f.name}</h2>
                          <span>
                            <LifeIcon value={f.life} />
                            {t(f.life)}
                          </span>
                        </div>
                      </div>
                      <PixelScene activity={f.avatar} />
                      <div className="friend-card-bottom">
                        <div>
                          <small>{t("inGame")}</small>
                          <strong>{t(f.avatar)}</strong>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewFriend(f.id)}
                        >
                          <CalendarDays size={15} />
                          {t("viewSchedule")}
                        </Button>
                      </div>
                    </section>
                  ))}
                </div>
              )}
              {page === "settings" && (
                <div className="settings-list">
                  <section className="card settings-card">
                    <h2>{t("language")}</h2>
                    <div className="life-choices">
                      <Button
                        variant={lang === "vi" ? "default" : "outline"}
                        onClick={() => void i18n.changeLanguage("vi")}
                      >
                        Tiếng Việt
                      </Button>
                      <Button
                        variant={lang === "en" ? "default" : "outline"}
                        onClick={() => void i18n.changeLanguage("en")}
                      >
                        English
                      </Button>
                    </div>
                  </section>
                  <section className="card settings-card">
                    <h2>{t("appearance")}</h2>
                    <span className="mode-badge">
                      {t(mobile ? "mobile" : "desktop")} /{" "}
                      {t(install.installed ? "app" : "web")}
                    </span>
                    <p>{t("responsiveHelp")}</p>
                  </section>
                  <section className="card settings-card">
                    <h2>{t("install")}</h2>
                    <p>
                      {t(
                        install.installed
                          ? "installed"
                          : install.canInstall
                            ? "installReady"
                            : "installHelp",
                      )}
                    </p>
                    {install.canInstall && !install.installed && (
                      <Button
                        disabled={installing}
                        onClick={() => {
                          setInstalling(true);
                          void install
                            .install()
                            .finally(() => setInstalling(false));
                        }}
                      >
                        <Download size={17} />
                        {t("install")}
                      </Button>
                    )}
                    <p className="hint">{t("nativeLater")}</p>
                    {offlineReady && (
                      <p className="hint">
                        <Check size={14} />
                        {t("offlineReady")}
                      </p>
                    )}
                  </section>
                  <section className="card settings-card">
                    <h2>{t("demo")}</h2>
                    <p>{t("demoDetail")}</p>
                    <p className="hint">{t("dataDevice")}</p>
                  </section>
                </div>
              )}
            </motion.div>
          </main>
          {(page === "today" || page === "calendar") && (
            <aside className="right-rail">
              <div className="desktop-world">{world}</div>
              <section className="friends-panel card">
                <div className="section-heading">
                  <h2>{t("friendsNow")}</h2>
                  <Users size={18} />
                </div>
                {friendRows}
              </section>
              <section className="upcoming-card">
                <span className="eyebrow">{t("upcoming")}</span>
                {upcoming ? (
                  <button onClick={() => setSelectedId(upcoming.id)}>
                    <strong>{titleOf(upcoming)}</strong>
                    <span>
                      {formatTime(upcoming.start, lang)} · {t(upcoming.state)}
                    </span>
                    <ArrowUpRight size={17} />
                  </button>
                ) : (
                  <p>{t("noneUpcoming")}</p>
                )}
              </section>
            </aside>
          )}
        </div>
      </div>
      <nav className="mobile-bottom-nav" aria-label={t("appName")}>
        {navigation
          .filter((n) => n.key !== "settings")
          .map((n) => (
            <NavLink
              key={n.path}
              to={n.path}
              end
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <n.icon size={21} />
              <span>{t(n.key)}</span>
            </NavLink>
          ))}
      </nav>
      <Dialog.Root
        open={adding || !!selected}
        onOpenChange={(open) => {
          if (!open) {
            setAdding(false);
            setSelectedId(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content
            className="activity-dialog"
            aria-describedby="activity-dialog-description"
          >
            <div className="sheet-handle" />
            <div className="dialog-heading">
              <Dialog.Title>
                {adding ? t("add") : selected ? titleOf(selected) : ""}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label={t("close")}>
                  <X size={20} />
                </Button>
              </Dialog.Close>
            </div>
            <Dialog.Description
              id="activity-dialog-description"
              className="dialog-description"
            >
              {adding
                ? t("privacyHelp")
                : selected?.ownerId === "self"
                  ? t("demoDetail")
                  : t("sharedBy", { name: selectedFriend?.name })}
            </Dialog.Description>
            {adding ? (
              <form onSubmit={saveEntry} className="activity-form">
                <label>
                  {t("title")}
                  <input
                    name="title"
                    required
                    maxLength={120}
                    placeholder={t("titlePlaceholder")}
                    autoFocus
                  />
                </label>
                <label>
                  {t("date")}
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={dateKey(selectedDate)}
                  />
                </label>
                <div className="form-pair">
                  <label>
                    {t("start")}
                    <input
                      type="time"
                      name="start"
                      required
                      defaultValue="14:00"
                    />
                  </label>
                  <label>
                    {t("end")}
                    <input
                      type="time"
                      name="end"
                      required
                      defaultValue="15:00"
                    />
                  </label>
                </div>
                <div className="form-pair">
                  <label>
                    {t("visibility")}
                    <select name="visibility" defaultValue="private">
                      <option value="private">{t("private")}</option>
                      <option value="friends">{t("friendsOnly")}</option>
                    </select>
                  </label>
                  <label>
                    {t("more")}
                    <select name="state" defaultValue="planned">
                      <option value="planned">{t("planned")}</option>
                      <option value="completed">{t("completed")}</option>
                    </select>
                  </label>
                </div>
                <label>
                  {t("note")}
                  <textarea
                    name="note"
                    rows={3}
                    maxLength={1000}
                    placeholder={t("notePlaceholder")}
                  />
                </label>
                <Button type="submit">
                  <Plus size={17} />
                  {t("save")}
                </Button>
              </form>
            ) : (
              selected && (
                <div className="activity-detail">
                  <div className={`status-pill ${selected.state}`}>
                    {t(selected.state)}
                  </div>
                  <div className="detail-time">
                    <CalendarDays size={16} />
                    {new Intl.DateTimeFormat(localeCode(lang), {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                    }).format(new Date(selected.start))}
                    <span>
                      {formatTime(selected.start, lang)}–
                      {formatTime(selected.end, lang)}
                    </span>
                  </div>
                  {selectedFriend ? (
                    <div className="detail-person">
                      <Person
                        name={selectedFriend.name}
                        color={selectedFriend.color}
                      />
                      <span>
                        <strong>{selectedFriend.name}</strong>
                        <small>
                          {t("realLife")}: {t(selectedFriend.life)}
                        </small>
                      </span>
                    </div>
                  ) : (
                    <div className="hint">
                      <Lock size={14} />
                      {t(
                        selected.visibility === "private"
                          ? "private"
                          : "friendsOnly",
                      )}
                    </div>
                  )}
                  <PixelScene
                    activity={selectedFriend?.avatar ?? state.avatar}
                  />
                  <p className="detail-avatar-status">
                    {t("inGame")}:{" "}
                    <strong>{t(selectedFriend?.avatar ?? state.avatar)}</strong>
                  </p>
                  <p className="hint">{t("gamePreview")}</p>
                  {noteOf(selected) && (
                    <div className="detail-note">
                      <BookOpen size={16} />
                      <p>{noteOf(selected)}</p>
                    </div>
                  )}
                  {selected.ownerId === "self" ? (
                    <div className="detail-actions">
                      {selected.state === "planned" && (
                        <Button
                          onClick={() => changeState(selected.id, "active")}
                        >
                          {t("startActivity")}
                        </Button>
                      )}
                      {(selected.state === "planned" ||
                        selected.state === "active") && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() =>
                              changeState(selected.id, "completed")
                            }
                          >
                            <Check size={16} />
                            {t("finishActivity")}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              changeState(selected.id, "cancelled")
                            }
                          >
                            {t("cancelActivity")}
                          </Button>
                        </>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setState((s) => ({
                            ...s,
                            entries: s.entries.filter(
                              (e) => e.id !== selected.id,
                            ),
                          }));
                          setSelectedId(null);
                          setToast(t("saved"));
                        }}
                      >
                        {t("delete")}
                      </Button>
                    </div>
                  ) : (
                    <div className="detail-actions">
                      <Button onClick={() => interact("support")}>
                        <Heart size={17} />
                        {t("sendSupport")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => interact("invite")}
                      >
                        <Send size={17} />
                        {t("invite")}
                      </Button>
                      <small>
                        {t("reactionCount", {
                          count: state.reactions[selected.id] ?? 0,
                        })}
                      </small>
                    </div>
                  )}
                </div>
              )
            )}
            {toast && (
              <p className="dialog-feedback" role="status" aria-live="polite">
                {toast}
              </p>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {toast && !adding && !selected && (
        <div className="toast" role="status" aria-live="polite">
          <Check size={17} />
          <span>{toast}</span>
          <button onClick={() => setToast("")} aria-label={t("close")}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
