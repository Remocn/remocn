import { Easing, interpolate } from "remotion";

export const RELEASE_TEASER_FPS = 60000 / 1001;
export const RELEASE_TEASER_FRAMES = 960;
export const RELEASE_TEASER_WIDTH = 1920;
export const RELEASE_TEASER_HEIGHT = 1080;

// Half-open intervals on a doubled NTSC picture clock (16.016 seconds).
export const releaseTeaserTimeline = [
  { name: "An idea", from: 0, to: 104 },
  { name: "Better work", from: 104, to: 208 },
  { name: "Every detail", from: 208, to: 326 },
  { name: "Together", from: 326, to: 446 },
  { name: "A fresh chapter", from: 446, to: 610 },
  { name: "Release reveal", from: 610, to: 960 },
] as const;

export const atFps = (frame: number, fps: number) =>
  Math.round((frame / RELEASE_TEASER_FPS) * fps);
export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const progress = (frame: number, from: number, to: number) =>
  clamp((frame - from) / (to - from));
export const ease = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    easing: Easing.bezier(0.5, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
export const graphemes = (text: string) =>
  Array.from(segmenter.segment(text), (part) => part.segment);

export function textUnits(text: string) {
  return graphemes(text).reduce((sum, char) => {
    if (/\s/.test(char)) return sum + 0.3;
    if (/[ilI.,'!|]/.test(char)) return sum + 0.29;
    if (/[MW@%]/.test(char)) return sum + 0.98;
    return sum + ((char.codePointAt(0) ?? 0) > 0x024f ? 1.02 : 0.63);
  }, 0);
}

/** Honor explicit lines; keep arbitrary overrides within the safe area. */
export function fitText(text: string, maxSize = 48, width = 808) {
  const lines = text.split("\n");
  return Math.min(
    maxSize,
    width / Math.max(1, ...lines.map(textUnits)),
    220 / (Math.max(1, lines.length) * 1.15),
  );
}

/** Center-out focus, with a bounded stagger independent of copy length. */
export function characterState(
  frame: number,
  end: number,
  index: number,
  count: number,
) {
  const distance =
    count <= 1 ? 0 : Math.abs(index - (count - 1) / 2) / ((count - 1) / 2);
  const delay = distance * 7;
  const enter = ease(frame, delay, delay + 18);
  const exit = ease(frame, end - 16 - distance * 5, end - 1 - distance * 5);
  return {
    opacity: enter * (1 - exit),
    blur: (1 - enter) * 5 + exit * 3,
    y: (1 - enter) * 2 - exit * 1.5,
  };
}

export function ringPose(frame: number, reducedMotion = false) {
  const f = reducedMotion ? 760 : Math.max(0, Math.min(959, frame));
  const travel = progress(f, 0, 610);
  const reveal = ease(f, 602, 702);
  return {
    x: 480 + (1 - reveal) * (18 - travel * 26),
    y: (-200 + travel * 100) * (1 - reveal) + 270 * reveal,
    scale: (2.78 - travel * 0.32) * (1 - reveal) + 1.08 * reveal,
    rx: (0.4 - travel * 0.1) * (1 - reveal) + 0.14 * reveal,
    ry: (-0.55 + travel * 0.12) * (1 - reveal) - 0.16 * reveal,
    rz: (-0.42 + travel * 0.22) * (1 - reveal) - 0.13 * reveal,
    lightAngle: -0.8 + (f / 960) * 1.1,
    opacity: reducedMotion ? 0.72 : ease(f, 0, 48) * (1 - ease(f, 858, 946)),
  };
}
