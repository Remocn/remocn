# Plan 008: Add a drift guard between registry/ sources and the committed public/r artifacts

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 361f442..HEAD -- registry.json package.json public/r`
> Drift in public/r since `361f442` is fine (someone rebuilt); drift in
> package.json scripts needs reconciling with Step 2.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (consumed by plans/010-ci-pipeline.md)
- **Category**: tests
- **Planned at**: commit `361f442`, 2026-07-07

## Why this matters

The product users actually install (`npx shadcn@latest add @remocn/<name>`) is served from the 135 committed JSON artifacts in `public/r/` — each embeds full component file contents. They are rebuilt BY HAND via `bun run registry:build` (`shadcn build`). Nothing enforces that a source edit under `registry/` is followed by a rebuild: source commit `a7f3377` (Jul 4) landed after the last registry rebuild `bcb6411` (Jul 2); it happened not to touch embedded files, but the drift window is real. When it eventually bites, users silently receive stale component code. A one-command check makes drift mechanically impossible to miss.

## Current state

- `registry.json` (repo root) — shadcn registry manifest; `include`s `registry/remocn/registry.json` and `registry/remocn-ui/registry.json`.
- `package.json` scripts: `"registry:build": "shadcn build"`. Output goes to `public/r/` (135 `.json` files, tracked in git, NOT gitignored).
- As of 2026-07-07 there is zero current drift (all embedded contents were diffed against disk sources).
- The `shadcn` CLI may live in `dependencies` or `devDependencies` depending on whether Plan 004 has landed — either works with `bun run`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Rebuild | `bun run registry:build` | exit 0, writes into `public/r/` |
| Drift check | `git status --porcelain public/r` | empty when in sync |
| New script | `bun run registry:check` | exit 0 when in sync, non-zero on drift |

## Scope

**In scope**:
- `package.json` (one new script)
- `scripts/registry-check.sh` OR an inline script line — prefer the inline form (see Step 2); create a file only if quoting makes the inline form unreadable.

**Out of scope**:
- `public/r/**` contents themselves — the check regenerates them; if the rebuild produces a diff at Step 3, that means real drift exists NOW: STOP and report it, do not commit regenerated artifacts as part of this plan.
- CI wiring — Plan 010 consumes `registry:check`.
- `registry/__index__.tsx` — it is a hand-maintained preview map, not a `shadcn build` output; leave it out of the check.

## Git workflow

Do NOT run any git write commands that mutate state (no commit/branch/stash). Read-only `git status`/`git diff` is required by the check itself and is fine.

## Steps

### Step 1: Confirm build output location and cleanliness

Run `git status --porcelain public/r` → expect empty. Then `bun run registry:build`, then `git status --porcelain public/r` again.

**Verify**: empty both times (build is deterministic and in sync). If the SECOND check shows modifications, real drift exists → STOP condition.

### Step 2: Add the `registry:check` script

In `package.json` scripts add:

```json
"registry:check": "shadcn build && git diff --quiet -- public/r || (echo 'public/r is out of sync with registry/ sources. Run: bun run registry:build and commit the result.' && exit 1)"
```

Note: `git diff --quiet` catches modified tracked files; newly created untracked artifacts (a brand-new component built but never committed) are caught by pairing with `git status`: if the simple form proves insufficient in Step 3's negative test, use the stricter variant `shadcn build && test -z "$(git status --porcelain public/r)" || (...)`. Prefer whichever variant actually passes the negative test.

**Verify**: `bun run registry:check` → exit 0, prints nothing alarming.

### Step 3: Negative test (prove the guard fires)

Temporarily append a character to any source file embedded in an artifact, e.g. add a blank line to `registry/remocn/backdrop/index.tsx`. Run `bun run registry:check` → MUST exit non-zero with the drift message. Then restore the file exactly (remove the blank line) and re-run `bun run registry:build` to regenerate clean artifacts.

**Verify**: after restore, `git status --porcelain` shows ONLY `package.json` modified (no residue in `registry/` or `public/r`).

## Test plan

The negative test in Step 3 is the test. No unit-test file — this is a build-integrity script.

## Done criteria

- [ ] `bun run registry:check` exits 0 on a clean tree
- [ ] The Step-3 negative test demonstrated a non-zero exit on drift, and the tree was restored
- [ ] `git status` shows only `package.json` changed
- [ ] `plans/README.md` status row updated

## STOP conditions

- Step 1 second check shows `public/r` modifications on a clean rebuild — real drift or nondeterministic build output (e.g. timestamps embedded in artifacts). Report which files differ and how; a nondeterministic build needs a different guard design (normalize before diff), which is a scope change.
- `shadcn build` writes anywhere other than `public/r`.

## Maintenance notes

- Plan 010 runs `bun run registry:check` in CI — keep the script name.
- If the registry build ever becomes nondeterministic (schema version bumps reordering keys), the check will false-positive on every run — the fix is normalizing output, not deleting the check.
- The user-facing failure mode this prevents: `npx shadcn add @remocn/<name>` delivering code older than what the docs page shows.
