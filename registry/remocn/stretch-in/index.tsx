"use client";

import { type Font, parse } from "opentype.js";
import { useEffect, useMemo, useState } from "react";
import {
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";

export interface StretchInProps {
  className?: string;
  width?: number;
  height?: number;
  text?: string;
  fontUrl?: string;
  fontSize?: number;
  letterSpacing?: number;
  baselineY?: number;
  entryStart?: number;
  entryStagger?: number;
  travelFrames?: number;
  travelDistance?: number;
  vertexLagFrames?: number;
  curveSteps?: number;
  fill?: string;
  strokeWidth?: number;
  stroke?: string;
}

type Contour = [number, number][];

function flattenPath(
  commands: ReturnType<Font["getPath"]>["commands"],
  steps: number,
): Contour[] {
  const contours: Contour[] = [];
  let current: Contour = [];
  let cx = 0;
  let cy = 0;

  for (const cmd of commands) {
    if (cmd.type === "M") {
      if (current.length > 0) contours.push(current);
      current = [[cmd.x, cmd.y]];
      cx = cmd.x;
      cy = cmd.y;
    } else if (cmd.type === "L") {
      current.push([cmd.x, cmd.y]);
      cx = cmd.x;
      cy = cmd.y;
    } else if (cmd.type === "Q") {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        current.push([
          mt * mt * cx + 2 * mt * t * cmd.x1 + t * t * cmd.x,
          mt * mt * cy + 2 * mt * t * cmd.y1 + t * t * cmd.y,
        ]);
      }
      cx = cmd.x;
      cy = cmd.y;
    } else if (cmd.type === "C") {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        current.push([
          mt * mt * mt * cx +
            3 * mt * mt * t * cmd.x1 +
            3 * mt * t * t * cmd.x2 +
            t * t * t * cmd.x,
          mt * mt * mt * cy +
            3 * mt * mt * t * cmd.y1 +
            3 * mt * t * t * cmd.y2 +
            t * t * t * cmd.y,
        ]);
      }
      cx = cmd.x;
      cy = cmd.y;
    } else if (cmd.type === "Z") {
      if (current.length > 0) contours.push(current);
      current = [];
    }
  }
  if (current.length > 0) contours.push(current);
  return contours;
}

export function StretchIn({
  className,
  width = 1920,
  height = 1080,
  text = "REMOCN",
  fontUrl = "https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm0K0.ttf",
  fontSize = 510,
  letterSpacing = 0,
  baselineY,
  entryStart = 0,
  entryStagger = 3,
  travelFrames = 33,
  travelDistance = 1500,
  vertexLagFrames = 3.5,
  curveSteps = 8,
  fill = "#ffffff",
  strokeWidth = 0,
  stroke = "#ffffff",
}: StretchInProps) {
  const frame = useCurrentFrame();
  const [font, setFont] = useState<Font | null>(null);

  useEffect(() => {
    const handle = delayRender("stretch-in: loading font");
    let cancelled = false;
    fetch(fontUrl)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        if (!cancelled) setFont(parse(buffer));
        continueRender(handle);
      })
      .catch(() => {
        continueRender(handle);
      });
    return () => {
      cancelled = true;
    };
  }, [fontUrl]);

  const letters = useMemo(() => {
    if (!font) return null;
    const scale = fontSize / font.unitsPerEm;
    const glyphs = font.stringToGlyphs(text);
    let x = 0;
    const items = glyphs.map((glyph, i) => {
      if (i > 0) x += font.getKerningValue(glyphs[i - 1], glyph) * scale;
      const left = x;
      const advance = (glyph.advanceWidth ?? 0) * scale;
      const contours = flattenPath(
        glyph.getPath(x, 0, fontSize).commands,
        curveSteps,
      );
      x += advance + letterSpacing;
      return { left, width: advance, contours };
    });
    return { items, totalWidth: Math.max(0, x - letterSpacing) };
  }, [font, text, fontSize, letterSpacing, curveSteps]);

  if (!letters) return null;

  const startX = (width - letters.totalWidth) / 2;
  const resolvedBaseline = baselineY ?? (height + fontSize * 0.72) / 2;

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
        {letters.items.map((glyph, i) => {
          const entry = entryStart + entryStagger * i;
          const run = Math.max(1, travelFrames - vertexLagFrames);

          const d = glyph.contours
            .map((contour) => {
              const pts = contour.map(([px, py]) => {
                const u =
                  glyph.width === 0
                    ? 0
                    : Math.min(1, Math.max(0, (px - glyph.left) / glyph.width));
                const start = entry + u * vertexLagFrames;
                const remaining = interpolate(
                  frame,
                  [start, start + run],
                  [1, 0],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.bezier(0.2, 0.9, 0.25, 1),
                  },
                );
                return [
                  startX + px + travelDistance * remaining,
                  resolvedBaseline + py,
                ];
              });
              return (
                `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}` +
                pts
                  .slice(1)
                  .map((p) => `L${p[0].toFixed(2)},${p[1].toFixed(2)}`)
                  .join("") +
                "Z"
              );
            })
            .join(" ");

          return (
            <path
              key={`${i}-${glyph.left}`}
              d={d}
              fill={fill}
              fillRule="evenodd"
              stroke={strokeWidth > 0 ? stroke : "none"}
              strokeWidth={strokeWidth}
            />
          );
        })}
      </svg>
    </div>
  );
}
