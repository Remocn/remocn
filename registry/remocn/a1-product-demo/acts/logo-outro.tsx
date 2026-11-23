"use client";

import { AbsoluteFill, interpolate, spring } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import {
  FLOW_BG,
  FLOW_INK,
  FLOW_YELLOW,
  FONT_SERIF,
  stirring,
  useGlide,
} from "../foundation";

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
  const f = useSceneFrame() * speed;
  const { fps } = useSceneConfig();
  const glide = useGlide();

  const revealAt = (g: number) =>
    spring({
      frame: g - 4,
      fps,
      config: { damping: 22, stiffness: 90 },
    });
  const reveal = revealAt(f);
  // A 16% zoom about the centre of a lockup about 500px wide.
  const zooming = stirring((g) => revealAt(g) * 0.16 * 250, f, speed);
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
          scale: `${scale}`,
          transform: glide(zooming),
          transformOrigin: "center",
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
