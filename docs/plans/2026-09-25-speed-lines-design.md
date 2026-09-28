# Speed Lines

Direction: a flat motion accent in the Motion Graphics category
(`content/docs/motion-graphics/`), the first of the accents block with
`trim-burst` and `squiggle`. Accents are small, event-driven shape-layer
elements that get dropped many times per video: on an entrance, a landing, a
beat. Speed Lines has two modes.

- `trail` (default) wraps its children and flies them from `from` to `to` on a
  fast ease that arrives hard. Short parallel streaks shoot past behind the
  element. The element's real velocity drives them, so they exist only while it
  is fast and die as it lands.
- `focus` is a manga impact frame. Radial lines rush in from the frame edges,
  snap onto a point on the impact frame, hold for about five frames, then
  retract and vanish.

It pairs with `trim-burst`: streaks while the element flies, then a burst or a
focus frame where it lands. No text, images, fonts, glows, blur, or gradients.
It is clean vector with smooth motion, the counterpart of the hand-drawn
`ink-underline` and `ink-arrow`.

## Palette

One color, `color` (`#ffffff` by default), on a transparent background. Streaks,
rays and the fallback disc all use it. The component paints no background. The
docs preview puts it on flat International Klein Blue (`#002fa7`) via
`previewBackdrop`, the same field as `truchet-flip`. The docs examples use a
`<Backdrop>`.

## Props

| Prop | Default | Range | Meaning |
| --- | --- | --- | --- |
| `mode` | `trail` | `trail`, `focus` | Streaks behind a moving element, or an impact frame |
| `from` | `{ x: -0.25, y: 0.5 }` | any finite | Trail start of the element's center, as fractions of the composition (off-screen allowed) |
| `to` | `{ x, y }` | any finite | Trail landing point; falls back to the `x`, `y` point |
| `x`, `y` | 0.5, 0.5 | any finite | The accent point: where focus converges, and where trail lands without `to` |
| `count` | 12 | 1–64 | Streaks spawned per flight (trail) or rays (focus) |
| `weight` | 2 | 0.5–12 | Stroke width in reference px |
| `spread` | 96 | 8–480 | Width of the streak band (trail) or inner radius (focus), reference px |
| `duration` | 14 | 4–120 | Trail frames from launch to contact at 30 fps |
| `color` | `#ffffff` | color | Streaks, rays and fallback disc |
| `seed` | 1 | number | Streak timing, lanes and lengths; ray angles and radii |
| `delay` | 0 | ≥ 0 | Composition frames before the motion starts; not scaled by `speed` (same as `trim-burst` and `squiggle`) |
| `speed` | 1 | shared | Scales motion time; 0 freezes the first frame |

Reference px are px at a 720-px-tall composition, scaled by `height / 720` (the
`confetti` convention). The same props look the same at 720p, 1080p and 4K.
`from`, `to`, `x`, `y` are fractions of the composition.

Children are centered on the moving point in trail mode and on `x`, `y` in
focus mode. Without children, trail mode flies a disc of diameter `spread` in
`color`. This fallback keeps the preview self-contained, like `cursor-gravity`'s
default content. Focus mode draws no fallback.

## Timeline (30 fps, speed 1)

Time: `t = max(0, frame − delay) × 30 / fps × speed`. Everything below is in
`t`.

### Trail (default `duration` 14)

This is the original hard-stop landing, which is now `bounce={0}`. The current
default landing is in "Revision: inertial landing" at the end.

The element's center moves along `P(t) = from + (to − from) × ease(t)`. The
default flight goes from `(-0.25, 0.5)` to `(0.5, 0.5)`, 960 px at 1280×720.

| Frame | Progress | Speed (px/frame) | Beat |
| --- | --- | --- | --- |
| 0 | 0% | 0 | At `from`; no streaks |
| 1–4 | 1.3–17.4% | 12 → 68 | Launch; the first streaks appear once speed passes 5 |
| 5–10 | 25.7–74.0% | 80 → 96 → 90 | Cruise; the default disc enters the frame on 6; longest streaks around 8 |
| 11–13 | 82.6–96.0% | 82 → 57 | Braking; streaks visibly shorten |
| 14 | 100% | 39 | Contact (`impact`); streaks at ~40% of their cruise length |
| 15 | 101.1% | 11 | Recoil peak, 1.1% past the target; streaks die |
| 16–20 | 100.8% → 100% | −3 → 0 | Settles back exactly onto `to` (`end`) |

