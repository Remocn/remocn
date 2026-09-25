# Mondrian Split

First piece of the new Motion Graphics category: brand-agnostic, flat geometric
motion in the spirit of After Effects shape-layer work. Closest sibling is
`radial-burst`; this one follows its structure (pure exported helpers, one
self-contained file importing only `remotion` and `react`, a length constant and
a duration helper).

## Direction

A De Stijl composition that builds itself, rebalances, and then becomes the
cut. Black lines cut across the frame one at a time and recursively split it
into rectangles. A few cells fill with primaries; the rest stay open paper.
After a short hold the lines slide to new positions and the whole grid reflows
like rubber. Then one cell pushes its own lines out past the frame edges until
it is the frame.

With `children`, that cell carries the next scene from the moment it fills, so
the incoming scene is already part of the painting before it takes over. The
component is transparent, so it can sit over the outgoing scene: open cells keep
showing it while the expanding cell carries the next one. Without children the
cell is a flat `fieldColor` field, which makes it an opener or a clean hand-off
to a color.

The grid is the only thing that moves. Cells are never animated on their own:
every frame, every cell and every fill is derived from the current line
positions. No crossfades, no opacity, no scaling of content.

## Palette

Classic De Stijl, every color a prop:

| Role | Prop | Default |
| --- | --- | --- |
| Lines | `lineColor` | `#121212` |
| Red slot | `redColor` | `#d62d20` |
| Yellow slot | `yellowColor` | `#f4c20d` |
| Blue slot | `blueColor` | `#1f4e9e` |
| Expanding cell | `fieldColor` | `#d62d20` |
| Paper | backdrop only | `#f3efe6` |

The component paints no background. Paper comes from `previewBackdrop` in the
config and from a `<Backdrop>` in docs examples. Open cells are transparent.
Flat fills only: no glow, blur, gradient or shadow. Depth is never implied.

## Controls

| Prop | Default | Range | Meaning |
| --- | --- | --- | --- |
| `seed` | 7 | 1–99 | Composition; every seed is a different balanced grid |
| `splits` | 7 | 3–12 | Number of lines, so `splits + 1` cells |
| `lineWeight` | 14 | 4–32 | Line thickness at a 720px reference (shorter side) |
| `expandCell` | 0 | 0–12 | Which cell takes over, ranked by size; 0 is the largest |
| colors | see palette | | |
| `speed` | 1 | shared | Scales time; 0 freezes the blank first frame |

`children` and `className` complete the API.

## Timeline at 30 fps, default props

Phase frames depend only on `splits` (not on the seed), so
`getMondrianSplitTimeline({ splits })` and `getMondrianSplitDuration` are exact
for every seed.

| Frames | Beat |
| --- | --- |
| 0–3 | Blank paper |
| 3–43 | Seven lines, one every 5 frames, each drawn in 10 frames with an expo ease-out |
| 40–53 | Colored cells wipe in one by one, 4 frames apart, 9 frames each |
| 50–62 | The expanding cell fills last (12 frames); children are revealed here |
| 62–76 | Hold on the finished composition |
| 76–106 | Three lines slide, 5 frames apart, 20 frames each, with a 3.5% overshoot settle |
| 102–133 | The expanding cell's sides push out, 3 frames apart, 22 frames each |
| 133–145 | Tail hold on the field or the next scene |

General formula with `n = splits` and `c = clamp(round(0.3 n), 1, 5)` colored
cells:

- line `i` starts at `3 + 5i`
- `fill = 3 + 5(n - 1) + 7`, colored cell `k` starts at `fill + 4k`
- `field = fill + 4(c - 1) + 6`
- `reflow = field + 12 + 14`, move `k` starts at `reflow + 5k`
- `expand = reflow + 10 + 20 - 4` (overlaps the last settle by 4 frames)
- `end = expand + 9 + 22` = `mondrianSplitLength` (133 at defaults)
- config duration = `end + 12` = 145 at defaults

## Geometry

