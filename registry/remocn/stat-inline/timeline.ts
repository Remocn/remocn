import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The number alone, then in its sentence: the ground fading up and
// drifting, each character of the number rising in, the label under it, the
// number flying into its slot in the sentence (the label dropping away), and
// the sentence's words rising in around it. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type StatInlineElementId =
  | "ground"
  | "drift"
  | `glyph:${number}`
  | "label"
  | "move"
  | "words";

export interface StatInlineTimingProps {
  value?: string;
  hold?: number;
  moveDuration?: number;
}

export const DEFAULT_VALUE = "12,480";

// `glyph:<i>` rises over its length; the characters form a chain. `move`
// flies the number into the sentence over its length; the label drops away
// from `labelOutAt` to `labelOut`. `words` follows the move: each word rises
// over its length, starting `order` frames later per step of its distance
// from the number (measured on the laid-out sentence).
export const statInlineTimeline = defineTimeline<
  StatInlineElementId,
  StatInlineTimingProps
>(({ value = DEFAULT_VALUE, hold = 52, moveDuration = 28 }) => {
  const elements: TimelineElement<StatInlineElementId>[] = [
    { id: "ground", lane: "Ground", label: "fade up", start: 0, length: 30 },
    { id: "drift", lane: "Ground", label: "drift", start: 0, length: 130 },
  ];
  [...value].forEach((ch, i) => {
    elements.push({
      id: `glyph:${i}`,
      lane: "Number",
      label: ch,
      start: i * 2,
      length: 20,
      follows: i > 0 ? `glyph:${i - 1}` : undefined,
    });
  });
  elements.push(
    { id: "label", lane: "Label", label: "label", start: 12, length: 16 },
    {
      id: "move",
      lane: "Number",
      label: "fly into sentence",
      start: hold,
      length: moveDuration,
      beats: { labelOutAt: -2, labelOut: 8 },
    },
    {
      id: "words",
      lane: "Sentence",
      label: "words",
      start: hold + 17,
      length: 18,
      follows: "move",
      beats: { order: 2.5 },
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
