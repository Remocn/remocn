import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The headliners peeling out of the river into the cluster, the name landing
// in its hole, and the slow push-in over the hold. The river itself streams
// the whole time. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type FeatureChipsFlowElementId = "converge" | "name" | "push";

export interface FeatureChipsFlowTimingProps {
  name?: string;
  converge?: number;
}

const CONVERGE = 58;
export const HIT = 96;
/** The push-in ends on this frame. */
const PUSH_END = 170;

// `converge` starts the peel; each headliner adds its own delay from where
// it sits on screen, and the rest dissolve from `dissolve` to `dissolveEnd`
// (plus a little scatter). `name` lands from `lead` to `in`, settles its
// scale by `settle`, and the glow under the cluster is full by `pool`.
// `push` is the slow push-in over the hold.
export const featureChipsFlowTimeline = defineTimeline<
  FeatureChipsFlowElementId,
  FeatureChipsFlowTimingProps
>(({ name = "remocn", converge = CONVERGE }) => {
  const hit = converge + HIT - CONVERGE;
  const elements: TimelineElement<FeatureChipsFlowElementId>[] = [
    {
      id: "converge",
      lane: "Cluster",
      label: "Converge",
      start: converge,
      length: hit - converge,
      beats: { dissolve: 4, dissolveEnd: 30 },
    },
    {
      id: "push",
      lane: "Camera",
      label: "Push in",
      start: converge,
      length: PUSH_END - converge,
    },
    {
      id: "name",
      lane: "Cluster",
      label: name,
      start: hit,
      length: 24,
      follows: "converge",
      beats: { lead: -2, in: 8, settle: 10, pool: 20 },
    },
  ];
  return elements;
});
