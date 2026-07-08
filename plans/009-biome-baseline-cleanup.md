# Plan 009: Clear the biome lint baseline (589 errors → 0)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `bun run lint 2>&1 | tail -3` — if the error
> count differs wildly from 589 (±50), the baseline moved; note the new
> number and proceed, but re-check the dominant rule categories first.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (mechanical majority) / MED (the correctness-rule subset)
- **Depends on**: none (Plans 001-003 landing first reduces the file count — prefer running after them)
- **Category**: dx
- **Planned at**: commit `361f442`, 2026-07-07

## Why this matters

`bun run lint` (`biome check`) reports 589 errors + 73 warnings. A baseline this red means the lint script provides zero signal — a new violation is invisible in the noise, and nobody runs a command that always fails. Plan 010 needs `bun run lint` as a CI gate; that requires a green baseline.

## Current state

- `biome.json` at repo root: biome 2.2.0, recommended rules + `next`/`react` domains, formatter 2-space, `organizeImports` assist ON, vcs.useIgnoreFile ON.
- `package.json`: `"lint": "biome check"`, `"format": "biome format --write"`.
- The 589 errors are dominated by `source/organizeImports` (assist) and formatting-class issues, with a smaller set of `suspicious`/`correctness` rules (e.g. `noUnusedFunctionParameters`).
- Repo rule: NEVER add code comments — this includes `biome-ignore` suppressions EXCEPT where a rule is genuinely wrong about the code; existing `biome-ignore` directives (e.g. `hero.tsx:129`) are functional and stay.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Lint | `bun run lint` | exit 0 at plan end |
| Count | `bun run lint 2>&1 \| grep -E "Found [0-9]+ errors"` | decreasing per step |
| Safe autofix | `bunx biome check --write` | applies safe fixes only |
| Tests | `bun run test 2>&1 \| tail -3` (or `bun test`) | unchanged vs your starting baseline |
| Typecheck | `bunx tsc --noEmit` | no new errors vs your starting baseline |
| Build | `bun run build` | exit 0 |

## Scope

**In scope**:
- Any `.ts`/`.tsx`/`.css`/`.json` file biome flags — this is a repo-wide mechanical pass.
- `biome.json` — ONLY for demoting a rule to `"warn"`/`"off"` per the escape hatch in Step 3, each with justification in the README status note.

**Out of scope**:
- `public/r/**` (generated artifacts — if biome flags them, add them to `files.includes` ignores in biome.json instead of editing them).
- Behavioral changes of any kind: this plan must be a no-op at runtime.
- `--unsafe` autofixes applied blindly (see Step 3).

## Git workflow

Do NOT run any git write commands. The repo owner handles all git operations. Note for the owner: this lands as one large formatting-dominated diff — merge it when no long-running feature branches are open, or rebase pain follows.

## Steps

### Step 1: Record baselines

Record: `bun run lint 2>&1 | tail -5` (error/warning counts), `bun test 2>&1 | tail -3`, `bunx tsc --noEmit 2>&1 | grep -c "error TS"`.

**Verify**: numbers recorded in your working notes.

### Step 2: Safe autofix sweep

Run `bunx biome check --write` (safe fixes + import organizing + formatting). Then re-run the three baseline commands.

**Verify**: `bun test` pass/fail counts unchanged; tsc error count unchanged or lower; lint error count sharply reduced. If tests or types regressed, inspect the diff for the offending file — safe fixes shouldn't change behavior; a regression here is a STOP condition.

### Step 3: Hand-fix the remainder

For each remaining error (expect the `correctness`/`suspicious` subset):
- `noUnusedFunctionParameters` / unused vars: prefix with `_` or remove genuinely dead parameters — check callers before removing.
- Rule-by-rule: fix the code properly where the rule is right.
- Escape hatch, in order of preference when a rule is wrong for this codebase: (1) demote the rule in `biome.json` with a one-line justification recorded in `plans/README.md`; (2) a `biome-ignore` line ONLY where the rule is wrong about one specific site and the fix would be worse (these are functional directives, allowed by repo rules).
- Apply fixes in batches of ~50 errors, re-running `bun test` after each batch.

**Verify**: `bun run lint` → exit 0, `Found 0 errors`.

### Step 4: Full gate

**Verify**: `bun run lint` exit 0; `bun test` unchanged vs Step 1; `bunx tsc --noEmit` count ≤ Step 1; `bun run build` exit 0.

## Test plan

No new tests. The invariant is behavioral neutrality: test pass/fail counts and tsc error counts must not regress at any step.

## Done criteria

- [ ] `bun run lint` exits 0
- [ ] `bun test` results identical to the Step-1 baseline
- [ ] `bunx tsc --noEmit` error count ≤ Step-1 baseline
- [ ] Every rule demotion (if any) is listed with justification in `plans/README.md`
- [ ] `plans/README.md` status row updated

## STOP conditions

- Step 2 changes test results or type-error counts (a "safe" fix that wasn't).
- More than ~5 rules would need demotion to reach green — the config, not the code, is then the problem; report a proposed biome.json instead of mass-demoting.
- A fix requires understanding component behavior you can't verify (e.g. an exhaustive-deps-style change inside a Remotion animation) — leave it, suppress with `biome-ignore` + justification, and list it.

## Maintenance notes

- Plan 010 wires `bun run lint` into CI immediately after this — land them close together or the baseline rots again.
- The one-big-diff nature: reviewer should filter the diff to non-whitespace changes (`git diff -w`) and scrutinize only those.
