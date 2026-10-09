# M1 — Playable layered map vertical slice (09/10/2026)

**Branch:** `feat/map-ui-rebuild`. The new entry scene is `client/scenes/main.tscn`, pointing to `layered_village_m1.tscn`.

This is **a new compact prototype**, not a claim that the old 112×96 tile-built map was automatically converted. The original Tiled/TMX/JSON/PNG assets and generator remain unchanged. Open `res://scenes/legacy_linh_khe.tscn` explicitly to compare.

## Runtime structure
- `data/layered_village_m1.json`: bounds, freeform paths, water geometry, props and activity slot anchors. Geometry and visual props share world coordinates.
- `scripts/layered_village.gd`: procedural river/road/ground `Polygon2D` surfaces (no `TileMapLayer` or `gid`), collision, actors and HUD.
- `shaders/layered_surface.gdshader`: low-contrast pixel grass and dirt plus locally clipped water ripples. Procedural colors are temporary M1 visual materials, **not final hand-drawn background assets**.
- `scripts/layered_prop.gd`: original PNG props as independently anchored sprites, footprint collision, separate interaction sensing and local state.
- `scripts/layered_player.gd`: inherits corrected existing 32×48 character sprite setup; updated camera bounds.
- `scripts/layered_minimap.gd`: draws the same freeform road/water layout and prop positions from M1 JSON.

## Try it
1. Open `client/project.godot` with **Godot 4.6.1**, run `main.tscn`.
2. WASD or arrow keys to walk, wheel to zoom, E next to a bench/tree/door/plant/river sign to interact. Bench can be left with E. This prototype is desktop keyboard/mouse oriented.
3. Compare against `legacy_linh_khe.tscn`, which uses the existing Tiled-driven `village_demo.gd`.

## Scope and verification
- **M1 prototype source implemented**, interactive props partly demonstrate M2. Slots for gardening, rest, fishing are **visual references only**. No server RPC, persistence, pathfinding or autonomous avatar has been added.
- Need a **Godot 4.6.1 editor import/run**, visual inspection, collision/interaction regression, client FPS measurement and mobile tests. These were **not performed** in this environment.
- Current river collision uses overlapping circles based on shared geometry; replace with precise polygons and real crossings. The map currently has no complete navigation mesh.
- Night/weather, environmental audio, grass movement, animated tree crowns and action-specific sprite animations are **not implemented**.
- Accept the visual and camera scale before scaling beyond the M1 sample. Replace shader-generated placeholder surfaces with **art-directed raster chunks or authored textured shapes**, while keeping scene objects and gameplay ID independent.
- The external platform `feat/dual-experience-platform` remains untouched. Activity session authoritative state belongs to server, not local map objects.

## Acceptance to finish M1
- Confirm visually correct top-down 3/4 style with original art; avoid rescaling/mixing incompatible props.
- Verify no `TileMapLayer` in the new scene at runtime.
- Verify river barriers, free movement on all intended paths, house footprint and canopies, Y-sort behavior.
- Verify minimap matches world data and collisions prevent unreachable interaction through water/walls.
- Record CI/import/FPS evidence on target desktop and mobile before announcing M1 complete.
