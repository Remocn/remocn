# icon-scatter

**Tier:** `remocn` (transition) · **Vibe:** playful · **Natural length:** 40f @ 30fps

A field of line icons flies in and fills the frame, a cover fill hides the swap at the field's peak, then the icons scatter away to reveal the incoming scene.

## Install

```bash
shadcn add @remocn/icon-scatter
```

Lands at `components/remocn/icon-scatter.tsx`.

## Props

`iconScatter(props)` returns a `TransitionPresentation`.

| Prop | Type | Default |
|---|---|---|
| `count` | `number` | `15` |
| `color` | `string` | `"#fafafa"` |
| `coverColor` | `string` | `"#0a0a0a"` |
| `coverOpacity` | `number` | `0.92` |
| `strokeWidth` | `number` | `2` |
| `flyDistance` | `number` | `260` |
| `seed` | `string` | `"icon-scatter"` |

## Example

```tsx
<TransitionSeries.Transition
  timing={linearTiming({ durationInFrames: 40 })}
  presentation={iconScatter({ count: 15 })}
/>
```

## Use when

- Playful product or app transitions where icons are part of the brand's visual language.
- A feature-to-feature cut wants a moment of energy before settling into the next scene.
- The cover fill can be tuned to match the outgoing scene's background so the swap hides cleanly.

## Don't use when

- The piece is minimal or serious — use `fade-through` for a quieter cut instead.
- The brand has no icon system to draw from — a generic icon field would look unrelated to the product.
