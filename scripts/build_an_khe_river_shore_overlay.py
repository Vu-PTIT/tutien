#!/usr/bin/env python3
"""Warp one generated continuous shoreline texture along An Khê's authored river curve."""

from pathlib import Path
import json
import sys

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
LAYOUT_PATH = ROOT / "client/data/maps/an_khe.json"
SOURCE_PATH = ROOT / "client/assets/pixel/terrain/terrain_river_shore_source.png"
OUTPUT_PATH = ROOT / "client/assets/pixel/terrain/an_khe_river_shore_overlay.png"
SOURCE_LEFT = 480
SOURCE_RIGHT = 960
EDGE_FADE_PX = 16

sys.path.insert(0, str(ROOT / "scripts"))
from build_terrain_transition_decals import shoreline_boundaries


def smoothstep(value: float) -> float:
    value = min(max(value, 0.0), 1.0)
    return value * value * (3.0 - 2.0 * value)


def sample_bankline(points: list[list[float]], sample_y: float) -> float:
    previous = points[0]
    for next_point in points[1:]:
        if sample_y <= float(next_point[1]):
            span = max(float(next_point[1]) - float(previous[1]), 0.001)
            progress = min(max((sample_y - float(previous[1])) / span, 0.0), 1.0)
            return float(previous[0]) + (float(next_point[0]) - float(previous[0])) * progress
        previous = next_point
    return float(previous[0])


def main() -> None:
    layout = json.loads(LAYOUT_PATH.read_text())
    river = layout["river_autoterrain"]
    source = Image.open(SOURCE_PATH).convert("RGB")
    if SOURCE_RIGHT > source.width or SOURCE_LEFT < 0:
        raise SystemExit(f"Shore source is too narrow for crop {SOURCE_LEFT}:{SOURCE_RIGHT}: {source.size}")
    rows: list[str] = layout["ground_rows"]
    tile_px = int(layout.get("tile_size_px", 32))
    map_width_px = len(rows[0]) * tile_px
    map_height_px = len(rows) * tile_px
    overlay_width = int(river.get("shore_overlay_width_px", 96))
    bankline: list[list[float]] = river["west_bankline"]
    boundaries = shoreline_boundaries(source)
    source_pixels = source.load()
    overlay = Image.new("RGBA", (map_width_px, map_height_px), (0, 0, 0, 0))
    overlay_pixels = overlay.load()
    source_span = SOURCE_RIGHT - SOURCE_LEFT

    for world_y in range(map_height_px):
        source_y = round(world_y * (source.height - 1) / max(map_height_px - 1, 1))
        source_bank_x = boundaries[source_y]
        bank_x = sample_bankline(bankline, (world_y + 0.5) / tile_px) * tile_px
        bank_offset = (source_bank_x - SOURCE_LEFT) * (overlay_width - 1) / source_span
        dest_left = round(bank_x - bank_offset)
        for local_x in range(overlay_width):
            dest_x = dest_left + local_x
            if dest_x < 0 or dest_x >= map_width_px:
                continue
            source_x = SOURCE_LEFT + round(local_x * (source_span - 1) / max(overlay_width - 1, 1))
            red, green, blue = source_pixels[source_x, source_y]
            fade = min(
                1.0,
                smoothstep(local_x / EDGE_FADE_PX),
                smoothstep((overlay_width - 1 - local_x) / EDGE_FADE_PX),
            )
            overlay_pixels[dest_x, world_y] = (red, green, blue, round(255 * fade))

    overlay.save(OUTPUT_PATH, optimize=False)
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)} ({overlay.width}x{overlay.height}, RGBA)")
    print(f"Warped {source_span}px of generated shore into a {overlay_width}px band along {len(bankline)} river control points")


if __name__ == "__main__":
    main()
