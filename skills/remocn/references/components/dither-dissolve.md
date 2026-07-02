# dither-dissolve

**Tier:** `remocn` (transition) · **Vibe:** retro · **Natural length:** 40f @ 30fps

Dithering shader transition for `TransitionSeries`. An animated two-color dither field fades in over the cut and back out — the scenes swap behind the pixel texture. The fastest shader transition in the catalog. Frame-driven shader — deterministic renders.

## Install

```bash
shadcn add @remocn/dither-dissolve
```

Lands at `components/remocn/dither-dissolve.tsx`. Installs `@remocn/shader-dithering` and `@paper-design/shaders-react`.

## Props

`ditherDissolve(props)` returns a `TransitionPresentation`.

| Prop | Type | Default |
|---|---|---|
| `colorBack` | `string` | `"#141318"` |
| `colorFront` | `string` | `"#8f88ae"` |
| `shape` | `ShaderDithering["shape"]` | `"simplex"` |
| `speed` | `number` | `1.5` |

## Example

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { ditherDissolve } from "@/components/remocn/dither-dissolve";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={70}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 40 })}
    presentation={ditherDissolve()}
  />
  <TransitionSeries.Sequence durationInFrames={70}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

The incoming scene is revealed at ~58% of the transition — delay its inner animations accordingly (`<Sequence from={24}>` for a 40-frame transition).

## Use when

- The video has a retro, terminal, or print aesthetic — the dither reads as CRT/risograph texture.
- Dev-tool and CLI content — pairs naturally with `terminal-simulator` and `matrix-decode`.
- Cuts need to stay quick but textured — 40 frames, unlike the longer dissolves.

## Avoid when

- The tone is soft and organic — the pixel grid reads technical; use `grain-dissolve` or `perlin-dissolve`.
- Brand colors clash with a two-color reduction — the field is strictly `colorBack`/`colorFront`.
