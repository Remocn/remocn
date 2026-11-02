"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const geist = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface ShardsToGridProps {
  images?: string[];
  title?: string;
  status?: string;
  headline?: string;
  labels?: string[];
  theme?: "dark" | "light";
  background?: string;
  accent?: string;
  blooms?: string[];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const THEMES = {
  dark: {
    preset: "film-blue" as GshPresetId,
    groundOffset: 4,
    window: "13,14,19",
    surface: "#15161c",
    ink: "238,240,246",
    chip: "rgba(255,255,255,0.07)",
    pill: "rgba(18,20,28,0.66)",
    pillInk: "#eef0f6",
    pillEdge: "rgba(255,255,255,0.12)",
    shadow: "2,3,12",
    shadowAlpha: 0.55,
  },
  light: {
    preset: "paper-crease" as GshPresetId,
    groundOffset: 2,
    window: "248,247,243",
    surface: "#fbfaf7",
    ink: "22,23,28",
    chip: "rgba(20,20,30,0.06)",
    pill: "rgba(255,255,255,0.78)",
    pillInk: "#17181d",
    pillEdge: "rgba(20,20,30,0.08)",
    shadow: "40,40,70",
    shadowAlpha: 0.22,
  },
};

const DEFAULT_IMAGES = [
  "templates/product-showcase/gallery.jpg",
  "templates/brand-guidelines/materials.jpg",
  "reel/reel-3.jpg",
  "templates/product-showcase/sculpture.jpg",
  "hero.png",
  "templates/launch-anything/horizon.jpg",
  "templates/brand-guidelines/ceramics.jpg",
  "reel/reel-5.jpg",
  "studio.png",
  "templates/launch-anything/desk.jpg",
  "templates/product-showcase/courtyard.jpg",
  "templates/brand-guidelines/chair.jpg",
];

const BEATS = [
  { name: "enter", at: 0 },
  { name: "drift", at: 66 },
  { name: "morph", at: 60 },
  { name: "converge", at: 62 },
  { name: "snap", at: 84 },
  { name: "content", at: 84 },
  { name: "end", at: 144 },
] as const;
type BeatName = (typeof BEATS)[number]["name"];
const beat = (n: BeatName) => BEATS.find((b) => b.name === n)?.at ?? 0;

const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const MORPH = { damping: 200 };
const TYPE_IN = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const SHARDS = 32;
const CELLS = 5;

type Rect = { x: number; y: number; w: number; h: number };
type Kind = "image" | "accent" | "type" | "wave" | "swatch";

const LAND_CELLS: Rect[] = [
  { x: 0, y: 0, w: 0.48, h: 1 },
  { x: 0.5, y: 0, w: 0.3, h: 0.56 },
  { x: 0.82, y: 0, w: 0.18, h: 0.56 },
  { x: 0.5, y: 0.58, w: 0.18, h: 0.42 },
  { x: 0.7, y: 0.58, w: 0.3, h: 0.42 },
];
const TALL_CELLS: Rect[] = [
  { x: 0, y: 0, w: 1, h: 0.44 },
  { x: 0, y: 0.46, w: 0.58, h: 0.3 },
  { x: 0.6, y: 0.46, w: 0.4, h: 0.3 },
  { x: 0, y: 0.78, w: 0.4, h: 0.22 },
  { x: 0.42, y: 0.78, w: 0.58, h: 0.22 },
];

const LAND_CLUSTERS = [
  { x: -0.56, y: -0.36, n: 9, r: 0.22 },
  { x: 0.5, y: -0.5, n: 6, r: 0.18 },
  { x: -0.4, y: 0.52, n: 7, r: 0.2 },
  { x: 0.64, y: 0.3, n: 6, r: 0.18 },
  { x: 0.1, y: -0.66, n: 4, r: 0.12 },
];
const TALL_CLUSTERS = [
  { x: -0.46, y: -0.5, n: 9, r: 0.3 },
  { x: 0.52, y: -0.3, n: 6, r: 0.26 },
  { x: -0.48, y: 0.34, n: 7, r: 0.28 },
  { x: 0.46, y: 0.58, n: 6, r: 0.26 },
  { x: 0.12, y: -0.8, n: 4, r: 0.18 },
];
const ASPECTS = [1.6, 1.33, 0.75, 1, 2.1, 0.62, 1.45, 0.8];
const SWATCH = ["#e6dac8", "#b48a62", "#4b5a47", "#1d2230"];

