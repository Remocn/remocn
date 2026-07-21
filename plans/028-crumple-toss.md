# Plan 028: crumple-toss — screwing something up and throwing it away

> Read plan 014's **Workflow** and **Series conventions** first. Standard
> per-component touch checklist applies unless a section below overrides it.

## Status

- **Effort**: M
- **Depends on**: 014
- **Category**: feature
- **Section**: Effects
- **Wave**: stop-motion wave 2 (024–029)

## Goal

Take something off the desk. Everything in the kit so far **arrives** — the
only way to remove anything today is `page-turn`, which replaces the entire
scene. `crumple-toss` crushes one element into a ball and throws it out of
frame.

That unlocks a whole beat product videos lean on: *this is how it used to
work* → crumple → *here is the new way*.

## Source

No demo source. New component on the core clock (014).

## API (contract)

```ts
export interface CrumpleTossProps {
  children: React.ReactNode;
  at: number;             // the frame the crumple starts
  crumpleSteps?: number;  // 4 poses of crushing
  tossSteps?: number;     // 5 poses of flight
  direction?: number;     // -35, throw angle in degrees, -180…180
                          // (0 = right, negative = upward, |d| > 90 = leftward)
  distance?: number;      // 900 — the arc's scale factor, NOT px travelled
  spin?: number;          // 220 degrees of tumble
  crushTo?: number;       // 0.34 — scale at the end of the crumple
  seed?: string;          // "toss"
  step?: number;          // 3
}

export function CrumpleToss(props: CrumpleTossProps): React.ReactElement | null;
```

## Behavior

Wrapper is `display: inline-block`, `transformOrigin: "center"`. The children
are never touched — all motion lives on the wrapper, so anything can be
thrown away, including a `polaroid` or a whole composed card.

Four phases, driven off the pose index `p = qstep(frame - at, step)`:

| Phase | Pose index `p` | What |
|-------|----------------|------|
| idle | `frame < at` | identity transform, children rendered as-is |
| crumple | `0 ≤ p < crumpleSteps` | scale converges from 1 to `crushTo`, non-uniformly |
| toss | `crumpleSteps ≤ p < crumpleSteps + tossSteps` | the crushed ball flies and tumbles out of frame |
| gone | `p ≥ crumpleSteps + tossSteps` | `return null` |

The bounds are **half-open**, so `crumpleSteps: 4` means exactly 4 crush poses
(`p` = 0,1,2,3) and `tossSteps: 5` exactly 5 flight poses — matching the prop
comments. Crush progress within the phase is `(p + 1) / crumpleSteps`, so the
last crush pose reaches `crushTo` exactly; flight progress is
`(p - crumpleSteps + 1) / tossSteps`.

**Crumple.** Per pose the mean scale `m` steps toward `crushTo`, and the two
axes are pulled apart **antisymmetrically** around it:

```
j      = hashRange(`${seed}:${p}:j`, -0.35, 0.35)
scaleX = m * (1 + j)
scaleY = m * (1 - j)
```

plus a `skewX` of `hashRange(`${seed}:${p}:sk`, -7, 7)` degrees and a rotation
jitter of ±6°. Each pose is therefore a distinctly *different* crushed shape,
not a smooth shrink — the difference between paper being crushed and a div
scaling down.

Two reasons the jitter is proportional and antisymmetric rather than two
independent additive offsets. First, an additive `±0.18` on a `crushTo` of
0.15 (the control minimum) goes **negative** and mirrors the element. Second,
independent per-axis hashes make `(scaleX + scaleY) / 2` a random walk, so the
monotonic-shrink property below would not actually hold. With this form the
mean is exactly `m` by construction and neither axis can cross zero while
`|j| < 1`.

**The clip is what sells it.** Throughout the crumple the wrapper carries a
`clipPath: polygon(...)` of 8 vertices, starting at the exact rectangle and
with each vertex pulled inward per pose by `hashRange(`${seed}:${p}:v${n}`,
0, 0.12 * crushProgress)` of the box. By the final crumple pose the silhouette
is an irregular blob. Without this the element reads as a shrinking rectangle
no matter how the scale jitters.

