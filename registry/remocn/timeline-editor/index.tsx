"use client";

import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
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

export type EditorScene = "logo" | "ui" | "end";

export interface EditorClip {
  name: string;
  /** Clip length on the timeline, in seconds. */
  seconds: number;
  /** Which built-in animated scene the clip shows in the monitor. */
  scene: EditorScene;
}

export interface TimelineEditorProps {
  /** Up to three video clips; they are dragged onto V1 in order. */
  clips?: EditorClip[];
  projectName?: string;
  /** Text of the title clip that lands on V2. */
  title?: string;
  /** Name of the audio clip that lands on A1. */
  audioName?: string;
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_CLIPS: EditorClip[] = [
  { name: "intro-logo.mp4", seconds: 3.5, scene: "logo" },
  { name: "dashboard.mov", seconds: 4, scene: "ui" },
  { name: "end-card.mp4", seconds: 3.5, scene: "end" },
];

const TITLE_SPAN = { start: 0.5, len: 2.6 };
const TITLE_AT = 130;
const AUDIO_AT = 138;
const SCRUB_AT = 156;
const SCRUB_END = 232;
const CLICK_AT = 258;
const DONE_AT = 312;

const ARROW =
  "M1 1 L1 18.5 L5.6 14.4 L8.7 21.6 L11.6 20.4 L8.5 13.2 L14.5 13.2 Z";
const GREEN = "#2FA36B";

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const ENTER_SOFT = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
const timecode = (s: number) => {
  const fr = Math.floor((s % 1) * 30);
  const sec = Math.floor(s);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(sec / 60))}:${p(sec % 60)}:${p(fr)}`;
};

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

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

const DARK = {
  dark: true,
  win: "rgba(12,13,17,0.92)",
  panel: "rgba(255,255,255,0.03)",
  well: "#06070A",
  lane: "rgba(255,255,255,0.035)",
  rule: "rgba(255,255,255,0.07)",
  text: "#EDEEF2",
  muted: "rgba(237,238,242,0.6)",
  faint: "rgba(237,238,242,0.32)",
  tick: "rgba(237,238,242,0.18)",
  solid: "#EDEEF2",
  onSolid: "#0C0D11",
  depth:
    "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.09), 0 40px 100px -30px rgba(0,0,0,0.8)",
  pop: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.1), 0 24px 50px -16px rgba(0,0,0,0.7)",
  popBg: "#16171C",
  titleBg: "rgba(140,155,255,0.16)",
  titleRing: "rgba(160,172,255,0.35)",
  titleText: "#D4DAFF",
  audioBg: "rgba(70,190,140,0.12)",
  audioRing: "rgba(90,210,160,0.28)",
  audioText: "#A6E9CB",
  wave: "rgba(110,220,170,0.75)",
  scrim:
    "radial-gradient(80% 85% at 50% 50%, rgba(3,6,14,0.45), rgba(3,6,14,0.1))",
};
const LIGHT: typeof DARK = {
  dark: false,
  win: "#FBFBFA",
  panel: "#FFFFFF",
  well: "#EDEDEB",
  lane: "rgba(0,0,0,0.03)",
  rule: "rgba(0,0,0,0.07)",
  text: "#17181C",
  muted: "rgba(23,24,28,0.6)",
  faint: "rgba(23,24,28,0.32)",
  tick: "rgba(23,24,28,0.2)",
  solid: "#17181C",
  onSolid: "#FFFFFF",
  depth:
    "0 0 0 1px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.06), 0 40px 80px -30px rgba(20,24,60,0.3)",
  pop: "0 0 0 1px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.05), 0 20px 44px -14px rgba(20,24,60,0.25)",
  popBg: "#FFFFFF",
  titleBg: "rgba(59,91,253,0.1)",
  titleRing: "rgba(59,91,253,0.3)",
  titleText: "#2B3FA8",
  audioBg: "rgba(30,150,100,0.1)",
  audioRing: "rgba(30,150,100,0.3)",
  audioText: "#16704C",
  wave: "rgba(30,150,100,0.6)",
  scrim:
    "radial-gradient(80% 85% at 50% 50%, rgba(240,238,234,0.45), rgba(240,238,234,0.1))",
};
type Palette = typeof DARK;

const ICONS: Record<string, string> = {
  play: "M8 5.5v13l10.5-6.5z",
  back: "M18 18.5L9 12l9-6.5zM6 18V6",
  fwd: "M6 5.5l9 6.5-9 6.5zM18 6v12",
  check: "M5.5 12.5l4 4L18.5 7.5",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  type: "M5 6.5V5h14v1.5M12 5v14M9 19h6",
  music:
    "M9 17.5V6l11-2v11.5M9 17.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM20 15.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
};

function Icon({
  d,
  size = 18,
  color,
  fill,
  sw = 1.5,
}: {
  d: string;
  size?: number;
  color: string;
  fill?: string;
  sw?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ flexShrink: 0, display: "block" }}
      aria-hidden
    >
      <path
        d={d}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill ?? "none"}
      />
    </svg>
  );
}

function Cursor({ x, y, press }: { x: number; y: number; press: number }) {
  return (
    <svg
      width={24}
      height={28}
      viewBox="0 0 16 22"
      style={{
        position: "absolute",
        left: x - 1.4,
        top: y - 1.4,
        transformOrigin: "1px 1px",
        transform: `scale(${1 - 0.12 * press})`,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
        overflow: "visible",
        zIndex: 40,
      }}
      aria-hidden
    >
      <path
        d={ARROW}
        fill="#FFFFFF"
        stroke="#121318"
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

const sp = (t: number, delay: number, damping = 16, stiffness = 120) =>
  spring({ frame: t * 30 - delay, fps: 30, config: { damping, stiffness } });

function SceneArt({
  scene,
  t,
  accent,
}: {
  scene: EditorScene;
  t: number;
  accent: string;
}) {
  const abs: React.CSSProperties = { position: "absolute", inset: 0 };
  if (scene === "logo") {
    const m = sp(t, 0, 11, 130);
    const w = sp(t, 7, 18, 110);
    const tag = interpolate(t, [0.8, 1.3], [0, 1], clamp);
    return (
      <div
        style={{
          ...abs,
          background: `radial-gradient(90% 70% at 50% 130%, ${withAlpha(accent, 0.5)}, transparent 70%), linear-gradient(180deg,#07080d,#0d1024)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 64,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 11,
          }}
        >
          <div
            style={{
              opacity: clamp01(m * 2),
              transform: `translateY(${(1 - w) * 10}px) scale(${0.82 + m * 0.18})`,
            }}
          >
            <RemocnLogo fontSize={44} color="#fff" />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 118,
            width: "100%",
            textAlign: "center",
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.6)",
            opacity: tag,
            textTransform: "uppercase",
          }}
        >
          Launch videos, built in code
        </div>
      </div>
    );
  }
  if (scene === "ui") {
    const card = sp(t, 0, 17, 110);
    const chip = sp(t, 26, 14, 140);
    return (
      <div
        style={{
          ...abs,
          background: `radial-gradient(70% 60% at 80% 0%, ${withAlpha(accent, 0.28)}, transparent 70%), linear-gradient(160deg,#f1f3f9,#dfe5f4)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 34,
            width: 200,
            height: 118,
            borderRadius: 10,
            background: "#fff",
            boxShadow:
              "0 14px 30px rgba(30,40,80,0.16), 0 0 0 1px rgba(20,30,60,0.06)",
            padding: "11px 12px",
            boxSizing: "border-box",
            opacity: card,
            transform: `translateY(${(1 - card) * 26}px)`,
          }}
        >
          <div style={{ fontSize: 7.5, color: "#7a7f8c", fontWeight: 400 }}>
            Kitebase · Monthly revenue
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              marginTop: 3,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 300,
                color: "#14161c",
                letterSpacing: -0.6,
              }}
            >
              $48,210
            </span>
            <span
              style={{
                fontSize: 7,
                fontWeight: 400,
                color: "#16a34a",
                background: "#e7f7ec",
                padding: "1px 4px",
                borderRadius: 4,
              }}
            >
              +12.4%
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 5,
              height: 48,
              marginTop: 8,
            }}
          >
            {Array.from({ length: 11 }, (_, i) => {
              const g = sp(t, 8 + i * 2.2, 15, 140);
              const h = 12 + hash(i + 4) * 22 + i * 1.6;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: h * g,
                    borderRadius: 2,
                    background: i === 10 ? accent : withAlpha(accent, 0.22),
                  }}
                />
              );
            })}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 22,
            top: 18,
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 8px 5px 5px",
            borderRadius: 8,
            background: "#fff",
            boxShadow: "0 8px 18px rgba(30,40,80,0.16)",
            fontSize: 7,
            color: "#14161c",
            fontWeight: 400,
            opacity: chip,
            transform: `translateY(${(1 - chip) * -10}px) scale(${0.9 + chip * 0.1})`,
          }}
        >
          <div
            style={{
              width: 13,
              height: 13,
              borderRadius: 7,
              background: "#f59e0b",
              color: "#fff",
              fontSize: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            MC
          </div>
          Maya Chen upgraded
        </div>
      </div>
    );
  }
  const a = sp(t, 0, 18, 120);
  const b = sp(t, 6, 18, 120);
  const c = sp(t, 12, 12, 150);
  return (
    <div
      style={{
        ...abs,
        background: `radial-gradient(80% 60% at 50% -20%, ${withAlpha(accent, 0.35)}, transparent 70%), #08090d`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 300,
          letterSpacing: "-0.03em",
          opacity: a,
          transform: `translateY(${(1 - a) * 14}px)`,
        }}
      >
        Ship your launch video
      </div>
      <div
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.6)",
          marginTop: 5,
          opacity: b,
          transform: `translateY(${(1 - b) * 10}px)`,
        }}
      >
        in minutes, not weeks.
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 14,
          opacity: c,
          transform: `scale(${0.94 + c * 0.06})`,
        }}
      >
        <div
          style={{
            padding: "5px 11px",
            borderRadius: 999,
            background: accent,
            fontSize: 10,
            fontWeight: 400,
          }}
        >
          Get started
        </div>
        <div
          style={{
            padding: "5px 11px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.2)",
            fontSize: 10,
            fontFamily: mono,
          }}
        >
          remocn.dev
        </div>
      </div>
    </div>
  );
}

