# Làng Linh Khê

Large playable village preview built from the supplied 16×16 Tiled asset pack.

- Map: `lang_linh_khe_112x96.tmx` (112×96 tiles, 1792×1536 pixels)
- Full-size preview: `lang_linh_khe_112x96-preview.png`
- Runtime data: `lang_linh_khe_112x96.json`
- Layers: grass, dirt roads/market square, animated flowers, animated water, Y-sorted props, roof/tree canopies, collisions and player spawn

Open `client/project.godot` in Godot 4 and press Play to walk around the map. Use WASD or the arrow keys to move and the mouse wheel to zoom. The overview in the top-right tracks the player.

The Tiled map is editable and references the original TSX/PNG pack in `client/assets/tileset/`. Regenerate the map, JSON and preview from the repository root with:

```sh
python3 client/tools/build_linh_khe_village.py
```
