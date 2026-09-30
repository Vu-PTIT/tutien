#!/usr/bin/env python3
"""Build four map-wide, native-resolution ground atlases without repeated 32 px stamps."""

from __future__ import annotations

import json
import random
import re
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
TERRAIN = ROOT / "client/assets/pixel/terrain"
MAPS = ROOT / "client/data/maps"
OUTPUT = TERRAIN / "generated/world_surfaces_v3"
TILE_PX = 32
MAP_SIZE = (48, 36)
SURFACE_IDS = {
    "an_khe": list(range(16)),
    "truc_am": [0, 1, 8, 9],
    "thach_can": list(range(7)),
    "co_tinh": list(range(6)),
}


def pixel_cluster_patch(
    draw: ImageDraw.ImageDraw,
    rng: random.Random,
    x: int,
    y: int,
    radius_x: int,
    radius_y: int,
    palette: tuple[str, ...],
) -> None:
    """A grouped, stair-stepped material patch built from 4 px color clusters."""
    block = 4
    for offset_y in range(-radius_y, radius_y + 1, block):
        for offset_x in range(-radius_x, radius_x + 1, block):
            dx = (offset_x + block / 2) / max(radius_x, 1)
            dy = (offset_y + block / 2) / max(radius_y, 1)
            distance = dx * dx + dy * dy
            if distance > 1.08 or rng.random() < 0.1 + distance * 0.28:
                continue
            shade = rng.choices(range(len(palette)), weights=range(len(palette), 0, -1), k=1)[0]
            px, py = x + offset_x, y + offset_y
            draw.rectangle((px, py, px + block - 1, py + block - 1), fill=palette[shade])


def grass_tuft(draw: ImageDraw.ImageDraw, x: int, y: int, palette: tuple[str, ...], variant: int) -> None:
    dark, mid, light = palette
    if variant % 3 == 0:
        draw.polygon([(x, y + 10), (x + 2, y + 7), (x + 5, y + 7), (x + 7, y + 2), (x + 9, y + 6),
                      (x + 13, y + 3), (x + 16, y + 10)], fill=mid)
        draw.line((x + 7, y + 9, x + 7, y + 3), fill=light)
        draw.line((x + 2, y + 10, x + 4, y + 8), fill=dark)
    elif variant % 3 == 1:
        draw.polygon([(x, y + 9), (x + 3, y + 5), (x + 6, y + 8), (x + 7, y + 2),
                      (x + 10, y + 7), (x + 13, y + 3), (x + 17, y + 9)], fill=mid)
        draw.line((x + 7, y + 9, x + 7, y + 3), fill=light)
        draw.line((x + 1, y + 9, x + 3, y + 7), fill=dark)
    else:
        draw.polygon([(x, y + 10), (x + 3, y + 7), (x + 4, y + 3), (x + 7, y + 7),
                      (x + 10, y), (x + 12, y + 6), (x + 16, y + 4), (x + 18, y + 10)], fill=mid)
        draw.line((x + 10, y + 9, x + 10, y + 1), fill=light)
        draw.line((x + 1, y + 10, x + 3, y + 8), fill=dark)
    draw.line((x + 1, y + 10, x + 16, y + 10), fill=dark)


def build_meadow(size: tuple[int, int]) -> Image.Image:
    width, height = size
    rng = random.Random(98214)
    image = Image.new("RGB", size, "#557e40")
    draw = ImageDraw.Draw(image)
    ground_cluster_palette = ("#527c3e", "#598443", "#5c8743", "#4f783a")
    for _ in range(255):
        pixel_cluster_patch(draw, rng, rng.randrange(width), rng.randrange(height), rng.randrange(12, 32),
                            rng.randrange(8, 21), ground_cluster_palette)
    greens = ("#3d6936", "#5a8740", "#75a34a")
    for variant in range(980):
        x = rng.randrange(width - 19)
        y = rng.randrange(height - 11)
        grass_tuft(draw, x, y, greens, variant + rng.randrange(3))
    # Sparse seed heads add scale, not a blanket of one-pixel noise.
    for _ in range(185):
        x, y = rng.randrange(width), rng.randrange(height)
        color = rng.choice(("#d3c66b", "#b9cb68", "#e0d294"))
        draw.rectangle((x, y, x + 1, y + 1), fill=color)
        if rng.random() < 0.38:
            draw.point((x + 2, y), fill=color)
    return image


