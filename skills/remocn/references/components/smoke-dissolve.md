# smoke-dissolve

**Tier:** `remocn` (transition) · **Vibe:** premium · **Natural length:** 104f @ 30fps

Smoke-ring shader transition for `TransitionSeries`. A ring of smoke expands outward from the center across the frame while the incoming scene condenses inside it with a scale + blur settle. Frame-driven shader — deterministic renders.

## Install

```bash
shadcn add @remocn/smoke-dissolve
```

Lands at `components/remocn/smoke-dissolve.tsx`. Installs `@remocn/shader-smoke-ring` and `@paper-design/shaders-react`.

## Props

`smokeDissolve(props)` returns a `TransitionPresentation`.

| Prop | Type | Default |
|---|---|---|
| `colorBack` | `string` | `"#141318"` |
| `colors` | `string[]` | `["#8f88ae"]` |
| `speed` | `number` | `1` |

## Example

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { smokeDissolve } from "@/components/remocn/smoke-dissolve";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={110}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 104 })}
    presentation={smokeDissolve()}
  />
  <TransitionSeries.Sequence durationInFrames={110}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

The incoming scene is revealed at ~55% of the transition — delay its inner animations accordingly (`<Sequence from={57}>` for a 104-frame transition). Match `colorBack` to the scene backgrounds so the field entry reads seamless.

## Use when

- A reveal should feel like emerging from mist — moody, cinematic, mysterious openings.
- Center-out motion suits the content: the new scene is literally born at the middle of the frame.
- Dark palettes — the smoke ring reads best against deep backgrounds.

## Avoid when

- Fast cuts — the ring expansion needs ~100 frames of runway.
- Bright, flat, poster-like scenes — the smoke loses definition on light backgrounds.
