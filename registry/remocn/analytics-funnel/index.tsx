"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import type React from "react";
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

export interface FunnelStep {
  label: string;
  event: string;
  control: number;
  variant: number;
}

export interface FunnelBreakdownRow {
  label: string;
  share: number;
}

export interface AnalyticsFunnelProps {
  steps?: FunnelStep[];
  title?: string;
  variantLabel?: string;
  tooltipStep?: number;
  breakdown?: FunnelBreakdownRow[];
  dateRange?: string;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_STEPS: FunnelStep[] = [
  {
    label: "Visit",
    event: "Viewed landing page",
    control: 18420,
    variant: 18420,
  },
  { label: "Sign up", event: "Signed up", control: 7920, variant: 8288 },
  {
    label: "Activate",
    event: "Created first project",
    control: 4277,
    variant: 5304,
  },
  { label: "Pay", event: "Started subscription", control: 1540, variant: 1820 },
];
const DEFAULT_BREAKDOWN: FunnelBreakdownRow[] = [
  { label: "Web", share: 0.61 },
  { label: "iOS", share: 0.26 },
  { label: "Android", share: 0.13 },
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
const fmt = (n: number) =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const pct = (v: number) => `${v.toFixed(1)}%`;

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

interface Pal {
  win: string;
  tip: string;
  line: string;
  track: string;
  text: string;
  muted: string;
  faint: string;
  green: string;
  greenBg: string;
  knobOff: string;
  scrim: string;
  winShadow: string;
  tipShadow: string;
  stageText: string;
  stageMuted: string;
  dark: boolean;
}

function palette(theme: "light" | "dark"): Pal {
  return theme === "dark"
    ? {
        win: "#0E0F12",
        tip: "#17181C",
        line: "rgba(255,255,255,0.07)",
        track: "rgba(255,255,255,0.08)",
        text: "#EEEEF0",
        muted: "rgba(238,238,240,0.6)",
        faint: "rgba(238,238,240,0.4)",
        green: "#62D893",
        greenBg: "rgba(98,216,147,0.12)",
        knobOff: "rgba(255,255,255,0.16)",
        scrim: "rgba(3,4,10,0.28)",
        winShadow:
          "0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.05), 0 40px 90px -24px rgba(0,0,0,0.75), 0 10px 28px rgba(0,0,0,0.35)",
        tipShadow:
          "0 0 0 1px rgba(255,255,255,0.11), inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 48px -12px rgba(0,0,0,0.7)",
        stageText: "#F2F2F4",
        stageMuted: "rgba(242,242,244,0.62)",
        dark: true,
      }
    : {
        win: "#FCFCFB",
        tip: "#FFFFFF",
        line: "rgba(22,23,26,0.08)",
        track: "rgba(22,23,26,0.07)",
        text: "#16171A",
        muted: "rgba(22,23,26,0.6)",
        faint: "rgba(22,23,26,0.42)",
        green: "#18794E",
        greenBg: "rgba(24,121,78,0.1)",
        knobOff: "rgba(22,23,26,0.16)",
        scrim: "rgba(238,240,246,0.18)",
        winShadow:
          "0 0 0 1px rgba(17,19,24,0.07), 0 1px 2px rgba(17,19,24,0.05), 0 30px 70px -20px rgba(28,38,92,0.28)",
        tipShadow:
          "0 0 0 1px rgba(17,19,24,0.08), 0 2px 4px rgba(17,19,24,0.05), 0 22px 44px -14px rgba(28,38,92,0.3)",
        stageText: "#14151A",
        stageMuted: "rgba(20,21,26,0.6)",
        dark: false,
      };
}

const ICONS = {
  arrowUp: "M8 12.5v-9M4.5 7 8 3.5 11.5 7",
  calendar: "M3.25 4h9.5v9.25h-9.5zM3.25 6.75h9.5M5.75 2.5v2.75M10.25 2.5v2.75",
} as const;

function Icon({
  name,
  color,
  size = 16,
}: {
  name: keyof typeof ICONS;
  color: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ flexShrink: 0, display: "block" }}
    >
      <path
        d={ICONS[name]}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

const T = {
  win: 0,
  bars: 8,
  cursorIn: 26,
  click: 50,
  morph: 56,
  badge: 74,
  toHover: 70,
  tip: 96,
  end: 165,
};

export function AnalyticsFunnel({
  steps = DEFAULT_STEPS,
  title = "Activation funnel",
  variantLabel = "New onboarding",
  tooltipStep = 2,
  breakdown = DEFAULT_BREAKDOWN,
  dateRange = "Last 30 days",
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: AnalyticsFunnelProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const pal = palette(theme);
  const tall = H > W * 1.2;
  const D = tall ? { w: 800, h: 1422 } : { w: 1280, h: 720 };
  const s = Math.min(W / D.w, H / D.h);
  const sp = (at: number, config: object) =>
    spring({ frame: frame - at, fps, config });

  const WIN = tall
    ? { x: 40, y: 330, w: 720, h: 1000 }
    : { x: 156, y: 60, w: 968, h: 600 };
  const PAD = tall ? 28 : 32;
  const HEAD_H = 76;
  const KPI_Y = HEAD_H + 22;
  const CT = tall ? HEAD_H + 112 : KPI_Y + 112;
  const AXIS_W = 52;
  const PLOT = {
    x: PAD + AXIS_W,
    y: CT + 62,
    w: WIN.w - PAD * 2 - AXIS_W,
    h: WIN.h - PAD - 64 - (CT + 62),
  };
  const n = steps.length;
  const slot = PLOT.w / n;
  const BAR_W = Math.min(124, slot * 0.58);
  const colX = (i: number) => PLOT.x + slot * i + (slot - BAR_W) / 2;
  const yOf = (p: number) => PLOT.y + PLOT.h * (1 - p / 100);

  const morph = steps.map((_, i) => sp(T.morph + i * 3, MORPH));
  const value = (i: number) =>
    lerp(steps[i].control, steps[i].variant, morph[i]);
  const first = value(0) || 1;
  const ofFirst = (i: number) => (value(i) / first) * 100;
  const fromPrev = (i: number) =>
    i === 0 ? 100 : (value(i) / value(i - 1)) * 100;
  const grow = steps.map((_, i) => sp(T.bars + i * 3, CARD));
  const totalC = (steps[n - 1].control / steps[0].control) * 100;
  const totalV = (steps[n - 1].variant / steps[0].variant) * 100;
  const uplift = Math.round(((totalV - totalC) / totalC) * 100);
  const totalNow = lerp(totalC, totalV, morph[n - 1]);

  const win = sp(T.win, HEAVY);
  const winA = tween(frame, 0, 10);
  const toggleOn = sp(T.click + 2, CHIP);
  const on = toggleOn > 0.5;
  const badge = sp(T.badge, CHIP);
  const tip = sp(T.tip, CARD);
  const tipA = tween(frame, T.tip, T.tip + 8);
  const tt = clamp(tooltipStep, 0, n - 1);
  const cam = tween(frame, 20, T.end, camEase);

  const TOG_W = 236;
  const togX = WIN.w - PAD - TOG_W;
  const togglePt = { x: WIN.x + togX + 14 + 18, y: WIN.y + HEAD_H / 2 + 4 };
  const hoverPt = {
    x: WIN.x + colX(tt) + BAR_W * 0.6,
    y: WIN.y + yOf(ofFirst(tt) * 0.55),
  };
  const startPt = { x: D.w * 0.86, y: D.h + 40 };
  const leg1 = sp(T.cursorIn, HEAVY);
  const leg2 = sp(T.toHover, HEAVY);
  const arc = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    p: number,
  ) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const bow = Math.sin(clamp(p, 0, 1) * Math.PI) * Math.min(60, d * 0.18);
    return {
      x: lerp(a.x, b.x, p) + (dy / d) * bow,
      y: lerp(a.y, b.y, p) - (dx / d) * bow,
    };
  };
  const cur =
    frame < T.toHover
      ? arc(startPt, togglePt, leg1)
      : arc(togglePt, hoverPt, leg2);
  const press = sp(T.click - 3, CHIP) - sp(T.click + 2, CHIP);
  const cursorScale = 1 - 0.04 * clamp(press, 0, 1.2);
  const cursorA =
    tween(frame, T.cursorIn, T.cursorIn + 6) *
    (1 - tween(frame, T.end - 20, T.end - 10, exitEase));

  const tint = withAlpha(accent, pal.dark ? 0.16 : 0.1);
  const ink = (t: number) => (t > 0.5 ? pal.text : pal.muted);

  const stat = (label: string, val: React.ReactNode, i: number) => {
    const a = tween(frame, 12 + i * 3, 24 + i * 3);
    return (
      <div
        style={{
          paddingLeft: tall && i === 0 ? 0 : 24,
          borderLeft: tall && i === 0 ? "none" : `1px solid ${pal.line}`,
          opacity: a,
          transform: `translateY(${(1 - a) * 8}px)`,
          flex: tall ? 1 : undefined,
        }}
      >
        <div style={{ fontSize: 16, color: pal.muted }}>{label}</div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 300,
            color: pal.text,
            marginTop: 6,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {val}
        </div>
      </div>
    );
  };

  const badgeEl = (size: number) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        height: size * 1.75,
        padding: `0 ${size * 0.55}px 0 ${size * 0.4}px`,
        borderRadius: 8,
        background: pal.greenBg,
        color: pal.green,
        fontSize: size,
        fontVariantNumeric: "tabular-nums",
        opacity: clamp(badge * 2, 0, 1),
        transform: `translateY(${(1 - badge) * 10}px) scale(${0.85 + 0.15 * badge})`,
        transformOrigin: "0% 50%",
        whiteSpace: "nowrap",
      }}
    >
      <Icon name="arrowUp" color={pal.green} size={size} />
      {uplift > 0 ? "+" : ""}
      {uplift}%
    </span>
  );

  const tipW = tall ? 312 : 264;
  const tipX = PLOT.x + PLOT.w - tipW + 8;
  const tipY = tall ? PLOT.y - 8 : PLOT.y - 20;
  const rowH = tall ? 32 : 26;
  const stepV = value(tt);

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        fontWeight: 400,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
        background: pal.dark ? "#03050C" : "#EEF0F6",
      }}
    >
      <GshGround
        preset={ground ?? (pal.dark ? "film-blue" : "glasswork")}
        params={groundParams}
        timeOffset={pal.dark ? 4 : 3}
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
            transformOrigin: `${WIN.x + tipX}px ${WIN.y + tipY + 120}px`,
            transform: `scale(${1 + 0.035 * cam})`,
          }}
        >
          {tall ? (
            <div style={{ position: "absolute", left: 48, top: 92, right: 48 }}>
              <div
                style={{
                  fontSize: 24,
                  color: pal.stageMuted,
                  opacity: tween(frame, 4, 16),
                }}
              >
                Paid conversion · {dateRange.toLowerCase()}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  marginTop: 10,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontSize: 132,
                    fontWeight: 300,
                    letterSpacing: "-0.045em",
                    lineHeight: 1.05,
                    color: pal.stageText,
                    fontVariantNumeric: "tabular-nums",
                    transform: `translateY(${(1 - tween(frame, 6, 20)) * 100}%)`,
                  }}
                >
                  {pct(totalNow)}
                </span>
                {badgeEl(30)}
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
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
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
                  gap: 14,
                  padding: `0 ${PAD}px`,
                  borderBottom: `1px solid ${pal.line}`,
                }}
              >
                <span
                  style={{
                    fontSize: 20,
                    color: pal.text,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {tall ? "Funnel" : title}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 16,
                    color: pal.muted,
                  }}
                >
                  <Icon name="calendar" color={pal.faint} />
                  {dateRange}
                </span>
                <div style={{ flex: 1 }} />
                <div
                  style={{
                    width: TOG_W,
                    height: 40,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "0 14px",
                    borderRadius: 10,
                    background: on
                      ? withAlpha(accent, pal.dark ? 0.14 : 0.07)
                      : "transparent",
                    boxShadow: `inset 0 0 0 1px ${on ? withAlpha(accent, 0.4) : pal.line}`,
                    transform: `scale(${1 - 0.04 * clamp(press, 0, 1.2)})`,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 22,
                      borderRadius: 99,
                      position: "relative",
                      flexShrink: 0,
                      background: on ? accent : pal.knobOff,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 3,
                        left: 3 + 14 * toggleOn,
                        width: 16,
                        height: 16,
                        borderRadius: 99,
                        background: "#fff",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 16, color: pal.text }}>
                    {variantLabel}
                  </span>
                </div>
              </div>

              {!tall ? (
                <div
                  style={{
                    position: "absolute",
                    left: PAD,
                    right: PAD,
                    top: KPI_Y,
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 24,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, color: pal.muted }}>
                      Total conversion
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginTop: 2,
                        overflow: "hidden",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 54,
                          fontWeight: 300,
                          letterSpacing: "-0.04em",
                          color: pal.text,
                          fontVariantNumeric: "tabular-nums",
                          lineHeight: 1.1,
                          transform: `translateY(${(1 - tween(frame, 8, 22)) * 100}%)`,
                        }}
                      >
                        {pct(totalNow)}
                      </span>
                      {badgeEl(18)}
                    </div>
                  </div>
                  <div style={{ flex: 1 }} />
                  {stat("Visits", fmt(value(0)), 0)}
                  {stat("Paying users", fmt(value(n - 1)), 1)}
                  {stat(
                    "Time to pay",
                    morph[n - 1] > 0.5 ? "1d 19h" : "2d 6h",
                    2,
                  )}
                </div>
              ) : (
                <div
                  style={{
                    position: "absolute",
                    left: PAD,
                    right: PAD,
                    top: HEAD_H + 20,
                    display: "flex",
                    gap: 24,
                  }}
                >
                  {stat("Visits", fmt(value(0)), 0)}
                  {stat("Paying users", fmt(value(n - 1)), 1)}
                  {stat(
                    "Time to pay",
                    morph[n - 1] > 0.5 ? "1d 19h" : "2d 6h",
                    2,
                  )}
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  left: PAD,
                  right: PAD,
                  top: CT,
                  height: 1,
                  background: pal.line,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: PAD,
                  right: PAD,
                  top: CT + 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  justifyContent: "flex-end",
                  fontSize: 16,
                  color: pal.muted,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: accent,
                    }}
                  />
                  {on ? variantLabel : "All users"}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: tween(frame, T.morph + 4, T.morph + 14),
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      borderTop: `1.5px dashed ${pal.faint}`,
                    }}
                  />
                  Control
                </span>
              </div>

              <svg
                width={WIN.w}
                height={WIN.h}
                style={{ position: "absolute", left: 0, top: 0 }}
              >
                {[0, 50, 100].map((g) => (
                  <g key={g}>
                    <line
                      x1={PLOT.x}
                      x2={PLOT.x + PLOT.w}
                      y1={yOf(g)}
                      y2={yOf(g)}
                      stroke={pal.line}
                      strokeDasharray={g ? "2 5" : undefined}
                    />
                    <text
                      x={PLOT.x - 14}
                      y={yOf(g) + 5}
                      textAnchor="end"
                      fontSize={15}
                      fill={pal.faint}
                      fontFamily={fontFamily}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {g}%
                    </text>
                  </g>
                ))}
                <rect
                  x={colX(tt) - 12}
                  y={PLOT.y - 6}
                  width={BAR_W + 24}
                  height={yOf(0) - PLOT.y + 6}
                  rx={10}
                  fill={pal.track}
                  opacity={tipA * 0.7}
                />
                {steps.map((st, i) => {
                  const g = grow[i];
                  const x = colX(i);
                  const prev = i === 0 ? 100 : ofFirst(i - 1);
                  const curP = ofFirst(i);
                  const ctrl = (st.control / steps[0].control) * 100;
                  const top = yOf(prev * g);
                  const bar = yOf(curP * g);
                  const dim = i === tt ? 0 : tipA;
                  const ghost =
                    i > 0
                      ? tween(frame, T.morph + 6 + i * 3, T.morph + 16 + i * 3)
                      : 0;
                  return (
                    <g key={st.label}>
                      <rect
                        x={x}
                        y={top}
                        width={BAR_W}
                        height={Math.max(0, bar - top)}
                        rx={6}
                        fill={tint}
                      />
                      <rect
                        x={x}
                        y={bar}
                        width={BAR_W}
                        height={Math.max(0, yOf(0) - bar)}
                        rx={6}
                        fill={accent}
                        opacity={1 - 0.3 * dim}
                      />
                      {ghost > 0 && Math.abs(ctrl - curP) > 0.3 ? (
                        <line
                          x1={x - 8}
                          x2={lerp(x - 8, x + BAR_W + 8, ghost)}
                          y1={yOf(ctrl)}
                          y2={yOf(ctrl)}
                          stroke={pal.dark ? "#FFFFFF" : "#16171A"}
                          strokeOpacity={0.7}
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                        />
                      ) : null}
                    </g>
                  );
                })}
              </svg>

              {steps.map((st, i) => {
                const x = colX(i);
                const lab = tween(
                  frame,
                  T.bars + i * 3 + 6,
                  T.bars + i * 3 + 18,
                );
                return (
                  <div key={st.label}>
                    <div
                      style={{
                        position: "absolute",
                        left: x,
                        width: BAR_W,
                        textAlign: "center",
                        top: yOf(ofFirst(i) * grow[i]) - 30,
                        opacity: lab,
                        fontSize: 16,
                        color: pal.text,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {pct(ofFirst(i))}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: x,
                        top: yOf(0) + 14,
                        opacity: lab,
                        transform: `translateY(${(1 - lab) * 6}px)`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div style={{ fontSize: 17, color: ink(1) }}>
                        {st.label}
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          color: pal.muted,
                          marginTop: 3,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {fmt(value(i))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                position: "absolute",
                left: tipX,
                top: tipY,
                width: tipW,
                opacity: tipA,
                transform: `translateY(${(1 - tip) * 12}px) scale(${0.94 + 0.06 * tip})`,
                transformOrigin: "0% 0%",
                background: pal.tip,
                borderRadius: 14,
                boxShadow: pal.tipShadow,
                padding: tall ? "16px 18px 14px" : "12px 16px 10px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ fontSize: 16, color: pal.muted }}>
                {tt + 1} · {steps[tt].event}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  marginTop: tall ? 6 : 4,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <span
                  style={{
                    fontSize: tall ? 34 : 30,
                    lineHeight: 1.2,
                    fontWeight: 300,
                    color: pal.text,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {fmt(stepV)}
                </span>
                <span style={{ fontSize: 16, color: pal.muted }}>
                  {pct(fromPrev(tt))} of{" "}
                  {steps[Math.max(0, tt - 1)].label.toLowerCase()}
                </span>
              </div>
              <div
                style={{
                  height: 1,
                  background: pal.line,
                  margin: tall ? "14px 0 8px" : "10px 0 6px",
                }}
              />
              {breakdown.map((b, k) => {
                const r = sp(T.tip + 6 + k * 3, CARD);
                return (
                  <div
                    key={b.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      height: rowH,
                      fontSize: 16,
                      color: pal.text,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <span style={{ width: 66 }}>{b.label}</span>
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        background: pal.track,
                      }}
                    >
                      <div
                        style={{
                          width: `${b.share * 100 * clamp(r, 0, 1.04)}%`,
                          height: "100%",
                          borderRadius: 3,
                          background: withAlpha(accent, 1 - k * 0.28),
                        }}
                      />
                    </div>
                    <span
                      style={{
                        width: 52,
                        textAlign: "right",
                        color: pal.muted,
                      }}
                    >
                      {fmt(stepV * b.share)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ opacity: cursorA }}>
            <Cursor x={cur.x} y={cur.y} scale={cursorScale} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
