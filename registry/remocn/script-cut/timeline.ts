import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The script row rising in word by word, each cut opening between two
// shots, and each shot lighting in the row and flying up to fill the frame.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The shots
// spread over the clip, so their pace follows its length. The ids are
// public: a saved `timing` prop refers to them.

export type ScriptCutElementId = "row" | `cut:${number}` | `shot:${number}`;

export interface ScriptCutTimingProps {
  shots?: string[];
  hold?: number;
  stagger?: number;
}

export const DEFAULT_SHOTS = [
  "We wrote the launch as one line,",
  "cut it twice,",
  "and every piece became a shot.",
];

export const splitWords = (s: string) => s.split(" ").filter(Boolean);

/** The shots shown: the defaults when the list is empty. */
export const shotsOf = (shots: string[]) =>
  shots.length > 0 ? shots : DEFAULT_SHOTS;

const ROW_STEP = 0.6;
const ROW_IN = 16;
const CUT_AT = 14;
const CUT_DUR = 14;
const CUT_STAGGER = 4;
const FIRST_SHOT = 36;
const FLY = 24;
const FLY_STAGGER = 2;
const EXIT_STEP = 0.5;
const EXIT = 10;
const HANDOFF = 8;
const HOLD = 32;

// In the row, word `i` rises from `i * step` over `word`. `cut:<b>` opens
// the cut after shot `b`. In `shot:<k>` the shot's words light from `lit` to
// `litEnd` and fade to spent from `spent` to `spentEnd`; its word `i` flies
// up from `handoff + i * stagger` over `fly`, and leaves when the next shot
// starts, from `i * exitStep` over `exit`. The cuts and the shots each form
// a chain.
export const scriptCutTimeline = defineTimeline<
  ScriptCutElementId,
  ScriptCutTimingProps
>(
  (
    { shots = DEFAULT_SHOTS, hold = HOLD, stagger = FLY_STAGGER },
    { length },
  ) => {
    const list = shotsOf(shots);
    const shotWords = list.map(splitWords);
    const n = list.length;
    const tokens = shotWords.reduce((sum, ws) => sum + ws.length, 0);
    const span = length;
    const lastLen = (k: number) =>
      FLY + stagger * Math.max(0, shotWords[k].length - 1);
    const period =
      n > 1
        ? Math.min(
            84,
            Math.max(34, (span - FIRST_SHOT - lastLen(n - 1) - hold) / (n - 1)),
          )
        : 0;
    const shotAt = (k: number) => FIRST_SHOT + k * period;
    const elements: TimelineElement<ScriptCutElementId>[] = [
      {
        id: "row",
        lane: "Script",
        label: "Script",
        start: 0,
        length: Math.max(0, tokens - 1) * ROW_STEP + ROW_IN,
        beats: { step: ROW_STEP, word: ROW_IN },
      },
    ];
    for (let b = 0; b < n - 1; b++) {
      elements.push({
        id: `cut:${b}`,
        lane: "Cuts",
        label: `Cut ${b + 1}`,
        start: CUT_AT + b * CUT_STAGGER,
        length: CUT_DUR,
        follows: b > 0 ? `cut:${b - 1}` : undefined,
      });
    }
    list.forEach((shot, k) => {
      elements.push({
        id: `shot:${k}`,
        lane: "Shots",
        label: shot,
        start: shotAt(k),
        length: k + 1 < n ? period : lastLen(k),
        follows: k > 0 ? `shot:${k - 1}` : undefined,
        beats: {
          lit: -4,
          litEnd: 2,
          spent: 22,
          spentEnd: 40,
          handoff: k > 0 ? HANDOFF : 0,
          stagger,
          fly: FLY,
          exitStep: EXIT_STEP,
          exit: EXIT,
        },
      });
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
