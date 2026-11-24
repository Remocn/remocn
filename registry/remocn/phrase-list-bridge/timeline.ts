import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The phrase rising in word by word and splitting apart, the search panel
// dealing its rows into the gap, the highlight stepping down to the picked
// row, the pick, the other rows falling away as the panel folds into a chip,
// and the phrase closing in around it. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type PhraseListBridgeElementId =
  | `word:${number}`
  | "split"
  | "panel"
  | `row:${number}`
  | "highlight"
  | `step:${number}`
  | "pick"
  | "exit"
  | "close";

export interface PhraseListBridgeTimingProps {
  left?: string;
  right?: string;
  items?: string[];
  pickedIndex?: number;
  stagger?: number;
}

export const DEFAULT_LEFT = "Browse through";
export const DEFAULT_RIGHT = "ready-made scenes";
export const DEFAULT_ITEMS = [
  "Zoom Blur",
  "Typewriter",
  "Inline Highlight",
  "Rolling Number",
  "Echo Stack",
  "Orbit Lock",
];
export const DEFAULT_PICKED = 2;

export const BEAT = {
  wordStep: 3,
  enter: 12,
  split: 24,
  panel: 27,
  deal: 33,
  dealSteps: [5, 4, 4, 3, 3, 3, 3, 3],
  hlLead: 9,
  hlSteps: [9, 7, 6, 5, 4, 4, 4],
  breath: 6,
  exitLen: 9,
  close: 6,
};

/** A word starts showing this long before its beat. */
const WORD_LEAD = -3;
/** A row's spring starts this long before it lands. */
const ROW_LEAD = -3;
/** The springs that split the phrase and close it settle in about this long. */
const SETTLE = 24;
/** The panel's spring, about as long. */
const PANEL = 24;
/** The highlight fades in over `HL_IN` either side of its start. */
const HL_LEAD = -3;
const HL_IN = 3;
/** The pick fills over `PICK_FILL`; the check draws from `CHECK_AT` over `CHECK`. */
const PICK_FILL = 5;
const CHECK_AT = 3;
const CHECK = 11;
/** The rows fall `EXIT_STEP` apart by distance (at most four steps). */
const EXIT_STEP = 1;
/** The panel folds into the chip from `MORPH_AT` over `MORPH`. */
const MORPH_AT = 1;
const MORPH = 14;
/** The rows exit this long after the pick. */
const EXIT_AFTER = 6;

/** The rows the panel shows: the items, at most eight, never none. */
export const rowsOf = (items: string[]) =>
  (items.length > 0 ? items : ["Zoom Blur"]).slice(0, 8);

/** The picked row, clamped to the rows. */
export const pickOf = (n: number, pickedIndex: number) =>
  Math.max(0, Math.min(n - 1, pickedIndex));

// `word:<k>` is word `k` of the phrase, left half then right, in a chain.
// `split` and `close` are the phrase moving apart and back together; `panel`
// is the panel popping in, `row:<i>` row `i` landing (a chain), `highlight`
// the highlight fading in, `step:<i>` its step onto row `i` (a chain),
// `pick` the pick and its check, `exit` the other rows falling and the
// panel folding. Each of pick, exit and close follows the one before it.
export const phraseListBridgeTimeline = defineTimeline<
  PhraseListBridgeElementId,
  PhraseListBridgeTimingProps
>(
  ({
    left = DEFAULT_LEFT,
    right = DEFAULT_RIGHT,
    items = DEFAULT_ITEMS,
    pickedIndex = DEFAULT_PICKED,
    stagger = BEAT.wordStep,
  }) => {
    const rows = rowsOf(items);
    const n = rows.length;
    const pick = pickOf(n, pickedIndex);

    const landAt: number[] = [];
    let acc = BEAT.deal;
    for (let i = 0; i < n; i++) {
      landAt.push(acc);
      acc += BEAT.dealSteps[Math.min(i, BEAT.dealSteps.length - 1)];
    }
    const hlStart = landAt[n - 1] + BEAT.hlLead;
    const hlAt: number[] = [hlStart];
    for (let i = 1; i <= pick; i++) {
      hlAt.push(
        hlAt[i - 1] + BEAT.hlSteps[Math.min(i - 1, BEAT.hlSteps.length - 1)],
      );
    }
    const pickAt = hlAt[pick] + BEAT.breath;
    const exitAt = pickAt + EXIT_AFTER;
    const closeAt = exitAt + BEAT.close;

    const leftWords = left.split(" ").filter(Boolean);
    const rightWords = right.split(" ").filter(Boolean);
    const rightAt = leftWords.length * stagger;
    const words = [
      ...leftWords.map((w, i) => ({ w, at: i * stagger })),
      ...rightWords.map((w, i) => ({ w, at: rightAt + i * stagger })),
    ];

    const elements: TimelineElement<PhraseListBridgeElementId>[] = [
      ...words.map(
        ({ w, at }, k): TimelineElement<PhraseListBridgeElementId> => ({
          id: `word:${k}`,
          lane: "Phrase",
          label: w,
          start: at,
          length: BEAT.enter,
          follows: k > 0 ? `word:${k - 1}` : undefined,
          beats: { lead: WORD_LEAD },
        }),
      ),
      {
        id: "split",
        lane: "Phrase moves",
        label: "split",
        start: BEAT.split,
        length: SETTLE,
      },
      {
        id: "panel",
        lane: "Panel",
        label: "panel",
        start: BEAT.panel,
        length: PANEL,
      },
      ...rows.map(
        (label, i): TimelineElement<PhraseListBridgeElementId> => ({
          id: `row:${i}`,
          lane: "Rows",
          label,
          start: landAt[i],
          length: i < n - 1 ? landAt[i + 1] - landAt[i] : BEAT.hlLead,
          follows: i > 0 ? `row:${i - 1}` : undefined,
          beats: { lead: ROW_LEAD },
        }),
      ),
      {
        id: "highlight",
        lane: "Highlight",
        label: "highlight",
        start: hlStart,
        length: HL_IN,
        follows: `row:${n - 1}`,
        beats: { lead: HL_LEAD, in: HL_IN },
      },
      ...hlAt.slice(1).map(
        (at, j): TimelineElement<PhraseListBridgeElementId> => ({
          id: `step:${j + 1}`,
          lane: "Highlight",
          label: rows[j + 1],
          start: hlAt[j] + 1,
          length: at - hlAt[j],
          follows: j > 0 ? `step:${j}` : "highlight",
        }),
      ),
      {
        id: "pick",
        lane: "Pick",
        label: rows[pick],
        start: pickAt,
        length: EXIT_AFTER,
        follows: pick > 0 ? `step:${pick}` : "highlight",
        beats: { fill: PICK_FILL, checkAt: CHECK_AT, check: CHECK },
      },
      {
        id: "exit",
        lane: "Panel",
        label: "fold",
        start: exitAt,
        length: BEAT.close,
        follows: "pick",
        beats: {
          step: EXIT_STEP,
          row: BEAT.exitLen,
          morphAt: MORPH_AT,
          morph: MORPH,
        },
      },
      {
        id: "close",
        lane: "Phrase moves",
        label: "close",
        start: closeAt,
        length: SETTLE,
        follows: "exit",
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
