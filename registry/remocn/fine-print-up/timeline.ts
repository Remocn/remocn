import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The fine print fading in, each line's words flying up from the fine print
// to the headline, and the closing line. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type FinePrintUpElementId = "intro" | `line:${number}` | "closing";

export interface FinePrintUpTimingProps {
  lines?: string[];
  travel?: number;
}

export const DEFAULT_LINES = [
  "Every component you install is a file you own.",
  "Use it in paid client work. It’s MIT.",
  "No account and no watermark. Ever.",
];
/** Frames each word takes to travel up, by default. */
export const TRAVEL = 26;

const INTRO = 12;
const START = 10;
const TAIL = 76;
const MIN_STEP = 50;
const CLOSE_GAP = 26;
const CLOSE_LEN = 16;

// The lines share what the clip leaves after the start and the tail, at
// least 50 frames each. A line's beats are offsets from its start: its mark
// is picked out from `pick` to `picked` and fades from `markOut` to
// `markGone`; its words lift off from `lift`, spread over `spread` frames,
// each flying for `travel`; it leaves over `exit` frames once the next line
// starts. The lines form a chain; the closing follows the last line.
export const finePrintUpTimeline = defineTimeline<
  FinePrintUpElementId,
  FinePrintUpTimingProps
>(({ lines = DEFAULT_LINES, travel = TRAVEL }, { length }) => {
  const n = lines.length;
  const per = Math.max(MIN_STEP, (length - START - TAIL) / n);
  const stepAt = (i: number) => START + i * per;
  const closeAt = stepAt(n - 1) + travel + CLOSE_GAP;
  const elements: TimelineElement<FinePrintUpElementId>[] = [
    {
      id: "intro",
      lane: "Fine print",
      label: "fade in",
      start: 0,
      length: INTRO,
    },
  ];
  lines.forEach((line, i) => {
    elements.push({
      id: `line:${i}`,
      lane: "Lines",
      label: line,
      start: stepAt(i),
      length: per,
      follows: i > 0 ? `line:${i - 1}` : undefined,
      beats: {
        pick: -2,
        picked: 6,
        markOut: 4,
        markGone: 14,
        lift: 6,
        spread: 12,
        travel,
        exit: 12,
      },
    });
  });
  elements.push({
    id: "closing",
    lane: "Fine print",
    label: "closing",
    start: closeAt,
    length: CLOSE_LEN,
    follows: n > 0 ? `line:${n - 1}` : undefined,
  });
  return elements;
});
