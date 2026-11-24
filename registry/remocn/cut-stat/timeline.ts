import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The bar filling the frame, the scale's ticks, the cut sweeping the bar
// back, the readout swapping its label, the edge flashing as the cut lands,
// the number released from under the bar, the claim rising word by word
// and the caption. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type CutStatElementId =
  | "intro"
  | "fill"
  | "ticks"
  | "cut"
  | "swap"
  | `word:${number}`
  | "flash"
  | "release"
  | "caption";

export interface CutStatTimingProps {
  label?: string;
  stagger?: number;
}

export const DEFAULT_LABEL = "less time to a finished cut";

export function claimWords(label: string) {
  return label.split(/\s+/).filter(Boolean);
}

// `cut` sweeps the bar back over its length; the number shows from
// `showFrom` to `showTo` around its start. `flash` peaks at `peak`. Each
// `word:<i>` rises over its length and follows the one before; the first
// word, the swap, the flash, the release and the caption follow the cut.
export const cutStatTimeline = defineTimeline<
  CutStatElementId,
  CutStatTimingProps
>(({ label = DEFAULT_LABEL, stagger = 3 }) => {
  const words = claimWords(label);
  const elements: TimelineElement<CutStatElementId>[] = [
    { id: "intro", lane: "Bar", label: "Fade in", start: 0, length: 6 },
    { id: "fill", lane: "Bar", label: "Fill", start: 0, length: 15 },
    { id: "ticks", lane: "Scale", label: "Ticks", start: 4, length: 16 },
    {
      id: "cut",
      lane: "Bar",
      label: "Cut",
      start: 19,
      length: 32,
      beats: { showFrom: -1, showTo: 1 },
    },
    {
      id: "swap",
      lane: "Readout",
      label: "Swap label",
      start: 44,
      length: 12,
      follows: "cut",
    },
    ...words.map(
      (word, i): TimelineElement<CutStatElementId> => ({
        id: `word:${i}`,
        lane: "Claim",
        label: word,
        start: 47 + i * stagger,
        length: 18,
        follows: i > 0 ? `word:${i - 1}` : "cut",
      }),
    ),
    {
      id: "flash",
      lane: "Bar",
      label: "Flash",
      start: 49,
      length: 14,
      follows: "cut",
      beats: { peak: 3 },
    },
    {
      id: "release",
      lane: "Number",
      label: "Release",
      start: 53,
      length: 16,
      follows: "cut",
    },
    {
      id: "caption",
      lane: "Caption",
      label: "Caption",
      start: 63 + words.length * 2,
      length: 18,
      follows: "cut",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
