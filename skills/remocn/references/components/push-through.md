# push-through

**Tier:** `remocn` (transition) · **Vibe:** premium · **Natural length:** 40f @ 30fps

Dolly transition for `TransitionSeries`. The camera pushes forward: the outgoing scene accelerates past the lens, blurring as it grows to `zoom`, while the incoming scene scales up from the depth with a small overshoot settle. Pure CSS transforms, no dependencies.

## Install

```bash
shadcn add @remocn/push-through
```

Lands at `components/remocn/push-through.tsx`.

## Props

`pushThrough(props)` returns a `TransitionPresentation`.

| Prop | Type | Default |
|---|---|---|
| `zoom` | `number` | `2.4` |
| `blur` | `number` | `14` |

## Example

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { pushThrough } from "@/components/remocn/push-through";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={76}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 40 })}
    presentation={pushThrough()}
  />
  <TransitionSeries.Sequence durationInFrames={76}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

## Use when

- The narrative moves deeper into a topic — zooming in on a feature, entering a product, chapter descent.
- A climactic arrival: the CTA or logo scene deserves the camera physically landing on it.
- You want spatial continuity between scenes without any texture or overlay.

## Avoid when

- Scenes are peers moving sideways — use `whip-pan`; the push implies hierarchy (outer → inner).
- Dense text fills the outgoing scene edge-to-edge — the scale-up crops it awkwardly mid-flight.
