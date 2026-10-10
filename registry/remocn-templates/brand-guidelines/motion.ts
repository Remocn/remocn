import { Easing, interpolate } from "remotion";

export const BRAND_GUIDELINES_FPS = 60;
export const BRAND_GUIDELINES_FRAMES = 1072;
export const BRAND_GUIDELINES_WIDTH = 1920;
export const BRAND_GUIDELINES_HEIGHT = 1080;

// Half-open intervals on the 60 fps picture clock. Overlap preserves the pushes.
export const brandGuidelinesTimeline = [
  { name: "Identity", from: 0, to: 118 },
  { name: "Palette", from: 118, to: 326 },
  { name: "Typography", from: 294, to: 806 },
  { name: "Object collage", from: 614, to: 806 },
  { name: "Closing identity", from: 806, to: 1072 },
] as const;

export const atFps = (referenceFrame: number, fps: number) =>
  Math.round((referenceFrame / BRAND_GUIDELINES_FPS) * fps);

export const progress = (frame: number, from: number, to: number) =>
  Math.max(0, Math.min(1, (frame - from) / (to - from)));

export function slide(frame: number, from: number, to: number) {
  return interpolate(frame, [from, to], [0, 1], {
    easing: Easing.bezier(0.65, 0, 0.25, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
export const graphemes = (text: string) =>
  Array.from(segmenter.segment(text), (part) => part.segment);

/** Reserve width against the complete phrase, not its currently typed prefix. */
export function fitSize(text: string, max: number, width: number) {
  const units = graphemes(text).reduce((sum, char) => {
    if (/\s/.test(char)) return sum + 0.29;
    if (/[ilI.,'!|]/.test(char)) return sum + 0.29;
    if (/[MW@%]/.test(char)) return sum + 0.96;
    if ((char.codePointAt(0) ?? 0) > 0x024f) return sum + 1;
    return sum + 0.62;
  }, 0);
  return Math.min(max, width / Math.max(1, units));
}

const quickCuts = [512, 538, 550, 562, 578, 594] as const;

/** Stateless typing and deletion: seeking directly to any frame is identical. */
export function specimenState(
  frame: number,
  phrases: string[],
  reduced = false,
) {
  let index = 0;
  let visible = 0;
  if (frame < 434) {
    const text = graphemes(phrases[0]);
    const reveal = progress(frame, 324, 380);
    const erase = progress(frame, 395, 430);
    visible = reduced
      ? frame < 422
        ? text.length
        : 0
      : Math.floor(text.length * (frame < 395 ? reveal : 1 - erase));
  } else if (frame < 512) {
    index = 1;
    visible = reduced
      ? graphemes(phrases[1]).length
      : Math.floor(graphemes(phrases[1]).length * progress(frame, 443, 493));
  } else {
    index = 2;
    for (let i = 0; i < quickCuts.length; i++) {
      if (frame >= quickCuts[i]) index = i + 2;
    }
    if (reduced) index = 7;
    visible = graphemes(phrases[index]).length;
  }
  const chars = graphemes(phrases[index]);
  return {
    index,
    fullText: phrases[index],
    text: chars.slice(0, visible).join(""),
    settledText: chars.slice(0, Math.max(0, visible - 3)).join(""),
    activeText: chars.slice(Math.max(0, visible - 3), visible).join(""),
    caret: !reduced && frame < 594,
  };
}