Everything is computed in composition pixels, so the grid adapts to 16:9, 1:1
and 9:16 instead of being stretched. `unit = min(width, height) / 720`; line
weight scales with it.

Seeded guillotine subdivision (`random()` from remotion with keys that include
the step and attempt, so raising `splits` refines the same composition instead
of replacing it):

1. The root line splits the frame across its long side (75% of seeds; square
   frames pick either) at 30–40% or 60–70%.
2. The larger half is split the other way so one part keeps 60–76% of it. That
   part becomes the protected anchor: a large cell that is never subdivided, so
   every seed has one dominant plane and a band of smaller cells.
3. Remaining splits pick a non-anchor cell weighted by `area^1.2`, cut across
   its long side (random when nearly square) at 28–45% or 55–72%.
4. A new line within 4.5% of the shorter side of any parallel line snaps onto
   it, so segments line up into long Mondrian lines. Positions that would land
   close to, but not on, another parallel line are rejected. Every cell keeps
   at least `max(10% of the shorter side, 3 × weight)` per side.
5. A deterministic fallback pass guarantees the requested count whenever any
   cell is still large enough to split.

Collinear segments form a track. A track is what slides in the reflow, so a
long line made of several segments moves as one line.

Each line draws from the end that touches the older boundary (frame edges are
oldest) toward the newer one, so a line never starts from a point that is not
drawn yet.

Colors: `c` non-expanding cells take slots blue, yellow, red, blue, yellow.
Candidates are scored by a seeded roll, a penalty for touching the expanding
cell, and a small penalty for size. No two touching cells share a slot, and red
never touches the expanding cell, which is red by default. Fills play in
diagonal reading order, then the expanding cell last.

Wipes are one consistent move: along the cell's long side, starting from the
edge nearer the frame center and growing outward, using an in-out curve
`bezier(0.7, 0, 0.2, 1)`.

## How the signature motion is computed

### Rubber reflow

Lines carry absolute positions. Each node of the split tree knows which lines
bound its four sides. A line's legal range is the gap between the lines that
bound its own node on its axis, and the lines that use it as a boundary must
stay on their side. The gap is `max(7% of the shorter side, 2.5 × weight)`.

Up to three tracks move, chosen by total length with a seeded weight, so the
long structural lines move first. For each track in turn:

- its interval is the intersection of the constraints of all of its segments,
  using the reserved sweep of tracks that were already chosen (the full range
  they will occupy during their slide, including overshoot), not only their end
  positions;
- a track that borders the expanding cell only slides inward, squeezing that
  cell, and stays put when there is no room for it. Other tracks pick a side
  with a seeded roll weighted by room. So the reflow never grows the takeover
  cell before its push: across seeds it goes into the expansion at 19–44% of
  the frame (about 29% typical). Before this rule the default seed pre-grew it
  from 50% to 72–79% during the reflow, which left the finale little to do;
- the target is 60–95% of the free room, at most 20% of the axis and at least
  6% of the shorter side;
- a target within 7.5% of the shorter side of another parallel line's settled
  position snaps onto the nearest such line, or the track is skipped when that
  alignment is out of range. The radius is wider than the 4.5% used while
  building, so a sliding line never stops just short of lining up (before this,
  6–9% of moves did, including two on the default seed);
- the sweep `[min(from, to), max(from, to)]` plus 4.5% overshoot margin is
  reserved.

Because every chosen range is reserved before the next track is chosen, the
grid is valid at every frame for any timing and any overlap, and cells can never
invert.

Every frame, positions are `position + (to - from) × slide(progress)`, where
`slide` rises with `bezier(0.65, 0, 0.3, 1)` to 103.5% at 72% of the move and
settles back with `bezier(0.4, 0, 0.6, 1)`. The tree is then laid out again from
the root: each child box is the parent box cut at the current line position.
Cells, fills and the endpoints of perpendicular lines are all read from that
layout, so everything a line touches stretches or shrinks with it in lockstep.

### Line-driven expansion

