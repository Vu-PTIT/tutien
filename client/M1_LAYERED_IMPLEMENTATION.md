# M1 — Layered village art pass (09/10/2026)

**Branch:** `feat/map-ui-rebuild`. The main scene opens `res://scenes/layered_village_m1.tscn`. The prior 112×96 Tiled village stays intact as `res://scenes/legacy_linh_khe.tscn` for comparison.

## Implemented in the isolated map slice

- `data/layered_village_m1.json`: one authored 1120×800 world-space layout, 5 independent walking paths, river + pond, irregular house clearings, garden beds, separately named buildings/trees/bushes/rocks and three future activity slots.
- `scripts/layered_village.gd`: freeform spline-built `Polygon2D` roads, dirt verges, riverbanks, water bodies and authored ground patches. **No TileMapLayer, TileSet or gameplay GID** is used in the new runtime map.
- `shaders/layered_surface.gdshader`: world-coordinate pixel textures (fixes former implicit UV stretching), water ripples clipped to waterways, locally distinguishable sandy trails, grass, bank and planting soil.
- `scripts/layered_prop.gd`: independent PNG scene objects from the original resource pack. Colliders, interaction sensing, visual Y-sort and access points are separate. Tree/shrub crowns sway gently about their ground anchor.
- `scripts/layered_player.gd`: inherits corrected walk/idle 32×48 sheet and bounded 2D camera. Local bench sit/stand action.
- `scripts/layered_minimap.gd`: renders the **same smoothed paths, water centerlines and prop coordinates**, scaled as strokes for minimap safety; no independently maintained preview bitmap.
- `L2_WaterCollision`: uses solid `CollisionPolygon2D` derived from the same rendered water outlines; no approximate circle chain.
- `scripts/check-layered-map.cjs`: checks map schema, sprite resource paths, unique IDs, valid activity slot anchors and non-tile runtime contract.
- `tests/layered_map_smoke.gd` and `tests/layered_map_capture.gd`: smoke-check live Godot nodes, local interactions and create viewport screenshot in CI.

## Try locally

1. `git checkout feat/map-ui-rebuild && git pull origin feat/map-ui-rebuild`.
2. Open `client/project.godot` with **Godot 4.6.1**; run the project (F5) or `layered_village_m1.tscn` (F6).
3. Use WASD or arrow keys to walk, mouse wheel to zoom and E near doors/trees/bench/plant/fishing point to interact.
4. Compare the scene tree with `legacy_linh_khe.tscn`, which intentionally retains the old tile-driven renderer.

## Verification and limitations

- An automated Godot 4.6.1 import, map-specific smoke test, strict runtime error gate and screenshot capture are configured in `.github/workflows/ci.yml`. Inspect the **actual workflow result and uploaded PNG** before reporting runtime/visual acceptance.
- All procedural ground colors remain temporary authored M1 materials, **not final hand-painted raster art**. The next art pass should replace broad flat procedural surfaces with art-directed pixel chunks/textured shapes and add proper riverbank details that match the supplied sprites.
- The new map is a **compact playable prototype**. It has no complete navigation mesh, bridges, indoor rooms, weather/day-night integration, platform RPC, authoritative activities, online persistence or loot. The three activity slots in the JSON are nonfunctional placeholders.
- Local prop state resets when the scene is reopened. Touch/mobile controls and camera framing must be checked on actual devices.
- The platform branch stays untouched, and **the server remains authoritative** when activity syncing is implemented.
- Desktop/mobile scene performance, accessibility, exact prop footprints and potential water polygon collision concavity need Godot QA. No FPS or full M1 acceptance is claimed.

## M1.2 — authored raster decoration and contrast (2026-10-09)

- Added eight explicitly positioned biome/flower brush zones in `data/layered_village_m1.json`.
- `layered_raster_chunks.gd` composites actual source-pack pixel artwork (flower sheets, tiny shrubs, plants and stones) into reusable 256×256 RGBA chunks; scenery remains a separate layer rather than part of the ground, with consistent nearest filtering. Placement uses seeded, non-grid freeform distributions and keeps main footpaths, buildings, water and plantable beds clear.
- River/pond verges get locally painted reeds, flowers and stones; footpaths get sparse pixel stone details. All decorative stamps are presentation-only, not loot/colliders.
- Props gain separate soft ground-contact shadow polygons independent of Y-sorted sprites and wind pivots.
- HUD now uses a dark, high-contrast card with a readable Vietnamese font. Interaction feedback lasts briefly and default tips reappear.
- The fishing-sign/slot position was moved toward the main riverbank, and three independent environment props were added.
- Smoke test now checks brush chunks and HUD contrast.
- **Visual quality gate:** inspect captured Godot screenshot in GitHub Actions, especially path continuity, density, foliage variation and alpha edges. The raster brush stamps are sourced from existing licensed sprites; **not a claim that all terrain is hand-painted**.
- `feat/dual-experience-platform` was not modified. No NPC routines, persistence, multiplayer activity or server economy added.

## M1.4 — Village circulation and connected neighborhoods (09/10/2026)

- Reorganized paths into thirteen authored freeform routes: main street, north/south lanes, market, fishing path, bridge approaches, and explicit house/garden entrance spurs.
- Authored a connected village center (`village_heart`) with an irregular cobblestone plaza and two packed-earth yards. These use polygon shaders in world pixels, **not a TileMap or pasted full-scene PNG**.
- Moved well, notice board, benches and lanterns into a legible shared village heart; added a table, goods, baskets and a sign to establish a small market cluster.
- Added five named districts and five `door_routes` to the single map JSON for eventual navigation/activity routing. Their visual presentation stays independent of the platform branch.
- Updated minimap and raster brush exclusion masks so new courtyard edges and approach paths remain visible rather than obscured by random brush sprites.
- Added `layered_route_smoke.gd`: Godot physics probes plus 16px AStar connectivity checks for doorways, garden, river crossing and major districts. The grid is **only a QA tool**; runtime art remains non-tile.
- Updated CI to capture both the camera gameplay shot and a full-map review shot from Godot.
- No server-backed travel, saved activities, autonomous NPC routing, multiplayer, real shop, or functional trade implemented here. Bridges and terrain remain subject to QA against all approach paths.

