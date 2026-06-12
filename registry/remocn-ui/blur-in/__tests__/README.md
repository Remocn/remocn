# `blur-in` — verification tests

Pure / deterministic verification for the `blur-in` component
(`registry/remocn-ui/blur-in/`). The RENDER path needs Remotion's
`useCurrentFrame()` and cannot run headless, so the render is NOT exercised
here. This suite covers the pieces that ARE pure: `BlurInState` union
membership, `blurInConfig.controls` wiring, `blurInConfig.snippet` codegen,
`blurInStyleContext` (direction → axis/sign), `blurInStyle` presets, and
`tweenBlurInStyle` interpolation.

## Animation model — pure snap + opt-in smooth path

BlurIn ships two complementary paths:

**Snap path** (`state?: BlurInState` prop):
`BlurIn` is a frame-free pure renderer. The `state` prop (`hidden` | `revealed`)
drives all visuals. Each state maps to a complete resting visual via the
exported pure function `blurInStyle(state, ctx) => BlurInStyle`. State changes
snap instantly — no tweening inside the component.

**Smooth path** (`style?: BlurInStyle` prop):
Callers opt in to smooth transitions by passing a pre-interpolated `BlurInStyle`
to the `style` prop. The caller — typically `useBlurInTransition` — reads
`useCurrentFrame()` and calls `useStateTransition` from `core/timeline.ts` to
compute `{ from, to, progress }`, then blends the two presets via
`tweenBlurInStyle(from, to, t)`. The `BlurIn` component itself remains
frame-free; it simply renders whatever `BlurInStyle` it receives.

## Theme-independence (the one deviation)

Unlike the other state atoms (Button, Input, …), `blur-in` is
**THEME-INDEPENDENT**. It carries no colors and has no `theme`/`mode`/`primary`
props. Its "context" (`BlurInStyleContext`) is a MOTION config —
`{ blur, distance, axis, sign }` — derived from the `direction`, not a theme.
So this suite imports no theme fixture; the presets are tested with plain
`blurInStyleContext(blur, direction, distance)` calls.

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/blur-in/__tests__
```

`blur-in.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test script
or framework dep is added to `package.json`.

## What is covered

- **`BlurInState` union** — asserts the two states `["hidden","revealed"]` are
  the complete set (via the real `controls.state.options` list from `config.ts`).
- **`blurInConfig.controls`** — the customizer control wiring. Asserts the
  `state` select (options `["hidden","revealed"]`, default `"revealed"`), the
  `direction` select (`["up","down","left","right"]`, default `"up"`), and the
  numeric `blur` (default 8, range [0,40]) and `distance` (default 12, range
  [0,80]) knobs.
- **`blurInStyleContext`** — exported pure `(blur, direction, distance) => ctx`.
  Asserts each direction's axis/sign: up→y/+1, down→y/−1, left→x/+1, right→x/−1,
  and that blur/distance pass straight through.
- **`blurInStyle` presets** — exported pure `(state, ctx) => BlurInStyle` map.
  Asserts `revealed` is always `{blur:0,opacity:1,translateX:0,translateY:0}`
  (direction-independent) and `hidden` carries `ctx.blur`, opacity 0, and the
  directional offset (`ctx.sign * ctx.distance`) on the ctx axis (other axis 0),
  for all four directions. Also: `distance=0` disables the offset.
- **`tweenBlurInStyle`** — exported pure `(a, b, t) => BlurInStyle`. Asserts:
  at t=0 all four numeric fields equal `a`; at t=1 all equal `b`; at t=0.5 each
  numeric field is the exact midpoint (blur 8→0 gives 4, opacity 0→1 gives 0.5,
  translateY 12→0 gives 6 on the y axis, translateX 12→0 gives 6 on the x axis).
- **`blurInConfig.snippet`** — REAL pure string builder. Asserts: emits
  `state="<state>"` for every option; includes `import { BlurIn }` from
  `@/components/remocn/blur-in`; omits default-equal props (`direction=up`,
  `blur=8`, `distance=12`); never emits the preview-only `speed` knob; EMITS
  non-default `direction`/`blur`/`distance`; structural round-trip (starts with
  import, contains `<BlurIn`, closes with `</BlurIn>`).

**BlurIn render** is a pure `(style | state) => visual` observable only via
Remotion render, not unit-tested here.

## Import strategy

`blur-in.test.ts` imports via **relative paths**:

- `../index` — for `BlurInState`, `BlurInDirection`, `blurInStyle`, `blurInStyleContext`
- `../use-blur-in-transition` — for `tweenBlurInStyle`
- `../config` — for `blurInConfig`

Importing `index.tsx` and `use-blur-in-transition.ts` pulls the `remotion`
module (and React), but neither `blurInStyle`, `blurInStyleContext`, nor
`tweenBlurInStyle` call `useCurrentFrame()` at import time or at call time —
they are pure value functions. `bun test` resolves tsconfig `paths`, so the
`@/lib/remocn-ui` and `@/components/remocn/blur-in` aliases the hook uses work
without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

BlurIn is frame-free. The component must contain **none** of the following:

```bash
grep -nE "useCurrentFrame|useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/blur-in/index.tsx
```

Expected: no output. Any match is a determinism violation.

`use-blur-in-transition.ts` is the CALLER hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). It is not a render component;
the smooth-path design isolates all frame-reading to the hook, keeping
`BlurIn` pure.
