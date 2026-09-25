# Trim Burst

Direction: a punctuation accent built the way a motion designer builds a
shape-layer burst in After Effects. It is a ring of short straight strokes,
each animated with Trim Paths. The end (the outer point) shoots out and brakes
hard at its final distance. The start (the inner point) waits, then chases it.
The stroke grows, travels, and shrinks to nothing at its outer distance. The
whole burst lives 18 frames at 30 fps. Lengths, angles and launch times vary a
little per stroke from a seed, so the ring never reads as a rigid asterisk.

It opens the accents block of the Motion Graphics category
(`content/docs/motion-graphics/`), next to `speed-lines` and `squiggle`. Accents
are small, event-driven elements that get dropped many times per video: on a
click, a number landing, an icon appearing, a beat. They are not full-frame
stingers. No text, images, fonts, shaders, glows or sparkle shapes.

## Palette

One color, white (`#ffffff`) by default, on a transparent background. The
component paints no background and no full-frame fill. The docs preview puts
it on flat International Klein Blue (`#002fa7`) via `previewBackdrop`, the
same field as `truchet-flip`. The docs examples use a `<Backdrop>`. Strokes are
flat: no blur, glow, gradient or shadow.

## Shared accent conventions

- Overlay: the root is `position: absolute; inset: 0; pointer-events: none`
  and holds one SVG with `viewBox="0 0 width height"` from `useVideoConfig()`.
- Position: `x` and `y` are 0..1 fractions of the composition, like confetti's
  `originX` and `originY`. The default is 0.5, 0.5.
- Size: every size prop is in reference px at a 720px-tall composition and is
  multiplied by `unit = height / 720`. The same props look the same at 720p,
  1080p and 4K.
- Timing: the motion starts at frame 0 of the enclosing `Sequence`. `delay`
  shifts it in composition frames. `speed` scales time. `trimBurstLength` is 18.
- Style: `color`, `weight` for the stroke width, round caps by default, `seed`
  for all randomness.

## Controls

| Prop | Default | Range | Meaning |
| --- | --- | --- | --- |
| `x` | 0.5 | fraction | Burst center, fraction of the composition width |
| `y` | 0.5 | fraction | Burst center, fraction of the composition height |
| `count` | 8 | 1–32, rounded | Number of strokes |
| `innerRadius` | 16 | ≥ 0 ref px | Distance from the center where strokes are born; set it just outside an element |
| `reach` | 64 | ≥ 0 ref px | How far each end travels from the inner radius |
| `strokeLength` | 56 | ≥ 1 ref px | Soft cap on the stroke length; below about 85% of `reach` strokes turn into traveling dashes |
| `weight` | 2 | 0.25–24 ref px | Stroke width |
| `rotation` | 0 | degrees | Direction of the first stroke, clockwise from 12 o'clock |
| `spread` | 360 | 0–360° | Full ring, or a fan of this angle centered on `rotation` |
| `jitter` | 0.5 | 0–1 | Amount of seeded variation in angle, length and launch time |
| `dots` | false | boolean | Adds a small dot beyond each tip that pops and shrinks |
| `cap` | `round` | `round`, `butt` | Stroke line cap |
| `color` | `#ffffff` | color | Stroke and dot color |
| `seed` | 1 | integer | Seeds the per-stroke variation |
| `delay` | 0 | frames | Composition frames to wait before the burst fires |
| `speed` | 1 | shared | Scales time; 0 never fires |

The docs customizer exposes all of them. Number controls carry
`hiddenFromList: false`. `speed` comes from the shared controls.

## Timeline (30 fps, speed 1, defaults)

Per stroke, in frames since that stroke's launch, for a stroke at full scale
(`reach` 64, `strokeLength` 56). Distances are measured from the inner radius.

| Frame | End | Start | Visible length | Beat |
| --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | Launch; nothing drawn |
| 1 | 23.0 | 0.0 | 23.0 | The end shoots out; the start holds |
| 2 | 38.5 | 0.6 | 37.9 | The stroke grows; the start still holds |
| 3 | 48.1 | 2.6 | 45.5 | The start's own curve begins |
| 4–6 | 54.1 → 60.1 | 5.5 → 12.0 | 48.6 → 49.2 → 48.1 | Travels near full length; the end brakes as the start picks up |
| 7–8 | 61.7 → 62.6 | 16.6 → 23.4 | 45.0 → 39.3 | The start gains on the braking end |
| 9–14 | 63.2 → 64.0 | 32.2 → 63.2 | 31.1 → 0.8 | The zip: the start races into the nearly still tip |
| 15 | 64 | 64 | 0 | Gone at the outer distance |

The start's velocity is one smooth hump: 0.6, 2.0, 2.8, 3.1, 3.4, 4.6 and 6.7
px per frame on frames 2 to 8, a top speed of about 9.5 px per frame near
frame 9.3, then down to 0.8 on frame 15. The stroke peaks at 49.2, 77% of the
reach, near frame 4.9.

Burst level: launches are spread over frames 0–3 (`6 × jitter`) in a seeded
order. The first strokes show on frame 1, and the last launch shows on frame
4. Strokes grow through about frame 7, run near full length between about
frames 4 and 9, and zip shut between about frames 7 and 18. The last stroke is
gone on frame 18. That is `trimBurstLength`. The docs preview holds the empty
frame for 24 more frames, so `durationInFrames` is 42.

`getTrimBurstTimeline({ jitter, count })` returns
`{ life: 15, lag: 3, stagger, length }` with `stagger = 6 × jitter` and
`length = life + stagger`. A single stroke (`count` 1) has no stagger.
`getTrimBurstDuration({ speed, jitter, count, delay })` returns the preview
length: `ceil(delay + length / speed) + 24`. The hold is not scaled by speed,
so fast previews still pause between bursts.

