import { defineTimeline } from "@/lib/remocn/timeline";

// One element per word cycle: the word hangs at the near point after the
// swap, arrives, rests readable, departs and hangs again until the next
// swap. Cycle `k` shows word `k` of the phrase, wrapping round, so the
// phrase loops for as long as the scene runs. The scene opens halfway
// through the first rest, so the first cycle starts before frame 0.
// Frames on the 30 fps scene timeline, after `speed`. The ids are public:
// a saved `timing` prop refers to them.

export type RushTypeElementId = `cycle:${number}`;

export interface RushTypeTimingProps {
  phrase?: string;
  restDuration?: number;
  peakHoldDuration?: number;
}

export const RUSH_PHRASE = "gone before you look";
export const ARRIVE_FRAMES = 7;
export const LEAVE_FRAMES = 4;
export const DEFAULT_REST_FRAMES = 12;
export const DEFAULT_HOLD_FRAMES = 3;

/** The phrase as words; an empty phrase falls back to the reference one. */
export function phraseWords(phrase: string): string[] {
  const words = phrase.trim().split(/\s+/).filter(Boolean);
  return words.length > 0 ? words : RUSH_PHRASE.split(" ");
}

/** Frames from one word swap to the next. */
export function cycleLengthOf(
  restDuration = DEFAULT_REST_FRAMES,
  peakHoldDuration = DEFAULT_HOLD_FRAMES,
): number {
  return (
    ARRIVE_FRAMES +
    LEAVE_FRAMES +
    Math.max(restDuration, 1) +
    Math.max(peakHoldDuration, 0)
  );
}

// `cycle:<k>` starts on a word swap. Its beats are the phases in order:
// `hold` (half the near-point hang, on each side of the swap), `arrive`,
// `rest`, `leave`. The cycles form a chain and run past the end of the
// scene, so the shutter samples around the last frame still land in one.
export const rushTypeTimeline = defineTimeline<
  RushTypeElementId,
  RushTypeTimingProps
>(
  (
    {
      phrase = RUSH_PHRASE,
      restDuration = DEFAULT_REST_FRAMES,
      peakHoldDuration = DEFAULT_HOLD_FRAMES,
    },
    { length },
  ) => {
    const words = phraseWords(phrase);
    const safeRest = Math.max(restDuration, 1);
    const safeHold = Math.max(peakHoldDuration, 0);
    const halfHold = safeHold / 2;
    const cycleLength = cycleLengthOf(safeRest, safeHold);
    const startOffset = halfHold + ARRIVE_FRAMES + safeRest / 2;
    const count = Math.max(
      1,
      Math.ceil((Math.max(length, 0) + startOffset) / cycleLength) + 1,
    );
    return Array.from({ length: count }, (_, k) => ({
      id: `cycle:${k}` as const,
      lane: "Words",
      label: words[k % words.length],
      start: k * cycleLength - startOffset,
      length: cycleLength,
      follows: k > 0 ? (`cycle:${k - 1}` as const) : undefined,
      beats: {
        hold: halfHold,
        arrive: ARRIVE_FRAMES,
        rest: safeRest,
        leave: LEAVE_FRAMES,
      },
    }));
  },
);
