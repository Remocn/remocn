import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Three story beats: the setup writes in, the snag writes in and falls to the
// bottom, dimming, the resolution writes in and climbs to the top, taking the
// accent. Frames on the 30 fps scene timeline, after `delay`; the whole
// schedule stretches with the clip (`length / 180`, within 0.75–1.6). The
// ids are public: a saved `timing` prop refers to them.

export type StoryDipElementId =
  | "setup"
  | "snag"
  | "fall"
  | "resolution"
  | "climb";

interface Beat {
  slug: string;
  line: string;
}

export interface StoryDipTimingProps {
  setup?: Beat;
  snag?: Beat;
  resolution?: Beat;
}

export const DEFAULT_SETUP: Beat = {
  slug: "Wednesday, 4:00 PM",
  line: "Leo’s film was one render away.",
};
export const DEFAULT_SNAG: Beat = {
  slug: "4:05 PM",
  line: "Then the client sent a new logo.",
};
export const DEFAULT_RESOLUTION: Beat = {
  slug: "4:15 PM",
  line: "One prop later, every scene had it.",
};

/** A beat's slug rises over `RISE`; its words follow from `WORDS_AT`. */
const RISE = 14;
const WORDS_AT = 4;
/** The snag bounces `BOUNCE` after it lands and settles by `SETTLE`. */
const BOUNCE = 5;
const SETTLE = 12;
/** The resolution takes the accent from `LIFT_AT` into its climb. */
const LIFT_AT = 8;

/** The words of a beat's line, split on any whitespace. */
export function lineWords(line: string) {
  return line.split(/\s+/).filter(Boolean);
}

// `setup`, `snag` and `resolution` write their beat in: the slug over `rise`,
// then the words from `words`, `step` apart, each over `rise`. `fall` drops
// the snag to the bottom (and bounces it), `climb` lifts the resolution to
// the top. Each element follows the one before.
export const storyDipTimeline = defineTimeline<
  StoryDipElementId,
  StoryDipTimingProps
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
    const inAt = [at(2), at(30), at(86)];
    const fallA = at(54);
    const fallB = at(70);
    const climbA = at(108);
    const climbB = at(132);
    const write = (
      id: "setup" | "snag" | "resolution",
      b: Beat,
      i: number,
    ): TimelineElement<StoryDipElementId> => {
      const count = lineWords(b.line).length;
      const step = Math.min(2.4, 14 / Math.max(1, count));
      return {
        id,
        lane: id === "setup" ? "Setup" : id === "snag" ? "Snag" : "Resolution",
        label: b.slug,
        start: inAt[i],
        length: WORDS_AT + Math.max(0, count - 1) * step + RISE,
        beats: { rise: RISE, words: WORDS_AT, step },
      };
    };
    return [
      write("setup", setup, 0),
      { ...write("snag", snag, 1), follows: "setup" },
      {
        id: "fall",
        lane: "Snag",
        label: "fall",
        start: fallA,
        length: fallB - fallA,
        follows: "snag",
        beats: { bounce: BOUNCE, settle: SETTLE },
      },
      { ...write("resolution", resolution, 2), follows: "fall" },
      {
        id: "climb",
        lane: "Resolution",
        label: "climb",
        start: climbA,
        length: climbB - climbA,
        follows: "resolution",
        beats: { lift: LIFT_AT },
      },
    ];
  },
);
