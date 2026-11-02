"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/Onest";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
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

const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface ReelsStory {
  src?: string;
}

export interface ReelsFeedProps {
  account?: string;
  stories?: ReelsStory[];
  reelSrc?: string;
  pollQuestion?: string;
  pollOptions?: [string, string];
  likes?: [string, string];
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  lines?: [string, string, string];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const SW = 393;
const SH = 852;
const BEZEL = 11;
const BW = SW + BEZEL * 2;
const BH = SH + BEZEL * 2;

const TAP_STORY = 34;
const OPEN = 37;
const SEG = [44, 96, 144, 200];
const POLL_TAP = 170;
const SWIPE = 200;
const REEL = 214;
const DT = 240;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const glide = Easing.bezier(0.65, 0, 0.35, 1);
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const P = {
  heart:
    "M12 20.3s-7.6-4.6-9.4-9.5C1.3 7.4 3.5 4 7.1 4c2.1 0 3.7 1.1 4.9 2.9C13.2 5.1 14.8 4 16.9 4c3.6 0 5.8 3.4 4.5 6.8-1.8 4.9-9.4 9.5-9.4 9.5z",
  comment: "M20.6 16.6a9 9 0 1 0-3.7 3.6L21.6 21.6z",
  send: "M21.6 2.6L2.6 9.2l7.6 3.6 3.4 7.8zM21.6 2.6L10.2 12.8",
  repost:
    "M16.5 2.5L20 6l-3.5 3.5M20 6H8.5A4.5 4.5 0 0 0 4 10.5V11M7.5 21.5L4 18l3.5-3.5M4 18h11.5a4.5 4.5 0 0 0 4.5-4.5V13",
  bookmark: "M19 21l-7-6-7 6V3h14z",
  plus: "M12 4v16M4 12h16",
  home: "M3.5 10.3L12 3l8.5 7.3V21h-6v-6.2h-5V21h-6z",
  reels:
    "M4 4h16v16H4zM4 8.8h16M9 4l3 4.8M14.2 4l3 4.8M10.4 12.3v5.3l4.6-2.65z",
  search: "M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM16 16l5.3 5.3",
  close: "M6 6l12 12M18 6L6 18",
  music:
    "M9 17.5V5.5l10-2v11.5M9 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 15a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  sliders: "M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4",
};

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type Mood = "sunset" | "dusk" | "golden" | "alpine";
const MOODS: Record<
  Mood,
  { sky: string[]; sun: string; ridges: string[]; water: string; sunY: number }
> = {
  sunset: {
    sky: ["#1d2550", "#4c3f7c", "#b9677c", "#ee9a68", "#fbd393"],
    sun: "#fff0c4",
    ridges: ["#9a7290", "#6a4f74", "#3d2f52", "#1b1730"],
    water: "#221c38",
    sunY: 0.78,
  },
  dusk: {
    sky: ["#070b1d", "#16224a", "#2f4a82", "#7488b8", "#d4b3b5"],
    sun: "#ffe2c0",
    ridges: ["#4d5c88", "#2f3b63", "#1b2443", "#0c1126"],
    water: "#0d1328",
    sunY: 0.9,
  },
  golden: {
    sky: ["#5d8fc8", "#9dbfe0", "#efd5a8", "#f5b475", "#ee9361"],
    sun: "#fff6dc",
    ridges: ["#b9a19c", "#8b7684", "#5b4f66", "#2e2a3a"],
    water: "#3a3446",
    sunY: 0.72,
  },
  alpine: {
    sky: ["#2a64ad", "#4f8bcb", "#8cb7e0", "#cfe1f0", "#eef3f6"],
    sun: "#ffffff",
    ridges: ["#a8bfd8", "#7894b5", "#48618a", "#233650"],
    water: "#2a3f5c",
    sunY: 0.35,
  },
};

const rgb = (hex: string) =>
  [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
const mix = (a: string, b: string, t: number) => {
  const [x, y] = [rgb(a), rgb(b)];
  return `rgb(${x.map((v, i) => Math.round((v + (y[i] - v) * t) * 255)).join(",")})`;
};

function noise1(x: number) {
  const i = Math.floor(x);
  const t = x - i;
  const u = t * t * (3 - 2 * t);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

function ridgePath(seed: number, base: number, amp: number, sharp: number) {
  const pts: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const x = (i / 80) * 400;
    const n =
      0.6 * (1 - Math.abs(noise1(x / 80 + seed) * 2 - 1) * sharp) +
      0.27 * noise1(x / 26 + seed * 3.1) +
      0.13 * noise1(x / 8 + seed * 7.3);
    pts.push(`${x.toFixed(1)} ${(base - amp * n).toFixed(1)}`);
  }
  return `M0 500L${pts.join("L")}L400 500Z`;
}

function treePath(seed: number, base: number) {
  const pts: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const x = i * 2;
    const tree = noise1(x / 3.2 + seed) ** 3 * 13;
    const swell = noise1(x / 40 + seed * 2) * 9;
    pts.push(`${x} ${(base - 3 - swell - tree).toFixed(1)}`);
  }
  return `M0 500L${pts.join("L")}L400 500Z`;
}

function Photo({
  mood = "sunset",
  seed = 1,
  zoom = 1,
}: {
  mood?: Mood;
  seed?: number;
  zoom?: number;
}) {
  const id = `ph${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const m = MOODS[mood];
  const HZ = 300;
  const sunX = 110 + hash(seed * 5) * 180;
  const sunY = HZ * m.sunY;
  const [cr, cg, cb] = rgb(m.sun);
  const ridges = m.ridges.map((col, i) => ({
    col,
    top: mix(col, m.sky[3], 0.35 - i * 0.08),
    d: ridgePath(
      seed + i * 1.7,
      HZ - 6 + i * 3,
      [120, 84, 52, 30][i],
      0.9 - i * 0.15,
    ),
    blur: [1.4, 0.8, 0.4, 0][i],
  }));
  const trees = treePath(seed * 3, HZ);
  const land = (reflect: boolean) => (
    <>
      {ridges.map((r, i) => (
        <path
          key={r.col}
          d={r.d}
          fill={`url(#${id}m${i})`}
          filter={r.blur && !reflect ? `url(#${id}r${i})` : undefined}
        />
      ))}
      <path d={trees} fill={mix(m.ridges[3], "#000000", 0.35)} />
    </>
  );
  const sky = (
    <>
      <rect width={400} height={HZ} fill={`url(#${id}s)`} />
      <rect
        width={400}
        height={HZ}
        filter={`url(#${id}cl)`}
        mask={`url(#${id}cm)`}
      />
      <circle cx={sunX} cy={sunY} r={190} fill={`url(#${id}g)`} />
      <circle
        cx={sunX}
        cy={sunY}
        r={15}
        fill={m.sun}
        filter={`url(#${id}b1)`}
      />
    </>
  );
  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      style={{ display: "block", position: "absolute", inset: 0 }}
    >
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          {m.sky.map((s, i) => (
            <stop key={s} offset={i / (m.sky.length - 1)} stopColor={s} />
          ))}
        </linearGradient>
        {ridges.map((r, i) => (
          <linearGradient
            key={r.col}
            id={`${id}m${i}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0.55" stopColor={r.top} />
            <stop offset="0.75" stopColor={r.col} />
          </linearGradient>
        ))}
        <radialGradient id={`${id}g`}>
          <stop offset="0" stopColor={m.sun} stopOpacity={0.8} />
          <stop offset="0.12" stopColor={m.sun} stopOpacity={0.35} />
          <stop offset="0.45" stopColor={m.sun} stopOpacity={0.08} />
          <stop offset="1" stopColor={m.sun} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={m.water} stopOpacity={0.3} />
          <stop offset="1" stopColor={m.water} stopOpacity={0.9} />
        </linearGradient>
        <linearGradient id={`${id}cmg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.9} />
          <stop offset="0.75" stopColor="#fff" stopOpacity={0.5} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}cm`}>
          <rect width={400} height={HZ} fill={`url(#${id}cmg)`} />
        </mask>
        <radialGradient id={`${id}v`} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.42} />
        </radialGradient>
        <filter id={`${id}cl`} x="0" y="0" width="1" height="1">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.0035 0.02"
            numOctaves={4}
            seed={seed}
          />
          <feColorMatrix
            values={`0 0 0 0 ${cr} 0 0 0 0 ${cg} 0 0 0 0 ${cb} 2.4 0 0 0 -1.05`}
          />
          <feGaussianBlur stdDeviation={0.6} />
        </filter>
        <filter id={`${id}b1`} x="-1" y="-1" width="3" height="3">
          <feGaussianBlur stdDeviation={2.5} />
        </filter>
        <filter id={`${id}gl`} x="-1" y="-1" width="3" height="3">
          <feGaussianBlur stdDeviation="5 10" />
        </filter>
        {ridges.map((r, i) => (
          <filter
            key={r.col}
            id={`${id}r${i}`}
            x="-0.1"
            y="-0.2"
            width="1.2"
            height="1.4"
          >
            <feGaussianBlur stdDeviation={r.blur} />
          </filter>
        ))}
        <clipPath id={`${id}c`}>
          <rect y={HZ} width={400} height={200} />
        </clipPath>
        <filter id={`${id}rip`} x="0" y="0" width="1" height="1">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.003 0.12"
            numOctaves={2}
            seed={seed}
          />
          <feDisplacementMap
            in="SourceGraphic"
            scale={14}
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="0.8 1.6" />
        </filter>
        <filter id={`${id}n`} x="0" y="0" width="1" height="1">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={0.9}
            numOctaves={2}
            seed={seed + 3}
          />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.16 0" />
        </filter>
      </defs>
      <g transform={`translate(200 250) scale(${zoom}) translate(-200 -250)`}>
        {sky}
        {land(false)}
        <g clipPath={`url(#${id}c)`} filter={`url(#${id}rip)`}>
          <g transform={`translate(0 ${HZ * 2}) scale(1 -1)`}>
            {sky}
            {land(true)}
          </g>
          <rect y={HZ} width={400} height={200} fill={`url(#${id}w)`} />
          <ellipse
            cx={sunX}
            cy={HZ + 70}
            rx={9}
            ry={70}
            fill={m.sun}
            opacity={0.35}
            filter={`url(#${id}gl)`}
          />
        </g>
      </g>
      <rect
        width={400}
        height={500}
        filter={`url(#${id}n)`}
        style={{ mixBlendMode: "overlay" }}
      />
      <rect width={400} height={500} fill={`url(#${id}v)`} />
    </svg>
  );
}

