import { type CSSProperties, useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  type GradientParams,
  kindDefaults,
  mergeParams,
} from "./gradient-engine";
import {
  createWebGLRenderer,
  getWebGL2,
  type WebGLRenderer,
} from "./gradient-engine/renderer";
import { GSH_PRESETS, type GshPresetId } from "./presets";

export type GshGroundProps = {
  preset?: GshPresetId;
  params?: Partial<GradientParams>;
  timeOffset?: number;
  timeScale?: number;
  resolution?: number;
  style?: CSSProperties;
};

export const gshParams = (
  preset: GshPresetId | undefined,
  params?: Partial<GradientParams>,
): GradientParams => {
  const base = preset ? GSH_PRESETS[preset] : {};
  const kind = params?.kind ?? base.kind ?? "mesh";
  return mergeParams(kindDefaults(kind), {
    ...base,
    ...params,
    interaction: { pointer: 0, scroll: 0 },
  });
};

export function GshGround({
  preset,
  params,
  timeOffset = 0,
  timeScale = 1,
  resolution = 0.5,
  style,
}: GshGroundProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const resolved = useMemo(() => gshParams(preset, params), [preset, params]);
  const key = JSON.stringify(resolved);
  const w = Math.max(2, Math.round((width * resolution) / 2) * 2);
  const h = Math.max(2, Math.round((height * resolution) / 2) * 2);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = w;
    canvas.height = h;
    const gl = getWebGL2(canvas, { preserveDrawingBuffer: true });
    if (!gl) return;
    const renderer = createWebGLRenderer({
      canvas,
      gl,
      params: JSON.parse(key),
    });
    rendererRef.current = renderer;
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [key, w, h]);

  useLayoutEffect(() => {
    const t = timeOffset + (frame / fps) * timeScale;
    rendererRef.current?.renderFrame({
      timeSeconds: t,
      frameIndex: Math.round(t * fps),
      frameRate: fps,
    });
  }, [frame, fps, timeOffset, timeScale]);

  return (
    <AbsoluteFill style={{ backgroundColor: resolved.background, ...style }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </AbsoluteFill>
  );
}
