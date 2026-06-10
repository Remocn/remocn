# combobox/__tests__

Verification tests for the pure, deterministic surface of the `combobox` primitive.

## What is tested

| Section | Source | Coverage |
|---------|--------|----------|
| `DEFAULT_DURATION` | `use-combobox-transition.ts` | Constant equals 12 |
| `filterComboboxItems` | `index.tsx` lines 77–89 | Empty prefix → all; prefix narrows; no-match → empty; case-insensitive; revealCount slicing; reference preservation |
| `comboboxStyle` | `index.tsx` lines 138–148 | closed keyframe full fields; opened keyframe full fields; distinct per state; all fields numeric |
| `tweenComboboxStyle` | `use-combobox-transition.ts` lines 22–33 | t=0 → a; t=1 → b; t=0.5 midpoint; t=0.25 quarter; identity; reverse direction |
| `resolveComboboxTransition` | replica of `use-combobox-transition.ts` lines 47–71 | before first step; at boundary (progress=0); mid-window eased (non-linear); past window; speed contract |
| `comboboxConfig.controls` | `config.ts` | state/query/revealCount/selectedIndex/highlightedIndex/mode types, defaults, options |
| `comboboxConfig.snippet` | `config.ts` | import line; structural invariants; default omission; non-default emission; state round-trip |

## What is NOT tested

**Render path** — `Combobox` calls `useRemocnTheme` (React context) and renders JSX.
Neither the component function nor its child `SelectItemRow` / `LayoutPlaceholder` trees
are exercised here. Frame-reading belongs to `useComboboxTransition`, which is mirrored
rather than called directly.

**`comboboxStyleContext`** — The context derivation delegates internally to
`inputStyleContext` and `selectItemStyleContext`. Those functions are covered by
`input/__tests__` and `select/__tests__` respectively. Here `comboboxStyleContext` is
called only to build the shared `ctx` fixture used by `comboboxStyle` and the resolver
replica.

## Filter contract

`filterComboboxItems` performs a **case-insensitive substring match** on the
**visible query prefix** (`query.slice(0, revealCount)`, or the whole query when
`revealCount` is omitted). An empty visible prefix (including after `.trim()`) returns
all items unchanged.

This is intentionally parallel to `filterCommandItems` in the command-menu — the
difference is item shape: combobox items are plain `string[]`, so the match is on the
string itself rather than `.label`.

## Animation model — combobox is a standard state atom

`comboboxStyle` returns three numeric fields that encode the panel reveal:

| State | `panelOpacity` | `panelScale` | `panelTranslateY` |
|-------|---------------|--------------|-------------------|
| `closed` | 0 | 0.96 | -4 |
| `opened` | 1 | 1.00 | 0 |

`useComboboxTransition` folds a step list, applies `easings.out` to the linear
`progress`, then lerps between the two endpoint presets with `tweenComboboxStyle`.
Because `out(t) = 1-(1-t)³`, the midpoint `t=0.5` eases to `0.875` — confirmed in
the mid-window tests: `panelOpacity` at frame 6 of a 12-frame window is `0.875`, not
`0.5`.

## Determinism grep checklist

Run this on `combobox/index.tsx` — it must print nothing:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/combobox/index.tsx
```

The `Combobox` component is a pure renderer: no frame reading, no local state, no
side effects. Frame reading lives exclusively in `useComboboxTransition`
(`use-combobox-transition.ts`), which is not imported here.
