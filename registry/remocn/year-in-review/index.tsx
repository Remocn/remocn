"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
import type React from "react";
import { AbsoluteFill, Easing, interpolate, spring } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_CHAPTERS,
  type YearInReviewElementId,
  yearInReviewTimeline,
} from "./timeline";

const { fontFamily: hanken } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: display } = loadDisplay("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface CrewMember {
  name: string;
  color: string;
}

export interface YearInReviewStats {
  year: string;
  product: string;
  videos: number;
  topComponent: string;
  runnersUp: string[];
  percentile: number;
  minutes: string;
  crew: CrewMember[];
  url: string;
}

export interface YearInReviewProps {
  stats?: Partial<YearInReviewStats>;
  accent?: string;
  speed?: number;
  device?: "phone" | "card";
  chapters?: string[];
  /** Chapter list beside the device; false leaves the device alone. */
  rail?: boolean;
  /** Color of the chapter titles and progress; overrides the default cream. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the body copy. Load it yourself; Hanken Grotesk by default. */
  fontFamily?: string;
  /** Size of the device and chapter list, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  /**
   * Moves, trims or stretches the device's rise, the rail, each chapter in
   * the list and each slide, by the ids in `./timeline`. Frames on the scene
   * timeline, after `delay` and `speed`.
   */
  timing?: Timing<YearInReviewElementId>;
}

const DEFAULT_STATS: YearInReviewStats = {
  year: "2026",
  product: "remocn",
  videos: 42,
  topComponent: "Kinetic captions",
  runnersUp: ["Zoom blur", "Bento build", "Logo wall"],
  percentile: 3,
  minutes: "1,284",
  crew: [
    { name: "Maya Chen", color: "#F2994A" },
    { name: "Leo Park", color: "#5B8DEF" },
    { name: "Priya Raman", color: "#E05A7A" },
    { name: "Sam Okafor", color: "#2BB3A3" },
    { name: "Noor Haddad", color: "#9B6CF0" },
    { name: "Iris Vale", color: "#D4A72C" },
  ],
  url: "remocn.dev/wrapped",
};

const SW = 393;
const SH = 852;
const BEZEL = 11;
const INK = "#121212";
const CREAM = "#F6F1E7";
const LIME = "#CDF564";
const PINK = "#FF9BDB";
const ORANGE = "#FF6B35";

const CL = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const outCubic = Easing.bezier(0.22, 1, 0.36, 1);
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

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
const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

interface Ctx {
  lf: number;
  fps: number;
  s: YearInReviewStats;
  accent: string;
  top: number;
}

const pop = (c: Ctx, at: number, config: typeof CARD = CARD) =>
  spring({ frame: c.lf - at, fps: c.fps, config });

function Display({
  children,
  size,
  color,
  style,
}: {
  children: React.ReactNode;
  size: number;
  color: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: display,
        fontWeight: 400,
        fontSize: size,
        lineHeight: 0.92,
        letterSpacing: -size * 0.045,
        color,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Rise({
  t,
  children,
  style,
}: {
  t: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ overflow: "hidden", paddingBottom: 6, ...style }}>
      <div style={{ transform: `translateY(${(1 - t) * 110}%)` }}>
        {children}
      </div>
    </div>
  );
}

