# ink-arrow

**Tier:** `remocn` (animation) · **Vibe:** paper · **Natural length:** 150f @ 30fps

A hand-drawn arrow between two points. The pen drags a wobbly bezier from `from` to `to` over a few stop-motion poses, then draws the head one stroke at a time — out from the tip to one side, then the other. Each control point carries a per-seed wobble, so the curve never looks geometric.

## Install

```bash
shadcn add @remocn/ink-arrow
```

Lands at `components/remocn/ink-arrow.tsx`. Pulls in `@remocn/stop-motion` and `@remocn/brush`.

## Props

| Prop | Type | Default |
|---|---|---|
| `from` | `{ x: number; y: number }` | required |
| `to` | `{ x: number; y: number }` | required |
| `curvature` | `number` | `0.35` |
| `color` | `string` | `"#26242c"` |
| `strokeWidth` | `number` | `8` |
| `pressure` | `number` | `0.2` |
| `release` | `number` | `1` |
| `grain` | `number` | `1` |
| `delay` | `number` | `0` |
| `drawDur` | `number` | `36` |
| `headSize` | `number` | `24` (floor — grows with `strokeWidth`) |
| `headDur` | `number` | `step * 4` |
| `seed` | `string` | `"arrow"` |
| `step` | `number` | `3` |

`headSize` is a floor, not an exact length. An arrowhead whose arms are shorter than the shaft is wide is invisible — it disappears into the blob at the tip — so the head never drops below `strokeWidth * 2.6`. At the default weight that floor is inactive and `headSize` is used verbatim; raise `strokeWidth` and the head grows with it.

Coordinates are in the arrow's own local space — position the component yourself. The SVG overflows visibly, so the bow and head are never clipped.

## Example

```tsx
<div style={{ position: "absolute", left: 300, top: 210 }}>
  <InkArrow from={{ x: 20, y: 20 }} to={{ x: 300, y: 210 }} />
</div>
```

## Use when

- A hand-drawn annotation should point from one thing to another — callouts over paper or scrapbook scenes.
- The pointing itself is part of the story and should be seen being drawn, pose by pose.

## Don't use when

- You need a straight technical connector or a diagram edge — this is a wobbly pen line with a personality, not a flowchart arrow.
- The arrow must anchor itself to another component's live position: `from`/`to` are fixed coordinates you supply.
