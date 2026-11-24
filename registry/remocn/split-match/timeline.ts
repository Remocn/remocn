import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Both reels slamming in on the first word, rolling on to each next word,
// then the camera push and the seam closing on the last one. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type SplitMatchElementId = "enter" | `word:${number}` | "push" | "merge";

export interface SplitMatchTimingProps {
  words?: string[];
  hold?: number;
  step?: number;
}

export const DEFAULT_WORDS = ["build", "ship", "launch", "remocn"];

// Beat sheet (30fps), four words:
//  0–10    both reels slam in from opposite sides and lock on word 1
//  10–26   hold: left half on stage, right half on a gradient panel, one word
//  26–35   step: left reel climbs, right reel drops, halves blur past each other
//  ...     two more step + lock beats
//  85      final lock on the last word
//  93–109  the seam closes: the gradient floods the left panel, neighbours fall away
//  109–145 poster hold with a slow push
export const ENTER = 10;
export const HOLD = 16;
export const STEP = 9;
export const MERGE_DELAY = 8;
export const MERGE = 16;
export const TAIL = 36;

/** The words the reels carry: the fallback logo when the list is empty. */
export function wordsOf(words: string[]) {
  return words.length ? words : ["remocn"];
}

// `enter` slams both reels in (from 4 frames before the scene starts) and
// locks them on the first word. `word:<i>` rolls the reels on to word `i`
// after the one before has held for `hold` frames (a chain). `push` is the
// slow camera push from the last lock; `merge` closes the seam. Both follow
// the last word.
export const splitMatchTimeline = defineTimeline<
  SplitMatchElementId,
  SplitMatchTimingProps
>(({ words = DEFAULT_WORDS, hold = HOLD, step = STEP }) => {
  const list = wordsOf(words);
  const n = list.length;
  const elements: TimelineElement<SplitMatchElementId>[] = [
    {
      id: "enter",
      lane: "Reels",
      label: list[0],
      start: -4,
      length: ENTER + 4,
    },
  ];
  for (let i = 1; i < n; i++) {
    const start = ENTER + (i - 1) * (hold + step) + hold;
    elements.push({
      id: `word:${i}`,
      lane: "Reels",
      label: list[i],
      start,
      length: step,
      follows: i > 1 ? `word:${i - 1}` : "enter",
    });
  }
  const lastLock = ENTER + (n - 1) * (hold + step);
  const last: SplitMatchElementId = n > 1 ? `word:${n - 1}` : "enter";
  elements.push(
    {
      id: "push",
      lane: "Camera",
      label: "Push",
      start: lastLock,
      length: MERGE + TAIL + 10,
      follows: last,
    },
    {
      id: "merge",
      lane: "Seam",
      label: "Merge",
      start: lastLock + MERGE_DELAY,
      length: MERGE,
      follows: last,
    },
  );
  return elements;
});
