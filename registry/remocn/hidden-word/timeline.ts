import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The sentence rising in line by line, the hidden word's letters lighting
// up, the rest of the sentence dimming, the sentence shrinking into a
// caption while the letters lift out into the display word, and the word
// settling. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type HiddenWordElementId =
  | "enter"
  | `light:${number}`
  | "dim"
  | "move"
  | `lift:${number}`
  | "settle";

export interface HiddenWordTimingProps {
  text?: string;
  word?: string;
  /** Frames between letters as they lift out of the sentence. */
  stagger?: number;
}

export const DEFAULT_TEXT =
  "Small teams make their launch film in code and post it by Friday.";
export const DEFAULT_WORD = "ship";
export const LIFT_STAGGER = 6;

// Timing, in frames at speed 1.
const ENTER = 22;
const LINE_STAGGER = 4;
const LIGHT_AT = 44;
const LIGHT_STAGGER = 7;
const LIGHT = 10;
const DIM_AT = 48;
const DIM = 28;
const LIFT_AT = 86;
const FLIGHT = 30;
const MOVE_AT = 82;
const MOVE = 40;
const SETTLE_GAP = 4;
const SETTLE = 14;

/** Pick the letters of `word` in order, spread as evenly as the sentence allows. */
export function findLetters(text: string[], word: string[]) {
  const n = word.length;
  const len = text.length;
  if (!n) return [];
  const cost = (j: number, i: number) => {
    const a = text[i];
    const b = word[j];
    if (a.toLowerCase() !== b.toLowerCase()) return Number.POSITIVE_INFINITY;
    const target = ((j + 0.5) / n) * len;
    return Math.abs(i - target) + (a === b ? 0 : len * 0.25);
  };
  // best[j][i]: cheapest placement of letters 0..j with letter j at index i.
  const best: number[][] = [];
  const from: number[][] = [];
  for (let j = 0; j < n; j++) {
    best.push(new Array<number>(len).fill(Number.POSITIVE_INFINITY));
    from.push(new Array<number>(len).fill(-1));
    let run = Number.POSITIVE_INFINITY;
    let runAt = -1;
    for (let i = 0; i < len; i++) {
      const c = cost(j, i);
      if (j === 0) best[j][i] = c;
      else if (runAt >= 0 && c < Number.POSITIVE_INFINITY) {
        best[j][i] = run + c;
        from[j][i] = runAt;
      }
      if (j > 0 && best[j - 1][i] < run) {
        run = best[j - 1][i];
        runAt = i;
      }
    }
  }
  let end = -1;
  best[n - 1].forEach((v, i) => {
    if (v < Number.POSITIVE_INFINITY && (end < 0 || v < best[n - 1][end]))
      end = i;
  });
  if (end < 0) {
    // Not every letter is in the sentence: match greedily, leave gaps as -1.
    let at = 0;
    return word.map((ch) => {
      for (let i = at; i < len; i++)
        if (text[i].toLowerCase() === ch.toLowerCase()) {
          at = i + 1;
          return i;
        }
      return -1;
    });
  }
  const out = new Array<number>(n).fill(-1);
  for (let j = n - 1, i = end; j >= 0; j--) {
    out[j] = i;
    i = from[j][i];
  }
  return out;
}

// `enter` is the sentence rising in, each line `stagger` frames after the
// one above, over `line`. `light:<j>` is letter `j` of the word lighting up
// in the sentence (only letters the sentence has); they chain. `dim` is the
// rest of the sentence dimming; `move` is the sentence shrinking into the
// caption. `lift:<j>` is letter `j` flying into the display word (a letter
// the sentence lacks fades in over its second `half`); they chain, and
// `settle`, the word taking the ink, follows the last.
export const hiddenWordTimeline = defineTimeline<
  HiddenWordElementId,
  HiddenWordTimingProps
>(({ text = DEFAULT_TEXT, word = DEFAULT_WORD, stagger = LIFT_STAGGER }) => {
  const target = Array.from(word);
  const picks = findLetters(Array.from(text), target);
  const out: TimelineElement<HiddenWordElementId>[] = [
    {
      id: "enter",
      lane: "Sentence",
      label: "sentence",
      start: 0,
      length: ENTER,
      beats: { line: ENTER, stagger: LINE_STAGGER },
    },
  ];
  let prev: HiddenWordElementId | undefined;
  target.forEach((ch, j) => {
    if (picks[j] < 0) return;
    const id: HiddenWordElementId = `light:${j}`;
    out.push({
      id,
      lane: "Light",
      label: ch,
      start: LIGHT_AT + j * LIGHT_STAGGER,
      length: LIGHT,
      follows: prev,
    });
    prev = id;
  });
  out.push(
    {
      id: "dim",
      lane: "Sentence",
      label: "dim",
      start: DIM_AT,
      length: DIM,
    },
    {
      id: "move",
      lane: "Sentence",
      label: "caption",
      start: MOVE_AT,
      length: MOVE,
    },
  );
  target.forEach((ch, j) => {
    out.push({
      id: `lift:${j}`,
      lane: "Word",
      label: ch,
      start: LIFT_AT + j * stagger,
      length: FLIGHT,
      follows: j > 0 ? `lift:${j - 1}` : undefined,
      beats: { half: FLIGHT * 0.5 },
    });
  });
  const lastLand = LIFT_AT + Math.max(0, target.length - 1) * stagger + FLIGHT;
  out.push({
    id: "settle",
    lane: "Word",
    label: "settle",
    start: lastLand + SETTLE_GAP,
    length: SETTLE,
    follows: target.length > 0 ? `lift:${target.length - 1}` : undefined,
  });
  return out.sort((a, b) => a.start - b.start);
});
