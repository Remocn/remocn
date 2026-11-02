"use client";

import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface CandleRallyProps {
  /** Ticker on the price tag riding the last wick. Fictional. */
  symbol?: string;
  /** Where the last candle closes; printed on the tag. */
  price?: number;
  /** The previous high the rally breaks through (dashed level). */
  prevHigh?: number;
  /** First line of the slam. */
  headline?: string;
  /** Second line of the slam. */
  headline2?: string;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_PUSH = Easing.bezier(0.42, 0, 0.18, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Beat sheet (30fps, speed 1):
//   0–48   ten small candles chop sideways, one every 4 frames
//  50–82   the rally: five green candles, 6 frames apart, each bigger
//  82–108  the last candle pushes up huge and fills with the aurora gradient;
//          the price tag rides its wick and breaks the dashed previous high
// 110–122  ALL-TIME / HIGH slams in, the candles fall back behind it
// 122–     poster holds
const RALLY_AT = 50;
const FINAL_AT = 82;
const FINAL_LEN = 26;
const SLAM = 110;

// Candles as [open, close, high, low]; the last close is replaced by `price`.
const CHOP: Array<[number, number, number, number]> = [
  [63.5, 66.5, 68, 62],
  [66.5, 63, 67.5, 61.5],
  [65.5, 62, 66.5, 60.5],
  [62, 65, 66, 61],
  [65, 62.5, 66.5, 61.5],
  [62.5, 66, 67.5, 61.5],
  [66, 63.5, 67.5, 62.5],
  [63.5, 65.5, 66.5, 62.5],
];
const RALLY: Array<[number, number, number, number]> = [
  [63, 66.5, 67.5, 62.5],
  [66.5, 71, 72, 65.5],
  [71, 77.5, 79, 70],
  [77.5, 87, 88.5, 76.5],
  [87, 99.5, 101.5, 86],
];
// The y-range auto-scales like a live chart: tight on the chop, pulled
// open by the rally so the newest high always rides near the top.
const LO = 58.5;
const HI_MIN = 70;

// gradients.sh "aurora" (bg #03050b): #a0f0c8 #3fb5a3 #5147b6 #b25c9c.
const AURORA = ["#A0F0C8", "#3FB5A3", "#5147B6", "#B25C9C"];
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#77767C",
    hair: "rgba(243,242,239,0.08)",
    up: "#4FC8AE",
    down: "#E4604E",
    tagInk: "#06140F",
    ground: 0.55,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#8A8883",
    hair: "rgba(18,18,20,0.08)",
    up: "#169C82",
    down: "#D44A37",
    tagInk: "#06140F",
    ground: 0.14,
  },
} as const;

