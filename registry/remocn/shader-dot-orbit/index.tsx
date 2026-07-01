"use client";

import { DotOrbit, type DotOrbitProps } from "@paper-design/shaders-react";
import { useCallback, useState } from "react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const NEUTRAL_COLORS = ["#4a4a68", "#52527a", "#3a3a5c"];

export interface ShaderDotOrbitProps
  extends Omit<DotOrbitProps, "frame" | "ref"> {}

export function ShaderDotOrbit({
  speed = 1,
  colorBack = "#12121a",
  colors = NEUTRAL_COLORS,
  size = 1,
  spreading = 1,
  className,
  ...rest
}: ShaderDotOrbitProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const [handle] = useState(() => delayRender("shader-dot-orbit"));
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
      <DotOrbit
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colors={colors}
        size={size}
        spreading={spreading}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
