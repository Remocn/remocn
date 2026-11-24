import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The shape growing in, each morph to the next shape in the library, the
// shape landing in the word's "o", the word sliding out from behind it and
// the counter opening. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type ShapeMorphOElementId =
  | "enter"
  | `morph:${number}`
  | "land"
  | "reveal"
  | "counter";

export interface ShapeMorphOTimingProps {
  beat?: number;
}

const ENTER = 10;
const FIRST = 8;
const GAP = 16;
/** Shape changes after the circle: cookie, clover, burst, pill, square. */
export const MORPHS = 5;
const LAND_GAP = 2;
const REVEAL_GAP = 9;
/** The counter opens once the word is out, after a short solid beat. */
const COUNTER_GAP = 15;
const COUNTER_LEN = 9;

// `morph:<k>` springs from shape `k - 1` to shape `k`; the morphs are a
// chain, and the land, reveal and counter each follow the one before.
export const shapeMorphOTimeline = defineTimeline<
  ShapeMorphOElementId,
  ShapeMorphOTimingProps
>(({ beat = GAP }) => {
  const elements: TimelineElement<ShapeMorphOElementId>[] = [
    { id: "enter", lane: "Shape", label: "Grow in", start: 0, length: ENTER },
  ];
  for (let k = 1; k <= MORPHS; k++) {
    elements.push({
      id: `morph:${k}`,
      lane: "Morphs",
      label: `Shape ${k}`,
      start: FIRST + (k - 1) * beat,
      length: beat,
      follows: k > 1 ? `morph:${k - 1}` : undefined,
    });
  }
  const landAt = FIRST + MORPHS * beat + LAND_GAP;
  const revealAt = landAt + REVEAL_GAP;
  const counterAt = revealAt + COUNTER_GAP;
  elements.push(
    {
      id: "land",
      lane: "Shape",
      label: "Land in the o",
      start: landAt,
      length: REVEAL_GAP,
      follows: `morph:${MORPHS}`,
    },
    {
      id: "reveal",
      lane: "Word",
      label: "Word out",
      start: revealAt,
      length: COUNTER_GAP,
      follows: "land",
    },
    {
      id: "counter",
      lane: "Word",
      label: "Counter opens",
      start: counterAt,
      length: COUNTER_LEN,
      follows: "reveal",
    },
  );
  return elements;
});
