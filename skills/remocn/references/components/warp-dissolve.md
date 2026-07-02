# warp-dissolve

**Tier:** `remocn` (transition) · **Vibe:** premium · **Natural length:** 76f @ 30fps

Domain-warp shader transition for `TransitionSeries`. The outgoing scene swells and blurs into a folding liquid color field, distortion peaks mid-transition, and the incoming scene sharpens back out of the warp. Frame-driven shader — deterministic renders.

## Install

```bash
shadcn add @remocn/warp-dissolve
```

Lands at `components/remocn/warp-dissolve.tsx`. Installs `@remocn/shader-warp` and `@paper-design/shaders-react`.

## Props

`warpDissolve(props)` returns a `TransitionPresentation`.

| Prop | Type | Default |
|---|---|---|
| `colors` | `string[]` | `["#141318", "#3a3a5c", "#1f1d29", "#8f88ae"]` |
| `distortion` | `number` | `0.8` |
| `swirl` | `number` | `0.6` |
| `softness` | `number` | `1` |
| `speed` | `number` | `1` |

## Example

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { warpDissolve } from "@/components/remocn/warp-dissolve";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={96}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 76 })}
    presentation={warpDissolve({ colors: ["#141318", "#3a3a5c", "#1f1d29", "#8f88ae"] })}
  />
  <TransitionSeries.Sequence durationInFrames={96}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

The incoming scene is revealed at ~66% of the transition — delay its inner animations accordingly (`<Sequence from={50}>` for a 76-frame transition). Match the first `colors` entry to the scene backgrounds so the melt reads seamless.

## Use when

- Moving between chapters or moods — the melt reads as time passing or context shifting.
- The brand is organic, creative, or experimental; the field colors take brand palettes well.
- You want a slow, textured transition that holds attention for two-plus seconds.

## Avoid when

- The transition must be fast — under ~50 frames the melt has no room to read and looks like a smeared crossfade.
- Scenes are spatially related steps of one flow — use a directional move instead of a dissolve.
