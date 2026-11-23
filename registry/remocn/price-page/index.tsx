"use client";

import { loadFont } from "@remotion/google-fonts/AlbertSans";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

const albert = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface PricePageProps {
  label?: string;
  lines?: string[];
  price?: string;
  note?: string;
  accent?: string;
  /** Color of the label, lines and note; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Albert Sans by default. */
  fontFamily?: string;
  /** Frames the full list holds before the lines start leaving. */
  hold?: number;
  /** Size of the foreground, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#141414", ink: "#FFFFFF", accent: "#3DD9FF" },
  light: { bg: "#FFFFFF", ink: "#000000", accent: "#0077B6" },
} as const;

const DEFAULT_LINES = [
  "Starter, Pro, Team, Enterprise",
  "Per seat, per month",
  "Billed yearly, save 20%",
  "Watermark on the free plan",
  "Three exports a month",
  "Overage fees may apply",
  "Contact sales",
];

const LH = 1.2;
const TRACK_LINE = -0.015;
const TRACK_PRICE = -0.04;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_EXIT = Easing.bezier(0.6, 0, 0.9, 0.3);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const shifts = (at: (df: number) => number) =>
  Math.abs(at(1) - at(0)) > 1e-3 || Math.abs(at(0) - at(-1)) > 1e-3;

function useWidths(keys: string[], fontFamily: string) {
  const key = [fontFamily, ...keys].join("\u0001");
  const [state, setState] = useState<{
    key: string;
    w: Record<string, number>;
  } | null>(null);
  const [handle] = useState(() => delayRender("price-page: measuring"));
  const released = useRef(false);
  const ref = useRef(keys);
  ref.current = keys;
  useEffect(() => {
    let live = true;
    Promise.all([
      albert.waitUntilDone(),
      document.fonts.load(`400 100px "${fontFamily}"`),
      document.fonts.load(`500 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        const w: Record<string, number> = {};
        for (const k of ref.current) {
          const cut = k.indexOf("|");
          const wt = k.slice(0, cut);
          const s = k.slice(cut + 1);
          if (ctx) ctx.font = `${wt} 100px "${fontFamily}"`;
          w[k] = ctx ? ctx.measureText(s).width / 100 : s.length * 0.5;
        }
        setState({ key, w });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, fontFamily]);
  return state && state.key === key ? state.w : null;
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

export function PricePage({
  label = "Pricing",
  lines = DEFAULT_LINES,
  price = "Free.",
  note = "That’s the whole pricing page.",
  accent,
  ink,
  background,
  fontFamily = albert.fontFamily,
  hold = 40,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: PricePageProps) {
  const frame = useSceneFrame();
  const glide = useGlide();
  const tAt = (df: number) => Math.max(0, frame + df - delay) * speed;
  const t = tAt(0);
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const T = durationInFrames * speed;
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const rows = lines.filter((s) => s.trim().length > 0);
  const keys = [
    ...rows.map((s) => `400|${s}`),
    `500|${price}`,
    `400|${note}`,
    `400|${label}`,
  ];
  const w = useWidths(keys, fontFamily);

  if (!w) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const adv = (wt: number, s: string, track: number) =>
    (w[`${wt}|${s}`] ?? 0) + track * Array.from(s).length;

  const portrait = H > W * 1.1;
  const unit = Math.min(W, H);
  const right = W * (portrait ? 0.92 : 0.925);
  const maxW = W * (portrait ? 0.84 : 0.6);
  const n = rows.length;

  const longest = Math.max(0.01, ...rows.map((s) => adv(400, s, TRACK_LINE)));
  const F = Math.max(
    14,
    Math.min(
      (H * (portrait ? 0.42 : 0.68)) / Math.max(1, n * LH),
      maxW / longest,
      unit * (portrait ? 0.08 : 0.1),
    ),
  );
  const lineH = F * LH;

  const priceMax = W * (portrait ? 0.84 : 0.7);
  const Fp = Math.min(
    unit * (portrait ? 0.42 : 0.38),
    priceMax / Math.max(0.01, adv(500, price, TRACK_PRICE)),
  );
  const priceH = Fp * 0.98;

  const Fs = Math.max(16, unit * 0.034);
  const Fn = Math.min(
    Math.max(16, unit * 0.044),
    maxW / Math.max(0.01, adv(400, note, -0.005)),
  );
  const labelH = Fs * 2.1;
  const noteH = note ? Fn * 1.9 : 0;

  const intro = hold;
  const tail = 44;
  const land = 22;
  const gap =
    n > 1
      ? Math.max(4, Math.min(10, (T - intro - tail - land - 12) / (n - 1)))
      : 0;
  const ord = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => ((a * 3) % n) - ((b * 3) % n) || a - b,
  );
  const exitAt: number[] = new Array(n).fill(0);
  ord.forEach((i, k) => {
    exitAt[i] = intro + k * gap;
  });
  const EXIT_LEN = 9;
  const lastExit = n > 0 ? intro + (n - 1) * gap : intro;
  const landAt = lastExit + 8;

  // The vertical layout at time `tt`, so each line can tell motion from
  // rest by its neighbouring frames.
  const geo = (tt: number) => {
    const presence = rows.map((_, i) =>
      interpolate(tt, [exitAt[i] + 7, exitAt[i] + 18], [1, 0], {
        ...CLAMP,
        easing: EASE_IO,
      }),
    );
    const listH = presence.reduce((a, p) => a + p * lineH, 0);
    const grow = interpolate(tt, [landAt - 6, landAt + 14], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    const contentH = labelH + listH + grow * (priceH + noteH);
    const top = H / 2 - contentH / 2;
    const listTop = top + labelH;
    const labelIn = interpolate(tt, [0, 16], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const lineY = rows.map((_, i) => {
      let rank = 0;
      for (let j = 0; j < i; j++) rank += presence[j];
      const enter = interpolate(tt, [3 + i * 3, 19 + i * 3], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      return {
        base: listTop + rank * lineH + F * 0.93,
        enter,
        dy: (1 - enter) * F * 0.45,
      };
    });
    const priceIn = interpolate(tt, [landAt, landAt + 20], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const noteIn = interpolate(tt, [landAt + 12, landAt + 30], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    return {
      top,
      listH,
      labelIn,
      lineY,
      priceIn,
      noteIn,
      priceBase: listTop + listH + Fp * 0.82,
      noteBase: listTop + listH + priceH + Fn * 1.35,
    };
  };
  const g = geo(t);
  const near = (df: number) => (df === 0 ? g : geo(tAt(df)));
  const { top, labelIn, priceIn, noteIn, priceBase, noteBase } = g;
  const labelY = (o: ReturnType<typeof geo>) =>
    o.top + Fs + (1 - o.labelIn) * Fs * 0.4;
  const priceY = (o: ReturnType<typeof geo>) =>
    o.priceBase + (1 - o.priceIn) * Fp * 0.22;
  const noteY = (o: ReturnType<typeof geo>) =>
    o.noteBase + (1 - o.noteIn) * Fn * 0.5;

  // SVG text is placed by attributes, which cannot carry the glide mark, so
  // the drawing as a whole carries it while any of its lines moves.
  let moving = false;
  const lineNodes = rows.map((s, i) => {
    const { base, enter, dy } = g.lineY[i];
    const lineMoving = shifts((df) => {
      const l = near(df).lineY[i];
      return l.base + l.dy;
    });
    const out = interpolate(t, [exitAt[i], exitAt[i] + EXIT_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_EXIT,
    });
    if (out >= 1) return null;
    moving ||= lineMoving;
    const lw = adv(400, s, TRACK_LINE) * F;
    const dx = out * (W - right + lw + F);
    return (
      <text
        key={`l${i}`}
        x={right}
        y={base}
        textAnchor="end"
        fontSize={F}
        fontWeight={400}
        letterSpacing={`${TRACK_LINE}em`}
        fill={fg}
        opacity={enter * interpolate(out, [0.55, 1], [1, 0], CLAMP)}
        transform={`translate(${dx.toFixed(2)} ${dy.toFixed(2)})`}
      >
        {s}
      </text>
    );
  });

  moving ||=
    shifts((df) => labelY(near(df))) ||
    (priceIn > 0 && shifts((df) => priceY(near(df)))) ||
    (Boolean(note) && noteIn > 0 && shifts((df) => noteY(near(df))));

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", inset: 0, transform: glide(moving) }}
          fontFamily={fontFamily}
          aria-hidden
        >
          <text
            x={right}
            y={top + Fs}
            textAnchor="end"
            fontSize={Fs}
            fontWeight={400}
            fill={fg}
            opacity={labelIn * 0.55}
            transform={`translate(0 ${((1 - labelIn) * Fs * 0.4).toFixed(2)})`}
          >
            {label}
          </text>
          {lineNodes}
          {priceIn > 0 ? (
            <text
              x={right}
              y={priceBase}
              textAnchor="end"
              fontSize={Fp}
              fontWeight={500}
              letterSpacing={`${TRACK_PRICE}em`}
              fill={hi}
              opacity={priceIn}
              transform={`translate(0 ${((1 - priceIn) * Fp * 0.22).toFixed(2)})`}
            >
              {price}
            </text>
          ) : null}
          {note && noteIn > 0 ? (
            <text
              x={right}
              y={noteBase}
              textAnchor="end"
              fontSize={Fn}
              fontWeight={400}
              letterSpacing="-0.005em"
              fill={fg}
              opacity={noteIn}
              transform={`translate(0 ${((1 - noteIn) * Fn * 0.5).toFixed(2)})`}
            >
              {note}
            </text>
          ) : null}
        </svg>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
