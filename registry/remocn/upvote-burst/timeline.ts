import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The leaderboard sheet and its rows land, the cursor glides to the upvote
// button and presses it, the count climbs past each rival above the product,
// then the board clears and the "Product of the day" badge stamps in. Frames
// on the 30 fps scene timeline, after `delay` and `speed`. The ids are public:
// a saved `timing` prop refers to them.

export type UpvoteBurstElementId =
  | "sheet"
  | `row:${number}`
  | "cursor"
  | "press"
  | "count"
  | `pass:${number}`
  | "clear"
  | "badge";

export type UpvoteBurstGlyph =
  | "play"
  | "wave"
  | "bolt"
  | "ring"
  | "grid"
  | "spark";

export interface UpvoteBurstProduct {
  name: string;
  tagline: string;
  topic: string;
  comments?: number;
  color?: string;
  glyph?: UpvoteBurstGlyph;
  src?: string;
}

export interface UpvoteBurstRival extends UpvoteBurstProduct {
  votes: number;
}

export interface UpvoteBurstTimingProps {
  product?: UpvoteBurstProduct;
  rivals?: UpvoteBurstRival[];
  startRank?: number;
  startVotes?: number;
  endVotes?: number;
}

export const DEFAULT_PRODUCT: UpvoteBurstProduct = {
  name: "remocn",
  tagline: "Launch videos from copy-paste Remotion components",
  topic: "Video",
  comments: 96,
};

const r = (
  name: string,
  tagline: string,
  topic: string,
  votes: number,
  comments: number,
  color: string,
): UpvoteBurstRival => ({ name, tagline, topic, votes, comments, color });

// biome-ignore format: compact data table
export const DEFAULT_RIVALS: UpvoteBurstRival[] = [
  r("Halcyon", "Meeting notes that draft your follow-ups", "Productivity", 1184, 142, "#C9A27A"),
  r("Quarry", "Query any database in plain English", "Developer tools", 962, 88, "#8EA6A0"),
  r("Orbitly", "The calendar for teams across time zones", "Productivity", 731, 64, "#9AA3C2"),
  r("Tessel", "Design tokens that sync straight to code", "Design tools", 548, 41, "#C2A0A8"),
  r("Fernway", "Expense reports that file themselves", "Fintech", 297, 23, "#A3B08A"),
];

const BEAT = {
  sheet: 0,
  rows: 4,
  cursor: 6,
  press: 18,
  countFrom: 24,
  countTo: 60,
  clearPad: 12,
};

// The count's easing, `Easing.bezier(0.65, 0, 0.35, 1)` from Remotion,
// written out so the schedule can find the frame the count passes each rival
// without importing Remotion. Same algorithm, same numbers.
const kSplineTableSize = 11;
const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);
const coefA = (a1: number, a2: number) => 1.0 - 3.0 * a2 + 3.0 * a1;
const coefB = (a1: number, a2: number) => 3.0 * a2 - 6.0 * a1;
const coefC = (a1: number) => 3.0 * a1;
const calcBezier = (t: number, a1: number, a2: number) =>
  ((coefA(a1, a2) * t + coefB(a1, a2)) * t + coefC(a1)) * t;
const getSlope = (t: number, a1: number, a2: number) =>
  3.0 * coefA(a1, a2) * t * t + 2.0 * coefB(a1, a2) * t + coefC(a1);

