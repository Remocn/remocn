"use client";

import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const display = sans;

// gradients.sh "silk" palette (bg #030308): #3b3fd8, #f3d6c0, #8a7bff.
const SILK = ["#3b3fd8", "#f3d6c0", "#8a7bff"] as const;

// Space Grotesk 500 advances (1/1000 em), ASCII 32–126, measured with HarfBuzz.
const SPACE_500 = [
  255, 276, 470, 632, 609, 765, 598, 273, 389, 383, 530, 620, 273, 443, 276,
  379, 645, 435, 598, 606, 630, 599, 615, 559, 611, 615, 276, 276, 620, 620,
  620, 579, 1020, 632, 663, 643, 665, 559, 537, 661, 656, 254, 602, 618, 544,
  874, 667, 673, 603, 673, 632, 609, 588, 669, 619, 887, 641, 617, 577, 347,
  379, 347, 620, 620, 288, 577, 641, 592, 641, 584, 439, 640, 615, 256, 258,
  551, 256, 857, 615, 615, 641, 641, 387, 525, 458, 614, 544, 792, 593, 614,
  519, 449, 249, 449, 620,
];
const TRACK = -0.04;
const SUB_TRACK = -0.01;

export interface ScanRevealProps {
  title?: string;
  subtitle?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const CAP = 0.7;
const XH = 0.4925;
const DESC = 0.2;
const BASE = 0.846;

const GUIDE_AT = -10;
const GUIDE_END = 14;
const LINE_IN_AT = -2;
const LINE_IN_END = 12;
const DOWN_AT = 10;
const DOWN_END = 66;
const UP_AT = 71;
const UP_END = 89;
const PARK_AT = 89;
const PARK_END = 107;

const SCAN = Easing.bezier(0.65, 0, 0.35, 1);
const RISE = Easing.bezier(0.45, 0, 0.12, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const PARK = Easing.bezier(0.65, 0, 0.35, 1);

const STAGES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#A3A29C",
    guide: "rgba(243,242,239,0.15)",
    dot: "rgba(243,242,239,0.34)",
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#5C5A55",
    guide: "rgba(18,18,20,0.14)",
    dot: "rgba(18,18,20,0.3)",
  },
};

function widthEm(text: string, track: number) {
  let w = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    const adv = code >= 32 && code < 127 ? SPACE_500[code - 32] : 600;
    w += adv / 1000 + track;
  }
  return Math.max(w, 0.5);
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
          seed={11}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const solid = (from: number, to: number) =>
  `linear-gradient(to bottom, #000 ${from}px, transparent ${to}px)`;
const slab = (a: number, b: number) =>
  `linear-gradient(to bottom, transparent ${a - 0.5}px, #000 ${a}px, #000 ${b - 0.5}px, transparent ${b}px)`;
const solidBelow = (from: number, to: number) =>
  `linear-gradient(to bottom, transparent ${from}px, #000 ${to}px)`;

function maskStyle(image: string): React.CSSProperties {
  return {
    WebkitMaskImage: image,
    maskImage: image,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
  };
}

