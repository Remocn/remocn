import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line scrolling in across the dot matrix and settling, the highlight
// word flipping into the gradient column by column, and the slow camera
// settle over both. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type LedTickerElementId = "camera" | "scroll" | "highlight";

export interface LedTickerTimingProps {
  text?: string;
  highlightWord?: string;
  /** Frames the line takes to scroll in and settle. */
  scroll?: number;
}

export const DEFAULT_TEXT = "remocn is live";
export const DEFAULT_HIGHLIGHT = "live";
const ENTER = 2;
export const SCROLL_DUR = 54;
/** Frames between one column of the highlight word flipping and the next. */
const HOT_STEP = 0.8;
/** Frames one column takes to dip and come back in the gradient. */
const HOT_DUR = 6;

/** Rows of the dot-matrix font. */
export const ROWS = 7;

const GLYPHS: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["###", ".#.", ".#.", ".#.", ".#.", ".#.", "###"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "#.#.#", ".#.#."],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["#####", "...#.", "..#..", "...#.", "....#", "#...#", ".###."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  ".": [".", ".", ".", ".", ".", ".", "#"],
  ",": ["..", "..", "..", "..", "..", ".#", "#."],
  "!": ["#", "#", "#", "#", "#", ".", "#"],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "-": ["....", "....", "....", "####", "....", "....", "...."],
  ":": [".", ".", "#", ".", ".", "#", "."],
  "'": ["#", "#", ".", ".", ".", ".", "."],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  "/": ["....#", "...#.", "...#.", "..#..", ".#...", ".#...", "#...."],
  "%": ["##..#", "##..#", "...#.", "..#..", ".#...", "#..##", "#..##"],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  " ": ["...", "...", "...", "...", "...", "...", "..."],
};

// The remocn.dev "R" mark on the 7-row grid: top bar with no upper stem,
// the bowl, and the stem + leg below. Replaces the R when the text opens
// with the word "remocn".
const MARK_R = [
  "#####.",
  ".....#",
  ".....#",
  ".####.",
  "#..#..",
  "#...#.",
  "#....#",
];

interface Cell {
  c: number;
  r: number;
  hot: number;
}

export function tickerLayout(text: string, highlightWord?: string) {
  const chars = text.toUpperCase().split("");
  const target = highlightWord?.trim().toUpperCase();
  const brand = /^REMOCN(\s|$)/.test(chars.join(""));
  const cells: Cell[] = [];
  let col = 0;
  let wordStart = 0;
  let hotRange: [number, number] | null = null;
  let word = "";
  const closeWord = (end: number) => {
    if (!hotRange && target && word === target) hotRange = [wordStart, end];
    word = "";
  };
  chars.forEach((ch, i) => {
    const g = brand && i === 0 ? MARK_R : (GLYPHS[ch] ?? GLYPHS[" "]);
    if (ch === " ") {
      closeWord(col - 2);
    } else if (word === "") {
      wordStart = col;
      word = ch;
    } else {
      word += ch;
    }
    const gw = g[0].length;
    for (let r = 0; r < ROWS; r++) {
      for (let x = 0; x < gw; x++) {
        if (g[r][x] === "#") cells.push({ c: col + x, r, hot: 0 });
      }
    }
    col += gw + (i < chars.length - 1 ? 1 : 0);
  });
  closeWord(col - 1);
  const range = hotRange as [number, number] | null;
  if (range) {
    for (const cell of cells) {
      if (cell.c >= range[0] && cell.c <= range[1]) {
        cell.hot = cell.c - range[0] + 1;
      }
    }
  }
  return {
    cells,
    width: Math.max(1, col),
    hotWidth: range ? range[1] - range[0] + 1 : 0,
  };
}

// `scroll` carries the line in from the right. `highlight` flips the
// highlight word's columns `step` apart, each over `flip`. `camera` eases the
// slight zoom out over the whole animation, 40 frames past the highlight.
export const ledTickerTimeline = defineTimeline<
  LedTickerElementId,
  LedTickerTimingProps
>(
  ({
    text = DEFAULT_TEXT,
    highlightWord = DEFAULT_HIGHLIGHT,
    scroll = SCROLL_DUR,
  }): TimelineElement<LedTickerElementId>[] => {
    const { hotWidth } = tickerLayout(text, highlightWord);
    const hotStart = ENTER + scroll + 14;
    const total = hotStart + hotWidth * HOT_STEP + HOT_DUR + 40;
    return [
      {
        id: "camera",
        lane: "Camera",
        label: "camera settles",
        start: 0,
        length: total,
      },
      {
        id: "scroll",
        lane: "Line",
        label: text,
        start: ENTER,
        length: scroll,
      },
      {
        id: "highlight",
        lane: "Line",
        label: highlightWord,
        start: hotStart,
        length: hotWidth * HOT_STEP + HOT_DUR,
        follows: "scroll",
        beats: { step: HOT_STEP, flip: HOT_DUR },
      },
    ];
  },
);
