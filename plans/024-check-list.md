# Plan 024: check-list — a handwritten list that ticks itself off

> Read plan 014's **Workflow** and **Series conventions** first. Standard
> per-component touch checklist applies unless a section below overrides it.

## Status

- **Effort**: M
- **Depends on**: 014, 015 (`Handwrite` writes every label)
- **Category**: feature
- **Section**: UI Blocks
- **Wave**: stop-motion wave 2 (024–029)

> **Amended during implementation (owner request).** The original spec below
> interleaved ticking with writing — each row ticked as soon as its own label
> finished. Shipped behaviour is **two phases**: the whole list writes itself
> out first, and only then are items ticked *and struck through*, one after
> another. The API, timing tables and duration figures in this file have been
> updated to match what shipped. Strike-through was previously listed under
> Out of scope; it is now part of the component.

## Goal

A checklist in the paper voice. First the list writes itself out — each row
draws its box, then has its label written into it. Once the whole list is
written, each done item is ticked and its label struck through, one at a time,
pose by pose.

This is the beat `feature-announcement` is built around, and the kit has no
way to show a list today. Ticking is the single most natural gesture in the
medium — it is what a pen does to paper.

## Source

No demo source. New component, composed from `handwrite` (015) and the
`stop-motion` clock (014). The box and tick strokes follow `ink-underline`'s
dash-draw technique (016).

## API (contract)

```ts
export type CheckListItem = {
  text: string;
  checked?: boolean;      // true — the item eventually gets ticked
};

export interface CheckListProps {
  items: (string | CheckListItem)[];
  width: number;
  fontSize?: number;      // 40
  color?: string;         // "#26242c"
  boxColor?: string;      // "#26242c"
  tickColor?: string;     // "#6f7f35"
  delay?: number;         // 0
  itemGap?: number;       // step * 6, frames between item starts
  closeGap?: number;      // step * 3, frames between one tick and the next
  rowGap?: number;        // fontSize * 0.55, px between rows
  strokeWidth?: number;   // 3
  perStep?: number;       // 1.6, forwarded to Handwrite
  weight?: 400 | 500 | 600 | 700; // 600
  seed?: string;          // "checklist"
  step?: number;          // 3
}

export function CheckList(props: CheckListProps): React.ReactElement;

export function checkListEnterEnd(
  items: (string | CheckListItem)[],
  options?: CheckListTiming,
): number;

export function checkListDuration(
  items: (string | CheckListItem)[],
  options?: CheckListTiming,
): number;

export function checkListStrikeWidth(
  text: string,
  fontSize: number,
  labelWidth: number,
): number;
```

`checkListEnterEnd` returns the **maximum `labelEnd`** across all items, not
the last item's — with rows overlapping, an early long label can outlast a
later short one. It is the frame the writing phase finishes on and the frame
the first tick lands on. An unchecked item counts here exactly like a checked
one: in the pinned preview scene below, the item that decides the answer is
the unchecked one.

`checkListDuration` returns the frame the last strike ends on. With nothing
checked there is no close phase and it equals `checkListEnterEnd`.

See the counterexample under Behavior.

A bare `string` is sugar for `{ text, checked: true }`. Normalization happens
in a pure helper so a consumer never writes `as`.

## Why `width` is required

`Handwrite` centres itself with `position: absolute; inset: 0` — the repo-wide
typography convention, and the exact trap plan 021 hit and documented. An
absolutely positioned `inset: 0` child inside an auto-sized flex cell collapses
to **zero width**, and the label silently vanishes.

Two ways out: give the label cell `flex: 1` and hope the consumer's container
has a width, or take the width explicitly. This plan takes it explicitly,
mirroring `ink-underline`'s required `width`. Every derived measurement — label
cell width, row width, box offset — comes from it, so the component is
self-contained wherever it is dropped.

Each label cell is therefore `position: relative`, with
`width = max(fontSize * 2, width - boxSize - boxGap)` — the clamp matters at
the corners of the control matrix, where a large `fontSize` against a small
`width` would otherwise drive the cell to zero or negative — and an explicit
`height = round(fontSize * 1.15)` (Handwrite's
line-height), and its `Handwrite` gets `align="left"`.

## Behavior

Derived geometry: `boxSize = round(fontSize * 0.62)`, `boxGap = round(fontSize
* 0.4)`, row height = `round(fontSize * 1.15)` — Handwrite's line-height, and
always taller than the box since `1.15 > 0.62`. Rows stack with `rowGap` px
between them, so total height is
`items.length * rowHeight + (items.length - 1) * rowGap`.

**Phase 1 — writing.** Per item `i`, offsets relative to
`start = delay + i * itemGap`:

| Beat | Window | How |
|------|--------|-----|
| box | `start` → `start + step * 2` | `steppedRamp` + `easeOutCubic`, dash-drawn as one closed wobbly-square path |
| label | from `start + step * 2` | `Handwrite` with `delay={start + step * 2}` |