function Icon({
  d,
  size = 24,
  color,
  sw = 1.9,
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

const ACCOUNTS = [
  { name: "kitebase", bg: "#5f7f86", glyph: "M12 3l6 9-6 9-6-9z" },
  {
    name: "lumen.app",
    bg: "#b98a5e",
    glyph: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z",
  },
  {
    name: "fernway",
    bg: "#7d8b63",
    glyph: "M6 18C6 10 11 5 19 5c0 8-5 13-13 13zM6 18l7-7",
  },
  { name: "quarry.hq", bg: "#7a7487", glyph: "M5 5h14v14H5z" },
];

function Avatar({
  size,
  bg,
  glyph,
  play,
}: {
  size: number;
  bg: string;
  glyph?: string;
  play?: boolean;
}) {
  const seed = (glyph ?? bg)
    .split("")
    .reduce((n, ch) => n + ch.charCodeAt(0), 0);
  const moods: Mood[] = ["golden", "dusk", "alpine", "sunset"];
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: size / 2,
        background: play ? bg : "#222",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {play ? (
        <svg viewBox="0 0 124.06 134.26" height={size * 0.4} aria-hidden>
          <path fill="#fff" d={REMOCN_R_PATH} />
        </svg>
      ) : (
        <Photo mood={moods[seed % 4]} seed={seed % 17} zoom={1.6} />
      )}
    </div>
  );
}

function Ring({
  size,
  children,
  seen,
  gap,
  color,
}: {
  size: number;
  children: React.ReactNode;
  seen?: boolean;
  gap: string;
  color: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        padding: seen ? 1.5 : 3,
        boxSizing: "border-box",
        background: seen ? "#c7c7cc" : color,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          padding: seen ? 3 : 3,
          boxSizing: "border-box",
          background: gap,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
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
        padding: "6px 32px 0 52px",
        zIndex: 30,
        color,
      }}
    >
      <span style={{ fontSize: 17, fontWeight: 400 }}>9:41</span>
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
        <svg width="16" height="12" viewBox="0 0 16 12">
          <path d="M8 11.5l2.4-2.9a3.6 3.6 0 0 0-4.8 0z" fill={color} />
          <path
            d="M3.6 6.3a6.6 6.6 0 0 1 8.8 0"
            stroke={color}
            strokeWidth={1.7}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M1 3.4a10.4 10.4 0 0 1 14 0"
            stroke={color}
            strokeWidth={1.7}
            fill="none"
            strokeLinecap="round"
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
            opacity: 0.95,
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
    </div>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  const btn = (side: "left" | "right", top: number, h: number) => (
    <div
      style={{
        position: "absolute",
        [side]: -3,
        top,
        width: 4,
        height: h,
        borderRadius: 2,
        background: "#3A3A3D",
      }}
    />
  );
  return (
    <div style={{ position: "relative", width: BW, height: BH }}>
      {btn("left", 150, 32)}
      {btn("left", 210, 62)}
      {btn("left", 284, 62)}
      {btn("right", 236, 98)}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 68,
          background: "#0B0B0C",
          boxShadow: "inset 0 0 0 1.5px #6E6E73, inset 0 0 0 3px #1C1C1E",
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
            zIndex: 40,
          }}
        />
      </div>
    </div>
  );
}

