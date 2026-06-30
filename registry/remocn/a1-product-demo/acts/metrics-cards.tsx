"use client";

import type { ReactNode } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  FLOW_BG,
  FLOW_GREEN_LOW,
  FLOW_GREEN_MID,
  FLOW_GREEN_TOP,
  FONT,
} from "../foundation";

const CARD_GRADIENT = `linear-gradient(160deg, ${FLOW_GREEN_TOP} 0%, ${FLOW_GREEN_MID} 55%, ${FLOW_GREEN_LOW} 100%)`;
const CARD_W = 360;
const CARD_H = 360;
const CARD_GAP = 48;

function Card({
  index,
  f,
  fps,
  children,
}: {
  index: number;
  f: number;
  fps: number;
  children: ReactNode;
}) {
  const enter = spring({
    frame: f - index * 8,
    fps,
    config: { damping: 18, stiffness: 110 },
  });
  const ty = interpolate(enter, [0, 1], [70, 0]);
  const scale = interpolate(enter, [0, 1], [0.9, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: 18,
        background: CARD_GRADIENT,
        boxShadow: "0 24px 60px rgba(79, 107, 42, 0.22)",
        color: "#FFFFFF",
        padding: 40,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        opacity,
        transform: `translateY(${ty}px) scale(${scale})`,
        transformOrigin: "center bottom",
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: 22,
        fontWeight: 600,
        lineHeight: 1.25,
        color: "rgba(255, 255, 255, 0.92)",
        maxWidth: 220,
      }}
    >
      {children}
    </div>
  );
}

export function MetricsCards({ speed = 1 }: { speed?: number }) {
  const f = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: FLOW_BG,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", gap: CARD_GAP }}>
        <Card index={0} f={f} fps={fps}>
          <Label>AI-Powered Task Management</Label>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              display: "flex",
              alignItems: "flex-end",
              lineHeight: 1,
            }}
          >
            <span style={{ fontSize: 116 }}>87</span>
            <span style={{ fontSize: 56, marginBottom: 8 }}>%</span>
          </div>
        </Card>

        <Card index={1} f={f} fps={fps}>
          <Label>Smart Planning &amp; Scheduling</Label>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              display: "flex",
              alignItems: "flex-end",
              lineHeight: 1,
            }}
          >
            <span style={{ fontSize: 116 }}>6.2</span>
            <span style={{ fontSize: 56, marginBottom: 8 }}>h</span>
          </div>
        </Card>

        <Card index={2} f={f} fps={fps}>
          <Label>Unified Team Workspace</Label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "18px 28px",
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 64,
              lineHeight: 1,
            }}
          >
            <span>24</span>
            <span>3</span>
            <span>12</span>
            <span>68</span>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
}
