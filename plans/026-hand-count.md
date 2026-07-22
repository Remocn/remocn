# Plan 026: hand-count — a number rewritten by hand, pose by pose

> Read plan 014's **Workflow** and **Series conventions** first. Standard
> per-component touch checklist applies unless a section below overrides it.

## Status

- **Effort**: M
- **Depends on**: 014
- **Category**: feature
- **Section**: Typography
- **Wave**: stop-motion wave 2 (024–029)

> **Amended during implementation (owner request).** The contract below has
> `ease?: "out" | "linear"` defaulting to `"out"`, and `durationSteps` 12.
> Shipped: `ease?: "in-out" | "out" | "linear"` defaulting to `"in-out"`, and
> `durationSteps` 18. Reason: with `easeOutCubic` over 12 poses the first
> visible pose already carried 23% of the count and the last six poses moved it
> only 13% — the number read as appearing rather than counting. The owner asked
> for a spring; a spring is not the fix, because springs start fast by
> construction (the same defect) and their overshoot would show a price
> climbing past its own figure before falling back. `easeInOutCubic` is what
> the request actually needed.
>
> Also amended: `durationSteps` max 40 → 24 and `durationInFrames` 270 → **90**
> (3s), at the owner's request that the preview hug the animation.
>
> This **knowingly breaks** the "size from the control maxima" rule below, and
> the break is unavoidable rather than sloppy: `step` runs to 6 by kit
> convention, so the *default* 18 poses already need 108 frames at `step: 6` —
> more than a 3-second preview holds. A preview cannot both be 3 seconds long
> and cover every slider position. The owner chose the short preview.
>
> Three tests pin the consequences instead of hiding them: the preview fits the
> default count with at least a 30-frame reading beat, never runs more than 2×
> the default settle frame, and **records the exact threshold where a maxed
> slider outruns it** — `step: 6` clips above 15 poses, `step: 3` never clips.
> If clipping ever matters more than the short preview, the one-line fix is
> capping this component's `step` control at 4 (24 × 4 = 96, still over 90) or
> at 3 (24 × 3 = 72, fits).

## Goal

A counting number in the paper voice. Every pose the value advances and the
digits are **written again** — same number, different hand. That re-drawing is
the whole illusion; it is how a flipbook counter behaves and how no other
number component in the registry behaves.

Without it a paper `pricing-reveal` or `year-in-review` has to borrow
`rolling-number` or `number-wheel`, which glide smoothly in a mechanical
typeface and break the scene.

## Source

No demo source. Caveat loading and per-glyph jitter follow `handwrite` (015);
the value ramp is `steppedRamp` from the core (014).

## API (contract)

```ts
export interface HandCountProps {
  to: number;
  from?: number;          // 0
  delay?: number;         // 0
  durationSteps?: number; // 12 — poses spent counting
  decimals?: number;      // 0
  prefix?: string;        // ""
  suffix?: string;        // ""
  fontSize?: number;      // 96
  color?: string;         // "#26242c"
  weight?: 400 | 500 | 600 | 700; // 700
  ease?: "out" | "linear"; // "out"
  align?: "left" | "center";      // "center"
  fontFamily?: string;    // Caveat
  seed?: string;          // "count"
  step?: number;          // 3
}

export function HandCount(props: HandCountProps): React.ReactElement;

export function handCountDuration(
  options?: { delay?: number; durationSteps?: number; step?: number },
): number;
```

## Behavior

- Value: `from + (to - from) * steppedRamp(frame, delay, delay +
  durationSteps * step, { ease, step })`, where `ease: "out"` is
  `easeOutCubic` and `"linear"` is identity. `steppedRamp` returns exactly `1`
  once it saturates, so the number **lands exactly on `to`** — it never stops
  at 99.7.
- **`steppedRamp` saturates on the quantized frame, not the raw one.** The
  source compares `qf(frame, step) >= to`
  (`registry/remocn/stop-motion/index.ts:63-65`). With `delay` 1,
  `durationSteps` 12, `step` 3 the end is 37, but `qf(37) = 36`, so frame 37
  is still short of the target — `easeOutCubic(35/36)` under the default
  `ease: "out"`, or 0.97 on the linear ramp — and the value only lands at 39.
  Two consequences the implementer must honour:
  - `handCountDuration` returns the frame the value actually **settles**,
    which is `Math.ceil(end / step) * step` where
    `end = delay + durationSteps * step` — not `end` itself. (Not `qf(end)`,
    which rounds the wrong way.) A `<Sequence>` sized by the naive formula
    cuts up to `step - 1` frames before the number lands.
  - `delay` should be a multiple of `step`; the docs page says so. When it is,
    the two formulas coincide.
- Text: `prefix + value.toFixed(decimals) + suffix`.
- Glyphs: each character in its own `inline-block` span, rotated by
  `hashRange(`${seed}:${pose}:${i}:r`, -3.2, 3.2)` degrees and offset by
  `hashRange(`${seed}:${pose}:${i}:y`, -1.8, 1.8)` px — the same amplitudes
  `handwrite` uses (`registry/remocn/handwrite/index.tsx:66-67`), so the two
  components read as one hand. `pose` is the quantized pose index.
- Because `pose` is part of the seed, **the whole number is re-jittered every
  pose** — that is the rewrite. `handwrite` keys its jitter on the text and
  the character index (`hw:${text}:${i}:r`) but **not** on time, because its
  text never changes; here the pose must be in the seed or the digits would
  slide in place like a ticker.
- **The jitter freezes on completion.** Once counting is done the pose seed is
  pinned to the final counting pose, so the settled number stops twitching.
  Ambient motion in this kit is `paper-wobble`'s job, and a headline number
  that keeps flickering for the rest of the shot is a distraction, not a
  texture. This is a testable property, not a judgement call: the transform at
  the last counting frame and 30 frames later must be identical.
