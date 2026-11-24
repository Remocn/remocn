import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The loose letters fading in, drifting together, then snapping onto the
// middle letter one by one, center out, until the word is set. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type KerningSnapElementId = "gather" | "fade" | `snap:${number}`;

export interface KerningSnapTimingProps {
  word?: string;
  interval?: number;
  firstSnap?: number;
}

export const DEFAULT_WORD = "Typeset";
const INTERVAL = 7;
export const FIRST_SNAP = 30;
/** Letters fade in over `FADE`, `FADE_STAGGER` apart, from `FADE_AT`. */
const FADE_AT = 2;
const FADE = 14;
const FADE_STAGGER = 2;
/** A snap flashes its tick `FLASH_AT` after it lands, over `FLASH`. */
const FLASH_AT = 3;
const FLASH = 12;
/** The letters drift together until `GATHER_TAIL` after the last snap. */
const GATHER_TAIL = 4;
/** The push carries on this long after the gather. */
const PUSH_TAIL = 56;

/** The letter the others snap onto, and the order they snap in. */
export function snapOrder(n: number) {
  const anchor = Math.floor((n - 1) / 2);
  const order: number[] = [];
  for (let d = 1; order.length < n - 1; d++) {
    if (anchor + d < n) order.push(anchor + d);
    if (anchor - d >= 0) order.push(anchor - d);
  }
  return { anchor, order };
}

// `gather` runs from the start to just after the last snap; the slow push
// on the word runs `push` beyond it.
export const kerningSnapTimeline = defineTimeline<
  KerningSnapElementId,
  KerningSnapTimingProps
>(({ word = DEFAULT_WORD, interval = INTERVAL, firstSnap = FIRST_SNAP }) => {
  const chars = Array.from(word);
  const n = chars.length;
  const { order } = snapOrder(n);
  const lastSnap = firstSnap + (n - 2) * interval;
  const elements: TimelineElement<KerningSnapElementId>[] = [
    {
      id: "gather",
      lane: "Word",
      label: word,
      start: 0,
      length: lastSnap + GATHER_TAIL,
      beats: { push: PUSH_TAIL },
    },
    {
      id: "fade",
      lane: "Letters",
      label: "fade in",
      start: FADE_AT,
      length: FADE + Math.max(0, n - 1) * FADE_STAGGER,
      beats: { stagger: FADE_STAGGER, letter: FADE },
    },
    ...order.map(
      (j, k): TimelineElement<KerningSnapElementId> => ({
        id: `snap:${j}`,
        lane: "Snaps",
        label: chars[j],
        start: firstSnap + k * interval,
        length: FLASH_AT + FLASH,
        follows: k > 0 ? `snap:${order[k - 1]}` : undefined,
        beats: { flash: FLASH_AT },
      }),
    ),
  ];
  return elements;
});
