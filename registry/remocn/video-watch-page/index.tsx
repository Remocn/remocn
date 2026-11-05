"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
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
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface WatchChannel {
  name: string;
  subscribers: number;
  color?: string;
}

export interface WatchStats {
  likesFrom: number;
  likesTo: number;
  viewsFrom: number;
  viewsTo: number;
  commentsFrom: number;
  commentsTo: number;
}

export interface VideoWatchPageProps {
  title?: string;
  channel?: Partial<WatchChannel>;
  stats?: Partial<WatchStats>;
  /** Poster/frame shown in the player. */
  src?: string;
  /** Custom player content (wins over `src`), laid out at 836×470. */
  children?: React.ReactNode;
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const HOVER_IN = 30;
const HOVER_OUT = 72;
const SUB_CLICK = 92;
const LIKE_CLICK = 120;
const END = 210;

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const RISE = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);

const CL = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

function rgb(c: string): [number, number, number] {
  const hex = c.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return [128, 128, 128];
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number) {
  const x = rgb(a);
  const y = rgb(b);
  const m = (i: number) => Math.round(x[i] + (y[i] - x[i]) * t);
  return `rgb(${m(0)}, ${m(1)}, ${m(2)})`;
}
const group = (n: number) =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
function compact(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1e5) return `${Math.round(n / 1e3)}K`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(n));
}
const expLerp = (a: number, b: number, t: number) => a * (b / a) ** t;

interface Pal {
  win: string;
  surface: string;
  text: string;
  muted: string;
  faint: string;
  hair: string;
  strong: string;
  onStrong: string;
  shadow: string;
  scrim: string;
}
const LIGHT: Pal = {
  win: "#ffffff",
  surface: "#f4f4f5",
  text: "#18181b",
  muted: "#63636b",
  faint: "#9a9aa2",
  hair: "rgba(24,24,27,0.08)",
  strong: "#18181b",
  onStrong: "#ffffff",
  shadow:
    "0 0 0 1px rgba(24,24,27,0.06), 0 2px 4px rgba(24,24,27,0.04), 0 30px 70px -20px rgba(20,30,90,0.3)",
  scrim: "rgba(238,240,246,0.2)",
};
const DARK: Pal = {
  win: "#111113",
  surface: "#1c1c1f",
  text: "#ededef",
  muted: "#9d9da6",
  faint: "#6a6a72",
  hair: "rgba(255,255,255,0.07)",
  strong: "#ededef",
  onStrong: "#111113",
  shadow: "0 0 0 1px rgba(255,255,255,0.09), 0 40px 90px -20px rgba(0,0,0,0.7)",
  scrim: "rgba(2,4,10,0.25)",
};

const ICON: Record<string, string> = {
  like: "M7.5 10.5v9h-3v-9zM7.5 10.5 11 4c1.6 0 2.5 1.1 2.2 2.6L12.6 9.5h5.2a2 2 0 0 1 2 2.4l-1.3 6a2 2 0 0 1-2 1.6H7.5",
  share:
    "M12 15V3.5M7.5 8 12 3.5 16.5 8M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13",
  pause: "M8.5 6v12M15.5 6v12",
  vol: "M4.5 9.5h3l4-3.5v12l-4-3.5h-3zM15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11",
  cc: "M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17V7A1.5 1.5 0 0 1 5 5.5zM10.4 10.3a2.2 2.2 0 1 0 0 3.4M16.4 10.3a2.2 2.2 0 1 0 0 3.4",
  full: "M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15",
  bell: "M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2 2 0 0 0 4 0",
  check: "M5 12.5l4.5 4.5L19 7.5",
};

function Icon({
  name,
  size = 20,
  color,
  sw = 1.75,
  fill = "none",
}: {
  name: string;
  size?: number;
  color: string;
  sw?: number;
  fill?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden
    >
      <path d={ICON[name]} />
    </svg>
  );
}

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

function RemocnR({ height, color }: { height: number; color: string }) {
  return (
    <svg
      viewBox="0 0 124.06 134.26"
      height={height}
      width={(height * 124.06) / 134.26}
      style={{ display: "block" }}
      aria-hidden
    >
      <path fill={color} d={REMOCN_R_PATH} />
    </svg>
  );
}

