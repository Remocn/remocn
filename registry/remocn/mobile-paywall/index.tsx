"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
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

export type PaywallIcon = "grid" | "film" | "palette" | "bolt";

export interface PaywallFeature {
  title: string;
  description: string;
  icon?: PaywallIcon;
}

export interface PaywallPlan {
  label: string;
  price: string;
  detail: string;
  /** Shown after "7 days free, then …" when the plan is selected. */
  renews: string;
  badge?: string;
}

export interface MobilePaywallProps {
  appName?: string;
  title?: string;
  features?: PaywallFeature[];
  /** Two plans: the first is the one that gets tapped, the second starts selected. */
  plans?: [PaywallPlan, PaywallPlan];
  cta?: string;
  account?: string;
  /** Trial dates on the confirmation: start, reminder, first charge. */
  dates?: [string, string, string];
  /** Three lines beside the phone: paywall, confirm, welcome. */
  lines?: [string, string, string];
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_FEATURES: PaywallFeature[] = [
  {
    title: "Every component, unlocked",
    description: "200+ animations, transitions and scenes",
    icon: "grid",
  },
  {
    title: "4K, 60fps export",
    description: "Crisp launch videos for every channel",
    icon: "film",
  },
  {
    title: "Brand kits",
    description: "Your fonts, colors and logo, everywhere",
    icon: "palette",
  },
  {
    title: "Priority renders",
    description: "Skip the queue on every export",
    icon: "bolt",
  },
];

const DEFAULT_PLANS: [PaywallPlan, PaywallPlan] = [
  {
    label: "Yearly",
    price: "$59.99/yr",
    detail: "$5.00/mo, billed yearly",
    renews: "$59.99/year",
    badge: "Save 37%",
  },
  {
    label: "Monthly",
    price: "$7.99/mo",
    detail: "Billed monthly",
    renews: "$7.99/month",
  },
];

const ICONS: Record<PaywallIcon, string> = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  film: "M3 5h18v14H3zM7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4",
  palette:
    "M12 3a9 9 0 100 18c1 0 1.5-.7 1.5-1.5 0-.9-.7-1.2-.7-2 0-.8.7-1.5 1.5-1.5H17a4 4 0 004-4c0-5-4-9-9-9zM7.5 11.5h.01M10.5 7.5h.01M15 7.5h.01",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
};

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const SW = 393;
const SH = 852;
const BEZEL = 11;
const BW = SW + BEZEL * 2;
const BH = SH + BEZEL * 2;
const SHEET_TOP = 58;
const PAD = 22;
const CW = SW - PAD * 2;
const CARD_W = (CW - 10) / 2;
const PLANS_Y = 562;
const CTA_Y = 694;

const SHEET_AT = 4;
const TAP_IN = 50;
const TAP1 = 66;
const TAP2 = 100;
const PAY_AT = 108;
const DC1 = 138;
const DC2 = 146;
const CHECK_AT = 156;
const DISMISS = 180;
const WELCOME = 186;

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

const LIGHT_PAL = {
  sheet: "#ffffff",
  behind: "#c8c8ce",
  text: "#121215",
  muted: "#6c6c74",
  ring: "rgba(18,18,21,0.1)",
  hair: "rgba(18,18,21,0.08)",
  chip: "#f2f2f4",
  ctaBg: "#121215",
  ctaText: "#ffffff",
  pay: "#ffffff",
  copy: "#121215",
  frame:
    "linear-gradient(155deg,#f1f1f3 0%,#c4c4ca 30%,#e2e2e6 62%,#b3b3ba 100%)",
  shadow:
    "0 50px 90px -24px rgba(30,32,44,0.32), 0 14px 30px -10px rgba(30,32,44,0.18)",
  dark: false,
};
const DARK_PAL: typeof LIGHT_PAL = {
  sheet: "#0d0d10",
  behind: "#2a2a2f",
  text: "#f4f4f6",
  muted: "#8d8d96",
  ring: "rgba(255,255,255,0.12)",
  hair: "rgba(255,255,255,0.08)",
  chip: "#1c1c20",
  ctaBg: "#f4f4f6",
  ctaText: "#111113",
  pay: "#1a1a1d",
  copy: "#f4f4f6",
  frame:
    "linear-gradient(155deg,#55565c 0%,#2a2b2f 30%,#3d3e43 62%,#1f2023 100%)",
  shadow:
    "0 50px 100px -20px rgba(0,0,0,0.7), 0 18px 36px -12px rgba(0,0,0,0.5)",
  dark: true,
};
type Palette = typeof LIGHT_PAL;

