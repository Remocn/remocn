"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import { getLength, getPointAtLength, getSubpaths } from "@remotion/paths";
import type React from "react";
import { useMemo } from "react";
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

const { fontFamily: sans } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface SwarmShapePart {
  d: string;
  accent?: boolean;
}

export interface WaitlistSwarmProps {
  shape?: string | SwarmShapePart[];
  value?: number;
  label?: string;
  count?: number;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}
const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const DEFAULT_SHAPE: SwarmShapePart[] = [{ d: REMOCN_R_PATH }];
const MESH = {
  dark: ["#ECDCF2", "#8796EE", "#2E45B7", "#8796EE", "#ECDCF2"],
  light: ["#8796EE", "#2E45B7", "#0E1645", "#2E45B7", "#8796EE"],
} as const;
const MESH_POS = [
  [0.16, 0.2],
  [0.84, 0.26],
  [0.72, 0.86],
  [0.22, 0.8],
  [0.52, 0.48],
] as const;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const FLIGHT = Easing.bezier(0.65, 0, 0.35, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const LIGHT_GLASS: Partial<GradientParams> = {
  colors: ["#a9bbff", "#3b5bfd", "#1a2a9e", "#8fa6ff"],
};
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#020309",
    ground: "spotlight" as GshPresetId,
    fg: "#F3F2EF",
    muted: "rgba(243,242,239,0.55)",
    scrim: "2,3,9",
    scrimA: 0.35,
  },
  light: {
    bg: "#EEF0F6",
    ground: "glasswork" as GshPresetId,
    fg: "#121214",
    muted: "rgba(18,18,20,0.55)",
    scrim: "244,244,247",
    scrimA: 0.82,
  },
} as const;
const CURSOR = "M0 0L0 14.2L3.6 10.9L6.1 16.4L8.6 15.3L6.1 9.9L11 9.9Z";

function hexRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function meshAt(
  ux: number,
  uy: number,
  cols: readonly [number, number, number][],
  drift: number,
) {
  let r = 0;
  let g = 0;
  let b = 0;
  let wsum = 0;
  for (let i = 0; i < cols.length; i++) {
    const [bx, by] = MESH_POS[i];
    const dx = ux - (bx + Math.sin(drift + i * 1.7) * 0.04);
    const dy = uy - (by + Math.cos(drift * 0.8 + i * 2.3) * 0.04);
    const w = Math.exp(-(dx * dx + dy * dy) / 0.06);
    r += cols[i][0] * w;
    g += cols[i][1] * w;
    b += cols[i][2] * w;
    wsum += w;
  }
  return [r / wsum, g / wsum, b / wsum] as const;
}

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type Poly = [number, number][];

function insideEvenOdd(px: number, py: number, polys: Poly[]) {
  let inside = false;
  for (const poly of polys) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (
        yi > py !== yj > py &&
        px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }
  }
  return inside;
}

