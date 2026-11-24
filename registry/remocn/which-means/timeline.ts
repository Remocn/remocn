import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The label and the name rise in, the first step is written beside them, and
// each next step is written under the hinge while the one before rises into
// the cause slot and the one before that leaves. Frames on the 30 fps scene
// timeline, after `delay` and `speed`; the steps after the second spread over
// the clip. The ids are public: a saved `timing` prop refers to them.

export type WhichMeansElementId = "name" | "label" | `step:${number}`;

export interface WhichMeansTimingProps {
  name?: string;
  label?: string;
  steps?: string[];
  stagger?: number;
  hold?: number;
}

export const DEFAULT_NAME = "Live preview";
export const DEFAULT_LABEL = "New";
export const DEFAULT_STEPS = [
  "Every edit shows up as you type,",
  "you catch the typo before you render,",
  "the first render is the one you ship.",
];

const NAME_AT = 0;
const NAME_STEP = 3;
const NAME_RISE = 16;
const LABEL_AT = 4;
const LABEL_IN = 14;
const FIRST_AT = 12;
const FIRST_READ = 36;
const WORD_STAGGER = 2;
const WORD_IN = 12;
const CENTER_TO_SLOT = 14;
const EXIT = 11;
const RISE = 18;
const WRITE_AFTER_RISE = 13;
const TAIL = 76;

export const splitWords = (s: string) => s.split(/\s+/).filter(Boolean);
export const stripEnd = (s: string) => s.replace(/[\s,.;:…]+$/u, "");

/** The steps shown, without their end punctuation. */
export function stepsOf(steps: string[]) {
  return (steps.length > 0 ? steps : DEFAULT_STEPS).map(stripEnd);
}

// `label` rises in. `name` rises word by word, `step` apart (the step counts
// two per line of the measured name), each over `rise`. `step:<k>` is step
// `k`: its words are written from `write`, `stagger` apart, each over
// `wordIn`; the last step lights up `glow` frames after `glowAt`, over
// `glowIn`. Each step also moves the steps before it: step 1 slots the first
// one into the cause over `slot`, step 2 on rises the one before over `push`,
// both dim it from `dimAt` over `dim` and turn its comma into a full stop from
// `dotAt` over `dotOut`, and an ellipsis fades in from `push + ellipsisAt`
// over `ellipsisIn`. Step 2 on sends the step two back out over `exit` and
// dips the hinge (in over `dip`, back from `push + hingeBack` to
// `push + hingeBackEnd`); step 1 brings the hinge in over `hingeIn`. The
// steps form a chain. A lone step still dims `read` frames in, where the
// second would have come.
export const whichMeansTimeline = defineTimeline<
  WhichMeansElementId,
  WhichMeansTimingProps
>(
  (
    {
      name = DEFAULT_NAME,
      label = DEFAULT_LABEL,
      steps = DEFAULT_STEPS,
      stagger = WORD_STAGGER,
      hold = TAIL,
    },
    { length: span },
  ) => {
    const list = stepsOf(steps);
    const n = list.length;
    const nameCount = splitWords(name).length;
    const fixed = FIRST_AT + FIRST_READ + hold;
    const period =
      n > 2
        ? Math.min(72, Math.max(44, (span - fixed - 10) / (n - 2)))
        : Math.max(44, span - fixed);
    const stepAt = (k: number) =>
      k <= 0 ? FIRST_AT : FIRST_AT + FIRST_READ + (k - 1) * period;

    const elements: TimelineElement<WhichMeansElementId>[] = [
      {
        id: "name",
        lane: "Name",
        label: name,
        start: NAME_AT,
        length: Math.max(0, nameCount - 1) * NAME_STEP + NAME_RISE,
        beats: { step: NAME_STEP, rise: NAME_RISE },
      },
    ];
    if (label) {
      elements.push({
        id: "label",
        lane: "Label",
        label,
        start: NAME_AT + LABEL_AT,
        length: LABEL_IN,
      });
    }
    list.forEach((step, k) => {
      const write = k === 0 ? 0 : k === 1 ? 4 : WRITE_AFTER_RISE;
      const words = splitWords(step).length;
      elements.push({
        id: `step:${k}`,
        lane: "Steps",
        label: step,
        start: stepAt(k),
        length:
          k + 1 < n
            ? stepAt(k + 1) - stepAt(k)
            : write + Math.max(0, words - 1) * stagger + WORD_IN,
        follows: k > 0 ? `step:${k - 1}` : undefined,
        beats: {
          write,
          stagger,
          wordIn: WORD_IN,
          glowAt: WRITE_AFTER_RISE,
          glow: 8,
          glowIn: 16,
          slot: CENTER_TO_SLOT,
          push: RISE,
          read: FIRST_READ,
          dimAt: k <= 1 ? 2 : 4,
          dim: 14,
          dotAt: k <= 1 ? 0 : 4,
          dotOut: 10,
          ellipsisAt: -4,
          ellipsisIn: 10,
          exit: EXIT,
          dip: 5,
          hingeBack: -4,
          hingeBackEnd: 6,
          hingeIn: 12,
        },
      });
    });
    return elements;
  },
);
