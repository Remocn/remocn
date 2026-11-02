"use client";

import { loadFont } from "@remotion/google-fonts/Fraunces";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: fraunces } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
loadFont("italic", { weights: ["300", "400"], subsets: ["latin"] });

// gradients.sh "swirl" palette
const SWIRL = {
  bg: "#07060a",
  c: ["#ffe2c4", "#ff9a4d", "#d2456b", "#3a1f6b"],
} as const;

export interface TallyMarksProps {
  value?: number;
  label?: string;
  rows?: number;
  groupsPerRow?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const T0 = 6;
const TALLY = 66;
const R0 = 0.2;
const ROW_IN = 78;
const ROW_LEN = 18;
const COL_IN = 90;
const COL_LEN = 18;
const COL_STAGGER = 4;
const TIP = COL_IN + COL_LEN + COL_STAGGER;
const NUM_IN = TIP + 10;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: SWIRL.bg,
    fg: "#F4F1EC",
    muted: "#9A949C",
    stops: ["#ffc79a", SWIRL.c[1], SWIRL.c[2], "#9b4fa6"],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    stops: ["#ff8a3d", "#f2602c", SWIRL.c[2], "#7a3a9a"],
    grain: 0.045,
  },
} as const;

function hash(a: number, b: number) {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function formatNumber(n: number) {
  return Math.round(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function solveRate(n: number, d: number, r0: number) {
  if (r0 * d >= n) return 1e-6;
  let lo = 1e-6;
  let hi = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const f = (r0 / mid) * (Math.exp(mid * d) - 1);
    if (f > n) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

interface Stroke {
  key: string;
  row: number;
  col: number;
  k: number;
  slash: boolean;
  at: number;
  dur: number;
  ja: number;
  jl: number;
  jx: number;
  jy: number;
}

function buildStrokes(rows: number, perRow: number): Stroke[] {
  const n = rows * perRow * 5;
  const rate = solveRate(n, TALLY, R0);
  const list: Stroke[] = [];
  for (let i = 0; i < n; i++) {
    const g = Math.floor(i / 5);
    const k = i % 5;
    const slash = k === 4;
    const at = T0 + Math.log(1 + (i * rate) / R0) / rate;
    const prog = i / Math.max(1, n - 1);
    list.push({
      key: `s${i}`,
      row: Math.floor(g / perRow),
      col: g % perRow,
      k,
      slash,
      at,
      dur: interpolate(prog, [0, 0.35, 1], [6, 4, 3], CLAMP),
      ja: (hash(i, 3) - 0.5) * (slash ? 6 : 5),
      jl: (hash(i, 5) - 0.5) * 0.08,
      jx: (hash(i, 7) - 0.5) * 2.4,
      jy: (hash(i, 11) - 0.5) * 4,
    });
  }
  return list;
}

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
          seed={41}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function TallyMarks({
  value = 1240,
  label = "videos rendered on launch day",
  rows = 4,
  groupsPerRow = 9,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: TallyMarksProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const nRows = Math.max(1, Math.min(6, Math.round(rows)));
  const nCols = Math.max(2, Math.min(14, Math.round(groupsPerRow)));
  const strokes = useMemo(() => buildStrokes(nRows, nCols), [nRows, nCols]);
  const gradId = `tm${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ruleGradId = `${gradId}r`;

  const cx = width / 2;
  const cy = height / 2;
  const sw = 9 * u;
  const L = 74 * u;
  const P = 19 * u;
  const over = 9 * u;
  const slashDx = 3 * P + 2 * over;
  const slashDy = 0.6 * L;
  const slashLen = Math.hypot(slashDx, slashDy);
  const slashAng = (Math.atan2(slashDx, slashDy) * 180) / Math.PI;
  const groupW = 3 * P + 2 * over;
  const pitchX = Math.min(
    124 * u,
    (width * 0.84 - groupW) / Math.max(1, nCols - 1),
  );
  const pitchY = Math.min(
    124 * u,
    (height * 0.66 - L) / Math.max(1, nRows - 1),
  );
  const gx0 = cx - ((nCols - 1) * pitchX) / 2;
  const ry0 = cy - ((nRows - 1) * pitchY) / 2;
  const midCol = (nCols - 1) / 2;
  const midRow = (nRows - 1) / 2;
  const total = nRows * nCols * 5;
  const rate = useMemo(() => solveRate(total, TALLY, R0), [total]);

  const frameAt = (tt: number) => {
    const drawn = Math.max(
      0.2,
      Math.min(
        total,
        (R0 / rate) * (Math.exp(rate * Math.max(0, tt - T0)) - 1),
      ),
    );
    const gi = drawn / 5;
    const rowsF = gi / nCols;
    const right =
      gx0 + Math.min(nCols - 1, Math.max(0, gi - 0.5)) * pitchX + groupW / 2;
    const leftX = gx0 - groupW / 2;
    const topY = ry0 - L / 2;
    const bottom =
      ry0 + Math.min(nRows - 1, Math.max(0, rowsF - 0.7)) * pitchY + L / 2;
    const bw = right - leftX;
    const bh = bottom - topY;
    const s = Math.max(
      1,
      Math.min(2.3, (width * 0.84) / bw, (height * 0.62) / bh),
    );
    return { s, fx: (leftX + right) / 2, fy: (topY + bottom) / 2 };
  };
  let camS = frameAt(t + 14).s;
  let camX = 0;
  let camY = 0;
  const SAMPLES = [6, 8, 10, 12, 14];
  for (const d of SAMPLES) {
    const f = frameAt(t + d);
    camX += f.fx / SAMPLES.length;
    camY += f.fy / SAMPLES.length;
  }
  const settle = interpolate(t, [T0 + TALLY - 6, ROW_IN], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  camS += (1 - camS) * settle;
  camX += (cx - camX) * settle;
  camY += (cy - camY) * settle;
  const camT = `translate(${cx} ${cy}) scale(${camS}) translate(${-camX} ${-camY})`;

  const text = formatNumber(value);
  const numSize = 172 * u;
  const ruleY = cy + 58 * u;
  const ruleT = 8 * u;
  const digitCount = text.replace(/,/g, "").length;
  const commaCount = text.length - digitCount;
  const ruleW = Math.min(
    width * 0.6,
    numSize * (0.6 * digitCount + 0.26 * commaCount) * 0.92,
  );

  const push = interpolate(t, [0, TIP + 30], [0.985, 1.01], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const showStrokes = t < TIP;

  const tip = spring({
    frame: t - TIP,
    fps,
    config: { damping: 22, stiffness: 140, mass: 0.8 },
  });

  const lines = showStrokes
    ? strokes.map((s) => {
        const appear = interpolate(t, [s.at, s.at + s.dur], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        if (appear <= 0) return null;
        const rowDelay =
          (1 - Math.abs(s.row - midRow) / Math.max(1, midRow)) * 2;
        const rowK = interpolate(
          t,
          [ROW_IN + rowDelay, ROW_IN + rowDelay + ROW_LEN],
          [0, 1],
          { ...CLAMP, easing: EASE_IO },
        );
        const colDelay =
          (1 - Math.abs(s.col - midCol) / Math.max(1, midCol)) * COL_STAGGER;
        const colK = interpolate(
          t,
          [COL_IN + colDelay, COL_IN + colDelay + COL_LEN],
          [0, 1],
          { ...CLAMP, easing: EASE_IO },
        );
        const jit = 1 - rowK;
        const ang = (s.slash ? slashAng * (1 - colK) : 0) + s.ja * jit;
        const fullLen = s.slash ? slashLen : L * (1 + s.jl * jit);
        const len = fullLen + (L - fullLen) * colK;
        const gx = gx0 + s.col * pitchX;
        const ry = ry0 + s.row * pitchY;
        const ox = s.slash ? 0 : (s.k - 1.5) * P;
        const x = gx + (cx - gx) * colK + ox * (1 - colK) + s.jx * u * jit;
        const y = ry + (cy - ry) * rowK + s.jy * u * jit;
        const a = (ang * Math.PI) / 180;
        const dx = Math.sin(a);
        const dy = -Math.cos(a);
        const h = len / 2;
        const vis = len * appear;
        let x1: number;
        let y1: number;
        let x2: number;
        let y2: number;
        if (s.slash) {
          x1 = x - dx * h;
          y1 = y - dy * h;
          x2 = x1 + dx * vis;
          y2 = y1 + dy * vis;
        } else {
          x1 = x + dx * h;
          y1 = y + dy * h;
          x2 = x1 - dx * vis;
          y2 = y1 - dy * vis;
        }
        return (
          <line
            key={s.key}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={s.slash ? `url(#${gradId})` : p.fg}
            strokeWidth={sw * (1 + 0.22 * (1 - appear))}
            strokeLinecap="round"
            opacity={Math.min(1, appear * 2.5)}
          />
        );
      })
    : null;

  const barAng = (90 * tip * Math.PI) / 180;
  const barLen = L + (ruleW - L) * tip;
  const barY = cy + (ruleY - cy) * tip;
  const barT = sw + (ruleT - sw) * Math.min(1, tip);
  const bdx = Math.sin(barAng) * (barLen / 2);
  const bdy = -Math.cos(barAng) * (barLen / 2);

  const fieldL = gx0 - groupW / 2;
  const fieldR = gx0 + (nCols - 1) * pitchX + groupW / 2;
  const drift = interpolate(t, [0, TIP + 40], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const stops = (
    <>
      <stop offset="0" stopColor={p.stops[0]} />
      <stop offset="0.34" stopColor={p.stops[1]} />
      <stop offset="0.66" stopColor={p.stops[2]} />
      <stop offset="0.86" stopColor={p.stops[3]} />
      <stop offset="1" stopColor={accent} />
    </>
  );
  const chars = text.split("");
  const label1 = interpolate(t, [NUM_IN + 12, NUM_IN + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transform: `scale(${push})`, transformOrigin: "50% 50%" }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1={fieldL}
              y1={ry0 - pitchY}
              x2={fieldR}
              y2={ry0 + nRows * pitchY}
            >
              {stops}
            </linearGradient>
            <linearGradient
              id={ruleGradId}
              gradientUnits="userSpaceOnUse"
              x1={cx - ruleW * (0.5 + 0.1 * drift)}
              y1={barY}
              x2={cx + ruleW * (0.5 - 0.1 * drift)}
              y2={barY}
            >
              {stops}
            </linearGradient>
          </defs>
          <g transform={camT}>{lines}</g>
          {showStrokes ? null : (
            <line
              x1={cx - bdx}
              y1={barY - bdy}
              x2={cx + bdx}
              y2={barY + bdy}
              stroke={`url(#${ruleGradId})`}
              strokeWidth={barT}
              strokeLinecap="round"
            />
          )}
        </svg>

        {t >= NUM_IN - 1 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: ruleY - 22 * u - numSize * 1.12,
              height: numSize * 1.12,
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
            }}
          >
            {chars.map((ch, i) => {
              const k = interpolate(
                t,
                [NUM_IN + i * 2, NUM_IN + i * 2 + 18],
                [0, 1],
                { ...CLAMP, easing: EASE_OUT },
              );
              return (
                <span
                  key={`${ch}${i.toString()}`}
                  style={{
                    display: "inline-block",
                    fontFamily: fraunces,
                    fontWeight: 300,
                    fontSize: numSize,
                    lineHeight: 1.12,
                    letterSpacing: "-0.035em",
                    fontVariantNumeric: "lining-nums tabular-nums",
                    color: p.fg,
                    transform: `translateY(${(1 - k) * 105}%)`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        ) : null}

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: ruleY + 26 * u,
            textAlign: "center",
            fontFamily: fraunces,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 30 * u,
            letterSpacing: "-0.01em",
            color: p.muted,
            whiteSpace: "nowrap",
            opacity: label1,
            transform: `translateY(${(1 - label1) * 8 * u}px)`,
          }}
        >
          {label}
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.55,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
