"use client";

import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadOnest } from "@remotion/google-fonts/Onest";
import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const onest = loadOnest("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
loadManrope("normal", { weights: ["600"], subsets: ["latin"] });

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const SWAY = Easing.bezier(0.45, 0, 0.55, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const B = {
  bar: -6,
  cursor: -4,
  press: 14,
  flip: 16,
  eject: [19, 24, 28, 32, 35, 38],
  rise: 22,
  riseEnd: 76,
  snap: 68,
  chrome: 72,
  avatars: 80,
  data: 86,
  live: 100,
  end: 144,
};

export const SEND_FOUNTAIN_DURATION = B.end;

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

type CardId = "chart" | "hero" | "stat" | "icon" | "sketch" | "cover";
const ORDER: CardId[] = ["chart", "hero", "stat", "icon", "sketch", "cover"];

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Cloud {
  x: number;
  y: number;
  s: number;
  r: number;
}

interface Layout {
  stageW: number;
  stageH: number;
  u: number;
  bar: { cx: number; cy: number; w: number; h: number; btn: number };
  rise: number;
  win: Box;
  top: number;
  slots: Record<CardId, Box>;
  cloud: Record<CardId, Cloud>;
}

const LANDSCAPE: Layout = {
  stageW: 1280,
  stageH: 720,
  u: 1,
  bar: { cx: 640, cy: 390, w: 780, h: 92, btn: 62 },
  rise: 520,
  win: { x: 140, y: 76, w: 1000, h: 584 },
  top: 48,
  slots: {
    hero: { x: 14, y: 62, w: 470, h: 300 },
    stat: { x: 14, y: 376, w: 470, h: 194 },
    chart: { x: 498, y: 62, w: 488, h: 236 },
    icon: { x: 498, y: 312, w: 154, h: 258 },
    sketch: { x: 665, y: 312, w: 154, h: 258 },
    cover: { x: 832, y: 312, w: 154, h: 258 },
  },
  cloud: {
    chart: { x: 500, y: 200, s: 0.72, r: -5 },
    hero: { x: 820, y: 210, s: 0.62, r: 4 },
    stat: { x: 610, y: 370, s: 0.66, r: 3 },
    icon: { x: 905, y: 420, s: 0.88, r: -7 },
    sketch: { x: 360, y: 440, s: 0.85, r: 6 },
    cover: { x: 735, y: 545, s: 0.82, r: -3 },
  },
};

const PORTRAIT: Layout = {
  stageW: 1080,
  stageH: 1920,
  u: 1.7,
  bar: { cx: 540, cy: 1080, w: 940, h: 132, btn: 92 },
  rise: 1000,
  win: { x: 70, y: 250, w: 940, h: 1420 },
  top: 82,
  slots: {
    hero: { x: 20, y: 100, w: 900, h: 500 },
    chart: { x: 20, y: 620, w: 900, h: 340 },
    stat: { x: 20, y: 980, w: 440, h: 420 },
    icon: { x: 480, y: 980, w: 210, h: 236 },
    sketch: { x: 710, y: 980, w: 210, h: 236 },
    cover: { x: 480, y: 1236, w: 440, h: 164 },
  },
  cloud: {
    chart: { x: 390, y: 330, s: 0.74, r: -5 },
    hero: { x: 720, y: 600, s: 0.56, r: 4 },
    stat: { x: 330, y: 820, s: 0.72, r: 3 },
    icon: { x: 820, y: 960, s: 0.95, r: -7 },
    sketch: { x: 250, y: 1200, s: 0.95, r: 6 },
    cover: { x: 640, y: 1330, s: 0.8, r: -3 },
  },
};

interface Tokens {
  dark: boolean;
  ink: string;
  soft: string;
  muted: string;
  hair: string;
  win: string;
  card: string;
  bar: string;
  btn: string;
  arrow: string;
  shadow: string;
  far: string;
}

const tokens = (dark: boolean): Tokens =>
  dark
    ? {
        dark,
        ink: "#eef4f3",
        soft: "rgba(232,242,240,0.7)",
        muted: "rgba(232,242,240,0.46)",
        hair: "rgba(255,255,255,0.09)",
        win: "linear-gradient(180deg, rgba(22,29,30,0.94) 0%, rgba(11,15,16,0.96) 100%)",
        card: "linear-gradient(180deg, #1b2324 0%, #121819 100%)",
        bar: "linear-gradient(180deg, rgba(28,36,37,0.9) 0%, rgba(15,20,21,0.94) 100%)",
        btn: "#f2f5f4",
        arrow: "#0b0f10",
        shadow: "2,10,12",
        far: "rgba(2,8,9,0.55)",
      }
    : {
        dark,
        ink: "#121716",
        soft: "rgba(18,23,22,0.68)",
        muted: "rgba(18,23,22,0.46)",
        hair: "rgba(18,30,28,0.1)",
        win: "linear-gradient(180deg, #fbfcfb 0%, #f4f6f5 100%)",
        card: "linear-gradient(180deg, #ffffff 0%, #f9faf9 100%)",
        bar: "linear-gradient(180deg, #ffffff 0%, #f8faf9 100%)",
        btn: "#121616",
        arrow: "#ffffff",
        shadow: "30,60,56",
        far: "rgba(30,60,56,0.18)",
      };

const surfaceShadow = (t: Tokens, lift: number) =>
  t.dark
    ? `inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 4px rgba(0,0,0,0.3), 0 ${12 + 22 * lift}px ${30 + 40 * lift}px rgba(${t.shadow},0.45), 0 ${40 + 50 * lift}px ${90 + 60 * lift}px rgba(${t.shadow},0.5)`
    : `inset 0 1px 0 #fff, 0 1px 2px rgba(${t.shadow},0.08), 0 ${12 + 20 * lift}px ${28 + 36 * lift}px rgba(${t.shadow},0.12), 0 ${36 + 44 * lift}px ${80 + 60 * lift}px rgba(${t.shadow},0.14)`;

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

function CardShell({
  w,
  h,
  t,
  u,
  bg,
  children,
}: {
  w: number;
  h: number;
  t: Tokens;
  u: number;
  bg?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        borderRadius: 14 * u,
        background: bg ?? t.card,
        border: `1px solid ${t.hair}`,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function ChartCard({
  w,
  h,
  t,
  u,
  accent,
  grow,
}: {
  w: number;
  h: number;
  t: Tokens;
  u: number;
  accent: string;
  grow: number;
}) {
  const bars = Array.from({ length: 16 }, (_, i) => {
    const a = 0.28 + 0.55 * random(`sf-bar-a-${i}`) + i * 0.012;
    const b = Math.min(0.96, a + 0.06 + 0.16 * random(`sf-bar-b-${i}`));
    return { id: `bar-${i}`, v: mix(a, b, grow), last: i === 15 };
  });
  const pad = 18 * u;
  return (
    <CardShell
      w={w}
      h={h}
      t={t}
      u={u}
      bg="linear-gradient(180deg, #171c22 0%, #0f1318 100%)"
    >
      <div
        style={{
          position: "absolute",
          inset: pad,
          display: "flex",
          flexDirection: "column",
          gap: 10 * u,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 19 * u, color: "#eef1f6" }}>Signups</div>
          <div
            style={{
              fontFamily: mono.fontFamily,
              fontSize: 16 * u,
              color: "rgba(238,241,246,0.5)",
            }}
          >
            last 16 days
          </div>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-end",
            gap: 6 * u,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            paddingBottom: 2,
          }}
        >
          {bars.map((b) => (
            <div
              key={b.id}
              style={{
                flex: 1,
                height: `${b.v * 100}%`,
                borderRadius: `${3 * u}px ${3 * u}px 1px 1px`,
                background: b.last
                  ? accent
                  : "linear-gradient(180deg, #a3adff 0%, #6c78f0 100%)",
                opacity: b.last ? 1 : 0.92,
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8 * u,
            fontSize: 16 * u,
            color: "rgba(238,241,246,0.6)",
          }}
        >
          <div
            style={{
              width: 8 * u,
              height: 8 * u,
              borderRadius: 99,
              background: "#8f9bff",
            }}
          />
          New accounts
          <div
            style={{
              width: 8 * u,
              height: 8 * u,
              borderRadius: 99,
              background: accent,
              marginLeft: 10 * u,
            }}
          />
          Today
        </div>
      </div>
    </CardShell>
  );
}

function HeroCard({
  w,
  h,
  t,
  u,
  src,
  title,
  progress,
}: {
  w: number;
  h: number;
  t: Tokens;
  u: number;
  src: string;
  title: string;
  progress: number;
}) {
  const pad = 18 * u;
  return (
    <CardShell w={w} h={h} t={t} u={u}>
      <Img
        src={src}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.62) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: pad,
          right: pad,
          bottom: pad,
          display: "flex",
          alignItems: "center",
          gap: 14 * u,
          color: "#fff",
        }}
      >
        <div
          style={{
            width: 42 * u,
            height: 42 * u,
            borderRadius: 99,
            background: "rgba(255,255,255,0.2)",
            border: "1px solid rgba(255,255,255,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" width={18 * u} height={18 * u} aria-hidden>
            <path d="M8 5.5v13l10.5-6.5z" fill="#fff" />
          </svg>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 19 * u,
            }}
          >
            <span>{title}</span>
            <span
              style={{
                fontFamily: mono.fontFamily,
                fontSize: 16 * u,
                opacity: 0.75,
              }}
            >
              0:42
            </span>
          </div>
          <div
            style={{
              marginTop: 9 * u,
              height: 3 * u,
              borderRadius: 9,
              background: "rgba(255,255,255,0.28)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: "100%",
                background: "#fff",
              }}
            />
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function StatCard({
  w,
  h,
  t,
  u,
  accent,
  value,
  label,
  delta,
}: {
  w: number;
  h: number;
  t: Tokens;
  u: number;
  accent: string;
  value: string;
  label: string;
  delta: string;
}) {
  const pad = 20 * u;
  const pts = Array.from({ length: 12 }, (_, i) => {
    const y = 0.75 - i * 0.045 - 0.18 * random(`sf-spark-${i}`);
    return `${(i / 11) * 100},${Math.max(0.05, y) * 40}`;
  }).join(" ");
  const tall = h > w * 0.7;
  const big = tall ? w * 0.2 : Math.min(h * 0.36, w * 0.17);
  const spark = (sw: number, sh: number) => (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      width={sw}
      height={sh}
      style={{ overflow: "visible", display: "block" }}
      aria-hidden
    >
      <polygon
        points={`0,40 ${pts} 100,40`}
        fill={`color-mix(in oklab, ${accent} ${tall ? 16 : 0}%, transparent)`}
      />
      <polyline
        points={pts}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
  return (
    <CardShell w={w} h={h} t={t} u={u}>
      <div
        style={{
          position: "absolute",
          inset: pad,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 16 * u,
              color: t.soft,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 16 * u,
              color: accent,
              padding: `${3 * u}px ${10 * u}px`,
              borderRadius: 99,
              background: `color-mix(in oklab, ${accent} 14%, transparent)`,
            }}
          >
            {delta}
          </div>
        </div>
        {tall ? spark(w - pad * 2, h * 0.34) : null}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16 * u,
          }}
        >
          <div
            style={{
              fontSize: big,
              fontWeight: 300,
              letterSpacing: "-0.04em",
              lineHeight: 0.9,
              color: t.ink,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {value}
          </div>
          {tall ? null : spark(Math.min(w * 0.32, 180 * u), big * 0.6)}
        </div>
      </div>
    </CardShell>
  );
}

function IconCard({
  w,
  h,
  t,
  u,
  accent,
}: {
  w: number;
  h: number;
  t: Tokens;
  u: number;
  accent: string;
}) {
  const tile = Math.min(w * 0.5, h * 0.4);
  return (
    <CardShell w={w} h={h} t={t} u={u}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14 * u,
        }}
      >
        <div
          style={{
            width: tile,
            height: tile,
            borderRadius: tile * 0.26,
            background: `linear-gradient(160deg, color-mix(in oklab, ${accent} 70%, white) 0%, ${accent} 55%, color-mix(in oklab, ${accent} 70%, black) 100%)`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 24px color-mix(in oklab, ${accent} 40%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RemocnR height={tile * 0.48} color="#fff" />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 17 * u, color: t.ink }}>App icon</div>
          <div
            style={{
              fontFamily: mono.fontFamily,
              fontSize: 16 * u,
              color: t.muted,
              marginTop: 3 * u,
            }}
          >
            1024 px
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function SketchCard({
  w,
  h,
  t,
  u,
}: {
  w: number;
  h: number;
  t: Tokens;
  u: number;
}) {
  const j = (k: string, a = 3) => (random(`sf-sk-${k}`) - 0.5) * a;
  const line = (x1: number, y1: number, x2: number, y2: number, k: string) =>
    `M ${x1 + j(`${k}a`)} ${y1 + j(`${k}b`)} Q ${(x1 + x2) / 2 + j(`${k}c`, 5)} ${(y1 + y2) / 2 + j(`${k}d`, 5)} ${x2 + j(`${k}e`)} ${y2 + j(`${k}f`)}`;
  const paths = [
    line(12, 12, 88, 13, "t"),
    line(88, 13, 87, 88, "r"),
    line(87, 88, 13, 87, "b"),
    line(13, 87, 12, 12, "l"),
    line(12, 24, 88, 25, "h"),
    line(20, 34, 80, 34, "i1"),
    line(80, 34, 80, 58, "i2"),
    line(80, 58, 20, 58, "i3"),
    line(20, 58, 20, 34, "i4"),
    line(20, 34, 80, 58, "x1"),
    line(80, 34, 20, 58, "x2"),
    line(20, 67, 70, 67, "c1"),
    line(20, 75, 56, 75, "c2"),
  ];
  return (
    <CardShell
      w={w}
      h={h}
      t={t}
      u={u}
      bg="linear-gradient(180deg, #ecebe6 0%, #e2e0da 100%)"
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: "10%",
          top: "8%",
          width: "80%",
          height: "66%",
        }}
        aria-hidden
      >
        {paths.map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke="#3b3a36"
            strokeWidth={1.6}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />
        ))}
        <circle
          cx={30}
          cy={18.5}
          r={2.2}
          fill="none"
          stroke="#3b3a36"
          strokeWidth={1.4}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 14 * u,
          right: 14 * u,
          bottom: 14 * u,
          fontSize: 17 * u,
          color: "#2b2a27",
        }}
      >
        Wireframe
      </div>
    </CardShell>
  );
}

