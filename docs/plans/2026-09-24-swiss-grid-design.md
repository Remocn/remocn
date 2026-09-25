# Swiss Grid

> **Revision, 2026-09-25.** The first version was an abstract Swiss poster.
> It had a spine, a beam, a block, a red square and bars that imitated typeset
> lines. After a hold the bars retracted and left an empty slot for a title the
> component never drew. The user rejected it: "there is no meaning in it".
> Without typography, Swiss style is only bars; its whole point is a grid that
> organizes a message. This revision replaces the poster with a title card that
> typesets the user's own text. New rule: every graphic element exists for the
> text. The grid math, the one-frame hard-stop snap curve and the palette carry
> over from the first version. The poster structures, seeds, retracting fake
> lines and `getSwissGridField` are gone.

## Direction

A title card in the International Typographic Style. It sets the user's
message on a strict modular grid, and each graphic element does a job for the
text:

- The **spine** is a one-module vertical bar on the left. It anchors the text
  column and runs from the top of the card to the meta baseline.
- The **heavy rule** sits above the headline and is exactly as wide as the
  headline.
- The **thin rule** sits under the headline and is exactly as wide as the
  headline's last line. The meta line hangs from it. When the numeral drops
  below the headline, the thin rule runs under the numeral and spans the
  column instead. A last-line rule there would sit several rows away from its
  line, under the numeral, and read as an arbitrary bar.
- The **red square** marks the top-right corner of the card.
- The **big numeral** sits on the right as the headline's counterweight.
- The **meta line** sits at the bottom, flush left and flush right.

Approved final frame (16:9):

```
| spine |                                  [red square]
| spine | Launch week
| spine | Day 02
| spine |=========================  (heavy rule = headline width)
| spine | Pricing that                      02
| spine | scales with you
| spine |==============  (thin rule)
| spine | remocn.dev                 Sep 2026
```

Uses: chapter and section titles, launch-week day cards, changelog headers,
episode and event cards.

## Content

| Prop | Default | Notes |
| --- | --- | --- |
| `title` | `"Pricing that scales with you"` | Required. Up to three balanced lines, or explicit breaks with `\n` |
| `kicker` | `"Launch week\nDay 02"` | One or two lines split on `\n`; extra lines join the second |
| `number` | `"02"` | Big numeral; empty hides it |
| `metaStart` | `"remocn.dev"` | Flush left on the meta baseline |
| `metaEnd` | `"Sep 2026"` | Flush right on the right edge |

Every prop except `title` is optional. An empty kicker, numeral or meta line is
dropped, and the card closes up around what is left. There are no empty slots.

## Look

- Ink `#171717`, Swiss red `#da291c` and paper `#f1eee7`. Ink and accent are
  color props. Paper appears only in `previewBackdrop` and in the docs
  `Backdrop`, exported as `swissGridPaper`. The component itself is transparent
  and paints no full-frame fill.
- Red is used once, for the square.
- Font stack `'Helvetica Neue', Helvetica, Arial, sans-serif`, overridable with
  `fontFamily` so users can pass the family of a font they have loaded.
- Headline: bold (700), sentence case, flush left and ragged right, font size
  `0.95 × pitch` (about 104% leading), tracking `-0.02em`.
- Numeral: bold (700), tracking `-0.04em`.
- Kicker and meta: regular (400), `0.8` of a module on a one-module pitch, with
  normal tracking.
- No all-caps, no wide tracking, no glows, blur, gradients or shadows.
- Weights on the grid: spine is 1 module wide, the heavy rule is
  `round(unit / 2)` thick, the thin rule `max(1, round(unit / 15))`, and the
  guides are `max(1, round(unit / 20))` hairlines at 20% ink. That is 2 px at
  720p. The docs player shows the 1280×720 composition at about half scale,
  and a 1 px guide at 16% would shrink to half a device pixel there and all
  but vanish.

## Grid

- `unit = min(width, height) / modules`, with `modules` 16–36 and a default
  of 24. `columns = floor(width / unit)`, `rows = floor(height / unit)`, and
  the sub-module remainder is split into equal margins. Grid line `i` is at
  `round(offset + i × unit)`, so every edge is an integer pixel.
- Horizontal: margin `M = max(2, round(columns × 0.07))`. The spine is columns
  `[M, M + 1]`, the text column starts at `C = M + 2`, and the right edge is
  `R = columns − M`. The square, the numeral and the end of the meta line all
  align on `R`.
