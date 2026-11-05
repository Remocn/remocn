"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

// gradients.sh "limb" palette: #e9ecff, #8a8bff, #4b2bd6, #160c3a.
const LIMB = {
  dark: ["#e9ecff", "#8a8bff", "#4b2bd6"],
  light: ["#8a8bff", "#4b2bd6", "#2a1a7a"],
} as const;

export interface GaltonStackProps {
  count?: number;
  marker?: number;
  label?: string;
  markerLabel?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const ROWS = 14;
const BINS = ROWS + 1;
const COLS = 4;
const SPAWN0 = 10;
const SPAWN_WIN = 50;
const DROP = 6;
const ROW_T = 1.3;

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
    axis: "rgba(255,255,255,0.2)",
    peg: "rgba(255,255,255,0.16)",
    marker: "rgba(243,242,239,0.7)",
    dot: "#D9D7D2",
    tail: "#4A4950",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    axis: "rgba(18,18,20,0.2)",
    peg: "rgba(18,18,20,0.18)",
    marker: "rgba(18,18,20,0.7)",
    dot: "#3A3936",
    tail: "#C4C2BC",
    grain: 0.045,
  },
} as const;

function hash(a: number, b: number) {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function choose(n: number, k: number) {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

interface Drop {
  bin: number;
  slot: number;
  path: number[];
  spawn: number;
}

function buildDrops(count: number): Drop[] {
  const denom = 2 ** ROWS;
  const target = Array.from({ length: BINS }, (_, b) =>
    Math.round((count * choose(ROWS, b)) / denom),
  );
  const diff = count - target.reduce((s, x) => s + x, 0);
  target[ROWS / 2] += diff;
  const bins: number[] = [];
  target.forEach((n, b) => {
    for (let i = 0; i < n; i++) bins.push(b);
  });
  for (let i = bins.length - 1; i > 0; i--) {
    const j = Math.floor(hash(i, 7) * (i + 1));
    [bins[i], bins[j]] = [bins[j], bins[i]];
  }
  const filled = new Array(BINS).fill(0);
  return bins.map((bin, i) => {
    const moves = Array.from({ length: ROWS }, (_, r): number =>
      r < bin ? 1 : 0,
    );
    for (let r = moves.length - 1; r > 0; r--) {
      const j = Math.floor(hash(i * 31 + r, 13) * (r + 1));
      [moves[r], moves[j]] = [moves[j], moves[r]];
    }
    const path = [0];
    for (const m of moves) path.push(path[path.length - 1] + (m ? 0.5 : -0.5));
    return {
      bin,
      slot: filled[bin]++,
      path,
      spawn: SPAWN0 + (i * SPAWN_WIN) / Math.max(1, bins.length - 1),
    };
  });
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
          seed={17}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function GaltonStack({
  count = 260,
  marker = 0.733,
  label = "95% of renders under 2s",
  markerLabel = "2s",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: GaltonStackProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const n = Math.max(20, Math.min(600, Math.round(count)));
  const drops = useMemo(() => buildDrops(n), [n]);

  const binP = 52 * u;
  const d = 11 * u;
  const r = 4.6 * u;
  const pegR = 2.2 * u;
  const cx = width / 2;
  const row0 = height * 0.17;
  const emitY = row0 - 34 * u;
  const rowGap = 17 * u;
  const baseY = height * 0.84;
  const exitY = row0 + ROWS * rowGap;
  const lift = pegR + r + 1 * u;
  const binX = (b: number) => cx + (b - ROWS / 2) * binP;

  const maxSlots = Math.max(
    ...Array.from({ length: BINS }, (_, b) =>
      drops.reduce((s, x) => s + (x.bin === b ? 1 : 0), 0),
    ),
  );
  const stackTop = baseY - Math.ceil(maxSlots / COLS) * d;

  const slotPos = (dr: Drop) => ({
    x: binX(dr.bin) + ((dr.slot % COLS) - (COLS - 1) / 2) * d,
    y: baseY - (Math.floor(dr.slot / COLS) + 0.5) * d - 1 * u,
  });
  const fallDur = (y: number) =>
    5 + Math.sqrt(Math.max(0, y - exitY) / u) * 0.5;
  const flight = (dr: Drop) => DROP + ROWS * ROW_T + fallDur(slotPos(dr).y);
  const landEnd = Math.max(...drops.map((dr) => dr.spawn + flight(dr)));
  const MARK = landEnd + 2;

  const boundary = Math.max(1, Math.min(BINS - 1, Math.round(marker * BINS)));
  const markerX = cx + (boundary - BINS / 2) * binP;

  const m = /^(\S*\d\S*)\s+(.+)$/.exec(label.trim());
  const hero = m ? m[1] : label;
  const sub = m ? m[2] : "";
  const heroSize = 132 * u;
  const subSize = 24 * u;
  const heroW = hero.length * 0.56 * heroSize;
  const subW = sub.length * 0.5 * subSize;
  const blockW = Math.max(heroW, subW);
  const gapX = 22 * u;
  const leftSide = markerX - gapX - blockW >= width * 0.08;
  const labelBottom = stackTop - 40 * u;
  const blockH = heroSize * 0.9 + 12 * u + subSize * 1.2;
  const labelTop = labelBottom - blockH;
  const bottomEdge = baseY + 14 * u + 20 * u;
  const finalCenter = (labelTop + bottomEdge) / 2;
  const shift = height / 2 - finalCenter;

  const fieldIn = interpolate(t, [0, 14], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const fieldOut = interpolate(t, [MARK - 8, MARK + 8], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const field = fieldIn * (1 - fieldOut);
  const cam = interpolate(t, [MARK - 6, MARK + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const camScale = 1 + 0.05 * cam;
  const lineIn = interpolate(t, [MARK + 2, MARK + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const land = interpolate(t, [MARK + 14, MARK + 34], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const subIn = interpolate(t, [MARK + 22, MARK + 40], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const tickIn = interpolate(t, [MARK + 10, MARK + 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const sw = Math.max(1, u);
  const axisL = binX(0) - binP / 2;
  const axisR = binX(ROWS) + binP / 2;
  const axisIn = interpolate(t, [2, 22], [0, 1], { ...CLAMP, easing: EASE_IO });

  const pegs: { x: number; y: number }[] = [];
  for (let j = 0; j < ROWS; j++) {
    for (let k = 0; k <= j; k++) {
      pegs.push({ x: cx + (k - j / 2) * binP, y: row0 + j * rowGap });
    }
  }

  const gid = `limb${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const stops = LIMB[theme];
  // The gradient drifts a few percent sideways across the shot, never more.
  const drift = interpolate(t, [0, 180], [-0.04, 0.04], CLAMP);
  const heroFill = `linear-gradient(${172 + drift * 60}deg, ${stops[0]} 8%, ${stops[1]} 52%, ${stops[2]} 100%)`;

  const dotsSvg = drops.map((dr, i) => {
    const lt = t - dr.spawn;
    if (lt < 0) return null;
    const end = slotPos(dr);
    let x = cx;
    let y = emitY;
    let landed = false;
    if (lt < DROP) {
      const k = (lt / DROP) ** 2;
      y = emitY + (row0 - lift - emitY) * k;
    } else if (lt < DROP + ROWS * ROW_T) {
      const s = (lt - DROP) / ROW_T;
      const j = Math.min(ROWS - 1, Math.floor(s));
      const tau = s - j;
      const ex = tau * tau * (3 - 2 * tau);
      x = cx + (dr.path[j] + (dr.path[j + 1] - dr.path[j]) * ex) * binP;
      y =
        row0 -
        lift +
        (j + tau) * rowGap -
        Math.sin(Math.PI * tau) * 3.5 * u * (1 - j / ROWS);
    } else {
      const fd = fallDur(end.y);
      const k = Math.min(1, (lt - DROP - ROWS * ROW_T) / fd);
      const sx = cx + dr.path[ROWS] * binP;
      const sy = row0 - lift + ROWS * rowGap;
      x = sx + (end.x - sx) * Math.min(1, k * 1.6);
      y = sy + (end.y - sy) * k * k;
      landed = k >= 1;
    }
    const a = interpolate(
      t,
      [MARK + 6 + dr.bin * 1.8, MARK + 11 + dr.bin * 1.8],
      [0, 1],
      { ...CLAMP, easing: EASE_IO },
    );
    const hot = landed && dr.bin < boundary;
    const fill =
      landed && !hot ? interpolateColors(a, [0, 1], [p.dot, p.tail]) : p.dot;
    return (
      <g key={`d${i}`} opacity={Math.min(1, lt / 2)}>
        <circle cx={x} cy={y} r={r} fill={fill} />
        {hot && a > 0 ? (
          <circle cx={x} cy={y} r={r} fill={`url(#${gid})`} opacity={a} />
        ) : null}
      </g>
    );
  });

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translateY(${shift * cam}px) scale(${camScale})`,
          transformOrigin: `50% ${finalCenter}px`,
        }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={gid}
              gradientUnits="userSpaceOnUse"
              x1={cx + drift * 0.25 * width}
              y1={stackTop - 6 * u}
              x2={cx - drift * 0.25 * width}
              y2={baseY}
            >
              <stop offset="0" stopColor={stops[0]} />
              <stop offset="0.45" stopColor={stops[1]} />
              <stop offset="1" stopColor={stops[2]} />
            </linearGradient>
          </defs>
          <g opacity={field}>
            <circle
              cx={cx}
              cy={emitY}
              r={7 * u}
              fill="none"
              stroke={accent}
              strokeWidth={sw * 1.2}
            />
            {pegs.map((pg) => (
              <circle
                key={`p${pg.x.toFixed(1)}-${pg.y.toFixed(1)}`}
                cx={pg.x}
                cy={pg.y}
                r={pegR}
                fill={p.peg}
              />
            ))}
          </g>
          <line
            x1={cx - ((axisR - axisL) / 2) * axisIn}
            x2={cx + ((axisR - axisL) / 2) * axisIn}
            y1={baseY + sw / 2}
            y2={baseY + sw / 2}
            stroke={p.axis}
            strokeWidth={sw}
          />
          {dotsSvg}
          {lineIn > 0 ? (
            <line
              x1={markerX}
              x2={markerX}
              y1={baseY + 8 * u}
              y2={baseY + 8 * u - (baseY + 8 * u - labelTop) * lineIn}
              stroke={p.marker}
              strokeWidth={sw * 1.5}
            />
          ) : null}
        </svg>

        <div
          style={{
            position: "absolute",
            left: markerX,
            top: baseY + 14 * u,
            transform: `translate(-50%, ${(1 - tickIn) * 6 * u}px)`,
            fontFamily: mono,
            fontWeight: 500,
            fontSize: 17 * u,
            letterSpacing: "-0.01em",
            color: p.fg,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            opacity: tickIn,
          }}
        >
          {markerLabel}
        </div>

        <div
          style={{
            position: "absolute",
            top: labelTop,
            ...(leftSide
              ? { right: width - markerX + gapX, alignItems: "flex-end" }
              : { left: markerX + gapX, alignItems: "flex-start" }),
            display: "flex",
            flexDirection: "column",
            gap: 12 * u,
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              fontFamily: sans,
              fontWeight: 400,
              fontSize: heroSize,
              lineHeight: 0.9,
              letterSpacing: "-0.05em",
              paddingRight: "0.04em",
              color: "transparent",
              backgroundImage: heroFill,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              fontVariantNumeric: "tabular-nums",
              opacity: land,
              filter: land < 0.99 ? `blur(${(1 - land) * 8 * u}px)` : undefined,
              transform: `translateY(${(1 - land) * 18 * u}px)`,
            }}
          >
            {hero}
          </div>
          {sub ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10 * u,
                fontFamily: sans,
                fontWeight: 400,
                fontSize: subSize,
                lineHeight: 1.2,
                letterSpacing: "-0.015em",
                color: p.muted,
                opacity: subIn,
                transform: `translateY(${(1 - subIn) * 8 * u}px)`,
              }}
            >
              <span
                style={{
                  width: 10 * u,
                  height: 10 * u,
                  borderRadius: "50%",
                  background: `linear-gradient(160deg, ${stops[0]}, ${stops[2]})`,
                }}
              />
              {sub}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 64%, ${p.bg} 100%)`,
          opacity: 0.5,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
