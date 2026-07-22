# Plan 027: tape — a strip that holds something to the page

> Read plan 014's **Workflow** and **Series conventions** first. Standard
> per-component touch checklist applies unless a section below overrides it.

## Status

- **Effort**: S
- **Depends on**: 014
- **Category**: feature
- **Section**: UI Blocks
- **Wave**: stop-motion wave 2 (024–029)

> **REJECTED.** The component was built to this plan and then removed at the
> owner's request — it was not needed. Everything below is kept as the record
> of what was tried, in the same way plan 019 (`paper-field`) is kept. Wave 2
> therefore ships **four** components, not five; plan 029's sweep lists were
> updated to match. Do not re-implement this without a fresh decision.
>
> **Amended during implementation.** The `at` control is 0–24, not 0–60, and
> `durationInFrames` is **90**, not 120. Carried over from plan 026, where the
> owner rejected a preview that held a settled frame for most of its length: a
> 60-frame `at` maximum only exists to push the preview longer, and the landing
> itself is a 6-frame gesture. Two tests pin both ends — the scene's two strips
> must still settle inside the preview at the control maxima with a 30-frame
> reading beat, and the default choreography must stay short enough to loop.

## Goal

A torn strip of matte tape that lands across a corner. Right now nothing in
the kit **fastens** anything: polaroids and stickers float on the page. Tape
is the piece that makes a scrapbook look assembled by hand.

## Source

No demo source. The landing choreography is `paper-sticker`'s (020), reused
deliberately so every object in the kit arrives the same way.

## API (contract)

```ts
export interface TapeProps {
  width?: number;      // 160
  height?: number;     // 44
  rotation?: number;   // -8, degrees
  color?: string;      // "rgba(214,203,176,0.78)"
  at?: number;         // 0, the frame the tape lands
  torn?: boolean;      // true
  teeth?: number;      // 6, jag count per torn end
  seed?: string;       // "tape"
  step?: number;       // 3
}

export function Tape(props: TapeProps): React.ReactElement;
```

No children. Tape is a decoration the consumer positions absolutely over the
corner of whatever it is holding.

## Behavior

- **Landing: the scale half is verbatim from `paper-sticker`.**
  `steppedRamp(frame, at, at + 2 * step, { step })`, `return null` while it is
  0, `scale` 1.12 while progress < 1 and 1 once it saturates — the sticker's
  exact overshoot value (`registry/remocn/paper-sticker/index.tsx:53`), not a
  new number. Two poses, no third, so a page full of pinned objects reads as
  one hand working.
- **The rotation half is NOT verbatim — do not copy the sticker's line.**
  `paper-sticker` has no decaying rotation: its `tilt` is a lifetime constant
  (`index.tsx:37`) applied unchanged at `:53`, and the only progress-keyed term
  is the binary scale. Tape instead lands at
  `rotation + hashRange(`${seed}:land`, -4, 4)` degrees and resolves to
  `rotation` once settled, so the strip visibly straightens as it is pressed
  down. That decay is deliberate and has no counterpart in the sticker.
- **Both boundaries are quantized.** `steppedRamp` compares `qf(frame, step)`,
  not the raw frame (`registry/remocn/stop-motion/index.ts:63-65`). When `at`
  is a multiple of `step` the strip first appears at `at + step` and settles at
  `at + 2 * step`. When it is not, both slip to the next pose boundary: at
  `at` 5, `step` 3 the end is 11 but `qf(11) = 9 < 11`, so it settles at 12,
  and the first visible frame is 6 — `at + 1`, not `at + step`. **`at` should
  be a multiple of `step`**; the docs page says so, and the tests below assert
  the general quantized rule rather than the convenient one.
- **Shape.** One svg `<path>` of `width × height`, rotated by the wrapper.
  `torn: false` → a plain quad with the two long edges nudged in y by
  `hashRange(`${seed}:e${n}`, -height * 0.04, height * 0.04)` so it is never
  perfectly rectangular. That amplitude is what the vertex-bound test below
  asserts against. `torn: true` → both short
  ends become a `teeth`-point zigzag, each vertex offset along x by
  `hashRange(`${seed}:l|r${n}`, -height * 0.12, height * 0.12)`. Deterministic
  per seed; the two ends never mirror each other.
- **Translucency.** Flat `fill={color}` plus `mixBlendMode: "multiply"` on the
  svg, so whatever is underneath genuinely shows through — the honest physical
  model, and it needs no gradient. Per the kit's anti-slop rule there is **no**
  specular gradient, no glow, no drop shadow. A single 1px edge line at 8%
  black along both long edges is the only added detail.
