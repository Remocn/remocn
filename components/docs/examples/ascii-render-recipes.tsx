"use client";

import { AbsoluteFill, interpolate } from "remotion";
import {
  CanvasSceneA,
  CanvasSceneB,
} from "@/components/docs/examples/canvas-scenes";
import { useSceneFrame } from "@/lib/remocn/frame-rate";
import { AsciiRender } from "@/registry/remocn/ascii-render";

const SANS =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

export function AsciiResolveExampleScene() {
  const frame = useSceneFrame();
  const intensity = interpolate(frame, [0, 34, 76, 96], [1, 0, 0, 1]);
  const glyphSize = interpolate(frame, [0, 34, 76, 96], [44, 20, 20, 44]);

  return (
    <AsciiRender intensity={intensity} glyphSize={glyphSize}>
      <CanvasSceneA />
    </AsciiRender>
  );
}

export function AsciiBeatExampleScene() {
  const frame = useSceneFrame();
  const intensity = interpolate(
    frame,
    [18, 20, 32, 56, 58, 70],
    [0, 1, 0, 0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AsciiRender intensity={intensity} glyphSize={24}>
      <CanvasSceneB />
    </AsciiRender>
  );
}

const COLUMNS = 16;
const ROWS = 9;
const CELLS = Array.from({ length: ROWS }, (_, row) =>
  Array.from({ length: COLUMNS }, (_, column) => ({
    row,
    column,
    key: `${row}-${column}`,
  })),
).flat();

function SignalField() {
  const frame = useSceneFrame();

  return (
    <AbsoluteFill
      style={{ background: "#07100c", display: "flex", flexWrap: "wrap" }}
    >
      {CELLS.map((cell) => {
        const wave =
          Math.sin(
            (cell.column + cell.row) * 0.62 - (frame / 90) * Math.PI * 4,
          ) *
            0.5 +
          0.5;
        return (
          <div
            key={cell.key}
            style={{
              width: `${100 / COLUMNS}%`,
              height: `${100 / ROWS}%`,
              background: `rgba(120, 255, 190, ${0.06 + wave * 0.5})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

export function AsciiBackdropExampleScene() {
  return (
    <AbsoluteFill>
      <AsciiRender glyphSize={18} ink="#2f7a52">
        <SignalField />
      </AsciiRender>
      <AbsoluteFill
        style={{
          padding: 96,
          justifyContent: "center",
          fontFamily: SANS,
        }}
      >
        <span
          style={{
            fontSize: 96,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: "#f2f2f2",
          }}
        >
          Every render,
          <br />
          byte for byte
        </span>
        <span style={{ marginTop: 28, fontSize: 34, color: "#8b9a90" }}>
          Deterministic output across parallel workers
        </span>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
