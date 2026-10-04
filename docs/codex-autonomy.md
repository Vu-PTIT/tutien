# Codex 24/7 worker

The repository contains an opt-in autonomous Codex worker.

## Queue

Create a normal GitHub Issue whose title starts with:

```text
[codex]
```

Example:

```text
[codex] Fix player sprite frame alignment on the village map
```

The scheduled worker checks once per hour and picks the oldest open `[codex]` issue.

You can also start the workflow manually and provide a specific issue number.

## Safety model

The worker:

1. checks out `main`;
2. handles exactly one issue;
3. creates a fresh `codex/issue-*` branch;
4. lets Codex modify the workspace;
5. commits and pushes only when files changed;
6. opens a draft pull request;
7. never auto-merges the pull request.

The existing repository CI remains responsible for full validation on the pull request.

## Required repository secret

Add an Actions secret named:

```text
OPENAI_API_KEY
```

Repository path:

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

Do not put the key in a file, issue, commit, or workflow YAML.

## First test

After this setup PR is reviewed and merged:

1. create an issue such as `[codex] Documentation smoke test`;
2. ask it to make a tiny safe documentation change;
3. run **Codex autonomous worker** manually;
4. confirm it creates a draft PR;
5. confirm the normal CI runs on that PR.

Only after that smoke test should larger implementation issues be queued.
