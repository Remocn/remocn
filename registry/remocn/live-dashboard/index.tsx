"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
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
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const geist = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadGeistMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface DashboardMetric {
  label: string;
  value: number;
  format?: "currency" | "number" | "percent";
  decimals?: number;
  /** Percent change shown next to the label. */
  change: number;
  /** Which direction is good news (colors the change). Default "up". */
  goodWhen?: "up" | "down";
  /** Sparkline values; generated when omitted. */
  spark?: number[];
  /** Added to the value on every live tick. */
  liveStep?: number;
}

export interface DashboardTick {
  customer: string;
  amount: number;
}

export interface LiveDashboardProps {
  title?: string;
  workspace?: string;
  /** Cumulative gross volume through "now"; the last value is the headline number. */
  series?: number[];
  /** Change vs. yesterday for the headline, in percent. */
  change?: number;
  metrics?: DashboardMetric[];
  /** Payments that land during the live phase. */
  live?: DashboardTick[];
  payments?: DashboardTick[];
  visitors?: number;
  currency?: string;
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function makeSeries(len: number, last: number, seed: number) {
  let acc = 0;
  const raw = Array.from({ length: len }, (_, i) => {
    acc +=
      0.25 + hash(i + seed) * 0.9 + Math.sin((Math.PI * i) / (len * 1.4)) * 0.9;
    return acc;
  });
  return raw.map((v) => (v / acc) * last);
}

function makeSpark(n: number, down: boolean) {
  return Array.from({ length: 14 }, (_, i) => {
    const t = down ? 14 - i : i;
    return (
      10 + t * 1.4 + Math.sin(i * 1.7 + n * 2) * 2.2 + hash(i + n * 31) * 3
    );
  });
}

const DEFAULT_SERIES = makeSeries(22, 48210.32, 7);
const DEFAULT_METRICS: DashboardMetric[] = [
  { label: "MRR", value: 84210, format: "currency", change: 8.2 },
  {
    label: "Active users",
    value: 12408,
    format: "number",
    change: 4.1,
    liveStep: 3,
  },
  {
    label: "Conversion",
    value: 3.84,
    format: "percent",
    decimals: 2,
    change: 0.6,
  },
  {
    label: "Churn",
    value: 1.2,
    format: "percent",
    decimals: 1,
    change: -0.3,
    goodWhen: "down",
  },
];
const DEFAULT_LIVE: DashboardTick[] = [
  { customer: "Fernway", amount: 2480 },
  { customer: "Tessel Labs", amount: 1920.5 },
  { customer: "Lumen Studio", amount: 3150 },
];
const DEFAULT_PAYMENTS: DashboardTick[] = [
  { customer: "Quarry", amount: 1240 },
  { customer: "Orbitly", amount: 560 },
  { customer: "Halcyon Health", amount: 2100 },
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const B = {
  window: 0,
  head: 8,
  count: 12,
  draw: 16,
  feed: 14,
  kpi: 20,
  live: [84, 110, 132],
};
const ROW = 56;

const LIGHT_PAL = {
  window: "#ffffff",
  depth:
    "0 0 0 1px rgba(20,22,30,0.06), 0 2px 4px rgba(20,22,30,0.04), 0 40px 80px -30px rgba(20,22,40,0.28)",
  rule: "rgba(20,22,30,0.07)",
  text: "#15161c",
  muted: "#5f6573",
  faint: "#9aa0ac",
  grid: "rgba(20,22,30,0.05)",
  chip: "#f2f3f5",
  good: "#127a3a",
  bad: "#b4233c",
  live: "#1f9d55",
  dark: false,
};
const DARK_PAL: typeof LIGHT_PAL = {
  window: "rgba(11,12,16,0.88)",
  depth:
    "0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.06), 0 40px 90px -30px rgba(0,0,0,0.8)",
  rule: "rgba(255,255,255,0.07)",
  text: "#eef0f4",
  muted: "#9399a6",
  faint: "#5f6573",
  grid: "rgba(255,255,255,0.05)",
  chip: "rgba(255,255,255,0.06)",
  good: "#5fd38d",
  bad: "#ff7f97",
  live: "#5fd38d",
  dark: true,
};

const ICONS = {
  home: "M4 11l8-7 8 7v9H4zM10 20v-6h4v6",
  chart: "M5 20V10M12 20V4M19 20v-7",
  card: "M3 6h18v12H3zM3 10h18M7 15h3",
  users:
    "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 11a3 3 0 100-6M22 21c0-3-2-5-5-5",
  code: "M8 8l-4 4 4 4M16 8l4 4-4 4",
  gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2",
};

function Icon({ d, color }: { d: string; color: string }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

function Rolling({
  from,
  to,
  t,
  fmt,
  lineHeight,
}: {
  from: number;
  to: number;
  t: number;
  fmt: (n: number) => string;
  lineHeight: number;
}) {
  const a = fmt(from);
  const b = fmt(to);
  if (a.length !== b.length || t <= 0) return <>{t <= 0 ? a : b}</>;
  const chars = b.split("");
  return (
    <span style={{ display: "inline-flex", height: lineHeight }}>
      {chars.map((ch, i) => {
        if (a[i] === ch) return <span key={`${i}-${ch}`}>{ch}</span>;
        const p = interpolate(t - (chars.length - 1 - i), [0, 8], [0, 1], {
          ...clamp,
          easing: LIGHT,
        });
        const slot = (glyph: string, y: number, o: number) => (
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: `translateY(${y * lineHeight}px)`,
              opacity: o,
            }}
          >
            {glyph}
          </span>
        );
        return (
          <span
            key={`${i}-${ch}`}
            style={{
              position: "relative",
              display: "inline-block",
              height: lineHeight,
              overflow: "hidden",
            }}
          >
            <span style={{ visibility: "hidden" }}>{ch}</span>
            {slot(a[i], -p * 0.6, clamp01(1 - p / 0.45))}
            {slot(ch, (1 - p) * 0.6, clamp01((p - 0.3) / 0.7))}
          </span>
        );
      })}
    </span>
  );
}

function linePath(pts: { x: number; y: number }[]) {
  const n = (v: number) => v.toFixed(2);
  return pts
    .map((p, i) => {
      if (i === 0) return `M${n(p.x)} ${n(p.y)}`;
      const p0 = pts[i - 2] ?? pts[i - 1];
      const p1 = pts[i - 1];
      const p3 = pts[i + 1] ?? p;
      const c1x = p1.x + (p.x - p0.x) / 6;
      const c1y = p1.y + (p.y - p0.y) / 6;
      const c2x = p.x - (p3.x - p1.x) / 6;
      const c2y = p.y - (p3.y - p1.y) / 6;
      return `C${n(c1x)} ${n(c1y)} ${n(c2x)} ${n(c2y)} ${n(p.x)} ${n(p.y)}`;
    })
    .join(" ");
}

function Sparkline({
  values,
  w,
  h,
  p,
  color,
}: {
  values: number[];
  w: number;
  h: number;
  p: number;
  color: string;
}) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: h - 3 - ((v - min) / (max - min || 1)) * (h - 6),
  }));
  return (
    <svg width={w} height={h} style={{ overflow: "visible", display: "block" }}>
      <path
        d={linePath(pts)}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={`${p} 1`}
      />
    </svg>
  );
}

