import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The name rising letter by letter, its tail tucking into the first letter
// from the last letter back, the first letter docking into the corner as a
// bug, and the headline rising word by word. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type BugDockElementId =
  | `enter:${number}`
  | `tuck:${number}`
  | "dock"
  | `word:${number}`;

export interface BugDockTimingProps {
  name?: string;
  headline?: string;
  /** Frame the name starts tucking into its first letter. */
  tuckAt?: number;
  /** Frames between words of the headline. */
  stagger?: number;
}

export const DEFAULT_NAME = "remocn";
export const DEFAULT_HEADLINE = "Playing on every screen you ship.";
export const DEFAULT_STAGGER = 2.5;

const ENTER_AT = 0;
const ENTER_GAP = 2;
const ENTER = 18;
export const TUCK_AT = 34;
const TUCK_STEP = 6;
const TUCK_DUR = 11;
/** The dock starts this long after the last tuck lands. */
const DOCK_GAP = 2;
const DOCK_DUR = 30;
const HEAD_DELAY = 14;
const WORD = 16;

/** The name as shown, and whether it is the remocn logo. */
export function nameOf(name: string) {
  const clean = name.trim() || "remocn";
  return { clean, logo: clean.toLowerCase() === "remocn" };
}

/** The letters that tuck into the first one. */
export function tailOf(clean: string, logo: boolean) {
  return Array.from(logo ? "emocn" : clean.slice(1));
}

export function wordsOf(headline: string) {
  return headline.split(/\s+/).filter(Boolean);
}

// `enter:<i>` rises letter `i` of the name (0 is the first letter or mark),
// each following the one before. `tuck:<k>` folds tail letter `k` away, the
// last letter first, each following the one after it. `dock` carries the
// first letter into the corner, following the last tuck (tail letter 0).
// `word:<i>` rises headline word `i`, the first following the dock.
export const bugDockTimeline = defineTimeline<
  BugDockElementId,
  BugDockTimingProps
>(
  ({
    name = DEFAULT_NAME,
    headline = DEFAULT_HEADLINE,
    tuckAt = TUCK_AT,
    stagger = DEFAULT_STAGGER,
  }) => {
    const { clean, logo } = nameOf(name);
    const tail = tailOf(clean, logo);
    const letters = [logo ? "r" : Array.from(clean)[0], ...tail];
    const n = tail.length;
    const tuckEnd = tuckAt + (n - 1) * TUCK_STEP + TUCK_DUR;
    const dockAt = tuckEnd + DOCK_GAP;
    const headAt = dockAt + HEAD_DELAY;
    const words = wordsOf(headline);
    const elements: TimelineElement<BugDockElementId>[] = [
      ...letters.map(
        (ch, i): TimelineElement<BugDockElementId> => ({
          id: `enter:${i}`,
          lane: "Name",
          label: ch,
          start: ENTER_AT + i * ENTER_GAP,
          length: ENTER,
          follows: i > 0 ? `enter:${i - 1}` : undefined,
        }),
      ),
    ];
    for (let order = 0; order < n; order++) {
      const k = n - 1 - order;
      elements.push({
        id: `tuck:${k}`,
        lane: "Tuck",
        label: tail[k],
        start: tuckAt + order * TUCK_STEP,
        length: TUCK_DUR,
        follows: order > 0 ? `tuck:${k + 1}` : undefined,
      });
    }
    elements.push({
      id: "dock",
      lane: "Dock",
      label: "dock",
      start: dockAt,
      length: DOCK_DUR,
      follows: n > 0 ? "tuck:0" : undefined,
    });
    words.forEach((w, i) => {
      elements.push({
        id: `word:${i}`,
        lane: "Headline",
        label: w,
        start: headAt + i * stagger,
        length: WORD,
        follows: i > 0 ? `word:${i - 1}` : "dock",
      });
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
