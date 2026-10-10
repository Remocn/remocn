# Bauhaus Build

Part of the new Motion Graphics category (`content/docs/motion-graphics/`):
brand-agnostic, flat geometric motion in the spirit of After Effects
shape-layer work. The closest sibling is `radial-burst`. This component
follows its structure: pure exported timeline, pose and geometry helpers; one
self-contained file that imports only from `remotion`; a length constant; a
duration helper.

## Direction

An abstract opener in the Bauhaus tradition. Nine flat primitives arrive one
at a time on a steady beat. There is a large circle, two quarter circles, a
semicircle, two squares, two bars and a small circle. They assemble into a
balanced, asymmetric composition on an invisible square grid: a frieze across
the middle of the poster, with a few satellites above and below. After a short
hold, the frieze splits. Every piece makes one more quarter turn into a
second composition: two friezes, above and below a clear central band. That
band is the handoff field for the title. Then it holds.

Pieces never slide or crossfade. Every move is a chain of hinged quarter
turns about a grid corner, so each tile visibly rolls across the grid, cell by
cell, and lands in its slot. There is no text, logo, image, font or
background. The component is transparent and overlays any scene.

## Palette

One accent and neutrals by default. Each piece has a color role, and every
role is a prop.

| Role | Prop | Default | Pieces |
| --- | --- | --- | --- |
| Ink | `inkColor` | `#1c1a17` | quarter circle `hill`, bar `pillar`, small circle `dot` |
| Accent | `accentColor` | `#e4572e` | large circle `sun`, small square `tile` |
| Secondary | `secondaryColor` | `#cbbc9f` (stone) | semicircle `dome`, small quarter circle `fan` |
| Tertiary | `tertiaryColor` | `#7e776b` (warm grey) | bar `post`, square `block` |
| Paper | backdrop only | `#f1eee7` | `previewBackdrop`, docs `<Backdrop>` |

The three neutral tones (ink, grey, stone) give depth through flat shading
alone. The classic Bauhaus look only needs a prop change: accent red
`#d7362b`, secondary yellow `#f2b930`, tertiary blue `#1f4f9e`, ink
`#161616` on paper `#efe9dc`. The composition places each role so it reads in
both palettes. In the handoff the accent pair and the secondary pair sit
diagonally opposite each other, and the tertiary pair anchors the lower
frieze.

There are no glows, blurs, gradients, shadows or strokes. Overlap happens only
at a few tangent contacts.

## Controls

| Prop | Default | Range | Meaning |
| --- | --- | --- | --- |
| `scale` | 1 | 0.5–1.25 | Poster size; 1 fills 80% of the shorter side |
| `seed` | 1 | 1–24 slider, any integer works | Mirror variant and arrival order |
| `inkColor` | `#1c1a17` | color | Ink role |
| `accentColor` | `#e4572e` | color | Accent role |
| `secondaryColor` | `#cbbc9f` | color | Secondary role |
| `tertiaryColor` | `#7e776b` | color | Tertiary role |
| `speed` | 1 | shared | Scales time; 0 freezes the empty first frame |
| `loop` | false | boolean | Boomerang: plays forward, then back to empty |

`seed` cycles through four mirror variants: seed 1 is the authored layout,
2 mirrors it horizontally, 3 vertically, 4 both, then the cycle repeats. Every
seed also reshuffles the arrival order through `random()`. Both mirrors keep
the band in the middle, so the handoff field is the same for every seed.

## Grid and geometry

The poster is a 12 × 12 module square, centered in the frame. Its side is
`min(width, height) × 0.8 × scale`, with `scale` clamped to 0.5–1.25, and
`unit = side / 12`. It fits 16:9, 1:1 and 9:16 the same way. Entry hinge
points may lie in the margin. Nothing needs to clear the frame because pieces
arrive by unfolding and, in loop mode, leave by folding.

Each piece has a local box of `width × height` modules. Its shape is drawn in
that box at turn 0.

- `square`, `bar`: the full box (bars are 4 × 1).
- `circle`: inscribed disk.
- `semicircle`: half disk on the bottom edge (diameter = box side). Its flat
  edge ends are two corners of the box.
- `quarter`: quarter disk centered on the bottom-left corner, radius = box
  side. Three box corners touch the shape: the center and both arc ends.

