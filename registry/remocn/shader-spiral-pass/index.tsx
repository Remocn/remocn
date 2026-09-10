"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useDelayRender, useVideoConfig } from "remotion";
import { createTunnelRenderer } from "@/components/remocn/shader-light-tunnel";

export type ShaderSpiralPassProps = {
  /** Shader motion multiplier; transition duration is controlled by timing. */
  speed?: number;
  spirals?: number;
  twist?: number;
  /** Magnification reached while passing through the center, from 2 to 24. */
  zoom?: number;
  /** Feather width as a fraction of the shorter composition dimension. */
  softness?: number;
  timeOffset?: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const finite = (value: number, fallback: number, min: number, max: number) =>
  clamp(Number.isFinite(value) ? value : fallback, min, max);
const smooth = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Pure phase calculation also used to verify endpoint and coverage behavior. */
export function getSpiralPassPhase(progress: number, zoom = 14) {
  const p = finite(progress, 0, 0, 1);
  const dive = clamp((p - 0.08) / 0.84, 0, 1);
  return {
    cover: smooth(0, 0.18, p),
    showNext: p >= 0.2,
    zoom: Math.exp(Math.log(finite(zoom, 14, 2, 24)) * dive * dive),
    aperture: smooth(0.64, 1, p) ** 2,
    outgoingZoom: 1 + 0.5 * smooth(0, 0.22, p),
    incomingZoom: 1 + 0.12 * (1 - smooth(0.55, 1, p)),
  };
}

function ShaderSpiralPassPresentation({
  children,
  presentationProgress,
  presentationDirection,
  presentationDurationInFrames,
  passedProps,
}: TransitionPresentationComponentProps<ShaderSpiralPassProps>) {
  const { width, height, fps } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createTunnelRenderer> | null>(null);
  const {
    speed = 1,
    spirals = 3,
    twist = 0.7,
    zoom = 14,
    softness = 0.12,
    timeOffset = 0,
  } = passedProps;
  const p = finite(presentationProgress, 0, 0, 1);
  const entering = presentationDirection === "entering";
  const active = entering && p > 0 && p < 1;
  const phase = getSpiralPassPhase(p, zoom);
  const feather = Math.min(width, height) * finite(softness, 0.12, 0.02, 0.3);
  const radius = (Math.hypot(width, height) / 2 + feather) * phase.aperture;
  // Clip the incoming scene itself, in screen space. Its content must never
  // extend through the shader outside the exit, even when the scene is scaled.
  const edge = Math.min(feather, radius * 0.12);
  const sceneMask =
    entering && p < 1
      ? `radial-gradient(circle at center, black ${Math.max(0, radius - edge)}px, transparent ${radius}px)`
      : undefined;

  useLayoutEffect(() => {
    if (!active || !canvas.current) return;
    const handle = delayRender("Initialize Shader Spiral Pass");
    try {
      renderer.current = createTunnelRenderer(canvas.current);
      continueRender(handle);
    } catch (error) {
      cancelRender(error instanceof Error ? error : new Error(String(error)));
    }
    return () => {
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, [active, delayRender, continueRender, cancelRender]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: canvas resizing clears its pixels, including while paused.
  useLayoutEffect(() => {
    if (!active) return;
    try {
      // Integrate acceleration so shader motion speeds up without a time jump.
      const seconds = (p * presentationDurationInFrames) / fps;
      const time =
        finite(timeOffset, 0, -10000, 10000) +
        seconds * (1 + 0.8 * p * p) * finite(speed, 1, 0, 5);
      renderer.current?.draw(time, twist, 1, 1, spirals, phase.zoom);
    } catch (error) {
      cancelRender(error instanceof Error ? error : new Error(String(error)));
    }
  }, [
    active,
    p,
    presentationDurationInFrames,
    fps,
    speed,
    timeOffset,
    twist,
    spirals,
    phase.zoom,
    width,
    height,
    cancelRender,
  ]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {active && (
        <AbsoluteFill
          style={{
            opacity: phase.cover,
            pointerEvents: "none",
          }}
        >
          <canvas
            ref={canvas}
            width={width}
            height={height}
            aria-hidden="true"
            tabIndex={-1}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          />
        </AbsoluteFill>
      )}
      <AbsoluteFill
        style={{
          visibility: entering !== phase.showNext ? "hidden" : "visible",
          opacity: entering && p < 1 ? smooth(0.64, 0.72, p) : 1,
          maskImage: sceneMask,
          WebkitMaskImage: sceneMask,
        }}
      >
        <AbsoluteFill
          style={{
            transform: `scale(${entering ? phase.incomingZoom : phase.outgoingZoom})`,
            transformOrigin: "center",
          }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function shaderSpiralPass(
  props: ShaderSpiralPassProps = {},
): TransitionPresentation<ShaderSpiralPassProps> {
  return { component: ShaderSpiralPassPresentation, props };
}
