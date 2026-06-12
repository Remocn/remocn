# `select-item` — verification tests

Pure / deterministic verification for the `select-item` component
(`registry/remocn-ui/select-item/`). The RENDER path needs `useRemocnTheme()`
and the Remotion render tree and cannot run headless, so the render is NOT
exercised here. This suite covers the pieces that ARE pure: `SelectItemState`
union membership, `selectItemConfig.controls` wiring, `selectItemConfig.snippet`
codegen, `selectItemStyle` presets, `tweenSelectItemStyle` interpolation, and
`DEFAULT_DURATION`.

## Animation model — pure snap + opt-in smooth path

SelectItem ships two complementary paths:

**Snap path** (`state?: SelectItemState` prop):
`SelectItem` is a frame-free pure renderer. The `state` prop drives all visuals.
Each state maps to a complete resting visual via the exported pure function
`selectItemStyle(state, ctx) => SelectItemStyle`. State changes snap instantly —
no tweening inside the component.

**Smooth path** (`style?: SelectItemStyle` prop):
Callers opt in to smooth transitions by passing a pre-interpolated
`SelectItemStyle` to the `style` prop. The caller — typically
`useSelectItemTransition` — reads `useCurrentFrame()` and calls
`useStateTransition` from `core/timeline.ts` to compute
`{ from, to, progress }`, then blends the two presets via
`tweenSelectItemStyle(from, to, t)`. The `SelectItem` component itself remains
frame-free; it simply renders whatever `SelectItemStyle` it receives.

This design keeps `SelectItem` pure-testable (no Remotion render context needed)
while still supporting smooth transitions for production use.

## How to run

> **The user (not the agent) runs verification.** Do not run this command
> automatically — always wait for the user to run it.

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/select-item/__tests__
```

`select-item.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test
script or framework dep is added to `package.json`.

## What is covered

- **`SelectItemState` union** — asserts the four states `["idle", "hover",
  "press", "selected"]` are the complete set (via the real
  `controls.state.options` list from `config.ts`).
- **`selectItemConfig.controls.state`** — the customizer control wiring. Asserts
  a `select` control exists with exactly those four options in order, default
  `"selected"` (so the preview shows the check icon + accent), and that every
  option is a member of the `SelectItemState` union.
- **`selectItemConfig.snippet`** — REAL pure string builder (high value).
  Asserts: always emits `state="<state>"` for every option; includes
  `import { SelectItem }` from `@/components/remocn/select-item`; omits
  default-equal props (`label="Banana"`, `mode="light"`); EMITS non-default
  `label`/`mode`; structural round-trip (starts with import, contains
  `<SelectItem`, ends `/>`).
- **`selectItemStyleContext`** — exported pure `(theme) => SelectItemStyleContext`
  (takes only `theme`, no variant). Built from
  `selectItemStyleContext(defaultLightTheme)`. Asserts each field is a non-empty
  string. Also asserts token mapping: `idleBg = theme.popover`,
  `hoverBg = theme.accent`, `selectedBg = theme.accent`,
  `idleFg = theme.popoverForeground`, `selectedFg = theme.accentForeground`,
  `check = theme.primary`.
- **`selectItemStyle` presets** — exported pure `(state, ctx) => SelectItemStyle`.
  Asserts per-state invariants:
  - `idle`     → `{ background: idleBg, labelColor: idleFg, checkOpacity: 0, scale: 1 }`
  - `hover`    → `{ background: hoverBg, labelColor: idleFg, checkOpacity: 0, scale: 1 }`
  - `press`    → `{ background: pressBg, labelColor: idleFg, checkOpacity: 0, scale: 0.98 }`
  - `selected` → `{ background: selectedBg, labelColor: selectedFg, checkOpacity: 1, scale: 1 }`
- **`tweenSelectItemStyle`** — exported pure `(a, b, t) => SelectItemStyle`.
  Numeric fields (`checkOpacity`, `scale`) lerp; color fields (`background`,
  `labelColor`) go through `mixOklch` (tested as non-empty strings). Asserts: at
  t=0 numeric fields equal `a`; at t=1 they equal `b`; at t=0.5 each numeric
  field is the exact midpoint. Two transitions exercised: idle→selected
  (checkOpacity 0→1 gives 0.5) and idle→press (scale 1→0.98 gives 0.99).
- **`DEFAULT_DURATION`** — sanity-checks the exported constant is a positive
  number equal to `8` (item default, shorter than the container's `12`).

**SelectItem render** is a pure `(style | state) => visual` observable only via
Remotion render, not unit-tested here.

## Import strategy

`select-item.test.ts` imports via a mix of **relative paths** and the
**`@/lib/remocn-ui` tsconfig alias**:

- `../index` — relative, for `SelectItemState`, `selectItemStyle`,
  `selectItemStyleContext`
- `../use-select-item-transition` — relative, for `tweenSelectItemStyle`,
  `DEFAULT_DURATION`
- `../config` — relative, for `selectItemConfig`
- `@/lib/remocn-ui` — alias (resolves to `registry/remocn-ui/core/index.ts`),
  for `defaultLightTheme`

Importing `index.tsx` and `use-select-item-transition.ts` pulls the `remotion`
module (and React), but neither `selectItemStyle`, `selectItemStyleContext`, nor
`tweenSelectItemStyle` call `useCurrentFrame()` at import time or at call
time — they are pure value functions. `bun test` resolves tsconfig `paths`, so
the alias works without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

SelectItem is a state atom and must be frame-free. The component's `index.tsx`
must contain **none** of the following:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/select-item/index.tsx
```

Expected: no output. Any match is a determinism violation.

`use-select-item-transition.ts` is the CALLER hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). It is not a render component;
the smooth-path design isolates all frame-reading to the hook, keeping
`SelectItem` pure.

Tier-wide sweep:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/select-item/index.tsx registry/remocn-ui/core/*.ts
```
