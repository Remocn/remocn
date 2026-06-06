import type { Orientation } from "./types";

/** 1280×720 ↔ 720×1280 — the two presets the composition + export render at. */
export function dims(orientation: Orientation) {
  return orientation === "vertical"
    ? { width: 720, height: 1280 }
    : { width: 1280, height: 720 };
}

/** Orientation → the compact `?o=` query value. */
export function orientationToParam(o: Orientation): "h" | "v" {
  return o === "vertical" ? "v" : "h";
}

/** `?o=` query value → orientation (anything but "v" is horizontal). */
export function paramToOrientation(p: string): Orientation {
  return p === "v" ? "vertical" : "horizontal";
}
