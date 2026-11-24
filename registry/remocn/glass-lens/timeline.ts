import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The logo, the headline lines and the product pane rising in; the glass
// drop sliding onto the focus word, gliding to the highlighted clip and
// travelling to the CTA slot, where it morphs into a pill, fills with the
// accent and takes its label and arrow. The pane's playhead and progress
// bar run under it all. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type GlassLensElementId =
  | "logo"
  | `line:${number}`
  | "pane"
  | "lens"
  | "progress"
  | "drop"
  | "playhead"
  | "glide"
  | "travel"
  | "morph"
  | "fill"
  | "label"
  | "arrow";

export interface GlassLensTimingProps {
  /** Headline lines, set big on the left. */
  lines?: string[];
}

export const DEFAULT_LINES = ["Every frame,", "composed."];
/** Frames a headline line, the logo or the pane takes to rise in. */
const RISE = 28;
/** A rise starts this long before its nominal beat. */
const RISE_LEAD = 8;

// `logo`, `line:<i>` (a chain) and `pane` rise in. `lens` fades the glass in.
// The drop's path is three moves with holds between: `drop` onto the focus
// word, `glide` to the highlighted clip and `travel` to the CTA slot.
// `morph` flattens the drop into the pill; its width settles from `width`.
// `fill` tints it with the accent, then `label` and `arrow` land.
// `progress` and `playhead` run inside the product pane.
export const glassLensTimeline = defineTimeline<
  GlassLensElementId,
  GlassLensTimingProps
>(({ lines = DEFAULT_LINES }) => {
  const rise = (at: number) => at - RISE_LEAD;
  const elements: TimelineElement<GlassLensElementId>[] = [
    {
      id: "logo",
      lane: "Headline",
      label: "logo",
      start: rise(0),
      length: RISE,
    },
    ...lines.map(
      (line, i): TimelineElement<GlassLensElementId> => ({
        id: `line:${i}`,
        lane: "Headline",
        label: line,
        start: rise(i * 3),
        length: RISE,
        follows: i > 0 ? `line:${i - 1}` : undefined,
      }),
    ),
    {
      id: "pane",
      lane: "Pane",
      label: "product pane",
      start: rise(4),
      length: RISE,
    },
    {
      id: "lens",
      lane: "Lens",
      label: "glass fades in",
      start: -6,
      length: 20,
    },
    {
      id: "progress",
      lane: "Pane",
      label: "progress bar",
      start: 0,
      length: 210,
    },
    {
      id: "drop",
      lane: "Lens",
      label: "onto the focus word",
      start: 0,
      length: 34,
    },
    {
      id: "playhead",
      lane: "Pane",
      label: "playhead",
      start: 20,
      length: 170,
    },
    {
      id: "glide",
      lane: "Lens",
      label: "to the highlighted clip",
      start: 62,
      length: 36,
      follows: "drop",
    },
    {
      id: "travel",
      lane: "Lens",
      label: "to the CTA",
      start: 124,
      length: 34,
      follows: "glide",
    },
    {
      id: "morph",
      lane: "Pill",
      label: "morph into the pill",
      start: 142,
      length: 18,
      follows: "travel",
      beats: { width: 6 },
    },
    {
      id: "fill",
      lane: "Pill",
      label: "accent fill",
      start: 147,
      length: 13,
      follows: "morph",
    },
    {
      id: "label",
      lane: "Pill",
      label: "label",
      start: 157,
      length: 16,
      follows: "fill",
    },
    {
      id: "arrow",
      lane: "Pill",
      label: "arrow",
      start: 163,
      length: 17,
      follows: "label",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