export function LiveDashboard({
  title = "Today",
  workspace = "Kitebase",
  series = DEFAULT_SERIES,
  change = 15.1,
  metrics = DEFAULT_METRICS,
  live = DEFAULT_LIVE,
  payments = DEFAULT_PAYMENTS,
  visitors = 128,
  currency = "USD",
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
  ground,
  groundParams,
}: LiveDashboardProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const W = tall ? 720 : 1280;
  const H = tall ? 1280 : 720;
  const u = Math.min(width / W, height / H);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const c = theme === "dark" ? DARK_PAL : LIGHT_PAL;

  const WIN = tall
    ? { x: 32, y: 48, w: 656, h: 1184 }
    : { x: 72, y: 44, w: 1136, h: 632 };
  const RAIL = tall ? 0 : 64;
  const PADX = 32;
  const mainW = WIN.w - RAIL - PADX * 2;
  const FEED_W = tall ? mainW : 292;
  const CHART = { w: tall ? mainW : mainW - FEED_W - 40, h: tall ? 250 : 180 };

  const money = (n: number, d = 2) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }).format(n);
  const fmtMetric = (m: DashboardMetric) => (n: number) =>
    m.format === "currency"
      ? money(n, m.decimals ?? 0)
      : m.format === "percent"
        ? `${n.toFixed(m.decimals ?? 1)}%`
        : new Intl.NumberFormat("en-US", {
            maximumFractionDigits: m.decimals ?? 0,
          }).format(n);

  const tickAt = live.map(
    (_, i) =>
      B.live[i] ?? B.live[B.live.length - 1] + (i - B.live.length + 1) * 22,
  );
  const tickS = tickAt.map((at) =>
    spring({ frame: frame - at, fps, config: MORPH, durationInFrames: 18 }),
  );
  const rowS = tickAt.map((at) =>
    spring({ frame: frame - at, fps, config: CARD }),
  );
  const ticksDone = tickAt.filter((at) => frame >= at).length;
  const lastTickT = ticksDone > 0 ? frame - tickAt[ticksDone - 1] : -1;

  const all = [...series];
  for (const t of live) all.push(all[all.length - 1] + t.amount);
  const domain = all.length + 2;
  const base = series[series.length - 1] ?? 0;
  const totalAt = (k: number) => all[series.length - 1 + k] ?? base;
  const yMax = Math.max(...all) * 1.08;
  const pts = all.map((v, i) => ({
    x: (i / (domain - 1)) * CHART.w,
    y: CHART.h - (v / yMax) * (CHART.h - 10),
  }));
  const yesterday = Array.from({ length: domain }, (_, i) => {
    const t = i / (domain - 1);
    return base * 0.97 * t ** 1.15 * (1 + 0.035 * Math.sin(i * 1.3));
  });
  const yPts = yesterday.map((v, i) => ({
    x: (i / (domain - 1)) * CHART.w,
    y: CHART.h - (v / yMax) * (CHART.h - 10),
  }));

  const draw = interpolate(frame, [B.draw, B.draw + 46], [0, 1], {
    ...clamp,
    easing: MOVE,
  });
  const revealIdx =
    (series.length - 1) * draw + tickS.reduce((a, b) => a + b, 0);
  const i0 = Math.min(Math.floor(revealIdx), all.length - 1);
  const i1 = Math.min(i0 + 1, all.length - 1);
  const fr = revealIdx - i0;
  const dot = {
    x: pts[i0].x + (pts[i1].x - pts[i0].x) * fr,
    y: pts[i0].y + (pts[i1].y - pts[i0].y) * fr,
  };
  const line = linePath(pts);

  const countUp = interpolate(frame, [B.count, B.count + 40], [0, 1], {
    ...clamp,
    easing: LIGHT,
  });
  const headline =
    ticksDone === 0 ? (
      money(base * countUp)
    ) : (
      <Rolling
        from={totalAt(ticksDone - 1)}
        to={totalAt(ticksDone)}
        t={lastTickT}
        fmt={(n) => money(n)}
        lineHeight={62}
      />
    );

  const win = spring({ frame: frame - B.window, fps, config: HEAVY });
  const winFade = interpolate(frame, [B.window, B.window + 12], [0, 1], {
    ...clamp,
    easing: ENTER,
  });
  const camera = interpolate(frame, [0, 190], [1, 1.03], {
    ...clamp,
    easing: CAMERA,
  });
  const rise = (at: number): React.CSSProperties => {
    const s = interpolate(frame, [at, at + 14], [0, 1], {
      ...clamp,
      easing: ENTER,
    });
    return { opacity: s, transform: `translateY(${(1 - s) * 14}px)` };
  };

  const visitorDeltas = [0, 3, -1, 6, 2];
  const visitorsAt = (k: number) =>
    visitors + visitorDeltas.slice(0, k + 1).reduce((a, b) => a + b, 0);
  const pulse = (frame % 36) / 36;
  const clock = (k: number) => `14:${String(32 + k).padStart(2, "0")}`;
  const lastLive = ticksDone === live.length;

  const kpis = metrics.slice(0, 4);
  const kpiCols = tall ? 2 : kpis.length;
  const kpiW = (mainW - (kpiCols - 1) * 1) / kpiCols;

  const feedRows = [
    ...live.map((p, k) => ({
      p,
      k,
      y: tickS.slice(k + 1).reduce((a, b) => a + b, 0),
      s: rowS[k],
    })),
    ...payments.map((p, j) => ({
      p,
      k: -1,
      y: j + tickS.reduce((a, b) => a + b, 0),
      s: spring({ frame: frame - (B.feed + j * 3), fps, config: CARD }),
    })),
  ];
  const feedVisible = tall ? 4 : 4;

  return (
    <AbsoluteFill
      style={{
        WebkitFontSmoothing: "antialiased",
        fontFamily: geist.fontFamily,
        overflow: "hidden",
      }}
    >
      <GshGround
        preset={ground ?? (c.dark ? "europa" : "glasswork")}
        params={
          groundParams ??
          (c.dark || ground
            ? undefined
            : { colors: ["#a9bbff", "#3552ff", "#1a2a9e", "#7f9bff"] })
        }
        timeOffset={c.dark ? 5 : 2}
        timeScale={0.35}
      />
      <div
        style={{
          position: "absolute",
          left: (width - W * u) / 2,
          top: (height - H * u) / 2,
          width: W,
          height: H,
          transform: `scale(${u})`,
          transformOrigin: "0 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: WIN.x,
            top: WIN.y,
            width: WIN.w,
            height: WIN.h,
            borderRadius: 16,
            background: c.window,
            backdropFilter: c.dark ? "blur(30px)" : undefined,
            boxShadow: c.depth,
            overflow: "hidden",
            display: "flex",
            opacity: winFade,
            transformOrigin: "50% 40%",
            transform: `translateY(${(1 - win) * 70}px) scale(${(0.95 + 0.05 * win) * camera})`,
          }}
        >
          {RAIL ? (
            <div
              style={{
                width: RAIL,
                flexShrink: 0,
                boxShadow: `inset -1px 0 0 ${c.rule}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 22,
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: c.text,
                  color: c.dark ? "#0b0c10" : "#fff",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                {workspace[0]}
              </div>
              {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((k) => (
                <div
                  key={k}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    background: k === "home" ? c.chip : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: k === "gear" ? "auto" : 0,
                    marginBottom: k === "gear" ? 20 : 0,
                  }}
                >
                  <Icon d={ICONS[k]} color={k === "home" ? c.text : c.faint} />
                </div>
              ))}
            </div>
          ) : null}
          <div
            style={{
              position: "relative",
              flex: 1,
              padding: `22px ${PADX}px`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                ...rise(B.head),
                display: "flex",
                alignItems: "center",
                height: 44,
                gap: 14,
              }}
            >
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 300,
                  color: c.text,
                  letterSpacing: "-0.03em",
                }}
              >
                {title}
              </span>
              <span
                style={{
                  fontFamily: mono.fontFamily,
                  fontSize: 16,
                  color: c.faint,
                  marginTop: 4,
                }}
              >
                {workspace} · {clock(ticksDone)}
              </span>
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: mono.fontFamily,
                  fontSize: 16,
                  color: c.muted,
                }}
              >
                <span style={{ position: "relative", width: 8, height: 8 }}>
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 4,
                      background: c.live,
                      opacity: (1 - pulse) * 0.45,
                      transform: `scale(${1 + pulse * 1.8})`,
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 4,
                      background: c.live,
                    }}
                  />
                </span>
                <span
                  style={{ color: c.text, fontVariantNumeric: "tabular-nums" }}
                >
                  {ticksDone === 0 ? (
                    visitors
                  ) : (
                    <Rolling
                      from={visitorsAt(ticksDone - 1)}
                      to={visitorsAt(ticksDone)}
                      t={lastTickT}
                      fmt={(n) => String(n)}
                      lineHeight={20}
                    />
                  )}
                </span>
                on site
              </div>
            </div>
            <div
              style={{ height: 1, background: c.rule, margin: "16px 0 22px" }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: tall ? "column" : "row",
                gap: tall ? 30 : 40,
              }}
            >
              <div style={{ width: CHART.w }}>
                <div
                  style={{ ...rise(B.head + 3), fontSize: 16, color: c.muted }}
                >
                  Gross volume
                </div>
                <div
                  style={{
                    fontSize: 56,
                    fontWeight: 300,
                    color: c.text,
                    letterSpacing: "-0.04em",
                    height: 62,
                    lineHeight: "62px",
                    marginTop: 4,
                    fontVariantNumeric: "tabular-nums",
                    opacity: interpolate(
                      frame,
                      [B.count, B.count + 8],
                      [0, 1],
                      {
                        ...clamp,
                        easing: ENTER,
                      },
                    ),
                  }}
                >
                  {headline}
                </div>
                <div
                  style={{
                    ...rise(B.count + 30),
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    marginTop: 6,
                    fontSize: 16,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <span style={{ color: change >= 0 ? c.good : c.bad }}>
                    {change >= 0 ? "+" : ""}
                    {change.toFixed(1)}%
                  </span>
                  <span style={{ color: c.muted }}>
                    vs {money((base / (1 + change / 100)) * countUp)} yesterday
                  </span>
                </div>
                <svg
                  width={CHART.w}
                  height={CHART.h + 30}
                  style={{
                    marginTop: 20,
                    overflow: "visible",
                    display: "block",
                  }}
                >
                  <defs>
                    <clipPath id={`${id}-clip`}>
                      <rect
                        x={-2}
                        y={-40}
                        width={dot.x + 2}
                        height={CHART.h + 60}
                      />
                    </clipPath>
                    <linearGradient
                      id={`${id}-fill`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={accent} stopOpacity={0.16} />
                      <stop offset="100%" stopColor={accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75].map((g) => (
                    <line
                      key={g}
                      x1={0}
                      x2={CHART.w}
                      y1={CHART.h * g}
                      y2={CHART.h * g}
                      stroke={c.grid}
                    />
                  ))}
                  <line
                    x1={0}
                    x2={CHART.w}
                    y1={CHART.h}
                    y2={CHART.h}
                    stroke={c.rule}
                  />
                  <path
                    d={linePath(yPts)}
                    fill="none"
                    stroke={c.faint}
                    strokeWidth={1.5}
                    strokeDasharray="2 5"
                    strokeLinecap="round"
                    opacity={interpolate(
                      frame,
                      [B.draw + 4, B.draw + 28],
                      [0, 0.8],
                      {
                        ...clamp,
                        easing: LIGHT,
                      },
                    )}
                  />
                  <g clipPath={`url(#${id}-clip)`}>
                    <path
                      d={`${line} L${pts[pts.length - 1].x} ${CHART.h} L0 ${CHART.h} Z`}
                      fill={`url(#${id}-fill)`}
                    />
                    <path
                      d={line}
                      fill="none"
                      stroke={accent}
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </g>
                  {draw > 0 ? (
                    <g transform={`translate(${dot.x} ${dot.y})`}>
                      <line
                        x1={0}
                        x2={0}
                        y1={6}
                        y2={CHART.h - dot.y}
                        stroke={withAlpha(accent, 0.3)}
                        strokeDasharray="2 4"
                        opacity={clamp01((frame - B.draw - 40) / 8)}
                      />
                      <circle
                        r={4 + pulse * 10}
                        fill={accent}
                        opacity={frame > B.draw + 46 ? (1 - pulse) * 0.2 : 0}
                      />
                      <circle
                        r={4.5}
                        fill={accent}
                        stroke={c.dark ? "#0b0c10" : "#fff"}
                        strokeWidth={2}
                      />
                    </g>
                  ) : null}
                  {ticksDone > 0 && (lastLive || lastTickT < 22)
                    ? (() => {
                        const label = `+${money(live[ticksDone - 1].amount)}`;
                        const w = label.length * 9.6 + 22;
                        const pop = spring({
                          frame: lastTickT,
                          fps,
                          config: CHIP,
                        });
                        const out = lastLive
                          ? 0
                          : interpolate(lastTickT, [14, 22], [0, 1], {
                              ...clamp,
                              easing: EXIT,
                            });
                        return (
                          <g
                            transform={`translate(${Math.min(dot.x, CHART.w - w / 2)} ${dot.y - 34 + (1 - pop) * 10 - out * 6}) scale(${0.85 + 0.15 * pop})`}
                            opacity={clamp01(pop * 2) * (1 - out)}
                          >
                            <rect
                              x={-w / 2}
                              y={-15}
                              width={w}
                              height={30}
                              rx={8}
                              fill={c.dark ? "#16181f" : "#fff"}
                              stroke={c.rule}
                            />
                            <text
                              y={5.5}
                              textAnchor="middle"
                              fontSize={16}
                              fontFamily={mono.fontFamily}
                              fill={c.good}
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {label}
                            </text>
                          </g>
                        );
                      })()
                    : null}
                  {["00:00", "23:59"].map((l, i) => (
                    <text
                      key={l}
                      x={i ? CHART.w : 0}
                      y={CHART.h + 24}
                      fontSize={16}
                      fontFamily={mono.fontFamily}
                      fill={c.faint}
                      textAnchor={i ? "end" : "start"}
                    >
                      {l}
                    </text>
                  ))}
                </svg>
              </div>

              <div
                style={{
                  width: FEED_W,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    ...rise(B.head + 6),
                    display: "flex",
                    fontSize: 16,
                    color: c.muted,
                    marginBottom: 8,
                  }}
                >
                  Payments
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: mono.fontFamily,
                      color: c.faint,
                    }}
                  >
                    {currency}
                  </span>
                </div>
                <div
                  style={{
                    position: "relative",
                    height: feedVisible * ROW,
                    overflow: "hidden",
                  }}
                >
                  {feedRows.map(({ p, k, y, s }) => {
                    if (s <= 0.001) return null;
                    const fresh =
                      k >= 0 ? clamp01(1 - (frame - tickAt[k]) / 36) : 0;
                    return (
                      <div
                        key={`${k}-${p.customer}`}
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: 0,
                          height: ROW,
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "0 10px",
                          margin: "0 -10px",
                          borderRadius: 10,
                          background: withAlpha(
                            accent,
                            fresh * (c.dark ? 0.16 : 0.08),
                          ),
                          boxShadow:
                            y > 0.5 ? `inset 0 1px 0 ${c.rule}` : "none",
                          opacity: clamp01(s * 1.6),
                          transform: `translateY(${y * ROW - (1 - s) * 18}px)`,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            flexShrink: 0,
                            borderRadius: 16,
                            background: c.chip,
                            color: c.muted,
                            fontSize: 16,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {p.customer[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 16,
                              color: c.text,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {p.customer}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 16,
                            color: c.text,
                            fontVariantNumeric: "tabular-nums",
                            minWidth: 86,
                            textAlign: "right",
                          }}
                        >
                          {money(p.amount, 0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "auto",
                display: "flex",
                flexWrap: "wrap",
                boxShadow: `inset 0 1px 0 ${c.rule}`,
              }}
            >
              {kpis.map((m, i) => {
                const fmt = fmtMetric(m);
                const enter = spring({
                  frame: frame - (B.kpi + i * 3),
                  fps,
                  config: CARD,
                });
                const roll = interpolate(
                  frame,
                  [B.kpi + 2 + i * 3, B.kpi + 38 + i * 3],
                  [0, 1],
                  {
                    ...clamp,
                    easing: LIGHT,
                  },
                );
                const step = m.liveStep ?? 0;
                const good =
                  (m.goodWhen ?? "up") === "up" ? m.change >= 0 : m.change <= 0;
                const spark = m.spark ?? makeSpark(i, m.goodWhen === "down");
                const sparkP = interpolate(
                  frame,
                  [B.kpi + 6 + i * 3, B.kpi + 44 + i * 3],
                  [0, 1],
                  {
                    ...clamp,
                    easing: MOVE,
                  },
                );
                const col = i % kpiCols;
                const row = Math.floor(i / kpiCols);
                return (
                  <div
                    key={m.label}
                    style={{
                      width: kpiW,
                      boxSizing: "border-box",
                      padding: `20px ${col === kpiCols - 1 ? 0 : 22}px 4px ${col === 0 ? 0 : 22}px`,
                      boxShadow:
                        [
                          col > 0 ? `inset 1px 0 0 ${c.rule}` : null,
                          row > 0 ? `inset 0 1px 0 ${c.rule}` : null,
                        ]
                          .filter(Boolean)
                          .join(", ") || "none",
                      opacity: clamp01(enter * 1.5),
                      transform: `translateY(${(1 - enter) * 22}px)`,
                    }}
                  >
                    <div
                      style={{ display: "flex", fontSize: 16, color: c.muted }}
                    >
                      {m.label}
                      <span
                        style={{
                          marginLeft: "auto",
                          color: good ? c.good : c.bad,
                          fontVariantNumeric: "tabular-nums",
                          opacity: interpolate(
                            frame,
                            [B.kpi + 30 + i * 3, B.kpi + 40 + i * 3],
                            [0, 1],
                            {
                              ...clamp,
                              easing: ENTER,
                            },
                          ),
                        }}
                      >
                        {m.change >= 0 ? "+" : ""}
                        {m.change.toFixed(1)}%
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 300,
                        color: c.text,
                        marginTop: 6,
                        height: 36,
                        lineHeight: "36px",
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {step && ticksDone > 0 ? (
                        <Rolling
                          from={m.value + step * (ticksDone - 1)}
                          to={m.value + step * ticksDone}
                          t={lastTickT - 2}
                          fmt={fmt}
                          lineHeight={36}
                        />
                      ) : (
                        fmt(m.value * roll)
                      )}
                    </div>
                    <div style={{ marginTop: 10, marginBottom: 14 }}>
                      <Sparkline
                        values={spark}
                        w={kpiW - 44}
                        h={tall ? 48 : 34}
                        p={sparkP}
                        color={good ? accent : c.faint}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