- **Deliberate deviation from `paper-sticker`: no ambient jitter.** The
  sticker keeps breathing after it lands (`paperJitter` at `amp: 0.7`,
  `rotAmp: 0.2`) because it is a loose label. Tape is stuck down — it must move
  with whatever it holds, not independently of it, or the card will appear to
  slide around under its own fastenings. Once settled the strip is completely
  still; put the tape and the thing it holds inside the same `paper-wobble` so
  they breathe together. Do not copy the sticker's `paperJitter` call.
- Component sets no background of its own.

## Registry entry

Standard. `registryDependencies: ["@remocn/stop-motion"]`.

## Docs page

`content/docs/ui-blocks/tape.mdx`; add `"tape"` to
`content/docs/ui-blocks/meta.json`.

- title `Tape`
- description `A torn strip of matte tape that lands across a corner and holds it down`
- Usage: two strips pinning a `polaroid`'s top corners, positioned absolutely
  with opposite `rotation` signs and `at` values one pose apart so the two
  pieces are applied in sequence, not simultaneously.
- Note that `mixBlendMode: multiply` needs something underneath — over a
  transparent frame the tape reads as flat colour. Point at `backdrop`.

## Customizer config + preview

Controls: `width` (number 60–400), `height` (number 16–90), `rotation`
(number -45–45), `torn` (boolean), `teeth` (number 3–12), `color` (color),
`at` (number 0–60), `seed` (text), `step` (number 1–6).

In-flow decoration → `registry/__index__.tsx` loads
`components/docs/examples/tape-example.tsx` (the `TapeExampleScene` shape used
by `paper-sticker`), NOT the component directly.

**Preview guard.** The scene MUST show the tape **holding the corner of a
card** on a paper backdrop. A bare strip on an empty frame is exactly the
failure that got plan 019 (`paper-field`) rejected: a component whose whole
point is its relationship to something else cannot be previewed alone. If the
strip is not visibly fastening anything, the preview is wrong.

`durationInFrames` from the control maxima: `at` 60 + `2 * step` 12 = 72, plus
a beat to read the settled strip → **120**.

## Skill reference

Row in **UI Blocks**:

- Use for: fastening a photo, note, or card to the page in a scrapbook scene —
  usually two strips on opposite corners.
- Avoid for: a label or a badge carrying text → `paper-sticker`. Tape holds
  things; it does not say anything.
- Deps: `@remocn/stop-motion`.

## components.mdx

Card in **UI Blocks → Paper & Scrapbook**: name `Tape`, href
`/docs/ui-blocks/tape`.

## Tests (`bun:test`)

`tapePath({ width, height, torn, teeth, seed })` extracted pure:

- deterministic per seed; different seeds give different paths.
- `torn: false` yields exactly four vertices.
- `torn: true` yields `4 + 2 * (teeth - 1)` vertices and honours `teeth`
  across its control range.
- every vertex stays within `[-height * 0.12, width + height * 0.12]` on x and
  `[-height * 0.04, height * 1.04]` on y — the long edges are nudged too, so
  a strict `[0, height]` bound would fail.
- the left and right ends of a torn strip are not identical.

Landing schedule (`tapeLanding({ frame, at, step, seed })` → `{ visible,
scale, rotationOffset }`) — `seed` is a parameter because `rotationOffset` is
`hashRange(`${seed}:land`, -4, 4)` decayed, which the helper cannot compute
without it:

- with `at` a multiple of `step`: invisible at and before `at`, overshoot at
  `at + step`, settled from `at + 2 * step` onward and constant thereafter.
- with `at` **not** a multiple of `step` — cover `at: 5, step: 3` explicitly —
  first visible at 6 and settled at 12, per the quantized rule. Asserting the
  convenient `at + 2 * step` here would fail, which is the point of the test.
- `rotationOffset` decays to exactly 0 once settled.

## Acceptance criteria (owner verifies)

1. Two strips at opposite corners of a polaroid read as tape holding it, and
   land one after the other rather than together.
2. What is underneath shows through the tape.
3. `torn: false` gives a clean cut strip; `torn: true` never produces the same
   jag on both ends.
4. With `at` on the pose grid, nothing appears before `at + step` and the
   strip is motionless from `at + 2 * step` — including its rotation, which
   has fully straightened.
5. Standard: tests green, typecheck, biome, registry drift clean.

## Out of scope

- Washi patterns, printed tape, coloured stripes.
- A `children` API that auto-pins its content — the consumer positions it.
- Peeling, curling, or removal animation.
