# `radio` — verification tests

Pure / deterministic verification for the `radio` component
(`registry/remocn-ui/radio/`). The RENDER path needs Remotion's
`useCurrentFrame()` and cannot run headless, so the render is NOT exercised
here. This suite covers the pieces that ARE pure: `RadioState` union
membership, `radioConfig.controls.state` wiring, `radioConfig.snippet`
codegen, `radioStyle` presets, and `tweenRadioStyle` interpolation.

## Animation model — pure snap + opt-in smooth path

Radio ships two complementary paths:

**Snap path** (`state?: RadioState` prop):
`Radio` is a frame-free pure renderer. The `state` prop drives all visuals.
Each state maps to a complete resting visual via the exported pure function
`radioStyle(state, ctx) => RadioStyle`. State changes snap instantly — no
tweening inside the component.

**Smooth path** (`style?: RadioStyle` prop):
Callers opt in to smooth transitions by passing a pre-interpolated `RadioStyle`
to the `style` prop. The caller — typically `useRadioTransition` — reads
`useCurrentFrame()` and calls `useStateTransition` from `core/timeline.ts` to
compute `{ from, to, progress }`, then blends the two presets via
`tweenRadioStyle(from, to, t)`. The `Radio` component itself remains
frame-free; it simply renders whatever `RadioStyle` it receives.

This design keeps `Radio` pure-testable (no Remotion render context needed)
while still supporting smooth check/uncheck transitions for production use.

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/radio/__tests__
```

`radio.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test script
or framework dep is added to `package.json`.

## What is covered

- **`RadioState` union** — asserts the two states `["unchecked","checked"]`
  are the complete set (via the real `controls.state.options` list from
  `config.ts`).
- **`radioConfig.controls.state`** — the customizer control wiring. Asserts a
  `select` control exists with exactly those two options, default `"checked"`
  (so the preview shows the filled dot), and that every option is a member of
  the `RadioState` union.
- **`radioConfig.snippet`** — REAL pure string builder (high value).
  Asserts: emits `state="<state>"` as a bare JSX prop for every option; NEVER
  emits `steps` or `action`; includes `import { Radio }` from
  `@/components/remocn/radio`; omits default-equal props (`label=""`,
  `size=default`, `mode=light`, `primary=#171717`); EMITS non-default
  `label`/`size`/`mode`/`primary`; structural round-trip (starts with import,
  contains `<Radio`, ends `/>`).
- **`radioStyle` presets** — exported pure `(state, ctx) => RadioStyle` map.
  A `RadioStyleContext` is built from `radioStyleContext(defaultLightTheme)`
  — the same call the component makes internally. Asserts per-state numeric
  invariants (dotOpacity, dotScale) and that `ringBorderColor` is always a
  non-empty string. Also asserts the key invariant: unchecked has dotOpacity 0;
  checked has dotOpacity 1.
- **`tweenRadioStyle`** — exported pure `(a, b, t) => RadioStyle`. Asserts:
  at t=0 all numeric fields equal `a`; at t=1 all equal `b`; at t=0.5 each
  numeric field is the exact midpoint (dotOpacity 0→1 gives 0.5, dotScale
  0.4→1 gives 0.7). `ringBorderColor` at all t is a non-empty string (the
  oklch mix value is not hardcoded).

**Radio render** is a pure `(style | state) => visual` observable only via
Remotion render, not unit-tested here.

**`useRadioTransition`** reads `useCurrentFrame()` via `useStateTransition`
inside the hook — that is correct and expected. It is not a render component;
the smooth-path design isolates all frame-reading to the hook, keeping
`Radio` pure.

## Import strategy

`radio.test.ts` imports via **relative paths** and the
**`@/lib/remocn-ui` tsconfig alias**:

- `../index` — relative, for `RadioState`, `radioStyle`, `radioStyleContext`
- `../use-radio-transition` — relative, for `tweenRadioStyle`
- `../config` — relative, for `radioConfig`
- `@/lib/remocn-ui` — alias (resolves to `registry/remocn-ui/core/index.ts`),
  for `defaultLightTheme`

Importing `index.tsx` and `use-radio-transition.ts` pulls the `remotion`
module (and React), but neither `radioStyle`, `radioStyleContext`, nor
`tweenRadioStyle` call `useCurrentFrame()` at import time or at call time —
they are pure value functions. `bun test` resolves tsconfig `paths`, so the
alias works without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

Radio is frame-free. The component must contain **none** of the following:

```bash
grep -nE "useCurrentFrame|useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/radio/index.tsx
```

Expected: no output. Any match is a determinism violation.

`use-radio-transition.ts` is the CALLER hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). It is not a render component;
the smooth-path design isolates all frame-reading to the hook, keeping
`Radio` pure.

Tier-wide sweep:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/radio/index.tsx registry/remocn-ui/core/*.ts
```