`labelEnd = start + step * 2 + handwriteDuration(text, { perStep, step })`, and
`enterEnd = max(labelEnd)` over every item, checked or not.

The label waits for the box to finish rather than starting a pose earlier: a pen
closes the square before it writes inside it. Rows may still overlap each other
— `itemGap` is independent of how long any label takes — and that is intended,
it keeps a long list moving.

**Phase 2 — closing.** Nothing is ticked until `enterEnd`: the reader takes in
the whole list first. Checked items are then closed in list order; unchecked
items are skipped entirely and do not consume a turn. For the `k`-th checked
item (`k` counting from 0):

| Beat | Window | How |
|------|--------|-----|
| tick | `enterEnd + k * closeGap` → `+ step * 2` | one dash-drawn `M … L … L …` path inside the box |
| strike | `tickTo` → `tickTo + step * 2` | one dash-drawn cubic dragged through the label, in `tickColor` |

Consecutive items overlap when `closeGap < step * 4`, so the pen reads as
moving down the list rather than stopping between rows.

**Rows overlapping is why `checkListEnterEnd` must take a maximum.** With
defaults (`itemGap` 18, `perStep` 1.6, `step` 3, `closeGap` 9) and
`items = ["Zero configuration required for teams", "Ship faster"]`:

| item | start | labelAt | handwriteDuration | labelEnd | tickTo | strikeTo |
|------|-------|---------|-------------------|----------|--------|----------|
| 0 (37 ch) | 0 | 6 | 75 | **81** | 87 | 93 |
| 1 (11 ch) | 18 | 24 | 24 | 48 | 96 | **102** |

`handwriteDuration` for item 0 is `ceil(37 / 1.6) * 3 + 3 = 24 * 3 + 3 = 75`.
Item 1 finishes writing 33 frames before item 0 does, so `enterEnd` is 81 —
item 0's, not the last one's. Taking the last item's `labelEnd` would start the
whole close phase while the first label was still being written.

These numbers go straight into a test fixture, so they are exact, not
illustrative: `"Zero configuration required for teams"` is 37 characters.

All `delay`, `at` and `itemGap` values should be multiples of `step`. They are
not required to be, but `steppedRamp` compares the **quantized** frame
(`qf(frame, step) <= from`), so an off-grid start rounds to the next pose
boundary rather than landing on it.

- The box is a wobbly square: four corners each nudged by
  `hashRange(`${seed}:${i}:c${n}`, -1.5, 1.5)`, closed path, `pathLength={1}`.
- The tick is a **single** path `M … L … L …` (short down-right, then long
  up-right) so one dash-draw reads as one pen stroke, not two segments.
- `checked: false` → box and a clean label only: no tick path and no strike
  path at all, and no turn consumed in the close phase.
- The strike is a **single** cubic dragged through the label, seeded per item,
  overshooting both ends slightly like a real pen. Its reach is
  `checkListStrikeWidth` = `min(labelWidth, glyphs * fontSize * 0.36)` — the
  text is never measured, so the estimate keeps the component deterministic and
  SSR-safe; the clamp stops a long label from running the stroke past its cell.
- Rows are a normal-flow column; the component sets no background and no
  jitter. Ambient motion is `paper-wobble`'s job.

## Registry entry

Standard. `registryDependencies: ["@remocn/stop-motion", "@remocn/handwrite"]`
— the second transitive-resolution consumer after `polaroid`.

The `@/components/remocn/handwrite` tsconfig `paths` entry already exists
(added by plan 021); no tsconfig change is needed here.

## Docs page

`content/docs/ui-blocks/check-list.mdx`; add `"check-list"` to
`content/docs/ui-blocks/meta.json`.

- title `Check List`
- description `A handwritten checklist that writes itself out, then ticks and strikes through every done item`
- Usage: a feature-announcement beat — four items written over a paper page and
  then crossed off, with `checkListDuration` used to size the `<Sequence>`
  around it and `checkListEnterEnd` available for anything cued off the moment
  the list finishes writing.
- Show one item with `checked: false` so the "not yet" state is documented.

## Customizer config + preview

Controls: `fontSize` (number 24–64), `itemGap` (number 6–48), `closeGap`
(number 3–24), `perStep` (number 0.8–3), `strokeWidth` (number 1–8), `color`
(color), `tickColor` (color), `step` (number 1–6). The `itemGap` range must
reach its own default of `step * 6`, which is 36 at the top of the `step`
range — a 6–30 slider could not express it. Likewise `closeGap` must reach
`step * 3` = 18.

`items` and `width` are fixed by the scene, and pinned here so the duration
below is actually derivable:

```ts
const ITEMS = [
  "Render on your own machine",
  "No watermark, ever",
  "Every component MIT",
  "Ships as source",       // not checked
];
```

Longest label is 26 characters; the fourth item carries `checked: false`.

In-flow component → `registry/__index__.tsx` loads
`components/docs/examples/check-list-example.tsx` (the `CheckListExampleScene`
shape used by `ink-underline` / `paper-sticker`), NOT the component directly.
The docs preview centres nothing.

