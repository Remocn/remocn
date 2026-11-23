import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The fight-game round call: the round word and its number slam in, the call
// ducks up to a label, the call word punches in and cracks the band open,
// then the logo rises under it. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type RoundSlamElementId =
  | "round"
  | "number"
  | "duck"
  | "call"
  | "band"
  | "logo";

/** The scene's timing does not depend on its props. */
export type RoundSlamTimingProps = object;

// `round`, `number` and `call` end on their impact frames; the band opens
// from the call's impact.
export const roundSlamTimeline = defineTimeline<
  RoundSlamElementId,
  RoundSlamTimingProps
>((): TimelineElement<RoundSlamElementId>[] => [
  {
    id: "round",
    lane: "Round",
    label: "round",
    start: 0,
    length: 6,
    beats: { fade: 2 },
  },
  {
    id: "number",
    lane: "Round",
    label: "number",
    start: 6,
    length: 6,
    follows: "round",
    beats: { fade: 2 },
  },
  {
    id: "duck",
    lane: "Round",
    label: "duck to label",
    start: 34,
    length: 9,
    follows: "number",
  },
  {
    id: "call",
    lane: "Call",
    label: "call",
    start: 38,
    length: 6,
    follows: "number",
    beats: { fade: 3 },
  },
  {
    id: "band",
    lane: "Band",
    label: "band",
    start: 44,
    length: 10,
    follows: "call",
    beats: { openAt: 1, open: 9, reach: 5, cutsAt: 2, settle: 70, drift: 80 },
  },
  {
    id: "logo",
    lane: "Logo",
    label: "logo",
    start: 56,
    length: 10,
    follows: "band",
  },
]);
