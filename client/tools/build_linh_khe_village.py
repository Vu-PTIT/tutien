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

    houses = [
        (478, 10, 35, "Riverside Home"),
        (477, 29, 35, "Garden Home"),
        (479, 45, 35, "Linh Khe Spirit Hall"),
        (477, 73, 35, "North Lane Home"),
        (478, 88, 35, "East Lane Home"),
        (478, 10, 75, "South Garden Home"),
        (477, 29, 75, "Old Orchard Home"),
        (478, 45, 75, "Community House"),
        (480, 77, 75, "Violet Roof House"),
        (477, 96, 75, "East Garden Home"),
    ]
    objects: list[dict[str, object]] = []
    building_objects = []
    for gid, tx, ty, name in houses:
        item = add_object(objects, gid, tx, ty, name, "building", object_sizes[gid], {"canopy": True, "blocking": True})
        building_objects.append(item)
    gate = add_object(objects, 481, 52, 96, "South Village Gate", "gate", object_sizes[481], {"canopy": True, "blocking": True})
    building_objects.append(gate)

    # Fixed landmark props: a well and a lively market square.
    add_object(objects, 482, 53, 53, "Village Well", "well", object_sizes[482], {"blocking": True})
    add_object(objects, 486, 46, 46, "Village Noticeboard", "noticeboard", object_sizes[486], {"blocking": True})
    add_object(objects, 490, 43, 53, "Square Lantern West", "lamp", object_sizes[490], {"canopy": True, "blocking": True})
    add_object(objects, 490, 66, 53, "Square Lantern East", "lamp", object_sizes[490], {"canopy": True, "blocking": True})
    add_object(objects, 501, 62, 47, "Market Table North", "market", object_sizes[501], {"blocking": True})
    add_object(objects, 501, 47, 55, "Market Table South", "market", object_sizes[501], {"blocking": True})
    add_object(objects, 488, 64, 48, "Market Crate Large", "crate", object_sizes[488], {"blocking": True})
    add_object(objects, 489, 67, 48, "Market Crate Small", "crate", object_sizes[489], {"blocking": True})
    add_object(objects, 492, 44, 49, "Market Sack", "market", object_sizes[492], {"blocking": True})
    add_object(objects, 500, 60, 55, "Market Basket", "market", object_sizes[500], {"blocking": True})
    add_object(objects, 495, 50, 41, "Square Banner West", "banner", object_sizes[495], {"canopy": True})
    add_object(objects, 495, 61, 41, "Square Banner East", "banner", object_sizes[495], {"canopy": True})
    add_object(objects, 484, 49, 57, "Stone Bench West", "bench", object_sizes[484], {"blocking": True})
    add_object(objects, 485, 63, 57, "Stone Bench East", "bench", object_sizes[485], {"blocking": True})
    add_object(objects, 493, 7, 28, "West Lane Sign", "sign", object_sizes[493], {"blocking": True})
    add_object(objects, 494, 101, 29, "East Lane Sign", "sign", object_sizes[494], {"blocking": True})
    add_object(objects, 490, 70, 61, "Camp Lantern", "lamp", object_sizes[490], {"canopy": True, "blocking": True})
    add_object(objects, 5770, 74, 61, "Night Market Campfire", "animated_effect", object_sizes[5770], {"effect": "fire"})

    # A tree belt frames the village, with smaller groves beside the two ponds.
    tree_gids = [514, 515, 516, 517]
    border_positions = [
        (5, 13), (14, 10), (24, 12), (38, 9), (71, 10), (83, 11), (109, 11),
        (5, 34), (5, 51), (5, 70), (5, 87), (107, 39), (107, 55), (107, 72), (107, 89),
        (8, 93), (20, 93), (33, 92), (42, 92), (68, 92), (80, 92), (92, 92), (104, 93),
        (84, 22), (108, 23), (84, 30), (108, 31), (84, 42), (108, 48),
    ]
    tree_objects = []
    for i, (tx, ty) in enumerate(border_positions):
        gid = tree_gids[(i * 3 + 1) % len(tree_gids)]
        if ty < 20 and 85 <= tx <= 109:
            continue  # Keep the pond edge open for a readable shoreline.
        tree = add_object(objects, gid, tx, ty, f"Village Tree {i + 1:02d}", "tree", object_sizes[gid], {"canopy": True, "blocking": True})
        tree_objects.append(tree)

    # An orchard and a few rocks soften the large empty greens beyond the lanes.
    small_objects = [
        (507, 17, 45, "Emerald Bush 01", "bush"), (509, 31, 45, "Emerald Bush 02", "bush"),
        (508, 38, 60, "Emerald Bush 03", "bush"), (510, 25, 62, "Emerald Bush 04", "bush"),
        (511, 40, 64, "Emerald Bush 05", "bush"), (512, 34, 59, "Emerald Bush 06", "bush"),
        (513, 37, 68, "Emerald Bush 07", "bush"), (507, 80, 56, "Emerald Bush 08", "bush"),
        (509, 87, 59, "Emerald Bush 09", "bush"), (508, 86, 65, "Emerald Bush 10", "bush"),
        (502, 84, 20, "Pond Rock 01", "rock"), (504, 107, 18, "Pond Rock 02", "rock"),
        (503, 86, 18, "Pond Rock 03", "rock"), (505, 98, 23, "Pond Rock 04", "rock"),
        (506, 19, 88, "Garden Rock 01", "rock"), (502, 24, 89, "Garden Rock 02", "rock"),
        (505, 27, 90, "Garden Rock 03", "rock"), (506, 15, 89, "Garden Rock 04", "rock"),
        (487, 20, 60, "Orchard Stump", "stump"), (498, 15, 62, "Hay Stack", "farm_prop"),
        (496, 33, 48, "Water Crate", "market"), (499, 68, 49, "Village Barrel", "market"),
        (497, 72, 62, "Outdoor Fireplace", "fireplace"),
    ]
    for gid, tx, ty, name, kind in small_objects:
        add_object(objects, gid, tx, ty, name, kind, object_sizes[gid], {"blocking": kind in {"rock", "stump", "market", "fireplace"}})

    # Neat rows of edible garden plants make the south-west plot read as a farm.
    for row, ty in enumerate((62, 65, 68, 71)):
        for column, tx in enumerate((11, 16, 21, 26, 31)):
            add_object(objects, 491, tx, ty, f"Garden Crop {row + 1}-{column + 1}", "crop", object_sizes[491])

    # Add a light scattering of village trees in open, non-road plots.
    occupancy = {(int(item["x"]) // CELL, int(item["y"]) // CELL) for item in objects if item["kind"] in {"building", "tree", "gate"}}
    for i, (tx, ty) in enumerate([(15, 19), (37, 18), (82, 18), (21, 55), (38, 57), (75, 20), (101, 44), (101, 59), (18, 89), (35, 88), (75, 88), (89, 89)]):
        if (tx, ty) in occupancy:
            continue
        gid = tree_gids[(i + 2) % len(tree_gids)]
        tree = add_object(objects, gid, tx, ty, f"Village Tree Grove {i + 1:02d}", "tree", object_sizes[gid], {"canopy": True, "blocking": True})
        tree_objects.append(tree)

    canopy_objects = [item for item in objects if item.get("canopy")]

    # Grass and worn earth form the editable base layer. Dirt wraps house yards and the square.
    terrain = [[1 for _ in range(WIDTH)] for _ in range(HEIGHT)]
    paint_blob(terrain, 56, 50, 10, 8, 2, rng, 0.08)
    for gid, tx, ty, _ in houses:
        w, h = object_sizes[gid]
        cx = tx + w / CELL * 0.52
        cy = ty - h / CELL * 0.45
        paint_blob(terrain, cx, cy, w / CELL * 0.53 + 2, h / CELL * 0.56 + 1.5, 2, rng, 0.1)
    # A small cultivation plot south-west of the square, with alternating furrows.
    paint_blob(terrain, 21, 68, 16, 11, 2, rng, 0.08)
    for y in (61, 64, 67, 70, 73):
        for x in range(9, 33):
            if (x + y) % 9 != 0:
                terrain[y][x] = 2
    # Low-contrast footworn patches near the orchard and lakeside paths.
    paint_blob(terrain, 39, 57, 7, 3, 2, rng, 0.2)
    paint_blob(terrain, 82, 56, 6, 4, 2, rng, 0.18)

    # Main lane, a market square, and branches linking every residential block.
    roads = [[False for _ in range(WIDTH)] for _ in range(HEIGHT)]
    stamp_path(roads, [(4, 50), (17, 50), (29, 48), (40, 49), (56, 50), (70, 49), (85, 50), (98, 48), (108, 48)], 1.7)
    stamp_path(roads, [(56, 94), (56, 83), (54, 75), (55, 64), (54, 57), (56, 50), (58, 43), (58, 32), (60, 26), (60, 5)], 1.7)
    stamp_path(roads, [(7, 27), (20, 27), (31, 29), (43, 27), (56, 27), (73, 27), (84, 29), (96, 27)], 1.1)
    stamp_path(roads, [(7, 78), (21, 78), (34, 76), (46, 78), (56, 78), (69, 77), (83, 79), (97, 78), (107, 78)], 1.2)
    stamp_path(roads, [(24, 27), (25, 38), (23, 50), (25, 63), (24, 78)], 1.05)
    stamp_path(roads, [(92, 27), (91, 38), (92, 50), (90, 63), (92, 78)], 1.05)
    # Small lanes to the doors of the northern houses.
    for x in (17, 33, 54, 78, 99):
        stamp_path(roads, [(x, 35), (x, 40), (56 if x < 56 else 92, 50)], 0.85)
    # The large central market square and a walk toward the south gate.
    for y in range(43, 57):
        for x in range(48, 65):
            roads[y][x] = True

    # Two water features: a northern pond with a narrow outlet and a southern garden pool.
    water = [[False for _ in range(WIDTH)] for _ in range(HEIGHT)]
    for y in range(HEIGHT):
        for x in range(WIDTH):
            if point_in_ellipse(x + 0.5, y + 0.5, 99, 15, 10, 7.5) or point_in_ellipse(x + 0.5, y + 0.5, 13, 88, 7, 4.5):
                water[y][x] = True
    stamp_path(water, [(94, 19), (91, 22), (88, 25), (86, 27)], 1.15)
    for y in range(HEIGHT):
        for x in range(WIDTH):
            if roads[y][x]:
                water[y][x] = False

    ground_first = first_by_name["Tileset_Ground"]
    road_first = first_by_name["Road"]
    water_first = first_by_name["Tileset_Water"]
    ground_values = []
    for y in range(HEIGHT):
        row = []
        for x in range(WIDTH):
            sig = terrain_signature(terrain, x, y)
            local = choose_wang(sig, ground_wang, rng)
            row.append(ground_first + local)
        ground_values.append(row)
    road_values = []
    water_values = []
    for y in range(HEIGHT):
        road_row, water_row = [], []
        for x in range(WIDTH):
            road_row.append(road_first + choose_wang(mask_signature(roads, x, y), road_wang, rng) if roads[y][x] else 0)
            water_row.append(water_first + choose_wang(mask_signature(water, x, y), water_wang, rng) if water[y][x] else 0)
        road_values.append(road_row)
        water_values.append(water_row)

    # Flower tiles animate in place; density stays outside paths, yards, and water.
    blooms = [[0 for _ in range(WIDTH)] for _ in range(HEIGHT)]
    flower_gids = [5578 + n for n in (0, 1, 3, 5, 48, 49, 51)] + [5674 + n for n in (0, 1, 3, 5, 48, 49, 51)]
    patches = [(8, 20), (17, 18), (37, 19), (68, 18), (81, 25), (103, 31), (8, 42), (19, 56), (37, 60), (43, 70), (66, 68), (76, 57), (83, 87), (101, 88), (34, 86), (7, 61)]
    for cx, cy in patches:
        for _ in range(rng.randint(3, 6)):
            x = max(1, min(WIDTH - 2, cx + rng.randint(-2, 2)))
            y = max(1, min(HEIGHT - 2, cy + rng.randint(-2, 2)))
            if not roads[y][x] and not water[y][x] and blooms[y][x] == 0:
                blooms[y][x] = rng.choice(flower_gids)

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
    source_root = ET.parse(SOURCE_MAP).getroot()
    root = ET.Element("map", {
        "version": "1.10", "tiledversion": "1.11.2", "orientation": "orthogonal",
        "renderorder": "right-down", "width": str(WIDTH), "height": str(HEIGHT),
        "tilewidth": str(CELL), "tileheight": str(CELL), "infinite": "0",
        "nextlayerid": "9", "nextobjectid": str(1 + len(objects) + len(canopy_objects) + len(collision_rects) + 1),
    })
    tmx_properties(root, {"display_name": "Làng Linh Khê", "region": "Vietnam", "tile_grid": "16x16", "playable_preview": True})
    for ts in source_root.findall("tileset"):
        ET.SubElement(root, "tileset", {"firstgid": ts.get("firstgid", "1"), "source": "../tileset/Tiled/Tilesets/" + Path(ts.get("source", "")).name})

    def add_tile_layer(layer_id: int, name: str, values: list[list[int]], role: str) -> None:
        layer = ET.SubElement(root, "layer", {"id": str(layer_id), "name": name, "width": str(WIDTH), "height": str(HEIGHT)})
        tmx_properties(layer, {"layer_role": role, "cell_size": CELL})
        data = ET.SubElement(layer, "data", {"encoding": "csv"})
        data.text = "\n" + ",\n".join(",".join(str(value) for value in row) for row in values) + "\n"

    add_tile_layer(1, "L0_Ground", ground_values, "ground")
    add_tile_layer(2, "L1_Dirt_Roads", road_values, "decals")
    add_tile_layer(3, "L1_Animated_Flowers", blooms, "animated_decals")
    add_tile_layer(4, "L2_Water_Shoreline", water_values, "water_and_obstacles")

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

    add_object_group("L3_YSort_Props", objects, 5)
    add_object_group("L4_Canopy_Roofs", canopy_objects, 6)

    collision_group = ET.SubElement(root, "objectgroup", {"id": "7", "name": "L2_Collision_Data", "visible": "0", "opacity": "0"})
    for x, y, w, h, kind in collision_rects:
        obj = ET.SubElement(collision_group, "object", {"id": str(next_object_id), "name": kind, "class": "collision", "x": str(x), "y": str(y), "width": str(w), "height": str(h)})
        tmx_properties(obj, {"collision_kind": kind, "solid": True})
        next_object_id += 1
    spawn_group = ET.SubElement(root, "objectgroup", {"id": "8", "name": "PlayerSpawn", "visible": "0"})
    ET.SubElement(spawn_group, "object", {"id": str(next_object_id), "name": "PlayerSpawn", "class": "spawn", "x": str(56 * CELL), "y": str(56 * CELL), "point": "1"})

    ET.indent(root, space=" ")
    ET.ElementTree(root).write(OUT_TMX, encoding="UTF-8", xml_declaration=True)
    export_runtime_json(root)
    render_preview(root)
    print(f"Wrote {OUT_TMX}")
    print(f"Wrote {OUT_JSON}")
    print(f"Wrote {OUT_PNG}")
    print(f"Grid: {WIDTH}x{HEIGHT} ({WIDTH * CELL}x{HEIGHT * CELL}px); objects: {len(objects)}; collision boxes: {len(collision_rects)}")


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
                (canopies if name == "L4_Canopy_Roofs" else objects).append(item)

    result = {
        "name": "Làng Linh Khê",
        "width": WIDTH,
        "height": HEIGHT,
        "tile_width": CELL,
        "tile_height": CELL,
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
        if group.get("name") != "L3_YSort_Props":
            continue
        for obj in group.findall("object"):
            gid = int(obj.get("gid", "0"))
            tile = tile_image(gid)
            if tile is None:
                continue
            x, y = round(float(obj.get("x", "0"))), round(float(obj.get("y", "0")))
            out.alpha_composite(tile, (x, y - tile.height))
    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    out.convert("RGB").save(OUT_PNG, optimize=True)


if __name__ == "__main__":
    build()
