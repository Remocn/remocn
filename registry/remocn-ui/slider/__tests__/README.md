# `slider` — verification tests

Pure / deterministic verification for the `slider` component
(`registry/remocn-ui/slider/`). The render path (`index.tsx`) imports
`useRemocnTheme` which requires React context and cannot run headlessly — it
is NOT exercised here. This suite covers everything that IS pure:
`clampValue` semantics, `sliderThumbStyle` presets, `sliderStyleContext`
color derivation, `tweenSliderStyle` interpolation, the `sliderStyleAt`
dual-channel pure core (directly exported), and `sliderConfig` controls
wiring + snippet codegen.

## Animation model — dual-channel value atom

Slider follows the **dual-channel value-channel deviation** (STYLE-GUIDE §0):
both the numeric fill (`value`) and the thumb interaction state
(`thumbScale`, `ringOpacity`) are animated and live in one `SliderStyle`.

**Snap path** (`value?: number` + `thumbState?: SliderThumbState` props):  
`<Slider>` is a frame-free pure renderer. `value` drives the fill width
(clamped to [0,100]), and `thumbState` selects a thumb preset via
`sliderThumbStyle`. Changes snap — no tweening inside the component.

**Smooth path** (`style?: SliderStyle` prop):  
Callers opt in to smooth animation by passing a pre-interpolated `SliderStyle`
to the `style` prop. The caller — typically `useSliderTransition` — reads
`useCurrentFrame()` and delegates to the exported pure function
`sliderStyleAt(steps, raw, opts)`.

**Dual-channel fold:** `sliderStyleAt` filters the step list into two
independent sub-timelines and folds them separately:
- **Value channel**: only steps with `value !== undefined` (numeric easing)
- **Thumb channel**: only steps with `thumbState !== undefined` (tweens
  between `sliderThumbStyle` presets)

Both channels are merged into one `SliderStyle` result. A step may move
both channels simultaneously.

**`sliderStyleAt` is directly exported** — like `progressValueAt`, its pure
core is a named export and tests call it directly with `raw` injected.

**No color tween:** `SliderStyle` has only numeric fields (`value`,
`thumbScale`, `ringOpacity`), so `tweenSliderStyle` is a simple three-field
lerp with no `mixOklch` call. Color derivation (`sliderStyleContext`) uses
`mixOklch` once to compute the grab ring but is static per render.

## Thumb state presets

| `thumbState` | `thumbScale` | `ringOpacity` |
|-------------|-------------|---------------|
| `idle`      | 1           | 0             |
| `hover`     | 1.1         | 1             |
| `press`     | 1.15        | 1             |

Ordering invariant: `press.thumbScale > hover.thumbScale > idle.thumbScale`.
Both `hover` and `press` have `ringOpacity = 1`.

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/slider/__tests__
```

`slider.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test
script or framework dep is added to `package.json`.

## What is covered

- **`DEFAULT_DURATION`** — asserts the constant is 18 frames.

- **`clampValue` semantics** — mirrored from `index.tsx` lines 53-55.
  Below-range clamps to 0; above-range clamps to 100; in-range passes through.

- **`showValue` label** — `Math.round(pct)` (index.tsx line 218). Asserts
  62.4→62, 62.5→63 (rounds up), 99.9→100, 0→0.

- **`sliderThumbStyle`** — exported pure `(thumbState) => {thumbScale,
  ringOpacity}`. Asserts all three presets (idle: 1/0, hover: 1.1/1,
  press: 1.15/1); ordering invariant (press > hover > idle); hover and press
  have identical ringOpacity=1; all fields numeric for every state.

- **`sliderStyleContext`** — exported pure `(theme) => SliderStyleContext`
  (post-shadcn retheme). Field set: `track` (mixOklch of input+background,
  bg-input/90, differs light/dark), `range` (theme.primary), `thumbBg`
  (literal `"oklch(1 0 0)"` — shadcn white thumb, theme-independent),
  `thumbRing` (literal `"rgba(0, 0, 0, 0.1)"` — resting hairline,
  theme-independent), `ring` (mixOklch of theme.ring+background at 0.7,
  ring-ring/30, differs light/dark), `valueText` (theme.foreground). Asserts:
  thumbBg and thumbRing are exact literals in both light and dark; track and
  ring differ between themes; all 6 fields are non-empty strings. Note:
  `thumbBorder` was removed in the retheme; the hairline is now `thumbRing`.

