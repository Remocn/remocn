"use client";

import { AbsoluteFill, interpolate } from "remotion";
import { CanvasSceneA } from "@/components/docs/examples/canvas-scenes";
import { useSceneFrame } from "@/lib/remocn/frame-rate";
import { UnderwaterRipple } from "@/registry/remocn/underwater-ripple";

const SANS =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

export function RippleSurfaceExampleScene() {
  const frame = useSceneFrame();
  const amplitude = interpolate(frame, [0, 46, 86, 120], [34, 0, 0, 34]);

  return (
    <UnderwaterRipple amplitude={amplitude} speed={3}>
      <CanvasSceneA />
    </UnderwaterRipple>
  );
}

function PoolBackdrop() {
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(160deg, #0b3b47 0%, #10606b 55%, #1b8a86 100%)",
      }}
    >
      {[0.24, 0.46, 0.68, 0.86].map((top) => (
        <div
          key={top}
          style={{
            position: "absolute",
            insetInline: 0,
            top: `${top * 100}%`,
            height: 10,
            background: "rgba(226, 255, 250, 0.22)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
}

export function RippleBackdropExampleScene() {
  return (
    <AbsoluteFill>
      <UnderwaterRipple amplitude={14} scale={0.8} speed={2}>
        <PoolBackdrop />
      </UnderwaterRipple>
      <AbsoluteFill
        style={{ padding: 96, justifyContent: "center", fontFamily: SANS }}
      >
        <span
          style={{
            fontSize: 92,
            fontWeight: 600,
            letterSpacing: "-0.035em",
            lineHeight: 1.04,
            color: "#f4fbfa",
          }}
        >
          Deep work,
          <br />
          shallow setup
        </span>
        <span style={{ marginTop: 26, fontSize: 34, color: "#a9d4d0" }}>
          Everything configured before your coffee lands
        </span>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
