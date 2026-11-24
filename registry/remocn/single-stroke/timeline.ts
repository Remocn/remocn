import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The hairline guide drawing in, the panel wiping across, the one stroke
// writing the number, then the unit and the label rising on the panel word
// by word. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type SingleStrokeElementId =
  | "guide"
  | "panel"
  | "draw"
  | "unit"
  | `word:${number}`;

export interface SingleStrokeTimingProps {
  label?: string;
  drawDuration?: number;
  stagger?: number;
}

export const DEFAULT_LABEL = "Demo day. Every team shows a film.";

const DRAW_AT = 16;
const DRAW_LEN = 46;

/** The label's words, as the component lays them out. */
export function labelWordsOf(label: string) {
  return label ? label.split(" ") : [];
}

// `unit` and the first `word:<i>` follow `draw`, starting a little before
// it ends (unless a very short draw puts them before its start); each next
// word follows the one before.
export const singleStrokeTimeline = defineTimeline<
  SingleStrokeElementId,
  SingleStrokeTimingProps
>(({ label = DEFAULT_LABEL, drawDuration = DRAW_LEN, stagger = 3 }) => {
  const labelAt = DRAW_AT + drawDuration - 2;
  const elements: TimelineElement<SingleStrokeElementId>[] = [
    { id: "guide", lane: "Number", label: "Guide", start: 0, length: 14 },
    { id: "panel", lane: "Panel", label: "Panel", start: 2, length: 18 },
    {
      id: "draw",
      lane: "Number",
      label: "Draw",
      start: DRAW_AT,
      length: drawDuration,
    },
    {
      id: "unit",
      lane: "Unit",
      label: "Unit",
      start: DRAW_AT + drawDuration - 10,
      length: 18,
      follows: drawDuration >= 10 ? "draw" : undefined,
    },
    ...labelWordsOf(label).map(
      (w, i): TimelineElement<SingleStrokeElementId> => ({
        id: `word:${i}`,
        lane: "Label",
        label: w,
        start: labelAt + i * stagger,
        length: 16,
        follows:
          i > 0 ? `word:${i - 1}` : labelAt >= DRAW_AT ? "draw" : undefined,
      }),
    ),
  ];
  return elements.sort((a, b) => a.start - b.start);
});
