"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface DominoRunProps {
  count?: number;
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
    small: "#47464D",
    large: "#BDBBB6",
    axis: "rgba(255,255,255,0.2)",
    // gradients.sh "halo": #fff4ec → #ffb36b → #e2457a → #3d4dff
    hero: ["#FFF4EC", "#FFB36B", "#E2457A"],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    small: "#CFCDC7",
    large: "#55534F",
    axis: "rgba(18,18,20,0.22)",
    // gradients.sh "halo", warm end deepened to read on off-white
    hero: ["#F07A3A", "#E2457A", "#5A3FD8"],
    grain: 0.045,
  },
} as const;

const RATIO = 1.18;
const THICK = 0.13;
const GAP = 0.44;
const T0 = 14;
const TAU0 = 3.6;
const PUSH = 2.2;
const CHAIN = 1.7;
const DEG = 180 / Math.PI;

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
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

interface Domino {
  h: number;
  w: number;
  px: number;
  gap: number;
  start: number;
  tau: number;
  contact: number;
}

function layout(n: number) {
  const ds: Domino[] = [];
  let x = 0;
  let start = T0;
  for (let i = 0; i < n; i++) {
    const h = RATIO ** i;
    const w = THICK * h;
    const gap = GAP * h;
    const last = i === n - 1;
    const contact = last ? Math.PI / 2 : Math.asin(gap / h);
    const tau = TAU0 * Math.sqrt(h) * (last ? 2.1 : 1);
    ds.push({ h, w, px: x + w, gap, start, tau, contact });
    x += w + gap;
    start += tau;
  }
  const lastD = ds[n - 1];
  const extent = lastD.px + lastD.h;
  return { ds, extent };
}

function freeAngle(d: Domino, t: number, first: boolean, last: boolean) {
  const k = (t - d.start) / d.tau;
  if (k <= 0) return 0;
  const a = d.contact * k ** (first ? PUSH : last ? 2 : CHAIN);
  return Math.min(Math.PI / 2, a);
}

function poseAt(ds: Domino[], t: number) {
  const n = ds.length;
  const last = ds[n - 1];
  const angles = new Array<number>(n).fill(0);
  angles[n - 1] = freeAngle(last, t, n === 1, true);
  const impact = last.start + last.tau;
  if (t > impact) {
    const tb = t - impact;
    angles[n - 1] =
      Math.PI / 2 -
      (3.2 / DEG) * Math.abs(Math.sin((Math.PI * tb) / 7)) * Math.exp(-tb / 6);
  }
  for (let i = n - 2; i >= 0; i--) {
    const free = freeAngle(ds[i], t, i === 0, false);
    angles[i] = Math.min(free, restAngle(ds[i], ds[i + 1], angles[i + 1]));
  }
  return angles;
}

function topOver(ds: Domino[], angles: number[], from: number, to: number) {
  let top = 0;
  ds.forEach((d, i) => {
    const a = angles[i];
    const pts = [
      [0, 0],
      [-d.w, 0],
      [-d.w, d.h],
      [0, d.h],
    ].map(([x, y]) => [
      d.px + x * Math.cos(a) + y * Math.sin(a),
      -x * Math.sin(a) + y * Math.cos(a),
    ]);
    const xs = pts.map((q) => q[0]);
    if (Math.max(...xs) < from || Math.min(...xs) > to) return;
    for (const q of pts) top = Math.max(top, q[1]);
  });
  return top;
}

function restAngle(d: Domino, next: Domino, psi: number) {
  const s = d.gap + next.w;
  let best = Math.PI / 2;
  const arg = (s * Math.cos(psi) - next.w) / d.h;
  if (arg >= -1 && arg <= 1) {
    const phiA = psi + Math.asin(arg);
    const tipX = -s + d.h * Math.sin(phiA);
    const tipY = d.h * Math.cos(phiA);
    const cx = -next.w * Math.cos(psi);
    const cy = next.w * Math.sin(psi);
    const along = (tipX - cx) * Math.sin(psi) + (tipY - cy) * Math.cos(psi);
    if (along >= 0 && along <= next.h) best = Math.min(best, phiA);
  }
  const bx = s - next.w * Math.cos(psi);
  const by = next.w * Math.sin(psi);
  if (Math.hypot(bx, by) <= d.h && by > 0) {
    best = Math.min(best, Math.atan2(bx, by));
  }
  return best;
}

