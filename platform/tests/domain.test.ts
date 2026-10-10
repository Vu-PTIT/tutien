import { describe, it, expect } from "vitest";
import {
  seedState,
  visibleEntries,
  validateEntry,
  transitionEntry,
  isLobbyState,
  dateKey,
} from "../src/domain";
import vi from "../src/locales/vi.json";
import en from "../src/locales/en.json";
describe("calendar sharing and ownership", () => {
  it("never exposes private friend entries in the shared calendar", () => {
    const state = seedState(new Date(2026, 9, 10));
    const privateEntry = {
      ...state.entries[3],
      id: "private",
      visibility: "private" as const,
    };
    expect(
      visibleEntries([...state.entries, privateEntry], "shared").map(
        (e) => e.id,
      ),
    ).not.toContain("private");
    expect(
      visibleEntries(state.entries, "shared", "linh").map((e) => e.ownerId),
    ).toEqual(["linh"]);
    expect(
      visibleEntries(state.entries, "self").every((e) => e.ownerId === "self"),
    ).toBe(true);
  });
  it("cannot change a friend entry or mark work done from a profile status change", () => {
    const state = seedState();
    const next = transitionEntry(state.entries, "sample-linh", "completed");
    expect(next.find((e) => e.id === "sample-linh")?.state).toBe("active");
    const statusOnly = { ...state, life: "rest" };
    expect(statusOnly.entries).toEqual(state.entries);
  });
  it("rejects blank titles, invalid dates and inverted intervals", () => {
    expect(validateEntry(" ", "2026-10-10T12:00", "2026-10-10T13:00")).toBe(
      "requiredTitle",
    );
    expect(validateEntry("Study", "bad", "2026-10-10T13:00")).toBe(
      "invalidDate",
    );
    expect(validateEntry("Study", "2026-10-10T14:00", "2026-10-10T13:00")).toBe(
      "invalidTime",
    );
    expect(
      validateEntry("Study", "2026-10-10T12:00", "2026-10-10T13:00"),
    ).toBeNull();
  });
  it("rejects malformed persisted data instead of crashing the lobby", () => {
    expect(isLobbyState(seedState())).toBe(true);
    expect(isLobbyState({ version: 1, entries: [] })).toBe(false);
    expect(isLobbyState({ ...seedState(), entries: [{ id: "bad" }] })).toBe(
      false,
    );
    expect(isLobbyState({ ...seedState(), reactions: { fake: -1 } })).toBe(
      false,
    );
  });
  it("seeds local dates without relying on UTC ISO dates", () => {
    const state = seedState(new Date(2026, 9, 10, 0, 5));
    expect(state.entries[0].start.startsWith("2026-10-10")).toBe(true);
    expect(dateKey(new Date(2026, 9, 10))).toBe("2026-10-10");
  });
});
describe("localization", () => {
  it("keeps the same translated keys and interpolation variables in Vietnamese and English", () => {
    expect(Object.keys(vi).sort()).toEqual(Object.keys(en).sort());
    for (const key of Object.keys(vi) as (keyof typeof vi)[]) {
      expect(vi[key].length).toBeGreaterThan(0);
      expect(en[key].length).toBeGreaterThan(0);
      expect(vi[key].match(/\{\{\w+\}\}/g) ?? []).toEqual(
        en[key].match(/\{\{\w+\}\}/g) ?? [],
      );
    }
  });
});
