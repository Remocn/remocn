import { defineTimeline } from "@/lib/remocn/timeline";

// Hard cuts from act to act: each word performs its meaning (stretches,
// splits, drops heavy, rushes in, rebuilds from strokes), and the last one
// holds as a poster. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type WordActsElementId = `act:${number}`;

export type WordActKind = "stretch" | "split" | "heavy" | "faster" | "rebuilt";

export interface WordActCue {
  word: string;
  act: WordActKind;
  frames?: number;
}

export interface WordActsTimingProps {
  acts?: { word?: string; act: WordActKind; frames?: number }[];
  words?: string[];
  hold?: number;
}

export const DEFAULT_FRAMES: Record<WordActKind, number> = {
  stretch: 26,
  split: 26,
  heavy: 28,
  faster: 22,
  rebuilt: 42,
};

export const DEFAULT_ACTS: WordActCue[] = [
  { word: "stretch", act: "stretch" },
  { word: "split", act: "split" },
  { word: "heavy", act: "heavy" },
  { word: "faster", act: "faster" },
  { word: "rebuilt", act: "rebuilt" },
];

const DEFAULT_HOLD = 32;

// The moments inside each kind of act, from the act's cut.
const ACT_BEATS: Record<WordActKind, Record<string, number>> = {
  // The pull, from `pullAt` over `pull` frames.
  stretch: { pullAt: 2, pull: 15 },
  // The cut line draws, the halves open after it, the line fades.
  split: { drawAt: 2, draw: 6, open: 11, fadeAt: 9, fade: 6 },
  // The fall lands at `land`; the ring after it is a spring.
  heavy: { land: 9 },
  // The rush snaps at `snap`, settles over `settle`, rocks back over `rock`
  // (peaking at `rockPeak`).
  faster: { snap: 7, settle: 5, rockPeak: 2, rock: 6 },
  // Strokes fly out from `out0` to `out1` and back from `in0` to `in1`, each
  // later by its order times the staggers; the guides fade around `in1`.
  rebuilt: {
    out0: 5,
    out1: 16,
    outStagger: 3,
    in0: 22,
    in1: 36,
    inStagger: 5,
    inTrim: 4,
    guidesOut: 6,
  },
};

// `act:<i>` is act `i`, from its cut until the next one; the last runs on
// through `hold`. Each act follows the one before it. The beats time the
// act's own motion, so stretching an act slows the act down.
export const wordActsTimeline = defineTimeline<
  WordActsElementId,
  WordActsTimingProps
>(({ acts = DEFAULT_ACTS, words, hold = DEFAULT_HOLD }) => {
  let start = 0;
  return acts.map((a, i) => {
    const len = a.frames ?? DEFAULT_FRAMES[a.act];
    const last = i === acts.length - 1;
    const element = {
      id: `act:${i}` as const,
      lane: "Acts",
      label: words?.[i] ?? a.word ?? a.act,
      start,
      length: len + (last ? hold : 0),
      follows: i > 0 ? (`act:${i - 1}` as const) : undefined,
      beats: ACT_BEATS[a.act],
    };
    start += len;
    return element;
  });
});
