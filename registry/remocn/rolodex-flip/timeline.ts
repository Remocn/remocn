import { defineTimeline } from "@/lib/remocn/timeline";

// When each flip turns the drum from one word to the next. Frames on the
// 30 fps scene timeline. The ids are public: a saved `timing` prop refers to
// them.

export type RolodexFlipElementId = `flip:${number}`;

export interface RolodexFlipTimingProps {
  items?: string[];
  /** Frame the first flip starts on. */
  from?: number;
  /** Frames between one flip and the next. */
  interval?: number;
  /** Frames a word takes to turn out, and the next one to turn in. */
  flipDuration?: number;
}

/** The words the schedule lays out when none are given. */
const DEFAULT_ITEMS = ["button", "dialog", "command", "tabs", "chart-area"];
const FROM = 0;
const INTERVAL = 20;
const FLIP = 10;

// `flip:<i>` turns word `i - 1` out over its `out` beat and word `i` in over
// `in`, starting `inAt` into the flip.
export const rolodexFlipTimeline = defineTimeline<
  RolodexFlipElementId,
  RolodexFlipTimingProps
>(
  ({
    items = DEFAULT_ITEMS,
    from = FROM,
    interval = INTERVAL,
    flipDuration = FLIP,
  }) =>
    items.slice(1).map((item, k) => {
      const i = k + 1;
      return {
        id: `flip:${i}`,
        lane: "Flips",
        label: item,
        start: from + (i - 1) * interval,
        length: flipDuration / 2 + flipDuration,
        follows: i > 1 ? `flip:${i - 1}` : undefined,
        beats: {
          out: flipDuration,
          inAt: flipDuration / 2,
          in: flipDuration,
        },
      };
    }),
);
