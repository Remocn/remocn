"use client";

import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
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

const { fontFamily: display } = loadBricolage("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface PosterCropProps {
  title?: string;
  kicker?: string;
  meta?: string;
  note?: string;
  logo?: React.ReactNode;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const PULL_START = 8;
const PULL_END = 104;

/** Bricolage Grotesque 500 advance widths (per 1000 em) for ASCII 32–126. */
const BRICOLAGE_500 = [
  246, 266, 317, 613, 630, 947, 756, 159, 305, 290, 395, 516, 165, 339, 196,
  354, 656, 320, 583, 595, 595, 600, 646, 494, 646, 641, 207, 188, 516, 516,
  516, 413, 952, 671, 666, 671, 691, 599, 578, 706, 709, 275, 358, 666, 508,
  909, 747, 716, 629, 719, 660, 641, 553, 718, 657, 957, 653, 600, 560, 315,
  342, 300, 547, 578, 283, 567, 618, 555, 617, 570, 380, 589, 608, 260, 266,
  561, 257, 913, 608, 604, 618, 617, 411, 535, 380, 599, 547, 827, 534, 591,
  500, 353, 260, 331, 516,
];
/** Bricolage Grotesque 500 GPOS kerning (|k| ≥ 30/1000), "pairValue". */
const KERN_PAIRS = [
  "AT-67 AV-83 AW-53 AY-78 Av-52 Aw-37 DX-40 DY-32 EJ32 FA-46 FJ-41 FT40 FY31",
  "Fa-30 F.-59 F,-57 LJ57 LT-74 LV-74 LW-45 LY-87 LZ41 Lv-52 Lw-33 L.42 L,50",
  "OX-38 OY-31 PA-43 PJ-48 P.-60 P,-66 QY-31 Qj40 TA-67 TJ-47 TT44 TW31 TY33",
  "Ta-67 Tc-71 Td-62 Te-71 Tg-67 Tm-30 Tn-30 To-71 Tp-30 Tq-62 Tr-30 Ts-61",
  "T.-62 T,-60 VA-83 VJ-47 VW31 Va-44 Vc-46 Vd-42 Ve-46 Vg-41 Vo-45 Vq-42",
  "Vs-30 V.-60 V,-57 WA-55 WJ-40 WT31 WV31 WW30 W.-39 W,-43 XC-38 XG-39 XO-39",
  "Xc-31 Xe-31 Xo-32 YA-78 YC-33 YG-32 YJ-46 YO-32 YQ-32 YT33 YY38 Ya-62",
  "Yc-62 Yd-57 Ye-62 Yg-55 Ym-33 Yn-33 Yo-61 Yp-33 Yq-57 Yr-33 Ys-45 Yy-31",
  "Y.-75 Y,-72 ZJ40 ZZ31 Z.30 Z,32 aT-62 aV-48 aW-33 aY-60 bT-63 bV-42 bY-59",
  "cT-54 cV-30 cY-45 eT-65 eV-43 eY-57 fA-37 fJ-34 fY32 f.-33 f,-35 gj31 g,48",
  "hT-62 hV-48 hW-31 hY-60 mT-62 mV-48 mW-31 mY-60 nT-62 nV-48 nW-31 nY-60",
  "oT-73 oV-45 oX-33 oY-62 pT-63 pV-42 pY-59 qT-30 qY-33 rA-56 rJ-52 rw30",
  "r.-68 r,-66 sT-58 sV-36 sY-50 t.32 t,32 uT-30 uY-33 vA-52 vJ-44 vw30 v.-41",
  "v,-45 wA-37 wv30 yY-32 .J45 .T-62 .V-60 .W-37 .Y-76 .Z38 .v-40 .z30",
].join(" ");
const KERN = new Map(
  KERN_PAIRS.split(" ").map((p) => [p.slice(0, 2), Number(p.slice(2)) / 1000]),
);
const TRACK = -0.04;
const CAP = 0.66;
const BASELINE = 0.83;
const LEADING = 0.88;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Blob = readonly [x: number, y: number, color: string];

const THEMES = {
  // gradients.sh "mesh": the title is filled with the mesh, stage takes its navy ground.
  dark: {
    bg: "#0A0D24",
    key: "rgba(135,150,238,0.10)",
    fg: "#F1EEF6",
    muted: "#8E93B5",
    hair: "rgba(236,220,242,0.13)",
    grain: 0.07,
    base: "linear-gradient(165deg, #ECDCF2 0%, #B9B6F0 55%, #8796EE 100%)",
    blobs: [
      [16, 20, "#ECDCF2"],
      [84, 26, "#8796EE"],
      [72, 86, "#4A5FD0"],
      [22, 80, "#8796EE"],
      [52, 48, "#ECDCF2"],
      [92, 62, "#2E45B7"],
    ] as readonly Blob[],
  },
  // gradients.sh "smear" (light): warm paper ground, the title smeared in ink colours.
  light: {
    bg: "#EFE8DC",
    key: "rgba(255,255,255,0.55)",
    fg: "#1A1714",
    muted: "#7A7166",
    hair: "rgba(26,23,20,0.13)",
    grain: 0.05,
    base: "linear-gradient(165deg, #F2552C 0%, #E0503A 50%, #C24A5A 100%)",
    blobs: [
      [16, 20, "#F2552C"],
      [84, 26, "#E889B5"],
      [72, 86, "#E889B5"],
      [22, 80, "#D9462A"],
      [52, 48, "#F7A23B"],
      [92, 62, "#2F6B3F"],
    ] as readonly Blob[],
  },
} as const;

function meshFill(blobs: readonly Blob[], base: string, drift: number) {
  const layers = blobs.map(([x, y, col], k) => {
    const a = k * 1.7 + drift * 2.2;
    const bx = x + Math.cos(a) * 3 * drift;
    const by = y + Math.sin(a) * 4 * drift;
    return `radial-gradient(70% 95% at ${bx.toFixed(2)}% ${by.toFixed(2)}%, ${col} 0%, transparent 68%)`;
  });
  return [...layers, base].join(", ");
}

function em(text: string) {
  let w = 0;
  let prev = "";
  for (const ch of text) {
    w += KERN.get(prev + ch) ?? 0;
    prev = ch;
    const code = ch.charCodeAt(0);
    w += (code >= 32 && code < 127 ? BRICOLAGE_500[code - 32] : 600) / 1000;
    w += TRACK;
  }
  return w;
}

function splitLines(title: string) {
  if (title.includes("\n")) return title.split("\n").map((l) => l.trim());
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return [title.trim()];
  let best = [title.trim()];
  let bestW = Number.POSITIVE_INFINITY;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const w = Math.max(em(a), em(b));
    if (w < bestW) {
      bestW = w;
      best = [a, b];
    }
  }
  return best;
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

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600, tracking-tight. */
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
        textTransform: "none",
        whiteSpace: "nowrap",
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

function Line({
  text,
  accent,
}: {
  text: string;
  accent: string;
}): React.ReactNode {
  const m = /^(.*?)([.!?])$/.exec(text);
  if (!m) return text;
  return (
    <>
      {m[1]}
      <span style={{ color: accent }}>{m[2]}</span>
    </>
  );
}

export function PosterCrop({
  title = "Launch films,\nas code.",
  kicker = "remocn 3.0",
  meta = "Oct 24, 2026",
  note = "Production-ready motion for launch videos. Install a component, drop in your words, render.",
  logo,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: PosterCropProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];

  const margin = 40 * u;
  const header = margin + 30 * u;
  const contentW = W - margin * 2;
  const lines = splitLines(title);
  const widest = Math.max(...lines.map(em));
  const maxBlockH = H - header - margin - 40 * u;
  const F = Math.min(
    contentW / (widest + 0.03),
    maxBlockH / (CAP + LEADING * (lines.length - 1) + 0.06),
  );
  const lastBaseline = H - margin - 0.05 * F;
  const baselines = lines.map(
    (_, i) => lastBaseline - (lines.length - 1 - i) * LEADING * F,
  );

  const firstChar = em(lines[0].slice(0, 1));
  const focus = {
    x: margin + (firstChar + 0.06) * F,
    y: baselines[0] - CAP * 0.26 * F,
  };
  const s0 = (2.3 * H) / (CAP * F);
  const pivot = {
    x: (W / 2 - focus.x * s0) / (1 - s0),
    y: (H / 2 - focus.y * s0) / (1 - s0),
  };

  const pull = interpolate(t, [PULL_START, PULL_END], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const push = interpolate(t, [PULL_END, PULL_END + 60], [0, 1], CLAMP);
  const s = Math.exp(Math.log(s0) * (1 - pull)) * (1 + push * 0.012);
  const drift = interpolate(t, [0, PULL_START + 30], [1, 0], {
    ...CLAMP,
    easing: Easing.bezier(0.33, 0, 0.67, 1),
  });
  const dx = drift * 70 * u;
  const dy = drift * -14 * u;
  const sx = (x: number) => pivot.x + (x - pivot.x) * s + dx;
  const sy = (y: number) => pivot.y + (y - pivot.y) * s + dy;

  const hair = Math.max(1, u);
  const grid = (d: number) =>
    interpolate(t, [44 + d, 92 + d], [0, 1], { ...CLAMP, easing: EASE_IO });
  const label = (d: number) =>
    interpolate(t, [80 + d, 104 + d], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const columns = 6;

  const blockLeft = margin - 0.03 * F;
  const blockTop = baselines[0] - BASELINE * F;
  const blockW = widest * F + 0.1 * F;
  const blockH = baselines[baselines.length - 1] - BASELINE * F + F - blockTop;
  const fill = meshFill(c.blobs, c.base, interpolate(t, [0, 140], [0, 1]));
  const kickerIsBrand = /^remocn\b/i.test(kicker);
  const kickerRest = kicker.replace(/^remocn\s*/i, "");

  const labelStyle: React.CSSProperties = {
    position: "absolute",
    top: sy(margin),
    fontFamily: mono,
    fontWeight: 400,
    fontSize: 13.5 * u * s,
    lineHeight: 1,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "baseline",
    gap: 9 * u * s,
  };

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 80% at ${(sx(W * 0.3) / W) * 100}% ${(sy(H * 0.6) / H) * 100}%, ${c.key}, transparent 70%)`,
        }}
      />

      {Array.from({ length: columns + 1 }, (_, i) => {
        const x = margin + (contentW / columns) * i;
        const p = grid(i * 2);
        const top = sy(header);
        const bottom = sy(H - margin);
        return (
          <div
            key={`c${i}`}
            style={{
              position: "absolute",
              left: sx(x) - hair / 2,
              top,
              width: hair,
              height: Math.max(0, (bottom - top) * p),
              background: c.hair,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: sx(margin),
          top: sy(header) - hair / 2,
          width: Math.max(0, (sx(W - margin) - sx(margin)) * grid(0)),
          height: hair,
          background: c.hair,
        }}
      />

      {lines.map((line, i) => (
        <div
          key={`${i}-${line}`}
          style={{
            position: "absolute",
            left: sx(blockLeft),
            top: sy(baselines[i] - BASELINE * F),
            fontFamily: display,
            fontWeight: 500,
            fontSize: F * s,
            lineHeight: 1,
            letterSpacing: `${TRACK}em`,
            whiteSpace: "pre",
            color: "transparent",
            backgroundImage: fill,
            backgroundSize: `${blockW * s}px ${blockH * s}px`,
            backgroundPosition: `0px ${-(baselines[i] - BASELINE * F - blockTop) * s}px`,
            backgroundRepeat: "no-repeat",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          <Line text={line} accent={accent} />
        </div>
      ))}

      <div
        style={{
          ...labelStyle,
          left: sx(margin),
          color: c.fg,
          opacity: label(0),
          transform: `translateY(${(1 - label(0)) * 8 * u}px)`,
        }}
      >
        {logo ??
          (kickerIsBrand ? (
            <RemocnLogo fontSize={17 * u * s} color={c.fg} />
          ) : null)}
        <span>{kickerIsBrand && !logo ? kickerRest : kicker}</span>
      </div>
      <div
        style={{
          ...labelStyle,
          right: W - sx(W - margin),
          color: c.muted,
          opacity: label(4),
          transform: `translateY(${(1 - label(4)) * 8 * u}px)`,
        }}
      >
        {meta}
      </div>

      {note ? (
        <div
          style={{
            position: "absolute",
            left: sx(margin + (contentW / columns) * 3 + 12 * u),
            top: sy(header + 14 * u),
            width: (contentW / columns) * 2 * s,
            fontFamily: display,
            fontWeight: 400,
            fontSize: 16 * u * s,
            lineHeight: 1.32,
            letterSpacing: "-0.005em",
            color: c.muted,
            textWrap: "balance",
            opacity: label(8),
            transform: `translateY(${(1 - label(8)) * 8 * u}px)`,
          }}
        >
          {note}
        </div>
      ) : null}

      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
