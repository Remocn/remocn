"use client";

import { Water, type WaterProps } from "@paper-design/shaders-react";
import { useCallback, useState } from "react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface ShaderWaterProps extends Omit<WaterProps, "frame" | "ref"> {}

export function ShaderWater({
  speed = 1,
  colorBack = "#16202b",
  colorHighlight = "#5a6a7a",
  highlights = 0.06,
  waves = 0.3,
  caustic = 0.08,
  className,
  ...rest
}: ShaderWaterProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const [handle] = useState(() => delayRender("shader-water"));
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
      <Water
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colorHighlight={colorHighlight}
        highlights={highlights}
        waves={waves}
        caustic={caustic}
        style={{ width: "100%", height: "100%" }}
        {...rest}
      />
    </div>
  );
}
