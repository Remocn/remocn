import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The ground line drawing in, each domino rising into the row, each domino
// falling into the next, then the value and the caption over the last one.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type DominoRunElementId =
  | "ground"
  | `domino:${number}`
  | `fall:${number}`
  | "value"
  | "caption";

export interface DominoRunTimingProps {
  count?: number;
  stagger?: number;
  value?: string;
  caption?: string;
}

export const RATIO = 1.18;
const T0 = 14;
const TAU0 = 3.6;

/** Dominoes in the row: `count`, kept to 5–24. */
export function dominoCount(count: number) {
  return Math.max(5, Math.min(24, Math.round(count)));
}

// `domino:<i>` rises domino `i` in after `rise`. `fall:<i>` tips it from
// upright to the moment it strikes the next one (the last one: the ground);
// bigger dominoes fall slower, and the falls form a chain. `value` and
// `caption` start on the last impact and come in from `revealAt` and `inAt`.
export const dominoRunTimeline = defineTimeline<
  DominoRunElementId,
  DominoRunTimingProps
>(
  ({
    count = 13,
    stagger = 1.2,
    value = "10×",
    caption = "Every push tips a bigger one.",
  }) => {
    const n = dominoCount(count);
    const falls: { start: number; tau: number }[] = [];
    let start = T0;
    for (let i = 0; i < n; i++) {
      const h = RATIO ** i;
      const last = i === n - 1;
      const tau = TAU0 * Math.sqrt(h) * (last ? 2.1 : 1);
      falls.push({ start, tau });
      start += tau;
    }
    const lastFall = falls[n - 1];
    const impact = lastFall.start + lastFall.tau;
    const elements: TimelineElement<DominoRunElementId>[] = [
      { id: "ground", lane: "Ground", label: "ground", start: 0, length: 16 },
      ...falls.map(
        (_, i): TimelineElement<DominoRunElementId> => ({
          id: `domino:${i}`,
          lane: "Row",
          label: `domino ${i + 1}`,
          start: i * stagger,
          length: 14,
          follows: i > 0 ? `domino:${i - 1}` : undefined,
          beats: { rise: 2 },
        }),
      ),
      ...falls.map(
        (f, i): TimelineElement<DominoRunElementId> => ({
          id: `fall:${i}`,
          lane: "Falls",
          label: `domino ${i + 1}`,
          start: f.start,
          length: f.tau,
          follows: i > 0 ? `fall:${i - 1}` : undefined,
        }),
      ),
      {
        id: "value",
        lane: "Copy",
        label: value,
        start: impact,
        length: 22,
        follows: `fall:${n - 1}`,
        beats: { revealAt: 2 },
      },
      {
        id: "caption",
        lane: "Copy",
        label: caption,
        start: impact,
        length: 30,
        follows: `fall:${n - 1}`,
        beats: { inAt: 12 },
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
