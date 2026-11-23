"use client";

import { Spiral, type SpiralProps } from "@paper-design/shaders-react";
import { useCallback, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";

export interface ShaderSpiralProps extends Omit<SpiralProps, "frame" | "ref"> {}

export function ShaderSpiral({
  speed = 1,
  colorBack = "#12121a",
  colorFront = "#52527a",
  density = 1,
  strokeWidth = 0.5,
  softness = 0.2,
  className,
  ...rest
}: ShaderSpiralProps) {
  const frame = useSceneFrame();
  const { fps, width, height } = useSceneConfig();

  const [handle] = useState(() => delayRender("shader-spiral"));
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
      <Spiral
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colorFront={colorFront}
        density={density}
        strokeWidth={strokeWidth}
        softness={softness}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