A rest pose is `{ turn, x, y }`: quarter turns clockwise and the footprint's
top-left module. Odd turns swap the footprint's width and height. The rest
transform is `rotate(turn × 90°)`, then a translation that maps the rotated
box onto the footprint.

### Composition A, the build

Cells whose center falls inside a shape:

```
row 0   . . . . . . . . . . . .
row 1   . . d . . . . . . . . .      d  dome, flat edge on the right
row 2   . . d . . . . . . . . .
row 3   . . . . . . . . . . . o      o  dot, on top of the post
row 4   . . H H . P . S S . . Q      H  hill, right angle at bottom-right
row 5   . H H H . P S S S S . Q      P  pillar, S sun (tangent to P)
row 6   H H H H . P S S S S . Q      Q  post
row 7   H H H H t P . S S . . Q      t  tile, tucked into the gap
row 8   . . . . . . . . . . . .
row 9   . . . . . . . . . . . .
row 10  . . . . . . b b f f . .      b  block, f fan (right angle top-right)
row 11  . . . . . . b b . f . .
```

### Composition B, the handoff

```
row 0   . . . . . . . S S . . .
row 1   . . . . . . S S S S . .
row 2   . . . d d . S S S S . .      dome sits on the pillar, now a rule
row 3   . . P P P P . S S . o .      top edge of the band
row 4   . . . . . . . . . . . .
row 5   . . . . . . . . . . . .      open band, full poster width
row 6   . . . . . . . . . . . .
row 7   . . . . . . . . . . . .
row 8   H H H H t . . . Q Q Q Q      post fell into the lower rule
row 9   H H H H . . . . . . . .      hill, right angle at top-right
row 10  . H H H b b . . . . . f
row 11  . . H H b b . . . . f f
```

| Piece | Shape, size | Role | Slot A | Entry moves | Rebuild | Handoff B | Cue |
| --- | --- | --- | --- | --- | --- | --- | --- |
| hill | quarter 4 | ink | turn 3 at (0, 4) | `D- R+` | `D-` | turn 2 at (0, 8) | 0 |
| tile | square 1 | accent | (4, 7) | `U+ U+ U+ U+` | `D+` | (4, 8) | 3 |
| pillar | bar 4 × 1 | ink | turn 1 at (5, 4) | `R+ R+` | `U+` | turn 2 at (2, 3) | 6 |
| sun | circle 4 | accent | (6, 4) | `U+ U+` | `U-` | (6, 0) | 9 |
| dome | semicircle 2 | secondary | turn 3 at (1, 1) | `R+ D-` | `R+` | turn 0 at (3, 1) | 12 |
| post | bar 4 × 1 | tertiary | turn 1 at (11, 4) | `D+ D+` | `D-` | turn 0 at (8, 8) | 15 |
| dot | circle 1 | ink | (11, 3) | `D- D- D- D-` | `L-` | (10, 3) | 18 |
| block | square 2 | tertiary | (6, 10) | `U+ U+ U+` | `L+` | (4, 10) | 21 |
| fan | quarter 2 | secondary | turn 2 at (8, 10) | `L- L+ L+` | `R+` | turn 3 at (10, 10) | 24 |

The handoff poses are not stored. They are computed by rolling each slot
through its rebuild moves. The start poses are computed by unrolling the slot
through the inverse entry moves. Every path is exact by construction.

No piece rebuilds by undoing its last entry turn: the rebuild hinge is always
a different corner from the landing hinge. The hill opens like a fan out of
its right angle on the poster's left edge, rolls in over its arc end and later
drops below the band. The pillar cartwheels in from the left and later tips
up into the top rule. The sun rises from below the poster and later keeps
rising into the top zone.

## The corner tumble

A move is a direction and a spin: `U`, `D`, `L` or `R`, followed by `+`
(clockwise) or `-` (counterclockwise). The direction picks the leading edge,
the side of the footprint facing the destination. The spin picks which of that
edge's two corners is the hinge:

| Move | Hinge corner |
| --- | --- |
| `R+` / `R-` | bottom-right / top-right |
| `L+` / `L-` | top-left / bottom-left |
| `D+` / `D-` | bottom-left / bottom-right |
| `U+` / `U-` | top-right / top-left |

