"use client";

import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadOnest } from "@remotion/google-fonts/Onest";
import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const onest = loadOnest("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const mono = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface ResClimbProps {
  value?: string;
  label?: string;
  eyebrow?: string;
  steps?: number[];
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#050608",
    ink: "#F2F1EE",
    muted: "#8C8B92",
    ramp: ["#f4f7ff", "#8fb4ff", "ACCENT", "#3b2fa8"],
    haze: 0.32,
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    ink: "#121214",
    muted: "#6E6C67",
    ramp: ["#1a1660", "ACCENT", "#5d7cff", "#8fb4ff"],
    haze: 0.16,
    grain: 0.035,
  },
} as const;

const TRACK = -0.04;
const SAMPLE = 400;
const BUILD = 12;
const FIRST_SNAP = 28;
const SNAP_GAPS = [10, 8, 6, 5];

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Level {
  cols: number;
  rows: number;
  cell: number;
  lit: number[];
}

interface Metrics {
  inkW: number;
  inkH: number;
  ox: number;
  oy: number;
  cap: number;
  levels: Level[];
  label: number;
  eyebrow: number;
}

function measure(
  value: string,
  steps: number[],
  label: string,
  eyebrow: string,
): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("res-climb: no 2d context");
  ctx.font = `500 ${SAMPLE}px "${onest.fontFamily}"`;
  ctx.letterSpacing = `${TRACK * SAMPLE}px`;
  const tm = ctx.measureText(value);
  const L = tm.actualBoundingBoxLeft;
  const R = tm.actualBoundingBoxRight;
  const A = tm.actualBoundingBoxAscent;
  const D = tm.actualBoundingBoxDescent;
  ctx.letterSpacing = "0px";
  const cap = ctx.measureText("H").actualBoundingBoxAscent;
  const inkW = Math.max(1, Math.ceil(L + R));
  const inkH = Math.max(1, Math.ceil(A + D));

  canvas.width = inkW;
  canvas.height = inkH;
  ctx.font = `500 ${SAMPLE}px "${onest.fontFamily}"`;
  ctx.letterSpacing = `${TRACK * SAMPLE}px`;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#000";
  ctx.clearRect(0, 0, inkW, inkH);
  ctx.fillText(value, L, A);
  const data = ctx.getImageData(0, 0, inkW, inkH).data;

  const levels = steps.map((rowsPerCap) => {
    const cell = cap / rowsPerCap;
    const cols = Math.ceil(inkW / cell);
    const rows = Math.ceil(inkH / cell);
    const lit: number[] = [];
    for (let r = 0; r < rows; r++) {
      const y0 = Math.floor(r * cell);
      const y1 = Math.min(inkH, Math.floor((r + 1) * cell));
      for (let c = 0; c < cols; c++) {
        const x0 = Math.floor(c * cell);
        const x1 = Math.min(inkW, Math.floor((c + 1) * cell));
        let sum = 0;
        let cnt = 0;
        const stride = cell > 12 ? 2 : 1;
        for (let y = y0; y < y1; y += stride)
          for (let x = x0; x < x1; x += stride) {
            sum += data[(y * inkW + x) * 4 + 3];
            cnt++;
          }
        if (cnt && sum / cnt / 255 >= 0.45) lit.push(c, r);
      }
    }
    return { cols, rows, cell: cell / SAMPLE, lit };
  });

  ctx.letterSpacing = "0px";
  ctx.font = `400 ${SAMPLE}px "${onest.fontFamily}"`;
  const lw = label ? ctx.measureText(label).width / SAMPLE : 0;
  ctx.font = `400 ${SAMPLE}px "${mono.fontFamily}"`;
  const ew = eyebrow ? ctx.measureText(eyebrow).width / SAMPLE : 0;

  return {
    inkW: inkW / SAMPLE,
    inkH: inkH / SAMPLE,
    ox: L / SAMPLE,
    oy: A / SAMPLE,
    cap: cap / SAMPLE,
    levels,
    label: lw,
    eyebrow: ew,
  };
}