function Ticker({
  from,
  to,
  p,
  style,
}: {
  from: string;
  to: string;
  p: number;
  style: React.CSSProperties;
}) {
  const q = p < 0.5 ? p * 2 : (p - 0.5) * 2;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {to.split("").map((ch, i) => {
        const prev = from[i] ?? "";
        if (prev === ch) return <span key={`${i}-${ch}`}>{ch}</span>;
        const out = p < 0.5;
        return (
          <span
            key={`${i}-${ch}`}
            style={{
              display: "inline-block",
              transform: `translateY(${out ? -q * 5 : (1 - q) * 5}px)`,
              opacity: out ? 1 - q : q,
            }}
          >
            {out ? prev : ch}
          </span>
        );
      })}
    </div>
  );
}

function ProductScene({ t, accent }: { t: number; accent: string }) {
  const { fps } = useVideoConfig();
  const inn = spring({
    frame: t,
    fps,
    config: HEAVY,
  });
  const txt = spring({
    frame: t - 6,
    fps,
    config: CARD,
  });
  const tracks = [
    { x: 8, w: 46, c: accent, o: 1 },
    { x: 30, w: 52, c: accent, o: 0.6 },
    { x: 4, w: 30, c: "#ffffff", o: 0.35 },
    { x: 40, w: 50, c: accent, o: 0.4 },
  ];
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(170deg, #0b0c10 0%, #15171f 60%, #1c1f2a 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 128,
          color: "#fff",
          fontSize: 38,
          fontWeight: 400,
          letterSpacing: "-0.035em",
          lineHeight: 1.1,
          opacity: txt,
          transform: `translateY(${(1 - txt) * 20}px)`,
        }}
      >
        Launch videos,
        <br />
        <span style={{ color: "rgba(255,255,255,0.55)" }}>
          written in code.
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 290,
          width: 345,
          height: 250,
          borderRadius: 14,
          background: "#0f1117",
          boxShadow:
            "0 30px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)",
          transform: `rotate(-3deg) translateY(${(1 - inn) * 80 + Math.sin(t / 14) * 3}px)`,
          opacity: inn,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "9px 12px",
            fontSize: 12,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          launch.tsx
        </div>
        <div
          style={{
            margin: "0 12px",
            height: 118,
            borderRadius: 8,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 30,
            fontWeight: 400,
            letterSpacing: "-0.045em",
          }}
        >
          <Photo mood="dusk" seed={9} zoom={1 + t * 0.002} />
          <span
            style={{
              position: "relative",
              textShadow: "0 2px 12px rgba(0,0,0,0.3)",
            }}
          >
            remocn
          </span>
        </div>
        <div style={{ margin: "10px 12px 0", position: "relative" }}>
          {tracks.map((tr, i) => (
            <div
              key={`${tr.x}-${tr.w}`}
              style={{
                height: 14,
                marginBottom: 5,
                borderRadius: 4,
                background: "rgba(255,255,255,0.05)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: `${tr.x}%`,
                  width: `${tr.w}%`,
                  top: 0,
                  bottom: 0,
                  borderRadius: 4,
                  background: tr.c,
                  opacity: tr.o,
                  transform: `scaleX(${interpolate(t, [8 + i * 4, 24 + i * 4], [0, 1], clamp)})`,
                  transformOrigin: "left",
                }}
              />
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              top: -4,
              bottom: 0,
              width: 2,
              background: "#fff",
              left: `${interpolate(t, [0, 46], [10, 74], clamp)}%`,
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 600,
          transform: `translateX(-50%) rotate(-2deg) scale(${0.9 + 0.1 * spring({ frame: t - 14, fps, config: CHIP })})`,
          opacity: interpolate(t, [14, 18], [0, 1], clamp),
          background: "#fff",
          borderRadius: 10,
          padding: "9px 14px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: accent,
          fontSize: 16,
          fontWeight: 400,
          boxShadow: "0 1px 2px rgba(0,0,0,0.12), 0 6px 20px rgba(0,0,0,0.2)",
        }}
      >
        <Icon d={P.link} size={18} color={accent} sw={2.4} />
        remocn.dev
      </div>
    </AbsoluteFill>
  );
}

