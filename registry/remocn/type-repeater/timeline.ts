import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The word coming in, its copies unfolding, breathing and folding back.
// Frames on the 30 fps scene timeline, after `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type TypeRepeaterElementId = "intro" | "unfold" | "breathe" | "collapse";

/** Beats on the 30 fps clock. */
export const TYPE_REPEATER_TIMING = {
  intro: [0, 10],
  unfold: [10, 34],
  breathe: [34, 70],
  collapse: [70, 90],
} as const;

const LABELS: Record<TypeRepeaterElementId, string> = {
  intro: "Word in",
  unfold: "Unfold",
  breathe: "Breathe",
  collapse: "Collapse",
};

const ORDER = ["intro", "unfold", "breathe", "collapse"] as const;

// Each phase hands straight over to the next, so each follows the one before.
export const typeRepeaterTimeline = defineTimeline<
  TypeRepeaterElementId,
  object
>(() =>
  ORDER.map((id, k): TimelineElement<TypeRepeaterElementId> => {
    const [start, end] = TYPE_REPEATER_TIMING[id];
    return {
      id,
      lane: id === "intro" ? "Word" : "Copies",
      label: LABELS[id],
      start,
      length: end - start,
      follows: k > 0 ? ORDER[k - 1] : undefined,
    };
  }),
);
