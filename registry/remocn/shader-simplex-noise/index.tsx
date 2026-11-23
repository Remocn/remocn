"use client";

import {
  SimplexNoise,
  type SimplexNoiseProps,
} from "@paper-design/shaders-react";
import { useCallback, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";

const NEUTRAL_COLORS = ["#12121a", "#3a3a5c", "#52527a", "#8a8a95"];

export interface ShaderSimplexNoiseProps
  extends Omit<SimplexNoiseProps, "frame" | "ref"> {}

export function ShaderSimplexNoise({
  speed = 1,
  colors = NEUTRAL_COLORS,
  stepsPerColor = 2,
  softness = 0.1,
  className,
  ...rest
}: ShaderSimplexNoiseProps) {
  const frame = useSceneFrame();
  const { fps, width, height } = useSceneConfig();

  const [handle] = useState(() => delayRender("shader-simplex-noise"));
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
      <SimplexNoise
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colors={colors}
        stepsPerColor={stepsPerColor}
        softness={softness}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
