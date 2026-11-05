"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: monoFamily } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface AiImageGridProps {
  prompt?: string;
  /** Real images for the tiles; procedural art is used for missing ones. */
  images?: string[];
  model?: string;
  layout?: "2x2" | "3x2";
  /** Index of the tile that gets picked and zoomed. */
  pick?: number;
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const TYPE_START = 10;
const CHARS_PER_FRAME = 1.2;
const GEN = 60;
const DIFFUSE = [46, 58, 40, 64, 52, 44];
const STAGGER = 3;

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const ENTER_SOFT = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };

const clamp01 = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ramp = (
  f: number,
  from: number,
  len: number,
  easing: (t: number) => number = ENTER,
) => interpolate(f, [from, from + len], [0, 1], { ...clamp01, easing });

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const PALETTES = {
  dark: {
    dark: true,
    card: "rgba(20,18,17,0.94)",
    text: "#F3EFEA",
    muted: "rgba(243,239,234,0.7)",
    faint: "rgba(243,239,234,0.3)",
    tile: "#1C1A19",
    shimmer: "rgba(255,255,255,0.06)",
    rule: "rgba(255,255,255,0.08)",
    depth:
      "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.08), 0 30px 70px -24px rgba(0,0,0,0.75)",
    tileDepth:
      "0 0 0 1px rgba(255,255,255,0.1), 0 18px 40px -18px rgba(0,0,0,0.7)",
    solid: "#F3EFEA",
    onSolid: "#151312",
    ghost: "rgba(255,255,255,0.08)",
  },
  light: {
    dark: false,
    card: "#FFFFFF",
    text: "#1B1917",
    muted: "rgba(27,25,23,0.62)",
    faint: "rgba(27,25,23,0.3)",
    tile: "#ECEAE6",
    shimmer: "rgba(255,255,255,0.7)",
    rule: "rgba(0,0,0,0.07)",
    depth:
      "0 0 0 1px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.06), 0 24px 50px -20px rgba(40,30,20,0.28)",
    tileDepth:
      "0 0 0 1px rgba(0,0,0,0.08), 0 16px 34px -18px rgba(40,30,20,0.35)",
    solid: "#1B1917",
    onSolid: "#FFFFFF",
    ghost: "rgba(0,0,0,0.05)",
  },
};
type Palette = (typeof PALETTES)["dark"];

interface Scene {
  sky: [string, string, string];
  sun: string;
  sunAt: [number, number];
  glass: [string, string, string];
  ground: string;
  fog: string;
  s: number;
  n: number;
  cy: number;
  hMax: number;
  water?: boolean;
  island?: boolean;
}

const SCENES: Scene[] = [
  {
    sky: ["#3B2E7E", "#E96D8B", "#FFC38A"],
    sun: "#FFE7B0",
    sunAt: [292, 118],
    glass: ["#7C8CF0", "#3A3F9E", "#FFD9C2"],
    ground: "#4C3B7A",
    fog: "#FFB59A",
    s: 20,
    n: 7,
    cy: 128,
    hMax: 92,
  },
  {
    sky: ["#12355E", "#3FA3C9", "#F8D9A6"],
    sun: "#FFF4D6",
    sunAt: [96, 132],
    glass: ["#7FD3E6", "#1F6E8C", "#E8FBFF"],
    ground: "#17425C",
    fog: "#BFE6F0",
    s: 32,
    n: 4,
    cy: 150,
    hMax: 120,
  },
  {
    sky: ["#241A4A", "#9C5BD6", "#FFB3C7"],
    sun: "#FFE2EC",
    sunAt: [210, 96],
    glass: ["#C9A4FF", "#5B3A9E", "#FFE4F1"],
    ground: "#3A2266",
    fog: "#FFC4DA",
    s: 22,
    n: 5,
    cy: 118,
    hMax: 80,
    island: true,
  },
  {
    sky: ["#0E2240", "#E07A4F", "#FFD08A"],
    sun: "#FFF1C9",
    sunAt: [200, 150],
    glass: ["#FFB27A", "#6B3A5E", "#FFE6C8"],
    ground: "#2A2348",
    fog: "#FFB98A",
    s: 18,
    n: 8,
    cy: 96,
    hMax: 70,
    water: true,
  },
  {
    sky: ["#1D2B4F", "#5E7FD6", "#CFE1FF"],
    sun: "#FFFFFF",
    sunAt: [320, 90],
    glass: ["#A9C4FF", "#34508F", "#F2F7FF"],
    ground: "#26385F",
    fog: "#D8E6FF",
    s: 26,
    n: 5,
    cy: 130,
    hMax: 104,
  },
  {
    sky: ["#2B1B3D", "#D9617A", "#FFCF9E"],
    sun: "#FFEBC2",
    sunAt: [80, 104],
    glass: ["#FF9FB0", "#7A2E5E", "#FFE0D0"],
    ground: "#3E2148",
    fog: "#FFAE9E",
    s: 24,
    n: 6,
    cy: 112,
    hMax: 96,
  },
];

