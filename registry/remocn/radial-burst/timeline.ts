import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The dot popping in, the segments launching out of it, the burst spinning,
// assembling and closing into a ring, the ring's anticipation and its exit
// past the frame. Frames on the 30 fps scene timeline, after `speed`; with
// `loop` the schedule repeats every cycle. The ids are public: a saved
// `timing` prop refers to them.

export type RadialBurstElementId =
  | "dot"
  | "launch"
  | "spin"
  | "assemble"
  | "close"
  | "ring"
  | "anticipate"
  | "exit";

/** The scene's timing does not depend on its props. */
export type RadialBurstTimingProps = object;

/** The ring has completely left the composition by this frame at 30 fps. */
export const BURST_LENGTH = 114;

// `dot` pops over its length and shrinks away over `shrink` from `shrinkAt`.
// `launch` shows the segments until the ring takes over: they fade in over
// `fade`, grow over `grow`, the plane tilts over `tilt` and the launch
// spring runs `spring`. `assemble` pulls them onto the ring, curling from
// `curlAt` over `curl`. `exit` throws the ring past the frame, the echoes
// fading from `fadeAt`.
export const radialBurstTimeline = defineTimeline<
  RadialBurstElementId,
  RadialBurstTimingProps
>((): TimelineElement<RadialBurstElementId>[] => [
  {
    id: "dot",
    lane: "Dot",
    label: "dot",
    start: 2,
    length: 16,
    beats: { shrinkAt: 16, shrink: 8 },
  },
  {
    id: "launch",
    lane: "Segments",
    label: "launch",
    start: 18,
    length: 66,
    follows: "dot",
    beats: { fade: 5, grow: 18, tilt: 30, spring: 26 },
  },
  {
    id: "spin",
    lane: "Spin",
    label: "spin",
    start: 34,
    length: 50,
    follows: "launch",
  },
  {
    id: "assemble",
    lane: "Segments",
    label: "assemble",
    start: 44,
    length: 32,
    follows: "spin",
    beats: { curlAt: 4, curl: 30 },
  },
  {
    id: "close",
    lane: "Segments",
    label: "close",
    start: 72,
    length: 12,
    follows: "assemble",
  },
  {
    id: "ring",
    lane: "Ring",
    label: "ring",
    start: 84,
    length: BURST_LENGTH - 84,
    follows: "close",
  },
  {
    id: "anticipate",
    lane: "Ring",
    label: "anticipate",
    start: 86,
    length: 10,
    follows: "ring",
  },
  {
    id: "exit",
    lane: "Ring",
    label: "exit",
    start: 96,
    length: BURST_LENGTH - 96,
    follows: "anticipate",
    beats: { fadeAt: 11 },
  },
]);
