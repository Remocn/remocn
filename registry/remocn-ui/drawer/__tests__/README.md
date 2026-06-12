# `drawer` — verification tests

Pure / deterministic verification for the `drawer` component
(`registry/remocn-ui/drawer/`). The RENDER path needs `useRemocnTheme()`
and the Remotion render tree and cannot run headless, so the render is NOT
exercised here. This suite covers the pieces that ARE pure: `DrawerState`
union membership, `drawerConfig.controls` wiring, `drawerConfig.snippet`
codegen, `drawerStyle` presets, `tweenDrawerStyle` interpolation, and
`DEFAULT_DURATION`.

## Animation model — pure snap + opt-in smooth path

Drawer ships two complementary paths:

**Snap path** (`state?: DrawerState` prop):
`Drawer` is a frame-free pure renderer. The `state` prop drives all visuals.
Each state maps to a complete resting visual via the exported pure function
`drawerStyle(state, ctx) => DrawerStyle`. State changes snap instantly —
no tweening inside the component.

**Smooth path** (`style?: DrawerStyle` prop):
Callers opt in to smooth transitions by passing a pre-interpolated
`DrawerStyle` to the `style` prop. The caller — typically
`useDrawerTransition` — reads `useCurrentFrame()` and calls
`useStateTransition` from `core/timeline.ts` to compute
`{ from, to, progress }`, then blends the two presets via
`tweenDrawerStyle(from, to, t)`. The `Drawer` component itself remains
frame-free; it simply renders whatever `DrawerStyle` it receives.

This design keeps `Drawer` pure-testable (no Remotion render context needed)
while still supporting smooth open/close transitions for production use.

## How to run

> **The user (not the agent) runs verification.** Do not run this command
> automatically — always wait for the user to run it.

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/drawer/__tests__
```

`drawer.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test
script or framework dep is added to `package.json`.

## What is covered

- **`DrawerState` union** — asserts the two states `["opened", "closed"]`
  are the complete set (via the real `controls.state.options` list from
  `config.ts`).
- **`drawerConfig.controls.state`** — the customizer control wiring. Asserts
  a `select` control exists with exactly those two options in order, default
  `"opened"` (so the preview showcases the panel), and that every option is a
  member of the `DrawerState` union.
- **`drawerConfig.snippet`** — REAL pure string builder (high value).
  Asserts: always emits `state="<state>"` for every option; NEVER emits `steps`;
  includes `import { Drawer }` from `@/components/remocn/drawer`;
  omits default-equal props (`title="Edit profile"`, the default description
  `"Make changes to your profile here. Click save when you're done."`,
  `actionLabel="Save changes"`, `cancelLabel="Cancel"`, `mode="light"`); EMITS
  non-default `title`/`description`/`actionLabel`/`cancelLabel`/`mode`;
  structural round-trip (starts with import, contains `<Drawer`, ends `/>`).
  Note: `action=` is not checked for absence because `actionLabel=` is a
  legitimate emitted prop — only `steps` is asserted absent.
- **`drawerStyleContext`** — exported pure `(theme) => DrawerStyleContext`
  (takes only `theme`, no variant — unlike accordion). Built from
  `drawerStyleContext(defaultLightTheme)`. Asserts each field
  (`popoverBg`, `popoverFg`, `mutedFg`, `border`, `actionBg`, `actionFg`,
  `cancelFg`) is a non-empty string, and `radius` is a number.
- **`drawerStyle` presets** — exported pure `(state, ctx) => DrawerStyle`.
  All three fields (`overlayOpacity`, `panelOpacity`, `panelTranslateY`) are
  numeric. Asserts per-state invariants: closed → `{ 0, 0, 320 }`
  (panel off-screen below the bottom edge); opened → `{ 1, 1, 0 }`
  (panel slid up to its resting position).
- **`tweenDrawerStyle`** — exported pure `(a, b, t) => DrawerStyle`.
  All three fields are pure numeric lerps (no color fields). Asserts: at t=0 all
  fields equal `a`; at t=1 all equal `b`; at t=0.5 each field is the exact
  midpoint (`overlayOpacity` 0.5, `panelOpacity` 0.5, `panelTranslateY` 160).
  Both directions (closed→opened and opened→closed) are verified.
- **`DEFAULT_DURATION`** — sanity-checks the exported constant is a positive
  number equal to 12.

**Drawer render** is a pure `(style | state) => visual` observable only via
Remotion render, not unit-tested here.

## Import strategy

`drawer.test.ts` imports via a mix of **relative paths** and the
**`@/lib/remocn-ui` tsconfig alias**:

- `../index` — relative, for `DrawerState`, `drawerStyle`,
  `drawerStyleContext`
- `../use-drawer-transition` — relative, for `tweenDrawerStyle`,
  `DEFAULT_DURATION`
- `../config` — relative, for `drawerConfig`
- `@/lib/remocn-ui` — alias (resolves to `registry/remocn-ui/core/index.ts`),
  for `defaultLightTheme`

Importing `index.tsx` and `use-drawer-transition.ts` pulls the `remotion`
module (and React), but neither `drawerStyle`, `drawerStyleContext`,
nor `tweenDrawerStyle` call `useCurrentFrame()` at import time or at call
time — they are pure value functions. `bun test` resolves tsconfig `paths`, so
the alias works without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

Drawer is a state atom and must be frame-free. The component's `index.tsx`
must contain **none** of the following:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/drawer/index.tsx
```

Expected: no output. Any match is a determinism violation.

`use-drawer-transition.ts` is the CALLER hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). It is not a render component;
the smooth-path design isolates all frame-reading to the hook, keeping
`Drawer` pure.

Tier-wide sweep:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/drawer/index.tsx registry/remocn-ui/core/*.ts
```
