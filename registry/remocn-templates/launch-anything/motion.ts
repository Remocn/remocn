import { Easing, interpolate } from "remotion";

export const LAUNCH_FPS = 60;
export const LAUNCH_FRAMES = 1600;
export const LAUNCH_WIDTH = 1920;
export const LAUNCH_HEIGHT = 1080;

// Measured against the 799-frame, 30000/1001-fps reference. Bounds are exclusive.
export const launchTimeline = [
  { id: "opening", from: 0, to: 228 },
  { id: "action", from: 228, to: 354 },
  { id: "portal", from: 354, to: 440 },
  { id: "showcase", from: 440, to: 907 },
  { id: "proof", from: 907, to: 1021 },
  { id: "industry", from: 1021, to: 1213 },
  { id: "space", from: 1213, to: 1293 },
  { id: "address", from: 1293, to: 1423 },
  { id: "mark", from: 1423, to: LAUNCH_FRAMES },
] as const;

export const showcaseTimeline = [
  { id: "dashboard", from: 440, to: 506 },
  { id: "shoppers", from: 506, to: 555 },
  { id: "exchange", from: 555, to: 621 },
  { id: "builder", from: 621, to: 675 },
  { id: "trading", from: 675, to: 741 },
  { id: "loyalty", from: 741, to: 841 },
  { id: "integrations", from: 841, to: 907 },
] as const;

export type ShowcaseId = (typeof showcaseTimeline)[number]["id"];
export const clamp = (n: number) => Math.min(1, Math.max(0, n));
export const settle = Easing.bezier(0.16, 1, 0.3, 1);
export const smooth = Easing.bezier(0.65, 0, 0.25, 1);
export const ramp = (t: number, a: number, b: number) =>
  clamp((t - a) / (b - a));
export function tween(
  t: number,
  a: number,
  b: number,
  from = 0,
  to = 1,
  easing = settle,
) {
  return from + (to - from) * easing(ramp(t, a, b));
}
export function key(t: number, times: number[], values: number[]) {
  return interpolate(t, times, values, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}
export function getShowcase(t: number) {
  const frame = Math.max(440, Math.min(906, Math.round(t * LAUNCH_FPS)));
  return (
    showcaseTimeline.find((shot) => frame >= shot.from && frame < shot.to) ??
    showcaseTimeline[0]
  );
}

// Camera and screen are transformed as one layer, so the screen never drifts.
export function deskCamera(t: number) {
  return {
    scale: key(
      t,
      [7.333, 8, 9.25, 10.35, 11.25, 12.35, 13.3, 15.117],
      [1, 1.03, 1.3, 1.58, 1.85, 2.1, 2.26, 2.3],
    ),
    x: key(t, [7.333, 15.117], [0, -10]),
    y: key(t, [7.333, 15.117], [0, -22]),
  };
}