function hash(n: number) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function City({ sc, seed, uid }: { sc: Scene; seed: number; uid: string }) {
  const { s, n, cy, hMax } = sc;
  const cx = 200;
  const cells: { i: number; j: number }[] = [];
  for (let d = 0; d <= 2 * (n - 1); d++)
    for (let i = 0; i < n; i++) {
      const j = d - i;
      if (j >= 0 && j < n) cells.push({ i, j });
    }
  const baseY = cy + ((n - 1) * s) / 2;
  const pts = (p: number[][]) => p.map((q) => q.join(",")).join(" ");
  const top = [
    [cx, cy - s / 2],
    [cx + n * s, cy - s / 2 + (n * s) / 2],
    [cx, cy - s / 2 + n * s],
    [cx - n * s, cy - s / 2 + (n * s) / 2],
  ];
  return (
    <g>
      {sc.island && (
        <>
          <polygon
            points={pts([top[3], top[2], [cx, top[2][1] + 78]])}
            fill={sc.ground}
          />
          <polygon
            points={pts([top[2], top[1], [cx, top[2][1] + 78]])}
            fill="#000"
            opacity={0.35}
          />
        </>
      )}
      <polygon points={pts(top)} fill={sc.ground} />
      {cells.map(({ i, j }) => {
        const r = hash(seed * 97 + i * 13 + j * 7);
        if (r < 0.16) {
          const x = cx + (i - j) * s;
          const y = cy + ((i + j) * s) / 2;
          return (
            <g key={`${i}-${j}`}>
              <circle
                cx={x}
                cy={y - 5}
                r={s * 0.32}
                fill="#5FBF9A"
                opacity={0.85}
              />
              <circle
                cx={x - 2}
                cy={y - 7}
                r={s * 0.14}
                fill="#B8F0D4"
                opacity={0.6}
              />
            </g>
          );
        }
        const h = 12 + r ** 1.6 * hMax * (1 - (i + j) / (4 * n));
        const w = s * (0.78 + 0.18 * hash(r * 31));
        const x = cx + (i - j) * s;
        const y = cy + ((i + j) * s) / 2;
        const L = [x - w, y];
        const B = [x, y + w / 2];
        const R = [x + w, y];
        const T = [x, y - w / 2];
        const up = (p: number[]) => [p[0], p[1] - h];
        const lines = Math.floor(h / 7);
        return (
          <g key={`${i}-${j}`}>
            <polygon
              points={pts([L, B, up(B), up(L)])}
              fill={sc.glass[0]}
              opacity={0.92}
            />
            <polygon
              points={pts([B, R, up(R), up(B)])}
              fill={sc.glass[1]}
              opacity={0.94}
            />
            <polygon
              points={pts([B, R, up(R), up(B)])}
              fill={`url(#${uid}refl)`}
            />
            <polygon
              points={pts([L, B, up(B), up(L)])}
              fill={`url(#${uid}shade)`}
            />
            {Array.from({ length: lines }, (_, k) => {
              const yy = 5 + k * 7;
              return (
                <path
                  key={yy}
                  d={`M${L[0]} ${L[1] - yy}L${B[0]} ${B[1] - yy}L${R[0]} ${R[1] - yy}`}
                  stroke="#FFFFFF"
                  strokeOpacity={0.16}
                  strokeWidth={0.6}
                  fill="none"
                />
              );
            })}
            <polygon
              points={pts([up(L), up(B), up(R), up(T)])}
              fill={sc.glass[2]}
            />
            <line
              x1={B[0]}
              y1={B[1]}
              x2={B[0]}
              y2={B[1] - h}
              stroke="#FFFFFF"
              strokeOpacity={0.55}
              strokeWidth={0.8}
            />
            {r > 0.7 && <circle cx={x} cy={y - h} r={1.6} fill="#FFFFFF" />}
          </g>
        );
      })}
      {sc.island && (
        <ellipse
          cx={cx}
          cy={baseY + 96}
          rx={150}
          ry={14}
          fill="#FFFFFF"
          opacity={0.25}
        />
      )}
    </g>
  );
}

