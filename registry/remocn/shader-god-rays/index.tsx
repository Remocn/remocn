"use client";

import { GodRays, type GodRaysProps } from "@paper-design/shaders-react";
import { useCallback, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";

const NEUTRAL_COLORS = ["#5a5a7e", "#8a8a95", "#ffffff", "#3a3a5c"];

export interface ShaderGodRaysProps
  extends Omit<GodRaysProps, "frame" | "ref"> {}

export function ShaderGodRays({
  speed = 1,
  colorBack = "#12121a",
  colorBloom = "#3a3a5c",
  colors = NEUTRAL_COLORS,
  intensity = 0.8,
  density = 0.3,
  bloom = 0.4,
  className,
  ...rest
}: ShaderGodRaysProps) {
  const frame = useSceneFrame();
  const { fps, width, height } = useSceneConfig();

  const [handle] = useState(() => delayRender("shader-god-rays"));
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
      <GodRays
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colorBloom={colorBloom}
        colors={colors}
        intensity={intensity}
        density={density}
        bloom={bloom}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
