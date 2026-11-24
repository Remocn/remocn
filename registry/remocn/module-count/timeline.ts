import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The modular figure fading in, each value of the count it steps through
// (the cells morph column by column into the next glyphs), the grid locking
// tight once the count lands, and the label words rising in. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type ModuleCountElementId =
  | "intro"
  | `step:${number}`
  | `word:${number}`
  | "lock";

export interface ModuleCountTimingProps {
  value?: number;
  from?: number;
  steps?: number;
  label?: string;
  stagger?: number;
}

export const DEFAULT_LABEL = "Scenes, every one snapped to a single grid";

const START = 10;
const FIRST_GAP = 4;
const LAST_GAP = 9;
const MORPH = 7;
const COL_DELAY = 0.7;
/** After its morph the figure takes this long more to recentre. */
const RECENTRE = 4;
const INTRO_AT = -8;
const INTRO_END = 6;
const LOCK_AT = 4;
const LOCK_END = 22;
const LABEL_AT = -6;
const WORD_RISE = 16;

/** The values the count steps through, easing out from `from` to `value`. */
export function countValues(value: number, from: number, steps: number) {
  const n = Math.max(1, Math.round(steps));
  const values: number[] = [];
  for (let k = 0; k <= n; k++) {
    const p = k / n;
    const eased = 1 - (1 - p) ** 2.4;
    const v = Math.round(from + (value - from) * eased);
    if (values.length === 0 || values[values.length - 1] !== v) {
      values.push(v);
    }
  }
  if (values[values.length - 1] !== Math.round(value)) {
    values.push(Math.round(value));
  }
  return values;
}

// `intro` fades the first value in; `step:<k>` shows value `k`, a chain
// lasting until the next value takes over. A step's cells morph over
// `morph`, each column `column` after the one before, and the figure
// recentres over `morph` + `recentre`. `lock` tightens the grid after the
// last value; the label words (`word:<k>`, a chain) rise in from just before
// the last value, each over its length.
export const moduleCountTimeline = defineTimeline<
  ModuleCountElementId,
  ModuleCountTimingProps
>(
  ({
    value = 48,
    from = 0,
    steps = 11,
    label = DEFAULT_LABEL,
    stagger = 3,
  }) => {
    const values = countValues(value, from, steps);
    const elements: TimelineElement<ModuleCountElementId>[] = [
      {
        id: "intro",
        lane: "Figure",
        label: "fade in",
        start: START + INTRO_AT,
        length: INTRO_END - INTRO_AT,
      },
    ];
    let at = START;
    const last = Math.max(1, values.length - 1);
    for (let k = 0; k < values.length; k++) {
      const p = k / last;
      const gap = FIRST_GAP + (LAST_GAP - FIRST_GAP) * p ** 1.6;
      elements.push({
        id: `step:${k}`,
        lane: "Figure",
        label: Math.round(values[k]).toLocaleString("en-US"),
        start: at,
        length: k < values.length - 1 ? gap : MORPH + RECENTRE,
        follows: k > 0 ? `step:${k - 1}` : "intro",
        beats: { morph: MORPH, recentre: RECENTRE, column: COL_DELAY },
      });
      at += gap;
    }
    const lastStep = elements[elements.length - 1].start;
    const lastId: ModuleCountElementId = `step:${values.length - 1}`;
    const labelAt = lastStep + LABEL_AT;
    // The label starts before the last value: it follows the latest element
    // already running by then.
    let leader: ModuleCountElementId = "intro";
    for (const e of elements) if (e.start <= labelAt) leader = e.id;
    const words = label ? label.split(" ") : [];
    words.forEach((w, k) => {
      elements.push({
        id: `word:${k}`,
        lane: "Label",
        label: w,
        start: labelAt + k * stagger,
        length: WORD_RISE,
        follows: k > 0 ? `word:${k - 1}` : leader,
      });
    });
    // The lock's span is written as the difference of its two ends, so its
    // end lands on `lastStep + LOCK_END` exactly.
    elements.push({
      id: "lock",
      lane: "Grid",
      label: "lock",
      start: lastStep + LOCK_AT,
      length: lastStep + LOCK_END - (lastStep + LOCK_AT),
      follows: lastId,
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
