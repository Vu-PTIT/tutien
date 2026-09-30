#!/usr/bin/env python3
"""Build varied 32 px path and two-sided river-edge decals for Godot."""

from pathlib import Path
import math
import random

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PATH_SOURCE = ROOT / "client/assets/pixel/terrain/terrain_transitions.png"
SHORE_SOURCE = ROOT / "client/assets/pixel/terrain/terrain_river_shore_source.png"
OUTPUT = ROOT / "client/assets/pixel/terrain/terrain_transition_decals.png"
TILE_PX = 32
VARIANTS = 4
ATLAS_COLUMNS = 12
ATLAS_ROWS = 8
STRIP_PX = 22
SOURCE_BAND = (5, 27)
PATH_ALPHA = 220
ALONG_EDGE_FADE_PX = 3
SHORE_ALPHA = 176
SHORE_SAMPLE_PX = 96
SHORE_ALONG_EDGE_FADE_PX = 8


def source_tile(atlas: Image.Image, index: int) -> Image.Image:
    x = (index % 4) * TILE_PX
    y = (index // 4) * TILE_PX
    return atlas.crop((x, y, x + TILE_PX, y + TILE_PX)).convert("RGBA")


def _smoothstep(value: float) -> float:
    value = min(max(value, 0.0), 1.0)
    return value * value * (3.0 - 2.0 * value)


def edge_decal(tile: Image.Image, side: str, max_alpha: int, variant: int) -> Image.Image:
    """Keep a varied, ragged material edge and fade it into the receiving tile."""
    if side in ("west", "east"):
        strip = tile.crop((SOURCE_BAND[0], 0, SOURCE_BAND[1], TILE_PX)).resize(
            (STRIP_PX, TILE_PX), Image.Resampling.LANCZOS
        )
        outer_at_low = side == "west"
        target = (0 if side == "west" else TILE_PX - STRIP_PX, 0)
        horizontal = True
    else:
        strip = tile.crop((0, SOURCE_BAND[0], TILE_PX, SOURCE_BAND[1])).resize(
            (TILE_PX, STRIP_PX), Image.Resampling.LANCZOS
        )
        outer_at_low = side == "north"
        target = (0, 0 if side == "north" else TILE_PX - STRIP_PX)
        horizontal = False

    pixels = strip.load()
    along_size = strip.height if horizontal else strip.width
    rng = random.Random(0xA17 + variant * 911)
    # Low-frequency shifts make the edge meander while preserving the source pixel clusters.
    jitter = [rng.randint(-3, 3) if variant else 0 for _ in range(along_size)]
    for y in range(strip.height):
        for x in range(strip.width):
            across = x if horizontal else y
            progress = across / max(STRIP_PX - 1, 1)
            if outer_at_low:
                progress = 1.0 - progress
            along = y if horizontal else x
            shift = jitter[along] / max(STRIP_PX - 1, 1)
            profile = _smoothstep(progress + shift)
            fade = min(
                1.0,
                (along + 1) / ALONG_EDGE_FADE_PX,
                (along_size - along) / ALONG_EDGE_FADE_PX,
            )
            # Each variant changes the amount of edge grain slightly without changing palette.
            grain = 0.92 + ((along * 17 + across * 13 + variant * 29) % 9) * 0.02
            red, green, blue, original_alpha = pixels[x, y]
            alpha = round(original_alpha * max_alpha / 255 * profile * fade * grain)
            pixels[x, y] = (red, green, blue, alpha)

    decal = Image.new("RGBA", (TILE_PX, TILE_PX), (0, 0, 0, 0))
    decal.alpha_composite(strip, target)
    return decal


def combine(*decals: Image.Image) -> Image.Image:
    result = Image.new("RGBA", (TILE_PX, TILE_PX), (0, 0, 0, 0))
    for decal in decals:
        result.alpha_composite(decal)
    return result


def _is_shallow_water(pixel: tuple[int, int, int]) -> bool:
    red, green, blue = pixel
    # Aqua/teal shoreline pixels separate cleanly from green foliage and ochre sand.
    return blue > red + 8 and blue > green * 0.70 and red < 215


def shoreline_boundaries(image: Image.Image) -> list[int]:
    pixels = image.load()
    width, height = image.size
    boundaries: list[int] = []
    lower = round(width * 0.35)
    upper = round(width * 0.82)
    for y in range(height):
        boundary = upper
        for x in range(lower, upper - 8):
            if sum(_is_shallow_water(pixels[x + offset, y]) for offset in range(8)) >= 5:
                boundary = x
                break
        boundaries.append(boundary)
    return boundaries


def _shore_sample(source: Image.Image, boundaries: list[int], variant: int, water_side: bool) -> Image.Image:
    width, height = source.size
    sample_height = SHORE_SAMPLE_PX
    center_y = round((variant + 0.5) * height / VARIANTS)
    start_y = max(0, min(height - sample_height, center_y - sample_height // 2))
    sample = Image.new("RGB", (SHORE_SAMPLE_PX, SHORE_SAMPLE_PX))
    source_pixels = source.load()
    sample_pixels = sample.load()
    for sy in range(sample_height):
        source_y = min(height - 1, start_y + sy)
        shoreline_x = boundaries[source_y]
        wave = round(
            15 * math.sin(source_y / 61.0 + variant * 1.7)
            + 7 * math.sin(source_y / 23.0 + variant * 2.3)
        )
        if water_side:
            # Start in the pale shallows and move into the existing deep-water ground tile.
            left = max(0, min(width - SHORE_SAMPLE_PX, shoreline_x + 8 + wave // 2))
        else:
            # Center the sample on the soil/sand band so only a narrow fringe reaches the grass.
            left = max(0, min(width - SHORE_SAMPLE_PX, shoreline_x - SHORE_SAMPLE_PX + wave))
        for sx in range(SHORE_SAMPLE_PX):
            sample_pixels[sx, sy] = source_pixels[left + sx, source_y]
    return sample.resize((TILE_PX, TILE_PX), Image.Resampling.LANCZOS).convert("RGBA")


def shore_decal(sample: Image.Image, water_side: bool) -> Image.Image:
    """Use a generated shoreline sample as a transparent wash over grass or water."""
    decal = sample.copy()
    pixels = decal.load()
    for y in range(TILE_PX):
        along_fade = min(
            1.0,
            (y + 1) / SHORE_ALONG_EDGE_FADE_PX,
            (TILE_PX - y) / SHORE_ALONG_EDGE_FADE_PX,
        )
        for x in range(TILE_PX):
            progress = x / (TILE_PX - 1)
            if water_side:
                alpha_profile = (1.0 - _smoothstep(progress / 0.36)) * 0.72
            else:
                alpha_profile = _smoothstep((progress - 0.34) / 0.66)
            red, green, blue, _ = pixels[x, y]
            if water_side:
                is_foam = min(red, green, blue) > 185 and max(red, green, blue) - min(red, green, blue) < 80
                if not _is_shallow_water((red, green, blue)) and not is_foam:
                    alpha_profile = 0.0
            elif _is_shallow_water((red, green, blue)):
                # Let the underlying grass and river keep their own palettes at the inner edge.
                alpha_profile *= 0.08
            elif green > red * 1.18 and green > blue * 1.18:
                alpha_profile *= 0.42
            pixels[x, y] = (red, green, blue, round(SHORE_ALPHA * alpha_profile * along_fade))
    return decal


def orient_from_east(tile: Image.Image, side: str) -> Image.Image:
    if side == "east":
        return tile
    if side == "west":
        return ImageOps.mirror(tile)
    if side == "south":
        return tile.transpose(Image.Transpose.ROTATE_270)
    return tile.transpose(Image.Transpose.ROTATE_90)


def orient_from_west(tile: Image.Image, side: str) -> Image.Image:
    if side == "west":
        return tile
    if side == "east":
        return ImageOps.mirror(tile)
    if side == "north":
        return tile.transpose(Image.Transpose.ROTATE_270)
    return tile.transpose(Image.Transpose.ROTATE_90)


def build_groups(path_atlas: Image.Image, shore_source: Image.Image) -> tuple[list[Image.Image], dict[str, dict[str, list[int]]]]:
    boundaries = shoreline_boundaries(shore_source)
    atlas_tiles: list[Image.Image] = []
    mappings: dict[str, dict[str, list[int]]] = {}

    path_edge_source = {
        "west": (1, "west"),
        "east": (0, "east"),
        "north": (3, "north"),
        "south": (2, "south"),
    }
    path_edges: dict[str, list[Image.Image]] = {}
    for side, (source_index, face) in path_edge_source.items():
        path_edges[side] = [
            edge_decal(source_tile(path_atlas, source_index), face, PATH_ALPHA, variant)
            for variant in range(VARIANTS)
        ]

    shore_land_edges: dict[str, list[Image.Image]] = {side: [] for side in ("east", "west", "north", "south")}
    shore_water_edges: dict[str, list[Image.Image]] = {side: [] for side in ("west", "east", "north", "south")}
    for variant in range(VARIANTS):
        land_sample = _shore_sample(shore_source, boundaries, variant, False)
        water_sample = _shore_sample(shore_source, boundaries, variant, True)
        land_canonical = shore_decal(land_sample, False)
        water_canonical = shore_decal(water_sample, True)
        for side in shore_land_edges:
            shore_land_edges[side].append(orient_from_east(land_canonical, side))
        for side in shore_water_edges:
            shore_water_edges[side].append(orient_from_west(water_canonical, side))

    def add_group(name: str, keys: tuple[str, ...], maker) -> None:
        nonlocal atlas_tiles
        mappings[name] = {}
        for key in keys:
            ids: list[int] = []
            for variant in range(VARIANTS):
                ids.append(len(atlas_tiles))
                atlas_tiles.append(maker(key, variant))
            mappings[name][key] = ids

    add_group(
        "path_edge_tiles",
        ("west", "east", "north", "south"),
        lambda side, variant: path_edges[side][variant],
    )
    path_corner_sides = {
        "north_west": ("north", "west"),
        "north_east": ("north", "east"),
        "south_west": ("south", "west"),
        "south_east": ("south", "east"),
    }
    add_group(
        "path_corner_tiles",
        tuple(path_corner_sides),
        lambda corner, variant: combine(
            path_edges[path_corner_sides[corner][0]][variant],
            path_edges[path_corner_sides[corner][1]][(variant + 1) % VARIANTS],
        ),
    )
    add_group(
        "shore_land_edge_tiles",
        ("east", "west", "south", "north"),
        lambda side, variant: shore_land_edges[side][variant],
    )
    land_corner_sides = {
        "north_east": ("north", "east"),
        "south_east": ("south", "east"),
        "south_west": ("south", "west"),
        "north_west": ("north", "west"),
    }
    add_group(
        "shore_land_corner_tiles",
        tuple(land_corner_sides),
        lambda corner, variant: combine(
            shore_land_edges[land_corner_sides[corner][0]][variant],
            shore_land_edges[land_corner_sides[corner][1]][(variant + 1) % VARIANTS],
        ),
    )
    add_group(
        "shore_water_edge_tiles",
        ("west", "east", "north", "south"),
        lambda side, variant: shore_water_edges[side][variant],
    )
    water_corner_sides = {
        "north_west": ("north", "west"),
        "north_east": ("north", "east"),
        "south_west": ("south", "west"),
        "south_east": ("south", "east"),
    }
    add_group(
        "shore_water_corner_tiles",
        tuple(water_corner_sides),
        lambda corner, variant: combine(
            shore_water_edges[water_corner_sides[corner][0]][variant],
            shore_water_edges[water_corner_sides[corner][1]][(variant + 1) % VARIANTS],
        ),
    )
    return atlas_tiles, mappings


def main() -> None:
    path_atlas = Image.open(PATH_SOURCE).convert("RGBA")
    shore_source = Image.open(SHORE_SOURCE).convert("RGB")
    if path_atlas.size != (4 * TILE_PX, 4 * TILE_PX):
        raise SystemExit(f"Unexpected path atlas size: {path_atlas.size}")
    if shore_source.width < 256 or shore_source.height < 256:
        raise SystemExit(f"Unexpected river shore source size: {shore_source.size}")

    tiles, mappings = build_groups(path_atlas, shore_source)
    if len(tiles) != ATLAS_COLUMNS * ATLAS_ROWS:
        raise SystemExit(f"Expected {ATLAS_COLUMNS * ATLAS_ROWS} transition tiles, built {len(tiles)}")

    output = Image.new("RGBA", (ATLAS_COLUMNS * TILE_PX, ATLAS_ROWS * TILE_PX), (0, 0, 0, 0))
    for index, tile in enumerate(tiles):
        output.alpha_composite(tile, ((index % ATLAS_COLUMNS) * TILE_PX, (index // ATLAS_COLUMNS) * TILE_PX))
    output.save(OUTPUT, optimize=False)
    print(f"Wrote {OUTPUT.relative_to(ROOT)} ({output.width}x{output.height}, RGBA)")
    print(f"Transition groups: {list(mappings)}")


if __name__ == "__main__":
    main()