interface Target {
  x: number;
  y: number;
  accent: boolean;
  edge: boolean;
}
function sampleTargets(parts: SwarmShapePart[], count: number) {
  const flat = parts.map((part) => {
    const polys: Poly[] = [];
    const outlines: { poly: Poly; len: number }[] = [];
    for (const sub of getSubpaths(part.d)) {
      const len = getLength(sub);
      if (len <= 0) continue;
      const n = Math.max(16, Math.min(500, Math.ceil(len / 0.5)));
      const poly: Poly = [];
      for (let i = 0; i <= n; i++) {
        const p = getPointAtLength(sub, (len * i) / n);
        if (p) poly.push([p.x, p.y]);
      }
      polys.push(poly);
      outlines.push({ poly, len });
    }
    return { polys, outlines, accent: Boolean(part.accent) };
  });

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const part of flat) {
    for (const poly of part.polys) {
      for (const [x, y] of poly) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const bw = maxX - minX || 1;
  const bh = maxY - minY || 1;
  const which = (x: number, y: number) => {
    for (let k = flat.length - 1; k >= 0; k--) {
      if (insideEvenOdd(x, y, flat[k].polys)) return k;
    }
    return -1;
  };
  const g = 80;
  let hits = 0;
  for (let i = 0; i < g; i++) {
    for (let j = 0; j < g; j++) {
      if (which(minX + ((i + 0.5) / g) * bw, minY + ((j + 0.5) / g) * bh) >= 0)
        hits++;
    }
  }
  const area = (hits / (g * g)) * bw * bh;
  const perimeter = flat.reduce(
    (s, p) => s + p.outlines.reduce((a, o) => a + o.len, 0),
    0,
  );
  const a = count;
  const b = -perimeter / 0.9;
  const c = -area / 0.866;
  const spacing = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);

  const out: Target[] = [];
  for (const part of flat) {
    for (const { poly, len } of part.outlines) {
      const n = Math.max(6, Math.round(len / (spacing * 0.9)));
      for (let i = 0; i < n; i++) {
        const idx = Math.floor((i / n) * (poly.length - 1));
        const [ax, ay] = poly[Math.max(0, idx - 1)];
        const [bx, by] = poly[Math.min(poly.length - 1, idx + 1)];
        const l = Math.hypot(bx - ax, by - ay) || 1;
        let nx = -(by - ay) / l;
        let ny = (bx - ax) / l;
        const [px, py] = poly[idx];
        if (!insideEvenOdd(px + nx * 0.05, py + ny * 0.05, part.polys)) {
          nx = -nx;
          ny = -ny;
        }
        out.push({
          x: px + nx * spacing * 0.3,
          y: py + ny * spacing * 0.3,
          accent: part.accent,
          edge: true,
        });
      }
    }
  }
  const edgeCount = out.length;
  const rowH = spacing * 0.866;
  let row = 0;
  for (let y = minY + rowH * 0.6; y < maxY; y += rowH, row++) {
    const off = row % 2 ? spacing / 2 : 0;
    for (let x = minX + off + spacing * 0.5; x < maxX; x += spacing) {
      const k = out.length * 13 + row * 7;
      const jx = x + (hash(k + 0.31) - 0.5) * spacing * 0.3;
      const jy = y + (hash(k + 0.77) - 0.5) * spacing * 0.3;
      const part = which(jx, jy);
      if (part < 0) continue;
      let near = false;
      for (let e = 0; e < edgeCount; e++) {
        const dx = out[e].x - jx;
        const dy = out[e].y - jy;
        if (dx * dx + dy * dy < spacing * spacing * 0.42) {
          near = true;
          break;
        }
      }
      if (!near)
        out.push({ x: jx, y: jy, accent: flat[part].accent, edge: false });
    }
  }
  const cx = minX + bw / 2;
  const cy = minY + bh / 2;
  return {
    points: out.map((p) => ({ ...p, x: (p.x - cx) / bh, y: (p.y - cy) / bh })),
    spacing: spacing / bh,
    aspect: bw / bh,
  };
}

interface Particle {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  cx: number;
  cy: number;
  start: number;
  dur: number;
  arrive: number;
  cursor: boolean;
  size: number;
  ux: number;
  uy: number;
  tone: number;
  depth: number;
  phase: number;
  accent: boolean;
}

