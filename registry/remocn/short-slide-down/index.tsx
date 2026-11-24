"use client";

import { useMemo } from "react";
import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type ShortSlideDownElementId,
  shortSlideDownTimeline,
} from "./timeline";

export interface ShortSlideDownProps {
  text: string;
  entryOffset?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches single words, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<ShortSlideDownElementId>;
}

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

export function ShortSlideDown(props: ShortSlideDownProps) {
  const {
    text,
    entryOffset = 28,
    fontSize = 72,
    color = "#171717",
    fontWeight = 600,
    speed = 1,
    className,
    timing,
  } = props;
  const glide = useGlide();
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    shortSlideDownTimeline,
    props,
    durationInFrames * speed,
    timing,
  );

  const words = useMemo(() => text.split(" "), [text]);
  const n = words.length;

  const lineGap = 12;
  const rowHeight = fontSize;
  const entryScale = 0.992;
  const entryBlur = 2.4;
  const reflowBlur = 0.7;
  const firstWordY = -14;
  const easing = Easing.bezier(0.2, 0.8, 0.2, 1);

  const positionsAt = useMemo(() => {
    const out: number[][] = [];
    for (let k = 1; k <= n; k++) {
      const total = rowHeight * k + lineGap * (k - 1);
      const start = -total / 2 + rowHeight / 2;
      const ys: number[] = [];
      for (let j = 0; j < k; j++) ys.push(start + j * (rowHeight + lineGap));
      out.push(ys);
    }
    return out;
  }, [n, rowHeight]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <div
        className={className}
        style={{
          position: "relative",
          fontSize,
          fontWeight,
          color,
          letterSpacing: "-0.03em",
          fontFamily: FONT_FAMILY,
          whiteSpace: "nowrap",
        }}
      >
        {words.map((word, j) => {
          const entry = tl.get(`word:${j}`);
          const entryStart = entry.start;
          const entryEnd = entry.end;
          const targetY = positionsAt[j][j];
          const yFrom = j === 0 ? firstWordY : targetY - entryOffset;

          let y = targetY;
          let opacity = 1;
          let scale = 1;
          let blur = 0;
          let moving = false;

          if (frame < entryStart) {
            opacity = 0;
            y = yFrom;
            scale = entryScale;
            blur = entryBlur;
          } else if (frame <= entryEnd) {
            const range: [number, number] = [entryStart, entryEnd];
            const travelRange: [number, number] = [
              entryStart,
              Math.min(entryStart + entry.beat("travel"), entryEnd),
            ];
            const opts = {
              extrapolateLeft: "clamp" as const,
              extrapolateRight: "clamp" as const,
              easing,
            };
            y = interpolate(frame, travelRange, [yFrom, targetY], opts);
            opacity = interpolate(frame, range, [0, 1], opts);
            scale = interpolate(frame, range, [entryScale, 1], opts);
            blur = interpolate(frame, range, [entryBlur, 0], opts);
            moving = midway(interpolate(frame, range, [0, 1], opts));
          } else {
            for (let w = j + 1; w < n; w++) {
              const pusher = tl.get(`word:${w}`);
              const pushStart = pusher.start;
              const pushEnd = pusher.end;
              const fromY = positionsAt[w - 1][j];
              const toY = positionsAt[w][j];
              if (frame >= pushEnd) {
                y = toY;
              } else if (frame >= pushStart) {
                const push = interpolate(
                  frame,
                  [
                    pushStart,
                    Math.min(pushStart + pusher.beat("travel"), pushEnd),
                  ],
                  [0, 1],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing,
                  },
                );
                y = interpolate(push, [0, 1], [fromY, toY]);
                moving = midway(push);
                blur = interpolate(
                  frame,
                  [pushStart, (pushStart + pushEnd) / 2, pushEnd],
                  [0, reflowBlur, 0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                );
                break;
              } else {
                y = fromY;
                break;
              }
            }
          }

          return (
            <span
              key={j}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                whiteSpace: "nowrap",
                backfaceVisibility: "hidden",
                transform: `translate(-50%, -50%) translate3d(0px, ${y}px, 0) scale(${scale})${glide(moving)}`,
                filter: `blur(${blur}px)`,
                opacity,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
