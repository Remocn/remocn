import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Statement by statement: the words rising in, the full stop dropping in
// and pulsing, then the full stop expanding into the next statement's
// scene. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type PointExpandElementId =
  | `line:${number}`
  | `point:${number}`
  | `expand:${number}`;

export interface PointExpandTimingProps {
  statements?: string[];
  pulses?: number;
  stagger?: number;
  hold?: number;
}

export const DEFAULT_STATEMENTS = [
  "Launch films used to take weeks.",
  "Now they take an afternoon.",
  "Copy, paste, render.",
];
const PULSES = 2;
const STAGGER = 2;
const HOLD = 6;

const FIRST = 2;
const RISE = 14;
const PULSE = 7;
const EXPAND = 18;
const SETTLE_FROM = -4;
const SETTLE_TO = 40;
const DROP_FROM = -6;
const DROP_TO = 4;
const RING_AT = 1;
const RING = PULSE * 2.2;
const PRE_FROM = -4;
const PRE_TO = 2;

/** The statements shown, five at most: one empty when the list is. */
export function statementsOf(statements: string[]) {
  return (statements.length ? statements : [""]).slice(0, 5);
}

/** A statement as set: trimmed, its own full stop dropped for the dot. */
export const statementText = (raw: string) => raw.trim().replace(/[.。]+$/, "");

// `line:<k>` raises statement k word by word, `stagger` apart, each over
// `rise`; its scene settles from `settleFrom` to `settleTo`. `point:<k>`
// drops the full stop in from `dropFrom` to `drop` and then, `hold` after
// the words land, pulses it every `pulse` frames, each pulse sending a ring
// out from `ringAt` over `ring`. `expand:<k>` grows that full stop into
// scene k + 1, dipping it from `preFrom` to `preTo`; the next line starts
// halfway through. Each element follows the one before.
export const pointExpandTimeline = defineTimeline<
  PointExpandElementId,
  PointExpandTimingProps
>(
  ({
    statements = DEFAULT_STATEMENTS,
    pulses = PULSES,
    stagger = STAGGER,
    hold = HOLD,
  }) => {
    const list = statementsOf(statements);
    const count = list.length;
    const elements: TimelineElement<PointExpandElementId>[] = [];
    let t = FIRST;
    for (let k = 0; k < count; k++) {
      const text = statementText(list[k]);
      const words = text.split(/\s+/).filter(Boolean).length;
      const last = k === count - 1;
      const landed = t + RISE + (words - 1) * stagger;
      const expandAt = landed + hold + pulses * PULSE;
      elements.push(
        {
          id: `line:${k}`,
          lane: "Statements",
          label: text,
          start: t,
          length: landed - t,
          follows: k > 0 ? `expand:${k - 1}` : undefined,
          beats: {
            stagger,
            rise: RISE,
            settleFrom: SETTLE_FROM,
            settleTo: SETTLE_TO,
          },
        },
        {
          id: `point:${k}`,
          lane: "Point",
          label: `full stop ${k + 1}`,
          start: landed,
          length: hold + (last ? 1 : pulses) * PULSE,
          follows: `line:${k}`,
          beats: {
            dropFrom: DROP_FROM,
            drop: DROP_TO,
            hold,
            pulse: PULSE,
            ringAt: RING_AT,
            ring: RING,
          },
        },
      );
      if (!last) {
        elements.push({
          id: `expand:${k}`,
          lane: "Point",
          label: `into ${k + 2}`,
          start: expandAt,
          length: EXPAND,
          follows: `point:${k}`,
          beats: { preFrom: PRE_FROM, preTo: PRE_TO },
        });
      }
      t = expandAt + EXPAND * 0.5;
    }
    return elements;
  },
);