`speedLinesLength` is 20, the frame where trail settles at the default
duration. `getSpeedLinesTimeline({ duration })` returns `{ mode, impact, end }`.
For any duration, `impact` is `duration` (contact) and `end` is
`duration + 6`.

### Focus

| Frame | Beat |
| --- | --- |
| 0 | Nothing drawn |
| 0–3 | Rush: each ray starts at a seeded 0–1 frame offset. Its inner end runs in from the frame edge on an ease-in and accelerates into the snap |
| 3 | Impact (`impact`): every ray snaps to its inner radius, the closest point it ever reaches |
| 3–8 | Hold: inner ends relax outward by up to 12% (exponential, time constant 1.5 frames) |
| 8–13 | Retract: each ray releases at 8 plus a seeded 0–1.5 frames. Its inner end accelerates back out to the edge over 3.5 frames and the ray vanishes |
| 13 | Last ray gone (`end`) |

Take a horizontal ray at the default center with rest radius 96, rush start 0
and release 8. Its outer end sits at 642 (the 640 px edge plus the stroke
width), so its length per frame (px) is 0, 61, 243, 546, 540, 538, 536, 535,
535, 491, 360, 142, 0. `getSpeedLinesTimeline({ mode: "focus" })` is
`{ impact: 3, end: 13 }`. To land the snap on a beat, start the focus Sequence
`impact` frames before it.

### Preview

The preview adds a 24-frame hold: 44 frames for trail and 37 for focus.
`getSpeedLinesDuration({ mode, duration, delay, speed })` returns
`ceil(delay + (motion + 24) / speed)`. At speed 0 it returns 1.

## Signature motion

### Trail: the travel curve

`ease(t)` is one pure function of time, with `w = t / duration`:

- Flight (`w ≤ 1`): speed follows a skewed parabola, `v(w) = c·w·(1 − κw)`, so
  `ease = c(w²/2 − κw³/3)`. `κ = (1 + √0.7)/2 ≈ 0.9183` sets the contact speed
  to 30% of the peak (the hard arrival). `c ≈ 5.1576` normalizes `ease(1) = 1`.
  Peak speed is 1.40× the average, at `w ≈ 0.54`.
- Recoil (`0 < s = t − duration < 6`): a critically damped response carries the
  contact velocity past the target. It adds `(V₁/duration)·s·e^(−s)`, where
  `V₁ = c(1 − κ) ≈ 0.4212`. The peak comes at s = 1, 0.42/duration of the
  distance (1.1% at the default). A smoothstep taper over s = 3–6 lands it
  exactly on 1. Velocity is continuous at contact.

### Trail: velocity drives the streaks

- Velocity comes from the same `P(t)`, as a finite difference between this
  frame and the previous one:
  `V = (P(t(frame)) − P(t(frame − 1))) × fps / 30`. The unit is px per 1/30 s,
  so a higher `speed` means faster motion and longer streaks. Before the start,
  `P` clamps to `from`, so frame 0 has zero velocity.
- The direction is `d = unit(to − from)`, with normal `n = (−d.y, d.x)`. The
  forward speed is `s = V · d`. Recoil and settle move backward or barely at
  all, so they never draw streaks.
- Gate: `g = smoothstep((s − 5u) / (14u − 5u))`, with `u = height / 720`. Below
  5 reference px/frame no streak exists. Above 14, length is exactly
  proportional to speed.
- Each streak `i` of `count` gets seeded values from `random("speed-lines-{seed}-{i}-…")`:
  - Spawn time, stratified over flight progress 4%–80% with jitter:
    `w_i = 0.04 + 0.76 (i + r) / count`.
  - Lane, a golden-ratio sequence with jitter across the band:
    `lane_i = frac(h + 0.618034 i + (r − 0.5) / (2·count))`, offset
    `o_i = spread·u·(lane_i − 0.5)`.
    Consecutive spawns land far apart, so the streaks never clump into a
    pattern.
  - Length factor `l_i ∈ [0.5, 1]` and setback `b_i ∈ [0, 0.35]·spread·u`
    behind the center, so the streak emerges from behind the element.
- Life is `max(3, 0.3 × duration)` frames (4.2 at the default); `a` is the
  age as a fraction of it.
  - Reach: `L = 1.6 · l_i · s · g`. That is the distance the element covers in
    1.6 frames, a motion-blur shutter. It is proportional to the current speed.
  - Trim draw: the back end extends backward, ease-out quad over the first
    40% of life.
  - Trim erase: the front end chases it backward, smoothstep over 35%–100%.
  - Drift: the streak slides back by 15% of the distance the element covered
    since the spawn. That is air rushing past.
  - Endpoints, measured behind the center along `−d` at lateral offset
    `o_i`: front `b_i + drift + L·erase(a)`, back `b_i + drift + L·draw(a)`.
