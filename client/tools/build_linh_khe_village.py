#!/usr/bin/env python3
"""Build the large, source-preserving Linh Khe village map and preview."""

from __future__ import annotations

import json
import math
import random
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

from PIL import Image


PROJECT = Path(__file__).resolve().parents[1]
ASSETS = PROJECT / "assets" / "tileset"
TILED = ASSETS / "Tiled"
MAP_DIR = PROJECT / "assets" / "maps"
MAP_DIR.mkdir(parents=True, exist_ok=True)

WIDTH, HEIGHT = 112, 96
CELL = 16
OUT_TMX = MAP_DIR / "lang_linh_khe_112x96.tmx"
OUT_JSON = MAP_DIR / "lang_linh_khe_112x96.json"
OUT_PNG = MAP_DIR / "lang_linh_khe_112x96-preview.png"
SOURCE_MAP = TILED / "Tilemaps" / "Beginning Fields.tmx"


def tmx_properties(element: ET.Element, props: dict[str, object]) -> None:
    container = ET.SubElement(element, "properties")
    for name, value in props.items():
        attributes = {"name": name, "value": str(value).lower() if isinstance(value, bool) else str(value)}
        if isinstance(value, bool):
            attributes["type"] = "bool"
        elif isinstance(value, int):
            attributes["type"] = "int"
        ET.SubElement(container, "property", attributes)


def point_in_ellipse(x: float, y: float, cx: float, cy: float, rx: float, ry: float) -> bool:
    if rx <= 0 or ry <= 0:
        return False
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0


def paint_blob(grid: list[list[int]], cx: float, cy: float, rx: float, ry: float, value: int, rng: random.Random, roughness: float = 0.13) -> None:
    for y in range(max(0, int(cy - ry - 1)), min(HEIGHT, int(cy + ry + 2))):
        for x in range(max(0, int(cx - rx - 1)), min(WIDTH, int(cx + rx + 2))):
            rough = rng.uniform(-roughness, roughness)
            if point_in_ellipse(x + 0.5, y + 0.5, cx, cy, rx * (1 + rough), ry * (1 + rough)):
                grid[y][x] = value


