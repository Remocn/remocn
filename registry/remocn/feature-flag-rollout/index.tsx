"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: monoFamily } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface FlagAuditEntry {
  actor: string;
  verb: string;
  target: string;
  time: string;
}

export interface GuardrailMetric {
  label: string;
  unit: "%" | "ms";
  base: number;
  jitter: number;
  threshold: number;
  decimals: number;
}

export interface FeatureFlagRolloutProps {
  flagName?: string;
  flagKey?: string;
  environment?: string;
  steps?: number[];
  totalUsers?: number;
  actor?: string;
  history?: FlagAuditEntry[];
  metrics?: GuardrailMetric[];
  workspace?: string;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_HISTORY: FlagAuditEntry[] = [
  {
    actor: "Leo Park",
    verb: "added 2 guardrails to",
    target: "new-checkout-flow",
    time: "2d",
  },
  {
    actor: "Priya Raman",
    verb: "created",
    target: "new-checkout-flow",
    time: "3d",
  },
];

const DEFAULT_METRICS: GuardrailMetric[] = [
  {
    label: "Error rate",
    unit: "%",
    base: 0.22,
    jitter: 0.035,
    threshold: 1,
    decimals: 2,
  },
  {
    label: "p95 latency",
    unit: "ms",
    base: 186,
    jitter: 13,
    threshold: 400,
    decimals: 0,
  },
];

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const enterEase = Easing.bezier(0.32, 0.72, 0, 1);
const exitEase = Easing.bezier(0.55, 0, 1, 0.45);
const camEase = Easing.bezier(0.87, 0, 0.13, 1);
const tween = (f: number, a: number, b: number, easing = enterEase) =>
  interpolate(f, [a, b], [0, 1], { ...CL, easing });
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(t: number, seed: number) {
  const i = Math.floor(t);
  const f = t - i;
  const a = hash(i + seed * 101.3);
  const b = hash(i + 1 + seed * 101.3);
  const u = (1 - Math.cos(f * Math.PI)) / 2;
  return a + (b - a) * u;
}

const controlAt = (m: GuardrailMetric, i: number, t: number) =>
  m.base +
  (noise(t / 30, i * 2 + 1) - 0.5) * m.jitter * 2.4 +
  (noise(t / 8, i * 2 + 3) - 0.5) * m.jitter * 0.6;
const treatAt = (m: GuardrailMetric, i: number, t: number) =>
  controlAt(m, i, t) -
  m.jitter * 0.3 +
  (noise(t / 16, i * 2 + 7) - 0.5) * m.jitter * 0.9;

const fmtInt = (n: number) =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const fmtVal = (m: GuardrailMetric, v: number) =>
  m.unit === "%" ? `${v.toFixed(m.decimals)}%` : `${v.toFixed(m.decimals)} ms`;

interface Pt {
  x: number;
  y: number;
}

function arcTo(a: Pt, b: Pt, p: number): Pt {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const bow = Math.sin(clamp(p, 0, 1) * Math.PI) * Math.min(50, d * 0.16);
  return {
    x: lerp(a.x, b.x, p) + (dy / d) * bow,
    y: lerp(a.y, b.y, p) - (dx / d) * bow,
  };
}

function Cursor({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <svg
      width={24}
      height={28}
      viewBox="0 0 20 24"
      style={{
        position: "absolute",
        left: x - 2,
        top: y - 2,
        transformOrigin: "2px 2px",
        transform: `scale(${scale})`,
        filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.3))",
        overflow: "visible",
      }}
    >
      <path
        d="M2 2 L2 19.5 L6.6 15.4 L9.8 22.4 L12.9 21 L9.8 14.2 L16 14.2 Z"
        fill="#FFFFFF"
        stroke="#16171A"
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Pal {
  win: string;
  line: string;
  track: string;
  text: string;
  muted: string;
  faint: string;
  green: string;
  knobOff: string;
  scrim: string;
  winShadow: string;
  stageText: string;
  stageMuted: string;
  dark: boolean;
}

function palette(theme: "light" | "dark"): Pal {
  return theme === "dark"
    ? {
        win: "#0E0F12",
        line: "rgba(255,255,255,0.07)",
        track: "rgba(255,255,255,0.1)",
        text: "#EEEEF0",
        muted: "rgba(238,238,240,0.6)",
        faint: "rgba(238,238,240,0.38)",
        green: "#62D893",
        knobOff: "rgba(255,255,255,0.16)",
        scrim: "rgba(3,4,10,0.2)",
        winShadow:
          "0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.05), 0 40px 90px -24px rgba(0,0,0,0.75), 0 10px 28px rgba(0,0,0,0.35)",
        stageText: "#F2F2F4",
        stageMuted: "rgba(242,242,244,0.62)",
        dark: true,
      }
    : {
        win: "#FCFCFB",
        line: "rgba(22,23,26,0.08)",
        track: "rgba(22,23,26,0.09)",
        text: "#16171A",
        muted: "rgba(22,23,26,0.6)",
        faint: "rgba(22,23,26,0.4)",
        green: "#18794E",
        knobOff: "rgba(22,23,26,0.16)",
        scrim: "rgba(238,240,246,0.15)",
        winShadow:
          "0 0 0 1px rgba(17,19,24,0.07), 0 1px 2px rgba(17,19,24,0.05), 0 30px 70px -20px rgba(28,38,92,0.28)",
        stageText: "#14151A",
        stageMuted: "rgba(20,21,26,0.6)",
        dark: false,
      };
}

const AVATAR_TONES = ["#B9806C", "#6F8DB8", "#8E7DB3", "#6E9C84", "#B59866"];
function Avatar({ name, size }: { name: string; size: number }) {
  const idx =
    [...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % AVATAR_TONES.length;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: AVATAR_TONES[idx],
        color: "rgba(255,255,255,0.95)",
        fontSize: size * 0.4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {name
        .split(" ")
        .map((s) => s[0])
        .join("")
        .slice(0, 2)}
    </div>
  );
}

const WINDOW_FRAMES = 200;

function GuardrailChart({
  metric,
  index,
  frame,
  markers,
  onAt,
  accent,
  pal,
  w,
  h,
}: {
  metric: GuardrailMetric;
  index: number;
  frame: number;
  markers: { t: number; label: string }[];
  onAt: number;
  accent: string;
  pal: Pal;
  w: number;
  h: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const lo = metric.base - metric.jitter * 2.6;
  const hi = metric.base + metric.jitter * 2.2;
  const t0 = frame - WINDOW_FRAMES;
  const xOf = (t: number) => ((t - t0) / WINDOW_FRAMES) * w;
  const yOf = (v: number) => h - 6 - ((v - lo) / (hi - lo)) * (h - 14);
  const N = 80;
  const ctl: string[] = [];
  const trt: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = t0 + (i / N) * WINDOW_FRAMES;
    ctl.push(
      `${xOf(t).toFixed(1)},${yOf(controlAt(metric, index, t)).toFixed(1)}`,
    );
    if (t >= onAt)
      trt.push(
        `${xOf(t).toFixed(1)},${yOf(treatAt(metric, index, t)).toFixed(1)}`,
      );
  }
  if (frame >= onAt && trt.length > 0) {
    trt.unshift(
      `${xOf(onAt).toFixed(1)},${yOf(treatAt(metric, index, onAt)).toFixed(1)}`,
    );
  }
  const area =
    trt.length > 1
      ? `M${trt[0]} L${trt.slice(1).join(" L")} L${xOf(frame).toFixed(1)},${h} L${xOf(onAt).toFixed(1)},${h} Z`
      : "";
  return (
    <svg
      width={w}
      height={h + 26}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`${uid}-a`} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            stopColor={pal.green}
            stopOpacity={pal.dark ? 0.2 : 0.14}
          />
          <stop offset="1" stopColor={pal.green} stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${uid}-c`}>
          <rect x={0} y={-12} width={w} height={h + 40} />
        </clipPath>
      </defs>
      <line x1={0} x2={w} y1={h} y2={h} stroke={pal.line} strokeWidth={1} />
      <line
        x1={0}
        x2={w}
        y1={h / 2}
        y2={h / 2}
        stroke={pal.line}
        strokeWidth={1}
        strokeDasharray="2 5"
      />
      <g clipPath={`url(#${uid}-c)`}>
        {markers.map((m) => {
          if (frame < m.t) return null;
          const x = xOf(m.t);
          const a = tween(frame, m.t, m.t + 8);
          return (
            <g key={m.t} opacity={a}>
              <line
                x1={x}
                x2={x}
                y1={lerp(h, 2, a)}
                y2={h}
                stroke={withAlpha(accent, 0.6)}
                strokeWidth={1}
                strokeDasharray="2 3"
              />
              <text
                x={x}
                y={h + 20}
                textAnchor="middle"
                fontSize={16}
                fontFamily={fontFamily}
                fill={accent}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {m.label}
              </text>
            </g>
          );
        })}
        <polyline
          points={ctl.join(" ")}
          fill="none"
          stroke={pal.faint}
          strokeWidth={1.25}
          strokeDasharray="3 3"
          strokeLinejoin="round"
        />
        {area ? <path d={area} fill={`url(#${uid}-a)`} /> : null}
        {trt.length > 1 ? (
          <polyline
            points={trt.join(" ")}
            fill="none"
            stroke={pal.green}
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {frame >= onAt ? (
          <circle
            cx={xOf(frame)}
            cy={yOf(treatAt(metric, index, frame))}
            r={3.5}
            fill={pal.green}
            stroke={pal.win}
            strokeWidth={1.5}
          />
        ) : null}
      </g>
    </svg>
  );
}

export function FeatureFlagRollout({
  flagName = "New checkout flow",
  flagKey = "new-checkout-flow",
  environment = "Production",
  steps = [5, 25, 100],
  totalUsers = 42800,
  actor = "Maya Chen",
  history = DEFAULT_HISTORY,
  metrics = DEFAULT_METRICS,
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: FeatureFlagRolloutProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const pal = palette(theme);
  const tall = H > W * 1.2;
  const D = tall ? { w: 800, h: 1422 } : { w: 1280, h: 720 };
  const s = Math.min(W / D.w, H / D.h);
  const sp = (at: number, config: object) =>
    spring({ frame: frame - at, fps, config });
  const stepList = steps.length > 0 ? steps : [5, 25, 100];

  const WIN = tall
    ? { x: 40, y: 384, w: 720, h: 1010 }
    : { x: 150, y: 60, w: 980, h: 600 };
  const PAD = 32;
  const HEAD_H = 88;
  const LEFT = { x: PAD, w: tall ? WIN.w - PAD * 2 : 500 };
  const RIGHT = tall
    ? { x: PAD, y: HEAD_H + 176, w: WIN.w - PAD * 2 }
    : { x: PAD + 500 + 44, y: HEAD_H + 28, w: WIN.w - (PAD + 500 + 44) - PAD };
  const BIG_Y = HEAD_H + 28;
  const TRACK = {
    x: LEFT.x,
    w: LEFT.w,
    y: tall ? HEAD_H + 80 : BIG_Y + 186,
  };
  const HIST_Y = tall ? RIGHT.y + 40 + 2 * 232 + 8 : TRACK.y + 78;
  const CHART_H = tall ? 104 : 74;
  const ROW = 46;

  const T_TOGGLE = 30;
  const drags = stepList.slice(1).map((to, k) => {
    const grab = k === 0 ? 62 : 62 + 48 * k;
    return { from: stepList[k], to, grab, start: grab + 3, release: grab + 22 };
  });
  const toggleOn = sp(T_TOGGLE + 2, CHIP);
  const isOn = frame >= T_TOGGLE + 2;

  let pct = stepList[0] * clamp(sp(T_TOGGLE + 4, MORPH), 0, 1);
  for (const d of drags) {
    if (frame >= d.start)
      pct = lerp(d.from, d.to, clamp(sp(d.start, MORPH), 0, 1));
  }
  const shownPct = Math.round(pct);
  const lastRelease = drags.length ? drags[drags.length - 1].release : T_TOGGLE;
  const fullyOut = frame >= lastRelease && shownPct >= 100;
  const doneAt = lastRelease + 2;
  const done = sp(doneAt, CHIP);

  const added = [
    {
      at: T_TOGGLE + 6,
      from: "Off",
      to: `${stepList[0]}%`,
    },
    ...drags.map((d) => ({
      at: d.release + 2,
      from: `${d.from}%`,
      to: `${d.to}%`,
    })),
  ];
  const markers = [
    { t: T_TOGGLE + 2, label: `${stepList[0]}%` },
    ...drags.map((d) => ({ t: d.release, label: `${d.to}%` })),
  ];

  const win = sp(0, HEAVY);
  const winA = tween(frame, 0, 10);
  const cam = tween(frame, 10, lastRelease + 50, camEase);

  const TOG = { x: WIN.w - PAD - 150, y: HEAD_H / 2 - 20 };
  const THUMB_R = 12;
  const thumbX = (p: number) =>
    TRACK.x + THUMB_R + (p / 100) * (TRACK.w - THUMB_R * 2);
  const thumbPt = (p: number) => ({
    x: WIN.x + thumbX(p) + 2,
    y: WIN.y + TRACK.y + 6,
  });
  const togglePt = { x: WIN.x + TOG.x + 22, y: WIN.y + TOG.y + 22 };
  const lookPt = {
    x: WIN.x + RIGHT.x + RIGHT.w * 0.7,
    y: WIN.y + RIGHT.y + (tall ? 150 : 120),
  };
  const startPt = { x: D.w * 0.8, y: D.h + 40 };
  const legs: [number, Pt, Pt][] = [[10, startPt, togglePt]];
  let prev = togglePt;
  for (const d of drags) {
    legs.push([d.grab - 14, prev, thumbPt(d.from)]);
    legs.push([d.release + 4, thumbPt(d.to), lookPt]);
    prev = lookPt;
  }
  let cur: Pt = startPt;
  for (const [t0, a, b] of legs) {
    if (frame >= t0) cur = arcTo(a, b, sp(t0, CARD));
  }
  for (const d of drags) {
    if (frame >= d.start && frame < d.release + 4) cur = thumbPt(pct);
  }
  const clickPress = clamp(
    sp(T_TOGGLE - 3, CHIP) - sp(T_TOGGLE + 2, CHIP),
    0,
    1.2,
  );
  const dragHold = Math.max(
    0,
    ...drags.map((d) =>
      clamp(sp(d.grab - 2, CHIP) - sp(d.release, CHIP), 0, 1.2),
    ),
  );
  const press = Math.max(clickPress, dragHold);
  const cursorA =
    tween(frame, 10, 16) *
    (1 - tween(frame, lastRelease + 40, lastRelease + 48, exitEase));

  const users = (totalUsers * pct) / 100;
  const statusLabel = !isOn
    ? "Off"
    : fullyOut
      ? "Fully rolled out"
      : `Rolling out · ${shownPct}%`;
  const statusColor = !isOn ? pal.faint : fullyOut ? pal.green : accent;
  const q = Math.floor(frame / 6) * 6;

  const rows: {
    key: string;
    who: string;
    change: string;
    time: string;
    at: number;
  }[] = [];
  for (let i = added.length - 1; i >= 0; i--) {
    const a = added[i];
    if (frame < a.at) continue;
    rows.push({
      key: `n${i}`,
      who: actor,
      change: `${a.from} → ${a.to}`,
      time: "now",
      at: a.at,
    });
  }
  history.forEach((h, i) => {
    rows.push({
      key: `o${i}`,
      who: h.actor,
      change: h.verb.replace(/ to$/, ""),
      time: h.time,
      at: -99,
    });
  });

  const bigPct = (size: number, color: string) => (
    <div
      style={{
        fontSize: size,
        fontWeight: 300,
        letterSpacing: "-0.05em",
        lineHeight: 1,
        color,
        fontVariantNumeric: "tabular-nums",
        transform: `scale(${1 + 0.04 * clamp(done, 0, 1.4) * (1 - clamp(sp(doneAt + 6, MORPH), 0, 1))})`,
        transformOrigin: "0% 80%",
      }}
    >
      {shownPct}%
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        fontWeight: 400,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
        background: pal.dark ? "#02030A" : "#EEF0F6",
      }}
    >
      <GshGround
        preset={ground ?? (pal.dark ? "cobalt-rise" : "glasswork")}
        params={groundParams}
        timeOffset={pal.dark ? 3 : 12}
        timeScale={0.3}
      />
      <AbsoluteFill style={{ background: pal.scrim }} />
      <div
        style={{
          position: "absolute",
          left: (W - D.w * s) / 2,
          top: (H - D.h * s) / 2,
          width: D.w,
          height: D.h,
          transformOrigin: "0 0",
          transform: `scale(${s})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: `${WIN.x + TRACK.x + TRACK.w}px ${WIN.y + TRACK.y}px`,
            transform: `scale(${1 + 0.03 * cam})`,
          }}
        >
          {tall ? (
            <div style={{ position: "absolute", left: 48, top: 80 }}>
              <div
                style={{
                  fontSize: 26,
                  color: pal.stageMuted,
                  opacity: tween(frame, 4, 14),
                }}
              >
                {environment} rollout
              </div>
              <div style={{ marginTop: 10, overflow: "hidden" }}>
                <div
                  style={{
                    transform: `translateY(${(1 - tween(frame, 6, 20)) * 100}%)`,
                  }}
                >
                  {bigPct(180, pal.stageText)}
                </div>
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontSize: 26,
                  color: pal.stageMuted,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ≈ {fmtInt(users)} of {fmtInt(totalUsers)} users
              </div>
            </div>
          ) : null}

          <div
            style={{
              position: "absolute",
              left: WIN.x,
              top: WIN.y,
              width: WIN.w,
              height: WIN.h,
              opacity: winA,
              transform: `translateY(${(1 - win) * 48}px) scale(${0.97 + 0.03 * win})`,
              transformOrigin: "50% 100%",
              borderRadius: 16,
              background: pal.win,
              boxShadow: pal.winShadow,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: HEAD_H,
                display: "flex",
                alignItems: "center",
                padding: `0 ${PAD}px`,
                borderBottom: `1px solid ${pal.line}`,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 14,
                    fontSize: 22,
                    color: pal.text,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {flagName}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 16,
                      color: statusColor,
                      letterSpacing: 0,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 9,
                        background: statusColor,
                        transform: `scale(${fullyOut ? 0.6 + 0.4 * done : 1})`,
                      }}
                    />
                    {statusLabel}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: monoFamily,
                    fontSize: 16,
                    color: pal.faint,
                  }}
                >
                  {flagKey}
                </div>
              </div>
              <div style={{ flex: 1 }} />
            </div>
            <div
              style={{
                position: "absolute",
                left: TOG.x,
                top: TOG.y,
                width: 150,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 12,
                fontSize: 16,
                color: pal.muted,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 24,
                  borderRadius: 99,
                  position: "relative",
                  background: isOn ? accent : pal.knobOff,
                  transform: `scale(${1 - 0.04 * clamp(clickPress, 0, 1.2)})`,
                  order: -1,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 3,
                    left: 3 + 16 * toggleOn,
                    width: 18,
                    height: 18,
                    borderRadius: 99,
                    background: "#fff",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
                  }}
                />
              </div>
              <span style={{ color: pal.text }}>{environment}</span>
            </div>

            <div
              style={{
                position: "absolute",
                left: LEFT.x,
                top: BIG_Y,
                fontSize: 16,
                color: pal.muted,
              }}
            >
              Serving <span style={{ fontFamily: monoFamily }}>true</span> to
            </div>
            {!tall ? (
              <div
                style={{
                  position: "absolute",
                  left: LEFT.x - 4,
                  top: BIG_Y + 34,
                }}
              >
                {bigPct(108, pal.text)}
                <div
                  style={{
                    marginTop: 12,
                    marginLeft: 4,
                    fontSize: 16,
                    color: pal.muted,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ≈ {fmtInt(users)} of {fmtInt(totalUsers)} users
                </div>
              </div>
            ) : null}

            <div
              style={{
                position: "absolute",
                left: TRACK.x,
                top: TRACK.y,
                width: TRACK.w,
                height: 8,
                borderRadius: 4,
                background: pal.track,
              }}
            >
              <div
                style={{
                  width: THUMB_R + (pct / 100) * (TRACK.w - THUMB_R * 2),
                  height: "100%",
                  borderRadius: 4,
                  background: accent,
                  opacity: isOn ? 1 : 0.4,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: THUMB_R + (pct / 100) * (TRACK.w - THUMB_R * 2),
                  top: 4,
                  width: THUMB_R * 2,
                  height: THUMB_R * 2,
                  borderRadius: 99,
                  background: "#fff",
                  boxShadow: `0 0 0 1px ${pal.dark ? "rgba(0,0,0,0.3)" : "rgba(17,19,24,0.12)"}, 0 2px 6px rgba(17,19,24,0.25)`,
                  transform: `translate(-50%, -50%) scale(${1 + 0.12 * dragHold})`,
                }}
              />
            </div>
            {[0, 25, 50, 75, 100].map((t) => (
              <div
                key={t}
                style={{
                  position: "absolute",
                  left:
                    t === 0
                      ? TRACK.x
                      : t === 100
                        ? TRACK.x + TRACK.w
                        : thumbX(t),
                  top: TRACK.y + 24,
                  transform: `translateX(${t === 0 ? 0 : t === 100 ? -100 : -50}%)`,
                  fontSize: 16,
                  color: pal.faint,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {t}%
              </div>
            ))}

            {!tall ? (
              <div
                style={{
                  position: "absolute",
                  left: RIGHT.x - 22,
                  top: HEAD_H,
                  bottom: 0,
                  width: 1,
                  background: pal.line,
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  left: PAD,
                  right: PAD,
                  top: RIGHT.y - 26,
                  height: 1,
                  background: pal.line,
                }}
              />
            )}

            <div
              style={{
                position: "absolute",
                left: RIGHT.x,
                top: RIGHT.y,
                width: RIGHT.w,
                display: "flex",
                fontSize: 16,
                color: pal.muted,
              }}
            >
              Guardrails
              <div style={{ flex: 1 }} />
              <span style={{ color: pal.green }}>All passing</span>
            </div>
            {metrics.slice(0, 2).map((m, i) => {
              const live = treatAt(m, i, q);
              const ctrl = controlAt(m, i, q);
              const top = RIGHT.y + 40 + i * (tall ? 232 : 186);
              const a = tween(frame, 8 + i * 4, 20 + i * 4);
              return (
                <div
                  key={m.label}
                  style={{
                    position: "absolute",
                    left: RIGHT.x,
                    top,
                    width: RIGHT.w,
                    opacity: a,
                    transform: `translateY(${(1 - a) * 10}px)`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <span style={{ fontSize: 16, color: pal.text }}>
                      {m.label}
                    </span>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 16, color: pal.faint }}>
                      limit {fmtVal(m, m.threshold).replace(".00", ".0")}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      marginTop: 4,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 30,
                        fontWeight: 300,
                        letterSpacing: "-0.02em",
                        color: pal.text,
                      }}
                    >
                      {fmtVal(m, isOn ? live : ctrl)}
                    </span>
                    <span style={{ fontSize: 16, color: pal.muted }}>
                      vs {fmtVal(m, ctrl)} control
                    </span>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <GuardrailChart
                      metric={m}
                      index={i}
                      frame={frame}
                      markers={markers}
                      onAt={T_TOGGLE + 2}
                      accent={accent}
                      pal={pal}
                      w={RIGHT.w}
                      h={CHART_H}
                    />
                  </div>
                </div>
              );
            })}

            <div
              style={{
                position: "absolute",
                left: LEFT.x,
                top: HIST_Y,
                fontSize: 16,
                color: pal.muted,
              }}
            >
              Changes
            </div>
            <div
              style={{
                position: "absolute",
                left: LEFT.x,
                top: HIST_Y + 34,
                width: LEFT.w,
                height: ROW * 3,
                overflow: "hidden",
              }}
            >
              {(() => {
                let y = 0;
                return rows.map((r) => {
                  const g = r.at < 0 ? 1 : clamp(sp(r.at, CARD), 0, 1.05);
                  const top = y;
                  y += ROW * Math.min(1, g);
                  const fade = r.at < 0 ? 1 : tween(frame, r.at + 2, r.at + 10);
                  if (top > ROW * 3) return null;
                  return (
                    <div
                      key={r.key}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top,
                        height: ROW,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontSize: 16,
                        opacity: fade,
                        transform: `translateY(${(1 - fade) * -6}px)`,
                        borderTop: `1px solid ${pal.line}`,
                      }}
                    >
                      <Avatar name={r.who} size={26} />
                      <span style={{ color: pal.text, whiteSpace: "nowrap" }}>
                        {r.who}
                      </span>
                      <span
                        style={{
                          color: r.at < 0 ? pal.muted : accent,
                          fontFamily: r.at < 0 ? fontFamily : monoFamily,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.change}
                      </span>
                      <div style={{ flex: 1 }} />
                      <span style={{ color: pal.faint }}>{r.time}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          <div style={{ opacity: cursorA }}>
            <Cursor x={cur.x} y={cur.y} scale={1 - 0.04 * press} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
