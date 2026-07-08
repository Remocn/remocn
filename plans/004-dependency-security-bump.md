# Plan 004: Patch the known-vulnerable dependency surface (Next.js ≥16.2.5, shadcn → devDeps, ws override)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 361f442..HEAD -- package.json bun.lock`
> If dependency versions changed since this plan was written, re-run
> `bun audit` and reconcile before proceeding.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (steps 1–2) / MED (step 3, optional)
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `361f442`, 2026-07-07

## Why this matters

`bun audit` at `361f442` reports the direct dependency `next@16.2.2` inside the vulnerable range `>=16.0.0 <16.2.5` with 8 HIGH advisories (SSRF via WebSocket upgrades GHSA-c4j6-fc7j-m34r, DoS with Server Components GHSA-q4gf-8mx6-v5v3, multiple middleware/proxy bypasses). This is a public production site (remocn.dev) with server routes. Separately, the `shadcn` CLI sits in production `dependencies` and drags a vulnerable transitive tree (express/hono/@modelcontextprotocol/sdk: qs DoS, ip-address XSS, hono CORS HIGH) that the app never executes at runtime. And `@remotion/renderer › ws <8.21.0` carries a HIGH memory-exhaustion advisory (GHSA-96hv-2xvq-fx4p).

## Current state

`package.json` (excerpts as of `361f442`):

```json
"dependencies": {
    ...
    "next": "16.2.2",
    ...
    "shadcn": "^4.11.0",
    ...
    "@remotion/bundler": "4.0.473",
    "@remotion/renderer": "4.0.473",
    "remotion": "4.0.473",
```

Constraints:
- All `remotion`/`@remotion/*` packages are pinned to exactly `4.0.473` deliberately (deployment stability on the render server). Do NOT bump any Remotion package in this plan.
- `shadcn` is used only as a build-time CLI: `"registry:build": "shadcn build"` in scripts. Nothing imports it at runtime (verify in Step 2).
- Repo uses bun; lockfile is `bun.lock`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Audit | `bun audit` | after Step 1: no `next` entry; after Step 3: no `ws` entry |
| Install | `bun install` | exit 0 |
| Build | `bun run build` | exit 0 |
| Registry build | `bun run registry:build` | exit 0 (proves the shadcn CLI still resolves from devDeps) |
| Tests | `bun test 2>&1 \| tail -3` | unchanged vs your starting baseline |

## Scope

**In scope**: `package.json`, `bun.lock` (via bun commands only).

**Out of scope**:
- Any `remotion`/`@remotion/*` version change.
- Source code changes of any kind.
- Chasing `moderate`/`low` advisories (js-yaml, postcss, qs, brace-expansion, @babel/core) — they are transitive noise-floor; record them, don't fix them here.

## Git workflow

Do NOT run any git write commands. The repo owner handles all git operations.

## Steps

### Step 1: Bump Next.js to the latest 16.2.x patch

Edit `package.json`: `"next"` → the newest published `16.2.x` (must be ≥16.2.5; check with `bun pm view next versions | tail -5` or `npm view next@16 version`). Stay on major 16 — do not jump majors. Run `bun install`.

**Verify**: `bun audit 2>&1 | grep -A2 "^next"` → no vulnerable `next` entry (the advisory block for `next` is gone). `bun run build` → exit 0.

### Step 2: Move `shadcn` to devDependencies

Confirm nothing imports it at runtime: `grep -rn "from \"shadcn\"\|require(\"shadcn\")" app components lib registry src scripts --include='*.ts' --include='*.tsx' --include='*.mts'` → must be empty. Move the `"shadcn": "^4.11.0"` line from `dependencies` to `devDependencies`; run `bun install`.

**Verify**: `bun run registry:build` → exit 0. `bun run build` → exit 0.

### Step 3 (optional, MED risk): Override transitive `ws`

Add to `package.json`:

```json
"overrides": {
    "ws": "^8.21.0"
}
```

Run `bun install`. This forces `@remotion/renderer`'s `ws` to a patched version WITHOUT bumping Remotion itself. `ws` backs Remotion's Chromium control channel — if the render smoke test below fails, REMOVE the override, run `bun install`, and record the step as skipped in `plans/README.md` (the advisory is not directly attacker-facing).

**Verify**: `bun audit 2>&1 | grep -B1 -A2 "^ws"` → no `ws` entry. Render smoke test: `bun test lib/server` → pass (if Plan 003 has landed; otherwise `bun run build` + note that runtime render verification is deferred to the owner).

### Step 4: Record the residual audit noise

Run `bun audit` and paste the remaining advisory names (expected: js-yaml, postcss, qs/ip-address/brace-expansion under shadcn devDep, @babel/core) into this plan's status row note in `plans/README.md` as "accepted noise floor".

**Verify**: `bun audit 2>&1 | grep -c "high:"` → 0 (if Step 3 executed) or only the `ws` line (if skipped).

## Test plan

No new tests. Gates: `bun run build`, `bun run registry:build`, `bun test` unchanged, `bun audit` free of HIGH advisories on `next` (mandatory) and `ws` (best-effort).

## Done criteria

- [ ] `bun audit` shows no advisory against `next`
- [ ] `shadcn` is under `devDependencies`; `bun run registry:build` still works
- [ ] `bun run build` exits 0
- [ ] `git status` touches only `package.json` + `bun.lock`
- [ ] `plans/README.md` updated, including the ws-override outcome and accepted noise floor

## STOP conditions

- The newest 16.2.x introduces a build failure that a clean reinstall (`rm -rf node_modules .next && bun install`) doesn't cure — report the error; do not patch app code to accommodate it here.
- `bun install` resolves `next` to something outside 16.2.x.
- Step 2 grep finds a runtime import of `shadcn`.
- Remotion version drift appears in `bun.lock` after any step (`grep '"remotion@' bun.lock` must show 4.0.473).

## Maintenance notes

- The Dockerfile/Coolify image must be rebuilt after this lands for the patch to reach production — flag in the PR description.
- When Remotion is next bumped intentionally (owner decision), drop the `ws` override if 4.0.x has moved past ws 8.21.
- Reviewer: check `bun.lock` diff for unexpected major bumps of transitive packages.
