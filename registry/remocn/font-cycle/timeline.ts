import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The word fading in over its guides, each face of the cycle in turn (slow at
// the start, quick in the middle, slowing again before the end), and the
// landing on the final face. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type FontCycleElementId = "enter" | `face:${number}` | "land";

export interface FontCycleTimingProps {
  fonts?: { label: string }[];
  passes?: number;
  beat?: number;
}

/** Labels of the default faces, in cycle order (`DEFAULT_FONTS`). */
const DEFAULT_LABELS = [
  "Instrument Serif",
  "JetBrains Mono",
  "Playfair Display Italic",
  "Oswald",
  "Fredoka",
  "Bricolage Grotesque",
  "Syne",
];

export const FACE_BEAT = 3;
export const PASSES = 2;

const ENTER = 10;
const GUIDES_IN = 16;
const SETTLE = 16;
const GUIDES_OUT_AT = 4;
const GUIDES_OUT_END = 26;
const SHEEN = 60;

/** End frame of each slot of the cycle. */
function slotEnds(count: number, beat: number) {
  const ends: number[] = [];
  let at = 0;
  for (let k = 0; k < count; k++) {
    const intro = 9 * Math.max(0, 1 - k / 2.4) ** 2;
    const tail = 9 * Math.max(0, (k - (count - 6)) / 5) ** 1.7;
    at += Math.round(beat + intro + tail);
    ends.push(at);
  }
  return ends;
}

// `enter` fades the word in; its `guides` beat draws the guides. `face:<k>` is
// slot `k` of the cycle (passes × faces), each showing until the next starts:
// a chain. `land` follows the last slot: the final face settles over `settle`,
// the guides fade from `guidesOut` to `guidesEnd`, and the sheen drifts over
// the whole element.
export const fontCycleTimeline = defineTimeline<
  FontCycleElementId,
  FontCycleTimingProps
>(({ fonts, passes = PASSES, beat = FACE_BEAT }) => {
  const labels = fonts ? fonts.map((f) => f.label) : DEFAULT_LABELS;
  const sequence: number[] = [];
  for (let p = 0; p < passes; p++) {
    for (let i = 0; i < labels.length; i++) sequence.push(i);
  }
  const ends = slotEnds(sequence.length, beat);
  const landAt = ends[ends.length - 1] ?? 0;
  const elements: TimelineElement<FontCycleElementId>[] = [
    {
      id: "enter",
      lane: "Word",
      label: "enter",
      start: 0,
      length: ENTER,
      beats: { guides: GUIDES_IN },
    },
  ];
  sequence.forEach((face, k) => {
    const start = k > 0 ? ends[k - 1] : 0;
    elements.push({
      id: `face:${k}`,
      lane: "Faces",
      label: labels[face],
      start,
      length: ends[k] - start,
      follows: k > 0 ? `face:${k - 1}` : undefined,
    });
  });
  elements.push({
    id: "land",
    lane: "Faces",
    label: "final face",
    start: landAt,
    length: SHEEN,
    follows: sequence.length > 0 ? `face:${sequence.length - 1}` : undefined,
    beats: {
      settle: SETTLE,
      guidesOut: GUIDES_OUT_AT,
      guidesEnd: GUIDES_OUT_END,
    },
  });
  return elements;
});
