"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import type React from "react";
import { useId } from "react";
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

export interface StockScrubProps {
  ticker?: string;
  name?: string;
  /** Intraday prices, open → now. The first value is the open (the dashed baseline). */
  series?: number[];
  /** Prices for the 1Y range; rescaled so it ends on the same price as `series`. */
  yearSeries?: number[];
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  /** Four lines beside the phone: live, scrub, range, buy. */
  lines?: [string, string, string, string];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const SW = 390;
const SH = 844;
const BEZEL = 12;
const BW = SW + BEZEL * 2;
const BH = SH + BEZEL * 2;

const CH_Y = 250;
const CH_W = SW - 18;
const CH_H = 236;
const TABS_Y = 502;
const N = 96;
const TABS = ["LIVE", "1D", "1W", "1M", "1Y", "ALL"];
const TAB_W = (SW - 24) / TABS.length;
const DRAW = 8;
const PRESS = 72;
const LEFT = 112;
const RIGHT = 146;
const RELEASE = 154;
const TAB_TAP = 174;
const BUY_TAP = 214;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const DARK = {
  copy: "#f4f4f6",
  copyMuted: "rgba(244,244,246,0.52)",
  scrim: "rgba(2,3,8,0.34)",
  frame:
    "linear-gradient(155deg,#55565c 0%,#2a2b2f 30%,#3d3e43 62%,#1f2023 100%)",
  phoneShadow:
    "0 50px 100px -20px rgba(0,0,0,0.7), 0 18px 36px -12px rgba(0,0,0,0.5)",
  screen: "#000000",
  text: "#ffffff",
  muted: "#8d8d93",
  chip: "#1c1c1e",
  hair: "rgba(255,255,255,0.08)",
  up: "#30c462",
  down: "#ff5b5b",
  tabOn: "#ffffff",
  tabOnText: "#000000",
  sheet: "#1c1c1e",
  field: "#2c2c2e",
  touch: "rgba(255,255,255,0.18)",
};
const LIGHT: typeof DARK = {
  copy: "#141518",
  copyMuted: "rgba(20,21,24,0.5)",
  scrim: "rgba(243,241,237,0.3)",
  frame:
    "linear-gradient(155deg,#f1f1f3 0%,#c4c4ca 30%,#e2e2e6 62%,#b3b3ba 100%)",
  phoneShadow:
    "0 50px 90px -24px rgba(30,32,44,0.32), 0 14px 30px -10px rgba(30,32,44,0.18)",
  screen: "#ffffff",
  text: "#111317",
  muted: "#71747c",
  chip: "#f2f2f4",
  hair: "#ebebee",
  up: "#33a64a",
  down: "#e5484d",
  tabOn: "#efeff2",
  tabOnText: "#111317",
  sheet: "#ffffff",
  field: "#f2f2f4",
  touch: "rgba(17,19,23,0.16)",
};
type Palette = typeof DARK;

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function makeSeries(anchors: [number, number][], vol: number, seed: number) {
  const out: number[] = [];
  let w = 0;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const base = interpolate(
      t,
      anchors.map((a) => a[0]),
      anchors.map((a) => a[1]),
      { easing: Easing.bezier(0.45, 0, 0.55, 1) },
    );
    w = w * 0.72 + (hash(i + seed) - 0.5) * vol;
    const edge = i === 0 || i === N - 1 ? 0 : 1;
    out.push(base + w * edge);
  }
  return out;
}

const DAY = makeSeries(
  [
    [0, 180.2],
    [0.1, 181.3],
    [0.36, 176.6],
    [0.52, 178.1],
    [0.68, 181.9],
    [0.82, 180.9],
    [1, 184.32],
  ],
  1.1,
  3,
);
const YEAR = makeSeries(
  [
    [0, 121.6],
    [0.18, 132.4],
    [0.32, 125.8],
    [0.5, 147.2],
    [0.62, 140.1],
    [0.8, 165.3],
    [0.9, 171.8],
    [1, 184.32],
  ],
  6,
  41,
);

function resample(src: number[]) {
  if (src.length === N) return src;
  return Array.from({ length: N }, (_, i) => {
    const p = (i / (N - 1)) * (src.length - 1);
    const a = Math.floor(p);
    const b = Math.min(src.length - 1, a + 1);
    return src[a] + (src[b] - src[a]) * (p - a);
  });
}

