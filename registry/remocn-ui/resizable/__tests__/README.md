# resizable — test suite

`bun test registry/remocn-ui/resizable/__tests__`

## What is tested

Pure, deterministic functions only. Remotion hooks (`useCurrentFrame`, `useRemocnTheme`) are never imported.

| Section | Subject | Source |
|---------|---------|--------|
| 1 | `DEFAULT_DURATION` = 18 | `use-resizable-transition.ts` |
| 2 | `resizableHandleStyle(handleState)` presets | `index.tsx:75-87` |
| 3 | `clampRatio(ratio, minRatio, maxRatio)` mirror | `index.tsx:66-68` |
| 4 | `resizableStyleContext(theme)` token mapping | `index.tsx:106-116` |
| 5 | `resizableStyle(ratio, handleState)` snap composer | `index.tsx:123-133` |
| 6 | `tweenResizableStyle(a, b, t)` lerp | `use-resizable-transition.ts:42-53` |
| 7 | `resizableStyleAt(steps, raw, opts)` dual-channel core | `use-resizable-transition.ts:152-165` |
| 8 | `resizableConfig.controls` wiring | `config.ts` |
| 9 | `resizableConfig.snippet` codegen | `config.ts` |

## Animation model

Resizable is a **dual-channel** atom (identical pattern to `slider`). Both channels live in a single `ResizableStyle`:

| Field | Channel | Default when empty |
|-------|---------|--------------------|
| `ratio` | numeric, lerps from step to step | `0.5` |
| `handleScale` | handle-visual, from `resizableHandleStyle` preset | idle = `1` |
| `handleRingOpacity` | handle-visual, from `resizableHandleStyle` preset | idle = `0` |

### Channel fold (per-channel, independent)

```
ratioSteps  = steps.filter(s => s.ratio !== undefined)
handleSteps = steps.filter(s => s.handleState !== undefined)
```

Each channel is resolved independently and merged into one `ResizableStyle`.

### Easing

All transitions use `easings.out` (cubic ease-out) by default:

```
out(t) = 1 - (1 - t)^3
out(0.5) = 0.875
```

Key numeric used in mid-window tests:

| Setup | raw | Window | linear t | out(t) | Expected ratio |
|-------|-----|--------|----------|--------|----------------|
| `[{at:0,ratio:0.3},{at:18,ratio:0.7}]` | 9 | `[0..18]` | 0.5 | 0.875 | `0.3 + 0.4*0.875 = 0.65` |

### Handle presets

| state | `handleScale` | `handleRingOpacity` |
|-------|--------------|---------------------|
| `idle` | 1 | 0 |
| `hover` | 1.15 | 1 |
| `press` | 1.25 | 1 |

## Determinism grep checklist

Before `bun test`, confirm these are true in the source:

- `use-resizable-transition.ts` — `export const DEFAULT_DURATION = 18`
- `index.tsx` — `resizableHandleStyle("hover")` returns `{ handleScale: 1.15, handleRingOpacity: 1 }`
- `index.tsx` — `resizableHandleStyle("press")` returns `{ handleScale: 1.25, handleRingOpacity: 1 }`
- `index.tsx` — `resizableHandleStyle("idle")` returns `{ handleScale: 1, handleRingOpacity: 0 }`
- `index.tsx` — `resizableStyleContext` maps `containerBg=background`, `panelBg=muted`, `grip=border`, `placeholderFg=mutedForeground`
- `use-resizable-transition.ts` — empty ratio steps → `return 0.5`; empty handle steps → `return resizableHandleStyle("idle")`
- `config.ts` — `ratio` control `default=0.5`, `handleState` control `default='idle'`, `direction` control `default='horizontal'`
- `config.ts` — snippet omits `handleState` when `"idle"`, omits `direction` when `"horizontal"`, omits `mode` when `"light"`
