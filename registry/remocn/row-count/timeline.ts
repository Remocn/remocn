import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The top rule drawing in, the first row and the label rising, then the
// count: the number climbs and a new row is born above the stack each time
// it gains a group of three digits. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type RowCountElementId = "rule" | "enter" | "label" | "count";

export interface RowCountTimingProps {
  countLength?: number;
}

const COUNT_AT = 6;
export const COUNT_LEN = 78;
const RULE = 16;
const ENTER = 14;
const LABEL_AT = 6;
const LABEL = 18;
/** A new row rises in over `rise`; the rows below start making room `pushLead` before. */
const ROW_RISE = 10;
const PUSH_LEAD = 4;

// The rows are born inside `count`, where the climbing number crosses each
// thousand, so they move and stretch with it; `rise` and `pushLead` time
// each birth.
export const rowCountTimeline = defineTimeline<
  RowCountElementId,
  RowCountTimingProps
>(({ countLength = COUNT_LEN }) => {
  const elements: TimelineElement<RowCountElementId>[] = [
    { id: "rule", lane: "Rule", label: "rule", start: 0, length: RULE },
    { id: "enter", lane: "Rows", label: "first row", start: 0, length: ENTER },
    {
      id: "label",
      lane: "Label",
      label: "label",
      start: LABEL_AT,
      length: LABEL,
    },
    {
      id: "count",
      lane: "Count",
      label: "count",
      start: COUNT_AT,
      length: countLength,
      beats: { rise: ROW_RISE, pushLead: PUSH_LEAD },
    },
  ];
  return elements;
});
