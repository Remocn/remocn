import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The text fading in as a draft, then each glyph sharpening into its final
// weight in turn. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type EnhanceCountElementId = "enter" | `glyph:${number}`;

export interface EnhanceCountTimingProps {
  text?: string;
  span?: number;
}

export const DEFAULT_TEXT = "Draft it fast.\nFinish it sharp.";
export const ENHANCE_SPAN = 34;
/** The draft fades in over `ENTER_LEN`. */
const ENTER_LEN = 14;
/** Glyphs start sharpening at `ENHANCE_AT`, at most `ENHANCE_MAX_GAP` apart. */
const ENHANCE_AT = 38;
const ENHANCE_MAX_GAP = 2.4;

/** The lines drawn: trimmed, blank ones dropped, a fallback when none is left. */
export function linesOf(text: string) {
  const l = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return l.length ? l : ["Finish it sharp."];
}

// `glyph:<i>` counts every character across the lines, spaces included. A
// glyph's sharpening is a spring that keeps settling after its length, the
// time until the next glyph starts.
export const enhanceCountTimeline = defineTimeline<
  EnhanceCountElementId,
  EnhanceCountTimingProps
>(({ text = DEFAULT_TEXT, span = ENHANCE_SPAN }) => {
  const chars = linesOf(text).flatMap((line) => Array.from(line));
  const gap = Math.min(ENHANCE_MAX_GAP, span / Math.max(1, chars.length));
  const elements: TimelineElement<EnhanceCountElementId>[] = [
    {
      id: "enter",
      lane: "Text",
      label: "Draft in",
      start: 0,
      length: ENTER_LEN,
    },
  ];
  chars.forEach((ch, i) => {
    elements.push({
      id: `glyph:${i}`,
      lane: "Glyphs",
      label: ch,
      start: ENHANCE_AT + i * gap,
      length: gap,
      follows: i > 0 ? `glyph:${i - 1}` : undefined,
    });
  });
  return elements;
});
