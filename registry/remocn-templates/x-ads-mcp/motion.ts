import { Easing, interpolate } from "remotion";

export const X_ADS_FPS = 60;
export const X_ADS_FRAMES = 2810;
export const X_ADS_WIDTH = 1920;
export const X_ADS_HEIGHT = 1080;
export const xAdsTimeline = [
  { id: "intro", from: 0, to: 132 },
  { id: "campaign-command", from: 132, to: 384 },
  { id: "fetch", from: 384, to: 486 },
  { id: "analysis", from: 486, to: 642 },
  { id: "launch-command", from: 642, to: 753 },
  { id: "geography", from: 753, to: 1008 },
  { id: "tools", from: 1008, to: 1194 },
  { id: "delivery", from: 1194, to: 1320 },
  { id: "launched", from: 1320, to: 1440 },
  { id: "growth-title", from: 1440, to: 1536 },
  { id: "stats-loading", from: 1536, to: 1668 },
  { id: "stats", from: 1668, to: 1884 },
  { id: "change-command", from: 1884, to: 1971 },
  { id: "recommendation", from: 1971, to: 2241 },
  { id: "double-command", from: 2241, to: 2328 },
  { id: "chart", from: 2328, to: 2448 },
  { id: "closing-title", from: 2448, to: 2580 },
  { id: "mark", from: 2580, to: X_ADS_FRAMES },
] as const;

export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const smooth = Easing.bezier(0.65, 0, 0.35, 1);
export const ramp = (t: number, from: number, to: number) =>
  clamp((t - from) / Math.max(0.0001, to - from));
export function move(
  t: number,
  from: number,
  to: number,
  a = 0,
  b = 1,
  easing = ease,
) {
  return interpolate(t, [from, to], [a, b], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
}
export function typed(text: string, t: number, from: number, to: number) {
  return Array.from(text)
    .slice(0, Math.floor(Array.from(text).length * ramp(t, from, to)))
    .join("");
}
export function charCount(text: string, t: number, from: number, to: number) {
  return Array.from(typed(text, t, from, to)).length;
}
export function chapterAt(frame: number) {
  return xAdsTimeline.find((shot) => frame >= shot.from && frame < shot.to);
}
export function barHeights(values: number[], progress: number, height: number) {
  const maximum = Math.max(1, ...values);
  return values.map(
    (value) => (Math.max(0, value) / maximum) * height * clamp(progress),
  );
}
