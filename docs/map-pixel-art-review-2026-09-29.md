# Map pixel-art review — 2026-09-29

## Current runtime

- The four playable areas are authored from map JSON into Godot `TileMapLayer` nodes. World PNGs are previews only.
- The shared world grid is 32×32 pixels. The logical viewport is 640×360 with integer scaling and nearest filtering.
- Ground, detail, and foreground layers stay separate. Tall props and interactive trees/flowers use independent scene nodes and Y-sorting.

## Visual diagnosis

The map system is already editable and interaction-ready. The weak point is the source art and its use at the 32-pixel tile scale:

- Grass, gravel, and stone surfaces carry too many tiny texture marks. At play size those marks merge into visual noise and repeat like a stamped pattern.
- Terrain, structures, and props do not always share the same pixel-cluster size, outline weight, and contrast. The player sprite reads as a crisp outlined sprite while some ground and landmark art reads like miniature painted art.
- Several paths, shorelines, cliff runs, and dungeon walls keep long straight edges. The cell grid becomes visible even though the runtime is a TileMap rather than a flat image.

These are art-direction and tile-transition issues; the map should remain a real layered TileMap with PNGs reserved for previews.

## Project art contract

- Keep a 32×32 world tile and the existing 32×48 actor scale. Review every tile at native size and at the 2× game view.
- Use hard pixel edges, broad intentional clusters, a restrained palette per material, and clear light/dark grouping. Avoid smooth gradients, single-pixel noise fields, accidental anti-aliasing, and texture details that vanish at native scale.
- Ground cells describe one material. Put paths, shores, banks, walls, and corners in explicit transition tiles or overlays so grass→earth→stone/silt→water reads as one continuous landform.
- Use multiple terrain variants to break repetition, but do not make a visible checkerboard. Keep flowers, rocks, trees, buildings, gates, and other runtime objects out of base-ground art.
- Keep decorative and tall objects as reusable scene sprites. Preserve Y-sort, collision, map IDs, scene exits, spawn points, and the same world art on PC and mobile.

## Area direction

| Area | Palette and material | Main art correction |
| --- | --- | --- |
| An Khê | Warm meadow, earth paths, teal river, aged wood/bronze | Lower grass noise; make the path and riverbank edges feel worn and organic; keep village landmarks readable. |
| Trúc Âm | Deep forest greens, leaf litter, bamboo, cool stream | Break repeated floor patches; keep forest clumps off the walkable path; make the stream bank and bridge read as one structure. |
| Thạch Cạn | Ochre soil, charcoal rock, teal ore | Form larger connected rock masses; keep ore and mine objects as separate props rather than repeated ground stamps. |
| Cổ Tỉnh | Blue-charcoal slate, moss, restrained cyan spirit light | Reduce wallpaper-like floor repetition; use irregular cracked floor clusters and reserve bright cyan for readable landmarks. |

## Changes in this pass

- Rebuilt all four base surfaces with `scripts/build_pixel_world_terrain.py`. Each area now has a unique 1536×1152 atlas with one 32×32 pixel tile per map coordinate, so the camera does not reveal a small repeating ground sheet.
- Added map-specific palettes and pixel clusters for An Khê meadow, Trúc Âm leaf litter, Thạch Cạn ochre earth, and Cổ Tỉnh slate. Runtime only substitutes each area's base-ground tile IDs; paths, river, cliffs, walls, bridge, interactables, and landmarks keep their authored atlas art.
- Updated `game_map.gd` to resolve surface tiles from their map coordinates and explicit terrain-ID lists. This keeps the ground on the existing layered `TileMapLayer` system.
- Replaced the An Khê interactive flower cutout atlas with a 2×2 sprite pack generated for the project's pixel style. The existing `MapFlower` scene still selects four variants and keeps its stomp response.
- Added a named nine-prop sprite pack and placed eight small, non-colliding details across Trúc Âm, Thạch Cạn, and Cổ Tỉnh. Each placement was checked against the map tile data to avoid solid terrain and authored detail locations.
- Preserved the original terrain atlases for path, water, cliff, wall, and landmark cells. Map IDs, tile codes, route shapes, spawn points, collisions, and scene transitions are unchanged.

## Workflow and acceptance check

1. Run `python3 scripts/build_pixel_world_terrain.py` to reproduce the four map-wide ground atlases and their layout references.
2. Review each map in Godot at the 640×360 logical viewport at native scale and integer 2× scale.
3. Check path and river transitions, prop depth, collisions, and interactive flower response in a playable camera view.

Godot was not available in the authoring environment, so this pass was checked through asset inspection and project data validation; a live in-engine smoke test is still needed. The Python camera crops are visual estimates, not Godot screenshots.

## Sources

- Godot 4.6, [Using TileMaps](https://docs.godotengine.org/en/4.6/tutorials/2d/using_tilemaps.html) — recommends multiple `TileMapLayer` nodes where appropriate and describes reusable tilesets, terrain sets, and Y-sort.
- Godot 4.4, [Multiple resolutions](https://docs.godotengine.org/en/4.4/tutorials/rendering/multiple_resolutions.html) — documents integer scaling and notes 640×360 as a useful baseline for common display resolutions.
- Aseprite, [Tilemap](https://www.aseprite.org/docs/tilemap/) — explains tilemaps as cells that reference reusable tiles in a tileset.
- Lospec, [Basic Tiling](https://lospec.com/pixel-art-tutorials/basic-tiling-by-cyangmou), [Metatiles](https://lospec.com/pixel-art-tutorials/metatiles-in-a-nutshell-by-pix3m), and [The Grass Tile](https://lospec.com/pixel-art-tutorials/the-pixel-zone-the-grass-tile-by-st0ven) — practical references for seamless surfaces, transitions, and top-down material clusters.