def stamp_path(mask: list[list[bool]], points: list[tuple[float, float]], radius: float) -> None:
    for (x1, y1), (x2, y2) in zip(points, points[1:]):
        steps = max(1, math.ceil(max(abs(x2 - x1), abs(y2 - y1)) * 4))
        for step in range(steps + 1):
            t = step / steps
            cx = x1 + (x2 - x1) * t
            cy = y1 + (y2 - y1) * t
            for y in range(max(0, int(cy - radius - 1)), min(HEIGHT, int(cy + radius + 2))):
                for x in range(max(0, int(cx - radius - 1)), min(WIDTH, int(cx + radius + 2))):
                    if (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= radius ** 2:
                        mask[y][x] = True


def terrain_signature(grid: list[list[int]], x: int, y: int) -> tuple[int, ...]:
    def material(px: int, py: int) -> int:
        if px < 0 or py < 0 or px >= WIDTH or py >= HEIGHT:
            return 1
        return grid[py][px]

    current = material(x, y)

    def majority(points: list[tuple[int, int]]) -> int:
        counts = defaultdict(int)
        for px, py in points:
            counts[material(px, py)] += 1
        high = max(counts.values())
        winners = [key for key, count in counts.items() if count == high]
        return current if current in winners else min(winners)

    nw = majority([(x - 1, y - 1), (x, y - 1), (x - 1, y), (x, y)])
    ne = majority([(x, y - 1), (x + 1, y - 1), (x, y), (x + 1, y)])
    se = majority([(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)])
    sw = majority([(x - 1, y), (x, y), (x - 1, y + 1), (x, y + 1)])
    top = majority([(x, y - 1), (x, y)])
    right = majority([(x, y), (x + 1, y)])
    bottom = majority([(x, y), (x, y + 1)])
    left = majority([(x - 1, y), (x, y)])
    return nw, top, ne, right, se, bottom, sw, left


def mask_signature(mask: list[list[bool]], x: int, y: int) -> tuple[int, ...]:
    def filled(px: int, py: int) -> int:
        return int(0 <= px < WIDTH and 0 <= py < HEIGHT and mask[py][px])

    def corner(points: list[tuple[int, int]]) -> int:
        return int(sum(filled(px, py) for px, py in points) >= 2)

    nw = corner([(x - 1, y - 1), (x, y - 1), (x - 1, y), (x, y)])
    ne = corner([(x, y - 1), (x + 1, y - 1), (x, y), (x + 1, y)])
    se = corner([(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)])
    sw = corner([(x - 1, y), (x, y), (x - 1, y + 1), (x, y + 1)])
    top = int(filled(x, y - 1) and filled(x, y))
    right = int(filled(x, y) and filled(x + 1, y))
    bottom = int(filled(x, y) and filled(x, y + 1))
    left = int(filled(x - 1, y) and filled(x, y))
    return nw, top, ne, right, se, bottom, sw, left


def pick_wang_tileset(tsx_path: Path) -> tuple[ET.Element, dict[tuple[int, ...], list[int]]]:
    root = ET.parse(tsx_path).getroot()
    wangset = root.find("./wangsets/wangset")
    if wangset is None:
        raise RuntimeError(f"No Wang set in {tsx_path.name}")
    tiles: dict[tuple[int, ...], list[int]] = defaultdict(list)
    for entry in wangset.findall("wangtile"):
        key = tuple(int(part) for part in entry.get("wangid", "").split(","))
        tiles[key].append(int(entry.get("tileid", "0")))
    return root, dict(tiles)


def choose_wang(sig: tuple[int, ...], choices: dict[tuple[int, ...], list[int]], rng: random.Random) -> int:
    exact = choices.get(sig)
    if exact:
        return rng.choice(exact)
    best_score = 10_000
    best: list[int] = []
    for candidate, tile_ids in choices.items():
        score = 0
        for index, (actual, wanted) in enumerate(zip(candidate, sig)):
            if actual == wanted:
                continue
            score += 4 if index % 2 else 1
        if score < best_score:
            best_score = score
            best = tile_ids[:]
        elif score == best_score:
            best.extend(tile_ids)
    return rng.choice(best)


def read_source_layers() -> tuple[ET.Element, dict[str, list[list[int]]], dict[str, int]]:
    root = ET.parse(SOURCE_MAP).getroot()
    layers: dict[str, list[list[int]]] = {}
    for layer in root.findall("layer"):
        data = layer.find("data")
        if data is None:
            continue
        values = [int(value.strip() or 0) for value in (data.text or "").replace("\n", "").split(",") if value.strip()]
        width = int(layer.get("width", root.get("width", "0")))
        height = int(layer.get("height", root.get("height", "0")))
        layers[str(layer.get("name", ""))] = [values[y * width:(y + 1) * width] for y in range(height)]
    first_gids = {
        ET.parse((SOURCE_MAP.parent / entry.get("source", "")).resolve()).getroot().get("name", ""): int(entry.get("firstgid", "1"))
        for entry in root.findall("tileset")
    }
    return root, layers, first_gids


def wang_material_cells(grid: list[list[int]], first_gid: int, wang_by_local_id: dict[int, tuple[int, ...]]) -> list[list[bool]]:
    return [
        [any(wang_by_local_id.get(gid - first_gid, (0,) * 8)) for gid in row]
        for row in grid
    ]


def paste_source_region(target: list[list[int]], source: list[list[int]], offset_x: int, offset_y: int) -> None:
    for sy, row in enumerate(source):
        y = offset_y + sy
        if not 0 <= y < HEIGHT:
            continue
        for sx, value in enumerate(row):
            x = offset_x + sx
            if 0 <= x < WIDTH:
                target[y][x] = value


def rect_tiles(x1: int, y1: int, x2: int, y2: int) -> list[tuple[int, int]]:
    return [(x, y) for y in range(max(0, y1), min(HEIGHT, y2 + 1)) for x in range(max(0, x1), min(WIDTH, x2 + 1))]


def merge_cells(cells: set[tuple[int, int]]) -> list[tuple[int, int, int, int]]:
    runs_by_row: dict[int, list[tuple[int, int]]] = {}
    for y in range(HEIGHT):
        xs = sorted(x for x, yy in cells if yy == y)
        runs = []
        if xs:
            start = prev = xs[0]
            for x in xs[1:]:
                if x != prev + 1:
                    runs.append((start, prev + 1))
                    start = x
                prev = x
            runs.append((start, prev + 1))
        runs_by_row[y] = runs
    active: dict[tuple[int, int], tuple[int, int]] = {}
    result: list[tuple[int, int, int, int]] = []
    for y in range(HEIGHT + 1):
        current = set(runs_by_row.get(y, []))
        for key in list(active):
            if key not in current:
                start_y, end_y = active.pop(key)
                result.append((key[0], start_y, key[1] - key[0], end_y - start_y))
        for key in current:
            if key in active:
                active[key] = active[key][0], y + 1
            else:
                active[key] = (y, y + 1)
    return result


def add_object(objects: list[dict[str, object]], gid: int, tx: int, ty: int, name: str, kind: str, image_size: tuple[int, int], extra: dict[str, object] | None = None) -> dict[str, object]:
    w, h = image_size
    item: dict[str, object] = {
        "gid": gid,
        "x": tx * CELL,
        "y": ty * CELL,
        "w": w,
        "h": h,
        "name": name,
        "kind": kind,
    }
    if extra:
        item.update(extra)
    objects.append(item)
    return item


def source_assets() -> tuple[list[dict[str, object]], dict[int, tuple[int, int]], dict[str, int]]:
    root = ET.parse(SOURCE_MAP).getroot()
    tilesets = []
    object_sizes: dict[int, tuple[int, int]] = {}
    first_by_name: dict[str, int] = {}
    for entry in root.findall("tileset"):
        firstgid = int(entry.get("firstgid", "1"))
        rel = entry.get("source", "")
        path = (SOURCE_MAP.parent / rel).resolve()
        tsx = ET.parse(path).getroot()
        name = tsx.get("name", path.stem)
        first_by_name[name] = firstgid
        image_node = tsx.find("image")
        tile_data: dict[str, dict[str, object]] = {}
        image_path = None
        if image_node is not None:
            image_path = (path.parent / image_node.get("source", "")).resolve()
        else:
            for tile in tsx.findall("tile"):
                image = tile.find("image")
                if image is None:
                    continue
                absolute = (path.parent / image.get("source", "")).resolve()
                with Image.open(absolute) as im:
                    actual_size = im.size
                local_id = int(tile.get("id", "0"))
                tile_data[str(local_id)] = {
                    "image": "res://" + absolute.relative_to(PROJECT).as_posix(),
                    "width": actual_size[0],
                    "height": actual_size[1],
                }
                object_sizes[firstgid + local_id] = actual_size
        if image_path is not None:
            with Image.open(image_path) as im:
                atlas_size = im.size
            cols = int(tsx.get("columns", "0") or 0)
            tw, th = int(tsx.get("tilewidth", "16")), int(tsx.get("tileheight", "16"))
            if not cols:
                cols = max(1, (atlas_size[0] - 2 * int(tsx.get("margin", "0"))) // (tw + int(tsx.get("spacing", "0"))))
            for local_id in range(int(tsx.get("tilecount", "0"))):
                object_sizes[firstgid + local_id] = (tw, th)
        tile_offset = tsx.find("tileoffset")
        tilesets.append({
            "first_gid": firstgid,
            "name": name,
            "tile_width": int(tsx.get("tilewidth", "16")),
            "tile_height": int(tsx.get("tileheight", "16")),
            "tile_count": int(tsx.get("tilecount", "0")),
            "columns": int(tsx.get("columns", "0") or 0),
            "margin": int(tsx.get("margin", "0")),
            "spacing": int(tsx.get("spacing", "0")),
            "image": "res://" + image_path.relative_to(PROJECT).as_posix() if image_path else "",
            "collection": tile_data,
            "tile_offset_x": int(tile_offset.get("x", "0")) if tile_offset is not None else 0,
            "tile_offset_y": int(tile_offset.get("y", "0")) if tile_offset is not None else 0,
        })
    return tilesets, object_sizes, first_by_name


def build() -> None:
    rng = random.Random(2103)
    ground_root, ground_wang = pick_wang_tileset(TILED / "Tilesets" / "Tileset_Ground.tsx")
    road_root, road_wang = pick_wang_tileset(TILED / "Tilesets" / "Tilesets_Road.tsx")
    water_root, water_wang = pick_wang_tileset(TILED / "Tilesets" / "Tileset_Water.tsx")
    _, object_sizes, first_by_name = source_assets()

    source_root, source_layers, source_first_gids = read_source_layers()
    source_width = int(source_root.get("width", "0"))
    source_height = int(source_root.get("height", "0"))
    core_x, core_y = 36, 27
    core_cells = {(core_x + x, core_y + y) for y in range(source_height) for x in range(source_width)}
    expected_source_layers = {"Ground", "Flowers", "Road", "RockSlopes_Auto", "Water"}
    missing = expected_source_layers - set(source_layers)
    if missing:
        raise RuntimeError(f"Beginning Fields source map is missing layers: {sorted(missing)}")

    # Keep the supplied Beginning Fields tile layout as the visible village core.
    # Only the space around it is extended; no replacement ground field is invented.
    ground_first = first_by_name["Tileset_Ground"]
    road_first = first_by_name["Road"]
    water_first = first_by_name["Tileset_Water"]
    grass_tiles = ground_wang.get((1, 1, 1, 1, 1, 1, 1, 1), [])
    if not grass_tiles:
        raise RuntimeError("Tileset_Ground has no all-grass Wang tiles")
    ground_values = [[ground_first + rng.choice(grass_tiles) for _ in range(WIDTH)] for _ in range(HEIGHT)]
    roads = [[False for _ in range(WIDTH)] for _ in range(HEIGHT)]
    water = [[False for _ in range(WIDTH)] for _ in range(HEIGHT)]
    road_values = [[0 for _ in range(WIDTH)] for _ in range(HEIGHT)]
    water_values = [[0 for _ in range(WIDTH)] for _ in range(HEIGHT)]
    rock_values = [[0 for _ in range(WIDTH)] for _ in range(HEIGHT)]
    flowers = [[0 for _ in range(WIDTH)] for _ in range(HEIGHT)]
    effects = [[0 for _ in range(WIDTH)] for _ in range(HEIGHT)]
    effects[core_y + 32][core_x + 17] = 5770
    paste_source_region(ground_values, source_layers["Ground"], core_x, core_y)
    paste_source_region(road_values, source_layers["Road"], core_x, core_y)
    paste_source_region(water_values, source_layers["Water"], core_x, core_y)
    paste_source_region(rock_values, source_layers["RockSlopes_Auto"], core_x, core_y)
    paste_source_region(flowers, source_layers["Flowers"], core_x, core_y)

    road_tile_root, _ = pick_wang_tileset(TILED / "Tilesets" / "Tilesets_Road.tsx")
    water_tile_root, _ = pick_wang_tileset(TILED / "Tilesets" / "Tileset_Water.tsx")
    road_wang_map = {
        int(tile.get("tileid", "0")): tuple(int(part) for part in tile.get("wangid", "").split(","))
        for tile in road_tile_root.findall("./wangsets/wangset/wangtile")
    }
    water_wang_map = {
        int(tile.get("tileid", "0")): tuple(int(part) for part in tile.get("wangid", "").split(","))
        for tile in water_tile_root.findall("./wangsets/wangset/wangtile")
    }
    core_roads = wang_material_cells(source_layers["Road"], source_first_gids["Road"], road_wang_map)
    core_water = wang_material_cells(source_layers["Water"], source_first_gids["Tileset_Water"], water_wang_map)
    for y in range(source_height):
        for x in range(source_width):
            roads[core_y + y][core_x + x] = core_roads[y][x]
            water[core_y + y][core_x + x] = core_water[y][x]

    # Extend the sample's winding village lanes to four new residential/garden areas.
    # Each branch is a narrow footpath, with the screenshot's sandy road tiles.
    path_specs = [
        ([(46, 31), (43, 24), (37, 21), (34, 23), (30, 24), (24, 24), (18, 24), (14, 22)], 1.0),
        ([(70, 41), (77, 42), (83, 38), (90, 36), (96, 38)], 1.05),
        ([(36, 60), (30, 61), (24, 58), (19, 54), (11, 53), (4, 57)], 0.95),
        ([(72, 63), (77, 69), (84, 73), (92, 76), (101, 74)], 1.05),
        ([(27, 69), (24, 75), (20, 80), (13, 83), (5, 82)], 0.85),
        ([(90, 42), (96, 45), (100, 50), (99, 56), (96, 59)], 0.8),
        ([(42, 23), (33, 23), (28, 27), (24, 33), (20, 38)], 0.75),
        ([(62, 76), (55, 78), (50, 79), (46, 80)], 0.75),
        ([(46, 80), (45, 78), (45, 76.5)], 0.6),
        ([(13, 18), (12, 24), (13, 29)], 0.65),
        ([(28, 20), (31, 23), (34, 28)], 0.65),
        ([(9, 43), (14, 44), (18, 48)], 0.65),
        ([(10, 68), (13, 71), (16, 72)], 0.65),
        ([(84, 36), (84, 41), (87, 46)], 0.65),
        ([(83, 54), (87, 56), (90, 58)], 0.65),
        ([(96, 59), (99, 62), (99, 68), (94, 69)], 0.65),
        ([(45, 75), (45, 78), (46, 80)], 0.65),
        ([(63, 75), (68, 77), (73, 78)], 0.65),
    ]
    for points, radius in path_specs:
        stamp_path(roads, points, radius)

    # The reference river already enters from the north-east and south of the core.
    # Continue those channels along the village edge, leaving the homes on grass.
    stamp_path(water, [(68, 30), (77, 27), (87, 24), (97, 27), (106, 33), (110, 42), (110, 57), (109, 72), (112, 83), (106, 94)], 2.7)
    stamp_path(water, [(36, 62), (29, 66), (20, 69), (10, 73), (2, 76), (-2, 79)], 2.7)
    stamp_path(water, [(66, 65), (62, 73), (56, 79), (47, 84), (35, 87), (22, 87), (10, 90), (-2, 91)], 2.8)

    # The extension stays on grass. Only source paths and the existing river expose sand.
    terrain = [[1 for _ in range(WIDTH)] for _ in range(HEIGHT)]
    for y in range(HEIGHT):
        for x in range(WIDTH):
            if (x, y) in core_cells:
                continue
            ground_values[y][x] = ground_first + choose_wang(terrain_signature(terrain, x, y), ground_wang, rng)

    # Build Wang-matched tiles for the new road and river cells while retaining every
    # original source cell unchanged inside the sample's 40 x 40 footprint.
    for y in range(HEIGHT):
        for x in range(WIDTH):
            if (x, y) not in core_cells:
                if roads[y][x]:
                    road_values[y][x] = road_first + choose_wang(mask_signature(roads, x, y), road_wang, rng)
                if water[y][x]:
                    water_values[y][x] = water_first + choose_wang(mask_signature(water, x, y), water_wang, rng)

    objects: list[dict[str, object]] = []
    building_objects: list[dict[str, object]] = []

    def place_house(gid: int, tx: float, top_ty: float, name: str) -> None:
        height_tiles = object_sizes[gid][1] / CELL
        item = add_object(objects, gid, tx, top_ty + height_tiles, name, "building", object_sizes[gid], {"canopy": True, "blocking": True})
        building_objects.append(item)

    # Four houses line up with the same landmarks in the supplied village image.
    place_house(479, core_x + 15.4, core_y + 2.0, "Beginning Fields Spirit Hall")
    place_house(477, core_x + 29.9, core_y + 7.2, "East River Cottage")
    place_house(480, core_x + 3.9, core_y + 12.9, "Old West Cottage")
    place_house(478, core_x + 21.3, core_y + 19.9, "South Garden Home")

    # New homes extend the pictured core as connected hamlets instead of new terrain.
    outer_houses = [
        (478, 9, 9, "North Orchard Home"), (477, 25, 13, "North Lane Cottage"),
        (479, 4, 34, "West Garden Hall"), (477, 18, 48, "West Lane Home"),
        (478, 3, 58, "Lower West Cottage"), (479, 86, 7, "East Bank Hall"),
        (477, 82, 30, "East Lane Home"), (478, 87, 49, "Riverside House"),
        (478, 40, 69, "South Orchard Home"), (479, 78, 60, "South Market Hall"),
        (477, 76, 74, "Eastern Garden Home"),
        (477, 17, 27, "Northwest Settlement Cottage"), (478, 20, 39, "West Midlane Home"),
        (477, 31, 50, "Central West Cottage"), (477, 78, 7, "Upper East Cottage"),
        (478, 31, 73, "Lower Orchard Home"), (477, 91, 61, "Lower East Cottage"),
        (478, 78, 47, "East Footpath Cottage"),
    ]
    for gid, tx, top_ty, name in outer_houses:
        place_house(gid, tx, top_ty, name)

    # A compact edge gate and small market points give the extensions readable goals.
    gate = add_object(objects, 481, 91, 84, "South Village Gate", "gate", object_sizes[481], {"canopy": True, "blocking": True})
    building_objects.append(gate)
    add_object(objects, 482, 52, 69, "South Orchard Well", "well", object_sizes[482], {"blocking": True})
    add_object(objects, 486, 71, 48, "East Lane Noticeboard", "noticeboard", object_sizes[486], {"blocking": True})
    add_object(objects, 501, 22, 22, "North Field Cart", "market", object_sizes[501], {"blocking": True})
    add_object(objects, 490, 89, 44, "Riverside Lamp", "lamp", object_sizes[490], {"canopy": True, "blocking": True})
    add_object(objects, 495, 67, 61, "South Lane Banner", "banner", object_sizes[495], {"canopy": True})

    # Core props follow the sample image: hay, crates, a cart, benches, flowers and fire.
    prop_specs = [
        (498, core_x + 10, core_y + 5, "North Yard Haystack", "farm_prop"),
        (499, core_x + 8, core_y + 3, "North Yard Barrel", "market"),
        (484, core_x + 14, core_y + 17, "West Path Bench", "bench"),
        (485, core_x + 23, core_y + 16, "Central Path Bench", "bench"),
        (493, core_x + 1, core_y + 14, "West Path Sign", "sign"),
        (496, core_x + 15, core_y + 13, "Handcart Crate", "market"),
        (490, core_x + 33, core_y + 25, "East Path Lantern", "lamp"),
        (495, core_x + 31, core_y + 35, "South Banner West", "banner"),
        (495, core_x + 35, core_y + 35, "South Banner East", "banner"),
        (488, core_x + 28, core_y + 18, "East Yard Crate", "crate"),
        (489, core_x + 30, core_y + 18, "Small East Crate", "crate"),
        (492, core_x + 5, core_y + 22, "West Yard Sack", "market"),
        (500, core_x + 31, core_y + 29, "South Garden Basket", "market"),
        (487, core_x + 16, core_y + 30, "Garden Stump", "stump"),
        (498, 14, 69, "West Farm Haystack", "farm_prop"),
        (497, 43, 78, "Orchard Outdoor Fireplace", "fireplace"),
        (499, 79, 74, "East Garden Barrel", "market"),
        (500, 95, 58, "Riverside Basket", "market"),
        (488, 86, 70, "South Market Crate", "crate"),
        (489, 89, 70, "South Market Small Crate", "crate"),
    ]
    for gid, tx, ty, name, kind in prop_specs:
        add_object(objects, gid, tx, ty, name, kind, object_sizes[gid], {"blocking": kind in {"market", "crate", "stump", "fireplace"}})
    # Full-size tree sprites stay on the edge of yards; low bushes and bank rocks
    # add detail around the reference's rock walls and channels.
    core_trees = [
        (514, core_x + 1, core_y + 11), (515, core_x + 5, core_y + 1),
        (517, core_x + 33, core_y + 3), (514, core_x + 37, core_y + 16),
        (517, core_x + 26, core_y + 19), (516, core_x + 2, core_y + 34),
        (514, core_x + 18, core_y + 38), (517, core_x + 38, core_y + 37),
        (515, core_x + 30, core_y + 33), (516, core_x + 7, core_y + 25),
    ]
    outer_trees = [
        (3, 3), (18, 2), (34, 4), (76, 4), (82, 7), (107, 7),
        (2, 17), (1, 30), (3, 43), (3, 54), (1, 87),
        (109, 13), (109, 20), (110, 31), (108, 61), (104, 77),
        (5, 92), (16, 93), (29, 91), (39, 94), (80, 93), (95, 91), (107, 92),
        (31, 8), (6, 27), (27, 43), (80, 30), (82, 55), (33, 78), (70, 83), (47, 16),
    ]
    tree_specs = core_trees + [
        (514 + (i % 4), tx, ty) for i, (tx, ty) in enumerate(outer_trees)
    ]
    tree_objects: list[dict[str, object]] = []
    for i, (gid, tx, ty) in enumerate(tree_specs):
        item = add_object(objects, gid, tx, ty, f"Village Tree {i + 1:02d}", "tree", object_sizes[gid], {"canopy": True, "blocking": True})
        tree_objects.append(item)

    bush_specs = [
        (507, 7, 18), (509, 13, 17), (508, 20, 5), (511, 31, 7),
        (512, 7, 48), (510, 13, 59), (513, 29, 45), (508, 26, 64),
        (510, 79, 21), (507, 82, 26), (512, 82, 43), (509, 96, 47),
        (513, 101, 63), (511, 70, 78), (508, 53, 82), (510, 27, 84),
        (509, 8, 61), (512, 30, 58), (507, 94, 18), (511, 72, 12),
    ]
    for i, (gid, tx, ty) in enumerate(bush_specs):
        add_object(objects, gid, tx, ty, f"Village Shrub {i + 1:02d}", "bush", object_sizes[gid], {"blocking": True})

    rock_specs = [
        (502, 73, 32), (503, 79, 26), (504, 104, 34), (505, 108, 53), (506, 97, 67),
        (502, 3, 73), (504, 23, 68), (503, 44, 87), (505, 67, 84), (506, 25, 90),
    ]
    for i, (gid, tx, ty) in enumerate(rock_specs):
        add_object(objects, gid, tx, ty, f"River Rock {i + 1:02d}", "rock", object_sizes[gid], {"blocking": True})

    # Tiny garden rows are set on grass and in small Wang-tiled beds, never in broad dirt yards.
    crop_rows = [(12, 72), (15, 72), (18, 72), (93, 63), (96, 63), (79, 80), (82, 80), (85, 80)]
    for i, (tx, ty) in enumerate(crop_rows):
        add_object(objects, 491, tx, ty, f"Small Garden Plant {i + 1:02d}", "crop", object_sizes[491])

    canopy_objects = [item for item in objects if item.get("canopy")]

    # Low-density animated flowers follow the sample's existing flower clusters.
    flower_gids = [5578 + n for n in (0, 1, 3, 5, 48, 49, 51)] + [5674 + n for n in (0, 1, 3, 5, 48, 49, 51)]
    flower_patches = [(9, 21), (29, 13), (22, 31), (16, 61), (31, 72), (48, 13), (81, 16), (100, 51), (91, 59), (67, 74), (42, 84), (22, 86)]
    for cx, cy in flower_patches:
        for _ in range(rng.randint(3, 6)):
            x = max(1, min(WIDTH - 2, cx + rng.randint(-2, 2)))
            y = max(1, min(HEIGHT - 2, cy + rng.randint(-2, 2)))
            if not roads[y][x] and not water[y][x] and flowers[y][x] == 0 and (x, y) not in core_cells:
                flowers[y][x] = rng.choice(flower_gids)

    # Add collision footprints at water, building bases, tree trunks, and a few hard props.
    collision_rects: list[tuple[int, int, int, int, str]] = []
    water_cells = {(x, y) for y in range(HEIGHT) for x in range(WIDTH) if water[y][x]}
    for x, y, w, h in merge_cells(water_cells):
        collision_rects.append((x * CELL, y * CELL, w * CELL, h * CELL, "water"))
    for item in objects:
        x, y, w, h = int(item["x"]), int(item["y"]), int(item["w"]), int(item["h"])
        kind = str(item["kind"])
        if kind in {"building", "gate"}:
            y0 = max(0, y - 10)
            left_w = max(8, int(w * 0.31))
            right_x = x + int(w * 0.68)
            right_w = max(8, x + w - right_x)
            collision_rects.append((x + 3, y0, left_w, 10, "building_wall"))
            collision_rects.append((right_x, y0, right_w, 10, "building_wall"))
        elif kind == "tree":
            collision_rects.append((x + int(w * 0.25), max(0, y - 10), max(10, int(w * 0.5)), 10, "tree_trunk"))
        elif item.get("blocking"):
            collision_rects.append((x + max(0, int(w * 0.2)), max(0, y - max(7, int(h * 0.16))), max(8, int(w * 0.6)), max(7, int(h * 0.16)), "prop"))

    # Tiled map retains the supplied TSX files and their native 16px cell metadata.
    root = ET.Element("map", {
        "version": "1.10", "tiledversion": "1.11.2", "orientation": "orthogonal",
        "renderorder": "right-down", "width": str(WIDTH), "height": str(HEIGHT),
        "tilewidth": str(CELL), "tileheight": str(CELL), "infinite": "0",
        "nextlayerid": "11", "nextobjectid": str(1 + len(objects) + len(canopy_objects) + len(collision_rects) + 1),
    })
    tmx_properties(root, {
        "display_name": "Làng Linh Khê",
        "region": "Vietnam",
        "tile_grid": "16x16",
        "playable_preview": True,
        "source_layout": "tileset/Tiled/Tilemaps/Beginning Fields.tmx",
        "source_layout_offset": f"{core_x},{core_y}",
        "expansion_style": "grass plots, narrow sandy lanes, winding stream and stone walls",
    })
    for ts in source_root.findall("tileset"):
        ET.SubElement(root, "tileset", {"firstgid": ts.get("firstgid", "1"), "source": "../tileset/Tiled/Tilesets/" + Path(ts.get("source", "")).name})

    def add_tile_layer(layer_id: int, name: str, values: list[list[int]], role: str) -> None:
        layer = ET.SubElement(root, "layer", {"id": str(layer_id), "name": name, "width": str(WIDTH), "height": str(HEIGHT)})
        tmx_properties(layer, {"layer_role": role, "cell_size": CELL})
        data = ET.SubElement(layer, "data", {"encoding": "csv"})
        data.text = "\n" + ",\n".join(",".join(str(value) for value in row) for row in values) + "\n"

    add_tile_layer(1, "L0_Ground", ground_values, "ground")
    add_tile_layer(2, "L1_Sandy_Lanes", road_values, "paths")
    add_tile_layer(3, "L2_Water_Shoreline", water_values, "water_and_obstacles")
    add_tile_layer(4, "L2_Rock_Walls_Bridges", rock_values, "rock_edges_and_crossings")
    add_tile_layer(5, "L3_Animated_Flowers", flowers, "animated_decals")
    add_tile_layer(6, "L3_Animated_Fire", effects, "animated_effects")

    next_object_id = 1

    def add_object_group(name: str, entries: list[dict[str, object]], layer_id: int, visible: bool = True) -> None:
        nonlocal next_object_id
        group = ET.SubElement(root, "objectgroup", {"id": str(layer_id), "name": name, "draworder": "topdown", "visible": "1" if visible else "0"})
        for entry in entries:
            attrs = {
                "id": str(next_object_id), "name": str(entry.get("name", "")),
                "class": str(entry.get("kind", "prop")), "gid": str(entry["gid"]),
                "x": str(entry["x"]), "y": str(entry["y"]),
                "width": str(entry["w"]), "height": str(entry["h"]),
            }
            obj = ET.SubElement(group, "object", attrs)
            props = {key: value for key, value in entry.items() if key not in {"gid", "x", "y", "w", "h", "name", "kind"}}
            if props:
                tmx_properties(obj, props)
            next_object_id += 1

    add_object_group("L4_YSort_Props", objects, 7)
    add_object_group("L5_Canopy_Roofs", canopy_objects, 8)

    collision_group = ET.SubElement(root, "objectgroup", {"id": "9", "name": "L2_Collision_Data", "visible": "0", "opacity": "0"})
    for x, y, w, h, kind in collision_rects:
        obj = ET.SubElement(collision_group, "object", {"id": str(next_object_id), "name": kind, "class": "collision", "x": str(x), "y": str(y), "width": str(w), "height": str(h)})
        tmx_properties(obj, {"collision_kind": kind, "solid": True})
        next_object_id += 1
    spawn_group = ET.SubElement(root, "objectgroup", {"id": "10", "name": "PlayerSpawn", "visible": "0"})
    ET.SubElement(spawn_group, "object", {"id": str(next_object_id), "name": "PlayerSpawn", "class": "spawn", "x": str((core_x + 20) * CELL), "y": str((core_y + 19) * CELL), "point": "1"})

    ET.indent(root, space=" ")
    ET.ElementTree(root).write(OUT_TMX, encoding="UTF-8", xml_declaration=True)
    export_runtime_json(root)
    render_preview(root)
    print(f"Wrote {OUT_TMX}")
    print(f"Wrote {OUT_JSON}")
    print(f"Wrote {OUT_PNG}")
    print(f"Grid: {WIDTH}x{HEIGHT} ({WIDTH * CELL}x{HEIGHT * CELL}px); source core: {source_width}x{source_height} at ({core_x},{core_y}); objects: {len(objects)}; collision boxes: {len(collision_rects)}")


def export_runtime_json(root: ET.Element) -> None:
    tilesets, _, _ = source_assets()
    first_gids = {ts.get("name"): int(entry.get("firstgid", "1")) for entry in root.findall("tileset") for ts in [ET.parse((OUT_TMX.parent / entry.get("source", "")).resolve()).getroot()]}
    animations: dict[str, list[dict[str, int]]] = {}
    for ts in tilesets:
        name = str(ts["name"])
        tsx_path = TILED / "Tilesets" / next(Path(SOURCE_MAP.parent / e.get("source", "")).name for e in ET.parse(SOURCE_MAP).getroot().findall("tileset") if ET.parse(SOURCE_MAP.parent / e.get("source", "")).getroot().get("name") == name)
        firstgid = first_gids[name]
        for tile in ET.parse(tsx_path).getroot().findall("tile"):
            animation = tile.find("animation")
            if animation is None:
                continue
            base_gid = firstgid + int(tile.get("id", "0"))
            animations[str(base_gid)] = [
                {"gid": firstgid + int(frame.get("tileid", "0")), "duration": int(frame.get("duration", "100"))}
                for frame in animation.findall("frame")
            ]

    layers = []
    objects = []
    canopies = []
    collisions = []
    spawn = {"x": 56 * CELL, "y": 56 * CELL}
    for child in root:
        if child.tag == "layer":
            data = child.find("data")
            values = [int(value.strip() or 0) for value in (data.text or "").replace("\n", "").split(",") if value.strip()]
            layers.append({"name": child.get("name", ""), "data": values})
        elif child.tag == "objectgroup":
            name = child.get("name", "")
            for obj in child.findall("object"):
                if name == "PlayerSpawn":
                    spawn = {"x": int(float(obj.get("x", "0"))), "y": int(float(obj.get("y", "0")))}
                    continue
                if name == "L2_Collision_Data":
                    collisions.append({
                        "x": float(obj.get("x", "0")), "y": float(obj.get("y", "0")),
                        "w": float(obj.get("width", "0")), "h": float(obj.get("height", "0")),
                        "kind": obj.get("name", "prop"),
                    })
                    continue
                if not obj.get("gid"):
                    continue
                item = {
                    "gid": int(obj.get("gid", "0")), "x": float(obj.get("x", "0")),
                    "y": float(obj.get("y", "0")), "w": float(obj.get("width", "0")),
                    "h": float(obj.get("height", "0")), "name": obj.get("name", ""),
                    "kind": obj.get("class", "prop"),
                }
                for prop in obj.findall("./properties/property"):
                    value = prop.get("value", "")
                    if prop.get("type") == "bool":
                        value = value.lower() == "true"
                    item[prop.get("name", "")] = value
                (canopies if name == "L5_Canopy_Roofs" else objects).append(item)

    result = {
        "name": "Làng Linh Khê",
        "width": WIDTH,
        "height": HEIGHT,
        "tile_width": CELL,
        "tile_height": CELL,
        "source_layout": "tileset/Tiled/Tilemaps/Beginning Fields.tmx",
        "source_core": {"x": 36, "y": 27, "width": 40, "height": 40},
        "tilesets": tilesets,
        "layers": layers,
        "objects": objects,
        "canopies": canopies,
        "collisions": collisions,
        "animations": animations,
        "player_spawn": spawn,
    }
    OUT_JSON.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def render_preview(root: ET.Element) -> None:
    # This composition preview uses the native 16px grid and does not replace the Tiled map.
    out = Image.new("RGBA", (WIDTH * CELL, HEIGHT * CELL), (149, 217, 130, 255))
    tileset_defs = []
    for entry in root.findall("tileset"):
        tsx = (OUT_TMX.parent / entry.get("source", "")).resolve()
        ts = ET.parse(tsx).getroot()
        first = int(entry.get("firstgid", "1"))
        atlas_node = ts.find("image")
        atlas = Image.open(tsx.parent / atlas_node.get("source", "")).convert("RGBA") if atlas_node is not None else None
        collection = {}
        if atlas is None:
            for tile in ts.findall("tile"):
                image_node = tile.find("image")
                if image_node is not None:
                    collection[int(tile.get("id", "0"))] = Image.open(tsx.parent / image_node.get("source", "")).convert("RGBA")
        tileset_defs.append({"first": first, "root": ts, "path": tsx, "atlas": atlas, "collection": collection})
    tileset_defs.sort(key=lambda item: item["first"])

    def tile_image(gid: int) -> Image.Image | None:
        gid &= 0x1FFFFFFF
        info = next((item for item in reversed(tileset_defs) if gid >= item["first"]), None)
        if info is None:
            return None
        local = gid - info["first"]
        ts = info["root"]
        if info["atlas"] is None:
            return info["collection"].get(local)
        tw, th = int(ts.get("tilewidth", "16")), int(ts.get("tileheight", "16"))
        cols = int(ts.get("columns", "0") or 0)
        if not cols:
            cols = max(1, info["atlas"].width // tw)
        margin, spacing = int(ts.get("margin", "0")), int(ts.get("spacing", "0"))
        x = margin + (local % cols) * (tw + spacing)
        y = margin + (local // cols) * (th + spacing)
        return info["atlas"].crop((x, y, x + tw, y + th))

    for layer in root.findall("layer"):
        if layer.get("visible", "1") == "0":
            continue
        values = [int(value.strip() or 0) for value in (layer.find("data").text or "").replace("\n", "").split(",") if value.strip()]
        for index, gid in enumerate(values):
            if gid == 0:
                continue
            tile = tile_image(gid)
            if tile is not None:
                out.alpha_composite(tile, ((index % WIDTH) * CELL, (index // WIDTH) * CELL))
    for group in root.findall("objectgroup"):
        if group.get("name") != "L4_YSort_Props":
            continue
        entries = sorted(group.findall("object"), key=lambda obj: float(obj.get("y", "0")))
        for obj in entries:
            gid = int(obj.get("gid", "0"))
            tile = tile_image(gid)
            if tile is None:
                continue
            x, y = round(float(obj.get("x", "0"))), round(float(obj.get("y", "0")))
            out.alpha_composite(tile, (x, y - tile.height))
    for group in root.findall("objectgroup"):
        if group.get("name") != "L5_Canopy_Roofs":
            continue
        for obj in group.findall("object"):
            gid = int(obj.get("gid", "0"))
            tile = tile_image(gid)
            if tile is None:
                continue
            kind = obj.get("class", "")
            ratio = 0.62 if kind in {"building", "gate"} else 0.7
            visible_height = min(tile.height, max(1, round(tile.height * ratio)))
            canopy = tile.crop((0, 0, tile.width, visible_height))
            x, y = round(float(obj.get("x", "0"))), round(float(obj.get("y", "0")))
            out.alpha_composite(canopy, (x, y - tile.height))
    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    out.convert("RGB").save(OUT_PNG, optimize=True)


if __name__ == "__main__":
    build()
