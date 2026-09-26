---
name: generate2dsprite
description: Generate and post-process 2D game sprites and animation sheets for this Godot project. Use when the user asks for pixel-art characters, NPCs, monsters, props, attacks, spells, projectiles, impacts, idle/walk/run/combat sheets, transparent frames/GIFs, or Godot-ready sprite assets. This is the repo-scoped Agent Sprite Forge sprite workflow.
---

# Generate 2D Sprite

Use the upstream Agent Sprite Forge workflow from:
https://github.com/0x0funky/agent-sprite-forge

## Workflow

1. Inspect the current repository art direction and existing assets before generating anything.
2. Use built-in image generation for the creative raw sprite art. Do not procedurally draw the requested final sprite with code.
3. For pixel-art body animations, keep subject identity, scale, camera, feet/bottom anchor, and frame containment consistent.
4. Prefer multi-row grids for body animation:
   - 4 frames: 2x2
   - 6 frames: 2x3
   - 8 frames: 2x4
   - 9 frames: 3x3
   - 16 frames: 4x4
   - four-direction top-down walk may use canonical 4x4.
5. Use solid #FF00FF when chroma cleanup is required.
6. Keep detached FX, projectiles, impacts, and large slash arcs separate from main character body sheets unless the target runtime explicitly supports them.
7. For player/hero assets, preserve scale across actions and align grounded actions to a shared feet line.
8. If deterministic post-processing is required, obtain the upstream scripts into a temporary working directory:
   ```bash
   test -d /tmp/agent-sprite-forge || git clone --depth 1 https://github.com/0x0funky/agent-sprite-forge.git /tmp/agent-sprite-forge
   python -m pip install -r /tmp/agent-sprite-forge/requirements.txt
   ```
   Then use:
   `/tmp/agent-sprite-forge/skills/generate2dsprite/scripts/`
   for layout guides, chroma cleanup, frame splitting, alignment, QC, transparent PNG/GIF export, and atlas assembly.
9. Read the upstream detailed instructions when needed:
   `/tmp/agent-sprite-forge/skills/generate2dsprite/SKILL.md`
   plus its `references/` files.
10. Put final game assets under the existing project asset structure, update Godot scene/resource references when requested, and validate paths before finishing.

## Project integration

For this repository:
- Prefer project-native pixel art and existing Godot conventions.
- Do not replace interactive maps or characters with a single flattened PNG when engine-native sprites/layers are needed.
- Validate generated PNG integrity and Godot resource paths.
- If the user asks to commit/push, include generated assets and required Godot metadata/resources in the same logical change.