function cubicBezier(mX1: number, mY1: number, mX2: number, mY2: number) {
  const samples = new Float32Array(kSplineTableSize);
  for (let i = 0; i < kSplineTableSize; ++i) {
    samples[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
  }
  const tForX = (aX: number) => {
    let intervalStart = 0.0;
    let current = 1;
    const last = kSplineTableSize - 1;
    for (; current !== last && samples[current] <= aX; ++current) {
      intervalStart += kSampleStepSize;
    }
    --current;
    const dist =
      (aX - samples[current]) / (samples[current + 1] - samples[current]);
    const guess = intervalStart + dist * kSampleStepSize;
    const initialSlope = getSlope(guess, mX1, mX2);
    if (initialSlope >= 0.001) {
      let t = guess;
      for (let i = 0; i < 4; ++i) {
        const slope = getSlope(t, mX1, mX2);
        if (slope === 0.0) return t;
        t -= (calcBezier(t, mX1, mX2) - aX) / slope;
      }
      return t;
    }
    if (initialSlope === 0.0) return guess;
    let aA = intervalStart;
    let aB = intervalStart + kSampleStepSize;
    let t = 0;
    let x = 0;
    let i = 0;
    do {
      t = aA + (aB - aA) / 2.0;
      x = calcBezier(t, mX1, mX2) - aX;
      if (x > 0.0) aB = t;
      else aA = t;
    } while (Math.abs(x) > 0.0000001 && ++i < 10);
    return t;
  };
  return (x: number) => {
    const clamped = Math.min(1, Math.max(0, x));
    if (clamped === 0) return 0;
    if (clamped === 1) return 1;
    return calcBezier(tForX(clamped), mY1, mY2);
  };
}

const easeCount = cubicBezier(0.65, 0, 0.35, 1);

/** A rival's live vote count at frame `f`: it keeps ticking up on its own. */
export function rivalVotesOf(rival: UpvoteBurstRival, i: number, f: number) {
  return (
    rival.votes + Math.floor(Math.max(0, f) * (0.03 + ((i * 37) % 5) * 0.012))
  );
}

// Rows land `2` frames apart. The cursor travels until a frame before the
// press; the press dips the button, fills it and sends a ripple, and the
// cursor squeezes from `squeezeAt` to `squeeze`, leaves from `leaveAt` and
// fades from `hideAt` to `hidden`. `pass:<i>` is the frame the count passes
// rival `i`; the rows swap from there and the rank ticks over at `rank`. The
// clear starts `clearPad` after the count or the last pass, the rows fall out
// over `rows`; the badge stamps in after it with its ring, shake and caption.
export const upvoteBurstTimeline = defineTimeline<
  UpvoteBurstElementId,
  UpvoteBurstTimingProps
>(
  ({
    product = DEFAULT_PRODUCT,
    rivals = DEFAULT_RIVALS,
    startRank = 5,
    startVotes = 412,
    endVotes = 1342,
  }) => {
    const sRank = Math.max(1, Math.min(startRank, rivals.length + 1));
    const votesAt = (f: number) =>
      startVotes +
      (endVotes - startVotes) *
        easeCount(
          Math.min(
            1,
            Math.max(0, (f - BEAT.countFrom) / (BEAT.countTo - BEAT.countFrom)),
          ),
        );
    const crossAt: (number | null)[] = rivals.map((rival, i) => {
      if (i >= sRank - 1) return null;
      for (let f = BEAT.countFrom; f <= BEAT.countTo + 1; f++) {
        if (votesAt(f) > rivalVotesOf(rival, i, f)) return f;
      }
      return null;
    });
    const lastCross = Math.max(BEAT.countFrom, ...crossAt.map((c) => c ?? 0));
    const clearAt = Math.max(BEAT.countTo, lastCross) + BEAT.clearPad;

    const names: string[] = [];
    rivals.forEach((rival, i) => {
      names[i < sRank - 1 ? i : i + 1] = rival.name;
    });
    names[sRank - 1] = product.name;

    const elements: TimelineElement<UpvoteBurstElementId>[] = [
      {
        id: "sheet",
        lane: "Board",
        label: "sheet",
        start: BEAT.sheet,
        length: BEAT.rows - BEAT.sheet,
      },
      ...names.map(
        (name, slot): TimelineElement<UpvoteBurstElementId> => ({
          id: `row:${slot}`,
          lane: "Rows",
          label: name,
          start: BEAT.rows + slot * 2,
          length: 2,
          follows: slot > 0 ? `row:${slot - 1}` : undefined,
        }),
      ),
      {
        id: "cursor",
        lane: "Cursor",
        label: "cursor",
        start: BEAT.cursor,
        length: BEAT.press - 1 - BEAT.cursor,
        beats: { show: 6 },
      },
      {
        id: "press",
        lane: "Cursor",
        label: "upvote",
        start: BEAT.press,
        length: 20,
        follows: "cursor",
        beats: {
          dip: 3,
          ripple: 14,
          squeezeAt: -1,
          squeeze: 5,
          leaveAt: 10,
          hideAt: 12,
          hidden: 20,
        },
      },
      {
        id: "count",
        lane: "Votes",
        label: "count",
        start: BEAT.countFrom,
        length: BEAT.countTo - BEAT.countFrom,
        follows: "press",
      },
    ];
    crossAt.forEach((c, i) => {
      if (c === null) return;
      elements.push({
        id: `pass:${i}`,
        lane: "Passes",
        label: rivals[i].name,
        start: c,
        length: 12,
        follows: "count",
        beats: { peak: 4, rank: 3 },
      });
    });
    elements.push(
      {
        id: "clear",
        lane: "Board",
        label: "clear",
        start: clearAt,
        length: 10,
        follows: "count",
        beats: { rows: 8 },
      },
      {
        id: "badge",
        lane: "Badge",
        label: "badge",
        start: clearAt + 4,
        length: 27,
        follows: "clear",
        beats: {
          fade: 3,
          ringAt: 3,
          ring: 24,
          shake: 5,
          captionAt: 8,
          caption: 22,
          sub: 5,
        },
      },
    );
    return elements.sort((a, b) => a.start - b.start);
  },
);
