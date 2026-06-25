# `command-menu` — verification tests

Pure / deterministic verification for the `command-menu` component
(`registry/remocn-ui/command-menu/`). The render path (`index.tsx`) imports
`useRemocnTheme` which requires React context and cannot run headlessly — it is
NOT exercised here. This suite covers the pure-testable surface:
`filterCommandItems`, `commandMenuStyleContext`, `commandMenuStyle` presets,
`tweenCommandMenuStyle` interpolation, the `useCommandMenuTransition` pure
resolver mirror, and `commandMenuConfig` controls wiring + snippet codegen.

## Animation model — state atom with smooth opt-in

`command-menu` follows the standard state-atom pattern (STYLE-GUIDE §1):

**Snap path** (`state?: CommandMenuState` prop):  
`<CommandMenu>` is a frame-free pure renderer. The `state` prop drives all panel
visuals. Each state maps to a complete resting keyframe via
`commandMenuStyle(state, ctx) => CommandMenuStyle`. State changes snap.

**Smooth path** (`style?: CommandMenuStyle` prop):  
Callers opt in to smooth open/close by passing a pre-interpolated
`CommandMenuStyle` to the `style` prop. The caller — typically
`useCommandMenuTransition` — reads `useCurrentFrame()` via `useStateTransition`,
applies `easings.out` to linear progress, and blends the two presets via
`tweenCommandMenuStyle(from, to, t)`. The component remains frame-free.

**All fields are numeric** (`backdropOpacity`, `panelOpacity`, `panelScale`,
`panelTranslateY`) — `tweenCommandMenuStyle` is a straight four-field lerp with
no `mixOklch` call. All midpoint values are tested exactly.

**Filter function** (`filterCommandItems`) is a pure exported utility —
case-insensitive substring match on the visible query prefix — and is tested
directly here.

## How to run

```bash
bun install
bun test registry/remocn-ui/command-menu/__tests__
```

## What is covered

- **`DEFAULT_DURATION`** — asserts the constant is 12 frames (longer than the
  item's 8; the container transitions more slowly).

- **`filterCommandItems(items, query, revealCount)`** — exported pure filter.
  Asserts: empty query/whitespace-only → all items returned; `revealCount=0`
  → all items (visible prefix is empty); empty items list → empty result;
  prefix narrows: `"profile"` → 1 match, `"se"` → 2 matches (Settings +
  Search docs), `"file"` → New File, `"new"` → New File; no-match returns
  empty array; case-insensitivity (uppercase/mixed queries match lowercase
  labels); `revealCount` slices the query (revealCount=2 on `"settings"` uses
  `"se"` → 2 matches; revealCount=8 uses full `"settings"` → 1 match);
  result items are the same object references (no cloning).

- **`commandMenuStyleContext(theme)`** — pure token derivation. Asserts all
  8 scalar fields plus `itemCtx`: `panelBg→popover`, `panelBorder→border`,
  `inputFg→popoverForeground`, `placeholderFg→mutedForeground`,
  `mutedFg→mutedForeground`, `divider→border`, `caret→foreground`,
  `radius→radius`. `itemCtx` is a nested `CommandMenuItemStyleContext` with
  `idleBg→popover`. Light/dark themes produce different `panelBg`.

- **`commandMenuStyle(state, ctx)` presets** — every field for every state
  (2 states × 4 fields = 8 assertions):
  - `closed`: backdropOpacity=0, panelOpacity=0, panelScale=0.96, panelTranslateY=8
  - `opened`: backdropOpacity=1, panelOpacity=1, panelScale=1, panelTranslateY=0
  - All fields distinct between states; all fields numeric for every state.

- **`tweenCommandMenuStyle(a, b, t)`** — at t=0 all four fields equal `a`; at
  t=1 all equal `b`; at t=0.5 exact midpoints: backdropOpacity=0.5,
  panelOpacity=0.5, panelScale=0.98, panelTranslateY=4; at t=0.25:
  backdropOpacity=0.25, panelOpacity=0.25, panelScale=0.97,
  panelTranslateY=6; identity case; reverse direction (opened→closed same
  midpoints by symmetry).

- **`resolveCommandMenuTransition`** — pure mirror of
  `useCommandMenuTransition` lines 49–73 with `raw` injected. Key additional
  contract: `easings.out` is applied to linear progress before the tween, so
  mid-window at raw=6/dur=12 gives t=out(0.5)=0.875 → backdropOpacity=0.875
  (not 0.5); panelTranslateY=8×(1−0.875)=1; panelScale=0.96+(1−0.96)×0.875.
  Also asserts: before any step → closed style with both endpoints `closed`;
  at boundary progress=0 → t=out(0)=0 → closed style; past window → fully
  opened; speed contract (speed=2 halves the raw frame to reach a step).

- **`commandMenuConfig.controls`** — state/query/revealCount/selectedIndex/
  highlightedIndex/mode wiring: state is a `select` with options
  `["opened","closed"]` and default `"opened"`; query is a `text` with default
  `""`; revealCount is a `number` with default 0 and min 0; selectedIndex
  defaults to −1; highlightedIndex defaults to 0; mode defaults to `"light"`.

- **`commandMenuConfig.snippet`** — import line, structural shape, state always
  emitted; default omissions (empty query, revealCount=0, selectedIndex=−1,
  highlightedIndex=−1, mode=light); non-default emissions; all state options
  round-trip.

## Import strategy

- `../index` — `filterCommandItems`, `commandMenuStyle`,
  `commandMenuStyleContext`, `CommandMenuState`, `CommandMenuEntry`
- `../use-command-menu-transition` — `tweenCommandMenuStyle`, `DEFAULT_DURATION`
- `../config` — `commandMenuConfig`
- `@/lib/remocn-ui` — `defaultLightTheme`, `defaultDarkTheme`, `easings`,
  `Step` type

`useCommandMenuTransition` is NOT imported (it reads `useCurrentFrame()`). Its
pure body is mirrored as `resolveCommandMenuTransition` with the frame injected
as `raw`. `bun test` resolves tsconfig `paths`, so the `@/lib/remocn-ui` alias
works without additional config.

## Determinism grep checklist (run manually; must print NOTHING)

`command-menu/index.tsx` is a pure renderer — must contain none of:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/command-menu/index.tsx
```

Expected: **no output**. Any match is a determinism violation.

`use-command-menu-transition.ts` intentionally reads `useCurrentFrame()` via
`useStateTransition` — correct and expected for the hook file.

Tier-wide sweep:

```bash
grep -nE "useState|useEffect|onClick|onChange|addEventListener|Date\.now|Math\.random" \
  registry/remocn-ui/command-menu/index.tsx registry/remocn-ui/core/*.ts
```
