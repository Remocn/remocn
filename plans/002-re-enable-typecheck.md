# Plan 002: Fix the real type errors and re-enable TypeScript checking in the build

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 361f442..HEAD -- next.config.ts tsconfig.json lib/analytics.ts config/sponsors.ts lib/server/validate-input.ts "app/(home)/components/sections" registry/remocn-ui/dropdown-menu registry/remocn/a1-product-demo scripts/render-demos.mts mdx-components.tsx package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-delete-dead-webgl-and-ui-components.md
- **Category**: dx
- **Planned at**: commit `361f442`, 2026-07-07

## Why this matters

`next.config.ts` sets `typescript.ignoreBuildErrors: true`, so NO typecheck gate exists anywhere. `bunx tsc --noEmit` reports 105 errors. Most are test files importing `vitest` (handled by Plan 003), but roughly 8 are genuine app-source defects — including two on the server render path (`lib/server/render.ts`) and two silently-broken analytics events. This plan fixes the real errors, adds a `typecheck` script, and flips `ignoreBuildErrors` off so type regressions can never deploy silently again.

## Current state

`next.config.ts:21-25`:
```ts
  typescript: {
    // Type-check ломается из-за коллизии @types/mdx × @react-three/fiber
    // (см. mdx-components.tsx). Рантайм не затронут.
    ignoreBuildErrors: true,
  },
```
The comment blames `@react-three/fiber`, which Plan 001 deletes. After Plan 001, re-run tsc — the `mdx-components.tsx` error is expected to disappear or change.

The genuine app-source errors at `361f442` (from `bunx tsc --noEmit`):

1. `app/(home)/components/sections/hero.tsx(61,23)`: `Type '"hero_ui_badge"' is not assignable to type 'CtaId'`. The call is `trackEvent("cta_clicked", { cta: "hero_ui_badge", destination: "/docs/shaders/getting-started/introduction" })`. `CtaId` is a string union at `lib/analytics.ts:12`.
2. `app/(home)/components/sections/bento-registry.tsx(30,7)`: `Type '"bento"' is not assignable to type '"docs" | "landing"'`. The call is `trackEvent("install_command_copied", { component: name, surface: "bento", package_manager: "npm" })`; the event's `surface` union is at `lib/analytics.ts:22`.
3. `config/sponsors.ts(22,14)`: the `sponsors` array literal is not assignable to `Sponsor[]` — at least one entry's `tier` is a plain string outside the `SponsorTier` union (`"partner" | "builder" | "supporter"`, defined at `config/sponsors.ts:3`).
4. `lib/server/render.ts(67,5)` and `(80,7)`: `Type 'RenderInput' is not assignable to type 'Record<string, unknown>'` — `RenderInput` is declared as an `interface` in `lib/server/validate-input.ts:22`, and interfaces have no implicit index signature.
5. `registry/remocn-ui/dropdown-menu/config.ts(15,5)`: `{ type: "number"; ... }` not assignable to `ControlType` (defined in `lib/customizer-config.ts`).
6. `registry/remocn/a1-product-demo/index.tsx(260,11)`: `TransitionPresentation<CameraCraneUpProps> | TransitionPresentation<SpatialPushProps>` not assignable to `TransitionPresentation<CameraCraneUpProps> | undefined` — the return type of `planPresentation` is narrower than its actual returns.
7. `scripts/render-demos.mts(10,38)`: TS5097 — imports `"./tsconfig-webpack-alias.mts"` with explicit `.mts` extension, which requires `allowImportingTsExtensions`.
8. `mdx-components.tsx(34,3)`: MDXComponents assignability — re-check after Plan 001; may be gone.

Runtime behavior note for errors 1–2: the strings ARE sent at runtime today (`"hero_ui_badge"`, `"bento"`), so widening the union to match reality preserves existing analytics data; renaming the value would break dashboard continuity.

Repo conventions: bun + biome; NEVER add code comments (including JSDoc) to your edits; no `as` casts to silence errors — fix the types properly.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `bunx tsc --noEmit` | 0 errors at the end of this plan |
| Error count | `bunx tsc --noEmit 2>&1 \| grep -c "error TS"` | see per-step targets |
| Build | `bun run build` | exit 0 WITH `ignoreBuildErrors` removed |
| Lint | `bun run lint` | error count not increased vs baseline (589) |

## Scope

**In scope**:
- `lib/analytics.ts` (widen the two unions), `app/(home)/components/sections/hero.tsx`, `app/(home)/components/sections/bento-registry.tsx` (only if you choose value-side fixes — union-widening is preferred, see Step 2)
- `config/sponsors.ts`
- `lib/server/validate-input.ts` (interface → type)
- `registry/remocn-ui/dropdown-menu/config.ts`, `lib/customizer-config.ts` (only if `ControlType` genuinely lacks a number control)
- `registry/remocn/a1-product-demo/index.tsx`
- `tsconfig.json` (add `allowImportingTsExtensions`, exclude `__tests__`)
- `mdx-components.tsx` (only if its error survives Plan 001)
- `next.config.ts` (remove the `typescript` block), `package.json` (add `typecheck` script)

**Out of scope**:
- All `__tests__/**` files — Plan 003 ports them; this plan excludes them from the typecheck instead.
- `lib/server/render.ts` — its two errors are fixed from the `validate-input.ts` side; do not restructure `render.ts`.
- Any behavior change to analytics payloads, sponsor rendering, or the a1-product-demo animation.