function LaunchScene({ t, accent }: { t: number; accent: string }) {
  const { fps } = useVideoConfig();
  const card = spring({
    frame: t - 2,
    fps,
    config: CARD,
  });
  return (
    <AbsoluteFill style={{ background: "#0b0d18" }}>
      <Photo mood="dusk" seed={2} zoom={1.06 + t * 0.0015} />
      <div
        style={{
          position: "absolute",
          left: 46,
          top: 200,
          width: 300,
          height: 330,
          borderRadius: 30,
          background: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.12), 0 24px 60px rgba(0,0,0,0.35)",
          transform: `rotate(${-6 + (1 - card) * -8}deg) scale(${0.92 + card * 0.08})`,
          opacity: Math.min(1, card * 2),
          padding: 26,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontWeight: 300,
            letterSpacing: "-0.06em",
            lineHeight: "130px",
            marginTop: 6,
            color: accent,
          }}
        >
          v2
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 400,
            letterSpacing: "-0.04em",
            color: "#111",
            marginTop: -6,
          }}
        >
          is live.
        </div>
        <div
          style={{
            fontSize: 15,
            color: "#6e6e76",
            marginTop: 18,
            fontWeight: 400,
          }}
        >
          200+ components · remocn.dev
        </div>
      </div>
    </AbsoluteFill>
  );
}

