# AGENTS.md

## Project

Tu Tiên is a 2D Godot game with a Nakama/PostgreSQL backend.

- Godot: 4.6.1
- Client: `client/`
- Backend: `server/`
- CI: `.github/workflows/ci.yml`

## Autonomous Codex rules

These rules apply to automated Codex work.

### Scope

1. Work on exactly one GitHub issue per run.
2. Read the issue carefully before changing files.
3. Prefer the smallest change that satisfies the issue.
4. Do not redesign unrelated systems.
5. Do not invent new gameplay requirements when the issue is ambiguous.
6. Do not work on story/quest content unless the issue explicitly requests it.

### Git safety

- Never push directly to `main`.
- Never merge pull requests.
- Never force-push.
- Never rewrite repository history.
- Automated work must go through a dedicated `codex/issue-*` branch and draft PR.
- Do not modify GitHub secrets, tokens, repository settings, branch protection, or workflow permissions.
- Do not edit `.github/workflows/codex-worker.yml` from an autonomous task unless the issue explicitly targets automation.

### Destructive-change safety

Stop and report instead of making the change if the task would require any of the following unless the issue explicitly asks for it:

- deleting a large asset directory;
- replacing most maps/UI at once;
- removing working gameplay systems;
- migrating large amounts of data;
- changing authentication/security architecture;
- changing production credentials or secrets.

### Godot

- Use Godot 4.6.1 compatibility.
- Keep `client/project.godot` compatible with Godot 4.6.1.
- Preserve scene/resource paths.
- Preserve collision, spawn points, map gates, interactions, navigation, and foreground/background layering unless the issue explicitly changes them.
- Do not flatten a playable map into a single PNG.
- Prefer existing tilesets and project assets before creating placeholders.
- Keep pixel-art filtering and pixel alignment consistent with the existing project.

### Current visual focus

For map/UI/character work:

- prioritize natural terrain transitions;
- roads, water, cliffs, grass, village areas, and props should connect organically;
- avoid obvious rectangular "boxed-in" village layouts unless intentional;
- use the existing tileset resources in the repository;
- maintain a coherent pixel-art style;
- retain playability while improving visuals.

### Backend

- Treat the server as authoritative for player state, combat results, inventory, rewards, currency, and progression.
- Do not bypass validation just to make a client flow work.
- Preserve idempotency/retry protections around rewards and inventory.

### Required validation

Run the relevant checks for files changed.

At minimum, when applicable:

```sh
npm --prefix server test
node scripts/check-localization.cjs
node scripts/check-png-integrity.cjs
node scripts/check-pixel-scenes.cjs
```

For Godot/client changes, also attempt a Godot 4.6.1 headless import/runtime validation if the executable is available.

Do not claim a test passed if it was not run.

### Completion report

At the end of every autonomous task, clearly report:

- issue handled;
- files changed;
- tests/checks run;
- tests not run and why;
- remaining risks or follow-up work.