## Git workflow

Do NOT run any git write commands. The repo owner handles all git operations.

## Steps

### Step 1: Establish post-001 baseline and exclude tests from typecheck

Run `bunx tsc --noEmit 2>&1 | grep -v "__tests__" | grep "error TS"` and save the list. Add `"**/__tests__/**"` to the `exclude` array in `tsconfig.json` (create the array if absent, keeping existing entries). Add `"allowImportingTsExtensions": true` to `compilerOptions` (valid because `noEmit`/Next's bundler handles emit).

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "Cannot find module 'vitest'"` → 0; `scripts/render-demos.mts` error gone.

### Step 2: Fix the analytics unions

In `lib/analytics.ts`: add `"hero_ui_badge"` to the `CtaId` union (line 12); widen the `install_command_copied` event's `surface` from `"docs" | "landing"` to include `"bento"` (line 22). Do not touch the two call sites.

**Verify**: `bunx tsc --noEmit 2>&1 | grep "hero.tsx\|bento-registry.tsx"` → no output.

### Step 3: Fix `config/sponsors.ts`

Inspect the array; find entries whose `tier` value is not one of `"partner" | "builder" | "supporter"`. Decide by data: if the value is a typo of an existing tier, correct it; if it's a legitimately new tier, add it to the `SponsorTier` union AND check every consumer of `tier` handles it (`grep -rn "tier" app components config --include='*.tsx' --include='*.ts'` — the sponsors page groups by tier). Sponsors render on a public page: do not delete entries.

**Verify**: `bunx tsc --noEmit 2>&1 | grep "sponsors.ts"` → no output.

### Step 4: Fix `RenderInput` assignability

In `lib/server/validate-input.ts`, convert `interface RenderInput { ... }` (line 22) and `interface RenderStargazer { ... }` (line 15) to `type RenderInput = { ... }` / `type RenderStargazer = { ... }` with identical members. Type aliases are assignable to `Record<string, unknown>`; interfaces are not.

**Verify**: `bunx tsc --noEmit 2>&1 | grep "render.ts\|validate-input"` → no output.

### Step 5: Fix the dropdown-menu control type

Check `lib/customizer-config.ts` for the `ControlType` union. Also check how other configs declare numeric controls: `grep -rn 'type: "number"' registry --include='config.ts'`. If a number control variant exists under a different shape, conform `registry/remocn-ui/dropdown-menu/config.ts:15` to it. If NO number control exists in `ControlType` at all, add a `{ type: "number"; default: number; label: string }` variant to the union and confirm the customizer UI component that switches on `type` (find it via `grep -rn "ControlType" components lib`) has a rendering branch for it — if it doesn't, STOP and report (adding UI is out of scope).

**Verify**: `bunx tsc --noEmit 2>&1 | grep "dropdown-menu"` → no output.

### Step 6: Fix `planPresentation` return type in a1-product-demo

At `registry/remocn/a1-product-demo/index.tsx`, the function feeding `presentation=` at line 260 returns two different `TransitionPresentation<T>` instantiations. Widen the declared return type of `planPresentation` to the union of everything it actually returns (e.g. `TransitionPresentation<CameraCraneUpProps> | TransitionPresentation<SpatialPushProps>`), and let the `presentation` prop accept it (the `@remotion/transitions` prop type is generic — if the prop genuinely cannot accept a union, STOP and report rather than casting).

**Verify**: `bunx tsc --noEmit 2>&1 | grep "a1-product-demo"` → no output.

### Step 7: Clear any residue and flip the switch

Run `bunx tsc --noEmit`. If `mdx-components.tsx` still errors, fix it minimally within that file. Fix any other stragglers the same way — each fix must be a real type correction, not a cast. Then delete the entire `typescript: { ignoreBuildErrors: true }` block from `next.config.ts` (including its comment) and add `"typecheck": "tsc --noEmit"` to `package.json` scripts.

**Verify**: `bunx tsc --noEmit` → exit 0, no errors. `bun run build` → exit 0.

## Test plan

No new unit tests (type-level fixes). Gates: `bun run typecheck` exits 0; `bun run build` exits 0 with checking enabled; `bun test 2>&1 | tail -3` unchanged vs baseline (2392 pass / 21 fail / 4 errors — pre-existing, fixed by Plan 003).

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `next.config.ts` contains no `ignoreBuildErrors`
- [ ] `bun run build` exits 0
- [ ] `grep -rn "as any\|@ts-ignore\|@ts-expect-error" $(git diff --name-only)` shows none of these were introduced by your edits
- [ ] `plans/README.md` status row updated

## STOP conditions

- Post-001 tsc output contains errors in files NOT listed in "Current state" that you cannot fix with a local, obvious type correction (report the list instead).
- Step 5: `ControlType` lacks a number variant and the customizer has no rendering branch for one.
- Step 6: the `presentation` prop type genuinely rejects the union.
- Any fix would require an `as` cast or `@ts-expect-error` to compile.

## Maintenance notes

- Plan 010 (CI) wires `bun run typecheck` as a gate — keep the script name `typecheck`.
- Plan 003 removes the `__tests__` exclusion pressure: once tests use `bun:test` and `@types/bun` is installed, consider removing `"**/__tests__/**"` from `exclude` so tests are typechecked too (noted in Plan 003).
- Reviewer: scrutinize Step 3 (sponsor tiers are business data) and Step 5 (customizer union) — both touch user-visible surfaces.
