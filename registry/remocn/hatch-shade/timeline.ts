import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// An etching: a faint ghost of the figure, three hatching passes sweeping
// across it (two crossing diagonals in ink, then copper shading), the
// outline drawn round it, and the caption rising under it. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type HatchShadeElementId =
  | "ghost"
  | `pass:${number}`
  | "outline"
  | "caption";

export const PASSES = [
  { at: 8, sweep: 30, draw: 11, angle: 45, gap: 8, ink: "fg" },
  { at: 40, sweep: 30, draw: 11, angle: -45, gap: 8, ink: "fg" },
  { at: 74, sweep: 26, draw: 10, angle: 0, gap: 6, ink: "copper" },
] as const;

const PASS_LABELS = ["hatch", "cross-hatch", "shading"];
const GHOST_IN = 10;
const OUTLINE_AT = 100;
const OUTLINE_END = 110;
const CAPTION_AT = 112;
const CAPTION = 16;

// `pass:<i>` sweeps its lines across the figure over `sweep`, each line
// drawn over `draw`; the passes form a chain. The ghost fades in over its
// own length and out with `outline`, which follows the last pass; `caption`
// follows the outline.
export const hatchShadeTimeline = defineTimeline<HatchShadeElementId, object>(
  () => {
    const elements: TimelineElement<HatchShadeElementId>[] = [
      {
        id: "ghost",
        lane: "Ghost",
        label: "ghost",
        start: 0,
        length: GHOST_IN,
      },
      ...PASSES.map(
        (pass, i): TimelineElement<HatchShadeElementId> => ({
          id: `pass:${i}`,
          lane: "Passes",
          label: PASS_LABELS[i],
          start: pass.at,
          length: pass.sweep + pass.draw,
          follows: i > 0 ? `pass:${i - 1}` : undefined,
          beats: { sweep: pass.sweep, draw: pass.draw },
        }),
      ),
      {
        id: "outline",
        lane: "Outline",
        label: "outline",
        start: OUTLINE_AT,
        length: OUTLINE_END - OUTLINE_AT,
        follows: `pass:${PASSES.length - 1}`,
      },
      {
        id: "caption",
        lane: "Caption",
        label: "caption",
        start: CAPTION_AT,
        length: CAPTION,
        follows: "outline",
      },
    ];
    return elements;
  },
);
