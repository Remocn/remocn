export type GradientKind =
  | "mesh"
  | "grain"
  | "aurora"
  | "waves"
  | "radial-glow"
  | "linear-flow"
  | "horizon"
  | "dither-field"
  | (string & {});
export interface GradientParams {
  kind: GradientKind;
  colors: string[];
  background: string;
  /** Legacy noise-space radius, retained so saved presets keep their shape. */
  drift?: number;
  speed: number;
  loopSeconds: number;
  scale: number;
  warp: number;
  grain: number;
  dither: { enabled: boolean; cell: number; levels: number };
  blur: number;
  seed: number;
  interaction: { pointer: number; scroll: number };
}
export interface FrameInput {
  timeSeconds: number;
  frameIndex: number;
  /** Sampling rate for deterministic grain wrapping; live frames use the display rate. */
  frameRate?: number;
  /** Runtime phase in radians. When supplied, speed changes cannot move the path. */
  phase?: number;
  pointer?: { x: number; y: number; strength: number };
  scroll?: { velocity: number };
}
export interface RenderTarget {
  fullWidth: number;
  fullHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface GradientRenderer {
  setParams(p: Partial<GradientParams>): void;
  renderFrame(frame: FrameInput, target?: RenderTarget): void;
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;
  destroy(): void;
}
