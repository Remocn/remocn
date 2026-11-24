import { defineTimeline } from "@/lib/remocn/timeline";

// A blueprint wipe turns the product into linework: the outline draws, the
// extension lines and dimensions grow out of it, the title block appears and
// the red callout rings a detail. Frames on the 30 fps scene timeline, after
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type BlueprintElementId =
  | "wipe"
  | "outline"
  | "extensions"
  | "dimensions"
  | "labels"
  | "leader"
  | "bubble"
  | "callout";

export const blueprintTimeline = defineTimeline<BlueprintElementId, object>(
  () => [
    { id: "wipe", lane: "Wipe", label: "wipe", start: 6, length: 18 },
    { id: "outline", lane: "Drawing", label: "outline", start: 8, length: 20 },
    {
      id: "extensions",
      lane: "Dimensions",
      label: "extension lines",
      start: 22,
      length: 6,
    },
    {
      id: "dimensions",
      lane: "Dimensions",
      label: "dimensions",
      start: 24,
      length: 8,
    },
    { id: "labels", lane: "Labels", label: "labels", start: 30, length: 6 },
    { id: "leader", lane: "Callout", label: "leader", start: 32, length: 8 },
    { id: "bubble", lane: "Callout", label: "bubble", start: 36, length: 6 },
    {
      id: "callout",
      lane: "Callout",
      label: "callout text",
      start: 38,
      length: 6,
    },
  ],
);