The expanding cell `[c0, c1]` on x (same on y) gets current edges
`L = mix(c0, -m, e_left)` and `R = mix(c1, W + m, e_right)` where `m = weight +
4% of the shorter side` is an overscan margin beyond the frame. The whole
picture goes through a separable piecewise-linear map per axis:

- `[−m, c0]` maps onto `[−m, L]`
- `[c0, c1]` maps onto `[L, R]`
- `[c1, W + m]` maps onto `[R, W + m]`

The cell's bounding lines are exactly at `L` and `R`, so they are what slides
out. Everything between them and the frame edge is compressed toward the
overscan anchor like rubber, and at `e = 1` it has collapsed onto the anchor
beyond the frame. The maps are monotonic, so nothing crosses. At the end the
cell is `[−m, W + m] × [−m, H + m]`, no line or other cell has any visible
extent, and only the field and children remain.

Per side, `e` is a 22-frame curve: a 3.5% wind-up inward over the first 22% with
an in-out ease (only on sides bounded by a line, so an edge that touches the
frame never opens a gap), then `t^2.5` acceleration out. The wind-up is capped
at 20% of the cell's own extent per side, so two opposite pull-ins take at most
40% of it and a narrow cell on a very wide frame (2560×720) never folds shut or
drops its children. The sides start 3 frames apart, ordered by travel from
shortest to longest, so the longest push finishes the motion.

## Handoff and usage

- Opener: no children, `fieldColor` set to the title background. Put the title
  in a `Sequence` that starts near `getMondrianSplitTimeline().end`.
- Transition: pass the next scene as children. Children share the component's
  frame; the reveal starts at `timeline.field`. Keep the next scene inside the
  component for as long as it should play, since after the push the component
  renders only the field and children.
- Overlay: place over the outgoing scene. Open cells keep showing it.
- `getMondrianSplitDuration({ speed, splits })` includes the 12-frame tail and
  returns frames at 30 fps.

Children are rendered in a full-frame layer clipped with a percentage
`clip-path: inset()` to the current field rectangle, between the fills SVG and
the lines SVG, so lines always sit on top. Both SVGs use
`preserveAspectRatio="none"` so the geometry and the percentage clip stay in
the same space inside any container.

## Exports

- `MondrianSplit`, `MondrianSplitProps`
- `mondrianSplitDefaults`, `mondrianSplitLength`
- `getMondrianSplitTimeline`, `getMondrianSplitDuration`
- `getMondrianSplitLayout` (the seeded composition: split tree, lines with
  their track ids, target, fills, moves, per-side push start and wind-up) and
  `getMondrianSplitState` (per-frame lines, fills, field, cells)
- `getMondrianSplitClip` (the children `clip-path` for a field rectangle)
- types: `MondrianSplitLayout`, `MondrianSplitState`, `MondrianSplitOptions`,
  `MondrianSplitBox`, `MondrianSplitRect`, `MondrianSplitAxis`,
  `MondrianSplitSlot`, `MondrianSplitSide`

## Tests

Timeline boundaries (blank start, one line after frame 3, all lines drawn when
fills start, all fills done at the reflow, the frame fully covered with no lines
at the end and after), duration and speed, layout validity across seeds and
aspect ratios (exact count, tiling, minimum cell size, largest cell as the
default target, slot rules), the rubber invariants (every cell edge is a frame
edge or a current line position at every reflow frame, a moving line is
bordered on both sides by the same cells throughout its slide, fills stay glued
to their cells, every sliding line lands on another line or clearly away from
all of them, the reflow only ever squeezes the expanding cell, the expanding
cell stays bounded by its own lines while they push out, stays open through its
wind-up on a 2560×720 frame, and only grows after the wind-up), determinism,
and config defaults matching the component defaults.

## Integration left to the lead

Not touched by this change: `registry/remocn/registry.json`,
`registry/__index__.tsx`, the manifest, `registry-artifacts/`, the new
`content/docs/motion-graphics/meta.json` and `index.mdx`, changelog. The docs
page carries `component: mondrian-split`, so the docs gate needs the registry
entry and the section `meta.json` before it passes.
