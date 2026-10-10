# Truchet Flip

Direction: a flat, rule-driven pattern piece. It opens the new Motion Graphics
category (`content/docs/motion-graphics/`). The frame is tiled with Truchet
(Smith) tiles. Each tile carries two quarter-circle arcs, centered on opposite
corners. A wave crosses the grid, and each tile snaps a quarter turn when the
wave reaches it. Neighboring arcs share edge midpoints, so each turn changes
which ends connect. Lines run on across the frame, mazes form and dissolve,
and a final pass settles the grid into a chosen structure. No text, logo,
images, fonts, or shaders. It fits between a background loop and a pattern
stinger for a title.

## Palette

The default is one tone: white linework (`color`, `#ffffff`) on a transparent
background. `secondaryColor` colors alternate tiles in a checkerboard. It
defaults to `color`, so the lines stay unbroken until the user changes it. The
component paints no background. The docs preview puts it on flat International
Klein Blue (`#002fa7`) via `previewBackdrop`. The docs examples use a
`<Backdrop>`. Nothing glows, blurs, or uses a gradient. Any depth comes from
the arcs overlapping.

## Controls

| Prop | Default | Range | Meaning |
| --- | --- | --- | --- |
| `tiles` | 10 | 4–24 | Tiles across the shorter side; tile size is `min(w, h) / tiles` |
| `weight` | 0.2 | 0.04–0.34 | Stroke width as a fraction of the tile size |
| `passes` | 2 | 0–4 | Full flip passes before the resolve pass |
| `waveMode` | `radial` | `radial`, `diagonal`, `random` | Order in which tiles turn |
| `resolve` | `rings` | `rings`, `field`, `silhouette` | Structure the last pass settles into |
| `variant` | `stroke` | `stroke`, `filled` | Arcs as butt-capped strokes, or as filled quarter discs |
| `color` | `#ffffff` | color | Line or disc color |
| `secondaryColor` | `color` | color | Alternate (checkerboard) tiles |
| `seed` | 1 | integer | Opening maze and random wave order |
| `speed` | 1 | shared | Scales time; 0 freezes the opening maze |
| `loop` | false | boolean | Adds a return pass so the last frame matches the first |

## Timeline (30 fps, speed 1, two passes)

| Frames | Beat |
| --- | --- |
| 0–6 | Seeded maze holds still so the eye can read it |
| 6–48 | Pass 1: the wave reaches the last tile at 36; every tile turns +90° |
| 30–72 | Pass 2 follows 24 frames behind; every tile turns −90°, back again |
| 60–102 | Resolve pass (30-frame beat after pass 2) turns only tiles that differ from the target |
| 102–120 | Hold on the resolved structure |
| 126–168 | `loop` only: after a 24-frame hold, a return pass restores the opening maze |

Constants: lead 6, wave spread 30, snap window 12, pass gap 24, resolve gap
30, hold 18, loop hold 24. `truchetFlipLength` is 102. That is the frame where
the last tile settles, and it excludes the lead and tail holds.
`getTruchetFlipDuration({ speed, passes, loop })` returns the preview
duration: 120 by default and 168 with `loop`. Each pass beyond the first adds
24 frames. `passes={0}` resolves at frame 48 and the preview is 66 frames. All
passes share one delay field, so any tile's flips are 24 frames apart. That is
more than the 12-frame snap, so a tile never turns twice at once.

## Geometry

The grid is anchored with a vertex exactly at the frame center. Tile size
comes from the shorter side, so 16:9, 1:1 and 9:16 all show `tiles` across the
short side. Columns and rows extend by `ceil(half / size)` on each side, so
edge tiles are cut off by the frame and nothing ever shows empty. Tile `(col,
row)` spans `[col, col + 1] × [row, row + 1]` in grid units from the center
vertex.

