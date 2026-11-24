import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The beeswarm: the axis rule drawing in, the dots pouring down into one
// mixed swarm, the total label over it, the dots splitting into the two
// groups, then each group's median line snapping in with its label, under a
// slow camera push. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type BeeswarmElementId =
  | "rule"
  | "pour"
  | "push"
  | "total"
  | "split"
  | "medians";

export interface BeeswarmTimingProps {
  split?: number;
}

const POUR = [0, 40] as const;
const FALL_T = 16;
const SPLIT = 64;
const SPLIT_STAGGER = 10;
const SPLIT_T = 32;

// `pour` drops the dots over `spread` frames, in an order read off the laid
// out swarm, each falling over `fall` and bouncing for `bounce`. `total`
// follows the pour. `split` starts each dot within `stagger` frames (a hash
// of the dot) and moves it over `move`; the total label fades out from
// `totalOutAt` to `totalOut`. `medians` follows the split: group `g` snaps
// in `g` × `stagger` frames late, fading over `fade` and raising its label
// from `labelAt` to `label`.
export const beeswarmTimeline = defineTimeline<
  BeeswarmElementId,
  BeeswarmTimingProps
>(({ split = SPLIT_T }): TimelineElement<BeeswarmElementId>[] => {
  const HIT = SPLIT + SPLIT_STAGGER + split - 4;
  return [
    { id: "rule", lane: "Axis", label: "rule", start: 0, length: 18 },
    {
      id: "pour",
      lane: "Dots",
      label: "pour",
      start: POUR[0],
      length: POUR[1] - POUR[0] + FALL_T,
      beats: { spread: POUR[1] - POUR[0], fall: FALL_T, bounce: 8 },
    },
    { id: "push", lane: "Camera", label: "push", start: 0, length: HIT + 40 },
    {
      id: "total",
      lane: "Labels",
      label: "total",
      start: POUR[1] + 6,
      length: 10,
      follows: "pour",
    },
    {
      id: "split",
      lane: "Dots",
      label: "split",
      start: SPLIT,
      length: SPLIT_STAGGER + split,
      follows: "pour",
      beats: {
        stagger: SPLIT_STAGGER,
        move: split,
        totalOutAt: -2,
        totalOut: 8,
      },
    },
    {
      id: "medians",
      lane: "Labels",
      label: "medians",
      start: HIT,
      length: 28,
      follows: "split",
      beats: { stagger: 4, fade: 8, labelAt: 6, label: 24 },
    },
  ];
});