function Fragment({
  kind,
  w,
  h,
  surface,
  ink,
  accent,
  seed,
}: {
  kind: Kind;
  w: number;
  h: number;
  surface: string;
  ink: string;
  accent: string;
  seed: number;
}) {
  const u = Math.min(w, h);
  if (kind === "swatch") {
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        {[...SWATCH, accent].map((c) => (
          <span key={c} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </div>
    );
  }
  if (kind === "wave") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: surface,
          display: "flex",
          alignItems: "center",
          gap: w * 0.022,
          padding: `0 ${w * 0.09}px`,
        }}
      >
        {Array.from({ length: 16 }, (_, k) => {
          const v =
            0.18 +
            0.82 *
              Math.abs(Math.sin(seed * 3.1 + k * 0.9) * Math.cos(k * 0.37));
          return (
            <span
              key={`b-${k}`}
              style={{
                flex: 1,
                height: `${v * 62}%`,
                borderRadius: w,
                backgroundColor: k === 6 ? accent : `rgba(${ink},0.55)`,
              }}
            />
          );
        })}
      </div>
    );
  }
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: surface,
        padding: u * 0.12,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: `rgb(${ink})`,
      }}
    >
      <span
        style={{
          fontFamily: geist.fontFamily,
          fontWeight: 300,
          fontSize: u * 0.52,
          lineHeight: 0.9,
          letterSpacing: "-0.04em",
        }}
      >
        Aa
      </span>
      <span
        style={{
          fontFamily: mono.fontFamily,
          fontSize: u * 0.11,
          color: `rgba(${ink},0.5)`,
          whiteSpace: "nowrap",
        }}
      >
        Geist 300
      </span>
    </div>
  );
}

function RemocnR({ height, color }: { height: number; color: string }) {
  return (
    <svg
      viewBox="0 0 124.06 134.26"
      height={height}
      width={(height * 124.06) / 134.26}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden
    >
      <path fill={color} d={REMOCN_R_PATH} />
    </svg>
  );
}

function PlayIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="10.5"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
      <path d="M10 8.4 L15.6 12 L10 15.6 Z" fill={color} />
    </svg>
  );
}