function CoverCard({
  w,
  h,
  t,
  u,
  src,
}: {
  w: number;
  h: number;
  t: Tokens;
  u: number;
  src: string;
}) {
  return (
    <CardShell w={w} h={h} t={t} u={u}>
      <Img
        src={src}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "72% 50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 14 * u,
          bottom: 14 * u,
          fontSize: 17 * u,
          color: "#fff",
        }}
      >
        Cover
      </div>
    </CardShell>
  );
}

function Cursor({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{
        display: "block",
        filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.35))",
      }}
      aria-hidden
    >
      <path
        d="M5 3.2v15.6l4.3-4.1 2.7 6.1 2.6-1.1-2.7-6h6z"
        fill="#0d0f10"
        stroke="#fff"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

const AVATARS = [
  { id: "m", initial: "M", color: "#f3b04d", card: 0 },
  { id: "j", initial: "J", color: "#56cdb4", card: 1 },
  { id: "k", initial: "K", color: "#a493ff", card: 2 },
];

export interface SendFountainProps {
  theme?: "dark" | "light";
  accent?: string;
  prompt?: string;
  appTitle?: string;
  heroTitle?: string;
  stat?: number;
  statLabel?: string;
  statDelta?: string;
  images?: string[];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  background: "#eef4f1",
  colors: ["#ffffff", "#e2f3ec", "#bfe7dc", "#7fcabd"],
  blur: 0.7,
  warp: 0.5,
  grain: 0.2,
  seed: 31,
};

