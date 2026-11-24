import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each belief: its paragraph rising in word by word, the kept words marked,
// the rest falling away and the kept words flying into the motto line; then
// the motto folding into a stack, one row after another. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The beliefs share the clip,
// leaving `hold` for the finished motto. The ids are public: a saved `timing`
// prop refers to them.

export type KeepWordsElementId = `belief:${number}` | `stack:${number}`;

export interface KeepBeliefText {
  text: string;
  keep: string;
}

export interface KeepWordsTimingProps {
  beliefs?: KeepBeliefText[];
  hold?: number;
}

export const DEFAULT_BELIEFS: KeepBeliefText[] = [
  {
    text: "A launch video should be written, the same way the product was.",
    keep: "written",
  },
  {
    text: "Every frame you install should stay yours, down to the last easing curve.",
    keep: "yours",
  },
  {
    text: "And the film should land on time, in the same release as the code.",
    keep: "on time",
  },
];

export const FINAL_HOLD = 34;
const START = 6;
const STACK_MOVE = 24;
const STACK_STAGGER = 4;
const STACK_GAP = 14;

/** The kept words as the motto writes them: capitalised. */
export function mottoOf(keep: string) {
  const t = keep.trim();
  return `${t.charAt(0).toUpperCase()}${t.slice(1)}`;
}

// `belief:<i>` runs until the next belief starts; the beliefs form a chain.
// Its words rise in `stagger` apart, the kept words take the accent from
// `mark`, the rest fall from `fall` (a frame apart in fours), the kept words
// fly into the motto from `travel` over `travelLen`, and the full stop
// lands around `dot`. `stack:<i>` folds motto item `i` into the stack; the
// stack rows follow the last belief and each other.
export const keepWordsTimeline = defineTimeline<
  KeepWordsElementId,
  KeepWordsTimingProps
>(({ beliefs = DEFAULT_BELIEFS, hold = FINAL_HOLD }, { length }) => {
  const n = beliefs.length;
  const D = length;
  const seg = Math.max(
    48,
    (D - START - STACK_MOVE - hold - 30) / Math.max(1, n),
  );
  const lastTravel =
    START + (n - 1) * seg + seg * 0.66 + Math.min(24, seg * 0.3);
  const stackAt = lastTravel + STACK_GAP;

  const elements: TimelineElement<KeepWordsElementId>[] = beliefs.map(
    (b, bi): TimelineElement<KeepWordsElementId> => {
      const words = b.text.split(/\s+/).filter(Boolean).length;
      const stagger = Math.min(2, 22 / Math.max(1, words));
      const travelAt = seg * 0.66;
      const travelLen = Math.min(24, seg * 0.3);
      const keyCount = mottoOf(b.keep).split(/\s+/).length;
      return {
        id: `belief:${bi}`,
        lane: "Beliefs",
        label: b.keep,
        start: START + bi * seg,
        length: seg,
        follows: bi > 0 ? `belief:${bi - 1}` : undefined,
        beats: {
          stagger,
          mark: seg * 0.42,
          fall: seg * 0.6,
          travel: travelAt,
          travelLen,
          dot: travelAt + (keyCount - 1) * 2 + travelLen,
        },
      };
    },
  );
  beliefs.forEach((b, i) => {
    elements.push({
      id: `stack:${i}`,
      lane: "Motto",
      label: mottoOf(b.keep),
      start: stackAt + i * STACK_STAGGER,
      length: STACK_MOVE,
      follows: i > 0 ? `stack:${i - 1}` : `belief:${n - 1}`,
    });
  });
  return elements;
});
