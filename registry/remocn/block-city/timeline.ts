import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The camera flying low along the columns, craning up and orbiting to the
// front view; the blocks rising in a wave, the hero tower glowing and
// growing, then its label and the count. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type BlockCityElementId =
  | "fly"
  | "rise"
  | "glow"
  | "crane"
  | "hero"
  | "orbit"
  | "label"
  | "count";

export interface BlockCityTimingProps {
  countUp?: number;
}

const T_HERO = 112;
const T_LABEL = 178;

// `fly`, `crane` and `orbit` move the camera from one keyframe to the next
// and form a chain. `rise` runs the wave of blocks from the near columns to
// the far ones; the hero's glow and growth follow it. The label and the
// count keep their own time.
export const blockCityTimeline = defineTimeline<
  BlockCityElementId,
  BlockCityTimingProps
>(({ countUp = 40 }): TimelineElement<BlockCityElementId>[] => {
  const elements: TimelineElement<BlockCityElementId>[] = [
    { id: "fly", lane: "Camera", label: "fly low", start: 0, length: 112 },
    { id: "rise", lane: "Blocks", label: "blocks rise", start: 0, length: 112 },
    {
      id: "glow",
      lane: "Hero",
      label: "hero glow",
      start: T_HERO - 4,
      length: 16,
      follows: "rise",
    },
    {
      id: "crane",
      lane: "Camera",
      label: "crane up",
      start: 112,
      length: 28,
      follows: "fly",
    },
    {
      id: "hero",
      lane: "Hero",
      label: "hero tower",
      start: T_HERO,
      length: 26,
      follows: "rise",
    },
    {
      id: "orbit",
      lane: "Camera",
      label: "orbit",
      start: 140,
      length: 70,
      follows: "crane",
    },
    { id: "label", lane: "Label", label: "label", start: T_LABEL, length: 22 },
    {
      id: "count",
      lane: "Count",
      label: "count up",
      start: T_LABEL,
      length: countUp,
    },
  ];
  return elements;
});
