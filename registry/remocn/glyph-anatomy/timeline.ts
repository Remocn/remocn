import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The guide lines drawing in, then each letter in turn: its outline and
// anchors popping in along the path, its handles pulled out to their place,
// the fill coming in and the scaffolding fading. Frames on the 30 fps scene
// timeline, after `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type GlyphAnatomyElementId = `guide:${number}` | `letter:${number}`;

export interface GlyphAnatomyTimingProps {
  text?: string;
  guides?: boolean;
}

/** Beats on the 30 fps clock. Letter beats shift by `letterStagger × i`. */
export const anatomyTiming = {
  guideStart: 0,
  guideStagger: 3,
  guideDraw: 10,
  anchors: [8, 22],
  anchorPop: 4,
  /** Frames the outline takes to fade in, from the first anchor. */
  outline: 4,
  pull: [18, 40],
  pullDuration: 8,
  fill: [40, 50],
  fade: [46, 58],
  letterStagger: 2,
} as const;

/** A letter's moments, in frames from its own start. */
export interface LetterSpans {
  anchors: readonly [number, number];
  anchorPop: number;
  outline: number;
  pull: readonly [number, number];
  pullDuration: number;
  fill: readonly [number, number];
  fade: readonly [number, number];
}

export const GUIDE_LABELS = ["Cap height", "x-height", "Baseline", "Descender"];

// `guide:<i>` draws guide line `i`, a chain. `letter:<i>` is letter `i`,
// from its first anchor's wait to its scaffolding gone; the letters form a
// chain. A letter's beats are its moments from its start: anchors pop from
// `anchors` to `anchorsEnd`, each over `anchorPop`, the outline fades in over
// `outline`, handles are pulled from `pull` to `pullEnd`, each over
// `pullDuration`, the fill runs from `fill` to `fillEnd`, and the scaffolding
// fades from `fade` to the letter's end. How many anchors and handles share
// those spans comes from the font.
export const glyphAnatomyTimeline = defineTimeline<
  GlyphAnatomyElementId,
  GlyphAnatomyTimingProps
>(({ text = "Glyph", guides = true }) => {
  const T = anatomyTiming;
  const elements: TimelineElement<GlyphAnatomyElementId>[] = [];
  if (guides) {
    GUIDE_LABELS.forEach((label, i) => {
      elements.push({
        id: `guide:${i}`,
        lane: "Guides",
        label,
        start: T.guideStart + T.guideStagger * i,
        length: T.guideDraw,
        follows: i > 0 ? `guide:${i - 1}` : undefined,
      });
    });
  }
  Array.from(text).forEach((char, i) => {
    elements.push({
      id: `letter:${i}`,
      lane: "Letters",
      label: char,
      start: T.letterStagger * i,
      length: T.fade[1],
      follows: i > 0 ? `letter:${i - 1}` : undefined,
      beats: {
        anchors: T.anchors[0],
        anchorsEnd: T.anchors[1],
        anchorPop: T.anchorPop,
        outline: T.outline,
        pull: T.pull[0],
        pullEnd: T.pull[1],
        pullDuration: T.pullDuration,
        fill: T.fill[0],
        fillEnd: T.fill[1],
        fade: T.fade[0],
      },
    });
  });
  return elements.sort((a, b) => a.start - b.start);
});
