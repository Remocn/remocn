# ripple-zoom

**Tier:** `remocn` (transition) · **Vibe:** premium · **Natural length:** 88f @ 30fps

Grain-gradient ripple transition for `TransitionSeries`. The outgoing scene blows past the camera, a grainy ripple field opens, and the camera dives through the center of the rings — the field magnifies (scale 0.2 → `zoom`) while the incoming scene counter-scales up from the depth (0.2 → 1) with a blur settle, so the two opposed scales read as one continuous dolly onto the new scene. Frame-driven shader — deterministic renders.

## Install

```bash
shadcn add @remocn/ripple-zoom
```

Lands at `components/remocn/ripple-zoom.tsx`. Installs `@remocn/shader-grain-gradient` and `@paper-design/shaders-react`.

## Props

`rippleZoom(props)` returns a `TransitionPresentation`.

| Prop | Type | Default |
|---|---|---|
| `colors` | `string[]` | `["#3a3a52", "#4a4a68", "#8f88ae"]` |
| `colorBack` | `string` | `"#141318"` |
| `intensity` | `number` | `0.5` |
| `softness` | `number` | `0.5` |
| `noise` | `number` | `0.5` |
| `zoom` | `number` | `4` |
| `speed` | `number` | `1` |

## Example

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { rippleZoom } from "@/components/remocn/ripple-zoom";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={102}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 88 })}
    presentation={rippleZoom()}
  />
  <TransitionSeries.Sequence durationInFrames={102}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

Keep the incoming scene TRANSPARENT (no background) — it scales up from the depth and lands on the ripple field, which stays behind it after the transition frame. The scene content itself is the subject of the dolly; a static centered title works best, no extra entrance animation needed.

## Use when

- A hero statement or logo deserves a camera move — the dolly-through-rings reads as arriving at the point.
- The narrative zooms in: overview → detail, product → feature, chapter → moment.
- The video already uses the grain-gradient family (grain-dissolve, wave-wipe) — same texture language.

## Avoid when

- The incoming scene has an opaque full-frame background — it hides the field and kills the depth illusion.
- Scenes chain rapidly — the fly-through needs ~88 frames; shorter reads as a scale pop.
