# `command-menu-item` — verification tests

Pure / deterministic verification for the `command-menu-item` component
(`registry/remocn-ui/command-menu-item/`). The render path (`index.tsx`) imports
`useRemocnTheme` which requires React context and cannot run headlessly — it is
NOT exercised here. This suite covers the pure-testable surface:
`commandMenuItemStyleContext`, `commandMenuItemStyle` presets,
`tweenCommandMenuItemStyle` interpolation, and `commandMenuItemConfig` controls
wiring + snippet codegen.

## Animation model — state atom with smooth opt-in

`command-menu-item` follows the standard state-atom pattern (STYLE-GUIDE §1):

**Snap path** (`state?: CommandMenuItemState` prop):  
`<CommandMenuItem>` is a frame-free pure renderer. The `state` prop drives all
visuals. Each state maps to a complete resting keyframe via
`commandMenuItemStyle(state, ctx) => CommandMenuItemStyle`. State changes snap.

**Smooth path** (`style?: CommandMenuItemStyle` prop):  
Callers opt in to smooth transitions by passing a pre-interpolated
`CommandMenuItemStyle` to the `style` prop. The caller — typically
`useCommandMenuItemTransition` — reads `useCurrentFrame()` via
`useStateTransition`, applies `easings.out` to linear progress, and blends the
two state presets via `tweenCommandMenuItemStyle(from, to, t)`. The component
remains frame-free.

**Color fields** (`background`, `labelColor`, `iconColor`) go through
`mixOklch` in the tween — tested as non-empty strings at all `t`. The numeric
field (`scale`) is tested with exact midpoint values.

## How to run

```bash
bun install
bun test registry/remocn-ui/command-menu-item/__tests__
```

## What is covered

- **`DEFAULT_DURATION`** — asserts the constant is 8 frames (shorter than
  the container's 12).

- **`commandMenuItemStyleContext(theme)`** — pure token derivation. Asserts
  all 10 fields map to the correct theme tokens: `idleBg→popover`,
  `hoverBg→accent`, `selectedBg→accent`, `idleFg→popoverForeground`,
  `selectedFg→accentForeground`, `idleIcon→mutedForeground`,
  `selectedIcon→foreground`, `kbdBg→muted`, `kbdFg→mutedForeground`,
  `kbdBorder→border`. Also asserts `pressBg` is a non-empty derived string
  differing from `hoverBg` (the `mixOklch` tint). Confirms all fields are
  non-empty strings. Light/dark themes produce different values.

- **`commandMenuItemStyle(state, ctx)` presets** — every field for every
  state (4 states × 4 fields = 16 assertions):
  - `idle`: background=idleBg, labelColor=idleFg, iconColor=idleIcon, scale=1
  - `hover`: background=hoverBg, labelColor=idleFg, iconColor=selectedIcon, scale=1
  - `press`: background=pressBg, labelColor=idleFg, iconColor=selectedIcon, scale=0.98
  - `selected`: background=selectedBg, labelColor=selectedFg, iconColor=selectedIcon, scale=1
  - Scale invariant: only `press` has scale < 1; all others are exactly 1.
  - All states produce a complete `CommandMenuItemStyle` (all fields defined).

- **`tweenCommandMenuItemStyle(a, b, t)`** — at t=0 all fields equal `a`; at
  t=1 all equal `b`; at t=0.5 numeric field `scale` is the exact midpoint
  (idle→press gives 0.99); color fields are non-empty strings at all t;
  identity case preserves all fields; result has all four fields present.

- **`commandMenuItemConfig.controls`** — state/icon/label/shortcut/mode wiring:
  state is a `select` with options `["idle","hover","press","selected"]` and
  default `"selected"`; icon is a `select` with options
  `["search","settings","user","file"]` and default `"settings"`; label and
  shortcut are `text` controls; mode has default `"light"`.

- **`commandMenuItemConfig.snippet`** — import line, structural shape, state
  always emitted; default label `"Settings"`, icon `"settings"`, mode `"light"`,
  and empty shortcut are omitted; non-default values are emitted; all state
  options round-trip.

## Import strategy

- `../index` — `commandMenuItemStyle`, `commandMenuItemStyleContext`,
  `CommandMenuItemState`
- `../use-command-menu-item-transition` — `tweenCommandMenuItemStyle`,
  `DEFAULT_DURATION`
- `../config` — `commandMenuItemConfig`
- `@/lib/remocn-ui` — `defaultLightTheme`, `defaultDarkTheme`

`useCommandMenuItemTransition` is NOT imported (it reads `useCurrentFrame()`).
Its pure resolver logic is covered in `core/__tests__/timeline.test.ts`; the
additional easing + tween contract is covered by the tween tests above.

## Determinism grep checklist (run manually; must print NOTHING)

`command-menu-item/index.tsx` is a pure renderer — must contain none of:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/command-menu-item/index.tsx
```

Expected: **no output**. Any match is a determinism violation.

`use-command-menu-item-transition.ts` intentionally reads `useCurrentFrame()`
via `useStateTransition` — this is correct and expected for the hook file.

Tier-wide sweep:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/command-menu-item/index.tsx registry/remocn-ui/core/*.ts
```
