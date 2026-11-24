import { defineTimeline } from "@/lib/remocn/timeline";

// When each column rolls from the old character to the new one, left to
// right. Frames on the 30 fps scene timeline, after `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type SlotMachineRollElementId = `column:${number}`;

export interface SlotMachineRollTimingProps {
  from?: string;
  to?: string;
}

export const DEFAULT_FROM = "$99";
export const DEFAULT_TO = "$199";
const STAGGER = 4;
/** Frames a column's spring takes to settle. */
const ROLL = 21;

/** The two values padded on the left to the same number of columns. */
export function columnsOf(from: string, to: string) {
  const len = Math.max(from.length, to.length);
  return { len, from: from.padStart(len, " "), to: to.padStart(len, " ") };
}

export const slotMachineRollTimeline = defineTimeline<
  SlotMachineRollElementId,
  SlotMachineRollTimingProps
>(({ from = DEFAULT_FROM, to = DEFAULT_TO }) => {
  const cols = columnsOf(from, to);
  return Array.from({ length: cols.len }, (_, i) => ({
    id: `column:${i}` as const,
    lane: "Columns",
    label: `${cols.from[i]} → ${cols.to[i]}`,
    start: i * STAGGER,
    length: ROLL,
    follows: i > 0 ? (`column:${i - 1}` as const) : undefined,
  }));
});
