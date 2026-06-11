"use client";

import { BlurIn, type BlurInDirection, type BlurInState } from "./index";

export interface BlurInPreviewProps {
  state?: BlurInState;
  blur?: number;
  distance?: number;
  direction?: BlurInDirection;
  speed?: number;
}

/**
 * Preview-only wrapper for the customizer. `BlurIn` wraps a SINGLE child, so it
 * needs sample content — this thin wrapper supplies a fixed ~160×96 card and
 * centers it on a stage just for the preview. The customizer Player renders its
 * `component` as the composition root, so a bare wrapped child would sit
 * top-left. NOT shipped: not listed in registry.json files.
 */
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
