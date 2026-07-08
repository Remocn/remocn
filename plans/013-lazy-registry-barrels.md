# Plan 013: Stop the registry barrels from shipping the whole 140-component catalog in every client bundle

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 361f442..HEAD -- registry/__index__.tsx components/docs "app/(home)/components/sections"`
> On drift, compare the excerpts below against live code; mismatch = STOP.
> Plan 012 landing first is EXPECTED drift in the three section files —
> reconcile with its containerRef changes, don't treat that as a mismatch.

## Status

- **Priority**: P3
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/012-player-in-view-gating.md (same files; land 012 first)
- **Category**: perf
- **Planned at**: commit `361f442`, 2026-07-07

## Why this matters

`registry/__index__.tsx` statically imports ~140 components + their configs (250 import statements) into one `registry[name]` object map. Eight client modules import this map — the landing page (which renders ~10 components) and every docs preview — so object-map references defeat tree-shaking and the ENTIRE catalog, including 18 `@paper-design/shaders-react` shader components and the 1,197-line github-stars component (sole `date-fns` consumer), lands in bundles that use a handful of entries. A parallel barrel (`components/docs/examples/index.tsx`, 36 static imports + `blocks/index.tsx`, 13 more) does the same for example scenes. This is the single biggest client-bundle problem in the repo. The fix has a cheap phase (direct imports on the landing page) and a structural phase (lazy components behind a static config map).

## Current state

`registry/__index__.tsx:1-2` and the map-entry shape (lines ~425-445):

```tsx
import type React from "react";
import { type ComponentConfig, SHARED_CONTROLS } from "@/lib/customizer-config";
// ... ~250 static imports: Component + config per registry item ...
  "dynamic-grid": { Component: DynamicGrid, config: dynamicGridConfig },
  "dither-dissolve": {
    Component: DitherDissolveExampleScene,
    config: ditherDissolveConfig,
  },
