import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The opening line revealing row by row, the slow push, the photo tiles
// flying onto the ring one by one, the line leaving as the ring collapses
// into a row of dots, the dots growing into bars, the caption revealing
// under them and the bars pulsing once. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The line starts a few frames before the scene.
// The ids are public: a saved `timing` prop refers to them.

export type CoverRingElementId =
  | `row:${number}`
  | "push"
  | `tile:${number}`
  | "lineOut"
  | "collapse"
  | "bars"
  | "caption"
  | "pulse";

export interface CoverRingTimingProps {
  images?: string[];
  line?: string;
  caption?: string;
  stagger?: number;
}

export const DEFAULT_LINE = "Launch videos aren't edited anymore";
export const DEFAULT_CAPTION = "They're composed.";
export const WORD_STAGGER = 2;
/** How many photos the default ring shows. */
const DEFAULT_IMAGE_COUNT = 10;

const LINE_IN = -6;
const TILES_IN = 0;
const LINE_OUT = 78;
const LINE_OUT_LEN = 8;
const COLLAPSE = 78;
const COLLAPSE_LEN = 18;
const BARS = 96;
const LIFT = 14;
const CAPTION = 100;
const CAPTION_STAGGER = 3;
const PULSE = 114;
const PULSE_PEAK = 5;
const PULSE_LEN = 18;
const END = 150;
const RISE = 12;
/** A tile's landing spring, roughly settled. */
const LAND = 20;

/** Tiles on the ring: one per photo, from 6 to 12. */
export const tileCount = (images: number) => Math.max(6, Math.min(12, images));

/** The ring's tiles enter quicker and quicker. */
function enterTime(i: number) {
  let t = TILES_IN;
  let step = 5;
  for (let k = 0; k < i; k++) {
    t += step;
    step = Math.max(1.6, step * 0.8);
  }
  return Math.round(t);
}

/** The line split into one or two rows of about the same length. */
export function balance(text: string) {
  const words = text.split(" ");
  if (text.length < 22 || words.length < 3) return [text];
  let best = 1;
  let bestCost = Number.POSITIVE_INFINITY;
  for (let k = 1; k < words.length; k++) {
    const a = words.slice(0, k).join(" ").length;
    const b = words.slice(k).join(" ").length;
    const cost = Math.max(a, b);
    if (cost < bestCost) {
      bestCost = cost;
      best = k;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

// `row:<r>` is a row of the opening line, its words `stagger` apart, each
// rising over `rise`; the rows form a chain. `tile:<i>` is photo `i` landing
// on the ring; the tiles form a chain. `push` is the camera's push over the
// scene. `lineOut` and `collapse` follow the last row and the last tile;
// `bars` (the dots growing, the copy lifting over its length) follows the
// collapse, and the caption and the pulse follow the bars.
export const coverRingTimeline = defineTimeline<
  CoverRingElementId,
  CoverRingTimingProps
>(
  ({
    images,
    line = DEFAULT_LINE,
    caption = DEFAULT_CAPTION,
    stagger = WORD_STAGGER,
  }) => {
    const n = tileCount(
      images && images.length > 0 ? images.length : DEFAULT_IMAGE_COUNT,
    );
    const rows = balance(line);
    const elements: TimelineElement<CoverRingElementId>[] = [];
    rows.forEach((row, r) => {
      const words = row.split(" ").length;
      elements.push({
        id: `row:${r}`,
        lane: "Line",
        label: row,
        start: LINE_IN + r * stagger * words,
        length: (words - 1) * stagger + RISE,
        follows: r > 0 ? `row:${r - 1}` : undefined,
        beats: { stagger, rise: RISE },
      });
    });
    elements.push({
      id: "push",
      lane: "Camera",
      label: "push",
      start: 0,
      length: END,
    });
    for (let i = 0; i < n; i++) {
      elements.push({
        id: `tile:${i}`,
        lane: "Tiles",
        label: `photo ${i + 1}`,
        start: enterTime(i),
        length: LAND,
        follows: i > 0 ? `tile:${i - 1}` : undefined,
      });
    }
    const captionWords = caption.split(" ").length;
    elements.push(
      {
        id: "lineOut",
        lane: "Line",
        label: "line out",
        start: LINE_OUT,
        length: LINE_OUT_LEN,
        follows: `row:${rows.length - 1}`,
      },
      {
        id: "collapse",
        lane: "Tiles",
        label: "collapse",
        start: COLLAPSE,
        length: COLLAPSE_LEN,
        follows: `tile:${n - 1}`,
      },
      {
        id: "bars",
        lane: "Tiles",
        label: "bars",
        start: BARS,
        length: LIFT,
        follows: "collapse",
      },
      {
        id: "caption",
        lane: "Caption",
        label: caption,
        start: CAPTION,
        length: (captionWords - 1) * CAPTION_STAGGER + RISE,
        follows: "bars",
        beats: { stagger: CAPTION_STAGGER, rise: RISE },
      },
      {
        id: "pulse",
        lane: "Tiles",
        label: "pulse",
        start: PULSE,
        length: PULSE_LEN,
        follows: "bars",
        beats: { peak: PULSE_PEAK },
      },
    );
    return elements.sort((a, b) => a.start - b.start);
  },
);
