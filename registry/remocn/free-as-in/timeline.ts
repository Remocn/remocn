import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The big word rising in, then each gloss arriving under it and pushing the
// ones before it up. The glosses share out the clip between the word and the
// last gloss's hold. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type FreeAsInElementId = "word" | `gloss:${number}`;

export interface FreeAsInTimingProps {
  glosses?: string[];
  hold?: number;
}

export const DEFAULT_GLOSSES = [
  "as in beer.",
  "as in speech.",
  "as in no seats.",
  "as in yours.",
];

const FIRST = 22;

/** The glosses that show: the non-empty ones. */
export function glossesOf(glosses: string[]) {
  return glosses.filter((s) => s.trim().length > 0);
}

// `gloss:<k>` pushes the glosses before it up a line over `push` and fades
// itself in from `in` to its end; the first one only fades. Each follows the
// one before. `length` here is the clip after `delay`, as the component
// counts it.
export const freeAsInTimeline = defineTimeline<
  FreeAsInElementId,
  FreeAsInTimingProps
>(({ glosses = DEFAULT_GLOSSES, hold = 46 }, { length }) => {
  const list = glossesOf(glosses);
  const n = list.length;
  const first = FIRST;
  const tail = hold;
  const step =
    n > 0
      ? Math.max(12, Math.min(30, (length - first - tail) / Math.max(1, n)))
      : 0;
  const elements: TimelineElement<FreeAsInElementId>[] = [
    { id: "word", lane: "Word", label: "Word", start: 0, length: 20 },
    ...list.map(
      (s, k): TimelineElement<FreeAsInElementId> => ({
        id: `gloss:${k}`,
        lane: "Glosses",
        label: s,
        start: first + k * step,
        length: k > 0 ? 21 : 16,
        follows: k > 0 ? `gloss:${k - 1}` : undefined,
        beats: { push: 12, in: k > 0 ? 5 : 0 },
      }),
    ),
  ];
  return elements;
});
