# `select-menu` — verification tests

Pure / deterministic verification for the `select-menu` component
(`registry/remocn-ui/select-menu/`). The RENDER path needs Remotion's
`useCurrentFrame()` and cannot run headless, so the render is NOT exercised
here. This suite covers the pieces that ARE pure: `selectMenuStyle` presets,
`selectMenuStyleContext` theming, `tweenSelectMenuStyle` interpolation, and
`selectMenuConfig` control/snippet wiring.

## Animation model — pure snap + opt-in smooth path

SelectMenu ships two complementary paths:

**Snap path** (`selectedIndex?: number` / `state?: string` prop): `SelectMenu` is
a frame-free pure renderer. The selection is fully controlled. `selectedIndex`
maps straight to a complete resting visual via the exported pure function
`selectMenuStyle(selectedIndex, ctx) => SelectMenuStyle`. Selection changes snap
instantly — no tweening inside the component. `state` is an alias that resolves
an option value back to an index.

**Smooth path** (`style?: SelectMenuStyle` prop): callers opt in to a smooth
sliding highlight by passing a pre-interpolated `SelectMenuStyle` to the `style`
prop. The caller — typically `useSelectMenuTransition` — reads
`useCurrentFrame()` and calls `useStateTransition` from `core/timeline.ts` to
compute `{ from, to, progress }`, then blends the two presets via
`tweenSelectMenuStyle(from, to, t)`. The component itself remains frame-free; it
simply renders whatever `SelectMenuStyle` it receives.

The three animated fields are:

- `indicatorOffset` — a float row index. Tweening it glides the highlight bar and
  the left accent between rows with no jump. Per-row label color and weight
  derive from `proximity = 1 - |i - indicatorOffset|`, exactly like
  `toggle-group`'s labels, so the emphasis crossfades as the highlight arrives.
- `press` — transient 0..1 press depth of the row under the indicator. Rises and
  falls inside the click window (`clickAt` → `clickAt + clickDuration`) and
  drives a quick scale dip + highlight darkening, like `select-item`'s press
  state. `0` at rest; snap styles always report `0`.
- `selectProgress` — 0..1 selectedness. Rises over the release portion of the
  click window (the check mark fades in on the row's right edge), holds at `1`
  while selected, and eases back to `0` after a `hold`/`decayDuration` cycle so
  a selecting loop can restart cleanly. Snap styles report `1` (fully selected).
  Without a `clickAt`, both `press` and `selectProgress` stay `0` (pure glide,
  no click effect).

## How to run

The repo uses **Bun**, which has a built-in test runner — runs TypeScript
natively, no test-framework dep.

```bash
bun install
bun test registry/remocn-ui/select-menu/__tests__
```

`select-menu.test.ts` imports `bun:test` (not `vitest`/`jest`), so no test script
or framework dep is added to `package.json`.

## What is covered

- **`selectMenuStyle`** — exported pure `(index, ctx) => SelectMenuStyle` map.
  Asserts an index maps to an equal `indicatorOffset`, index 0 maps to offset 0,
  negative indices clamp to 0, out-of-range indices clamp to the last row, an
  unknown state value (index -1 from `options.indexOf`) clamps to 0, and the
  snap result reports `selectProgress: 1` + `press: 0` (fully selected).
- **`selectMenuStyleContext`** — exported pure `(options, variant, theme) => ctx`.
  Asserts the option list is carried through, the soft variant derives its
  highlight/accent from theme accent + primary, the solid variant fills with
  `theme.primary` + `theme.primaryForeground`, and the theme `foreground` is
  carried for the press darkening.
- **`computeSelectMenuClick`** — exported pure `(frame, clickAt, clickDuration,
  { hold, decayDuration })` piecewise click timeline. Asserts it is at rest
  before the window, `press` peaks at the press/release boundary and zeroes by
  the window end, `selectProgress` rises over the release and stays selected,
  and — with `hold`/`decayDuration` — eases back to `0` without ever replaying
  the press.
- **`tweenSelectMenuStyle`** — exported pure `(a, b, t) => SelectMenuStyle`.
  Asserts t=0 equals `a`, t=1 equals `b`, t=0.5 is the exact midpoint for
  `indicatorOffset`, `press`, and `selectProgress`, a same-row tween stays put,
  and both click fields interpolate linearly.
- **`selectMenuConfig.controls`** — `selectedIndex` is a `number` control clamped
  to the option range (0–3, default 1); `variant` is an `enum` control with
  `soft`/`solid` options.
- **`selectMenuConfig.snippet`** — REAL pure string builder (high value). Asserts:
  includes `import { SelectMenu }` from `@/components/remocn/select-menu`; always
  emits `selectedIndex={n}` (the primary controlled prop); emits non-default
  `selectedIndex`; omits default-equal `variant="soft"`; emits `variant="solid"`
  when non-default; includes the default `options`; ends with `/>`.

**SelectMenu render** is a pure `(selectedIndex | state | style) => visual`
observable only via Remotion render, not unit-tested here.

## Import strategy

`select-menu.test.ts` imports via a mix of **relative paths** and the
**`@/lib/remocn-ui` tsconfig alias**:

- `../index` — relative, for `SelectMenuStyle`, `selectMenuStyle`,
  `selectMenuStyleContext`
- `../use-select-menu-transition` — relative, for `tweenSelectMenuStyle`,
  `computeSelectMenuClick`, `DEFAULT_DURATION`
- `../config` — relative, for `selectMenuConfig`
- `@/lib/remocn-ui` — alias (resolves to `registry/remocn-ui/core/index.ts`),
  for `defaultLightTheme`

Importing `index.tsx` and `use-select-menu-transition.ts` pulls the `remotion`
module (and React), but `selectMenuStyle`, `selectMenuStyleContext`,
`tweenSelectMenuStyle`, and `computeSelectMenuClick` never call
`useCurrentFrame()` at import time or at call time — they are pure value
functions. `bun test` resolves tsconfig `paths`, so the alias works without
additional config.

## Determinism grep checklist (run manually; must print NOTHING)

SelectMenu is frame-free. The component must contain **none** of the following:

```bash
grep -nE "useCurrentFrame|useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/select-menu/index.tsx
```

Expected: no output. Any match is a determinism violation.

`use-select-menu-transition.ts` is the CALLER hook that intentionally reads
`useCurrentFrame()` (via `useStateTransition`). It is not a render component;
the smooth-path design isolates all frame-reading to the hook, keeping
`SelectMenu` pure.

Tier-wide sweep:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/select-menu/index.tsx registry/remocn-ui/core/*.ts
```