"use client";

import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
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

export interface LiveActivityStatus {
  app: string;
  title: string;
  doneTitle: string;
  details: string[];
  doneDetail: string;
  steps: string[];
  seconds: number;
  format?: "clock" | "minutes";
  glyph?: "render" | "delivery" | "deploy";
  lines?: string[];
}

export interface LiveActivityProps {
  status?: LiveActivityStatus;
  date?: string;
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

export const LIVE_ACTIVITY_RENDER: LiveActivityStatus = {
  app: "remocn",
  title: "Rendering launch.mp4",
  doneTitle: "launch.mp4 is ready",
  details: [
    "Bundling 214 modules",
    "1080p · 30 fps · {pct}",
    "Uploading to CDN",
  ],
  doneDetail: "42.8 MB · 0:58 · Tap to share",
  steps: ["Bundle", "Render", "Upload"],
  seconds: 27,
  format: "clock",
  glyph: "render",
  lines: [
    "Your render, live.",
    "Progress at a glance.",
    "Ready on the Lock Screen.",
  ],
};

export const LIVE_ACTIVITY_DELIVERY: LiveActivityStatus = {
  app: "Fernway",
  title: "Leo is on the way",
  doneTitle: "Your order has arrived",
  details: ["Packing 12 items", "Toyota Prius · 7KX 204", "Pulling up outside"],
  doneDetail: "Left at the front door",
  steps: ["Packed", "On the way", "Arrived"],
  seconds: 6 * 60,
  format: "minutes",
  glyph: "delivery",
  lines: ["Track every order.", "Minutes, not guesses.", "Left at the door."],
};

const SW = 390;
const SH = 844;
const BEZEL = 12;
const BW = SW + BEZEL * 2;
const BH = SH + BEZEL * 2;

const ISL_TOP = 11;
const ISL_W = 124;
const ISL_H = 36;
const CMP_W = 198;
const EXP_W = 370;
const EXP_H = 188;
const EXP_R = 44;
const CARD_Y = 584;

const T_START = 14;
const T_PRESS = 54;
const T_EXP = 62;
const T_COL = 150;
const T_SWIPE = 190;
const T_RELEASE = 202;
const T_FIN = 240;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const enterE = Easing.bezier(0.22, 1, 0.36, 1);
const exitE = Easing.bezier(0.55, 0, 1, 0.45);
const moveE = Easing.bezier(0.65, 0, 0.35, 1);
const camE = Easing.bezier(0.87, 0, 0.13, 1);
const sheet = Easing.bezier(0.32, 0.72, 0, 1);
const tween = (f: number, a: number, b: number, easing = enterE) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

type SpringCfg = { mass?: number; damping: number; stiffness?: number };
const HEAVY: SpringCfg = { mass: 1, damping: 26, stiffness: 120 };
const CARD: SpringCfg = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP: SpringCfg = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH: SpringCfg = { damping: 200 };
const LINE_AT = [0, T_EXP, T_SWIPE];

const DARK = {
  stage: "#03050B",
  scrim: "rgba(2,3,8,0.25)",
  copy: "#F4F5F8",
  sky: ["#0d1530", "#2a2f5c", "#7a4e74", "#e09a7a"],
  ridges: ["#3b3a63", "#2a2b4c", "#1b1c36", "#11122a"],
  sun: "#ffd2a8",
  card: "rgba(24,24,28,0.6)",
  cardText: "#f5f5f7",
  cardMuted: "rgba(235,235,245,0.6)",
  cardTrack: "rgba(255,255,255,0.16)",
  button: "rgba(18,18,24,0.42)",
  phoneShadow: "0 40px 90px rgba(0,0,0,0.55), 0 12px 30px rgba(0,0,0,0.4)",
};
const LIGHT: typeof DARK = {
  stage: "#EEF0F5",
  scrim: "rgba(246,246,248,0.18)",
  copy: "#121216",
  sky: ["#3d7fd6", "#6fa6e4", "#a9cdee", "#e8f0f4"],
  ridges: ["#8eaacb", "#6a8db5", "#4a6f9b", "#2f5280"],
  sun: "#fff8e6",
  card: "rgba(250,250,252,0.72)",
  cardText: "#111113",
  cardMuted: "rgba(60,60,67,0.66)",
  cardTrack: "rgba(60,60,67,0.16)",
  button: "rgba(255,255,255,0.32)",
  phoneShadow:
    "0 40px 80px rgba(30,32,40,0.2), 0 12px 28px rgba(30,32,40,0.12), 0 2px 6px rgba(30,32,40,0.08)",
};
type Palette = typeof DARK;

const PATH = {
  render:
    "M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v11a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 17.5zM10 9v6l5-3z",
  delivery:
    "M6 8h12l-1 11.2a1 1 0 01-1 .8H8a1 1 0 01-1-.8zM9 8V7a3 3 0 016 0v1",
  deploy: "M12 4l8 14H4z",
  check: "M7 12.5l3.2 3.2L17 9",
  torch: "M8 3h8v4l-2 3v10a2 2 0 01-4 0V10L8 7zM8 7h8",
  camera:
    "M4 8.5A1.5 1.5 0 015.5 7h2.3l1.5-2h5.4l1.5 2h2.3A1.5 1.5 0 0120 8.5v9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17.5zM12 10a3.2 3.2 0 110 6.4 3.2 3.2 0 010-6.4z",
};

const HOME_APPS: { name: string; bg: [string, string]; d: string }[] = [
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
];
const DOCK: (typeof HOME_APPS)[number][] = [
  {
    name: "Call",
    bg: ["#5ee07a", "#2fb350"],
    d: "M6.5 4h3l1.5 4-2 1.5a10 10 0 005.5 5.5L16 13l4 1.5v3a2 2 0 01-2 2A15 15 0 014.5 6a2 2 0 012-2z",
  },
  {
    name: "Relay",
    bg: ["#5ee07a", "#2fb350"],
    d: "M12 4c4.4 0 8 3 8 6.8s-3.6 6.7-8 6.7c-1 0-2-.1-2.9-.4L5 19l1-3.6C4.8 14.2 4 12.6 4 10.8 4 7 7.6 4 12 4z",
  },
  { name: "Atlas", bg: ["#53c7d9", "#2a8fb0"], d: HOME_APPS[10].d },
  { name: "Chord", bg: ["#ff8e5e", "#ef5b3b"], d: HOME_APPS[8].d },
];

function Glyph({
  d,
  size = 24,
  color,
  sw = 1.8,
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
      </div>
    </div>
  );
}

function Wallpaper({ c, dim = 0 }: { c: Palette; dim?: number }) {
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
      <rect width={SW} height={SH} fill="#000" opacity={dim} />
    </svg>
  );
}

