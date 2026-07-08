# Plan 001: Delete dead WebGL/UI components and drop their 9 unused dependencies

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 361f442..HEAD -- components/ package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `361f442`, 2026-07-07

## Why this matters

Eleven files in `components/` have zero importers anywhere in the repo, and they are the ONLY importers of nine dependencies — including the heaviest ones in the tree (`three`, `ogl`, `postprocessing`, `recharts`). Deleting them removes ~2,900 lines of dead code and nine dependencies from `package.json`. Critically, `@react-three/fiber` is the stated reason `next.config.ts` disables all TypeScript build errors ("Type-check ломается из-за коллизии @types/mdx × @react-three/fiber") — removing it unblocks Plan 002 (re-enable typechecking).

## Current state

Dead files (verified 2026-07-07: repo-wide grep finds no importer for any of them; matches for "Dither" belong to the unrelated `registry/remocn/dither-dissolve` component, which stays):

- `components/Silk.tsx` — imports `@react-three/fiber`, `three`
- `components/Dither.tsx` (331 lines) — imports `@react-three/fiber`, `@react-three/postprocessing`, `postprocessing`, `three`
- `components/Aurora.tsx` (213 lines) — imports `ogl`
- `components/ui/chart.tsx` — sole importer of `recharts`
- `components/ui/carousel.tsx` — sole importer of `embla-carousel-react`
- `components/ui/calendar.tsx` — sole importer of `react-day-picker`
- `components/ui/input-otp.tsx` — sole importer of `input-otp`
- `components/ui/sidebar.tsx` (725 lines), `components/ui/menubar.tsx`, `components/ui/pagination.tsx`, `components/ui/navigation-menu.tsx` — unused shadcn scaffold, no exclusive deps

Dependencies to remove from `package.json` `dependencies` (lines as of `361f442`): `three`, `ogl`, `postprocessing`, `@react-three/fiber`, `@react-three/postprocessing`, `recharts`, `embla-carousel-react`, `react-day-picker`, `input-otp`. No `@types/three` exists in devDependencies (nothing to remove there).

Do NOT confuse these with live code: `registry/remocn/dither-dissolve/`, `registry/remocn/shader-*` (use `@paper-design/shaders-react`, which stays), and `components/ui/{button,drawer,combobox,context-menu,...}` are used.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install | `bun install` | exit 0, lockfile updated |
| Build | `bun run build` | exit 0 |
| Tests | `bun test 2>&1 \| tail -3` | same as baseline: `2392 pass, 21 fail, 4 errors` (pre-existing failures, see plans/003) |
| Baseline typecheck | `bunx tsc --noEmit 2>&1 \| grep -c "error TS"` | 105 before this plan; must not increase after |

## Scope

**In scope** (the only files you should modify/delete):
- Delete: the 11 files listed above
- Modify: `package.json` (remove the 9 deps), `bun.lock` (via `bun install` only)

**Out of scope** (do NOT touch):
- `registry/**` — all registry components are the product; none are affected.
- `components/ui/*` not in the list — used by the site.
- `@paper-design/shaders-react`, `@uidotdev/usehooks`, `motion` — used elsewhere.
- `next.config.ts` — re-enabling typecheck is Plan 002.

## Git workflow

Do NOT run any git write commands (no branch, commit, stash, checkout). The repo owner handles all git operations. Read-only `git status` / `git diff` for verification is fine.

## Steps

### Step 1: Re-verify zero importers

For each file, confirm no importer exists (excludes the file itself):

```
grep -rn "components/Silk\|components/Dither\|components/Aurora" --include='*.ts' --include='*.tsx' --include='*.mdx' app components lib config content registry src hooks scripts | grep -v "^components/Silk.tsx\|^components/Dither.tsx\|^components/Aurora.tsx"
for c in chart carousel calendar input-otp sidebar menubar pagination navigation-menu; do grep -rn "ui/$c" --include='*.ts' --include='*.tsx' --include='*.mdx' app components lib registry content src | grep -v "components/ui/$c.tsx"; done
```

**Verify**: both commands print nothing. If ANY line prints, STOP.

### Step 2: Delete the 11 files

Delete `components/Silk.tsx`, `components/Dither.tsx`, `components/Aurora.tsx`, and `components/ui/{chart,carousel,calendar,input-otp,sidebar,menubar,pagination,navigation-menu}.tsx`.

**Verify**: `ls components/Silk.tsx components/ui/chart.tsx 2>&1` → "No such file" for both.

### Step 3: Remove the 9 dependencies and reinstall

Remove from `package.json` dependencies: `three`, `ogl`, `postprocessing`, `@react-three/fiber`, `@react-three/postprocessing`, `recharts`, `embla-carousel-react`, `react-day-picker`, `input-otp`. Then `bun install`.

**Verify**: `grep -c "three\|\"ogl\"\|postprocessing\|recharts\|embla\|day-picker\|input-otp" package.json` → 0 matches (note: `@types/culori` etc. must remain untouched).

### Step 4: Confirm nothing still imports the removed packages

```
grep -rn "from \"three\"\|from \"ogl\"\|from \"postprocessing\"\|@react-three\|recharts\|embla-carousel\|react-day-picker\|from \"input-otp\"" --include='*.ts' --include='*.tsx' app components lib registry src hooks scripts
```

**Verify**: no output.

### Step 5: Build and typecheck-count

**Verify**: `bun run build` → exit 0. `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → ≤ 105 (expected to drop; must not rise). `bun test 2>&1 | tail -3` → pass/fail counts identical to baseline.

## Test plan

No new tests — this is pure deletion. The gates are: build passes, tsc error count does not increase, `bun test` results unchanged from baseline.

## Done criteria

- [ ] The 11 files are deleted; `git status` shows only those deletions plus `package.json`/`bun.lock`
- [ ] `grep` sweeps in Steps 1 and 4 return nothing
- [ ] `bun run build` exits 0
- [ ] `bunx tsc --noEmit` error count ≤ 105
- [ ] `plans/README.md` status row updated

## STOP conditions

- Step 1 finds any importer of a to-be-deleted file.
- `bun run build` fails after deletion with an error naming any deleted file or removed package.
- `package.json` at HEAD no longer lists one of the 9 packages (someone already removed it — reconcile, don't fail).

## Maintenance notes

- Plan 002 depends on this: the `@types/mdx × @react-three/fiber` collision cited in `next.config.ts:22-24` should disappear once `@react-three/fiber` is gone.
- If a future landing design wants a WebGL background, prefer `@paper-design/shaders-react` (already a dependency, used by 18 registry shader components) over reintroducing three/ogl.
- Reviewer: check `bun.lock` diff only removes packages (no unexpected version bumps).
