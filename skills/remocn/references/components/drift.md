# drift

**Tier:** `remocn` (layout) · **Vibe:** clean · **Natural length:** 90f @ 30fps

Slow camera drift wrapper. Scales children linearly from `1` to `1 + grow` over the wrapping sequence's duration, so no frame is ever perfectly static. The speed is constant on purpose — a steady creep, not an eased zoom. Because `durationInFrames` comes from `useVideoConfig()`, which is Sequence-scoped, `Drift` automatically fits its scene when placed inside a `TransitionSeries.Sequence`. Transform only — no blur or opacity change. Deps: `remotion` only.

## Install

```bash
shadcn add @remocn/drift
```

Lands at `components/remocn/drift.tsx`.

## Props

| Prop | Type | Default |
|---|---|---|
| `grow` | `number` | `0.035` |

## Example

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { Drift } from "@/components/remocn/drift";
import { zoomBlur } from "@/components/remocn/zoom-blur";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={90}>
    <Drift>
      <SceneA />
    </Drift>
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 18 })}
    presentation={zoomBlur()}
  />
  <TransitionSeries.Sequence durationInFrames={90}>
    <Drift>
      <SceneB />
    </Drift>
  </TransitionSeries.Sequence>
</TransitionSeries>
```

## Text under drift

The slow zoom keeps every glyph in sub-pixel motion, and glyph rasters sit on whole device pixels — plain text inside `Drift` trembles while borders right next to it glide. Give each text container its own compositor layer so the zoom moves a cached texture instead of re-rasterizing glyphs every frame:

```tsx
<Drift>
  <div style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
    <div style={{ willChange: "transform" }}>
      <h1>Quarterly Report</h1>
      <p>Revenue grew across every region.</p>
    </div>
  </div>
</Drift>
```

One layer per text container — never per word or character (many small text layers shimmer even at rest), and never on `Drift` itself (a promoted wrapper turns borders into resampled texture: 1px lines pulse between sharp and blurry as the scale creeps). Borders and other hairline geometry stay outside the promoted layer — fresh rasterization every frame is what lets them glide.

## Use when

- Any static scene should feel alive — hero cards, feature panels, dashboards sitting between transitions.
- You want the default anti-static wrapper of the catalog — reach for it whenever a scene would otherwise hold a frozen frame.

## Avoid when

- The content is already animated with strong motion — layering drift on top of it doubles the movement and muddies the read.
- You need a noticeable, dramatic zoom — this is a creep, not a statement; use a real scale animation or `zoom-blur` for punch.
