import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Two words slam in, the line creeps toward the camera and whips away, a
// lead-in drops, the payoff slams huge and the ground rises behind it.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type HookPunchElementId =
  | "stop"
  | "scroll"
  | "whip"
  | "lead"
  | "payoff"
  | "rise";

export interface HookPunchTimingProps {
  stop?: string;
  scroll?: string;
  lead?: string;
  payoff?: string;
  hold?: number;
}

export const BEATS = {
  stop: 0,
  scroll: 6,
  whip: 30,
  whipLen: 8,
  lead: 33,
  pay: 42,
  rise: 43,
} as const;

// A slam kicks the camera and shakes it `kick` frames after it lands. The
// first line creeps from `creep` frames after "scroll" until the whip, which
// fades the line from `fade` to its end. The lead fades in over `in`; the
// payoff creeps from `creep` to `creepEnd`. The ground rises over 26 frames.
// Each element follows the one before it.
export const hookPunchTimeline = defineTimeline<
  HookPunchElementId,
  HookPunchTimingProps
>(
  ({
    stop = "Stop",
    scroll = "scrolling.",
    lead = "This video took",
    payoff = "1 day.",
    hold = BEATS.whip,
  }) => {
    const shift = hold - BEATS.whip;
    const beats = {
      ...BEATS,
      whip: BEATS.whip + shift,
      lead: BEATS.lead + shift,
      pay: BEATS.pay + shift,
      rise: BEATS.rise + shift,
    };
    const elements: TimelineElement<HookPunchElementId>[] = [
      {
        id: "stop",
        lane: "Words",
        label: stop,
        start: beats.stop,
        length: beats.scroll - beats.stop,
        beats: { kick: 4 },
      },
      {
        id: "scroll",
        lane: "Words",
        label: scroll,
        start: beats.scroll,
        length: beats.whip - beats.scroll,
        follows: "stop",
        beats: { kick: 4, creep: 6 },
      },
      {
        id: "whip",
        lane: "Words",
        label: "whip",
        start: beats.whip,
        length: beats.whipLen,
        follows: "scroll",
        beats: { fade: 3 },
      },
      {
        id: "lead",
        lane: "Words",
        label: lead,
        start: beats.lead,
        length: beats.pay - beats.lead,
        follows: "whip",
        beats: { in: 3 },
      },
      {
        id: "payoff",
        lane: "Words",
        label: payoff,
        start: beats.pay,
        length: 62,
        follows: "lead",
        beats: { kick: 4, creep: 6, creepEnd: 62 },
      },
      {
        id: "rise",
        lane: "Ground",
        label: "ground rises",
        start: beats.rise,
        length: 26,
        follows: "payoff",
      },
    ];
    return elements;
  },
);
