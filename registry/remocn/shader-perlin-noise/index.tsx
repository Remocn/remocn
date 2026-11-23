"use client";

import {
  PerlinNoise,
  type PerlinNoiseProps,
} from "@paper-design/shaders-react";
import { useCallback, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";

export interface ShaderPerlinNoiseProps
  extends Omit<PerlinNoiseProps, "frame" | "ref"> {}

export function ShaderPerlinNoise({
  speed = 1,
  colorBack = "#12121a",
  colorFront = "#6a6a85",
  proportion = 0.35,
  softness = 0.1,
  className,
  ...rest
}: ShaderPerlinNoiseProps) {
  const frame = useSceneFrame();
  const { fps, width, height } = useSceneConfig();

  const [handle] = useState(() => delayRender("shader-perlin-noise"));
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
      <PerlinNoise
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colorFront={colorFront}
        proportion={proportion}
        softness={softness}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
