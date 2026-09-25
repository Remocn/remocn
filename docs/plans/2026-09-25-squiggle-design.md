# Squiggle

Direction: a live line accent from the Motion Graphics accents block, built
the way an After Effects shape layer is built: one stroked path, a trim-path
head and tail, and a wave modifier with animated phase and size. A flat
vector line draws itself along a straight course. It starts at `x, y` and
runs `length` px at `angle`. Its shape is a traveling wave, recomputed every
frame. The phase swims forward while the head extends, and the amplitude eases
from lively to calm. After a hold the tail can erase in the drawing direction,
or the line can stay. It underlines a word, separates two parts of a video,
connects two elements, or adds energy next to a number. It is the clean,
smooth counterpart of the hand-drawn `ink-underline` and `ink-arrow`. It has
no stop-motion poses, grain, or pressure taper.

## Palette

One color, `#ffffff` by default, on a transparent background. The component
paints no background and no fill, only a single stroke. The docs preview puts
it on flat International Klein Blue (`#002fa7`) via `previewBackdrop`. This is
the category's field, shared with `truchet-flip`, `trim-burst`, and
`speed-lines`. The docs examples use a `<Backdrop>`. There are no glows,
blurs, gradients, or sparkle shapes. Caps are round. Joins are round, except
on `zigzag`, which uses miter joins so the corners stay sharp.

## Controls

Every size is in reference px at a 720px-tall composition and scales by
`height / 720`, like `confetti`. Position is a 0..1 fraction of the
composition.

| Prop | Default | Range | Meaning |
| --- | --- | --- | --- |
| `shape` | `wave` | `wave`, `zigzag`, `loops`, `coil` | Smooth sine, sharp triangle, cursive loop chain, spring from the side |
| `x` | 0.375 | 0..1 | Start of the course, fraction of the width |
| `y` | 0.5 | 0..1 | Start of the course, fraction of the height |
| `length` | 320 | ≥ 0 | Straight course length, reference px |
| `angle` | 0 | degrees | Course direction; 0 runs right, positive turns clockwise |
| `amplitude` | 14 | ≥ 0 | Half-height of the band at the start of the draw, reference px |
| `wavelength` | 48 | ≥ 8 | Course distance of one cycle, reference px |
| `weight` | 3 | ≥ 0 | Stroke width, reference px |
| `color` | `#ffffff` | color | Stroke color |
| `settle` | 0.5 | 0..1 | Share of the amplitude that calms away; rest = `amplitude × (1 − settle)` |
| `hold` | 12 | ≥ 0 | Frames the settled line rests before the erase |
| `erase` | true | boolean | Tail erases toward the end point; false keeps the line |
| `delay` | 0 | ≥ 0 | Composition frames before the head leaves the start point |
| `speed` | 1 | shared | Scales motion time; 0 freezes at the first frame, nothing drawn |

`x` defaults to 0.375, not the family's 0.5. The course starts at `x, y`, so
the default 320px line spans 480–800 on a 1280×720 frame, centered. With
`x={0.5}` it would start at the center and fill only the right half.

## Timeline (30 fps, speed 1, defaults)

| Frames | Beat |
| --- | --- |
| 0 | Nothing drawn |
| 0–24 | Head runs out along arc length, ease-out quart: 15.7% on frame 1, 51.8% on 4, 80.2% on 8, 93.8% on 12, 98.8% on 16 |
| 0–36 | Swim: phase travels 1.5 cycles, ease-out cubic (1.06 cycles by frame 12). Calm: amplitude eases from 1 to 0.5 of `amplitude`, ease-in-out sine (0.875 at 12, 0.625 at 24) |
| 36–48 | `hold`: the settled line rests, perfectly still |
| 48–66 | Erase: the tail runs from the start to the end point, ease-in-out cubic, while the phase drifts another 0.5 cycle |
| 66 | Nothing drawn |
| 66–80 | Preview only: empty frames before the loop |

Constants: draw 24, settle 36, erase 18, swim 1.5 cycles, exit swim 0.5
cycles, preview tail 14 frames (24 when `erase` is off). The erase starts at
`36 + hold`. `squiggleLength` is 66, the frame where the tail reaches the end
point. With `erase={false}` the motion ends at 36 and the line stays.
`getSquiggleDuration({ speed, delay, hold, erase })` gives the preview length:
`ceil(delay + (end + tail) / speed)`, 80 by default and 60 without the erase.
Time is `max(0, frame − delay) × 30 / fps × speed`, so `delay` is in
composition frames and does not scale with `speed`. `hold` is a timeline beat
and does.

## Geometry

Course: `S = (x·W, y·H)`, direction `u = (cos a, sin a)`, normal
`n = (−sin a, cos a)`, which points down the screen at `a = 0`. The length is
`L = length · unit`, with `unit = H / 720`. The end point is `E = S + L·u`.
Wave number `k = 2π / λ`, phase angle `θ(s) = k·s − 2π·phase`.

