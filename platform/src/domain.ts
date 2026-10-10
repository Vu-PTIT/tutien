export type Locale = "vi" | "en";
export type LifeStatus = "study" | "work" | "rest";
export type EntryState = "planned" | "active" | "completed" | "cancelled";
export interface Entry {
  id: string;
  ownerId: string;
  title?: string;
  titleKey?: string;
  start: string;
  end: string;
  state: EntryState;
  visibility: "private" | "friends";
  note?: string;
  noteKey?: string;
}
export interface Friend {
  id: string;
  name: string;
  life: LifeStatus;
  color: string;
}
export interface LobbyState {
  version: 1;
  entries: Entry[];
  life: LifeStatus | null;
  reactions: Record<string, number>;
}
export const friends: Friend[] = [
  { id: "linh", name: "Linh", life: "study", color: "sage" },
  {
    id: "minh",
    name: "Minh",
    life: "work",
    color: "clay",
  },
  { id: "an", name: "An", life: "rest", color: "lavender" },
];
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function atTime(d: Date, time: string): string {
  return `${dateKey(d)}T${time}:00`;
}
export function seedState(now = new Date()): LobbyState {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return {
    version: 1,
    life: null,
    reactions: {},
    entries: [
      {
        id: "sample-study",
        ownerId: "self",
        titleKey: "studyTitle",
        noteKey: "studyNote",
        start: atTime(now, "08:00"),
        end: atTime(now, "09:30"),
        state: "completed",
        visibility: "private",
      },
      {
        id: "sample-presentation",
        ownerId: "self",
        titleKey: "presentationTitle",
        start: atTime(now, "14:00"),
        end: atTime(now, "15:00"),
        state: "planned",
        visibility: "private",
      },
      {
        id: "sample-walk",
        ownerId: "self",
        titleKey: "walkTitle",
        start: atTime(tomorrow, "17:00"),
        end: atTime(tomorrow, "17:30"),
        state: "planned",
        visibility: "friends",
      },
      {
        id: "sample-linh",
        ownerId: "linh",
        titleKey: "linhStudy",
        noteKey: "friendNote",
        start: atTime(now, "13:00"),
        end: atTime(now, "16:00"),
        state: "active",
        visibility: "friends",
      },
      {
        id: "sample-minh",
        ownerId: "minh",
        titleKey: "minhWork",
        start: atTime(now, "09:00"),
        end: atTime(now, "17:00"),
        state: "active",
        visibility: "friends",
      },
      {
        id: "sample-an",
        ownerId: "an",
        titleKey: "anRest",
        start: atTime(now, "15:00"),
        end: atTime(now, "16:00"),
        state: "planned",
        visibility: "friends",
      },
    ],
  };
}
export function visibleEntries(
  entries: Entry[],
  scope: "self" | "shared",
  owner?: string,
): Entry[] {
  return entries.filter((e) =>
    scope === "self"
      ? e.ownerId === "self"
      : e.ownerId !== "self" &&
        e.visibility === "friends" &&
        (!owner || e.ownerId === owner),
  );
}
export function validateEntry(
  title: string,
  start: string,
  end: string,
): "requiredTitle" | "invalidDate" | "invalidTime" | null {
  if (!title.trim()) return "requiredTitle";
  const s = new Date(start).getTime(),
    e = new Date(end).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e)) return "invalidDate";
  if (e <= s) return "invalidTime";
  return null;
}
export function transitionEntry(
  entries: Entry[],
  id: string,
  state: EntryState,
): Entry[] {
  return entries.map((e) =>
    e.id === id && e.ownerId === "self" ? { ...e, state } : e,
  );
}
export function isLobbyState(value: unknown): value is LobbyState {
  if (!value || typeof value !== "object") return false;
  const v = value as LobbyState;
  return (
    v.version === 1 &&
    [null, "study", "work", "rest"].includes(v.life) &&
    Array.isArray(v.entries) &&
    v.entries.every(
      (e) =>
        !!e &&
        typeof e.id === "string" &&
        typeof e.ownerId === "string" &&
        ["private", "friends"].includes(e.visibility) &&
        ["planned", "active", "completed", "cancelled"].includes(e.state) &&
        typeof e.start === "string" &&
        typeof e.end === "string" &&
        Number.isFinite(new Date(e.start).getTime()) &&
        new Date(e.end).getTime() > new Date(e.start).getTime() &&
        [e.title, e.titleKey, e.note, e.noteKey].every(
          (x) => x === undefined || typeof x === "string",
        ),
    ) &&
    !!v.reactions &&
    typeof v.reactions === "object" &&
    !Array.isArray(v.reactions) &&
    Object.values(v.reactions).every((n) => Number.isInteger(n) && n >= 0)
  );
}
export const storageKey = "tutien.lobby.demo.v1";
export function readState(): LobbyState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const value: unknown = JSON.parse(raw);
      if (isLobbyState(value)) return value;
    }
  } catch {
    /* Fall back to valid sample data. */
  }
  return seedState();
}
export function localeCode(lang: Locale): string {
  return lang === "vi" ? "vi-VN" : "en-GB";
}
export function formatTime(value: string, lang: Locale): string {
  return new Intl.DateTimeFormat(localeCode(lang), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
