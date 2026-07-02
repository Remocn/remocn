# wave-wipe

**Tier:** `remocn` (transition) · **Vibe:** premium · **Natural length:** 60f @ 30fps

Grain-gradient wave transition for `TransitionSeries`. A full-frame grainy wave field washes over the outgoing scene while its bands drift upward, then the incoming scene rides in from the bottom on top of the field and covers it. Frame-driven shader — deterministic renders.

## Install

```bash
shadcn add @remocn/wave-wipe
```

Lands at `components/remocn/wave-wipe.tsx`. Installs `@remocn/shader-grain-gradient` and `@paper-design/shaders-react`.

## Props

`waveWipe(props)` returns a `TransitionPresentation`.

| Prop | Type | Default |
|---|---|---|
| `colors` | `string[]` | `["#3a3a52", "#4a4a68", "#8f88ae"]` |
| `colorBack` | `string` | `"#141318"` |
| `intensity` | `number` | `0.2` |
| `softness` | `number` | `0.7` |
| `noise` | `number` | `0.4` |
| `zoom` | `number` | `1.16` |
| `speed` | `number` | `1` |

## Example

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { waveWipe } from "@/components/remocn/wave-wipe";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={88}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 60 })}
    presentation={waveWipe()}
  />
  <TransitionSeries.Sequence durationInFrames={88}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

The incoming scene starts rising at ~30% and lands at ~95% of the transition — delay its inner animations to ~80% of the transition duration (`<Sequence from={48}>` for a 60-frame transition) so they play after the scene has mostly settled. Match `colorBack` to the scene backgrounds so the wave reads as one continuous surface.

## Use when

- The transition should feel like physical motion — a swell washing over the frame, tides, page-over-page.
- Scenes stack vertically in the narrative: the next chapter literally arrives from below.
- The video has a textured, analog tone that the grain complements.

## Avoid when

- Scenes relate horizontally (steps in a flow) — the vertical sweep fights the reading direction.
- The tone is crisp and minimal — the grain texture adds visual noise by design.