## M1.5 — Water / cliff environment art (2026-10-09)

- `layered_water_fx.gd`: one independently animated CanvasItem for water ripples and intermittent coastline highlights. FX seeds are deterministic, their positions are constrained to authored water polygons, and visual animation does not affect water collision.
- `layered_cliff_details.gd`: static moss, segmented cracks, and pebble accents follow the existing ridge splines. No new tile grids, gameplay obstacles, or world-scale PNG required.
- The water-specific density and flow parameters are defined in `water_fx` within `layered_village_m1.json` and validated in static and Godot smoke checks.
- **Limits:** M1.5 is an art pass, not weather, a full lighting simulation, new navigation, or runtime world streaming. Requires actual Godot visual quality review and device FPS measurements before art acceptance.

## M1.7 — Natural terrain transitions and cropped source-art chunks (2026-10-10)

- Reviewed **actual Godot 4.6.1** M1.6 PNG: mixed-source grass fragments still carry non-green pixels; outer 256px raster chunks can extend past the 1120×800 playable rectangle; outside the static map the renderer shows gray empty space.
- Reuse the original licensed atlas with **green-only alpha filtering** for decorative grass stamps and shader sampling; do not recolor entire maps or flatten individual gameplay objects.
- Crop outermost grass raster chunks to their actual rectangle, including 96px rightmost and 32px bottom strips. Their coordinates, z-layer and deterministic placement stay stable.
- Add editable, independent terrain layers: grass fringe → sandy shore → shallow water → independent water body; similarly grass fringe → dust verge → dirt lane, plus soft lawn fringes around authored village yards. The exact band widths are stored in `client/data/layered_terrain_art_m16.json`.
- Expand **visual-only** meadow behind the 1120×800 game bounds for wide art-review cameras, without modifying world physics, camera limits, activity slots or minimap.
- Art-review screenshot now hides the HUD (gameplay screenshot keeps it), and asserts the reference camera no longer exposes gray canvas along its left margin.
- Preserve all independent props, Y-sort, bridges, village entrance route tests and the original legacy scene.
- This remains a reusable **source-asset layered scene**, not a fully hand-painted custom base image. Scene import/CI and the resulting screenshots must be reviewed before accepting the visual change.

## M1.8 — Authored lane widths and organic cliff edges (2026-10-10)

- Maintains **scene_mode** + independent PNG props, collision, and Y-sorting. No tileset-only world or flattened game screenshot.
- Dirt lanes now have individual hand-selected `width_profile` control points (13 roads) and edge phases. Distances between anchor points determine smooth width interpolation; their endpoints and mapped doorway access stay unchanged.
- Minimap renders the same variable-width paths instead of a misleading fixed-width line.
- Both cliff ridges have short, broken, irregularly positioned anchor points and thinner, tapered stone faces. Collision uses the same face polygon, keeping render/physics aligned.
- Eight extra existing-asset tree props organized into three named grove clusters, independent from their foot collisions; no generated filler art.
- Navigation route and scene smoke tests remain required. CI screenshot review is required before visual acceptance; changes are a further art pass, not final world graphics.

## M1.9 — Vietnamese village functional identity (2026-10-10)

- **Playable scope**: adds 8 named Vietnamese-style hamlet activity and navigation zones (communal hall, village square, well, market, western/eastern hamlets, vegetable garden, village pond and riverside) linked to independent place marker objects. Zones have Godot Area2D sensors, localized display names, and lightweight HUD context.
- Adds six original licensed source-pack scene props including haystacks, market baskets, water crate and rural signposts. The existing separate house/tree scenes remain live and collision-backed.
- Local offline actions: communal hall information, well glint, market information, village signs; no simulated quests, online trade or fake server rewards.
- Important art truth: available `House_Hay` buildings are not accurate historical Vietnamese communal architecture. Mark those objects `art_status: source_placeholder` and store their intended `art_role` (communal hall, thatched village house, banyan, river landing) in map JSON. Never claim these source sprites are finished authentic Vietnamese pixel art.
- New source: `client/scripts/village_culture_zones.gd`; the script uses independent trigger objects, and map JSON remains the source of truth. Future authentic Vietnamese sprites can be swapped per object without replacing terrain or collision architecture.
- Does NOT introduce NPC schedules, missions, autonomous movement, platform syncing or economy.
- Required QA: Godot 4.6.1 import, scene smoke, route test, and screenshot; review artwork/identity before claiming visual acceptance.

## M2.0 — First independently rendered Vietnamese communal hall sprite

- Produced `assets/vietnam_village/dinh_linh_khe_m20.png` (176x103 px, indexed transparent PNG), sourced from a newly generated Vietnamese-inspired tiled-roof communal hall concept. Asset metadata lives in `dinh_linh_khe_m20.json`.
- Swapped **only** the existing `communal_hall` object's sprite reference. Preserved its ground anchor, 140x18 physics footprint, access point, cultural action and path endpoint. Nothing is baked into the terrain image.
- This is a **first-pass art prototype** requiring visual scale check and architectural style review. Other houses, banyan and props remain source-pack placeholders. No false claim of fully replaced Vietnamese assets.
- Test checks that the asset imports in Godot and matches expected pixel dimensions. CI visual capture and route smoke remain required.
