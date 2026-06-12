# `button` — verification tests

Pure / deterministic verification for the `button` component
(`registry/remocn-ui/button/`). The RENDER path needs Remotion's
`useCurrentFrame()` and cannot run headless, so the render is NOT exercised
here. This suite covers the pieces that ARE pure: `ButtonState` union
membership, `buttonConfig.controls.state` wiring, `buttonConfig.snippet`
codegen, `buttonStyle` presets, and `tweenButtonStyle` interpolation.

## Animation model — pure snap + opt-in smooth path

Button ships two complementary paths:

**Snap path** (`state?: ButtonState` prop):  
`Button` is a frame-free pure renderer. The `state` prop drives all visuals.
Each state maps to a complete resting visual via the exported pure function
`buttonStyle(state, ctx) => ButtonStyle`. State changes snap instantly — no
tweening inside the component.

**Smooth path** (`style?: ButtonStyle` prop):  
Callers opt in to smooth transitions by passing a pre-interpolated `ButtonStyle`
to the `style` prop. The caller — typically `useButtonTransition` — reads
`useCurrentFrame()` and calls `useStateTransition` from `core/timeline.ts` to
compute `{ from, to, progress }`, then blends the two presets via
`tweenButtonStyle(from, to, t)`. The `Button` component itself remains
frame-free; it simply renders whatever `ButtonStyle` it receives.

This design keeps `Button` pure-testable (no Remotion render context needed)
while still supporting smooth enter-transitions for production use.

The loading spinner lives in the separate `<Spinner/>` **motion atom** which
reads `useCurrentFrame()` internally — that is correct and expected for motion
atoms. See `registry/remocn-ui/spinner/__tests__/README.md`.

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/button/__tests__
```

`button.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test script
or framework dep is added to `package.json`.

## What is covered

- **`ButtonState` union** — asserts the five states
  `["idle","hover","press","loading","success"]` are the complete set (via the
  real `controls.state.options` list from `config.ts`).
- **`buttonConfig.controls.state`** — the customizer control wiring. Asserts a
  `select` control exists with exactly those five options, default `"loading"`
  (so the preview showcases the live Spinner), and that every option is a
  member of the `ButtonState` union.
- **`buttonConfig.snippet`** — REAL pure string builder (high value).
  Asserts: emits `state="<state>"` as a bare JSX prop for every option; NEVER
  emits `steps` or `action`; includes `import { Button }` from
  `@/components/remocn/button`; omits default-equal props (`label=Continue`,
  `variant=default`, `size=default`, `mode=light`, `primary=#171717`); EMITS
  non-default `label`/`variant`/`size`/`mode`/`primary`; structural round-trip
  (starts with import, contains `<Button`, ends `/>`).
- **`buttonStyle` presets** — exported pure `(state, ctx) => ButtonStyle` map.
  A `ButtonStyleContext` is built from `buttonStyleContext("default",
  defaultLightTheme)` — the same call the component makes internally. Asserts
  per-state numeric/opacity invariants (translateY, scale, labelOpacity,
  spinnerOpacity, checkOpacity) and that `background` is always a non-empty
  string. Also asserts the sum of the three opacity fields equals 1 for every
  state (exactly one of label/spinner/check is visible at any resting state).
- **`tweenButtonStyle`** — exported pure `(a, b, t) => ButtonStyle`. Asserts:
  at t=0 all numeric fields equal `a`; at t=1 all equal `b`; at t=0.5 each
  numeric field is the exact midpoint (e.g. translateY 0→−1 gives −0.5,
  scale 1→0.97 gives 0.985, spinnerOpacity 0→1 gives 0.5). `background` at
  all t is a non-empty string (the oklch mix value is not hardcoded).

**Button render** is a pure `(style | state) => visual` observable only via
Remotion render, not unit-tested here.

## Import strategy

`button.test.ts` imports via a mix of **relative paths** and the
**`@/lib/remocn-ui` tsconfig alias**:

- `../index` — relative, for `ButtonState`, `buttonStyle`, `buttonStyleContext`
- `../use-button-transition` — relative, for `tweenButtonStyle`
- `../config` — relative, for `buttonConfig`
- `@/lib/remocn-ui` — alias (resolves to `registry/remocn-ui/core/index.ts`),
  for `defaultLightTheme`

Importing `index.tsx` and `use-button-transition.ts` pulls the `remotion`
module (and React), but neither `buttonStyle`, `buttonStyleContext`, nor
`tweenButtonStyle` call `useCurrentFrame()` at import time or at call time —
they are pure value functions. `bun test` resolves tsconfig `paths`, so the
alias works without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

Button is frame-free. The component must contain **none** of the following:

```bash
grep -nE "useCurrentFrame|useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/button/index.tsx
```

Expected: no output. Any match is a determinism violation.

`use-button-transition.ts` is the CALLER hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). It is not a render component;
the smooth-path design isolates all frame-reading to the hook, keeping
`Button` pure.

Tier-wide sweep:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/button/index.tsx registry/remocn-ui/core/*.ts
```
