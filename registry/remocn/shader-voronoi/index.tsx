"use client";

import { Voronoi, type VoronoiProps } from "@paper-design/shaders-react";
import { useCallback, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";

const NEUTRAL_COLORS = ["#3a3a5c", "#52527a"];

export interface ShaderVoronoiProps
  extends Omit<VoronoiProps, "frame" | "ref"> {}

export function ShaderVoronoi({
  speed = 1,
  colors = NEUTRAL_COLORS,
  colorGap = "#12121a",
  distortion = 0.4,
  gap = 0.04,
  glow = 0,
  className,
  ...rest
}: ShaderVoronoiProps) {
  const frame = useSceneFrame();
  const { fps, width, height } = useSceneConfig();

  const [handle] = useState(() => delayRender("shader-voronoi"));
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
      <Voronoi
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colors={colors}
        colorGap={colorGap}
        distortion={distortion}
        gap={gap}
        glow={glow}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