function PlayOutline({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M8 5.8 L18 12 L8 18.2 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShardsToGrid({
  images,
  title = "Launch v1",
  status = "Assembling",
  headline = "Every frame, written in code.",
  labels = ["Motion", "Type", "Sound", "Play reel", "Brand"],
  theme = "dark",
  background,
  accent = "#3B5BFD",
  blooms,
  ground,
  groundParams,
}: ShardsToGridProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = THEMES[theme];
  const light = theme === "light";
  const srcs =
    images && images.length > 0 ? images : DEFAULT_IMAGES.map(staticFile);
  const portrait = H > W;
  const cx = W / 2;
  const cy = H / 2;
  const unit = portrait ? W / 1080 : W / 1280;
  const shadow = (a: number) => `rgba(${t.shadow},${a * t.shadowAlpha})`;
  const sp = (at: number, config: Partial<typeof CARD>) =>
    spring({ frame: frame - at, fps, config });

  const win: Rect = portrait
    ? { x: W * 0.05, y: H * 0.13, w: W * 0.9, h: H * 0.74 }
    : { x: W * 0.11, y: H * 0.1, w: W * 0.78, h: H * 0.8 };
  const bar = portrait ? H * 0.042 : H * 0.07;
  const pad = portrait ? W * 0.03 : W * 0.014;
  const content: Rect = {
    x: win.x + pad,
    y: win.y + bar,
    w: win.w - pad * 2,
    h: win.h - bar - pad,
  };
  const gapPx = pad * 0.75;
  const layout = portrait ? TALL_CELLS : LAND_CELLS;
  const cells = layout.map((c) => ({
    x: content.x + c.x * content.w + (c.x > 0 ? gapPx / 2 : 0),
    y: content.y + c.y * content.h + (c.y > 0 ? gapPx / 2 : 0),
    w:
      c.w * content.w -
      (c.x > 0 ? gapPx / 2 : 0) -
      (c.x + c.w < 1 ? gapPx / 2 : 0),
    h:
      c.h * content.h -
      (c.y > 0 ? gapPx / 2 : 0) -
      (c.y + c.h < 1 ? gapPx / 2 : 0),
  }));
  const cellRadius = portrait ? W * 0.022 : W * 0.011;

  const shards = useMemo(() => {
    const clusters = portrait ? TALL_CLUSTERS : LAND_CLUSTERS;
    const owner: number[] = [];
    clusters.forEach((c, ci) => {
      for (let k = 0; k < c.n; k++) owner.push(ci);
    });
    const cellCluster = [0, 1, 2, 3, 0];
    return Array.from({ length: SHARDS }, (_, i) => {
      const isCell = i < CELLS;
      const ci = isCell
        ? (cellCluster[i] as number)
        : (owner[(i * 7) % owner.length] as number);
      const c = clusters[ci] as (typeof clusters)[number];
      const g1 = random(`sg-g1-${i}`) + random(`sg-g2-${i}`) - 1;
      const g2 = random(`sg-g3-${i}`) + random(`sg-g4-${i}`) - 1;
      let nx = c.x * 0.86 + g1 * c.r * 1.6;
      let ny = c.y * 0.86 + g2 * c.r * (portrait ? 1.1 : 1.6);
      const clearX = portrait ? 0.7 : 0.44;
      const clearY = portrait ? 0.15 : 0.24;
      if (Math.abs(nx) < clearX && Math.abs(ny) < clearY) {
        ny = Math.sign(ny || 1) * (clearY + random(`sg-cl-${i}`) * 0.12);
      }
      nx = Math.max(-0.92, Math.min(0.92, nx));
      ny = Math.max(-0.9, Math.min(0.9, ny));
      const z = isCell ? 0.6 + random(`sg-z-${i}`) * 0.3 : random(`sg-z-${i}`);
      const sizeR = random(`sg-s-${i}`);
      const base =
        (portrait ? W : W * 0.62) *
        (isCell ? 0.12 + 0.03 * sizeR : 0.05 + 0.13 * sizeR ** 2) *
        (0.7 + z * 0.45);
      const asp = ASPECTS[(i * 5 + 3) % ASPECTS.length] as number;
      const r = random(`sg-k-${i}`);
      const kind: Kind = isCell
        ? i === 3
          ? "accent"
          : "image"
        : r < 0.5
          ? "image"
          : r < 0.68
            ? "type"
            : r < 0.86
              ? "wave"
              : "swatch";
      const dist = Math.hypot(nx, ny);
      return {
        i,
        isCell,
        kind,
        ci,
        nx,
        ny,
        z,
        w: base * Math.sqrt(asp),
        h: base / Math.sqrt(asp),
        rx: (random(`sg-rx-${i}`) - 0.5) * 30,
        ry: (random(`sg-ry-${i}`) - 0.5) * 36,
        rz: (random(`sg-rz-${i}`) - 0.5) * 14,
        delay: ci * 3 + Math.round(random(`sg-d-${i}`) * 8) - 16,
        conv: isCell
          ? beat("converge") + i * 2
          : beat("converge") - 2 + Math.round((1.2 - dist) * 6),
        seed: random(`sg-b-${i}`) * Math.PI * 2,
      };
    });
  }, [portrait, W]);

  const swirlP = (f: number) =>
    interpolate(f, [0, beat("drift")], [0, 1], { ...CLAMP, easing: MOVE });

  const shardAt = (s: (typeof shards)[number], f: number) => {
    const e = spring({ frame: f - s.delay, fps, config: CARD });
    const sw = swirlP(f);
    const theta = (0.42 + 0.3 * s.z) * sw;
    const tight = 1 - 0.16 * sw;
    const cl = (portrait ? TALL_CLUSTERS : LAND_CLUSTERS)[s.ci] as {
      x: number;
      y: number;
    };
    const ccx = cl.x * 0.86;
    const ccy = cl.y * 0.86;
    const local = (s.seed > Math.PI ? 1 : -1) * 1.25 * sw;
    const lx = s.nx - ccx;
    const ly = s.ny - ccy;
    const ox = ccx + lx * Math.cos(local) - ly * Math.sin(local) * (H / W);
    const oy = ccy + ly * Math.cos(local) + lx * Math.sin(local) * (W / H);
    const bx = ox * (W / 2) * tight;
    const by = oy * (H / 2) * tight;
    const rxp = bx * Math.cos(theta) - by * Math.sin(theta) * (W / H) * 0.5;
    const ryp = by * Math.cos(theta) + bx * Math.sin(theta) * (H / W) * 0.9;
    const bob = Math.sin(f * 0.06 + s.seed) * 5 * unit * (0.4 + s.z);
    const dirx = s.nx / (Math.hypot(s.nx, s.ny) || 1);
    const diry = s.ny / (Math.hypot(s.nx, s.ny) || 1);
    const fly = (1 - e) * W * (0.4 + s.z * 0.3);
    const sx = cx + rxp + dirx * fly;
    const sy = cy + ryp + diry * fly + bob;
    const q = spring({
      frame: f - s.conv,
      fps,
      config: s.isCell ? CARD : HEAVY,
    });
    const target: Rect = s.isCell
      ? (cells[s.i] as Rect)
      : { x: cx - s.w * 0.1, y: cy - s.h * 0.1, w: s.w * 0.2, h: s.h * 0.2 };
    const tx = target.x + target.w / 2;
    const ty = target.y + target.h / 2;
    return {
      x: sx + (tx - sx) * q,
      y: sy + (ty - sy) * q,
      w: s.w + (target.w - s.w) * q,
      h: s.h + (target.h - s.h) * q,
      rx: s.rx * (1 - q) * (1 - 0.3 * sw),
      ry: (s.ry + (1 - e) * 40 * (dirx > 0 ? -1 : 1)) * (1 - q),
      rz: (s.rz + (1 - e) * 24 * (diry > 0 ? 1 : -1)) * (1 - q),
      e,
      q,
    };
  };

  const morph = sp(beat("morph"), MORPH);
  const pillH = portrait ? H * 0.046 : H * 0.096;
  const pillW = portrait ? W * 0.76 : W * 0.34;
  const pillFont = pillH * 0.38;
  const winRect: Rect = {
    x: cx - pillW / 2 + (win.x - (cx - pillW / 2)) * morph,
    y: cy - pillH / 2 + (win.y - (cy - pillH / 2)) * morph,
    w: pillW + (win.w - pillW) * morph,
    h: pillH + (win.h - pillH) * morph,
  };
  const winRadius = pillH / 2 + (cellRadius * 1.7 - pillH / 2) * morph;
  const pillIn = sp(-8, CARD);
  const pct = Math.round(
    interpolate(frame, [0, beat("morph")], [12, 100], {
      ...CLAMP,
      easing: Easing.bezier(0.33, 0, 0.2, 1),
    }),
  );
  const pillText = interpolate(
    frame,
    [beat("morph"), beat("morph") + 5],
    [1, 0],
    { ...CLAMP, easing: Easing.bezier(0.55, 0, 1, 0.45) },
  );
  const chrome = interpolate(
    frame,
    [beat("morph") + 10, beat("morph") + 22],
    [0, 1],
    { ...CLAMP, easing: TYPE_IN },
  );
  const fill = interpolate(morph, [0, 0.25], [0, 1], CLAMP);
  const winBg = light
    ? `rgba(${t.window},${0.78 + 0.22 * fill})`
    : `rgba(${t.window},${0.66 + 0.34 * fill})`;
  const snapPunch = interpolate(
    frame,
    [beat("snap"), beat("snap") + 2, beat("snap") + 10],
    [0, 1, 0],
    { ...CLAMP, easing: MOVE },
  );
  const push = interpolate(frame, [0, beat("end")], [1.02, 1.05]);

  const label = Math.max(16 * unit, portrait ? W * 0.026 : W * 0.0135);
  const heroCell = cells[0] as Rect;
  const heroFont = portrait ? heroCell.w * 0.088 : heroCell.w * 0.088;
  const contentIn = (k: number) => sp(beat("content") + k * 3, CARD);
  const headlineIn = (k: number) =>
    interpolate(
      frame,
      [beat("content") + k * 2, beat("content") + k * 2 + 13],
      [0, 1],
      { ...CLAMP, easing: TYPE_IN },
    );
  const custom =
    background || (blooms && blooms.length > 0)
      ? {
          ...(background ? { background } : {}),
          ...(blooms && blooms.length > 0 ? { colors: blooms } : {}),
        }
      : undefined;
  const preset = ground ?? (groundParams ? undefined : t.preset);
  const gParams = groundParams ?? custom;

  const order = [...shards].sort((a, b) =>
    a.isCell === b.isCell ? a.z - b.z : a.isCell ? 1 : -1,
  );

  const renderShard = (s: (typeof shards)[number]) => {
    const p = shardAt(s, frame);
    const prev = shardAt(s, frame - 1);
    const vel = Math.hypot(p.x - prev.x, p.y - prev.y);
    const motion = Math.min(8, vel * 0.09);
    const depthBlur = s.isCell
      ? 0
      : s.z < 0.3
        ? (0.3 - s.z) * 12
        : s.z > 0.92
          ? 2
          : 0;
    const fade = s.isCell
      ? 1
      : interpolate(frame, [s.conv + 6, s.conv + 14], [1, 0], CLAMP);
    if (fade <= 0) return null;
    const radius = Math.min(p.w, p.h) * 0.07 * (1 - p.q) + cellRadius * p.q;
    const src = srcs[(s.i + (s.isCell ? 0 : 3)) % srcs.length] as string;
    const bg = s.kind === "accent" ? accent : t.surface;
    return (
      <div
        key={`sh-${s.i}`}
        style={{
          position: "absolute",
          left: p.x - p.w / 2,
          top: p.y - p.h / 2,
          width: p.w,
          height: p.h,
          borderRadius: radius,
          overflow: "hidden",
          backgroundColor: bg,
          opacity:
            Math.min(1, p.e * 2) *
            fade *
            (s.isCell ? 1 : 0.55 + 0.45 * Math.min(1, s.z * 2)),
          transform: `perspective(${W * 1.2}px) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg)`,
          filter:
            motion + depthBlur * (1 - p.q) > 0.3
              ? `blur(${motion + depthBlur * (1 - p.q)}px)`
              : undefined,
          boxShadow: `0 ${2 * unit}px ${6 * unit}px ${shadow(0.5)}, 0 ${24 * unit}px ${60 * unit}px ${shadow(0.5)}`,
        }}
      >
        {s.kind === "image" ? (
          <Img
            src={src}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : null}
        {s.kind === "type" || s.kind === "wave" || s.kind === "swatch" ? (
          <Fragment
            kind={s.kind}
            w={p.w}
            h={p.h}
            surface={t.surface}
            ink={t.ink}
            accent={accent}
            seed={s.seed}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            boxShadow: `inset 0 0 0 1px ${light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}`,
          }}
        />
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={t.groundOffset}
        timeScale={0.5}
      />
      <AbsoluteFill
        style={{ transform: `scale(${push * (1 + snapPunch * 0.012)})` }}
      >
        {order
          .filter((s) => !s.isCell || frame < beat("morph"))
          .map(renderShard)}
        <div
          style={{
            position: "absolute",
            left: winRect.x,
            top: winRect.y,
            width: winRect.w,
            height: winRect.h,
            borderRadius: winRadius,
            backgroundColor: fill > 0.01 ? winBg : t.pill,
            opacity: pillIn,
            transform: `translateY(${(1 - pillIn) * H * 0.04}px)`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,${light ? 0.9 : 0.07}), 0 0 0 1px ${t.pillEdge}, 0 ${(2 + 4 * morph) * unit}px ${(6 + 10 * morph) * unit}px ${shadow(0.5)}, 0 ${(16 + 40 * morph) * unit}px ${(40 + 100 * morph) * unit}px ${shadow(0.6)}`,
            backdropFilter: fill < 1 ? "blur(14px)" : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: pillFont * 0.7,
              fontFamily: geist.fontFamily,
              fontSize: pillFont,
              fontWeight: 400,
              color: t.pillInk,
              letterSpacing: "-0.01em",
              opacity: pillText,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: pillFont * 0.42,
                height: pillFont * 0.42,
                borderRadius: "50%",
                backgroundColor: accent,
              }}
            />
            <span>{title}</span>
            <span style={{ opacity: 0.5, fontWeight: 300 }}>{status}</span>
            <span
              style={{
                fontFamily: mono.fontFamily,
                opacity: 0.6,
                fontSize: pillFont * 0.9,
                minWidth: "3.4ch",
                textAlign: "right",
              }}
            >
              {pct}%
            </span>
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: bar,
              display: "flex",
              alignItems: "center",
              padding: `0 ${pad * 1.2}px`,
              opacity: chrome,
              fontFamily: geist.fontFamily,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: label * 0.6,
                fontSize: label,
                color: `rgb(${t.ink})`,
                whiteSpace: "nowrap",
              }}
            >
              <RemocnR height={label * 0.95} color={`rgb(${t.ink})`} />
              <span>{title}</span>
              <span
                style={{
                  fontFamily: mono.fontFamily,
                  fontSize: label * 0.86,
                  color: `rgba(${t.ink},0.55)`,
                  backgroundColor: t.chip,
                  padding: `${label * 0.16}px ${label * 0.45}px`,
                  borderRadius: label * 0.3,
                }}
              >
                main
              </span>
            </div>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: label * 0.9,
              }}
            >
              <PlayOutline size={label * 1.15} color={`rgba(${t.ink},0.6)`} />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: bar * 0.56,
                  padding: `0 ${label * 0.75}px`,
                  borderRadius: label * 0.38,
                  backgroundColor: accent,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)",
                  fontSize: label * 0.94,
                  color: "#ffffff",
                  transform: `scale(${0.9 + 0.1 * sp(beat("snap") + 6, CHIP)})`,
                }}
              >
                Publish
              </div>
            </div>
          </div>
        </div>
        {frame >= beat("morph")
          ? order.filter((s) => s.isCell).map(renderShard)
          : null}
        {cells.map((c, k) => {
          const p = contentIn(k);
          const text = labels[k] ?? "";
          if (k === 0) {
            const words = headline.split(" ");
            return (
              <div
                key="hero"
                style={{
                  position: "absolute",
                  left: c.x,
                  top: c.y,
                  width: c.w,
                  height: c.h,
                  borderRadius: cellRadius,
                  overflow: "hidden",
                  backgroundImage:
                    "linear-gradient(180deg, rgba(8,9,14,0) 38%, rgba(8,9,14,0.82) 100%)",
                  opacity: Math.min(1, p * 1.5),
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: c.w * 0.065,
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    fontFamily: mono.fontFamily,
                    fontSize: label * 0.9,
                    color: "rgba(255,255,255,0.66)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: label * 0.7,
                    transform: `translateY(${(1 - p) * label}px)`,
                  }}
                >
                  <span style={{ opacity: 0.55 }}>01</span>
                  <span style={{ marginLeft: "0.9em" }}>{text}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    columnGap: "0.24em",
                    fontFamily: geist.fontFamily,
                    fontWeight: 400,
                    fontSize: heroFont,
                    lineHeight: 1.04,
                    letterSpacing: "-0.04em",
                    color: "#ffffff",
                    maxWidth: "8.4em",
                  }}
                >
                  {words.map((w, wi) => (
                    <span
                      key={`${w}-${wi}`}
                      style={{
                        display: "inline-block",
                        overflow: "hidden",
                        padding: "0 0.02em 0.14em",
                        margin: "0 -0.02em -0.14em",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          transform: `translateY(${(1 - headlineIn(wi + 1)) * 105}%)`,
                        }}
                      >
                        {w}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );
          }
          if (k === 3) {
            return (
              <div
                key="accent"
                style={{
                  position: "absolute",
                  left: c.x,
                  top: c.y,
                  width: c.w,
                  height: c.h,
                  padding: Math.min(c.w, c.h) * 0.12,
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  fontFamily: geist.fontFamily,
                  color: "#ffffff",
                }}
              >
                <div
                  style={{
                    transform: `scale(${sp(beat("content") + 9, CHIP)})`,
                    transformOrigin: "0% 0%",
                  }}
                >
                  <PlayIcon size={label * 2} color="#ffffff" />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    fontSize: label * 1.08,
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                    opacity: p,
                    transform: `translateY(${(1 - p) * label}px)`,
                  }}
                >
                  <span>{text}</span>
                  <span
                    style={{
                      fontFamily: mono.fontFamily,
                      fontSize: label * 0.9,
                      opacity: 0.7,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    0:42
                  </span>
                </div>
              </div>
            );
          }
          const cp = interpolate(
            frame,
            [beat("content") + 4 + k * 3, beat("content") + 16 + k * 3],
            [0, 1],
            { ...CLAMP, easing: TYPE_IN },
          );
          return (
            <div
              key={`cap-${k}`}
              style={{
                position: "absolute",
                left: c.x,
                top: c.y + c.h * 0.55,
                width: c.w,
                height: c.h * 0.45,
                borderRadius: `0 0 ${cellRadius}px ${cellRadius}px`,
                backgroundImage:
                  "linear-gradient(180deg, rgba(8,9,14,0) 0%, rgba(8,9,14,0.28) 45%, rgba(8,9,14,0.62) 100%)",
                display: "flex",
                alignItems: "flex-end",
                gap: label * 0.6,
                padding: label * 0.8,
                boxSizing: "border-box",
                fontFamily: geist.fontFamily,
                fontSize: label,
                color: "#ffffff",
                opacity: cp,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontFamily: mono.fontFamily,
                  fontSize: label * 0.86,
                  opacity: 0.6,
                  transform: `translateY(${(1 - cp) * label * 0.8}px)`,
                }}
              >
                0{k + 1}
              </span>
              <span style={{ transform: `translateY(${(1 - cp) * label}px)` }}>
                {text}
              </span>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export default ShardsToGrid;
