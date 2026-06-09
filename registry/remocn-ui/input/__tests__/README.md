# `input` — verification tests

Pure / deterministic verification for the `input` component
(`registry/remocn-ui/input/`). The RENDER path needs Remotion's
`useCurrentFrame()` and cannot run headless, so the render is NOT exercised
here. This suite covers the pieces that ARE pure: `InputState` union
membership, `inputConfig.controls.state` wiring, `inputConfig.snippet`
codegen, `inputStyle` presets, and `tweenInputStyle` interpolation.

## Animation model — pure snap + opt-in smooth path

Input ships two complementary paths:

**Snap path** (`state?: InputState` prop):
`Input` is a frame-free pure renderer. The `state` prop drives all visuals.
Each state maps to a complete resting visual via the exported pure function
`inputStyle(state, ctx) => InputStyle`. State changes snap instantly — no
tweening inside the component.

**Smooth path** (`style?: InputStyle` prop):
Callers opt in to smooth transitions by passing a pre-interpolated `InputStyle`
to the `style` prop. The caller — typically `useInputTransition` — reads
`useCurrentFrame()` and calls `useStateTransition` from `core/timeline.ts` to
compute `{ from, to, progress }`, then blends the two presets via
`tweenInputStyle(from, to, t)`. The `Input` component itself remains
frame-free; it simply renders whatever `InputStyle` it receives.

This design keeps `Input` pure-testable (no Remotion render context needed)
while still supporting smooth enter-transitions for production use.

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/input/__tests__
```

`input.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test script
or framework dep is added to `package.json`.

## What is covered

- **`InputState` union** — asserts the five states
  `["idle","hover","active","typing","invalid"]` are the complete set (via the
  real `controls.state.options` list from `config.ts`).
- **`inputConfig.controls.state`** — the customizer control wiring. Asserts a
  `select` control exists with exactly those five options, default `"typing"`
  (so the preview showcases the caret + revealed value), and that every option
  is a member of the `InputState` union.
- **`inputConfig.snippet`** — REAL pure string builder (high value).
  Asserts: emits `state="<state>"` as a bare JSX prop for every option; NEVER
  emits `steps` or `action`; includes `import { Input }` from
  `@/components/remocn/input`; omits default-equal props
  (`placeholder=you@example.com`, `value=remotion@remocn.dev`, `size=default`,
  `mode=light`, `primary=#171717`); EMITS non-default
  `placeholder`/`value`/`size`/`mode`/`primary`; structural round-trip (starts
  with import, contains `<Input`, ends `/>`).
- **`inputStyle` presets** — exported pure `(state, ctx) => InputStyle` map.
  An `InputStyleContext` is built from `inputStyleContext(defaultLightTheme)` —
  the same call the component makes internally. Asserts per-state
  numeric/opacity invariants (`ringWidth`, `caretOpacity`, `valueReveal`,
  `placeholderOpacity`) and that `borderColor`/`ringColor`/`background` are
  always non-empty strings. Key invariants:

  | state   | ringWidth | caretOpacity | valueReveal | placeholderOpacity |
  |---------|-----------|--------------|-------------|--------------------|
  | idle    | 0         | 0            | 0           | 1                  |
  | hover   | 0         | 0            | 0           | 1                  |
  | active  | 3         | 1            | 0           | 1                  |
  | typing  | 3         | 1            | 1           | 0                  |
  | invalid | 3         | 0            | 1           | 0                  |

- **`tweenInputStyle`** — exported pure `(a, b, t) => InputStyle`. Asserts:
  at t=0 all numeric fields equal `a`; at t=1 all equal `b`; at t=0.5 each
  numeric field is the exact midpoint (e.g. `ringWidth` 0→3 gives 1.5,
  `valueReveal` 0→1 gives 0.5, `placeholderOpacity` 1→0 gives 0.5). Color
  fields at all t are non-empty strings (the oklch mix value is not hardcoded).
  Three pair transitions are exercised: idle→active, active→typing,
  typing→invalid.

**Input render** is a pure `(style | state) => visual` observable only via
Remotion render, not unit-tested here.

## Import strategy

`input.test.ts` imports via a mix of **relative paths** and the
**`@/lib/remocn-ui` tsconfig alias**:

- `../index` — relative, for `InputState`, `inputStyle`, `inputStyleContext`
- `../use-input-transition` — relative, for `tweenInputStyle`
- `../config` — relative, for `inputConfig`
- `@/lib/remocn-ui` — alias (resolves to `registry/remocn-ui/core/index.ts`),
  for `defaultLightTheme`

Importing `index.tsx` and `use-input-transition.ts` pulls the `remotion`
module (and React), but neither `inputStyle`, `inputStyleContext`, nor
`tweenInputStyle` call `useCurrentFrame()` at import time or at call time —
they are pure value functions. `bun test` resolves tsconfig `paths`, so the
alias works without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

Input is frame-free. The component must contain **none** of the following:

```bash
grep -nE "useCurrentFrame|useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/input/index.tsx
```

Expected: no output. Any match is a determinism violation.

`use-input-transition.ts` is the CALLER hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). It is not a render component;
the smooth-path design isolates all frame-reading to the hook, keeping
`Input` pure.

Tier-wide sweep:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/input/index.tsx registry/remocn-ui/core/*.ts
```
