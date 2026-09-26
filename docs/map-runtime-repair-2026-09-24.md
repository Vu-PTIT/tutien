# Map runtime and visual quality repair — 2026-09-24

Base: `be86b86e7057d27410d001e0f1de22e427feb0cd`, branch `feat/inventory-rewards`.

Current runtime note (26/09): the painted world PNGs are route concept previews only; the HUD minimap is derived from authored tiles/catalog, and there is no painted background fallback. An Khê's sakura is now a transparent cutout; most other atlas regions still include ground patches.

## Reproduced failure

Godot 4.6.1 failed to parse `game_map.gd:144`: it could not infer the type of
`variant_index` from the generic `abs()` expression. This prevented the shared
map script from loading. A typed integer/`absi()` correction first confirmed
that the existing presentation smoke could run. The replacement now consumes
explicit authored cell rows and removes that procedural region selector.

## Visual correction

The previous 256×256 prop sheets contained extremely simplified 32×32 objects.
File size was misleading: each file occupied 262,488 bytes, despite the sparse
art. Resource format `.tres` does not reduce image detail.

Restore the authored biome atlas bytes from local commit `c7767a2`, keeping the
current resource paths and newer runtime API. Restore the matching terrain
indices and placements together; atlas indices are not interchangeable between
art sets. All four maps use 256×256 terrain (64 cells of 32×32), and 1024×1024
landmark sheets (64 regions of 128×128). The player movement grid stays 32 px.
The larger props are displayed at native scale instead of enlarging 32 px icons.

Landmarks remain separate MapProp scene instances under the Y-sorted Actors
node. Their source sheets include some painted ground within the region;
these are detailed landmark patches, not fully isolated transparent production
sprites. Further silhouette cleanup should preserve the artwork and be visually
reviewed, rather than replacing it with low-detail procedural shapes.

The runtime validates every requested atlas cell and prop region. It loads the
shared prop texture once per map, retains nearest filtering and clipped atlas
sampling, and no longer eagerly loads a painted background or silently falls
back to it. Painted world images remain route concept references only.

## Regression checks

- `node scripts/check-png-integrity.cjs`: every asset PNG's chunk CRC, complete
  zlib stream, scanline length, filter bytes, and end marker.
- `node scripts/check-pixel-scenes.cjs`: resources, scene hierarchy, map layout,
  grid sizes, POIs, gate arrivals, 32 px terrain and 128 px landmark contract.
- Godot 4.4.1 and 4.6.1: clean import, project launch and offline presentation
  smoke. The smoke visits all four maps and checks complete ground coverage,
  valid tile data and high-resolution landmark regions as well as existing
  NPC/gate/inventory/room-camera interactions.

These tests cover offline client behavior; they do not certify a live Nakama
server or visual parity with the painted full-map concept images.