def leaf_cluster(draw: ImageDraw.ImageDraw, x: int, y: int, scale: int, palette: tuple[str, ...], reverse: bool) -> None:
    shadow, dark, mid, light = palette
    draw.rectangle((x + 2, y + 6, x + 12, y + 9), fill=shadow)
    draw.rectangle((x, y + 3, x + 4, y + 7), fill=dark)
    draw.rectangle((x + 3, y + 1, x + 7, y + 6), fill=mid)
    draw.rectangle((x + 7, y + 3, x + 10, y + 7), fill=light if not reverse else mid)
    draw.rectangle((x + 11, y + 2, x + 14, y + 6), fill=mid)
    if scale > 1:
        draw.rectangle((x + 5, y + 2, x + 6, y + 3), fill=light)


def build_forest(size: tuple[int, int]) -> Image.Image:
    width, height = size
    rng = random.Random(6721)
    image = Image.new("RGB", size, "#315c3e")
    draw = ImageDraw.Draw(image)
    # Broken pools of leaf litter make a continuous understory, with a restrained value range.
    moss_palette = ("#30583b", "#355f40", "#3b6843", "#406d45")
    for _ in range(215):
        pixel_cluster_patch(draw, rng, rng.randrange(width), rng.randrange(height), rng.randrange(12, 28),
                            rng.randrange(9, 20), moss_palette)
    leaf_palette = ("#274a35", "#335b3c", "#477346", "#5c8248")
    for _ in range(650):
        x, y = rng.randrange(width - 15), rng.randrange(height - 10)
        leaf_cluster(draw, x, y, 1, leaf_palette, rng.random() < 0.5)
    for _ in range(110):
        x, y = rng.randrange(width), rng.randrange(height)
        color = rng.choice(("#b29a52", "#c7ad60", "#d0ba72"))
        draw.rectangle((x, y, x + 1, y), fill=color)
        if rng.random() < 0.3:
            draw.point((x + 1, y + 1), fill=color)
    return image