function formatNumber(n: number) {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function bezier(p: Particle, e: number) {
  const k = 1 - e;
  return {
    x: k * k * p.sx + 2 * k * e * p.cx + e * e * p.tx,
    y: k * k * p.sy + 2 * k * e * p.cy + e * e * p.ty,
  };
}

export function WaitlistSwarm({
  shape = DEFAULT_SHAPE,
  value = 12480,
  label = "on the waitlist",
  count = 760,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
  ground,
  groundParams,
}: WaitlistSwarmProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const u = height / 720;
  const pal = THEMES[theme];

  const parts = useMemo(
    () => (typeof shape === "string" ? [{ d: shape }] : shape),
    [shape],
  );
  const sampled = useMemo(() => sampleTargets(parts, count), [parts, count]);

  const markH = tall ? width * 0.62 : height * 0.56;
  const fx = tall ? width / 2 : width * 0.33;
  const fy = tall ? height * 0.34 : height * 0.5;
  const sp = sampled.spacing * markH;

  const particles = useMemo(() => {
    const list: Particle[] = sampled.points.map((pt, i) => {
      const h1 = hash(i + 1.1);
      const h2 = hash(i + 2.3);
      const h3 = hash(i + 3.7);
      const h4 = hash(i + 4.9);
      const tx = fx + pt.x * markH;
      const ty = fy + pt.y * markH;
      const base = Math.atan2(pt.y, pt.x * 0.8);
      const ang = base + (h1 - 0.5) * 2.4;
      const dx = Math.cos(ang);
      const dy = Math.sin(ang);
      const reach = Math.min(
        Math.abs((width / 2 + 60 * u) / (dx || 1e-3)),
        Math.abs((height / 2 + 60 * u) / (dy || 1e-3)),
      );
      const far = reach + h2 * 260 * u;
      const sx = width / 2 + dx * far;
      const sy = height / 2 + dy * far;
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      const field =
        Math.sin(mx / (210 * u) + 1.3) * 1.4 +
        Math.cos(my / (170 * u) - 0.7) * 1.2 +
        Math.sin((mx + my) / (330 * u) + 2.1);
      const dist = Math.hypot(tx - sx, ty - sy);
      const bend = dist * (0.32 + h3 * 0.14);
      const ccx = mx + Math.cos(field) * bend;
      const ccy = my + Math.sin(field) * bend;
      const radial = Math.min(1, Math.hypot(pt.x, pt.y) / 0.6);
      const start = -22 + (1 - radial) * 20 + h4 * 34;
      const dur = 40 + h3 * 18 + (far / (width * 0.7)) * 10;
      const cursor = !pt.accent && hash(i + 9.1) < 0.12;
      return {
        tx,
        ty,
        sx,
        sy,
        cx: ccx,
        cy: ccy,
        start,
        dur,
        arrive: start + dur,
        cursor,
        size: pt.edge ? 0.8 + h2 * 0.16 : 0.62 + hash(i + 7.7) ** 1.4 * 0.42,
        ux: pt.x / sampled.aspect + 0.5,
        uy: pt.y + 0.5,
        tone: pt.edge ? 1.04 : 0.8 + hash(i + 5.3) * 0.3,
        depth: hash(i + 8.2),
        phase: h1 * Math.PI * 2,
        accent: pt.accent,
      };
    });
    return list.sort((a, b) => a.depth - b.depth);
  }, [sampled, fx, fy, markH, width, height, u]);
  const meshCols = useMemo(() => MESH[theme].map(hexRgb), [theme]);
  const drift = t / 60;

  const arrivals = useMemo(
    () => particles.map((p) => p.arrive).sort((a, b) => a - b),
    [particles],
  );
  const firstArrival = arrivals[Math.floor(arrivals.length * 0.04)];
  const lastArrival = arrivals[arrivals.length - 1];
  let landed = 0;
  for (const a of arrivals) if (a <= t) landed++;
  const fill = landed / arrivals.length;
  const pack = 1 + 0.06 * (1 - EASE_IO(fill));
  const cam = interpolate(t, [0, 170], [1.07, 1], {
    ...CLAMP,
    easing: CAMERA,
  });
  const camY = interpolate(t, [0, 170], [10 * u, 0], {
    ...CLAMP,
    easing: CAMERA,
  });
  const pulseStart = lastArrival + 8;
  const origin = useMemo(() => {
    const acc = particles.filter((p) => p.accent);
    const pts = acc.length > 8 ? acc : particles;
    return {
      x: pts.reduce((s, p) => s + p.tx, 0) / pts.length,
      y: pts.reduce((s, p) => s + p.ty, 0) / pts.length,
    };
  }, [particles]);
  const pulseR = (t - pulseStart) * 11 * u;
  const pulseW = 54 * u;
  const pulseOn = t > pulseStart && pulseR < markH * 1.6;

  const els: React.ReactNode[] = [];
  const ghosts: React.ReactNode[] = [];
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const raw = (t - p.start) / p.dur;
    if (raw <= 0) continue;
    const prog = Math.min(1, raw);
    const e = FLIGHT(prog);
    const pos = bezier(p, e);
    const ptx = fx + (p.tx - fx) * pack;
    const pty = fy + (p.ty - fy) * pack;
    let x = pos.x + (ptx - p.tx) * e;
    let y = pos.y + (pty - p.ty) * e;
    const docked = interpolate(t - p.arrive, [0, 20], [0, 1], CLAMP);
    x += Math.sin(t / 19 + p.phase) * 0.5 * u * docked;
    y += Math.cos(t / 23 + p.phase) * 0.5 * u * docked;

    let scale = 1 + (1 - e) * p.depth * 1.5;
    let opacity = interpolate(raw, [0, 0.12], [0, 1], CLAMP);
    opacity *= 0.55 + 0.45 * Math.min(1, e * 1.4);

    let glow = 0;
    if (pulseOn) {
      const d = Math.hypot(p.tx - origin.x, p.ty - origin.y);
      glow = Math.exp(-(((d - pulseR) / pulseW) ** 2));
      const fade = interpolate(
        pulseR,
        [markH * 1.1, markH * 1.6],
        [1, 0],
        CLAMP,
      );
      glow *= fade;
      const nx = (p.tx - origin.x) / (d || 1);
      const ny = (p.ty - origin.y) / (d || 1);
      x += nx * glow * 4 * u;
      y += ny * glow * 4 * u;
      scale *= 1 + glow * 0.5;
    }
    const rest = p.accent ? 1 : 1 - docked * 0.16;
    opacity *= rest + (1 - rest) * glow;

    const r = (sp * p.size * scale) / 2;
    const [mr, mg, mb] = p.accent
      ? hexRgb(accent)
      : meshAt(p.ux, p.uy, meshCols, drift);
    const tk = theme === "dark" ? p.tone : 2 - p.tone;
    const color =
      theme === "dark"
        ? `rgb(${Math.min(255, mr * tk)},${Math.min(255, mg * tk)},${Math.min(255, mb * tk)})`
        : `rgb(${mr + (245 - mr) * (tk - 1) * 0.9},${mg + (244 - mg) * (tk - 1) * 0.9},${mb + (240 - mb) * (tk - 1) * 0.9})`;
    if (prog < 0.92) {
      for (let k = 1; k <= 2; k++) {
        const pe = FLIGHT(Math.max(0, (t - k * 1.4 - p.start) / p.dur));
        const gp = bezier(p, pe);
        const sx = gp.x + (ptx - p.tx) * pe;
        const sy = gp.y + (pty - p.ty) * pe;
        if (Math.hypot(sx - x, sy - y) < r * 0.8) continue;
        ghosts.push(
          <circle
            key={`g${i}-${k}`}
            cx={sx}
            cy={sy}
            r={r * (p.cursor ? 0.5 : 0.85)}
            fill={color}
            opacity={opacity * (k === 1 ? 0.22 : 0.09)}
          />,
        );
      }
    }
    const morph = p.cursor ? interpolate(prog, [0.78, 1], [0, 1], CLAMP) : 1;
    if (p.cursor && morph < 1) {
      const s = (sp * 1.35 * scale * (1 - morph * 0.4)) / 16;
      const vx =
        x - bezier(p, FLIGHT(Math.max(0, (t - 1 - p.start) / p.dur))).x;
      const tilt = Math.max(-14, Math.min(14, -vx * 0.6)) * (1 - e);
      els.push(
        <path
          key={`c${i}`}
          d={CURSOR}
          fill={color}
          stroke={pal.bg}
          strokeWidth={1.1 / s}
          strokeLinejoin="round"
          opacity={opacity * (1 - morph)}
          transform={`translate(${x - 4 * s} ${y - 8 * s}) rotate(${tilt}) scale(${s})`}
        />,
      );
    }
    if (morph > 0) {
      els.push(
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r * (0.7 + morph * 0.3)}
          fill={color}
          stroke={pal.bg}
          strokeWidth={Math.max(0.8, r * 0.22)}
          opacity={opacity * morph}
        />,
      );
      if (glow > 0.04 && !p.accent) {
        els.push(
          <circle
            key={`p${i}`}
            cx={x}
            cy={y}
            r={r * (0.7 + morph * 0.3)}
            fill={accent}
            opacity={glow * 0.45}
          />,
        );
      }
    }
  }
  const shown =
    landed >= arrivals.length ? value : Math.min(value - 1, value * fill);
  const counterRise = spring({
    frame: t - (firstArrival - 16),
    fps,
    config: CARD,
  });
  const counterIn = interpolate(
    t,
    [firstArrival - 16, firstArrival + 2],
    [0, 1],
    { ...CLAMP, easing: EASE_OUT },
  );
  const labelIn = interpolate(
    t,
    [firstArrival - 10, firstArrival + 10],
    [0, 1],
    { ...CLAMP, easing: EASE_OUT },
  );
  const punch =
    t >= lastArrival
      ? 1 + 0.05 * (1 - spring({ frame: t - lastArrival, fps, config: CHIP }))
      : 1;
  const numFs = tall ? height * 0.1 : height * 0.18;
  const labelFs = tall ? height * 0.03 : height * 0.05;
  const counterBox: React.CSSProperties = tall
    ? {
        left: 0,
        right: 0,
        top: fy + markH / 2 + height * 0.07,
        alignItems: "center",
      }
    : {
        left: width * 0.56,
        top: fy - numFs * 0.72,
        alignItems: "flex-start",
      };

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <GshGround
        preset={groundParams ? undefined : (ground ?? pal.ground)}
        params={
          groundParams ??
          (theme === "light" && !ground ? LIGHT_GLASS : undefined)
        }
        timeOffset={theme === "dark" ? 2 : 11}
        timeScale={0.45}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${tall ? "95% 48%" : "70% 80%"} at ${tall ? 50 : 45}% ${tall ? 42 : 50}%, rgba(${pal.scrim},${pal.scrimA}) 0%, rgba(${pal.scrim},0) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `translateY(${camY}px) scale(${cam})`,
          transformOrigin: `${(fx / width) * 100}% ${(fy / height) * 100}%`,
        }}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          <g>{ghosts}</g>
          <g>{els}</g>
        </svg>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          ...counterBox,
          display: "flex",
          flexDirection: "column",
          gap: labelFs * 0.5,
          fontFamily: sans,
          color: pal.fg,
        }}
      >
        <span
          style={{
            fontWeight: 300,
            fontSize: numFs,
            lineHeight: 1,
            letterSpacing: "-0.045em",
            fontVariantNumeric: "tabular-nums",
            opacity: counterIn,
            transformOrigin: tall ? "50% 60%" : "0% 60%",
            transform: `translateY(${(1 - counterRise) * 0.18 * numFs}px) scale(${punch})`,
            filter: `blur(${(1 - counterIn) * 6 * u}px)`,
          }}
        >
          {formatNumber(shown)}
        </span>
        <span
          style={{
            fontWeight: 400,
            fontSize: labelFs,
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            paddingLeft: tall ? 0 : numFs * 0.05,
            color: pal.muted,
            opacity: labelIn,
            transform: `translateY(${(1 - labelIn) * 0.4 * labelFs}px)`,
          }}
        >
          {label}
        </span>
      </div>
    </AbsoluteFill>
  );
}
