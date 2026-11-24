import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The figure's characters rising in, each snap that pulls the stem open a
// step wider, and the label words rising in under it. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type StemStretchElementId =
  | `char:${number}`
  | `snap:${number}`
  | `word:${number}`;

export interface StemStretchTimingProps {
  value?: string;
  label?: string;
  steps?: number;
  snapGap?: number;
  stagger?: number;
}

export const DEFAULT_VALUE = "4 hours";
export const DEFAULT_LABEL = "back, every week";

const RISE_LEN = 18;
const RISE_GAP = 3;
const SNAP_AT = 26;
const SNAP_GAP = 12;
const LABEL_AT = 66;
const WORD_RISE = 16;

// `char:<i>` rises over its length; the characters form a chain. `snap:<k>`
// springs the stem open by one step from its start, lasting until the next
// snap; the snaps form a chain. The label words (`word:<i>`, a chain) follow
// the last snap already under way when they start.
export const stemStretchTimeline = defineTimeline<
  StemStretchElementId,
  StemStretchTimingProps
>(
  ({
    value = DEFAULT_VALUE,
    label = DEFAULT_LABEL,
    steps = 4,
    snapGap = SNAP_GAP,
    stagger = 3,
  }) => {
    const elements: TimelineElement<StemStretchElementId>[] = [];
    Array.from(value).forEach((ch, i) => {
      elements.push({
        id: `char:${i}`,
        lane: "Figure",
        label: ch,
        start: i * RISE_GAP - 2,
        length: RISE_LEN,
        follows: i > 0 ? `char:${i - 1}` : undefined,
      });
    });
    const n = Math.max(1, Math.round(steps));
    let leader: StemStretchElementId | undefined;
    for (let k = 0; k < n; k++) {
      const start = SNAP_AT + k * snapGap;
      if (start <= LABEL_AT) leader = `snap:${k}`;
      elements.push({
        id: `snap:${k}`,
        lane: "Stretch",
        label: `snap ${k + 1}`,
        start,
        length: snapGap,
        follows: k > 0 ? `snap:${k - 1}` : undefined,
      });
    }
    const words = label ? label.split(" ") : [];
    words.forEach((w, i) => {
      elements.push({
        id: `word:${i}`,
        lane: "Label",
        label: w,
        start: LABEL_AT + i * stagger,
        length: WORD_RISE,
        follows: i > 0 ? `word:${i - 1}` : leader,
      });
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
