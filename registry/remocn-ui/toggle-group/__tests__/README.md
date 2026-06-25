# toggle-group/__tests__

Verification tests for the pure, deterministic surface of the `toggle-group` primitive.

## What is tested

| Section | Source | Coverage |
|---------|--------|----------|
| `DEFAULT_DURATION` | `use-toggle-group-transition.ts` | Constant equals 14 |
| `toggleGroupStyleContext` | `index.tsx` lines 86–99 | trackBg/thumbBg/activeFg/inactiveFg/radius token mapping; items round-trip; light/dark independence |
| `toggleGroupStyle` | `index.tsx` lines 106–112 | Monthly→0, Yearly→1; unknown state→0; empty string→0; 3-item index round-trip |
| `tweenToggleGroupStyle` | `use-toggle-group-transition.ts` lines 33–42 | t=0→a; t=1→b; t=0.5 midpoint; t=0.25 quarter; identity; reverse direction |
| `resolveToggleGroupTransition` | replica of `use-toggle-group-transition.ts` lines 57–82 | before first step; at boundary (progress=0); mid-window eased (non-linear); past window; speed contract |
| `toggleGroupConfig.controls` | `config.ts` | state/size/mode types, defaults, options |
| `toggleGroupConfig.snippet` | `config.ts` | import line; state always emitted; items always emitted inline; default omission; non-default emission; structural round-trip |

## What is NOT tested

**Render path** — `ToggleGroup` calls `useRemocnTheme` (React context) and renders JSX. Not exercised here.

**`SIZE_STYLES`** — This module-private constant maps `ToggleGroupSize` to layout metrics (height, segMinWidth, fontSize, pad, gap). Its values are consumed only inside the JSX render path, which is not exercised here.

## Animation model

`toggleGroupStyle` returns a single numeric field encoding where the thumb sits:

| State | `indicatorOffset` |
|-------|-------------------|
| `"Monthly"` | 0 |
| `"Yearly"` | 1 |
| unknown | 0 (safe fallback) |

Unlike components that have multi-field visuals (opacity, scale, translateY), toggle-group encodes the entire visual in `indicatorOffset` alone. The thumb position, thumb width, and per-label color all derive from this single float inside the pure renderer — so a lerp of `indicatorOffset` slides the thumb smoothly without separate opacity or scale channels.

`useToggleGroupTransition` folds a step list, applies `easings.out` to the linear `progress`, then lerps between the two endpoint presets with `tweenToggleGroupStyle`. Because `out(t) = 1-(1-t)³`, the midpoint `t=0.5` eases to `0.875` — confirmed in the mid-window test: at frame 7 of a 14-frame window, `indicatorOffset=0.875`.

## Snippet items

The snippet **always** emits the `items={[...]}` inline JSX array literal regardless of customizer state. This differs from some other components where items emission is conditional. The inline array ensures the preview shows real labels and remains consistent.

## Determinism grep checklist

Run this on `toggle-group/index.tsx` — it must print nothing:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/toggle-group/index.tsx
```

The `ToggleGroup` component is a pure renderer: no frame reading, no local state, no side effects. Frame reading lives exclusively in `useToggleGroupTransition` (`use-toggle-group-transition.ts`), which is not imported by `index.tsx`.
