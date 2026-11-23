"use client";

import {
  LiquidMetal,
  type LiquidMetalProps,
} from "@paper-design/shaders-react";
import { useCallback, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";

export interface ShaderLiquidMetalProps
  extends Omit<LiquidMetalProps, "frame" | "ref"> {}

export function ShaderLiquidMetal({
  speed = 1,
  colorBack = "#2a2a30",
  colorTint = "#8a8a95",
  distortion = 0.1,
  repetition = 1.5,
  contour = 0.4,
  softness = 0.05,
  shape = "none",
  className,
  ...rest
}: ShaderLiquidMetalProps) {
  const frame = useSceneFrame();
  const { fps, width, height } = useSceneConfig();

  const [handle] = useState(() => delayRender("shader-liquid-metal"));
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
      <LiquidMetal
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colorTint={colorTint}
        distortion={distortion}
        repetition={repetition}
        contour={contour}
        softness={softness}
        shape={shape}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