export function SendFountain({
  theme = "dark",
  accent = "#ff5a1f",
  prompt = "Build a launch dashboard for the v2 release",
  appTitle = "Launch board",
  heroTitle = "Launch film",
  stat = 47200,
  statLabel = "Weekly active",
  statDelta = "+18%",
  images = [
    staticFile("templates/launch-anything/horizon.jpg"),
    staticFile("templates/product-showcase/sculpture.jpg"),
  ],
  ground,
  groundParams,
}: SendFountainProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const t = tokens(dark);
  const portrait = height > width * 1.2;
  const L = portrait ? PORTRAIT : LANDSCAPE;
  const { u } = L;
  const sc = width / L.stageW;

  const camT = ramp(frame, B.rise, B.riseEnd - B.rise, MOVE);
  const camY = camT * L.rise;
  const push = 1 + 0.03 * ramp(frame, B.snap, B.end - B.snap, SWAY);
  const open = ramp(frame, -4, 40, MOVE);
  const zoom = mix(1.22, 1, open);

  const barIn = spring({ frame: frame - B.bar, fps, config: HEAVY });
  const barY = L.bar.cy + camY + mix(60 * u, 0, barIn);
  const btnX = L.bar.cx + L.bar.w / 2 - L.bar.h / 2 + 0;
  const btnY = barY;

  const curIn = spring({
    frame: frame - B.cursor,
    fps,
    config: HEAVY,
    durationInFrames: 20,
  });
  const press = ramp(frame, B.press, 3) * (1 - ramp(frame, B.press + 3, 6));
  const flip = ramp(frame, B.flip, 4);
  const flash = ramp(frame, B.flip, 3) * (1 - ramp(frame, B.flip + 4, 14));
  const release = spring({ frame: frame - B.press - 4, fps, config: CHIP });
  const btnScale = 1 - 0.12 * press + 0.06 * Math.sin(Math.PI * release) * flip;
  const curX = mix(btnX + 190 * u, btnX + 8 * u, curIn);
  const curY = mix(btnY + 150 * u, btnY + 10 * u, curIn) + 3 * u * press;
  const caretOn = Math.floor(frame / 9) % 2 === 0 && frame < B.press;

  const winX = L.win.x;
  const winY = L.win.y;
  const chromeIn = ramp(frame, B.chrome, 16);
  const liveIn = spring({ frame: frame - B.live, fps, config: CHIP });
  const dataT = ramp(frame, B.data, 30, MOVE);
  const statValue = Math.round(mix(stat, stat + 312, dataT));
  const heroProg = 0.18 + 0.2 * ramp(frame, B.snap, B.end - B.snap, SWAY);

  const cardPos = (id: CardId, i: number, f: number) => {
    const e = B.eject[i];
    const c = L.cloud[id];
    const slot = L.slots[id];
    const sx = btnX;
    const sy = L.bar.cy + ramp(e, B.rise, B.riseEnd - B.rise, MOVE) * L.rise;
    const p = spring({ frame: f - e, fps, config: CARD });
    const ps = spring({ frame: f - e, fps, config: CHIP });
    const cx = sx + (c.x - sx) * 0.2;
    const cy = Math.min(sy, c.y) - 170 * u;
    const bz = (a: number, m: number, b: number, k: number) =>
      (1 - k) * (1 - k) * a + 2 * (1 - k) * k * m + k * k * b;
    const drift = 22 * u * ramp(f, e + 8, B.snap - e, SWAY);
    let x = bz(sx, cx, c.x, p);
    let y = bz(sy, cy, c.y, p) - drift;
    let s = mix(0.16, c.s, ps);
    let r = mix(i % 2 === 0 ? -22 : 22, c.r, p);
    const q = spring({ frame: f - B.snap - i * 2, fps, config: CARD });
    const tx = winX + slot.x + slot.w / 2;
    const ty = winY + slot.y + slot.h / 2;
    x = mix(x, tx, q);
    y = mix(y, ty, q);
    s = mix(s, 1, q);
    r = mix(r, 0, q);
    return { x, y, s, r, q, on: f >= e };
  };

  const resolvedGround: GshPresetId | undefined =
    ground ?? (dark ? "riptide" : undefined);
  const resolvedParams = groundParams ?? (dark ? undefined : LIGHT_GROUND);

  const renderCard = (id: CardId, w: number, h: number) => {
    switch (id) {
      case "chart":
        return (
          <ChartCard w={w} h={h} t={t} u={u} accent={accent} grow={dataT} />
        );
      case "hero":
        return (
          <HeroCard
            w={w}
            h={h}
            t={t}
            u={u}
            src={images[0]}
            title={heroTitle}
            progress={heroProg}
          />
        );
      case "stat":
        return (
          <StatCard
            w={w}
            h={h}
            t={t}
            u={u}
            accent={accent}
            value={statValue.toLocaleString("en-US")}
            label={statLabel}
            delta={statDelta}
          />
        );
      case "icon":
        return <IconCard w={w} h={h} t={t} u={u} accent={accent} />;
      case "sketch":
        return <SketchCard w={w} h={h} t={t} u={u} />;
      default:
        return (
          <CoverCard w={w} h={h} t={t} u={u} src={images[1] ?? images[0]} />
        );
    }
  };

  const topH = L.top;
  const avSize = 30 * u;
  const avRight = winX + L.win.w - (16 + 84 + 14 + 66 + 16) * u - avSize / 2;
  const avSlotX = (k: number) => avRight - (2 - k) * avSize * 0.72;
  const avSlotY = winY + topH / 2;

  return (
    <AbsoluteFill style={{ fontFamily: onest.fontFamily, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translateY(${camT * 0.08 * height}px) scale(1.24)`,
        }}
      >
        <GshGround
          preset={resolvedGround}
          params={resolvedParams}
          timeOffset={3}
          timeScale={0.6}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: dark
            ? `linear-gradient(180deg, rgba(2,8,9,${0.15 + 0.35 * camT}) 0%, rgba(2,8,9,0) 60%)`
            : `linear-gradient(180deg, rgba(255,255,255,${0.1 + 0.25 * camT}) 0%, rgba(255,255,255,0) 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: L.stageW,
          height: L.stageH,
          transform: `scale(${sc})`,
          transformOrigin: "0 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${zoom})`,
            transformOrigin: `${L.bar.cx + L.bar.w * 0.2}px ${L.bar.cy}px`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scale(${push})`,
              transformOrigin: `${L.stageW / 2}px ${winY + L.win.h / 2}px`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: winX,
                top: winY,
                width: L.win.w,
                height: L.win.h,
                borderRadius: 20 * u,
                background: t.win,
                border: `1px solid ${t.hair}`,
                boxShadow: surfaceShadow(t, 1),
                opacity: chromeIn,
                transform: `scale(${mix(1.04, 1, chromeIn)})`,
                filter: chromeIn < 1 ? `blur(${(1 - chromeIn) * 8}px)` : "",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: topH,
                  borderBottom: `1px solid ${t.hair}`,
                  display: "flex",
                  alignItems: "center",
                  padding: `0 ${16 * u}px`,
                  gap: 14 * u,
                }}
              >
                <div style={{ display: "flex", gap: 7 * u }}>
                  {["a", "b", "c"].map((k) => (
                    <div
                      key={k}
                      style={{
                        width: 11 * u,
                        height: 11 * u,
                        borderRadius: 99,
                        border: `1px solid ${t.hair}`,
                        background: dark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(18,23,22,0.08)",
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10 * u,
                    marginLeft: 6 * u,
                  }}
                >
                  <div
                    style={{
                      width: 24 * u,
                      height: 24 * u,
                      borderRadius: 7 * u,
                      background: accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <RemocnR height={12 * u} color="#fff" />
                  </div>
                  <span style={{ fontSize: 17 * u, color: t.ink }}>
                    {appTitle}
                  </span>
                  {portrait ? null : (
                    <span
                      style={{
                        fontFamily: mono.fontFamily,
                        fontSize: 16 * u,
                        color: t.muted,
                      }}
                    >
                      / v2
                    </span>
                  )}
                </div>
                {!portrait ? (
                  <div
                    style={{
                      marginLeft: "auto",
                      marginRight: "auto",
                      display: "flex",
                      padding: 3,
                      borderRadius: 9,
                      border: `1px solid ${t.hair}`,
                      fontSize: 16,
                      color: t.muted,
                    }}
                  >
                    <div style={{ padding: "3px 12px" }}>Preview</div>
                    <div
                      style={{
                        padding: "3px 12px",
                        borderRadius: 6,
                        color: t.ink,
                        background: dark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(18,23,22,0.06)",
                      }}
                    >
                      Board
                    </div>
                  </div>
                ) : (
                  <div style={{ marginLeft: "auto" }} />
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6 * u,
                    fontSize: 16 * u,
                    color: dark ? "#7af0c6" : "#118a63",
                    padding: `${3 * u}px ${10 * u}px`,
                    borderRadius: 99,
                    background: dark
                      ? "rgba(122,240,198,0.12)"
                      : "rgba(17,138,99,0.1)",
                    transform: `scale(${liveIn})`,
                    opacity: Math.min(1, liveIn * 2),
                  }}
                >
                  <div
                    style={{
                      width: 7 * u,
                      height: 7 * u,
                      borderRadius: 99,
                      background: "currentColor",
                    }}
                  />
                  Live
                </div>
                <div
                  style={{
                    fontSize: 16 * u,
                    color: "#fff",
                    background: accent,
                    padding: `${5 * u}px ${14 * u}px`,
                    borderRadius: 8 * u,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                  }}
                >
                  Publish
                </div>
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: L.bar.cx - L.bar.w / 2,
                top: barY - L.bar.h / 2,
                width: L.bar.w,
                height: L.bar.h,
                borderRadius: L.bar.h / 2,
                background: t.bar,
                border: `1px solid ${t.hair}`,
                boxShadow: surfaceShadow(t, 0.4),
                display: "flex",
                alignItems: "center",
                padding: `0 ${(L.bar.h - L.bar.btn) / 2}px 0 ${24 * u}px`,
                gap: 16 * u,
                opacity: barIn,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width={22 * u}
                height={22 * u}
                aria-hidden
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M12 5v14M5 12h14"
                  stroke={t.muted}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              </svg>
              <div
                style={{
                  flex: 1,
                  fontSize: 23 * u,
                  color: t.ink,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {prompt}
                <span
                  style={{
                    display: "inline-block",
                    width: 2 * u,
                    height: 24 * u,
                    marginLeft: 3 * u,
                    background: accent,
                    opacity: caretOn ? 1 : 0,
                  }}
                />
              </div>
              <div
                style={{
                  width: L.bar.btn,
                  height: L.bar.btn,
                  flexShrink: 0,
                  borderRadius: L.bar.btn * 0.3,
                  background: flip > 0 ? accent : t.btn,
                  transform: `scale(${btnScale})`,
                  boxShadow: `0 0 0 ${flash * 18 * u}px color-mix(in oklab, ${accent} ${Math.round(flash * 30)}%, transparent), 0 ${8 * u}px ${20 * u}px color-mix(in oklab, ${flip > 0 ? accent : "#000"} ${30 + 20 * flip}%, transparent)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width={L.bar.btn * 0.46}
                  height={L.bar.btn * 0.46}
                  aria-hidden
                >
                  <path
                    d="M12 19V5M6 11l6-6 6 6"
                    fill="none"
                    stroke={flip > 0 ? "#fff" : t.arrow}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <svg
              width={0}
              height={0}
              style={{ position: "absolute" }}
              aria-hidden
            >
              <defs>
                {ORDER.map((id, i) => {
                  const a = cardPos(id, i, frame);
                  const b = cardPos(id, i, frame - 1);
                  const vx = Math.abs(a.x - b.x);
                  const vy = Math.abs(a.y - b.y);
                  return (
                    <filter
                      key={id}
                      id={`sf-mb-${id}`}
                      x="-20%"
                      y="-30%"
                      width="140%"
                      height="160%"
                    >
                      <feGaussianBlur
                        stdDeviation={`${Math.min(10, vx * 0.08)} ${Math.min(14, vy * 0.08)}`}
                      />
                    </filter>
                  );
                })}
              </defs>
            </svg>

            {ORDER.map((id, i) => {
              const pos = cardPos(id, i, frame);
              if (!pos.on) return <div key={id} />;
              const prev = cardPos(id, i, frame - 1);
              const speed = Math.hypot(pos.x - prev.x, pos.y - prev.y);
              const slot = L.slots[id];
              const lift = 1 - pos.q;
              return (
                <div
                  key={id}
                  style={{
                    position: "absolute",
                    left: pos.x - slot.w / 2,
                    top: pos.y - slot.h / 2,
                    width: slot.w,
                    height: slot.h,
                    transform: `rotate(${pos.r}deg) scale(${pos.s})`,
                    borderRadius: 14 * u,
                    boxShadow:
                      lift > 0.02
                        ? `0 ${20 * lift * u}px ${44 * lift * u}px ${t.far}`
                        : "none",
                    filter: speed > 6 ? `url(#sf-mb-${id})` : undefined,
                  }}
                >
                  {renderCard(id, slot.w, slot.h)}
                </div>
              );
            })}

            {AVATARS.map((a, k) => {
              const id = ORDER[a.card];
              const pos = cardPos(id, a.card, frame);
              const slot = L.slots[id];
              const pop = spring({
                frame: frame - B.eject[a.card] - 5,
                fps,
                config: CHIP,
              });
              const go = spring({
                frame: frame - B.avatars - k * 3,
                fps,
                config: CARD,
              });
              const ox = (slot.w / 2) * pos.s - 6 * u;
              const oy = (-slot.h / 2) * pos.s + 6 * u;
              const rad = (pos.r * Math.PI) / 180;
              const rx = ox * Math.cos(rad) - oy * Math.sin(rad);
              const ry = ox * Math.sin(rad) + oy * Math.cos(rad);
              const x = mix(pos.x + rx, avSlotX(k), go);
              const y = mix(pos.y + ry, avSlotY, go);
              return (
                <div
                  key={a.id}
                  style={{
                    position: "absolute",
                    left: x - avSize / 2,
                    top: y - avSize / 2,
                    width: avSize,
                    height: avSize,
                    borderRadius: 99,
                    background: a.color,
                    border: `${2 * u}px solid ${dark ? "#121819" : "#ffffff"}`,
                    color: "#14110c",
                    fontSize: 14 * u,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${pos.on ? pop : 0})`,
                    zIndex: 5 - k,
                  }}
                >
                  {a.initial}
                </div>
              );
            })}

            <div
              style={{
                position: "absolute",
                left: curX,
                top: curY,
                transform: `scale(${1 - 0.1 * press})`,
                transformOrigin: "4px 3px",
                opacity: ramp(frame, B.cursor, 6),
              }}
            >
              <Cursor size={30 * u} />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default SendFountain;
