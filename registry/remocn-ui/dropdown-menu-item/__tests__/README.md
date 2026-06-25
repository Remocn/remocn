# `dropdown-menu-item` — verification tests

Pure / deterministic verification for the `dropdown-menu-item` component
(`registry/remocn-ui/dropdown-menu-item/`). The RENDER path needs
`useRemocnTheme()` and the Remotion render tree and cannot run headless, so the
render is NOT exercised here. This suite covers the pieces that ARE pure:
`DropdownMenuItemState` union membership, `dropdownMenuItemConfig.controls`
wiring, `dropdownMenuItemConfig.snippet` codegen, `dropdownMenuItemStyle`
presets, `tweenDropdownMenuItemStyle` interpolation, and `DEFAULT_DURATION`.

## Animation model — pure snap + opt-in smooth path

DropdownMenuItem ships two complementary paths:

**Snap path** (`state?: DropdownMenuItemState` prop):
`DropdownMenuItem` is a frame-free pure renderer. The `state` prop drives all
visuals. Each state maps to a complete resting visual via the exported pure
function `dropdownMenuItemStyle(state, ctx) => DropdownMenuItemStyle`. State
changes snap instantly — no tweening inside the component.

**Smooth path** (`style?: DropdownMenuItemStyle` prop):
Callers opt in to smooth transitions by passing a pre-interpolated
`DropdownMenuItemStyle` to the `style` prop. The caller — typically
`useDropdownMenuItemTransition` — reads `useCurrentFrame()` and calls
`useStateTransition` from `core/timeline.ts` to compute
`{ from, to, progress }`, then blends the two presets via
`tweenDropdownMenuItemStyle(from, to, t)`. The component itself remains
frame-free; it simply renders whatever `DropdownMenuItemStyle` it receives.

This design keeps `DropdownMenuItem` pure-testable (no Remotion render context
needed) while still supporting smooth transitions for production use.

## How to run

> **The user (not the agent) runs verification.** Do not run this command
> automatically — always wait for the user to run it.

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/dropdown-menu-item/__tests__
```

`dropdown-menu-item.test.ts` imports `bun:test` (not `vitest`/`jest`), so no
test script or framework dep is added to `package.json`.

## What is covered

- **`DropdownMenuItemState` union** — asserts the three states
  `["idle", "hover", "press"]` are the complete set (via the real
  `controls.state.options` list from `config.ts`). Note: NO `selected` state —
  dropdown menus do not persist selection.
- **`dropdownMenuItemConfig.controls.state`** — the customizer control wiring.
  Asserts a `select` control exists with exactly those three options in order,
  default `"hover"` (so the preview shows the highlighted row), and that every
  option is a member of the `DropdownMenuItemState` union.
- **`dropdownMenuItemConfig.snippet`** — REAL pure string builder (high value).
  Asserts: always emits `state="<state>"` for every option; includes
  `import { DropdownMenuItem }` from `@/components/remocn/dropdown-menu-item`;
  omits default-equal props (`label="Profile"`, `mode="light"`); EMITS
  non-default `label`/`mode`; structural round-trip (starts with import, contains
  `<DropdownMenuItem`, ends `/>`).
- **`dropdownMenuItemStyleContext`** — exported pure
  `(theme) => DropdownMenuItemStyleContext` (takes only `theme`, no variant).
  Built from `dropdownMenuItemStyleContext(defaultLightTheme)`. Asserts each
  field is a non-empty string. Also asserts token mapping:
  `idleBg = theme.popover`, `hoverBg = theme.accent`,
  `idleFg = theme.popoverForeground`.
- **`dropdownMenuItemStyle` presets** — exported pure
  `(state, ctx) => DropdownMenuItemStyle`. No check icon, no `selected` state.
  Asserts per-state invariants:
  - `idle`  → `{ background: idleBg, labelColor: idleFg, scale: 1 }`
  - `hover` → `{ background: hoverBg, labelColor: idleFg, scale: 1 }`
  - `press` → `{ background: pressBg, labelColor: idleFg, scale: 0.98 }`
- **`tweenDropdownMenuItemStyle`** — exported pure `(a, b, t) =>
  DropdownMenuItemStyle`. `scale` lerps numerically; `background` and
  `labelColor` go through `mixOklch` (tested as non-empty strings). Asserts: at
  t=0 `scale` equals `a.scale`; at t=1 it equals `b.scale`; at t=0.5 the exact
  midpoint. Two transitions: idle→press (scale 1→0.98 gives 0.99) and
  hover→idle (scale 1→1 gives 1).
- **`DEFAULT_DURATION`** — sanity-checks the exported constant is a positive
  number equal to `8` (item default, shorter than the container's `12`).

**DropdownMenuItem render** is a pure `(style | state) => visual` observable
only via Remotion render, not unit-tested here.

## Import strategy

`dropdown-menu-item.test.ts` imports via a mix of **relative paths** and the
**`@/lib/remocn-ui` tsconfig alias**:

- `../index` — relative, for `DropdownMenuItemState`, `dropdownMenuItemStyle`,
  `dropdownMenuItemStyleContext`
- `../use-dropdown-menu-item-transition` — relative, for
  `tweenDropdownMenuItemStyle`, `DEFAULT_DURATION`
- `../config` — relative, for `dropdownMenuItemConfig`
- `@/lib/remocn-ui` — alias (resolves to `registry/remocn-ui/core/index.ts`),
  for `defaultLightTheme`

Importing `index.tsx` and `use-dropdown-menu-item-transition.ts` pulls the
`remotion` module (and React), but neither `dropdownMenuItemStyle`,
`dropdownMenuItemStyleContext`, nor `tweenDropdownMenuItemStyle` call
`useCurrentFrame()` at import time or at call time — they are pure value
functions. `bun test` resolves tsconfig `paths`, so the alias works without
additional config.

## Determinism grep checklist (run manually; must print NOTHING)

DropdownMenuItem is a state atom and must be frame-free. The component's
`index.tsx` must contain **none** of the following:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/dropdown-menu-item/index.tsx
```

Expected: no output. Any match is a determinism violation.

`use-dropdown-menu-item-transition.ts` is the CALLER hook that intentionally
reads `useCurrentFrame()` (via `useStateTransition`). It is not a render
component; the smooth-path design isolates all frame-reading to the hook,
keeping `DropdownMenuItem` pure.

Tier-wide sweep:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/dropdown-menu-item/index.tsx registry/remocn-ui/core/*.ts
```
