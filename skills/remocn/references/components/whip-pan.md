# whip-pan

**Tier:** `remocn` (transition) · **Vibe:** kinetic · **Natural length:** 26f @ 30fps

Camera-whip transition for `TransitionSeries`. Both scenes fly through the frame in one direction as a single continuous pan — motion blur and a subtle smear stretch peak at maximum velocity mid-transition and hide the seam. Pure CSS transforms, no dependencies.

## Install

```bash
shadcn add @remocn/whip-pan
```

Lands at `components/remocn/whip-pan.tsx`.

## Props

`whipPan(props)` returns a `TransitionPresentation`.

| Prop | Type | Default |
|---|---|---|
| `direction` | `"left" \| "right" \| "up" \| "down"` | `"left"` |
| `blur` | `number` | `24` |

## Example

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { whipPan } from "@/components/remocn/whip-pan";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={70}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 26 })}
    presentation={whipPan({ direction: "left" })}
  />
  <TransitionSeries.Sequence durationInFrames={70}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

## Use when

- Cuts need to feel fast and energetic — feature-to-feature jumps, montage rhythm, tech demos.
- Scenes are peers in a sequence and the narrative moves sideways (or up/down a stack).
- You need the workhorse directional cut — this is the default kinetic transition of the catalog.

## Avoid when

- The moment is calm or contemplative — the whip reads as urgency; use `focus-pull`.
- More than ~3 whips in a row in the same direction — vary direction or alternate with `fade-through`.