function CityArt({ index }: { index: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const sc = SCENES[index % SCENES.length];
  const waterY = 222;
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sc.sky[0]} />
          <stop offset="0.55" stopColor={sc.sky[1]} />
          <stop offset="1" stopColor={sc.sky[2]} />
        </linearGradient>
        <radialGradient id={`${uid}glow`}>
          <stop offset="0" stopColor={sc.sun} stopOpacity={0.9} />
          <stop offset="1" stopColor={sc.sun} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${uid}refl`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.45} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${uid}shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.18} />
          <stop offset="1" stopColor="#000000" stopOpacity={0.22} />
        </linearGradient>
        <linearGradient id={`${uid}fog`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={sc.fog} stopOpacity={0.75} />
          <stop offset="0.45" stopColor={sc.fog} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${uid}vig`} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.6" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.35} />
        </radialGradient>
        <clipPath id={`${uid}below`}>
          <rect x={0} y={waterY} width={400} height={300 - waterY} />
        </clipPath>
      </defs>
      <rect width={400} height={300} fill={`url(#${uid}sky)`} />
      <circle
        cx={sc.sunAt[0]}
        cy={sc.sunAt[1]}
        r={150}
        fill={`url(#${uid}glow)`}
      />
      <circle cx={sc.sunAt[0]} cy={sc.sunAt[1]} r={22} fill={sc.sun} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
        <rect
          key={k}
          x={k * 52 - 10 + hash(index + k) * 20}
          y={200 - hash(k * 3 + index) * 60}
          width={30 + hash(k + 9) * 20}
          height={120}
          fill={sc.sky[0]}
          opacity={0.18}
        />
      ))}
      {sc.water ? (
        <>
          <rect
            x={0}
            y={waterY}
            width={400}
            height={80}
            fill={sc.sky[0]}
            opacity={0.6}
          />
          <g clipPath={`url(#${uid}below)`} opacity={0.35}>
            <g transform={`translate(0 ${2 * waterY}) scale(1 -1)`}>
              <City sc={sc} seed={index + 1} uid={uid} />
            </g>
          </g>
          {[0, 1, 2, 3, 4].map((k) => (
            <rect
              key={k}
              x={sc.sunAt[0] - 30 + k * 6}
              y={waterY + 8 + k * 12}
              width={60 - k * 12}
              height={1.4}
              fill={sc.sun}
              opacity={0.7}
            />
          ))}
        </>
      ) : null}
      <City sc={sc} seed={index + 1} uid={uid} />
      <rect width={400} height={300} fill={`url(#${uid}fog)`} />
      <rect width={400} height={300} fill={`url(#${uid}vig)`} />
    </svg>
  );
}