function PollScene({
  t,
  accent,
  question,
  options,
  vote,
}: {
  t: number;
  accent: string;
  question: string;
  options: [string, string];
  vote: number;
}) {
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: t - 4,
    fps,
    config: CARD,
  });
  const pct = [82, 18];
  return (
    <AbsoluteFill style={{ background: "#2e2a3a" }}>
      <Photo mood="golden" seed={6} zoom={1.04 + t * 0.0015} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 170,
          textAlign: "center",
          color: "#fff",
          fontSize: 30,
          fontWeight: 400,
          letterSpacing: "-0.03em",
          textShadow: "0 1px 12px rgba(0,0,0,0.25)",
        }}
      >
        Launch week
        <br />
        <span style={{ fontSize: 17, fontWeight: 400, opacity: 0.9 }}>
          @remocn
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          top: 320,
          background: "#fff",
          borderRadius: 24,
          padding: "18px 12px 12px",
          boxShadow:
            "0 1px 2px rgba(0,0,0,0.1), 0 18px 40px rgba(40,20,30,0.25)",
          transform: `scale(${0.9 + pop * 0.1}) rotate(-1.5deg)`,
          opacity: Math.min(1, pop * 2),
        }}
      >
        <div
          style={{
            fontSize: 19,
            fontWeight: 400,
            color: "#111",
            textAlign: "center",
            lineHeight: "24px",
            marginBottom: 14,
            letterSpacing: -0.3,
          }}
        >
          {question}
        </div>
        {options.map((o, i) => {
          const w = vote * pct[i];
          return (
            <div
              key={o}
              style={{
                position: "relative",
                height: 46,
                borderRadius: 12,
                background: "#efeff2",
                marginTop: i ? 8 : 0,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                padding: "0 18px",
                fontSize: 16,
                fontWeight: 400,
                color: "#111",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${w}%`,
                  background: i === 0 ? accent : "#d6d6dc",
                }}
              />
              <span
                style={{
                  position: "relative",
                  flex: 1,
                  color: i === 0 && vote > 0.3 ? "#fff" : "#111",
                  textAlign: vote > 0.05 ? "left" : "center",
                }}
              >
                {o}
              </span>
              <span
                style={{
                  position: "relative",
                  opacity: vote,
                  color: i === 0 && w > 80 ? "#fff" : "#3a3a40",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {Math.round(w)}%
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function ReelScene({ t }: { t: number }) {
  const { fps } = useVideoConfig();
  const words = ["Ship", "your", "launch", "video.", "Today."];
  const idx = Math.min(words.length - 1, Math.max(0, Math.floor(t / 13)));
  const w = spring({
    frame: t - idx * 13,
    fps,
    config: CHIP,
  });
  return (
    <AbsoluteFill style={{ background: "#07070c" }}>
      <Photo mood="alpine" seed={12} zoom={1.08 + t * 0.0012} />
      <AbsoluteFill style={{ background: "rgba(5,8,16,0.38)" }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 330,
          textAlign: "center",
          color: "#fff",
          fontSize: 76,
          fontWeight: 300,
          letterSpacing: "-0.045em",
          transform: `scale(${0.92 + w * 0.08}) translateY(${(1 - w) * 14}px)`,
          opacity: Math.min(1, w * 2),
          textShadow: "0 2px 24px rgba(0,0,0,0.3)",
        }}
      >
        {words[idx]}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 430,
          textAlign: "center",
          color: "rgba(255,255,255,0.8)",
          fontSize: 13,
          fontWeight: 400,
          letterSpacing: "0.14em",
        }}
      >
        REMOCN V2
      </div>
    </AbsoluteFill>
  );
}

function Scene({ src, children }: { src?: string; children: React.ReactNode }) {
  return src ? (
    <Img
      src={src}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  ) : (
    children
  );
}

export function ReelsFeed({
  account = "remocn",
  stories = [],
  reelSrc,
  pollQuestion = "Shipping a launch video this week?",
  pollOptions = ["Yes, this week", "Not yet"],
  likes = ["12.4K", "12.5K"],
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
  lines,
  ground,
  groundParams,
}: ReelsFeedProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const f = frame * speed;
  const dark = theme === "dark";
  const c = dark
    ? {
        bg: "#000",
        text: "#f5f5f5",
        muted: "#a8a8a8",
        line: "#262626",
        over: "#FFF6EE",
        overMuted: "rgba(255,240,228,0.62)",
      }
    : {
        bg: "#fff",
        text: "#0c0c0d",
        muted: "#737373",
        line: "#dbdbdb",
        over: "#1D1714",
        overMuted: "rgba(40,28,22,0.6)",
      };
  const tall = height > width;
  const k = tall ? (height * 0.6) / BH : (height * 0.9) / BH;
  const phoneC = tall
    ? { x: width / 2, y: height * 0.36 }
    : { x: width * 0.69, y: height / 2 };
  const u = width / (tall ? 1080 : 1280);
  const rise = spring({ frame: f, fps, config: HEAVY });
  const sp = (at: number, config: typeof CARD) =>
    spring({ frame: f - at, fps, config });
  const copy = lines ?? [
    "Your launch, in their stories.",
    "Ask the room before you ship.",
    `${likes[1]} likes by lunch.`,
  ];
  const chapters = ["Story", "Poll", "Reel"];
  const beats = [
    [0, 136],
    [136, 206],
    [206, 1e9],
  ];
  const lineEls = copy.map((line, i) => {
    const [a, b] = beats[i];
    const inn = interpolate(f, [a + (i ? 4 : 14), a + (i ? 20 : 30)], [0, 1], {
      ...clamp,
      easing: ENTER,
    });
    const out = interpolate(f, [b, b + 8], [0, 1], {
      ...clamp,
      easing: EXIT,
    });
    if (inn <= 0 || out >= 1) return null;
    return (
      <div
        key={chapters[i]}
        style={{ position: "absolute", left: 0, right: 0, top: 0 }}
      >
        <div
          style={{
            fontSize: (tall ? 28 : 20) * u,
            color: c.overMuted,
            fontVariantNumeric: "tabular-nums",
            opacity: inn * (1 - out),
          }}
        >
          0{i + 1} <span style={{ opacity: 0.5 }}>/</span> {chapters[i]}
        </div>
        <div style={{ overflow: "hidden", paddingBottom: 10 * u }}>
          <div
            style={{
              marginTop: 12 * u,
              fontSize: (tall ? 88 : 64) * u,
              fontWeight: 300,
              lineHeight: 1.02,
              letterSpacing: "-0.045em",
              color: c.over,
              textWrap: "balance",
              transform: `translateY(${(1 - inn) * 105 - out * 40}%)`,
              opacity: 1 - out,
            }}
          >
            {line}
          </div>
        </div>
      </div>
    );
  });

  const RING = 86;
  const ringX = 12 + 1 * 98 + RING / 2;
  const ringY = 106 + RING / 2;
  const ringPress = interpolate(
    f,
    [TAP_STORY - 1, TAP_STORY + 2, TAP_STORY + 8],
    [1, 0.96, 1],
    clamp,
  );
  const open = interpolate(f, [OPEN, OPEN + 16], [0, 1], {
    ...clamp,
    easing: ENTER,
  });
  const seg = SEG.findIndex((s, i) => f >= s && f < (SEG[i + 1] ?? 1e9));
  const storyIdx = Math.max(0, Math.min(2, seg));
  const segT = f - SEG[storyIdx];
  const swipe = interpolate(f, [SWIPE, REEL], [0, 1], {
    ...clamp,
    easing: ENTER,
  });
  const vote = interpolate(f, [POLL_TAP + 1, POLL_TAP + 16], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  const burst = sp(DT + 6, CHIP);
  const burstOut = interpolate(f, [DT + 26, DT + 40], [0, 1], {
    ...clamp,
    easing: EXIT,
  });
  const liked = sp(DT + 7, CHIP);
  const tick = interpolate(f, [DT + 8, DT + 16], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  const keys = [
    { t: 20, x: 300, y: 420 },
    { t: TAP_STORY - 2, x: ringX, y: ringY },
    { t: POLL_TAP - 16, x: ringX, y: ringY },
    { t: POLL_TAP - 2, x: 120, y: 456 },
    { t: SWIPE - 6, x: 200, y: 700 },
    { t: SWIPE, x: 200, y: 700 },
    { t: REEL - 2, x: 200, y: 300 },
    { t: DT - 10, x: 196, y: 410 },
  ];
  let tap = keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    const e = glide(Math.min(1, Math.max(0, (f - a.t) / (b.t - a.t))));
    const arc = Math.hypot(b.x - a.x, b.y - a.y) * 0.18 * Math.sin(Math.PI * e);
    if (f >= a.t)
      tap = {
        t: f,
        x: a.x + (b.x - a.x) * e + arc * 0.6,
        y: a.y + (b.y - a.y) * e - arc,
      };
  }
  const show = (a: number, b: number) =>
    interpolate(f, [a, a + 6, b, b + 6], [0, 1, 1, 0], clamp);
  const tapOpacity = Math.max(
    show(20, TAP_STORY + 4),
    show(POLL_TAP - 14, POLL_TAP + 4),
    show(SWIPE - 8, REEL),
    show(DT - 12, DT + 12),
  );
  const bump = (at: number) =>
    interpolate(f, [at - 1, at + 2, at + 7], [0, 1, 0], clamp);
  const tapScale =
    1 -
    0.2 *
      Math.max(
        bump(TAP_STORY),
        bump(POLL_TAP),
        bump(DT),
        bump(DT + 6),
        f >= SWIPE - 2 && f < REEL ? 1 : 0,
      );

  const storyHeader = (
    <div
      style={{ position: "absolute", left: 12, right: 12, top: 58, zIndex: 5 }}
    >
      <div style={{ display: "flex", gap: 4 }}>
        {[0, 1, 2].map((i) => {
          const p =
            i < storyIdx
              ? 1
              : i > storyIdx
                ? 0
                : interpolate(segT, [0, SEG[i + 1] - SEG[i]], [0, 1], clamp);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 2.5,
                borderRadius: 2,
                background: "rgba(255,255,255,0.35)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${p * 100}%`,
                  height: "100%",
                  background: "#fff",
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          marginTop: 10,
          color: "#fff",
        }}
      >
        <Avatar size={32} bg={accent} play />
        <span style={{ fontSize: 14, fontWeight: 400 }}>{account}</span>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>2h</span>
        <div style={{ flex: 1 }} />
        <svg width="22" height="22" viewBox="0 0 24 24">
          {[5, 12, 19].map((x) => (
            <circle key={x} cx={x} cy={12} r={1.7} fill="#fff" />
          ))}
        </svg>
        <Icon d={P.close} size={26} color="#fff" sw={2} />
      </div>
    </div>
  );

  const actions = [
    { d: P.heart, n: "" },
    { d: P.comment, n: "318" },
    { d: P.repost, n: "1,204" },
    { d: P.send, n: "2,871" },
  ];

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        overflow: "hidden",
      }}
    >
      <GshGround
        preset={ground ?? (dark ? "static-sunset" : "paper-crease")}
        params={
          groundParams ??
          (dark
            ? undefined
            : {
                colors: ["#f29a6b", "#f6c3a0", "#efdccf", "#3a2430"],
                background: "#f1ebe4",
              })
        }
        timeOffset={6}
        timeScale={0.35}
      />
      <AbsoluteFill
        style={{
          background: dark
            ? tall
              ? "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(8,4,2,0.55) 100%)"
              : "linear-gradient(90deg, rgba(8,4,2,0.55) 0%, rgba(8,4,2,0) 55%)"
            : "transparent",
        }}
      />
      <div
        style={{
          position: "absolute",
          ...(tall
            ? { left: 80 * u, right: 80 * u, top: height * 0.71 }
            : { left: 92 * u, width: 470 * u, top: height / 2 - 110 * u }),
        }}
      >
        {lineEls}
      </div>
      <div
        style={{
          position: "absolute",
          left: phoneC.x - BW / 2,
          top: phoneC.y - BH / 2,
          width: BW,
          height: BH,
          transform: `translateY(${(1 - rise) * height * 0.8}px) scale(${k * (1 + 0.02 * (f / 300))})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 68,
            boxShadow: dark
              ? "0 50px 100px -20px rgba(0,0,0,0.75)"
              : "0 2px 6px rgba(60,30,20,0.12), 0 50px 100px -30px rgba(80,40,20,0.45)",
          }}
        />
        <Phone>
          {f < OPEN + 16 && (
            <AbsoluteFill style={{ background: c.bg, color: c.text }}>
              <StatusBar color={c.text} />
              <div
                style={{
                  position: "absolute",
                  top: 54,
                  left: 16,
                  right: 16,
                  height: 46,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Icon d={P.plus} size={27} color={c.text} sw={2} />
                <span
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    fontFamily: manrope.fontFamily,
                    fontSize: 24,
                    fontWeight: 600,
                    letterSpacing: "-0.025em",
                    lineHeight: 1,
                  }}
                >
                  <svg
                    viewBox="0 0 124.06 134.26"
                    style={{ height: "0.76em", width: "auto" }}
                    aria-hidden
                  >
                    <path fill="currentColor" d={REMOCN_R_PATH} />
                  </svg>
                  <span style={{ marginLeft: "0.04em" }}>emocn</span>
                </span>
                <div style={{ position: "relative" }}>
                  <Icon d={P.heart} size={27} color={c.text} sw={2} />
                  <div
                    style={{
                      position: "absolute",
                      right: -1,
                      top: 0,
                      width: 9,
                      height: 9,
                      borderRadius: 5,
                      background: "#ff3040",
                      border: `2px solid ${c.bg}`,
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 106,
                  left: 12,
                  display: "flex",
                  gap: 12,
                }}
              >
                {[
                  {
                    name: "Your story",
                    bg: "#9ca3af",
                    glyph:
                      "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 21a7.5 7.5 0 0 1 15 0",
                  },
                  { name: account, bg: accent, play: true },
                  ...ACCOUNTS,
                ].map((a, i) => (
                  <div
                    key={a.name}
                    style={{
                      width: RING,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      transform: i === 1 ? `scale(${ringPress})` : undefined,
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      {i === 0 ? (
                        <div
                          style={{
                            width: RING,
                            height: RING,
                            padding: 4,
                            boxSizing: "border-box",
                          }}
                        >
                          <Avatar
                            size={RING - 8}
                            bg={a.bg}
                            glyph={"glyph" in a ? a.glyph : undefined}
                          />
                        </div>
                      ) : (
                        <Ring
                          size={RING}
                          gap={c.bg}
                          seen={i > 3}
                          color={accent}
                        >
                          <Avatar
                            size={RING - 12}
                            bg={a.bg}
                            glyph={"glyph" in a ? a.glyph : undefined}
                            play={"play" in a}
                          />
                        </Ring>
                      )}
                      {i === 0 && (
                        <div
                          style={{
                            position: "absolute",
                            right: 2,
                            bottom: 2,
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            background: c.text,
                            border: `3px solid ${c.bg}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon d={P.plus} size={14} color={c.bg} sw={3} />
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        marginTop: 5,
                        color: i === 0 ? c.muted : c.text,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.name}
                    </span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 222,
                  left: 0,
                  right: 0,
                  borderTop: `0.5px solid ${c.line}`,
                }}
              >
                <div
                  style={{
                    height: 56,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "0 12px",
                  }}
                >
                  <Ring size={36} gap={c.bg} color={accent}>
                    <Avatar size={28} bg="#5f7f86" glyph={ACCOUNTS[0].glyph} />
                  </Ring>
                  <div style={{ flex: 1, lineHeight: "17px" }}>
                    <div style={{ fontSize: 14, fontWeight: 400 }}>
                      kitebase
                    </div>
                    <div style={{ fontSize: 12 }}>Lisbon, Portugal</div>
                  </div>
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    {[5, 12, 19].map((x) => (
                      <circle key={x} cx={x} cy={12} r={1.6} fill={c.text} />
                    ))}
                  </svg>
                </div>
                <div
                  style={{
                    position: "relative",
                    width: SW,
                    height: SW * 1.25,
                    overflow: "hidden",
                  }}
                >
                  <Photo mood="sunset" seed={4} />
                </div>
                <div
                  style={{
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "0 14px",
                  }}
                >
                  <Icon d={P.heart} size={26} color={c.text} />
                  <Icon d={P.comment} size={25} color={c.text} />
                  <Icon d={P.repost} size={25} color={c.text} />
                  <Icon d={P.send} size={25} color={c.text} />
                  <div style={{ flex: 1 }} />
                  <Icon d={P.bookmark} size={25} color={c.text} />
                </div>
                <div
                  style={{
                    padding: "0 14px",
                    fontSize: 14,
                    lineHeight: "19px",
                  }}
                >
                  <span>2,184 likes</span>
                  <div>
                    <span>kitebase</span> Our launch film is out. Cut it in an
                    afternoon with remocn
                  </div>
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 84,
                  background: c.bg,
                  borderTop: `0.5px solid ${c.line}`,
                  display: "flex",
                  justifyContent: "space-around",
                  paddingTop: 12,
                  boxSizing: "border-box",
                }}
              >
                {[P.home, P.reels, P.send, P.search].map((d, i) => (
                  <Icon
                    key={d}
                    d={d}
                    size={27}
                    color={c.text}
                    sw={i === 0 ? 2.3 : 1.9}
                    fill={i === 0 ? c.text : "none"}
                  />
                ))}
                <Avatar
                  size={27}
                  bg="#e879a6"
                  glyph="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                />
              </div>
              <AbsoluteFill
                style={{ background: "#000", opacity: open * 0.7 }}
              />
            </AbsoluteFill>
          )}

          {f >= OPEN && (
            <AbsoluteFill
              style={{
                background: "#000",
                overflow: "hidden",
                borderRadius: (1 - open) * 120 + 56,
                opacity:
                  interpolate(open, [0, 0.12], [0, 1], clamp) *
                  (1 - swipe * 0.7),
                transform: `translate(${(ringX - SW / 2) * (1 - open)}px, ${(ringY - SH / 2) * (1 - open) - swipe * SH * 0.35}px) scale(${(0.18 + 0.82 * open) * (1 - swipe * 0.08)})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 50,
                  height: 718,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <Scene src={stories[storyIdx]?.src}>
                  {storyIdx === 0 && (
                    <ProductScene t={segT + 22} accent={accent} />
                  )}
                  {storyIdx === 1 && <LaunchScene t={segT} accent={accent} />}
                  {storyIdx === 2 && (
                    <PollScene
                      t={segT}
                      accent={accent}
                      question={pollQuestion}
                      options={pollOptions}
                      vote={vote}
                    />
                  )}
                </Scene>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    height: 120,
                    background:
                      "linear-gradient(rgba(0,0,0,0.35), transparent)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "#fff",
                    opacity: interpolate(segT, [0, 5], [0, 0], clamp),
                  }}
                />
              </div>
              {storyHeader}
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  right: 12,
                  top: 780,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 22,
                    border: "1px solid rgba(255,255,255,0.55)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 18px",
                    fontSize: 15,
                  }}
                >
                  Send message
                </div>
                <Icon d={P.heart} size={27} color="#fff" />
                <Icon d={P.send} size={26} color="#fff" />
              </div>
            </AbsoluteFill>
          )}

          {f >= SWIPE && (
            <AbsoluteFill
              style={{
                background: "#000",
                transform: `translateY(${(1 - swipe) * SH}px)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 84,
                  overflow: "hidden",
                }}
              >
                <Scene src={reelSrc}>
                  <ReelScene t={f - SWIPE} />
                </Scene>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(rgba(0,0,0,0.3), transparent 18%, transparent 70%, rgba(0,0,0,0.55))",
                  }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 58,
                  left: 16,
                  right: 16,
                  display: "flex",
                  alignItems: "center",
                  color: "#fff",
                }}
              >
                <Icon d={P.plus} size={27} color="#fff" sw={2} />
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                    gap: 14,
                    fontSize: 21,
                    fontWeight: 400,
                    letterSpacing: -0.3,
                  }}
                >
                  <span>Reels</span>
                  <span style={{ opacity: 0.6 }}>Friends</span>
                </div>
                <Icon d={P.sliders} size={26} color="#fff" sw={2} />
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 10,
                  bottom: 116,
                  width: 52,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 18,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 400,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {actions.map((a, i) => (
                  <div
                    key={a.d}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {i === 0 ? (
                      <div
                        style={{
                          transform: `scale(${1 + (liked > 0.01 ? Math.sin(Math.min(1, liked) * Math.PI) * 0.35 : 0)})`,
                        }}
                      >
                        <Icon
                          d={P.heart}
                          size={30}
                          color={liked > 0.02 ? "#ff3040" : "#fff"}
                          fill={liked > 0.02 ? "#ff3040" : "none"}
                          sw={2}
                        />
                      </div>
                    ) : (
                      <Icon d={a.d} size={28} color="#fff" sw={2} />
                    )}
                    {i === 0 ? (
                      <Ticker
                        from={likes[0]}
                        to={likes[1]}
                        p={tick}
                        style={{ height: 16, lineHeight: "16px" }}
                      />
                    ) : (
                      <span>{a.n}</span>
                    )}
                  </div>
                ))}
                <svg width="24" height="24" viewBox="0 0 24 24">
                  {[5, 12, 19].map((x) => (
                    <circle key={x} cx={x} cy={12} r={1.8} fill="#fff" />
                  ))}
                </svg>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    border: "2px solid #fff",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Photo mood="alpine" seed={12} />
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  right: 76,
                  bottom: 100,
                  color: "#fff",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Avatar size={32} bg={accent} play />
                  <span style={{ fontSize: 14, fontWeight: 400 }}>
                    {account}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path
                      d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3 1 3-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3L2.6 15.8l1-3-1-3 2.6-1.9 1-3 3.2.1z"
                      fill="#3897f0"
                    />
                    <path
                      d="M8 12.2l2.7 2.6L16 9.5"
                      stroke="#fff"
                      strokeWidth={2.2}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    style={{
                      marginLeft: 4,
                      border: "1px solid rgba(255,255,255,0.6)",
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: 13,
                      fontWeight: 400,
                    }}
                  >
                    Follow
                  </span>
                </div>
                <div
                  style={{ fontSize: 14, marginTop: 10, lineHeight: "19px" }}
                >
                  v2 is live. 200+ components for launch videos
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 8,
                    fontSize: 13,
                    opacity: 0.92,
                  }}
                >
                  <Icon d={P.music} size={13} color="#fff" sw={2} />
                  <span>{account} · Original audio</span>
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 84,
                  height: 2,
                  background: "rgba(255,255,255,0.25)",
                }}
              >
                <div
                  style={{
                    width: `${interpolate(f, [REEL, REEL + 120], [4, 60], clamp)}%`,
                    height: "100%",
                    background: "#fff",
                  }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 84,
                  background: "#000",
                  display: "flex",
                  justifyContent: "space-around",
                  paddingTop: 12,
                  boxSizing: "border-box",
                }}
              >
                {[P.home, P.reels, P.send, P.search].map((d, i) => (
                  <Icon
                    key={d}
                    d={d}
                    size={27}
                    color="#fff"
                    sw={i === 1 ? 2.4 : 1.9}
                  />
                ))}
                <Avatar
                  size={27}
                  bg="#e879a6"
                  glyph="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                />
              </div>
              {f >= DT + 6 && (
                <div
                  style={{
                    position: "absolute",
                    left: SW / 2 - 70,
                    top: 340,
                    width: 140,
                    height: 140,
                    transform: `translateY(${-burstOut * 40}px) scale(${(0.6 + burst * 0.4) * (1 - burstOut * 0.15)}) rotate(${-8 + (1 - burst) * 12}deg)`,
                    opacity: Math.min(1, burst * 3) * (1 - burstOut),
                  }}
                >
                  <svg
                    width="140"
                    height="140"
                    viewBox="0 0 24 24"
                    style={{
                      filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.28))",
                    }}
                  >
                    <defs>
                      <linearGradient
                        id={`${uid}heart`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop offset="0" stopColor="#ff6a6a" />
                        <stop offset="1" stopColor="#ff1e56" />
                      </linearGradient>
                    </defs>
                    <path d={P.heart} fill={`url(#${uid}heart)`} />
                  </svg>
                </div>
              )}
            </AbsoluteFill>
          )}

          {f >= OPEN + 8 && <StatusBar color="#fff" />}
          <div
            style={{
              position: "absolute",
              left: tap.x - 22,
              top: tap.y - 22,
              width: 44,
              height: 44,
              borderRadius: 22,
              background: "rgba(40,40,48,0.28)",
              border: "2px solid rgba(255,255,255,0.9)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
              opacity: tapOpacity,
              transform: `scale(${tapScale})`,
              zIndex: 35,
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
              background: f >= OPEN + 4 || dark ? "#fff" : "#111",
              zIndex: 36,
            }}
          />
        </Phone>
      </div>
    </AbsoluteFill>
  );
}
