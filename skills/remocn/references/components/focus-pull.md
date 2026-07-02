# focus-pull

**Tier:** `remocn` (transition) · **Vibe:** premium · **Natural length:** 46f @ 30fps

Rack-focus transition for `TransitionSeries`. The outgoing scene drifts out of focus and brightens like over-exposed bokeh, the incoming scene resolves from the same blur and settles into sharpness with a gentle lens breath (scale 0.97 → 1). Pure CSS filters and transforms, no dependencies.

## Install

```bash
shadcn add @remocn/focus-pull
```

Lands at `components/remocn/focus-pull.tsx`.

## Props

`focusPull(props)` returns a `TransitionPresentation`.

| Prop | Type | Default |
|---|---|---|
| `blur` | `number` | `16` |

## Example

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { focusPull } from "@/components/remocn/focus-pull";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={80}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 46 })}
    presentation={focusPull()}
  />
  <TransitionSeries.Sequence durationInFrames={80}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

## Use when

- The tone is refined and editorial — premium product films, calm brand moments, testimonials.
- Scenes shift attention rather than location — a neutral, cinematic alternative to `fade-through`.
- Adjacent scenes share a similar palette — the defocus blends them seamlessly.

## Avoid when

- The cut needs energy or direction — use `whip-pan` or `push-through`.
- Fine text must stay legible up to the cut — the defocus starts eating detail early.
