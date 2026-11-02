"use client";

import { loadFont } from "@remotion/google-fonts/Onest";
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

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface HomeWidgetProps {
  appName?: string;
  widgetName?: string;
  widgetDescription?: string;
  /** Size the user picks in the gallery and drops on the home screen. */
  size?: "small" | "medium";
  /** Headline number: counts from `from` to `to` once the widget is live. */
  stat?: { label: string; from: number; to: number; delta: string };
  /** Seven daily values for the bar chart; the last bar is today and grows live. */
  bars?: number[];
  accent?: string;
  speed?: number;
  /** `light` is a daytime wallpaper with light widgets; `dark` is dusk. */
  theme?: "light" | "dark";
  /** Off-device lines, one per beat: edit mode, gallery, live widget. */
  lines?: [string, string, string];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const SW = 390;
const SH = 844;
const BEZEL = 12;
const BW = SW + BEZEL * 2;
const BH = SH + BEZEL * 2;

const ICON = 62;
const COL0 = 27;
const COL = 88;
const ROW0 = 74;
const ROW = 94;
const WH = ROW + ICON;
const SIZES = {
  small: { w: COL + ICON, h: WH },
  medium: { w: COL * 3 + ICON, h: WH },
};
const SHEET_TOP = 54;
const PREVIEW_Y = 236;

const T_HOLD = 30;
const T_JIG = 46;
const T_PLUS = 66;
const T_ROW = 100;
const T_SWIPE = 122;
const T_SWIPE_UP = 132;
const T_ADD = 158;
const T_DONE = 198;
const T_LIVE = 206;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const glide = Easing.bezier(0.65, 0, 0.35, 1);
const camera = Easing.bezier(0.87, 0, 0.13, 1);
const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const sheetEase = Easing.bezier(0.32, 0.72, 0, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const exitEase = Easing.bezier(0.55, 0, 1, 0.45);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };

const LIGHT = {
  stage: "rgba(244,243,240,0.24)",
  copy: "#16171a",
  copyMuted: "rgba(22,23,26,0.5)",
  sky: ["#3d7fd6", "#6fa6e4", "#a9cdee", "#e8f0f4"],
  ridges: ["#8eaacb", "#6a8db5", "#4a6f9b", "#2f5280"],
  sun: "#fff8e6",
  widget: "#ffffff",
  text: "#111113",
  muted: "#8a8a8e",
  barIdle: "#e3e3e8",
  sheet: "#f2f2f7",
  group: "#ffffff",
  field: "rgba(118,118,128,0.12)",
  hair: "rgba(60,60,67,0.14)",
  blue: "#007AFF",
  badge: "rgba(235,235,240,0.92)",
  badgeInk: "#3a3a3c",
  chrome: "rgba(255,255,255,0.32)",
  phoneShadow:
    "0 40px 80px rgba(30,32,40,0.2), 0 12px 28px rgba(30,32,40,0.12), 0 2px 6px rgba(30,32,40,0.08)",
};
const DARK: typeof LIGHT = {
  stage: "rgba(6,4,4,0.3)",
  copy: "#f4f1ee",
  copyMuted: "rgba(244,241,238,0.5)",
  sky: ["#0d1530", "#2a2f5c", "#7a4e74", "#e09a7a"],
  ridges: ["#3b3a63", "#2a2b4c", "#1b1c36", "#11122a"],
  sun: "#ffd2a8",
  widget: "#232325",
  text: "#f5f5f7",
  muted: "#8d8d93",
  barIdle: "#3a3a3c",
  sheet: "#121214",
  group: "#232325",
  field: "rgba(118,118,128,0.24)",
  hair: "rgba(255,255,255,0.1)",
  blue: "#0A84FF",
  badge: "rgba(72,72,74,0.94)",
  badgeInk: "#f5f5f7",
  chrome: "rgba(255,255,255,0.2)",
  phoneShadow: "0 40px 90px rgba(0,0,0,0.55), 0 12px 30px rgba(0,0,0,0.4)",
};
type Palette = typeof LIGHT;

const PATH = {
  remocn:
    "M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v11a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 17.5zM10 9v6l5-3z",
  search: "M10.5 4a6.5 6.5 0 110 13 6.5 6.5 0 010-13zM20 20l-4.8-4.8",
  chevron: "M9 6l6 6-6 6",
  back: "M15 18l-6-6 6-6",
  plus: "M12 5v14M5 12h14",
  sun: "M12 8a4 4 0 110 8 4 4 0 010-8zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4",
  play: "M8 5.5v13l10-6.5z",
  skip: "M6 6v12l8.5-6zM18 6v12",
};

interface AppDef {
  name: string;
  bg: [string, string];
  d: string;
}
const APPS: AppDef[] = [
  {
    name: "Orbitly",
    bg: ["#ff7a59", "#f0473c"],
    d: "M5 7h14v12H5zM5 11h14M9 4v4M15 4v4",
  },
  {
    name: "Lumen",
    bg: ["#5d6370", "#2f333b"],
    d: "M12 9a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM4 8h16v11H4z",
  },
  {
    name: "Fernway",
    bg: ["#3fcf8e", "#1c9a63"],
    d: "M12 21s6-5.4 6-10.5a6 6 0 00-12 0C6 15.6 12 21 12 21zM12 8.5a2 2 0 110 4 2 2 0 010-4z",
  },
  {
    name: "Halcyon",
    bg: ["#5ab8ff", "#2f7fe8"],
    d: "M12 5v2M5 12H3M7 7L5.6 5.6M17 7l1.4-1.4M8 15.5a4.5 4.5 0 118 0M5 18.5h14",
  },
  {
    name: "Tessel",
    bg: ["#ffd65a", "#f5b52e"],
    d: "M7 4h10v16H7zM10 9h4M10 13h4",
  },
  {
    name: "Kitebase",
    bg: ["#4c8dff", "#2759e0"],
    d: "M4 7h16v10H4zM4 7l8 6 8-6",
  },
  {
    name: "Quarry",
    bg: ["#7b86a6", "#4b5470"],
    d: "M4 7.5A1.5 1.5 0 015.5 6H10l2 2h6.5A1.5 1.5 0 0120 9.5v8a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17.5z",
  },
  { name: "Pulse", bg: ["#ff6f91", "#e43f6f"], d: "M3 12h4l2-5 4 10 2-5h6" },
  {
    name: "Chord",
    bg: ["#ff8e5e", "#ef5b3b"],
    d: "M9 18V6l10-2v12M9 18a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 16a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
  },
  {
    name: "Ledger",
    bg: ["#2fbf8f", "#14795a"],
    d: "M5 18V10M10 18V6M15 18v-5M20 18V8",
  },
  {
    name: "Atlas",
    bg: ["#53c7d9", "#2a8fb0"],
    d: "M12 3a9 9 0 110 18 9 9 0 010-18zM3 12h18M12 3c2.5 2.6 3.6 5.6 3.6 9s-1.1 6.4-3.6 9c-2.5-2.6-3.6-5.6-3.6-9s1.1-6.4 3.6-9z",
  },
  {
    name: "Tally",
    bg: ["#3a3a40", "#1c1c20"],
    d: "M6 4h12v16H6zM9 8h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01",
  },
  {
    name: "Relay",
    bg: ["#5ee07a", "#2fb350"],
    d: "M12 4c4.4 0 8 3 8 6.8s-3.6 6.7-8 6.7c-1 0-2-.1-2.9-.4L5 19l1-3.6C4.8 14.2 4 12.6 4 10.8 4 7 7.6 4 12 4z",
  },
  {
    name: "Clockwork",
    bg: ["#2a2a2e", "#111114"],
    d: "M12 4a8 8 0 110 16 8 8 0 010-16zM12 8v4l3 2",
  },
  {
    name: "Frame",
    bg: ["#ffb34d", "#f07f2b"],
    d: "M4 6h16v12H4zM4 15l5-4 4 3 3-2 4 3",
  },
];
const DOCK: AppDef[] = [
  {
    name: "Call",
    bg: ["#5ee07a", "#2fb350"],
    d: "M6.5 4h3l1.5 4-2 1.5a10 10 0 005.5 5.5L16 13l4 1.5v3a2 2 0 01-2 2A15 15 0 014.5 6a2 2 0 012-2z",
  },
  APPS[12],
  APPS[10],
  APPS[8],
];
const LIST = [
  "Chord",
  "Fernway",
  "Halcyon",
  "Kitebase",
  "Ledger",
  "remocn",
  "Tessel",
];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function Glyph({
  d,
  size = 24,
  color,
  sw = 1.8,
  fill = "none",
}: {
  d: string;
  size?: number;
  color: string;
  sw?: number;
  fill?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d={d}
        fill={fill}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AppTile({ app, size }: { app: AppDef; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.225,
        background: `linear-gradient(180deg, ${app.bg[0]}, ${app.bg[1]})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Glyph d={app.d} size={size * 0.52} color="#ffffff" sw={1.7} />
    </div>
  );
}

function StatusIcons({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
      <svg width="17" height="12" viewBox="0 0 17 12">
        <path
          d="M8.5 11.5l2.4-2.9a3.6 3.6 0 00-4.8 0zM3.7 6.2a7 7 0 019.6 0l1.6-1.9a9.6 9.6 0 00-12.8 0zM.5 2.9a12 12 0 0116 0"
          fill={color}
          stroke={color}
          strokeWidth={0.6}
        />
      </svg>
      <div
        style={{
          width: 26,
          height: 12.5,
          borderRadius: 4,
          border: `1px solid ${color}`,
          padding: 1.5,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "80%",
            height: "100%",
            borderRadius: 2,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const side = (s: "left" | "right", top: number, h: number) => (
    <div
      style={{
        position: "absolute",
        [s]: -2.5,
        top,
        width: 4,
        height: h,
        borderRadius: 2,
        background: "linear-gradient(90deg,#6f6f75,#d6d6db 50%,#6f6f75)",
      }}
    />
  );
  return (
    <div style={{ position: "relative", width: BW, height: BH }}>
      {side("left", 168, 30)}
      {side("left", 226, 60)}
      {side("left", 298, 60)}
      {side("right", 258, 96)}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 67,
          background:
            "linear-gradient(140deg,#e4e4e8 0%,#8a8a91 16%,#cfcfd4 38%,#77777e 62%,#c8c8cd 84%,#8b8b91 100%)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.35)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 3,
          borderRadius: 64,
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
          borderRadius: 55,
          overflow: "hidden",
          background: "#000",
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            top: 11,
            left: (SW - 124) / 2,
            width: 124,
            height: 36,
            borderRadius: 18,
            background: "#000",
            zIndex: 60,
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
            background: "#ffffff",
            zIndex: 60,
          }}
        />
      </div>
    </div>
  );
}

function Wallpaper({ c }: { c: Palette }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ridge = (y: number, amp: number, seed: number) => {
    let d = `M0 ${SH}L0 ${y}`;
    for (let x = 0; x <= SW; x += 6) {
      const h =
        Math.sin(x * 0.019 + seed) * amp +
        Math.sin(x * 0.051 + seed * 2.3) * amp * 0.35 +
        Math.sin(x * 0.17 + seed * 5.1) * amp * 0.08;
      d += `L${x} ${y + h}`;
    }
    return `${d}L${SW} ${SH}Z`;
  };
  return (
    <svg
      width={SW}
      height={SH}
      viewBox={`0 0 ${SW} ${SH}`}
      style={{ position: "absolute", inset: 0 }}
    >
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.sky[0]} />
          <stop offset="0.35" stopColor={c.sky[1]} />
          <stop offset="0.6" stopColor={c.sky[2]} />
          <stop offset="0.78" stopColor={c.sky[3]} />
        </linearGradient>
        <radialGradient id={`sun${id}`} cx="0.62" cy="0.6" r="0.4">
          <stop offset="0" stopColor={c.sun} stopOpacity={0.9} />
          <stop offset="0.25" stopColor={c.sun} stopOpacity={0.35} />
          <stop offset="1" stopColor={c.sun} stopOpacity={0} />
        </radialGradient>
        {c.ridges.map((col, i) => (
          <linearGradient
            key={col}
            id={`r${i}${id}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0" stopColor={col} />
            <stop offset="0.5" stopColor={c.ridges[i + 1] ?? col} />
          </linearGradient>
        ))}
      </defs>
      <rect width={SW} height={SH} fill={`url(#sky${id})`} />
      <rect width={SW} height={SH} fill={`url(#sun${id})`} />
      {c.ridges.map((col, i) => (
        <path
          key={col}
          d={ridge(470 + i * 80, 34 - i * 4, i * 1.7 + 0.4)}
          fill={`url(#r${i}${id})`}
        />
      ))}
    </svg>
  );
}

