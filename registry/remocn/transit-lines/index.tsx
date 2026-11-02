"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { evolvePath } from "@remotion/paths";
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

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em, on the baseline) + "emocn" in Manrope 600. */
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

type Pt = [number, number];
type Side = "n" | "s" | "e" | "w";
type Tone = "accent" | "a" | "b" | "c";

export interface TransitLine {
  tone: Tone;
  points: Pt[];
  stations?: Pt[];
  labels?: { at: Pt; text: string; side: Side }[];
}

export interface TransitLinesProps {
  title?: string;
  kicker?: string;
  lines?: TransitLine[];
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_LINES: TransitLine[] = [
  {
    tone: "accent",
    points: [
      [-12, 3],
      [-8, 3],
      [-5, 0],
      [0, 0],
    ],
    stations: [
      [-10, 3],
      [-2.7, 0],
    ],
    labels: [{ at: [-12, 3], text: "Alder", side: "w" }],
  },
  {
    tone: "a",
    points: [
      [7, -6.5],
      [3.5, -6.5],
      [0, -3],
      [0, 0],
      [0, 6.3],
    ],
    stations: [
      [1.75, -4.75],
      [0, 3.4],
    ],
    labels: [
      { at: [7, -6.5], text: "Quay", side: "e" },
      { at: [0, 6.3], text: "Kiln", side: "e" },
    ],
  },
  {
    tone: "b",
    points: [
      [-10, -6],
      [-6, -6],
      [0, 0],
      [4, 4],
      [13.5, 4],
    ],
    stations: [
      [-8, -6],
      [-3.2, -3.2],
      [7.5, 4],
      [10.5, 4],
    ],
    labels: [
      { at: [-10, -6], text: "Fenwick", side: "w" },
      { at: [13.5, 4], text: "Larch", side: "e" },
    ],
  },
  {
    tone: "c",
    points: [
      [-11, 5.5],
      [-5.5, 5.5],
      [0, 0],
      [4, -4],
      [13.5, -4],
    ],
    stations: [
      [-8.2, 5.5],
      [-2.6, 2.6],
      [7.5, -4],
      [10.5, -4],
    ],
    labels: [
      { at: [-11, 5.5], text: "Holm", side: "w" },
      { at: [13.5, -4], text: "Vale", side: "e" },
    ],
  },
];

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const DRAW_EASE = Easing.bezier(0.42, 0, 0.22, 1);

const DRAW_LEN = 38;
const ARRIVE = 48;
const LINE_GAP = 4;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    tones: { a: "#E4E2DC", b: "#6C6B71", c: "#D49B57" },
    station: "#FFFFFF",
    hair: "#0A0A0B",
    hairW: 2.2,
    ring: "#FFFFFF",
    ringFill: "#0A0A0B",
    glow: "rgba(61,91,255,0.2)",
    glow2: "rgba(143,180,255,0.07)",
    grain: 0.055,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    tones: { a: "#2B2A28", b: "#A9A69F", c: "#C9893A" },
    station: "#FFFFFF",
    hair: "rgba(18,18,20,0.55)",
    hairW: 1.3,
    ring: "#121214",
    ringFill: "#FFFFFF",
    glow: "rgba(61,91,255,0.08)",
    glow2: "rgba(143,180,255,0.1)",
    grain: 0.04,
  },
} as const;

function roundedPath(pts: Pt[], radius: number) {
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    const l1 = Math.hypot(x - px, y - py) || 1;
    const l2 = Math.hypot(nx - x, ny - y) || 1;
    const r = Math.min(radius, l1 / 2, l2 / 2);
    const ax = x - ((x - px) / l1) * r;
    const ay = y - ((y - py) / l1) * r;
    const bx = x + ((nx - x) / l2) * r;
    const by = y + ((ny - y) / l2) * r;
    d += ` L${ax.toFixed(2)} ${ay.toFixed(2)} Q${x.toFixed(2)} ${y.toFixed(2)} ${bx.toFixed(2)} ${by.toFixed(2)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L${last[0].toFixed(2)} ${last[1].toFixed(2)}`;
  return d;
}

function alongPoly(pts: Pt[], q: Pt) {
  let run = 0;
  let best = Number.POSITIVE_INFINITY;
  let at = -1;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const k = Math.max(
      0,
      Math.min(
        1,
        ((q[0] - ax) * (bx - ax) + (q[1] - ay) * (by - ay)) / len ** 2,
      ),
    );
    const dd = Math.hypot(ax + (bx - ax) * k - q[0], ay + (by - ay) * k - q[1]);
    if (dd < best) {
      best = dd;
      at = run + k * len;
    }
    run += len;
  }
  return best < 0.05 ? at / Math.max(1e-6, run) : -1;
}

