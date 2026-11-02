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

export type StreakStatKind = "xp" | "accuracy" | "time";

export interface StreakStat {
  label: string;
  /** XP points, accuracy percent, or time in seconds. */
  value: number;
  kind: StreakStatKind;
  color?: string;
}

export interface StreakRewardProps {
  /** Streak after today. The number counts up from streak - 1. */
  streak?: number;
  stats?: StreakStat[];
  title?: string;
  subtitle?: string;
  days?: string[];
  cta?: string;
  /** Two lines beside the phone: the streak beat, then the reward beat. */
  lines?: [string, string];
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_STATS: StreakStat[] = [
  { label: "XP earned", value: 25, kind: "xp" },
  { label: "Accuracy", value: 100, kind: "accuracy" },
  { label: "Time", value: 62, kind: "time" },
];

const SW = 393;
const SH = 852;
const BEZEL = 11;
const BW = SW + BEZEL * 2;
const BH = SH + BEZEL * 2;

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const RISE = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);

const BEAT = {
  phone: 0,
  flame: 6,
  number: 12,
  week: 18,
  today: 48,
  note: 60,
  touch: 66,
  press: 84,
  swap: 88,
  medal: 96,
  title: 102,
  stats: 108,
  line2: 90,
  end: 180,
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FLAME = "#ff7a1a";

interface Pal {
  screen: string;
  text: string;
  muted: string;
  faint: string;
  hair: string;
  ring: string;
  copy: string;
  frame: string;
  scrim: string;
}

const LIGHT: Pal = {
  screen: "#fbfaf8",
  text: "#17130f",
  muted: "#6f6860",
  faint: "#a59d94",
  hair: "rgba(23,19,15,0.09)",
  ring: "rgba(23,19,15,0.1)",
  copy: "#1d1712",
  frame:
    "linear-gradient(155deg,#f1f1f3 0%,#c4c4ca 30%,#e2e2e6 62%,#b3b3ba 100%)",
  scrim: "rgba(246,240,232,0.28)",
};
const DARK: Pal = {
  screen: "#0c0b0a",
  text: "#f6f1ea",
  muted: "#a39a90",
  faint: "#6c645c",
  hair: "rgba(255,255,255,0.08)",
  ring: "rgba(255,255,255,0.1)",
  copy: "#fbf3ea",
  frame:
    "linear-gradient(155deg,#55565c 0%,#2a2b2f 30%,#3d3e43 62%,#1f2023 100%)",
  scrim: "rgba(5,3,2,0.3)",
};

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
        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden>
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
            opacity: 0.9,
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

function Phone({ children, c }: { children: React.ReactNode; c: Pal }) {
  return (
    <div style={{ position: "relative", width: BW, height: BH }}>
      {[
        ["left", 150, 32],
        ["left", 210, 62],
        ["left", 284, 62],
        ["right", 236, 98],
      ].map(([side, top, h]) => (
        <div
          key={`${side}${top}`}
          style={{
            position: "absolute",
            [side as string]: -3,
            top: top as number,
            width: 4,
            height: h as number,
            borderRadius: 2,
            background: c.frame,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 68,
          background: c.frame,
          boxShadow:
            "0 50px 100px -20px rgba(0,0,0,0.45), 0 20px 40px -12px rgba(0,0,0,0.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 3,
          borderRadius: 65,
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
          borderRadius: 57,
          overflow: "hidden",
          background: c.screen,
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

function Flame({ uid, flare, t }: { uid: string; flare: number; t: number }) {
  const sway = Math.sin(t / 7) * 2.4 + Math.sin(t / 3.3) * 0.8;
  return (
    <svg
      width="112"
      height="136"
      viewBox="0 0 112 136"
      aria-hidden
      style={{
        overflow: "visible",
        transform: `scale(${1 + flare * 0.1}, ${1 + flare * 0.16})`,
        transformOrigin: "50% 100%",
      }}
    >
      <defs>
        <linearGradient id={`${uid}fo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb547" />
          <stop offset="1" stopColor={FLAME} />
        </linearGradient>
        <linearGradient id={`${uid}fi`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe3a8" />
          <stop offset="1" stopColor="#ffc35c" />
        </linearGradient>
      </defs>
      <path
        d="M56 134c-29 0-49-19-49-47 0-20 10-35 23-48 1 12 6 20 15 24-2-24 8-44 29-58 0 23 12 34 23 47 9 12 9 21 9 35 0 28-20 47-50 47z"
        fill={`url(#${uid}fo)`}
      />
      <path
        d="M56 134c-15 0-26-10-26-25 0-13 8-22 17-30 1 8 5 12 10 14 0-13 6-22 15-29 3 15 10 20 10 33 0 21-10 37-26 37z"
        fill={`url(#${uid}fi)`}
        transform={`rotate(${sway} 56 134)`}
      />
    </svg>
  );
}

function Medal({
  accent,
  uid,
  sheen,
}: {
  accent: string;
  uid: string;
  sheen: number;
}) {
  return (
    <svg width="156" height="156" viewBox="0 0 156 156" aria-hidden>
      <defs>
        <linearGradient id={`${uid}md`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop
            offset="0"
            stopColor={`color-mix(in oklab, ${accent} 70%, #fff)`}
          />
          <stop offset="0.55" stopColor={accent} />
          <stop
            offset="1"
            stopColor={`color-mix(in oklab, ${accent} 62%, #000)`}
          />
        </linearGradient>
        <clipPath id={`${uid}mc`}>
          <circle cx="78" cy="78" r="70" />
        </clipPath>
      </defs>
      <circle cx="78" cy="78" r="70" fill={`url(#${uid}md)`} />
      <g clipPath={`url(#${uid}mc)`}>
        <rect
          x={-60 + sheen * 260}
          y="-20"
          width="26"
          height="200"
          fill="#fff"
          opacity="0.22"
          transform="skewX(-20)"
        />
      </g>
      <circle
        cx="78"
        cy="78"
        r="54"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.32"
        strokeWidth="1.5"
      />
      <circle
        cx="78"
        cy="78"
        r="69.25"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.28"
        strokeWidth="1.5"
      />
      <path
        d="M68 58v40l32-20z"
        fill="#fff"
        stroke="#fff"
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DayRing({
  p,
  color,
  track,
  size,
  solid = 0,
}: {
  solid?: number;
  p: number;
  color: string;
  track: string;
  size: number;
}) {
  const r = size / 2 - 3;
  const len = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={track}
        strokeWidth={4}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - Math.min(1, Math.max(0, p)))}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        opacity={p > 0.01 ? 1 : 0}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r - 2}
        fill={color}
        transform={`translate(${size / 2} ${size / 2}) scale(${solid}) translate(${-size / 2} ${-size / 2})`}
      />
      <path
        d={`M${size * 0.32} ${size * 0.52}l${size * 0.12} ${size * 0.12} ${size * 0.24} -${size * 0.26}`}
        fill="none"
        stroke={solid > 0.5 ? "#fff" : color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={Math.min(1, Math.max(0, (p - 0.85) * 6.6))}
      />
    </svg>
  );
}

function fmt(kind: StreakStatKind, v: number) {
  if (kind === "accuracy") return `${Math.round(v)}%`;
  if (kind === "time") {
    const s = Math.round(v);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }
  return `+${Math.round(v)}`;
}

export function StreakReward({
  streak = 7,
  stats = DEFAULT_STATS,
  title = "Lesson complete",
  subtitle = "No mistakes across 14 answers.",
  days = ["M", "T", "W", "T", "F", "S", "S"],
  cta = "Continue",
  lines = ["Day seven. Still shipping.", "Small wins, every day."],
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
  ground,
  groundParams,
}: StreakRewardProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const f = frame * speed;
  const dark = theme === "dark";
  const c = dark ? DARK : LIGHT;
  const tall = height > width;
  const W = tall ? 720 : 1280;
  const H = tall ? 1280 : 720;
  const u = Math.min(width / W, height / H);
  const k = tall ? (H * 0.66) / BH : (H * 0.9) / BH;
  const phoneCx = tall ? W / 2 : W * 0.68;
  const phoneCy = tall ? H - 40 - (BH * k) / 2 : H / 2;

  const sp = (at: number, config: object = CARD) =>
    spring({ frame: f - at, fps, config });
  const ease = (a: number, b: number, e = ENTER) =>
    interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });

  const rise = sp(BEAT.phone, HEAVY);
  const cam = interpolate(f, [BEAT.medal, BEAT.end], [1, 1.035], {
    ...clamp,
    easing: CAMERA,
  });

  const flameIn = sp(BEAT.flame, CARD);
  const roll = sp(BEAT.today + 2, CARD);
  const flare =
    sp(BEAT.today, CHIP) -
    spring({ frame: f - BEAT.today - 8, fps, config: MORPH });
  const numIn = ease(BEAT.number, BEAT.number + 14);
  const weekIn = sp(BEAT.week, CARD);
  const filled = Math.min(days.length, streak);
  const todayIdx = filled - 1;
  const noteSwap = ease(BEAT.note, BEAT.note + 12, MOVE);
  const swap = sp(BEAT.swap, MORPH);

  const medalIn = sp(BEAT.medal, CARD);
  const sheen = ease(BEAT.medal + 12, BEAT.medal + 34, MOVE);
  const titleIn = ease(BEAT.title, BEAT.title + 14);
  const subIn = ease(BEAT.title + 4, BEAT.title + 18);
  const ctaIn = sp(BEAT.today + 12, CARD);

  const touchPath = ease(BEAT.touch, BEAT.press - 2, MOVE);
  const touchO =
    ease(BEAT.touch - 4, BEAT.touch + 4, RISE) *
    (1 - ease(BEAT.press + 6, BEAT.press + 14, EXIT));
  const pressK =
    spring({ frame: f - BEAT.press, fps, config: CHIP }) -
    spring({ frame: f - BEAT.press - 5, fps, config: CHIP });
  const tx = interpolate(touchPath, [0, 1], [SW * 0.78, SW / 2 + 36]);
  const ty =
    interpolate(touchPath, [0, 1], [640, 778]) -
    Math.sin(touchPath * Math.PI) * 26;

  const copyLine = (i: number) => {
    const inAt = i === 0 ? BEAT.number + 4 : BEAT.line2;
    const outAt = i === 0 ? BEAT.line2 - 6 : undefined;
    const pin = ease(inAt, inAt + 16);
    const pout = outAt === undefined ? 0 : ease(outAt, outAt + 8, EXIT);
    if (pin <= 0 || pout >= 1) return null;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          transform: `translateY(${(1 - pin) * 60 - pout * 40}%)`,
          opacity: pin * (1 - pout),
          filter: `blur(${(1 - pin) * 6 + pout * 4}px)`,
        }}
      >
        {lines[i]}
      </div>
    );
  };

  const count = (i: number, value: number) =>
    interpolate(
      f,
      [BEAT.stats + 4 + i * 6, BEAT.stats + 30 + i * 6],
      [0, value],
      { ...clamp, easing: RISE },
    );

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={ground ?? "hearth"}
        params={
          groundParams ??
          (dark
            ? undefined
            : {
                background: "#f5eee6",
                colors: ["#fffaf3", "#ffbf8a", "#f3d9c4", "#f5eee6"],
                grain: 0.06,
              })
        }
        timeOffset={3}
        timeScale={0.35}
      />
      <AbsoluteFill style={{ background: c.scrim }} />
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
            left: tall ? 64 : 96,
            top: tall ? 96 : H / 2 - 84,
            width: tall ? W - 128 : 500,
            height: tall ? 170 : 170,
            fontSize: tall ? 68 : 76,
            fontWeight: 300,
            lineHeight: 1.04,
            letterSpacing: "-0.04em",
            color: c.copy,
            overflow: "hidden",
            textWrap: "balance",
          }}
        >
          {copyLine(0)}
          {copyLine(1)}
        </div>
        <div
          style={{
            position: "absolute",
            left: phoneCx - BW / 2,
            top: phoneCy - BH / 2,
            width: BW,
            height: BH,
            transform: `translateY(${(1 - rise) * H * 0.9}px) scale(${k * cam})`,
          }}
        >
          <Phone c={c}>
            <StatusBar color={c.text} />
            <AbsoluteFill
              style={{
                transform: `translateX(${-swap * SW * 0.3}px)`,
                opacity: 1 - swap,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 118,
                  display: "flex",
                  justifyContent: "center",
                  transform: `translateY(${(1 - flameIn) * 30}px) scale(${0.7 + 0.3 * flameIn})`,
                  transformOrigin: "50% 100%",
                  opacity: Math.min(1, flameIn * 2),
                }}
              >
                <Flame uid={uid} flare={Math.max(0, flare)} t={f} />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 270,
                  height: 128,
                  overflow: "hidden",
                  textAlign: "center",
                  fontSize: 120,
                  fontWeight: 300,
                  letterSpacing: "-0.05em",
                  lineHeight: "128px",
                  color: c.text,
                  fontVariantNumeric: "tabular-nums",
                  opacity: numIn,
                  WebkitMaskImage:
                    "linear-gradient(transparent, #000 18%, #000 82%, transparent)",
                }}
              >
                <div
                  style={{
                    transform: `translateY(${-roll * 128 + (1 - numIn) * 30}px)`,
                  }}
                >
                  <div>{streak - 1}</div>
                  <div>{streak}</div>
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 400,
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: 400,
                  color: c.muted,
                  opacity: numIn,
                }}
              >
                day streak
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 28,
                  right: 28,
                  top: 474,
                  opacity: Math.min(1, weekIn * 1.6),
                  transform: `translateY(${(1 - weekIn) * 24}px)`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  {days.slice(0, 7).map((d, i) => {
                    const isToday = i === todayIdx;
                    const at = isToday ? BEAT.today : BEAT.week + 4 + i * 3;
                    const p =
                      i <= todayIdx
                        ? isToday
                          ? spring({
                              frame: f - at,
                              fps,
                              config: { damping: 200, stiffness: 120 },
                            })
                          : ease(at, at + 14, MOVE)
                        : 0;
                    const pop = isToday ? sp(at + 6, CHIP) : 1;
                    return (
                      <div
                        key={`${d}-${i}`}
                        style={{
                          width: 40,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 400,
                            color: isToday && f >= BEAT.today ? FLAME : c.faint,
                          }}
                        >
                          {d}
                        </span>
                        <div
                          style={{
                            transform: `scale(${isToday ? 0.86 + 0.14 * pop : 1})`,
                          }}
                        >
                          <DayRing
                            p={p}
                            solid={isToday ? Math.max(0, Math.min(1, pop)) : 0}
                            color={FLAME}
                            track={c.ring}
                            size={38}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div
                  style={{ height: 1, background: c.hair, margin: "22px 0" }}
                />
                <div
                  style={{
                    position: "relative",
                    height: 48,
                    textAlign: "center",
                    fontSize: 17,
                    fontWeight: 400,
                    color: c.muted,
                    lineHeight: "24px",
                    textWrap: "balance",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 1 - noteSwap,
                      transform: `translateY(${-noteSwap * 10}px)`,
                    }}
                  >
                    One more lesson keeps the week alive.
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: noteSwap,
                      transform: `translateY(${(1 - noteSwap) * 10}px)`,
                    }}
                  >
                    Seven for seven. Come back tomorrow for eight.
                  </div>
                </div>
              </div>
            </AbsoluteFill>

            {f >= BEAT.swap && (
              <AbsoluteFill
                style={{
                  transform: `translateX(${(1 - swap) * SW * 0.4}px)`,
                  opacity: swap,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 150,
                    display: "flex",
                    justifyContent: "center",
                    transform: `translateY(${(1 - medalIn) * 50}px) scale(${0.7 + 0.3 * medalIn})`,
                    opacity: Math.min(1, medalIn * 2),
                  }}
                >
                  <Medal accent={accent} uid={uid} sheen={sheen} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 336,
                    textAlign: "center",
                    fontSize: 32,
                    fontWeight: 400,
                    color: c.text,
                    letterSpacing: "-0.025em",
                    transform: `translateY(${(1 - titleIn) * 14}px)`,
                    opacity: titleIn,
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 30,
                    right: 30,
                    top: 384,
                    textAlign: "center",
                    fontSize: 17,
                    fontWeight: 400,
                    color: c.muted,
                    lineHeight: "24px",
                    opacity: subIn,
                    transform: `translateY(${(1 - subIn) * 10}px)`,
                  }}
                >
                  {subtitle}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 28,
                    right: 28,
                    top: 488,
                    display: "flex",
                    borderTop: `1px solid ${c.hair}`,
                    borderBottom: `1px solid ${c.hair}`,
                  }}
                >
                  {stats.slice(0, 3).map((s, i) => {
                    const pop = sp(BEAT.stats + i * 3, CARD);
                    return (
                      <div
                        key={s.label}
                        style={{
                          flex: 1,
                          padding: "18px 0 20px",
                          paddingLeft: i === 0 ? 0 : 16,
                          borderLeft: i === 0 ? "none" : `1px solid ${c.hair}`,
                          opacity: Math.min(1, pop * 1.6),
                          transform: `translateY(${(1 - pop) * 16}px)`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 400,
                            color: c.muted,
                          }}
                        >
                          {s.label}
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 34,
                            fontWeight: 300,
                            letterSpacing: "-0.03em",
                            color: s.color ?? (i === 0 ? FLAME : c.text),
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {fmt(s.kind, count(i, s.value))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 28,
                    right: 28,
                    top: 630,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    opacity: ease(BEAT.stats + 20, BEAT.stats + 34),
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                    <path
                      d="M12 22c4 0 7-2.8 7-7 0-4.5-4-7.5-5-12-2.5 2-3.5 4.5-3 7-1-.5-2-1.6-2.3-3C6.3 9 5 11.6 5 15c0 4.2 3 7 7 7z"
                      fill="none"
                      stroke={FLAME}
                      strokeWidth={1.6}
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span style={{ fontSize: 16, color: c.muted }}>
                    {streak}-day streak · best this year
                  </span>
                </div>
              </AbsoluteFill>
            )}

            <div
              style={{
                position: "absolute",
                left: 24,
                right: 24,
                top: 752,
                height: 54,
                borderRadius: 27,
                background: accent,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 400,
                zIndex: 10,
                opacity: Math.min(1, ctaIn * 1.6),
                transform: `translateY(${(1 - ctaIn) * 30}px) scale(${1 - 0.04 * Math.max(0, pressK)})`,
                boxShadow: `0 10px 24px -10px color-mix(in oklab, ${accent} 70%, transparent)`,
              }}
            >
              {cta}
            </div>
            <div
              style={{
                position: "absolute",
                left: tx - 22,
                top: ty - 22,
                width: 44,
                height: 44,
                borderRadius: 22,
                background: "rgba(255,255,255,0.28)",
                boxShadow:
                  "0 0 0 1.5px rgba(255,255,255,0.85), 0 4px 14px rgba(0,0,0,0.22)",
                opacity: touchO,
                transform: `scale(${1 - 0.18 * Math.max(0, pressK)})`,
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
                background: c.text,
                zIndex: 36,
              }}
            />
          </Phone>
        </div>
      </div>
    </AbsoluteFill>
  );
}