function Scene({
  scene,
  t,
  accent,
  w,
}: {
  scene: EditorScene;
  t: number;
  accent: string;
  w: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: (w * 9) / 16,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 320,
          height: 180,
          transform: `scale(${w / 320})`,
          transformOrigin: "0 0",
        }}
      >
        <SceneArt scene={scene} t={t} accent={accent} />
      </div>
    </div>
  );
}

function Waveform({
  w,
  h,
  color,
  seed = 1,
}: {
  w: number;
  h: number;
  color: string;
  seed?: number;
}) {
  const n = Math.floor(w / 3);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        height: h,
        width: w,
      }}
    >
      {Array.from({ length: n }, (_, i) => {
        const env = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.11 + seed));
        const v = 0.15 + hash(i * 3 + seed) * 0.85 * env;
        return (
          <div
            key={i}
            style={{
              width: 2,
              height: Math.max(2, v * h),
              borderRadius: 1,
              background: color,
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
}

function ClipBlock({
  clip,
  w,
  h,
  accent,
  selected,
  glow,
}: {
  clip: EditorClip;
  w: number;
  h: number;
  accent: string;
  selected: boolean;
  glow: number;
}) {
  const band = Math.min(24, h * 0.42);
  const fh = h - band;
  const tw = (fh * 16) / 9;
  const n = Math.max(1, Math.ceil(w / tw));
  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        borderRadius: 8,
        overflow: "hidden",
        background: "#151826",
        boxShadow: `0 0 0 ${glow * 2}px ${withAlpha(accent, glow)}`,
      }}
    >
      <div style={{ display: "flex", height: fh, marginTop: band }}>
        {Array.from({ length: n }, (_, k) => (
          <div
            key={k}
            style={{
              boxShadow: "inset -1px 0 0 rgba(0,0,0,0.4)",
              flexShrink: 0,
            }}
          >
            <Scene
              scene={clip.scene}
              t={1.2 + k * 0.5}
              accent={accent}
              w={tw}
            />
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.25), transparent 40%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 9,
          top: 1,
          right: 8,
          fontSize: 16,
          color: "#fff",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {clip.name}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 8,
          boxShadow: selected
            ? "inset 0 0 0 2px #FFFFFF"
            : "inset 0 0 0 1px rgba(255,255,255,0.14)",
        }}
      />
    </div>
  );
}

