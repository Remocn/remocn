# Plan 018: ink-arrow — a hand-drawn arrow between two points

> Read plan 014's **Workflow** and **Series conventions** first. Standard
> per-component touch checklist applies unless a section below overrides it.

## Status

- **Effort**: M
- **Depends on**: 014
- **Category**: feature
- **Section**: Effects

## Goal

A parameterized hand-drawn arrow: pen drags a wobbly curve from A to B over a
few poses, the head pops on the final pose. In the demo the arrow is a
hardcoded SVG path; this generalizes it to arbitrary from/to points.

## Source

`~/projects/opensource/remocn-demo/src/demos/fable-flipbook/acts.tsx` lines
136–168 (the WildAct arrow: dash-drawn curve + two-segment head appearing at
completion).

## API (contract)

```ts
export type InkArrowPoint = { x: number; y: number };

export interface InkArrowProps {
  from: InkArrowPoint;
  to: InkArrowPoint;
  curvature?: number;     // 0.35, perpendicular bow as a fraction of distance
  color?: string;         // "#26242c"
  strokeWidth?: number;   // 3
  delay?: number;         // 0
  drawDur?: number;       // 36 frames of contour draw
  headSize?: number;      // 24 px
  seed?: string;          // "arrow"
  step?: number;          // 3
}

export function InkArrow(props: InkArrowProps): React.ReactElement;
```

## Behavior

- Coordinates are in the component's own local space: the SVG covers the
  bounding box of `from`/`to` (plus margin for the bow and head) with
  `overflow: visible`; the user positions the component itself.
- Path: cubic bezier from `from` to `to`; the two control points sit at 30%
  and 70% along the segment, offset perpendicular by
  `curvature * distance`, each with a small `hashRange(seed…)` wobble so the
  curve never looks geometric. Sign of the offset bows the curve to one side;
  negative `curvature` bows the other way.
- Draw progress = `steppedRamp(frame, delay, delay + drawDur, easeOutCubic)`
  via `pathLength/strokeDasharray/strokeDashoffset`; hidden before first pose.
- Head: two strokes forming an open V at `to`, aligned to the path's end
  tangent, sized by `headSize`, appearing only when progress reaches 1
  (opacity flip on the final pose, like the demo).

## Registry entry

Standard. `registryDependencies: ["@remocn/stop-motion"]`.

## Docs page

`content/docs/effects/ink-arrow.mdx`; add `"ink-arrow"` to
`content/docs/effects/meta.json`.

- title `Ink Arrow`
- description `A hand-drawn arrow that draws itself from one point to another in stop-motion poses`
- Usage: absolutely-positioned callout from a headline to a card, mirroring
  the demo's "arrow down to blume" beat.

## Customizer config

Controls: `curvature` (number -1–1, step 0.05), `strokeWidth` (number 1–10),
`headSize` (number 8–48), `drawDur` (number 12–90), `color` (color), `seed`
(text), `step` (number 1–6). Fixed demo `from`/`to` in the preview scene.
Duration ~90f.

## Skill reference

Row in **Backgrounds & Effects**:

- Use for: a hand-drawn annotation pointing from one thing to another —
  callouts over paper/scrapbook scenes.
- Avoid for: straight technical connectors or diagram edges — this is a
  wobbly pen line with a personality, not a flowchart arrow.
- Deps: `@remocn/stop-motion`.

## components.mdx

Card in the **Effects** section (created by plan 017): name `InkArrow`, href
`/docs/effects/ink-arrow`.

## Tests

Extract the control-point/head-geometry math into pure helpers and cover:
determinism per seed, bow side vs `curvature` sign, head strokes anchored at
`to`.

## Acceptance criteria (owner verifies)

1. Arrow draws pose-by-pose along a believable hand curve; head pops exactly
   when the line completes.
2. Swapping `from`/`to` or flipping `curvature` sign mirrors the bow.
3. Standard: tests green, typecheck, biome, registry drift clean.

## Out of scope

- Multi-segment/elbow arrows, dashed styles, double heads.
- Auto-anchoring to other components' positions.
