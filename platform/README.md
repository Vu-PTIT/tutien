# TuTien — Mystic Life Platform

> **Branch:** `feat/dual-experience-platform` · **Stage:** interactive frontend prototype (not production).  
> Separate Godot game branch: `feat/map-ui-rebuild`.

A responsive Vietnamese/English **life journal**, lunar calendar, statistics, and cultivation-inspired web lobby. This builds the approved *Mystic Life / Tiên cảnh đời thường* identity using **real HTML controls**, reusable SVG activity icons, off-white parchment / deep ink / gold tokens, and a project-owned cropped illustration from the approved concept.

## Run

Requirements: Node.js 20 or later. No `npm install` is needed for this initial standalone implementation.

```bash
cd platform
npm run dev
# open http://localhost:4173/app
npm test
npm run check
```

The server serves `/app`, `/app/journal`, `/app/calendar`, `/app/insights`, `/app/world`, `/app/community`, and `/app/settings` with SPA fallback. Override port using `PORT=4174 npm run dev`.

The optional GSAP script is fetched asynchronously from a pinned CDN; if blocked, essential UI and keyboard interactions still work, and simple native animation is used. `prefers-reduced-motion` and the in-app reduce-motion switch are respected. Google Fonts are an optional online enhancement with system font fallbacks.

## Implemented

- **Responsive shell:** desktop sidebar, mobile bottom navigation + quick-add, seven separate HTML-rendered routes, one-language-at-a-time `vi`/`en` labels, light/dark/system themes, font scaling.
- **Journal / check-in:** activity icon tiles, categories, one-tap events, multiple entries per day (meals, bathroom), count activities (water), duration timer with pause/resume/stop and persistence across reload, manual duration logging, notes, edit/delete, private-by-default, custom activity creation.
- **Lobby:** activity grid, current timer, journal preview, small real calendar, current-week statistics, explicit unconnected game preview.
- **Calendar:** month/week/day views, recurring daily/weekly personal plans with create/edit/delete, real logged activity markers, Vietnamese lunar and Can Chi via astronomy-based local calculation. Lunar dates tested on five Tet dates. Moon phase wording is approximate, traditional information is labelled as cultural context—not a scientific omen.
- **Insights:** calculations from stored records (time from duration only, count from events); week/month overviews, category summary, chart with breakdown table, empty states; no fabricated achievements or percentages.
- **Settings:** language, time zone, themes, calendar information layers, reduced motion, font size, local JSON/CSV export, clear-device-data action.
- **World and Community:** deliberately **unconnected** states with realistic planned UI, no invented player levels, online counts, avatar movements, or posts.

## Current data/storage boundary (important)

The prototype stores its state in the **browser's localStorage** key `tutien.platform.v1`. This is **not** an account system, cloud sync, or secure backend. It is suitable for UI iteration and offline local exploration, **not for production multi-user or sensitive data**. Clearing the browser erases entries; another device will not see them. A warning is visible in the UI.

The app keeps distinct concepts:

- `real_life_entry` (life check-in) — working here as a browser-local prototype.
- `real_life_status` (what friends can see) — **not yet enabled**.
- `avatar_activity` / `activity_session` (what the Godot avatar does) — **not yet enabled**.

**Check-ins never start a game activity, never grant XP/items, and never publish social data.** The Godot map, camera, animations, physics, item settlement, and autonomous NPC state belong to `feat/map-ui-rebuild` and the shared Nakama backend.

## Next milestones (not claimed complete)

1. `PLAT-01`: Implement authenticated web Nakama session and backend-owned journal/plan/settings storage with per-user authorization, idempotency, server time and multi-device sync.
2. `PLAT-02..05`: Migrate working browser functionality to real APIs, add task log/plan links, timezone/cross-midnight aggregation tests, accessibility/browser E2E, and UI visual QA on PC/mobile.
3. `PLAT-07`: Define and implement authoritative `activity_session` between platform and game (start/stop/travel/settlement); unlock avatar controls only with real server support.
4. `PLAT-08`: Reuse Nakama friends/groups/chat and build privacy-first social sharing + opt-in shared activities; add moderation.
5. `PLAT-09`: Deployment, recovery/export, auth verification, performance, security review, and comprehensive visual QA.

See `docs/game-design/09-dual-experience-platform.md` for established branch ownership and the separately authored UI specification `TUTIEN_PLATFORM_7_TRANG_UI_UX_VA_KE_HOACH.md` supplied with this project.