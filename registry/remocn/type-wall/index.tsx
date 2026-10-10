"use client";

import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { useId } from "react";
import {
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: INTER } = loadInter("normal", {
  weights: ["900"],
  subsets: ["latin"],
});
const { fontFamily: ANTON } = loadAnton("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export type TypeWallStyle = "solid" | "narrow" | "outline";

export interface TypeWallProps {
  text?: string;
  separator?: string;
  fontSize?: number;
  color?: string;
  accent?: string;
  accentText?: string;
  seed?: number;
  speed?: number;
  className?: string;
}

export const typeWallDefaults = {
  text: "MOTION",
  separator: "·",
  fontSize: 64,
  color: "#fafafa",
  accent: "#D97757",
  accentText: "#0a0a0a",
  seed: 7,
  speed: 1,
} satisfies Required<Omit<TypeWallProps, "className">>;

/** Row faces away from the center, the accent row always solid. */
export const typeWallStyles: readonly TypeWallStyle[] = [
  "solid",
  "narrow",
  "outline",
];

/** Anton sized so its capitals match Inter's cap height (0.7275 / 0.8594 em). */
const NARROW_SCALE = 0.7275 / 0.8594;
/** Tokens per second at speed 1, before each row's seeded factor. */
const TOKENS_PER_SECOND = 0.22;
const ENTRANCE = 20;
const STAGGER = 2;
/** Tokens a row streams past on its way in, on top of its cruise. */
const ENTRANCE_BURST = 2.5;
const BAND = [6, 20] as const;
/** Lower bound on a token's width per character, in em, for the repeat count. */
const MIN_CHAR_WIDTH = 0.4;
const MAX_TOKENS = 48;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const easeOutCubic = Easing.out(Easing.cubic);

function finite(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function fract(x: number) {
  return x - Math.floor(x);
}

/** Maps a composition frame onto the 30 fps timeline, scaled by `speed`. */
export function getTypeWallTime(
  frame: number,
  options: { fps?: number; speed?: number } = {},
) {
  const fps = Math.max(1, finite(options.fps, 30));
  const speed = Math.max(0, finite(options.speed, 1));
  return (Math.max(0, finite(frame, 0)) * 30 * speed) / fps;
}

/** Row indices from the top of the frame to the bottom; row 0 is centered. */
export function getTypeWallRows(height: number, rowHeight: number) {
  const reach = Math.ceil((height / 2 - rowHeight / 2) / rowHeight) + 1;
  const rows: number[] = [];
  for (let k = -reach; k <= reach; k++) rows.push(k);
  return rows;
}

export function getTypeWallStyle(row: number): TypeWallStyle {
  if (row === 0) return "solid";
  const n = typeWallStyles.length;
  return typeWallStyles[((row % n) + n) % n];
}

/** −1 runs left, 1 runs right. The accent row runs left. */
export function getTypeWallDirection(row: number) {
  return Math.abs(row) % 2 === 0 ? -1 : 1;
}

/** Cruise speed in tokens per frame and the row's starting phase. */
export function getTypeWallMotion(row: number, seed: number) {
  const factor = 0.7 + 0.6 * random(`type-wall-${seed}-speed-${row}`);
  return {
    velocity: (TOKENS_PER_SECOND * factor) / 30,
    phase: random(`type-wall-${seed}-phase-${row}`),
  };
}

export interface TypeWallRowState {
  direction: number;
  /** Translation of the token strip in tokens, always in [−1, 0). */
  shift: number;
  /** Share of the row revealed from its entering side, 0..1. */
  reveal: number;
}

export function getTypeWallRow(
  t: number,
  row: number,
  seed = typeWallDefaults.seed,
): TypeWallRowState {
  const direction = getTypeWallDirection(row);
  const { velocity, phase } = getTypeWallMotion(row, seed);
  const e = easeOutCubic(
    Math.min(1, Math.max(0, (t - STAGGER * Math.abs(row)) / ENTRANCE)),
  );
  const travel = phase + velocity * t + ENTRANCE_BURST * e;
  // Leftward rows slide the strip left; rightward rows run it from −1 up to 0.
  const shift = direction < 0 ? -fract(travel) : fract(travel) - 1;
  return { direction, shift: shift || 0, reveal: e };
}

/** The accent band growing from the center, 0..1. */
export function getTypeWallBand(t: number) {
  return interpolate(t, [...BAND], [0, 1], { ...CLAMP, easing: easeOutCubic });
}

/** Frame where the slowest (outermost) row has finished entering. */
export function getTypeWallEntranceEnd(height: number, rowHeight: number) {
  const rows = getTypeWallRows(height, rowHeight);
  return ENTRANCE + STAGGER * Math.max(...rows.map(Math.abs));
}

/** How many tokens a strip needs to cover the width twice over. */
export function getTypeWallTokenCount(
  width: number,
  fontSize: number,
  token: string,
) {
  const tokenWidth =
    Math.max(1, Array.from(token).length) * MIN_CHAR_WIDTH * fontSize;
  return Math.min(MAX_TOKENS, Math.ceil(width / tokenWidth) + 2);
}

export function TypeWall({
  text = typeWallDefaults.text,
  separator = typeWallDefaults.separator,
  fontSize = typeWallDefaults.fontSize,
  color = typeWallDefaults.color,
  accent = typeWallDefaults.accent,
  accentText = typeWallDefaults.accentText,
  seed = typeWallDefaults.seed,
  speed = typeWallDefaults.speed,
  className,
}: TypeWallProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const unit = height / 720;
  const rowHeight = Math.max(8, fontSize * unit);
  const t = getTypeWallTime(frame, { fps, speed });
  const rows = getTypeWallRows(height, rowHeight);
  const token = `${text} ${separator} `;
  const band = getTypeWallBand(t);
  const outlineId = `type-wall-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <div
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      {/* Outline from the filled silhouette: the variable font's overlapping
          contours would show through a text stroke. */}
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={outlineId}>
            <feMorphology
              in="SourceAlpha"
              operator="erode"
              radius={1.5 * unit}
              result="inner"
            />
            <feComposite
              in="SourceAlpha"
              in2="inner"
              operator="out"
              result="ring"
            />
            <feFlood floodColor={color} />
            <feComposite in2="ring" operator="in" />
          </filter>
        </defs>
      </svg>
      {rows.map((row) => {
        const style = getTypeWallStyle(row);
        const state = getTypeWallRow(t, row, seed);
        const narrow = style === "narrow";
        const size = narrow ? rowHeight * NARROW_SCALE : rowHeight;
        const count = getTypeWallTokenCount(width, size, token);
        const onBand = row === 0;
        const hidden = `${(1 - state.reveal) * 100}%`;
        return (
          <div
            key={row}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: height / 2 + (row - 0.5) * rowHeight,
              height: rowHeight,
              clipPath:
                state.direction < 0
                  ? `inset(0 0 0 ${hidden})`
                  : `inset(0 ${hidden} 0 0)`,
            }}
          >
            {onBand ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: accent,
                  transform: `scaleX(${band})`,
                }}
              />
            ) : null}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "max-content",
                height: "100%",
                display: "flex",
                alignItems: "center",
                whiteSpace: "pre",
                fontFamily: narrow ? ANTON : INTER,
                fontSize: size,
                lineHeight: 1,
                fontWeight: narrow ? 400 : 900,
                color: onBand ? accentText : color,
                filter: style === "outline" ? `url(#${outlineId})` : undefined,
                transform: `translateX(${(state.shift * 100) / count}%)`,
              }}
            >
              {Array.from({ length: count }, (_, i) => (
                <span key={i}>{token}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