- Vertical, in rows relative to the top `T` of the card:
  - Square: rows `[0, 2]`. The spine starts at row 0 too.
  - Heavy rule: row `h = 2 + K + 1`, where K is the number of kicker lines.
  - Kicker baselines: rows `h − K … h − 1`.
  - Headline baselines: rows `h + i × P` for `i = 1 … n`, with pitch `P`.
  - Numeral beside: its baseline is the last headline baseline. When the
    headline has a single line, `h` moves down so the numeral clears the
    square.
  - Numeral below: its baseline is `ceil(figure + headline descent + 0.5)`
    rows under the last headline baseline.
  - Thin rule: one row under the last baseline, whether that is the headline
    or the numeral below it. Under the headline it is the last line's width;
    under a numeral below the headline it spans the column, `C` to `R`.
  - Meta baseline: one row under the thin rule. The spine ends here.
  - `T = floor((rows − height) / 2)` centers the card, a hair above the middle.
- Fitting. The candidates are tried in order: pitch 3, then 2; numeral
  beside, then below; 1, 2, then 3 lines. The first candidate that fits both
  ways wins. Horizontally, the longest line times 1.05 must fit the measure:
  `(R − C) × unit`, minus the numeral width and two modules when the numeral
  is beside. Vertically, the card must fit `rows − 2 × max(1, round(rows ×
  0.08))`. If nothing fits, the candidate with the least overflow wins.
- Widths are estimated from a Helvetica Bold advance table, which also fits
  Arial Bold exactly. The estimates only choose the size and the line breaks.
  Rule lengths never use them.
- Line breaks are balanced. The partition into n lines minimizes the longest
  line, then the sum of squared widths. The default title breaks as "Pricing
  that / scales with you".
- Results for the default card: 16:9 uses pitch 3 with two lines and the
  numeral beside. 1:1 uses pitch 2 with three lines beside. 9:16 uses pitch 3
  with three lines, the numeral below the headline and a column-wide thin
  rule.

Default card at 1280×720: 30 px modules on a 42 × 24 grid, offset x 10.

| Part | Geometry |
| --- | --- |
| Spine | x 100–130, y 150–540 |
| Square | x 1120–1180, y 150–210 |
| Kicker | 24 px, baselines 240 and 270, x 160 |
| Heavy rule | top 300, 15 px thick, from x 160 |
| Headline | 85.5 px, baselines 390 and 480, x 160 |
| Numeral | 210.5 px, baseline 480, right edge 1180 |
| Thin rule | top 510, 2 px thick, from x 160 |
| Meta | 24 px, baseline 540, x 160 and right edge 1180 |
| Guides | columns at x 100, 160 and 1180; baselines every 30 px from y 150 to 540 |

## How the rules get their length from the text

No rule has a hard-coded length. The DOM carries it, from the text or, for
the column rule, from the grid column that the meta line spans:

```
headline block   position:absolute; left:C; width:max-content
├─ heavy rule    position:absolute; left:0; width:100%; scaleX(e) from the left
├─ line 1        width:max-content; height:pitch
│  └─ band       flex, baseline-aligned, nowrap, clip-path
└─ line n        width:max-content; height:pitch
   ├─ band
   └─ thin rule  position:absolute; left:0; width:100%; scaleX(e) from the left

column block     position:absolute; left:C; width:R − C   (numeral below only)
└─ thin rule     position:absolute; left:0; width:100%; scaleX(e) from the left
```

- Each line is `white-space: nowrap`, and its wrapper is `width: max-content`.
  A wrapper is therefore exactly as wide as its rendered text.
- The headline block is also `width: max-content`, so it is as wide as its
  widest line. The heavy rule is its absolute child at `width: 100%`, which
  makes it exactly the headline's width.
- The thin rule is an absolute child of the last line's wrapper at
  `width: 100%`, which makes it exactly the last line's width. When the
  numeral sits below the headline, the thin rule belongs to the meta line
  instead. It is a `width: 100%` child of a column block, which runs from the
  text column `C` to the right edge `R` exactly as the meta line does.
  `layout.thinRule.span` is `"line"` or `"column"`, and `layout.measure` is
  the column width in pixels.
- Words that have not landed yet are `visibility: hidden` and translated.
  Neither changes layout, so both rules know their final length before the
  first word moves.
- Growth is `transform: scaleX(amount)` with `transform-origin: left center`.
  The left end is pinned, and at `amount = 1` the rule is its natural width.

