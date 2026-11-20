"use client";

import { loadVariableFont } from "@remotion/google-fonts/Jost";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useGlide } from "@/lib/remocn/glide";

const jost = loadVariableFont("normal", { subsets: ["latin"] });

export interface AbsorbStackProps {
  lines?: string[];
  accentLine?: number;
  accent?: string;
  /** Text color of the lines; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the lines. Load it yourself; Jost by default. */
  fontFamily?: string;
  fontWeight?: number;
  /** Frames between rings of lines as they settle, center out. */
  stagger?: number;
  /** Size of the stack, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
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

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function AbsorbStack({
  lines = ["made to", "sink into", "your cut,", "not sit", "on top."],
  accentLine,
  accent,
  ink: inkProp,
  background,
  fontFamily = jost.fontFamily,
  fontWeight = WEIGHT,
  stagger = RING_GAP,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: AbsorbStackProps) {
  const glide = useGlide();
  const frame = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width, height, fps } = useVideoConfig();
  const c = THEMES[theme];
  const hot = accent ?? c.accent;
  const fg = inkProp ?? c.ink;
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
      <ScaleLayer scale={scale}>
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
          const settleAt = (f: number) =>
            spring({
              frame: f - SETTLE_AT - ring * stagger,
              fps,
              config: { damping: 20, stiffness: 70, mass: 1 },
            });
          const settle = settleAt(frame);
          const from = centreY + offset * spreadPitch;
          const to = centreY + offset * pitch;
          // The settle is a transform from where the line lands, not `top`:
          // layout rounds a baseline to whole pixels, so a line eased by `top`
          // clicks along pixel by pixel. Layout holds the landing place for the
          // line's whole life, so no frame hands it back to layout's rounding.
          const travelAt = (f: number) => (from - to) * (1 - settleAt(f));
          const travel = travelAt(frame);
          const moving =
            Math.abs(travelAt(frame + 1) - travel) > 1e-5 ||
            Math.abs(travel - travelAt(frame - 1)) > 1e-5 ||
            midway(enter);
          const drift = interpolate(
            enter,
            [0, 1],
            [offset >= 0 ? 0.25 : -0.25, 0],
          );
          const sat = interpolate(settle, [0, 1], [72, 100], CLAMP);
          const ink = i === hotIndex ? hot : fg;
          return (
            <div
              key={`${i}-${line}`}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: to - pitch / 2,
                height: pitch,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily,
                fontWeight,
                fontSize: fs,
                lineHeight: 1,
                letterSpacing: "-0.025em",
                textTransform: "lowercase",
                whiteSpace: "pre",
                color: `color-mix(in oklab, ${ink} ${sat.toFixed(1)}%, ${bg})`,
                opacity: enter,
                transform: `translateY(${travel + drift * fs}px)${glide(moving)}`,
              }}
            >
              {line}
            </div>
          );
        })}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
