# swirl-dissolve

**Tier:** `remocn` (transition) · **Vibe:** premium · **Natural length:** 104f @ 30fps

Swirl shader transition for `TransitionSeries`. The frame twists into concentric swirling bands, holds the vortex mid-transition, and the incoming scene spins out of it with a scale + blur settle. Frame-driven shader — deterministic renders.

## Install

```bash
shadcn add @remocn/swirl-dissolve
```

Lands at `components/remocn/swirl-dissolve.tsx`. Installs `@remocn/shader-swirl` and `@paper-design/shaders-react`.

## Props

`swirlDissolve(props)` returns a `TransitionPresentation`.

| Prop | Type | Default |
|---|---|---|
| `colors` | `string[]` | `["#1f1d29", "#413d56", "#8f88ae"]` |
| `colorBack` | `string` | `"#141318"` |
| `bandCount` | `number` | `10` |
| `softness` | `number` | `0.35` |
| `speed` | `number` | `1` |

## Example

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { swirlDissolve } from "@/components/remocn/swirl-dissolve";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={110}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 104 })}
    presentation={swirlDissolve()}
  />
  <TransitionSeries.Sequence durationInFrames={110}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

The incoming scene is revealed at ~77% of the transition — delay its inner animations accordingly (`<Sequence from={80}>` for a 104-frame transition). Match `colorBack` to the scene backgrounds so the field entry reads seamless.

## Use when

- A dramatic chapter break where the frame should visibly transform — reveals, act changes.
- The brand can carry hypnotic, rotational motion; band colors take brand palettes well.
- You have runtime to spare — the full twist-untwist arc needs ~3.5 seconds.

## Avoid when

- Fast cuts — under ~80 frames the twist arc collapses into noise.
- Repeated use within one video — the vortex is a statement move, one per video.