function Cursor({
  x,
  y,
  press,
  opacity,
}: {
  x: number;
  y: number;
  press: number;
  opacity: number;
}) {
  return (
    <svg
      width={24}
      height={28}
      viewBox="0 0 20 24"
      style={{
        position: "absolute",
        left: x - 2.4,
        top: y - 2.4,
        opacity,
        transformOrigin: "2px 2px",
        transform: `scale(${1 - 0.12 * press})`,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        overflow: "visible",
        zIndex: 10,
      }}
    >
      <path
        d="M2 2 L2 19.5 L6.6 15.4 L9.8 22.4 L12.9 21 L9.8 14.2 L16 14.2 Z"
        fill="#FFFFFF"
        stroke="#111114"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS: Record<string, string> = {
  up: "M12 19V5M6 11l6-6 6 6",
  down: "M12 4v11M7 10l5 5 5-5M5 20h14",
  attach: "M16 8l-6.5 6.5a2 2 0 0 0 2.8 2.8L19 10.6a4 4 0 0 0-5.6-5.6L6.6 11.7",
  vary: "M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4",
  upscale: "M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7",
};

function Glyph({
  name,
  color,
  size = 18,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d={ICONS[name]}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Tile({
  index,
  src,
  local,
  dur,
  c,
  frame,
}: {
  index: number;
  src?: string;
  local: number;
  dur: number;
  c: Palette;
  frame: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const p = interpolate(local, [6, 6 + dur], [0, 1], {
    ...clamp01,
    easing: MOVE,
  });
  const blur = (1 - p) ** 1.4 * 26;
  const noise = (1 - p) ** 1.1 * 0.62;
  const pct = Math.round(interpolate(p, [0, 1], [0, 100]));
  const done = interpolate(p, [0.94, 1], [1, 0], {
    ...clamp01,
    easing: EXIT,
  });
  const sweep = ((local * 2.4) % 140) - 20;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: c.tile,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - interpolate(p, [0, 0.25], [0, 1], clamp01),
          background: `linear-gradient(105deg, transparent ${sweep - 20}%, ${c.shimmer} ${sweep}%, transparent ${sweep + 20}%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -30,
          opacity: interpolate(p, [0, 0.22], [0, 1], clamp01),
          filter: `blur(${blur}px) saturate(${1 + 0.4 * (1 - p)})`,
          transform: `scale(${1 + 0.06 * (1 - p)})`,
        }}
      >
        <div style={{ position: "absolute", inset: 30 }}>
          {src ? (
            <Img
              src={src}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <CityArt index={index} />
          )}
        </div>
      </div>
      {noise > 0.01 && (
        <svg
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, opacity: noise }}
          aria-hidden="true"
        >
          <filter id={`${uid}n`}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves={2}
              seed={Math.floor(frame / 2) + index * 7}
            />
            <feColorMatrix values="0.9 0 0 0 0.05  0 0.9 0 0 0.05  0 0 0.9 0 0.08  0 0 0 0.85 0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#${uid}n)`} />
        </svg>
      )}
      {done > 0 && local > 0 && (
        <div
          style={{
            position: "absolute",
            left: 12,
            bottom: 12,
            height: 30,
            padding: "0 12px",
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            background: "rgba(12,11,10,0.46)",
            backdropFilter: "blur(10px)",
            color: "#fff",
            fontFamily: monoFamily,
            fontSize: 16,
            fontVariantNumeric: "tabular-nums",
            opacity: done,
          }}
        >
          {String(pct).padStart(2, " ")}%
        </div>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          boxShadow: `inset 0 0 0 1px ${c.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        }}
      />
    </div>
  );
}

type Key = { f: number; x: number; y: number };
function along(frame: number, keys: Key[]) {
  if (frame <= keys[0].f) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (frame <= b.f) {
      const t = ENTER(
        Math.min(1, Math.max(0, (frame - a.f) / Math.max(1, b.f - a.f))),
      );
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const arc = Math.sin(t * Math.PI) * Math.min(48, len * 0.16);
      return {
        x: a.x + dx * t + (-dy / len) * arc,
        y: a.y + dy * t + (dx / len) * arc,
      };
    }
  }
  return keys[keys.length - 1];
}

function pressAt(frame: number, fps: number, clicks: number[]) {
  let v = 0;
  for (const k of clicks) {
    if (frame < k - 4) continue;
    if (frame < k) {
      v = Math.max(v, ramp(frame, k - 4, 4, MOVE));
    } else {
      v = Math.max(v, 1 - spring({ frame: frame - k, fps, config: CHIP }));
    }
  }
  return v;
}

export function AiImageGrid({
  prompt = "isometric glass city at sunrise, soft light",
  images = [],
  model = "remocn Image 2",
  layout = "2x2",
  pick = 1,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
  ground,
  groundParams,
}: AiImageGridProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width * 1.2;
  const u = tall ? width / 640 : Math.min(width / 1280, height / 720);
  const dw = width / u;
  const dh = height / u;
  const c = PALETTES[theme];

  const count = layout === "3x2" ? 6 : 4;
  const cols = tall ? 2 : count === 6 ? 3 : 2;
  const rows = count / cols;
  const gap = 8;
  const colW = tall ? 576 : cols === 3 ? 744 : 584;
  const tw = (colW - gap * (cols - 1)) / cols;
  const th = tw * 0.75;
  const gridH = rows * th + (rows - 1) * gap;
  const cardW = tall ? 576 : 640;
  const cardH = 118;
  const stackH = gridH + 28 + cardH;
  const gx = (dw - colW) / 2;
  const gy = (dh - stackH) / 2;
  const rects = Array.from({ length: count }, (_, i) => ({
    x: gx + (i % cols) * (tw + gap),
    y: gy + Math.floor(i / cols) * (th + gap),
  }));
  const pickIdx = Math.min(Math.max(0, pick), count - 1);
  const resolved = Math.max(
    ...rects.map((_, i) => i * STAGGER + 6 + DIFFUSE[i % DIFFUSE.length]),
  );
  const PICK = GEN + 6 + resolved + 20;

  const typed = Math.floor(Math.max(0, frame - TYPE_START) * CHARS_PER_FRAME);
  const text = prompt.slice(0, typed);
  const caretOn = Math.floor(frame / 8) % 2 === 0 || typed < prompt.length;

  const cardX = (dw - cardW) / 2;
  const introY = (dh - cardH) / 2;
  const dockY = gy + gridH + 28;
  const INTRO_S = 1.08;
  const sendLocal = { x: cardW - 20 - 22, y: cardH - 16 - 22 };
  const sendIntro = {
    x: cardX + cardW / 2 + (sendLocal.x - cardW / 2) * INTRO_S,
    y: introY + cardH / 2 + (sendLocal.y - cardH / 2) * INTRO_S,
  };

  const enter = spring({ frame, fps, config: HEAVY });
  const dock = spring({ frame: frame - GEN - 2, fps, config: HEAVY });
  const cardOut = ramp(frame, PICK, 10, EXIT);
  const cardY = lerp(introY, dockY, dock) + (1 - enter) * 60 + cardOut * 60;
  const cardS = lerp(INTRO_S, 1, dock) * (0.96 + 0.04 * enter);

  const pickRect = rects[pickIdx];
  const tilePt = { x: pickRect.x + tw * 0.56, y: pickRect.y + th * 0.5 };
  const cur = along(frame, [
    { f: 26, x: dw * 0.8, y: dh * 0.78 },
    { f: GEN - 3, ...sendIntro },
    { f: GEN + 8, ...sendIntro },
    { f: GEN + 34, x: dw * 0.78, y: dh * 0.5 },
    { f: PICK - 30, x: dw * 0.78, y: dh * 0.5 },
    { f: PICK - 4, ...tilePt },
  ]);
  const curOpacity = ramp(frame, 24, 8) * (1 - ramp(frame, PICK + 4, 8, EXIT));
  const press = pressAt(frame, fps, [GEN, PICK]);
  const sendPress = pressAt(frame, fps, [GEN]);
  const generating = frame >= GEN && frame < GEN + 6 + resolved;

  const hover = spring({ frame: frame - (PICK - 8), fps, config: CHIP });
  const othersOut = ramp(frame, PICK + 2, 9, EXIT);
  const z = spring({
    frame: frame - PICK - 2,
    fps,
    config: MORPH,
    durationInFrames: 26,
  });

  const heroW = tall ? 576 : 664;
  const heroH = heroW * 0.75;
  const detailsH = tall ? 300 : 0;
  const heroX = tall ? (dw - heroW) / 2 : 88;
  const heroY = tall ? (dh - heroH - 48 - detailsH) / 2 : (dh - heroH) / 2;
  const hero = {
    x: lerp(pickRect.x, heroX, z),
    y: lerp(pickRect.y, heroY, z),
    w: lerp(tw, heroW, z),
    h: lerp(th, heroH, z),
  };
  const det = tall
    ? { x: heroX, y: heroY + heroH + 48, w: heroW }
    : {
        x: heroX + heroW + 56,
        y: heroY + heroH / 2 - 140,
        w: dw - (heroX + heroW + 56) - 80,
      };
  const d1 = ramp(frame, PICK + 10, 16);
  const d2 = ramp(frame, PICK + 14, 16);
  const d3 = spring({ frame: frame - PICK - 18, fps, config: CARD });

  const push = interpolate(frame, [0, 240], [1, 1.03], clamp01);
  const tileLocal = (i: number) => frame - GEN - 6 - i * STAGGER;

  return (
    <AbsoluteFill
      style={{ overflow: "hidden", WebkitFontSmoothing: "antialiased" }}
    >
      <GshGround
        preset={ground ?? (c.dark ? "static-sunset" : "paper-crease")}
        params={
          groundParams ??
          (c.dark || ground
            ? undefined
            : {
                colors: ["#e98d63", "#f4c3a2", "#efe3d8", "#6a4636"],
                background: "#f1ebe4",
              })
        }
        timeOffset={c.dark ? 4 : 3}
        timeScale={0.4}
      />
      <AbsoluteFill
        style={{
          background: c.dark
            ? "radial-gradient(70% 80% at 50% 50%, rgba(12,9,8,0.5), rgba(12,9,8,0.18))"
            : "radial-gradient(70% 80% at 50% 50%, rgba(244,239,233,0.45), rgba(244,239,233,0.1))",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: dw,
          height: dh,
          transform: `scale(${u})`,
          transformOrigin: "0 0",
          fontFamily,
          color: c.text,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${push})`,
            transformOrigin: "50% 50%",
          }}
        >
          {rects.map((r, i) => {
            const local = tileLocal(i);
            if (local < -1) return null;
            const pop = spring({ frame: local, fps, config: CARD });
            const isPick = i === pickIdx;
            const h = isPick ? hover : 0;
            const out = isPick ? 0 : othersOut;
            return (
              <div
                key={`${r.x}-${r.y}`}
                style={{
                  position: "absolute",
                  left: r.x,
                  top: r.y,
                  width: tw,
                  height: th,
                  borderRadius: 14,
                  overflow: "hidden",
                  opacity:
                    ramp(local, 0, 6, ENTER_SOFT) *
                    (1 - out) *
                    (isPick && z > 0.001 ? 0 : 1),
                  transform: `translateY(${(1 - pop) * 28 + out * 10}px) scale(${(0.95 + 0.05 * pop) * (1 + 0.02 * h) * (1 - 0.03 * out)})`,
                  boxShadow: `0 0 0 ${2 * h}px ${accent}, ${c.tileDepth}`,
                }}
              >
                <Tile
                  index={i}
                  src={images[i]}
                  local={local}
                  dur={DIFFUSE[i % DIFFUSE.length]}
                  c={c}
                  frame={frame}
                />
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: cardX,
              top: cardY,
              width: cardW,
              height: cardH,
              borderRadius: 20,
              background: c.card,
              backdropFilter: c.dark ? "blur(24px)" : undefined,
              boxShadow: c.depth,
              boxSizing: "border-box",
              padding: "20px 22px 0",
              opacity: ramp(frame, 0, 10, ENTER_SOFT) * (1 - cardOut),
              transform: `scale(${cardS})`,
              transformOrigin: "50% 50%",
            }}
          >
            <div
              style={{
                fontSize: 20,
                lineHeight: "28px",
                height: 28,
                letterSpacing: "-0.01em",
                color: text ? c.text : c.faint,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {text || "Describe an image"}
              {frame < GEN && (
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 22,
                    marginLeft: 2,
                    verticalAlign: "-4px",
                    background: accent,
                    opacity: caretOn ? 1 : 0,
                  }}
                />
              )}
            </div>
            <div
              style={{
                position: "absolute",
                left: 22,
                bottom: 22,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 16,
                color: c.muted,
                whiteSpace: "nowrap",
              }}
            >
              <Glyph name="attach" color={c.muted} size={18} />
              <span>{model}</span>
              <span style={{ color: c.faint }}>·</span>
              <span>4:3</span>
              <span style={{ color: c.faint }}>·</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {count} images
              </span>
            </div>
            <div
              style={{
                position: "absolute",
                left: sendLocal.x - 22,
                top: sendLocal.y - 22,
                width: 44,
                height: 44,
                borderRadius: 999,
                background: c.solid,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${1 - 0.04 * sendPress})`,
                opacity: text.length > 0 ? 1 : 0.35,
              }}
            >
              {generating ? (
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  style={{ transform: `rotate(${frame * 12}deg)` }}
                >
                  <circle
                    cx={10}
                    cy={10}
                    r={7}
                    fill="none"
                    stroke={withAlpha(c.onSolid, 0.25)}
                    strokeWidth={1.5}
                  />
                  <path
                    d="M10 3a7 7 0 0 1 7 7"
                    fill="none"
                    stroke={c.onSolid}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <Glyph name="up" color={c.onSolid} size={20} />
              )}
            </div>
          </div>

          {z > 0.001 && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: hero.x,
                  top: hero.y,
                  width: hero.w,
                  height: hero.h,
                  borderRadius: lerp(14, 20, z),
                  overflow: "hidden",
                  boxShadow: `0 0 0 ${2 * (1 - z)}px ${accent}, ${c.tileDepth}, 0 40px 90px -30px rgba(0,0,0,${0.5 * z})`,
                }}
              >
                <Tile
                  index={pickIdx}
                  src={images[pickIdx]}
                  local={999}
                  dur={1}
                  c={c}
                  frame={frame}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: det.x,
                  top: det.y,
                  width: det.w,
                  padding: tall ? "0 4px" : 0,
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    fontFamily: monoFamily,
                    fontSize: 16,
                    color: c.muted,
                    letterSpacing: "0.02em",
                    opacity: d1,
                    transform: `translateY(${(1 - d1) * 14}px)`,
                  }}
                >
                  {pickIdx + 1} of {count} · {model}
                </div>
                <div
                  style={{
                    marginTop: 16,
                    fontSize: tall ? 46 : 38,
                    fontWeight: 300,
                    lineHeight: 1.12,
                    letterSpacing: "-0.025em",
                    textWrap: "balance",
                    opacity: d1,
                    transform: `translateY(${(1 - d1) * 22}px)`,
                  }}
                >
                  {prompt}
                </div>
                <div
                  style={{
                    marginTop: 20,
                    display: "flex",
                    gap: 18,
                    fontFamily: monoFamily,
                    fontSize: 16,
                    color: c.muted,
                    fontVariantNumeric: "tabular-nums",
                    opacity: d2,
                    transform: `translateY(${(1 - d2) * 14}px)`,
                  }}
                >
                  <span>2048 × 1536</span>
                  <span>seed 48213</span>
                  <span>9.4 s</span>
                </div>
                <div
                  style={{
                    marginTop: tall ? 36 : 32,
                    display: "flex",
                    gap: 10,
                    opacity: Math.min(1, d3 * 1.4),
                    transform: `translateY(${(1 - d3) * 18}px)`,
                  }}
                >
                  {[
                    { l: "Vary", i: "vary" },
                    { l: "Upscale", i: "upscale" },
                  ].map((b) => (
                    <div
                      key={b.l}
                      style={{
                        height: 46,
                        padding: "0 18px 0 14px",
                        borderRadius: 999,
                        background: c.ghost,
                        boxShadow: `inset 0 0 0 1px ${c.rule}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 17,
                      }}
                    >
                      <Glyph name={b.i} color={c.text} size={18} />
                      {b.l}
                    </div>
                  ))}
                  <div
                    style={{
                      height: 46,
                      padding: "0 20px 0 16px",
                      borderRadius: 999,
                      background: c.solid,
                      color: c.onSolid,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 17,
                    }}
                  >
                    <Glyph name="down" color={c.onSolid} size={18} />
                    Download
                  </div>
                </div>
              </div>
            </>
          )}
          <Cursor x={cur.x} y={cur.y} press={press} opacity={curOpacity} />
        </div>
      </div>
    </AbsoluteFill>
  );
}