function reachFrame(start: number, f: number) {
  if (f <= 0) return start;
  for (let fr = start; fr <= start + DRAW_LEN; fr += 0.5) {
    if (
      DRAW_EASE(interpolate(fr, [start, start + DRAW_LEN], [0, 1], CLAMP)) >= f
    )
      return fr;
  }
  return start + DRAW_LEN;
}

function textW(text: string, size: number) {
  return text.length * size * 0.5;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={31}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function TransitLines({
  title = "remocn",
  kicker = "Next stop",
  lines = DEFAULT_LINES,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: TransitLinesProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const p = THEMES[theme];
  const color = (tone: Tone) => (tone === "accent" ? accent : p.tones[tone]);
  const hubGradId = `hub${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const isLogo = title.trim().toLowerCase() === "remocn";

  const labelSize = 17 * u;
  const heroSize = 100 * u;
  const kickerSize = 20 * u;

  const fit = (g: number) => {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    const add = (x: number, y: number) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    };
    for (const l of lines) {
      for (const [x, y] of l.points) {
        add(x * g - 0.4 * g, y * g - 0.4 * g);
        add(x * g + 0.4 * g, y * g + 0.4 * g);
      }
      for (const lb of l.labels ?? []) {
        const tw = textW(lb.text, labelSize);
        const [x, y] = [lb.at[0] * g, lb.at[1] * g];
        if (lb.side === "e") add(x + 0.62 * g + tw, y);
        if (lb.side === "w") add(x - 0.62 * g - tw, y);
        if (lb.side === "n") add(x, y - 0.6 * g - labelSize);
        if (lb.side === "s") add(x, y + 0.6 * g + labelSize);
      }
    }
    add(3.1 * g + (isLogo ? 3.62 * heroSize : textW(title, heroSize)), 0);
    return { minX, maxX, minY, maxY };
  };
  let g = 40 * u;
  let box = fit(g);
  for (let i = 0; i < 40; i++) {
    if (box.maxX - box.minX <= W * 0.86 && box.maxY - box.minY <= H * 0.84)
      break;
    g *= 0.98;
    box = fit(g);
  }
  const hubX = W / 2 - (box.minX + box.maxX) / 2;
  const hubY = H / 2 - (box.minY + box.maxY) / 2;
  const X = (x: number) => hubX + x * g;
  const Y = (y: number) => hubY + y * g;

  const halves = lines.flatMap((l, li) => {
    const hub = l.points.findIndex(([x, y]) => x === 0 && y === 0);
    const segs: Pt[][] =
      hub < 0
        ? [l.points]
        : [l.points.slice(0, hub + 1), l.points.slice(hub).reverse()].filter(
            (s) => s.length > 1,
          );
    const arrive = ARRIVE + li * LINE_GAP;
    return segs.map((pts) => ({
      li,
      tone: l.tone,
      pts,
      start: arrive - DRAW_LEN,
      d: roundedPath(
        pts.map(([x, y]): Pt => [X(x), Y(y)]),
        g * 0.75,
      ),
    }));
  });
  const lastArrive = ARRIVE + (lines.length - 1) * LINE_GAP;
  const GROW = lastArrive + 4;
  const TITLE = GROW + 8;

  const stationList = lines.flatMap((l, li) => {
    const ends = [l.points[0], l.points[l.points.length - 1]].filter(
      ([x, y]) => !(x === 0 && y === 0),
    );
    return [...ends, ...(l.stations ?? [])].map((s) => {
      let at = Number.POSITIVE_INFINITY;
      for (const h of halves) {
        if (h.li !== li) continue;
        const f = alongPoly(h.pts, s);
        if (f >= 0) at = Math.min(at, reachFrame(h.start, f));
      }
      return { li, s, at: Number.isFinite(at) ? at : ARRIVE };
    });
  });

  const lineW = g * 0.25;
  const stR = g * 0.27;

  const firstArrive = ARRIVE;
  const hubPop = spring({
    frame: t - firstArrive,
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.6 },
  });
  const grow = spring({
    frame: t - GROW,
    fps,
    config: { damping: 15, stiffness: 120, mass: 0.9 },
  });
  const hubR = (0.42 + 0.9 * grow) * g * (0.7 + 0.3 * hubPop);
  const hubStroke = (0.13 + 0.07 * grow) * g;
  const titleIn = interpolate(t, [TITLE, TITLE + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const kickerIn = interpolate(t, [TITLE + 6, TITLE + 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const labels: React.ReactNode[] = [];
  for (const l of lines) {
    for (const lb of l.labels ?? []) {
      const st = stationList.find(
        (s) => s.s[0] === lb.at[0] && s.s[1] === lb.at[1],
      );
      const at = (st?.at ?? ARRIVE) + 4;
      const a = interpolate(t, [at, at + 14], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      const x = X(lb.at[0]);
      const y = Y(lb.at[1]);
      const off = 0.62 * g;
      const shift = (1 - a) * 6 * u;
      const base: React.CSSProperties = {
        position: "absolute",
        fontFamily: sans,
        fontWeight: 500,
        fontSize: labelSize,
        lineHeight: 1,
        letterSpacing: "0",
        color: p.muted,
        whiteSpace: "nowrap",
        opacity: a,
      };
      const pos: React.CSSProperties =
        lb.side === "e"
          ? {
              left: x + off,
              top: y,
              transform: `translate(${-shift}px, -50%)`,
            }
          : lb.side === "w"
            ? {
                right: W - x + off,
                top: y,
                transform: `translate(${shift}px, -50%)`,
              }
            : lb.side === "n"
              ? {
                  left: x,
                  bottom: H - y + off,
                  transform: `translate(-50%, ${shift}px)`,
                }
              : {
                  left: x,
                  top: y + off,
                  transform: `translate(-50%, ${-shift}px)`,
                };
      labels.push(
        <div
          key={`${lb.text}-${lb.at[0]}-${lb.at[1]}`}
          style={{ ...base, ...pos }}
        >
          {lb.text}
        </div>,
      );
    }
  }

  const driftK = interpolate(t, [0, 135], [0, 1], CLAMP);

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(${16 * g}px ${11 * g}px at ${hubX - 2 * g + 3 * g * driftK}px ${hubY + 2 * g}px, ${p.glow} 0%, transparent 70%), radial-gradient(${14 * g}px ${9 * g}px at ${hubX + 9 * g}px ${hubY - 3 * g}px, ${p.glow2} 0%, transparent 70%)`,
          opacity: grow,
        }}
      />
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        {halves.map((h) => {
          const k = DRAW_EASE(
            interpolate(t, [h.start, h.start + DRAW_LEN], [0, 1], CLAMP),
          );
          if (k <= 0) return null;
          const evo = evolvePath(k, h.d);
          return (
            <path
              key={`${h.li}-${h.pts[0][0]}-${h.pts[0][1]}`}
              d={h.d}
              fill="none"
              stroke={color(h.tone)}
              strokeWidth={lineW}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={evo.strokeDasharray}
              strokeDashoffset={evo.strokeDashoffset}
            />
          );
        })}
        {stationList.map((st) => {
          if (t < st.at) return null;
          const pop = spring({
            frame: t - st.at,
            fps,
            config: { damping: 12, stiffness: 220, mass: 0.5 },
          });
          return (
            <circle
              key={`${st.li}-${st.s[0]}-${st.s[1]}`}
              cx={X(st.s[0])}
              cy={Y(st.s[1])}
              r={stR * (0.55 + 0.45 * pop)}
              fill={p.station}
              stroke={p.hair}
              strokeWidth={p.hairW * u}
              opacity={Math.min(1, pop * 1.6)}
            />
          );
        })}
        <defs>
          {/* gradients.sh "beam", set inside the interchange roundel. */}
          <radialGradient
            id={hubGradId}
            cx={0.5}
            cy={1.12 - 0.1 * driftK}
            r={1.05}
          >
            <stop offset={0} stopColor="#f4f7ff" />
            <stop offset={0.26} stopColor="#8fb4ff" />
            <stop offset={0.62} stopColor={accent} />
            <stop offset={1} stopColor="#2e3fd0" />
          </radialGradient>
        </defs>
        {t >= firstArrive ? (
          <g opacity={Math.min(1, hubPop * 1.6)}>
            <circle
              cx={hubX}
              cy={hubY}
              r={hubR + hubStroke / 2 + p.hairW * u}
              fill={p.hair}
            />
            <circle
              cx={hubX}
              cy={hubY}
              r={hubR}
              fill={p.ringFill}
              stroke={p.ring}
              strokeWidth={hubStroke}
            />
            <circle
              cx={hubX}
              cy={hubY}
              r={Math.max(0, hubR - hubStroke / 2)}
              fill={`url(#${hubGradId})`}
              opacity={grow}
            />
          </g>
        ) : null}
      </svg>
      {labels}
      <div
        style={{
          position: "absolute",
          left: hubX + 3.1 * g,
          top: hubY,
          transform: `translateY(calc(-50% - ${(kickerSize * 1.2 + 8 * u) / 2}px))`,
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            fontFamily: sans,
            fontWeight: 400,
            fontSize: kickerSize,
            letterSpacing: "0",
            color: p.muted,
            marginBottom: 10 * u,
            opacity: kickerIn,
            transform: `translateY(${(1 - kickerIn) * 6 * u}px)`,
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            fontFamily: sans,
            fontWeight: 500,
            fontSize: heroSize,
            lineHeight: 0.95,
            letterSpacing: "-0.035em",
            color: p.fg,
            opacity: titleIn,
            transform: `translateX(${(1 - titleIn) * -18 * u}px)`,
            filter:
              titleIn < 0.99 ? `blur(${(1 - titleIn) * 6 * u}px)` : undefined,
          }}
        >
          {isLogo ? <RemocnLogo fontSize={heroSize} color={p.fg} /> : title}
        </div>
      </div>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
