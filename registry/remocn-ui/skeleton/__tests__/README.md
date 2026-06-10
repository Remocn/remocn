# `skeleton` — verification tests

Pure / deterministic verification for the `skeleton` component
(`registry/remocn-ui/skeleton/`). The render path (`index.tsx`) imports
`useRemocnTheme` and composes `SkeletonBlock` motion atoms — these require
React context and cannot run headlessly, so they are NOT exercised here. This
suite covers everything that IS pure: `skeletonStyle` presets + the crossfade
invariant, `tweenSkeletonStyle` interpolation, the `useSkeletonTransition`
pure resolver mirror, and `skeletonConfig` controls wiring + snippet codegen.

## Animation model — crossfade state atom

Skeleton follows the standard state-atom pattern (see STYLE-GUIDE §1) with a
two-field crossfade visual:

**Snap path** (`state?: SkeletonState` prop):  
`<Skeleton>` is a frame-free pure renderer. The `state` prop drives all
visuals. Each state maps to a complete resting keyframe via the exported pure
function `skeletonStyle(state) => SkeletonStyle`. State changes snap — no
tweening inside the component.

**Smooth path** (`style?: SkeletonStyle` prop):  
Callers opt in to smooth loading→loaded crossfades by passing a
pre-interpolated `SkeletonStyle` to the `style` prop. The caller — typically
`useSkeletonTransition` — reads `useCurrentFrame()` via `useStateTransition`,
applies `easings.out` to the raw linear progress, and blends the two state
presets via `tweenSkeletonStyle(from, to, t)`. The `<Skeleton>` component
remains frame-free; it renders whatever `SkeletonStyle` it receives.

**Crossfade invariant (§3):** every `SkeletonStyle` must satisfy
`skeletonOpacity + contentOpacity === 1`. This is true for both presets and
is preserved through `tweenSkeletonStyle` because a lerp of two complementary
pairs (`(1,0)` and `(0,1)`) always yields a complementary pair — the box
never dims during the transition.

**No color tween:** `SkeletonStyle` carries only `skeletonOpacity` and
`contentOpacity` — both numeric. There are no animated color channels, so
`tweenSkeletonStyle` is a simple two-field lerp with no `mixOklch` call.

**Motion atom boundary:** `<Skeleton>` itself reads no frame. Only the
composed `SkeletonBlock` motion atoms (the shimmer blocks inside the
placeholder layer) read `useCurrentFrame()`. This keeps `<Skeleton>` testable
as a pure renderer.

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/skeleton/__tests__
```

`skeleton.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test
script or framework dep is added to `package.json`.

## What is covered

- **`DEFAULT_DURATION`** — asserts the constant is 12 frames.

- **`skeletonStyle` presets** — exported pure `(state) => SkeletonStyle`.
  Asserts every field for every state: `loading` gives
  `{skeletonOpacity:1, contentOpacity:0}`; `loaded` gives
  `{skeletonOpacity:0, contentOpacity:1}`. Also asserts all fields are
  numeric for every state, that the two states have distinct values on every
  field, and crucially that **both presets satisfy the crossfade invariant**
  (`skeletonOpacity + contentOpacity === 1`).

- **`tweenSkeletonStyle`** — exported pure `(a, b, t) => SkeletonStyle`.
  Asserts: at t=0 both fields equal `a`; at t=1 both equal `b`; at t=0.5
  each field is the midpoint (`skeletonOpacity` 1→0 gives 0.5,
  `contentOpacity` 0→1 gives 0.5); at t=0.25 gives 0.75/0.25; identity case
  (a===b preserves values); reverse direction (loaded→loading). The
  **crossfade invariant is asserted at every t** (t=0, 0.1, 0.25, 0.333,
  0.5, 0.9, 1) — the sum always equals 1.

- **`useSkeletonTransition` resolver replica** — `resolveSkeletonTransition`
  mirrors `use-skeleton-transition.ts` lines 47-60 with `raw` injected in
  place of `useCurrentFrame()`. Asserts: before any step → loading style with
  both endpoints `loading`; exactly at a step boundary → progress=0 →
  t=out(0)=0 → style equals `loading` keyframe; mid-window at raw=6/dur=12
  (linear progress=0.5) → t=out(0.5)=0.875 → skeletonOpacity=0.125,
  contentOpacity=0.875 (not linear 0.5); crossfade invariant holds
  mid-window; past the window → fully loaded style; speed contract (speed=2
  halves the raw frame to reach a step).

- **`skeletonConfig.controls`** — control wiring assertions: `state` is a
  `select` with options `["loading","loaded"]` and default `"loading"`; `layout`
  is a `select` with options `["lines","card"]` and default `"card"`; `mode` is
  a `select` with options `["light","dark"]` and default `"light"`.

- **`skeletonConfig.snippet`** — pure JSX string builder. Asserts: `import {
  Skeleton }` from the correct path; `<Skeleton` element with a closing
  `</Skeleton>` tag (not self-closing — it wraps children); real-content
  placeholder comment; `state` is always emitted; default `layout="lines"` and
  `mode="light"` are omitted; `layout="card"` and `mode="dark"` are emitted;
  all state options round-trip; all non-default layout options round-trip.

**Skeleton render** is a pure `(style | state, layout) => visual` wrapping
`SkeletonBlock` motion atoms; it is not unit-tested here.

## Import strategy

`skeleton.test.ts` imports via **relative paths** and the `@/lib/remocn-ui`
alias:

- `../index` — relative, for `skeletonStyle`, `SkeletonState`, `SkeletonLayout`
- `../use-skeleton-transition` — relative, for `tweenSkeletonStyle`,
  `DEFAULT_DURATION`
- `../config` — relative, for `skeletonConfig`
- `@/lib/remocn-ui` — alias, for `defaultLightTheme`, `defaultDarkTheme`,
  `easings`, and `Step` type

`useSkeletonTransition` is NOT imported — it calls `useStateTransition` which
reads `useCurrentFrame()`. Its pure logic is mirrored as
`resolveSkeletonTransition` with the frame injected as `raw`. `bun test`
resolves tsconfig `paths`, so the alias works without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

`skeleton/index.tsx` is a pure renderer — the component must contain **none**
of the following:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/skeleton/index.tsx
```

Expected: **no output**. Any match is a determinism violation.

`use-skeleton-transition.ts` is the caller hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). That is correct and expected;
the smooth-path design isolates all frame-reading to the hook and to the
`SkeletonBlock` motion atoms, keeping `<Skeleton>` pure.

Tier-wide sweep for `index.tsx`:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/skeleton/index.tsx registry/remocn-ui/core/*.ts
```
