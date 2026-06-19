"use client";

import {
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface ToolMenuSlideInProps {
  panelStartFrame?: number;
  iconStagger?: number;
  iconCount?: number;
  accent?: string;
  panelColor?: string;
  iconBg?: string;
  speed?: number;
  className?: string;
}

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

const ICON_GLYPHS = ["B", "S", "C", "P", "E", "T", "M", "L"];
const PANEL_SLIDE_DURATION = 22;

export function ToolMenuSlideIn({
  panelStartFrame = 18,
  iconStagger = 4,
  iconCount = 5,
  accent = "#a78bfa",
  panelColor = "rgba(18, 18, 22, 0.72)",
  iconBg = "rgba(255,255,255,0.06)",
  speed = 1,
  className,
}: ToolMenuSlideInProps) {
  const rawFrame = useCurrentFrame();
  const frame = rawFrame * speed;
  const { fps } = useVideoConfig();

  const safeIconCount = Math.max(1, Math.min(8, Math.floor(iconCount)));

  // Snappy slide-in: high stiffness, moderate damping, low mass.
  const slide = spring({
    frame: frame - panelStartFrame,
    fps,
    config: { damping: 20, stiffness: 320, mass: 0.6 },
  });

  const panelTy = interpolate(slide, [0, 1], [120, 0]);
  const panelOpacity = interpolate(slide, [0, 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Icon sizing
  const ICON_SIZE = 64;
  const ICON_GAP = 14;
  const PANEL_PADDING = 14;
  const panelInnerWidth =
    safeIconCount * ICON_SIZE + (safeIconCount - 1) * ICON_GAP;
  const panelWidth = panelInnerWidth + PANEL_PADDING * 2;
  const panelHeight = ICON_SIZE + PANEL_PADDING * 2;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        fontFamily: FONT_FAMILY,
        // subtle dot grid for editor-canvas feel
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      {/* Top toolbar */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          right: 24,
          height: 44,
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 10,
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "rgba(255,255,255,0.18)",
          }}
        />
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "rgba(255,255,255,0.12)",
          }}
        />
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "rgba(255,255,255,0.12)",
          }}
        />
        <div
          style={{
            marginLeft: 16,
            fontSize: 12,
            color: "rgba(255,255,255,0.42)",
            letterSpacing: "0.02em",
          }}
        >
          editor — untitled.png
        </div>
      </div>

      {/* Centered placeholder canvas (the "image being edited") */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 720,
          height: 420,
          transform: "translate(-50%, -54%)",
          borderRadius: 18,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -40px 80px rgba(0,0,0,0.45), 0 30px 80px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {/* Faux content block */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(60% 80% at 50% 40%, rgba(255,255,255,0.06), transparent 70%)",
          }}
        />
      </div>

      {/* The slide-in tool menu */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: "50%",
          width: panelWidth,
          height: panelHeight,
          transform: `translateX(-50%) translateY(${panelTy}%)`,
          opacity: panelOpacity,
          background: panelColor,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: panelHeight / 2,
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.08)",
          padding: PANEL_PADDING,
          display: "flex",
          alignItems: "center",
          gap: ICON_GAP,
        }}
      >
        {Array.from({ length: safeIconCount }).map((_, i) => {
          const startAt =
            panelStartFrame + PANEL_SLIDE_DURATION + iconStagger * i;
          const isActive = i === 0;
          return (
            <Sequence
              key={i}
              from={startAt}
              layout="none"
              name={`tool-icon-${i}`}
            >
              <ToolIcon
                glyph={ICON_GLYPHS[i % ICON_GLYPHS.length]}
                size={ICON_SIZE}
                bg={iconBg}
                accent={accent}
                active={isActive}
                fps={fps}
              />
            </Sequence>
          );
        })}
      </div>
    </div>
  );
}

function ToolIcon({
  glyph,
  size,
  bg,
  accent,
  active,
  fps,
}: {
  glyph: string;
  size: number;
  bg: string;
  accent: string;
  active: boolean;
  fps: number;
}) {
  const frame = useCurrentFrame();
  const pop = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 260, mass: 0.7 },
  });
  const scale = interpolate(pop, [0, 1], [0, 1]);
  const opacity = interpolate(pop, [0, 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        background: active
          ? `linear-gradient(180deg, ${accent}33, ${accent}14)`
          : bg,
        border: active
          ? `1px solid ${accent}55`
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: active
          ? `inset 0 1px 0 rgba(255,255,255,0.12), 0 0 24px ${accent}33`
          : "inset 0 1px 0 rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? "#ffffff" : "rgba(255,255,255,0.7)",
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        transform: `scale(${scale})`,
        opacity,
        transformOrigin: "center",
      }}
    >
      {glyph}
    </div>
  );
}
