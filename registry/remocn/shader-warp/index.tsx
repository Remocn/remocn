"use client";

import { Warp, type WarpProps } from "@paper-design/shaders-react";
import { useCallback, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";

const NEUTRAL_COLORS = ["#12121a", "#3a3a5c", "#12121a", "#52527a"];

export interface ShaderWarpProps extends Omit<WarpProps, "frame" | "ref"> {}

export function ShaderWarp({
  speed = 1,
  colors = NEUTRAL_COLORS,
  proportion = 0.5,
  softness = 1,
  distortion = 0.2,
  swirl = 0.4,
  className,
  ...rest
}: ShaderWarpProps) {
  const frame = useSceneFrame();
  const { fps, width, height } = useSceneConfig();

  const [handle] = useState(() => delayRender("shader-warp"));
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
      <Warp
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colors={colors}
        proportion={proportion}
        softness={softness}
        distortion={distortion}
        swirl={swirl}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
