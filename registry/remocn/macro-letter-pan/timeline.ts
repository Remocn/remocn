import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The close-ups drifting along the word one letter pair after another, the
// camera pulling back to the full line, the word taking the accent with the
// period popping in, and the final hold. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type MacroLetterPanElementId =
  | `shot:${number}`
  | "pull"
  | "accent"
  | "hold";

export interface MacroLetterPanTimingProps {
  line?: string;
  word?: string;
  firstShot?: number;
  maxShots?: number;
  pullLen?: number;
  /**
   * A portrait frame frames one letter per close-up instead of two. Not a
   * prop of the component: it passes it from the frame's size.
   */
  portrait?: boolean;
}

export const BEAT = {
  decay: 0.8,
  minShot: 6,
  settle: 3,
  pullLen: 30,
  accentAt: 16,
  hold: 42,
};

export const DEFAULT_LINE = "Ready to launch.";
export const DEFAULT_WORD = "launch";

/** The close-ups: when each starts, how long it holds, which letter it frames first. */
export function macroShots(
  targetLength: number,
  unit: number,
  firstShot: number,
  maxShots: number,
) {
  const nShots = Math.max(1, Math.min(maxShots, targetLength - unit + 1));
  const out: { start: number; len: number; from: number }[] = [];
  let t = 0;
  const span = Math.max(0, targetLength - unit);
  for (let k = 0; k < nShots; k++) {
    const len = Math.max(BEAT.minShot, Math.round(firstShot * BEAT.decay ** k));
    const from = nShots === 1 ? 0 : Math.round((k * span) / (nShots - 1));
    out.push({ start: t, len, from });
    t += len;
  }
  return out;
}

/** The word the close-ups travel along: `word` when the line has it. */
export function macroTarget(line: string, word: string) {
  const found = word ? line.indexOf(word) : -1;
  const text = found >= 0 ? line : word || line;
  const ws = found >= 0 ? found : 0;
  const we = ws + (word ? word.length : text.length);
  return { text, ws, we, target: text.slice(ws, we) };
}

// `shot:<k>` is close-up `k`, a chain; its `settle` beat is the blur clearing
// after the cut. The pull-back follows the last shot; its `dof`, `revealAt`
// and `reveal` beats time the depth of field and the line fading in. The
// accent (with the period's pop `dot` frames in) and the slow hold push
// follow the pull.
export const macroLetterPanTimeline = defineTimeline<
  MacroLetterPanElementId,
  MacroLetterPanTimingProps
>(
  ({
    line = DEFAULT_LINE,
    word = DEFAULT_WORD,
    firstShot = 15,
    maxShots = 6,
    pullLen = BEAT.pullLen,
    portrait = false,
  }) => {
    const { target } = macroTarget(line, word);
    const unit = portrait ? 1 : 2;
    const shots = macroShots(target.length, unit, firstShot, maxShots);
    const pullStart =
      shots[shots.length - 1].start + shots[shots.length - 1].len;
    const elements: TimelineElement<MacroLetterPanElementId>[] = [
      ...shots.map(
        (s, k): TimelineElement<MacroLetterPanElementId> => ({
          id: `shot:${k}`,
          lane: "Close-ups",
          label: target.slice(s.from, s.from + unit),
          start: s.start,
          length: s.len,
          follows: k > 0 ? `shot:${k - 1}` : undefined,
          beats: { settle: BEAT.settle },
        }),
      ),
      {
        id: "pull",
        lane: "Camera",
        label: "pull back",
        start: pullStart,
        length: pullLen,
        follows: `shot:${shots.length - 1}`,
        beats: { dof: 16, revealAt: 4, reveal: 16 },
      },
      {
        id: "accent",
        lane: "Accent",
        label: word || line,
        start: pullStart + BEAT.accentAt,
        length: 9,
        follows: "pull",
        beats: { dot: 3 },
      },
      {
        id: "hold",
        lane: "Camera",
        label: "hold",
        start: pullStart + pullLen - 6,
        length: BEAT.hold + 6,
        follows: "pull",
      },
    ];
    return elements;
  },
);
