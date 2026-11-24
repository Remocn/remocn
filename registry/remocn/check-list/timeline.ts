import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each row draws its box and writes its label; once every label is written
// the checked rows are ticked and struck through, one after another. Frames
// on the 30 fps scene timeline; the first row starts at `delay`. The ids are
// public: a saved `timing` prop refers to them.

export type CheckListElementId = `item:${number}` | `check:${number}`;

export type CheckListItem = {
  text: string;
  checked?: boolean;
};

export type CheckListEntry = {
  text: string;
  checked: boolean;
};

export type CheckListBeat = {
  boxFrom: number;
  boxTo: number;
  labelAt: number;
  labelEnd: number;
  tickFrom?: number;
  tickTo?: number;
  strikeFrom?: number;
  strikeTo?: number;
};

export type CheckListTiming = {
  delay?: number;
  itemGap?: number;
  perStep?: number;
  step?: number;
  closeGap?: number;
};

export interface CheckListTimingProps extends CheckListTiming {
  items?: (string | CheckListItem)[];
}

export const DEFAULT_PER_STEP = 1.6;
/** Same as `DEFAULT_STEP` in stop-motion; kept here so the schedule imports nothing else. */
export const STEP = 3;
/** The docs example's items, for a schedule read without the props. */
const EXAMPLE_ITEMS: (string | CheckListItem)[] = [
  "Render on your own machine",
  "No watermark, ever",
  "Every component MIT",
  { text: "Ships as source", checked: false },
];

export function checkListEntries(
  items: (string | CheckListItem)[],
): CheckListEntry[] {
  return items.map((item) =>
    typeof item === "string"
      ? { text: item, checked: true }
      : { text: item.text, checked: item.checked ?? true },
  );
}

/** Frames `Handwrite` takes to write `text`, as its `handwriteDuration`. */
function writeLength(text: string, perStep: number, step: number) {
  return Math.ceil(Array.from(text).length / perStep) * step + step;
}

export function enterEndOf(
  items: (string | CheckListItem)[],
  options?: CheckListTiming,
): number {
  const step = options?.step ?? STEP;
  const delay = options?.delay ?? 0;
  const itemGap = options?.itemGap ?? step * 6;
  const perStep = options?.perStep ?? DEFAULT_PER_STEP;

  return checkListEntries(items).reduce(
    (end, item, i) =>
      Math.max(
        end,
        delay + i * itemGap + step * 2 + writeLength(item.text, perStep, step),
      ),
    delay,
  );
}

export function checkListPlan(
  items: (string | CheckListItem)[],
  options?: CheckListTiming,
): CheckListBeat[] {
  const step = options?.step ?? STEP;
  const delay = options?.delay ?? 0;
  const itemGap = options?.itemGap ?? step * 6;
  const perStep = options?.perStep ?? DEFAULT_PER_STEP;
  const closeGap = options?.closeGap ?? step * 3;
  const entries = checkListEntries(items);
  const enterEnd = enterEndOf(entries, options);

  const closeOrder = new Map<number, number>();
  entries.forEach((item, i) => {
    if (item.checked) {
      closeOrder.set(i, closeOrder.size);
    }
  });

  return entries.map((item, i) => {
    const boxFrom = delay + i * itemGap;
    const boxTo = boxFrom + step * 2;
    const labelEnd = boxTo + writeLength(item.text, perStep, step);
    const slot = closeOrder.get(i);
    if (slot === undefined) {
      return { boxFrom, boxTo, labelAt: boxTo, labelEnd };
    }
    const tickFrom = enterEnd + slot * closeGap;
    const tickTo = tickFrom + step * 2;
    return {
      boxFrom,
      boxTo,
      labelAt: boxTo,
      labelEnd,
      tickFrom,
      tickTo,
      strikeFrom: tickTo,
      strikeTo: tickTo + step * 2,
    };
  });
}

// `item:<i>` draws row i's box over `box` and writes its label to its end;
// each row follows the one before it. `check:<i>` ticks a checked row over
// `tick` and strikes its label over `strike` after that; the first check
// follows the row that finishes writing last, each next one the check before.
export const checkListTimeline = defineTimeline<
  CheckListElementId,
  CheckListTimingProps
>((props) => {
  const items = props.items ?? EXAMPLE_ITEMS;
  const step = props.step ?? STEP;
  const entries = checkListEntries(items);
  const beats = checkListPlan(items, props);
  const rows: TimelineElement<CheckListElementId>[] = entries.map(
    (item, i) => ({
      id: `item:${i}` as const,
      lane: "Rows",
      label: item.text,
      start: beats[i].boxFrom,
      length: beats[i].labelEnd - beats[i].boxFrom,
      follows: i > 0 ? (`item:${i - 1}` as const) : undefined,
      beats: { box: step * 2 },
    }),
  );
  let last = 0;
  for (const [i, beat] of beats.entries()) {
    if (beat.labelEnd > beats[last].labelEnd) last = i;
  }
  const checks: TimelineElement<CheckListElementId>[] = [];
  let leader: CheckListElementId = `item:${last}`;
  for (const [i, beat] of beats.entries()) {
    if (beat.tickFrom === undefined) continue;
    checks.push({
      id: `check:${i}`,
      lane: "Checks",
      label: `Check ${entries[i].text}`,
      start: beat.tickFrom,
      length: step * 4,
      follows: leader,
      beats: { tick: step * 2, strike: step * 2 },
    });
    leader = `check:${i}`;
  }
  return [...rows, ...checks];
});
