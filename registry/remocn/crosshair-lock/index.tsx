"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadDisplay } from "@remotion/google-fonts/SpaceGrotesk";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface CrosshairLockProps {
  x?: number;
  y?: number;
  label?: string;
  value?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

const V_AT = 14;
const H_AT = 18;
const SLIDE = 26;
const LOCK = H_AT + SLIDE;
const LEAD_AT = LOCK + 8;
const POP_AT = LEAD_AT + 10;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.55)",
    axis: "rgba(255,255,255,0.2)",
    dotRGB: "#FFFFFF",
    dotA: 0.26,
    // gradients.sh "mesh": blooms out of the locked peak
    mesh: ["#ECDCF2", "#8796EE", "#2E45B7"],
    grain: 0.055,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.55)",
    axis: "rgba(18,18,20,0.2)",
    dotRGB: "#121214",
    dotA: 0.22,
    // gradients.sh "mesh", deep end first on off-white
    mesh: ["#0E1645", "#2E45B7", "#8796EE"],
    grain: 0.04,
  },
} as const;

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function parseValue(v: string) {
  const m = v.match(/([\d.,]+)\s*([kKmM])?/);
  if (!m) return null;
  const n = Number.parseFloat(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const mult = m[2] ? (m[2].toLowerCase() === "k" ? 1e3 : 1e6) : 1;
  return n * mult;
}

function splitValue(v: string) {
  const m = v.match(/^(\s*[^\d]*[\d.,]+\s*[kKmMbB%×x]?)(.*)$/);
  if (!m) return { head: v, tail: "" };
  return { head: m[1], tail: m[2] };
}

function clock(f: number) {
  const mins = Math.round((9 * 60 + f * 12 * 60) / 5) * 5;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
          seed={41}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function CrosshairLock({
  x = 0.7,
  y = 0.94,
  label = "Peak",
  value = "2.4k/min",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: CrosshairLockProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const p = THEMES[theme];

  const left = 0.14 * W;
  const right = 0.9 * W;
  const top = 0.42 * H;
  const bottom = 0.84 * H;
  const step = 16 * u;
  const cols = Math.floor((right - left) / step);
  const rows = Math.floor((bottom - top) / step);
  const fx = Math.min(0.97, Math.max(0.03, x));
  const fy = Math.min(1, Math.max(0.15, y));
  const peakCol = Math.round(fx * cols);

  const heights = Array.from({ length: cols + 1 }, (_, c) => {
    const f = c / cols;
    const base =
      0.34 +
      0.12 * Math.sin(f * 7.3 + 0.8) +
      0.08 * Math.sin(f * 17.1 + 2.1) +
      0.07 * (hash(c) - 0.5);
    const g = Math.exp(-(((f - fx) / 0.075) ** 2));
    const v = fy * (Math.min(0.66, Math.max(0.12, base)) * (1 - g) + g);
    return c === peakCol ? rows : Math.min(rows - 1, Math.round(v * rows));
  });
  const peakRows = Math.round(fy * rows);
  heights[peakCol] = peakRows;
  for (let c = 0; c <= cols; c++) {
    if (c !== peakCol) heights[c] = Math.min(heights[c], peakRows - 1);
  }

  const px = left + peakCol * step;
  const py = bottom - (peakRows - 1) * step;

  const vk = EASE_IO(interpolate(t, [V_AT, V_AT + SLIDE], [0, 1], CLAMP));
  const hk = EASE_IO(interpolate(t, [H_AT, H_AT + SLIDE], [0, 1], CLAMP));
  const fromLeft = fx > 0.5;
  const vStart = fromLeft ? left - 0.07 * W : right + 0.07 * W;
  const vx = vStart + (px - vStart) * vk;
  const hStart = bottom + 0.1 * H;
  const hy = hStart + (py - hStart) * hk;
  const vOn = interpolate(t, [V_AT, V_AT + 6], [0, 1], CLAMP);
  const hOn = interpolate(t, [H_AT, H_AT + 6], [0, 1], CLAMP);

  const ring = interpolate(t, [LOCK, LOCK + 20], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const lock = spring({
    frame: t - LOCK,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.6 },
  });
  const locked = t >= LOCK;

  const num = parseValue(value);
  const yFrac = Math.max(0, (bottom - hy) / (bottom - py));
  const yRead =
    num === null
      ? (fy * yFrac).toFixed(2)
      : Math.round(num * yFrac).toLocaleString("en-US");
  const xFrac = (vx - left) / (right - left);
  const xRead = clock(Math.min(1, Math.max(0, xFrac)));

  const dir = fx > 0.55 ? -1 : 1;
  const valueSize = 112 * u;
  const labelY = top - 96 * u;
  const diag = py - labelY;
  const run = 64 * u;
  const elbowX = px + dir * diag;
  const endX = elbowX + dir * run;
  const leadLen = Math.SQRT2 * diag + run;
  const lead = EASE_IO(interpolate(t, [LEAD_AT, LEAD_AT + 14], [0, 1], CLAMP));
  const pop = spring({
    frame: t - POP_AT,
    fps,
    config: { damping: 16, stiffness: 200, mass: 0.6 },
  });
  const popOp = interpolate(t, [POP_AT, POP_AT + 8], [0, 1], CLAMP);
  const { head, tail } = splitValue(value);
  const gradId = `mesh${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const bloom = interpolate(t, [LOCK - 2, LOCK + 34], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const bloomR = Math.max(1, (0.06 + 0.34 * bloom) * W);

  const dots: React.ReactNode[] = [];
  for (let c = 0; c <= cols; c++) {
    const f = c / cols;
    const rise = EASE_OUT(interpolate(t, [f * 14, f * 14 + 12], [0, 1], CLAMP));
    const isPeak = c === peakCol;
    for (let r = 0; r < heights[c]; r++) {
      const top1 = isPeak && r === heights[c] - 1;
      if (top1 && locked) continue;
      dots.push(
        <circle
          key={`${c}-${r}`}
          cx={left + c * step}
          cy={bottom - r * step - (1 - rise) * 10 * u}
          r={2.2 * u}
          fill={`url(#${gradId})`}
          opacity={rise}
        />,
      );
    }
  }

  const hair = Math.max(1, 1.25 * u);
  const readout: React.CSSProperties = {
    position: "absolute",
    fontFamily: mono,
    fontWeight: 500,
    fontSize: 16 * u,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
  };

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            cx={px}
            cy={py}
            r={bloomR}
            gradientTransform={`translate(${px} ${py}) scale(1.35 1) translate(${-px} ${-py})`}
          >
            <stop offset="0" stopColor={p.mesh[0]} stopOpacity={bloom} />
            <stop
              offset="0.28"
              stopColor={p.mesh[1]}
              stopOpacity={0.95 * bloom}
            />
            <stop offset="0.62" stopColor={p.mesh[2]} stopOpacity={0.6} />
            <stop offset="1" stopColor={p.dotRGB} stopOpacity={p.dotA} />
          </radialGradient>
        </defs>
        <line
          x1={left - 8 * u}
          x2={right + 8 * u}
          y1={bottom + 14 * u}
          y2={bottom + 14 * u}
          stroke={p.axis}
          strokeWidth={hair}
          opacity={interpolate(t, [0, 10], [0, 1], CLAMP)}
        />
        {dots}
        <line
          x1={vx}
          x2={vx}
          y1={top - 24 * u}
          y2={bottom + 14 * u}
          stroke={p.hair}
          strokeWidth={hair}
          opacity={vOn}
        />
        <line
          x1={left - 8 * u}
          x2={right + 8 * u}
          y1={hy}
          y2={hy}
          stroke={p.hair}
          strokeWidth={hair}
          opacity={hOn}
        />
        <line
          x1={vx}
          x2={vx}
          y1={bottom + 14 * u}
          y2={bottom + 22 * u}
          stroke={p.fg}
          strokeWidth={hair * 1.6}
          opacity={vOn}
        />
        <line
          x1={left - 16 * u}
          x2={left - 8 * u}
          y1={hy}
          y2={hy}
          stroke={p.fg}
          strokeWidth={hair * 1.6}
          opacity={hOn}
        />
        {locked ? (
          <>
            <circle
              cx={px}
              cy={py}
              r={(10 + 34 * ring) * u}
              fill="none"
              stroke={accent}
              strokeWidth={2 * u}
              opacity={0.9 * (1 - ring)}
            />
            <circle
              cx={px}
              cy={py}
              r={(14 - 3 * lock) * u}
              fill={p.bg}
              stroke={accent}
              strokeWidth={2 * u}
              opacity={Math.min(1, lock * 1.4)}
            />
            <circle cx={px} cy={py} r={(3 + 2 * lock) * u} fill={accent} />
          </>
        ) : null}
        {lead > 0 ? (
          <path
            d={`M ${px + dir * 14 * u * Math.SQRT1_2} ${py - 14 * u * Math.SQRT1_2} L ${elbowX} ${labelY} L ${endX} ${labelY}`}
            fill="none"
            stroke={accent}
            strokeWidth={1.75 * u}
            strokeDasharray={leadLen}
            strokeDashoffset={leadLen * (1 - lead)}
          />
        ) : null}
        {lead > 0.98 ? (
          <circle cx={endX} cy={labelY} r={3 * u} fill={accent} />
        ) : null}
      </svg>

      <div
        style={{
          ...readout,
          left: vx,
          top: bottom + 30 * u,
          transform: "translateX(-50%)",
          color: locked ? p.fg : p.muted,
          opacity: vOn,
        }}
      >
        {xRead}
      </div>
      <div
        style={{
          ...readout,
          right: W - left + 24 * u,
          top: hy,
          transform: "translateY(-50%)",
          color: locked ? p.fg : p.muted,
          opacity: hOn,
        }}
      >
        {yRead}
      </div>

      <div
        style={{
          position: "absolute",
          ...(dir < 0
            ? { right: W - (endX - 18 * u) }
            : { left: endX + 18 * u }),
          top: labelY - valueSize * 0.5,
          height: valueSize,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: dir < 0 ? "flex-end" : "flex-start",
          opacity: popOp,
          transform: `translateX(${dir * (1 - pop) * 14 * u}px) scale(${0.96 + 0.04 * pop})`,
          transformOrigin: dir < 0 ? "100% 50%" : "0% 50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            marginBottom: 2 * u,
            display: "flex",
            alignItems: "center",
            gap: 8 * u,
            fontFamily: mono,
            fontWeight: 500,
            fontSize: 13 * u,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: p.muted,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: 6 * u,
              height: 6 * u,
              borderRadius: "50%",
              background: accent,
            }}
          />
          {label}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontFamily: display,
            fontWeight: 500,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontSize: valueSize,
              letterSpacing: "-0.04em",
              color: p.fg,
            }}
          >
            {head}
          </span>
          {tail ? (
            <span
              style={{
                fontSize: valueSize * 0.36,
                fontWeight: 400,
                letterSpacing: "-0.01em",
                marginLeft: 0.08 * valueSize,
                color: p.muted,
              }}
            >
              {tail}
            </span>
          ) : null}
        </div>
      </div>

      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
