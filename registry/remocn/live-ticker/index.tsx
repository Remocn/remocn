"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600. */
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

export interface LiveTickerProps {
  /** Where the counter lands and freezes. */
  value?: number;
  /** Serif italic word under the frozen number. */
  unit?: string;
  /** Product after "on"; "remocn" renders the real logo. */
  name?: string;
  /** Replaces the logo / name in the label. */
  logo?: React.ReactNode;
  /** Small caps tag above the number while it runs. */
  kicker?: string;
  /** Customer names riding the transaction pills. */
  feed?: string[];
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

// Geist (wght 300) figures with `tnum`: every digit advances 0.6em, the comma 0.188em.
const DIGIT_ADV = 0.6;
const COMMA_ADV = 0.19;
const TRACK = -0.035;
const CAP = 0.71;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Beat sheet (30fps, speed 1):
//   0–18   columns rise into place one by one, already ticking; streams running
//   0–70   full rate: the low digits smear, pills and dots slide in from both
//          edges and get swallowed by the number, each one a small bump
//  70–104  streams dry up, the rate brakes, columns settle one by one
//   104    frozen on `value`; label rises under it, poster holds to the end
const BRAKE_AT = 70;
const FREEZE_AT = 104;
const LAST_SPAWN = 70;
/** Digits per frame above which a column flips instead of rolling. */
const FAST = 0.2;

// gradients.sh "mesh" (bg #0a0d24): #ecdcf2 #8796ee #2e45b7 #0e1645.
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: [243, 242, 239] as const,
    base: "#8796EE",
    blobs: ["#ECDCF2", "#8796EE", "#ECDCF2", "#5D72E4"],
    flash: "#FFFFFF",
    band: ["#2E45B7", "#8796EE", "#2E45B7"],
    bandAlpha: 0.42,
    pillFill: "#18181B",
    pillLine: "rgba(243,242,239,0.16)",
    pillText: "rgba(243,242,239,0.74)",
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    hair: [18, 18, 20] as const,
    base: "#2E45B7",
    blobs: ["#0E1645", "#2E45B7", "#5D72E4", "#1B2A7A"],
    flash: "#8796EE",
    band: ["#C4CBF6", "#ECDCF2", "#C4CBF6"],
    bandAlpha: 0.6,
    pillFill: "#FFFFFF",
    pillLine: "rgba(18,18,20,0.14)",
    pillText: "rgba(18,18,20,0.72)",
    grain: 0.035,
  },
} as const;

