import { Easing, useCurrentFrame, useVideoConfig } from "remotion";

/** Seconds keep playback consistent when a consumer chooses a different fps. */
export const INTRODUCING_DURATION = 32;
export const INTRODUCING_FPS = 60;
export const INTRODUCING_WIDTH = 1920;
export const INTRODUCING_HEIGHT = 1080;
export const introducingTimeline = [
  { id: "hook", name: "01 · You built the product", from: 0, duration: 2.5 },
  { id: "brand", name: "02 · Introducing", from: 2.5, duration: 2.5 },
  { id: "install", name: "03 · One command", from: 5, duration: 4 },
  { id: "gallery", name: "04 · Real components", from: 9, duration: 4 },
  { id: "customize", name: "05 · Make it yours", from: 13, duration: 5 },
  { id: "compose", name: "06 · Put it together", from: 18, duration: 4 },
  { id: "showcase", name: "07 · The finished video", from: 22, duration: 4 },
  { id: "ownership", name: "08 · Own the source", from: 26, duration: 3 },
  { id: "outro", name: "09 · Your next launch", from: 29, duration: 3 },
] as const;
export type SceneId = (typeof introducingTimeline)[number]["id"];

/** Reference fits are screen-space approximations, not original source curves. */
export const motion = {
  enter: Easing.bezier(0.16, 1, 0.3, 1),
  uiApproach: Easing.bezier(0.27, 0.624, 0.469, 0.802),
  morph: Easing.bezier(0.652, 0.343, 0.075, 0.909),
  pill: Easing.bezier(0.223, 0.625, 0.83, 0.887),
  camera: Easing.bezier(0.76, 0, 0.24, 1),
  exit: Easing.bezier(0.7, 0, 0.84, 0),
};
export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const mix = (a: number, b: number, progress: number) =>
  a + (b - a) * progress;
export function progress(
  time: number,
  start: number,
  duration: number,
  easing = motion.enter,
) {
  return easing(clamp((time - start) / Math.max(0.001, duration)));
}
export function useSceneTime() {
  return useCurrentFrame() / useVideoConfig().fps;
}
export function fitSize(
  text: string,
  size: number,
  width: number,
  factor = 0.57,
) {
  return Math.min(size, width / Math.max(1, Array.from(text).length * factor));
}
export function sceneFrames(
  scene: (typeof introducingTimeline)[number],
  fps: number,
) {
  const from = Math.round(scene.from * fps);
  return {
    from,
    durationInFrames: Math.round((scene.from + scene.duration) * fps) - from,
  };
}
