import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line fades up, then each edit selects its text, holds the selection
// and types the new words over it key by key. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type SelectReplaceElementId =
  | "intro"
  | `select:${number}`
  | `type:${number}`;

export interface SelectReplaceEditSpec {
  /** Text to select; the first match in the current line is used. */
  from: string;
  /** Text typed in its place. */
  to: string;
}

export interface SelectReplaceTimingProps {
  text?: string;
  edits?: SelectReplaceEditSpec[];
  hold?: number;
}

export const DEFAULT_TEXT = "Draft it next week.";
export const DEFAULT_EDITS: SelectReplaceEditSpec[] = [
  { from: "Draft", to: "Ship" },
  { from: "next week", to: "tonight" },
];
export const SELECTED_HOLD = 9;
const INTRO = 14;
const CARET_IN = 4;
const SELECT = 12;
const TYPE_DELAY = 5;
const BETWEEN = 16;
const RECENTER = 11;

export interface Seg {
  text: string;
  serif: boolean;
}

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const plain = (segs: Seg[]) => segs.map((s) => s.text).join("");

/** Characters [a, b) of a styled line, keeping each run's style. */
export function slice(segs: Seg[], a: number, b: number): Seg[] {
  const out: Seg[] = [];
  let at = 0;
  for (const s of segs) {
    const chars = [...s.text];
    const lo = Math.max(a, at);
    const hi = Math.min(b, at + chars.length);
    if (hi > lo)
      out.push({
        text: chars.slice(lo - at, hi - at).join(""),
        serif: s.serif,
      });
    at += chars.length;
  }
  return out;
}

export function join(...lists: Seg[][]): Seg[] {
  const out: Seg[] = [];
  for (const s of lists.flat()) {
    if (!s.text) continue;
    const last = out[out.length - 1];
    if (last && last.serif === s.serif) last.text += s.text;
    else out.push({ ...s });
  }
  return out;
}

export interface Step {
  /** Index of the edit in `edits`; edits whose text isn't found are skipped. */
  index: number;
  start: number;
  before: Seg[];
  from: string;
  after: Seg[];
  to: string;
  selectAt: number;
  deleteAt: number;
  /** Frame each typed character lands on. */
  keys: number[];
  end: number;
}

/** Each edit that applies, in order: what it replaces and when. */
export function plan(
  text: string,
  edits: SelectReplaceEditSpec[],
  hold: number = SELECTED_HOLD,
) {
  const steps: Step[] = [];
  let line: Seg[] = [{ text, serif: false }];
  let t = INTRO + 2;
  edits.forEach((edit, k) => {
    const flat = plain(line);
    const idx = flat.indexOf(edit.from);
    if (idx < 0) return;
    const a = [...flat.slice(0, idx)].length;
    const b = a + [...edit.from].length;
    const before = slice(line, 0, a);
    const after = slice(line, b, Number.POSITIVE_INFINITY);
    const selectAt = t + CARET_IN;
    const deleteAt = selectAt + SELECT + hold;
    const keys: number[] = [];
    let at = deleteAt + TYPE_DELAY;
    [...edit.to].forEach((_, i) => {
      keys.push(at);
      at += 2 + Math.round(hash(k * 31 + i) * 2);
    });
    const end = keys.length ? keys[keys.length - 1] : deleteAt;
    steps.push({
      index: k,
      start: t,
      before,
      from: edit.from,
      after,
      to: edit.to,
      selectAt,
      deleteAt,
      keys,
      end,
    });
    line = join(before, [{ text: edit.to, serif: true }], after);
    t = end + BETWEEN;
  });
  return { steps, final: line, end: t - BETWEEN };
}

// `intro` fades the line up. `select:<k>` brings the caret to edit `k`'s
// text (`caretIn`), sweeps the selection over it (`select`) and holds it
// until the typing. `type:<k>` deletes the selection and types the new words,
// character `i` landing at beat `key:<i>`; the line re-centers over
// `recenter` frames after each change. Each element follows the one before.
export const selectReplaceTimeline = defineTimeline<
  SelectReplaceElementId,
  SelectReplaceTimingProps
>(({ text = DEFAULT_TEXT, edits = DEFAULT_EDITS, hold = SELECTED_HOLD }) => {
  const elements: TimelineElement<SelectReplaceElementId>[] = [
    { id: "intro", lane: "Line", label: "intro", start: 0, length: INTRO },
  ];
  let prev: SelectReplaceElementId = "intro";
  for (const s of plan(text, edits, hold).steps) {
    const beats: Record<string, number> = { recenter: RECENTER };
    s.keys.forEach((k, i) => {
      beats[`key:${i}`] = k - s.deleteAt;
    });
    elements.push(
      {
        id: `select:${s.index}`,
        lane: "Edits",
        label: `select "${s.from}"`,
        start: s.start,
        length: s.deleteAt - s.start,
        follows: prev,
        beats: { caretIn: CARET_IN, select: SELECT },
      },
      {
        id: `type:${s.index}`,
        lane: "Edits",
        label: s.to,
        start: s.deleteAt,
        length: s.end - s.deleteAt,
        follows: `select:${s.index}`,
        beats,
      },
    );
    prev = `type:${s.index}`;
  }
  return elements;
});
