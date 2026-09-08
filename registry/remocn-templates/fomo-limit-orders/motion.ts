import { Easing, interpolate } from "remotion";

export const FOMO_FPS = 60;
export const FOMO_FRAMES = 1108;
export const FOMO_WIDTH = 1920;
export const FOMO_HEIGHT = 1080;
export const fomoTimeline = [
  { id: "opening", from: 0, to: 162 },
  { id: "phone", from: 162, to: 480 },
  { id: "slider", from: 480, to: 654 },
  { id: "price", from: 654, to: 756 },
  { id: "confirmation", from: 756, to: 849 },
  { id: "closing", from: 849, to: FOMO_FRAMES },
] as const;

export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const travel = Easing.bezier(0.65, 0, 0.3, 1);
/** Fit to 25 source-frame measurements, 10.483–10.883 seconds. */
export const contraction = Easing.bezier(0.652, 0.343, 0.075, 0.909);
export const clamp = (n: number) => Math.min(1, Math.max(0, n));
export function ramp(t: number, start: number, end: number) {
  return clamp((t - start) / (end - start));
}
export function tween(
  t: number,
  start: number,
  end: number,
  a = 0,
  b = 1,
  easing = ease,
) {
  return a + (b - a) * easing(ramp(t, start, end));
}
export function key(t: number, times: number[], values: number[]) {
  return interpolate(t, times, values, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}
export function money(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Centerline of the phone border, in the same local coordinates as its camera. */
export function phoneBorderPoint(progress: number) {
  const inset = 0.85;
  const r = 59 - inset;
  const straight = 230 - 59;
  const arc = (Math.PI * r) / 2;
  const distance = clamp(progress) * (straight + arc + 66);
  if (distance <= straight) return { x: 230 - distance, y: 680 - inset };
  if (distance <= straight + arc) {
    const angle = Math.PI / 2 + (distance - straight) / r;
    return { x: 59 + r * Math.cos(angle), y: 621 + r * Math.sin(angle) };
  }
  return { x: inset, y: 621 - (distance - straight - arc) };
}