A quarter turn rotates the footprint 90° about the hinge `P`. Rest poses stay
on integer modules because a quarter turn is exact:
`(dx, dy) → (−dy, dx)` clockwise and `(dy, −dx)` counterclockwise. The new
footprint shares `P`, lies entirely beyond the old leading edge and has its
turn advanced by the spin. A square moves one box per turn. A bar cartwheels
end over end, alternating between 4 × 1 and 1 × 4. Round pieces pivot about a
corner of their bounding square. For semicircles and quarter circles every
authored hinge, the unfold included, is a flat-edge end or the right-angle
corner, so the hinge always touches the shape. Only the two full circles
swing about a bounding-square corner off their body.

Between rest poses, a local point `p` is drawn at

```
world(p) = P + s · R(θ) · (R(φ) · p + t − P)
θ = spin · 90° · progress
```

where `R(φ)` and `t` are the rest transform of the pose the turn starts from,
and `s` is the unfold scale (1 except on the first entry turn). In SVG this is
`translate(X Y) rotate(φ + θ) scale(s · unit)` with
`(X, Y) = P + s · R(θ)(t − P)`. The hinge corner maps onto `P` for every
progress and scale. The piece is always a rigid rotation about a fixed grid
corner, so it cannot slide. After each quarter turn the next move hinges on a
different corner of the piece.

Timing per quarter turn is heavier for larger pieces, like a pendulum:
`T = 5 · √(max(width, height))` frames at 30 fps. That gives 5 frames for 1 ×
1 pieces, 7.07 for 2 × 2, and 10 for the 4 × 4 pieces and the bars.

- Travel turns ease in and out, `bezier(0.62, 0, 0.3, 1)`, from rest to rest.
  They never pass 90°.
- The landing turn swings to `1.05` of a quarter turn (4.5° past the slot)
  with the same curve over `T`. It then settles back to exactly 90° over
  `0.5 T` with `bezier(0.45, 0, 0.55, 1)`. The overshoot is capped at 4.5°
  and has zero velocity at the peak and at rest.
- Unfold: the first entry turn also scales the piece from 0 to 1 about the
  hinge, `s = 1 − (1 − τ / T)³`. The piece grows out of a grid point as it
  swings, so nothing pops in. Once the preceding turns are done, the slot is
  one exact quarter turn away.

## Build

Entry paths are 2 to 4 turns: 2 for the 4-module pieces and the dome, 3 for
the other 2 × 2 pieces, 4 for 1 × 1. Travel takes 20 to 21.2 frames, or 14.1
for the dome. Arrival slot `j` lands (ends its swing) at `22 + 6j`: 22, 28,
... 70. Its first turn starts at `22 + 6j − turns · T`. Only the sun and the
post can arrive first, so no turn starts before frame 2 and frame 0 is empty.
The last piece settles by 75.

Entry paths cross empty grid wherever possible. Where one entry sweeps over
another piece's slot, that piece must arrive later. Each piece lists these
prerequisites in `after`:

- `pillar` after `sun`: the sun rises past the pillar's foot.
- `block` after `sun`: the sun rises through the block's slot.
- `tile` after `pillar`: the pillar cartwheels across the tile's slot.
- `hill` after `tile`: the tile rolls up the gap past the hill's corner.
- `dome` after `pillar`: the dome sits on the pillar's rule in the handoff, so
  it must paint above the rule when the rule lands.
- `dot` after `post`: the post lies across the dot's slot before standing.
- `fan` after `block`: the block's landing leans over the fan's slot.

The arrival order is a seeded topological sort. Among the pieces whose
prerequisites have landed, the one with the smallest
`random("bauhaus-build-{seed}-order-{id}")` goes next. Pieces render in
arrival order, so a moving piece is always above the pieces already landed.
Across seeds 1–40 the only contacts in the build are sub-module grazes, where
a landing overshoot leans into a tangent neighbor by at most 0.17 module (the
pillar against the sun).

## Rebuild

The rebuild starts at frame 90. Each piece makes one quarter turn at `90 +
cue`, on a steady 3-frame cascade that runs left to right across the frieze:

1. `hill` (0) and `tile` (3) swing down about the same grid corner (4, 8),
   the hill's right angle. The hill turns counterclockwise on the left; the
   tile turns clockwise on the right. They open like a pair of doors.
2. `pillar` (6) and `sun` (9) do the same about (6, 4). The pillar tips up
   and left into the upper rule, and the sun rises into the top zone.
