"use client";

import type { ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export interface DeviceMockupZoomProps {
  children?: ReactNode;
  device?: "laptop" | "phone";
  frameColor?: string;
  screenColor?: string;
  speed?: number;
  className?: string;
}

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function DefaultScreen() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, #0ea5e9 0%, #9333ea 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: FONT_FAMILY,
        fontSize: 32,
        fontWeight: 700,
        letterSpacing: "-0.03em",
      }}
    >
      Your UI
    </div>
  );
}

export function DeviceMockupZoom({
  children,
  device = "laptop",
  frameColor = "#1f1f1f",
  screenColor = "#0a0a0a",
  speed = 1,
  className,
}: DeviceMockupZoomProps) {
  const frame = useCurrentFrame() * speed;
  const { durationInFrames } = useVideoConfig();

  const scale = interpolate(frame, [0, durationInFrames], [2, 1], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  const screen = children ?? <DefaultScreen />;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {device === "laptop" ? (
          <div style={{ position: "relative" }}>
            {/* Screen body */}
            <div
              style={{
                width: 720,
                height: 440,
                background: frameColor,
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  background: screenColor,
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                {screen}
              </div>
            </div>
            {/* Base */}
            <div
              style={{
                width: 820,
                height: 18,
                background: frameColor,
                borderBottomLeftRadius: 14,
                borderBottomRightRadius: 14,
                marginLeft: -50,
                marginTop: -2,
                boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
              }}
            />
            <div
              style={{
                width: 120,
                height: 6,
                background: "#0a0a0a",
                marginLeft: "auto",
                marginRight: "auto",
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
                marginTop: -1,
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: 280,
              height: 560,
              background: frameColor,
              borderRadius: 44,
              padding: 14,
              boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background: screenColor,
                borderRadius: 32,
                overflow: "hidden",
              }}
            >
              {screen}
            </div>
            <div
              style={{
                position: "absolute",
                top: 22,
                left: "50%",
                transform: "translateX(-50%)",
                width: 90,
                height: 22,
                background: "#0a0a0a",
                borderRadius: 14,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
