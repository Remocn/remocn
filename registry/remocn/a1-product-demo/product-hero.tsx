"use client";

import { AbsoluteFill, interpolate, Sequence } from "remotion";
import { SoftBlurIn } from "@/components/remocn/soft-blur-in";
import { useCompositionFrames, useSceneFrame } from "@/lib/remocn/frame-rate";
import type { ProductHeroContent, TemplateTheme } from "./foundation";
import { CAMERA_TRAVEL_EASE, Camera, stirring } from "./foundation";

export interface ProductHeroProps {
  content: ProductHeroContent;
  theme: TemplateTheme;
  speed?: number;
}

const PITCH_DELAY = 30;
const TRAVEL = 16;

export function ProductHero({ content, theme, speed = 1 }: ProductHeroProps) {
  const f = useSceneFrame() * speed;
  // A `<Sequence>` starts on one of the composition's own frames.
  const toFrames = useCompositionFrames();
  const vertical = content.entrance === "per-character-rise";

  const travelAt = (g: number) =>
    interpolate(g, [0, TRAVEL], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: CAMERA_TRAVEL_EASE,
    });
  const travel = travelAt(f);
  const scale = interpolate(travel, [0, 1], [6.5, 1]);
  const pan = interpolate(travel, [0, 1], [120, 0]);
  const blur = interpolate(f, [0, 10, TRAVEL], [16, 6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Camera
        scale={scale}
        x={vertical ? 0 : -pan}
        y={vertical ? pan : 0}
        blur={blur}
        // The zoom covers 5.5x over half the frame's width.
        moving={stirring((g) => travelAt(g) * 5.5 * 960, f, speed)}
      >
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <span
            style={{
              fontSize: 128,
              fontWeight: 600,
              color: theme.foreground,
              letterSpacing: "-0.04em",
              fontFamily:
                "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {content.name}
          </span>
        </AbsoluteFill>
      </Camera>

      <Sequence from={toFrames(PITCH_DELAY)} layout="none">
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 200,
          }}
        >
          <div style={{ position: "relative", width: "100%", height: 56 }}>
            <SoftBlurIn
              text={content.pitch}
              color={theme.muted}
              fontSize={34}
              fontWeight={500}
              speed={speed}
            />
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
}