`durationInFrames` **from the control maxima, not the defaults** (the bug plan
016 shipped), over the pinned `ITEMS` at `itemGap` 48, `perStep` 0.8, `step` 6:

| item | chars | start | labelAt | labelEnd | tickTo | strikeTo |
|------|-------|-------|---------|----------|--------|----------|
| 0 | 26 | 0 | 12 | 216 | 288 | 300 |
| 1 | 18 | 48 | 60 | 204 | 306 | 318 |
| 2 | 19 | 96 | 108 | 258 | 324 | 336 |
| 3 | 15 | 144 | 156 | **276** | — | — (not checked) |

`enterEnd` is the **maximum** `labelEnd`, 276, and it is item 3 — the
`checked: false` one — that decides it, while item 0 still outlasts item 1 so
the overlap case is live too. The three checked items then close at
`276 + k * 18`, and the last strike ends at **336**.

336 is the worst case at the *default* `closeGap`. Duration is monotone ↑ in
`itemGap`, `closeGap` and `step`, and ↓ in `perStep`, so the true worst case
sits at (`itemGap` 48, `closeGap` 24, `perStep` 0.8, `step` 6) and is **348**.
A test enumerates the entire four-axis slider matrix against
`durationInFrames` rather than trusting that monotonicity argument. Set `360`
(12 frames of headroom).

## Skill reference

Row in **UI Blocks**:

- Use for: a list of features, steps, or done-items that should be read in full
  and then crossed off in a hand-made scene.
- Avoid for: a live progress indicator or a stepper with state →
  `progress-steps`. This list only ever moves forward.
- Deps: `@remocn/stop-motion`, `@remocn/handwrite`.

## components.mdx

Card in **UI Blocks → Paper & Scrapbook**: name `CheckList`, href
`/docs/ui-blocks/check-list`.

## Tests (`bun:test`)

Pure helpers, extracted so the component stays a renderer:

- `normalizeCheckListItems` — strings become `{ text, checked: true }`;
  objects pass through; `checked: false` preserved.
- `checkListSchedule(items, options)` → per item `{ boxFrom, boxTo, labelAt,
  labelEnd, tickFrom?, tickTo?, strikeFrom?, strikeTo? }`. Cover: starts are
  `itemGap` apart; every window is ordered
  `boxFrom < labelAt < labelEnd <= tickFrom < tickTo = strikeFrom < strikeTo`;
  **no tick starts before `enterEnd`**, so one long label delays the close
  phase for every item; checked items close in list order `closeGap` apart with
  unchecked ones skipped rather than consuming a turn; unchecked items get
  neither a tick nor a strike window.
- `checkListEnterEnd` — the maximum `labelEnd` over every item, checked or not.
- `checkListGeometry(width, fontSize)` — the label cell never drops below its
  `fontSize * 2` floor anywhere in the control matrix, and the clamp actually
  engages at the extreme corner (small `width`, large `fontSize`) rather than
  being dead code; `boxSize` tracks `fontSize` rather than `width`.
- `checkListDuration` — the frame the last strike ends on, and equal to
  `checkListEnterEnd` when nothing is checked. Prove: the two-item
  counterexample above (`enterEnd` 81 from item 0, total 102), and the pinned
  preview scene whose `enterEnd` is decided by its `checked: false` item — the
  test imports `ITEMS` from the example scene, so the assertion doubles as the
  preview's own duration check rather than testing a copy. Grows with `itemGap`
  and with `closeGap`. Unlike `handwriteDuration`, which is relative and takes
  no delay, this returns an absolute frame including `delay`.
- `checkListStrikeWidth` — grows with the glyph count, never exceeds
  `labelWidth`, and counts unicode glyphs rather than UTF-16 code units.
- The whole four-axis slider matrix stays within `durationInFrames`, with the
  slider values generated by index so float drift cannot silently drop the last
  value off each axis.

## Acceptance criteria (owner verifies)

1. Within every row the box is closed before the first character is written.
   Rows arrive `itemGap` apart and may overlap each other.
2. **No tick appears until every label has finished being written.** The close
   phase then runs top to bottom, tick before strike within each item.
3. Labels are legible at every `fontSize` in the customizer range, and the
   strike tracks the text rather than running the full width of the cell —
   the zero-width collapse never happens.
4. An item with `checked: false` keeps its box and a clean label forever: never
   ticked, never struck through, and it does not leave a gap in the close
   phase's rhythm.
5. `shadcn add @remocn/check-list` on a clean project pulls `handwrite` and
   `stop-motion` transitively.
6. Standard: tests green, typecheck, biome, registry drift clean.

## Out of scope

- Un-ticking, indeterminate states, nested or numbered lists.
- A standalone strike-through primitive — `check-list` strikes its own labels,
  but a free-standing `ink-cross-out` for arbitrary text is still backlog.
- Measuring rendered text. The strike's reach is estimated from the glyph
  count; a label in a much wider or narrower face will over- or undershoot.
- Auto-wrapping long labels across lines. One label, one line.
