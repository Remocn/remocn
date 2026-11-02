"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface UnitGridProps {
  total?: number;
  highlighted?: number;
  caption?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    unit: "#3A3A40",
    unitLit: "#4A4A51",
    back: "#1E1E22",
    light: "rgba(255,255,255,0.05)",
    // gradients.sh "limb", lit left to right across the highlighted units.
    lit: ["#e9ecff", "#8a8bff", "#4b2bd6"],
    glow: "color-mix(in oklab, #4b2bd6 26%, transparent)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    unit: "#CBC9C2",
    unitLit: "#D8D6CF",
    back: "#B9B7B0",
    light: "rgba(255,255,255,0.8)",
    lit: ["#8a8bff", "#5a3ff0", "#2f1d9e"],
    glow: "color-mix(in oklab, #8a8bff 22%, transparent)",
    grain: 0.045,
  },
} as const;

const APPEAR_STEP = 0.9;
const APPEAR_DUR = 12;
const FLIP_START = 34;
const FLIP_DUR = 10;

export const unitGridLength = (highlighted = 33) =>
  FLIP_START + flipSpan(highlighted) + FLIP_DUR + 18;

function flipSpan(n: number) {
  return Math.min(60, Math.max(10, 8 + n * 0.9));
}

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function mix(a: string, b: string, t: number) {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const c = (s: number) =>
    Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${c(16)}${c(8)}${c(0)}`;
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

function gridShape(total: number) {
  if (total === 100) return { cols: 10, rows: 10 };
  const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
  return { cols, rows: Math.ceil(total / cols) };
}

export function UnitGrid({
  total = 100,
  highlighted = 33,
  caption = "1 in 3 teams ship weekly",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: UnitGridProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const pal = THEMES[theme];
  const n = Math.max(1, Math.round(total));
  const hi = Math.max(0, Math.min(n, Math.round(highlighted)));

  const { cols, rows } = gridShape(n);
  const gridH = H * 0.56;
  const pitch = Math.min(gridH / rows, (W * 0.4) / cols);
  const gw = pitch * cols;
  const gh = pitch * rows;
  const colW = W * 0.36;
  const gap = W * 0.07;
  const left = (W - (gw + gap + colW)) / 2;
  const top = (H - gh) / 2;
  const r = pitch * 0.34;

  const span = flipSpan(hi);
  const flipEnd = FLIP_START + span + FLIP_DUR;

  const units = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const c = i % cols;
        const row = Math.floor(i / cols);
        const order = hi > 1 ? i / (hi - 1) : 0;
        return {
          i,
          x: left + (c + 0.5) * pitch,
          y: top + (row + 0.5) * pitch,
          appear: (c + row) * APPEAR_STEP + hash(i + 1.3) * 2,
          flip: i < hi ? FLIP_START + EASE_IO(order) * span : -1,
          hue: c / Math.max(1, cols - 1),
          light:
            1 -
            ((c / Math.max(1, cols - 1)) * 0.6 +
              (row / Math.max(1, rows - 1)) * 0.4),
        };
      }),
    [n, cols, rows, hi, left, top, pitch, span],
  );

  const litAt = (k: number) =>
    k < 0.5
      ? mix(pal.lit[0], pal.lit[1], k * 2)
      : mix(pal.lit[1], pal.lit[2], (k - 0.5) * 2);
  const glowIn = interpolate(t, [FLIP_START, flipEnd + 10], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  let count = 0;
  const settle = interpolate(t, [flipEnd, flipEnd + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const dots: React.ReactNode[] = [];
  for (const d of units) {
    const a = interpolate(t + 4 - d.appear, [0, APPEAR_DUR], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    if (a <= 0) continue;
    let sx = 1;
    let s = 0.55 + 0.45 * a;
    let fill: string = mix(pal.unit, pal.unitLit, d.light);
    let opacity = a * (1 - settle * 0.22);
    if (d.flip >= 0) {
      const p = interpolate(t - d.flip, [0, FLIP_DUR], [0, 1], CLAMP);
      if (p > 0) {
        const e = EASE_IO(p);
        sx = Math.max(0.06, Math.abs(Math.cos(Math.PI * e)));
        if (e < 0.5) {
          fill = mix(fill, pal.back, e * 2);
        } else {
          count++;
          fill = mix(pal.back, litAt(d.hue), Math.min(1, (e - 0.5) * 2.6));
          opacity = a;
          const pop = Math.sin(Math.PI * Math.min(1, (e - 0.5) * 2));
          s *= 1 + 0.12 * pop;
        }
      }
    }
    dots.push(
      <ellipse
        key={d.i}
        cx={d.x}
        cy={d.y}
        rx={r * s * sx}
        ry={r * s}
        fill={fill}
        opacity={opacity}
      />,
    );
  }

  const numIn = interpolate(t, [16, 34], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const capIn = interpolate(t, [flipEnd - 8, flipEnd + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const cam = interpolate(t, [0, flipEnd + 40], [1, 1.03], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const numSize = Math.min(gh * 0.5, colW * 0.46);
  const digits = String(hi).length;
  const colLeft = left + gw + gap;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% 60% at 40% 42%, ${pal.light}, transparent 75%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: glowIn,
          background: `radial-gradient(ellipse ${gw * 0.9}px ${gh * 0.55}px at ${left + gw / 2}px ${top + gh * 0.2}px, ${pal.glow}, transparent 80%)`,
        }}
      />
      <AbsoluteFill
        style={{ transform: `scale(${cam})`, transformOrigin: "50% 50%" }}
      >
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          {dots}
        </svg>
        <div
          style={{
            position: "absolute",
            left: colLeft,
            top: top - numSize * 0.16,
            width: colW,
            display: "flex",
            alignItems: "baseline",
            gap: 10 * u,
            color: pal.fg,
            opacity: numIn,
            transform: `translateY(${(1 - numIn) * 14 * u}px)`,
            filter: `blur(${(1 - numIn) * 6 * u}px)`,
          }}
        >
          <span
            style={{
              fontFamily: sans,
              fontWeight: 400,
              fontSize: numSize,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              fontVariantNumeric: "tabular-nums",
              width: `calc(${digits}ch - ${digits * 0.04}em)`,
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            {count}
          </span>
          <span
            style={{
              fontFamily: mono,
              fontWeight: 400,
              fontSize: numSize * 0.22,
              lineHeight: 1,
              letterSpacing: "-0.01em",
              fontVariantNumeric: "tabular-nums",
              color: pal.muted,
            }}
          >
            / {n}
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            left: colLeft,
            top,
            width: colW,
            height: gh,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: colW * EASE_IO(capIn),
              height: Math.max(1, u),
              marginBottom: 20 * u,
              background: accent,
              opacity: 0.8,
            }}
          />
          <div
            style={{
              fontFamily: sans,
              fontWeight: 400,
              fontSize: 34 * u,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              textWrap: "balance",
              color: pal.fg,
              opacity: capIn,
              transform: `translateY(${(1 - capIn) * 12 * u}px)`,
              filter: `blur(${(1 - capIn) * 5 * u}px)`,
            }}
          >
            {caption}
          </div>
        </div>
      </AbsoluteFill>
      <Grain opacity={pal.grain} />
    </AbsoluteFill>
  );
}