**Toss.** With flight progress `t` in `(0, 1]`, position follows a parabola:

```
x = distance * cos(direction) * t
y = distance * sin(direction) * t + GRAVITY * distance * t²
```

`GRAVITY = 0.9` is a dimensionless constant scaled by `distance`, so the arc
keeps its shape at any throw length; it is not a prop, since a second knob
controlling the same curve is not worth the surface. With the default
`direction` of −35° the `sin` term is negative, so the ball rises, the `t²`
term overtakes it, and it falls away — the arc a thrown ball actually makes.

The constant is picked, not guessed. At the defaults (`direction` −35°,
`distance` 900) it peaks at `t ≈ 0.32` having risen ≈82 px — 9% of `distance`
— then falls to `x` +737, `y` +294 by `t = 1`. For comparison, `1.6` rises
only 5% and then plunges 924 px, which reads as the element being dropped
rather than thrown; `0.574` gives a perfectly symmetric parabola that returns
to its exact launch height, which reads as a bounce that never lands. `0.9` is
the value that reads as a throw. The test below pins the peak so this cannot
drift.

`distance` scales the arc; it is **not** the pixel length of the flight,
because the gravity term is added on top of the `distance`-scaled launch. At
the defaults the ball ends 737 px right and 294 px down — a 794 px
displacement from a `distance` of 900. The `<PropsTable>` description on the
docs page must say "scale of the throw arc", not "distance travelled".

Rotation accumulates `spin` degrees over the phase and scale eases from
`crushTo` to `crushTo * 0.45`. The clip polygon holds its final crumpled
silhouette for the whole flight.

**Opacity is stepped, not faded.** Everything in this kit is constant within a
pose, so "fading across the last pose" is meaningless — there is no sub-pose
time. Opacity is `1` for every flight pose except the final one, which is
`0.4`, and then the component is gone. One stepped drop reads as the ball
leaving; a gradient across the flight would read as a dissolve, which is the
wrong idea entirely.

**Gone.** After `at + (crumpleSteps + tossSteps) * step` the component returns
`null`. In absolute positioning — the intended use — this is invisible. In
normal flow the element's box collapses at that frame, which is documented on
the docs page; wrap in an `<AbsoluteFill>` or a sized container if the layout
must hold.

## One pure helper

Everything above factors into a single function, so the component is a thin
renderer with no arithmetic in it:

```ts
export type CrumplePose = {
  phase: "idle" | "crumple" | "toss" | "gone";
  scaleX: number;
  scaleY: number;
  skewX: number;
  rotate: number;
  x: number;
  y: number;
  opacity: number;
  clip: [number, number][];   // exactly 8 [x, y] pairs, percentages
};

export function crumpleTossPose(args: {
  frame: number;
  at: number;
  crumpleSteps?: number;
  tossSteps?: number;
  direction?: number;
  distance?: number;
  spin?: number;
  crushTo?: number;
  seed?: string;
  step?: number;
}): CrumplePose;
```

## Registry entry

Standard. `registryDependencies: ["@remocn/stop-motion"]`.

## This is an exit, not a transition

`crumple-toss` removes **one element** while the scene around it continues.
It is not a `TransitionPresentation` and must not be registered under
Transitions. The scene-level paper exit is `torn-paper`, still on the wave-2
backlog; when that lands it goes in Transitions alongside `page-turn`.

## Docs page

`content/docs/effects/crumple-toss.mdx`; add `"crumple-toss"` to
`content/docs/effects/meta.json`.

- title `Crumple Toss`
- description `Crushes an element into a ball of paper and throws it out of frame`
- Usage: the before/after beat — a card of the old way inside `CrumpleToss`,
  the new one entering behind it as the ball leaves.
- Document the `return null` layout consequence, and that `direction` is
  measured in screen space where negative angles throw upward.

## Customizer config + preview

Controls: `at` (number 0–60), `crumpleSteps` (number 2–8), `tossSteps`
(number 2–10), `direction` (number -180–180), `distance` (number 200–1600),
`spin` (number 0–720), `crushTo` (number 0.15–0.7, step 0.01), `seed` (text),
`step` (number 1–6).