const money = (v: number) => {
  const [int, dec] = Math.abs(v).toFixed(2).split(".");
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`;
};

const ICON = {
  back: "M15 5l-7 7 7 7",
  heart: "M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z",
  more: "M6 12h.01M12 12h.01M18 12h.01",
  chev: "M7 10l5 5 5-5",
};

function Glyph({
  d,
  size = 20,
  color,
  sw = 2,
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
        padding: "4px 30px 0 52px",
        zIndex: 30,
      }}
    >
      <span
        style={{ fontSize: 17, fontWeight: 400, color, letterSpacing: -0.3 }}
      >
        9:41
      </span>
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
    </div>
  );
}

function Phone({ children, c }: { children: React.ReactNode; c: Palette }) {
  const screen = c.screen;
  const home = c.text;
  const side = (s: "left" | "right", top: number, h: number) => (
    <div
      style={{
        position: "absolute",
        [s]: -2.5,
        top,
        width: 4,
        height: h,
        borderRadius: 2,
        background: c.frame,
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
          background: c.frame,
          boxShadow: `${c.phoneShadow}, inset 0 0 0 1px rgba(255,255,255,0.22)`,
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
          background: screen,
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
            zIndex: 40,
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
            background: home,
            zIndex: 40,
          }}
        />
      </div>
    </div>
  );
}

export function StockScrub({
  ticker = "RMCN",
  name = "remocn Inc.",
  series = DAY,
  yearSeries = YEAR,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
  lines = [
    "Every tick, live.",
    "Drag through the day.",
    "Zoom out to the year.",
    "Buy in two taps.",
  ],
  ground,
  groundParams,
}: StockScrubProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = frame * speed;
  const dark = theme !== "light";
  const c: Palette = dark ? DARK : LIGHT;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const tall = height > width;
  const W = tall ? 720 : 1280;
  const H = tall ? 1280 : 720;
  const u = Math.min(width / W, height / H);
  const k = tall ? (H * 0.72) / BH : (H * 0.94) / BH;
  const phoneCx = tall ? W / 2 : W * 0.68;
  const phoneCy = tall ? H - 30 - (BH * k) / 2 : H / 2;
  const sp = (at: number, config: Partial<typeof CARD> = CARD) =>
    spring({ frame: f - at, fps, config });
  const press = (at: number) =>
    Math.max(0, Math.min(1, sp(at - 1, CHIP) - sp(at + 5, CHIP)));

  const day = resample(series);
  const last = day[N - 1];
  const yr0 = resample(yearSeries);
  const year = yr0.map((v) => (v * last) / yr0[N - 1]);
  const open = day[0];

  const yOf = (arr: number[]) => {
    const lo = Math.min(...arr);
    const hi = Math.max(...arr);
    const pad = (hi - lo) * 0.12;
    return (v: number) => CH_H - ((v - lo + pad) / (hi - lo + pad * 2)) * CH_H;
  };
  const yDay = yOf(day);
  const yYear = yOf(year);
  const morph = interpolate(f, [TAB_TAP + 3, TAB_TAP + 25], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const pts = day.map((v, i) => ({
    x: (i / (N - 1)) * CH_W,
    y: yDay(v) + (yYear(year[i]) - yDay(v)) * morph,
  }));
  const line = pts
    .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${CH_W} ${CH_H} L0 ${CH_H} Z`;
  const baseY = yDay(open) + (yYear(year[0]) - yDay(open)) * morph;
  const fingerY = CH_Y + CH_H;
  const path = [
    { t: 52, x: 330, y: 700 },
    { t: PRESS, x: SW * 0.78, y: fingerY },
    { t: PRESS + 4, x: SW * 0.78, y: fingerY },
    { t: LEFT, x: SW * 0.38, y: fingerY + 6 },
    { t: LEFT + 8, x: SW * 0.38, y: fingerY + 6 },
    { t: RIGHT, x: SW * 0.9, y: fingerY - 4 },
    { t: RELEASE - 3, x: SW * 0.95, y: fingerY - 4 },
    { t: TAB_TAP, x: 12 + TAB_W * 4.5, y: TABS_Y + 16 },
    { t: TAB_TAP + 4, x: 12 + TAB_W * 4.5, y: TABS_Y + 16 },
    { t: BUY_TAP, x: SW - 82, y: SH - 64 },
  ];
  let touch = path[0];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    if (f >= a.t) {
      const e = MOVE(Math.min(1, (f - a.t) / (b.t - a.t)));
      const arc =
        Math.sin(Math.PI * e) *
        Math.min(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.12);
      touch = {
        t: f,
        x: a.x + (b.x - a.x) * e,
        y: a.y + (b.y - a.y) * e - arc,
      };
    }
  }
  const touchOpacity = interpolate(
    f,
    [path[0].t, path[0].t + 8, BUY_TAP + 4, BUY_TAP + 10],
    [0, 1, 1, 0],
    clamp,
  );
  const held = interpolate(
    f,
    [PRESS - 2, PRESS + 2, RELEASE - 2, RELEASE + 2],
    [0, 1, 1, 0],
    clamp,
  );
  const touchScale = 1 - 0.16 * Math.max(held, press(TAB_TAP), press(BUY_TAP));
  const scrubAt = (ff: number) => {
    const on = ff >= PRESS && ff < RELEASE;
    const x = interpolate(
      ff,
      [PRESS, PRESS + 4, LEFT, LEFT + 8, RIGHT, RELEASE - 3, RELEASE + 6],
      [0.78, 0.78, 0.38, 0.38, 0.9, 0.95, 1],
      { ...clamp, easing: MOVE },
    );
    const idx = Math.round(x * (N - 1));
    return { on, x: idx / (N - 1), price: day[idx] };
  };
  const priceAt = (ff: number) =>
    ff < PRESS || ff >= RELEASE + 6 ? last : scrubAt(ff).price;
  const scrub = scrubAt(f);
  const cross = interpolate(
    f,
    [PRESS - 1, PRESS + 4, RELEASE, RELEASE + 6],
    [0, 1, 1, 0],
    clamp,
  );
  const price = priceAt(f);
  const downness =
    (price < open ? 0.6 : 0) +
    (priceAt(Math.max(0, f - 1)) < open ? 0.25 : 0) +
    (priceAt(Math.max(0, f - 2)) < open ? 0.15 : 0);
  const lineColor = interpolateColors(downness, [0, 1], [c.up, c.down]);

  const base = morph > 0.5 ? year[0] : open;
  const delta = price - base;
  const pct = (delta / base) * 100;
  const scrubMin = 9.5 * 60 + scrub.x * 390;
  const hh = Math.floor(scrubMin / 60);
  const mm = Math.floor(scrubMin % 60);
  const timeLabel = `${hh > 12 ? hh - 12 : hh}:${String(mm).padStart(2, "0")} ${hh >= 12 ? "PM" : "AM"}`;
  const changeLabel =
    cross > 0.5 ? timeLabel : morph > 0.5 ? "Past year" : "Today";
  const crossX = scrub.x * CH_W;
  const rise = sp(0, HEAVY);
  const draw = interpolate(f, [DRAW, DRAW + 40], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const headIn = [0, 1, 2, 3].map((i) => sp(6 + i * 3, CARD));
  const tabX = 12 + TAB_W * (1 + 3 * sp(TAB_TAP + 1, CHIP));
  const sheet = sp(BUY_TAP + 4, HEAVY);
  const sheetRows = [0, 1, 2, 3].map((i) => sp(BUY_TAP + 10 + i * 3, CARD));
  const pulse = ((f - DRAW - 40) % 36) / 36;
  const camS = interpolate(f, [0, 270], [1, 1.03], clamp);

  const enter = (v: number, dy = 12): React.CSSProperties => ({
    opacity: Math.min(1, v * 1.4),
    transform: `translateY(${(1 - v) * dy}px)`,
  });
  const circleBtn: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 18,
    background: c.chip,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const stats: [string, string][] = [
    ["Open", money(open)],
    ["High", money(Math.max(...day))],
    ["Low", money(Math.min(...day))],
    ["Volume", "12.4M"],
    ["Mkt cap", "8.21B"],
    ["P/E ratio", "41.3"],
  ];
  const lineEnd = pts[N - 1];

  const beats = [0, PRESS - 6, TAB_TAP - 4, BUY_TAP];
  const copyLine = (i: number) => {
    const inAt = beats[i] + (i === 0 ? 8 : 0);
    const outAt = beats[i + 1];
    const pin = interpolate(f, [inAt, inAt + 14], [0, 1], {
      ...clamp,
      easing: ENTER,
    });
    const pout =
      outAt === undefined
        ? 0
        : interpolate(f, [outAt - 2, outAt + 6], [0, 1], {
            ...clamp,
            easing: EXIT,
          });
    if (pin <= 0 || pout >= 1) return null;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          transform: `translateY(${(1 - pin) * 70 - pout * 50}%)`,
          opacity: pin * (1 - pout),
        }}
      >
        {lines[i]}
      </div>
    );
  };
  const readIn = sp(18, CARD);

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={ground ?? (dark ? "velvet-hour" : "glasswork")}
        params={groundParams}
        timeOffset={dark ? 6 : 4}
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
            left: tall ? 56 : 88,
            top: tall ? 84 : H / 2 - 112,
            width: tall ? W - 112 : 480,
            height: tall ? 140 : 160,
            fontSize: tall ? 62 : 70,
            fontWeight: 300,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            color: c.copy,
            overflow: "hidden",
            textWrap: "balance",
          }}
        >
          {[0, 1, 2, 3].map((i) => copyLine(i))}
        </div>
        <div
          style={{
            position: "absolute",
            left: tall ? 56 : 88,
            top: tall ? 236 : H / 2 + 72,
            display: "flex",
            alignItems: "baseline",
            gap: 14,
            fontSize: tall ? 26 : 22,
            fontWeight: 400,
            color: c.copyMuted,
            fontVariantNumeric: "tabular-nums",
            opacity: Math.min(1, readIn * 1.4),
            transform: `translateY(${(1 - readIn) * 16}px)`,
          }}
        >
          <span>{ticker}</span>
          <span style={{ color: c.copy }}>${money(price)}</span>
          <span style={{ color: lineColor }}>
            {delta >= 0 ? "+" : "−"}
            {Math.abs(pct).toFixed(2)}%
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            left: phoneCx - BW / 2,
            top: phoneCy - BH / 2,
            width: BW,
            height: BH,
            transform: `translateY(${(1 - rise) * H * 0.9}px) scale(${k * camS})`,
          }}
        >
          <Phone c={c}>
            <StatusBar color={c.text} />
            <div
              style={{
                position: "absolute",
                top: 56,
                left: 14,
                right: 16,
                height: 44,
                display: "flex",
                alignItems: "center",
                gap: 8,
                ...enter(headIn[0]),
              }}
            >
              <Glyph d={ICON.back} size={22} color={c.text} sw={2.2} />
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg viewBox="0 0 124.06 134.26" height={14} aria-hidden>
                  <path fill="#fff" d={REMOCN_R_PATH} />
                </svg>
              </div>
              <span style={{ fontSize: 16, fontWeight: 400, color: c.text }}>
                {ticker}
              </span>
              <div style={{ flex: 1 }} />
              <div style={circleBtn}>
                <Glyph d={ICON.heart} size={18} color={c.text} sw={1.9} />
              </div>
              <div style={circleBtn}>
                <Glyph d={ICON.more} size={20} color={c.text} sw={3} />
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                top: 110,
                left: 18,
                right: 18,
                color: c.text,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 26,
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  ...enter(headIn[1]),
                }}
              >
                {name}
                <Glyph d={ICON.chev} size={18} color={c.muted} sw={2.4} />
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 34,
                  fontWeight: 400,
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                  ...enter(headIn[2]),
                }}
              >
                ${money(price)}
              </div>
              <div
                style={{
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 15,
                  fontWeight: 400,
                  color: lineColor,
                  fontVariantNumeric: "tabular-nums",
                  ...enter(headIn[3]),
                }}
              >
                <svg width={10} height={10} viewBox="0 0 10 10">
                  <path
                    d={delta >= 0 ? "M5 1l4.5 7h-9z" : "M5 9L.5 2h9z"}
                    fill={lineColor}
                  />
                </svg>
                <span>
                  {delta >= 0 ? "+" : "−"}${money(delta)} (
                  {delta >= 0 ? "+" : "−"}
                  {Math.abs(pct).toFixed(2)}%)
                </span>
                <span style={{ color: c.muted, fontWeight: 400 }}>
                  {changeLabel}
                </span>
              </div>
            </div>
            <svg
              width={SW}
              height={CH_H + 30}
              viewBox={`0 -30 ${SW} ${CH_H + 30}`}
              style={{ position: "absolute", left: 0, top: CH_Y - 30 }}
            >
              <defs>
                <linearGradient id={`${uid}a`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0"
                    stopColor={lineColor}
                    stopOpacity={dark ? 0.2 : 0.28}
                  />
                  <stop offset="1" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
                <clipPath id={`${uid}l`}>
                  <rect
                    x={-4}
                    y={-30}
                    width={4 + (cross > 0 ? crossX : SW + 8)}
                    height={CH_H + 40}
                  />
                </clipPath>
                <clipPath id={`${uid}r`}>
                  <rect
                    x={cross > 0 ? crossX : SW + 8}
                    y={-30}
                    width={SW}
                    height={CH_H + 40}
                  />
                </clipPath>
              </defs>
              <line
                x1={0}
                x2={SW}
                y1={baseY}
                y2={baseY}
                stroke={c.muted}
                strokeWidth={1.2}
                strokeDasharray="2 5"
                strokeLinecap="round"
                opacity={0.35 + cross * 0.45}
              />
              <path
                d={area}
                fill={`url(#${uid}a)`}
                opacity={draw}
                clipPath={`url(#${uid}l)`}
              />
              {(["l", "r"] as const).map((side) => (
                <path
                  key={side}
                  d={line}
                  fill="none"
                  stroke={side === "l" ? lineColor : c.muted}
                  strokeWidth={2.4}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - draw}
                  opacity={side === "l" ? 1 : 0.55}
                  clipPath={`url(#${uid}${side})`}
                />
              ))}
              {draw >= 1 && cross < 0.5 ? (
                <g>
                  <circle
                    cx={lineEnd.x}
                    cy={lineEnd.y}
                    r={4 + pulse * 12}
                    fill={lineColor}
                    opacity={(1 - pulse) * 0.35}
                  />
                  <circle
                    cx={lineEnd.x}
                    cy={lineEnd.y}
                    r={4}
                    fill={lineColor}
                  />
                </g>
              ) : null}
              {cross > 0 ? (
                <g opacity={cross}>
                  <line
                    x1={crossX}
                    x2={crossX}
                    y1={-8}
                    y2={CH_H}
                    stroke={c.muted}
                    strokeWidth={1.2}
                  />
                  <circle
                    cx={crossX}
                    cy={yDay(scrub.price)}
                    r={6.5}
                    fill={c.screen}
                    stroke={lineColor}
                    strokeWidth={3}
                  />
                  <text
                    x={Math.min(SW - 36, Math.max(36, crossX))}
                    y={-14}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={400}
                    fill={c.muted}
                    fontFamily={fontFamily}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {timeLabel}
                  </text>
                </g>
              ) : null}
            </svg>
            <div
              style={{
                position: "absolute",
                left: tabX + 4,
                top: TABS_Y,
                width: TAB_W - 8,
                height: 32,
                borderRadius: 16,
                background: c.tabOn,
                ...enter(headIn[3]),
              }}
            />
            {TABS.map((t, i) => {
              const on = Math.abs(tabX - (12 + TAB_W * i)) < TAB_W / 2;
              return (
                <div
                  key={t}
                  style={{
                    position: "absolute",
                    left: 12 + TAB_W * i,
                    top: TABS_Y,
                    width: TAB_W,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    fontSize: 14,
                    fontWeight: 400,
                    color: on ? c.tabOnText : c.muted,
                    ...enter(headIn[3]),
                  }}
                >
                  {i === 0 ? (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        background: c.up,
                      }}
                    />
                  ) : null}
                  {t}
                </div>
              );
            })}
            <div
              style={{
                position: "absolute",
                top: TABS_Y + 60,
                left: 18,
                right: 18,
                color: c.text,
                ...enter(sp(24, CARD), 20),
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 400, marginBottom: 6 }}>
                Stats
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", columnGap: 24 }}>
                {stats.map(([kk, v]) => (
                  <div
                    key={kk}
                    style={{
                      width: "calc(50% - 12px)",
                      height: 42,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: `1px solid ${c.hair}`,
                      fontSize: 15,
                    }}
                  >
                    <span style={{ color: c.muted }}>{kk}</span>
                    <span
                      style={{
                        fontWeight: 400,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {v}
                    </span>
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
                height: 112,
                padding: "14px 18px 0",
                boxSizing: "border-box",
                background: `linear-gradient(${c.screen}00, ${c.screen} 24%)`,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 13, color: c.muted }}>
                  Your position
                </span>
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 400,
                    color: c.text,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  $1,842.60
                </span>
              </div>
              <div
                style={{
                  width: 150,
                  height: 50,
                  borderRadius: 25,
                  background: accent,
                  color: "#fff",
                  fontSize: 17,
                  fontWeight: 400,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${1 - press(BUY_TAP) * 0.04})`,
                }}
              >
                Buy
              </div>
            </div>
            {sheet > 0.001 ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    opacity: Math.min(1, sheet),
                    zIndex: 20,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 452,
                    borderRadius: "30px 30px 0 0",
                    background: c.sheet,
                    transform: `translateY(${(1 - sheet) * 470}px)`,
                    padding: "10px 20px 0",
                    boxSizing: "border-box",
                    color: c.text,
                    zIndex: 21,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 5,
                      borderRadius: 3,
                      background: c.muted,
                      opacity: 0.4,
                      margin: "0 auto 18px",
                    }}
                  />
                  <div style={{ fontSize: 20, fontWeight: 400 }}>
                    Buy {ticker}
                  </div>
                  <div style={{ fontSize: 14, color: c.muted, marginTop: 4 }}>
                    Market order · ${money(last)} per share
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: 52,
                      fontWeight: 400,
                      letterSpacing: "-0.03em",
                      marginTop: 26,
                      ...enter(sheetRows[0]),
                    }}
                  >
                    $500
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: 14,
                      color: c.muted,
                      marginTop: 2,
                      ...enter(sheetRows[0]),
                    }}
                  >
                    ≈ {(500 / last).toFixed(4)} shares
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 22,
                      ...enter(sheetRows[1]),
                    }}
                  >
                    {["$100", "$250", "$500", "$1,000"].map((v) => (
                      <div
                        key={v}
                        style={{
                          flex: 1,
                          height: 38,
                          borderRadius: 19,
                          background: v === "$500" ? `${accent}26` : c.field,
                          color: v === "$500" ? accent : c.text,
                          boxShadow:
                            v === "$500"
                              ? `inset 0 0 0 1.5px ${accent}`
                              : "none",
                          fontSize: 15,
                          fontWeight: 400,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {v}
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 15,
                      marginTop: 22,
                      paddingTop: 14,
                      borderTop: `1px solid ${c.hair}`,
                      ...enter(sheetRows[2]),
                    }}
                  >
                    <span style={{ color: c.muted }}>Buying power</span>
                    <span style={{ fontWeight: 400 }}>$2,140.18</span>
                  </div>
                  <div
                    style={{
                      marginTop: 22,
                      height: 54,
                      borderRadius: 27,
                      background: accent,
                      color: "#fff",
                      fontSize: 17,
                      fontWeight: 400,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ...enter(sheetRows[3]),
                    }}
                  >
                    Review order
                  </div>
                </div>
              </>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: touch.x - 23,
                top: touch.y - 23,
                width: 46,
                height: 46,
                borderRadius: 23,
                background: c.touch,
                boxShadow: dark
                  ? "inset 0 0 0 1.5px rgba(255,255,255,0.7)"
                  : "inset 0 0 0 1.5px rgba(255,255,255,0.9), 0 4px 14px rgba(0,0,0,0.18)",
                opacity: touchOpacity,
                transform: `scale(${touchScale})`,
                zIndex: 35,
              }}
            />
          </Phone>
        </div>
      </div>
    </AbsoluteFill>
  );
}
