"use client";

import { type ReactNode, useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type LongShadowProps = {
  /** Flat icon or mark that casts the shadow. Defaults to a red check badge. */
  children?: ReactNode;
  /** Shadow direction in degrees at the start (0 = right, 90 = down). */
  angleFrom?: number;
  /** Shadow direction after the light swings. */
  angleTo?: number;
  shadowColor?: string;
  background?: string;
  /** Fade the shadow toward its far end, 0 to 1. */
  fade?: number;
  /** Colors of the default badge. */
  iconColor?: string;
  checkColor?: string;
  speed?: number;
};

export const longShadowDefaults = {
  angleFrom: 45,
  angleTo: 135,
  shadowColor: "#ECEAE6",
  background: "#FFFFFF",
  fade: 0,
  iconColor: "#E5322D",
  checkColor: "#FFFFFF",
  speed: 1,
};

export const longShadowLength = 48;

// Log-doubling extrusion: each pass unions the silhouette with itself shifted by
// twice the previous distance, so 10 passes stack 1024 copies.
const PASSES = 10;
const COPIES = 2 ** PASSES - 1;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

function Badge({
  size,
  iconColor,
  checkColor,
}: {
  size: number;
  iconColor: string;
  checkColor: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx={50} cy={50} r={49} fill={iconColor} />
      <path
        d="M 29 52 L 44 66 L 72 36"
        fill="none"
        stroke={checkColor}
        strokeWidth={11}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LongShadow({
  children,
  angleFrom = longShadowDefaults.angleFrom,
  angleTo = longShadowDefaults.angleTo,
  shadowColor = longShadowDefaults.shadowColor,
  background = longShadowDefaults.background,
  fade = longShadowDefaults.fade,
  iconColor = longShadowDefaults.iconColor,
  checkColor = longShadowDefaults.checkColor,
  speed = longShadowDefaults.speed,
}: LongShadowProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const t = (frame / fps) * 30 * speed;
  const unit = Math.min(width, height) / 720;

  const pop = spring({
    frame: t,
    fps: 30,
    config: { damping: 13, stiffness: 170, mass: 0.8 },
  });
  const grow = interpolate(t, [7, 22], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const swing = spring({
    frame: t - 24,
    fps: 30,
    config: { damping: 11, stiffness: 70, mass: 0.9 },
  });
  const angle = angleFrom + (angleTo - angleFrom) * swing;
  const rad = (angle * Math.PI) / 180;
  const length = Math.hypot(width, height) * grow;
  const step = length / COPIES;
  const dx = Math.cos(rad) * step;
  const dy = Math.sin(rad) * step;

  const content = children ?? (
    <Badge
      size={Math.min(width, height) * 0.34}
      iconColor={iconColor}
      checkColor={checkColor}
    />
  );
  const mask =
    fade > 0
      ? `linear-gradient(${angle + 90}deg, #000 50%, rgba(0,0,0,${1 - Math.min(1, fade)}) 100%)`
      : undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: background, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <filter
          id={`${id}-extrude`}
          x="0"
          y="0"
          width="1"
          height="1"
          colorInterpolationFilters="sRGB"
        >
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 3 0"
            result="m0"
          />
          {Array.from({ length: PASSES }, (_, i) => (
            <feOffset
              key={`o${i}`}
              in={`m${i}`}
              dx={dx * 2 ** i}
              dy={dy * 2 ** i}
              result={`o${i}`}
            />
          )).flatMap((offset, i) => [
            offset,
            <feMerge key={`m${i}`} result={`m${i + 1}`}>
              <feMergeNode in={`m${i}`} />
              <feMergeNode in={`o${i}`} />
            </feMerge>,
          ])}
          {/* feOffset snaps to whole pixels; a hair of blur hides the steps. */}
          <feGaussianBlur
            in={`m${PASSES}`}
            stdDeviation={0.8 * unit}
            result="soft"
          />
          <feFlood floodColor={shadowColor} />
          <feComposite in2="soft" operator="in" />
        </filter>
      </svg>
      <AbsoluteFill
        style={{
          transform: `scale(${pop})`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            filter: `url(#${id}-extrude)`,
            opacity: grow > 0 ? 1 : 0,
            maskImage: mask,
            WebkitMaskImage: mask,
          }}
        >
          {content}
        </AbsoluteFill>
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          {content}
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
