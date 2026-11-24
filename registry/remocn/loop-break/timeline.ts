import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The loop played over and over, faster each pass: the rows rise in word by
// word, hold, and rewind from the bottom up; on the last pass the closing row
// breaks the loop and the fix rises in its place, then the old rows dim.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. A
// composition shorter than 215 frames squeezes the whole loop by `k`. The ids
// are public: a saved `timing` prop refers to them.

export type LoopBreakElementId =
  | `take:${number}:${number}`
  | `rewind:${number}:${number}`
  | "fix"
  | "dim";

export interface LoopBreakTimingProps {
  loop?: string[];
  fix?: string;
  passes?: number;
  /** Frames between words as a line rises in. */
  stagger?: number;
  /** Frames a pass holds before it rewinds. */
  hold?: number;
  speed?: number;
}

export const DEFAULT_LOOP = ["Render the cut.", "Spot a typo.", "Start over."];
export const DEFAULT_FIX = "Change one word. Done.";
const PASSES = 3;
export const WORD_STAGGER = 3;
const START = 6;
export const ENTER = 14;
const ROW_GAP = 15;
const HOLD = 16;
export const REWIND = 7;
export const REWIND_WORD = 1.5;
const REWIND_ROW = 4;
const TEMPO = 0.6;
const MIN_TEMPO = 0.4;
const BREAK_PAUSE = 12;
const FIX_TEMPO = 1.25;
const DIM_AFTER = 6;
const DIM_LEN = 12;
/** The loop is timed for a composition this long; a shorter one squeezes it. */
const BASE = 215;

/** The loop's rows: a single row gets "Start over." to loop back on. */
export const loopRows = (loop: string[]) =>
  loop.length >= 2 ? loop : [...loop, "Start over."];

const wordCount = (s: string) => (s.match(/\S+/g) ?? []).length;

/** One row rising in on one pass, and the rewind that takes it away. */
export interface LoopBreakTake {
  row: number;
  fix: boolean;
  at: number;
  tempo: number;
  back: number;
  backTempo: number;
  /** The rise's element. */
  id: LoopBreakElementId;
  /** The rewind's element; none on the last pass. */
  rewind?: LoopBreakElementId;
}

/** Every take in the order the loop plays them, and where the loop ends. */
export function loopBreakPlan({
  loop = DEFAULT_LOOP,
  fix = DEFAULT_FIX,
  passes: passCount = PASSES,
  stagger = WORD_STAGGER,
  hold = HOLD,
}: LoopBreakTimingProps) {
  const rows = loopRows(loop);
  const rowCount = rows.length;
  const words = [...rows.map(wordCount), wordCount(fix)];
  const passes = Math.max(2, Math.round(passCount));
  const takes: LoopBreakTake[] = [];
  let cursor = START;
  let fixAt = 0;
  for (let p = 0; p < passes; p++) {
    const s = Math.max(MIN_TEMPO, TEMPO ** p);
    const final = p === passes - 1;
    const pass: LoopBreakTake[] = [];
    for (let r = p === 0 ? 0 : 1; r < rowCount; r++) {
      const fix = final && r === rowCount - 1;
      if (fix) {
        cursor += BREAK_PAUSE;
        fixAt = cursor;
      }
      const take: LoopBreakTake = {
        row: r,
        fix,
        at: cursor,
        tempo: fix ? FIX_TEMPO : s,
        back: Number.POSITIVE_INFINITY,
        backTempo: s,
        id: fix ? "fix" : `take:${p}:${r}`,
      };
      pass.push(take);
      takes.push(take);
      if (r < rowCount - 1) cursor += ROW_GAP * s;
    }
    const last = pass[pass.length - 1];
    if (final) {
      cursor =
        last.at +
        (ENTER + stagger * Math.max(0, words[rowCount] - 1)) * last.tempo;
      break;
    }
    cursor =
      last.at +
      (ENTER + stagger * Math.max(0, words[last.row] - 1)) * s +
      hold * s;
    const back = [...pass].reverse().filter((tk) => tk.row > 0);
    back.forEach((tk, i) => {
      tk.back = cursor + i * REWIND_ROW * s;
      tk.rewind = `rewind:${p}:${tk.row}`;
    });
    const lastBack = back[back.length - 1];
    cursor =
      lastBack.back +
      (REWIND + REWIND_WORD * Math.max(0, words[lastBack.row] - 1)) * s +
      2;
  }
  return { takes, fixAt, end: cursor, rows, words };
}

// A take rises in over its words, a rewind sinks them; each carries its
// `tempo` (frames per word step, squeeze included), which `stretch` scales
// with the rest. The whole loop is one chain in playing order, so moving one
// take moves everything after it. The plan is counted on the unsqueezed
// clock and every number is multiplied by `k` into scene frames; `k` comes
// from the composition length, `length / speed`.
export const loopBreakTimeline = defineTimeline<
  LoopBreakElementId,
  LoopBreakTimingProps
>((props, { length }) => {
  const { fix = DEFAULT_FIX, stagger = WORD_STAGGER, speed = 1 } = props;
  const durationInFrames = speed > 0 ? length / speed : BASE;
  const k = Math.min(1, durationInFrames / BASE);
  const plan = loopBreakPlan(props);
  const { rows, words } = plan;
  const elements: TimelineElement<LoopBreakElementId>[] = [];
  for (const tk of plan.takes) {
    const n = tk.fix ? words[rows.length] : words[tk.row];
    elements.push({
      id: tk.id,
      lane: `Row ${tk.row + 1}`,
      label: tk.fix ? fix : rows[tk.row],
      start: tk.at * k,
      length: (ENTER + stagger * Math.max(0, n - 1)) * tk.tempo * k,
      beats: { tempo: tk.tempo * k },
    });
    if (tk.rewind) {
      elements.push({
        id: tk.rewind,
        lane: `Row ${tk.row + 1}`,
        label: `rewind ${rows[tk.row]}`,
        start: tk.back * k,
        length: (REWIND + REWIND_WORD * Math.max(0, n - 1)) * tk.backTempo * k,
        beats: { tempo: tk.backTempo * k },
      });
    }
  }
  elements.push({
    id: "dim",
    lane: "Dim",
    label: "dim the loop",
    start: (plan.end + DIM_AFTER) * k,
    length: DIM_LEN * k,
  });
  elements.sort((a, b) => a.start - b.start);
  return elements.map((e, i) =>
    i > 0 ? { ...e, follows: elements[i - 1].id } : e,
  );
});
