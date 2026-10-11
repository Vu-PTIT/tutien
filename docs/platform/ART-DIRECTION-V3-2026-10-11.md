# Mystic Life · visual implementation v3

Branch: `feat/dual-experience-platform`.

The original frontend reused small crops of the approved mockups. Their embedded
labels, borders and low image resolution weakened the art at real browser sizes.
The v3 pass replaces visible banner/world/card art with clean painted landscapes
and aligns the interface with the approved ivory, navy and brass journal style.

## Changes

- Two dedicated landscape illustrations, with separate HTML labels and responsive
  crops. The reading panorama gives headings their own paper area; the world
  panorama supplies a coherent library, training yard, garden and resting pavilion.
- Local Vietnamese UI and handwriting fonts. Removed both Google Fonts imports,
  added font preloads, licenses and the server's WOFF MIME type.
- Twelve colored vector activity objects, vector mood faces and an ornamental
  lunar seal. Tiny legacy raster icons and platform-dependent mood emoji are no
  longer used in these components.
- Finer paper frames and corners, a compact clear header, restrained card shadows,
  aligned quick actions and the navy lunar calendar.
- Settings columns fit their actual content. Fixed the mobile logo's duplicate
  gradient ID, restored the mobile world teaser, prevented the 320px world art
  from expanding past its card, and improved dark profile text contrast.
- Existing journal/planner persistence and the unconnected game/social state are
  preserved. UI copy uses readable activity labels instead of internal job names.

## Validation

- `npm run check`: passed, including the new `src/art.mjs` module.
- `npm test`: all 12 existing tests passed.
- Real HTTP browser render: 7 routes × 6 widths (320, 375, 390, 1024, 1280, 1440),
  42 layouts. No document overflow or clipped cards, failed local resources or
  page runtime errors. The local font glyph map covers the Vietnamese headings.
- Click and refresh checks: meal check-in, persisted journal, start/pause/finish
  timer, persisted timer, create plan, select mood, VI/EN switching, light/dark
  settings, hide calendar moon phases, mobile quick add and more-menu navigation.
- The app was served by its actual `server.mjs` and navigated through its routes.
  External CDNs were aborted in the screenshot runner. Server-backed account,
  game and social integration remains outside this visual change.

[Live browser QA protocol](../../platform/tests/visual-qa.md) ·
[Asset provenance, font licenses and ImageGen prompts](../../platform/assets/ART-V3.md)
