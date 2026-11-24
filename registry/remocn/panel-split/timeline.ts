import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// One panel opening with its name and headline, the camera dollying in, the
// panel splitting into two, then four, the split reflowing and the payoff
// flooding the last panel. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The scene opens mid-motion: the first elements start
// before frame 0. The ids are public: a saved `timing` prop refers to them.

export type PanelSplitElementId =
  | "name"
  | `line:${number}`
  | "open"
  | "tile"
  | "push"
  | "dolly"
  | "split:1"
  | "panel:2"
  | "split:2"
  | "panel:3"
  | `card:${number}`
  | "reflow"
  | "payoff";

export interface PanelSplitTimingProps {
  headline?: string[];
}

export const DEFAULT_HEADLINE = [
  "Driven by motion,",
  "obsessed with",
  "the seamless.",
];

/** The name block types in first; each headline line `LINE_GAP` later. */
const NAME_AT = -12;
const LINE_GAP = 3;
const LINE_IN = 13;
const OPEN_AT = -10;
const TILE_AT = -4;
const DOLLY = 18;
const SPLIT1 = 30;
const SPLIT2 = 54;
const REFLOW = 72;
const PAYOFF = 96;
const END = 144;
/** Frames the heavy and card springs take to settle. */
const HEAVY = 21;
const CARD = 16;
const PANEL2_AT = 6;
const PANEL3_AT = 8;
const CARDS_AT = 10;
const CARD_GAP = 3;
const CARDS = 3;
/** The second half of the second split trails the first by this much. */
const SECOND = 3;
const FLOOD = 14;

// `name` and `line:<i>` (headline line `i`) are a chain. `push` is the slow
// push-in under the whole scene. `split:2` has its trailing half at
// `second`; the payoff punches to `peak` and back by `punch`, pops the play
// pill at `pill` (before it) and fans the cards from `fan`, 2 frames apart.
export const panelSplitTimeline = defineTimeline<
  PanelSplitElementId,
  PanelSplitTimingProps
>(({ headline = DEFAULT_HEADLINE }) => {
  const lineAt = (i: number) => NAME_AT + i * LINE_GAP;
  const elements: TimelineElement<PanelSplitElementId>[] = [
    {
      id: "name",
      lane: "Copy",
      label: "name",
      start: lineAt(0),
      length: LINE_IN,
    },
    ...headline.map(
      (line, i): TimelineElement<PanelSplitElementId> => ({
        id: `line:${i}`,
        lane: "Copy",
        label: line,
        start: lineAt(i + 1),
        length: LINE_IN,
        follows: i > 0 ? `line:${i - 1}` : "name",
      }),
    ),
    {
      id: "open",
      lane: "Camera",
      label: "open",
      start: OPEN_AT,
      length: HEAVY,
    },
    {
      id: "tile",
      lane: "Panel 1",
      label: "tile",
      start: TILE_AT,
      length: CARD,
    },
    {
      id: "push",
      lane: "Push",
      label: "push-in",
      start: 0,
      length: END,
    },
    {
      id: "dolly",
      lane: "Camera",
      label: "dolly",
      start: DOLLY,
      length: HEAVY,
    },
    {
      id: "split:1",
      lane: "Split",
      label: "split in two",
      start: SPLIT1,
      length: HEAVY,
    },
    {
      id: "panel:2",
      lane: "Panels",
      label: "panel 2",
      start: SPLIT1 + PANEL2_AT,
      length: CARD,
      follows: "split:1",
    },
    {
      id: "split:2",
      lane: "Split",
      label: "split in four",
      start: SPLIT2,
      length: HEAVY,
      follows: "split:1",
      beats: { second: SECOND },
    },
    {
      id: "panel:3",
      lane: "Panels",
      label: "panel 3",
      start: SPLIT2 + PANEL3_AT,
      length: CARD,
      follows: "split:2",
    },
    ...Array.from(
      { length: CARDS },
      (_, i): TimelineElement<PanelSplitElementId> => ({
        id: `card:${i}`,
        lane: "Cards",
        label: `card ${i + 1}`,
        start: SPLIT2 + CARDS_AT + i * CARD_GAP,
        length: CARD,
        follows: i > 0 ? `card:${i - 1}` : "split:2",
      }),
    ),
    {
      id: "reflow",
      lane: "Split",
      label: "reflow",
      start: REFLOW,
      length: HEAVY,
      follows: "split:2",
    },
    {
      id: "payoff",
      lane: "Payoff",
      label: "payoff",
      start: PAYOFF,
      length: FLOOD,
      follows: "reflow",
      beats: { peak: 3, punch: 12, pill: -2, fan: 2 },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
