"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
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
const { fontFamily: serif } = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface AppPour {
  name: string;
  origin: string;
  price: string;
  tone: [string, string];
}

export interface PromptToAppProps {
  prompt?: string;
  plan?: string;
  files?: string[];
  doneMessage?: string;
  projectName?: string;
  deployUrl?: string;
  siteName?: string;
  siteEyebrow?: string;
  siteHeadline?: string;
  siteBody?: string;
  siteLinks?: string[];
  pours?: AppPour[];
  children?: React.ReactNode;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_POURS: AppPour[] = [
  {
    name: "Skin-contact Riesling",
    origin: "Pfalz, DE · 2022",
    price: "14 / 58",
    tone: ["#E9B35A", "#C9792E"],
  },
  {
    name: "Carbonic Gamay",
    origin: "Beaujolais, FR · 2023",
    price: "13 / 52",
    tone: ["#9A2C3E", "#5E1424"],
  },
  {
    name: "Pét-nat Rosé",
    origin: "Sonoma, CA · 2023",
    price: "15 / 60",
    tone: ["#F2B8A6", "#D97C6B"],
  },
];

const PVW = 784;
const PV_BAR = 52;
const DEPLOY = { x: PVW - 12 - 96, y: 11, w: 96, h: 30 };

interface Layout {
  w: number;
  h: number;
  chat: { x: number; y: number; w: number; h: number; s: number };
  pv: { x: number; y: number; s: number };
  pvH: number;
  cursorFrom: { x: number; y: number };
}

const LAYOUT_WIDE: Layout = {
  w: 1280,
  h: 720,
  chat: { x: 72, y: 75, w: 408, h: 620, s: 0.92 },
  pv: { x: 487, y: 75, s: 0.92 },
  pvH: 620,
  cursorFrom: { x: 330, y: 610 },
};

const LAYOUT_TALL: Layout = {
  w: 1080,
  h: 1920,
  chat: { x: 82, y: 150, w: 560, h: 540, s: 1.6375 },
  pv: { x: 82, y: 1080, s: 1.17 },
  pvH: 600,
  cursorFrom: { x: 620, y: 930 },
};

const SITE = {
  bg: "#FBF7F1",
  ink: "#2A211C",
  muted: "#7A6A5E",
  line: "rgba(42,33,28,0.1)",
  brand: "#B4532A",
};

const clampX = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const enterE = Easing.bezier(0.22, 1, 0.36, 1);
const exitE = Easing.bezier(0.55, 0, 1, 0.45);
const camE = Easing.bezier(0.87, 0, 0.13, 1);
const tween = (f: number, a: number, b: number, easing = enterE) =>
  interpolate(f, [a, b], [0, 1], { ...clampX, easing });

type SpringCfg = { mass?: number; damping: number; stiffness?: number };
const HEAVY: SpringCfg = { mass: 1, damping: 26, stiffness: 120 };
const CARD: SpringCfg = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP: SpringCfg = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH: SpringCfg = { damping: 200 };

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

function RemocnR({ height, color }: { height: number; color: string }) {
  return (
    <svg
      viewBox="0 0 124.06 134.26"
      height={height}
      width={(height * 124.06) / 134.26}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden
    >
      <path fill={color} d={REMOCN_R_PATH} />
    </svg>
  );
}

function withAlpha(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return hex;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const T = {
  type: 12,
  cps: 2.3,
};

function timeline(promptLen: number, planWords: number) {
  const typeEnd = T.type + promptLen / T.cps;
  const send = typeEnd + 6;
  const think = send + 6;
  const planAt = think + 16;
  const planEnd = planAt + planWords * 1.3;
  const file = (i: number) => {
    const s = planEnd + 4 + i * 24;
    return { start: s, done: s + 20 };
  };
  const doneMsg = file(3).done + 4;
  const cursorIn = doneMsg + 4;
  const deployClick = cursorIn + 22;
  const deployed = deployClick + 24;
  return {
    typeEnd,
    send,
    think,
    planAt,
    planEnd,
    file,
    doneMsg,
    cursorIn,
    deployClick,
    deployed,
    end: deployed + 40,
  };
}

export function promptToAppDuration(
  prompt = DEFAULT_PROMPT,
  plan = DEFAULT_PLAN,
) {
  return Math.ceil(timeline(prompt.length, plan.split(" ").length).end);
}

const DEFAULT_PROMPT =
  "Build a landing page for Fernway, a neighborhood wine bar. Warm and editorial, with tonight’s pours and a booking button.";
const DEFAULT_PLAN =
  "I’ll build a one-page site for Fernway: a sticky nav, an editorial hero with a booking CTA, and a card grid for tonight’s pours.";

interface Pal {
  base: string;
  scrim: string;
  win: string;
  border: string;
  line: string;
  text: string;
  muted: string;
  faint: string;
  bubble: string;
  field: string;
  well: string;
  green: string;
  shadow: string;
  pop: string;
  popShadow: string;
  dark: boolean;
}

function palette(theme: "light" | "dark"): Pal {
  return theme === "dark"
    ? {
        base: "#0B0907",
        scrim: "rgba(8,6,5,0.28)",
        win: "#111113",
        border: "rgba(255,255,255,0.1)",
        line: "rgba(255,255,255,0.07)",
        text: "#EDEDEF",
        muted: "#A4A5AB",
        faint: "#707178",
        bubble: "#1C1C1F",
        field: "#161618",
        well: "#1A1A1D",
        green: "#3DD68C",
        shadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.08), 0 30px 80px -20px rgba(0,0,0,0.7)",
        pop: "#1A1A1D",
        popShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.1), 0 18px 40px -8px rgba(0,0,0,0.6)",
        dark: true,
      }
    : {
        base: "#EEF0F5",
        scrim: "rgba(246,246,248,0.22)",
        win: "#FFFFFF",
        border: "rgba(17,19,24,0.1)",
        line: "rgba(17,19,24,0.07)",
        text: "#18181B",
        muted: "#5F6168",
        faint: "#8E9096",
        bubble: "#F3F3F5",
        field: "#FFFFFF",
        well: "#F3F3F5",
        green: "#16A34A",
        shadow:
          "0 0 0 1px rgba(17,19,24,0.06), 0 2px 4px rgba(17,19,24,0.04), 0 28px 64px -18px rgba(30,34,60,0.28)",
        pop: "#FFFFFF",
        popShadow:
          "0 0 0 1px rgba(17,19,24,0.08), 0 4px 8px rgba(17,19,24,0.04), 0 18px 40px -8px rgba(17,19,24,0.2)",
        dark: false,
      };
}