Any title, any font and any late-loading webfont keep the rules exact without
measuring the DOM.

## How type lands on grid baselines

Each text line lives in a band, a flex row with `align-items: baseline`, whose
box spans `[baseline − rise + d, baseline + d]`:

- `rise` is the line's pitch in whole modules: 1 for kicker and meta, `P` for
  headline lines, and `ceil(size / unit)` for the numeral. `d = 0.25 × size`
  is the descent zone.
- The first flex item is an empty anchor, `width: 0` and `height: rise − d`.
  An empty flex item's baseline is synthesized at its bottom edge.
- The text item has `line-height: 0`, so its own baseline offset is only about
  0.35em, which is always smaller than the anchor's. Baseline alignment then
  places the text baseline exactly at `band top + rise − d`, the grid row,
  whatever the font's metrics.
- The band has `clip-path: inset(-rise, -size, 0, -size)`. Only the bottom edge
  clips, at `baseline + d`, and it acts as the line box's floor.
- Setting in, the text starts `rise` px lower, fully under the floor and
  hidden, then rises onto its baseline. Headline words move one by one as
  inline-blocks inside the line. Kicker lines, meta items and the numeral move
  whole. Nothing fades and nothing types in.
- Headline wrappers stack in normal flow. Each wrapper is exactly one pitch of
  rounded grid pixels tall, so the flow and the grid agree line by line.

## Signature motion: the Swiss snap

Every part has an `enter` span and, except the guides, an `exit` span. Its
amount is:

```
amount = SNAP((t − enter.start) / T)        while entering, clamped 0–1
amount = 1 − SNAP((t − exit.start) / T)     while exiting
SNAP   = Easing.in(Easing.quad)             constant acceleration
```

- Rules and bars: the length is `rest × amount`, and the pinned edge never
  moves. The spine and square are pinned at the top and the rules at the left.
  Column guides are pinned at the top edge of the frame, baseline guides at
  the left edge.
- Type: `translateY(rise × (1 − amount))` inside the clipped band, with
  `visibility: hidden` while `amount = 0`.
- Each frame covers more distance than the one before. The part arrives at
  full speed and stops dead on the next frame. There is no overshoot and no
  settle. With 7 frames, the last one covers 27% of the travel.
- Duration: rules and bars use `T = clamp(round(9 × √(travel / short side)),
  4, 12)`, like one motor driving everything. The heavy and thin rules use
  their estimated text width as the travel. Column guides take 9 frames,
  baseline guides 12, kicker and meta 6, headline words 7 and the numeral 8.
- Landings are scheduled and starts are computed back from them. The first
  landing is at the end of the first duration. Siblings in a type group land 3
  frames apart and everything else 4. Every step is inside the 3–6 frame rule.
  Durations never move landings, so the length depends only on the content.
- Guides: after the last headline word lands, they fade over 12 frames with
  `Easing.inOut(Easing.quad)`, capped at the build's end. They are gone before
  the hold.

## Timeline at 30 fps

The build, with the default content, at 1280×720 or any other size:

| Frames | Part | Motion |
| --- | --- | --- |
| 0–9 | Column guides | Three hairlines drop from the top edge at x 100, 160, 1180 |
| 1–13 | Baseline guides | Fourteen hairlines draw in from the left edge, y 150–540 |
| 10–17 | Spine | Drops from its pinned top edge to the meta baseline |
| 15–21 | Kicker line 1 | "Launch week" rises one module onto its baseline |
| 18–24 | Kicker line 2 | "Day 02" rises one module |
| 20–28 | Heavy rule | Grows from the left to the headline's width |
| 25–32 | Word 1 | "Pricing" rises one pitch |
| 28–35 | Word 2 | "that" |
| 31–38 | Word 3 | "scales" |
| 34–41 | Word 4 | "with" |
| 37–44 | Word 5 | "you" |
| 40–48 | Numeral | "02" rises eight modules onto the last headline baseline |
| 44–56 | Guides | Fade out |
| 48–52 | Square | Drops two modules from its pinned top edge |
| 48–56 | Thin rule | Grows from the left to the last line's width |
| 54–60 | Meta start | "remocn.dev" rises one module |
| 57–63 | Meta end | "Sep 2026" rises one module; the card is complete |
| 63–99 | Hold | 36 frames of held card |