function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
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
    </div>
  );
}

interface Key {
  f: number;
  x: number;
  y: number;
  bend?: number;
}
function along(keys: Key[], f: number) {
  if (f <= keys[0].f) return { x: keys[0].x, y: keys[0].y };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f >= b.f) continue;
    const t = MOVE(clamp((f - a.f) / (b.f - a.f)));
    const bend = b.bend ?? 0;
    const cx = (a.x + b.x) / 2 - (b.y - a.y) * bend;
    const cy = (a.y + b.y) / 2 + (b.x - a.x) * bend;
    const m = 1 - t;
    return {
      x: m * m * a.x + 2 * m * t * cx + t * t * b.x,
      y: m * m * a.y + 2 * m * t * cy + t * t * b.y,
    };
  }
  const last = keys[keys.length - 1];
  return { x: last.x, y: last.y };
}

function Cursor({
  x,
  y,
  press,
  opacity,
}: {
  x: number;
  y: number;
  press: number;
  opacity: number;
}) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      aria-hidden
      style={{
        position: "absolute",
        left: x - 2,
        top: y - 2,
        overflow: "visible",
        opacity,
        transform: `scale(${1 - press * 0.12})`,
        transformOrigin: "2px 2px",
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        zIndex: 60,
      }}
    >
      <path
        d="M1 1 L1 18.5 L5.6 14.4 L8.7 21.6 L11.6 20.4 L8.5 13.2 L14.5 13.2 Z"
        fill="#FFFFFF"
        stroke="#111111"
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CHAPTERS = [
  { at: 0, name: "Intro" },
  { at: 0.14, name: "Kinetic captions" },
  { at: 0.38, name: "Transitions" },
  { at: 0.62, name: "Templates" },
  { at: 0.84, name: "Pricing" },
];
const DURATION = 138;
const TRANSCRIPT = [
  { at: 30, text: "Every scene is a React component you own." },
  { at: 33, text: "Captions follow the voice-over, word by word." },
  { at: 36, text: "Change the copy, hit render, and you’re done." },
  { at: 40, text: "Same props, same timing, every single time." },
];

const SCENES = [
  ["Hook", "#E5484D"],
  ["Product", "#3E63DD"],
  ["Proof", "#30A46C"],
  ["CTA", "#F76B15"],
];
const TRACKS = [
  [
    [0, 0.22, "Hook", "#E5484D"],
    [0.22, 0.58, "Product walkthrough", "#3E63DD"],
    [0.58, 0.8, "Proof", "#30A46C"],
    [0.8, 1, "CTA", "#F76B15"],
  ],
  [
    [0.04, 0.36, "Kinetic captions", "#8E4EC6"],
    [0.42, 0.9, "Kinetic captions", "#8E4EC6"],
  ],
  [[0, 1, "launch-theme.mp3", "#6E6E76"]],
] as const;
const WORDS = ["Ship", "it", "today."];

