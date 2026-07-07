# `remocn-ui` core — verification tests (Iteration 1)

Pure / deterministic verification for the `ui` tier core lib
(`registry/remocn-ui/core/`). Covers the hand-rolled OKLCH color math and the
timeline fold semantics. No React / Remotion render required.

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install                              # color.ts now imports `culori`
bun test registry/remocn-ui/core/__tests__
```

`color.ts` was rewritten to wrap the **`culori`** package, which is already
declared in `package.json` (`culori` + `@types/culori`). Run `bun install`
first so it lands in `node_modules`, or `color.test.ts` will fail to resolve the
import. The test runner itself needs no third-party dep: these tests import
`bun:test`, not any external framework. A `test` script (`bun test`) is defined
in `package.json`; run the whole suite with `bun run test`.

> The repo standardizes on `bun:test` as the single test framework — one runner,
> no extra test-framework dependency.

## What is covered

- `color.test.ts` — imports the REAL `color.ts` (pure, no remotion). Now a
  `culori` wrapper exposing culori's NATIVE shapes/scales: `Rgb` objects are
  `{ mode:"rgb", r, g, b, alpha }` with channels in **0..1** (NOT 0..255),
  `Oklch` objects are `{ mode:"oklch", l, c, h, alpha? }` (lowercase l/c/h,
  achromatic hue normalized to `0`), and `rgbToOklch` takes an `Rgb` OBJECT.
  Assertions are PROPERTY-BASED and tolerance-based in the 0..1 scale
  (`TOL = 0.01 ≈ 2/255`), immune to culori's 8-bit rounding / version drift:
  - `mixOklch` endpoints (`t=0`≈a, `t=1`≈b within `TOL`, alpha within 0.01).
    `mixOklch` still returns an inline CSS string; `rgbOf` parses culori's
    `formatRgb` output (0..255 ints) back to 0..1 for comparison.
  - OKLCH midpoint ≠ naive sRGB lerp: black↔white@0.5 is neutral (`r≈g≈b`) and
    clears the naive 0..1 sRGB midpoint `0.5` by a real margin (`>0.039`,
    i.e. >10/255), and equals the module's own `oklchToRgb(0.5,0,0)`
    (self-consistent, no magic number).
  - shortest-arc hue (350↔10 → ~0/360, not ~180), neutral-hold (gray↔gray stays
    gray; gray↔chromatic carries the chromatic hue). Hue read via
    `rgbToOklch({ mode:"rgb", r, g, b })`.
  - `oklchToRgb` anchors: only the gamut corners are checked (`oklch(1 0 0)`→
    white `r≈g≈b≈1`, `oklch(0 0 0)`→black `r≈g≈b≈0`); mid-lightness neutrals
    asserted as properties (neutral + monotonic, thresholds in 0..1), never
    pinned.
  - theme-override AC (§6): `oklchToRgb(0.205,0,0)` ≈ `parseColor("oklch(0.205
    0 0)")` within `TOL` — value computed from the module itself, immune to
    culori version drift.
  - `rgb`/`oklch` round-trip via `rgbToOklch(oklchToRgb(...))` taking the `Rgb`
    object (l/c/h recovered within tol; achromatic hue normalized to `0`),
    `parseColor` formats (hex/rgb/oklch + alpha in 0..1, `var()` and unparseable
    → black-sentinel `{ mode:"rgb", r:0, g:0, b:0, alpha:1 }` no throw, default
    alpha 1), `toCss` (culori `formatRgb` LEGACY comma syntax with 0..255 int
    channels: `rgb(255, 128, 0)` opaque, `rgba(10, 20, 30, 0.5)` when alpha < 1,
    plus a re-parse round-trip guard), `mixOklch` alpha interpolation.
- `timeline.test.ts` — `framesFor` / `revealCount` as exact spec mirrors, plus
  two pure resolver replicas (each factoring out the single impure
  `useCurrentFrame()` line as an injected `raw` arg):
  - **`resolveCurrentState`** (mirrors `useCurrentState`): speed contract
    (`{at:30}` fires at raw frame 15 when `speed=2`), default-state before
    first step, exact-frame activation, latest-started-wins, same-`at` ties
    (later array entry wins).
  - **`resolveStateTransition`** (mirrors `useStateTransition`): before-any-step
    → `{from:default, to:default, progress:1}`; at step boundary →
    `progress=0`; mid-window → fractional progress (concrete numeric);
    past window → `progress=1` held; per-step `duration` overrides
    `defaultDuration`; `duration:0` snaps to `progress=1`; chained steps carry
    `from=previous-step state`; same-`at` ties (later array wins); `speed=2`
    scales the playhead (effective frame, not authored `at`).

## Determinism grep checklist (run manually; must print NOTHING)

The `ui` tier contract is "pure function of `useCurrentFrame()`" (plan §6). No
React state, no DOM events, no wall-clock, no randomness anywhere in the tier
source. Verify with:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/button/index.tsx registry/remocn-ui/core/*.ts
```

Expected: no output (exit code 1). Any match is a determinism violation.
(Verified clean on the source as of Iteration 1.)