export function DominoRun({
  count = 13,
  value = "10×",
  caption = "Every push tips a bigger one.",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: DominoRunProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const n = Math.max(5, Math.min(24, Math.round(count)));
  const { ds, extent } = layout(n);
  const last = ds[n - 1];

  const groundY = height * 0.66;
  const avail = width * 0.84;
  const maxTall = groundY - height * 0.16;
  const S = Math.min(avail / extent, maxTall / last.h);
  const x0 = (width - extent * S) / 2;

  const angles = poseAt(ds, t);
  const impact = last.start + last.tau;
  const rest = poseAt(ds, impact + 400);

  const enter = interpolate(t, [0, 16], [0, 1], { ...CLAMP, easing: EASE_IO });
  const sw = Math.max(1, u);
  const haloId = `halo${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const drift = interpolate(t, [0, 165], [0, 1], CLAMP);
  const heroGradient = `linear-gradient(${172 - 8 * drift}deg, ${p.hero[0]} ${4 + 6 * drift}%, ${p.hero[1]} ${46 + 4 * drift}%, ${p.hero[2]} 96%)`;
  const chars = Math.max(1, value.length);
  const valueSize = Math.max(
    96 * u,
    Math.min(200 * u, (width * 0.36) / (chars * 0.56)),
  );
  const valueW = chars * 0.56 * valueSize;
  const valueRight = x0 + (last.px + last.h) * S;
  const clearTop = topOver(ds, rest, (valueRight - valueW - x0) / S, extent);
  const valueBottom = groundY - clearTop * S - 34 * u;
  const reveal = interpolate(t, [impact + 2, impact + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const capIn = interpolate(t, [impact + 12, impact + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill>
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          <defs>
            <linearGradient id={haloId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor={accent} />
              <stop offset="0.55" stopColor="#E2457A" />
              <stop offset="1" stopColor="#FFB36B" />
            </linearGradient>
          </defs>
          <line
            x1={width / 2 - width * 0.43 * enter}
            x2={width / 2 + width * 0.43 * enter}
            y1={groundY + sw / 2}
            y2={groundY + sw / 2}
            stroke={p.axis}
            strokeWidth={sw}
          />
          {ds.map((d, i) => {
            const isLast = i === n - 1;
            const appear = interpolate(t, [2 + i * 1.2, 14 + i * 1.2], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            const fill = isLast
              ? `url(#${haloId})`
              : interpolateColors(
                  i / Math.max(1, n - 2),
                  [0, 1],
                  [p.small, p.large],
                );
            return (
              <g
                key={`d${d.h.toFixed(4)}`}
                opacity={appear}
                transform={`translate(${x0 + d.px * S} ${groundY + (1 - appear) * 10 * u}) rotate(${angles[i] * DEG})`}
              >
                <rect
                  x={-d.w * S}
                  y={-d.h * S}
                  width={d.w * S}
                  height={d.h * S}
                  rx={Math.min(3 * u, d.w * S * 0.3)}
                  fill={fill}
                />
              </g>
            );
          })}
        </svg>

        <div
          style={{
            position: "absolute",
            right: width - valueRight - valueSize * 0.03,
            bottom: height - valueBottom,
            fontFamily: display,
            fontWeight: 500,
            fontSize: valueSize,
            lineHeight: 0.74,
            letterSpacing: "-0.035em",
            backgroundImage: heroGradient,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            paddingTop: valueSize * 0.08,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            opacity: reveal,
            filter:
              reveal < 0.99 ? `blur(${(1 - reveal) * 10 * u}px)` : undefined,
            transform: `translateY(${(1 - reveal) * 22 * u}px)`,
          }}
        >
          {value}
        </div>
        {caption ? (
          <div
            style={{
              position: "absolute",
              right: width - valueRight,
              top: groundY + 24 * u,
              display: "flex",
              alignItems: "center",
              gap: 10 * u,
              fontFamily: display,
              fontWeight: 400,
              fontSize: 24 * u,
              letterSpacing: "-0.01em",
              color: p.muted,
              whiteSpace: "nowrap",
              opacity: capIn,
              transform: `translateY(${(1 - capIn) * 8 * u}px)`,
            }}
          >
            <span
              style={{
                width: 10 * u,
                height: 10 * u,
                borderRadius: "50%",
                background: accent,
              }}
            />
            {caption}
          </div>
        ) : null}
      </AbsoluteFill>
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