- Streaks shorter than half the stroke width are dropped, so no dots are left.
  All streaks are parallel to `d`, behind the element, inside the band, and
  proportional to speed. When the element brakes, `s` falls, every reach
  shortens, and at contact plus one frame the gate closes. The streaks die with
  the motion. At cruise the default flight keeps about 4–5 streaks alive, with
  a reach of 77–154 px each.

### Focus: converge, snap, retract

Center `C = (x·W, y·H)`. Ray `i` of `count`:

- Angle: `θ_i = 2π (h + (i + 0.6 (r − 0.5)) / count)`, evenly spaced with ±30%
  jitter and a seeded rotation `h`.
- Rest radius: `r_i = spread·u·(1 + 0.6 r')`, 1.0–1.6× `spread`. Nothing is
  ever drawn closer to the point than `spread`.
- Outer radius: `R_i` is the distance from `C` to the frame boundary along
  `θ_i`, plus the stroke width, so the round cap stays off-screen. If `C` lies
  outside the frame, `R_i` is the distance to the farthest corner.
- Inner radius `ρ_i(t)`:
  - Rush: `R_i + (r_i − R_i) q²` for `t0_i ≤ t < 3`, with `t0_i ∈ [0, 1]`.
  - Hold: `r_i (1 + 0.12 (1 − e^(−(t − 3)/1.5)))`.
  - Retract: `ρ + (R_i − ρ) q²` from the release `8 + 1.5 r''`, over 3.5 frames.
- Each ray is the segment `C + [ρ_i, R_i]·(cos θ_i, sin θ_i)`. Rays meet only
  near the point and never cross it, so the shape reads as concentration lines,
  not a star.

## Rendering

- Root: `position: absolute; inset: 0; pointer-events: none`. It is
  transparent, with an optional `className`.
- One `<svg>` with `viewBox 0 0 W H` and `aria-hidden`. All streaks or rays are
  one `<path>` of `M … L …` subpaths, with `stroke = color`, `stroke-width =
  weight·u` and round caps. In trail mode without children, one `<circle>` for
  the fallback disc follows the path.
- Children sit in one absolutely positioned wrapper at the point, as a
  percentage of the box, translated by −50%/−50% so their center is on the
  point. They render after the SVG, so streaks pass behind them.
- Per frame: one path, at most one circle, one wrapper. Rays and streaks are
  capped at 64.

## Determinism

Every value derives from `useCurrentFrame()`, `useVideoConfig()`, props, and
remotion `random()` with string seeds. There is no React state, no memoized or
accumulated value, and no CSS animation. Velocity is a finite difference of the
pure position function, so any frame renders identically when seeked directly.

## Placing it over a scene

- As an entrance, put the element inside `SpeedLines` in a full-frame layer
  within the `Sequence` where the entrance starts. Set `from` off-screen and
  `to` at the resting place, and set `spread` to the element's size across the
  direction of travel. The element stays on `to` after the motion.
- For a landing, `getSpeedLinesTimeline({ duration }).impact` is the contact
  frame. Start a `focus` on the same point
  `getSpeedLinesTimeline({ mode: "focus" }).impact` frames earlier, so its lines
  snap on the contact. A `trim-burst` goes on the contact frame itself.
  - Set the focus `spread` to about the element's half-diagonal, so the rays
    stop short of it.
  - Render the focus layer before the element's layer, so its rays pass behind
    the element.

Files: `registry/remocn/speed-lines/index.tsx`, `config.ts`,
`__tests__/speed-lines.test.ts`, and
`content/docs/motion-graphics/speed-lines.mdx`. The lead integrates
registry.json, the preview index, the manifest, navigation, and the changelog
after the user approves the preview.

## Revision: inertial landing

Review feedback: in trail mode the element stopped dead. The 1.1% recoil read
as an abrupt stop, with no sense of momentum. The trail landing is now a damped
spring, and the element squashes and stretches with its motion. Two props
control this, `bounce` and `squash`, both 0–1 with a default of 0.5. Focus mode
is unchanged, and it ignores both props.

### The landing spring

