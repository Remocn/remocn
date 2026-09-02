import { Easing } from "remotion";
import type { EasingPreset } from "./types";

export function resolveIntroducingProductEasing(
  preset: EasingPreset,
): (value: number) => number {
  switch (preset) {
    case "linear":
      return Easing.linear;
    case "ease-in":
      return Easing.in(Easing.cubic);
    case "ease-out":
      return Easing.out(Easing.cubic);
    case "ease-in-out":
      return Easing.inOut(Easing.cubic);
    case "snappy":
      return Easing.bezier(0.2, 0.9, 0.2, 1.12);
    case "spring":
      return Easing.spring({ damping: 16, stiffness: 180 });
    case "smooth":
      return Easing.bezier(0.16, 1, 0.3, 1);
  }
}

export function sceneFrame(
  frame: number,
  speed: number,
  sceneDuration: number,
): number {
  return Math.min(sceneDuration, frame * speed);
}

export function at(sceneDuration: number, progress: number): number {
  return sceneDuration * progress;
}
