# `progress` — verification tests

Pure / deterministic verification for the `progress` component
(`registry/remocn-ui/progress/`). The render path (`index.tsx`) imports
`useRemocnTheme` which requires React context and cannot run headlessly — it
is NOT exercised here. This suite covers everything that IS pure:
`clampValue` semantics, `showLabel` floor rounding, `tweenProgressStyle`
interpolation, the `progressValueAt` pure core (directly exported), and
`progressConfig` controls wiring + snippet codegen.

## Animation model — value-channel deviation

Progress follows the **value-channel deviation** from the standard state-atom
pattern (STYLE-GUIDE §0), like `cursor`:

**Snap path** (`value?: number` prop):  
`<Progress>` is a frame-free pure renderer. The `value` prop (0–100, clamped)
drives the fill width. Changes snap — no tweening inside the component.

**Smooth path** (`style?: ProgressStyle` prop):  
Callers opt in to smooth fills by passing a pre-interpolated `ProgressStyle`
(which has a single `value` field) to the `style` prop. The caller —
typically `useProgressTransition` — reads `useCurrentFrame()` and delegates
to the exported pure function `progressValueAt(steps, raw, opts)`.

**Key deviation from state atoms:** instead of a string-state timeline, the
hook folds a numeric value path (`ProgressStep[]`). Each step declares an
arrival frame (`at`) and a target fill percentage (`value`). Between steps,
the bar eases from the previous step's value to the current one using
`easings.out` by default (or a per-step override via the `easing` field).

**`progressValueAt` is directly exported** — unlike the `useToastTransition`
or `useTooltipTransition` hooks, whose pure bodies had to be replicated, the
progress hook exposes its pure core as a named export. The tests call it
directly with `raw` injected.

**No color tween:** `ProgressStyle` has a single field (`value: number`), so
`tweenProgressStyle` is a trivial single-field lerp with no `mixOklch` call.

## Segment fold logic

`progressValueAt` folds the timeline into a segment:

| Condition | Behaviour |
|-----------|-----------|
| `steps` is empty | returns `{ value: 0 }` |
| `raw <= first.at` | holds at `first.value` (no teleport) |
| `raw >= last.at` | rests at `last.value` (`t=1`, pastLast) |
| in a segment `[from, to)` | `t = ease(clamp01((raw - start) / dur))` where `start = to.at - dur` |

The default easing is `easings.out` (cubic ease-out: `1 - (1-t)³`), making
mid-window values non-linear (e.g. linear progress 0.5 → `out(0.5) = 0.875`).

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/progress/__tests__
```

`progress.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test
script or framework dep is added to `package.json`.

## What is covered

- **`DEFAULT_DURATION`** — asserts the constant is 24 frames.

- **`clampValue` semantics** — mirrored from `index.tsx` lines 43-45
  (`clamp01(value/100)*100`). Asserts: below-range values clamp to 0 (e.g.
  -10→0, -0.001→0); above-range values clamp to 100 (e.g. 110→100,
  100.001→100); in-range values pass through unchanged (0, 50, 62, 99.9, 100).

- **`showLabel` floor** — the label renders `Math.floor(v)%` (index.tsx line
  113). Asserts: 62.7→62, 99.9→99 (does NOT round up), 0→0, 100→100, 87.5→87.

- **`tweenProgressStyle`** — exported pure `(a, b, t) => ProgressStyle`.
  Single-field lerp (`value` only, no color channels). Asserts: t=0 equals a,
  t=1 equals b, t=0.5 midpoints (0→100 gives 50, 25→75 gives 50), t=0.25
  (0→100 gives 25), identity case (a===b preserves value), decreasing direction
  (100→0 at t=0.5 gives 50).

- **`progressValueAt`** — exported pure core of `useProgressTransition`.
  `useProgressTransition` is exactly `progressValueAt(steps, useCurrentFrame() *
  speed, opts)`. Asserts:
  - Empty steps → `{value:0}` for any frame.
  - Before first step (raw ≤ first.at) → holds at `first.value`.
  - Past last step (raw ≥ last.at) → rests at `last.value`.
  - Mid-window easing: `[{at:0,v:0},{at:24,v:100}]` at raw=12 → linear=0.5,
    `out(0.5)=0.875` → `value=87.5` (not linear 50).
  - Easing confirmed non-linear: value ≠ 50 at the linear midpoint.
  - Step boundary at last step (raw=last.at → pastLast=true → t=1 → value=last).
  - Two-step timeline mid-second segment: `raw=36` in `[24→48]` gives 93.75.
  - Custom `duration` on a step overrides `DEFAULT_DURATION`.
  - Past last with multiple steps → rests at the final step's value.

- **`progressConfig.controls`** — control wiring: `value` is a `number`
  control with default=62, min=0, max=100; `width` is a `number` control with
  default=320, min=120, max=640; `showLabel` is a `boolean` control with
  default=true; `mode` is a `select` with options `["light","dark"]` and
  default `"light"`.

- **`progressConfig.snippet`** — pure JSX string builder. Asserts: `import {
  Progress }` from the correct path; `<Progress` element and closing `/>`;
  `value` is always emitted (including 0 and when omitted from values);
  default `width=320` and `mode="light"` are omitted; `showLabel` is omitted
  when false/undefined; non-default width, mode, and showLabel (as a boolean
  shorthand attribute, not `showLabel={true}`) are emitted; value numeric
  round-trip for 0/25/50/75/100.

**Progress render** is a pure `(value | style) => visual` observable only via
Remotion render; it is not unit-tested here.

## Import strategy

`progress.test.ts` imports via **relative paths** and the `@/lib/remocn-ui`
alias:

- `../use-progress-transition` — relative, for `tweenProgressStyle`,
  `progressValueAt`, `DEFAULT_DURATION`, `ProgressStep`
- `../config` — relative, for `progressConfig`
- `@/lib/remocn-ui` — alias, for `easings`, `clamp01`

`useProgressTransition` is NOT imported — it calls `useCurrentFrame()`. Its
pure body is the named export `progressValueAt`, which is called directly.
`bun test` resolves tsconfig `paths`, so the alias works without additional
config.

## Determinism grep checklist (run manually; must print NOTHING)

`progress/index.tsx` is a pure renderer — the component must contain **none**
of the following:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/progress/index.tsx
```

Expected: **no output**. Any match is a determinism violation.

`use-progress-transition.ts` intentionally reads `useCurrentFrame()` (in
`useProgressTransition`). That is correct and expected; the smooth-path design
isolates all frame-reading to the hook, keeping `<Progress>` pure. The
exported `progressValueAt` is frame-free and testable directly.

Tier-wide sweep for `index.tsx`:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/progress/index.tsx registry/remocn-ui/core/*.ts
```
