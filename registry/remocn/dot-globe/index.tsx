"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

/**
 * gradients.sh "limb" palette: [#e9ecff, #8a8bff, #4b2bd6, #160c3a]. It is the
 * atmosphere: a lit limb hugging the globe, and the light inside the counter.
 */
const LIMB = ["#e9ecff", "#8a8bff", "#4b2bd6", "#160c3a"] as const;

/**
 * Beat sheet (30fps, speed 1):
 * 0–30     the dotted globe materialises (dots shimmer in), the camera eases
 *          from a low angle to a gentle overhead tilt. Rotation never stops.
 * 18–170   accent arcs lift off city to city along great circles, each one a
 *          travelling stroke; a pulse ring blooms where it lands and the
 *          country counter ticks up by one.
 * 170–210  last landing settles, the counter holds on the final number.
 */

export interface GlobeCity {
  name: string;
  lat: number;
  lon: number;
}

export interface GlobeRoute {
  from: GlobeCity;
  to: GlobeCity;
}

export interface DotGlobeProps {
  /** Final counter value; it ticks up once per landed route. */
  count?: number;
  prefix?: string;
  suffix?: string;
  routes?: GlobeRoute[];
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const C = {
  london: { name: "London", lat: 51.5, lon: -0.13 },
  lagos: { name: "Lagos", lat: 6.52, lon: 3.38 },
  berlin: { name: "Berlin", lat: 52.52, lon: 13.4 },
  nairobi: { name: "Nairobi", lat: -1.29, lon: 36.82 },
  lisbon: { name: "Lisbon", lat: 38.72, lon: -9.14 },
  newYork: { name: "New York", lat: 40.71, lon: -74.0 },
  saoPaulo: { name: "São Paulo", lat: -23.55, lon: -46.63 },
  madrid: { name: "Madrid", lat: 40.42, lon: -3.7 },
  mexico: { name: "Mexico City", lat: 19.43, lon: -99.13 },
  dakar: { name: "Dakar", lat: 14.7, lon: -17.44 },
  bogota: { name: "Bogotá", lat: 4.71, lon: -74.07 },
  toronto: { name: "Toronto", lat: 43.65, lon: -79.38 },
  cairo: { name: "Cairo", lat: 30.04, lon: 31.24 },
} satisfies Record<string, GlobeCity>;

const DEFAULT_ROUTES: GlobeRoute[] = [
  { from: C.london, to: C.lagos },
  { from: C.berlin, to: C.cairo },
  { from: C.lisbon, to: C.newYork },
  { from: C.madrid, to: C.saoPaulo },
  { from: C.london, to: C.toronto },
  { from: C.dakar, to: C.bogota },
  { from: C.newYork, to: C.mexico },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const ROUTE_START = 18;
const ROUTE_GAP = 20;
const FLIGHT = 32;

/**
 * Land mask, 3° cells, longitude −180→180 left to right, latitude 78→−54
 * top to bottom. "#" = land.
 */
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

function isLand(latDeg: number, lonDeg: number) {
  if (latDeg >= LAT_TOP || latDeg < LAT_TOP - LAND.length * CELL) return false;
  const r = Math.floor((LAT_TOP - latDeg) / CELL);
  const c = Math.floor((lonDeg + 180) / CELL);
  return LAND[r]?.[Math.min(c, LAND[0].length - 1)] === "#";
}

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const DEG = Math.PI / 180;

/** Evenly spread points on the sphere (Fibonacci lattice), land only. */
const DOTS = (() => {
  const n = 9000;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const out: { cl: number; sl: number; lon: number; h: number }[] = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const lat = Math.asin(y);
    const lon =
      ((((i * golden) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) -
      Math.PI;
    if (isLand(lat / DEG, lon / DEG)) {
      out.push({ cl: Math.cos(lat), sl: y, lon, h: hash(i) });
    }
  }
  return out;
})();

type V3 = [number, number, number];

function toVec(c: GlobeCity): V3 {
  const la = c.lat * DEG;
  const lo = c.lon * DEG;
  return [
    Math.cos(la) * Math.sin(lo),
    Math.sin(la),
    Math.cos(la) * Math.cos(lo),
  ];
}

function slerp(a: V3, b: V3, s: number): V3 {
  const d = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const om = Math.acos(d);
  if (om < 1e-4) return a;
  const k1 = Math.sin((1 - s) * om) / Math.sin(om);
  const k2 = Math.sin(s * om) / Math.sin(om);
  return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
}

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    stage: "rgba(255,255,255,0.05)",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    dot: [236, 234, 230],
    backDot: 0.07,
    body0: "#1A1830",
    body1: "#0B0A12",
    rim: LIMB[0],
    /** Atmosphere strength and the counter's fill, top → bottom. */
    air: 1,
    count: [LIMB[0], LIMB[0], LIMB[1]],
    shadow: "rgba(0,0,0,0)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    stage: "rgba(255,255,255,0.9)",
    fg: "#121214",
    muted: "#6E6C67",
    dot: [34, 33, 36],
    backDot: 0.06,
    body0: "#FFFFFF",
    body1: "#E6E5F0",
    rim: "#FFFFFF",
    air: 0.55,
    count: [LIMB[3], LIMB[3], LIMB[2]],
    shadow: "rgba(70,60,45,0.22)",
    grain: 0.04,
  },
} as const;

type Theme = (typeof THEMES)[keyof typeof THEMES];

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
          seed={3}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

/** The counter digits slide up by one on every landing. */
function Counter({
  value,
  since,
  fontSize,
  fill,
}: {
  value: number;
  since: number;
  fontSize: number;
  /** Top → bottom stops painted through the digits. */
  fill: readonly string[];
}) {
  const p = interpolate(since, [0, 12], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const prev = String(value - 1);
  const next = String(value);
  const width = Math.max(prev.length, next.length);
  const cells = Array.from({ length: width }, (_, i) => {
    const a = prev.padStart(width, " ")[i];
    const b = next.padStart(width, " ")[i];
    return { a, b, moving: a !== b };
  });
  const paint: React.CSSProperties = {
    backgroundImage: `linear-gradient(180deg, ${fill[0]} 12%, ${fill[1]} 40%, ${fill[2]} 92%)`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };
  return (
    <div
      style={{
        display: "flex",
        fontFamily: sans,
        fontWeight: 400,
        fontSize,
        lineHeight: 1,
        letterSpacing: "-0.055em",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {cells.map((c, i) => (
        <span
          key={i}
          style={{
            position: "relative",
            display: "inline-block",
            height: fontSize * 1.02,
            overflow: "hidden",
          }}
        >
          <span style={{ visibility: "hidden" }}>{c.b === " " ? "" : "0"}</span>
          {c.moving ? (
            <>
              <span
                style={{
                  ...paint,
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transform: `translateY(${-p * fontSize}px)`,
                  opacity: 1 - p,
                }}
              >
                {c.a}
              </span>
              <span
                style={{
                  ...paint,
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transform: `translateY(${(1 - p) * fontSize}px)`,
                  opacity: p,
                }}
              >
                {c.b}
              </span>
            </>
          ) : (
            <span style={{ ...paint, position: "absolute", left: 0, top: 0 }}>
              {c.b}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export function DotGlobe({
  count = 142,
  prefix = "Live in",
  suffix = "countries",
  routes = DEFAULT_ROUTES,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: DotGlobeProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const th: Theme = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  // camera
  const settle = interpolate(t, [0, 60], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const tiltP = interpolate(t, [0, 210], [0, 1], { ...CLAMP, easing: EASE_IO });
  const tilt = (6 + 14 * tiltP) * DEG;
  const lon0 = (8 - t * 0.24) * DEG;
  const R = height * 0.42 * (0.94 + 0.06 * settle);
  const cx = width * 0.655;
  const cy = height * 0.52 + (1 - settle) * 18 * u;

  const ct = Math.cos(tilt);
  const stl = Math.sin(tilt);
  const cl0 = Math.cos(lon0);
  const sl0 = Math.sin(lon0);
  /** World vector → rotated camera space (z toward viewer). */
  const rot = (v: V3): V3 => {
    // spin around the polar axis by -lon0
    const x = v[0] * cl0 - v[2] * sl0;
    const z0 = v[0] * sl0 + v[2] * cl0;
    const y = v[1] * ct - z0 * stl;
    const z = v[1] * stl + z0 * ct;
    return [x, y, z];
  };
  const proj = (p: V3) => [cx + p[0] * R, cy - p[1] * R] as const;
  const hidden = (p: V3) => p[2] < 0 && p[0] * p[0] + p[1] * p[1] < 1;

  // light from upper-left, slightly in front
  const L: V3 = [-0.5, 0.55, 0.67];

  const back: React.ReactNode[] = [];
  const front: React.ReactNode[] = [];
  const baseR = 2.15 * u * (R / (height * 0.42));
  for (let i = 0; i < DOTS.length; i++) {
    const d = DOTS[i];
    const appear = interpolate(t, [d.h * 18, d.h * 18 + 12], [0, 1], CLAMP);
    if (appear <= 0) continue;
    const lon = d.lon;
    const v: V3 = [d.cl * Math.sin(lon), d.sl, d.cl * Math.cos(lon)];
    const p = rot(v);
    const [sx, sy] = proj(p);
    if (p[2] < 0) {
      back.push(
        <circle
          key={i}
          cx={sx}
          cy={sy}
          r={baseR * 0.62}
          fillOpacity={th.backDot * appear}
        />,
      );
    } else {
      const lambert = Math.max(0, p[0] * L[0] + p[1] * L[1] + p[2] * L[2]);
      const o =
        (0.28 + 0.72 * lambert) *
        appear *
        (0.35 + 0.65 * Math.min(1, p[2] * 3));
      front.push(
        <circle
          key={i}
          cx={sx}
          cy={sy}
          r={baseR * (0.55 + 0.45 * Math.sqrt(p[2]))}
          fillOpacity={o}
        />,
      );
    }
  }

  // routes
  let landed = 0;
  let lastLanding = -999;
  const arcs: React.ReactNode[] = [];
  const pins: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];
  routes.forEach((route, ri) => {
    const start = ROUTE_START + ri * ROUTE_GAP;
    const lt = t - start;
    if (lt < -4) return;
    const a = toVec(route.from);
    const b = toVec(route.to);
    const ang = Math.acos(
      Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])),
    );
    const lift = 0.07 + 0.34 * (ang / Math.PI);
    const head = interpolate(lt, [0, FLIGHT], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    const tail = interpolate(lt, [FLIGHT * 0.55, FLIGHT + 26], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    const landAt = start + FLIGHT;
    if (t >= landAt) {
      landed += 1;
      lastLanding = landAt;
    }

    // origin pin
    const pa = rot(a);
    const [ax, ay] = proj(pa);
    const originO = interpolate(lt, [-4, 4], [0, 1], CLAMP);
    if (!hidden(pa)) {
      pins.push(
        <circle
          key={`o${ri}`}
          cx={ax}
          cy={ay}
          r={2.6 * u}
          fill={accent}
          opacity={originO * Math.min(1, pa[2] * 4)}
        />,
      );
    }

    // the arc: short segments with an opacity ramp toward the head
    const STEPS = 56;
    if (head > tail) {
      for (let k = 0; k < STEPS; k++) {
        const s0 = k / STEPS;
        const s1 = (k + 1) / STEPS;
        if (s1 < tail || s0 > head) continue;
        const ss0 = Math.max(s0, tail);
        const ss1 = Math.min(s1, head);
        const pt = (s: number) => {
          const g = slerp(a, b, s);
          const r = 1 + lift * Math.sin(Math.PI * s);
          return rot([g[0] * r, g[1] * r, g[2] * r]);
        };
        const q0 = pt(ss0);
        const q1 = pt(ss1);
        if (hidden(q0) || hidden(q1)) continue;
        const [x0, y0] = proj(q0);
        const [x1, y1] = proj(q1);
        const rel = (ss1 - tail) / Math.max(1e-3, head - tail);
        arcs.push(
          <line
            key={`a${ri}-${k}`}
            x1={x0}
            y1={y0}
            x2={x1}
            y2={y1}
            stroke={accent}
            strokeWidth={2.4 * u}
            strokeLinecap="round"
            opacity={0.15 + 0.85 * rel}
          />,
        );
      }
      if (lt < FLIGHT) {
        const g = slerp(a, b, head);
        const r = 1 + lift * Math.sin(Math.PI * head);
        const hp = rot([g[0] * r, g[1] * r, g[2] * r]);
        if (!hidden(hp)) {
          const [hx, hy] = proj(hp);
          arcs.push(
            <circle key={`h${ri}`} cx={hx} cy={hy} r={3.2 * u} fill={accent} />,
          );
        }
      }
    }

    // landing: rings drawn in the tangent plane, then a resting pin
    const since = t - landAt;
    const pb = rot(b);
    if (since >= 0 && !hidden(pb)) {
      // tangent basis at b
      const up: V3 = Math.abs(b[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
      const e1: V3 = [
        up[1] * b[2] - up[2] * b[1],
        up[2] * b[0] - up[0] * b[2],
        up[0] * b[1] - up[1] * b[0],
      ];
      const n1 = Math.hypot(...e1);
      e1[0] /= n1;
      e1[1] /= n1;
      e1[2] /= n1;
      const e2: V3 = [
        b[1] * e1[2] - b[2] * e1[1],
        b[2] * e1[0] - b[0] * e1[2],
        b[0] * e1[1] - b[1] * e1[0],
      ];
      [0, 7].forEach((delay, k) => {
        const rp = interpolate(since - delay, [0, 30], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        if (rp <= 0 || rp >= 1) return;
        const rho = 0.012 + rp * 0.085;
        const pts: string[] = [];
        for (let j = 0; j <= 32; j++) {
          const th2 = (j / 32) * Math.PI * 2;
          const cr = Math.cos(rho);
          const sr = Math.sin(rho);
          const w: V3 = [
            b[0] * cr + sr * (Math.cos(th2) * e1[0] + Math.sin(th2) * e2[0]),
            b[1] * cr + sr * (Math.cos(th2) * e1[1] + Math.sin(th2) * e2[1]),
            b[2] * cr + sr * (Math.cos(th2) * e1[2] + Math.sin(th2) * e2[2]),
          ];
          const [px, py] = proj(rot(w));
          pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
        }
        arcs.push(
          <polygon
            key={`r${ri}-${k}`}
            points={pts.join(" ")}
            fill="none"
            stroke={accent}
            strokeWidth={(1.6 - k * 0.4) * u}
            opacity={(1 - rp) * (k === 0 ? 0.9 : 0.5)}
          />,
        );
      });
      const [bx, by] = proj(pb);
      const pinP = interpolate(since, [0, 8], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      pins.push(
        <circle
          key={`p${ri}`}
          cx={bx}
          cy={by}
          r={(2.4 + 1.6 * (1 - pinP) + 0.6) * u}
          fill={accent}
          stroke={th.bg}
          strokeWidth={1.2 * u}
          opacity={Math.min(1, pb[2] * 4)}
        />,
      );
      const labelO =
        interpolate(since, [2, 12], [0, 1], CLAMP) *
        interpolate(since, [44, 58], [1, 0], CLAMP);
      if (labelO > 0) {
        labels.push(
          <div
            key={`l${ri}`}
            style={{
              position: "absolute",
              left: bx + 12 * u,
              top: by - 9 * u,
              fontFamily: sans,
              fontSize: 13 * u,
              fontWeight: 500,
              letterSpacing: "-0.005em",
              color: th.fg,
              whiteSpace: "nowrap",
              opacity: labelO,
              transform: `translateX(${(1 - labelO) * -6 * u}px)`,
              textShadow: `0 0 ${6 * u}px ${th.bg}, 0 0 ${2 * u}px ${th.bg}`,
            }}
          >
            {route.to.name}
          </div>,
        );
      }
    }
  });

  const value = count - routes.length + landed;
  const textP = (d: number) =>
    interpolate(t, [6 + d, 34 + d], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const marginX = width * 0.094;
  const bigSize = Math.min(168 * u, width * 0.13);
  const smallSize = 40 * u;
  const dotFill = `rgb(${th.dot[0]},${th.dot[1]},${th.dot[2]})`;

  const textItem = (d: number): React.CSSProperties => ({
    opacity: textP(d),
    transform: `translateY(${(1 - textP(d)) * 18 * u}px)`,
  });

  return (
    <AbsoluteFill style={{ background: th.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 70% at 62% 35%, ${th.stage}, transparent 72%)`,
        }}
      />
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <radialGradient id={`body${uid}`} cx="38%" cy="30%" r="75%">
            <stop offset="0%" stopColor={th.body0} />
            <stop offset="100%" stopColor={th.body1} />
          </radialGradient>
          <radialGradient id={`rim${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor={th.rim} stopOpacity={0} />
            <stop offset="96%" stopColor={th.rim} stopOpacity={0.35} />
            <stop offset="100%" stopColor={th.rim} stopOpacity={0.9} />
          </radialGradient>
          <linearGradient id={`rimMask${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity={1} />
            <stop offset="55%" stopColor="#fff" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id={`rm${uid}`}>
            <rect
              x={cx - R}
              y={cy - R}
              width={R * 2}
              height={R * 2}
              fill={`url(#rimMask${uid})`}
            />
          </mask>
          {/* the lit limb: a thin bright edge falling off into deep violet */}
          <radialGradient
            id={`air${uid}`}
            gradientUnits="userSpaceOnUse"
            cx={cx}
            cy={cy}
            r={R * 1.5}
          >
            <stop
              offset={`${(100 / 1.5) * 0.96}%`}
              stopColor={LIMB[1]}
              stopOpacity={0}
            />
            <stop
              offset={`${(100 / 1.5) * 1.0}%`}
              stopColor={LIMB[0]}
              stopOpacity={0.75}
            />
            <stop
              offset={`${(100 / 1.5) * 1.03}%`}
              stopColor={LIMB[1]}
              stopOpacity={0.45}
            />
            <stop
              offset={`${(100 / 1.5) * 1.12}%`}
              stopColor={LIMB[2]}
              stopOpacity={0.22}
            />
            <stop
              offset={`${(100 / 1.5) * 1.3}%`}
              stopColor={LIMB[3]}
              stopOpacity={0.1}
            />
            <stop offset="100%" stopColor={LIMB[3]} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`sh${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={th.shadow} />
            <stop offset="100%" stopColor={th.shadow} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* contact shadow (light theme) */}
        <ellipse
          cx={cx + R * 0.08}
          cy={cy + R * 1.08}
          rx={R * 0.85}
          ry={R * 0.1}
          fill={`url(#sh${uid})`}
          opacity={settle}
        />
        <circle
          cx={cx}
          cy={cy}
          r={R * 1.5}
          fill={`url(#air${uid})`}
          opacity={
            th.air *
            interpolate(t, [0, 40, 210], [0, 0.85, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            })
          }
        />
        <g opacity={interpolate(t, [0, 16], [0, 1], CLAMP)}>
          <circle cx={cx} cy={cy} r={R} fill={`url(#body${uid})`} />
        </g>
        <g fill={dotFill}>{back}</g>
        <g fill={dotFill}>{front}</g>
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill={`url(#rim${uid})`}
          mask={`url(#rm${uid})`}
          opacity={interpolate(t, [4, 30], [0, 1], CLAMP)}
        />
        {arcs}
        {pins}
      </svg>
      {labels}

      {/* counter */}
      <div
        style={{
          position: "absolute",
          left: marginX,
          top: height * 0.5 - (bigSize + smallSize * 2.4) / 2,
          display: "flex",
          flexDirection: "column",
          gap: 6 * u,
        }}
      >
        <div
          style={{
            ...textItem(0),
            fontFamily: sans,
            fontWeight: 400,
            fontSize: smallSize,
            letterSpacing: "-0.025em",
            color: th.muted,
            lineHeight: 1.1,
          }}
        >
          {prefix}
        </div>
        <div style={{ ...textItem(3), marginLeft: -bigSize * 0.04 }}>
          <Counter
            value={value}
            since={t - lastLanding}
            fontSize={bigSize}
            fill={th.count}
          />
        </div>
        <div
          style={{
            ...textItem(6),
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: smallSize * 1.3,
            letterSpacing: "-0.01em",
            color: th.fg,
            lineHeight: 1,
          }}
        >
          {suffix}
        </div>
      </div>

      <Grain opacity={th.grain} />
    </AbsoluteFill>
  );
}
