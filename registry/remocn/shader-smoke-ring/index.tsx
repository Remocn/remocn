"use client";

import { SmokeRing, type SmokeRingProps } from "@paper-design/shaders-react";
import { useCallback, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";

const NEUTRAL_COLORS = ["#c8c8d0"];

export interface ShaderSmokeRingProps
  extends Omit<SmokeRingProps, "frame" | "ref"> {}

export function ShaderSmokeRing({
  speed = 1,
  colorBack = "#12121a",
  colors = NEUTRAL_COLORS,
  radius = 0.25,
  thickness = 0.65,
  scale = 0.8,
  className,
  ...rest
}: ShaderSmokeRingProps) {
  const frame = useSceneFrame();
  const { fps, width, height } = useSceneConfig();

  const [handle] = useState(() => delayRender("shader-smoke-ring"));
  const gate = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element) return;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => continueRender(handle)),
      );
    },
    [handle],
  );

  return (
    <div
      ref={gate}
      className={className}
      style={{ position: "absolute", inset: 0 }}
    >
      <SmokeRing
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colors={colors}
        radius={radius}
        thickness={thickness}
        scale={scale}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
