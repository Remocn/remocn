# context-menu/__tests__

Verification tests for the pure, deterministic surface of the `context-menu` primitive.

## What is tested

| Section | Source | Coverage |
|---------|--------|----------|
| `DEFAULT_DURATION` | `use-context-menu-transition.ts` | Constant equals 10 |
| `contextMenuStyleContext` | `index.tsx` lines 73–82 | panelBg/panelBorder/radius token mapping; itemCtx is non-null object; light/dark independence |
| `contextMenuStyle` | `index.tsx` lines 89–99 | closed keyframe full fields; opened keyframe full fields; distinct per state; all fields numeric; default arm |
| `tweenContextMenuStyle` | `use-context-menu-transition.ts` lines 22–32 | t=0 → a; t=1 → b; t=0.5 midpoint; t=0.25 quarter; identity; reverse direction |
| `resolveContextMenuTransition` | replica of `use-context-menu-transition.ts` lines 46–70 | before first step; at boundary (progress=0); mid-window eased (non-linear); past window; speed contract |
| `contextMenuConfig.controls` | `config.ts` | state/highlightedIndex/mode types, defaults, options |
| `contextMenuConfig.snippet` | `config.ts` | import line; structural invariants; items always emitted; default omission; non-default emission; state round-trip |

## What is NOT tested

**Render path** — `ContextMenu` calls `useRemocnTheme` (React context) and renders JSX. Not exercised here.

**`rowState`** — This module-private function (not exported) maps `(i, highlightedIndex, pressedIndex)` to a `DropdownMenuItemState`. Its contract is:

| Priority | Condition | Result |
|----------|-----------|--------|
| 1 (highest) | `i === pressedIndex` | `"press"` |
| 2 | `i === highlightedIndex` | `"hover"` |
| 3 (default) | otherwise | `"idle"` |

Note: unlike `Select`/`Combobox` there is no `"selected"` state — context menus do not have a persistent selection; press is transient.

**`contextMenuStyleContext` sub-delegation** — The `itemCtx` field is produced by `dropdownMenuItemStyleContext`; that function's correctness is covered by `dropdown-menu/__tests__`. Here it is called only to build the shared `ctx` fixture.

## Animation model

`contextMenuStyle` returns three numeric fields encoding the panel reveal. Unlike `DropdownMenu` (which has a trigger and anchors `transformOrigin` to the top), the context menu grows from the **top-left corner** (the click point) via `transformOrigin: "top left"`:

| State | `opacity` | `scale` | `translateY` |
|-------|-----------|---------|--------------|
| `closed` | 0 | 0.95 | -4 |
| `opened` | 1 | 1.00 | 0 |

`useContextMenuTransition` folds a step list, applies `easings.out` to the linear `progress`, then lerps between the two endpoint presets with `tweenContextMenuStyle`. Because `out(t) = 1-(1-t)³`, the midpoint `t=0.5` eases to `0.875` — confirmed in the mid-window tests: at frame 5 of a 10-frame window, `opacity=0.875`, `scale≈0.99375`, `translateY=-0.5`.

## Snippet items

The snippet always emits `items={...}` with the default item array serialized via `JSON.stringify`. This ensures the preview shows real labels and is consistent regardless of customizer state.

## Determinism grep checklist

Run this on `context-menu/index.tsx` — it must print nothing:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/context-menu/index.tsx
```

The `ContextMenu` component is a pure renderer: no frame reading, no local state, no side effects. Frame reading lives exclusively in `useContextMenuTransition` (`use-context-menu-transition.ts`), which is not imported here.
