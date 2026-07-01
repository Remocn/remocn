"use client";

import { Metaballs, type MetaballsProps } from "@paper-design/shaders-react";
import { useCallback, useState } from "react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const NEUTRAL_COLORS = ["#3a3a5c", "#52527a", "#8a8a95"];

export interface ShaderMetaballsProps
  extends Omit<MetaballsProps, "frame" | "ref"> {}

export function ShaderMetaballs({
  speed = 1,
  colorBack = "#12121a",
  colors = NEUTRAL_COLORS,
  count = 10,
  size = 0.83,
  className,
  ...rest
}: ShaderMetaballsProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const [handle] = useState(() => delayRender("shader-metaballs"));
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
      <Metaballs
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colorBack={colorBack}
        colors={colors}
        count={count}
        size={size}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
