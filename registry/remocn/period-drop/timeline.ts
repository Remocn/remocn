import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The letters rising into place one after another, then the period falling
// onto the line and bouncing to rest. Frames on the 30 fps scene timeline,
// after `speed`. The ids are public: a saved `timing` prop refers to them.

export type PeriodDropElementId = `char:${number}` | "drop";

export interface PeriodDropTimingProps {
  text?: string;
}

export const DEFAULT_TEXT = "remocn";
const RISE_FRAMES = 12;
const RISE_STAGGER = 2;
const DROP_START = 20;
const FALL_FRAMES = 12;
/** Frame where the dot has come to rest, squash included. */
export const REST_FRAME = 47;

// `fall` is the drop's first fall; stretching the drop slows the whole
// bounce with it.
export const periodDropTimeline = defineTimeline<
  PeriodDropElementId,
  PeriodDropTimingProps
>(({ text = DEFAULT_TEXT }) => {
  const elements: TimelineElement<PeriodDropElementId>[] = Array.from(text).map(
    (char, i) => ({
      id: `char:${i}`,
      lane: "Letters",
      label: char,
      start: RISE_STAGGER * i,
      length: RISE_FRAMES,
      follows: i > 0 ? `char:${i - 1}` : undefined,
    }),
  );
  // The drop comes in time order, after the last letter that rises before
  // it, and follows that letter.
  const at = elements.findIndex((e) => e.start > DROP_START);
  const place = at === -1 ? elements.length : at;
  elements.splice(place, 0, {
    id: "drop",
    lane: "Period",
    label: ".",
    start: DROP_START,
    length: REST_FRAME - DROP_START,
    follows: place > 0 ? elements[place - 1].id : undefined,
    beats: { fall: FALL_FRAMES },
  });
  return elements;
});