function starPoints(n: number, r1: number, r2: number, rot: number) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? r2 : r1;
    const a = (i / (n * 2)) * Math.PI * 2 + rot;
    return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`;
  }).join(" ");
}

function Shape({
  kind,
  color,
  size,
}: {
  kind: "circle" | "half" | "square" | "star" | "ring" | "pill";
  color: string;
  size: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: "block", overflow: "visible" }}
    >
      {kind === "circle" ? (
        <circle cx={50} cy={50} r={50} fill={color} />
      ) : null}
      {kind === "half" ? (
        <path d="M0 50 A50 50 0 0 1 100 50 Z" fill={color} />
      ) : null}
      {kind === "square" ? (
        <rect x={6} y={6} width={88} height={88} rx={14} fill={color} />
      ) : null}
      {kind === "star" ? (
        <polygon points={starPoints(8, 50, 30, 0)} fill={color} />
      ) : null}
      {kind === "ring" ? (
        <circle
          cx={50}
          cy={50}
          r={42}
          fill="none"
          stroke={color}
          strokeWidth={14}
        />
      ) : null}
      {kind === "pill" ? (
        <rect x={0} y={30} width={100} height={40} rx={20} fill={color} />
      ) : null}
    </svg>
  );
}

function Portrait({
  color,
  size,
  name,
}: {
  color: string;
  size: number;
  name: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  return (
    <div
      style={{
        width: size,
        height: size,
        background: mix(color, "#1B1B1B", 0.15),
        display: "flex",
        alignItems: "flex-end",
        padding: 8,
        boxSizing: "border-box",
        fontFamily: display,
        fontWeight: 300,
        fontSize: size * 0.42,
        letterSpacing: "-0.04em",
        lineHeight: 0.9,
        color: mix(color, "#FFFFFF", 0.75),
      }}
    >
      {initials}
    </div>
  );
}

const SHAPES = [
  {
    kind: "circle",
    color: LIME,
    x: -30,
    y: 120,
    size: 170,
    from: [-300, -200],
    spin: 0,
  },
  {
    kind: "half",
    color: PINK,
    x: 250,
    y: 150,
    size: 170,
    from: [300, -160],
    spin: 180,
  },
  {
    kind: "square",
    color: ORANGE,
    x: -20,
    y: 600,
    size: 150,
    from: [-260, 300],
    spin: -120,
  },
  {
    kind: "star",
    color: "accent",
    x: 230,
    y: 610,
    size: 200,
    from: [260, 300],
    spin: 200,
  },
  {
    kind: "ring",
    color: CREAM,
    x: 300,
    y: 262,
    size: 64,
    from: [200, 0],
    spin: 0,
  },
  {
    kind: "pill",
    color: LIME,
    x: 124,
    y: 530,
    size: 104,
    from: [-200, 80],
    spin: -90,
  },
] as const;

function Intro(c: Ctx) {
  const t1 = pop(c, 14, CARD);
  const t2 = pop(c, 20, CARD);
  return (
    <>
      {SHAPES.map((sh, i) => {
        const p = pop(c, 2 + i * 3, CHIP);
        const float = Math.sin((c.lf + i * 20) * 0.06) * 6;
        // Layout rounds a box to whole pixels, so a shape flown in and bobbed
        // by `left`/`top` steps; the flight and the bob are a transform.
        return (
          <div
            key={sh.kind + i}
            style={{
              position: "absolute",
              left: sh.x,
              top: sh.y,
              transform: `translate(${sh.from[0] * (1 - p)}px, ${sh.from[1] * (1 - p) + float}px) rotate(${sh.spin * (1 - p) + c.lf * (i % 2 ? 0.4 : -0.3)}deg) scale(${0.4 + 0.6 * p})`,
            }}
          >
            <Shape
              kind={sh.kind}
              color={sh.color === "accent" ? c.accent : sh.color}
              size={sh.size}
            />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 28, right: 28, top: 330 }}>
        <Rise t={t1}>
          <Display size={136} color={CREAM}>
            {c.s.year}
          </Display>
        </Rise>
        <Rise t={t2}>
          <Display size={62} color={CREAM} style={{ marginTop: 4 }}>
            in {c.s.product}
          </Display>
        </Rise>
      </div>
      <div
        style={{
          position: "absolute",
          left: 28,
          bottom: 44,
          fontSize: 17,
          fontWeight: 400,
          color: CREAM,
          opacity: interpolate(c.lf, [34, 44], [0, 1], CL),
        }}
      >
        Let’s see what you shipped →
      </div>
    </>
  );
}

function Shipped(c: Ctx) {
  const slam = interpolate(c.lf, [4, 11], [0, 1], {
    ...CL,
    easing: Easing.bezier(0.55, 0, 1, 0.45),
  });
  const settle = pop(c, 11, CHIP);
  const scale = c.lf < 11 ? 3.2 - 2.2 * slam : 1 + (1 - settle) * -0.06;
  const shake =
    c.lf >= 11
      ? Math.sin((c.lf - 11) * 2.6) * 7 * Math.exp(-(c.lf - 11) * 0.4)
      : 0;
  const tiles = Math.min(c.s.videos, 42);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translate(${shake}px, ${shake * 0.6}px)`,
      }}
    >
      <div style={{ position: "absolute", left: 28, top: c.top + 70 }}>
        <Rise t={pop(c, 0, CARD)}>
          <Display size={40} color={INK}>
            You shipped
          </Display>
        </Rise>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: c.top + 120,
          display: "flex",
          justifyContent: "center",
          transform: `scale(${scale})`,
          opacity: clamp(slam * 3),
          filter: `blur(${(1 - slam) * 6}px)`,
        }}
      >
        <Display size={250} color={INK}>
          {c.s.videos}
        </Display>
      </div>
      <div
        style={{
          position: "absolute",
          left: 28,
          right: 28,
          top: c.top + 360,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <Rise t={pop(c, 14, CARD)}>
          <Display size={60} color={INK}>
            videos
          </Display>
        </Rise>
        <div
          style={{
            fontSize: 17,
            fontWeight: 400,
            color: INK,
            opacity: interpolate(c.lf, [20, 28], [0, 1], CL),
          }}
        >
          one every 8.7 days
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 28,
          top: c.top + 448,
          width: 337,
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 6,
        }}
      >
        {Array.from({ length: tiles }, (_, i) => {
          const p = pop(c, 18 + i * 0.6, CARD);
          const tone = [INK, c.accent, ORANGE, INK, PINK, INK][
            Math.floor(hash(i) * 6)
          ];
          return (
            <div
              key={`t${i}`}
              style={{
                height: 32,
                borderRadius: i % 5 === 2 ? 16 : 7,
                background: tone,
                opacity: clamp(p * 2),
                transform: `scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * 30}deg)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function TopComponent(c: Ctx) {
  const words = ["ship", "it", "today."];
  const stack = [
    { rot: -7, dx: -12, col: PINK, at: 10 },
    { rot: 5, dx: 14, col: LIME, at: 15 },
    { rot: -1.5, dx: 0, col: INK, at: 20 },
  ];
  return (
    <>
      <div
        style={{ position: "absolute", left: 28, right: 28, top: c.top + 64 }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 400,
            color: PINK,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            opacity: interpolate(c.lf, [2, 8], [0, 1], CL),
          }}
        >
          Your top component
        </div>
        <Rise t={pop(c, 4, CARD)} style={{ marginTop: 10 }}>
          <Display size={58} color="#fff">
            {c.s.topComponent}
          </Display>
        </Rise>
      </div>
      <div
        style={{
          position: "absolute",
          left: 46,
          top: c.top + 230,
          width: 300,
          height: 190,
        }}
      >
        {stack.map((k, i) => {
          const p = pop(c, k.at, CARD);
          return (
            <div
              key={k.col}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 22,
                background: k.col,
                transform: `translate(${k.dx}px, ${(1 - p) * -420}px) rotate(${k.rot + (1 - p) * 18}deg) scale(${1 + (1 - p) * 0.3})`,
                boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              {i === 2
                ? words.map((w, j) => {
                    const on = pop(c, 30 + j * 7, CHIP);
                    const hot =
                      c.lf >= 30 && Math.floor((c.lf - 30) / 7) % 3 === j;
                    return (
                      <div
                        key={w}
                        style={{
                          fontFamily: display,
                          fontWeight: 400,
                          fontSize: 42,
                          letterSpacing: -1.5,
                          color: hot ? INK : "#fff",
                          background: hot ? LIME : "transparent",
                          borderRadius: 10,
                          padding: "0 6px",
                          transform: `scale(${on}) translateY(${(1 - on) * 20}px)`,
                        }}
                      >
                        {w}
                      </div>
                    );
                  })
                : null}
            </div>
          );
        })}
      </div>
      <div
        style={{ position: "absolute", left: 28, right: 28, top: c.top + 470 }}
      >
        {c.s.runnersUp.slice(0, 3).map((name, i) => {
          const p = pop(c, 40 + i * 6, CARD);
          return (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                height: 64,
                borderTop: "1.5px solid rgba(255,255,255,0.25)",
                transform: `translateX(${(1 - p) * 360}px)`,
              }}
            >
              <Display size={34} color={PINK} style={{ width: 30 }}>
                {i + 2}
              </Display>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: [LIME, ORANGE, CREAM][i],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shape
                  kind={(["star", "ring", "square"] as const)[i]}
                  color={INK}
                  size={22}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 400, color: "#fff" }}>
                  {name}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    marginTop: 2,
                  }}
                >
                  in {[14, 9, 6][i]} videos
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Percentile(c: Ctx) {
  const big = pop(c, 3, CHIP);
  const swing = (1 - big) * -8;
  const draw = interpolate(c.lf, [14, 64], [0, 1], { ...CL, easing: outCubic });
  const strip = interpolate(c.lf, [2, 28], [1, 0], { ...CL, easing: outCubic });
  return (
    <>
      <div
        style={{
          position: "absolute",
          right: 0,
          top: c.top + 336,
          width: 44,
          bottom: 0,
          transform: `translateY(${strip * 600}px)`,
        }}
      >
        {Array.from({ length: 22 }, (_, i) =>
          (i + Math.floor(i / 2)) % 2 === 0 ? (
            <div
              key={`c${i}`}
              style={{
                position: "absolute",
                left: (i % 2) * 22,
                top: Math.floor(i / 2) * 44,
                width: 22,
                height: 44,
                background: CREAM,
              }}
            />
          ) : null,
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: c.top + 60,
          textAlign: "center",
        }}
      >
        <Rise t={pop(c, 0, CARD)}>
          <Display size={30} color={CREAM}>
            You’re in great company.
          </Display>
        </Rise>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 14,
            opacity: clamp(big * 2),
            transform: `scale(${0.6 + 0.4 * big}) rotate(${swing}deg)`,
          }}
        >
          <Display
            size={170}
            color="#8FB4FF"
            style={{
              WebkitTextStroke: `4px ${CREAM}`,
              textShadow: `6px 6px 0 ${c.accent}`,
            }}
          >
            {c.s.percentile}%
          </Display>
        </div>
        <div
          style={{
            fontSize: 16,
            color: CREAM,
            marginTop: 10,
            opacity: interpolate(c.lf, [14, 22], [0, 1], CL),
          }}
        >
          Top {c.s.percentile}% of {c.s.product} builders this year.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 24,
          top: c.top + 352,
          opacity: interpolate(c.lf, [18, 26], [0, 1], CL),
        }}
      >
        <Display size={24} color={CREAM}>
          Your crew
        </Display>
      </div>
      <div
        style={{
          position: "absolute",
          left: 24,
          top: c.top + 392,
          width: 290,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {c.s.crew.slice(0, 6).map((m, i) => {
          const p = pop(c, 22 + i * 3, CARD);
          const turn = (1 - p) * (i % 2 ? 14 : -14) + (i % 3 === 1 ? 2 : -1.5);
          return (
            <div
              key={m.name}
              style={{
                background: CREAM,
                padding: 4,
                opacity: clamp(p * 2),
                transform: `scale(${0.7 + 0.3 * p}) rotate(${turn}deg)`,
                boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
              }}
            >
              <Portrait color={m.color} size={80} name={m.name} />
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 400,
                  color: INK,
                  padding: "5px 2px 2px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {m.name}
              </div>
            </div>
          );
        })}
      </div>
      <svg
        width={SW}
        height={200}
        viewBox="0 0 393 200"
        style={{ position: "absolute", left: 0, bottom: -40 }}
      >
        <path
          d="M-10 150 C 40 60, 90 200, 120 130 S 70 40, 40 120 S 180 210, 230 150 S 330 60, 410 120"
          fill="none"
          stroke={CREAM}
          strokeWidth={3}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
      </svg>
    </>
  );
}

function Share(c: Ctx) {
  const card = pop(c, 12, CARD);
  const tapAt = 66;
  const press = interpolate(
    c.lf,
    [tapAt - 2, tapAt, tapAt + 4, tapAt + 8],
    [0, 1, 1, 0],
    CL,
  );
  const burst = clamp((c.lf - tapAt) / 22);
  const rows = [
    ["Videos shipped", String(c.s.videos)],
    ["Top component", c.s.topComponent],
    ["Minutes rendered", c.s.minutes],
    ["Builder rank", `Top ${c.s.percentile}%`],
  ];
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: c.top + 52,
          textAlign: "center",
          opacity: interpolate(c.lf, [6, 14], [0, 1], CL),
        }}
      >
        <Display size={30} color={INK}>
          That’s a wrap.
        </Display>
      </div>
      <div
        style={{
          position: "absolute",
          left: 46,
          top: c.top + 110,
          width: 300,
          height: 476,
          borderRadius: 26,
          background: INK,
          overflow: "hidden",
          transform: `translateY(${(1 - card) * 500}px) rotate(${(1 - card) * 16 - 2 + (c.lf > tapAt ? Math.sin((c.lf - tapAt) * 0.5) * 1.5 * (1 - burst) : 0)}deg)`,
          boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            position: "relative",
            height: 170,
            background: c.accent,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -30,
              top: -40,
              transform: `rotate(${c.lf * 0.6}deg)`,
            }}
          >
            <Shape kind="star" color={LIME} size={150} />
          </div>
          <div style={{ position: "absolute", right: -40, bottom: -60 }}>
            <Shape kind="circle" color={PINK} size={150} />
          </div>
          <div style={{ position: "absolute", left: 22, bottom: 18 }}>
            <Display size={22} color="#fff">
              My
            </Display>
            <Display size={54} color="#fff">
              {c.s.year}
            </Display>
          </div>
        </div>
        <div style={{ padding: "16px 22px 0" }}>
          {rows.map(([k, v], i) => (
            <div
              key={k}
              style={{
                padding: "9px 0",
                borderBottom:
                  i < 3 ? "1px solid rgba(255,255,255,0.12)" : "none",
                opacity: interpolate(
                  c.lf,
                  [14 + i * 3, 20 + i * 3],
                  [0, 1],
                  CL,
                ),
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                {k}
              </div>
              <div
                style={{
                  fontFamily: display,
                  fontWeight: 400,
                  fontSize: 22,
                  color: [LIME, PINK, CREAM, "#8FB4FF"][i],
                  letterSpacing: -0.6,
                  marginTop: 1,
                }}
              >
                {v}
              </div>
            </div>
          ))}
          <div
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: "rgba(255,255,255,0.55)",
              marginTop: 10,
            }}
          >
            {c.s.url}
          </div>
        </div>
      </div>
      {burst > 0 && burst < 1
        ? Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2 + hash(i) * 0.4;
            const d = 150 + hash(i + 7) * 130;
            // The burst flies by transform for the same reason as the intro
            // shapes: `left`/`top` would step it pixel by pixel.
            return (
              <div
                key={`b${i}`}
                style={{
                  position: "absolute",
                  left: 196 - 9,
                  top: c.top + 330 - 9,
                  opacity: 1 - burst,
                  transform: `translate(${Math.cos(a) * d * outCubic(burst)}px, ${Math.sin(a) * d * outCubic(burst) + burst * burst * 60}px) rotate(${burst * 300 * (i % 2 ? 1 : -1)}deg)`,
                }}
              >
                <Shape
                  kind={(["star", "circle", "square", "pill"] as const)[i % 4]}
                  color={[LIME, c.accent, ORANGE, CREAM][i % 4]}
                  size={18}
                />
              </div>
            );
          })
        : null}
      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          bottom: 48,
          height: 52,
          borderRadius: 999,
          background: INK,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontSize: 17,
          fontWeight: 400,
          transform: `translateY(${(1 - pop(c, 30, CARD)) * 120}px) scale(${1 - press * 0.06})`,
        }}
      >
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 15V4M8 7.5 12 4l4 3.5M6 11v8.5h12V11" />
        </svg>
        Share this story
      </div>
    </>
  );
}

const SLIDES = [
  { bg: INK, body: Intro, ui: CREAM },
  { bg: LIME, body: Shipped, ui: INK },
  { bg: "accent", body: TopComponent, ui: "#FFFFFF" },
  { bg: "#1B1B1B", body: Percentile, ui: CREAM },
  { bg: PINK, body: Share, ui: INK },
];

function enterClip(i: number, e: number): React.CSSProperties {
  if (i === 1) return { clipPath: `circle(${e * 980}px at 50% 88%)` };
  if (i === 2) {
    const x = -40 + e * 180;
    return { clipPath: `polygon(0 0, ${x}% 0, ${x - 40}% 100%, 0 100%)` };
  }
  if (i === 3) return { opacity: clamp(e * 2.4) };
  return {};
}

function Screen({
  frame,
  starts,
  lens,
  trs,
  fps,
  s,
  accent,
  top,
}: {
  frame: number;
  /** Each slide's start, length and cover-in frames, from the schedule. */
  starts: number[];
  lens: number[];
  trs: number[];
  fps: number;
  s: YearInReviewStats;
  accent: string;
  top: number;
}) {
  let cur = 0;
  for (let i = 0; i < starts.length; i++) if (frame >= starts[i]) cur = i;
  const ui =
    SLIDES[cur > 0 && frame < starts[cur] + trs[cur] * 0.45 ? cur - 1 : cur].ui;
  const visible = SLIDES.map((_, i) => i).filter(
    (i) => i === cur || (i === cur - 1 && frame < starts[cur] + trs[cur]),
  );
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: INK,
      }}
    >
      {visible.map((i) => {
        const lf = frame - starts[i];
        const sl = SLIDES[i];
        const bg = sl.bg === "accent" ? accent : sl.bg;
        const e = spring({
          frame: lf,
          fps,
          config: HEAVY,
          durationInFrames: trs[i],
        });
        const leaving = i < cur ? clamp((frame - starts[cur]) / trs[cur]) : 0;
        const entering = i === cur && i === 3;
        const slideK = entering ? 1.05 - 0.05 * e : 1 - leaving * 0.08;
        const turn = entering ? 0 : leaving * (i % 2 ? 3 : -3);
        const Body = sl.body;
        const circles = i === 4 && lf < trs[i] + 6;
        return (
          <div
            key={`s${i}`}
            style={{
              position: "absolute",
              inset: 0,
              background: circles ? "transparent" : bg,
              overflow: "hidden",
              ...(i === cur && i > 0 ? enterClip(i, e) : {}),
              transform: entering
                ? `scale(${slideK})`
                : `scale(${slideK}) rotate(${turn}deg)`,
            }}
          >
            {circles
              ? Array.from({ length: 30 }, (_, k) => {
                  const col = k % 5;
                  const row = Math.floor(k / 5);
                  const p = spring({
                    frame: lf - (5 - row) * 1.6 - col * 0.6,
                    fps,
                    config: CHIP,
                  });
                  return (
                    <div
                      key={`c${k}`}
                      style={{
                        position: "absolute",
                        left: col * 80 - 40 + 39,
                        top: row * 150 - 80 + 75,
                        width: 160,
                        height: 160,
                        marginLeft: -80,
                        marginTop: -80,
                        borderRadius: "50%",
                        background: bg,
                        border: `3px solid ${CREAM}`,
                        transform: `scale(${p * 1.3})`,
                      }}
                    />
                  );
                })
              : null}
            <Body lf={lf} fps={fps} s={s} accent={accent} top={top} />
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          top: top - 40,
          display: "flex",
          gap: 4,
          zIndex: 5,
        }}
      >
        {SLIDES.map((_, i) => {
          const fill = clamp((frame - starts[i]) / lens[i]);
          return (
            <div
              key={`p${i}`}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background:
                  ui === INK ? "rgba(18,18,18,0.22)" : "rgba(255,255,255,0.3)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${fill * 100}%`,
                  height: "100%",
                  background: ui,
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          top: top - 26,
          height: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 5,
        }}
      >
        <div
          style={{
            fontFamily: display,
            fontWeight: 400,
            fontSize: 18,
            letterSpacing: -0.6,
            color: ui,
          }}
        >
          {s.product}
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke={ui}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3zM15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" />
          </svg>
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke={ui}
            strokeWidth={2.2}
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </div>
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
        padding: "6px 34px 0 50px",
        zIndex: 8,
      }}
    >
      <span style={{ fontSize: 17, fontWeight: 400, color }}>9:41</span>
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

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function YearInReview(props: YearInReviewProps) {
  const {
    stats,
    accent = "#3B5BFD",
    speed = 1,
    device = "phone",
    chapters = DEFAULT_CHAPTERS,
    rail: showRail = true,
    ink,
    background,
    fontFamily = hanken,
    scale = 1,
    delay = 0,
    ground,
    groundParams,
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const fg = ink ?? "#F4F1EA";
  const { width, height, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    yearInReviewTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const slides = tl.lane("Slides");
  const starts = slides.map((e) => e.start);
  const lens = slides.map((e) => e.length);
  const trs = slides.map((e) => e.beat("enter"));
  const acts = slides.map((e) => e.beat("act"));
  const actOuts = slides.map((e) => e.beat("actOut"));
  const bars = slides.map((e) => e.beat("bar"));
  const deviceEl = tl.get("device");
  const railEl = tl.get("rail");
  const tall = height > width;
  const s = { ...DEFAULT_STATS, ...stats };
  const phone = device === "phone";
  let cur = 0;
  for (let i = 0; i < starts.length; i++) if (frame >= starts[i]) cur = i;
  const enter = spring({ frame: frame - deviceEl.start, fps, config: HEAVY });
  const fw = phone ? SW + BEZEL * 2 : SW;
  const fh = phone ? SH + BEZEL * 2 : SH;
  const k = tall ? (height * 0.62) / fh : (height * 0.9) / fh;
  const center = tall
    ? { x: width / 2, y: height * 0.37 }
    : { x: width * 0.66, y: height / 2 };
  const u = width / (tall ? 1080 : 1280);
  const push = 1 + 0.02 * (frame / 480);
  const ui =
    SLIDES[cur > 0 && frame < starts[cur] + trs[cur] * 0.45 ? cur - 1 : cur].ui;
  const act = (i: number) =>
    interpolate(
      frame,
      [
        starts[i],
        starts[i] + acts[i],
        starts[i + 1] ?? 1e9,
        (starts[i + 1] ?? 1e9) + actOuts[i],
      ],
      [0, 1, 1, 0],
      { ...CL, easing: ENTER },
    );
  const railIn = interpolate(frame, [railEl.start, railEl.end], [0, 1], {
    ...CL,
    easing: ENTER,
  });
  const rail = tall ? (
    <div
      style={{
        position: "absolute",
        left: 80 * u,
        right: 80 * u,
        top: height * 0.735,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8 * u,
          marginBottom: 28 * u,
          opacity: railIn,
        }}
      >
        {chapters.map((ch, i) => (
          <div
            key={ch}
            style={{
              flex: 1,
              height: 3 * u,
              borderRadius: 2,
              background: "rgba(255,255,255,0.18)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${clamp((frame - starts[i]) / bars[i]) * 100}%`,
                height: "100%",
                background: fg,
              }}
            />
          </div>
        ))}
      </div>
      {chapters.map((ch, i) => {
        const a = act(i);
        if (a <= 0) return null;
        return (
          <div
            key={ch}
            style={{ position: "absolute", left: 0, right: 0, top: 40 * u }}
          >
            <div
              style={{
                fontSize: 28 * u,
                color: "rgba(244,241,234,0.55)",
                fontVariantNumeric: "tabular-nums",
                opacity: a,
              }}
            >
              0{i + 1} / 0{chapters.length}
            </div>
            <div style={{ overflow: "hidden", paddingBottom: 10 * u }}>
              <div
                style={{
                  marginTop: 10 * u,
                  fontFamily: display,
                  fontSize: 104 * u,
                  fontWeight: 300,
                  lineHeight: 1,
                  letterSpacing: "-0.045em",
                  color: fg,
                  transform: `translateY(${(1 - a) * 105}%)${glide(midway(a))}`,
                }}
              >
                {ch}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <div
      style={{
        position: "absolute",
        left: 96 * u,
        top: height / 2 - 170 * u,
        width: 420 * u,
      }}
    >
      <div
        style={{
          fontSize: 20 * u,
          color: "rgba(244,241,234,0.55)",
          marginBottom: 22 * u,
          opacity: railIn,
          transform: `translateY(${(1 - railIn) * 10}px)${glide(midway(railIn))}`,
        }}
      >
        {s.year} in {s.product}
      </div>
      {chapters.map((ch, i) => {
        const a = act(i);
        const chapter = tl.get(`chapter:${i}`);
        const shown = interpolate(frame, [chapter.start, chapter.end], [0, 1], {
          ...CL,
          easing: ENTER,
        });
        return (
          <div
            key={ch}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 18 * u,
              height: 62 * u,
              opacity: shown * (0.32 + 0.68 * a),
              transform: `translateX(${a * 14 * u + (1 - shown) * 20}px)`,
            }}
          >
            <span
              style={{
                width: 34 * u,
                fontSize: 18 * u,
                color: "rgba(244,241,234,0.6)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              0{i + 1}
            </span>
            <span
              style={{
                fontFamily: display,
                fontSize: 44 * u,
                fontWeight: 300,
                letterSpacing: "-0.04em",
                color: fg,
              }}
            >
              {ch}
            </span>
          </div>
        );
      })}
    </div>
  );
  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      {background === undefined ? (
        <>
          <GshGround
            preset={ground ?? "charcoal-satin"}
            params={groundParams}
            timeOffset={3}
            timeScale={0.3}
          />
          <AbsoluteFill
            style={{
              background: tall
                ? "linear-gradient(180deg, rgba(6,6,8,0.15) 40%, rgba(6,6,8,0.7) 100%)"
                : "linear-gradient(90deg, rgba(6,6,8,0.72) 0%, rgba(6,6,8,0.25) 50%, rgba(6,6,8,0.1) 100%)",
            }}
          />
        </>
      ) : (
        <AbsoluteFill
          style={{
            background: background === "transparent" ? undefined : background,
          }}
        />
      )}
      <ScaleLayer scale={scale}>
        {showRail ? rail : null}
        <div
          style={{
            position: "absolute",
            left: center.x - fw / 2,
            top: center.y - fh / 2,
            width: fw,
            height: fh,
            // `push` grows on every frame, so the device never rests and
            // carries the tilt throughout; it covers all the screen text.
            transform: `translateY(${(1 - enter) * height * 0.7}px) scale(${k * push})${glide(true)}`,
          }}
        >
          {phone ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 66,
                background: "#0B0B0C",
                boxShadow:
                  "inset 0 0 0 1.5px #6E6E73, inset 0 0 0 3px #1C1C1E, 0 50px 100px -20px rgba(0,0,0,0.75)",
              }}
            />
          ) : null}
          <div
            style={{
              position: "absolute",
              left: phone ? BEZEL : 0,
              top: phone ? BEZEL : 0,
              width: SW,
              height: SH,
              borderRadius: phone ? 55 : 30,
              overflow: "hidden",
              boxShadow: phone
                ? "none"
                : "0 0 0 1px rgba(255,255,255,0.08), 0 50px 100px -20px rgba(0,0,0,0.75)",
            }}
          >
            <Screen
              frame={frame}
              starts={starts}
              lens={lens}
              trs={trs}
              fps={fps}
              s={s}
              accent={accent}
              top={phone ? 104 : 64}
            />
            {phone ? (
              <>
                <StatusBar color={ui} />
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
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: (SW - 140) / 2,
                    width: 140,
                    height: 5,
                    borderRadius: 3,
                    background: ui,
                    opacity: 0.85,
                    zIndex: 20,
                  }}
                />
              </>
            ) : null}
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
