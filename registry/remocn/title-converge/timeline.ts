import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The camera pulling back while each letter drifts in on its own path and
// locks, then the two rules sliding in. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type TitleConvergeElementId = "camera" | `letter:${number}` | "rules";

export interface TitleConvergeTimingProps {
  word?: string;
  converge?: number;
}

/** Frame the camera finishes easing out and the last letter locks. */
export const LOCK = 128;
const RULES = 116;

/** A stable pseudo-random 0–1 per letter and salt. */
export function hash(i: number, salt: number) {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** The letters the word is set as: the logo word swaps its "r" for the R mark. */
export function lettersOf(word: string) {
  const isLogo = word.trim().toLowerCase() === "remocn";
  return { isLogo, chars: Array.from(isLogo ? "Remocn" : word) };
}

// `camera` eases the zoom out to rest, then creeps in over `creep` frames
// past its end. `letter:<i>` drifts letter `i` in over its length (outer
// letters take longer); its fill floods up from `flood` to `lock` and its
// outline fades over `line`, all from the element's end. `rules` slides the
// top rule in over `slide` and the bottom one `bottom` frames later.
export const titleConvergeTimeline = defineTimeline<
  TitleConvergeElementId,
  TitleConvergeTimingProps
>(({ word = "remocn", converge = LOCK }) => {
  const { chars } = lettersOf(word);
  const n = chars.length;
  const elements: TimelineElement<TitleConvergeElementId>[] = [
    {
      id: "camera",
      lane: "Camera",
      label: "Camera",
      start: 0,
      length: converge,
      beats: { creep: 70 },
    },
  ];
  chars.forEach((ch, i) => {
    const side = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
    const outer = Math.abs(side);
    elements.push({
      id: `letter:${i}`,
      lane: "Letters",
      label: ch,
      start: 0,
      length: converge - 30 + outer * 26 + hash(i, 3) * 6,
      beats: { flood: -16, lock: 2, line: 10 },
    });
  });
  elements.push({
    id: "rules",
    lane: "Rules",
    label: "Rules",
    start: converge - (LOCK - RULES),
    length: 31,
    follows: "camera",
    beats: { slide: 26, bottom: 5 },
  });
  return elements;
});
