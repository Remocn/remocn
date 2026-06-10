# popover/__tests__

Verification tests for the pure, deterministic surface of the `popover` primitive.

## What is tested

| Section | Source | Coverage |
|---------|--------|----------|
| `DEFAULT_DURATION` | `use-popover-transition.ts` | Constant equals 10 |
| `popoverStyle` | `index.tsx` lines 65–72 | closed keyframe full fields; opened keyframe full fields; distinct per state; all fields numeric; default arm |
| `tweenPopoverStyle` | `use-popover-transition.ts` lines 20–30 | t=0 → a; t=1 → b; t=0.5 midpoint; t=0.25 quarter; identity; reverse direction |
| `resolvePopoverTransition` | replica of `use-popover-transition.ts` lines 44–57 | before first step; at boundary (progress=0); mid-window eased (non-linear); past window; speed contract |
| `popoverConfig.controls` | `config.ts` | state/side/title/description/width/mode types, defaults, options |
| `popoverConfig.snippet` | `config.ts` | import line; structural invariants; default omission; non-default emission; state/side round-trip |

## What is NOT tested

**Render path** — `Popover` calls `useRemocnTheme` (React context) and renders JSX. The component function is not exercised here.

**`offsetFor`** — This module-private helper (not exported) translates the `translate` magnitude into a CSS `x`/`y` offset for the active `side`. Its contract is:

| `side` | `x` | `y` |
|--------|-----|-----|
| `top` | `0` | `+translate` (card above anchor, lifts up toward it) |
| `bottom` | `0` | `-translate` (card below, lifts up) |
| `left` | `+translate` | `0` |
| `right` | `-translate` | `0` |

Because `offsetFor` is not exported it cannot be unit-tested directly. The `translate` field it consumes is fully covered through `popoverStyle`, `tweenPopoverStyle`, and the resolver replica.

## Animation model

`popoverStyle` returns three numeric fields encoding the card reveal:

| State | `opacity` | `scale` | `translate` |
|-------|-----------|---------|-------------|
| `closed` | 0 | 0.97 | 6 |
| `opened` | 1 | 1.00 | 0 |

`usePopoverTransition` folds a step list, applies `easings.out` to the linear `progress`, then lerps between the two endpoint presets with `tweenPopoverStyle`. Because `out(t) = 1-(1-t)³`, the midpoint `t=0.5` eases to `0.875` — confirmed in the mid-window tests: at frame 5 of a 10-frame window, `opacity=0.875`, `scale≈0.99625`, `translate=0.75`.

The `side` prop is **static** — it only sets the enter-translate axis/sign in `offsetFor` and is not animated.

## Determinism grep checklist

Run this on `popover/index.tsx` — it must print nothing:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/popover/index.tsx
```

The `Popover` component is a pure renderer: no frame reading, no local state, no side effects. Frame reading lives exclusively in `usePopoverTransition` (`use-popover-transition.ts`), which is not imported here.