- **`tweenSliderStyle`** — exported pure `(a, b, t) => SliderStyle`.
  Three-field lerp (value + thumbScale + ringOpacity). Asserts: t=0/1
  endpoints, t=0.5 midpoints (value 0→100 gives 50, thumbScale 1→1.1 gives
  1.05, ringOpacity 0→1 gives 0.5), identity case, idle→press thumb channel
  (thumbScale midpoint = 1.075).

- **`sliderStyleAt`** — exported pure dual-channel core of
  `useSliderTransition`. `useSliderTransition` is exactly
  `sliderStyleAt(steps, useCurrentFrame() * speed, opts)`. Asserts:
  - Empty steps → `{value:0, thumbScale:1(idle), ringOpacity:0(idle)}`.
  - Before first value step (raw ≤ first.at) → holds at `first.value`.
  - Before first thumb step → holds at `first.thumbState` preset.
  - Past last value step → rests at `last.value`.
  - Value channel mid-window: `[{at:0,v:0},{at:18,v:100}]` at raw=9 →
    linear=0.5, `out(0.5)=0.875` → value=87.5 (not linear 50).
  - Thumb channel mid-window: `[{at:0,idle},{at:18,hover}]` at raw=9 →
    thumbScale=1.0875, ringOpacity=0.875.
  - Dual-channel steps fold independently — both channels active in same
    step list; value-only steps leave thumb at idle; thumb-only steps leave
    value at 0.
  - Past last with both channels → rests at last step's values.

- **`sliderConfig.controls`** — control wiring: value (number, default=40,
  min=0, max=100), thumbState (select, options=["idle","hover","press"],
  default="idle"), width (number, default=320), showValue (boolean,
  default=true), mode (select, default="light").

- **`sliderConfig.snippet`** — pure JSX string builder. Asserts: `import {
  Slider }` from correct path; `<Slider` + closing `/>`; value always emitted
  (including 0 fallback); default thumbState="idle"/width=320/mode="light"
  omitted; showValue omitted when false/undefined; non-defaults emitted;
  showValue as boolean shorthand (not `showValue={true}`); thumbState and
  value numeric round-trips.

**Slider render** is a pure `(value | style, thumbState) => visual` observable
only via Remotion render; it is not unit-tested here.

## Import strategy

`slider.test.ts` imports via **relative paths** and the `@/lib/remocn-ui`
alias:

- `../index` — relative, for `sliderThumbStyle`, `sliderStyleContext`,
  `SliderThumbState`
- `../use-slider-transition` — relative, for `tweenSliderStyle`,
  `sliderStyleAt`, `DEFAULT_DURATION`, `SliderStep`
- `../config` — relative, for `sliderConfig`
- `@/lib/remocn-ui` — alias, for `defaultLightTheme`, `defaultDarkTheme`,
  `easings`, `clamp01`

`useSliderTransition` is NOT imported — it calls `useCurrentFrame()`. Its
pure body is the named export `sliderStyleAt`, which is called directly.
`bun test` resolves tsconfig `paths`, so the alias works without additional
config.

## Determinism grep checklist (run manually; must print NOTHING)

`slider/index.tsx` is a pure renderer — the component must contain **none**
of the following:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/slider/index.tsx
```

Expected: **no output**. Any match is a determinism violation.

`use-slider-transition.ts` intentionally reads `useCurrentFrame()` (in
`useSliderTransition`). That is correct and expected; the smooth-path design
isolates all frame-reading to the hook, keeping `<Slider>` pure. The exported
`sliderStyleAt` is frame-free and testable directly.

Tier-wide sweep for `index.tsx`:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/slider/index.tsx registry/remocn-ui/core/*.ts
```
