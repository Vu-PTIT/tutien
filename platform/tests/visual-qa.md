# Seven-page visual QA · 2026-10-11

Method: Chromium headless layout render of the exact `index.html` DOM shell, `styles.css`, `mystic.css`, `core.mjs` and `app.mjs` with embedded approved graphic assets in an isolated offline document. This tests layout/visual composition and interactive handlers without attempting to bypass managed URL restrictions on the browser. A separate local HTTP smoke request served app routes and assets with HTTP 200.

## Checked

| Width | Homepage | Journal | Mystic calendar | Insights | Game | Community | Settings | Horizontal overflow |
|---:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 320 | pass | pass | pass | pass | pass | pass | pass | none |
| 375 | pass | pass | pass | pass | pass | pass | pass | none |
| 390 | pass | pass | pass | pass | pass | pass | pass | none |
| 1280 | pass | pass | pass | pass | pass | pass | pass | none |
| 1440 | pass | pass | pass | pass | pass | pass | pass | none |

- All illustrative assets load and show at tested widths; no runtime page errors in screenshot harness.
- `Eating` icon creates one activity log; journal mood picker records one mood; navigation between seven routes doesn't throw; mock social and game actions don't counterfeit backend responses.
- Fonts use optional Google web fonts with local fallback. When external Google Fonts are unavailable, handwriting appearance differs from design mockup, but content remains readable.
- All 11 source Node tests pass, `npm run check` passes. CSS animations are reduced when `prefers-reduced-motion` is enabled.

## Follow-up on a real deployed app

- Confirm font load/render in Chrome/Edge/Safari, 375×812 and 1440×900 screenshots, keyboard focus, screen reader semantics and touch targets.
- Check responsive when browser zoom is 200%, small landscape devices, slow networks, dark mode, and active timers across background/resume.
- Integrate account-based server persistence and live game/social only when backend authorization, websocket reconnection, privacy and idempotency are verified.