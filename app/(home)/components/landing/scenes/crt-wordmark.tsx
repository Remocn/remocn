"use client";

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { CrtScreen } from "@/registry/remocn/crt-screen";
import { RemocnMark } from "../ui/remocn-mark";

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const INK = "#E6E6E6";

export function CrtWordmark({
  text = "emocn",
  fontSize = 220,
}: {
  text?: string;
  fontSize?: number;
}) {
  const frame = useCurrentFrame();
  const clamp = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;

  const beam = interpolate(frame, [0, 6, 12], [0.004, 0.012, 1], {
    ...clamp,
    easing: EASE,
  });
  const glow = interpolate(frame, [0, 8, 20], [0, 1, 0], clamp);
  const reveal = interpolate(frame, [10, 40], [0, 1], {
    ...clamp,
    easing: EASE,
  });
  const flicker =
    1 - 0.05 * Math.max(0, Math.sin(frame * 1.7) * Math.sin(frame * 0.31));

  return (
    <CrtScreen curvature={1} scanlines={1} maskScale={2} vignette={1}>
      <AbsoluteFill style={{ background: "#050505" }}>
        <AbsoluteFill
          style={{
            transform: `scaleY(${beam})`,
          }}
        >
          <AbsoluteFill
            style={{
              background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,255,255,${0.1 + glow * 0.6}), transparent 70%)`,
            }}
          />
          <AbsoluteFill
            style={{
              alignItems: "center",
              justifyContent: "center",
              color: INK,
              opacity: reveal * flicker,
              filter: `blur(${(1 - reveal) * 14}px)`,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: fontSize * 0.01,
              }}
            >
              <RemocnMark
                style={{ height: fontSize * 0.78, width: fontSize * 0.72 }}
              />
              <span
                className="font-wordmark"
                style={{
                  fontSize,
                  lineHeight: 1,
                  fontWeight: 600,
                  letterSpacing: "-0.025em",
                }}
              >
                {text}
              </span>
            </span>
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
    </CrtScreen>
  );
}
