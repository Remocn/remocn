import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When each line slides in and when it slides out. Frames on the 30 fps
// scene timeline, after `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type LineByLineSlideElementId = `line:${number}` | `exit:${number}`;

export interface LineByLineSlideTimingProps {
  text: string;
}

/** A line fades in over `ENTER`, sliding for the first `ENTER_TRAVEL`. */
const ENTER = 27;
const ENTER_TRAVEL = 14;
const ENTER_STAGGER = 4;
/** A line fades out over `EXIT`, sliding from `EXIT_TRAVEL_FROM` on. */
const EXIT = 18;
const EXIT_TRAVEL_FROM = 8;
const EXIT_STAGGER = 2;

// The exit is timed to end with the scene. `length` here is the composition
// length in scene frames without `speed`, as the component has always read
// it, so a faster scene still leaves at the end of the composition's frames.
export const lineByLineSlideTimeline = defineTimeline<
  LineByLineSlideElementId,
  LineByLineSlideTimingProps
>(({ text }, { length }) => {
  const lines = text.split("\n");
  const enterEnd = ENTER + (lines.length - 1) * ENTER_STAGGER;
  const exitStart = Math.max(
    enterEnd,
    length - EXIT - (lines.length - 1) * EXIT_STAGGER,
  );
  return [
    ...lines.map(
      (line, i): TimelineElement<LineByLineSlideElementId> => ({
        id: `line:${i}`,
        lane: "In",
        label: line,
        start: i * ENTER_STAGGER,
        length: ENTER,
        follows: i > 0 ? `line:${i - 1}` : undefined,
        beats: { travel: ENTER_TRAVEL },
      }),
    ),
    ...lines.map(
      (line, i): TimelineElement<LineByLineSlideElementId> => ({
        id: `exit:${i}`,
        lane: "Out",
        label: line,
        start: exitStart + i * EXIT_STAGGER,
        length: EXIT,
        follows: i > 0 ? `exit:${i - 1}` : `line:${lines.length - 1}`,
        beats: { travelFrom: EXIT_TRAVEL_FROM },
      }),
    ),
  ];
});
