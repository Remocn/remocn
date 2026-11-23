"use client";

import { NeuroNoise, type NeuroNoiseProps } from "@paper-design/shaders-react";
import { useCallback, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";

export interface ShaderNeuroNoiseProps
  extends Omit<NeuroNoiseProps, "frame" | "ref"> {}

export function ShaderNeuroNoise({
  speed = 1,
  colorFront = "#8a8a95",
  colorMid = "#4a4a68",
  colorBack = "#12121a",
  brightness = 0.05,
  contrast = 0.3,
  className,
  ...rest
}: ShaderNeuroNoiseProps) {
  const frame = useSceneFrame();
  const { fps, width, height } = useSceneConfig();

  const [handle] = useState(() => delayRender("shader-neuro-noise"));
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
      <NeuroNoise
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorFront={colorFront}
        colorMid={colorMid}
        colorBack={colorBack}
        brightness={brightness}
        contrast={contrast}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
