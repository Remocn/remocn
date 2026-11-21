"use client";

import {
  PulsingBorder,
  type PulsingBorderProps,
} from "@paper-design/shaders-react";
import { useCallback, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";

const NEUTRAL_COLORS = ["#52527a", "#8a8a95", "#3a3a5c"];

export interface ShaderPulsingBorderProps
  extends Omit<PulsingBorderProps, "frame" | "ref"> {}

export function ShaderPulsingBorder({
  speed = 1,
  colorBack = "#12121a",
  colors = NEUTRAL_COLORS,
  roundness = 0.25,
  thickness = 0.1,
  intensity = 0.2,
  bloom = 0.25,
  className,
  ...rest
}: ShaderPulsingBorderProps) {
  const frame = useSceneFrame();
  const { fps, width, height } = useSceneConfig();

  const [handle] = useState(() => delayRender("shader-pulsing-border"));
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
      <PulsingBorder
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colors={colors}
        roundness={roundness}
        thickness={thickness}
        intensity={intensity}
        bloom={bloom}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
