import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The lines rising in, then the glass capsule: it fades in, glides over the
// focus word, opens the line around it and magnifies, lights the word and
// settles with a small bounce. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type GlassCapsuleElementId =
  | `line:${number}`
  | "enter"
  | "glide"
  | "open"
  | "lit"
  | "settle";

export interface GlassCapsuleTimingProps {
  lines?: string[];
}

export const DEFAULT_LINES = ["Launch films", "that move."];

const LINE_STEP = 4;
const RISE = 20;

// `line:<i>` rises over its length, each after the one before. `enter`
// fades the capsule in; `glide` carries it over the word, while the rim
// light drifts until `rim`. `open` makes room in the line, the lens
// magnifying from `mag`. `lit` lights the word; its sheen runs on to the
// clip's end. `settle` bounces once, `period` frames per swing, decaying
// over `decay`.
export const glassCapsuleTimeline = defineTimeline<
  GlassCapsuleElementId,
  GlassCapsuleTimingProps
>(({ lines = DEFAULT_LINES }) => {
  const elements: TimelineElement<GlassCapsuleElementId>[] = [
    ...lines.map(
      (line, i): TimelineElement<GlassCapsuleElementId> => ({
        id: `line:${i}`,
        lane: "Lines",
        label: line,
        start: i * LINE_STEP,
        length: RISE,
        follows: i > 0 ? `line:${i - 1}` : undefined,
      }),
    ),
    { id: "enter", lane: "Capsule", label: "Enter", start: 8, length: 6 },
    {
      id: "glide",
      lane: "Capsule",
      label: "Glide",
      start: 10,
      length: 64,
      beats: { rim: 70 },
    },
    {
      id: "open",
      lane: "Lens",
      label: "Open",
      start: 50,
      length: 30,
      beats: { mag: 2 },
    },
    { id: "lit", lane: "Word", label: "Light", start: 72, length: 18 },
    {
      id: "settle",
      lane: "Capsule",
      label: "Settle",
      start: 74,
      length: 32,
      follows: "glide",
      beats: { period: 16, decay: 9 },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
