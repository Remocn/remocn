"use client";

import { useMemo } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface ExtrudePopProps {
  className?: string;
  width?: number;
  height?: number;
  letter?: string;
  fontFamily?: string;
  fontWeight?: number | string;
  fontSize?: number;
  basePosition?: [number, number];
  maxTextWidth?: number;
  minimaxRadius?: number;
  extrudeAngleDeg?: number;
  extrudeSteps?: number;
  extrudeStartFrame?: number;
  extrudeEndFrame?: number;
  bodyColor?: string;
  faceColor?: string;
}

export function ExtrudePop({
  className,
  width = 1920,
  height = 1080,
  letter = "WIN",
  fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontWeight = 700,
  fontSize = 603,
  basePosition = [959.2, 752.5],
  maxTextWidth = 1660,
  minimaxRadius = 80,
  extrudeAngleDeg = -58.6,
  extrudeSteps = 200,
  extrudeStartFrame = 0,
  extrudeEndFrame = 48,
  bodyColor = "#e8192b",
  faceColor = "#ffffff",
}: ExtrudePopProps) {
  const frame = useCurrentFrame();

  const fit = useMemo(() => {
    if (typeof document === "undefined") return 1;
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return 1;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const measured = ctx.measureText(letter).width;
    if (measured <= 0) return 1;
    return Math.min(1, maxTextWidth / measured);
  }, [letter, fontFamily, fontWeight, fontSize, maxTextWidth]);

  const fitFontSize = fontSize * fit;
  const fitRadius = minimaxRadius * fit;

  const radius = interpolate(
    frame,
    [extrudeStartFrame, extrudeEndFrame],
    [0, fitRadius],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );

  const depth = radius * 2;

  const theta = (extrudeAngleDeg * Math.PI) / 180;
  const stepX = (depth * Math.sin(theta)) / extrudeSteps;
  const stepY = (depth * Math.cos(theta)) / extrudeSteps;

  const glyph = (fill: string, dx: number, dy: number, key?: string) => (
    <text
      key={key}
      x={basePosition[0] + dx}
      y={basePosition[1] + dy}
      textAnchor="middle"
      fontFamily={fontFamily}
      fontWeight={fontWeight}
      fontSize={fitFontSize}
      fill={fill}
    >
      {letter}
    </text>
  );

  return (
    <div
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        <g>
          {Array.from(
            { length: extrudeSteps + 1 },
            (_, i) => extrudeSteps - i,
          ).map((i) => glyph(bodyColor, stepX * i, stepY * i, `body-${i}`))}
        </g>

        {glyph(faceColor, stepX * extrudeSteps, stepY * extrudeSteps)}
      </svg>
    </div>
  );
}