Each point on the course, `s ∈ [0, L]`, is displaced by an offset along `u`
and across `n`. The offset is multiplied by an envelope
`w(s) = smoothstep(s / T) · smoothstep((L − s) / T)`, with taper
`T = min(λ, L / 3)`. Both ends therefore stay pinned to `S` and `E` and leave
along the course tangent, and the pattern grows out of the start and sinks
into the end as it travels.

- `wave`: across `c·sin θ`.
- `zigzag`: across `c·tri(θ)` with `tri = (2/π)·asin(sin θ)`. Built from exact
  corner vertices at `θ = π/2 + mπ`, enveloped at each corner, so every
  segment is straight and every corner sharp.
- `loops`: along `−r·sin θ`, across `−c·cos θ`, a prolate trochoid, which is
  the path of a point on a rolling wheel. `r = 2.4 / k`. The loops sit on
  the `−n` side, above a left-to-right line, with swoops between them. At the
  defaults a loop is 16 px wide and 21 px tall when lively, and 10.5 px tall at
  rest. Swimming phase makes the loops roll forward.
- `coil`: the same trochoid with `r = 4.2 / k`, the side projection of a
  tilted helix. The loops are about 42 px wide and nearly touch (6 px gap).
  Swimming phase reads as a spinning spring crawling forward, like a screw
  thread.

`c` is the current amplitude. For `loops` and `coil` the along reach `r` is
gated by `smoothstep(c / (3·unit))`. When the height calms to nothing, the
loops unfurl into a straight line instead of a path that doubles back on
itself, which would make the trim stutter.

Sampling: smooth shapes use 32 / 64 / 80 samples per cycle
(`wave` / `loops` / `coil`) × `max(1, unit)`, plus both end points. The grid
rides the phase: samples sit at fixed phase angles, `s = offset + j·step`
with `offset = (λ·phase) mod step`. Every crest is therefore drawn by the same
polygon on every frame and glides without faceting shimmer. There are at least
24 points and at most 4000. The zigzag uses about 2 points per cycle. At the
defaults the full path has about 215 (wave), 15 (zigzag), 430 (loops), or 535
(coil) points in one `<path>`. Coordinates are rounded to 0.01 px, and
consecutive duplicates are dropped.

Cusps: where the envelope carries `w·reach·k` through 1, a loop shrinks
through a cusp into the wave. This is the expected wave-to-loop transition.
It happens only in the taper zones near the pinned ends, where loops are born
and dissolve as the phase swims.

## Signature motion

The shape is recomputed from `phase(t)` and `c(t)` on every frame. It is
never a static path revealed by a dash offset.

- Head: `head(t) = 1 − (1 − t/24)^4` of the current total arc length. The
  visible path runs from `tail × total` to `head × total`, measured on the
  polyline and cut with interpolated end points. When the shape changes, the
  total changes with it, and the head stays on the curve, as AE Trim Paths
  would.
- Swim: `phase(t) = 1.5 · (1 − (1 − t/36)^3)` cycles, plus
  `0.5 · tail(t)` during the erase. Crests travel toward the head at about
  6 px/frame at first. That is far slower than the head, which covers about
  75 px of arc on frame 1 (477 px total at full amplitude). The head outruns
  the pattern, and the pattern visibly flows forward behind it. By frame 12,
  when 94% of the line is out, the crests have moved 1.06 wavelengths. After
  the head lands, the flow carries on and slows to a stop at frame 36. This is
  the follow-through.
- Calm: `c(t) = amplitude · unit · (1 − settle · (1 − cos(π·t/36)) / 2)`. The
  line is drawn at full energy and relaxes after it is out. There is no
  overshoot, and the amplitude only ever decreases.
- Erase: `tail(t) = easeInOutCubic((t − eraseStart) / 18)`, the same direction
  as the draw. The start end slides toward `E` while the pinned end stays. A
  line that stays (`erase={false}`) keeps its settled shape.
- Motion is never linear. The head is ease-out quart, the swim ease-out cubic,
  the calm ease-in-out sine, and the tail ease-in-out cubic.

Determinism: every value derives from `useCurrentFrame()`,
`useVideoConfig()`, and props. There is no randomness, so there is no seed.
Nothing accumulates between frames, so any frame renders correctly when
seeked to directly.

## Placement over a scene

The component is an overlay. Its root is `position: absolute; inset: 0`,
transparent, with `pointer-events: none`, and it holds one SVG whose viewBox is
the composition size. Drop it in a `<Sequence from={eventFrame}>` next to the
element it accents, so the head leaves the start point on the frame of the
click, the count landing, or the beat. Positions are fractions of the
composition: under a word whose box is at `left, top, width, height` px, use
`x = left / W`, `y = (top + height + gap) / H`, and
`length = width · 720 / H`. To link two elements, start at one, set
`angle = atan2(dy, dx)` in degrees, and use the distance as the length. Stagger
several accents inside one Sequence with `delay`. For an underline that should
stay, use `erase={false}`.

Files: `registry/remocn/squiggle/index.tsx`, `config.ts`,
`__tests__/squiggle.test.ts`, and `content/docs/motion-graphics/squiggle.mdx`.
The lead integrates registry.json, the preview index, the manifest,
navigation, and the changelog after the user approves the preview.