Each tile renders one `<path>` in tile-local coordinates, centered on the
origin. The path is orientation A: arcs of radius `size / 2` centered on the
top-left and bottom-right corners. A per-tile `translate(x y) rotate(angle)`
turns it. At 0° (and 180°) the tile is A: one arc joins the top and left edge
midpoints, the other joins bottom and right. At 90° (and 270°) it is B: top
joins right, and bottom joins left. Every arc ends at an edge midpoint with its
tangent perpendicular to the edge. Neighbors therefore meet with matching
tangents and read as one continuous line. Strokes use butt caps, and each arc
runs 0.75px (at 720p) past the midpoint. The overlap hides antialiasing seams
without the round-cap bumps that would show on two-tone joins. The filled
variant draws the same two corners as quarter discs, pushed 0.75px out past
their straight edges for the same reason.

Tiles go into two `<g>` layers (primary and alternate color). The default
grid is 180 paths. The densest setting (24 across, 16:9) is about 1,050.

## Signature motion

The rule: when the wave reaches a tile, it turns a quarter.

- Wave order: each tile gets one delay `d ∈ [0, 30]`. Radial scales it by the
  distance from the center vertex to the tile center. The four central tiles
  get 0 and the corner tiles 30, about 3.4 frames per ring at the default
  density. Diagonal scales it by `col + row`, top-left to bottom-right, so the
  front runs parallel to the field lines. Random ranks tiles by
  `random("truchet-flip-{seed}-wave-{col}-{row}")` and spaces the ranks evenly,
  so the same number of tiles start every frame.
- Snap: `snap(t)` is a closed-form underdamped spring step response with
  damping ratio 0.65. Its frequency is tuned so it first reaches 90° at frame
  4. It peaks at about 96.1° near frame 5.5, a 6.8% overshoot; the highest
  whole-frame sample is 95.8° on frame 6. From frame 8 a smoothstep taper
  brings the ringing to exactly 90° by frame 12. After that it clamps to 1,
  before 0 it clamps to 0. Per frame (deg): 0, 17.9, 49.4, 75.2, 90.0, 95.6,
  95.8, 93.9, 91.8, 90.4, 89.9, 89.9, 90.
- Angle: `90 × (initial + Σ direction × snap(time − waveStart − d))`. Flip
  directions alternate by wave (+, −, +, …). The count of flips alone decides
  the orientation. Outside the snap windows every angle is an exact multiple
  of 90°, so the arcs always meet at rest.
- Resolve pass: tile `(col, row)` turns only if `(initial + passes) mod 2`
  differs from its target. Targets:
  - `rings` uses orientation A in the top-left and bottom-right quadrants and
    B in the other two. Curves close into a full circle around the center
    vertex, then concentric loops of 12, 20, 28 … arcs, with semicircular caps
    on the axes and wavy diagonal sides, until the frame edge cuts the outer
    loops open.
  - `field` sets every tile to A, giving parallel wavy diagonals.
  - `silhouette` covers tiles whose center lies within `0.38 × tiles` of the
    center. Inside, it uses a checkerboard (A on even `col + row`), which closes
    every curve into a small circle around an even vertex. Outside, it uses the
    field. Field lines U-turn around the disc, so a circle made of circles
    appears.
- Loop: the return pass turns tiles whose target differs from their opening
  orientation. Every tile then flips an even number of times per cycle. The
  tile is symmetric under 180°, so the frame at the cycle end matches frame 0.

Determinism: every value derives from `useCurrentFrame()`, `useVideoConfig()`,
props, and remotion `random()` with string seeds. Time is `frame × 30 / fps ×
speed`, taken modulo the cycle when looping. The grid is memoized on its inputs
only. Nothing accumulates between frames, so any frame renders correctly when
seeked directly.

## Handoff and usage

Place it full-frame over a `<Backdrop>` or any scene background. As a stinger,
start a title near frame 96, as the resolve settles. The rings and the
silhouette leave a clear focal point at the center. As a background, set
`loop` and repeat the 168-frame cycle. `passes={0}` resolves straight from the
maze in 66 frames. `variant="filled"` with a contrasting `secondaryColor` gives
two-tone quarter-disc pinwheels.

Files: `registry/remocn/truchet-flip/index.tsx`, `config.ts`,
`__tests__/truchet-flip.test.ts`, and
`content/docs/motion-graphics/truchet-flip.mdx`. The lead integrates
registry.json, the preview index, the manifest, navigation, and the changelog
after the user approves the preview.
