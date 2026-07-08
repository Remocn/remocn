# Plan 010: Add a CI pipeline (lint, typecheck, tests, registry drift)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: verify the four gate commands exist and their
> current exit codes: `bun run lint; bunx tsc --noEmit; bun run test; bun run registry:check`
> Any gate that fails locally right now belongs to an unfinished dependency
> plan — see STOP conditions.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/002 (typecheck green), plans/003 (test script + green suite), plans/008 (registry:check), plans/009 (lint green)
- **Category**: dx
- **Planned at**: commit `361f442`, 2026-07-07

## Why this matters

`.github/` contains only `FUNDING.yml` — there is no CI at all. Nothing gates a PR against broken tests, type errors, lint regressions, or a stale `public/r` registry. Every guard built by Plans 002/003/008/009 only pays off when a machine runs it on every push.

## Current state

- Repo: GitHub, `Remocn/remocn`, default branch `main`, PR-merge workflow (history shows `Merge pull request #NN` commits).
- Package manager: bun (`bun.lock`). `package.json` has `"packageManager"`? — not set; the workflow pins bun via the setup action instead.
- `postinstall: fumadocs-mdx` runs on install and needs no secrets.
- Expected scripts by the time this plan runs: `lint` (biome, green), `typecheck` (tsc, green — name per Plan 002), `test` (bun test, green — per Plan 003), `registry:check` (per Plan 008), `build` (next build).
- No tests require a browser or network (registry tests are pure logic; server tests mock the renderer). `next build` needs no env secrets (`.env` values are optional at build time — GITHUB_TOKEN is runtime-only; verify with a clean-env local build in Step 2).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| All gates locally | `bun run lint && bunx tsc --noEmit && bun run test && bun run registry:check` | exit 0 |
| Clean-env build | `env -i HOME="$HOME" PATH="$PATH" bun run build` | exit 0 (proves no hidden env dependency) |
| Workflow syntax | `bunx yaml-lint .github/workflows/ci.yml` or careful review | valid YAML |

## Scope

**In scope**:
- `.github/workflows/ci.yml` (create)

**Out of scope**:
- Deployment automation (Coolify deploys separately — do not add deploy steps).
- Branch-protection settings (repo-admin action; recommend in the PR text).
- Caching beyond the setup action's built-in bun cache (premature).
- `render:demos` / `bundle:remotion` scripts — they need a browser; not CI material here.

## Git workflow

Do NOT run any git write commands. The repo owner handles all git operations (including pushing the workflow, which requires `workflow` scope).

## Steps

### Step 1: Verify all gates are green locally

Run the four gate commands plus the clean-env build.

**Verify**: all exit 0. Any failure → STOP (a dependency plan is unfinished).

### Step 2: Write the workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run typecheck
      - run: bun run test
      - run: bun run registry:check

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run build
```

Adjustments allowed: if `bun install --frozen-lockfile` fails because the lockfile format needs a specific bun version, pin `bun-version` to the local `bun --version` output instead of `latest`. If `registry:check` needs full git history for `git diff`, add `fetch-depth: 0` to its checkout.

**Verify**: YAML parses; every script name referenced exists in `package.json`.

### Step 3: Dry-run what CI will run, locally, from a clean state

`rm -rf node_modules && bun install --frozen-lockfile && bun run lint && bun run typecheck && bun run test && bun run registry:check && bun run build`

**Verify**: exit 0 end-to-end.

## Test plan

No unit tests. Real verification happens on the first PR after the owner pushes this — the plan's Step 3 clean-state dry run is the local proxy. Note in the README status row that first-run-on-GitHub confirmation is pending.

## Done criteria

- [ ] `.github/workflows/ci.yml` exists, references only scripts present in `package.json`
- [ ] Step 3 clean-state dry run passes end-to-end
- [ ] `git status` shows only the new workflow file
- [ ] `plans/README.md` status row updated (with "pending first GitHub run" note)

## STOP conditions

- Any gate command is missing from `package.json` or exits non-zero locally.
- The clean-env build fails wanting a secret — identify the variable, report it; do NOT put secrets in the workflow.
- `bun install --frozen-lockfile` fails on a clean checkout even with a pinned bun version.

## Maintenance notes

- Recommend to the owner (PR text): enable branch protection on `main` requiring the `checks` job.
- When Plan 003's follow-up removes the `__tests__` tsconfig exclusion, no CI change is needed (`typecheck` covers it automatically).
- The `build` job is the slow one (~minutes); if CI time becomes an issue, gate it to PRs only.
