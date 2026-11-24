import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The heading building word by word while the player card swings up and
// settles, the hero copy and the checklist revealing, the highlight stepping
// down the checklist, and the ranked rows sliding in beside the card, all
// under a slow camera push. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type TiltSettleListElementId =
  | `word:${number}`
  | "card"
  | "camera"
  | "hero"
  | "lines"
  | `line:${number}`
  | `row:${number}`;

export interface TiltSettleListTimingProps {
  title?: string;
  lines?: readonly string[];
  rows?: readonly { title: string }[];
  stagger?: number;
  step?: number;
}

export const DEFAULT_TITLE = "Your top scenes";
export const DEFAULT_LINES = [
  "Open on the product",
  "Type the headline",
  "Zoom blur to the demo",
  "Show the editor",
  "Cut to pricing",
  "Fan the formats",
  "Land the logo",
  "Fade to the URL",
];
export const DEFAULT_ROWS = [
  {
    title: "Text Reveal",
    meta: "1.2k renders",
    src: "templates/brand-guidelines/ceramics.jpg",
  },
  {
    title: "Logo Orbit",
    meta: "980 renders",
    src: "templates/launch-anything/earth.jpg",
  },
  { title: "Card Fan", meta: "740 renders", src: "reel/reel-2.jpg" },
];

const TITLE = -6;
const CARD = -2;
const LINES = 10;
const ROWS = 30;
const STEP_AT = 24;
const END = 126;
const STEP = 14;
const ROW_TIMES = [0, 6, 11];

// `word:<i>` rises title word i in over its length; the words form a chain.
// `card` swings the player card up on a spring from its start. `camera`
// pushes in and runs the scrubber over its length. `hero` reveals the hero
// title, its meta `meta` later. `lines` reveals the checklist, each line
// `stagger` after the one before. `line:<i>` highlights checklist line i,
// fading in over `fade`, and hands over to the next at its end, where the
// list scrolls on; a chain. `row:<i>` slides ranked row i in on a spring,
// popping its thumb at `thumb` and play button at `play`, revealing its
// title at `title` and meta at `meta`, and drawing its divider from
// `divider` to `dividerEnd`.
export const tiltSettleListTimeline = defineTimeline<
  TiltSettleListElementId,
  TiltSettleListTimingProps
>(
  ({
    title = DEFAULT_TITLE,
    lines = DEFAULT_LINES,
    rows,
    stagger = 3,
    step = STEP,
  }) => {
    const elements: TimelineElement<TiltSettleListElementId>[] = [];
    title.split(" ").forEach((word, i) => {
      elements.push({
        id: `word:${i}`,
        lane: "Title",
        label: word,
        start: TITLE + i * stagger,
        length: 12,
        follows: i > 0 ? `word:${i - 1}` : undefined,
      });
    });
    elements.push(
      { id: "card", lane: "Card", label: "Card", start: CARD, length: 32 },
      { id: "camera", lane: "Camera", label: "Push", start: 0, length: END },
      {
        id: "hero",
        lane: "Card",
        label: "Hero",
        start: LINES - 2,
        length: 14,
        beats: { meta: 2 },
      },
      {
        id: "lines",
        lane: "Card",
        label: "Checklist",
        start: LINES,
        length: 12 + Math.max(0, lines.length - 1) * 2,
        beats: { stagger: 2 },
      },
    );
    lines.forEach((line, i) => {
      elements.push({
        id: `line:${i}`,
        lane: "Highlight",
        label: line,
        start: STEP_AT + (i - 1) * step,
        length: step,
        follows: i > 0 ? `line:${i - 1}` : undefined,
        beats: { fade: 6 },
      });
    });
    (rows ?? DEFAULT_ROWS).slice(0, 4).forEach((row, i) => {
      elements.push({
        id: `row:${i}`,
        lane: "Rows",
        label: row.title,
        start: ROWS + (ROW_TIMES[i] ?? i * 5),
        length: 18,
        follows: i > 0 ? `row:${i - 1}` : undefined,
        beats: {
          thumb: 2,
          play: 6,
          title: 3,
          meta: 5,
          divider: 4,
          dividerEnd: 18,
        },
      });
    });
    return elements
      .map((e, k) => ({ e, k }))
      .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
      .map(({ e }) => e);
  },
);
