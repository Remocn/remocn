"use client";

import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const sora = loadSora("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const mono = loadGeistMono("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface CometHeadlineProps {
  eyebrow?: string;
  headline?: string;
  highlight?: string;
  subhead?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const LIMB = ["#e9ecff", "#8a8bff", "#4b2bd6", "#160c3a"] as const;

const PALETTES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F4F3F0",
    muted: "#8E8D94",
    trail: LIMB[1],
    head: "#FFFFFF",
    highlight: (accent: string) =>
      `linear-gradient(90deg, ${LIMB[0]} 0%, #b7b8ff 30%, ${LIMB[1]} 60%, color-mix(in oklab, ${accent} 55%, ${LIMB[1]}) 85%, ${LIMB[0]} 100%)`,
    ground: [
      `radial-gradient(75% 95% at 106% 112%, color-mix(in oklab, ${LIMB[2]} 42%, transparent) 0%, color-mix(in oklab, ${LIMB[3]} 55%, transparent) 42%, transparent 78%)`,
      `radial-gradient(28% 40% at 98% 104%, color-mix(in oklab, ${LIMB[1]} 22%, transparent) 0%, transparent 80%)`,
    ],
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    muted: "#6E6C67",
    trail: LIMB[2],
    head: LIMB[2],
    highlight: (accent: string) =>
      `linear-gradient(90deg, ${LIMB[2]} 0%, ${accent} 36%, #6f6ff0 64%, ${LIMB[1]} 84%, ${LIMB[2]} 100%)`,
    ground: [
      `radial-gradient(75% 95% at 106% 112%, color-mix(in oklab, ${LIMB[1]} 26%, transparent) 0%, color-mix(in oklab, ${LIMB[0]} 50%, transparent) 45%, transparent 78%)`,
    ],
    grain: 0.035,
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_FLIGHT = Easing.bezier(0.33, 0.1, 0.12, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const SORA_500 = [
  222, 303, 452, 702, 652, 864, 702, 264, 382, 382, 568, 592, 266, 506, 266,
  365, 750, 423, 623, 620, 652, 630, 668, 585, 647, 668, 266, 266, 592, 590,
  592, 556, 1124, 765, 684, 797, 788, 598, 560, 832, 803, 320, 641, 703, 549,
  937, 858, 865, 649, 865, 710, 682, 602, 785, 719, 1052, 705, 654, 652, 382,
  365, 382, 587, 581, 300, 581, 694, 608, 694, 616, 380, 679, 644, 317, 324,
  595, 296, 973, 644, 678, 694, 694, 414, 543, 429, 634, 572, 873, 574, 555,
  493, 382, 375, 382, 511,
];
const ASC = 0.97;
const DESC = 0.29;
const TRACK = -0.035;
const LINE = 1.06;

function textEm(text: string, tracking = TRACK) {
  let w = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += (c >= 32 && c <= 126 ? SORA_500[c - 32] : 640) / 1000 + tracking;
  }
  return w;
}

interface Word {
  text: string;
  index: number;
  line: number;
  x: number;
  w: number;
  hl: [number, number] | null;
}

function layout(headline: string, highlight: string, maxEm: number) {
  const lower = headline.toLowerCase();
  const hStart = highlight ? lower.indexOf(highlight.toLowerCase()) : -1;
  const hEnd = hStart >= 0 ? hStart + highlight.length : -1;
  const hLen = Math.max(1, hEnd - hStart);
  const space = textEm(" ");
  const words: Word[] = [];
  let line = 0;
  let x = 0;
  let index = 0;
  const re = /\S+|\n/g;
  for (let m = re.exec(headline); m; m = re.exec(headline)) {
    if (m[0] === "\n") {
      if (x > 0) line += 1;
      x = 0;
      continue;
    }
    const w = textEm(m[0]);
    if (x > 0 && x + space + w > maxEm) {
      line += 1;
      x = 0;
    }
    const left = x > 0 ? x + space : 0;
    const a = m.index;
    const b = a + m[0].length;
    const inside = hStart >= 0 && a < hEnd && b > hStart;
    words.push({
      text: m[0],
      index: index++,
      line,
      x: left,
      w,
      hl: inside
        ? [
            (Math.max(a, hStart) - hStart) / hLen,
            (Math.min(b, hEnd) - hStart) / hLen,
          ]
        : null,
    });
    x = left + w;
  }
  const lines = words.length ? words[words.length - 1].line + 1 : 1;
  const widths = Array.from({ length: lines }, (_, l) =>
    words
      .filter((w) => w.line === l)
      .reduce((m, w) => Math.max(m, w.x + w.w), 0),
  );
  return { words, lines, widths };
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

type Pt = { x: number; y: number };

function quad(a: Pt, c: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}

function quadSlice(a: Pt, c: Pt, b: Pt, t0: number, t1: number) {
  const p0 = quad(a, c, b, t0);
  const p1 = quad(a, c, b, t1);
  const blossom = (s: number, t: number) => ({
    x:
      (1 - s) * (1 - t) * a.x + ((1 - s) * t + s * (1 - t)) * c.x + s * t * b.x,
    y:
      (1 - s) * (1 - t) * a.y + ((1 - s) * t + s * (1 - t)) * c.y + s * t * b.y,
  });
  const q = blossom(t0, t1);
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} Q ${q.x.toFixed(2)} ${q.y.toFixed(2)} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
}

function highlightFill(
  [a, b]: [number, number],
  drift: number,
  image: string,
): React.CSSProperties {
  const f = Math.max(0.02, b - a);
  const K = 1.6 / f;
  const o = drift * 0.35;
  const P = (a / f + o * K) / (K - 1);
  return {
    backgroundImage: image,
    backgroundSize: `${K * 100}% 100%`,
    backgroundPosition: `${P * 100}% 0%`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };
}

export function CometHeadline({
  eyebrow = "New in remocn",
  headline = "Every launch beat, already in orbit.",
  highlight = "in orbit",
  subhead = "Reveals, feature heads and stats as drop-in Remotion scenes.",
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: CometHeadlineProps) {
  const raw = useCurrentFrame();
  const frame = raw * speed;
  const { width, height, durationInFrames } = useVideoConfig();
  const p = PALETTES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const portrait = height > width * 1.1;
  const s = portrait
    ? (width / 1280) * 1.55
    : Math.min(width / 1280, height / 720);
  const padX = width * (portrait ? 0.08 : 0.09);
  const maxW = Math.min(width - padX * 2, (portrait ? 2000 : 1060) * s);

  const flat = headline.replace(/\n/g, " ");
  const baseFs = (portrait ? 108 : 96) * s;
  const estEm = textEm(flat) * 1.04;
  const hardLines = headline.split("\n").length;
  const fitLines = portrait ? 3 : 2;
  const linesAtBase = Math.max(hardLines, Math.ceil((estEm * baseFs) / maxW));
  const fs =
    linesAtBase <= fitLines
      ? baseFs
      : Math.max(baseFs * 0.7, (maxW * fitLines) / Math.max(estEm, 1));
  const { words, lines } = layout(headline, highlight, maxW / fs);
  const lh = fs * LINE;
  const baseline = ((LINE - (ASC + DESC)) / 2 + ASC) * fs;

  const eyeFs = 17 * s * (portrait ? 1.25 : 1);
  const eyeH = eyebrow ? eyeFs * 1.3 + fs * 0.4 : 0;
  const subFs = (portrait ? 30 : 25) * s;
  const subGap = fs * 0.36;
  const subMax = Math.min(maxW * 0.8, 720 * s * (portrait ? 1.35 : 1));
  const subLines = subhead
    ? Math.max(1, Math.ceil((textEm(subhead, -0.008) * subFs * 1.02) / subMax))
    : 0;
  const subH = subhead ? subGap + subLines * subFs * 1.4 : 0;
  const blockH = eyeH + lines * lh + subH;
  const top = (height - blockH) / 2 - (portrait ? 0 : 6 * s);
  const left = padX;
  const headTop = top + eyeH;

  const n = words.length;
  const stagger = n > 1 ? Math.min(5, 34 / (n - 1)) : 0;
  const FLIGHT = 26;
  const launch = (i: number) => 6 + i * stagger;
  const land = (i: number) => launch(i) + FLIGHT;
  const lastLand = land(Math.max(0, n - 1));
  const eyeT = interpolate(frame, [0, 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const subT = interpolate(frame, [lastLand - 2, lastLand + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const cool = interpolate(frame, [lastLand, lastLand + 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const drift = interpolate(raw, [0, durationInFrames], [0, 1], CLAMP);

  const origin: Pt = portrait
    ? { x: width * 1.1, y: height * 0.96 }
    : { x: width * 1.05, y: height * 1.12 };
  const peakY = Math.max(
    height * 0.02,
    headTop - (portrait ? 0.2 : 0.3) * height,
  );
  const orbit = (w: Word) => {
    const target: Pt = {
      x: left + (w.x + w.w / 2) * fs,
      y: headTop + w.line * lh + baseline - fs * 0.36,
    };
    const k = n > 1 ? 1 - w.index / (n - 1) : 0;
    const control: Pt = {
      x: target.x + (origin.x - target.x) * (0.34 - 0.06 * k),
      y: peakY - (0.04 + 0.12 * k) * height,
    };
    return { target, control };
  };

  const transparent = background === "transparent";
  const trailW = Math.max(1, 1.3 * s);

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? p.bg),
        overflow: "hidden",
      }}
    >
      {!transparent && background === undefined ? (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: p.ground.join(", "),
              transform: `translate(${(-drift * 2).toFixed(3)}%, ${(-drift * 1.5).toFixed(3)}%) scale(1.06)`,
            }}
          />
          <Grain opacity={p.grain} />
        </>
      ) : null}

      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          {words.map((w) => {
            const { target } = orbit(w);
            return (
              <linearGradient
                key={w.index}
                id={`${uid}t${w.index}`}
                gradientUnits="userSpaceOnUse"
                x1={origin.x}
                y1={origin.y}
                x2={target.x}
                y2={target.y}
              >
                <stop offset="0" stopColor={p.trail} stopOpacity={0} />
                <stop offset="0.35" stopColor={p.trail} stopOpacity={0.45} />
                <stop offset="1" stopColor={p.trail} stopOpacity={1} />
              </linearGradient>
            );
          })}
        </defs>
        {words.map((w) => {
          const { target, control } = orbit(w);
          const raw01 = interpolate(
            frame,
            [launch(w.index), land(w.index)],
            [0, 1],
            CLAMP,
          );
          if (raw01 <= 0) return null;
          const t = EASE_FLIGHT(raw01);
          const head = quad(origin, control, target, t);
          const tail = Math.max(0, t - 0.22);
          const landed = frame - land(w.index);
          const trailOp = interpolate(cool, [0, 1], [0.75, 0.42]);
          const headR = interpolate(landed, [-3, 5], [0.05, 0], CLAMP) * fs;
          const tailOp = interpolate(landed, [-2, 6], [1, 0], CLAMP);
          return (
            <g key={w.index}>
              <path
                d={quadSlice(origin, control, target, 0, t)}
                fill="none"
                stroke={`url(#${uid}t${w.index})`}
                strokeWidth={trailW}
                strokeLinecap="round"
                opacity={trailOp}
              />
              {tailOp > 0 ? (
                <path
                  d={quadSlice(origin, control, target, tail, t)}
                  fill="none"
                  stroke={p.head}
                  strokeWidth={trailW * 2.2}
                  strokeLinecap="round"
                  opacity={0.55 * tailOp}
                />
              ) : null}
              {headR > 0.1 ? (
                <circle cx={head.x} cy={head.y} r={headR} fill={p.head} />
              ) : null}
              {landed >= 0 && landed < 16 ? (
                <circle
                  cx={target.x}
                  cy={target.y}
                  r={
                    interpolate(landed, [0, 16], [0.06, 0.62], {
                      ...CLAMP,
                      easing: EASE_OUT,
                    }) * fs
                  }
                  fill="none"
                  stroke={p.trail}
                  strokeWidth={trailW}
                  opacity={interpolate(landed, [0, 16], [0.8, 0], CLAMP)}
                />
              ) : null}
            </g>
          );
        })}
      </svg>

      {eyebrow ? (
        <div
          style={{
            position: "absolute",
            left,
            top,
            height: eyeFs * 1.3,
            display: "flex",
            alignItems: "center",
            gap: eyeFs * 0.7,
            clipPath: `inset(-20% ${(1 - eyeT) * 100}% -20% 0)`,
          }}
        >
          <div
            style={{
              width: eyeFs * 0.48,
              height: eyeFs * 0.48,
              borderRadius: 999,
              background: theme === "dark" ? LIMB[1] : accent,
            }}
          />
          <span
            style={{
              fontFamily: mono.fontFamily,
              fontWeight: 500,
              fontSize: eyeFs,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: p.muted,
              whiteSpace: "nowrap",
              transform: `translateX(${(1 - eyeT) * -12 * s}px)`,
            }}
          >
            {eyebrow}
          </span>
        </div>
      ) : null}

      {words.map((w) => {
        const k = interpolate(
          frame,
          [land(w.index) - 2, land(w.index) + 12],
          [0, 1],
          {
            ...CLAMP,
            easing: EASE_OUT,
          },
        );
        if (k <= 0) return null;
        const wght = 100 + 400 * k;
        const track = TRACK + (1 - k) * 0.05;
        const chars = Math.max(1, w.text.length);
        const shift = (-(track - TRACK) * chars * fs) / 2;
        const hl = w.hl
          ? highlightFill(w.hl, drift, p.highlight(accent))
          : { color: p.fg };
        return (
          <div
            key={w.index}
            style={{
              position: "absolute",
              left: left + w.x * fs + shift,
              top: headTop + w.line * lh,
              height: lh,
              lineHeight: `${lh}px`,
              fontFamily: sora.fontFamily,
              fontWeight: 500,
              fontVariationSettings: `"wght" ${wght.toFixed(1)}`,
              fontSize: fs,
              letterSpacing: `${track.toFixed(4)}em`,
              whiteSpace: "nowrap",
              opacity: interpolate(k, [0, 0.35], [0, 1], CLAMP),
              filter:
                k < 0.98
                  ? `blur(${((1 - k) * 0.05 * fs).toFixed(2)}px)`
                  : undefined,
              paddingRight: "0.06em",
              ...hl,
            }}
          >
            {w.text}
          </div>
        );
      })}

      {subhead ? (
        <div
          style={{
            position: "absolute",
            left,
            top: headTop + lines * lh + subGap,
            width: subMax,
            fontFamily: sora.fontFamily,
            fontWeight: 400,
            fontSize: subFs,
            lineHeight: 1.4,
            letterSpacing: "-0.008em",
            color: p.muted,
            textWrap: "balance",
            opacity: subT,
            transform: `translateY(${(1 - subT) * 14 * s}px)`,
            filter: `blur(${(1 - subT) * 6 * s}px)`,
          }}
        >
          {subhead}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
