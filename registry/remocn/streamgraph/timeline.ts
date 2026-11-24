import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The scene fading up under a slow push, the stream growing to its front,
// the other layers dimming, the leader line, the share landing and its
// caption. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type StreamgraphElementId =
  | "stage"
  | "push"
  | "grow"
  | "dim"
  | "lead"
  | "share"
  | "caption";

export interface StreamgraphTimingProps {
  landAt?: number;
}

const GROW_AT = -16;
const HIT = 82;

// `grow` starts before the scene and ends when the share lands (`landAt`);
// the dim, the leader line and the share follow it. The share fades in over
// its `fade` beat, sharpens over `blur` and counts up over its length; the
// caption follows the share. `push` is the slow camera move and the beam's
// sheen.
export const streamgraphTimeline = defineTimeline<
  StreamgraphElementId,
  StreamgraphTimingProps
>(({ landAt = HIT }): TimelineElement<StreamgraphElementId>[] => {
  const elements: TimelineElement<StreamgraphElementId>[] = [
    { id: "stage", lane: "Scene", label: "fade up", start: 0, length: 8 },
    { id: "push", lane: "Camera", label: "push", start: 0, length: 150 },
    {
      id: "grow",
      lane: "Stream",
      label: "grow",
      start: GROW_AT,
      length: landAt - GROW_AT,
    },
    {
      id: "dim",
      lane: "Stream",
      label: "dim others",
      start: landAt - 6,
      length: 20,
      follows: "grow",
    },
    {
      id: "lead",
      lane: "Share",
      label: "leader line",
      start: landAt - 4,
      length: 18,
      follows: "grow",
    },
    {
      id: "share",
      lane: "Share",
      label: "share",
      start: landAt,
      length: 28,
      follows: "grow",
      beats: { fade: 8, blur: 14 },
    },
    {
      id: "caption",
      lane: "Caption",
      label: "caption",
      start: landAt + 10,
      length: 18,
      follows: "share",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
