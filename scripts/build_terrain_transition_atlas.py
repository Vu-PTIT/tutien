#!/usr/bin/env python3
"""Slice the generated 4x4 terrain transition sheet into 32px Godot tiles."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "client/assets/pixel/terrain/terrain_transitions_source.png"
OUTPUT = ROOT / "client/assets/pixel/terrain/terrain_transitions.png"
GRID = 4
TILE_PX = 32
EDGE_TRIM_PX = 3


def main() -> None:
    source = Image.open(SOURCE).convert("RGB")
    width, height = source.size
    if width != height or width < GRID * 64:
        raise SystemExit(f"Unexpected source sheet size: {source.size}")

    atlas = Image.new("RGB", (GRID * TILE_PX, GRID * TILE_PX))
    for row in range(GRID):
        for column in range(GRID):
            left = round(column * width / GRID) + EDGE_TRIM_PX
            right = round((column + 1) * width / GRID) - EDGE_TRIM_PX
            top = round(row * height / GRID) + EDGE_TRIM_PX
            bottom = round((row + 1) * height / GRID) - EDGE_TRIM_PX
            tile = source.crop((left, top, right, bottom)).resize(
                (TILE_PX, TILE_PX), Image.Resampling.LANCZOS
            )
            atlas.paste(tile, (column * TILE_PX, row * TILE_PX))

    atlas.save(OUTPUT, optimize=False)
    print(f"Wrote {OUTPUT.relative_to(ROOT)} ({atlas.width}x{atlas.height}, {GRID * GRID} tiles)")


if __name__ == "__main__":
    main()
