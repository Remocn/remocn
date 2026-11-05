"use client";

import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const sora = loadSora("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});

export interface PlusOpenProps {
  value?: string;
  label?: string;
  next?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    ink: "#F4F3F0",
    muted: "#8E8D94",
    nextInk: "#F7F6F2",
    fieldBg: "#03050b",
    blobs: (a: string) => ["#a0f0c8", "#3fb5a3", a, "#b25c9c"],
    blobMix: 88,
    band: "#a0f0c8",
    boost: 1.1,
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    ink: "#111113",
    muted: "#6E6C67",
    nextInk: "#111113",
    fieldBg: "#f4f3f1",
    blobs: (a: string) => ["#7a3cff", "#ff4fb8", a, "#8f6bff"],
    blobMix: 70,
    band: "#ff4fb8",
    boost: 0,
    grain: 0.035,
  },
} as const;

const TRACK = -0.035;
const FONT_PX = 400;

const RISE_AT = 0;
const RISE_LEN = 18;
const RISE_GAP = 3;
const PLUS_AT = 12;
const LABEL_AT = 16;
const ARMS_AT = 56;
const ARMS_LEN = 14;
const OPEN_AT = 70;
const OPEN_LEN = 28;
const NEXT_AT = 82;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OPEN = Easing.bezier(0.7, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  x: number[];
  width: number;
  cap: number;
  base: number;
  label: number;
}

function measure(chars: string[], label: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("plus-open: no 2d context");
  ctx.font = `400 ${FONT_PX}px "${sora.fontFamily}"`;
  const x: number[] = [];
  let prefix = "";
  for (let i = 0; i < chars.length; i++) {
    x.push(ctx.measureText(prefix).width / FONT_PX + TRACK * i);
    prefix += chars[i];
  }
  const width =
    ctx.measureText(prefix).width / FONT_PX +
    TRACK * Math.max(0, chars.length - 1);
  const zm = ctx.measureText("0");
  const asc = zm.fontBoundingBoxAscent / FONT_PX;
  const desc = zm.fontBoundingBoxDescent / FONT_PX;
  ctx.font = `300 ${FONT_PX}px "${sora.fontFamily}"`;
  return {
    x,
    width,
    cap: zm.actualBoundingBoxAscent / FONT_PX,
    base: (1 - (asc + desc)) / 2 + asc,
    label: label ? ctx.measureText(label).width / FONT_PX : 0,
  };
}