`direction` spans −180–180, not −90–90: `cos` is non-negative on the narrow
range, which would make a leftward throw unreachable from the customizer.

Children-based → `registry/__index__.tsx` loads
`components/docs/examples/crumple-toss-example.tsx` (the
`CrumpleTossExampleScene` shape used by `paper-wobble`), NOT the component
directly. The scene throws a card with real content in it, so the crumple
silhouette is legible.

`durationInFrames` from the control maxima: `at` 60 +
`(8 + 10) * 6 = 108` → 168, plus a beat of empty frame so the exit reads as
finished → **210**.

## Skill reference

Row in **Backgrounds & Effects**:

- Use for: discarding something on screen — the old plan, the wrong answer,
  the previous version.
- Avoid for: a general element exit in a clean UI scene → a fade or
  `soft-blur-in` in reverse. This one is loud and physical.
- Deps: `@remocn/stop-motion`.

## components.mdx

Card in the **Effects** section: name `CrumpleToss`, href
`/docs/effects/crumple-toss`.

## Tests (`bun:test`)

All against `crumpleTossPose`:

- `frame < at` → `phase: "idle"`, identity transform, opacity 1, rectangular
  clip.
- phase boundaries land on the right frames for several `step` values, and
  `phase: "gone"` from `at + (crumpleSteps + tossSteps) * step` onward.
- constant for every frame inside one pose.
- deterministic per seed; different seeds give different crush shapes.
- mean scale `(scaleX + scaleY) / 2` decreases **strictly** monotonically
  across the crumple and equals `crushTo` exactly on the last crush pose —
  guaranteed by the antisymmetric jitter, and a regression test against
  reintroducing independent per-axis offsets.
- neither `scaleX` nor `scaleY` is ever ≤ 0, checked at `crushTo: 0.15` (the
  control minimum) across every seed in a sample set.
- `x` displacement sign follows `cos(direction)`, including a leftward throw
  at `direction: 150`.
- `y` rises before it falls at `direction ≤ -15` **with `tossSteps` at its
  default of 5** — not at any negative angle, and not at any `tossSteps`.
  Flight progress is sampled at pose boundaries, so the first sample is
  `t = 1 / tossSteps` (0.2 at the default) and a rise there needs
  `sin(direction) < -GRAVITY / tossSteps`. At the default that is `< -0.18`,
  i.e. `direction < -10.4°`; at the control minimum `tossSteps` 2 it is
  `< -0.45`, i.e. `direction < -26.7°`. Hold `tossSteps` fixed in this
  assertion — sweeping it 2–10 against a fixed `direction: -15` fails at the
  low end, correctly. At `direction: -5` the very first flight pose is already
  below the launch point, which is right for a nearly-flat throw, not a bug.
- the arc peaks in the first half of the flight and rises at least 8% of
  `distance` at the defaults — the assertion that pins `GRAVITY` and stops the
  throw degrading into a drop. Assert against the **sampled** peak, which at
  `tossSteps` 5 is `t = 0.4` → 76.9 px = 8.54%, not the continuous 9.14%. The
  8% floor leaves 0.5 percentage points of margin; do not tighten it to 9%.
- opacity is 1 for every flight pose except the last, which is 0.4; phase is
  `"gone"` immediately after.
- the clip polygon always has exactly 8 pairs and every coordinate stays
  inside `[0, 100]`.

## Acceptance criteria (owner verifies)

1. The element reads as paper being crushed — the silhouette changes shape,
   it does not merely shrink.
2. The ball leaves the frame on an arc and is gone, with no fade-out haze
   trailing behind it.
3. Nothing moves before `at`; the frame is clean afterwards.
4. A `polaroid` (or any composed child) can be thrown without modification.
5. Standard: tests green, typecheck, biome, registry drift clean.

## Out of scope

- A matching `uncrumple` entrance.
- Landing physics — bouncing, a wastebasket, a resting ball.
- Scene-level paper exits → `torn-paper` (backlog).
- Real 3D folding or a WebGL crumple simulation. This is a stop-motion
  silhouette trick and stays one.
