"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});
const geist = loadGeist("normal", { weights: ["400"], subsets: ["latin"] });
const mono = loadGeistMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface LightSignatureProps {
  eyebrow?: string;
  name?: string;
  logo?: React.ReactNode;
  tagline?: string;
  lightColor?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const CHROME = ["#e0202e", "#ffd6b8", "#4fe3f0"] as const;

const PALETTES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F4F3F0",
    warm: CHROME[1],
    hot: "#fff6ee",
    unlit: "#18171a",
    unlitEdge: "rgba(255,255,255,0.07)",
    segOff: 0.12,
    muted: "#8E8D94",
    haze: 0.26,
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    warm: "#3a1c1c",
    hot: "#ff5a3c",
    unlit: "#E6E3DC",
    unlitEdge: "rgba(0,0,0,0.04)",
    segOff: 0.14,
    muted: "#6E6C67",
    haze: 0.1,
    grain: 0.035,
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_RETURN = Easing.bezier(0.5, 0, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const R_RATIO = 124.06 / 134.26;
const R_W = 0.76 * R_RATIO;
const R_GAP = 0.04;

const MANROPE_500 = [
  200, 329, 417, 924, 602, 901, 657, 229, 435, 435, 446, 575, 278, 420, 270,
  402, 626, 406, 578, 562, 596, 580, 621, 512, 591, 621, 314, 318, 622, 750,
  622, 534, 907, 646, 619, 723, 681, 575, 510, 714, 697, 249, 476, 612, 518,
  846, 696, 732, 616, 732, 640, 630, 600, 708, 616, 949, 622, 574, 630, 412,
  402, 412, 673, 660, 506, 562, 600, 561, 600, 590, 362, 600, 604, 249, 263,
  510, 249, 865, 604, 600, 600, 600, 374, 530, 412, 604, 523, 779, 536, 538,
  531, 430, 269, 430, 680,
];
const MANROPE_600 = [
  200, 344, 442, 928, 615, 900, 662, 244, 444, 444, 456, 574, 290, 420, 286,
  418, 642, 422, 587, 572, 602, 584, 622, 523, 602, 622, 328, 330, 630, 750,
  630, 544, 910, 658, 625, 730, 690, 580, 516, 723, 710, 264, 488, 630, 526,
  850, 706, 740, 627, 740, 650, 644, 604, 714, 628, 962, 639, 593, 647, 418,
  418, 418, 676, 660, 522, 570, 608, 568, 608, 596, 370, 608, 615, 264, 276,
  524, 264, 882, 615, 610, 608, 608, 386, 536, 422, 615, 538, 790, 545, 548,
  532, 439, 284, 439, 698,
];
const GEIST_400 = [
  250, 213, 346, 478, 629, 802, 620, 178, 274, 274, 430, 558, 201, 419, 201,
  480, 663, 384, 619, 613, 615, 626, 593, 524, 604, 593, 297, 297, 544, 540,
  544, 559, 906, 668, 680, 703, 694, 603, 590, 700, 713, 270, 597, 640, 580,
  877, 743, 739, 650, 733, 672, 640, 552, 689, 667, 945, 606, 576, 544, 347,
  455, 347, 426, 557, 248, 551, 595, 546, 595, 561, 395, 594, 581, 244, 260,
  590, 267, 877, 581, 573, 595, 595, 379, 520, 392, 575, 536, 819, 585, 537,
  537, 389, 264, 389, 523,
];
const MANROPE_BASELINE = 0.883;

function adv(ch: string, table: number[]) {
  const c = ch.charCodeAt(0);
  return (c >= 32 && c <= 126 ? table[c - 32] : 600) / 1000;
}

function textEm(text: string, table: number[]) {
  let w = 0;
  for (const ch of text) w += adv(ch, table);
  return w;
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

type Glyph = {
  kind: "r" | "logo" | "char";
  ch: string;
  x: number;
  w: number;
};

const CHASE_START = 12;
const CHASE_LEN = 40;
const RETURN_START = 50;
const RETURN_LEN = 26;

export function LightSignature({
  eyebrow = "The all-new",
  name = "remocn",
  logo,
  tagline = "Launch-video scenes, ready to render.",
  lightColor = CHROME[0],
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: LightSignatureProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const p = PALETTES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const bloomId = `bl${uid}`;
  const litId = `lt${uid}`;
  const cometId = `cm${uid}`;

  const portrait = height > width * 1.1;
  const s = portrait
    ? (width / 1280) * 1.5
    : Math.min(width / 1280, height / 720);

  const wordmark = logo === undefined && name.trim().toLowerCase() === "remocn";

  const LS = wordmark ? -0.025 : -0.03;
  const glyphs: Glyph[] = [];
  let cursor = 0;
  if (wordmark) {
    glyphs.push({ kind: "r", ch: "R", x: 0, w: R_W });
    cursor = R_W + R_GAP;
    for (const ch of "emocn") {
      const w = adv(ch, MANROPE_600);
      glyphs.push({ kind: "char", ch, x: cursor, w });
      cursor += w + LS;
    }
  } else {
    if (logo) {
      glyphs.push({ kind: "logo", ch: "", x: 0, w: 0.8 });
      cursor = 0.8 + 0.18;
    }
    for (const ch of name) {
      const w = adv(ch, MANROPE_500);
      glyphs.push({ kind: "char", ch, x: cursor, w });
      cursor += w + LS;
    }
  }
  const lockupEm = Math.max(0.5, cursor - (glyphs.length > 0 ? LS : 0));
  const maxW = width * (portrait ? 0.86 : 0.78);
  const nameFs = Math.min((portrait ? 168 : 172) * s, maxW / lockupEm);
  const lockupW = lockupEm * nameFs;
  const lockupX = width / 2 - lockupW / 2;

  const eyeFs = (portrait ? 24 : 18) * s;
  const tagFs = (portrait ? 36 : 30) * s;
  const tagMax = Math.min(width * 0.8, 960 * s);
  const tagLines = tagline
    ? Math.max(1, Math.ceil((textEm(tagline, GEIST_400) * tagFs) / tagMax))
    : 0;
  const tagH = tagLines * tagFs * 1.3;
  const capEm = 0.76;
  const eyeGap = nameFs * 0.3;
  const lineGap = nameFs * 0.12;
  const tagGap = Math.max(nameFs * 0.2, 26 * s);
  const groupH =
    (eyebrow ? eyeFs + eyeGap : 0) +
    capEm * nameFs +
    lineGap +
    (tagline ? tagGap + tagH : 0);
  const top = height / 2 - groupH / 2;
  const baselineY = top + (eyebrow ? eyeFs + eyeGap : 0) + capEm * nameFs;
  const lineY = baselineY + lineGap;
  const eyeTop = baselineY - capEm * nameFs - eyeGap - eyeFs;
  const tagTop = lineY + tagGap;

  const cx = width / 2;
  const D = width / 2;
  const reach = D * 1.04;
  const CHASE_POW = 1.8;
  const chaseR = (f: number) =>
    reach *
    Math.min(1, Math.max(0, (f - CHASE_START) / CHASE_LEN)) ** CHASE_POW;
  const hitTime = (d: number) =>
    CHASE_START + CHASE_LEN * Math.min(1, d / reach) ** (1 / CHASE_POW);
  const r = chaseR(frame);
  const chasing = frame >= CHASE_START - 4 && frame < CHASE_START + CHASE_LEN;
  const ignite = interpolate(
    frame,
    [CHASE_START - 4, CHASE_START + 2],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_OUT,
    },
  );
  const returnQ = (f: number) =>
    reach *
    (1 -
      EASE_RETURN(Math.min(1, Math.max(0, (f - RETURN_START) / RETURN_LEN))));
  const q = returnQ(frame);
  const passTime = (d: number) => {
    let prevF = RETURN_START;
    let prevQ = reach;
    for (let f = RETURN_START + 1; f <= RETURN_START + RETURN_LEN; f++) {
      const qf = returnQ(f);
      if (qf <= d) return prevF + (prevQ - d) / Math.max(1e-6, prevQ - qf);
      prevF = f;
      prevQ = qf;
    }
    return RETURN_START + RETURN_LEN;
  };
  const returning = frame >= RETURN_START;

  const pitch = Math.max(6, 11 * s);
  const segOn = pitch * 0.62;
  const lineH = Math.max(2, 3.5 * s);
  const tail = 110 * s;
  const nSeg = Math.ceil(D / pitch) + 1;

  const finalLevel = (d: number) => {
    const under = Math.exp(-((d / (lockupW * 0.75 + 1)) ** 2));
    const edge = interpolate(d, [D * 0.82, D * 1.0], [1, 0.25], CLAMP);
    return (0.5 + 0.28 * under) * edge;
  };

  const segLevel = (d: number) => {
    let b = 0;
    if (frame >= CHASE_START - 4) {
      if (d <= 0.5 * pitch) {
        const hold = interpolate(
          frame,
          [CHASE_START, CHASE_START + 10],
          [1, 0],
          CLAMP,
        );
        b = Math.max(b, ignite * hold);
      }
      if (r >= d) {
        const behind = r - d;
        b = Math.max(b, 0.42 + 0.58 * Math.exp(-behind / tail));
        if (!chasing) b = Math.max(b, 0.42);
      } else if (chasing) {
        b = Math.max(b, 0.9 * Math.exp(-(d - r) / (8 * s)));
      }
    }
    let merge = 0;
    if (returning && q <= d) {
      const since = frame - passTime(d);
      merge = interpolate(since, [0, 9], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      const lvl = finalLevel(d);
      const flash = 0.45 * Math.exp(-since / 3.5);
      b = b + (lvl - b) * merge + flash;
    }
    return { b: Math.min(1.25, b), merge };
  };

  const levelColor = (b: number) =>
    interpolateColors(
      Math.min(1, b),
      [0, 0.45, 0.85, 1],
      theme === "dark"
        ? [lightColor, lightColor, CHROME[1], p.hot]
        : [lightColor, lightColor, lightColor, p.hot],
    );

  const segments: React.ReactNode[] = [];
  for (let i = -nSeg; i <= nSeg; i++) {
    const xc = cx + i * pitch;
    if (xc < -pitch || xc > width + pitch) continue;
    const d = Math.abs(i * pitch);
    const { b, merge } = segLevel(d);
    const len = segOn + (pitch - segOn + 0.6) * merge;
    const lit = Math.min(1, b);
    segments.push(
      <rect
        key={i}
        x={xc - len / 2}
        y={lineY - lineH / 2}
        width={len}
        height={lineH}
        rx={merge > 0.98 ? 0 : lineH / 2}
        fill={b <= 0.001 ? lightColor : levelColor(b)}
        opacity={b <= 0.001 ? p.segOff : p.segOff + (1 - p.segOff) * lit}
      />,
    );
  }

  const heads: React.ReactNode[] = [];
  if (chasing && frame >= CHASE_START) {
    const fade = interpolate(
      frame,
      [CHASE_START + CHASE_LEN - 6, CHASE_START + CHASE_LEN],
      [1, 0],
      CLAMP,
    );
    const v = Math.max(0, chaseR(frame) - chaseR(frame - 1));
    const streak = Math.min(220 * s, 26 * s + v * 2.2);
    for (const dir of [-1, 1]) {
      const hx = cx + dir * r;
      heads.push(
        <g key={dir} opacity={fade}>
          <rect
            x={dir > 0 ? hx - streak : hx}
            y={lineY - lineH * 0.6}
            width={streak}
            height={lineH * 1.2}
            fill={`url(#${cometId}${dir > 0 ? "r" : "l"})`}
          />
          <circle cx={hx} cy={lineY} r={lineH * 1.05} fill={p.hot} />
        </g>,
      );
    }
  }

  const letterState = (g: Glyph) => {
    const gx = lockupX + (g.x + g.w / 2) * nameFs;
    const t0 = hitTime(Math.abs(gx - cx));
    const fill = interpolate(frame, [t0 - 1, t0 + 6], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const flash = interpolate(frame, [t0, t0 + 4, t0 + 18], [0, 1, 0], CLAMP);
    const tR = RETURN_START + RETURN_LEN * 0.8;
    const pulse = interpolate(
      frame,
      [tR, tR + 4, tR + 16],
      [0, 0.35, 0],
      CLAMP,
    );
    return { fill, flash: Math.max(flash, pulse) };
  };

  const litFill =
    theme === "dark"
      ? `linear-gradient(0deg, ${p.warm} 0%, ${p.hot} 22%, ${p.fg} 62%)`
      : `linear-gradient(0deg, ${p.warm} 0%, ${p.fg} 40%)`;

  const eyeIn = interpolate(frame, [58, 82], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const tagIn = interpolate(frame, [64, 90], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const settle = interpolate(frame, [0, 110], [1.04, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const hazeLevel = returning
    ? interpolate(frame, [RETURN_START, RETURN_START + RETURN_LEN], [0.55, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      })
    : interpolate(r, [0, D], [0.15, 0.55], CLAMP) * ignite;

  const transparent = background === "transparent";
  const bg = transparent ? "transparent" : (background ?? p.bg);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {!transparent ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: hazeLevel,
            background: [
              `radial-gradient(${width * 0.62}px ${height * 0.16}px at 50% ${lineY}px, color-mix(in oklab, ${lightColor} ${Math.round(p.haze * 100)}%, transparent) 0%, transparent 100%)`,
              `radial-gradient(${width * 0.9}px ${height * 0.5}px at 50% ${lineY}px, color-mix(in oklab, ${lightColor} ${Math.round(p.haze * 30)}%, transparent) 0%, transparent 100%)`,
            ].join(", "),
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${settle})`,
          transformOrigin: `50% ${(lineY / height) * 100}%`,
        }}
      >
        {eyebrow ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: eyeTop,
              height: eyeFs,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: eyeFs * 0.7,
              opacity: eyeIn,
            }}
          >
            <div
              style={{
                width: eyeFs * 0.36,
                height: eyeFs * 0.36,
                borderRadius: 1,
                background: accent,
                transform: `scale(${0.4 + 0.6 * eyeIn})`,
              }}
            />
            <span
              style={{
                fontFamily: mono.fontFamily,
                fontWeight: 400,
                fontSize: eyeFs,
                lineHeight: 1,
                textTransform: "uppercase",
                letterSpacing: `${interpolate(eyeIn, [0, 1], [0.5, 0.22])}em`,
                marginRight: "-0.22em",
                color: p.muted,
                whiteSpace: "nowrap",
              }}
            >
              {eyebrow}
            </span>
          </div>
        ) : null}

        {glyphs.map((g, i) => {
          const { fill, flash } = letterState(g);
          const left = lockupX + g.x * nameFs;
          const clipTop = `${(1 - fill) * 100}%`;
          const glow =
            flash > 0.01
              ? `drop-shadow(0 0 ${14 * s * flash}px color-mix(in oklab, ${lightColor} ${Math.round((theme === "dark" ? 70 : 30) * flash)}%, transparent))`
              : "none";
          const flashColor = theme === "dark" ? p.hot : lightColor;
          const renderGlyph = (lit: boolean) => {
            if (g.kind === "r") {
              return (
                <svg
                  viewBox="0 0 124.06 134.26"
                  width={R_W * nameFs}
                  height={0.76 * nameFs}
                  style={{ display: "block" }}
                  aria-hidden
                >
                  {lit ? (
                    <defs>
                      <linearGradient
                        id={`${litId}r`}
                        x1="0"
                        x2="0"
                        y1="1"
                        y2="0"
                      >
                        {theme === "dark" ? (
                          <>
                            <stop offset="0" stopColor={p.warm} />
                            <stop offset="0.22" stopColor={p.hot} />
                            <stop offset="0.62" stopColor={p.fg} />
                          </>
                        ) : (
                          <>
                            <stop offset="0" stopColor={p.warm} />
                            <stop offset="0.4" stopColor={p.fg} />
                          </>
                        )}
                      </linearGradient>
                    </defs>
                  ) : null}
                  <path
                    d={REMOCN_R_PATH}
                    fill={lit ? `url(#${litId}r)` : p.unlit}
                    stroke={lit ? "none" : p.unlitEdge}
                    strokeWidth={lit ? 0 : 1.2}
                  />
                </svg>
              );
            }
            if (g.kind === "logo") {
              return (
                <div
                  style={{
                    width: 0.8 * nameFs,
                    height: 0.76 * nameFs,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: lit ? 1 : 0.18,
                  }}
                >
                  {logo}
                </div>
              );
            }
            return (
              <span
                style={{
                  display: "block",
                  fontFamily: manrope.fontFamily,
                  fontWeight: wordmark ? 600 : 500,
                  fontSize: nameFs,
                  lineHeight: 1,
                  whiteSpace: "pre",
                  ...(lit
                    ? {
                        backgroundImage: litFill,
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }
                    : {
                        color: p.unlit,
                        WebkitTextStroke: `1px ${p.unlitEdge}`,
                      }),
                }}
              >
                {g.ch}
              </span>
            );
          };
          const glyphTop =
            g.kind === "char"
              ? baselineY - MANROPE_BASELINE * nameFs
              : baselineY - 0.76 * nameFs;
          return (
            <div key={i} style={{ position: "absolute", left, top: glyphTop }}>
              <div style={{ position: "relative" }}>{renderGlyph(false)}</div>
              {fill > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    clipPath: `inset(${clipTop} -20% -20% -20%)`,
                    filter: glow,
                  }}
                >
                  {renderGlyph(true)}
                  {flash > 0.01 && g.kind !== "logo" ? (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: flash * 0.85,
                        mixBlendMode: theme === "dark" ? "screen" : "normal",
                      }}
                    >
                      {g.kind === "r" ? (
                        <svg
                          viewBox="0 0 124.06 134.26"
                          width={R_W * nameFs}
                          height={0.76 * nameFs}
                          style={{ display: "block" }}
                          aria-hidden
                        >
                          <path d={REMOCN_R_PATH} fill={flashColor} />
                        </svg>
                      ) : (
                        <span
                          style={{
                            display: "block",
                            fontFamily: manrope.fontFamily,
                            fontWeight: wordmark ? 600 : 500,
                            fontSize: nameFs,
                            lineHeight: 1,
                            whiteSpace: "pre",
                            color: flashColor,
                          }}
                        >
                          {g.ch}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}

        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          <defs>
            <filter id={bloomId} x="-10%" y="-400%" width="120%" height="900%">
              <feGaussianBlur stdDeviation={6 * s} />
            </filter>
            {[
              ["r", 0, 1],
              ["l", 1, 0],
            ].map(([k, a, b]) => (
              <linearGradient
                key={k}
                id={`${cometId}${k}`}
                x1={a}
                x2={b}
                y1="0"
                y2="0"
              >
                <stop offset="0" stopColor={lightColor} stopOpacity={0} />
                <stop offset="0.7" stopColor={lightColor} stopOpacity={0.9} />
                <stop offset="1" stopColor={p.hot} stopOpacity={1} />
              </linearGradient>
            ))}
          </defs>
          {theme === "dark" ? (
            <g filter={`url(#${bloomId})`} opacity={0.85}>
              {segments}
              {heads}
            </g>
          ) : null}
          <g>{segments}</g>
          <g opacity={theme === "dark" ? 1 : 0.6}>{heads}</g>
        </svg>

        {tagline ? (
          <div
            style={{
              position: "absolute",
              left: (width - tagMax) / 2,
              width: tagMax,
              top: lineY + lineH,
              height: tagTop - lineY - lineH + tagH + tagFs * 0.3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: tagTop - lineY - lineH,
                transform: `translateY(${-(1 - tagIn) * (tagGap + tagH)}px)`,
                opacity: interpolate(tagIn, [0, 0.4], [0, 1], CLAMP),
                textAlign: "center",
                textWrap: "balance",
                fontFamily: geist.fontFamily,
                fontWeight: 400,
                fontSize: tagFs,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                color: p.muted,
              }}
            >
              {tagline}
            </div>
          </div>
        ) : null}
      </div>

      {!transparent ? <Grain opacity={p.grain} /> : null}
    </AbsoluteFill>
  );
}