```

Each entry is `{ Component: React.ComponentType, config: ComponentConfig }`. Configs come from separate `registry/<ns>/<name>/config.ts` files (which import only `lib/customizer-config` constants — importing a config does NOT pull the component). Some entries' `Component` is a docs example scene from `@/components/docs/examples/*` (e.g. `DitherDissolveExampleScene`), not the registry component itself.

Known importers of the `registry` map (verify the list with `grep -rln "registry/__index__" app components lib`):
- `app/(home)/components/sections/bento-registry.tsx:12` (`import registry from "@/registry/__index__";`, entry lookup at line 85, Player at 131-145)
- `app/(home)/components/sections/interactive-code.tsx`
- `components/docs/ui-component-preview.tsx`, `components/docs/component-preview.tsx`, `components/docs/component-card.tsx`
- the stars tool under `app/(home)/stars/`

Examples barrel: `components/docs/examples/index.tsx` exports `examples: Record<string, ExampleEntry>` (line 115) built from 36 static scene imports; `components/docs/examples/blocks/index.tsx` similarly exports `blockExamples`. `app/(home)/components/sections/ui-registry.tsx:9-10` imports BOTH barrels but uses only entries for: `"toast", "command-menu", "tabs", "slider", "tooltip", "stepper", "message-bubble", "typing-indicator"` (an ATOMS list at lines ~52-68) plus one block example.

Remotion Player lazy support: `@remotion/player`'s `<Player>` accepts `lazyComponent={() => import("...")}` as an alternative to `component` (the module's default export or a `component`-shaped export must be the composition). Verify the installed 4.0.473 signature in `node_modules/@remotion/player/dist/index.d.ts` before relying on it — if `lazyComponent` requires a default export, registry components use named exports, so prefer `React.lazy` + adapter instead (see Step 3).

`scripts/render-demos.mts` and `src/remotion/**` also consume example/registry maps for server-side demo rendering — they must keep working with whatever shape change you make (they can use the lazy shape too since bundling resolves dynamic imports, but verify).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `bunx tsc --noEmit` | no new errors |
| Build | `bun run build` | exit 0 |
| Bundle evidence | `du -sh .next/static/chunks 2>/dev/null` before/after; and `grep -rl "date-fns\|shaders-react" .next/static/chunks --include='*.js' \| wc -l` before/after | shader/date-fns chunk count drops for landing routes |
| Tests | `bun run test 2>&1 \| tail -3` | unchanged |
| Dev smoke | `bun dev` + open `/` and one docs page | previews render |

## Scope

**In scope**:
- `app/(home)/components/sections/ui-registry.tsx` (Phase A: direct imports)
- `registry/__index__.tsx` (Phase B: split configs from lazy components)
- The 6-8 importers of the `registry` map (adapt to the new shape)
- `components/docs/examples/index.tsx`, `blocks/index.tsx` (only if Phase B extends to them — see Step 5)

**Out of scope**:
- `public/r/**`, `registry/*/registry.json` — installable artifacts are unaffected.
- Visual/behavioral changes to any preview.
- `lib/customizer-config.ts` internals.
- Removing date-fns from github-stars (separate, deferred — see Maintenance).

## Git workflow

Do NOT run any git write commands. The repo owner handles all git operations.

## Steps

### Step 1: Record bundle baseline

`bun run build`, then record `du -sh .next/static/chunks` and the route-size table Next prints for `/` and `/docs/[[...slug]]`.

**Verify**: numbers recorded.

### Step 2 (Phase A — cheap win): Direct imports in `ui-registry.tsx`

Replace the two barrel imports in `app/(home)/components/sections/ui-registry.tsx` with direct imports of ONLY the example scenes its ATOMS list + block usage actually renders (find each in `components/docs/examples/<name>-example.tsx` / `blocks/`). Build a local map with the same entry shape the component already consumes (`SceneEntry` interface at lines ~18-25).

**Verify**: `bunx tsc --noEmit` clean; `bun run build` → the `/` route's first-load JS drops vs Step 1 (record by how much).

### Step 3 (Phase B core): Split `registry/__index__.tsx` into static configs + lazy components

Restructure so importing the map no longer pulls component code:
- Keep every `config` import static (configs are lightweight and the customizer reads them synchronously).
- Replace each `Component: X` with a loader: `load: () => import("@/registry/remocn/<name>").then(m => ({ default: m.<Export> }))` — the `.then` adapter normalizes named exports for `React.lazy`/`lazyComponent`.
- New entry shape: `{ load: () => Promise<{ default: React.ComponentType }>, config: ComponentConfig }`. Export the map under the same default export name so import sites keep their specifier.
- Entries whose Component is a docs example scene (`*ExampleScene`) lazy-import from `@/components/docs/examples/<file>` the same way.

This is 140 mechanical edits — script it mentally, apply consistently; biome will format.

**Verify**: `bunx tsc --noEmit` → errors ONLY in the map's importers (shape change), none inside `__index__.tsx`.

### Step 4: Adapt the importers

For each importer, two idioms:
- Player call sites (bento-registry, interactive-code, previews): prefer `<Player lazyComponent={entry.load} .../>` if the installed d.ts supports it; otherwise `const C = useMemo(() => React.lazy(entry.load), [entry])` rendered inside the existing wrapper with a `<Suspense fallback={null}>`.
- Non-player uses (e.g. `component-card.tsx`, the stars tool, anything reading only `config`): config reads need no change; component reads follow the same lazy idiom.
- bento-registry's `BackdroppedComposition` wrapper (lines 90-100) composes the loaded component — adapt it to wrap the lazy component, preserving Plan 012's `containerRef`.

**Verify**: `bunx tsc --noEmit` → clean. `bun dev` → `/` renders all bento/interactive previews; a docs component page renders its preview with the customizer working (change one control value).

### Step 5: Decide on the examples barrels

After Phase A, `components/docs/examples/index.tsx` is still imported by docs surfaces. Check who imports it now (`grep -rln "docs/examples\"" app components`). If only docs preview components remain AND their entries went lazy via Step 3-4, the barrel's scenes are no longer statically reachable from the landing bundle — measure first (Step 6) and only restructure the barrel too if it still shows up in landing chunks.

**Verify**: decision recorded with the grep + measurement evidence.

### Step 6: Measure and gate

`bun run build`; compare with Step 1.

**Verify**: `/` first-load JS reduced substantially (expect several hundred KB+); `bun run test` unchanged; typecheck clean. Record before/after numbers in `plans/README.md`.

## Test plan

Existing registry tests (`bun test registry`) cover component logic and configs — they import components directly and are unaffected by the map change; they must stay green. The load-bearing verification is the dev smoke (Step 4) + build route sizes (Step 6). No new unit tests — the change is import topology.

## Done criteria

- [ ] `registry/__index__.tsx` contains zero static component imports (only config imports + lazy loaders): `grep -c "^import {" registry/__index__.tsx` reflects configs/types only
- [ ] All importers typecheck and render (dev smoke on `/` and one docs page with working customizer)
- [ ] `/` first-load JS measurably reduced; numbers recorded in README
- [ ] `bun run test` 0 fail; `bun run build` exit 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- `@remotion/player@4.0.473` lacks `lazyComponent` AND `React.lazy` inside Player causes remount/flicker loops in dev smoke — report with the observed behavior.
- The customizer (`ui-component-preview.tsx` / `component-preview.tsx`) turns out to need the COMPONENT (not just config) synchronously for snippet generation — report the exact call path before redesigning.
- `scripts/render-demos.mts` / `src/remotion` break in a way that needs more than adapting to the `{ load, config }` shape.
- Step 6 shows no meaningful size reduction — the analysis premise failed; report bundle composition instead of proceeding to Step 5 restructuring.

## Maintenance notes

- Adding a registry component now means adding a `config` import + a `load` entry — update the how-to-add-a-component notes the repo keeps (skills/docs) accordingly.
- Deferred follow-up: `registry/remocn/github-stars/index.tsx` is 1,197 lines and the sole date-fns consumer — replacing its date-fns call with a small relative-time formatter would drop that dep from user installs too (it ships via shadcn add). Separate small plan if wanted.
- Reviewer: spot-check three previews of different kinds (shader, text animation, ui atom) in the deployed preview build; lazy-loading bugs are per-entry typos, not systemic.
