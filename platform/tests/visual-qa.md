# Seven-page visual QA · 2026-10-11 · art v3

The current pass was verified in Chromium against the actual local HTTP app served
by `server.mjs`, including local fonts, CSS and module/image requests. External
CDN requests were blocked, so the existing optional-GSAP fallback was exercised.
This supersedes the earlier offline-document-only visual validation.

| Width | Home | Journal | Calendar | Insights | World | Community | Settings |
|---:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 320 | pass | pass | pass | pass | pass | pass | pass |
| 375 | pass | pass | pass | pass | pass | pass | pass |
| 390 | pass | pass | pass | pass | pass | pass | pass |
| 1024 | pass | pass | pass | pass | pass | pass | pass |
| 1280 | pass | pass | pass | pass | pass | pass | pass |
| 1440 | pass | pass | pass | pass | pass | pass | pass |

- All 42 layouts: no horizontal overflow, clipped cards, missing local resources
  or runtime page errors. Fixed the 320px world artwork width before final capture.
- Actual click/refresh checks passed: check-in and timer persistence, pause/finish,
  plan creation, mood selection, VI/EN, light/dark, lunar display preference,
  mobile quick add and more-menu navigation.
- `npm run check` and all 12 existing Node tests passed.
- Vietnamese headings use a local font; no fallback from a failed Google Fonts
  request is required. SVG icons and moon phases stay crisp at different scales.

Backend authentication, synchronization and live game/social features were not
part of this art change. The screenshot data starts with an empty local journal;
example social entries remain marked as previews.