function useMetrics(chars: string[], label: string) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("plus-open: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      sora.waitUntilDone(),
      document.fonts.load(`400 100px "${sora.fontFamily}"`),
      document.fonts.load(`300 100px "${sora.fontFamily}"`),
      document.fonts.load(`500 100px "${sora.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(chars, label));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [chars, label, handle]);
  return metrics;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `po${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
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
          seed={9}
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function crossPolygon(
  cx: number,
  cy: number,
  h: number,
  arms: { l: number; r: number; u: number; d: number },
  angle: number,
) {
  const { l, r, u, d } = arms;
  const pts: [number, number][] = [
    [-h, -u],
    [h, -u],
    [h, -h],
    [r, -h],
    [r, h],
    [h, h],
    [h, d],
    [-h, d],
    [-h, h],
    [-l, h],
    [-l, -h],
    [-h, -h],
  ];
  const cs = Math.cos(angle);
  const sn = Math.sin(angle);
  return `polygon(${pts
    .map(
      ([x, y]) =>
        `${(cx + x * cs - y * sn).toFixed(2)}px ${(cy + x * sn + y * cs).toFixed(2)}px`,
    )
    .join(", ")})`;
}

export function PlusOpen({
  value = "150",
  label = "updates in this release",
  next = "Here’s everything new.",
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: PlusOpenProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;

  const chars = useMemo(() => Array.from(value), [value]);
  const m = useMetrics(chars, label);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const plusSpan = m.cap * 0.74;
  const stroke = 0.082;
  const plusGap = 0.07;
  const lockW = m.width + plusGap + plusSpan;
  const F = Math.min(H * 0.4, (W * 0.74) / lockW);

  const labelSize = label
    ? Math.min(Math.max(F * 0.13, H * 0.04), H * 0.052, (W * 0.8) / m.label)
    : 0;
  const gap = label ? Math.max(F * 0.26, H * 0.05) : 0;
  const blockH = m.cap * F + gap + labelSize;
  const baseY = (H - blockH) / 2 + m.cap * F;
  const left = (W - lockW * F) / 2;

  const cx = left + (m.width + plusGap + plusSpan / 2) * F;
  const cy = baseY - (m.cap * F) / 2;
  const h0 = (stroke * F) / 2;
  const arm0 = (plusSpan * F) / 2;

  const land = spring({
    frame: t - PLUS_AT,
    fps,
    config: { damping: 15, stiffness: 120, mass: 0.9 },
  });
  const plusScale = 0.55 + 0.45 * land;
  const plusAngle = (-Math.PI / 2) * (1 - land);
  const plusOn = interpolate(t, [PLUS_AT, PLUS_AT + 5], [0, 1], CLAMP);

  const armH = interpolate(t, [ARMS_AT, ARMS_AT + ARMS_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const armV = interpolate(t, [ARMS_AT + 3, ARMS_AT + 3 + ARMS_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const arms = {
    l: arm0 + (cx + 4 - arm0) * armH,
    r: arm0 + (W - cx + 4 - arm0) * armH,
    u: arm0 + (cy + 4 - arm0) * armV,
    d: arm0 + (H - cy + 4 - arm0) * armV,
  };
  const open = interpolate(t, [OPEN_AT, OPEN_AT + OPEN_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_OPEN,
  });
  const spread = open * Math.max(cx, W - cx, cy, H - cy) * 1.04;
  const split = t >= OPEN_AT;

  const drift = t / 30;
  const blobs = c.blobs(accent);
  const field = [
    ...blobs.map((col, i) => {
      const bx =
        15 + (70 * i) / (blobs.length - 1) + Math.sin(drift * 0.6 + i) * 5;
      const by = 34 + Math.cos(drift * 0.5 + i * 1.7) * 9 + (i % 2) * 22;
      return `radial-gradient(38% 62% at ${bx.toFixed(2)}% ${by.toFixed(2)}%, color-mix(in oklab, ${col} ${c.blobMix}%, transparent) 0%, transparent 70%)`;
    }),
    `linear-gradient(180deg, transparent 30%, color-mix(in oklab, ${c.band} 34%, transparent) 62%, transparent 92%)`,
    c.fieldBg,
  ].join(", ");

  const rise = (i: number) =>
    interpolate(
      t,
      [RISE_AT + i * RISE_GAP, RISE_AT + i * RISE_GAP + RISE_LEN],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
  const maskTop = baseY - m.cap * F - F * 0.1;
  const maskH = m.cap * F + F * 0.32;
  const labelP = interpolate(t, [LABEL_AT, LABEL_AT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const oldScene = (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: bg,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: maskTop,
          height: maskH,
          overflow: "hidden",
        }}
      >
        {chars.map((ch, i) => (
          <div
            key={`${ch}-${i}`}
            style={{
              position: "absolute",
              left: left + m.x[i] * F,
              top: baseY - maskTop - m.base * F + (1 - rise(i)) * maskH * 1.05,
              fontFamily: sora.fontFamily,
              fontWeight: 400,
              fontSize: F,
              lineHeight: `${F}px`,
              color: c.ink,
              whiteSpace: "pre",
              fontFeatureSettings: '"lnum" 1',
            }}
          >
            {ch}
          </div>
        ))}
      </div>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: baseY + gap - labelSize * 0.25,
            height: labelSize * 1.5,
            overflow: "hidden",
            textAlign: "center",
            fontFamily: sora.fontFamily,
            fontWeight: 300,
            fontSize: labelSize,
            lineHeight: `${labelSize * 1.3}px`,
            letterSpacing: "-0.005em",
            color: c.muted,
            whiteSpace: "pre",
          }}
        >
          <div
            style={{
              transform: `translateY(${((1 - labelP) * labelSize * 1.4).toFixed(2)}px)`,
            }}
          >
            {label}
          </div>
        </div>
      ) : null}
    </>
  );

  const quarters = [
    { key: "tl", sx: -1, sy: -1 },
    { key: "tr", sx: 1, sy: -1 },
    { key: "bl", sx: -1, sy: 1 },
    { key: "br", sx: 1, sy: 1 },
  ].map(({ key, sx, sy }) => {
    const top = sy < 0 ? 0 : cy + h0;
    const bottom = sy < 0 ? H - (cy - h0) : 0;
    const l = sx < 0 ? 0 : cx + h0;
    const r = sx < 0 ? W - (cx - h0) : 0;
    return (
      <div
        key={key}
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `inset(${top.toFixed(2)}px ${r.toFixed(2)}px ${bottom.toFixed(2)}px ${l.toFixed(2)}px)`,
          transform: `translate(${(sx * spread).toFixed(2)}px, ${(sy * spread).toFixed(2)}px)`,
        }}
      >
        {oldScene}
      </div>
    );
  });

  const nextWords = next.split(" ");
  const nextSize = Math.min(H * 0.13, W * 0.1);

  const nextScene = (
    <>
      <div style={{ position: "absolute", inset: 0, background: field }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `0 ${W * 0.08}px`,
        }}
      >
        <div
          style={{
            fontFamily: sora.fontFamily,
            fontWeight: 400,
            fontSize: nextSize,
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
            color: c.nextInk,
            textAlign: "center",
            textWrap: "balance",
            maxWidth: W * 0.84,
          }}
        >
          {nextWords.map((w, k) => {
            const p = interpolate(
              t,
              [NEXT_AT + k * 3, NEXT_AT + k * 3 + 18],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
            return (
              <span
                key={`${w}-${k}`}
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  verticalAlign: "top",
                  paddingBottom: "0.08em",
                  marginRight: k < nextWords.length - 1 ? "0.24em" : 0,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(${((1 - p) * 110).toFixed(1)}%)`,
                  }}
                >
                  {w}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </>
  );

  const lit = 1 - interpolate(t, [OPEN_AT - 2, OPEN_AT + 14], [0, 1], CLAMP);
  const boost =
    lit > 0
      ? `brightness(${(1 + c.boost * lit).toFixed(3)}) saturate(${(1 + 0.25 * lit).toFixed(3)})`
      : "none";

  const crossClip = crossPolygon(
    cx,
    cy,
    h0 * plusScale,
    {
      l: arms.l * (armH > 0 ? 1 : plusScale),
      r: arms.r * (armH > 0 ? 1 : plusScale),
      u: arms.u * (armV > 0 ? 1 : plusScale),
      d: arms.d * (armV > 0 ? 1 : plusScale),
    },
    plusAngle,
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {split ? (
        <>
          <div style={{ position: "absolute", inset: 0, filter: boost }}>
            {nextScene}
          </div>
          {quarters}
        </>
      ) : (
        <>
          <div style={{ position: "absolute", inset: 0 }}>{oldScene}</div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: crossClip,
              opacity: plusOn,
              filter: boost,
            }}
          >
            {nextScene}
          </div>
        </>
      )}
      {bg === "transparent" ? null : <Grain opacity={c.grain} />}
    </AbsoluteFill>
  );
}
