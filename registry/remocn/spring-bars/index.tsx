"use client";

import { loadFont } from "@remotion/google-fonts/SchibstedGrotesk";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface SpringBarsProps {
  values?: number[];
  accentIndex?: number;
  value?: string;
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
    coil: "#9A99A0",
    weight: "#4A4950",
    axis: "rgba(255,255,255,0.2)",
    // gradients.sh "fluted": #1d2a8f → #2f7bff → #ff7a3d → #ffe2c4, bottom to top
    hero: ["#1D2A8F", "#2F7BFF", "#B565C2", "#FF7A3D", "#FFE2C4"],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    coil: "#6E6C67",
    weight: "#BAB8B1",
    axis: "rgba(18,18,20,0.22)",
    hero: ["#1D2A8F", "#2F7BFF", "#B04FB8", "#F2662A", "#FF9A5C"],
    grain: 0.045,
  },
} as const;

const SPAWN0 = 14;
const STAGGER = 3;
const FALL = 15;
const ZETA = 0.28;
const COILS = 11;

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={5}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function coilPath(
  cx: number,
  base: number,
  len: number,
  cw: number,
  e: number,
) {
  const top = base - len;
  const pts: string[] = [`M ${cx} ${base}`, `L ${cx} ${base - e}`];
  const body = Math.max(0, len - 2 * e);
  for (let k = 0; k < COILS; k++) {
    const y = base - e - ((k + 0.5) / COILS) * body;
    const x = cx + (k % 2 === 0 ? -cw / 2 : cw / 2);
    pts.push(`L ${x} ${y}`);
  }
  pts.push(`L ${cx} ${top + e}`, `L ${cx} ${top}`);
  return pts.join(" ");
}

function barPath(x: number, base: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h / 2, w / 2);
  const top = base - h;
  return `M ${x} ${base} L ${x} ${top + rr} Q ${x} ${top} ${x + rr} ${top} L ${x + w - rr} ${top} Q ${x + w} ${top} ${x + w} ${top + rr} L ${x + w} ${base} Z`;
}

