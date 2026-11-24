import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The loose stroke drawing in, each glyph writing on along it, the stroke
// pulling taut under the words, and the gradient sliding along the stroke the
// whole time. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type PathTextElementId = "stroke" | "drift" | `glyph:${number}` | "pull";

export interface PathTextTimingProps {
  text?: string;
  italicWords?: number;
  stagger?: number;
  pullAt?: number;
}

export const DEFAULT_TEXT = "From rough to ready.";

const DRAW = 26;
const DRIFT = 110;
const WRITE_START = 14;
const WRITE = 8;
const MORPH = 40;
/** The taut stroke starts thinning this far into the pull. */
const THIN_DELAY = 6;
/** How far the straightening ripples from the first point to the last. */
const RIPPLE = 10;

/** `text` split into its roman head and the italic tail of `italicWords`. */
export function splitItalic(text: string, italicWords: number) {
  if (italicWords <= 0) return [text, ""] as const;
  const parts = text.split(" ");
  const k = Math.max(0, parts.length - italicWords);
  const roman = parts.slice(0, k).join(" ");
  const italic = parts.slice(k).join(" ");
  return [roman ? `${roman} ` : "", italic] as const;
}

// The glyphs write on as a chain: each follows the one before it.
export const pathTextTimeline = defineTimeline<
  PathTextElementId,
  PathTextTimingProps
>(({ text = DEFAULT_TEXT, italicWords = 1, stagger = 2, pullAt = 46 }) => {
  const [roman, italic] = splitItalic(text, italicWords);
  const glyphs = [...roman, ...italic];
  const elements: TimelineElement<PathTextElementId>[] = [
    { id: "stroke", lane: "Stroke", label: "draw", start: 0, length: DRAW },
    {
      id: "drift",
      lane: "Gradient",
      label: "slide",
      start: 0,
      length: DRIFT,
    },
    ...glyphs.map(
      (g, i): TimelineElement<PathTextElementId> => ({
        id: `glyph:${i}`,
        lane: "Glyphs",
        label: g,
        start: WRITE_START + i * stagger,
        length: WRITE,
        follows: i > 0 ? `glyph:${i - 1}` : undefined,
      }),
    ),
    {
      id: "pull",
      lane: "Stroke",
      label: "pull taut",
      start: pullAt,
      length: MORPH,
      beats: { thin: THIN_DELAY, ripple: RIPPLE },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
