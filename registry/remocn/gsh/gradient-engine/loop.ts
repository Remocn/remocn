import type { RenderTarget } from "./types";

/** Radius of the time circle in noise space at speed 1. */
export const LOOP_RADIUS = 0.6;
/** Frame rate the live loop uses to derive `frameIndex`. */
export const LIVE_FPS = 60;

/** Position along one loop, 0 to 2π. Endpoint input always wraps to zero. */
export function loopPhase(timeSeconds: number, loopSeconds: number): number {
  const wrapped = ((timeSeconds % loopSeconds) + loopSeconds) % loopSeconds;
  return (2 * Math.PI * wrapped) / loopSeconds;
}

/**
 * Noise-space time input. Without an explicit drift, retain the original
 * speed-scaled radius and one lap per loop for saved params. With drift, speed
 * changes pace around the pinned path.
 */
export function loopVector(
  timeSeconds: number,
  loopSeconds: number,
  speed: number,
  drift?: number,
): readonly [number, number] {
  const legacy = drift === undefined;
  const phase = loopPhase(timeSeconds, loopSeconds) * (legacy ? 1 : speed);
  const radius = legacy ? speed * LOOP_RADIUS : drift;
  return [Math.cos(phase) * radius, Math.sin(phase) * radius];
}

/** Evaluates the fixed path at an already accumulated runtime phase. */
export function loopVectorAtPhase(
  phase: number,
  drift = LOOP_RADIUS,
): readonly [number, number] {
  return [Math.cos(phase) * drift, Math.sin(phase) * drift];
}

/**
 * Grain seed for a frame. It wraps at the live loop length so the grain
 * pattern repeats with the loop too.
 */
export function grainFrame(
  frameIndex: number,
  loopSeconds: number,
  frameRate = LIVE_FPS,
): number {
  const period = Math.max(1, Math.round(loopSeconds * frameRate));
  return ((Math.floor(frameIndex) % period) + period) % period;
}

/** Video frame rule: N = round(loopSeconds * fps) frames at i / fps; the endpoint is omitted. */
export function videoFrameTimes(loopSeconds: number, fps: number): number[] {
  const count = Math.round(loopSeconds * fps);
  return Array.from({ length: count }, (_, i) => i / fps);
}

export function fullTarget(width: number, height: number): RenderTarget {
  return { fullHeight: height, fullWidth: width, height, width, x: 0, y: 0 };
}

/**
 * Splits an image into tiles no larger than maxTile, row by row from the
 * top left. Tiles are quad-aligned so a tiled render equals the full one
 * even for kinds that use screen-space derivatives (fwidth), which the GPU
 * computes over 2x2 pixel quads: every tile starts at an even x, and every
 * tile's bottom edge sits an even number of rows above the image's bottom
 * (WebGL pairs rows from the bottom). The step is maxTile rounded down to
 * even, and any odd remainder goes to the top row of tiles.
 */
export function splitTiles(
  fullWidth: number,
  fullHeight: number,
  maxTile: number,
): RenderTarget[] {
  const step = Math.max(2, Math.floor(maxTile / 2) * 2);
  const rows: { y: number; height: number }[] = [];
  for (let bottom = fullHeight; bottom > 0; bottom -= step) {
    const y = Math.max(0, bottom - step);
    rows.unshift({ height: bottom - y, y });
  }
  const tiles: RenderTarget[] = [];
  for (const { y, height } of rows) {
    for (let x = 0; x < fullWidth; x += step) {
      tiles.push({
        fullHeight,
        fullWidth,
        height,
        width: Math.min(step, fullWidth - x),
        x,
        y,
      });
    }
  }
  return tiles;
}
