"use client";

import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
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

export interface Signup {
  name: string;
  city: string;
  country: string;
  lon: number;
  lat: number;
  plan?: "Free" | "Pro" | "Team";
  at: number;
}

export interface CountryStat {
  name: string;
  code: string;
  count: number;
}

export interface WorldSignupsProps {
  signups?: Signup[];
  startCount?: number;
  countries?: CountryStat[];
  title?: string;
  counterLabel?: string;
  delta?: string;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_SIGNUPS: Signup[] = [
  {
    name: "Maya Chen",
    city: "Lisbon",
    country: "PT",
    lon: -9.14,
    lat: 38.72,
    plan: "Pro",
    at: 26,
  },
  {
    name: "Kenji Sato",
    city: "Tokyo",
    country: "JP",
    lon: 139.69,
    lat: 35.69,
    plan: "Free",
    at: 38,
  },
  {
    name: "Ana Souza",
    city: "São Paulo",
    country: "BR",
    lon: -46.63,
    lat: -23.55,
    plan: "Pro",
    at: 49,
  },
  {
    name: "Leo Park",
    city: "Seoul",
    country: "KR",
    lon: 126.98,
    lat: 37.57,
    plan: "Team",
    at: 59,
  },
  {
    name: "Priya Raman",
    city: "Bengaluru",
    country: "IN",
    lon: 77.59,
    lat: 12.97,
    plan: "Free",
    at: 68,
  },
  {
    name: "Jonas Weber",
    city: "Berlin",
    country: "DE",
    lon: 13.4,
    lat: 52.52,
    plan: "Pro",
    at: 77,
  },
  {
    name: "Sam Ortiz",
    city: "Austin",
    country: "US",
    lon: -97.74,
    lat: 30.27,
    plan: "Free",
    at: 85,
  },
  {
    name: "Amara Okafor",
    city: "Lagos",
    country: "NG",
    lon: 3.38,
    lat: 6.52,
    plan: "Free",
    at: 93,
  },
  {
    name: "Chloé Martin",
    city: "Paris",
    country: "FR",
    lon: 2.35,
    lat: 48.86,
    plan: "Pro",
    at: 101,
  },
  {
    name: "Noah Williams",
    city: "Sydney",
    country: "AU",
    lon: 151.21,
    lat: -33.87,
    plan: "Team",
    at: 108,
  },
  {
    name: "Olivia Brown",
    city: "Toronto",
    country: "CA",
    lon: -79.38,
    lat: 43.65,
    plan: "Free",
    at: 115,
  },
  {
    name: "Elena Rossi",
    city: "Milan",
    country: "IT",
    lon: 9.19,
    lat: 45.46,
    plan: "Pro",
    at: 122,
  },
  {
    name: "Diego Ramírez",
    city: "Mexico City",
    country: "MX",
    lon: -99.13,
    lat: 19.43,
    plan: "Free",
    at: 129,
  },
  {
    name: "Aiko Tanaka",
    city: "Osaka",
    country: "JP",
    lon: 135.5,
    lat: 34.69,
    plan: "Pro",
    at: 137,
  },
  {
    name: "Tom Becker",
    city: "Seattle",
    country: "US",
    lon: -122.33,
    lat: 47.61,
    plan: "Team",
    at: 145,
  },
];

const DEFAULT_COUNTRIES: CountryStat[] = [
  { name: "United States", code: "US", count: 2184 },
  { name: "Germany", code: "DE", count: 1032 },
  { name: "Brazil", code: "BR", count: 902 },
  { name: "India", code: "IN", count: 871 },
  { name: "Japan", code: "JP", count: 655 },
];

const LAND: string[] = [
  "............................#######..#################...........#..............##.........######.......................",
  "......................#######..###......#############.........................###.....################..................",
  "......####################.##########....############.............####........#...##.#################################..",
  "....###################################...########..............##########.#############################################",
  ".....###########################....###...#####.....###........#########################################################",
  ".....#########################....###......###...............#####.###################################################..",
  "......####....###############.....#####...................#...####.############################################.##......",
  "......##........################..######.................###..###..########################################.....##......",
  ".................########################................#.#################################################....#.......",
  "..................#######################.................##################################################............",
  "..................######################...................###############################################..............",
  "..................####################...................#############...###.############################..#............",
  "..................##################.....................####....###########.##########################.................",
  "...................################......................###.##....#.################################.#...#.............",
  "....................###############......................#######........############################..####..............",
  ".....................#############.......................############################################..#................",
  "......................######....#.......................####################.########################...................",
  ".......................#####...........................######################.######################....................",
  "........................####.....#....................##################.#######...################.....................",
  ".........................###.##...###.................#########################.....#####..#####........................",
  "...........................####.......................###################.####......####....####....#...................",
  "..............................##......................######################.........##......####...#...................",
  "...............................##.#####................######################........##.....#.##........................",
  ".................................########...............#####################.........#......#.......#..................",
  "..................................#########..............###..##############................###...##....................",
  ".................................###########...................############..................##.####....................",
  ".................................############..................###########...................##.###.#...###.............",
  ".................................###############................#########.....................##...##....####...........",
  ".................................################...............#########.......................##........####..........",
  "..................................##############................##########..............................................",
  "..................................##############................##########..#.........................####.#............",
  "...................................############.................#########..##........................########...........",
  "....................................###########.................########..##.......................###########..........",
  "....................................##########...................#######..##......................#############.........",
  "....................................#########....................######...........................#############.........",
  "....................................########.....................######...........................#############.........",
  "....................................#######.......................####............................#############.........",
  "....................................######........................###.............................##......#####.........",
  "...................................######.................................................................####........#.",
  "...................................####...............................................................................#.",
  "...................................####.............................................................................##..",
  "...................................###..............................................................................#...",
  "...................................###..................................................................................",
  "...................................##...................................................................................",
];
const CELL = 3;
const LAT_TOP = 78;

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const enterEase = Easing.bezier(0.32, 0.72, 0, 1);
const moveEase = Easing.bezier(0.65, 0, 0.35, 1);
const exitEase = Easing.bezier(0.55, 0, 1, 0.45);
const camEase = Easing.bezier(0.87, 0, 0.13, 1);
const tween = (f: number, a: number, b: number, easing = enterEase) =>
  interpolate(f, [a, b], [0, 1], { ...CL, easing });
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const fmt = (n: number) =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

interface Pal {
  win: string;
  chip: string;
  line: string;
  text: string;
  muted: string;
  faint: string;
  dot: string;
  green: string;
  scrim: string;
  winShadow: string;
  chipShadow: string;
  stageText: string;
  stageMuted: string;
  dark: boolean;
}

function palette(theme: "light" | "dark"): Pal {
  return theme === "dark"
    ? {
        win: "#0D0E11",
        chip: "#1A1B1F",
        line: "rgba(255,255,255,0.07)",
        text: "#EEEEF0",
        muted: "rgba(238,238,240,0.58)",
        faint: "rgba(238,238,240,0.38)",
        dot: "rgba(255,255,255,0.3)",
        green: "#62D893",
        scrim: "rgba(3,4,10,0.25)",
        winShadow:
          "0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.05), 0 40px 90px -24px rgba(0,0,0,0.75), 0 10px 28px rgba(0,0,0,0.35)",
        chipShadow:
          "0 0 0 1px rgba(255,255,255,0.12), 0 10px 24px -6px rgba(0,0,0,0.6)",
        stageText: "#F2F2F4",
        stageMuted: "rgba(242,242,244,0.62)",
        dark: true,
      }
    : {
        win: "#FCFCFB",
        chip: "#FFFFFF",
        line: "rgba(22,23,26,0.08)",
        text: "#16171A",
        muted: "rgba(22,23,26,0.58)",
        faint: "rgba(22,23,26,0.4)",
        dot: "rgba(22,23,26,0.2)",
        green: "#18794E",
        scrim: "rgba(238,236,232,0.12)",
        winShadow:
          "0 0 0 1px rgba(17,19,24,0.07), 0 1px 2px rgba(17,19,24,0.05), 0 30px 70px -20px rgba(28,38,92,0.28)",
        chipShadow:
          "0 0 0 1px rgba(17,19,24,0.08), 0 10px 24px -8px rgba(28,38,92,0.3)",
        stageText: "#14151A",
        stageMuted: "rgba(20,21,26,0.6)",
        dark: false,
      };
}

const LIGHT_GROUND: Partial<GradientParams> = {
  colors: ["#6e8dff", "#aebdff", "#dfe4fb", "#f5f3ef"],
};

function lighten(color: string, t: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  const ch = (v: number) =>
    Math.round(v + (255 - v) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

const AVATAR_TONES = ["#B9806C", "#6F8DB8", "#8E7DB3", "#6E9C84", "#B59866"];
function Avatar({ name, size }: { name: string; size: number }) {
  const idx =
    [...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % AVATAR_TONES.length;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: AVATAR_TONES[idx],
        color: "rgba(255,255,255,0.95)",
        fontSize: size * 0.4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        letterSpacing: "0.02em",
      }}
    >
      {name
        .split(" ")
        .map((s) => s[0])
        .join("")
        .slice(0, 2)}
    </div>
  );
}

function SnapCounter({
  value,
  changedAt,
  frame,
}: {
  value: string;
  changedAt: number[];
  frame: number;
}) {
  let d = 0;
  const digits = value.replace(/\D/g, "").length;
  return (
    <span
      style={{
        display: "inline-flex",
        fontVariantNumeric: "tabular-nums",
        overflow: "hidden",
      }}
    >
      {value.split("").map((ch, i) => {
        if (!/\d/.test(ch)) {
          return <span key={i}>{ch}</span>;
        }
        const slot = digits - 1 - d++;
        const t = changedAt[slot] ?? -999;
        const p = tween(frame, t, t + 8);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${(1 - p) * 60}%)`,
              opacity: 0.2 + 0.8 * p,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}

export function WorldSignups({
  signups = DEFAULT_SIGNUPS,
  startCount = 12847,
  countries = DEFAULT_COUNTRIES,
  title = "Signups around the world",
  counterLabel = "Signups today",
  delta = "+18.2% vs. yesterday",
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: WorldSignupsProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const pal = palette(theme);
  const tall = H > W * 1.2;
  const D = tall ? { w: 800, h: 1422 } : { w: 1280, h: 720 };
  const s = Math.min(W / D.w, H / D.h);
  const sp = (at: number, config: object) =>
    spring({ frame: frame - at, fps, config });

  const WIN = tall
    ? { x: 40, y: 340, w: 720, h: 1010 }
    : { x: 140, y: 60, w: 1000, h: 600 };
  const PAD = 28;
  const HEAD_H = 68;
  const MAP_W = tall ? WIN.w - PAD * 2 : 640;
  const PITCH = MAP_W / LAND[0].length;
  const PITCH_Y = PITCH * 1.18;
  const mapH = LAND.length * PITCH_Y;
  const COUNTRY_H = 70;
  const countryY = tall ? HEAD_H + 28 + mapH + 30 : WIN.h - PAD - COUNTRY_H;
  const mapTop = tall
    ? HEAD_H + 28
    : HEAD_H + (countryY - HEAD_H - mapH) / 2 - 6;
  const mapLeft = PAD;
  const SIDE = tall
    ? { x: PAD, y: countryY + COUNTRY_H + 30, w: WIN.w - PAD * 2 }
    : {
        x: PAD + MAP_W + 32,
        y: HEAD_H + 24,
        w: WIN.w - (PAD + MAP_W + 32) - PAD,
      };
  const feedTop = tall ? SIDE.y + 40 : SIDE.y + 180;
  const ROW = tall ? 66 : 62;

  const project = (lon: number, lat: number) => {
    const c = clamp(Math.floor((lon + 180) / CELL), 0, LAND[0].length - 1);
    const r = clamp(Math.floor((LAT_TOP - lat) / CELL), 0, LAND.length - 1);
    return { x: (c + 0.5) * PITCH, y: (r + 0.5) * PITCH_Y };
  };

  const events = [...signups].sort((a, b) => a.at - b.at);
  const landed = events.filter((e) => e.at <= frame);
  const inc = (k: number) => 1 + Math.floor(hash(k) * 3);

  let count = startCount;
  const changedAt: number[] = [];
  events.forEach((e, k) => {
    if (e.at > frame) return;
    const next = count + inc(k);
    const a = String(count);
    const b = String(next);
    for (let i = 0; i < b.length; i++) {
      if (a[a.length - 1 - i] !== b[b.length - 1 - i]) changedAt[i] = e.at;
    }
    count = next;
  });

  const win = sp(0, HEAVY);
  const winA = tween(frame, 0, 10);
  const lastAt = events.length ? events[events.length - 1].at : 120;
  const cam = tween(frame, 10, lastAt + 30, camEase);
  const blink = 0.4 + 0.6 * (0.5 + 0.5 * Math.cos((frame / 30) * Math.PI * 2));

  const heatSrc = landed.map((e) => ({
    ...project(e.lon, e.lat),
    w: tween(frame, e.at, e.at + 18),
  }));
  const hot = pal.dark ? lighten(accent, 0.28) : accent;
  const dots: React.ReactNode[] = [];
  LAND.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== "#") continue;
      const reveal = tween(frame, 4 + c * 0.12, 14 + c * 0.12);
      const cx = (c + 0.5) * PITCH;
      const cy = (r + 0.5) * PITCH_Y;
      let heat = 0;
      for (const h of heatSrc) {
        const d2 = (cx - h.x) ** 2 + (cy - h.y) ** 2;
        if (d2 < 900) heat += h.w * Math.exp(-d2 / 140);
      }
      heat = Math.min(1, heat);
      dots.push(
        <circle
          key={`${r}-${c}`}
          cx={cx}
          cy={cy}
          r={PITCH * (pal.dark ? 0.33 : 0.3)}
          fill={heat > 0.04 ? withAlpha(hot, 0.3 + 0.7 * heat) : pal.dot}
          opacity={reveal}
        />,
      );
    }
  });

  const countryTotals = countries.map(
    (c) =>
      c.count +
      events.reduce(
        (sum, e, k) =>
          sum + (e.country === c.code && e.at <= frame ? inc(k) : 0),
        0,
      ),
  );
  const maxCountry = Math.max(...countryTotals);

  const counter = (size: number, labelSize: number, onStage: boolean) => (
    <div>
      <div
        style={{
          fontSize: labelSize,
          color: onStage ? pal.stageMuted : pal.muted,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            width: labelSize * 0.45,
            height: labelSize * 0.45,
            borderRadius: 99,
            background: pal.green,
            opacity: blink,
          }}
        />
        {counterLabel}
      </div>
      <div
        style={{
          fontSize: size,
          fontWeight: 300,
          letterSpacing: "-0.045em",
          color: onStage ? pal.stageText : pal.text,
          lineHeight: 1.08,
          marginTop: 6,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            transform: `translateY(${(1 - tween(frame, 4, 18)) * 100}%)`,
          }}
        >
          <SnapCounter value={fmt(count)} changedAt={changedAt} frame={frame} />
        </div>
      </div>
      <div
        style={{
          fontSize: labelSize,
          color: pal.green,
          marginTop: 6,
          fontVariantNumeric: "tabular-nums",
          opacity: tween(frame, 12, 22),
        }}
      >
        {delta}
      </div>
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        fontWeight: 400,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
        background: pal.dark ? "#03050C" : "#EEECE8",
      }}
    >
      <GshGround
        preset={ground ?? (pal.dark ? "europa" : "paper-crease")}
        params={groundParams ?? (pal.dark ? undefined : LIGHT_GROUND)}
        timeOffset={pal.dark ? 5 : 2}
        timeScale={0.3}
      />
      <AbsoluteFill style={{ background: pal.scrim }} />
      <div
        style={{
          position: "absolute",
          left: (W - D.w * s) / 2,
          top: (H - D.h * s) / 2,
          width: D.w,
          height: D.h,
          transformOrigin: "0 0",
          transform: `scale(${s})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: `${WIN.x + mapLeft + MAP_W / 2}px ${WIN.y + mapTop + mapH / 2}px`,
            transform: `scale(${1 + 0.03 * cam})`,
          }}
        >
          {tall ? (
            <div style={{ position: "absolute", left: 48, top: 88 }}>
              {counter(132, 26, true)}
            </div>
          ) : null}
          <div
            style={{
              position: "absolute",
              left: WIN.x,
              top: WIN.y,
              width: WIN.w,
              height: WIN.h,
              opacity: winA,
              transform: `translateY(${(1 - win) * 48}px) scale(${0.97 + 0.03 * win})`,
              transformOrigin: "50% 100%",
              borderRadius: 16,
              background: pal.win,
              boxShadow: pal.winShadow,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: HEAD_H,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: `0 ${PAD}px`,
                borderBottom: `1px solid ${pal.line}`,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  color: pal.text,
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 16, color: pal.muted }}>Today</span>
            </div>

            <svg
              width={MAP_W}
              height={mapH}
              style={{
                position: "absolute",
                left: mapLeft,
                top: mapTop,
                overflow: "visible",
              }}
            >
              {dots}
              {events.map((e, k) => {
                if (k === 0) return null;
                const a = project(events[k - 1].lon, events[k - 1].lat);
                const b = project(e.lon, e.lat);
                const head = tween(frame, e.at - 12, e.at, moveEase);
                const tail = tween(frame, e.at - 3, e.at + 12, moveEase);
                if (head <= 0 || tail >= 1) return null;
                const mx = (a.x + b.x) / 2;
                const my = (a.y + b.y) / 2;
                const dist = Math.hypot(b.x - a.x, b.y - a.y);
                return (
                  <path
                    key={`arc-${e.name}`}
                    d={`M${a.x} ${a.y} Q${mx} ${my - dist * 0.32} ${b.x} ${b.y}`}
                    fill="none"
                    stroke={hot}
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={`${Math.max(0.0001, head - tail)} 2`}
                    strokeDashoffset={-tail}
                  />
                );
              })}
              {events.map((e) => {
                if (frame < e.at) return null;
                const p = project(e.lon, e.lat);
                const land = sp(e.at, CHIP);
                const ring = tween(frame, e.at, e.at + 24);
                return (
                  <g key={`city-${e.name}`}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={4 + 18 * ring}
                      fill="none"
                      stroke={hot}
                      strokeWidth={1.5}
                      opacity={0.6 * (1 - ring)}
                    />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={Math.max(0, 4 * land)}
                      fill={hot}
                      stroke={pal.win}
                      strokeWidth={1.5}
                    />
                  </g>
                );
              })}
            </svg>
            {events.map((e, k) => {
              const nextAt = events[k + 1]?.at ?? e.at + 40;
              const hold = Math.max(14, Math.min(26, nextAt - e.at + 8));
              const a = sp(e.at + 1, CHIP);
              const out = tween(frame, e.at + hold, e.at + hold + 6, exitEase);
              if (frame < e.at + 1 || out >= 1) return null;
              const p = project(e.lon, e.lat);
              return (
                <div
                  key={`label-${e.name}`}
                  style={{
                    position: "absolute",
                    left: mapLeft + p.x,
                    top: mapTop + p.y - 14,
                    transform: `translate(-50%, -100%) translateY(${(1 - a) * 8 - out * 6}px) scale(${0.8 + 0.2 * a})`,
                    transformOrigin: "50% 100%",
                    opacity: clamp(a * 2, 0, 1) * (1 - out),
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    height: 34,
                    padding: "0 12px 0 5px",
                    borderRadius: 99,
                    background: pal.chip,
                    boxShadow: pal.chipShadow,
                    fontSize: 16,
                    color: pal.text,
                    whiteSpace: "nowrap",
                    zIndex: 3,
                  }}
                >
                  <Avatar name={e.name} size={24} />
                  {e.name.split(" ")[0]}
                  <span style={{ color: pal.muted }}>{e.city}</span>
                </div>
              );
            })}

            <div
              style={{
                position: "absolute",
                left: mapLeft,
                top: countryY,
                width: MAP_W,
                height: COUNTRY_H,
                display: "flex",
                gap: 20,
              }}
            >
              {countries.map((c, i) => {
                const a = tween(frame, 10 + i * 3, 22 + i * 3);
                const bumpAt = events
                  .filter((e) => e.country === c.code && e.at <= frame)
                  .map((e) => e.at)
                  .pop();
                const bump =
                  bumpAt === undefined
                    ? 0
                    : 1 - tween(frame, bumpAt, bumpAt + 24);
                const fill = sp(10 + i * 3, CARD);
                return (
                  <div
                    key={c.code}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      opacity: a,
                      transform: `translateY(${(1 - a) * 8}px)`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        color: pal.muted,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 300,
                        color: bump > 0.35 ? accent : pal.text,
                        marginTop: 2,
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {fmt(countryTotals[i])}
                    </div>
                    <div
                      style={{
                        height: 3,
                        borderRadius: 2,
                        background: pal.line,
                        marginTop: 8,
                      }}
                    >
                      <div
                        style={{
                          width: `${(countryTotals[i] / maxCountry) * 100 * clamp(fill, 0, 1.03)}%`,
                          height: "100%",
                          borderRadius: 2,
                          background: accent,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {tall ? (
              <div
                style={{
                  position: "absolute",
                  left: PAD,
                  right: PAD,
                  top: SIDE.y - 14,
                  height: 1,
                  background: pal.line,
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  left: SIDE.x - 16,
                  top: HEAD_H,
                  bottom: 0,
                  width: 1,
                  background: pal.line,
                }}
              />
            )}
            {!tall ? (
              <div
                style={{
                  position: "absolute",
                  left: SIDE.x,
                  top: SIDE.y,
                  width: SIDE.w,
                }}
              >
                {counter(60, 16, false)}
              </div>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: SIDE.x,
                top: feedTop - 36,
                fontSize: 16,
                color: pal.muted,
              }}
            >
              Latest signups
            </div>
            <div
              style={{
                position: "absolute",
                left: SIDE.x,
                top: feedTop,
                width: SIDE.w,
                bottom: 0,
                overflow: "hidden",
                maskImage: "linear-gradient(to bottom, black 70%, transparent)",
              }}
            >
              {events.map((e, k) => {
                if (e.at > frame) return null;
                let y = 0;
                for (let j = k + 1; j < events.length; j++) {
                  if (events[j].at <= frame) y += ROW * sp(events[j].at, CARD);
                }
                if (y > ROW * 8) return null;
                const a = tween(frame, e.at + 1, e.at + 10);
                const hl = 1 - tween(frame, e.at + 6, e.at + 30, moveEase);
                return (
                  <div
                    key={`row-${e.name}`}
                    style={{
                      position: "absolute",
                      left: -10,
                      right: -10,
                      top: y,
                      height: ROW - 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "0 10px",
                      borderRadius: 10,
                      background: withAlpha(
                        accent,
                        (pal.dark ? 0.1 : 0.07) * hl,
                      ),
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        opacity: a,
                        transform: `translateY(${(1 - a) * -8}px)`,
                      }}
                    >
                      <Avatar name={e.name} size={34} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 17,
                            color: pal.text,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {e.name}
                        </div>
                        <div
                          style={{
                            fontSize: 16,
                            color: pal.muted,
                            marginTop: 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {e.city}, {e.country}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 16,
                          color:
                            e.plan && e.plan !== "Free" ? accent : pal.faint,
                        }}
                      >
                        {e.plan ?? "Free"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