function HomeScreen({ c, accent }: { c: Palette; accent: string }) {
  const tile = (
    app: (typeof HOME_APPS)[number],
    x: number,
    y: number,
    label: boolean,
  ) => (
    <div
      key={`${app.name}${x}${y}`}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 62,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
      }}
    >
      <div
        style={{
          width: 62,
          height: 62,
          borderRadius: 14,
          background: `linear-gradient(180deg, ${app.bg[0]}, ${app.bg[1]})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Glyph d={app.d} size={32} color="#ffffff" sw={1.7} />
      </div>
      {label ? (
        <span
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: "#ffffff",
            textShadow: "0 1px 2px rgba(0,0,0,0.25)",
          }}
        >
          {app.name}
        </span>
      ) : null}
    </div>
  );
  const apps = [
    ...HOME_APPS.slice(0, 11),
    {
      name: "remocn",
      bg: [accent, accent] as [string, string],
      d: PATH.render,
    },
    ...HOME_APPS.slice(11),
  ];
  return (
    <>
      <Wallpaper c={c} dim={0.08} />
      {apps.map((app, i) =>
        tile(app, 27 + (i % 4) * 88, 74 + Math.floor(i / 4) * 102, true),
      )}
      <div
        style={{
          position: "absolute",
          left: (SW - 82) / 2,
          bottom: 128,
          height: 30,
          width: 82,
          borderRadius: 15,
          background: "rgba(255,255,255,0.22)",
          color: "#ffffff",
          fontSize: 13,
          fontWeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <Glyph
          d="M10.5 4a6.5 6.5 0 110 13 6.5 6.5 0 010-13zM20 20l-4.8-4.8"
          size={13}
          color="#ffffff"
          sw={2.2}
        />
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
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(20px)",
        }}
      />
      {DOCK.map((app, i) => tile(app, 27 + i * 88, SH - 12 - 94 + 16, false))}
    </>
  );
}

function fmtTime(sec: number, format: "clock" | "minutes") {
  if (format === "minutes") return `${Math.max(1, Math.ceil(sec / 60))} min`;
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Ticker({
  value,
  prev,
  since,
  style,
}: {
  value: string;
  prev: string;
  since: number;
  style: React.CSSProperties;
}) {
  const t = enterE(Math.min(1, since / 4));
  const chars = Array.from(value);
  const old = Array.from(prev.padStart(chars.length, " "));
  return (
    <span
      style={{
        display: "inline-flex",
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {chars.map((ch, i) => {
        const changed = old[i] !== ch && prev.length === value.length;
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              whiteSpace: "pre",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: changed ? `translateY(${(1 - t) * 45}%)` : undefined,
                opacity: changed ? t : 1,
              }}
            >
              {ch}
            </span>
            {changed && t < 1 ? (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transform: `translateY(${-t * 45}%)`,
                  opacity: 1 - t,
                }}
              >
                {old[i]}
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}

interface ActivityState {
  timeText: string;
  prevText: string;
  sinceTick: number;
  progress: number;
  step: number;
  done: number;
  detail: string;
}

function AppBadge({
  size,
  glyph,
  accent,
}: {
  size: number;
  glyph: string;
  accent: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Glyph d={glyph} size={size * 0.62} color="#ffffff" sw={1.9} />
    </div>
  );
}

function ActivityBody({
  s,
  status,
  accent,
  text,
  muted,
  track,
  glyph,
  compactTop,
}: {
  s: ActivityState;
  status: LiveActivityStatus;
  accent: string;
  text: string;
  muted: string;
  track: string;
  glyph: string;
  compactTop: boolean;
}) {
  const title = s.done > 0.5 ? status.doneTitle : status.title;
  const detail = s.done > 0.5 ? status.doneDetail : s.detail;
  const swap = s.done > 0 && s.done < 1 ? Math.abs(s.done - 0.5) * 2 : 1;
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <AppBadge size={compactTop ? 46 : 40} glyph={glyph} accent={accent} />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            paddingTop: compactTop ? 4 : 1,
            opacity: compactTop ? 0 : 1,
          }}
        >
          <div style={{ fontSize: 13, color: muted }}>{status.app}</div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 400,
              color: text,
              marginTop: 1,
              opacity: swap,
            }}
          >
            {title}
          </div>
        </div>
        <div
          style={{
            position: "relative",
            textAlign: "right",
            paddingTop: compactTop ? 6 : 2,
          }}
        >
          <div style={{ opacity: 1 - s.done }}>
            <Ticker
              value={s.timeText}
              prev={s.prevText}
              since={s.sinceTick}
              style={{
                fontSize: 32,
                fontWeight: 300,
                color: text,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            />
            <div style={{ fontSize: 12, color: muted, marginTop: 3 }}>
              remaining
            </div>
          </div>
          {s.done > 0 ? (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: compactTop ? 4 : 0,
                width: 32,
                height: 32,
                borderRadius: 16,
                background: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: s.done,
                transform: `scale(${0.9 + s.done * 0.1})`,
              }}
            >
              <Glyph d={PATH.check} size={22} color="#ffffff" sw={2.4} />
            </div>
          ) : null}
        </div>
      </div>
      {compactTop ? (
        <div
          style={{
            fontSize: 18,
            fontWeight: 400,
            color: text,
            marginTop: 12,
            opacity: swap,
          }}
        >
          {title}
        </div>
      ) : null}
      <div
        style={{
          fontSize: 13,
          color: muted,
          marginTop: compactTop ? 2 : 8,
          fontVariantNumeric: "tabular-nums",
          opacity: swap,
        }}
      >
        {detail}
      </div>
      <div
        style={{
          position: "relative",
          height: 6,
          borderRadius: 3,
          background: track,
          marginTop: 14,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${s.progress * 100}%`,
            borderRadius: 3,
            background: accent,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -4,
            left: `calc(${s.progress * 100}% - 7px)`,
            width: 14,
            height: 14,
            borderRadius: 7,
            background: "#ffffff",
            boxShadow: `0 0 0 3px ${accent}`,
            opacity: 1 - s.done,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontSize: 12,
        }}
      >
        {status.steps.map((label, i) => (
          <span
            key={label}
            style={{
              color: i <= s.step || s.done > 0.5 ? text : muted,
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </>
  );
}

export function LiveActivity({
  status = LIVE_ACTIVITY_RENDER,
  date = "Tuesday, October 24",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
  ground,
  groundParams,
}: LiveActivityProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = frame * speed;
  const c: Palette = theme === "light" ? LIGHT : DARK;
  const tall = height > width;
  const k = (height * (tall ? 0.66 : 0.92)) / BH;
  const phoneCx = tall ? width / 2 : width * 0.7;
  const yOff = tall ? 0.1 : 0;
  const lines = status.lines ?? [];
  const sp = (at: number, config: SpringCfg, durationInFrames?: number) =>
    spring({ frame: f - at, fps, config, durationInFrames });
  const format = status.format ?? "clock";
  const glyph = PATH[status.glyph ?? "render"];

  const iosSpring = (at: number) => sp(at, CARD);
  const bump = (at: number) => sp(at - 2, MORPH, 3) - sp(at + 2, CHIP);

  const span = T_FIN - T_START;
  const tickLen = span / status.seconds;
  const live = Math.max(0, Math.min(span, f - T_START));
  const tick = Math.floor(live / tickLen);
  const remaining = status.seconds - tick;
  const timeText = fmtTime(remaining, format);
  const prevText = fmtTime(remaining + 1, format);
  const sinceTick =
    timeText === prevText || tick === 0 ? 99 : live - tick * tickLen;
  const progress = interpolate(live, [0, span], [0.04, 1], clamp);
  const step = progress < 0.18 ? 0 : progress < 0.82 ? 1 : 2;
  const pct = `${Math.round(progress * 100)}%`;
  const done = Math.min(1, sp(T_FIN + 2, CHIP));
  const act: ActivityState = {
    timeText,
    prevText,
    sinceTick: format === "minutes" ? 99 : sinceTick,
    progress,
    step,
    done,
    detail: (status.details[step] ?? "").replace("{pct}", pct),
  };

  const cover = (() => {
    const pull = interpolate(f, [T_SWIPE, T_RELEASE], [0, 0.42], {
      ...clamp,
      easing: moveE,
    });
    const rest = interpolate(f, [T_RELEASE, T_RELEASE + 11], [0, 0.58], {
      ...clamp,
      easing: sheet,
    });
    return pull + rest;
  })();
  const bloom = iosSpring(T_START) * (1 - iosSpring(T_SWIPE + 4));
  const m = iosSpring(T_EXP) - iosSpring(T_COL);
  const islW = ISL_W + (CMP_W - ISL_W) * bloom + (EXP_W - CMP_W) * m;
  const islH = ISL_H + (EXP_H - ISL_H) * m;
  const islR = Math.min(islH / 2, 18 + (EXP_R - 18) * m);
  const compactOp =
    interpolate(m, [0.05, 0.35], [1, 0], clamp) * Math.min(1, bloom * 1.6);
  const expandOp = interpolate(m, [0.2, 0.6], [0, 1], clamp);

  const camT = [0, 22, 46, 160, 182, 204, 226];
  const camEase = { ...clamp, easing: camE };
  const camS = interpolate(
    f,
    camT,
    tall ? [1, 1, 1.5, 1.5, 1, 1, 1.04] : [1, 1, 1.85, 1.85, 1, 1, 1.38],
    camEase,
  );
  const camFy = interpolate(
    f,
    camT,
    [
      BH / 2,
      BH / 2,
      140,
      140,
      BH / 2,
      BH / 2,
      tall ? BH / 2 : BEZEL + CARD_Y + 30,
    ],
    camEase,
  );
  const camTy = interpolate(
    f,
    camT,
    [0.5, 0.5, 0.36, 0.36, 0.5, 0.5, 0.5].map((v) => v + yOff),
    camEase,
  );
  const rise = sp(0, HEAVY);
  const S = k * camS;

  const touches = [
    { t: 40, x: 250, y: 230 },
    { t: T_PRESS, x: SW / 2 + 4, y: 30 },
    { t: T_COL - 1, x: 296, y: 398 },
    { t: T_SWIPE - 10, x: 70, y: 90 },
    { t: T_SWIPE, x: 64, y: 14 },
    { t: T_RELEASE, x: 74, y: 380 },
  ];
  let touch = { x: touches[0].x, y: touches[0].y };
  for (let i = 0; i < touches.length - 1; i++) {
    const a = touches[i];
    const b = touches[i + 1];
    const dragging = a.t === T_SWIPE;
    const start = dragging ? a.t : a.t + 3;
    const end = dragging ? b.t : b.t - 2;
    if (f >= start) {
      const p = Math.min(1, (f - start) / (end - start));
      const e = moveE(p);
      const arc = dragging ? 0 : Math.sin(Math.PI * e) * 22;
      touch = {
        x: a.x + (b.x - a.x) * e + arc * 0.5,
        y: a.y + (b.y - a.y) * e - arc * 0.4,
      };
    }
  }
  const down = Math.min(
    1,
    interpolate(
      f,
      [T_PRESS, T_PRESS + 2, T_EXP + 2, T_EXP + 4],
      [0, 1, 1, 0],
      clamp,
    ) +
      bump(T_COL - 1) +
      interpolate(
        f,
        [T_SWIPE - 2, T_SWIPE, T_RELEASE, T_RELEASE + 2],
        [0, 1, 1, 0],
        clamp,
      ),
  );
  const touchOpacity = interpolate(
    f,
    [
      40,
      46,
      T_EXP + 4,
      T_EXP + 9,
      T_COL - 10,
      T_COL - 5,
      T_COL + 3,
      T_COL + 8,
      T_SWIPE - 10,
      T_SWIPE - 5,
      T_RELEASE + 2,
      T_RELEASE + 7,
    ],
    [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0],
    clamp,
  );
  const pressScale = 1 - 0.04 * bump(T_PRESS + 2);

  const cardIn = sp(T_RELEASE - 2, CARD);

  return (
    <AbsoluteFill
      style={{ fontFamily, overflow: "hidden", background: c.stage }}
    >
      <GshGround
        preset={ground ?? (theme === "light" ? "glasswork" : "earthshine")}
        params={groundParams}
        timeOffset={theme === "light" ? 3 : 6}
        timeScale={0.3}
      />
      <AbsoluteFill style={{ background: c.scrim }} />
      <div
        style={{
          position: "absolute",
          left: tall ? width * 0.08 : width * 0.075,
          top: tall ? height * 0.075 : height * 0.5 - height * 0.12,
          width: tall ? width * 0.84 : width * 0.38,
          height: tall ? height * 0.12 : height * 0.24,
          overflow: "hidden",
        }}
      >
        {lines.slice(0, LINE_AT.length).map((line, i) => {
          const at = LINE_AT[i];
          const next = LINE_AT[i + 1] ?? 100000;
          const pin = i === 0 ? rise : tween(f, at, at + 12);
          const pout = tween(f, next - 7, next, exitE);
          if (f < at - 1 || f > next + 1) return null;
          return (
            <div
              key={line}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: tall ? "flex-start" : "center",
                fontSize: tall ? height * 0.04 : height * 0.085,
                fontWeight: 300,
                lineHeight: 1.04,
                letterSpacing: "-0.035em",
                color: c.copy,
                textWrap: "balance",
                transform: `translateY(${(1 - pin) * 70 - pout * 50}%)`,
                opacity: pin * (1 - pout),
              }}
            >
              {line}
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
          transform: `translate(${phoneCx - (BW / 2) * S}px, ${height * camTy - camFy * S + (1 - rise) * height}px) scale(${S})`,
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
          <HomeScreen c={c} accent={accent} />
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
              padding: "4px 24px 0 44px",
              color: "#ffffff",
              zIndex: 5,
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 400 }}>9:41</span>
            <StatusIcons color="#ffffff" />
          </div>
          {cover > 0 ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `translateY(${-(1 - cover) * SH}px)`,
                zIndex: 10,
                overflow: "hidden",
              }}
            >
              <Wallpaper c={c} />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 30,
                  height: 54,
                  paddingTop: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <StatusIcons color="#ffffff" />
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 92,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 400 }}>{date}</div>
                <div
                  style={{
                    fontSize: 104,
                    fontWeight: 300,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    marginTop: 4,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  9:41
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  right: 12,
                  top: CARD_Y,
                  padding: "16px 18px 14px",
                  borderRadius: 26,
                  background: c.card,
                  backdropFilter: "blur(24px) saturate(1.4)",
                  opacity: cardIn,
                  transform: `translateY(${(1 - cardIn) * 14}px) scale(${0.97 + cardIn * 0.03})`,
                }}
              >
                <ActivityBody
                  s={act}
                  status={status}
                  accent={accent}
                  text={c.cardText}
                  muted={c.cardMuted}
                  track={c.cardTrack}
                  glyph={glyph}
                  compactTop={false}
                />
              </div>
              {[PATH.torch, PATH.camera].map((d, i) => (
                <div
                  key={d}
                  style={{
                    position: "absolute",
                    bottom: 50,
                    left: i ? SW - 46 - 50 : 46,
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    background: c.button,
                    backdropFilter: "blur(16px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Glyph d={d} size={22} color="#ffffff" sw={1.7} />
                </div>
              ))}
            </div>
          ) : null}
          <div
            style={{
              position: "absolute",
              top: ISL_TOP,
              left: (SW - islW) / 2,
              width: islW,
              height: islH,
              borderRadius: islR,
              background: "#000",
              zIndex: 40,
              overflow: "hidden",
              transform: `scale(${pressScale})`,
              transformOrigin: "50% 0",
              boxShadow: m > 0.02 ? "0 10px 30px rgba(0,0,0,0.28)" : "none",
            }}
          >
            {compactOp > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: ISL_H,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 10px 0 8px",
                  opacity: compactOp,
                  filter: `blur(${(1 - compactOp) * 4}px)`,
                }}
              >
                <div style={{ paddingLeft: 4 }}>
                  <Glyph d={glyph} size={18} color={accent} sw={1.75} />
                </div>
                {done > 0 ? (
                  <Glyph d={PATH.check} size={20} color={accent} sw={2} />
                ) : (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 7 }}
                  >
                    <Ticker
                      value={timeText}
                      prev={prevText}
                      since={act.sinceTick}
                      style={{ fontSize: 15, color: accent }}
                    />
                    <svg width={18} height={18} viewBox="0 0 18 18">
                      <circle
                        cx={9}
                        cy={9}
                        r={7}
                        fill="none"
                        stroke="rgba(255,255,255,0.18)"
                        strokeWidth={2.2}
                      />
                      <circle
                        cx={9}
                        cy={9}
                        r={7}
                        fill="none"
                        stroke={accent}
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        pathLength={1}
                        strokeDasharray={`${progress} 1`}
                        transform="rotate(-90 9 9)"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ) : null}
            {expandOp > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: (islW - EXP_W) / 2,
                  top: 0,
                  width: EXP_W,
                  height: EXP_H,
                  padding: "18px 22px 0",
                  opacity: expandOp,
                  filter: `blur(${(1 - expandOp) * 3}px)`,
                  transform: `scale(${(islW / EXP_W) * (0.96 + expandOp * 0.04)})`,
                  transformOrigin: "50% 0",
                }}
              >
                <ActivityBody
                  s={act}
                  status={status}
                  accent={accent}
                  text="#f5f5f7"
                  muted="rgba(235,235,245,0.6)"
                  track="rgba(255,255,255,0.16)"
                  glyph={glyph}
                  compactTop
                />
              </div>
            ) : null}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: (SW - 136) / 2,
              width: 136,
              height: 5,
              borderRadius: 3,
              background: "#ffffff",
              zIndex: 40,
            }}
          />
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
              zIndex: 45,
            }}
          />
        </Frame>
      </div>
    </AbsoluteFill>
  );
}
