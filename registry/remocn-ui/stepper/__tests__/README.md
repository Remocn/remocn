# stepper/__tests__

Verification tests for the pure, deterministic surface of the `stepper` primitive.

## What is tested

| Section | Source | Coverage |
|---------|--------|----------|
| `DEFAULT_DURATION` | `use-stepper-transition.ts` | Constant equals 24 |
| `stepperStyleContext` | `index.tsx` lines 76–85 | primary/primaryFg/mutedBg/border/mutedFg/foreground token mapping |
| `stepperStyle` | `index.tsx` lines 91–93 | Identity map: `stepperStyle(n).position === n` for integers and floats |
| `stepCircleAt` | `index.tsx` lines 108–123 | fill/checkDraw/active at positions 0, 0.5, 1, 1.5, 2; clamp at 0 and 1; fill===checkDraw invariant |
| `connectorFillAt` | `index.tsx` lines 126–128 | Fill fraction 0/0.5/1 at key positions; clamp at 0 for past connector |
| `tweenStepperStyle` | `use-stepper-transition.ts` lines 34–40 | t=0→a; t=1→b; t=0.5 midpoint; t=0.25 quarter; identity; reverse direction |
| `stepperStyleAt` | `use-stepper-transition.ts` lines 66–102 | empty steps; before-first; past-last; mid-window eased (non-linear); at boundary; two-segment timeline; custom duration; single-step edge case |
| `stepperConfig.controls` | `config.ts` | activeIndex (number, default 1, min 0, max 2, step 1); mode (select, default light) |
| `stepperConfig.snippet` | `config.ts` | import line; structural round-trip; activeIndex always emitted; steps literal always emitted; mode omitted at default; mode emitted non-default; numeric round-trip |

## What is NOT tested

**Render path** — `Stepper` calls `useRemocnTheme` (React context) and renders JSX. Not exercised here.

**`useStepperTransition`** — This hook calls `useCurrentFrame()` from Remotion and cannot run outside a render tree. Its pure body is the exported `stepperStyleAt` function, which is tested directly. The relationship is documented in `use-stepper-transition.ts`:
> `useStepperTransition` is exactly `stepperStyleAt(steps, useCurrentFrame() * speed, opts)`

**`StepperStep.easing` overrides** — The `easing` field on each step can override the default `"out"` easing per-transition. The default `"out"` path is covered by the mid-window tests. Custom easing names (`"in"`, `"inOut"`, etc.) delegate to `easings[name]` from `@/lib/remocn-ui` — their correctness is covered by the core timeline tests, not here.

## Animation model

`StepperStyle` has exactly one animated field: `position` — a continuous float (0..n-1) representing where the active step sits. Every visual in the render derives purely from this single value:

| Derived quantity | Formula |
|---|---|
| `fill` for step i | `clamp01(position - i)` |
| `checkDraw` for step i | same as `fill` |
| `active` for step i | `Math.floor(position) === i && fill < 1` |
| connector fill between i and i+1 | `clamp01(position - i)` |

A lerp of `position` advances all steps and connectors simultaneously without jumps — the same single-value design as `indicatorOffset` in toggle-group and tabs.

`stepperStyleAt` applies `easings.out` to the linear progress before interpolating, so `out(0.5) = 0.875` — the mid-window test at `raw=12` of a 24-frame window confirms `position=0.875`, not the linear `0.5`.

## Determinism grep checklist

Run this on `stepper/index.tsx` — it must print nothing:

```bash
grep -nE "useState|useEffect|useCurrentFrame|onClick|onChange|addEventListener|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/stepper/index.tsx
```

The `Stepper` component is a pure renderer: no frame reading, no local state, no side effects. Frame reading lives exclusively in `useStepperTransition` (`use-stepper-transition.ts`), which is not imported by `index.tsx`.
