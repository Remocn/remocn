"use client";

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  FLOW_BG,
  FLOW_BORDER,
  FLOW_INK,
  FLOW_MUTED,
  FLOW_YELLOW,
  FONT,
} from "../foundation";

const BAR_HEIGHTS = [
  0.34, 0.52, 0.41, 0.66, 0.48, 0.58, 0.39, 0.7, 0.5, 0.61, 0.45, 0.74, 0.55,
  0.68, 0.43, 0.79, 0.6, 0.95, 0.86, 0.64, 0.49, 0.57, 0.42, 0.36,
];

const YELLOW_BARS = new Set([17, 18]);

export function FocusAnalytics({ speed = 1 }: { speed?: number }) {
  const f = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const pop = spring({
    frame: f - 4,
    fps,
    config: { damping: 16, stiffness: 130 },
  });
  const cardScale = interpolate(pop, [0, 1], [0.86, 1]);
  const cardOpacity = interpolate(f, [4, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const johnPop = spring({
    frame: f - 16,
    fps,
    config: { damping: 15, stiffness: 160 },
  });
  const amyPop = spring({
    frame: f - 24,
    fps,
    config: { damping: 15, stiffness: 160 },
  });

  return (
    <AbsoluteFill
      style={{
        background: FLOW_BG,
        fontFamily: FONT,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          transform: `scale(${cardScale})`,
          opacity: cardOpacity,
        }}
      >
        <div
          style={{
            width: 760,
            padding: "44px 48px 40px",
            borderRadius: 16,
            background: "#FFFFFF",
            border: `4px solid ${FLOW_YELLOW}`,
            boxShadow:
              "0 0 0 1px rgba(242,210,0,0.35), 0 18px 50px rgba(30,28,22,0.08), 0 0 26px rgba(242,210,0,0.22)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: FLOW_MUTED,
                letterSpacing: "-0.01em",
              }}
            >
              Focus Time
            </span>
            <span
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "#3FA34D",
              }}
            >
              +18%
            </span>
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 64,
              fontWeight: 700,
              color: FLOW_INK,
              letterSpacing: "-0.02em",
            }}
          >
            4h 25m
          </div>

          <div
            style={{
              marginTop: 34,
              height: 180,
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            {BAR_HEIGHTS.map((h, i) => {
              const grow = spring({
                frame: f - 14 - i * 2,
                fps,
                config: { damping: 18, stiffness: 150 },
              });
              const isYellow = YELLOW_BARS.has(i);
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h * 100}%`,
                    borderRadius: 5,
                    transformOrigin: "bottom",
                    transform: `scaleY(${grow})`,
                    background: isYellow ? FLOW_YELLOW : "#ECE9DA",
                  }}
                />
              );
            })}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: -22,
            right: 70,
            transform: `scale(${johnPop})`,
            transformOrigin: "center",
          }}
        >
          <AvatarChip name="John" color="#2B2A24" />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: -22,
            right: -34,
            transform: `scale(${amyPop})`,
            transformOrigin: "center",
          }}
        >
          <AvatarChip name="Amy" color="#C98A2B" />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function AvatarChip({ name, color }: { name: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "8px 16px 8px 9px",
        borderRadius: 999,
        background: "#FFFFFF",
        border: `1px solid ${FLOW_BORDER}`,
        boxShadow: "0 6px 18px rgba(30,28,22,0.1)",
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          background: color,
        }}
      />
      <span style={{ fontSize: 21, fontWeight: 600, color: FLOW_INK }}>
        {name}
      </span>
    </div>
  );
}