function useMetrics(
  value: string,
  steps: number[],
  label: string,
  eyebrow: string,
) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("res-climb: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      onest.waitUntilDone(),
      mono.waitUntilDone(),
      document.fonts.load(`500 100px "${onest.fontFamily}"`),
      document.fonts.load(`400 100px "${onest.fontFamily}"`),
      document.fonts.load(`400 100px "${mono.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(value, steps, label, eyebrow));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [value, steps, label, eyebrow, handle]);
  return metrics;
}

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rampAt(ramp: [number, number, number][], u: number) {
  const x = Math.max(0, Math.min(1, u)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(x));
  const f = x - i;
  const a = ramp[i];
  const b = ramp[i + 1];
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`;
}

const DEFAULT_STEPS = [7, 14, 28];

export function ResClimb({
  value = "200+",
  label = "components, ready to drop in",
  eyebrow = "remocn registry",
  steps = DEFAULT_STEPS,
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: ResClimbProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const stage = background ?? c.bg;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const stepList = useMemo(
    () => (steps.length ? steps.slice(0, 4) : DEFAULT_STEPS),
    [steps],
  );
  const m = useMetrics(value, stepList, label, eyebrow);
  const ramp = useMemo(
    () =>
      c.ramp.map((col) => hexRgb(col === "ACCENT" ? accent : col)) as [
        number,
        number,
        number,
      ][],
    [c.ramp, accent],
  );

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const F = Math.min((H * 0.4) / m.cap, (W * (H > W ? 0.88 : 0.8)) / m.inkW);
  const inkW = m.inkW * F;
  const inkH = m.inkH * F;
  const labelGap = label ? Math.max(H * 0.05, F * 0.08) : 0;
  const labelSize = Math.min(
    H * 0.046,
    Math.max(H * 0.032, F * 0.06),
    (W * 0.86) / Math.max(0.1, m.label),
  );
  const eyebrowSize = Math.min(H * 0.026, (W * 0.8) / Math.max(0.1, m.eyebrow));
  const eyebrowGap = eyebrow ? Math.max(H * 0.045, F * 0.07) : 0;
  const blockH =
    (eyebrow ? eyebrowSize + eyebrowGap : 0) +
    inkH +
    (label ? labelGap + labelSize * 1.2 : 0);
  const top = (H - blockH) / 2 + (eyebrow ? eyebrowSize + eyebrowGap : 0);
  const left = (W - inkW) / 2;

  const snaps: number[] = [];
  for (let i = 0; i < m.levels.length; i++)
    snaps.push(i === 0 ? FIRST_SNAP : snaps[i - 1] + SNAP_GAPS[i - 1]);
  const crispAt = snaps[snaps.length - 1];
  const labelAt = crispAt + 3;
  let level = 0;
  for (let i = 0; i < m.levels.length - 1; i++)
    if (t >= snaps[i]) level = i + 1;
  const crisp = t >= crispAt;

  const push = interpolate(t, [0, crispAt + 30], [0.93, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const drift = Math.sin(t / 24) * 0.04;
  const gx0 = left + inkW * (0.0 + drift);
  const gy0 = top;
  const gx1 = left + inkW * (1.0 + drift);
  const gy1 = top + inkH;
  const gdx = gx1 - gx0;
  const gdy = gy1 - gy0;
  const glen = gdx * gdx + gdy * gdy;
  const uAt = (x: number, y: number) =>
    ((x - gx0) * gdx + (y - gy0) * gdy) / glen;

  const lv = m.levels[level];
  const cellPx = lv.cell * F;
  const cells: React.ReactNode[] = [];
  if (!crisp) {
    for (let k = 0; k < lv.lit.length; k += 2) {
      const col = lv.lit[k];
      const row = lv.lit[k + 1];
      if (level === 0) {
        const at = (col / Math.max(1, lv.cols - 1)) * BUILD - BUILD * 0.33;
        if (t < at) continue;
      }
      const x = left + col * cellPx;
      const y = top + row * cellPx;
      cells.push(
        <rect
          key={k}
          x={x - 0.35}
          y={y - 0.35}
          width={cellPx + 0.7}
          height={cellPx + 0.7}
          fill={rampAt(ramp, uAt(x + cellPx / 2, y + cellPx / 2))}
        />,
      );
    }
  }

  const labelP = interpolate(t, [labelAt, labelAt + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const eyebrowP = interpolate(t, [-6, 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const haze = interpolate(t, [crispAt - 4, crispAt + 24], [0.35, 1], CLAMP);

  const cx = W / 2;
  const cy = top + inkH / 2;
  const scale = `translate(${cx}px, ${cy}px) scale(${push}) translate(${-cx}px, ${-cy}px)`;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {background !== "transparent" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: c.haze * haze,
            background: `radial-gradient(55% 48% at 50% ${((cy / H) * 100).toFixed(2)}%, ${rampAt(ramp, 0.62)} 0%, transparent 70%)`,
          }}
        />
      ) : null}
      <div style={{ position: "absolute", inset: 0, transform: scale }}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`${uid}beam`}
              gradientUnits="userSpaceOnUse"
              x1={gx0}
              y1={gy0}
              x2={gx1}
              y2={gy1}
            >
              {ramp.map((col, i) => (
                <stop
                  key={`${col.join(",")}-${i}`}
                  offset={i / (ramp.length - 1)}
                  stopColor={`rgb(${col.join(",")})`}
                />
              ))}
            </linearGradient>
          </defs>
          {crisp ? (
            <text
              x={left + m.ox * F}
              y={top + m.oy * F}
              fill={`url(#${uid}beam)`}
              style={{
                fontFamily: onest.fontFamily,
                fontWeight: 500,
                fontSize: F,
                letterSpacing: `${TRACK}em`,
              }}
            >
              {value}
            </text>
          ) : (
            <g shapeRendering="crispEdges">{cells}</g>
          )}
        </svg>
        {eyebrow ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: top - eyebrowGap - eyebrowSize,
              textAlign: "center",
              fontFamily: mono.fontFamily,
              fontWeight: 400,
              fontSize: eyebrowSize,
              lineHeight: 1,
              letterSpacing: "0.02em",
              color: c.muted,
              opacity: eyebrowP,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        {label ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: top + inkH + labelGap,
              textAlign: "center",
              fontFamily: onest.fontFamily,
              fontWeight: 400,
              fontSize: labelSize,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              color: c.ink,
              opacity: labelP,
              transform: `translateY(${((1 - labelP) * labelSize * 0.6).toFixed(2)}px)`,
            }}
          >
            {label}
          </div>
        ) : null}
      </div>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}

function Grain({ opacity }: { opacity: number }) {
  const id = `rc${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={5}
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}