function StatsWidget({
  c,
  accent,
  size,
  appName,
  stat,
  value,
  bars,
}: {
  c: Palette;
  accent: string;
  size: "small" | "medium";
  appName: string;
  stat: NonNullable<HomeWidgetProps["stat"]>;
  value: number;
  bars: number[];
}) {
  const { w, h } = SIZES[size];
  const max = Math.max(...bars, 1);
  const medium = size === "medium";
  const chartH = medium ? 74 : 26;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 22,
        background: c.widget,
        padding: 15,
        boxSizing: "border-box",
        display: "flex",
        gap: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Glyph d={PATH.remocn} size={14} color="#ffffff" sw={2} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 400, color: c.text }}>
            {appName}
          </span>
        </div>
        <div
          style={{
            marginTop: medium ? 16 : 12,
            fontSize: medium ? 34 : 30,
            fontWeight: 400,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: c.text,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.round(value).toLocaleString("en-US")}
        </div>
        <div style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>
          {stat.label}
        </div>
        {medium ? (
          <div
            style={{
              marginTop: "auto",
              fontSize: 12,
              fontWeight: 400,
              color: "#1f9d62",
            }}
          >
            {stat.delta}
          </div>
        ) : (
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              alignItems: "flex-end",
              gap: 4,
              height: chartH,
            }}
          >
            {bars.map((v, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: Math.max(3, (v / max) * chartH),
                  borderRadius: 2,
                  background: i === bars.length - 1 ? accent : c.barIdle,
                }}
              />
            ))}
          </div>
        )}
      </div>
      {medium ? (
        <div
          style={{
            width: 138,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 7,
              height: chartH,
            }}
          >
            {bars.map((v, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: Math.max(4, (v / max) * chartH),
                  borderRadius: 3,
                  background: i === bars.length - 1 ? accent : c.barIdle,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: 6 }}>
            {DAYS.map((d, i) => (
              <span
                key={i}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 400,
                  color: i === DAYS.length - 1 ? c.text : c.muted,
                }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GalleryWidgets({ c, accent }: { c: Palette; accent: string }) {
  const card: React.CSSProperties = {
    position: "absolute",
    borderRadius: 22,
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 6px 16px -6px rgba(0,0,0,0.12)",
  };
  return (
    <>
      <div
        style={{
          ...card,
          left: 20,
          top: 0,
          width: 168,
          height: 168,
          background: "linear-gradient(180deg,#4a9cf0,#2a6fd6)",
          color: "#ffffff",
          padding: 16,
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 400 }}>Lisbon</div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 300,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          21°
        </div>
        <div style={{ position: "absolute", left: 16, bottom: 16 }}>
          <Glyph d={PATH.sun} size={18} color="#ffd65a" sw={2} />
          <div style={{ fontSize: 13, fontWeight: 400, marginTop: 4 }}>
            Sunny
          </div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>H:24° L:16°</div>
        </div>
      </div>
      <div
        style={{
          ...card,
          left: 202,
          top: 0,
          width: 168,
          height: 168,
          background: c.group,
          padding: 16,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: "#f0473c",
            letterSpacing: "0.04em",
          }}
        >
          TUESDAY
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 400,
            color: c.text,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          24
        </div>
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
            display: "flex",
            gap: 8,
          }}
        >
          <div style={{ width: 3, borderRadius: 2, background: accent }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 400, color: c.text }}>
              Design review
            </div>
            <div
              style={{
                fontSize: 12,
                color: c.muted,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              10:00–10:30
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          ...card,
          left: 20,
          top: 184,
          width: 350,
          height: 168,
          background: "linear-gradient(135deg,#3a2a4a,#1d1a2a)",
          padding: 16,
          boxSizing: "border-box",
          display: "flex",
          gap: 16,
          color: "#ffffff",
        }}
      >
        <svg
          width={136}
          height={136}
          viewBox="0 0 136 136"
          style={{ borderRadius: 12, flexShrink: 0 }}
        >
          <rect width={136} height={136} fill="#ff8e5e" />
          {[56, 42, 28, 14].map((r, i) => (
            <circle
              key={r}
              cx={92}
              cy={96}
              r={r}
              fill={["#ffb36b", "#ef5b3b", "#c43a54", "#5a2a6a"][i]}
            />
          ))}
        </svg>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.6 }}>
            Now playing
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 400,
              marginTop: 6,
              lineHeight: 1.25,
            }}
          >
            Golden Hour Drive
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
            Priya Raman
          </div>
          <div style={{ marginTop: "auto", display: "flex", gap: 22 }}>
            <Glyph
              d={PATH.play}
              size={22}
              color="#ffffff"
              fill="#ffffff"
              sw={1.2}
            />
            <Glyph
              d={PATH.skip}
              size={22}
              color="#ffffff"
              fill="#ffffff"
              sw={1.2}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export function HomeWidget({
  appName = "remocn",
  widgetName = "Renders",
  widgetDescription = "Track renders and views at a glance.",
  size = "medium",
  stat = {
    label: "Renders this week",
    from: 1236,
    to: 1284,
    delta: "+12% vs last week",
  },
  bars = [42, 58, 36, 70, 64, 88, 76],
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
  lines = [
    "Hold the home screen.",
    "Pick the size that fits.",
    "Your week, one glance away.",
  ],
  ground,
  groundParams,
}: HomeWidgetProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = frame * speed;
  const c: Palette = theme === "dark" ? DARK : LIGHT;
  const tall = height > width;
  const k = tall
    ? Math.min((height * 0.64) / BH, (width * 0.78) / BW)
    : (height * 0.92) / BH;
  const phoneCx = tall ? width / 2 : width * 0.69;
  const phoneCy = tall ? height - height * 0.035 - (BH * k) / 2 : height / 2;
  const W = SIZES[size];
  const medium = size === "medium";
  const remocnApp: AppDef = {
    name: appName,
    bg: [accent, accent],
    d: PATH.remocn,
  };

  const bump = (at: number) =>
    interpolate(f, [at - 1, at + 1, at + 6], [0, 1, 0], clamp);
  const rise = spring({ frame: f, fps, config: HEAVY });

  const jig =
    interpolate(f, [T_JIG, T_JIG + 6], [0, 1], clamp) *
    interpolate(f, [T_DONE + 1, T_DONE + 6], [1, 0], clamp);
  const jiggle = (i: number) => ({
    r: Math.sin((f / 7) * Math.PI * 2 + i * 1.9) * 1.7 * jig,
    y: Math.cos((f / 7) * Math.PI * 2 + i * 1.3) * 0.7 * jig,
  });

  const sheetIn = interpolate(f, [T_PLUS + 2, T_PLUS + 14], [0, 1], {
    ...clamp,
    easing: sheetEase,
  });
  const sheetOut = interpolate(f, [T_ADD + 1, T_ADD + 12], [0, 1], {
    ...clamp,
    easing: sheetEase,
  });
  const sheetY = SHEET_TOP + (SH - SHEET_TOP) * (1 - sheetIn + sheetOut);
  const sheetVis = sheetIn * (1 - sheetOut);
  const push = interpolate(f, [T_ROW + 2, T_ROW + 13], [0, 1], {
    ...clamp,
    easing: sheetEase,
  });
  const pageDrag = medium
    ? interpolate(f, [T_SWIPE, T_SWIPE_UP], [0, 0.6], {
        ...clamp,
        easing: inOut,
      }) +
      interpolate(f, [T_SWIPE_UP, T_SWIPE_UP + 12], [0, 0.4], {
        ...clamp,
        easing: easeOut,
      })
    : 0;
  const rowPress = bump(T_ROW);
  const addPress = bump(T_ADD - 1);

  const fly = spring({ frame: f - T_ADD, fps, config: CARD });
  const from = { x: (SW - W.w) / 2, y: SHEET_TOP + PREVIEW_Y };
  const slot = { x: COL0, y: ROW0 };
  const wx = from.x + (slot.x - from.x) * fly;
  const wy = from.y + (slot.y - from.y) * fly;
  const lift = Math.sin(Math.min(1, fly) * Math.PI) * 0.05;
  const landed = f >= T_ADD;

  const claims = new Set<number>();
  const span = medium ? 4 : 2;
  for (let r = 0; r < 2; r++)
    for (let col = 0; col < span; col++) claims.add(r * 4 + col);
  const freeCells: number[] = [];
  for (let i = 0; freeCells.length < APPS.length + 1; i++)
    if (!claims.has(i)) freeCells.push(i);
  const homeApps = [...APPS.slice(0, 11), remocnApp, ...APPS.slice(11, 15)];
  const cellXY = (cell: number) => ({
    x: COL0 + (cell % 4) * COL,
    y: ROW0 + Math.floor(cell / 4) * ROW,
  });

  const live = interpolate(f, [T_LIVE, T_LIVE + 50], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  const value = stat.from + (stat.to - stat.from) * live;
  const liveBars = bars.map((v, i) =>
    i === bars.length - 1 ? v * (0.4 + 0.6 * live) : v,
  );

  const camT = [
    0,
    T_ROW + 4,
    T_ROW + 20,
    T_ADD - 6,
    T_ADD + 10,
    T_DONE + 4,
    T_DONE + 26,
  ];
  const camEase = { ...clamp, easing: camera };
  const camS = interpolate(
    f,
    camT,
    [1, 1, tall ? 1.1 : 1.08, tall ? 1.1 : 1.08, 1, 1, tall ? 1.22 : 1.36],
    camEase,
  );
  const camFy = interpolate(
    f,
    camT,
    [
      BH / 2,
      BH / 2,
      tall ? BEZEL + 468 : BH / 2,
      tall ? BEZEL + 468 : BH / 2,
      BH / 2,
      BH / 2,
      BEZEL + ROW0 + WH / 2 + 30,
    ],
    camEase,
  );
  const camFx = interpolate(
    f,
    camT,
    [BW / 2, BW / 2, BW / 2, BW / 2, BW / 2, BW / 2, BEZEL + COL0 + W.w / 2],
    camEase,
  );
  const S = k * camS;

  const rowIdx = LIST.indexOf("remocn");
  const listTop = SHEET_TOP + 64 + 352 + 20;
  const touches = [
    { t: 16, x: 270, y: 600 },
    { t: T_HOLD, x: 210, y: 486 },
    { t: T_PLUS, x: 40, y: 30 },
    { t: T_ROW, x: 120, y: listTop + rowIdx * 50 + 25 },
    ...(medium
      ? [
          { t: T_SWIPE, x: 310, y: SHEET_TOP + PREVIEW_Y + 78 },
          { t: T_SWIPE_UP, x: 120, y: SHEET_TOP + PREVIEW_Y + 70 },
        ]
      : []),
    { t: T_ADD - 1, x: SW / 2 + 10, y: SH - 64 },
    { t: T_DONE, x: SW - 48, y: 30 },
  ];
  let touch = { x: touches[0].x, y: touches[0].y };
  for (let i = 0; i < touches.length - 1; i++) {
    const a = touches[i];
    const b = touches[i + 1];
    const dragging = a.t === T_SWIPE && medium;
    const start = a.t === T_HOLD ? T_JIG + 6 : dragging ? a.t : a.t + 3;
    const end = dragging ? b.t : b.t - 2;
    if (f >= start) {
      const p = Math.min(1, (f - start) / (end - start));
      const e = dragging ? inOut(p) : glide(p);
      const arc = dragging ? 0 : Math.sin(Math.PI * e) * 24;
      touch = {
        x: a.x + (b.x - a.x) * e + arc * 0.5,
        y: a.y + (b.y - a.y) * e - arc * 0.5,
      };
    }
  }
  const down = Math.min(
    1,
    interpolate(
      f,
      [T_HOLD - 1, T_HOLD + 1, T_JIG + 4, T_JIG + 6],
      [0, 1, 1, 0],
      clamp,
    ) +
      bump(T_PLUS) +
      bump(T_ROW) +
      (medium
        ? interpolate(
            f,
            [T_SWIPE - 2, T_SWIPE, T_SWIPE_UP, T_SWIPE_UP + 2],
            [0, 1, 1, 0],
            clamp,
          )
        : 0) +
      bump(T_ADD - 1) +
      bump(T_DONE),
  );
  const touchOpacity = interpolate(
    f,
    [16, 22, T_DONE + 3, T_DONE + 8],
    [0, 1, 1, 0],
    clamp,
  );
  const plusPress = bump(T_PLUS);
  const donePress = bump(T_DONE);

  const statusOp = 1 - jig;
  const editOp =
    interpolate(f, [T_JIG, T_JIG + 5], [0, 1], clamp) *
    interpolate(f, [T_DONE + 1, T_DONE + 5], [1, 0], clamp);
  const homeDim = sheetVis;

  const widgetEl = (
    <StatsWidget
      c={c}
      accent={accent}
      size={size}
      appName={appName}
      stat={stat}
      value={value}
      bars={liveBars}
    />
  );
  const badge = (op: number) => (
    <div
      style={{
        position: "absolute",
        left: -7,
        top: -7,
        width: 22,
        height: 22,
        borderRadius: 11,
        background: c.badge,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: op,
        transform: `scale(${0.9 + op * 0.1})`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          width: 10,
          height: 2,
          borderRadius: 1,
          background: c.badgeInk,
        }}
      />
    </div>
  );

  return (
    <AbsoluteFill style={{ fontFamily, fontWeight: 400, overflow: "hidden" }}>
      <GshGround
        preset={ground ?? (theme === "dark" ? "ember" : "paper-crease")}
        params={groundParams}
        timeOffset={theme === "dark" ? 3 : 6}
        timeScale={0.3}
      />
      <AbsoluteFill style={{ background: c.stage }} />
      <div
        style={{
          position: "absolute",
          left: tall ? width * 0.08 : width * 0.075,
          top: tall ? height * 0.07 : height / 2 - height * 0.09,
          width: tall ? width * 0.84 : width * 0.44,
          height: (tall ? width * 0.085 : height * 0.09) * 2.3,
          fontSize: tall ? width * 0.085 : height * 0.09,
          fontWeight: 300,
          lineHeight: 1.08,
          letterSpacing: "-0.035em",
          color: c.copy,
        }}
      >
        {lines.map((line, i) => {
          const starts = [6, T_PLUS, T_ADD + 4];
          const ends = [T_PLUS, T_ADD + 4, 99999];
          const inP = interpolate(f, [starts[i], starts[i] + 14], [0, 1], {
            ...clamp,
            easing: sheetEase,
          });
          const outP = interpolate(f, [ends[i] - 8, ends[i]], [0, 1], {
            ...clamp,
            easing: exitEase,
          });
          if (inP <= 0 || outP >= 1) return null;
          return (
            <div
              key={line}
              style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                paddingBottom: "0.12em",
              }}
            >
              <div
                style={{
                  transform: `translateY(${(1 - inP) * 70 - outP * 40}%)`,
                  opacity: Math.min(1, inP * 1.4) * (1 - outP),
                  textWrap: "balance",
                }}
              >
                {line}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: BW,
          height: BH,
          transformOrigin: "0 0",
          transform: `translate(${phoneCx - camFx * S}px, ${phoneCy - camFy * S + (1 - rise) * height}px) scale(${S})`,
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 67,
            boxShadow: c.phoneShadow,
          }}
        />
        <Frame>
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scale(${1 - homeDim * 0.06})`,
              borderRadius: 40 * homeDim,
              overflow: "hidden",
            }}
          >
            <Wallpaper c={c} />
            {homeApps.map((app, i) => {
              const a = cellXY(i);
              const b = cellXY(freeCells[i]);
              const t0 = T_ADD + (homeApps.length - 1 - i) * 0.25;
              const mv = interpolate(f, [t0, t0 + 14], [0, 1], {
                ...clamp,
                easing: inOut,
              });
              const j = jiggle(i);
              return (
                <div
                  key={app.name}
                  style={{
                    position: "absolute",
                    left: a.x + (b.x - a.x) * mv,
                    top: a.y + (b.y - a.y) * mv,
                    width: ICON,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    transform: `translateY(${j.y}px) rotate(${j.r}deg)`,
                  }}
                >
                  <AppTile app={app} size={ICON} />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 400,
                      color: "#ffffff",
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {app.name}
                  </span>
                  {badge(editOp)}
                </div>
              );
            })}
            <div
              style={{
                position: "absolute",
                left: (SW - 82) / 2,
                bottom: 128,
                height: 30,
                width: 82,
                borderRadius: 15,
                background: c.chrome,
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <Glyph d={PATH.search} size={13} color="#ffffff" sw={2.2} />
              Search
            </div>
            <div
              style={{
                position: "absolute",
                left: 12,
                right: 12,
                bottom: 12,
                height: 94,
                borderRadius: 34,
                background: c.chrome,
                backdropFilter: "blur(20px)",
              }}
            />
            {DOCK.map((app, i) => {
              const j = jiggle(30 + i);
              return (
                <div
                  key={app.name}
                  style={{
                    position: "absolute",
                    left: COL0 + i * COL,
                    top: SH - 12 - 94 + 16,
                    transform: `translateY(${j.y}px) rotate(${j.r}deg)`,
                  }}
                >
                  <AppTile app={app} size={ICON} />
                  {badge(editOp)}
                </div>
              );
            })}
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
                padding: "4px 30px 0 52px",
                color: "#ffffff",
                opacity: statusOp,
              }}
            >
              <span style={{ fontSize: 17, fontWeight: 400 }}>9:41</span>
              <StatusIcons color="#ffffff" />
            </div>
            <div
              style={{
                position: "absolute",
                left: 20,
                top: 15,
                width: 40,
                height: 30,
                borderRadius: 15,
                background: c.chrome,
                backdropFilter: "blur(16px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: editOp,
                transform: `scale(${(0.94 + editOp * 0.06) * (1 - plusPress * 0.06)})`,
              }}
            >
              <Glyph d={PATH.plus} size={18} color="#ffffff" sw={2.4} />
            </div>
            <div
              style={{
                position: "absolute",
                right: 20,
                top: 15,
                height: 30,
                padding: "0 14px",
                borderRadius: 15,
                background: c.chrome,
                backdropFilter: "blur(16px)",
                display: "flex",
                alignItems: "center",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 400,
                opacity: editOp,
                transform: `scale(${(0.94 + editOp * 0.06) * (1 - donePress * 0.06)})`,
              }}
            >
              Done
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#000",
                opacity: homeDim * 0.3,
              }}
            />
          </div>
          {sheetVis > 0 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: sheetY,
                height: SH - SHEET_TOP,
                borderRadius: "38px 38px 0 0",
                background: c.sheet,
                overflow: "hidden",
                zIndex: 20,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `translateX(${-push * SW * 0.3}px)`,
                  opacity: 1 - push * 0.6,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 20,
                    right: 20,
                    top: 18,
                    height: 36,
                    borderRadius: 10,
                    background: c.field,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0 10px",
                    color: c.muted,
                    fontSize: 17,
                  }}
                >
                  <Glyph d={PATH.search} size={17} color={c.muted} sw={2.2} />
                  Search Widgets
                </div>
                <div
                  style={{ position: "absolute", left: 0, right: 0, top: 64 }}
                >
                  <GalleryWidgets c={c} accent={accent} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 20,
                    right: 20,
                    top: listTop - SHEET_TOP,
                    borderRadius: 12,
                    background: c.group,
                    overflow: "hidden",
                  }}
                >
                  {LIST.map((name, i) => {
                    const app =
                      name === "remocn"
                        ? remocnApp
                        : (APPS.find((a) => a.name === name) as AppDef);
                    const pressed = name === "remocn" ? rowPress : 0;
                    return (
                      <div
                        key={name}
                        style={{
                          height: 50,
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "0 14px",
                          position: "relative",
                          background: pressed > 0 ? c.field : "transparent",
                        }}
                      >
                        <AppTile
                          app={
                            name === "remocn" ? { ...app, name: appName } : app
                          }
                          size={30}
                        />
                        <span style={{ flex: 1, fontSize: 17, color: c.text }}>
                          {name === "remocn" ? appName : name}
                        </span>
                        <Glyph
                          d={PATH.chevron}
                          size={16}
                          color={c.muted}
                          sw={2.2}
                        />
                        {i > 0 ? (
                          <div
                            style={{
                              position: "absolute",
                              left: 56,
                              right: 0,
                              top: 0,
                              height: 1,
                              background: c.hair,
                            }}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
              {push > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: c.sheet,
                    transform: `translateX(${(1 - push) * SW}px)`,
                    boxShadow: "-8px 0 24px rgba(0,0,0,0.08)",
                  }}
                >
                  <div style={{ position: "absolute", left: 14, top: 18 }}>
                    <Glyph d={PATH.back} size={28} color={c.blue} sw={2.4} />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 24,
                      right: 24,
                      top: 62,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 400,
                        letterSpacing: "-0.02em",
                        color: c.text,
                      }}
                    >
                      {widgetName}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: c.muted,
                        marginTop: 6,
                        textWrap: "balance",
                      }}
                    >
                      {widgetDescription}
                    </div>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: PREVIEW_Y,
                      display: "flex",
                      transform: `translateX(${-pageDrag * SW}px)`,
                    }}
                  >
                    {(["small", "medium"] as const).map((sz) => (
                      <div
                        key={sz}
                        style={{
                          width: SW,
                          display: "flex",
                          justifyContent: "center",
                          opacity: f >= T_ADD && sz === size ? 0 : 1,
                        }}
                      >
                        <div
                          style={{
                            boxShadow:
                              "0 1px 3px rgba(0,0,0,0.06), 0 10px 30px -8px rgba(0,0,0,0.18)",
                            borderRadius: 22,
                          }}
                        >
                          <StatsWidget
                            c={c}
                            accent={accent}
                            size={sz}
                            appName={appName}
                            stat={stat}
                            value={stat.from}
                            bars={bars}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: PREVIEW_Y + WH + 32,
                      display: "flex",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {[0, 1].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 4,
                          background: c.text,
                          opacity: (pageDrag > 0.5 ? i === 1 : i === 0)
                            ? 0.85
                            : 0.2,
                        }}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 20,
                      right: 20,
                      bottom: 34,
                      height: 50,
                      borderRadius: 25,
                      background: c.blue,
                      color: "#ffffff",
                      fontSize: 17,
                      fontWeight: 400,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      transform: `scale(${1 - addPress * 0.03})`,
                    }}
                  >
                    <Glyph d={PATH.plus} size={18} color="#ffffff" sw={2.4} />
                    Add Widget
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scale(${1 - homeDim * 0.06})`,
              zIndex: 25,
            }}
          >
            {landed ? (
              <div
                style={{
                  position: "absolute",
                  left: wx,
                  top: wy,
                  width: W.w,
                  zIndex: 6,
                  transform: `translateY(${jiggle(20).y}px) rotate(${jiggle(20).r * 0.5}deg) scale(${1 + lift})`,
                  filter: `drop-shadow(0 ${10 * lift * 20}px ${24 * lift * 20}px rgba(0,0,0,${0.25 * lift * 20}))`,
                }}
              >
                {widgetEl}
                <div
                  style={{
                    marginTop: 6,
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 400,
                    color: "#ffffff",
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    opacity: interpolate(fly, [0.7, 1], [0, 1], clamp),
                  }}
                >
                  {appName}
                </div>
                {badge(editOp * interpolate(fly, [0.8, 1], [0, 1], clamp))}
              </div>
            ) : null}
          </div>
          <div
            style={{
              position: "absolute",
              left: touch.x - 22,
              top: touch.y - 22,
              width: 44,
              height: 44,
              borderRadius: 22,
              background: "rgba(255,255,255,0.22)",
              border: "1.5px solid rgba(255,255,255,0.8)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
              opacity: touchOpacity,
              transform: `scale(${1 - down * 0.14})`,
              zIndex: 50,
            }}
          />
        </Frame>
      </div>
    </AbsoluteFill>
  );
}
