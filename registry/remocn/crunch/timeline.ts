import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The setup rising in and clearing, the snag rising in, the walls squeezing
// it into a narrow column, the release (walls open, the snag clears) and the
// resolution rising in. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The beats spread over the clip: 0.75 to 1.6 times their pace
// on a 180-frame clip (`k`). The ids are public: a saved `timing` prop
// refers to them.

export type CrunchElementId =
  | "setup"
  | "setupOut"
  | "snag"
  | "squeeze"
  | "release"
  | "resolution";

/** One beat of the story: a slug over a line (`StoryBeat`). */
export interface StoryLine {
  slug: string;
  line: string;
}

export interface CrunchTimingProps {
  setup?: StoryLine;
  snag?: StoryLine;
  resolution?: StoryLine;
}

export const DEFAULT_SETUP: StoryLine = {
  slug: "Monday, 10:00 AM",
  line: "Maya had a launch on Friday.",
};
export const DEFAULT_SNAG: StoryLine = {
  slug: "Thursday, 11:40 PM",
  line: "Nine hours left, and still no video.",
};
export const DEFAULT_RESOLUTION: StoryLine = {
  slug: "Friday, 9:00 AM",
  line: "It shipped, with time to spare.",
};

export function words(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

const WORD_IN = 16;
const OUT_STEP = 0.8;
const WORD_OUT = 9;
const OPEN = 12;

// A block rising in (`setup`, `snag`, `resolution`) brings its words in
// `step` apart, slug first, each over `word`; a block clearing (`setupOut`)
// takes them out `step` apart, each over `word`. The squeeze closes the
// walls over its length; the release opens them over its length and clears
// the snag from `snagOut`, `step` apart, each word over `word`. Each element
// follows the one before it. `length` is the clip length without `speed`,
// as the pace is counted.
export const crunchTimeline = defineTimeline<
  CrunchElementId,
  CrunchTimingProps
>(
  (
    {
      setup = DEFAULT_SETUP,
      snag = DEFAULT_SNAG,
      resolution = DEFAULT_RESOLUTION,
    },
    { length },
  ) => {
    const k = Math.min(1.6, Math.max(0.75, length / 180));
    const at = (f: number) => f * k;
    const count = (b: StoryLine) =>
      words(b.slug.toUpperCase()).length + words(b.line).length;
    const rise = (b: StoryLine) => {
      const n = count(b);
      const step = Math.min(2.2, 16 / n);
      return {
        length: Math.max(0, n - 1) * step + WORD_IN,
        beats: { step, word: WORD_IN },
      };
    };
    const outLength = (b: StoryLine) =>
      Math.max(0, count(b) - 1) * OUT_STEP + WORD_OUT;
    const elements: TimelineElement<CrunchElementId>[] = [
      {
        id: "setup",
        lane: "Story",
        label: setup.line,
        start: at(4),
        ...rise(setup),
      },
      {
        id: "setupOut",
        lane: "Story",
        label: "Setup clears",
        start: at(44),
        length: outLength(setup),
        follows: "setup",
        beats: { step: OUT_STEP, word: WORD_OUT },
      },
      {
        id: "snag",
        lane: "Story",
        label: snag.line,
        start: at(52),
        follows: "setupOut",
        ...rise(snag),
      },
      {
        id: "squeeze",
        lane: "Walls",
        label: "Walls close in",
        start: at(74),
        length: at(122) - at(74),
        follows: "snag",
      },
      {
        id: "release",
        lane: "Walls",
        label: "Walls open",
        start: at(134),
        length: OPEN,
        follows: "squeeze",
        beats: { snagOut: -4, step: OUT_STEP, word: WORD_OUT },
      },
      {
        id: "resolution",
        lane: "Story",
        label: resolution.line,
        start: at(140),
        follows: "release",
        ...rise(resolution),
      },
    ];
    return elements;
  },
);
