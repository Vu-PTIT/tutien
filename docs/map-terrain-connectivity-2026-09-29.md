# Map terrain connectivity pass — 2026-09-29

## Goal

Keep the 32 px pixel-art grid readable while making footpaths, grassy ground, banks, and water meet through shared shapes and consistent pixel scale.

## Runtime layer order

| Layer | Role |
| --- | --- |
| GroundLayer | Full map floor and the land texture beneath water |
| WaterLayer | Water tiles only, so shore overlays can sit above them |
| ShoreLayer | Two-sided shoreline decals for land and water cells |
| DetailLayer | Footpath edge and corner decals plus map details |
| Actors | Y-sorted characters and interactive props |
| ForegroundLayer | Trees and scenery drawn over actors |

The solid-tile and walkable-rectangle data remains unchanged. Water stays blocked; bridge/path behavior is preserved.

## Pixel atlas contract

`terrain_transition_decals_pixel_v1.png` is a transparent 12×8 atlas of 32 px cells (384×256 total), with eight opaque RGB colors, binary alpha, and nearest-neighbor 4×4 runtime pixel clusters (8×8 logical pixels per tile). Rows 0–1 are four path-edge and four path-corner variants. Rows 2–3 cover land-side shore edges/corners. Rows 4–5 cover water-side edges/corners. The data maps keep the index ranges explicit, so variant selection stays deterministic per cell.

An Khê and Trúc Âm use the same transition contract. Their older full-width An Khê shoreline overlay is disabled in favor of tile-level decals. Path and shoreline decals use separate tile layers so a trail can still meet the river on the same cell.

## Surface response

Moving across configured grass, soil, stone, and water cells leaves a brief handful of nearest-filtered pixel flecks. Shore-adjacent steps can include a snapped, hard-edged water pixel; rain changes the grass/soil palette. Surface flecks, shimmer, and rain rings all use 4 px-aligned rectangles and stepped rings, with a short stepped fade. Existing animated river shimmer and rain rings remain in place.

## Verification

The new `terrain_connectivity_smoke.gd` checks that both maps load with a full ground grid, populate separate water and shore layers, and expose material step definitions. JSON geometry, tile ranges, collision IDs, atlas dimensions, eight-color palette, and binary alpha were statically validated. Godot runtime execution is still pending because no Godot executable is available in this workspace.
