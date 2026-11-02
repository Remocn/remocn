"use client";

import { loadVariableFont } from "@remotion/google-fonts/Jost";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const jost = loadVariableFont("normal", { subsets: ["latin"] });

export interface AbsorbStackProps {
  lines?: string[];
  accentLine?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#2A1C17", ink: "#E8C9B0", accent: "#C8102E" },
  light: { bg: "#EAD3C3", ink: "#2A1C17", accent: "#C8102E" },
} as const;

const LEADING = 1.02;
const WEIGHT = 400;
const ENTER_LEN = 12;
const SETTLE_AT = 14;
const RING_GAP = 5;
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

export function AbsorbStack({
  lines = ["made to", "sink into", "your cut,", "not sit", "on top."],
  accentLine,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: AbsorbStackProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const c = THEMES[theme];
  const hot = accent ?? c.accent;
  const bg = background ?? c.bg;
  const n = Math.max(1, lines.length);
  const hotIndex = accentLine ?? n - 1;

  const fs = Math.min(height * 0.125, width * 0.1);
  const pitch = fs * LEADING;
  const mid = (n - 1) / 2;
  const centreY = height * 0.5;
  const spreadPitch = n > 1 ? (height * 0.84) / (n - 1) : 0;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {lines.map((line, i) => {
        const offset = i - mid;
        const ring = Math.abs(offset);
        const enter = interpolate(
          frame,
          [ring * 3, ring * 3 + ENTER_LEN],
          [0, 1],
          {
            ...CLAMP,
            easing: EASE_OUT,
          },
        );
        const settle = spring({
          frame: frame - SETTLE_AT - ring * RING_GAP,
          fps,
          config: { damping: 20, stiffness: 70, mass: 1 },
        });
        const from = centreY + offset * spreadPitch;
        const to = centreY + offset * pitch;
        const y = from + (to - from) * settle;
        const drift = interpolate(
          enter,
          [0, 1],
          [offset >= 0 ? 0.25 : -0.25, 0],
        );
        const sat = interpolate(settle, [0, 1], [72, 100], CLAMP);
        const ink = i === hotIndex ? hot : c.ink;
        return (
          <div
            key={`${i}-${line}`}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: y - pitch / 2,
              height: pitch,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: jost.fontFamily,
              fontWeight: WEIGHT,
              fontSize: fs,
              lineHeight: 1,
              letterSpacing: "-0.025em",
              textTransform: "lowercase",
              whiteSpace: "pre",
              color: `color-mix(in oklab, ${ink} ${sat.toFixed(1)}%, ${bg})`,
              opacity: enter,
              transform: `translateY(${(drift * fs).toFixed(2)}px)`,
            }}
          >
            {line}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
