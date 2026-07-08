# zoom-blur

**Tier:** `remocn` (transition) · **Vibe:** clean · **Natural length:** 18f @ 30fps

Depth punch-in transition for `TransitionSeries`. The outgoing scene pushes through the viewer, scaling from 1 to 1.12 into blur, while the incoming one resolves out of blur from 0.9 to 1 — both riding a soft opacity crossfade. The presentation applies no internal easing; the timing function shapes the curve. Pure CSS transforms, no dependencies.

## Install

```bash
shadcn add @remocn/zoom-blur
```

Lands at `components/remocn/zoom-blur.tsx`.

## Props

`zoomBlur(props)` returns a `TransitionPresentation`.

| Prop | Type | Default |
|---|---|---|
| `blur` | `number` | `16` |
| `rise` | `number` | `0` |

## Example

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { zoomBlur } from "@/components/remocn/zoom-blur";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={70}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 18 })}
    presentation={zoomBlur()}
  />
  <TransitionSeries.Sequence durationInFrames={70}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

## Use when

- You need a default, general-purpose cut for a product demo — the de-facto workhorse transition of the catalog.
- The rhythm can be anything — it reads clean at both fast and slow cadences.
- You want a sense of depth without committing to a strong directional statement.

## Avoid when

- The cut needs lateral direction — use `whip-pan`.
- The moment needs explicit hierarchy descent (outer → inner) — use `push-through`.