interface Layout {
  win: { x: number; y: number; w: number; h: number };
  topH: number;
  btn: { x: number; y: number; w: number; h: number };
  binHeader: { x: number; y: number };
  thumb: { w: number; h: number };
  item: (i: number) => { x: number; y: number };
  namesBelow: boolean;
  binDivider: { x: number; y0: number; y1: number } | null;
  mon: { x: number; y: number; w: number };
  transportY: number;
  pop: { x: number; y: number; w: number };
  tlTop: number;
  rulerY: number;
  trackX: number;
  pps: number;
  v2: { y: number; h: number };
  v1: { y: number; h: number };
  a1: { y: number; h: number };
  tickEvery: number;
}

function layoutFor(tall: boolean, dw: number, dh: number): Layout {
  if (tall) {
    const w = 592;
    const h = 836;
    return {
      win: { x: (dw - w) / 2, y: (dh - h) / 2, w, h },
      topH: 60,
      btn: { x: w - 20 - 124, y: 11, w: 124, h: 38 },
      binHeader: { x: 20, y: 444 },
      thumb: { w: 128, h: 72 },
      item: (i) => ({ x: 20 + i * 141, y: 472 }),
      namesBelow: true,
      binDivider: null,
      mon: { x: 20, y: 76, w: 552 },
      transportY: 398,
      pop: { x: 20, y: 424, w: 552 },
      tlTop: 588,
      rulerY: 598,
      trackX: 60,
      pps: 44,
      v2: { y: 632, h: 42 },
      v1: { y: 682, h: 62 },
      a1: { y: 752, h: 52 },
      tickEvery: 2,
    };
  }
  const w = 1000;
  const h = 596;
  return {
    win: { x: (dw - w) / 2, y: (dh - h) / 2, w, h },
    topH: 60,
    btn: { x: w - 20 - 124, y: 11, w: 124, h: 38 },
    binHeader: { x: 20, y: 74 },
    thumb: { w: 96, h: 54 },
    item: (i) => ({ x: 20, y: 104 + i * 64 }),
    namesBelow: false,
    binDivider: { x: 280, y0: 60, y1: 364 },
    mon: { x: 300, y: 76, w: 400 },
    transportY: 316,
    pop: { x: w - 20 - 280, y: 70, w: 280 },
    tlTop: 364,
    rulerY: 372,
    trackX: 72,
    pps: 78,
    v2: { y: 404, h: 42 },
    v1: { y: 452, h: 62 },
    a1: { y: 520, h: 52 },
    tickEvery: 1,
  };
}

