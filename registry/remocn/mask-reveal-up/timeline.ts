import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When each line rises out of its mask and when it sinks back. Frames on the 30 fps
// scene timeline, after `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type MaskRevealUpElementId = `line:${number}` | `exit:${number}`;

export interface MaskRevealUpTimingProps {
  text: string;
}

/** A line fades in over `ENTER`, travelling for the first `ENTER_TRAVEL`. */
const ENTER = 23;
const ENTER_TRAVEL = 11;
/** A line fades out over `EXIT`, travelling from `EXIT_TRAVEL_FROM` on. */
const EXIT = 16;
const EXIT_TRAVEL_FROM = 8;
const ENTER_STAGGER = 3;
const EXIT_STAGGER = 2;

// The exit is timed to end with the scene. `length` here is the composition
// length in scene frames without `speed`, as the component has always read
// it, so a faster scene still leaves at the end of the composition's frames.
export const maskRevealUpTimeline = defineTimeline<
  MaskRevealUpElementId,
  MaskRevealUpTimingProps
>(({ text }, { length }) => {
  const lines = text.split("\n");
  const enterEnd = ENTER + (lines.length - 1) * ENTER_STAGGER;
  const exitStart = Math.max(
    enterEnd,
    length - EXIT - (lines.length - 1) * EXIT_STAGGER,
  );
  return [
    ...lines.map(
      (item, i): TimelineElement<MaskRevealUpElementId> => ({
        id: `line:${i}`,
        lane: "In",
        label: item,
        start: i * ENTER_STAGGER,
        length: ENTER,
        follows: i > 0 ? `line:${i - 1}` : undefined,
        beats: { travel: ENTER_TRAVEL },
      }),
    ),
    ...lines.map(
      (item, i): TimelineElement<MaskRevealUpElementId> => ({
        id: `exit:${i}`,
        lane: "Out",
        label: item,
        start: exitStart + i * EXIT_STAGGER,
        length: EXIT,
        follows: i > 0 ? `exit:${i - 1}` : `line:${lines.length - 1}`,
        beats: { travelFrom: EXIT_TRAVEL_FROM },
      }),
    ),
  ];
});
