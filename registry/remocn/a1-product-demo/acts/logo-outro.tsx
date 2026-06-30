"use client";

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FLOW_BG, FLOW_INK, FLOW_YELLOW, FONT_SERIF } from "../foundation";

function FlowithLogo({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: FLOW_YELLOW,
        borderRadius: size * 0.24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width={size * 0.58}
        height={size * 0.58}
        viewBox="0 0 24 24"
        fill="white"
      >
        <path d="M12 2 C12 6.5 15.5 10 20 12 C15.5 14 12 17.5 12 22 C12 17.5 8.5 14 4 12 C8.5 10 12 6.5 12 2 Z" />
      </svg>
    </div>
  );
}

export function LogoOutro({ speed = 1 }: { speed?: number }) {
  const f = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const reveal = spring({
    frame: f - 4,
    fps,
    config: { damping: 22, stiffness: 90 },
  });
  const opacity = interpolate(f, [4, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(reveal, [0, 1], [0.84, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: FLOW_BG,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 30,
          opacity,
          transform: `scale(${scale})`,
          transformOrigin: "center",
          willChange: "transform, opacity",
        }}
      >
        <FlowithLogo size={110} />
        <span
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 92,
            fontWeight: 400,
            color: FLOW_INK,
            letterSpacing: "-0.01em",
            lineHeight: 1,
          }}
        >
          Flowith
        </span>
      </div>
    </AbsoluteFill>
  );
}