- Layout: `position: absolute; inset: 0` with flex centring — the repo-wide
  typography convention that `handwrite` established. The consumer gives it a
  frame; it fills it.
- No background, no letter-spacing, no uppercase.

## Why not `registryDependencies: ["@remocn/handwrite"]`

`Handwrite` reveals characters progressively, one at a time. A counter must
show all its digits at once and change their values — the opposite motion.
Reusing it would mean fighting `perStep` and `shown` to disable the reveal.
The shared surface is two lines of `loadFont` config, which is not worth a
dependency.

`loadFont("normal", { subsets: ["latin"], weights: [...] })` from
`@remotion/google-fonts/Caveat` is safe to call in a second component —
`@remotion/google-fonts` caches per family and de-duplicates the injected
`@font-face`. Both components can be installed together with no double load.

## Registry entry

Standard. `registryDependencies: ["@remocn/stop-motion"]`,
`dependencies: ["remotion", "@remotion/google-fonts"]` — matching
`handwrite`'s entry, which is the only other item in the kit that loads a
font. Re-run `bun run registry:build` after adding it.

## Docs page

`content/docs/typography/hand-count.mdx`; add `"hand-count"` to
`content/docs/typography/meta.json`.

- title `Hand Count`
- description `A number that counts up in stop-motion poses, rewritten by hand at every pose`
- Usage: a pricing reveal (`prefix="$"`, `decimals={2}`, `suffix="/mo"`) and a
  year-in-review stat, with `handCountDuration` sizing the `<Sequence>`.
- Document the contrast with `rolling-number` / `number-wheel` in one line so
  the choice is obvious from the page.

## Customizer config + preview

Controls: `to` (number 0–10000), `from` (number 0–1000), `durationSteps`
(number 2–40), `decimals` (number 0–2), `prefix` (text), `suffix` (text),
`fontSize` (number 32–200), `color` (color), `ease` (select out | linear),
`seed` (text), `step` (number 1–6).

`ControlType`'s `select` carries `default: string` and `options: string[]`
(`lib/customizer-config.ts:22`), which does not narrow to the
`"out" | "linear"` union. Copy `handwrite`'s `align` control verbatim
(`registry/remocn/handwrite/config.ts`, a `"left" | "center"` prop exposed the
same way) — the precedent exists and works. This does not violate plan 014's
convention 8: that rule governs the component's public API, where
`<HandCount ease="out" />` infers correctly; the customizer harness is not a
consumer.

Self-centring → `registry/__index__.tsx` loads the component **directly**
(`import("@/registry/remocn/hand-count").then((m) => ({ default: m.HandCount }))`),
the same shape as `handwrite`. No example scene.

`durationInFrames` from the control maxima: `durationSteps` 40 × `step` 6 =
240, plus a beat on the final number → **270**.

## Skill reference

Row in **Text Animations** — that is the real heading in
`skills/remocn/references/components/index.md:10`, where `handwrite`,
`number-wheel` and `rolling-number` already live. There is no "Typography"
section in that file.

- Use for: a stat, price, or count in a hand-made scene — the number arrives
  by being written, not by rolling.
- Avoid for: a slick product-UI counter or a dashboard metric →
  `rolling-number` / `number-wheel`.
- Deps: `@remocn/stop-motion`.

## components.mdx

`## Typography` in `content/docs/components.mdx:29` has no flat grid — only
seven subsections. The card goes in **`### Dynamic Text`**
(`content/docs/components.mdx:155`): name `HandCount`, href
`/docs/typography/hand-count`.

Note there is no sibling to copy: `NumberWheel` and `RollingNumber` — the two
components this plan positions against — have no cards in `components.mdx` at
all. Adding cards for them is **not** in this plan's scope; if the owner wants
that gap closed it belongs in the wave-2 sweep (plan 029).

## Tests (`bun:test`)

- `handCountValue({ frame, from, to, delay, durationSteps, step, ease })`:
  equals `from` at and before `delay`; monotonic; constant for every frame
  inside one pose; `"out"` and `"linear"` differ in the middle and agree at
  both ends. For the landing, assert against `handCountDuration(...)` rather
  than against `delay + durationSteps * step` — and include an off-grid case
  (`delay: 1`, `durationSteps: 12`, `step: 3`) where those two differ, which
  is the regression this plan exists to prevent.
- `handCountDuration` returns the settle frame rounded up to the pose grid;
  equals `delay + durationSteps * step` exactly when `delay` is a multiple of
  `step`, and exceeds it otherwise.
- `handCountText(value, { decimals, prefix, suffix })`: decimal places,
  affixes, negative values, `decimals: 0` never emits a `.`.
- `handCountJitter({ frame, delay, durationSteps, step, seed, index })`:
  identical inside a pose, different across counting poses, and **identical at
  the completion frame and at completion + 30** (the freeze).

## Acceptance criteria (owner verifies)

1. The number visibly re-forms each pose while counting; it does not slide or
   roll.
2. It lands on `to` exactly and then holds perfectly still.
3. `prefix`/`suffix`/`decimals` render as one continuous handwritten string,
   with the affixes jittering along with the digits.
4. Installed alongside `handwrite`, the Caveat face loads once and both
   components render in the same hand.
5. Standard: tests green, typecheck, biome, registry drift clean.

## Out of scope

- Locale grouping separators (`1,000`) and currency formatting — `prefix` and
  `decimals` cover the video cases; a full `Intl` surface is not warranted.
- Counting down as a distinct mode (`from > to` already works).
- Per-digit odometer choreography — that is `number-wheel`'s job.
