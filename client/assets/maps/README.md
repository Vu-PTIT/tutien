# Làng Linh Khê

Large playable village preview built from the supplied 16×16 Tiled asset pack. Its 40×40 central layout is copied from `tileset/Tiled/Tilemaps/Beginning Fields.tmx`; the four houses in the reference image are placed over that original grass, sandy paths, river, stone walls and bridges. New residential lanes continue the same layout around the core.

- Map: `lang_linh_khe_112x96.tmx` (112×96 tiles, 1792×1536 pixels)
- Full-size preview: `lang_linh_khe_112x96-preview.png`
- Runtime data: `lang_linh_khe_112x96.json`
- Core offset: `(36, 27)` on the 112×96 map
- Layers: original grass, narrow sandy lanes, animated water, source stone walls/bridges, animated flowers and fire, separate prop scenes, roof/tree canopies, collisions and player spawn

This is the **legacy Tiled comparison map**, not the project’s main scene. Open `client/scenes/legacy_linh_khe.tscn` in Godot 4 and run it with F6 to inspect the original `TileMapLayer` implementation. The main playable layered village prototype is `client/scenes/layered_village_m1.tscn`; the eight-region ground blockout is `client/scenes/world_map_blockout_preview.tscn`. See `client/MAP_DESIGN.md` for the current map workflow.

The legacy scene keeps its original `TileMapLayer` ground and path layers, `TileSetAtlasSource` references and separate `map_sprite_object.tscn` props. It is retained only for comparison and has not been converted to the new world-map layer contract.

The Tiled map is editable and references the original TSX/PNG pack in `client/assets/tileset/`. Regenerate the map, JSON and preview from the repository root with:

```sh
python3 client/tools/build_linh_khe_village.py
```
