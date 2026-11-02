"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/SchibstedGrotesk";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: manrope } = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface DumbbellRow {
  label: string;
  before: number;
  after: number;
}

export interface DumbbellShiftProps {
  rows?: DumbbellRow[];
  beforeLabel?: string;
  afterLabel?: string;
  summaryCaption?: string;
  max?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_ROWS: DumbbellRow[] = [
  { label: "Launch videos", before: 2, after: 9 },
  { label: "Changelogs", before: 4, after: 7 },
  { label: "Social clips", before: 3, after: 19 },
  { label: "Tutorials", before: 5, after: 11 },
  { label: "Onboarding", before: 1, after: 6 },
  { label: "Ads", before: 6, after: 8 },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_SLIDE = Easing.bezier(0.45, 0, 0.15, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    dot: "#6A696F",
    guide: "rgba(255,255,255,0.08)",
    grain: 0.06,
    // gradients.sh "fluted": bg #050507, [#1d2a8f, #2f7bff, #ff7a3d, #ffe2c4]
    fluted: ["#1d2a8f", "#2f7bff", "#ff7a3d", "#ffe2c4"],
    heroText: "linear-gradient(100deg, #4f8dff 0%, #ff7a3d 64%, #ffe2c4 100%)",
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    dot: "#A9A7A1",
    guide: "rgba(18,18,20,0.09)",
    grain: 0.045,
    fluted: ["#1d2a8f", "#2f7bff", "#ff7a3d", "#f2552c"],
    heroText:
      "linear-gradient(100deg, #1d2a8f 0%, #2f7bff 34%, #ff7a3d 76%, #f2552c 100%)",
  },
} as const;

const ENTER_STAGGER = 3;
const SLIDE_START = 18;
const SLIDE_STAGGER = 5;
const SLIDE_DUR = 26;
const SORT = [78, 108] as const;
const HERO = 110;

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** The remocn.dev logo: R mark (0.76em, on the baseline) + "emocn" in Manrope 600. */
function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
        whiteSpace: "nowrap",
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

function niceMax(v: number) {
  const steps = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  for (const s of steps) if (v <= s) return s;
  return Math.ceil(v / 1000) * 1000;
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
          seed={17}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function DumbbellShift({
  rows = DEFAULT_ROWS,
  beforeLabel = "Before",
  afterLabel = "With remocn",
  summaryCaption,
  max,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: DumbbellShiftProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];

  const list = rows.slice(0, 7);
  const n = list.length;
  const deltas = list.map((r) => r.after - r.before);
  const order = list
    .map((_, i) => i)
    .sort((a, b) => deltas[b] - deltas[a] || a - b);
  const rank = list.map((_, i) => order.indexOf(i));
  const winner = order[0] ?? 0;
  const top = Math.max(1, ...list.map((r) => Math.max(r.before, r.after)));
  const scaleMax = max ?? niceMax(top * 1.04);

  const m = width * 0.08;
  const rowsTop = height * 0.12;
  const rowsBottom = height * 0.9;
  const rowH = (rowsBottom - rowsTop) / Math.max(1, n);
  const ax0 = width * 0.27;
  const ax1 = width * 0.705;
  const heroX = width * 0.74;
  const r = Math.min(15 * u, rowH * 0.17);
  const barH = r * 0.78;
  const gid = `db${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const xOf = (v: number) =>
    ax0 + (Math.max(0, Math.min(v, scaleMax)) / scaleMax) * (ax1 - ax0);

  const sortK = interpolate(t, [SORT[0], SORT[1]], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const dim = interpolate(t, [HERO, HERO + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const grow = interpolate(t, [HERO, HERO + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const capIn = interpolate(t, [HERO + 12, HERO + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const noteOut = interpolate(t, [SORT[0] - 8, SORT[0] + 2], [1, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const push = interpolate(t, [0, HERO + 40], [1.025, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const items = list.map((row, i) => {
    const enter = interpolate(
      t,
      [2 + i * ENTER_STAGGER, 20 + i * ENTER_STAGGER],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
    const s0 = SLIDE_START + i * SLIDE_STAGGER;
    const slide = interpolate(t, [s0, s0 + SLIDE_DUR], [0, 1], {
      ...CLAMP,
      easing: EASE_SLIDE,
    });
    const deltaIn = interpolate(
      t,
      [s0 + SLIDE_DUR - 8, s0 + SLIDE_DUR + 8],
      [0, 1],
      {
        ...CLAMP,
        easing: EASE_OUT,
      },
    );
    const pos = i + (rank[i] - i) * sortK;
    const y = rowsTop + rowH * (pos + 0.5);
    const xb = xOf(row.before);
    const xa = xOf(row.after);
    const x = xb + (xa - xb) * slide;
    const isWin = i === winner;
    const fade = isWin ? 1 : 1 - 0.4 * dim;
    const tone = isWin
      ? p.fluted[3]
      : interpolateColors(dim, [0, 1], [p.fluted[3], p.muted]);
    return { row, i, enter, slide, deltaIn, y, xb, xa, x, isWin, fade, tone };
  });
  const duck = items.map((it) => {
    let d = Number.POSITIVE_INFINITY;
    for (const o of items) if (o !== it) d = Math.min(d, Math.abs(o.y - it.y));
    return it.isWin
      ? 1
      : interpolate(d, [rowH * 0.3, rowH * 0.65], [0, 1], CLAMP);
  });

  const win = items[winner];
  const heroText = win
    ? `${deltas[winner] >= 0 ? "+" : "−"}${Math.abs(Math.round(deltas[winner] * win.slide))}`
    : "";
  const deltaText = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v)}`;
  const winCaption =
    summaryCaption ?? (win ? `${win.row.label.toLowerCase()} a month` : "");

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transform: `scale(${push})`, transformOrigin: "50% 50%" }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient id={gid} x1={0} y1={0} x2={1} y2={0}>
              <stop offset={0} stopColor={p.fluted[0]} />
              <stop offset={0.38} stopColor={p.fluted[1]} />
              <stop offset={0.78} stopColor={p.fluted[2]} />
              <stop offset={1} stopColor={p.fluted[3]} />
            </linearGradient>
          </defs>
          {items.map((it) => (
            <g key={it.row.label} opacity={it.fade}>
              <line
                x1={ax0}
                x2={ax0 + (ax1 - ax0) * it.enter}
                y1={it.y}
                y2={it.y}
                stroke={p.guide}
                strokeWidth={Math.max(1, u)}
              />
              {it.slide > 0 && Math.abs(it.x - it.xb) > 0.5 ? (
                <>
                  <rect
                    x={Math.min(it.xb, it.x)}
                    y={it.y - (barH * (it.isWin ? 1 + 0.35 * dim : 1)) / 2}
                    width={Math.abs(it.x - it.xb)}
                    height={barH * (it.isWin ? 1 + 0.35 * dim : 1)}
                    rx={(barH * (it.isWin ? 1 + 0.35 * dim : 1)) / 2}
                    fill={`url(#${gid})`}
                    opacity={it.isWin ? 1 : 1 - dim}
                  />
                  {it.isWin ? null : (
                    <rect
                      x={Math.min(it.xb, it.x)}
                      y={it.y - barH / 2}
                      width={Math.abs(it.x - it.xb)}
                      height={barH}
                      rx={barH / 2}
                      fill={p.muted}
                      opacity={0.42 * dim}
                    />
                  )}
                </>
              ) : null}
              {it.slide > 0 ? (
                <circle
                  cx={it.x}
                  cy={it.y}
                  r={r}
                  fill={it.tone}
                  opacity={interpolate(it.slide, [0, 0.12], [0, 1], CLAMP)}
                />
              ) : null}
              {it.isWin ? (
                <circle
                  cx={it.x}
                  cy={it.y}
                  r={r + (4 + 6 * dim) * u}
                  fill="none"
                  stroke={accent}
                  strokeWidth={1.5 * u}
                  opacity={dim * 0.9}
                />
              ) : null}
              <circle
                cx={it.xb}
                cy={it.y}
                r={r * (0.6 + 0.4 * it.enter)}
                fill={p.dot}
                opacity={it.enter}
              />
            </g>
          ))}
        </svg>

        {items.map((it) => (
          <div
            key={it.row.label}
            style={{
              position: "absolute",
              left: m,
              top: it.y,
              transform: `translateY(-50%) translateX(${(1 - it.enter) * -10 * u}px)`,
              fontFamily: sans,
              fontWeight: it.isWin && dim > 0.5 ? 500 : 400,
              fontSize: 24 * u,
              letterSpacing: "-0.015em",
              color: p.fg,
              opacity: it.enter * it.fade * duck[it.i],
              whiteSpace: "nowrap",
            }}
          >
            {it.row.label}
          </div>
        ))}

        {items.map((it) => {
          if (it.isWin) return null;
          const v = Math.round(deltas[it.i] * it.slide);
          return (
            <div
              key={it.row.label}
              style={{
                position: "absolute",
                left: it.xa + r + 14 * u,
                top: it.y,
                transform: `translateY(-50%) translateX(${(1 - it.deltaIn) * -6 * u}px)`,
                fontFamily: sans,
                fontWeight: 400,
                fontSize: 20 * u,
                color: p.muted,
                fontVariantNumeric: "tabular-nums",
                opacity: it.deltaIn * (1 - dim) * duck[it.i],
                whiteSpace: "nowrap",
              }}
            >
              {deltaText(v)}
            </div>
          );
        })}

        {win
          ? [
              { key: "b", x: win.xb, text: beforeLabel, a: win.enter },
              { key: "a", x: win.xa, text: afterLabel, a: win.deltaIn },
            ].map((nt) => (
              <div
                key={nt.key}
                style={{
                  position: "absolute",
                  left: nt.x,
                  top: win.y - r - 10 * u,
                  transform: `translate(-50%, -100%) translateY(${(1 - nt.a) * 6 * u}px)`,
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.3em",
                  fontFamily: sans,
                  fontWeight: 400,
                  fontSize: 17 * u,
                  color: nt.key === "a" ? p.fg : p.muted,
                  opacity: nt.a * noteOut,
                  whiteSpace: "nowrap",
                }}
              >
                {nt.key === "a" && /remocn$/i.test(nt.text) ? (
                  <>
                    {nt.text.replace(/remocn$/i, "").trim()}
                    <RemocnLogo fontSize={18 * u} color={p.fg} />
                  </>
                ) : (
                  nt.text
                )}
              </div>
            ))
          : null}

        {win ? (
          <div
            style={{
              position: "absolute",
              left:
                win.xa + r + 14 * u + (heroX - (win.xa + r + 14 * u)) * grow,
              top: win.y,
              transform: "translateY(-50%)",
              opacity: win.deltaIn,
            }}
          >
            <div
              style={{
                fontFamily: sans,
                fontWeight: 400,
                fontSize: 132 * u,
                lineHeight: 1,
                letterSpacing: `${interpolate(grow, [0, 1], [0, -0.05])}em`,
                color: interpolateColors(grow, [0, 1], [p.muted, p.fg]),
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                transformOrigin: "0% 50%",
                transform: `scale(${interpolate(grow, [0, 1], [20 / 132, 1])})`,
              }}
            >
              <span style={{ position: "relative", display: "inline-block" }}>
                {heroText}
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: p.heroText,
                    backgroundSize: "100% 100%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    opacity: grow,
                  }}
                >
                  {heroText}
                </span>
              </span>
            </div>
            <div
              style={{
                position: "absolute",
                left: 4 * u,
                top: "100%",
                marginTop: 6 * u,
                fontFamily: sans,
                fontWeight: 400,
                fontSize: 21 * u,
                color: p.muted,
                whiteSpace: "nowrap",
                opacity: capIn,
                transform: `translateY(${(1 - capIn) * 6 * u}px)`,
              }}
            >
              {winCaption}
            </div>
          </div>
        ) : null}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.5,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