export function TimelineEditor({
  clips = DEFAULT_CLIPS,
  projectName = "Launch video",
  title = "Meet remocn",
  audioName = "soundtrack.wav",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
  ground,
  groundParams,
}: TimelineEditorProps) {
  const f = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width * 1.2;
  const u = tall ? width / 640 : Math.min(width / 1280, height / 720);
  const dw = width / u;
  const dh = height / u;
  const L = layoutFor(tall, dw, dh);
  const c: Palette = theme === "light" ? LIGHT : DARK;
  const list = clips.slice(0, 3);
  const starts = list.map((_, i) =>
    list.slice(0, i).reduce((a, k) => a + k.seconds, 0),
  );
  const total = list.reduce((a, k) => a + k.seconds, 0);
  const PPS = L.pps;
  const TX = L.trackX;
  const clipH = L.v1.h - 6;
  const monH = (L.mon.w * 9) / 16;

  const T = list.map((_, i) => {
    const base = 6 + i * 40;
    return { move: base, press: base + 18, drop: base + 38 };
  });
  const slot = list.map((k, i) => ({
    x: TX + starts[i] * PPS,
    y: L.v1.y + 3,
    w: k.seconds * PPS,
    h: clipH,
  }));
  const thumbC = list.map((_, i) => ({
    x: L.item(i).x + L.thumb.w / 2,
    y: L.item(i).y + L.thumb.h / 2,
  }));
  const dropC = slot.map((s) => ({ x: s.x + 40, y: s.y + 30 }));

  const scrubPts = [0, ...list.map((k, i) => starts[i] + k.seconds * 0.72)];
  scrubPts[scrubPts.length - 1] = total - 0.05;
  const scrubFr = scrubPts.map(
    (_, i) => SCRUB_AT + 2 + ((SCRUB_END - SCRUB_AT - 2) * i) / list.length,
  );
  const p = interpolate(f, scrubFr, scrubPts, { ...clamp, easing: MOVE });
  const headX = TX + p * PPS;

  type Key = { t: number; x: number; y: number };
  const startPt = { x: L.win.w * 0.62, y: L.win.h + 60 };
  const keys: Key[] = [{ t: 0, ...startPt }];
  let last = startPt;
  list.forEach((_, i) => {
    keys.push({ t: T[i].move, ...last });
    keys.push({ t: T[i].press - 4, ...thumbC[i] });
    keys.push({ t: T[i].press, ...thumbC[i] });
    keys.push({ t: T[i].drop, ...dropC[i] });
    last = dropC[i];
  });
  const lastDrop = list.length ? T[list.length - 1].drop : 0;
  keys.push({ t: lastDrop + 4, ...last });
  keys.push({ t: SCRUB_AT - 2, x: TX + 1, y: L.rulerY + 12 });
  keys.push({ t: SCRUB_END + 6, x: TX + total * PPS, y: L.rulerY + 12 });
  const btnPt = { x: L.btn.x + L.btn.w / 2 + 8, y: L.btn.y + L.btn.h / 2 + 4 };
  keys.push({ t: CLICK_AT - 4, ...btnPt });
  keys.push({ t: CLICK_AT + 10, ...btnPt });
  keys.push({
    t: CLICK_AT + 36,
    x: btnPt.x - 150,
    y: btnPt.y + (tall ? 300 : 230),
  });
  const cursorAt = (t: number) => {
    if (t >= SCRUB_AT && t <= SCRUB_END + 6)
      return { x: headX + 1, y: L.rulerY + 12 };
    if (t <= keys[0].t) return keys[0];
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i];
      const b = keys[i + 1];
      if (t >= a.t && t < b.t) {
        const e = ENTER(clamp01((t - a.t) / Math.max(1, b.t - a.t)));
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const arc = Math.sin(Math.PI * e) * 0.12;
        return { x: a.x + dx * e - dy * arc, y: a.y + dy * e + dx * arc };
      }
    }
    return keys[keys.length - 1];
  };
  const cur = cursorAt(f);
  const pressAt = (k: number, release: number) => {
    if (f < k - 3) return 0;
    if (f < k) return interpolate(f, [k - 3, k], [0, 1], clamp);
    if (f < release) return 1;
    return clamp01(1 - spring({ frame: f - release, fps, config: CHIP }));
  };
  const press = Math.max(
    ...T.map((k) => pressAt(k.press, k.drop)),
    pressAt(SCRUB_AT, SCRUB_END + 4),
    pressAt(CLICK_AT, CLICK_AT),
  );

  const rects = list.map((_k, i) => {
    const t = T[i];
    if (f < t.press) return null;
    const morph = ENTER_SOFT(
      clamp01(((f - t.press) / (t.drop - t.press)) * 1.6),
    );
    const grab = {
      x: lerp(L.thumb.w / 2, 40, morph),
      y: lerp(L.thumb.h / 2, 30, morph),
    };
    if (f < t.drop) {
      return {
        x: cur.x - grab.x,
        y: cur.y - grab.y,
        w: lerp(L.thumb.w, slot[i].w, morph),
        h: lerp(L.thumb.h, clipH, morph),
        flying: true,
      };
    }
    const s = spring({ frame: f - t.drop, fps, config: CARD });
    return {
      x: lerp(dropC[i].x - 40, slot[i].x, s),
      y: lerp(dropC[i].y - 30, slot[i].y, s),
      w: slot[i].w,
      h: clipH,
      flying: false,
    };
  });
  const flashAt = (at: number) =>
    interpolate(f - at, [0, 2, 18], [0, 1, 0], { ...clamp, easing: MOVE });
  const flashes = [
    ...T.map((k, i) => ({ v: flashAt(k.drop + 2), x: slot[i].x })),
    { v: flashAt(TITLE_AT + 3), x: TX + TITLE_SPAN.start * PPS },
  ];
  const titleFlash = flashes[flashes.length - 1].v;
  const titleIn = spring({ frame: f - TITLE_AT, fps, config: CARD });
  const audioIn = spring({ frame: f - AUDIO_AT, fps, config: CARD });
  const wave = interpolate(f, [AUDIO_AT + 2, AUDIO_AT + 30], [0, 1], {
    ...clamp,
    easing: ENTER,
  });

  const placed = (i: number) => f >= T[i].drop;
  const active = list.findIndex(
    (k, i) => placed(i) && p >= starts[i] && p < starts[i] + k.seconds,
  );
  const lastPlaced = list.findLastIndex((_, i) => placed(i));
  const preview = f < SCRUB_AT && lastPlaced >= 0;
  const shown = preview ? lastPlaced : active;
  const shownT = preview
    ? (f - T[lastPlaced].drop) / 30 + 0.05
    : p - (starts[shown] ?? 0);
  const monIn = preview
    ? interpolate(f - T[lastPlaced].drop, [0, 6], [0.35, 1], {
        ...clamp,
        easing: ENTER,
      })
    : 1;
  const titleT = p - TITLE_SPAN.start;
  const titleOn =
    f >= TITLE_AT && titleT >= 0 && titleT < TITLE_SPAN.len ? titleT : -1;

  const pop = spring({ frame: f - CLICK_AT - 2, fps, config: CARD });
  const prog = interpolate(
    f,
    [CLICK_AT + 8, CLICK_AT + 22, CLICK_AT + 34, DONE_AT - 4],
    [0, 0.41, 0.68, 1],
    { ...clamp, easing: MOVE },
  );
  const done = spring({ frame: f - DONE_AT, fps, config: CHIP });
  const doneT = interpolate(f, [DONE_AT, DONE_AT + 8], [0, 1], {
    ...clamp,
    easing: ENTER_SOFT,
  });
  const btnPress = pressAt(CLICK_AT, CLICK_AT);
  const exporting = f >= CLICK_AT && f < DONE_AT;

  const enter = spring({ frame: f, fps, config: HEAVY });
  const camA = interpolate(
    f,
    [12, 42, lastDrop + 6, SCRUB_AT + 4],
    [1, 1.04, 1.04, 1],
    { ...clamp, easing: CAMERA },
  );
  const camB = interpolate(f, [CLICK_AT - 24, CLICK_AT + 4], [1, 1.05], {
    ...clamp,
    easing: CAMERA,
  });
  const exportPhase = f > CLICK_AT - 30;
  const cam = exportPhase ? camB : camA;
  const origin = exportPhase
    ? `${L.win.x + L.win.w - 120}px ${L.win.y + 80}px`
    : `${L.win.x + 300}px ${L.win.y + L.tlTop + 100}px`;

  const fileName = `${projectName.toLowerCase().replace(/\s+/g, "-")}.mp4`;
  const tlEnd = L.a1.y + L.a1.h;
  const ticks = Math.floor((L.win.w - TX - 12) / PPS);

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <GshGround
        preset={ground ?? (c.dark ? "film-blue" : "paper-crease")}
        params={groundParams}
        timeOffset={c.dark ? 3 : 5}
        timeScale={0.35}
      />
      <AbsoluteFill style={{ background: c.scrim }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: dw,
          height: dh,
          transform: `scale(${u})`,
          transformOrigin: "0 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${cam})`,
            transformOrigin: origin,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: L.win.x,
              top: L.win.y,
              width: L.win.w,
              height: L.win.h,
              borderRadius: 20,
              background: c.win,
              backdropFilter: c.dark ? "blur(30px)" : undefined,
              boxShadow: c.depth,
              color: c.text,
              opacity: interpolate(f, [0, 10], [0, 1], {
                ...clamp,
                easing: ENTER_SOFT,
              }),
              transform: `translateY(${(1 - enter) * 40}px) scale(${0.97 + 0.03 * enter})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: L.topH,
                boxShadow: `inset 0 -1px 0 ${c.rule}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0 20px",
                fontSize: 18,
              }}
            >
              <span>{projectName}</span>
              <span style={{ color: c.faint, fontSize: 16 }}>Saved</span>
            </div>
            <div
              style={{
                position: "absolute",
                left: L.btn.x,
                top: L.btn.y,
                width: L.btn.w,
                height: L.btn.h,
                borderRadius: 12,
                background: interpolateColors(doneT, [0, 1], [c.solid, GREEN]),
                color: interpolateColors(doneT, [0, 1], [c.onSolid, "#FFFFFF"]),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 17,
                transform: `scale(${1 - 0.04 * btnPress})`,
              }}
            >
              <Icon
                d={doneT > 0.5 ? ICONS.check : ICONS.download}
                size={18}
                color={doneT > 0.5 ? "#FFFFFF" : c.onSolid}
              />
              {doneT > 0.5 ? "Exported" : exporting ? "Exporting" : "Export"}
            </div>

            {L.binDivider ? (
              <div
                style={{
                  position: "absolute",
                  left: L.binDivider.x,
                  top: L.binDivider.y0,
                  width: 1,
                  height: L.binDivider.y1 - L.binDivider.y0,
                  background: c.rule,
                }}
              />
            ) : null}
            <div
              style={{
                position: "absolute",
                left: L.binHeader.x,
                top: L.binHeader.y,
                fontSize: 16,
                color: c.muted,
              }}
            >
              Media
            </div>
            {[...list, null].map((k, i) => {
              const pos = L.item(i);
              const isPlaced = k ? placed(i) : f >= AUDIO_AT;
              const lifted = k ? f >= T[i].press && f < T[i].drop : false;
              const check = spring({
                frame: f - (k ? T[i].drop : AUDIO_AT),
                fps,
                config: CHIP,
              });
              const name = k ? k.name : audioName;
              const meta = k ? `0:0${Math.round(k.seconds)}` : "0:11";
              return (
                <div key={name}>
                  <div
                    style={{
                      position: "absolute",
                      left: pos.x,
                      top: pos.y,
                      width: L.thumb.w,
                      height: L.thumb.h,
                      borderRadius: 8,
                      overflow: "hidden",
                      background: k ? "#151826" : c.audioBg,
                      opacity: lifted ? 0.35 : 1,
                      boxShadow: `inset 0 0 0 1px ${c.rule}`,
                    }}
                  >
                    {k ? (
                      <Scene
                        scene={k.scene}
                        t={2.2}
                        accent={accent}
                        w={L.thumb.w}
                      />
                    ) : (
                      <div style={{ padding: "0 6px", marginTop: 10 }}>
                        <Waveform
                          w={L.thumb.w - 12}
                          h={L.thumb.h - 20}
                          color={c.wave}
                          seed={3}
                        />
                      </div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 8,
                        boxShadow: `inset 0 0 0 1px ${c.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                      }}
                    />
                  </div>
                  {isPlaced ? (
                    <div
                      style={{
                        position: "absolute",
                        left: pos.x + L.thumb.w - 26,
                        top: pos.y + 6,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        background: accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: `scale(${check})`,
                      }}
                    >
                      <Icon d={ICONS.check} size={13} color="#FFFFFF" sw={2} />
                    </div>
                  ) : null}
                  <div
                    style={
                      L.namesBelow
                        ? {
                            position: "absolute",
                            left: pos.x,
                            top: pos.y + L.thumb.h + 8,
                            width: L.thumb.w,
                            fontSize: 16,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            color: c.muted,
                          }
                        : {
                            position: "absolute",
                            left: pos.x + L.thumb.w + 14,
                            top: pos.y + 6,
                            width: 150,
                          }
                    }
                  >
                    <div
                      style={{
                        fontSize: L.namesBelow ? 16 : 17,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {name}
                    </div>
                    {L.namesBelow ? null : (
                      <div
                        style={{
                          marginTop: 4,
                          fontFamily: mono,
                          fontSize: 16,
                          color: c.faint,
                        }}
                      >
                        {meta}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div
              style={{
                position: "absolute",
                left: L.mon.x,
                top: L.mon.y,
                width: L.mon.w,
                height: monH,
                borderRadius: 10,
                overflow: "hidden",
                background: c.well,
                boxShadow: `0 0 0 1px ${c.rule}`,
              }}
            >
              {shown >= 0 ? (
                <div style={{ opacity: monIn }}>
                  <Scene
                    scene={list[shown].scene}
                    t={shownT}
                    accent={accent}
                    w={L.mon.w}
                  />
                </div>
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    color: c.faint,
                  }}
                >
                  Drop a clip to start
                </div>
              )}
              {titleOn >= 0 ? (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: monH * 0.1,
                    textAlign: "center",
                    color: "#FFFFFF",
                    fontSize: L.mon.w * 0.05,
                    fontWeight: 300,
                    letterSpacing: "-0.02em",
                    textShadow: "0 2px 12px rgba(0,0,0,0.4)",
                    opacity: interpolate(titleOn, [0, 0.3], [0, 1], {
                      ...clamp,
                      easing: ENTER,
                    }),
                    transform: `translateY(${interpolate(titleOn, [0, 0.4], [10, 0], { ...clamp, easing: ENTER })}px)`,
                  }}
                >
                  {title}
                </div>
              ) : null}
            </div>
            <div
              style={{
                position: "absolute",
                left: L.mon.x,
                top: L.transportY,
                width: L.mon.w,
                height: 28,
                display: "flex",
                alignItems: "center",
                fontFamily: mono,
                fontSize: 16,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span>{timecode(p)}</span>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  gap: 18,
                }}
              >
                <Icon d={ICONS.back} size={18} color={c.muted} />
                <Icon d={ICONS.play} size={18} color={c.text} fill={c.text} />
                <Icon d={ICONS.fwd} size={18} color={c.muted} />
              </div>
              <span style={{ color: c.faint }}>{timecode(total)}</span>
            </div>

            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: L.tlTop,
                height: 1,
                background: c.rule,
              }}
            />
            {Array.from({ length: ticks + 1 }, (_, s) => (
              <div key={s}>
                <div
                  style={{
                    position: "absolute",
                    left: TX + s * PPS,
                    top: L.rulerY + 16,
                    width: 1,
                    height: 8,
                    background: c.tick,
                  }}
                />
                {s % L.tickEvery === 0 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: TX + s * PPS + 5,
                      top: L.rulerY,
                      fontFamily: mono,
                      fontSize: 16,
                      color: c.faint,
                    }}
                  >
                    {s === 0 ? "0" : `${s}s`}
                  </div>
                ) : null}
              </div>
            ))}
            {[
              ["V2", L.v2],
              ["V1", L.v1],
              ["A1", L.a1],
            ].map(([n, tr]) => {
              const t = tr as { y: number; h: number };
              return (
                <div key={n as string}>
                  <div
                    style={{
                      position: "absolute",
                      left: 20,
                      top: t.y + t.h / 2 - 11,
                      fontFamily: mono,
                      fontSize: 16,
                      color: c.muted,
                    }}
                  >
                    {n as string}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: TX,
                      right: 12,
                      top: t.y,
                      height: t.h,
                      borderRadius: 10,
                      background: c.lane,
                    }}
                  />
                </div>
              );
            })}

            {f >= TITLE_AT ? (
              <div
                style={{
                  position: "absolute",
                  left: TX + TITLE_SPAN.start * PPS,
                  top: L.v2.y + 3 - (1 - titleIn) * 30,
                  width: TITLE_SPAN.len * PPS,
                  height: L.v2.h - 6,
                  borderRadius: 8,
                  background: c.titleBg,
                  boxShadow: `inset 0 0 0 1px ${titleFlash > 0.05 ? withAlpha(accent, 0.5 + titleFlash * 0.5) : c.titleRing}`,
                  opacity: clamp01(titleIn * 3),
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 10px",
                  fontSize: 16,
                  color: c.titleText,
                  boxSizing: "border-box",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                <Icon d={ICONS.type} size={16} color={c.titleText} />
                {title}
              </div>
            ) : null}
            {f >= AUDIO_AT ? (
              <div
                style={{
                  position: "absolute",
                  left: TX,
                  top: L.a1.y + 3 + (1 - audioIn) * 30,
                  width: total * PPS,
                  height: L.a1.h - 6,
                  borderRadius: 8,
                  background: c.audioBg,
                  boxShadow: `inset 0 0 0 1px ${c.audioRing}`,
                  opacity: clamp01(audioIn * 3),
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 10,
                    top: 24,
                    clipPath: `inset(0 ${(1 - wave) * 100}% 0 0)`,
                    opacity: 0.85,
                  }}
                >
                  <Waveform
                    w={total * PPS - 20}
                    h={L.a1.h - 32}
                    color={c.wave}
                    seed={7}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 10,
                    top: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 16,
                    color: c.audioText,
                  }}
                >
                  <Icon d={ICONS.music} size={14} color={c.audioText} />
                  {audioName}
                </div>
              </div>
            ) : null}
            {flashes.map((fl, i) =>
              fl.v > 0.01 ? (
                <div
                  key={`${fl.x}-${i}`}
                  style={{
                    position: "absolute",
                    left: fl.x - 0.75,
                    top: L.rulerY + 20,
                    width: 1.5,
                    height: tlEnd - L.rulerY - 20,
                    background: accent,
                    opacity: fl.v,
                  }}
                />
              ) : null,
            )}
            {rects.map((r, i) =>
              r ? (
                <div
                  key={list[i].name}
                  style={{
                    position: "absolute",
                    left: r.x,
                    top: r.y,
                    zIndex: r.flying ? 30 : 5,
                    filter: r.flying
                      ? "drop-shadow(0 18px 30px rgba(0,0,0,0.45))"
                      : undefined,
                    transform: r.flying ? "rotate(-1.5deg)" : undefined,
                  }}
                >
                  <ClipBlock
                    clip={list[i]}
                    w={r.w}
                    h={r.h}
                    accent={accent}
                    selected={!r.flying && i === shown && f >= SCRUB_AT}
                    glow={flashes[i].v}
                  />
                </div>
              ) : null,
            )}
            {f >= SCRUB_AT - 6 ? (
              <div
                style={{
                  position: "absolute",
                  left: headX - 0.75,
                  top: L.rulerY + 4,
                  width: 1.5,
                  height: tlEnd - L.rulerY,
                  background: accent,
                  zIndex: 20,
                  opacity: interpolate(f, [SCRUB_AT - 6, SCRUB_AT], [0, 1], {
                    ...clamp,
                    easing: ENTER,
                  }),
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: -6,
                    top: -2,
                    width: 13,
                    height: 16,
                    borderRadius: 4,
                    background: accent,
                  }}
                />
              </div>
            ) : null}

            {f >= CLICK_AT ? (
              <div
                style={{
                  position: "absolute",
                  left: L.pop.x,
                  top: L.pop.y,
                  width: L.pop.w,
                  borderRadius: 16,
                  background: c.popBg,
                  boxShadow: c.pop,
                  padding: 18,
                  boxSizing: "border-box",
                  zIndex: 35,
                  opacity: clamp01(pop * 1.4),
                  transform: `translateY(${(1 - pop) * -10}px) scale(${0.95 + pop * 0.05})`,
                  transformOrigin: "80% 0",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ position: "relative", width: 56, height: 56 }}>
                    <svg width={56} height={56} viewBox="0 0 56 56" aria-hidden>
                      <circle
                        cx={28}
                        cy={28}
                        r={25}
                        stroke={c.rule}
                        strokeWidth={2.5}
                        fill="none"
                      />
                      <circle
                        cx={28}
                        cy={28}
                        r={25}
                        stroke={interpolateColors(
                          doneT,
                          [0, 1],
                          [accent, GREEN],
                        )}
                        strokeWidth={2.5}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 25}
                        strokeDashoffset={2 * Math.PI * 25 * (1 - prog)}
                        transform="rotate(-90 28 28)"
                      />
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: mono,
                        fontSize: 16,
                        opacity: 1 - doneT,
                      }}
                    >
                      {Math.round(prog * 100)}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: doneT,
                        transform: `scale(${0.6 + done * 0.4})`,
                      }}
                    >
                      <Icon d={ICONS.check} size={22} color={GREEN} sw={2} />
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 18 }}>
                      {doneT > 0.5 ? "Export complete" : "Exporting"}
                    </div>
                    <div
                      style={{
                        marginTop: 3,
                        fontFamily: mono,
                        fontSize: 16,
                        color: c.muted,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fileName}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 14,
                    boxShadow: `inset 0 1px 0 ${c.rule}`,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8,
                  }}
                >
                  {[
                    ["Size", doneT > 0.5 ? "24.6 MB" : "—"],
                    ["Res", "1080p"],
                    [
                      doneT > 0.5 ? "Time" : "Left",
                      doneT > 0.5
                        ? "8.4 s"
                        : `${Math.max(1, Math.ceil((1 - prog) * 9))} s`,
                    ],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 16, color: c.faint }}>{k}</div>
                      <div
                        style={{
                          marginTop: 2,
                          fontFamily: mono,
                          fontSize: 16,
                        }}
                      >
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          {f >= 4 ? (
            <Cursor x={L.win.x + cur.x} y={L.win.y + cur.y} press={press} />
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
}
