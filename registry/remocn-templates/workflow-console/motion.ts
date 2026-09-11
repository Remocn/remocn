import { Easing, interpolate } from "remotion";

export const WORKFLOW_FPS = 60;
export const WORKFLOW_FRAMES = 2810;
export const WORKFLOW_WIDTH = 1920;
export const WORKFLOW_HEIGHT = 1080;
export const workflowTimeline = [
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
  { id: "mark", from: 2580, to: WORKFLOW_FRAMES },
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

/** Wipe the entire log before the delivery chapter, without a partial hold. */
export const toolRunExit = (t: number) => move(t, 19.35, 19.9, 0, 1, smooth);

/** Continuous camera track; no layout rounding or velocity cut at zoom-in. */
export function recommendationCamera(t: number, length: number) {
  const zoom = move(t, 35.5, 37.15, 0, 1, smooth);
  const scale = 1 + zoom * 0.65;
  const target = move(
    t,
    32.85,
    37.2,
    Math.min(11, length * 0.25),
    Math.max(Math.min(25, length * 0.55), length - 4),
    smooth,
  );
  return { x: 240 - target * 26 * 0.6 * scale, y: 106 + 6 * zoom, scale };
}
export function charCount(text: string, t: number, from: number, to: number) {
  return Array.from(typed(text, t, from, to)).length;
}
export function chapterAt(frame: number) {
  return workflowTimeline.find((shot) => frame >= shot.from && frame < shot.to);
}
export function barHeights(values: number[], progress: number, height: number) {
  const maximum = Math.max(1, ...values);
  return values.map(
    (value) => (Math.max(0, value) / maximum) * height * clamp(progress),
  );
}

export function chartBarGrowth(t: number, index: number) {
  return (
    move(t, 38.78 + index * 0.07, 39.38 + index * 0.11, 0.18, 1) *
    (0.9 + move(t, 39.3, 40.1, 0, 1, smooth) * 0.1)
  );
}