export function SpringBars({
  values = [0.58, 0.72, 0.52, 0.66, 0.97, 0.62, 0.7],
  accentIndex = 4,
  value = "3.4×",
  caption = "Least sag under the same load",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: SpringBarsProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const vals = values.slice(0, 10).map((v) => Math.max(0.3, Math.min(1, v)));
  const n = Math.max(1, vals.length);
  const ai = Math.max(0, Math.min(n - 1, Math.round(accentIndex)));

  const chartW = Math.min(width * 0.72, n * 132 * u);
  const pitch = chartW / n;
  const left = (width - chartW) / 2;
  const groundY = height * 0.84;
  const L0 = 340 * u;
  const plateW = Math.min(pitch * 0.62, 84 * u);
  const plateH = 14 * u;
  const coilW = plateW * 0.7;
  const endSeg = 9 * u;
  const sw = Math.max(1, 1.6 * u);

  const springs = vals.map((v, i) => {
    const rest = v * L0 * 0.94;
    const comp = L0 - rest;
    const omega = Math.max(
      0.26,
      Math.min(0.46, 0.3 * Math.sqrt((150 * u) / Math.max(comp, 1))),
    );
    const spawn = SPAWN0 + i * STAGGER;
    return { i, rest, comp, omega, spawn, contact: spawn + FALL };
  });
  const lastContact = Math.max(...springs.map((s) => s.contact));
  const MORPH = lastContact + 44;

  const enter = interpolate(t, [0, 14], [0, 1], { ...CLAMP, easing: EASE_IO });
  const morph = interpolate(t, [MORPH, MORPH + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const labelIn = interpolate(t, [MORPH + 10, MORPH + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const capIn = interpolate(t, [MORPH + 18, MORPH + 36], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const lengthAt = (s: (typeof springs)[number]) => {
    const lt = t - s.contact;
    if (lt <= 0) return L0;
    const wd = s.omega * Math.sqrt(1 - ZETA * ZETA);
    const x0 = s.comp;
    const v0 = -0.3 * x0 * s.omega;
    const decay = Math.exp(-ZETA * s.omega * lt);
    const x =
      decay *
      (x0 * Math.cos(wd * lt) +
        ((v0 + ZETA * s.omega * x0) / wd) * Math.sin(wd * lt));
    const len = s.rest + x;
    const floor = L0 * 0.16;
    return len < floor * 1.6 ? floor + (len - floor) * 0.4 : len;
  };

  const accentS = springs[ai];
  const accentX = left + pitch * (ai + 0.5);
  const accentTop = groundY - accentS.rest - plateH;
  const valueSize = 112 * u;
  const capSize = 22 * u;
  const labelBottom = accentTop - 26 * u;
  const labelX = Math.max(width * 0.1, Math.min(width * 0.9, accentX));
  const flutedId = `fluted${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const drift = interpolate(t, [0, 160], [0, 1], CLAMP);

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={flutedId}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={groundY}
            x2={0}
            y2={accentTop - 6 * u}
          >
            <stop offset={0} stopColor={p.hero[0]} />
            <stop offset={0.3 + 0.03 * drift} stopColor={p.hero[1]} />
            <stop offset={0.56 + 0.03 * drift} stopColor={p.hero[2]} />
            <stop offset={0.78 + 0.02 * drift} stopColor={p.hero[3]} />
            <stop offset={1} stopColor={p.hero[4]} />
          </linearGradient>
        </defs>
        <line
          x1={width / 2 - (chartW / 2 + 40 * u) * enter}
          x2={width / 2 + (chartW / 2 + 40 * u) * enter}
          y1={groundY + Math.max(1, u) / 2}
          y2={groundY + Math.max(1, u) / 2}
          stroke={p.axis}
          strokeWidth={Math.max(1, u)}
        />
        {springs.map((s) => {
          const cx = left + pitch * (s.i + 0.5);
          const isA = s.i === ai;
          const len = lengthAt(s);
          const appear = interpolate(
            t,
            [2 + s.i * 1.5, 14 + s.i * 1.5],
            [0, 1],
            { ...CLAMP, easing: EASE_OUT },
          );
          const lt = t - s.spawn;
          const startY = -plateH - 24 * u;
          const contactY = groundY - L0 - plateH;
          const k = Math.min(1, Math.max(0, lt / FALL));
          const plateY =
            lt < FALL
              ? startY + (contactY - startY) * k * k
              : groundY - len - plateH;
          const barH = (groundY - plateY) * morph;
          const r = Math.min(3 * u, plateH / 3);
          const color = isA ? `url(#${flutedId})` : p.weight;
          return (
            <g key={`s${s.i}`}>
              <path
                d={coilPath(cx, groundY, len, coilW, endSeg)}
                fill="none"
                stroke={isA ? `url(#${flutedId})` : p.coil}
                strokeWidth={sw}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={appear * (1 - morph)}
                transform={`translate(0 ${(1 - appear) * 10 * u})`}
              />
              {lt >= 0 ? (
                <rect
                  x={cx - plateW / 2}
                  y={plateY}
                  width={plateW}
                  height={plateH}
                  rx={r}
                  fill={color}
                />
              ) : null}
              {morph > 0 ? (
                <path
                  d={barPath(cx - plateW / 2, groundY, plateW, barH, r)}
                  fill={color}
                />
              ) : null}
            </g>
          );
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          left: labelX,
          bottom: height - labelBottom,
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12 * u,
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            fontFamily: display,
            fontWeight: 500,
            fontSize: valueSize,
            lineHeight: 0.8,
            letterSpacing: "-0.04em",
            color: p.fg,
            opacity: labelIn,
            filter:
              labelIn < 0.99 ? `blur(${(1 - labelIn) * 8 * u}px)` : undefined,
            transform: `translateY(${(1 - labelIn) * 18 * u}px)`,
          }}
        >
          {value}
        </div>
        {caption ? (
          <div
            style={{
              fontFamily: display,
              fontWeight: 400,
              fontSize: capSize,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              color: p.muted,
              opacity: capIn,
              transform: `translateY(${(1 - capIn) * 8 * u}px)`,
              display: "flex",
              alignItems: "center",
              gap: 10 * u,
            }}
          >
            <span
              style={{
                width: 8 * u,
                height: 8 * u,
                borderRadius: "50%",
                background: accent,
              }}
            />
            {caption}
          </div>
        ) : null}
      </div>
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
