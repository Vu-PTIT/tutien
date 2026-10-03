# Làng Linh Khê

Large playable village preview built from the supplied 16×16 Tiled asset pack. Its 40×40 central layout is copied from `tileset/Tiled/Tilemaps/Beginning Fields.tmx`; the four houses in the reference image are placed over that original grass, sandy paths, river, stone walls and bridges. New residential lanes continue the same layout around the core.

- Map: `lang_linh_khe_112x96.tmx` (112×96 tiles, 1792×1536 pixels)
- Full-size preview: `lang_linh_khe_112x96-preview.png`
- Runtime data: `lang_linh_khe_112x96.json`
- Core offset: `(36, 27)` on the 112×96 map
- Layers: original grass, narrow sandy lanes, animated water, source stone walls/bridges, animated flowers and fire, separate prop scenes, roof/tree canopies, collisions and player spawn

Open `client/project.godot` in Godot 4 and press Play to walk around the map. Ground layers are built as `TileMapLayer` nodes using `TileSetAtlasSource` resources backed by the original tileset images. Standalone buildings, trees and props are instances of `client/scenes/map_sprite_object.tscn`. Use WASD or the arrow keys to move and the mouse wheel to zoom. The overview in the top-right tracks the player.

The Tiled map is editable and references the original TSX/PNG pack in `client/assets/tileset/`. Regenerate the map, JSON and preview from the repository root with:

```sh
python3 client/tools/build_linh_khe_village.py
```
