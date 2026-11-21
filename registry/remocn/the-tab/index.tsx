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

export interface TheTabItem {
  item: string;
  price?: string;
}

export interface TheTabProps {
  items?: TheTabItem[];
  price?: string;
  totalLabel?: string;
  total?: string;
  accent?: string;
  /** Text color of the rows, rule and total label; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the receipt. Load it yourself; Albert Sans by default. */
  fontFamily?: string;
  /** Frames between words of the total as it lands. */
  stagger?: number;
  /** Dotted leaders between each item and its price. */
  leaders?: boolean;
  /** Size of the receipt, around the frame's center. */
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

const DEFAULT_ITEMS: TheTabItem[] = [
  { item: "Every component" },
  { item: "Every template" },
  { item: "Every future update" },
  { item: "Seats for the whole team" },
  { item: "Renders on your own machine" },
];

const TRACK = -0.012;
const TRACK_TOTAL = -0.025;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function useWidths(keys: string[], fontFamily: string) {
  const key = `${fontFamily}\u0002${keys.join("\u0001")}`;
  const [state, setState] = useState<{
    key: string;
    w: Record<string, number>;
  } | null>(null);
  const [handle] = useState(() => delayRender("the-tab: measuring"));
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

// Chrome parks a glyph raster on a whole pixel vertically for as long as the
// matrix is axis-aligned, so text under a slow transform clicks along pixel by
// pixel. SVG text can't carry the mark itself, so the drawing is marked as
// moving from the first line's rise to the last one's, and the text leans
// off that grid. A drawing leans only while it moves, so one span with no
// gaps in it: a lean that went in a pause and came back would snap the lines
// already in place by up to half a pixel each time.

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

export function TheTab({
  items = DEFAULT_ITEMS,
  price = "$0",
  totalLabel = "Total",
  total = "one Sunday morning.",
  accent,
  ink,
  background,
  fontFamily = albert.fontFamily,
  stagger = 5,
  leaders = true,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: TheTabProps) {
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const T = durationInFrames * speed;
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const rows = items
    .filter((r) => r.item.trim().length > 0)
    .map((r) => ({ item: r.item, price: r.price ?? price }));
  const totalWords = total.split(/\s+/).filter(Boolean);
  const keys = [
    ...rows.map((r) => `400|${r.item}`),
    ...rows.map((r) => `400|${r.price}`),
    `500|${totalLabel}`,
    `500|${total}`,
    ...totalWords.map((s) => `500|${s}`),
    "500| ",
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
  const n = rows.length;
  const mx = W * (portrait ? 0.08 : 0.085);
  const inner = W - 2 * mx;

  const rowEm = Math.max(
    0.01,
    ...rows.map(
      (r) => adv(400, r.item, TRACK) + adv(400, r.price, TRACK) + 2.2,
    ),
  );
  const totalEm = adv(500, totalLabel, TRACK_TOTAL) + 1.2;
  const valueEm = adv(500, total, TRACK_TOTAL);
  let F = Math.min(
    unit * (portrait ? 0.062 : 0.07),
    inner / rowEm,
    (H * (portrait ? 0.5 : 0.7)) / Math.max(1, n * 1.75 + 4),
  );
  F = Math.max(14, F);
  let Ft = F * 1.75;
  const totalOnOwnLine = portrait || (totalEm + valueEm) * Ft > inner;
  if (totalOnOwnLine) Ft = Math.min(Ft, inner / Math.max(0.01, valueEm));
  const rowH = F * 1.75;
  const ruleGap = F * 0.9;
  const totalH = totalOnOwnLine ? Ft * 2.6 : Ft * 1.5;
  const blockH = n * rowH + ruleGap + totalH;
  const top = H / 2 - blockH / 2;

  const first = 6;
  const tail = 56;
  const step =
    n > 0
      ? Math.max(6, Math.min(14, (T - first - tail - 34) / Math.max(1, n)))
      : 0;
  const rowAt = (i: number) => first + i * step;
  const ruleAt = rowAt(Math.max(0, n - 1)) + 18;
  const totalAt = ruleAt + 10;

  const dotR = Math.max(1.2, F * 0.045);
  const dotGap = F * 0.3;

  const rowNodes = rows.map((r, i) => {
    const s = rowAt(i);
    const base = top + i * rowH + F * 1.1;
    const lIn = interpolate(t, [s, s + 14], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const lead = interpolate(t, [s + 4, s + 16], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    const pIn = interpolate(t, [s + 13, s + 25], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const x0 = mx + adv(400, r.item, TRACK) * F + F * 0.45;
    const x1 = W - mx - adv(400, r.price, TRACK) * F - F * 0.45;
    const xe = x0 + (x1 - x0) * lead;
    const cy = base - F * 0.08;
    return (
      <g key={`r${i}`}>
        <text
          x={mx}
          y={base}
          fontSize={F}
          fontWeight={400}
          letterSpacing={`${TRACK}em`}
          fill={fg}
          opacity={lIn}
          transform={`translate(0 ${((1 - lIn) * F * 0.5).toFixed(2)})`}
        >
          {r.item}
        </text>
        {leaders && lead > 0 && x1 > x0 ? (
          <line
            x1={x0}
            y1={cy}
            x2={xe}
            y2={cy}
            stroke={fg}
            strokeOpacity={0.4}
            strokeWidth={dotR * 2}
            strokeLinecap="round"
            strokeDasharray={`0 ${dotGap.toFixed(2)}`}
          />
        ) : null}
        <text
          x={W - mx}
          y={base}
          textAnchor="end"
          fontSize={F}
          fontWeight={400}
          letterSpacing={`${TRACK}em`}
          fill={fg}
          opacity={pIn}
          transform={`translate(0 ${((1 - pIn) * -F * 0.4).toFixed(2)})`}
        >
          {r.price}
        </text>
      </g>
    );
  });

  const ruleY = top + n * rowH + ruleGap * 0.35;
  const rule = interpolate(t, [ruleAt, ruleAt + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const tlIn = interpolate(t, [totalAt, totalAt + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const totalBase = ruleY + ruleGap * 0.65 + Ft * 1.05;
  const valueBase = totalOnOwnLine ? totalBase + Ft * 1.3 : totalBase;
  const space = w["500| "] ?? 0.25;
  const wordWs = totalWords.map((s) => adv(500, s, TRACK_TOTAL));
  const valueW =
    wordWs.reduce((a, b) => a + b, 0) + space * (totalWords.length - 1);
  const valueX0 = totalOnOwnLine ? mx : W - mx - valueW * Ft;

  let cursor = 0;
  // The frame the last line lands: a row's price, the total or its last word.
  const settled = Math.max(
    n > 0 ? rowAt(n - 1) + 25 : 0,
    totalAt + 14,
    totalAt + 8 + Math.max(0, totalWords.length - 1) * stagger + 14,
  );
  const valueNodes = totalWords.map((s, k) => {
    const x = valueX0 + cursor * Ft;
    cursor += wordWs[k] + space;
    const at = totalAt + 8 + k * stagger;
    const v = interpolate(t, [at, at + 14], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    return (
      <text
        key={`v${k}`}
        x={x}
        y={valueBase}
        fontSize={Ft}
        fontWeight={500}
        letterSpacing={`${TRACK_TOTAL}em`}
        fill={hi}
        opacity={v}
        transform={`translate(0 ${((1 - v) * Ft * 0.45).toFixed(2)})`}
      >
        {s}
      </text>
    );
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{
            position: "absolute",
            inset: 0,
            transform: glide(t > rowAt(0) && t < settled),
          }}
          fontFamily={fontFamily}
          aria-hidden
        >
          {rowNodes}
          {rule > 0 ? (
            <rect
              x={mx}
              y={ruleY - Math.max(1, F * 0.03)}
              width={inner * rule}
              height={Math.max(2, F * 0.06)}
              fill={fg}
            />
          ) : null}
          <text
            x={mx}
            y={totalBase}
            fontSize={Ft}
            fontWeight={500}
            letterSpacing={`${TRACK_TOTAL}em`}
            fill={fg}
            opacity={tlIn}
            transform={`translate(0 ${((1 - tlIn) * Ft * 0.45).toFixed(2)})`}
          >
            {totalLabel}
          </text>
          {valueNodes}
        </svg>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
