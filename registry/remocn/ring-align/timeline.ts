import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Concentric rings of dots spin into alignment, outermost first, until their
// gaps line up into a channel; a beam then wipes the word through it. Frames
// on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type RingAlignElementId = `ring:${number}` | "beam";

export interface RingAlignTimingProps {
  word?: string;
  rings?: number;
  stagger?: number;
}

export const DEFAULT_WORD = "Aligned.";
export const FIRST_LOCK = 30;
export const LOCK_STEP = 8;
export const BEAM_GAP = 4;
export const BEAM = 14;
export const TAIL_DELAY = 8;
export const TAIL = 16;
export const HOLD = 32;

/** Rings drawn for a `rings` prop: three to nine. */
export function ringCount(rings: number) {
  return Math.max(3, Math.min(9, Math.round(rings)));
}

// `ring:<k>` locks ring `k` (outermost first) at its start, after spinning
// in over `spin` frames from the top of the scene; it lights from `lightAt`
// over `light` and runs until the next ring locks. A chain. `beam` wipes the
// word in over its length after the last lock, the tail follows from
// `tailAt` over `tail`, and the word's gradient drifts over `drift`.
export const ringAlignTimeline = defineTimeline<
  RingAlignElementId,
  RingAlignTimingProps
>(({ word = DEFAULT_WORD, rings = 6, stagger = LOCK_STEP }) => {
  const n = ringCount(rings);
  const elements: TimelineElement<RingAlignElementId>[] = [];
  for (let k = 0; k < n; k++) {
    const lockAt = FIRST_LOCK + k * stagger;
    elements.push({
      id: `ring:${k}`,
      lane: "Rings",
      label: `Ring ${k + 1}`,
      start: lockAt,
      length: k < n - 1 ? stagger : BEAM_GAP,
      follows: k > 0 ? `ring:${k - 1}` : undefined,
      beats: { spin: lockAt, lightAt: -2, light: 8 },
    });
  }
  const lastLock = FIRST_LOCK + (n - 1) * stagger;
  elements.push({
    id: "beam",
    lane: "Word",
    label: word,
    start: lastLock + BEAM_GAP,
    length: BEAM,
    follows: `ring:${n - 1}`,
    beats: { tailAt: TAIL_DELAY, tail: TAIL, drift: TAIL_DELAY + TAIL + HOLD },
  });
  return elements;
});
