# `checkbox` — verification tests

Pure / deterministic verification for the `checkbox` component
(`registry/remocn-ui/checkbox/`). The RENDER path needs Remotion's
`useCurrentFrame()` and cannot run headless, so the render is NOT exercised
here. This suite covers the pieces that ARE pure: `CheckboxState` union
membership, `checkboxConfig.controls.state` wiring, `checkboxConfig.snippet`
codegen, `checkboxStyle` presets, and `tweenCheckboxStyle` interpolation.

## Animation model — pure snap + opt-in smooth path

Checkbox ships two complementary paths:

**Snap path** (`state?: CheckboxState` prop):
`Checkbox` is a frame-free pure renderer. The `state` prop drives all visuals.
Each state maps to a complete resting visual via the exported pure function
`checkboxStyle(state, ctx) => CheckboxStyle`. State changes snap instantly — no
tweening inside the component.

**Smooth path** (`style?: CheckboxStyle` prop):
Callers opt in to smooth transitions by passing a pre-interpolated `CheckboxStyle`
to the `style` prop. The caller — typically `useCheckboxTransition` — reads
`useCurrentFrame()` and calls `useStateTransition` from `core/timeline.ts` to
compute `{ from, to, progress }`, then blends the two presets via
`tweenCheckboxStyle(from, to, t)`. The `Checkbox` component itself remains
frame-free; it simply renders whatever `CheckboxStyle` it receives.

This design keeps `Checkbox` pure-testable (no Remotion render context needed)
while still supporting smooth check/uncheck transitions for production use.

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/checkbox/__tests__
```

`checkbox.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test script
or framework dep is added to `package.json`.

## What is covered

- **`CheckboxState` union** — asserts the two states `["unchecked","checked"]`
  are the complete set (via the real `controls.state.options` list from
  `config.ts`).
- **`checkboxConfig.controls.state`** — the customizer control wiring. Asserts a
  `select` control exists with exactly those two options, default `"checked"`
  (so the preview shows the filled box and checkmark), and that every option is
  a member of the `CheckboxState` union.
- **`checkboxConfig.snippet`** — REAL pure string builder (high value).
  Asserts: emits `state="<state>"` as a bare JSX prop for every option; NEVER
  emits `steps` or `action`; includes `import { Checkbox }` from
  `@/components/remocn/checkbox`; omits default-equal props (`label=""`,
  `size=default`, `mode=light`, `primary=#171717`); EMITS non-default
  `label`/`size`/`mode`/`primary`; structural round-trip (starts with import,
  contains `<Checkbox`, ends `/>`).
- **`checkboxStyle` presets** — exported pure `(state, ctx) => CheckboxStyle` map.
  A `CheckboxStyleContext` is built from `checkboxStyleContext(defaultLightTheme)`
  — the same call the component makes internally. Asserts per-state numeric
  invariants (checkOpacity, checkScale, checkDraw) and that `boxBackground` /
  `boxBorderColor` are always non-empty strings. Also asserts the key invariant:
  unchecked has checkOpacity 0 & checkDraw 0; checked has checkOpacity 1 &
  checkDraw 1.
- **`tweenCheckboxStyle`** — exported pure `(a, b, t) => CheckboxStyle`. Asserts:
  at t=0 all numeric fields equal `a`; at t=1 all equal `b`; at t=0.5 each
  numeric field is the exact midpoint (checkOpacity 0→1 gives 0.5, checkScale
  0.6→1 gives 0.8, checkDraw 0→1 gives 0.5). `boxBackground` and
  `boxBorderColor` at all t are non-empty strings (the oklch mix value is not
  hardcoded).

**Checkbox render** is a pure `(style | state) => visual` observable only via
Remotion render, not unit-tested here.

**`useCheckboxTransition`** reads `useCurrentFrame()` via `useStateTransition`
inside the hook — that is correct and expected. It is not a render component;
the smooth-path design isolates all frame-reading to the hook, keeping
`Checkbox` pure.

## Import strategy

`checkbox.test.ts` imports via **relative paths** and the
**`@/lib/remocn-ui` tsconfig alias**:

- `../index` — relative, for `CheckboxState`, `checkboxStyle`, `checkboxStyleContext`
- `../use-checkbox-transition` — relative, for `tweenCheckboxStyle`
- `../config` — relative, for `checkboxConfig`
- `@/lib/remocn-ui` — alias (resolves to `registry/remocn-ui/core/index.ts`),
  for `defaultLightTheme`

Importing `index.tsx` and `use-checkbox-transition.ts` pulls the `remotion`
module (and React), but neither `checkboxStyle`, `checkboxStyleContext`, nor
`tweenCheckboxStyle` call `useCurrentFrame()` at import time or at call time —
they are pure value functions. `bun test` resolves tsconfig `paths`, so the
alias works without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

Checkbox is frame-free. The component must contain **none** of the following:

```bash
grep -nE "useCurrentFrame|useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/checkbox/index.tsx
```

Expected: no output. Any match is a determinism violation.

`use-checkbox-transition.ts` is the CALLER hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). It is not a render component;
the smooth-path design isolates all frame-reading to the hook, keeping
`Checkbox` pure.

Tier-wide sweep:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/checkbox/index.tsx registry/remocn-ui/core/*.ts
```