function withAlpha(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (x) => x + x) : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function Glyph({
  d,
  size = 18,
  color,
  sw = 1.5,
}: {
  d: string;
  size?: number;
  color: string;
  sw?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d={d}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AppTile({ size, accent }: { size: number; accent: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        background: accent,
        boxShadow: `inset 0 0 0 0.5px rgba(255,255,255,0.22), inset 0 1px 0 rgba(255,255,255,0.2), 0 ${size * 0.12}px ${size * 0.3}px -${size * 0.08}px rgba(0,0,0,0.3)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 124.06 134.26" height={size * 0.42} aria-hidden>
        <path fill="#fff" d={REMOCN_R_PATH} />
      </svg>
    </div>
  );
}

function StatusBar({ color }: { color: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 54,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 30px 0 34px",
        zIndex: 8,
      }}
    >
      <span
        style={{
          fontSize: 17,
          color,
          width: 54,
          textAlign: "center",
        }}
      >
        9:41
      </span>
      <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
        <svg width="18" height="12" viewBox="0 0 18 12">
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={i * 4.6}
              y={9 - i * 3}
              width={3.2}
              height={3 + i * 3}
              rx={0.8}
              fill={color}
            />
          ))}
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12">
          <path
            d="M8 11.2l2.3-2.6a3.3 3.3 0 00-4.6 0zM3.6 6.4a6.3 6.3 0 018.8 0l1.4-1.6a8.4 8.4 0 00-11.6 0zM.6 3.1a10.6 10.6 0 0114.8 0L16.8 1.5a12.7 12.7 0 00-17.6 0z"
            fill={color}
          />
        </svg>
        <div
          style={{
            width: 25,
            height: 12,
            borderRadius: 3.5,
            border: `1px solid ${color}`,
            padding: 1.5,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "78%",
              height: "100%",
              borderRadius: 2,
              background: color,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Phone({
  children,
  sidePress,
  c,
}: {
  children: React.ReactNode;
  sidePress: number;
  c: Palette;
}) {
  const btn = (side: "left" | "right", top: number, h: number, dx = 0) => (
    <div
      style={{
        position: "absolute",
        [side]: -3 + dx,
        top,
        width: 4,
        height: h,
        borderRadius: 2,
        background: c.frame,
      }}
    />
  );
  return (
    <div style={{ position: "relative", width: BW, height: BH }}>
      {btn("left", 150, 32)}
      {btn("left", 210, 62)}
      {btn("left", 284, 62)}
      {btn("right", 236, 98, sidePress * 1.6)}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 68,
          background: c.frame,
          boxShadow: `${c.shadow}, inset 0 0 0 1px rgba(255,255,255,0.22)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 3.5,
          borderRadius: 64.5,
          background: "#050506",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: BEZEL,
          top: BEZEL,
          width: SW,
          height: SH,
          borderRadius: 56,
          overflow: "hidden",
          background: "#000",
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            top: 11,
            left: (SW - 126) / 2,
            width: 126,
            height: 37,
            borderRadius: 19,
            background: "#000",
            zIndex: 20,
          }}
        />
      </div>
    </div>
  );
}

function Radio({ on, accent, c }: { on: number; accent: string; c: Palette }) {
  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        boxShadow: `inset 0 0 0 1.5px ${c.ring}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          background: accent,
          transform: `scale(${on})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Glyph d="M6 12.5l4 4 8-9" size={14} color="#fff" sw={2} />
      </div>
    </div>
  );
}

