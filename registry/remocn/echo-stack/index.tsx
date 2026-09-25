"use client";

import { loadFont } from "@remotion/google-fonts/Inter";
import { useId } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const { fontFamily: INTER } = loadFont("normal", {
  weights: ["100", "900"],
  subsets: ["latin"],
});

export type EchoStackDirection = "up" | "down";

export interface EchoStackProps {
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  color?: string;
  echoColor?: string;
  echoes?: number;
  echoOpacity?: number;
  strokeWidth?: number;
  direction?: EchoStackDirection;
  cycle?: number;
  speed?: number;
  className?: string;
}

export const echoStackDefaults = {
  text: "Bold.",
  fontSize: 170,
  fontWeight: 800,
  fontFamily: INTER,
  color: "#fafafa",
  echoColor: "",
  echoes: 3,
  echoOpacity: 0.35,
  strokeWidth: 1.5,
  direction: "up",
  cycle: 60,
  speed: 1,
} satisfies Required<Omit<EchoStackProps, "className">>;

/** Frame where the entrance has finished; the drift keeps running after it. */
export const echoStackLength = 26;

/** Distance between echo rows, in em. */
export const echoStackPitch = 1.05;

/** Echoes closer to the center than this, in pitches, hide behind the word. */
const HIDDEN = 0.55;
const MAIN = [0, 14] as const;
const UNFOLD = [8, 26] as const;
const FADE_IN = [8, 24] as const;
const START_SPREAD = 0.6;
const MAX_BLUR = 12;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const easeOutCubic = Easing.out(Easing.cubic);

function finite(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function smoothstep(x: number) {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
}

/** Maps a composition frame onto the 30 fps timeline, scaled by `speed`. */
export function getEchoStackTime(
  frame: number,
  options: { fps?: number; speed?: number } = {},
) {
  const fps = Math.max(1, finite(options.fps, 30));
  const speed = Math.max(0, finite(options.speed, 1));
  return (Math.max(0, finite(frame, 0)) * 30 * speed) / fps;
}

/** The main word focusing in. Blur is in reference px. */
export function getEchoStackMain(t: number) {
  const k = interpolate(t, [...MAIN], [0, 1], {
    ...CLAMP,
    easing: easeOutCubic,
  });
  return { blur: MAX_BLUR * (1 - k), opacity: k, scale: 1.04 - 0.04 * k };
}

/** Echo visibility at a distance from the center, in pitches, before `echoOpacity`. */
export function getEchoStackFade(distance: number, echoes: number) {
  const d = Math.abs(distance);
  if (d < HIDDEN) return 0;
  if (d < 1) return smoothstep((d - HIDDEN) / (1 - HIDDEN));
  const reach = Math.max(1, echoes + 0.5);
  return Math.max(0, 1 - (d - 1) / (reach - 1));
}

export interface EchoStackRow {
  /** Signed distance from the center in pitches, negative above. */
  offset: number;
  /** Row position in pitches after the unfold, negative above. */
  position: number;
  opacity: number;
}

export function getEchoStackRows(
  t: number,
  options: {
    echoes?: number;
    echoOpacity?: number;
    cycle?: number;
    direction?: EchoStackDirection;
  } = {},
): EchoStackRow[] {
  const echoes = Math.max(0, Math.round(finite(options.echoes, 3)));
  const echoOpacity = Math.max(0, finite(options.echoOpacity, 0.35));
  const cycle = Math.max(1, finite(options.cycle, 60));
  const sign = options.direction === "down" ? 1 : -1;
  const phase = sign * ((t / cycle) % 1);
  const spread = interpolate(t, [...UNFOLD], [START_SPREAD, 1], {
    ...CLAMP,
    easing: easeOutCubic,
  });
  const fadeIn = interpolate(t, [...FADE_IN], [0, 1], {
    ...CLAMP,
    easing: easeOutCubic,
  });
  const rows: EchoStackRow[] = [];
  const reach = echoes + 2;
  for (let k = -reach; k <= reach; k++) {
    const offset = k + phase;
    const opacity = echoOpacity * fadeIn * getEchoStackFade(offset, echoes);
    if (opacity <= 0) continue;
    rows.push({ offset, position: offset * spread, opacity });
  }
  return rows;
}

export function EchoStack({
  text = echoStackDefaults.text,
  fontSize = echoStackDefaults.fontSize,
  fontWeight = echoStackDefaults.fontWeight,
  fontFamily = echoStackDefaults.fontFamily,
  color = echoStackDefaults.color,
  echoColor = echoStackDefaults.echoColor,
  echoes = echoStackDefaults.echoes,
  echoOpacity = echoStackDefaults.echoOpacity,
  strokeWidth = echoStackDefaults.strokeWidth,
  direction = echoStackDefaults.direction,
  cycle = echoStackDefaults.cycle,
  speed = echoStackDefaults.speed,
  className,
}: EchoStackProps) {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const unit = height / 720;
  const size = fontSize * unit;
  const t = getEchoStackTime(frame, { fps, speed });
  const main = getEchoStackMain(t);
  const rows = getEchoStackRows(t, { echoes, echoOpacity, cycle, direction });
  const pitch = echoStackPitch * size;
  const outlineId = `echo-stack-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const type = {
    fontFamily,
    fontSize: size,
    lineHeight: 1,
    fontWeight,
    fontVariationSettings: `"wght" ${fontWeight}`,
    whiteSpace: "pre",
  } as const;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Outline from the filled silhouette: the variable font's overlapping
          contours would show through a text stroke. */}
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={outlineId}>
            <feMorphology
              in="SourceAlpha"
              operator="erode"
              radius={strokeWidth * unit}
              result="inner"
            />
            <feComposite
              in="SourceAlpha"
              in2="inner"
              operator="out"
              result="ring"
            />
            <feFlood floodColor={echoColor || color} />
            <feComposite in2="ring" operator="in" />
          </filter>
        </defs>
      </svg>
      <div style={{ position: "relative" }}>
        {rows.map((row, i) => (
          <div
            key={i}
            aria-hidden
            style={{
              ...type,
              position: "absolute",
              left: "50%",
              top: "50%",
              color: echoColor || color,
              filter: `url(#${outlineId})`,
              opacity: row.opacity,
              transform: `translate(-50%, calc(-50% + ${row.position * pitch}px))`,
            }}
          >
            {text}
          </div>
        ))}
        <div
          style={{
            ...type,
            position: "relative",
            color,
            opacity: main.opacity,
            filter:
              main.blur > 0.05 ? `blur(${main.blur * unit}px)` : undefined,
            transform: `scale(${main.scale})`,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
