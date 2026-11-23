import { defineTimeline } from "@/lib/remocn/timeline";

// The phrase the camera reads through, and the blur that clears from the
// first frame. Frames on the 30 fps scene timeline, after `speed`. The ids
// are public: a saved `timing` prop refers to them.
//
// The words ride one eased curve across the phrase, overlapping as they
// come in, so the phrase is one element rather than one per word.

export type ZoomWordsElementId = "phrase" | "focus";

export interface ZoomWordsTimingProps {
  text: string;
  wordGap?: number;
  blurFrames?: number;
}

export const WORD_GAP = 12;
const BLUR_FRAMES = 60;

export const zoomWordsTimeline = defineTimeline<
  ZoomWordsElementId,
  ZoomWordsTimingProps
>(({ text, wordGap = WORD_GAP, blurFrames = BLUR_FRAMES }) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return [
    {
      id: "phrase",
      lane: "Phrase",
      label: words.join(" "),
      start: 0,
      length: words.length * wordGap,
    },
    {
      id: "focus",
      lane: "Focus",
      label: "blur clears",
      start: 0,
      length: blurFrames,
    },
  ];
});