function Row({
  baseline,
  size,
  children,
}: {
  baseline: number;
  size: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: baseline - BASE * size,
        display: "flex",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

export function ScanReveal({
  title = "Built frame by frame",
  subtitle = "Launch films from components you own.",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ScanRevealProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = STAGES[theme];

  const s = Math.min(150 * u, (0.84 * W) / widthEm(title, TRACK));
  const ss = Math.min(
    30 * u,
    (0.8 * W) / (widthEm(subtitle, SUB_TRACK) * 0.97),
  );
  const capGap = CAP * s;
  const under = 0.36 * s;
  const subGap = 38 * u + CAP * ss;
  const block = capGap + under + subGap;
  const capTop = H / 2 - block / 2 - 0.02 * H;
  const yB = capTop + capGap;
  const yU = yB + under;
  const yS = yU + subGap;

  const lw = Math.max(1.5, 2 * u);
  const fall = 11 * u;
  const G = 0.88 * W;
  const y0 = capTop - 0.1 * H;
  const y1 = yS + 0.11 * H;

  const down = SCAN(interpolate(t, [DOWN_AT, DOWN_END], [0, 1], CLAMP));
  const up = RISE(interpolate(t, [UP_AT, UP_END], [0, 1], CLAMP));
  const goingUp = t >= UP_AT;
  const downY = y0 + (y1 - y0) * down;
  const upY = y1 + (yU - y1) * up;
  const lineY = goingUp ? upY : downY;

  const lineIn = OUT(interpolate(t, [LINE_IN_AT, LINE_IN_END], [0, 1], CLAMP));
  const park = PARK(interpolate(t, [PARK_AT, PARK_END], [0, 1], CLAMP));
  const guideFade = 1 - park;
  const guideIn = (i: number) =>
    OUT(interpolate(t, [GUIDE_AT + i * 2, GUIDE_END + i * 2], [0, 1], CLAMP));

  const band = 0.42 * s;
  const soft = 0.22 * s;
  const subBand = 1.1 * ss;
  const subSoft = 0.6 * ss;
  const pitch = Math.max(3.5 * u, s / 24);
  const dotR = pitch * 0.3;
  const dots = (color: string, p: number, r: number): React.CSSProperties => ({
    color: "transparent",
    backgroundImage: `radial-gradient(circle at 50% 50%, ${color} ${r}px, transparent ${r + 0.7}px)`,
    backgroundSize: `${p}px ${p}px`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
  });

  const titleType: React.CSSProperties = {
    fontFamily: display,
    fontWeight: 500,
    fontSize: s,
    lineHeight: 1,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "nowrap",
    paddingLeft: `${-TRACK}em`,
  };
  const subType: React.CSSProperties = {
    fontFamily: sans,
    fontWeight: 400,
    fontSize: ss,
    lineHeight: 1,
    letterSpacing: `${SUB_TRACK}em`,
    whiteSpace: "nowrap",
  };

  const guides = [
    { y: capTop, strong: false },
    { y: yB - XH * s, strong: false },
    { y: yB, strong: true },
    { y: yB + DESC * s, strong: false },
    { y: yU, strong: true },
    { y: yS - CAP * ss, strong: false },
    { y: yS, strong: true },
  ];

  const gridStep = (yB - capTop) / 2;
  const gridTop = capTop - gridStep / 2;
  const gridH = yU - capTop + gridStep;
  const gridCols = Math.floor(G / gridStep);
  const gridW = gridCols * gridStep;
  const subH = CAP * ss;

  // Silk sheen across the developed title; the bright band slides a few
  // percent over the shot, so the hold never sits perfectly still.
  const sheen = interpolate(t, [DOWN_AT, PARK_END + 40], [0, 1], CLAMP);
  const silk =
    theme === "dark"
      ? `linear-gradient(102deg, ${SILK[1]} ${-6 + 10 * sheen}%, #d9c3e6 ${26 + 10 * sheen}%, ${SILK[2]} ${62 + 8 * sheen}%, #6f6ef2 100%)`
      : `linear-gradient(102deg, ${SILK[0]} ${-4 + 10 * sheen}%, ${SILK[2]} ${48 + 10 * sheen}%, #2c2fa8 100%)`;

  const lineWidth = `calc(${park} * 100% + ${(1 - park) * G * lineIn}px)`;
  const fallOpacity = (1 - park) * lineIn;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: guideFade }}>
        {guides.map((g, i) => {
          const p = guideIn(i);
          return (
            <div
              key={g.y}
              style={{
                position: "absolute",
                left: (W - G) / 2,
                top: g.y - 0.5,
                width: G * p,
                height: 1,
                background: c.guide,
                opacity: g.strong ? 1 : 0.7,
              }}
            />
          );
        })}
        {guides.map((g, i) => (
          <div
            key={`tick-${g.y}`}
            style={{
              position: "absolute",
              left: (W - G) / 2 - 0.5,
              top: g.y - 4 * u,
              width: 1,
              height: 8 * u,
              background: c.dot,
              opacity: guideIn(i),
            }}
          />
        ))}
        <AbsoluteFill style={maskStyle(solidBelow(downY, downY + 1))}>
          <div
            style={{
              position: "absolute",
              left: (W - gridW) / 2 - gridStep / 2,
              top: gridTop,
              width: gridW + gridStep,
              height: gridH,
              opacity: guideIn(2),
              backgroundImage: `radial-gradient(circle at 50% 50%, ${c.dot} ${1.5 * u}px, transparent ${1.5 * u + 0.7}px)`,
              backgroundSize: `${gridStep}px ${gridStep}px`,
            }}
          />
        </AbsoluteFill>
        <AbsoluteFill style={maskStyle(solid(upY - 1, upY))}>
          <div
            style={{
              position: "absolute",
              left: (W - gridW) / 2 - gridStep / 2,
              top: yS - subH * 1.5,
              width: gridW + gridStep,
              height: subH * 2,
              opacity: guideIn(4),
              backgroundImage: `radial-gradient(circle at 50% 50%, ${c.dot} ${1.5 * u}px, transparent ${1.5 * u + 0.7}px)`,
              backgroundSize: `${gridStep}px ${subH}px`,
            }}
          />
        </AbsoluteFill>
      </AbsoluteFill>

      <AbsoluteFill style={maskStyle(slab(downY - band - soft - 2, downY))}>
        <Row baseline={yB} size={s}>
          <div style={{ ...titleType, ...dots(c.fg, pitch, dotR) }}>
            {title}
          </div>
        </Row>
      </AbsoluteFill>
      <AbsoluteFill style={maskStyle(solid(downY - band - soft, downY - band))}>
        <Row baseline={yB} size={s}>
          <div
            style={{
              ...titleType,
              color: "transparent",
              backgroundImage: silk,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            {title}
          </div>
        </Row>
      </AbsoluteFill>

      <AbsoluteFill style={maskStyle(slab(upY, upY + subBand + subSoft + 2))}>
        <Row baseline={yS} size={ss}>
          <div
            style={{
              ...subType,
              ...dots(c.muted, Math.max(2.4 * u, ss / 11), ss / 36),
            }}
          >
            {subtitle}
          </div>
        </Row>
      </AbsoluteFill>
      <AbsoluteFill
        style={maskStyle(solidBelow(upY + subBand, upY + subBand + subSoft))}
      >
        <Row baseline={yS} size={ss}>
          <div style={{ ...subType, color: c.muted }}>{subtitle}</div>
        </Row>
      </AbsoluteFill>

      <Row baseline={yB} size={s}>
        <div style={{ ...titleType, position: "relative", height: 0 }}>
          <div style={{ visibility: "hidden", height: 0, overflow: "hidden" }}>
            {title}
          </div>
          <div
            style={{
              position: "absolute",
              left: "50%",
              width: lineWidth,
              transform: "translateX(-50%)",
              top: lineY - (yB - BASE * s) - lw / 2,
              height: lw,
              background: accent,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: goingUp ? lw : -fall,
                height: fall,
                opacity: 0.32 * fallOpacity,
                background: `linear-gradient(${goingUp ? "to bottom" : "to top"}, ${accent}, transparent)`,
              }}
            />
          </div>
        </div>
      </Row>

      <Grain opacity={theme === "light" ? 0.04 : 0.05} />
    </AbsoluteFill>
  );
}
