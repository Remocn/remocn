"use client";

import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: hanken } = loadHanken("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

export interface IndexListProps {
  items?: string[];
  highlight?: number;
  title?: string;
  logo?: React.ReactNode;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_ITEMS = [
  "Transitions",
  "Captions",
  "Backgrounds",
  "Kinetic type",
  "Templates",
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    key: "rgba(255,255,255,0.05)",
    fg: "#F3F2EF",
    muted: "#6F6E74",
    hair: "rgba(255,255,255,0.14)",
    rule: "rgba(243,242,239,0.9)",
    onAccent: "#FFFFFF",
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    key: "rgba(255,255,255,0.9)",
    fg: "#121214",
    muted: "#9A9892",
    hair: "rgba(18,18,20,0.14)",
    rule: "rgba(18,18,20,0.9)",
    onAccent: "#FFFFFF",
    grain: 0.045,
  },
} as const;

const RULE_START = 2;
const STAGGER = 3;
const BLOCK_IN = 40;

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** remocn.dev logo: R mark (0.76em, on the baseline) + "emocn" in Manrope 600. */
function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: "0.76em", width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </div>
  );
}

// gradients.sh "beam" palette (its #3d5bff stop is the accent), used as the fill of the travelling highlight band.
const BEAM = ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"] as const;

function beamFill(t: number, accent: string) {
  const x = 30 + 14 * Math.sin(t / 55);
  const y = -10 + 8 * Math.cos(t / 47);
  return [
    `radial-gradient(60% 140% at ${x}% ${y}%, color-mix(in oklab, ${BEAM[1]} 70%, transparent) 0%, transparent 70%)`,
    `radial-gradient(40% 120% at ${100 - x * 0.6}% 120%, color-mix(in oklab, ${BEAM[0]} 12%, transparent) 0%, transparent 70%)`,
    `linear-gradient(100deg, ${accent} 0%, ${accent} 30%, ${BEAM[3]} 100%)`,
  ].join(", ");
}

function Arrow({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M4 12h15 M13 6l6 6-6 6"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="square"
      />
    </svg>
  );
}

interface RowsProps {
  items: string[];
  t: number;
  rowTop: (i: number) => number;
  rowH: number;
  F: number;
  numX: number;
  nameX: number;
  numColor: string;
  nameColor: string;
}