export function MobilePaywall({
  appName = "remocn Pro",
  title = "Ship launch videos in minutes",
  features = DEFAULT_FEATURES,
  plans = DEFAULT_PLANS,
  cta = "Start free for 7 days",
  account = "maya@kitebase.dev",
  dates = ["Nov 2", "Nov 7", "Nov 9"],
  lines = [
    "Pro, one tap away.",
    "Double-click to confirm.",
    "Seven days, on us.",
  ],
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
  ground,
  groundParams,
}: MobilePaywallProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = frame * speed;
  const c = theme === "dark" ? DARK_PAL : LIGHT_PAL;
  const tall = height > width;
  const W = tall ? 720 : 1280;
  const H = tall ? 1280 : 720;
  const u = Math.min(width / W, height / H);
  const k = tall ? (H * 0.74) / BH : (H * 0.94) / BH;
  const phoneCx = tall ? W / 2 : W * 0.665;
  const phoneCy = tall ? H - 36 - (BH * k) / 2 : H / 2;

  const sp = (at: number, config: typeof CARD | typeof MORPH = CARD) =>
    spring({ frame: f - at, fps, config });
  const pressAt = (at: number) =>
    spring({ frame: f - at, fps, config: CHIP }) -
    spring({ frame: f - at - 4, fps, config: CHIP });

  const rise = spring({ frame: f, fps, config: HEAVY });
  const sheetIn = sp(SHEET_AT, HEAVY);
  const hero = sp(10, CHIP);
  const titleIn = interpolate(f, [12, 26], [0, 1], { ...clamp, easing: ENTER });
  const featIn = features.map((_, i) => sp(16 + i * 3));
  const plansIn = [sp(26), sp(29)];
  const ctaIn = sp(32);

  const sel = sp(TAP1 + 1, MORPH);
  const ctaPress = pressAt(TAP2);

  const keys = [
    { t: TAP_IN, x: 300, y: 800 },
    { t: TAP1 - 1, x: PAD + CARD_W / 2, y: PLANS_Y + 50 },
    { t: TAP1 + 10, x: PAD + CARD_W / 2 + 6, y: PLANS_Y + 56 },
    { t: TAP2 - 1, x: SW / 2, y: CTA_Y + 28 },
  ];
  let tap = { x: keys[0].x, y: keys[0].y };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f >= a.t) {
      const e = MOVE(Math.min(1, Math.max(0, (f - a.t) / (b.t - a.t))));
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const lift = Math.sin(Math.PI * e) * Math.min(36, dist * 0.2);
      const nx = dist ? -(b.y - a.y) / dist : 0;
      const ny = dist ? (b.x - a.x) / dist : 0;
      tap = {
        x: a.x + (b.x - a.x) * e + nx * lift,
        y: a.y + (b.y - a.y) * e + ny * lift,
      };
    }
  }
  const tapOpacity = interpolate(
    f,
    [TAP_IN, TAP_IN + 6, TAP2 + 6, TAP2 + 11],
    [0, 1, 1, 0],
    clamp,
  );
  const tapScale = 1 - 0.14 * Math.max(pressAt(TAP1), pressAt(TAP2));

  const pay = sp(PAY_AT, HEAVY);
  const away = spring({
    frame: f - DISMISS,
    fps,
    config: MORPH,
    durationInFrames: 14,
  });
  const sidePress = Math.max(pressAt(DC1), pressAt(DC2));
  const hintOn = f >= PAY_AT + 8 && f < DC2 + 5;
  const hintPulse = hintOn ? 0.55 + 0.45 * Math.sin((f - PAY_AT) / 3.2) : 0;
  const hintIn = spring({ frame: f - PAY_AT - 8, fps, config: CARD });
  const processing = f >= DC2 + 2 && f < CHECK_AT;
  const check = interpolate(f, [CHECK_AT, CHECK_AT + 14], [0, 1], {
    ...clamp,
    easing: LIGHT,
  });
  const done = f >= CHECK_AT;

  const out = interpolate(f, [DISMISS, DISMISS + 8], [1, 0], {
    ...clamp,
    easing: EXIT,
  });
  const wIcon = sp(WELCOME);
  const wBadge = sp(WELCOME + 8, CHIP);
  const wTitle = interpolate(f, [WELCOME + 4, WELCOME + 18], [0, 1], {
    ...clamp,
    easing: ENTER,
  });
  const wSub = interpolate(f, [WELCOME + 7, WELCOME + 21], [0, 1], {
    ...clamp,
    easing: ENTER,
  });
  const wRows = [0, 1, 2].map((i) => sp(WELCOME + 10 + i * 4));
  const wRail = interpolate(f, [WELCOME + 12, WELCOME + 30], [0, 1], {
    ...clamp,
    easing: MOVE,
  });
  const wCta = sp(WELCOME + 16);
  const camera = interpolate(f, [0, 250], [1, 1.035], {
    ...clamp,
    easing: CAMERA,
  });

  const enter = (v: number, dy = 10): React.CSSProperties => ({
    opacity: Math.min(1, v * 1.4),
    transform: `translateY(${(1 - v) * dy}px)`,
  });
  const abs = (top: number): React.CSSProperties => ({
    position: "absolute",
    left: PAD,
    width: CW,
    top: top - SHEET_TOP,
  });

  const beats = [0, PAY_AT, WELCOME];
  const copyLine = (i: number) => {
    const inAt = beats[i] + (i === 0 ? 8 : 0);
    const outAt = beats[i + 1];
    const pin = interpolate(f, [inAt, inAt + 14], [0, 1], {
      ...clamp,
      easing: ENTER,
    });
    const pout =
      outAt === undefined
        ? 0
        : interpolate(f, [outAt - 2, outAt + 6], [0, 1], {
            ...clamp,
            easing: EXIT,
          });
    if (pin <= 0 || pout >= 1) return null;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          transform: `translateY(${(1 - pin) * 70 - pout * 50}%)`,
          opacity: pin * (1 - pout),
        }}
      >
        {lines[i]}
      </div>
    );
  };

  const timeline: [string, string, string][] = [
    [dates[0], "Today", "Every Pro feature is unlocked"],
    [dates[1], "Reminder", "We’ll nudge you two days before"],
    [dates[2], "Trial ends", `Billed ${plans[0].renews}, cancel anytime`],
  ];

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={ground ?? (c.dark ? "flood" : "glasswork")}
        params={
          groundParams ??
          (c.dark || ground
            ? undefined
            : { colors: ["#a9bbff", "#3552ff", "#1a2a9e", "#7f9bff"] })
        }
        timeOffset={c.dark ? 3 : 8}
        timeScale={0.35}
      />
      <AbsoluteFill
        style={{
          background: c.dark ? "rgba(2,3,8,0.25)" : "rgba(240,241,245,0.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: (width - W * u) / 2,
          top: (height - H * u) / 2,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `scale(${u})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: tall ? 56 : 92,
            top: tall ? 88 : H / 2 - 80,
            width: tall ? W - 112 : 500,
            height: 160,
            fontSize: tall ? 60 : 72,
            fontWeight: 300,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            color: c.copy,
            overflow: "hidden",
            textWrap: "balance",
          }}
        >
          {[0, 1, 2].map((i) => copyLine(i))}
        </div>
        <div
          style={{
            position: "absolute",
            left: phoneCx - BW / 2,
            top: phoneCy - BH / 2,
            width: BW,
            height: BH,
            transform: `translateY(${(1 - rise) * H * 0.9}px) scale(${k * camera})`,
          }}
        >
          <Phone sidePress={sidePress} c={c}>
            <StatusBar color="#fff" />
            <div
              style={{
                position: "absolute",
                top: 47,
                left: 14,
                right: 14,
                height: 60,
                borderRadius: 12,
                background: c.behind,
                opacity: sheetIn,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: SHEET_TOP,
                bottom: 0,
                borderRadius: "14px 14px 0 0",
                background: c.sheet,
                color: c.text,
                overflow: "hidden",
                transform: `translateY(${(1 - sheetIn) * SH}px)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: out,
                  transform: `scale(${0.96 + out * 0.04})`,
                }}
              >
                <div
                  style={{
                    ...abs(74),
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      background: c.chip,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Glyph
                      d="M7 7l10 10M17 7L7 17"
                      size={15}
                      color={c.muted}
                      sw={2}
                    />
                  </div>
                  <span style={{ fontSize: 15, color: c.muted }}>Restore</span>
                </div>
                <div
                  style={{
                    ...abs(112),
                    display: "flex",
                    opacity: Math.min(1, hero * 1.5),
                    transform: `scale(${0.8 + hero * 0.2})`,
                    transformOrigin: "0 50%",
                  }}
                >
                  <AppTile size={64} accent={accent} />
                </div>
                <div
                  style={{
                    ...abs(196),
                    fontSize: 34,
                    fontWeight: 300,
                    letterSpacing: "-0.035em",
                    lineHeight: 1.08,
                    textWrap: "balance",
                    paddingRight: 30,
                    boxSizing: "border-box",
                    ...enter(titleIn, 16),
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    ...abs(298),
                    height: 1,
                    background: c.hair,
                    opacity: featIn[0],
                  }}
                />
                {features.slice(0, 4).map((ft, i) => (
                  <div
                    key={ft.title}
                    style={{
                      ...abs(316 + i * 52),
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      fontSize: 17,
                      ...enter(featIn[i], 12),
                    }}
                  >
                    <Glyph
                      d={ICONS[ft.icon ?? "grid"]}
                      size={22}
                      color={c.text}
                    />
                    {ft.title}
                  </div>
                ))}
                {plans.map((pl, i) => {
                  const on = i === 0 ? sel : 1 - sel;
                  const press = i === 0 ? pressAt(TAP1) : 0;
                  return (
                    <div
                      key={pl.label}
                      style={{
                        position: "absolute",
                        left: PAD + i * (CARD_W + 10),
                        top: PLANS_Y - SHEET_TOP,
                        width: CARD_W,
                        height: 96,
                        borderRadius: 16,
                        background: withAlpha(
                          accent,
                          (c.dark ? 0.12 : 0.05) * on,
                        ),
                        boxShadow: `inset 0 0 0 ${1 + on * 0.5}px ${on > 0.5 ? accent : c.ring}`,
                        padding: "16px 14px",
                        boxSizing: "border-box",
                        fontVariantNumeric: "tabular-nums",
                        opacity: Math.min(1, plansIn[i] * 1.4),
                        transform: `translateY(${(1 - plansIn[i]) * 16}px) scale(${1 - press * 0.04})`,
                      }}
                    >
                      {pl.badge ? (
                        <div
                          style={{
                            position: "absolute",
                            top: -10,
                            right: 12,
                            height: 20,
                            padding: "0 7px",
                            borderRadius: 6,
                            background: on > 0.5 ? accent : c.text,
                            color: on > 0.5 ? "#fff" : c.sheet,
                            fontSize: 13,
                            lineHeight: "20px",
                          }}
                        >
                          {pl.badge}
                        </div>
                      ) : null}
                      <div style={{ position: "absolute", right: 12, top: 16 }}>
                        <Radio on={on} accent={accent} c={c} />
                      </div>
                      <div style={{ fontSize: 15, color: c.muted }}>
                        {pl.label}
                      </div>
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 300,
                          letterSpacing: "-0.02em",
                          marginTop: 4,
                        }}
                      >
                        {pl.price}
                      </div>
                      <div
                        style={{ fontSize: 13, color: c.muted, marginTop: 2 }}
                      >
                        {pl.detail}
                      </div>
                    </div>
                  );
                })}
                <div
                  style={{
                    ...abs(668),
                    height: 18,
                    fontSize: 14,
                    color: c.muted,
                    textAlign: "center",
                    opacity: Math.min(1, ctaIn * 1.4),
                  }}
                >
                  {plans.map((pl, i) => {
                    const o = i === 0 ? sel : 1 - sel;
                    return (
                      <div
                        key={pl.label}
                        style={{
                          position: "absolute",
                          inset: 0,
                          opacity: o,
                          transform: `translateY(${(1 - o) * (i === 0 ? 8 : -8)}px)`,
                        }}
                      >
                        7 days free, then{" "}
                        <span style={{ color: c.text }}>{pl.renews}</span>
                      </div>
                    );
                  })}
                </div>
                <div
                  style={{
                    ...abs(CTA_Y),
                    height: 56,
                    borderRadius: 28,
                    background: c.ctaBg,
                    color: c.ctaText,
                    fontSize: 17,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: Math.min(1, ctaIn * 1.4),
                    transform: `translateY(${(1 - ctaIn) * 16}px) scale(${1 - ctaPress * 0.04})`,
                  }}
                >
                  {cta}
                </div>
                <div
                  style={{
                    ...abs(764),
                    textAlign: "center",
                    fontSize: 14,
                    color: c.muted,
                    opacity: ctaIn,
                  }}
                >
                  Cancel anytime · Terms · Privacy
                </div>
              </div>

              {f >= WELCOME - 2 ? (
                <div style={{ position: "absolute", inset: 0 }}>
                  <div
                    style={{
                      ...abs(164),
                      opacity: Math.min(1, wIcon * 1.5),
                      transform: `scale(${0.85 + wIcon * 0.15})`,
                      transformOrigin: "0 50%",
                    }}
                  >
                    <div style={{ position: "relative", width: 72 }}>
                      <AppTile size={72} accent={accent} />
                      <div
                        style={{
                          position: "absolute",
                          right: -8,
                          bottom: -8,
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          background: "#1f9d55",
                          boxShadow: `0 0 0 3px ${c.sheet}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transform: `scale(${wBadge})`,
                        }}
                      >
                        <Glyph
                          d="M6 12.5l4 4 8-9"
                          size={16}
                          color="#fff"
                          sw={2}
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      ...abs(266),
                      fontSize: 34,
                      fontWeight: 300,
                      letterSpacing: "-0.035em",
                      ...enter(wTitle, 16),
                    }}
                  >
                    Welcome to Pro
                  </div>
                  <div
                    style={{
                      ...abs(312),
                      fontSize: 16,
                      lineHeight: 1.4,
                      color: c.muted,
                      textWrap: "pretty",
                      ...enter(wSub, 12),
                    }}
                  >
                    Your free week starts now. Here’s how it works.
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: PAD + 10.25,
                      top: 412 - SHEET_TOP,
                      width: 1.5,
                      height: 148 * wRail,
                      background: `linear-gradient(${accent}, ${c.hair})`,
                    }}
                  />
                  {timeline.map(([date, head, body], i) => (
                    <div
                      key={head}
                      style={{
                        ...abs(400 + i * 74),
                        display: "flex",
                        gap: 16,
                        ...enter(wRows[i], 14),
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          flexShrink: 0,
                          background: i === 0 ? accent : c.sheet,
                          boxShadow:
                            i === 0 ? "none" : `inset 0 0 0 1.5px ${c.ring}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 1,
                        }}
                      >
                        {i === 0 ? (
                          <Glyph
                            d="M6 12.5l4 4 8-9"
                            size={13}
                            color="#fff"
                            sw={2}
                          />
                        ) : null}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 17,
                          }}
                        >
                          {head}
                          <span
                            style={{
                              fontSize: 15,
                              color: c.muted,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {date}
                          </span>
                        </div>
                        <div
                          style={{ fontSize: 15, color: c.muted, marginTop: 3 }}
                        >
                          {body}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div
                    style={{
                      ...abs(CTA_Y),
                      height: 56,
                      borderRadius: 28,
                      background: accent,
                      color: "#fff",
                      fontSize: 17,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ...enter(wCta, 24),
                    }}
                  >
                    Start creating
                  </div>
                </div>
              ) : null}
            </div>

            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#000",
                opacity: 0.5 * Math.max(0, pay - away),
                zIndex: 10,
              }}
            />
            {hintOn ? (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 225,
                  height: 98,
                  zIndex: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "0 10px 0 18px",
                  borderRadius: "22px 0 0 22px",
                  background: "rgba(28,28,30,0.94)",
                  boxShadow:
                    "inset 0 0 0 0.5px rgba(255,255,255,0.12), 0 8px 24px rgba(0,0,0,0.35)",
                  opacity:
                    Math.min(1, hintIn * 1.5) *
                    interpolate(f, [DC2, DC2 + 5], [1, 0], {
                      ...clamp,
                      easing: EXIT,
                    }),
                  transform: `translateX(${(1 - hintIn) * 40}px)`,
                }}
              >
                <div
                  style={{
                    textAlign: "right",
                    color: "#fff",
                    fontSize: 15,
                    lineHeight: 1.3,
                  }}
                >
                  Double Click
                  <br />
                  to Subscribe
                </div>
                <div
                  style={{
                    width: 4,
                    height: 74,
                    borderRadius: 2,
                    background: "#fff",
                    opacity: 0.35 + hintPulse * 0.65,
                    transform: `translateX(${sidePress * 2}px)`,
                  }}
                />
              </div>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: 8,
                right: 8,
                bottom: 8,
                height: 404,
                borderRadius: 48,
                background: c.pay,
                fontVariantNumeric: "tabular-nums",
                color: c.text,
                zIndex: 11,
                padding: "22px 24px",
                boxSizing: "border-box",
                transform: `translateY(${(1 - pay) * 430 + away * 440}px)`,
                boxShadow: c.dark
                  ? "inset 0 1px 0 rgba(255,255,255,0.06)"
                  : "0 -4px 30px rgba(0,0,0,0.16)",
                opacity: f >= PAY_AT ? 1 : 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <AppTile size={44} accent={accent} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17 }}>{appName}</div>
                  <div style={{ fontSize: 14, color: c.muted, marginTop: 1 }}>
                    {plans[0].label} subscription
                  </div>
                </div>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    background: c.chip,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Glyph
                    d="M7 7l10 10M17 7L7 17"
                    size={13}
                    color={c.muted}
                    sw={2}
                  />
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                {[
                  ["Free trial", "7 days"],
                  ["Then", plans[0].renews],
                  ["First charge", `${dates[2]}, 2026`],
                  ["Account", account],
                ].map(([kk, v]) => (
                  <div
                    key={kk}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      height: 42,
                      boxShadow: `inset 0 1px 0 ${c.hair}`,
                      fontSize: 15,
                    }}
                  >
                    <span style={{ color: c.muted }}>{kk}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 30,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div style={{ position: "relative", width: 50, height: 50 }}>
                  {done ? (
                    <svg width={50} height={50} viewBox="0 0 50 50">
                      <circle
                        cx={25}
                        cy={25}
                        r={22}
                        fill="none"
                        stroke={accent}
                        strokeWidth={2}
                        pathLength={1}
                        strokeDasharray={1}
                        strokeDashoffset={1 - check}
                        transform="rotate(-90 25 25)"
                      />
                      <path
                        d="M15 25.5l7 7 13-14"
                        fill="none"
                        stroke={accent}
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        pathLength={1}
                        strokeDasharray={1}
                        strokeDashoffset={
                          1 - interpolate(check, [0.4, 1], [0, 1], clamp)
                        }
                      />
                    </svg>
                  ) : processing ? (
                    <svg
                      width={50}
                      height={50}
                      viewBox="0 0 50 50"
                      style={{ transform: `rotate(${f * 14}deg)` }}
                    >
                      <circle
                        cx={25}
                        cy={25}
                        r={20}
                        fill="none"
                        stroke={c.hair}
                        strokeWidth={2.5}
                      />
                      <circle
                        cx={25}
                        cy={25}
                        r={20}
                        fill="none"
                        stroke={accent}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeDasharray="34 200"
                      />
                    </svg>
                  ) : (
                    <svg width={50} height={50} viewBox="0 0 50 50">
                      <rect
                        x={14}
                        y={6}
                        width={20}
                        height={38}
                        rx={6}
                        fill="none"
                        stroke={c.text}
                        strokeWidth={1.5}
                      />
                      <rect
                        x={35 + sidePress * -1.5}
                        y={14}
                        width={3.5}
                        height={11}
                        rx={1.5}
                        fill={accent}
                        opacity={0.5 + hintPulse * 0.5}
                      />
                    </svg>
                  )}
                </div>
                <div style={{ fontSize: 15 }}>
                  {done
                    ? "Done"
                    : processing
                      ? "Processing…"
                      : "Confirm with side button"}
                </div>
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: tap.x - 22,
                top: tap.y - 22,
                width: 44,
                height: 44,
                borderRadius: 22,
                background: "rgba(40,40,48,0.24)",
                boxShadow:
                  "inset 0 0 0 1.5px rgba(255,255,255,0.85), 0 4px 14px rgba(0,0,0,0.22)",
                opacity: tapOpacity,
                transform: `scale(${tapScale})`,
                zIndex: 15,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: (SW - 136) / 2,
                width: 136,
                height: 5,
                borderRadius: 3,
                background: c.dark ? "#fff" : "#111",
                zIndex: 16,
              }}
            />
          </Phone>
        </div>
      </div>
    </AbsoluteFill>
  );
}
