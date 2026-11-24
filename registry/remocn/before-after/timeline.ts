import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The frame rising in, the slow camera push over it, the title, the grip
// popping onto the divider, the divider sweeping to `pauseAt`, the second
// sweep revealing the after side, and the grip fading out. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type BeforeAfterElementId =
  | "enter"
  | "push"
  | "title"
  | "grip"
  | "sweep"
  | "reveal"
  | "release";

export interface BeforeAfterTimingProps {
  hold?: number;
}

const BEAT = {
  frame: 0,
  title: 4,
  grip: 18,
  leg1: 24,
  leg2: 78,
  gripOut: 104,
};

export const DEFAULT_HOLD = BEAT.leg2 - BEAT.leg1;

// `sweep` runs until `reveal` takes over, `hold` frames later; its `press`
// and `lift` beats squeeze the grip around the start of the drag, and `caps`
// fades the labels in. `release` fades the grip once `reveal` has settled.
export const beforeAfterTimeline = defineTimeline<
  BeforeAfterElementId,
  BeforeAfterTimingProps
>(({ hold = DEFAULT_HOLD }): TimelineElement<BeforeAfterElementId>[] => {
  const leg2At = BEAT.leg1 + hold;
  const gripOutAt = leg2At + (BEAT.gripOut - BEAT.leg2);
  return [
    {
      id: "enter",
      lane: "Frame",
      label: "frame rises in",
      start: BEAT.frame,
      length: 30,
      beats: { fade: 10 },
    },
    {
      id: "push",
      lane: "Camera",
      label: "slow push",
      start: 0,
      length: 150,
    },
    {
      id: "title",
      lane: "Title",
      label: "title",
      start: BEAT.title,
      length: 16,
    },
    {
      id: "grip",
      lane: "Grip",
      label: "grip pops in",
      start: BEAT.grip,
      length: BEAT.leg1 - BEAT.grip,
    },
    {
      id: "sweep",
      lane: "Divider",
      label: "sweep to pause",
      start: BEAT.leg1,
      length: leg2At - BEAT.leg1,
      beats: { press: -5, lift: 1, caps: 12 },
    },
    {
      id: "reveal",
      lane: "Divider",
      label: "sweep to after",
      start: leg2At,
      length: gripOutAt - leg2At,
      follows: "sweep",
    },
    {
      id: "release",
      lane: "Grip",
      label: "grip fades out",
      start: gripOutAt,
      length: 8,
      follows: "reveal",
    },
  ];
});
