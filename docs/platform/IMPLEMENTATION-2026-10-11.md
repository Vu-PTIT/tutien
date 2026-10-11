# Mystic Life — platform UI implementation note (11 Oct 2026)

Branch: `feat/dual-experience-platform` (not a separate `plat` branch). Work is confined to `platform/` and this document. Godot scenes/client and Nakama server were **not modified**.

## Shipped in this first UI commit

- Seven responsive interactive routes, based on the seven approved conceptual screen references.
- Actual journal check-in interactions: repeated events, counts, timed/manual durations, notes, edit, delete, custom activity, current timer across refresh.
- Plans with month/week/day views and daily/weekly recurrence.
- Vietnamese lunar date + Can Chi reference labels and settings to hide cultural layers.
- Real aggregation from local logged data, bilingual labels, themes, timezone, readable typography, motion respect.
- Explicit placeholders for social/game features **that are not connected**; no fabricated avatar behavior or statistics.

## QA performed

- `npm run check` (Node syntax checks) and `npm test` (11 tests including seven HTML renders, timestamp/timezone, lunar/Tet, privacy and storage).
- Browser screenshot/end-to-end UI validation **not completed** in the authoring environment: system Chromium did not finish launch. Must be part of the next PR on Windows Chrome and mobile browser.

## Roadmap reference

Do not mark the seven product modules fully launched: this commit is **the first frontend vertical slice**. The account-isolated Nakama API, secure persistence, server-authoritative game commands and social features remain in future milestones. See `docs/game-design/09-dual-experience-platform.md` for layer boundaries and `platform/README.md` for next steps.

## Follow-up — visual parity pass for the 7 approved mockups

The first frontend commit shipped functional interaction but did not approximate the previously approved artwork and detailed page compositions closely enough. The visual follow-up addresses that feedback with:

- Per-page panoramic illustration banners extracted from the approved reference art without rasterizing the UI text; a gold-lined ink sidebar; off-white/gold parchment component system.
- Real, responsive pictogram check-in tiles; a navy mystical calendar with lunar icons and a moon-phase strip; day detail; journal mood and illustration; statistics with honest empty-state balance/streak panels; sect/friend/concept social view; authentic local-only settings.
- Five viewport sizes (320, 375, 390, 1280 and 1440px) × seven routes checked by Chromium screenshot render; fixed the first mobile design's narrow-column/flex alignment bug; no JS rendering exceptions or horizontal overflow.
- Local HTTP server served HTML, CSS and WebP images successfully. Browser policy prohibited direct navigation to localhost in the automated Chromium runner, so we used the exact source DOM/CSS/JS in a security-compliant, offline headless browser context for layout and interaction checks. This is not a claim of full live-site E2E verification.

The visual assets are a starting brand language, **not complete production art**. The large original mockup images are illustrative, not fully specified CSS layouts, and could contain fictional labels, data or character identities. The live app remains a working responsive UI, with actual user-entered records only, private-by-default, and server/game controls disabled pending authoritative integration.
## Follow-up — production artwork and live browser verification

The v3 visual pass replaces mockup crops with dedicated painted landscapes,
serves Vietnamese handwriting/UI fonts locally, and adds colored SVG objects,
mood faces and a lunar seal. All seven routes were now tested on the actual HTTP
server in Chromium at six viewport widths (42 layouts), including journal/timer
persistence and calendar/settings/mobile interactions. Final renders have no
horizontal overflow, clipped cards, failed local resources or runtime errors.
All 12 Node tests and syntax checks pass. See
[the v3 implementation report](ART-DIRECTION-V3-2026-10-11.md) and the
[live browser QA protocol](../../platform/tests/visual-qa.md).
