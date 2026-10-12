# World map terrain blockout

The eight maps in `data/world/maps/` are the first ground, landform, road and water pass from `docs/game-design/world-map/00-world-topology-and-routes.md` and the eight region briefs. Coordinates use 32 px per planning cell. The maps are separate polygon and spline layers; they are not baked full-map images or gameplay TileMaps.

## Open the preview

Open the Godot 4.6.1 project in `client/`, then run `scenes/world_map_blockout_preview.tscn` with **F6**. The project’s main scene remains unchanged.

- Press **1–8** to switch regions. Use **Tab** in Mỏ Ngầm to switch B1/B2.
- Hold **WASD** or arrow keys to pan; use the mouse wheel or **+ / −** to zoom; press **F** to fit the map.
- Use the right-side route buttons to preview an open link. The Thăng Long–Cảng route is labeled as a local transit preview. Initially locked Ba Vì routes remain locked.

`data/world/links.json` is the single source for ten external bidirectional links and the separate B1/B2 lift. Each endpoint has an arrival anchor at least three cells inland. The preview changes scenes locally; it does not issue a server travel request.

## Scope

This is an editable terrain blockout: ground patches, roads, shorelines, water shapes, water collision data and portal markers. It deliberately has no houses, trees, props, actors, NPCs, monsters, activities, final hand-painted art, navigation mesh or server travel. The existing `layered_village_m1.tscn` and `legacy_linh_khe.tscn` remain available as the M1 workflow and legacy comparison.

Run the static data check with `node scripts/check-world-map-blockouts.cjs`; run the live scene check with Godot 4.6.1 using `--headless --path client --script res://tests/world_map_blockout_smoke.gd`. CI also captures all eight views plus Mỏ Ngầm B2 for visual review.