function EditorScene({ frame, accent }: { frame: number; accent: string }) {
  const push = 1 + 0.035 * clamp(frame / 300);
  const head = ((frame * 0.0022 + 0.31) % 1) * 1;
  const word = Math.floor(frame / 9) % WORDS.length;
  const win = { x: 64, y: 30, w: 708, h: 384 };
  const side = 150;
  const tlH = 104;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background:
          "radial-gradient(120% 90% at 50% 0%, #22242C 0%, #0B0C10 70%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: win.x,
          top: win.y,
          width: win.w,
          height: win.h,
          borderRadius: 10,
          overflow: "hidden",
          background: "#FFFFFF",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.1), 0 24px 60px rgba(0,0,0,0.55)",
          transform: `scale(${push})`,
          transformOrigin: "50% 40%",
          color: "#1C1C1F",
          fontSize: 11,
        }}
      >
        <div
          style={{
            height: 28,
            background: "#F3F3F5",
            borderBottom: "1px solid rgba(0,0,0,0.07)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 10px",
          }}
        >
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div
              key={c}
              style={{ width: 9, height: 9, borderRadius: 5, background: c }}
            />
          ))}
          <div style={{ flex: 1, textAlign: "center", color: "#6E6E76" }}>
            remocn studio · launch-video.tsx
          </div>
          <div
            style={{
              height: 18,
              padding: "0 8px",
              borderRadius: 5,
              background: accent,
              color: "#fff",
              fontWeight: 400,
              fontSize: 10,
              display: "flex",
              alignItems: "center",
            }}
          >
            Render
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 28,
            width: side,
            bottom: tlH,
            borderRight: "1px solid rgba(0,0,0,0.07)",
            padding: "10px 8px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              color: "#8B8B93",
              fontWeight: 400,
              fontSize: 10,
              padding: "0 6px 6px",
            }}
          >
            Scenes
          </div>
          {SCENES.map(([n, c], i) => (
            <div
              key={n}
              style={{
                height: 24,
                borderRadius: 5,
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "0 6px",
                background: i === 1 ? "rgba(0,0,0,0.05)" : "transparent",
                fontWeight: 400,
              }}
            >
              <div
                style={{ width: 8, height: 8, borderRadius: 2, background: c }}
              />
              {n}
              <span style={{ marginLeft: "auto", color: "#A1A1A8" }}>
                {["0:04", "0:11", "0:06", "0:05"][i]}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: side,
            right: 0,
            top: 28,
            bottom: tlH,
            background: "#F6F6F7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 384,
              height: 216,
              borderRadius: 4,
              background: "#101014",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {WORDS.map((w, i) => (
              <div
                key={w}
                style={{
                  fontSize: 38,
                  fontWeight: 400,
                  letterSpacing: "-0.03em",
                  color: i === word ? "#101014" : "#FFFFFF",
                  background: i === word ? "#D4F56A" : "transparent",
                  borderRadius: 6,
                  padding: "0 6px",
                  transform: `scale(${i === word ? 1.04 : 1})`,
                }}
              >
                {w}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: tlH,
            borderTop: "1px solid rgba(0,0,0,0.08)",
            background: "#FFFFFF",
          }}
        >
          <div
            style={{
              height: 18,
              display: "flex",
              color: "#A1A1A8",
              fontSize: 9,
              fontVariantNumeric: "tabular-nums",
              padding: "0 0 0 12px",
              alignItems: "center",
            }}
          >
            {Array.from({ length: 9 }, (_, i) => (
              <div key={`t${i}`} style={{ flex: 1 }}>
                0:{String(i * 4).padStart(2, "0")}
              </div>
            ))}
          </div>
          {TRACKS.map((track, ti) => (
            <div
              key={`tr${ti}`}
              style={{
                position: "relative",
                height: 22,
                margin: "3px 12px 0",
              }}
            >
              {track.map(([a0, a1, label, c]) => (
                <div
                  key={`${label}${a0}`}
                  style={{
                    position: "absolute",
                    left: `${a0 * 100}%`,
                    width: `calc(${(a1 - a0) * 100}% - 2px)`,
                    top: 0,
                    bottom: 0,
                    borderRadius: 4,
                    background: mix(c, "#FFFFFF", 0.82),
                    boxShadow: `inset 0 0 0 1px ${mix(c, "#FFFFFF", 0.45)}`,
                    color: mix(c, "#000000", 0.35),
                    fontSize: 9.5,
                    fontWeight: 400,
                    padding: "0 6px",
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              top: 4,
              bottom: 4,
              left: `calc(12px + ${head} * (100% - 24px))`,
              width: 1.5,
              background: "#E5484D",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -1,
                left: -4,
                width: 9,
                height: 9,
                borderRadius: 2,
                background: "#E5484D",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function VideoWatchPage({
  title = "Introducing remocn 2.0",
  channel,
  stats,
  src,
  children,
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
  ground,
  groundParams,
}: VideoWatchPageProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const pal = dark ? DARK : LIGHT;
  const tall = height > width;
  const DW = tall ? 720 : 1280;
  const DH = tall ? 1280 : 720;
  const u = Math.min(width / DW, height / DH);
  const L = tall
    ? {
        win: { x: 70, y: 140, w: 580, h: 1000 },
        player: { x: 20, y: 80, w: 540, h: 304 },
        meta: { x: 20, y: 404 },
        side: { x: 20, y: 576, w: 540 },
        lines: 2,
      }
    : {
        win: { x: 136, y: 50, w: 1008, h: 620 },
        player: { x: 24, y: 80, w: 576, h: 324 },
        meta: { x: 24, y: 422 },
        side: { x: 628, y: 80, w: 356 },
        lines: 3,
      };
  const PW = L.player.w;
  const PH = L.player.h;
  const metaW = L.player.w;
  const ch = { name: "remocn", subscribers: 18200, color: accent, ...channel };
  const st: WatchStats = {
    likesFrom: 1200,
    likesTo: 24000,
    viewsFrom: 12408,
    viewsTo: 1200000,
    commentsFrom: 1248,
    commentsTo: 1316,
    ...stats,
  };
  const sp = (at: number, config: object = CARD) =>
    spring({ frame: frame - at, fps, config });
  const ease = (a: number, b: number, e = ENTER) =>
    interpolate(frame, [a, b], [0, 1], { ...CL, easing: e });
  const press = (at: number) =>
    Math.max(
      0,
      spring({ frame: frame - at, fps, config: CHIP }) -
        spring({ frame: frame - at - 5, fps, config: CHIP }),
    );

  const winIn = sp(0, HEAVY);
  const cam = interpolate(frame, [LIKE_CLICK, END], [1, 1.03], {
    ...CL,
    easing: CAMERA,
  });

  const seconds = 30 + frame / 30;
  const vt = clamp(seconds / DURATION);
  const hover =
    ease(HOVER_IN - 6, HOVER_IN + 4, RISE) *
    (1 - ease(HOVER_OUT, HOVER_OUT + 8, EXIT));
  const ctrlShow = Math.max(hover, 1 - ease(18, 28, EXIT));

  const subbed = frame >= SUB_CLICK + 1;
  const subPop = sp(SUB_CLICK + 1, CHIP);
  const bellT = frame - SUB_CLICK - 4;
  const bellRot =
    bellT > 0 ? Math.sin(bellT * 1.2) * 18 * Math.exp(-bellT * 0.1) : 0;
  const subs = subbed
    ? ch.subscribers + 100 * ease(SUB_CLICK, SUB_CLICK + 20, RISE)
    : ch.subscribers;

  const liked = frame >= LIKE_CLICK + 1;
  const likePop = sp(LIKE_CLICK + 1, CHIP);
  const STEPS = 14;
  const stepF = ease(LIKE_CLICK + 2, LIKE_CLICK + 42, RISE) * STEPS;
  const stepI = Math.floor(stepF);
  const stepFrac = clamp((stepF - stepI) * 3);
  const likeAt = (i: number) =>
    compact(expLerp(st.likesFrom, st.likesTo, clamp(i / STEPS)));
  const rollP = !liked || stepI === 0 || stepI >= STEPS ? 1 : stepFrac;

  const vT = ease(LIKE_CLICK + 6, LIKE_CLICK + 70, MOVE);
  const views =
    vT >= 1
      ? `${compact(st.viewsTo)} views`
      : `${group(expLerp(st.viewsFrom, st.viewsTo, vT))} views`;

  const barL = L.player.x + 14;
  const barW = PW - 28;
  const barY = L.player.y + PH - 52;
  const rowY = L.meta.y + 44;
  const subBtn = { x: L.meta.x + 252, y: rowY + 20 };
  const likeBtn = { x: L.meta.x + metaW - 70, y: rowY + 20 };
  const keys: Key[] = [
    { f: 8, x: L.win.w * 0.86, y: L.win.h * 0.92 },
    { f: HOVER_IN, x: barL + barW * 0.3, y: barY + 2, bend: 0.14 },
    { f: HOVER_OUT - 8, x: barL + barW * 0.68, y: barY + 1 },
    { f: SUB_CLICK - 2, x: subBtn.x, y: subBtn.y, bend: 0.16 },
    { f: SUB_CLICK + 8, x: subBtn.x + 4, y: subBtn.y + 3 },
    { f: LIKE_CLICK - 2, x: likeBtn.x, y: likeBtn.y, bend: -0.18 },
    { f: LIKE_CLICK + 24, x: likeBtn.x + 50, y: likeBtn.y + 60, bend: 0.1 },
  ];
  const cur = along(keys, frame);
  const curPress = Math.max(press(SUB_CLICK), press(LIKE_CLICK));
  const hoverT = clamp((cur.x - barL) / barW);
  const chapterOf = (t: number) =>
    CHAPTERS.reduce((a, c, i) => (t >= c.at ? i : a), 0);
  const chapterI = chapterOf(vt);
  const hoverI = chapterOf(hoverT);
  const mmss = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const lineI = TRANSCRIPT.reduce((a, l, i) => (seconds >= l.at ? i : a), 0);

  const inner = (f: number) =>
    children ? (
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>
    ) : src ? (
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
      <EditorScene frame={f} accent={accent} />
    );
  const scaled = (w: number, f: number) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 836,
        height: 470,
        transform: `scale(${w / 836})`,
        transformOrigin: "0 0",
      }}
    >
      {inner(f)}
    </div>
  );

  const rise = (at: number, dist = 14): React.CSSProperties => {
    const p = sp(at, CARD);
    return {
      opacity: Math.min(1, p * 1.5),
      transform: `translateY(${(1 - p) * dist}px)`,
    };
  };

  const pill: React.CSSProperties = {
    height: 40,
    borderRadius: 20,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 16,
    fontWeight: 400,
    whiteSpace: "nowrap",
  };

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={ground ?? "film-blue"}
        params={
          groundParams ??
          (dark
            ? undefined
            : {
                background: "#eef1f6",
                colors: ["#ffffff", "#b4cdf0", "#6f9ad8", "#e3e9f3"],
                grain: 0.05,
              })
        }
        timeOffset={dark ? 2 : 4}
        timeScale={0.35}
      />
      <AbsoluteFill style={{ background: pal.scrim }} />
      <div
        style={{
          position: "absolute",
          left: (width - DW * u) / 2,
          top: (height - DH * u) / 2,
          width: DW,
          height: DH,
          transformOrigin: "0 0",
          transform: `scale(${u})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: L.win.x,
            top: L.win.y,
            width: L.win.w,
            height: L.win.h,
            transform: `translateY(${(1 - winIn) * 80}px) scale(${(0.96 + 0.04 * winIn) * cam})`,
            transformOrigin: "50% 60%",
            opacity: Math.min(1, winIn * 2),
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 18,
              background: pal.win,
              boxShadow: pal.shadow,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 60,
                display: "flex",
                alignItems: "center",
                padding: "0 24px",
                gap: 14,
                borderBottom: `1px solid ${pal.hair}`,
              }}
            >
              <RemocnLogo fontSize={22} color={pal.text} />
              <span style={{ fontSize: 16, color: pal.faint }}>/</span>
              <span style={{ fontSize: 16, color: pal.muted }}>
                Launch videos
              </span>
              <div style={{ flex: 1 }} />
              <div
                style={{
                  ...pill,
                  height: 36,
                  padding: "0 16px 0 13px",
                  background: accent,
                  color: "#fff",
                }}
              >
                <Icon name="share" size={18} color="#fff" />
                Share
              </div>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: "linear-gradient(140deg,#e6b08f,#a9654a)",
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
                }}
              />
            </div>

            <div
              style={{
                position: "absolute",
                left: L.player.x,
                top: L.player.y,
                width: PW,
                height: PH,
                borderRadius: 12,
                overflow: "hidden",
                background: "#000",
                boxShadow: dark
                  ? "0 0 0 1px rgba(255,255,255,0.08)"
                  : "0 0 0 1px rgba(0,0,0,0.08)",
              }}
            >
              {scaled(PW, frame)}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 120,
                  background:
                    "linear-gradient(180deg, transparent, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.7))",
                  opacity: Math.max(ctrlShow, 0.6),
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 14 + clamp(hoverT * barW - 80, 0, barW - 160),
                  top: PH - 52 - 132,
                  width: 160,
                  opacity: hover,
                  transform: `translateY(${(1 - hover) * 8}px) scale(${0.94 + 0.06 * hover})`,
                  transformOrigin: "50% 100%",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 160,
                    height: 90,
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "#000",
                    boxShadow:
                      "0 0 0 1.5px rgba(255,255,255,0.9), 0 10px 24px rgba(0,0,0,0.45)",
                  }}
                >
                  {scaled(160, Math.round(hoverT * 900))}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    textAlign: "center",
                    fontSize: 16,
                    color: "#fff",
                    textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {CHAPTERS[hoverI].name}
                  <span
                    style={{ fontFamily: mono, opacity: 0.75, marginLeft: 8 }}
                  >
                    {mmss(hoverT * DURATION)}
                  </span>
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  right: 14,
                  top: PH - 52,
                  height: 4 + hover * 2,
                  display: "flex",
                  gap: 3,
                }}
              >
                {CHAPTERS.map((c, i) => {
                  const end = CHAPTERS[i + 1]?.at ?? 1;
                  const seg = (x: number) => clamp((x - c.at) / (end - c.at));
                  return (
                    <div
                      key={c.name}
                      style={{
                        position: "relative",
                        flex: end - c.at,
                        borderRadius: 2,
                        background: "rgba(255,255,255,0.28)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: `${seg(hover > 0 ? hoverT : 0) * 100}%`,
                          background: "rgba(255,255,255,0.55)",
                          opacity: hover,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: `${seg(vt) * 100}%`,
                          background: "#fff",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  bottom: 10,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  color: "#fff",
                  fontSize: 16,
                }}
              >
                <Icon name="pause" size={20} color="#fff" sw={2} />
                <Icon name="vol" size={20} color="#fff" />
                <span
                  style={{
                    fontFamily: mono,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {mmss(seconds)} / {mmss(DURATION)}
                </span>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>
                  {CHAPTERS[chapterI].name}
                </span>
                <div style={{ flex: 1 }} />
                <Icon name="cc" size={20} color="#fff" />
                <Icon name="full" size={20} color="#fff" />
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: L.meta.x,
                top: L.meta.y,
                width: metaW,
                fontSize: 26,
                fontWeight: 400,
                letterSpacing: "-0.02em",
                color: pal.text,
                whiteSpace: "nowrap",
                ...rise(8),
              }}
            >
              {title}
            </div>
            <div
              style={{
                position: "absolute",
                left: L.meta.x,
                top: rowY,
                width: metaW,
                height: 40,
                display: "flex",
                alignItems: "center",
                ...rise(12),
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: ch.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <RemocnR height={17} color="#fff" />
              </div>
              <div style={{ marginLeft: 12, width: 132 }}>
                <div style={{ fontSize: 17, color: pal.text, lineHeight: 1.2 }}>
                  {ch.name}
                </div>
                <div
                  style={{
                    fontSize: 15.5,
                    color: pal.muted,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1.3,
                  }}
                >
                  {compact(subs)} subscribers
                </div>
              </div>
              <div
                style={{
                  ...pill,
                  padding: subbed ? "0 16px 0 12px" : "0 18px",
                  background: subbed ? pal.surface : pal.strong,
                  color: subbed ? pal.text : pal.onStrong,
                  transform: `scale(${(1 - 0.04 * press(SUB_CLICK)) * (subbed ? 0.94 + 0.06 * subPop : 1)})`,
                }}
              >
                {subbed ? (
                  <>
                    <div
                      style={{
                        transform: `rotate(${bellRot}deg)`,
                        transformOrigin: "50% 15%",
                      }}
                    >
                      <Icon name="bell" size={18} color={pal.text} />
                    </div>
                    Subscribed
                  </>
                ) : (
                  "Subscribe"
                )}
              </div>
              <div style={{ flex: 1 }} />
              <div
                style={{
                  ...pill,
                  width: 124,
                  boxSizing: "border-box",
                  padding: "0 16px 0 14px",
                  background: liked
                    ? `color-mix(in oklab, ${accent} ${dark ? 22 : 12}%, ${pal.surface})`
                    : pal.surface,
                  color: liked ? (dark ? "#fff" : accent) : pal.text,
                  transform: `scale(${1 - 0.04 * press(LIKE_CLICK)})`,
                }}
              >
                <div
                  style={{
                    transform: `scale(${liked ? 0.8 + 0.2 * likePop : 1}) rotate(${liked ? (1 - likePop) * -14 : 0}deg)`,
                  }}
                >
                  <Icon
                    name="like"
                    size={20}
                    color={liked ? (dark ? "#fff" : accent) : pal.text}
                    fill={liked ? (dark ? "#fff" : accent) : "none"}
                  />
                </div>
                <div
                  style={{
                    position: "relative",
                    height: 22,
                    overflow: "hidden",
                    flex: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      lineHeight: "22px",
                      transform: `translateY(${(1 - rollP) * 12}px)`,
                      opacity: rollP < 1 ? Math.min(1, rollP * 1.4) : 1,
                    }}
                  >
                    {likeAt(liked ? stepI : 0)}
                  </div>
                  {rollP < 1 ? (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        lineHeight: "22px",
                        transform: `translateY(${-rollP * 12}px)`,
                        opacity: Math.max(0, 1 - rollP * 2.5),
                      }}
                    >
                      {likeAt(stepI - 1)}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: L.meta.x,
                top: rowY + 58,
                width: metaW,
                boxSizing: "border-box",
                borderRadius: 12,
                background: pal.surface,
                padding: "12px 16px",
                fontSize: 16,
                lineHeight: "23px",
                color: pal.muted,
                ...rise(16),
              }}
            >
              <div
                style={{ color: pal.text, fontVariantNumeric: "tabular-nums" }}
              >
                {views}
                <span style={{ color: pal.muted, marginLeft: 12 }}>
                  3 hours ago
                </span>
              </div>
              <div
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Kinetic captions, 40+ transitions, one install command.
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: L.side.x,
                top: L.side.y,
                width: L.side.w,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  color: pal.muted,
                  height: 28,
                  ...rise(6),
                }}
              >
                Chapters
              </div>
              {CHAPTERS.map((c, i) => {
                const active = i === chapterI;
                const hovered = hover > 0.05 && i === hoverI && !active;
                return (
                  <div
                    key={c.name}
                    style={{
                      height: 44,
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "0 12px",
                      margin: "0 -12px",
                      borderRadius: 10,
                      background: active
                        ? pal.surface
                        : hovered
                          ? `color-mix(in oklab, ${pal.surface} ${Math.round(hover * 55)}%, transparent)`
                          : "transparent",
                      ...rise(8 + i * 2, 10),
                    }}
                  >
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 16,
                        width: 48,
                        color: active ? accent : pal.faint,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {mmss(c.at * DURATION)}
                    </span>
                    <span
                      style={{
                        fontSize: 16.5,
                        color: active || hovered ? pal.text : pal.muted,
                      }}
                    >
                      {c.name}
                    </span>
                  </div>
                );
              })}
              <div
                style={{
                  height: 1,
                  background: pal.hair,
                  margin: "16px 0 16px",
                  ...rise(18),
                }}
              />
              <div
                style={{
                  fontSize: 16,
                  color: pal.muted,
                  height: 28,
                  ...rise(18),
                }}
              >
                Transcript
              </div>
              {TRANSCRIPT.slice(
                Math.min(lineI, TRANSCRIPT.length - L.lines),
                Math.min(lineI, TRANSCRIPT.length - L.lines) + L.lines,
              ).map((l) => {
                const on = seconds >= l.at && l === TRANSCRIPT[lineI];
                return (
                  <div
                    key={l.at}
                    style={{
                      display: "flex",
                      gap: 14,
                      padding: "8px 0",
                      ...rise(20, 10),
                    }}
                  >
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 16,
                        width: 48,
                        flexShrink: 0,
                        color: on ? accent : pal.faint,
                        lineHeight: "23px",
                      }}
                    >
                      {mmss(l.at)}
                    </span>
                    <span
                      style={{
                        fontSize: 16.5,
                        lineHeight: "23px",
                        color: on ? pal.text : pal.muted,
                        textWrap: "pretty",
                      }}
                    >
                      {l.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <Cursor x={cur.x} y={cur.y} press={curPress} opacity={ease(8, 16)} />
        </div>
      </div>
    </AbsoluteFill>
  );
}