const ICONS = {
  arrowUp: "M12 19V5M5.5 11.5 12 5l6.5 6.5",
  plus: "M12 5v14M5 12h14",
  paperclip:
    "M20.5 11.5 12.6 19.4a5 5 0 0 1-7.1-7.1l8.3-8.3a3.3 3.3 0 0 1 4.7 4.7l-8.3 8.3a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6",
  file: "M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8zM14 3v5h5",
  check: "M20 6.5 9.5 17 4 11.5",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4.5V11h-6.5",
  monitor: "M3.5 5h17v11h-17zM8.5 20h7M12 16v4",
  phoneDev:
    "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2",
  external:
    "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9.5h-13z",
  chevDown: "M6 9l6 6 6-6",
  chevRight: "M9 6l6 6-6 6",
  rocket:
    "M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1zM12 15l-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2zM9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5",
  share: "M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
} as const;
type IconName = keyof typeof ICONS;

function Icon({
  name,
  color,
  size = 16,
  stroke = 1.75,
}: {
  name: IconName;
  color: string;
  size?: number;
  stroke?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ flexShrink: 0, display: "block" }}
    >
      <path
        d={ICONS[name]}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner({
  color,
  size,
  frame,
}: {
  color: string;
  size: number;
  frame: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: "block", transform: `rotate(${frame * 22}deg)` }}
    >
      <circle
        cx={12}
        cy={12}
        r={9}
        fill="none"
        stroke={color}
        strokeOpacity={0.2}
        strokeWidth={2.5}
      />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function Cursor({ x, y, press }: { x: number; y: number; press: number }) {
  return (
    <svg
      width={22}
      height={26}
      viewBox="0 0 20 24"
      style={{
        position: "absolute",
        left: x - 2,
        top: y - 2,
        transformOrigin: "2px 2px",
        transform: `scale(${1 - 0.12 * press})`,
        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.28))",
        overflow: "visible",
        zIndex: 5,
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

function arc(
  a: { x: number; y: number },
  b: { x: number; y: number },
  p: number,
) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const lift = Math.sin(p * Math.PI) * Math.min(40, d * 0.12);
  return {
    x: a.x + dx * p + (-dy / d) * lift,
    y: a.y + dy * p + (dx / d) * lift,
  };
}

function Grow({ p, children }: { p: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateRows: `${p}fr` }}>
      <div style={{ minHeight: 0, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function Skeleton({
  rows,
  pal,
}: {
  rows: [number, number][];
  pal: { line: string };
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map(([w, h], i) => (
        <div
          key={i}
          style={{
            width: `${w}%`,
            height: h,
            borderRadius: 5,
            background: pal.line,
          }}
        />
      ))}
    </div>
  );
}

function Section({
  start,
  done,
  frame,
  label,
  accent,
  skeleton,
  children,
  height,
}: {
  start: number;
  done: number;
  frame: number;
  label: string;
  accent: string;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  height: number;
}) {
  const shown = tween(frame, start - 2, start + 5);
  const real = tween(frame, start + 8, start + 15);
  const edit =
    tween(frame, start, start + 5) * (1 - tween(frame, done + 2, done + 9));
  if (shown <= 0) return <div style={{ height }} />;
  return (
    <div style={{ position: "relative", height }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: shown * (1 - tween(frame, start + 8, start + 11)),
        }}
      >
        {skeleton}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: real,
          transform: `translateY(${(1 - real) * 6}px)`,
        }}
      >
        {children}
      </div>
      {edit > 0 ? (
        <>
          <div
            style={{
              position: "absolute",
              inset: 3,
              borderRadius: 6,
              boxShadow: `inset 0 0 0 1.5px ${withAlpha(accent, 0.85 * edit)}`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 3,
              top: 3,
              transform: `translateY(${(1 - edit) * 2}px)`,
              opacity: edit,
              fontFamily,
              fontSize: 11,
              fontWeight: 400,
              color: "#fff",
              background: accent,
              borderRadius: "6px 0 6px 0",
              padding: "2px 7px",
            }}
          >
            {label}
          </div>
        </>
      ) : null}
    </div>
  );
}

