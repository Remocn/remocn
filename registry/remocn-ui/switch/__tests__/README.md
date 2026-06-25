# `switch` — verification tests

Pure / deterministic verification for the `switch` component
(`registry/remocn-ui/switch/`). The RENDER path needs Remotion's
`useCurrentFrame()` and cannot run headless, so the render is NOT exercised
here. This suite covers the pieces that ARE pure: `SwitchState` union
membership, `switchConfig.controls.state` wiring, `switchConfig.snippet`
codegen, `switchStyle` presets, and `tweenSwitchStyle` interpolation.

## Animation model — pure snap + opt-in smooth path

Switch ships two complementary paths:

**Snap path** (`state?: SwitchState` prop):
`Switch` is a frame-free pure renderer. The `state` prop drives all visuals.
Each state maps to a complete resting visual via the exported pure function
`switchStyle(state, ctx) => SwitchStyle`. State changes snap instantly — no
tweening inside the component.

**Smooth path** (`style?: SwitchStyle` prop):
Callers opt in to smooth transitions by passing a pre-interpolated `SwitchStyle`
to the `style` prop. The caller — typically `useSwitchTransition` — reads
`useCurrentFrame()` and calls `useStateTransition` from `core/timeline.ts` to
compute `{ from, to, progress }`, then blends the two presets via
`tweenSwitchStyle(from, to, t)`. The `Switch` component itself remains
frame-free; it simply renders whatever `SwitchStyle` it receives.

This design keeps `Switch` pure-testable (no Remotion render context needed)
while still supporting smooth toggle transitions for production use.

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/switch/__tests__
```

`switch.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test script
or framework dep is added to `package.json`.

## What is covered

- **`SwitchState` union** — asserts the two states `["unchecked","checked"]`
  are the complete set (via the real `controls.state.options` list from
  `config.ts`).
- **`switchConfig.controls.state`** — the customizer control wiring. Asserts a
  `select` control exists with exactly those two options, default `"checked"`
  (so the preview shows the filled track and slid thumb), and that every option
  is a member of the `SwitchState` union.
- **`switchConfig.snippet`** — REAL pure string builder (high value).
  Asserts: emits `state="<state>"` as a bare JSX prop for every option; NEVER
  emits `steps` or `action`; includes `import { Switch }` from
  `@/components/remocn/switch`; omits default-equal props (`label=""`,
  `size=default`, `mode=light`, `primary=#171717`); EMITS non-default
  `label`/`size`/`mode`/`primary`; structural round-trip (starts with import,
  contains `<Switch`, ends `/>`).
- **`switchStyle` presets** — exported pure `(state, ctx) => SwitchStyle` map.
  A `SwitchStyleContext` is built from `switchStyleContext(defaultLightTheme)`
  — the same call the component makes internally. Asserts per-state numeric
  invariants (thumbOffset) and that `trackBackground` is always a non-empty
  string. Also asserts the key invariant: unchecked has thumbOffset 0 (thumb
  at left); checked has thumbOffset 1 (thumb at right).
- **`tweenSwitchStyle`** — exported pure `(a, b, t) => SwitchStyle`. Asserts:
  at t=0 all numeric fields equal `a`; at t=1 all equal `b`; at t=0.5 the
  numeric field is the exact midpoint (thumbOffset 0→1 gives 0.5).
  `trackBackground` at all t is a non-empty string (the oklch mix value is not
  hardcoded).

**Switch render** is a pure `(style | state) => visual` observable only via
Remotion render, not unit-tested here.

**`useSwitchTransition`** reads `useCurrentFrame()` via `useStateTransition`
inside the hook — that is correct and expected. It is not a render component;
the smooth-path design isolates all frame-reading to the hook, keeping
`Switch` pure.

## Import strategy

`switch.test.ts` imports via **relative paths** and the
**`@/lib/remocn-ui` tsconfig alias**:

- `../index` — relative, for `SwitchState`, `switchStyle`, `switchStyleContext`
- `../use-switch-transition` — relative, for `tweenSwitchStyle`
- `../config` — relative, for `switchConfig`
- `@/lib/remocn-ui` — alias (resolves to `registry/remocn-ui/core/index.ts`),
  for `defaultLightTheme`

Importing `index.tsx` and `use-switch-transition.ts` pulls the `remotion`
module (and React), but neither `switchStyle`, `switchStyleContext`, nor
`tweenSwitchStyle` call `useCurrentFrame()` at import time or at call time —
they are pure value functions. `bun test` resolves tsconfig `paths`, so the
alias works without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

Switch is frame-free. The component must contain **none** of the following:

```bash
grep -nE "useCurrentFrame|useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/switch/index.tsx
```

Expected: no output. Any match is a determinism violation.

`use-switch-transition.ts` is the CALLER hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). It is not a render component;
the smooth-path design isolates all frame-reading to the hook, keeping
`Switch` pure.

Tier-wide sweep:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/switch/index.tsx registry/remocn-ui/core/*.ts
```
