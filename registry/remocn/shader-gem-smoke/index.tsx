"use client";

import { GemSmoke, type GemSmokeProps } from "@paper-design/shaders-react";
import React, { useCallback, useState } from "react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const NEUTRAL_COLORS = ["#3a3a5c", "#52527a"];

export interface ShaderGemSmokeProps
  extends Omit<GemSmokeProps, "frame" | "ref"> {}

/**
 * Paper's Gem Smoke shader, driven deterministically by the current frame.
 *
 * Animated color fields placed over a logo shape — smoke lives behind (and
 * inside) the glassy silhouette. Feed it a brand mark via `image` (a URL,
 * e.g. staticFile('prisma/symbol-light.svg')); the shape is processed once
 * and cached, so every frame renders the same smoke at the same time.
 */
export function ShaderGemSmoke({
  speed = 1,
  colors = NEUTRAL_COLORS,
  colorBack = "#0a0a10",
  innerDistortion = 0.8,
  outerDistortion = 0.6,
  outerGlow = 0.55,
  innerGlow = 1,
  size = 0.8,
  className,
  ...rest
}: ShaderGemSmokeProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const [handle] = useState(() => delayRender("shader-gem-smoke"));
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
      <React.Suspense fallback={null}>
        <GemSmoke
          speed={0}
          frame={(frame / fps) * speed * 1000}
          colors={colors}
          colorBack={colorBack}
          innerDistortion={innerDistortion}
          outerDistortion={outerDistortion}
          outerGlow={outerGlow}
          innerGlow={innerGlow}
          size={size}
          fit="cover"
          width={width}
          height={height}
          suspendWhenProcessingImage
          {...rest}
        />
      </React.Suspense>
    </div>
  );
}