function SitePhoto({ id }: { id: string }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 260 216"
      preserveAspectRatio="xMidYMid slice"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5B3A2E" />
          <stop offset="0.55" stopColor="#8E5A3C" />
          <stop offset="1" stopColor="#C68A55" />
        </linearGradient>
        <linearGradient id={`${id}table`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6B4128" />
          <stop offset="1" stopColor="#3E2416" />
        </linearGradient>
        <linearGradient id={`${id}wine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8E2236" />
          <stop offset="1" stopColor="#4E0E1C" />
        </linearGradient>
      </defs>
      <rect width="260" height="216" fill={`url(#${id}sky)`} />
      <rect
        x="22"
        y="18"
        width="70"
        height="96"
        rx="3"
        fill="#F3C98B"
        opacity="0.18"
      />
      <rect
        x="100"
        y="18"
        width="70"
        height="96"
        rx="3"
        fill="#F3C98B"
        opacity="0.12"
      />
      <rect x="0" y="150" width="260" height="66" fill={`url(#${id}table)`} />
      <rect x="0" y="148" width="260" height="3" fill="#2A160D" opacity="0.5" />
      <path
        d="M170 68h12v22c8 6 11 12 11 22v40h-34v-40c0-10 3-16 11-22z"
        fill="#1F2A1E"
      />
      <rect x="161" y="110" width="30" height="24" rx="2" fill="#EDE2CC" />
      <rect x="166" y="117" width="20" height="2.5" rx="1" fill="#8E5A3C" />
      <rect x="166" y="123" width="14" height="2" rx="1" fill="#B9A78A" />
      <path
        d="M96 96h34c0 22-6 34-17 36-11-2-17-14-17-36z"
        fill="#FFFFFF"
        opacity="0.22"
      />
      <path
        d="M98 112h30c-1 12-6 19-15 20-9-1-14-8-15-20z"
        fill={`url(#${id}wine)`}
      />
      <rect
        x="111.5"
        y="132"
        width="3"
        height="16"
        fill="#FFFFFF"
        opacity="0.3"
      />
      <ellipse
        cx="113"
        cy="150"
        rx="12"
        ry="2.5"
        fill="#FFFFFF"
        opacity="0.3"
      />
      <rect x="54" y="122" width="12" height="28" rx="2" fill="#F1E6D2" />
      <path d="M60 110c3 4 3 8 0 11-3-3-3-7 0-11z" fill="#FFD27A" />
    </svg>
  );
}

function Site({
  frame,
  accent,
  file,
  siteName,
  siteEyebrow,
  siteHeadline,
  siteBody,
  siteLinks,
  pours,
}: {
  frame: number;
  accent: string;
  file: (i: number) => { start: number; done: number };
  siteName: string;
  siteEyebrow: string;
  siteHeadline: string;
  siteBody: string;
  siteLinks: string[];
  pours: AppPour[];
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const skel = { line: "rgba(42,33,28,0.08)" };
  const btn = (label: string, primary: boolean) => (
    <div
      style={{
        height: 34,
        padding: "0 14px",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 400,
        background: primary ? SITE.ink : "transparent",
        color: primary ? "#FBF7F1" : SITE.ink,
        boxShadow: primary ? "none" : `inset 0 0 0 1px ${SITE.line}`,
      }}
    >
      {label}
    </div>
  );
  return (
    <div
      style={{
        background: SITE.bg,
        height: "100%",
        fontFamily,
        color: SITE.ink,
      }}
    >
      <Section
        start={file(0).start}
        done={file(0).done}
        frame={frame}
        label="Nav"
        accent={accent}
        height={58}
        skeleton={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              height: 58,
              padding: "0 32px",
            }}
          >
            <div
              style={{
                width: 84,
                height: 18,
                borderRadius: 5,
                background: skel.line,
              }}
            />
            {[38, 56, 44, 34].map((w) => (
              <div
                key={w}
                style={{
                  width: w,
                  height: 10,
                  borderRadius: 5,
                  background: skel.line,
                }}
              />
            ))}
            <div
              style={{
                marginLeft: "auto",
                width: 104,
                height: 34,
                borderRadius: 8,
                background: skel.line,
              }}
            />
          </div>
        }
      >
        <div
          style={{
            height: 58,
            display: "flex",
            alignItems: "center",
            padding: "0 32px",
            borderBottom: `1px solid ${SITE.line}`,
          }}
        >
          <div
            style={{
              fontFamily: serif,
              fontSize: 24,
              letterSpacing: "-0.01em",
            }}
          >
            {siteName}
          </div>
          <div
            style={{
              marginLeft: 36,
              display: "flex",
              gap: 22,
              fontSize: 13,
              color: SITE.muted,
            }}
          >
            {siteLinks.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
          <div style={{ marginLeft: "auto" }}>{btn("Book a table", true)}</div>
        </div>
      </Section>

      <Section
        start={file(1).start}
        done={file(1).done}
        frame={frame}
        label="Hero"
        accent={accent}
        height={276}
        skeleton={
          <div style={{ display: "flex", gap: 32, padding: "32px 32px 0" }}>
            <div style={{ flex: 1 }}>
              <Skeleton
                rows={[
                  [34, 10],
                  [92, 36],
                  [74, 36],
                  [84, 10],
                  [56, 10],
                  [42, 34],
                ]}
                pal={skel}
              />
            </div>
            <div
              style={{
                width: 260,
                height: 216,
                borderRadius: 12,
                background: skel.line,
              }}
            />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 32, padding: "28px 32px 0" }}>
          <div style={{ flex: 1, paddingTop: 4 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: SITE.brand,
              }}
            >
              {siteEyebrow}
            </div>
            <div
              style={{
                fontFamily: serif,
                fontSize: 44,
                lineHeight: 1.02,
                letterSpacing: "-0.015em",
                marginTop: 12,
                textWrap: "balance",
              }}
            >
              {siteHeadline}
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.55,
                color: SITE.muted,
                marginTop: 14,
                maxWidth: 360,
                textWrap: "pretty",
              }}
            >
              {siteBody}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {btn("Book a table", true)}
              {btn("See the menu", false)}
            </div>
          </div>
          <div
            style={{
              width: 260,
              height: 216,
              borderRadius: 12,
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
            }}
          >
            <SitePhoto id={id} />
          </div>
        </div>
      </Section>

      <Section
        start={file(2).start}
        done={file(2).done}
        frame={frame}
        label="PourCards"
        accent={accent}
        height={196}
        skeleton={
          <div style={{ display: "flex", gap: 14, padding: "58px 32px 0" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 140,
                  borderRadius: 10,
                  background: skel.line,
                }}
              />
            ))}
          </div>
        }
      >
        <div style={{ padding: "18px 32px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <div style={{ fontFamily: serif, fontSize: 24 }}>
              Tonight’s pours
            </div>
            <div
              style={{ marginLeft: "auto", fontSize: 13, color: SITE.muted }}
            >
              Full wine list →
            </div>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 12 }}>
            {pours.slice(0, 3).map((p, i) => {
              const a = tween(
                frame,
                file(2).start + 9 + i * 3,
                file(2).start + 17 + i * 3,
              );
              return (
                <div
                  key={p.name}
                  style={{
                    flex: 1,
                    borderRadius: 10,
                    background: "#FFFFFF",
                    boxShadow:
                      "0 0 0 1px rgba(42,33,28,0.08), 0 1px 2px rgba(42,33,28,0.04)",
                    padding: 8,
                    opacity: a,
                    transform: `translateY(${(1 - a) * 8}px)`,
                  }}
                >
                  <div
                    style={{
                      height: 64,
                      borderRadius: 6,
                      background: `linear-gradient(135deg, ${p.tone[0]}, ${p.tone[1]})`,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <svg
                      width={40}
                      height={64}
                      viewBox="0 0 40 64"
                      style={{ position: "absolute", right: 16, bottom: 0 }}
                    >
                      <path
                        d="M16 4h8v14c6 4 8 9 8 16v30H8V34c0-7 2-12 8-16z"
                        fill="rgba(20,12,8,0.32)"
                      />
                      <rect
                        x="11"
                        y="38"
                        width="18"
                        height="14"
                        rx="1.5"
                        fill="rgba(255,250,240,0.75)"
                      />
                    </svg>
                  </div>
                  <div style={{ padding: "8px 4px 2px" }}>
                    <div style={{ fontSize: 13, fontWeight: 400 }}>
                      {p.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 12,
                        color: SITE.muted,
                        marginTop: 3,
                      }}
                    >
                      <span>{p.origin}</span>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontVariantNumeric: "tabular-nums",
                          color: SITE.ink,
                        }}
                      >
                        {p.price}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>
    </div>
  );
}

export function PromptToApp({
  prompt = DEFAULT_PROMPT,
  plan = DEFAULT_PLAN,
  files = [
    "components/Nav.tsx",
    "components/Hero.tsx",
    "components/PourCards.tsx",
    "app/page.tsx",
  ],
  doneMessage = "Fernway is ready. The booking button links to your reservations page.",
  projectName = "fernway-site",
  deployUrl = "fernway.remocn.app",
  siteName = "Fernway",
  siteEyebrow = "Wine bar · Open late",
  siteHeadline = "Natural wine, small plates, one long table.",
  siteBody = "Low-intervention bottles and seasonal plates in the Mission. Walk-ins welcome until 10.",
  siteLinks = ["Menu", "Wine list", "Events", "Visit"],
  pours = DEFAULT_POURS,
  children,
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: PromptToAppProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const tall = H > W;
  const L = tall ? LAYOUT_TALL : LAYOUT_WIDE;
  const u = W / L.w;
  const pal = palette(theme);
  const planWords = plan.split(" ");
  const tl = timeline(prompt.length, planWords.length);
  const file = (i: number) => tl.file(i);
  const sp = (at: number, config: SpringCfg, durationInFrames?: number) =>
    spring({ frame: frame - at, fps, config, durationInFrames });

  const chatIn = sp(0, HEAVY);
  const dock = sp(tl.send - 6, HEAVY);
  const pvIn = sp(tl.send - 2, HEAVY);
  const chatW = L.chat.w * L.chat.s;
  const chatH = L.chat.h * L.chat.s;
  const chatX = interpolate(
    dock,
    [0, 1],
    [tall ? L.chat.x : (L.w - chatW) / 2, L.chat.x],
  );
  const chatY = interpolate(
    dock,
    [0, 1],
    [tall ? (L.h - chatH) / 2 : L.chat.y, L.chat.y],
  );
  const typed = Math.max(
    0,
    Math.min(prompt.length, Math.floor((frame - T.type) * T.cps)),
  );
  const sent = frame >= tl.send + 1;
  const sendScale =
    1 - 0.06 * (sp(tl.send - 2, MORPH, 3) - sp(tl.send + 1, CHIP));
  const emptyOut = tween(frame, tl.send + 1, tl.send + 6, exitE);
  const bubble = sp(tl.send, MORPH);
  const thinkIn = sp(tl.think, MORPH);
  const thinking = frame < tl.planAt;
  const planIn = sp(tl.planAt - 2, MORPH);
  const filesIn = (i: number) => sp(file(i).start - 2, MORPH);
  const doneIn = sp(tl.doneMsg, MORPH);
  const ready =
    tween(frame, tl.think, tl.think + 6) *
    (1 - tween(frame, file(0).start - 4, file(0).start + 2, exitE));

  const target = {
    x: L.pv.x + L.pv.s * (DEPLOY.x + DEPLOY.w / 2 + 6),
    y: L.pv.y + L.pv.s * (DEPLOY.y + DEPLOY.h / 2 + 4),
  };
  const cp = sp(tl.cursorIn, CARD, tl.deployClick - 2 - tl.cursorIn);
  const cur = arc(L.cursorFrom, target, cp);
  const cursorOp =
    tween(frame, tl.cursorIn - 4, tl.cursorIn + 2) *
    (1 - tween(frame, tl.deployed + 12, tl.deployed + 18, exitE));
  const press = sp(tl.deployClick - 2, MORPH, 3) - sp(tl.deployClick + 2, CHIP);
  const deploying = frame >= tl.deployClick + 1 && frame < tl.deployed;
  const isLive = frame >= tl.deployed;
  const hover = tween(frame, tl.deployClick - 8, tl.deployClick - 4);
  const pop = sp(tl.deployed + 2, CHIP);
  const popOp = tween(frame, tl.deployed + 2, tl.deployed + 6);
  const urlSwap = tween(frame, tl.deployed, tl.deployed + 8);

  const cam = interpolate(frame, [0, tl.end], [1, 1.025], {
    ...clampX,
    easing: camE,
  });

  const composerText = sent ? "" : prompt.slice(0, typed);
  const caretOn = !sent && Math.floor(frame / 8) % 2 === 0;
  const ink = pal.dark ? "#EDEDEF" : "#18181B";
  const inkOn = pal.dark ? "#18181B" : "#FFFFFF";

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
        background: pal.base,
      }}
    >
      <GshGround
        preset={ground ?? (pal.dark ? "hearth" : "paper-crease")}
        params={groundParams}
        timeOffset={pal.dark ? 5 : 3}
        timeScale={0.3}
      />
      <AbsoluteFill style={{ background: pal.scrim }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: L.w,
          height: L.h,
          transformOrigin: "0 0",
          transform: `scale(${u})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${cam})`,
            transformOrigin: `${(target.x / L.w) * 100}% ${(target.y / L.h) * 100}%`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: chatX,
              top: chatY,
              width: L.chat.w,
              height: L.chat.h,
              transformOrigin: "0 0",
              transform: `translateY(${(1 - chatIn) * 40}px) scale(${L.chat.s})`,
              opacity: Math.min(1, chatIn * 1.6),
            }}
          >
            <div
              style={{
                position: "relative",
                width: L.chat.w,
                height: L.chat.h,
                borderRadius: 18,
                background: pal.win,
                boxShadow: pal.shadow,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  height: 52,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 20px",
                  borderBottom: `1px solid ${pal.line}`,
                  fontSize: 15,
                }}
              >
                <RemocnR height={15} color={pal.text} />
                <span style={{ color: pal.faint }}>/</span>
                <span style={{ color: pal.text }}>{projectName}</span>
                <Icon name="chevDown" color={pal.faint} size={14} />
              </div>
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "0 22px",
                }}
              >
                <div style={{ marginBottom: "auto", paddingTop: 20 }}>
                  {frame >= tl.send ? (
                    <Grow p={bubble}>
                      <div
                        style={{
                          marginLeft: 28,
                          background: pal.bubble,
                          borderRadius: 14,
                          padding: "12px 15px",
                          fontSize: 15,
                          lineHeight: 1.5,
                          color: pal.text,
                          textWrap: "pretty",
                          opacity: tween(frame, tl.send, tl.send + 4),
                        }}
                      >
                        {prompt}
                      </div>
                    </Grow>
                  ) : null}
                  {frame >= tl.think ? (
                    <Grow p={thinkIn}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 20,
                          fontSize: 14,
                          color: pal.muted,
                        }}
                      >
                        <RemocnR height={13} color={pal.text} />
                        {thinking ? (
                          <span
                            style={{
                              opacity:
                                0.45 + 0.55 * Math.abs(Math.cos(frame / 9)),
                            }}
                          >
                            Thinking
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              color: pal.faint,
                            }}
                          >
                            Thought for 3s
                            <Icon
                              name="chevRight"
                              color={pal.faint}
                              size={13}
                            />
                          </span>
                        )}
                      </div>
                    </Grow>
                  ) : null}
                  {frame >= tl.planAt - 2 ? (
                    <Grow p={planIn}>
                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 15,
                          lineHeight: 1.5,
                          color: pal.text,
                          textWrap: "pretty",
                        }}
                      >
                        {planWords.map((w, k) => (
                          <span
                            key={k}
                            style={{
                              opacity: tween(
                                frame,
                                tl.planAt + k * 1.3,
                                tl.planAt + k * 1.3 + 5,
                              ),
                            }}
                          >
                            {w}{" "}
                          </span>
                        ))}
                      </div>
                    </Grow>
                  ) : null}
                  {frame >= file(0).start - 2 ? (
                    <div
                      style={{
                        marginTop: 14,
                        opacity: tween(
                          frame,
                          file(0).start - 2,
                          file(0).start + 4,
                        ),
                      }}
                    >
                      {files.slice(0, 4).map((f, i) => {
                        const st =
                          frame >= file(i).done
                            ? 2
                            : frame >= file(i).start
                              ? 1
                              : 0;
                        const ok = sp(file(i).done, CHIP);
                        if (i > 0 && frame < file(i).start - 2) return null;
                        return (
                          <Grow key={f} p={i === 0 ? 1 : filesIn(i)}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                height: 32,
                                fontSize: 14,
                                color: pal.muted,
                                borderTop:
                                  i === 0 ? "none" : `1px solid ${pal.line}`,
                              }}
                            >
                              <span
                                style={{
                                  width: 58,
                                  color: st === 1 ? pal.text : pal.faint,
                                }}
                              >
                                {st === 2 ? "Edited" : "Writing"}
                              </span>
                              <span
                                style={{
                                  fontFamily: mono,
                                  fontSize: 13,
                                  color: st === 1 ? pal.text : pal.muted,
                                }}
                              >
                                {f}
                              </span>
                              <span
                                style={{
                                  marginLeft: "auto",
                                  position: "relative",
                                  width: 15,
                                  height: 15,
                                }}
                              >
                                <span
                                  style={{
                                    position: "absolute",
                                    inset: 0,
                                    opacity: 1 - Math.min(1, ok),
                                  }}
                                >
                                  <Spinner
                                    color={pal.muted}
                                    size={15}
                                    frame={frame}
                                  />
                                </span>
                                <span
                                  style={{
                                    position: "absolute",
                                    inset: 0,
                                    opacity: Math.min(1, ok),
                                    transform: `scale(${0.4 + 0.6 * ok})`,
                                  }}
                                >
                                  <Icon
                                    name="check"
                                    color={pal.green}
                                    size={15}
                                    stroke={2}
                                  />
                                </span>
                              </span>
                            </div>
                          </Grow>
                        );
                      })}
                    </div>
                  ) : null}
                  {frame >= tl.doneMsg ? (
                    <Grow p={doneIn}>
                      <div
                        style={{
                          marginTop: 12,
                          fontSize: 15,
                          lineHeight: 1.5,
                          color: pal.text,
                          opacity: tween(frame, tl.doneMsg + 2, tl.doneMsg + 8),
                          textWrap: "pretty",
                        }}
                      >
                        {doneMessage}
                      </div>
                    </Grow>
                  ) : null}
                </div>
              </div>

              {emptyOut < 1 ? (
                <div
                  style={{
                    position: "absolute",
                    left: 28,
                    right: 28,
                    top: L.chat.h * 0.3,
                    opacity: 1 - emptyOut,
                    transform: `translateY(${-emptyOut * 10}px)`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 300,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.15,
                      color: pal.text,
                    }}
                  >
                    What should we build?
                  </div>
                </div>
              ) : null}

              <div style={{ padding: "12px 14px 14px", flexShrink: 0 }}>
                <div
                  style={{
                    borderRadius: 14,
                    background: pal.field,
                    boxShadow: `inset 0 0 0 1px ${pal.border}`,
                    padding: "12px 10px 10px 14px",
                  }}
                >
                  <div
                    style={{
                      height: 45,
                      fontSize: 15,
                      lineHeight: 1.5,
                      color: composerText ? pal.text : pal.faint,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div style={{ marginBottom: "auto" }}>
                      {composerText || "Describe an app or a page"}
                      {caretOn && composerText ? (
                        <span
                          style={{
                            display: "inline-block",
                            width: 1.5,
                            height: 18,
                            background: ink,
                            verticalAlign: "-3px",
                            marginLeft: 1,
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginTop: 6,
                    }}
                  >
                    <Icon name="paperclip" color={pal.faint} size={17} />
                    <div
                      style={{
                        marginLeft: "auto",
                        width: 32,
                        height: 32,
                        borderRadius: 99,
                        background:
                          typed > 0 && !sent
                            ? ink
                            : pal.dark
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(17,19,24,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: `scale(${sendScale})`,
                      }}
                    >
                      {sent && frame < tl.doneMsg ? (
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            background: pal.muted,
                          }}
                        />
                      ) : (
                        <Icon
                          name="arrowUp"
                          color={typed > 0 && !sent ? inkOn : pal.faint}
                          size={16}
                          stroke={2}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: L.pv.x,
              top: L.pv.y,
              width: PVW,
              height: L.pvH,
              transformOrigin: "0 0",
              transform: `translateY(${(1 - pvIn) * 56}px) scale(${L.pv.s})`,
              opacity: Math.min(1, pvIn * 1.6),
            }}
          >
            <div
              style={{
                position: "relative",
                width: PVW,
                height: L.pvH,
                borderRadius: 14,
                overflow: "hidden",
                background: pal.win,
                boxShadow: pal.shadow,
              }}
            >
              <div
                style={{
                  height: PV_BAR,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "0 12px 0 16px",
                  borderBottom: `1px solid ${pal.line}`,
                }}
              >
                <div style={{ display: "flex", gap: 7 }}>
                  {[0, 1, 2].map((d) => (
                    <div
                      key={d}
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 99,
                        boxShadow: `inset 0 0 0 1px ${pal.border}`,
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    marginLeft: 70,
                    width: 330,
                    height: 30,
                    borderRadius: 8,
                    background: pal.well,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    color: pal.muted,
                    position: "relative",
                    overflow: "hidden",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      opacity: 1 - urlSwap,
                      transform: `translateY(${-urlSwap * 8}px)`,
                    }}
                  >
                    localhost:3000
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      opacity: urlSwap,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      transform: `translateY(${(1 - urlSwap) * 8}px)`,
                    }}
                  >
                    <Icon name="lock" color={pal.muted} size={12} />
                    <span style={{ color: pal.text }}>{deployUrl}</span>
                  </span>
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: DEPLOY.x,
                  top: DEPLOY.y,
                  width: DEPLOY.w,
                  height: DEPLOY.h,
                  borderRadius: 8,
                  background: isLive ? "transparent" : ink,
                  boxShadow: isLive ? `inset 0 0 0 1px ${pal.border}` : "none",
                  color: isLive ? pal.text : inkOn,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  fontSize: 14,
                  transform: `scale(${1 - 0.04 * press})`,
                  filter: `brightness(${1 + (pal.dark ? -0.08 : 0.25) * hover * (isLive ? 0 : 1)})`,
                }}
              >
                {deploying ? (
                  <Spinner color={inkOn} size={13} frame={frame} />
                ) : isLive ? (
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 99,
                      background: pal.green,
                    }}
                  />
                ) : null}
                {deploying ? "Deploying" : isLive ? "Live" : "Deploy"}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: PV_BAR,
                  bottom: 0,
                  background: pal.dark ? "#141416" : "#F6F6F7",
                }}
              >
                {children ? (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      opacity: tween(frame, file(0).start, file(0).start + 10),
                    }}
                  >
                    {children}
                  </div>
                ) : (
                  <div
                    style={{
                      height: "100%",
                      opacity: tween(
                        frame,
                        file(0).start - 4,
                        file(0).start + 2,
                      ),
                    }}
                  >
                    <Site
                      frame={frame}
                      accent={accent}
                      file={file}
                      siteName={siteName}
                      siteEyebrow={siteEyebrow}
                      siteHeadline={siteHeadline}
                      siteBody={siteBody}
                      siteLinks={siteLinks}
                      pours={pours}
                    />
                  </div>
                )}
                {ready > 0 ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 9,
                      opacity: ready,
                      fontSize: 14,
                      color: pal.muted,
                    }}
                  >
                    <Spinner color={pal.muted} size={14} frame={frame} />
                    Starting dev server
                  </div>
                ) : null}
              </div>

              {popOp > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    right: 12,
                    top: DEPLOY.y + DEPLOY.h + 8,
                    width: 316,
                    borderRadius: 14,
                    background: pal.pop,
                    boxShadow: pal.popShadow,
                    padding: 6,
                    opacity: popOp,
                    transform: `translateY(${(1 - pop) * -6}px) scale(${0.94 + 0.06 * pop})`,
                    transformOrigin: `${316 - DEPLOY.w / 2}px 0`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      padding: "8px 10px 10px",
                    }}
                  >
                    <span style={{ fontSize: 16, color: pal.text }}>
                      Deployed to production
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 13,
                        color: pal.faint,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      21.4s
                    </span>
                  </div>
                  <div
                    style={{
                      height: 40,
                      borderRadius: 8,
                      background: pal.well,
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "0 5px 0 12px",
                      fontSize: 14,
                      color: pal.text,
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 99,
                        background: pal.green,
                      }}
                    />
                    {deployUrl}
                    <div
                      style={{
                        marginLeft: "auto",
                        height: 30,
                        padding: "0 11px",
                        borderRadius: 6,
                        background: ink,
                        color: inkOn,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 13,
                      }}
                    >
                      Visit
                      <Icon
                        name="external"
                        color={inkOn}
                        size={12}
                        stroke={1.75}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {cursorOp > 0 ? (
            <div style={{ opacity: cursorOp }}>
              <Cursor x={cur.x} y={cur.y} press={press} />
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
}