def rock_cluster(draw: ImageDraw.ImageDraw, x: int, y: int, rng: random.Random) -> None:
    count = rng.randint(2, 3)
    for index in range(count):
        px = x + index * rng.randint(6, 9)
        py = y + rng.randint(-3, 2)
        width = rng.randint(6, 10)
        height = rng.randint(4, 7)
        color = rng.choice(("#88705c", "#9b7959", "#ad8d68", "#c09161"))
        points = [(px, py + height - 2), (px + 1, py + 1), (px + 3, py),
                  (px + width - 2, py + 1), (px + width, py + height - 2)]
        draw.polygon([(point[0] + 1, point[1] + 2) for point in points], fill="#805f48")
        draw.polygon(points, fill=color)
        draw.line((px + 2, py + 1, px + width // 2, py + 1), fill="#d0a06b")


def build_quarry(size: tuple[int, int]) -> Image.Image:
    width, height = size
    rng = random.Random(8400)
    image = Image.new("RGB", size, "#b97e4c")
    draw = ImageDraw.Draw(image)
    # Broad, angular changes of ochre suggest dry earth without fine texture noise.
    soil_palette = ("#b97e4b", "#c2844e", "#c98b55", "#b77746")
    for _ in range(250):
        pixel_cluster_patch(draw, rng, rng.randrange(width), rng.randrange(height), rng.randrange(12, 28),
                            rng.randrange(8, 18), soil_palette)
    for _ in range(320):
        rock_cluster(draw, rng.randrange(width - 26), rng.randrange(height - 10), rng)
    scrub_palette = ("#53633b", "#6e7944", "#8d8d50")
    for _ in range(210):
        x, y = rng.randrange(width - 15), rng.randrange(height - 10)
        draw.rectangle((x + 2, y + 5, x + 13, y + 8), fill=scrub_palette[0])
        draw.rectangle((x, y + 3, x + 5, y + 7), fill=scrub_palette[1])
        draw.rectangle((x + 4, y, x + 8, y + 6), fill=scrub_palette[2])
        draw.rectangle((x + 8, y + 2, x + 12, y + 6), fill=scrub_palette[1])
    return image


def clip_to_nearer_site(
    polygon: list[tuple[float, float]], site: tuple[float, float], neighbor: tuple[float, float]
) -> list[tuple[float, float]]:
    """Clip a polygon to the half-plane closer to site than neighbor."""
    nx = 2.0 * (neighbor[0] - site[0])
    ny = 2.0 * (neighbor[1] - site[1])
    bound = neighbor[0] ** 2 + neighbor[1] ** 2 - site[0] ** 2 - site[1] ** 2
    if not polygon:
        return []
    clipped: list[tuple[float, float]] = []
    previous = polygon[-1]
    previous_side = nx * previous[0] + ny * previous[1] - bound
    for current in polygon:
        current_side = nx * current[0] + ny * current[1] - bound
        previous_inside = previous_side <= 0
        current_inside = current_side <= 0
        if previous_inside != current_inside:
            ratio = previous_side / (previous_side - current_side)
            clipped.append((previous[0] + ratio * (current[0] - previous[0]),
                            previous[1] + ratio * (current[1] - previous[1])))
        if current_inside:
            clipped.append(current)
        previous, previous_side = current, current_side
    return clipped


def build_ruin_floor(size: tuple[int, int]) -> Image.Image:
    width, height = size
    rng = random.Random(9100)
    image = Image.new("RGB", size, "#27343e")
    draw = ImageDraw.Draw(image)
    palette = ("#35414b", "#3a4650", "#3f4b54", "#46525b", "#4a565e")
    spacing_x, spacing_y = 56, 48
    sites_by_cell: dict[tuple[int, int], tuple[float, float]] = {}
    for row in range(-2, height // spacing_y + 3):
        for column in range(-2, width // spacing_x + 3):
            sites_by_cell[(column, row)] = (
                column * spacing_x + spacing_x / 2 + rng.randint(-15, 15),
                row * spacing_y + spacing_y / 2 + rng.randint(-12, 12),
            )
    for (column, row), site in sites_by_cell.items():
        polygon: list[tuple[float, float]] = [(-80.0, -80.0), (width + 80.0, -80.0),
                                               (width + 80.0, height + 80.0), (-80.0, height + 80.0)]
        for neighbor_row in range(row - 1, row + 2):
            for neighbor_column in range(column - 1, column + 2):
                if (neighbor_column, neighbor_row) == (column, row):
                    continue
                neighbor = sites_by_cell.get((neighbor_column, neighbor_row))
                if neighbor is not None:
                    polygon = clip_to_nearer_site(polygon, site, neighbor)
        if len(polygon) < 3:
            continue
        points = [(round(x), round(y)) for x, y in polygon]
        draw.polygon(points, fill="#303c46")
        center_x = sum(x for x, _ in polygon) / len(polygon)
        center_y = sum(y for _, y in polygon) / len(polygon)
        inset = [(round(center_x + (x - center_x) * 0.88), round(center_y + (y - center_y) * 0.88))
                 for x, y in polygon]
        draw.polygon(inset, fill=rng.choice(palette))
        edge = min(inset, key=lambda point: (point[1], point[0]))
        draw.rectangle((edge[0], edge[1], edge[0] + 4, edge[1]), fill="#59656b")
        if rng.random() < 0.38:
            crack_x, crack_y = round(center_x), round(center_y)
            draw.line((crack_x, crack_y, crack_x + 5, crack_y), fill="#27343e")
            draw.line((crack_x + 5, crack_y, crack_x + 6, crack_y + 2), fill="#27343e")
            draw.line((crack_x + 6, crack_y + 2, crack_x + 8, crack_y + 2), fill="#27343e")
            draw.point((crack_x + 5, crack_y + 1), fill="#657078")
        if rng.random() < 0.34:
            moss_x, moss_y = round(center_x) + rng.randint(-18, 18), round(center_y) + rng.randint(-12, 12)
            draw.rectangle((moss_x, moss_y, moss_x + 7, moss_y + 3), fill="#4e5f48")
            draw.rectangle((moss_x + 2, moss_y - 2, moss_x + 5, moss_y - 1), fill="#61724d")
            draw.point((moss_x + 4, moss_y + 4), fill="#768154")
    return image


BUILDERS = {
    "an_khe": (build_meadow, "restrained meadow grass with grouped blades"),
    "truc_am": (build_forest, "dark forest leaf litter with sparse warm leaves"),
    "thach_can": (build_quarry, "broad ochre earth clusters, scrub and grouped stones"),
    "co_tinh": (build_ruin_floor, "irregular slate slabs, broken cracks and restrained moss"),
}


def build_area(area: str, size_tiles: tuple[int, int]) -> None:
    builder, description = BUILDERS[area]
    pixel_size = (size_tiles[0] * TILE_PX, size_tiles[1] * TILE_PX)
    image = builder(pixel_size)
    area_dir = OUTPUT / area
    area_dir.mkdir(parents=True, exist_ok=True)
    atlas_path = area_dir / "surface_atlas.png"
    image.save(atlas_path, optimize=True)
    meta = {
        "area": area,
        "size_px": list(pixel_size),
        "tile_px": TILE_PX,
        "atlas_grid": list(size_tiles),
        "surface_terrain_ids": SURFACE_IDS[area],
        "style": "native-resolution 2D pixel art; hard edges; low-noise clusters; no filtering",
        "surface": description,
        "source_script": "scripts/build_pixel_world_terrain.py",
        "seeded_and_reproducible": True,
    }
    (area_dir / "surface_atlas-meta.json").write_text(json.dumps(meta, indent=2) + "\n")


def update_layout(area: str, size_tiles: tuple[int, int]) -> None:
    layout_path = MAPS / f"{area}.json"
    layout = json.loads(layout_path.read_text())
    for obsolete_key in ("meadow_atlas", "meadow_atlas_tile_px", "meadow_atlas_columns", "meadow_atlas_rows"):
        layout.pop(obsolete_key, None)
    layout["ground_surface_atlas"] = f"res://assets/pixel/terrain/generated/world_surfaces_v3/{area}/surface_atlas.png"
    layout["ground_surface_tile_px"] = TILE_PX
    layout["ground_surface_columns"] = size_tiles[0]
    layout["ground_surface_rows"] = size_tiles[1]
    layout["ground_surface_terrain_ids"] = SURFACE_IDS[area]
    serialized = json.dumps(layout, ensure_ascii=False, indent=2)
    if area in ("an_khe", "truc_am"):
        numeric_arrays = re.compile(r"\[\n((?:[ \t]*-?\d+(?:\.\d+)?[ \t]*,?\n)+)([ \t]*)\]")
        serialized = numeric_arrays.sub(
            lambda match: "[" + ", ".join(line.strip().rstrip(",") for line in match.group(1).splitlines()) + "]",
            serialized,
        )
    layout_path.write_text(serialized + "\n")


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for area in BUILDERS:
        layout = json.loads((MAPS / f"{area}.json").read_text())
        size_values = layout.get("size_tiles", list(MAP_SIZE))
        size_tiles = (int(size_values[0]), int(size_values[1]))
        if size_tiles != MAP_SIZE:
            raise ValueError(f"Unexpected map dimensions for {area}: {size_tiles}")
        build_area(area, size_tiles)
        update_layout(area, size_tiles)
    print("Built four unique, map-wide ground atlases and connected them to their runtime maps.")


if __name__ == "__main__":
    main()
