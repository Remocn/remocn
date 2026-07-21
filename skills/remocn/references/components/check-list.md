# check-list

**Tier:** `remocn` (animation) · **Vibe:** paper · **Natural length:** 123f @ 30fps for a four-item list

A checklist in the paper voice, in two phases. First the list writes itself out — each row draws its box closed and has its label written inside, rows starting `itemGap` frames apart and free to overlap. Only once the whole list is written does the close phase start: each done item gets its tick, then a stroke dragged through its label, `closeGap` frames after the one before. The reader takes in the full list before anything is crossed off. The list only ever moves forward.

## Install

```bash
shadcn add @remocn/check-list
```

Lands at `components/remocn/check-list.tsx`. Pulls in `@remocn/handwrite`, which pulls in `@remocn/stop-motion`.

## Props

| Prop | Type | Default |
|---|---|---|
| `items` | `(string \| { text: string; checked?: boolean })[]` | required |
| `width` | `number` | required |
| `fontSize` | `number` | `40` |
| `color` | `string` | `"#26242c"` |
| `boxColor` | `string` | `"#26242c"` |
| `tickColor` | `string` | `"#6f7f35"` |
| `delay` | `number` | `0` |
| `itemGap` | `number` | `step * 6` |
| `closeGap` | `number` | `step * 3` |
| `rowGap` | `number` | `fontSize * 0.55` |
| `strokeWidth` | `number` | `3` |
| `perStep` | `number` | `1.6` |
| `weight` | `400 \| 500 \| 600 \| 700` | `600` |
| `seed` | `string` | `"checklist"` |
| `step` | `number` | `3` |

A bare string is shorthand for an item that gets ticked; `{ checked: false }` keeps the box and a clean label forever — no tick and no stroke through it — and is skipped when the close phase counts out its turns.

`tickColor` colours both the tick and the stroke through the label. The stroke's length is estimated from the glyph count, so it tracks the text without measuring it.

`width` is required because the labels are written by `handwrite`, which centres itself absolutely and would collapse to zero width in an auto-sized cell.

`checkListDuration(items, options)` returns the frame the last stroke ends on, as an absolute frame including `delay`. Use it to size the `<Sequence>`. `checkListEnterEnd(items, options)` returns the frame the writing phase finishes on — the moment the first tick lands — for firing something else off the same beat. With nothing checked the two are equal.

## Example

```tsx
const items = [
  "Render on your own machine",
  "No watermark, ever",
  "Every component MIT",
  { text: "Ships as source", checked: false },
];

<Sequence durationInFrames={checkListDuration(items)}>
  <CheckList items={items} width={820} />
</Sequence>;
```

## Use when

- A list of features, steps, or done-items should be read in full and then crossed off in a hand-made scene.
- A feature-announcement beat needs the ticking and crossing-off gesture as its payoff.
- One line in the list has not landed yet — mark it `checked: false` and it stays clean.

## Don't use when

- You need a live progress indicator or a stepper with state — use `progress-steps`.
- Labels need to wrap across lines, or the list needs numbering or nesting. One label, one line.
- The list should sit at an angle or wobble — this component has no jitter and no positioning. Wrap it in `paper-wobble`.
