---
name: generate2dmap
description: Generate layered, editable 2D maps for this Godot project. Use when the user asks for RPG maps, cultivation-world locations, TileMap/TileMapLayer output, separated props, collision, zones, exits, y-sort, parallax, encounter areas, map previews, or conversion from flat PNG maps into interactive Godot-ready maps. This is the repo-scoped Agent Sprite Forge map workflow.
---

# Generate 2D Map

Use the upstream Agent Sprite Forge workflow from:
https://github.com/0x0funky/agent-sprite-forge

## Core rule

For playable maps, do not ship one flattened image as the authoritative runtime map. Separate foundation/background, terrain or tile layers, reusable props, collision, trigger zones, exits, and scene hooks so the map remains editable and interactive in Godot.

## Workflow

1. Inspect the current repository map runtime, map catalog/data, existing TileMap/TileMapLayer resources, collision conventions, and art direction.
2. Choose the smallest suitable pipeline:
   - baked image only for non-playable/background-only art;
   - layered raster for base + props + metadata;
   - Godot TileMap/TileMapLayer for editable gameplay maps;
   - side-scroll/parallax pipeline for scrolling stages.
3. Use built-in image generation for creative visible art. Do not use code-drawn placeholder art as the final requested map/props.
4. Keep gameplay-relevant objects separate: props, doors, pickups, hazards, blockers, encounter grass, exits, checkpoints, etc.
5. Define collision and zones from explicit metadata/engine nodes, not inferred from final pixels.
6. Use y-sorting or equivalent depth behavior for tall props where actors can move in front of/behind them.
7. If deterministic map processing is needed, obtain the upstream scripts:
   ```bash
   test -d /tmp/agent-sprite-forge || git clone --depth 1 https://github.com/0x0funky/agent-sprite-forge.git /tmp/agent-sprite-forge
   python -m pip install -r /tmp/agent-sprite-forge/requirements.txt
   ```
   Then use:
   `/tmp/agent-sprite-forge/skills/generate2dmap/scripts/`
   for prop-pack extraction, layered preview composition, terrain slicing, and validation.
8. Read the upstream detailed instructions when needed:
   `/tmp/agent-sprite-forge/skills/generate2dmap/SKILL.md`
   plus its `references/` files.
9. For Godot output, wire the generated assets into project-native scenes/resources and validate resource paths.
10. Produce QA previews but never use a QA preview/stage reference as the runtime collision source.

## Project integration

For this repository:
- Prefer `TileMapLayer`, separate `Sprite2D` props, explicit `StaticBody2D` collision, `Area2D` zones/exits, and y-sort where appropriate.
- Preserve the existing map data/catalog contracts unless a migration is explicitly part of the task.
- Validate PNG integrity and referenced `.tres`/`.tscn` paths.
- When converting an old PNG map, keep the PNG only as concept/reference or scenery when appropriate; move interactive geometry and props into editable runtime structures.