3. `dome` (12) rolls over the end of its flat edge onto the new rule.
4. `post` (15) tips down-left into the lower rule. Its dot (18) rolls off the
   top, onto the band's top edge next to the sun.
5. `block` (21) and `fan` (24) split apart along the bottom edge.

The order is fixed so that most sweeps cross space their neighbors have
already left. The last turn ends at `90 + 24 + 1.5 · 7.07 = 124.6`. That
makes `bauhausBuildLength = 125`.

Three contacts remain, all structural to the two compositions. The tile is
wedged between the hill and the pillar, so its swing clips the foot of the
still-standing pillar (up to 0.36 module, about two frames). The pillar
cannot leave first, because its own swing crosses the tile. The rule's
landing overshoot lifts about 0.24 module under the dome, which sits on the
rule in the handoff and paints above it. The block's landing overshoot leans
0.15 module into the hill's arc.

## Timeline at 30 fps, speed 1

| Frames | Motion |
| --- | --- |
| 0–2 | Empty |
| 2–22 | The first pieces unfold from grid points and tumble toward their slots |
| 22–75 | Nine landings, one every six frames (22 … 70), each settling with a 4.5° overshoot |
| 75–90 | Hold on the frieze |
| 90–125 | Rebuild cascade: one quarter turn per piece, 3 frames apart; the band clears by about frame 116 |
| 125–150 | Hold on the handoff (`durationInFrames` 150) |

`getBauhausBuildDuration({ speed, loop })` returns `ceil(150 / speed)`, or
`ceil(300 / speed)` with `loop`. Speed 0 returns 1.

## Loop

`loop` plays the sequence as a boomerang with a 300-frame period. Time folds
back at 150, so the rebuild runs backward (B to A). Then the build runs
backward: the pieces leave in reverse arrival order and fold into their hinge
points. The frame is empty again at 300. Played backward, the landing
overshoot becomes a small anticipation before each exit tumble. The cycle is
seamless and reuses the forward paths exactly, so it adds no new contacts.

## Handoff and usage

The open band spans modules 4 to 8 vertically: the middle third of the
poster, across its full width. It is centered in the frame at every aspect
ratio. At 1280 × 720 and scale 1 it is 192 px tall. No piece rests outside
the poster, so on every aspect ratio the band continues across the full frame
width.

- `getBauhausBuildField({ width, height, scale })` returns the band in
  composition pixels: `{ x: 0, y, width, height, unit }`. It needs no seed,
  because both mirrors keep the band in place.
- `bauhausBuildTimeline.clear` is frame 116. From then on no shape enters the
  band. The post leaves it around frame 113, and the dot's overshoot dip
  settles by 115.5.

Put the title in the field from that frame, over a paper `<Backdrop>` with
no padding. The band stays clear for as long as the handoff holds, which is
indefinitely without `loop`.

```tsx
<Backdrop fill={{ type: "color", value: "#f1eee7" }} padding={0} radius={0} shadow="">
  <BauhausBuild />
  <Sequence from={bauhausBuildTimeline.clear}>
    <Title field={getBauhausBuildField({ width, height })} />
  </Sequence>
</Backdrop>
```

## Verification (bun:test)

- Timeline: frames 0 and 0.5 are empty for every seed; each arrival unfolds
  from scale 0 and lands on its beat with the 4.5° lean; the frieze holds
  between 75 and 90; the handoff is at rest from 125 onward; durations follow
  `speed` and `loop`.
- Tumble invariants: every step hinges on a leading-edge corner that both
  footprints share. The new footprint lies beyond the leading edge. The turn
  advances by the spin. Consecutive steps hinge on different corners of the
  piece, including the step from the landing turn into the rebuild turn. The
  hinge stays fixed at every progress and unfold scale. A turn at
  full progress equals the next rest pose exactly. Travel turns never exceed
  90°, and the landing overshoot is present and capped.
- Compositions: all slots lie inside the poster, and no two rest footprints
  overlap in A or B. Every handoff footprint stays out of the band. Sampled
  points of every shape stay out of the band from the clear frame to the
  end. The field helper is full width and vertically centered at every
  aspect ratio and scale.
- Determinism: the same frame and seed give identical output in any sampling
  order. Seeds respect every arrival prerequisite and cycle the four mirrors.
  The loop is periodic and palindromic.
- Config defaults equal `bauhausBuildDefaults`, the object the component
  destructures from.
