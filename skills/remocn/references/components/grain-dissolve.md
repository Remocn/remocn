# grain-dissolve

**Tier:** `remocn` (transition) · **Vibe:** premium · **Natural length:** 76f @ 30fps

Grain-gradient shader transition for `TransitionSeries`. The outgoing scene blurs away into a field of flat shapes that grow, roughen into grain (`intensity` and `softness` sweep 0 → 1), and the incoming scene condenses out of the dissolved texture. Frame-driven shader — deterministic renders.

## Install

```bash
shadcn add @remocn/grain-dissolve
```

Lands at `components/remocn/grain-dissolve.tsx`. Installs `@remocn/shader-grain-gradient` and `@paper-design/shaders-react`.

## Props

`grainDissolve(props)` returns a `TransitionPresentation`.

| Prop | Type | Default |
|---|---|---|
| `colors` | `string[]` | `["#3a3a52", "#4a4a68", "#8f88ae"]` |
| `colorBack` | `string` | `"#141318"` |
| `shape` | `"wave" \| "dots" \| "truchet" \| "corners" \| "ripple" \| "blob" \| "sphere"` | `"blob"` |
| `noise` | `number` | `0.3` |
| `zoom` | `number` | `2` |
| `speed` | `number` | `1` |

## Example

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { grainDissolve } from "@/components/remocn/grain-dissolve";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={96}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 76 })}
    presentation={grainDissolve({ shape: "blob" })}
  />
  <TransitionSeries.Sequence durationInFrames={96}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

The incoming scene is revealed at ~70% of the transition — delay its inner animations accordingly (`<Sequence from={54}>` for a 76-frame transition). Match `colorBack` to the scene backgrounds so the field reads seamless.

## Use when

- The video has an editorial, textured, analog feel — grain reads as film and print.
- Chapter or mood changes where the scene should decompose rather than move.
- The `shape` prop should match the brand: `blob` organic, `wave` calm, `dots` halftone, `sphere` volumetric.

## Avoid when

- The transition must be fast — under ~50 frames the intensity/softness sweep has no room to read.
- The tone is crisp and minimal — the grain texture adds visual noise by design.
