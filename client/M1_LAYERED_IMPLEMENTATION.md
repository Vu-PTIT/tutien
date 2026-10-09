# M1 — Layered village art pass (09/10/2026)

**Branch:** `feat/map-ui-rebuild`. The main scene opens `res://scenes/layered_village_m1.tscn`. The prior 112×96 Tiled village stays intact as `res://scenes/legacy_linh_khe.tscn` for comparison.

## Implemented in the isolated map slice

- `data/layered_village_m1.json`: one authored 1120×800 world-space layout, 5 independent walking paths, river + pond, irregular house clearings, garden beds, separately named buildings/trees/bushes/rocks and three future activity slots.
- `scripts/layered_village.gd`: freeform spline-built `Polygon2D` roads, dirt verges, riverbanks, water bodies and authored ground patches. **No TileMapLayer, TileSet or gameplay GID** is used in the new runtime map.
- `shaders/layered_surface.gdshader`: world-coordinate pixel textures (fixes former implicit UV stretching), water ripples clipped to waterways, locally distinguishable sandy trails, grass, bank and planting soil.
- `scripts/layered_prop.gd`: independent PNG scene objects from the original resource pack. Colliders, interaction sensing, visual Y-sort and access points are separate. Tree/shrub crowns sway gently about their ground anchor.
- `scripts/layered_player.gd`: inherits corrected walk/idle 32×48 sheet and bounded 2D camera. Local bench sit/stand action.
- `scripts/layered_minimap.gd`: renders **the same generated polygons** as the world and location data; no independently maintained preview bitmap.
- `L2_WaterCollision`: uses solid `CollisionPolygon2D` derived from the same rendered water outlines; no approximate circle chain.
- `scripts/check-layered-map.cjs`: checks map schema, sprite resource paths, unique IDs, valid activity slot anchors and non-tile runtime contract.
- `tests/layered_map_smoke.gd` and `tests/layered_map_capture.gd`: smoke-check live Godot nodes, local interactions and create viewport screenshot in CI.

## Try locally

1. `git checkout feat/map-ui-rebuild && git pull origin feat/map-ui-rebuild`.
2. Open `client/project.godot` with **Godot 4.6.1**; run the project (F5) or `layered_village_m1.tscn` (F6).
3. Use WASD or arrow keys to walk, mouse wheel to zoom and E near doors/trees/bench/plant/fishing point to interact.
4. Compare the scene tree with `legacy_linh_khe.tscn`, which intentionally retains the old tile-driven renderer.

## Verification and limitations

- An automated Godot 4.6.1 import, map-specific smoke test and screenshot capture are configured in `.github/workflows/ci.yml`. Inspect the **actual workflow result and uploaded PNG** before reporting runtime/visual acceptance.
- All procedural ground colors remain temporary authored M1 materials, **not final hand-painted raster art**. The next art pass should replace broad flat procedural surfaces with art-directed pixel chunks/textured shapes and add proper riverbank details that match the supplied sprites.
- The new map is a **compact playable prototype**. It has no complete navigation mesh, bridges, indoor rooms, weather/day-night integration, platform RPC, authoritative activities, online persistence or loot. The three activity slots in the JSON are nonfunctional placeholders.
- Local prop state resets when the scene is reopened. Touch/mobile controls and camera framing must be checked on actual devices.
- The platform branch stays untouched, and **the server remains authoritative** when activity syncing is implemented.
- Desktop/mobile scene performance, accessibility, exact prop footprints and potential water polygon collision concavity need Godot QA. No FPS or full M1 acceptance is claimed.