## Signature motion

Trim Paths with two independent curves per stroke, plus a soft leash that caps
the stroke length.

- End (outer point): `end(t) = reach × EXPO(t / 15)`, with EXPO the house
  ease-out `cubic-bezier(0.16, 1, 0.3, 1)`. It covers 36% of the reach after one
  frame and 60% after two, then decelerates hard and lands exactly on the reach
  at frame 15.
- Start (inner point), own curve: `own(t) = reach × IN_OUT((t − 3) / 12)`, with
  IN_OUT the smoother `cubic-bezier(0.45, 0, 0.55, 1)`. It stays at 0 until frame
  3, then accelerates and lands on the reach at frame 15, the same frame as the
  end.
- Leash: the free gap `g = end − own` grows to about 85% of the reach near
  frame 4.9. A p-norm soft minimum caps the visible length at `strokeLength`:
  `length = g / (1 + (g / strokeLength)^6)^(1/6)` and `start = end − length`. The
  soft minimum is smooth, never exceeds `min(g, strokeLength)`, and reaches
  about 99% of `strokeLength` while `g` is well past it.
- The default keeps the leash off the signature. With `strokeLength` 56 on a
  `reach` of 64 (0.875) it only trims the peak, from 54.5 to 49.2. The start
  stays within 3 px of the inner radius through frame 3 and rides one smooth
  ease-in-out hump, so the preview shows the real two-curve chase. A first
  draft defaulted `strokeLength` to 32, half the reach. There the leash owned
  the middle of the motion: from frame 3 to 7 the start moved at the end's
  speed, a rigid dash sliding on one curve, which is the generic look this
  component exists to avoid.
- Below about 85% of the reach the leash takes over on purpose. The start is
  pulled along `strokeLength` behind the end, so the stroke travels as a dash
  on the end's curve until the start's own ease-in-out overtakes and zips it
  shut. A short stroke cannot cover a long reach any other way, so this stays
  an opt-in for short dashes rather than the default.
- Shrink: at frame 15 both curves are exactly 1, so the length is exactly 0 at
  the outer distance.
- Width: the drawn width is `min(weight, length)`. A round cap cannot leave a
  full-size dot behind as the stroke closes. It shrinks to a point instead.
  Segments shorter than 0.001px are not drawn.

The curves are pure functions of time. Nothing moves linearly, and the
end-start chase gives overlapping action inside every stroke. The seeded
launch spread gives overlapping action across the ring.

Per-stroke variation, all from remotion `random()` with string keys
`trim-burst-{seed}-{kind}-{index}`:

- Angle: the base angle is `rotation + i × 360 / count` for a full ring, or
  evenly across `spread` for a fan. It is offset by up to
  `±0.25 × jitter × step`, where `step` is the spacing, capped at 45°. That is
  ±5.6° at the defaults.
- Scale: `1 − 0.45 × jitter × r`. It multiplies both `reach` and
  `strokeLength`, so default strokes run 77.5–100% of full size and no stroke
  passes `innerRadius + reach`.
- Launch: strokes are ranked by a seeded key, and rank `k` launches at
  `6 × jitter × k / (count − 1)`. The first stroke launches at 0 and the last
  at exactly `6 × jitter`, so the timeline length is exact.

`jitter` 0 gives a perfectly regular ring that launches all at once.

Dots (optional): each stroke gets a dot of radius `1.25 × weight`. It sits on
the stroke's line, `2 × weight` past the end point plus its own radius, so it
rides just ahead of the tip. It pops from frame 4 with a back-out curve
(`s = 1.4`, a 7% overshoot, peak near frame 6.4) and is back to 1 at frame 8.
Then it shrinks with a cubic ease-in to exactly 0 at frame 15, in step with
the stroke closing. Dots never outlive the burst.

## Determinism

Every value derives from `useCurrentFrame()`, `useVideoConfig()`, props and
seeded `random()`. Time is `max(0, frame − delay) × 30 / fps × speed`, in
30 fps frames. The stroke layout (angles, scales, launches) is a pure function
of `count`, `rotation`, `spread`, `jitter` and `seed`, memoized on those props
only. Nothing accumulates between frames, so any frame renders correctly when
seeked directly.

## Geometry and rendering

The center is `(x × width, y × height)`. A stroke at angle `θ` (clockwise from
up) runs along `(sin θ, −cos θ)` from `innerRadius + start` to
`innerRadius + end`, all times `unit`. One `<g>` holds the `<line>` elements
with the stroke color and cap. A second `<g>` holds the dot `<circle>`s. The
defaults draw at most 8 lines per frame, and never more than 64 elements. The
SVG keeps `overflow: visible`, so a burst near an edge is clipped only by the
composition.

## Handoff and usage

Drop it into the `Sequence` that starts on the event frame, over the element
it punctuates. Set `x`/`y` to the element's center as fractions of the frame.
Set `innerRadius` just outside the element's radius in reference px, so strokes
are born at its edge. `trimBurstLength` can be the `Sequence` duration. Keep
the defaults for clicks and small beats. For an icon or a number landing, open
`innerRadius` and shorten `reach`. `spread` below 360 fans the strokes, for
example 90° above a number. `dots` adds a second beat at the tips. Drop
`strokeLength` well below `reach` only for short dashes that travel.

Files: `registry/remocn/trim-burst/index.tsx`, `config.ts`,
`__tests__/trim-burst.test.ts`, and `content/docs/motion-graphics/trim-burst.mdx`.
The lead integrates registry.json, the preview index, the manifest, navigation
and the changelog after the user approves the preview.
