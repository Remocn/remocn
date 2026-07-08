# Motion Principles for remocn

The 12 classic animation principles, adapted to **composing Remotion videos from remocn blocks**.
Each entry: the principle → the Remotion mechanic that expresses it → a remocn component that
demonstrates it → do/avoid tuned to remocn's restraint.

- This file is about **which** principle and **when** (intent). For **how** the APIs work
  (easing curves, sequencing, spring config), see the `remotion-best-practices` skill.
- Motion must stay restrained — see `design.md`. Where a principle pushes toward boldness
  (squash, exaggeration), the cap below always wins.
- Idiom note: remocn components drive motion with `spring()` and `interpolate()` + `Easing`.
  Examples here use that same idiom.

The 8 principles below are routinely useful when assembling scenes; the remaining 4 (character-
animation territory) are compressed at the end.

---

## 2. Anticipation

A short wind-up before the action makes it feel intentional: a drawer dips before it expands.

- **Mechanic:** `spring()` with light overshoot, or a brief reverse `interpolate` (e.g. `−4px`)
  for 1–3 frames before the main move.
- **remocn:** `spring-scale-in`.
- **Do/Avoid:** keep the wind-up to 1–3 frames, ≤110% scale. ❌ No bouncy cartoon recoil.

## 3. Staging

Direct the eye: one clear idea per scene. Clear the stage before introducing the next element.

- **Mechanic:** `<Sequence>` / `<Series>` to isolate beats; stagger entrances so only one focal
  element moves at a time; dim/scale-down what's leaving.
- **remocn:** most Compositions.
- **Do/Avoid:** one focal action per beat. ❌ Don't enter five elements on the same frame.

## 5. Follow-Through & Overlapping Action

Nothing stops at once; elements arrive staggered. Lighter things lead, heavier lag.

- **Mechanic:** per-element delay offsets (`frame - index * stagger`) on the same animation.
- **remocn:** `staggered-fade-up`, `short-slide-right`.
- **Do/Avoid:** stagger 3–6 frames between siblings. ❌ Don't land a whole group on one frame
  (reads robotic) and don't over-stagger (feels sluggish).

## 6. Slow In & Slow Out

Ease into and out of poses — almost nothing should move linearly.

- **Mechanic:** `interpolate(..., { easing: Easing.out(Easing.cubic) })`; sharp curve = snappy,
  gentle = graceful.
- **remocn:** transitions (`whip-pan`, `focus-pull`), most text reveals.
- **Do/Avoid:** default to ease-out for entrances. ❌ Linear `interpolate` for visible motion
  unless it's a constant drift (e.g. marquee, grid pan).

## 7. Arc

Living motion follows curves, not straight lines — especially cursors and gestures.

- **Mechanic:** drive `x` and `y` from separate eased interpolations, or a bezier path.
- **remocn:** `cursor` + `useCursorPath`, social cards' cursor travel to the Follow button.
- **Do/Avoid:** curve cursor/hand paths. ❌ No straight diagonal cursor jumps.

## 8. Secondary Action

Supporting motion that reinforces the primary action without stealing focus.

- **Mechanic:** a small parallel channel — a cursor ripple on click, a shadow that breathes as a
  card opens, a caret blink under typing.
- **remocn:** `x-follow-card` (ripple at click), `typewriter` (`caret` blink).
- **Do/Avoid:** secondary motion stays subtle and on-theme. ❌ Don't add competing animation that
  splits attention.

## 9. Timing

Frame counts set weight: fast = light, slow = heavy. Vary timing for contrast.

- **Mechanic:** budget in frames @ fps (remocn defaults to 30fps; component durations run
  ~90–300 frames). The `speed` prop scales the animation tier.
- **remocn:** every animation-tier component (`speed`); composition `durationInFrames`.
- **Do/Avoid:** match duration to weight — a heavy hero assemble is slower than a toast. ❌ Don't
  reuse one duration for everything (kills rhythm).

## 10. Exaggeration (capped)

Push slightly past literal reality for clarity — but remocn's house style is restraint.

- **Mechanic:** a touch of overshoot on `spring()`, a brief ≤110% scale peak.
- **remocn:** `spring-scale-in`, `micro-scale-fade`.
- **Do/Avoid:** subtle UI exaggeration only (≤110%, gentle overshoot). ❌ No stretched/cartoon
  exaggeration — this is the principle most likely to collide with `design.md`; the cap wins.

---

## Rarely needed when composing blocks

Character-animation territory — reach for these only when hand-drawing motion, not when
assembling catalog components:

- **1. Squash & Stretch** — at most a 2–4% `scaleX`/`scaleY` volume trade on a hard landing
  (`spring-scale-in`, `confetti`); rubber-band squash on text or cards fights `design.md`.
- **4. Straight-Ahead vs Pose-to-Pose** — remocn is pose-to-pose by construction:
  `interpolate(frame, [k0, k1, k2], [v0, v1, v2])` keyframes are your poses; straight-ahead
  (frame-by-frame) is for hand-drawn organic effects.
- **11. Solid Drawing** — keep one `perspective` / vanishing point per scene when stacking 3D
  layers (`push-through`, `perspective-marquee`).
- **12. Appeal** — emergent from staging + timing + restraint, not a knob; more motion ≠ more
  appeal.
