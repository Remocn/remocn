import type { Oklab } from "./color";
import { grainFrame, loopVector, loopVectorAtPhase } from "./loop";
import type { FrameInput, GradientParams, RenderTarget } from "./types";

/**
 * Everything a kind's shader reads, for one frame. Every backend uploads
 * exactly these values (WebGL as separate `u_*` uniforms, WebGPU as one
 * uniform struct with these member names), so frame N matches across them.
 */
export interface FrameUniforms {
  /** Full image size in pixels. */
  full: [number, number];
  /** (cos, sin)(phase) multiplied by the gradient's fixed path radius. */
  loopv: [number, number];
  /** Tile x, y (top-left origin), width, height. */
  tile: [number, number, number, number];
  /** Seed offset in noise space. */
  seed: [number, number];
  scale: number;
  warp: number;
  blur: number;
  grain: number;
  /** Grain seed. */
  frame: number;
  /** Number of palette colours, 1-6. */
  count: number;
  /** Enabled (0/1), cell, levels. */
  dither: [number, number, number];
  /** Smoothed scroll velocity times influence. */
  scroll: number;
  /** Background, OKLab. */
  bg: [number, number, number];
  /** x, y in image uv (top-left origin), influence. */
  pointer: [number, number, number];
  /** Palette, OKLab, padded to six; the fourth component is unused. */
  colors: [number, number, number, number][];
}

/** Integer hash of the seed to a stable offset in noise space. */
export function seedOffset(seed: number): readonly [number, number] {
  let h = Math.imul(seed ^ 0x9e_37_79_b9, 0x85_eb_ca_6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2_b2_ae_35);
  h ^= h >>> 16;
  const x = (h & 0xff_ff) / 0xff_ff;
  const y = ((h >>> 16) & 0xff_ff) / 0xff_ff;
  return [x * 97 - 48.5, y * 97 - 48.5];
}

export function frameUniforms(
  params: GradientParams,
  colors: readonly Oklab[],
  background: Oklab,
  frame: FrameInput,
  target: RenderTarget,
): FrameUniforms {
  const [lx, ly] =
    frame.phase !== undefined && params.drift !== undefined
      ? loopVectorAtPhase(frame.phase, params.drift)
      : loopVector(
          frame.timeSeconds,
          params.loopSeconds,
          params.speed,
          params.drift,
        );
  const [sx, sy] = seedOffset(params.seed);
  const scroll =
    Math.tanh((frame.scroll?.velocity ?? 0) * params.interaction.scroll) * 1.2;
  const pointer = frame.pointer;
  return {
    bg: [background[0], background[1], background[2]],
    blur: params.blur,
    colors: Array.from({ length: 6 }, (_, i) => {
      const c = colors[i] ?? [0, 0, 0];
      return [c[0], c[1], c[2], 0];
    }),
    count: params.colors.length,
    dither: [
      params.dither.enabled ? 1 : 0,
      params.dither.cell,
      params.dither.levels,
    ],
    frame: grainFrame(frame.frameIndex, params.loopSeconds, frame.frameRate),
    full: [target.fullWidth, target.fullHeight],
    grain: params.grain,
    loopv: [lx, ly],
    pointer: [
      pointer?.x ?? 0.5,
      pointer?.y ?? 0.5,
      (pointer?.strength ?? 0) * params.interaction.pointer,
    ],
    scale: params.scale,
    scroll,
    seed: [sx, sy],
    tile: [target.x, target.y, target.width, target.height],
    warp: Math.min(1.6, params.warp + Math.abs(scroll) * 0.5),
  };
}
