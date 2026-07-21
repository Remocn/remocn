# Plan 025: scribble-circle — circling something with a pen

> Read plan 014's **Workflow** and **Series conventions** first. Standard
> per-component touch checklist applies unless a section below overrides it.

## Status

- **Effort**: S
- **Depends on**: 014
- **Category**: feature
- **Section**: Effects
- **Wave**: stop-motion wave 2 (024–029)

> **Amended during implementation (owner request).** The spec below described a
> constant-width **pen** stroke revealed by `strokeDashoffset`, with a `wobble`
> prop scaling the radius noise. Shipped behaviour is a **brush**: a filled
> ribbon whose width follows a pressure profile, roughened by a grain filter,
> grown by regenerating the ribbon per pose. `wobble` is gone (the radius noise
> is now a fixed internal constant — the character comes from the brush, and a
> knob that could flatten the loop into a perfect ellipse contradicted the
> component's own name). `pressure` and `grain` replace it. The draw ease is
> linear rather than `easeOutCubic`, because with ease-out the first visible
> pose already showed 42% of the loop and the last four poses were
> indistinguishable — the gesture read as appearing, not as being drawn.

## Goal

A loose ellipse scribbled around something — the strongest annotation gesture
there is, and the one the kit is missing. `ink-underline` can emphasise a line
of text; nothing can point at a region.

The typical shot: a product screenshot on the page, and the pen goes round the
one button that matters.

## Source

No demo source. The draw mechanics are `ink-underline`'s
(`pathLength` + `strokeDasharray` + `strokeDashoffset` driven by
`steppedRamp`); the geometry is new.

## API (contract)

```ts
export interface ScribbleCircleProps {
  width: number;
  height: number;
  color?: string;         // "#6f7f35"
  strokeWidth?: number;   // 5
  delay?: number;         // 0
  durationSteps?: number; // 6
  laps?: number;          // 1.15 — how far round the pen travels
  wobble?: number;        // 1 — multiplier on the per-angle radius noise
  seed?: string;          // "scribble"
  step?: number;          // 3
}

export function ScribbleCircle(props: ScribbleCircleProps): React.ReactElement;
```

## Rejected alternative: children + auto-sizing

A `<ScribbleCircle>{target}</ScribbleCircle>` that measures its child and
draws around it is the nicer-looking API, and it is wrong here. Measurement
needs `useLayoutEffect` + `getBoundingClientRect`, which do not run in
Remotion's server-side render — the ellipse would size correctly in the
browser preview and collapse in the exported video. Explicit `width`/`height`
is the honest contract, same as `ink-underline`'s required `width`.

## Behavior

- Root is a `position: relative` div of `width × height` holding an
  `overflow: visible` svg. The consumer positions it absolutely over the
  target. No background, no children.
- Path: an ellipse of radii `width / 2`, `height / 2` sampled at
  `SAMPLES_PER_LAP = 48` angles per lap. `points` is **not a prop** — it is a
  helper parameter with that constant as its default, so the component's
  surface stays small.
- At angle index `i` the radius is scaled by
  `1 + hashRange(`${seed}:r${i}`, -NOISE, NOISE) * wobble` where
  `NOISE = 0.06`, so the loop is organic rather than geometric. The centre is
  nudged by `hashRange(`${seed}:cx`, -CENTRE, CENTRE)` and the `:cy`
  equivalent, where `CENTRE = 0.02` of the respective axis.
- `laps` is a float. `1.15` means the pen goes round once and carries ~54°
  past where it started — the overshoot is what stops it reading as a shape
  tool. `laps: 2` gives the double-loop scribble; `laps: 0.9` an open arc.
  The second lap's noise is keyed on the absolute sample index, so it does not
  retrace the first lap exactly.
- Samples are joined with a Catmull-Rom → cubic bezier conversion so the
  stroke is smooth at any sample count.
- **There is no seam.** The path is one open polyline of
  `ceil(laps * SAMPLES_PER_LAP)` sequential samples — it is never closed and
  the second lap is never spliced onto the first. Where the pen passes its own
  starting angle the radius differs (the noise is keyed on the absolute sample
  index, not the angle), so the two laps sit slightly apart, which is the
  desired scribble look; Catmull-Rom sees an unbroken point sequence and the
  tangent stays continuous through the crossing.
- Draw progress = `steppedRamp(frame, delay, delay + durationSteps * step,
  { ease: easeOutCubic, step })`, applied to `strokeDashoffset` with
  `pathLength={1}`. Hidden entirely before the first pose (`progress > 0`
  gate, matching `ink-underline`).
- `strokeLinecap="round"`, `fill="none"`, `opacity` 0.85.

## Viewport padding

Radius noise and `strokeWidth` both push the stroke outside the nominal
`width × height` box, and the excursion differs per axis. The margins are
therefore computed separately:

```
marginX = strokeWidth + (width  / 2) * NOISE * wobble + width  * CENTRE
marginY = strokeWidth + (height / 2) * NOISE * wobble + height * CENTRE
```

At the control maximum `wobble` 3 that is an 18% excursion on the radius —
`NOISE * wobble = 0.06 * 3` — which is 9% of `width` and 9% of `height`
respectively, plus the centre nudge. Those are different pixel amounts, which
is why a single scalar margin cannot bound both axes and there are two.

`strokeWidth` is consequently a **parameter of the path helper**, not just a
component prop; the helper cannot compute its own viewBox without it. This
mirrors `inkArrowViewport(from, to, curvature, headSize, strokeWidth)` at
`registry/remocn/ink-arrow/index.tsx:61-74`, which takes `strokeWidth` for the
same reason.

The root div keeps the nominal `width × height` so the consumer's positioning
math stays predictable; only the svg overflows.

Note on the `Math.max` flooring in `inkArrowViewport`
(`registry/remocn/ink-arrow/index.tsx:71-72`): it exists there because
`from`/`to` are arbitrary consumer points that can be negative. Here the padded
dimensions are `width + 2 * marginX` and `height + 2 * marginY`, every term
positive, so a degenerate viewBox is not reachable and no flooring is needed.

That fix was made during plan 018's implementation and never written back into
`plans/018-ink-arrow.md`, so cite the code, not the plan.

## Registry entry

Standard. `registryDependencies: ["@remocn/stop-motion"]`.

## Docs page

`content/docs/effects/scribble-circle.mdx`; add `"scribble-circle"` to
`content/docs/effects/meta.json`.

- title `Scribble Circle`
- description `A loose pen circle that scribbles itself around a region of the frame`
- Usage: absolutely positioned over a card in a screenshot, and a second
  example pairing it with `ink-arrow` (circle the thing, then point at it).

## Customizer config + preview

Controls: `laps` (number 0.5–3, step 0.05), `wobble` (number 0–3, step 0.1),
`strokeWidth` (number 1–12), `durationSteps` (number 2–20), `color` (color),
`seed` (text), `step` (number 1–6). `width`/`height` fixed by the scene.

In-flow component → `registry/__index__.tsx` loads
`components/docs/examples/scribble-circle-example.tsx`. The scene MUST show
the circle landing **around a UI card**, not floating on an empty frame — an
annotation with nothing to annotate is not a preview.

`durationInFrames` from the control maxima: `durationSteps` 20 × `step` 6 =
120, plus a beat to read it → **150**.

## Skill reference

Row in **Backgrounds & Effects**:

- Use for: circling the one element that matters — a button, a number, a row
  in a screenshot.
- Avoid for: a permanent border or a focus ring. This is a gesture that
  happens once, not a state.
- Deps: `@remocn/stop-motion`.

## components.mdx

Card in the **Effects** section: name `ScribbleCircle`, href
`/docs/effects/scribble-circle`.

## Tests (`bun:test`)

```ts
export function scribbleCirclePath(args: {
  width: number;
  height: number;
  strokeWidth: number;
  laps?: number;
  wobble?: number;
  seed?: string;
  points?: number;   // SAMPLES_PER_LAP
}): { d: string; viewBox: string; marginX: number; marginY: number };
```

- deterministic for a seed; different seeds give different `d`.
- `wobble: 0` produces a clean ellipse — every sampled point sits within a
  tight tolerance of the nominal radius **measured from the nudged centre**,
  not from the nominal one. The centre nudge is deliberately not scaled by
  `wobble` (an unwobbled circle still should not sit perfectly concentric), so
  at `wobble: 0` the ellipse is still displaced by up to `CENTRE` of each axis.
  Measuring from the nominal centre would fail by ~4% of the radius.
- sample count scales with `laps`; `laps: 2` yields a longer path than
  `laps: 1`.
- every sampled point stays inside the padded viewBox, checked across the full
  `wobble` control range (0–3) and both axes independently.
- at `laps: 1.15` the two passes over the starting angle sit at **different**
  radii — the property worth asserting at the crossing. Tangent continuity
  there is true by construction (it is an ordinary interior sample of one
  polyline) and would never fail, so it is documented in Behavior rather than
  tested.

## Acceptance criteria (owner verifies)

1. The pen goes round in poses and overshoots its start at the default
   `laps`; it never looks like a drawn `<ellipse>`.
2. Changing `seed` changes the loop's character; the same seed is identical
   across renders.
3. At `wobble: 0` the result is a clean ellipse — the noise is fully
   controllable.
4. Standard: tests green, typecheck, biome, registry drift clean.

## Out of scope

- Auto-sizing to a child (rejected above).
- Rectangular or bracket-shaped annotations.
- Crossing something out — that is `ink-cross-out` (backlog).