function Rows({
  items,
  t,
  rowTop,
  rowH,
  F,
  numX,
  nameX,
  numColor,
  nameColor,
}: RowsProps) {
  const maskH = F * 1.24;
  const cell = (
    key: string,
    x: number,
    i: number,
    delay: number,
    style: React.CSSProperties,
    text: string,
  ) => {
    const p = interpolate(
      t,
      [
        RULE_START + 8 + i * STAGGER + delay,
        RULE_START + 26 + i * STAGGER + delay,
      ],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
    return (
      <div
        key={key}
        style={{
          position: "absolute",
          left: x,
          top: rowTop(i) + rowH / 2 - maskH / 2,
          height: maskH,
          overflow: "hidden",
          paddingRight: F * 0.2,
        }}
      >
        <div
          style={{
            height: maskH,
            display: "flex",
            alignItems: "center",
            transform: `translateY(${(1 - p) * maskH}px)`,
            fontSize: F,
            lineHeight: 1,
            whiteSpace: "nowrap",
            ...style,
          }}
        >
          {text}
        </div>
      </div>
    );
  };
  return (
    <>
      {items.map((item, i) => (
        <div key={`${i}-${item}`}>
          {cell(
            "n",
            numX,
            i,
            0,
            {
              fontFamily: hanken,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
              color: numColor,
            },
            pad(i + 1),
          )}
          {cell(
            "t",
            nameX,
            i,
            2,
            {
              fontFamily: hanken,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: nameColor,
            },
            item,
          )}
        </div>
      ))}
    </>
  );
}

export function IndexList({
  items = DEFAULT_ITEMS,
  highlight = 3,
  title = "What’s inside 3.0",
  logo,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: IndexListProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];
  const n = Math.max(1, items.length);
  const hl = Math.min(Math.max(0, Math.round(highlight)), n - 1);

  const mX = W * 0.075;
  const cw = W - mX * 2;
  const col = cw / 12;
  const headerY = H * 0.1;
  const listTop = H * 0.205;
  const listBottom = H * 0.9;
  const rowH = (listBottom - listTop) / n;
  const longest = Math.max(...items.map((s) => s.length), 1);
  const F = Math.min(rowH * 0.5, 58 * u, (cw - col * 2.4) / (longest * 0.56));
  const inset = 20 * u;
  const numX = mX + inset;
  const nameX = mX + col * 2;
  const rowTop = (i: number) => listTop + rowH * i;
  const hair = Math.max(1, u);

  const rule = (i: number) =>
    interpolate(
      t,
      [RULE_START + i * STAGGER, RULE_START + 22 + i * STAGGER],
      [0, 1],
      { ...CLAMP, easing: EASE_IO },
    );
  const head = (d: number) =>
    interpolate(t, [d, d + 18], [0, 1], { ...CLAMP, easing: EASE_OUT });

  const wipe = interpolate(t, [BLOCK_IN, BLOCK_IN + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const travelStart = BLOCK_IN + 12;
  const travelDur = 14 + hl * 5;
  const lead = interpolate(t, [travelStart, travelStart + travelDur], [0, hl], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const trail = interpolate(
    t,
    [travelStart + 5, travelStart + 5 + travelDur],
    [0, hl],
    { ...CLAMP, easing: EASE_IO },
  );
  const parkedAt = travelStart + 5 + travelDur;
  const bTop = rowTop(trail) + hair;
  const bBottom = rowTop(lead) + rowH;
  const bLeft = mX;
  const bRight = mX + cw * wipe;
  const arrowP = interpolate(t, [parkedAt - 4, parkedAt + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const push = interpolate(t, [0, parkedAt + 40], [1.03, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  const rowsProps = { items, t, rowTop, rowH, F, numX, nameX };
  const arrowSize = F * 0.78;
  const dim = interpolate(t, [parkedAt - 2, parkedAt + 18], [1, 0.42], {
    ...CLAMP,
    easing: EASE_IO,
  });

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 80% at 30% 30%, ${c.key}, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{ transform: `scale(${push})`, transformOrigin: "50% 45%" }}
      >
        <div
          style={{
            position: "absolute",
            left: mX,
            top: headerY,
            display: "flex",
            alignItems: "baseline",
            gap: 14 * u,
            fontFamily: hanken,
            fontWeight: 400,
            fontSize: 19 * u,
            lineHeight: 1,
            letterSpacing: "-0.01em",
            color: c.muted,
            opacity: head(0),
            transform: `translateY(${(1 - head(0)) * 10 * u}px)`,
          }}
        >
          {logo ?? <RemocnLogo fontSize={24 * u} color={c.fg} />}
          <span
            style={{
              width: hair,
              height: 18 * u,
              background: c.hair,
              alignSelf: "center",
            }}
          />
          {title}
        </div>
        <div
          style={{
            position: "absolute",
            right: mX,
            top: headerY,
            height: 24 * u,
            display: "flex",
            alignItems: "center",
            fontFamily: hanken,
            fontWeight: 400,
            fontSize: 18 * u,
            lineHeight: 1,
            letterSpacing: "-0.01em",
            fontVariantNumeric: "tabular-nums",
            color: c.muted,
            opacity: head(4),
            transform: `translateY(${(1 - head(4)) * 10 * u}px)`,
          }}
        >
          {`${pad(n)} features`}
        </div>

        {Array.from({ length: n + 1 }, (_, i) => {
          const strong = i === 0;
          const th = strong ? 2 * u : hair;
          return (
            <div
              key={`r${i}`}
              style={{
                position: "absolute",
                left: mX,
                top: rowTop(i) - th / 2,
                width: cw * rule(i),
                height: th,
                background: strong ? c.rule : c.hair,
              }}
            />
          );
        })}

        <div style={{ position: "absolute", inset: 0, opacity: dim }}>
          <Rows {...rowsProps} numColor={c.muted} nameColor={c.fg} />
        </div>

        {wipe > 0 ? (
          <>
            <div
              style={{
                position: "absolute",
                left: bLeft,
                top: bTop,
                width: bRight - bLeft,
                height: bBottom - bTop,
                backgroundImage: beamFill(t, accent),
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                clipPath: `inset(${bTop}px ${W - bRight}px ${H - bBottom}px ${bLeft}px)`,
              }}
            >
              <Rows
                {...rowsProps}
                numColor="rgba(255,255,255,0.62)"
                nameColor={c.onAccent}
              />
              <div
                style={{
                  position: "absolute",
                  left: W - mX - inset - arrowSize,
                  top: rowTop(hl) + rowH / 2 - arrowSize / 2,
                  opacity: arrowP,
                  transform: `translateX(${(1 - arrowP) * -24 * u}px)`,
                }}
              >
                <Arrow size={arrowSize} color={c.onAccent} />
              </div>
            </div>
          </>
        ) : null}
      </AbsoluteFill>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
