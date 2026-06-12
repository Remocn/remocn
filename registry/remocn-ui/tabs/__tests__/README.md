# `tabs` — verification tests

Pure / deterministic verification for the `tabs` component
(`registry/remocn-ui/tabs/`). The RENDER path needs `useRemocnTheme()`
and the Remotion render tree and cannot run headless, so the render is NOT
exercised here. This suite covers the pieces that ARE pure: `TabsState`
type / state options, `tabsConfig.controls` wiring, `tabsConfig.snippet`
codegen, `tabsStyle` presets, `tweenTabsStyle` interpolation, and
`DEFAULT_DURATION`.

## Animation model — pure snap + opt-in smooth path

Tabs ships two complementary paths:

**Snap path** (`state?: TabsState` prop):
`Tabs` is a frame-free pure renderer. The `state` prop drives all visuals.
Each state maps to a complete resting visual via the exported pure function
`tabsStyle(state, ctx) => TabsStyle`. State changes snap instantly — no
tweening inside the component.

**Smooth path** (`style?: TabsStyle` prop):
Callers opt in to smooth transitions by passing a pre-interpolated
`TabsStyle` to the `style` prop. The caller — typically
`useTabsTransition` — reads `useCurrentFrame()` and calls
`useStateTransition` from `core/timeline.ts` to compute
`{ from, to, progress }`, then blends the two presets via
`tweenTabsStyle(from, to, t)`. The `Tabs` component itself remains
frame-free; it simply renders whatever `TabsStyle` it receives.

This design keeps `Tabs` pure-testable (no Remotion render context needed)
while still supporting smooth sliding-indicator transitions for production
use.

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/tabs/__tests__
```

`tabs.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test script
or framework dep is added to `package.json`.

## What is covered

- **`TabsState` / state options** — asserts `controls.state` is a `select`
  with options exactly `["Account", "Password", "Settings"]` in order,
  default `"Account"` (so the preview opens on the first tab), and that
  every option is present in the fixture array (no typos).
- **`tabsConfig.controls.variant`** — asserts a `select` control with
  options `["pill", "underline"]`, default `"pill"`.
- **`tabsConfig.snippet`** — REAL pure string builder (high value). Asserts:
  always emits `state="<state>"` for every option; NEVER emits `steps`;
  includes `import { Tabs }` from `@/components/remocn/tabs`; omits
  default-equal props (`variant="pill"`, `mode="light"`); EMITS non-default
  `variant="underline"` and `mode="dark"`; structural round-trip (starts
  with the import line, contains `<Tabs`, ends `/>`).
- **`tabsStyle` presets** — exported pure `(state, ctx) => TabsStyle` map.
  A `TabsStyleContext` is built from
  `tabsStyleContext(["Account","Password","Settings"], "pill", defaultLightTheme)`
  — the same call the component makes internally. Asserts per-state
  `indicatorOffset` (`"Account"→0`, `"Password"→1`, `"Settings"→2`).
  Asserts unknown state (e.g. `"Nope"`) → `0` (the documented safe
  fallback). A loop asserts each item maps to its own index. Also verifies
  the invariant holds for the `"underline"` variant via a second context.
- **`tweenTabsStyle`** — exported pure `(a, b, t) => TabsStyle`. Asserts:
  at t=0 `indicatorOffset` equals `a.indicatorOffset`; at t=1 equals
  `b.indicatorOffset`; at t=0.5 between offset 0 and 2 gives 1 (exact
  midpoint). Both directions (Account→Settings and Settings→Account) are
  verified. Uses `toBeCloseTo`.
- **`DEFAULT_DURATION`** — sanity-checks the exported constant is a
  positive number equal to 14.

**Tabs render** is a pure `(style | state) => visual` observable only via
Remotion render, not unit-tested here.

## Import strategy

`tabs.test.ts` imports via a mix of **relative paths** and the
**`@/lib/remocn-ui` tsconfig alias**:

- `../index` — relative, for `TabsState`, `tabsStyle`, `tabsStyleContext`
- `../use-tabs-transition` — relative, for `tweenTabsStyle`,
  `DEFAULT_DURATION`
- `../config` — relative, for `tabsConfig`
- `@/lib/remocn-ui` — alias (resolves to `registry/remocn-ui/core/index.ts`),
  for `defaultLightTheme`

Importing `index.tsx` and `use-tabs-transition.ts` pulls the `remotion`
module (and React), but neither `tabsStyle`, `tabsStyleContext`, nor
`tweenTabsStyle` call `useCurrentFrame()` at import time or at call time —
they are pure value functions. `bun test` resolves tsconfig `paths`, so the
alias works without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

Tabs is a state atom and must be frame-free. The component's `index.tsx`
must contain **none** of the following:

```bash
grep -nE "useCurrentFrame|useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/tabs/index.tsx
```

Expected: no output. Any match is a determinism violation.

`use-tabs-transition.ts` is the CALLER hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). It is not a render
component; the smooth-path design isolates all frame-reading to the hook,
keeping `Tabs` pure.

Tier-wide sweep:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/tabs/index.tsx registry/remocn-ui/core/*.ts
```
