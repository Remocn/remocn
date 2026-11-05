"use client";

import { loadFont } from "@remotion/google-fonts/AlbertSans";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

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
  background?: string;
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

function useWidths(keys: string[]) {
  const key = keys.join("\u0001");
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
      document.fonts.load(`400 100px "${albert.fontFamily}"`),
      document.fonts.load(`500 100px "${albert.fontFamily}"`),
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
          if (ctx) ctx.font = `${wt} 100px "${albert.fontFamily}"`;
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
  }, [key, handle]);
  return state && state.key === key ? state.w : null;
}

export function TheTab({
  items = DEFAULT_ITEMS,
  price = "$0",
  totalLabel = "Total",
  total = "one Sunday morning.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: TheTabProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const T = durationInFrames * speed;
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
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
  const w = useWidths(keys);

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
          fill={c.ink}
          opacity={lIn}
          transform={`translate(0 ${((1 - lIn) * F * 0.5).toFixed(2)})`}
        >
          {r.item}
        </text>
        {lead > 0 && x1 > x0 ? (
          <line
            x1={x0}
            y1={cy}
            x2={xe}
            y2={cy}
            stroke={c.ink}
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
          fill={c.ink}
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
  const valueNodes = totalWords.map((s, k) => {
    const x = valueX0 + cursor * Ft;
    cursor += wordWs[k] + space;
    const at = totalAt + 8 + k * 5;
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
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        fontFamily={albert.fontFamily}
        aria-hidden
      >
        {rowNodes}
        {rule > 0 ? (
          <rect
            x={mx}
            y={ruleY - Math.max(1, F * 0.03)}
            width={inner * rule}
            height={Math.max(2, F * 0.06)}
            fill={c.ink}
          />
        ) : null}
        <text
          x={mx}
          y={totalBase}
          fontSize={Ft}
          fontWeight={500}
          letterSpacing={`${TRACK_TOTAL}em`}
          fill={c.ink}
          opacity={tlIn}
          transform={`translate(0 ${((1 - tlIn) * Ft * 0.45).toFixed(2)})`}
        >
          {totalLabel}
        </text>
        {valueNodes}
      </svg>
    </AbsoluteFill>
  );
}