- Flight: the curve keeps its form, `ease = c(w²/2 − κw³/3)`. The contact
  ratio now carries momentum: `L = 0.3 + 0.3·bounce` of the top speed, with
  `κ = (1 + √(1 − L))/2` and `c = 1/(1/2 − κ/3)`. That is 45% at the default.
- Landing, with `s = t − duration`:
  `ease = 1 + (V/duration)·(sin(ω_d s)/ω_d)·e^(−σs)·(1 − taper(s))`. Here
  `V = c(1 − κ)` is the contact velocity per unit of `w`, so velocity is
  continuous at contact. This is the impulse response of a damped spring
  started from the target at the arrival speed.
- Damping comes from the echo. The echo is the swing back past the target, and
  it is `r = 0.2·bounce` of the overshoot. With `δ = −ln r`, the damping ratio
  is `ζ = δ/√(π² + δ²)`, and `ζ = 1` when `bounce` is 0.
- The spring softens as `bounce` grows: `ω₀ = 1/(1 + 1.2·bounce)` rad per
  frame, `σ = ζω₀` and `ω_d = ω₀√(1 − ζ²)`.
- Settle: `settle = ceil(6/σ)`. A smoothstep over the second half tapers the
  tail to exactly 1, so the element comes to rest exactly on `to`, and
  `end = duration + settle`.
- At `bounce` 0: `L = 0.3`, `ζ = 1`, `ω₀ = 1` and `ω_d → 0`, so the landing term
  becomes `s·e^(−s)` with a taper over 3–6. That is the old curve exactly.

| `bounce` | Contact speed | Overshoot (960 px) | Peak | Echo | `end` |
| --- | --- | --- | --- | --- | --- |
| 0 | 30% | 10.6 px, 1.1% | 15.0 | none | 20 |
| 0.5 | 45% | 34.0 px, 3.5% | 15.9 | −3.4 px at 22.1 | 31 |
| 1 | 60% | 69.3 px, 7.2% | 16.7 | −13.9 px at 24.5 | 43 |

Frames are at the default `duration` of 14. The overshoot scales with the
arrival speed, so the same spring gives 8.3% at `duration` 6 and 1.2% at 40.
At the default, the element is visually at rest (under 0.5 px off) from frame
26. `speedLinesLength` is 31, and the preview is 55 frames.

### Squash and stretch

- Strain `ε` is the log of the scale along the path: `along = e^ε`,
  `across = e^(−ε)`. Their product is exactly 1, so the element keeps its area.
- `ε = S·tanh(q·k_s·v/S) − Q·tanh(q·k_q·p/Q)`, clamped to `[−Q, S]`:
  - `S = ln 1.3` and `Q = ln 1.25` are the caps: 1.3× stretch and 0.8× squash.
  - `q` is `squash`, `k_s = 0.007` and `k_q = 0.018`.
  - `v` is the speed, `|dP/dt|` in reference px per frame. It is a central
    difference of the same `ease`.
  - `p` is the distance past the target in reference px, `max(0, ease − 1)`
    times the flight length.
- For small speeds, `along ≈ 1 + q·k_s·v`, the linear smear. The stretch
  saturates smoothly at 1.3.
- The squash term is the spring's own displacement. It peaks with the
  overshoot and recovers exactly as the spring returns the element. It is
  one-sided, so the element never stretches while it stands still at the echo.
  Stretch only ever comes from real speed, so the landing reads as weight
  rather than rubber.
- Orientation: `θ = atan2(to − from)` in px. Children get
  `translate(-50%, -50%) rotate(θ) scale(along, across) rotate(−θ)` with
  `transform-origin: 50% 50%`. The fallback disc is an `<ellipse>` with radii
  `r·along` and `r·across`, rotated by `θ` about its center. Both deform about
  the moving center, so the element never slides off its path or its landing
  point.
- Default at 30 fps:
  - Cruise, frames 5–11: 1.25 × 0.80.
  - Contact, frame 14: 1.14.
  - Frame 15: 0.88.
  - Frame 16: 0.83 × 1.21. That is the squash peak, on the overshoot peak.
  - Round again by frame 20, and at most 1.015 on the swing back.

### Streaks through the landing

Velocity is still the finite difference of the same `P(t)`, so it now includes
the overshoot and the rebound. The gate is the speed gate times
`1 − smoothstep(t − duration)`, so streaks shrink over the frame after contact
and are gone from `duration + 1`. The rebound moves backward, where `s = V · d`
is negative, so it never draws streaks. The echo's second forward swing comes
after the contact gate has closed.
