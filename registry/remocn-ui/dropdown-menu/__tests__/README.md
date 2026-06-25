# `dropdown-menu` — verification tests

Pure / deterministic verification for the `dropdown-menu` component
(`registry/remocn-ui/dropdown-menu/`). The RENDER path needs `useRemocnTheme()`
and the Remotion render tree and cannot run headless, so the render is NOT
exercised here. This suite covers the pieces that ARE pure: `DropdownMenuState`
union membership, `dropdownMenuConfig.controls` wiring,
`dropdownMenuConfig.snippet` codegen, `dropdownMenuStyle` presets,
`tweenDropdownMenuStyle` interpolation, and `DEFAULT_DURATION`.

## Animation model — pure snap + opt-in smooth path

DropdownMenu ships two complementary paths:

**Snap path** (`state?: DropdownMenuState` prop):
`DropdownMenu` is a frame-free pure renderer. The `state` prop drives all
visuals. Each state maps to a complete resting visual via the exported pure
function `dropdownMenuStyle(state, ctx) => DropdownMenuStyle`. State changes
snap instantly — no tweening inside the component.

**Smooth path** (`style?: DropdownMenuStyle` prop):
Callers opt in to smooth transitions by passing a pre-interpolated
`DropdownMenuStyle` to the `style` prop. The caller — typically
`useDropdownMenuTransition` — reads `useCurrentFrame()` and calls
`useStateTransition` from `core/timeline.ts` to compute
`{ from, to, progress }`, then blends the two presets via
`tweenDropdownMenuStyle(from, to, t)`. The `DropdownMenu` component itself
remains frame-free; it simply renders whatever `DropdownMenuStyle` it receives.

This design keeps `DropdownMenu` pure-testable (no Remotion render context
needed) while still supporting smooth open/close transitions for production use.

## How to run

> **The user (not the agent) runs verification.** Do not run this command
> automatically — always wait for the user to run it.

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/dropdown-menu/__tests__
```

`dropdown-menu.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test
script or framework dep is added to `package.json`.

## What is covered

- **`DropdownMenuState` union** — asserts the two states `["opened", "closed"]`
  are the complete set (via the real `controls.state.options` list from
  `config.ts`).
- **`dropdownMenuConfig.controls.state`** — the customizer control wiring.
  Asserts a `select` control exists with exactly those two options in order,
  default `"opened"` (so the preview shows the panel), and that every option is
  a member of the `DropdownMenuState` union.
- **`dropdownMenuConfig.snippet`** — REAL pure string builder (high value).
  Asserts: always emits `state="<state>"` for every option; includes
  `import { DropdownMenu }` from `@/components/remocn/dropdown-menu`; omits
  default-equal props (`label="Options"`, `highlightedIndex=-1`, `mode="light"`);
  EMITS non-default `label`/`highlightedIndex`/`mode` (note: `highlightedIndex=0`
  IS emitted because the snippet's omit condition is `!== -1`); structural
  round-trip (starts with import, contains `<DropdownMenu`, ends `/>`).
- **`dropdownMenuStyleContext`** — exported pure
  `(theme) => DropdownMenuStyleContext` (takes only `theme`, no variant). Built
  from `dropdownMenuStyleContext(defaultLightTheme)`. Asserts each leaf field is
  a non-empty string and `radius` is a number. Also asserts token mapping:
  `panelBg = theme.popover`, `panelBorder = theme.border`,
  `triggerFg = theme.foreground`, `mutedFg = theme.mutedForeground`,
  `radius = theme.radius`. `triggerCtx` and `itemCtx` are asserted as non-null
  objects (their internals are covered by the button/dropdown-menu-item suites).
- **`dropdownMenuStyle` presets** — exported pure
  `(state, ctx) => DropdownMenuStyle`. All four fields are numeric. Asserts
  per-state invariants:
  - `closed` → `{ panelOpacity:0, panelScale:0.96, panelTranslateY:-4, chevronRotation:0 }`
  - `opened` → `{ panelOpacity:1, panelScale:1, panelTranslateY:0, chevronRotation:180 }`
- **`tweenDropdownMenuStyle`** — exported pure `(a, b, t) => DropdownMenuStyle`.
  All four fields are pure numeric lerps (no color fields). Asserts: at t=0 all
  fields equal `a`; at t=1 all equal `b`; at t=0.5 each field is the exact
  midpoint. Both directions (closed→opened and opened→closed) are verified.
  Midpoints: `panelOpacity` 0.5, `panelScale` 0.98, `panelTranslateY` -2,
  `chevronRotation` 90.
- **`DEFAULT_DURATION`** — sanity-checks the exported constant is a positive
  number equal to `12` (container default, longer than item's `8`).

**DropdownMenu render** is a pure `(style | state) => visual` observable only
via Remotion render, not unit-tested here.

## Import strategy

`dropdown-menu.test.ts` imports via a mix of **relative paths** and the
**`@/lib/remocn-ui` tsconfig alias**:

- `../index` — relative, for `DropdownMenuState`, `dropdownMenuStyle`,
  `dropdownMenuStyleContext`
- `../use-dropdown-menu-transition` — relative, for `tweenDropdownMenuStyle`,
  `DEFAULT_DURATION`
- `../config` — relative, for `dropdownMenuConfig`
- `@/lib/remocn-ui` — alias (resolves to `registry/remocn-ui/core/index.ts`),
  for `defaultLightTheme`

Importing `index.tsx` and `use-dropdown-menu-transition.ts` pulls the `remotion`
module (and React), but neither `dropdownMenuStyle`, `dropdownMenuStyleContext`,
nor `tweenDropdownMenuStyle` call `useCurrentFrame()` at import time or at call
time — they are pure value functions. `bun test` resolves tsconfig `paths`, so
the alias works without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

DropdownMenu is a state atom and must be frame-free. The component's `index.tsx`
must contain **none** of the following:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/dropdown-menu/index.tsx
```

Expected: no output. Any match is a determinism violation.

`use-dropdown-menu-transition.ts` is the CALLER hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). It is not a render component;
the smooth-path design isolates all frame-reading to the hook, keeping
`DropdownMenu` pure.

Tier-wide sweep:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/dropdown-menu/index.tsx registry/remocn-ui/core/*.ts
```
