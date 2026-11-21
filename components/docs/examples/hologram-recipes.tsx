"use client";

import type React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { CanvasSceneA } from "@/components/docs/examples/canvas-scenes";
import { useSceneFrame } from "@/lib/remocn/frame-rate";
import { Hologram } from "@/registry/remocn/hologram";

const MONO =
  "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace";

const LINE = "#7ff2ff";
const SHELL = "#040a12";
const CYCLE = 90;

const OUTLINE = `polygon(
  0% 7%, 3% 1%, 30% 1%, 33% 6%, 68% 6%, 71% 0%, 95% 0%, 100% 6%,
  100% 66%, 96% 72%, 96% 100%, 34% 100%, 31% 94%, 3% 94%, 0% 88%
)`;

const HATCH = `repeating-linear-gradient(
  115deg,
  ${LINE} 0px,
  ${LINE} 5px,
  transparent 5px,
  transparent 12px
)`;

const DIAL_TICKS = Array.from({ length: 24 }, (_, i) => (i / 24) * 360);

function HudDial({
  size,
  style,
}: {
  size: number;
  style: React.CSSProperties;
}) {
  return (
    <div style={{ position: "absolute", width: size, height: size, ...style }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `2px solid ${LINE}`,
        }}
      />
      {DIAL_TICKS.map((angle) => (
        <div
          key={angle}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 2,
            height: size * 0.42,
            marginLeft: -1,
            transformOrigin: "top center",
            transform: `rotate(${angle}deg)`,
            borderBottom: `${size * 0.11}px solid ${LINE}`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: "34%",
          borderRadius: "50%",
          border: `3px solid ${LINE}`,
          borderRightColor: "transparent",
          borderBottomColor: "transparent",
        }}
      />
    </div>
  );
}

export function HudFrame({ children }: { children: React.ReactNode }) {
  const frame = useSceneFrame();
  const sweep = Math.floor((frame / CYCLE) * 10) % 10;

  return (
    <AbsoluteFill style={{ background: SHELL, fontFamily: MONO }}>
      <div
        style={{
          position: "absolute",
          inset: 30,
          background: LINE,
          clipPath: OUTLINE,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 3,
            background: SHELL,
            clipPath: OUTLINE,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: "72%",
          top: 44,
          width: "18%",
          height: 22,
          background: HATCH,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "10%",
          bottom: 62,
          width: "22%",
          height: 14,
          background: HATCH,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "36%",
          bottom: 62,
          width: "26%",
          height: 6,
          background: LINE,
          opacity: 0.55,
        }}
      />

      <HudDial size={132} style={{ right: 58, bottom: 46 }} />

      <span
        style={{
          position: "absolute",
          left: "11%",
          top: 46,
          fontSize: 22,
          letterSpacing: "0.22em",
          color: LINE,
        }}
      >
        RELAY 07 · FEED LIVE
      </span>
      <span
        style={{
          position: "absolute",
          right: "24%",
          bottom: 54,
          fontSize: 20,
          letterSpacing: "0.2em",
          color: LINE,
        }}
      >
        SYNC 9{sweep}%
      </span>

      <div style={{ position: "absolute", inset: "15% 17% 20% 10%" }}>
        {children}
      </div>
    </AbsoluteFill>
  );
}

const CONSOLE_ROWS = [
  { key: "FRAMES", value: "2481 / 2481" },
  { key: "DURATION", value: "00:01:22:14" },
  { key: "OUTPUT", value: "intro-scene.mp4" },
];

function ConsoleReadout() {
  return (
    <AbsoluteFill
      style={{ fontFamily: MONO, justifyContent: "center", color: LINE }}
    >
      <span style={{ fontSize: 26, letterSpacing: "0.32em", color: LINE }}>
        INBOUND TRANSMISSION
      </span>
      <span
        style={{
          marginTop: 22,
          fontSize: 104,
          fontWeight: 500,
          letterSpacing: "0.02em",
          lineHeight: 1,
          color: "#e8fdff",
        }}
      >
        RENDER COMPLETE
      </span>
      <div
        style={{
          marginTop: 40,
          paddingTop: 32,
          borderTop: `1px solid ${LINE}`,
          display: "flex",
          gap: 72,
        }}
      >
        {CONSOLE_ROWS.map((row) => (
          <div
            key={row.key}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <span
              style={{ fontSize: 20, letterSpacing: "0.2em", opacity: 0.65 }}
            >
              {row.key}
            </span>
            <span style={{ fontSize: 34, color: "#e8fdff" }}>{row.value}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

export function HologramConsoleExampleScene() {
  return (
    <Hologram>
      <HudFrame>
        <ConsoleReadout />
      </HudFrame>
    </Hologram>
  );
}

export function HologramBootExampleScene() {
  const frame = useSceneFrame();
  const unstable = interpolate(frame, [0, 34, 76, 96], [1, 0, 0, 1]);

  return (
    <Hologram
      ghost={1 + unstable * 3.6}
      flicker={1 + unstable * 2.6}
      glow={1 + unstable * 0.8}
    >
      <CanvasSceneA />
    </Hologram>
  );
}