export function CandleRally({
  symbol = "RMCN",
  price = 128.4,
  prevHigh = 112,
  headline = "All-time",
  headline2 = "high",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: CandleRallyProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const p = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  // ---- candle slots: chop narrow and even, rally widening, last one huge ---
  const finalCandle: [number, number, number, number] = [
    99.5,
    price,
    price + 1.6,
    98.5,
  ];
  const all = [...CHOP, ...RALLY, finalCandle];
  const widths = all.map((_, i) =>
    i < CHOP.length
      ? 0.03
      : i < all.length - 1
        ? 0.032 + (i - CHOP.length) * 0.004
        : 0.09,
  );
  const gaps = all.map((_, i) =>
    i < CHOP.length
      ? 0.022
      : i < all.length - 1
        ? 0.024 + (i - CHOP.length) * 0.003
        : 0.04,
  );
  const xs: number[] = [];
  {
    let x = 0.065;
    all.forEach((_, i) => {
      if (i > 0) x += widths[i - 1] / 2 + gaps[i] + widths[i] / 2;
      xs.push(x);
    });
  }
  // fit the run so the last candle sits at ~84% of the width
  const fit = (0.84 - 0.065) / (xs[xs.length - 1] - 0.065);

  const startOf = (i: number) =>
    i < CHOP.length
      ? 4 + i * 5
      : i < all.length - 1
        ? RALLY_AT + (i - CHOP.length) * 6
        : FINAL_AT;
  const lenOf = (i: number) =>
    i < CHOP.length
      ? 8
      : i < all.length - 1
        ? 9 + (i - CHOP.length)
        : FINAL_LEN;

  const fi = all.length - 1;
  const cx = (i: number) => W * (0.065 + (xs[i] - 0.065) * fit * zx);
  const cw = (i: number) => W * widths[i] * fit * zx;
  const kOf = (i: number, tt: number) => {
    const r = Math.max(0, Math.min(1, (tt - startOf(i)) / lenOf(i)));
    return i === fi ? EASE_PUSH(r) : EASE_OUT(r);
  };
  // the auto-scaling range follows the highest wick so far, box-filtered
  // over a few frames so each new candle pumps the scale smoothly
  const topAt = (tt: number) => {
    let m = HI_MIN;
    all.forEach(([o, c, h], i) => {
      if (tt < startOf(i)) return;
      const k = kOf(i, tt);
      const cur = o + (c - o) * k;
      m = Math.max(m, Math.max(o, cur) + (h - Math.max(o, c)) * k);
    });
    return m;
  };
  let hiSum = 0;
  for (let k = 0; k < 6; k++) {
    const top = topAt(t - k);
    hiSum += Math.max(HI_MIN, top + (top - LO) * 0.12);
  }
  const topNow = topAt(t);
  const hi = Math.max(hiSum / 6, topNow + (topNow - LO) * 0.05);
  const lo = LO - (hi - HI_MIN) * 0.03;
  const yOf = (v: number) => H * 0.88 - ((v - lo) / (hi - lo)) * H * 0.76;
  // the camera pulls back as the rally needs the room
  const zx = interpolate(t, [0, RALLY_AT - 4, FINAL_AT + 16], [1.5, 1.42, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const slam1 = interpolate(t, [SLAM, SLAM + 7], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const slam2 = interpolate(t, [SLAM + 4, SLAM + 11], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const dim = interpolate(t, [SLAM, SLAM + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  // one impact: the chart dips on the slam and settles
  const hit =
    interpolate(t, [SLAM + 1, SLAM + 3, SLAM + 16], [0, 1, 0], {
      ...CLAMP,
      easing: EASE_OUT,
    }) *
    10 *
    u;

  // last candle's live close, the tag reads it
  const fk = EASE_PUSH(Math.max(0, Math.min(1, (t - FINAL_AT) / FINAL_LEN)));
  const live = finalCandle[0] + (finalCandle[1] - finalCandle[0]) * fk;
  const broke = live >= prevHigh;
  const breakAt = (() => {
    // frame where the live close crosses the previous high
    for (let f = FINAL_AT; f <= FINAL_AT + FINAL_LEN; f += 0.25) {
      const k = EASE_PUSH(Math.min(1, (f - FINAL_AT) / FINAL_LEN));
      if (finalCandle[0] + (finalCandle[1] - finalCandle[0]) * k >= prevHigh)
        return f;
    }
    return FINAL_AT + FINAL_LEN;
  })();
  const levelIn = interpolate(t, [6, 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const levelFlash = interpolate(
    t,
    [breakAt, breakAt + 2, breakAt + 16],
    [0, 1, 0],
    CLAMP,
  );
  const levelOut = interpolate(
    t,
    [breakAt + 6, breakAt + 22],
    [1, 0.35],
    CLAMP,
  );
  const ground = interpolate(t, [FINAL_AT, FINAL_AT + FINAL_LEN + 10], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const gradK = interpolate(t, [FINAL_AT + 6, FINAL_AT + FINAL_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const candle = (i: number) => {
    const [o, c, h, l] = all[i];
    const s = startOf(i);
    const k = EASE_OUT(Math.max(0, Math.min(1, (t - s) / lenOf(i))));
    const isFinal = i === all.length - 1;
    const kk = isFinal ? fk : k;
    if (t < s) return null;
    const cur = o + (c - o) * kk;
    const top = Math.max(o, cur) + (h - Math.max(o, c)) * kk;
    const bot = Math.min(o, cur) - (Math.min(o, c) - l) * kk;
    const x = cx(i);
    const w = cw(i);
    const yA = yOf(Math.max(o, cur));
    const yB = yOf(Math.min(o, cur));
    const bodyH = Math.max(2 * u, yB - yA);
    const color = c >= o ? p.up : p.down;
    const appear = interpolate(t, [s, s + 2], [0, 1], CLAMP);
    const wick = Math.max(1.5 * u, w * (isFinal ? 0.05 : 0.09));
    const fade = isFinal ? 1 : 1 - dim * 0.78;
    return (
      <g key={i} opacity={appear * fade}>
        <rect
          x={x - wick / 2}
          y={yOf(top)}
          width={wick}
          height={yOf(bot) - yOf(top)}
          fill={isFinal ? `url(#${uid}wick)` : color}
        />
        <rect
          x={x - w / 2}
          y={yA - (bodyH - (yB - yA)) / 2}
          width={w}
          height={bodyH}
          rx={Math.min(w * 0.08, 4 * u)}
          fill={color}
        />
        {isFinal ? (
          <rect
            x={x - w / 2}
            y={yA}
            width={w}
            height={bodyH}
            rx={Math.min(w * 0.08, 4 * u)}
            fill={`url(#${uid}aurora)`}
            opacity={gradK}
          />
        ) : null}
      </g>
    );
  };

  const fx = cx(fi);
  const fw = cw(fi);
  const wickTop = yOf(
    Math.max(finalCandle[0], live) +
      (finalCandle[2] - Math.max(finalCandle[0], finalCandle[1])) * fk,
  );
  const tagIn = interpolate(t, [FINAL_AT + 2, FINAL_AT + 10], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const tagH = 44 * u;
  const tagFont = 21 * u;
  const levelY = yOf(prevHigh);
  const S = H * 0.3;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      {/* aurora ground behind the breakout */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: ground * p.ground,
          background: [
            `radial-gradient(34% 62% at 84% 26%, color-mix(in oklab, ${AURORA[0]} 55%, transparent) 0%, transparent 70%)`,
            `radial-gradient(40% 70% at 72% 40%, color-mix(in oklab, ${AURORA[2]} 45%, transparent) 0%, transparent 72%)`,
          ].join(", "),
        }}
      />

      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        role="img"
        aria-label={`${symbol} candles rally to ${price.toFixed(2)}, ${headline} ${headline2}`}
      >
        <defs>
          <linearGradient
            id={`${uid}aurora`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={yOf(finalCandle[1])}
            x2={0}
            y2={yOf(finalCandle[0])}
          >
            {AURORA.map((c, i) => (
              <stop key={c} offset={i / (AURORA.length - 1)} stopColor={c} />
            ))}
          </linearGradient>
          <linearGradient
            id={`${uid}wick`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={yOf(finalCandle[2])}
            x2={0}
            y2={yOf(finalCandle[3])}
          >
            <stop offset={0} stopColor={AURORA[0]} />
            <stop offset={1} stopColor={AURORA[3]} />
          </linearGradient>
        </defs>

        <g transform={`translate(0 ${hit})`}>
          {/* minimal axis: four faint levels with mono ticks */}
          {[60, 80, 100, 120].map((v) => (
            <g key={v} opacity={levelIn * (1 - dim * 0.6)}>
              <rect
                x={W * 0.04}
                y={yOf(v) - 0.5 * u}
                width={W * 0.88}
                height={1 * u}
                fill={p.hair}
              />
              <text
                x={W * 0.965}
                y={yOf(v) + 5 * u}
                textAnchor="end"
                fontFamily={mono}
                fontWeight={400}
                fontSize={13 * u}
                fill={p.muted}
              >
                {v.toFixed(0)}
              </text>
            </g>
          ))}

          {/* previous high: dashed level the last candle punches through */}
          <g opacity={levelIn * levelOut * (1 - dim)}>
            <line
              x1={W * 0.04}
              x2={W * 0.92}
              y1={levelY}
              y2={levelY}
              stroke={broke ? p.up : accent}
              strokeOpacity={0.55 + 0.45 * levelFlash}
              strokeWidth={(1.5 + 2 * levelFlash) * u}
              strokeDasharray={`${6 * u} ${6 * u}`}
            />
            <text
              x={W * 0.04}
              y={levelY - 12 * u}
              fontFamily={mono}
              fontWeight={500}
              fontSize={14 * u}
              letterSpacing="0.1em"
              fill={p.muted}
            >
              PREV HIGH {prevHigh.toFixed(2)}
            </text>
          </g>

          {all.map((_, i) => candle(i))}
        </g>
      </svg>

      {/* price tag riding the last wick */}
      <div
        style={{
          position: "absolute",
          left: fx - fw / 2 - 14 * u,
          top: wickTop + hit,
          height: tagH,
          transform: `translate(-100%, -50%) translateX(${(1 - tagIn) * 16 * u}px)`,
          opacity: tagIn,
          display: "flex",
          alignItems: "center",
          gap: 10 * u,
          padding: `0 ${16 * u}px`,
          borderRadius: tagH / 2,
          background: AURORA[0],
          color: p.tagInk,
          fontFamily: mono,
          fontWeight: 500,
          fontSize: tagFont,
          letterSpacing: "0.02em",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        <span style={{ opacity: 0.62 }}>{symbol}</span>
        <span>{live.toFixed(2)}</span>
        <svg
          width={0.62 * tagFont}
          height={0.54 * tagFont}
          viewBox="0 0 10 8.66"
          aria-hidden
          style={{ display: "block" }}
        >
          <path d="M5 0 L10 8.66 L0 8.66 Z" fill={p.tagInk} />
        </svg>
      </div>

      {/* the slam */}
      <div
        style={{
          position: "absolute",
          left: W * 0.058,
          top: H * 0.255,
          fontFamily: display,
          fontWeight: 500,
          fontSize: S,
          lineHeight: 0.96,
          letterSpacing: "-0.012em",
          textTransform: "uppercase",
          color: p.fg,
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            opacity: Math.min(1, slam1 * 2.5),
            transform: `scale(${1.28 - 0.28 * slam1})`,
            transformOrigin: "0% 60%",
          }}
        >
          {headline}
        </div>
        <div
          style={{
            opacity: Math.min(1, slam2 * 2.5),
            transform: `scale(${1.28 - 0.28 * slam2})`,
            transformOrigin: "0% 60%",
          }}
        >
          {headline2}
        </div>
      </div>
    </AbsoluteFill>
  );
}
