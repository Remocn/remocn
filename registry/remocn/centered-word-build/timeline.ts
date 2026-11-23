import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When each word lands and when the line wipes out. Frames on the 30 fps
// scene timeline, after `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type CenteredWordBuildElementId = `word:${number}` | "exit";

export interface CenteredWordBuildTimingProps {
  text: string;
  wordGap?: number;
  accel?: number;
  settleFrames?: number;
  exitAt?: number;
  exitFrames?: number;
}

export const WORD_GAP = 11;
export const ACCEL = 0.75;
export const SETTLE_FRAMES = 9;
export const EXIT_AT = 51;
export const EXIT_FRAMES = 12;

export function revealFrame(
  index: number,
  wordGap: number,
  accel: number,
): number {
  let frame = 0;

  for (let step = 1; step <= index; step++) {
    // Establish two even beats before tightening the cadence.
    frame += wordGap * accel ** Math.max(step - 2, 0);
  }

  return Math.round(frame);
}

// A word settles from its reveal over `settleFrames`, and the camera zooms in
// over the same frames.
export const centeredWordBuildTimeline = defineTimeline<
  CenteredWordBuildElementId,
  CenteredWordBuildTimingProps
>(
  ({
    text,
    wordGap = WORD_GAP,
    accel = ACCEL,
    settleFrames = SETTLE_FRAMES,
    exitAt = EXIT_AT,
    exitFrames = EXIT_FRAMES,
  }) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const elements: TimelineElement<CenteredWordBuildElementId>[] = words.map(
      (word, index) => ({
        id: `word:${index}`,
        lane: "Words",
        label: word,
        start: revealFrame(index, wordGap, accel),
        length: Math.max(settleFrames, 0.001),
        follows: index > 0 ? `word:${index - 1}` : undefined,
      }),
    );
    // The exit comes in time order, after the last word that lands before
    // it, and follows that word.
    const at = elements.findIndex((e) => e.start > exitAt);
    const place = at === -1 ? elements.length : at;
    elements.splice(place, 0, {
      id: "exit",
      lane: "Exit",
      label: "exit",
      start: exitAt,
      length: Math.max(exitFrames, 0.001),
      follows: place > 0 ? elements[place - 1].id : undefined,
    });
    return elements;
  },
);
