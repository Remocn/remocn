# `tooltip` — verification tests

Pure / deterministic verification for the `tooltip` component
(`registry/remocn-ui/tooltip/`). The render path (`index.tsx`) imports
`useRemocnTheme` which requires React context and cannot run headlessly — it
is NOT exercised here. This suite covers everything that IS pure:
`tooltipStyle` presets, `tweenTooltipStyle` interpolation, the
`useTooltipTransition` pure resolver mirror, and `tooltipConfig` controls
wiring + snippet codegen.

## Animation model — state atom with smooth opt-in

Tooltip follows the standard state-atom pattern (see STYLE-GUIDE §1):

**Snap path** (`state?: TooltipState` prop):  
`<Tooltip>` is a frame-free pure renderer. The `state` prop drives all
visuals. Each state maps to a complete resting keyframe via the exported pure
function `tooltipStyle(state) => TooltipStyle`. State changes snap — no
tweening inside the component.

**Smooth path** (`style?: TooltipStyle` prop):  
Callers opt in to smooth show/hide by passing a pre-interpolated `TooltipStyle`
to the `style` prop. The caller — typically `useTooltipTransition` — reads
`useCurrentFrame()` via `useStateTransition`, applies `easings.out` to the
raw linear progress, and blends the two state presets via
`tweenTooltipStyle(from, to, t)`. The `<Tooltip>` component remains
frame-free; it renders whatever `TooltipStyle` it receives.

**No color tween:** `TooltipStyle` carries only `opacity`, `scale`, and
`translate` — all numeric. The bubble background/foreground are derived
from `theme.primary`/`theme.primaryForeground` and do not animate, so
`tweenTooltipStyle` is a simple three-field lerp with no `mixOklch` call.

**`translate` is a magnitude, not a vector.** The `TooltipStyle.translate`
field holds a single pixel magnitude (4 hidden → 0 visible). The private
`offsetFor(side, translate)` function inside `index.tsx` converts this
magnitude into a signed `(x, y)` offset so the bubble slides toward the
anchor from its own side. `offsetFor` is not exported; its per-side contract
is documented below and verified indirectly through the render path.

**`offsetFor` contract (documented for grep-based verification):**

| `side`   | `x`         | `y`         | bubble enters from     |
|----------|-------------|-------------|------------------------|
| `top`    | 0           | +translate  | above the anchor       |
| `bottom` | 0           | −translate  | below the anchor       |
| `left`   | +translate  | 0           | left of the anchor     |
| `right`  | −translate  | 0           | right of the anchor    |

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/tooltip/__tests__
```

`tooltip.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test script
or framework dep is added to `package.json`.

## What is covered

- **`DEFAULT_DURATION`** — asserts the constant is 8 frames.

- **`tooltipStyle` presets** — exported pure `(state) => TooltipStyle`.
  Asserts every field for every state: `hidden` gives `{opacity:0, scale:0.96,
  translate:4}`; `visible` gives `{opacity:1, scale:1, translate:0}`. Also
  asserts all fields are numeric for every state, that the two states have
  distinct values on every field (no silent identity), and that the unknown
  state falls through to the `hidden` preset.

- **`tweenTooltipStyle`** — exported pure `(a, b, t) => TooltipStyle`.
  Asserts: at t=0 all three fields equal `a`; at t=1 all equal `b`; at t=0.5
  each field is the exact midpoint (`opacity` 0→1 gives 0.5, `scale` 0.96→1
  gives 0.98, `translate` 4→0 gives 2); at t=0.25 gives 0.25/0.97/3;
  identity case (a===b, any t) preserves all fields. Also covers the reverse
  direction (visible→hidden dismiss).

- **`useTooltipTransition` resolver replica** — `resolveTooltipTransition`
  mirrors `use-tooltip-transition.ts` lines 48-61 with `raw` injected in place
  of `useCurrentFrame()`. The replica re-derives only the logic BEYOND the core
  `useStateTransition` (already tested in `core/__tests__/timeline.test.ts`);
  the key additional contract is that `progress` is eased with `easings.out`
  before the tween. Asserts: before any step → hidden style with both endpoints
  `hidden`; exactly at a step boundary → progress=0 → t=out(0)=0 → style
  equals `hidden` keyframe; mid-window at raw=4/dur=8 (linear progress=0.5) →
  t=out(0.5)=0.875 → opacity=0.875 (not linear 0.5), scale=0.995,
  translate=0.5; past the window → fully visible style; speed contract (speed=2
  halves the raw frame to reach a step).

- **`tooltipConfig.controls`** — control wiring assertions: `state` is a
  `select` with options `["hidden","visible"]` and default `"visible"`; `side`
  is a `select` with options `["top","bottom","left","right"]` and default
  `"top"`; `mode` is a `select` with options `["light","dark"]` and default
  `"light"`; `label` is a `text` control with default `"Add to library"`.

- **`tooltipConfig.snippet`** — pure JSX string builder. Asserts: `import {
  Tooltip }` from the correct path; `<Tooltip` element and closing `/>` always
  present; `state` is always emitted; `label` is always emitted (it is a
  required prop, including when equal to the default); non-default label emits
  the provided string; default `side="top"` and `mode="light"` are omitted;
  non-default side and mode are emitted; all state options round-trip correctly;
  all non-default side options round-trip correctly.

**Tooltip render** is a pure `(style | state, side) => visual` observable only
via Remotion render; it is not unit-tested here.

## Import strategy

`tooltip.test.ts` imports via **relative paths** and the `@/lib/remocn-ui`
alias:

- `../index` — relative, for `tooltipStyle`, `TooltipState`, `TooltipSide`
- `../use-tooltip-transition` — relative, for `tweenTooltipStyle`,
  `DEFAULT_DURATION`
- `../config` — relative, for `tooltipConfig`
- `@/lib/remocn-ui` — alias, for `defaultLightTheme`, `defaultDarkTheme`,
  `easings`, and `Step` type

`useTooltipTransition` is NOT imported — it calls `useStateTransition` which
reads `useCurrentFrame()`. Its pure logic is mirrored as
`resolveTooltipTransition` with the frame injected as `raw`. `bun test`
resolves tsconfig `paths`, so the alias works without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

`tooltip/index.tsx` is a pure renderer — the component must contain **none**
of the following:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/tooltip/index.tsx
```

Expected: **no output**. Any match is a determinism violation.

`use-tooltip-transition.ts` is the caller hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). That is correct and expected;
the smooth-path design isolates all frame-reading to the hook, keeping
`<Tooltip>` pure.

Tier-wide sweep for `index.tsx`:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/tooltip/index.tsx registry/remocn-ui/core/*.ts
```
