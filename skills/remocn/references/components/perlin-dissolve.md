# perlin-dissolve

**Tier:** `remocn` (transition) · **Vibe:** premium · **Natural length:** 104f @ 30fps

Perlin-noise shader transition for `TransitionSeries`. A noise field sweeps its threshold from back to front across the frame — the outgoing scene dissolves into organic noise and the incoming one resolves through it. Frame-driven shader — deterministic renders.

## Install

```bash
shadcn add @remocn/perlin-dissolve
```

Lands at `components/remocn/perlin-dissolve.tsx`. Installs `@remocn/shader-perlin-noise` and `@paper-design/shaders-react`.

## Props

`perlinDissolve(props)` returns a `TransitionPresentation`.

| Prop | Type | Default |
|---|---|---|
| `colorBack` | `string` | `"#141318"` |
| `colorFront` | `string` | `"#8f88ae"` |
| `softness` | `number` | `0.1` |
| `speed` | `number` | `1` |

## Example

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { perlinDissolve } from "@/components/remocn/perlin-dissolve";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={110}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 104 })}
    presentation={perlinDissolve()}
  />
  <TransitionSeries.Sequence durationInFrames={110}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

The incoming scene is revealed at ~50% of the transition — delay its inner animations accordingly (`<Sequence from={52}>` for a 104-frame transition). Match `colorBack` to the scene backgrounds so the field entry reads seamless.

## Use when

- Organic, atmospheric chapter changes — nature, ambient, calm product films.
- The two scenes differ strongly in content — the noise field neutralizes the mismatch.
- You want the classic film-dissolve feel with texture instead of a plain crossfade.

## Avoid when

- Fast cuts — the threshold sweep needs ~100 frames to read as a sweep, not a flicker.
- Sharp geometric brand language — the noise is deliberately unstructured; use `dither-dissolve`.