- `swissGridLength = 63`, and the docs frontmatter `length` is 63.
- Each extra headline word adds 3 frames. An empty kicker saves 7 frames, an
  empty meta line 7, and an empty numeral 4.

The exit runs when `exit` is on. It covers the last `exitLength` frames of the
component's sequence and ends on the final frame. It never starts before the
build ends. The order is the reverse of the build, the beats are the same, the
guides stay gone, and each part retracts into its pinned edge or sinks below
its baseline. Frames in the preview, where the exit starts at 99:

| Frames | Part |
| --- | --- |
| 99–105 | Meta end sinks |
| 102–108 | Meta start sinks |
| 104–112 | Thin rule retracts to the left |
| 112–116 | Square retracts to its top edge |
| 112–120 | Numeral sinks |
| 117–136 | Words sink in reverse, "you" first, 3 frames apart |
| 132–140 | Heavy rule retracts to the left |
| 138–147 | Kicker lines sink, "Day 02" first |
| 144–151 | Spine retracts to its top edge; frame 151 is empty |

`exitLength = 52` for the default content.

## Duration and preview

- `getSwissGridDuration({ ...content, modules, width, height, exit, speed })`
  returns `ceil((length + 36 + (exit ? exitLength : 0)) / speed) + 1`. That is
  100 frames by default and 152 with `exit`. Speed 0 returns 1.
- The component places the exit with `useVideoConfig().durationInFrames`,
  which is the enclosing `Sequence`'s duration. The exit therefore always ends
  on the sequence's last frame. A `Sequence` without `durationInFrames` runs
  to the end of the composition, because Remotion caps it at the composition's
  remaining frames. There the exit ends on the composition's last frame. The
  exit is skipped only when the duration is not finite. If the sequence is
  shorter than the build plus the exit, the exit still waits for the build to
  land and is cut off at the end of the sequence.
- Time is `frame × 30 / fps × speed`. Everything comes from
  `useCurrentFrame()` and `useVideoConfig()`: no randomness, no dates, no CSS
  animation and no state carried between frames. Any frame renders correctly
  when seeked directly.

## API

`registry/remocn/swiss-grid/index.tsx` imports only `react` and `remotion`.

- `SwissGrid`: the component.
- `swissGridDefaults`, `swissGridPaper`, `swissGridLength` (63) and
  `swissGridHold` (36).
- `getSwissGridLayout(options)`: the grid, the chosen pitch and placement, and
  every part's cells, pixels, bands and rows.
- `getSwissGridTimeline(layout)`: the cues in reading order with their enter
  and exit spans, plus `length`, `exitLength` and the guide `fade`.
- `getSwissGridState(time, { ...options, exitEnd })`: the layout, the timeline,
  per-cue amounts, the guide opacity, and the current spine and square
  rectangles.
- `getSwissGridDuration(options)`: the preview length.
- `renderSwissGrid(state, look)`: the pure element tree the component returns.
  Tests inspect its structure.
- `breakSwissGridTitle(title, lines)` and `measureSwissGridText(text,
  tracking)`: the line breaker and the width estimate.

## Tests

`__tests__/swiss-grid.test.ts` covers:

- Timeline boundaries and reading order, 3–6 frame gaps, the quoted default
  spans, guides drawn before the first landing and faded before the hold, and
  durations for content, exit and speed.
- The one-frame hard stop and the absence of overshoot on every enter and exit.
- The pinned top edge of the spine and square on every frame.
- Rules sized by their text, checked as structure. The heavy rule is a
  `width: 100%` child of the `max-content` headline block. The thin rule is a
  `width: 100%` child of the `max-content` last line, or of the column block
  in portrait, where the numeral drops below. Both scale from the left.
- Type that moves only by translation: every word is whole on every frame, and
  nothing has an opacity or a filter.
- Every baseline and rule on an integer grid row, rises in whole modules, and
  headline lines one pitch apart in flow.
- Grid-line alignment of the column and edge, the landscape and portrait
  placement, and title breaking.
- Determinism across sampling order and fractional times, and invalid input.
- Config defaults matching the component defaults, and the paper backdrop.

## Files

- `registry/remocn/swiss-grid/index.tsx`, `config.ts` and
  `__tests__/swiss-grid.test.ts`.
- `content/docs/motion-graphics/swiss-grid.mdx`.
- For the lead: the `registry/remocn/registry.json` description, the
  Motion Graphics index card and the bauhaus-build page's `avoidWhen` still
  describe the abstract version.
