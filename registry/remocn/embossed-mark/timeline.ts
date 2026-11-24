import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A raking light sweeps across the debossed mark, the camera eases out from
// the mark to the whole lockup, the foil presses into the mark and the name
// prints letter by letter. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type EmbossedMarkElementId =
  | "light"
  | "camera"
  | "foil"
  | `letter:${number}`;

export interface EmbossedMarkTimingProps {
  name?: string;
  /** Frames between letters of `name` as they print. */
  stagger?: number;
}

const LETTER_AT = 80;
const LETTER = 10;

export const embossedMarkTimeline = defineTimeline<
  EmbossedMarkElementId,
  EmbossedMarkTimingProps
>(({ name = "emocn", stagger = 3 }) => {
  const elements: TimelineElement<EmbossedMarkElementId>[] = [
    { id: "light", lane: "Light", label: "light sweep", start: 0, length: 112 },
    { id: "camera", lane: "Camera", label: "pull out", start: 56, length: 44 },
    { id: "foil", lane: "Mark", label: "foil", start: 66, length: 18 },
  ];
  [...name].forEach((letter, i) => {
    elements.push({
      id: `letter:${i}`,
      lane: "Name",
      label: letter,
      start: LETTER_AT + i * stagger,
      length: LETTER,
      follows: i > 0 ? `letter:${i - 1}` : undefined,
    });
  });
  return elements;
});
