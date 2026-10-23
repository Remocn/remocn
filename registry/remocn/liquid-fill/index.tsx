"use client";

import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type LiquidFillProps = {
  /** Wordmark revealed beside the mark once it is full. */
  children?: React.ReactNode;
  /** Mark outline as SVG path data inside a 100x100 box. Defaults to a rounded square. */
  shape?: string;
  backgroundColor?: string;
  liquidColor?: string;
  outlineColor?: string;
  /** Bubble outline color. */
  bubbleColor?: string;
  speed?: number;
};

const ROUNDED_SQUARE =
  "M 27 2 H 73 A 25 25 0 0 1 98 27 V 73 A 25 25 0 0 1 73 98 H 27 A 25 25 0 0 1 2 73 V 27 A 25 25 0 0 1 27 2 Z";

export const liquidFillDefaults = {
  shape: ROUNDED_SQUARE,
  backgroundColor: "#111111",
  liquidColor: "#E5322D",
  outlineColor: "#FFFFFF",
  bubbleColor: "#FFFFFF",
  speed: 1,
};

const LAND = 9;
const FULL = 34;
const SLIDE = 36;
const BUBBLES = 6;
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export function LiquidFill(props: LiquidFillProps) {
  const {
    children,
    shape,
    backgroundColor,
    liquidColor,
    outlineColor,
    bubbleColor,
    speed,
  } = { ...liquidFillDefaults, ...props };
  const uid = `liquid-fill-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame * Math.max(0, speed);
  const size = Math.round(Math.min(width, height) * 0.24);

  // Drop falls from above the mark and lands on the floor of the shape.
  const fall = interpolate(t, [0, LAND], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.quad),
  });
  const dropY = -70 + fall * 142;
  const dropStretch = 1 + 0.5 * fall;

  const level = interpolate(t, [LAND, FULL], [100, -12], {
    ...clamp,
    easing: Easing.bezier(0.35, 0, 0.35, 1),
  });
  const since = Math.max(0, t - LAND);
  const amp =
    t < LAND
      ? 0
      : 7 * Math.exp(-since / 10) * (1 - (t - LAND) / (FULL - LAND + 6));
  const splash = t < LAND ? 0 : 14 * Math.exp(-since / 3.5);
  const surface = (x: number) =>
    level +
    Math.max(0, amp) *
      (Math.sin(x * 0.09 + since * 0.7) +
        0.45 * Math.sin(x * 0.17 - since * 0.95 + 1.3)) -
    splash * Math.exp(-(((x - 50) / 10) ** 2)) +
    splash * 0.35 * Math.exp(-(((x - 50) / 26) ** 2));
  const xs = Array.from({ length: 27 }, (_, i) => -4 + i * 4.3);
  const wave = xs.map((x) => `${x.toFixed(2)} ${surface(x).toFixed(2)}`);
  const liquidPath = `M ${wave.join(" L ")} L 110 110 L -10 110 Z`;
  const meniscusPath = `M ${wave.join(" L ")}`;

  const solid = interpolate(t, [FULL - 2, FULL + 3], [0, 1], clamp);
  const stroke = interpolateColors(solid, [0, 1], [outlineColor, liquidColor]);

  const slide = interpolate(t, [SLIDE, SLIDE + 11], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const reveal = interpolate(t, [SLIDE + 2, SLIDE + 13], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const outlineIn = interpolate(t, [0, 5], [0, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: size * 0.24,
          transform: `translateX(calc((50% - ${size / 2}px) * ${children ? 1 - slide : 0}))`,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          style={{ flexShrink: 0, overflow: "visible" }}
        >
          <defs>
            <clipPath id={`${uid}-clip`}>
              <path d={shape} />
            </clipPath>
          </defs>
          {t < LAND + 1 && (
            <path
              d="M 0 -7 C 3 -2 5 1 5 4 A 5 5 0 0 1 -5 4 C -5 1 -3 -2 0 -7 Z"
              fill={liquidColor}
              transform={`translate(50 ${dropY}) scale(${1.6 / Math.sqrt(dropStretch)} ${1.6 * dropStretch})`}
              opacity={interpolate(
                t,
                [0, 2, LAND, LAND + 1],
                [0, 1, 1, 0],
                clamp,
              )}
            />
          )}
          <g clipPath={`url(#${uid}-clip)`}>
            {t >= LAND && <path d={liquidPath} fill={liquidColor} />}
            {t >= LAND && solid < 1 && (
              <path
                d={meniscusPath}
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity={0.35 * (1 - solid)}
                strokeWidth={1.4}
              />
            )}
            {Array.from({ length: BUBBLES }, (_, i) => {
              const start = LAND + 2 + random(`liquid-fill-b-${i}`) * 16;
              const age = t - start;
              if (age < 0) return null;
              const bx = 20 + random(`liquid-fill-x-${i}`) * 60;
              const by = 98 - age * (2.4 + random(`liquid-fill-v-${i}`) * 2);
              const r = 1.2 + random(`liquid-fill-r-${i}`) * 2;
              if (by < surface(bx) + r + 1) return null;
              return (
                <circle
                  key={i}
                  cx={bx + Math.sin(age * 0.6 + i) * 1.5}
                  cy={by}
                  r={r}
                  fill="none"
                  stroke={bubbleColor}
                  strokeOpacity={0.7 * (1 - solid)}
                  strokeWidth={0.8}
                />
              );
            })}
          </g>
          <path
            d={shape}
            fill="none"
            stroke={stroke}
            strokeWidth={3}
            opacity={outlineIn}
          />
        </svg>
        {children && (
          <div
            style={{
              opacity: reveal,
              clipPath: `inset(-30% ${(1 - reveal) * 100}% -30% -5%)`,
              transform: `translateX(${(1 - reveal) * -size * 0.3}px)`,
            }}
          >
            {children}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
