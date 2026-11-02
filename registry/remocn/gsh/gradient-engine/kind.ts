import type { GradientParams } from "./types";

/**
 * One gradient kind. `glsl` defines `vec3 kindColor(vec2 p, vec2 uv)` and
 * returns OKLab. `p` is centred, y up, with the short side spanning -0.5..0.5;
 * `uv` is 0..1 from the top left. Use loopNoise/fbm/u_loop for motion, never
 * raw time, so the loop stays seamless.
 */
export interface GradientKindDefinition {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  /** Hand-tuned params for this kind. */
  readonly defaults: Omit<GradientParams, "kind">;
  readonly glsl: string;
  /**
   * Optional WGSL twin of `glsl`: `fn kindColor(p: vec2f, uv: vec2f) -> vec3f`,
   * same maths, against shaders/wgsl-common.ts. Kinds with it can render on
   * WebGPU (and in Node); kinds without it always render with WebGL.
   *
   * A loader, not the source: keep the WGSL in its own module and return
   * `import("./wgsl/<kind>").then((module) => module.wgsl)`, so bundlers
   * split it out and only pages that pick WebGPU download it.
   */
  readonly wgsl?: () => Promise<string>;
  /**
   * Set when `wgsl` uses fwidth/dpdx/dpdy. Screen-space derivatives come
   * from 2x2 quads whose choice of row is driver-defined, so such a kind is
   * near-exact against WebGL in the browser (checked with a tolerance in
   * the engine lab tests) rather than bit-exact, and Node keeps rendering
   * it through Chrome.
   */
  readonly wgslUsesDerivatives?: true;
  /** CSS background layers (without the base colour) that resemble the kind. */
  readonly fallbackLayers: (
    colors: readonly string[],
    background: string,
  ) => string[];
}

/** Picks colour i, cycling when the palette is shorter. */
export function pick(colors: readonly string[], i: number): string {
  return colors[i % colors.length] ?? "transparent";
}

/** Evenly spaced colour stops for CSS gradients. */
export function stops(colors: readonly string[], from = 0, to = 100): string {
  const last = Math.max(1, colors.length - 1);
  return colors
    .map(
      (color, i) => `${color} ${(from + ((to - from) * i) / last).toFixed(1)}%`,
    )
    .join(", ");
}
