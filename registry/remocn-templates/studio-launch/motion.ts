import { Easing, interpolate } from "remotion";
export const STUDIO_FPS = 30;
export const STUDIO_FRAMES = 1065;
export const STUDIO_WIDTH = 1920;
export const STUDIO_HEIGHT = 1080;
export const studioTimeline = [
  { id: "opening", from: 0, to: 108 },
  { id: "feed", from: 108, to: 264 },
  { id: "workspace", from: 264, to: 413 },
  { id: "gate", from: 413, to: 540 },
  { id: "host", from: 540, to: 644 },
  { id: "editor", from: 644, to: 767 },
  { id: "sell", from: 767, to: 846 },
  { id: "outro", from: 846, to: STUDIO_FRAMES },
] as const;
export const smooth = Easing.bezier(0.65, 0, 0.25, 1);
export const settle = Easing.bezier(0.16, 1, 0.3, 1);
export const clamp = (x: number) => Math.min(1, Math.max(0, x));
export const ramp = (t: number, a: number, b: number) =>
  clamp((t - a) / (b - a));
export function tween(
  t: number,
  a: number,
  b: number,
  from = 0,
  to = 1,
  ease = settle,
) {
  return from + (to - from) * ease(ramp(t, a, b));
}
export function key(t: number, times: number[], values: number[]) {
  return interpolate(t, times, values, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}
