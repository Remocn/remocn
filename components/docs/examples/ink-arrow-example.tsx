"use client";

import { AbsoluteFill } from "remotion";
import { InkArrow } from "@/registry/remocn/ink-arrow";

const INK = "#26242c";
const PENCIL = "rgba(38,36,44,0.55)";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

const FROM = { x: 20, y: 20 };
const TO = { x: 300, y: 210 };

export function InkArrowExampleScene({
  curvature,
  color,
  strokeWidth,
  drawDur,
  headSize,
  headDur,
  seed,
  step,
}: {
  curvature?: number;
  color?: string;
  strokeWidth?: number;
  drawDur?: number;
  headSize?: number;
  headDur?: number;
  seed?: string;
  step?: number;
}) {
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 200,
          top: 150,
          fontFamily: FONT_FAMILY,
          fontSize: 52,
          fontWeight: 600,
          color: INK,
        }}
      >
        Start here
      </div>

      <div style={{ position: "absolute", left: 300, top: 210 }}>
        <InkArrow
          from={FROM}
          to={TO}
          curvature={curvature}
          color={color}
          strokeWidth={strokeWidth}
          drawDur={drawDur}
          headSize={headSize}
          headDur={headDur}
          seed={seed}
          step={step}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 600,
          top: 400,
          background: "#fdfcf8",
          border: "1px solid rgba(38,36,44,0.12)",
          borderRadius: 4,
          padding: "24px 32px",
          boxShadow: "0 8px 20px rgba(38,36,44,0.12)",
          fontFamily: FONT_FAMILY,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 600, color: INK }}>
          The thing it points at
        </div>
        <div style={{ fontSize: 18, color: PENCIL, marginTop: 6 }}>
          Positioned by you, drawn by the pen
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const inkArrowExampleCode = (
  values: Record<string, unknown>,
): string => {
  const curvature = (values.curvature as number) ?? 0.35;
  const color = (values.color as string) ?? "#26242c";
  const strokeWidth = (values.strokeWidth as number) ?? 3;
  const drawDur = (values.drawDur as number) ?? 36;
  const headSize = (values.headSize as number) ?? 24;
  const headDur = (values.headDur as number) ?? 12;
  const seed = (values.seed as string) ?? "arrow";
  const step = (values.step as number) ?? 3;
  return `import { InkArrow } from "@/components/remocn/ink-arrow";

export const MyScene = () => (
  <div style={{ position: "absolute", left: 300, top: 210 }}>
    <InkArrow
      from={{ x: ${FROM.x}, y: ${FROM.y} }}
      to={{ x: ${TO.x}, y: ${TO.y} }}
      curvature={${curvature}}
      color="${color}"
      strokeWidth={${strokeWidth}}
      drawDur={${drawDur}}
      headSize={${headSize}}
      headDur={${headDur}}
      seed="${seed}"
      step={${step}}
    />
  </div>
);`;
};
