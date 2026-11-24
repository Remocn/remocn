import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When each entry of the alphabet gag takes the stage. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type AToZElementId =
  | "connector"
  | `entry:${number}`
  | "ellipsis"
  | "finale";

export interface AToZTimingProps {
  entries?: string[];
  finale?: string;
  /** Frames between wrapped lines of an entry as it rolls. */
  stagger?: number;
  /** Frames for each letter and entry roll. */
  roll?: number;
}

export const DEFAULT_ENTRIES = [
  "any aspect ratio.",
  "brand fonts.",
  "captions.",
  "dark mode.",
];
export const DEFAULT_FINALE = "zero lock-in.";
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ROLL = 7;
const STAGGER = 2;

const DWELLS = [28, 19, 17, 17];
const FINAL_ROLL = 13;
const HOLD_MIN = 36;
/** Frames the opening letter, connector and text take to rise in. */
const RISE = 14;

export function initialOf(text: string) {
  const ch = text.trim().charAt(0).toUpperCase();
  return ALPHABET.includes(ch) ? ch : "A";
}

/** Letters the flick runs through between the last entry and the finale. */
export function lettersBetween(last: string, finale: string) {
  const from = ALPHABET.indexOf(initialOf(last));
  const to = ALPHABET.indexOf(initialOf(finale));
  return to > from + 1 ? ALPHABET.slice(from + 1, to).split("") : [];
}

function flickDurations(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const fromStart = i;
    const fromEnd = count - 1 - i;
    if (fromStart === 0) return 3;
    if (fromStart === 1) return 2;
    if (fromEnd === 0) return 4;
    if (fromEnd === 1) return 3;
    if (fromEnd === 2) return 2;
    return 1;
  });
}

export const aToZTimeline = defineTimeline<AToZElementId, AToZTimingProps>(
  (
    {
      entries = DEFAULT_ENTRIES,
      finale = DEFAULT_FINALE,
      stagger = STAGGER,
      roll = ROLL,
    },
    { length },
  ) => {
    const list = entries.length > 0 ? entries : DEFAULT_ENTRIES;
    const between = lettersBetween(list[list.length - 1], finale);
    const flick = flickDurations(between.length);
    const flickSum = flick.reduce((s, d) => s + d, 0);
    const natural = list.map((_, k) => DWELLS[Math.min(k, DWELLS.length - 1)]);
    const natSum = natural.reduce((s, d) => s + d, 0);
    const budget = length - HOLD_MIN - FINAL_ROLL - flickSum - 4;
    const fit = natSum > 0 ? Math.min(1, budget / natSum) : 1;
    const starts: number[] = [];
    let at = 0;
    for (let k = 0; k < list.length; k++) {
      starts.push(at);
      at += Math.max(8, Math.round(natural[k] * fit));
    }
    const ellipsisAt = at;
    const flickAt = between.length > 0 ? 2 : 0;
    const finaleAt = ellipsisAt + flickAt + flickSum;

    const lastEntry: AToZElementId = `entry:${list.length - 1}`;
    const elements: TimelineElement<AToZElementId>[] = [
      {
        id: "connector",
        lane: "Connector",
        label: "connector",
        start: 0,
        length,
        beats: { rise: RISE },
      },
      ...list.map(
        (text, k): TimelineElement<AToZElementId> => ({
          id: `entry:${k}`,
          lane: "Entries",
          label: text,
          start: starts[k],
          length: (starts[k + 1] ?? ellipsisAt) - starts[k],
          follows: k > 0 ? `entry:${k - 1}` : undefined,
          // The first entry rises in rather than rolls: its letter starts
          // `letterAt` frames before the start, its text `textAt` after.
          beats:
            k === 0
              ? { roll, stagger, rise: RISE, letterAt: -3, textAt: 2 }
              : { roll, stagger },
        }),
      ),
    ];
    // The ellipsis rolls in for the stretch of the alphabet the entries
    // skip, while the big letter flicks through it; with nothing to skip
    // the finale follows the last entry straight away.
    if (between.length > 0) {
      const flicks: Record<string, number> = {};
      let fa = flickAt;
      between.forEach((_, i) => {
        flicks[`flick:${i}`] = fa;
        fa += flick[i];
      });
      elements.push({
        id: "ellipsis",
        lane: "Ellipsis",
        label: "…",
        start: ellipsisAt,
        length: finaleAt - ellipsisAt,
        follows: lastEntry,
        beats: { roll, stagger, ...flicks },
      });
    }
    elements.push({
      id: "finale",
      lane: "Finale",
      label: finale,
      start: finaleAt,
      length: length - finaleAt,
      follows: between.length > 0 ? "ellipsis" : lastEntry,
      // The letter lands first, the text `textAt` frames later.
      beats: { roll: FINAL_ROLL, stagger, textAt: 2 },
    });
    return elements;
  },
);