const FORMATS = ["4K", "1080p", "9:16", "60fps", "ProRes", "1:1"];

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smooth(x: number) {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

function bez(a: number, b: number, c: number, d: number, s: number) {
  const m = 1 - s;
  return m * m * m * a + 3 * m * m * s * b + 3 * m * s * s * c + s * s * s * d;
}

interface Lane {
  side: 0 | 1;
  /** start, in frame fractions */
  x0: number;
  y0: number;
  /** enters from the side edge (h) or from the top/bottom edge (v) */
  from: "h" | "v";
  /** landing height on the number, in cap heights from its middle */
  off: number;
  /** carries labelled pills between its dots */
  pills: boolean;
}

// Five lanes per side fanning into the number's ends; the outer ones start
// at the top and bottom edges so the streams fill the frame.
const LANES: Lane[] = [
  { side: 0, x0: -0.02, y0: 0.5, from: "h", off: 0, pills: false },
  { side: 0, x0: -0.02, y0: 0.27, from: "h", off: -0.22, pills: false },
  { side: 0, x0: 0.135, y0: -0.05, from: "v", off: -0.44, pills: true },
  { side: 0, x0: -0.02, y0: 0.74, from: "h", off: 0.22, pills: false },
  { side: 0, x0: 0.155, y0: 1.05, from: "v", off: 0.44, pills: true },
  { side: 1, x0: 1.02, y0: 0.44, from: "h", off: 0, pills: false },
  { side: 1, x0: 0.86, y0: -0.05, from: "v", off: -0.44, pills: true },
  { side: 1, x0: 1.02, y0: 0.2, from: "h", off: -0.22, pills: false },
  { side: 1, x0: 1.02, y0: 0.7, from: "h", off: 0.22, pills: false },
  { side: 1, x0: 0.875, y0: 1.05, from: "v", off: 0.44, pills: true },
];

interface Item {
  lane: number;
  spawn: number;
  dur: number;
  pill: boolean;
  text: string;
  bump: number;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function LiveTicker({
  value = 12480312,
  unit = "renders",
  name = "remocn",
  logo,
  kicker = "Live",
  feed = ["Lumen", "Kite", "Orbit", "Halden", "Nova", "Ferro", "Vela", "Pico"],
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: LiveTickerProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const p = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const target = Math.max(0, Math.round(value));
  const n = String(target).length;
  // column x offsets in em, commas between thousands groups
  const cols = useMemo(() => {
    const out: Array<{ x: number; place: number }> = [];
    const commas: Array<{ x: number; col: number }> = [];
    let x = 0;
    for (let i = 0; i < n; i++) {
      const place = n - 1 - i;
      out.push({ x, place });
      x += DIGIT_ADV + TRACK;
      if (place > 0 && place % 3 === 0) {
        commas.push({ x, col: i });
        x += COMMA_ADV + TRACK;
      }
    }
    return { out, commas, width: x - TRACK };
  }, [n]);

  const fs = Math.min((W * 0.64) / cols.width, H * 0.32);
  const numW = cols.width * fs;
  const numLeft = (W - numW) / 2;
  const cap = CAP * fs;
  const lift = interpolate(t, [FREEZE_AT, FREEZE_AT + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const baseline = H * 0.555 - lift * 24 * u;
  const numTop = baseline - cap;
  const cy = baseline - cap / 2;

  // ---------------------------------------------------------------- feed
  const rise = Math.min(target * 0.05, 6000);
  const scale = rise / 6000;

  const items = useMemo(() => {
    const out: Item[] = [];
    let k = 0;
    LANES.forEach((lane, li) => {
      const dur = 34 + Math.floor(hash(li * 3.1 + 2) * 10);
      // dots: a quick steady stream
      const dotGap = 7 + Math.floor(hash(li * 7.3) * 5);
      for (
        let s = -dur + Math.floor(hash(li * 1.7) * dotGap);
        s <= LAST_SPAWN + 6;
        s += dotGap
      ) {
        out.push({ lane: li, spawn: s, dur, pill: false, text: "", bump: 30 });
      }
      if (!lane.pills) return;
      const period = 24 + Math.floor(hash(li * 5.3 + 1) * 10);
      for (
        let s = -dur + Math.floor(hash(li * 1.9 + 5) * period) + 3;
        s <= LAST_SPAWN;
        s += period
      ) {
        const count = 1 + Math.floor(hash(k * 5.7) * 3);
        out.push({
          lane: li,
          spawn: s,
          dur,
          pill: true,
          text: `+${count} · ${feed[k % Math.max(1, feed.length)] ?? ""} · ${FORMATS[(k * 7) % FORMATS.length]}`,
          bump: 120 + 60 * count,
        });
        k++;
      }
    });
    return out;
  }, [feed]);

  // ---------------------------------------------------------------- value
  const r0 = 34 * scale;
  const brakeLen = FREEZE_AT - BRAKE_AT;
  const baseRemaining = (tt: number) => {
    if (tt >= FREEZE_AT) return 0;
    if (tt >= BRAKE_AT)
      return (r0 * (FREEZE_AT - tt) ** 3) / (3 * brakeLen ** 2);
    return r0 * (BRAKE_AT - tt) + (r0 * brakeLen) / 3;
  };
  const hits = items
    .map((it) => ({ at: it.spawn + it.dur, amt: it.bump * scale, it }))
    .filter((h) => h.at < FREEZE_AT - 8);
  const valueAt = (tt: number) => {
    let rem = baseRemaining(tt);
    for (const h of hits) {
      const k = Math.max(0, Math.min(1, (tt - h.at) / 6));
      rem += h.amt * (1 - EASE_OUT(k));
    }
    return target - rem;
  };

  /**
   * Column position in digits. Slow columns sit still and snap to the next
   * digit in ~6 frames; fast ones flip a whole digit per frame (no half-rolled
   * glyphs on a paused frame) and smear vertically instead.
   */
  const rate = (tt: number, place: number) =>
    Math.abs(valueAt(tt + 0.5) - valueAt(tt - 0.5)) / 10 ** place;
  const columnPos = (tt: number, place: number) => {
    const x = valueAt(tt) / 10 ** place;
    const v = rate(tt, place);
    const w = Math.min(1, Math.max(0.0001, 4.5 * v));
    const f = x - Math.floor(x);
    if (v >= FAST) return Math.floor(x);
    return Math.floor(x) + smooth((f - (1 - w)) / w);
  };

  // hits light the number's end they enter, and nudge it a hair
  const flash = [0, 0];
  let nudge = 0;
  for (const h of hits) {
    const d = t - h.at;
    if (d < 0 || d > 14) continue;
    const e = Math.exp(-d / 4) * (h.it.pill ? 1 : 0.4);
    const side = LANES[h.it.lane].side;
    flash[side] = Math.max(flash[side], e);
    nudge += Math.sin(Math.min(1, d / 10) * Math.PI) * (h.it.pill ? 1 : 0.35);
  }
  nudge = Math.min(nudge, 1.5);

  // ---------------------------------------------------------------- beats
  const settled = t >= FREEZE_AT;
  const kickIn = interpolate(t, [0, 14], [0.25, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const label = (d: number) =>
    interpolate(t, [FREEZE_AT + 2 + d, FREEZE_AT + 22 + d], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const streamsOut = interpolate(
    t,
    [FREEZE_AT - 12, FREEZE_AT + 16],
    [1, 0.45],
    {
      ...CLAMP,
      easing: EASE_IO,
    },
  );
  const drift = interpolate(t, [0, 150], [0, 1], CLAMP);

  // pills disappear into the number's ends
  const edgeL = numLeft - 0.012 * W;
  const edgeR = numLeft + numW + 0.012 * W;
  const feather = 46 * u;

  const lanePts = (lane: Lane) => {
    const x0 = lane.x0 * W;
    const y0 = lane.y0 * H;
    const x3 = lane.side === 0 ? edgeL + feather : edgeR - feather;
    const y3 = cy + lane.off * cap;
    const x1 = lane.from === "h" ? x0 + (x3 - x0) * 0.5 : x0;
    const y1 = lane.from === "h" ? y0 : y0 + (y3 - y0) * 0.75;
    const x2 = x3 - (x3 - x0) * 0.48;
    return { x0, y0, x1, y1, x2, y2: y3, x3, y3 };
  };
  const at = (lane: Lane, s: number) => {
    const q = lanePts(lane);
    return {
      x: bez(q.x0, q.x1, q.x2, q.x3, s),
      y: bez(q.y0, q.y1, q.y2, q.y3, s),
    };
  };

  const pillH = 28 * u;
  const pillFs = 13 * u;
  const pillW = (it: Item) =>
    it.pill ? it.text.length * 0.6 * pillFs + 34 * u : 0;
  /** Where an item is now; past the lane's end it keeps its speed into the sink. */
  const itemPoint = (it: Item) => {
    const lane = LANES[it.lane];
    const life = (t - it.spawn) / it.dur;
    if (life <= 0) return null;
    if (life < 1) return { ...at(lane, life ** 1.15), s: life ** 1.15 };
    const q = lanePts(lane);
    const vEnd = (3 * 1.15 * Math.abs(q.x3 - q.x2)) / it.dur;
    const over = (t - it.spawn - it.dur) * vEnd;
    if (over > feather + 12 * u) return null;
    return { x: q.x3 + (lane.side === 0 ? 1 : -1) * over, y: q.y3, s: 1 };
  };

  // ---------------------------------------------------------------- render
  const blobs = [
    { x: 0.16 + 0.06 * drift, y: 0.2, r: 0.55 },
    { x: 0.84 - 0.05 * drift, y: 0.3, r: 0.5 },
    { x: 0.62 - 0.08 * drift, y: 0.9, r: 0.45 },
    { x: 0.3 + 0.1 * drift, y: 0.85, r: 0.4 },
  ];
  const gx = (k: number) => numLeft + numW * k;
  const gy = (k: number) => numTop - cap * 0.2 + cap * 1.4 * k;
  const step = cap + 0.2 * fs;
  const hair = (a: number) =>
    `rgba(${p.hair[0]},${p.hair[1]},${p.hair[2]},${a})`;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        role="img"
        aria-label={`${target.toLocaleString("en-US")} ${unit}`}
      >
        <defs>
          {blobs.map((b, i) => (
            <radialGradient
              key={`b${b.r}`}
              id={`${uid}b${i}`}
              gradientUnits="userSpaceOnUse"
              cx={gx(b.x)}
              cy={gy(b.y)}
              r={numW * b.r}
            >
              <stop offset="0" stopColor={p.blobs[i]} />
              <stop offset="0.7" stopColor={p.blobs[i]} stopOpacity={0} />
            </radialGradient>
          ))}
          {[0, 1].map((side) => (
            <radialGradient
              key={`f${side}`}
              id={`${uid}f${side}`}
              gradientUnits="userSpaceOnUse"
              cx={side === 0 ? numLeft : numLeft + numW}
              cy={cy}
              r={fs * 1.4}
            >
              <stop offset="0" stopColor={p.flash} stopOpacity={0.9} />
              <stop offset="1" stopColor={p.flash} stopOpacity={0} />
            </radialGradient>
          ))}
          {/* the band: the same palette, wide and low, behind the number */}
          {p.band.map((c, i) => (
            <radialGradient
              key={`band${c}${i}`}
              id={`${uid}band${i}`}
              gradientUnits="userSpaceOnUse"
              cx={W * (0.26 + 0.24 * i + 0.04 * Math.sin(drift * 3 + i * 2))}
              cy={cy}
              r={W * (i === 1 ? 0.22 : 0.34)}
              gradientTransform={`translate(0 ${cy}) scale(1 0.3) translate(0 ${-cy})`}
            >
              <stop offset="0" stopColor={c} />
              <stop offset="1" stopColor={c} stopOpacity={0} />
            </radialGradient>
          ))}
          <linearGradient id={`${uid}feather`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.12" stopColor="#fff" />
            <stop offset="0.88" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <linearGradient
            id={`${uid}sink`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={W}
            y2={0}
          >
            <stop offset={(edgeL - feather) / W} stopColor="#fff" />
            <stop offset={edgeL / W} stopColor="#000" />
            <stop offset={edgeR / W} stopColor="#000" />
            <stop offset={(edgeR + feather) / W} stopColor="#fff" />
          </linearGradient>
          <mask
            id={`${uid}streams`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <rect width={W} height={H} fill={`url(#${uid}sink)`} />
          </mask>
          <mask
            id={`${uid}win`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <rect
              x={0}
              y={numTop - 0.1 * fs}
              width={W}
              height={cap + 0.2 * fs}
              fill={`url(#${uid}feather)`}
            />
          </mask>
          {cols.out.map((c) => {
            const v = settled ? 0 : rate(t, c.place);
            const roll = Math.abs(
              columnPos(t + 0.5, c.place) - columnPos(t - 0.5, c.place),
            );
            const sd =
              (v >= FAST
                ? Math.min(0.04, 0.008 + v * 0.01)
                : Math.min(0.04, roll * 0.12 * (settled ? 0 : 1))) * fs;
            return (
              <filter
                key={`blur${c.place}`}
                id={`${uid}blur${c.place}`}
                filterUnits="userSpaceOnUse"
                x={0}
                y={0}
                width={W}
                height={H}
              >
                <feGaussianBlur stdDeviation={`0 ${sd.toFixed(2)}`} />
              </filter>
            );
          })}
          <mask
            id={`${uid}num`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <g
              fill="#fff"
              fontFamily={sans}
              fontWeight={300}
              fontSize={fs}
              textAnchor="middle"
              style={{ fontVariantNumeric: "tabular-nums" }}
              transform={`translate(0 ${-nudge * 2.2 * u})`}
            >
              <g mask={`url(#${uid}win)`}>
                {cols.out.map((c, i) => {
                  const enter = interpolate(
                    t,
                    [i * 1.5 - 14, i * 1.5 + 6],
                    [0, 1],
                    { ...CLAMP, easing: EASE_OUT },
                  );
                  const pos = settled
                    ? Math.floor(target / 10 ** c.place)
                    : columnPos(t, c.place);
                  const base = Math.floor(pos);
                  const f = pos - base;
                  const cx = numLeft + (c.x + DIGIT_ADV / 2) * fs;
                  const digit = (d: number) => ((d % 10) + 10) % 10;
                  return (
                    <g
                      key={`c${c.place}`}
                      opacity={enter}
                      filter={`url(#${uid}blur${c.place})`}
                      transform={`translate(0 ${(1 - enter) * 0.6 * fs - f * step})`}
                    >
                      <text x={cx} y={baseline}>
                        {digit(base)}
                      </text>
                      {f > 0.001 ? (
                        <text x={cx} y={baseline + step}>
                          {digit(base + 1)}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </g>
              {cols.commas.map((c) => {
                const enter = interpolate(
                  t,
                  [c.col * 1.5 - 13, c.col * 1.5 + 7],
                  [0, 1],
                  { ...CLAMP, easing: EASE_OUT },
                );
                return (
                  <text
                    key={`comma${c.x}`}
                    x={numLeft + (c.x + COMMA_ADV / 2) * fs}
                    y={baseline + (1 - enter) * 0.3 * fs}
                    opacity={enter}
                  >
                    ,
                  </text>
                );
              })}
            </g>
          </mask>
        </defs>

        {/* gradient band behind the number */}
        <g opacity={p.bandAlpha * kickIn}>
          {p.band.map((c, i) => (
            <rect
              key={`bandr${c}${i}`}
              width={W}
              height={H}
              fill={`url(#${uid}band${i})`}
            />
          ))}
        </g>

        <g mask={`url(#${uid}streams)`}>
          {/* lanes */}
          <g fill="none" opacity={streamsOut}>
            {LANES.map((lane) => {
              const q = lanePts(lane);
              return (
                <path
                  key={`lane${lane.side}${lane.y0}`}
                  d={`M${q.x0} ${q.y0} C${q.x1} ${q.y1} ${q.x2} ${q.y2} ${q.x3} ${q.y3} L${lane.side === 0 ? edgeL + 1 : edgeR - 1} ${q.y3}`}
                  stroke={hair(lane.pills ? 0.15 : 0.1)}
                  strokeWidth={Math.max(1, u)}
                />
              );
            })}
          </g>

          {/* dots under the pills */}
          {items.map((it, k) => {
            if (it.pill) return null;
            const pt = itemPoint(it);
            if (!pt) return null;
            const acc = k % 4 === 0;
            return (
              <circle
                key={`d${it.lane}-${it.spawn}`}
                cx={pt.x}
                cy={pt.y}
                r={(acc ? 3.4 : 2.6) * u}
                fill={acc ? accent : p.fg}
                opacity={acc ? 1 : 0.5}
              />
            );
          })}
          {/* pills: read on the way in, then fold into a dot */}
          <g fontFamily={mono} fontSize={pillFs} fontWeight={400}>
            {items.map((it) => {
              if (!it.pill) return null;
              const pt = itemPoint(it);
              if (!pt) return null;
              const dir = LANES[it.lane].side === 0 ? 1 : -1;
              const fullW = pillW(it);
              const c = smooth((pt.s - 0.58) / 0.26);
              const dotD = 7 * u;
              const w = fullW + (dotD - fullW) * c;
              const h = pillH + (dotD - pillH) * smooth((pt.s - 0.7) / 0.14);
              // the leading edge rides the lane, the pill folds up behind it
              const x = dir === 1 ? pt.x - w : pt.x;
              const textX = dir === 1 ? 24 * u - (fullW - w) : 24 * u;
              return (
                <g
                  key={`p${it.lane}-${it.spawn}`}
                  transform={`translate(0 ${pt.y})`}
                >
                  <rect
                    x={x}
                    y={-h / 2}
                    width={w}
                    height={h}
                    rx={h / 2}
                    fill={p.pillFill}
                    stroke={p.pillLine}
                    strokeWidth={Math.max(1, u) * (1 - c)}
                  />
                  <rect
                    x={x}
                    y={-h / 2}
                    width={w}
                    height={h}
                    rx={h / 2}
                    fill={accent}
                    opacity={smooth((c - 0.5) / 0.5)}
                  />
                  <svg
                    x={x}
                    y={-h / 2}
                    width={w}
                    height={h}
                    overflow="hidden"
                    opacity={1 - smooth((c - 0.2) / 0.6)}
                  >
                    <circle
                      cx={textX - 10 * u}
                      cy={h / 2}
                      r={3 * u}
                      fill={accent}
                    />
                    <text
                      x={textX}
                      y={h / 2 + pillFs * 0.36}
                      fill={p.pillText}
                      style={{ whiteSpace: "pre" }}
                    >
                      {it.text}
                    </text>
                  </svg>
                </g>
              );
            })}
          </g>
        </g>

        {/* the number: mesh gradient poured through the digits */}
        <g mask={`url(#${uid}num)`}>
          <rect width={W} height={H} fill={p.base} />
          {blobs.map((b, i) => (
            <rect
              key={`nb${b.r}`}
              width={W}
              height={H}
              fill={`url(#${uid}b${i})`}
            />
          ))}
          {[0, 1].map((side) => (
            <rect
              key={`fl${side}`}
              width={W}
              height={H}
              fill={`url(#${uid}f${side})`}
              opacity={flash[side] * 0.75}
            />
          ))}
        </g>
      </svg>

      {/* kicker */}
      <div
        style={{
          position: "absolute",
          left: numLeft + 0.04 * fs,
          top: numTop - 0.3 * fs - 13 * u,
          display: "flex",
          alignItems: "center",
          gap: 11 * u,
          fontFamily: mono,
          fontWeight: 500,
          fontSize: 13 * u,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: p.fg,
          opacity: kickIn,
          lineHeight: 1,
        }}
      >
        <div
          style={{
            width: 8 * u,
            height: 8 * u,
            borderRadius: 99,
            background: accent,
            opacity: settled ? 1 : 0.6 + 0.4 * Math.cos((t / 24) * Math.PI * 2),
            boxShadow: `0 0 0 ${4 * u}px ${accent}38`,
          }}
        />
        <span>{kicker}</span>
      </div>

      {/* poster label */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: baseline + 0.22 * fs,
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          gap: 15 * u,
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 60 * u,
            letterSpacing: "-0.01em",
            color: p.fg,
            opacity: label(0),
            transform: `translateY(${(1 - label(0)) * 16 * u}px)`,
          }}
        >
          {unit}
        </span>
        <span
          style={{
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 34 * u,
            letterSpacing: "-0.02em",
            color: p.muted,
            opacity: label(4),
            transform: `translateY(${(1 - label(4)) * 16 * u}px)`,
          }}
        >
          on
        </span>
        <div
          style={{
            opacity: label(7),
            transform: `translateY(${(1 - label(7)) * 16 * u}px)`,
          }}
        >
          {logo ??
            (name.trim().toLowerCase() === "remocn" ? (
              <RemocnLogo fontSize={38 * u} color={p.fg} />
            ) : (
              <span
                style={{
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: 38 * u,
                  letterSpacing: "-0.03em",
                  color: p.fg,
                }}
              >
                {name}
              </span>
            ))}
        </div>
      </div>

      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
