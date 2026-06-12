"use client";

import { BlurIn, type BlurInDirection, type BlurInState } from "./index";

export interface BlurInPreviewProps {
  state?: BlurInState;
  blur?: number;
  distance?: number;
  direction?: BlurInDirection;
  speed?: number;
}

export function BlurInPreview({
  state = "revealed",
  blur = 8,
  distance = 12,
  direction = "up",
}: BlurInPreviewProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <BlurIn
        state={state}
        blur={blur}
        distance={distance}
        direction={direction}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 160,
            height: 96,
            borderRadius: 12,
            border: "1px solid #e5e5e5",
            background: "#fafafa",
            color: "#171717",
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          Blur In
        </div>
      </BlurIn>
    </div>
  );
}
