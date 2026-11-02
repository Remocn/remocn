"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadGeist("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadGeistMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: manrope } = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface QuadrantPoint {
  label: string;
  x: number;
  y: number;
}

export interface QuadrantPlotProps {
  xLabels?: [string, string];
  yLabels?: [string, string];
  points?: QuadrantPoint[];
  brand?: QuadrantPoint;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_POINTS: QuadrantPoint[] = [
  { label: "Kitebase", x: 0.71, y: 0.3 },
  { label: "Lumen", x: 0.27, y: 0.71 },
  { label: "Fernway", x: 0.2, y: 0.24 },
  { label: "Quarry", x: 0.6, y: 0.4 },
  { label: "Orbitly", x: 0.38, y: 0.58 },
  { label: "Halcyon", x: 0.13, y: 0.42 },
];

const DEFAULT_BRAND: QuadrantPoint = { label: "remocn", x: 0.74, y: 0.8 };

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_ARRIVE = Easing.bezier(0.2, 0.9, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    axis: "rgba(255,255,255,0.26)",
    mark: "rgba(255,255,255,0.32)",
    grid: "rgba(255,255,255,0.075)",
    dot: "#9C9BA1",
    grain: 0.06,
    hero: "#F5F6FF",
    heroLabel: "#F5F6FF",
    guide: "rgba(245,246,255,0.55)",
    // gradients.sh "mesh": bg #0a0d24, [#ecdcf2, #8796ee, #2e45b7, #0e1645]
    meshBg: "#0a0d24",
    blobs: [
      ["#2e45b7", 18, 6, 0.95],
      ["#ecdcf2", -2, 112, 0.8],
      ["#8796ee", 30, 84, 0.85],
      ["#2e45b7", 72, 46, 1],
      ["#0e1645", 102, 104, 1],
      ["#8796ee", 104, -6, 0.45],
    ],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    axis: "rgba(18,18,20,0.26)",
    mark: "rgba(18,18,20,0.32)",
    grid: "rgba(18,18,20,0.08)",
    dot: "#8E8C86",
    grain: 0.045,
    hero: "#121214",
    heroLabel: "#121214",
    guide: "rgba(18,18,20,0.45)",
    meshBg: "#EEF0FB",
    blobs: [
      ["#8796ee", 0, 104, 0.95],
      ["#ecdcf2", 36, 70, 1],
      ["#2e45b7", 8, 40, 0.45],
      ["#8796ee", 100, 0, 0.55],
      ["#ecdcf2", 96, 96, 0.9],
      ["#2e45b7", 104, 104, 0.35],
    ],
  },
} as const;

const AXIS = [-8, 22] as const;
const DROP = 26;
const DROP_STAGGER = 4;
const ARRIVE = 62;
const ARRIVE_LEN = 30;
const LANDED = ARRIVE + ARRIVE_LEN - 8;

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
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

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

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function QuadrantPlot({
  xLabels = ["Slow", "Fast"],
  yLabels = ["Hard", "Easy"],
  points = DEFAULT_POINTS,
  brand = DEFAULT_BRAND,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: QuadrantPlotProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];

  const cx = width / 2;
  const cy = height / 2;
  const hw = width * 0.3;
  const hh = height * 0.3;
  const toX = (x: number) => cx + (clamp01(x) - 0.5) * 2 * hw;
  const toY = (y: number) => cy - (clamp01(y) - 0.5) * 2 * hh;
  const sw = Math.max(1, u);

  const axisK = interpolate(t, AXIS, [0, 1], { ...CLAMP, easing: EASE_IO });
  const markK = interpolate(t, [12, 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelK = (delay: number) =>
    interpolate(t, [14 + delay, 32 + delay], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const arrive = interpolate(t, [ARRIVE, ARRIVE + ARRIVE_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_ARRIVE,
  });
  const bx = toX(brand.x);
  const by = toY(brand.y);
  const sx = cx - hw * 0.12;
  const sy = cy + hh * 0.18;
  const qx = bx + hw * 0.05;
  const qy = sy - hh * 0.05;
  const along = (k: number): [number, number] => {
    const a = (1 - k) * (1 - k);
    const b = 2 * (1 - k) * k;
    const c = k * k;
    return [a * sx + b * qx + c * bx, a * sy + b * qy + c * by];
  };
  const arriveAt = (time: number) =>
    interpolate(time, [ARRIVE, ARRIVE + ARRIVE_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_ARRIVE,
    });
  const [dx, dy] = along(arrive);
  const brandO = interpolate(t, [ARRIVE, ARRIVE + 5], [0, 1], CLAMP);
  const brandS = interpolate(t, [ARRIVE, ARRIVE + 10], [0.6, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const ghosts = [1.5, 3, 4.5].map((lag, i) => {
    const [gx, gy] = along(arriveAt(t - lag));
    const dist = Math.hypot(gx - dx, gy - dy);
    return {
      gx,
      gy,
      o: Math.min(1, dist / (18 * u)) * [0.3, 0.16, 0.08][i] * brandO,
    };
  });

  const ring = interpolate(t, [LANDED, LANDED + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const dim = interpolate(t, [LANDED - 4, LANDED + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const wash = interpolate(t, [LANDED - 2, LANDED + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const guide = interpolate(t, [LANDED + 4, LANDED + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const brandLab = interpolate(t, [LANDED - 2, LANDED + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const push = interpolate(t, [0, 140], [0, 1], { ...CLAMP, easing: EASE_IO });
  const zoom = 0.975 + 0.04 * push;
  const drift = interpolate(t, [ARRIVE - 10, 140], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const camX = -(bx - cx) * 0.035 * drift;
  const camY = -(by - cy) * 0.035 * drift;

  const corner = 16 * u * markK;
  const corners: Array<[number, number, number, number]> = [
    [cx - hw, cy - hh, 1, 1],
    [cx + hw, cy - hh, -1, 1],
    [cx - hw, cy + hh, 1, -1],
    [cx + hw, cy + hh, -1, -1],
  ];

  const gap = 0.25;
  const gridDots: Array<[number, number]> = [];
  for (let gx = 0; gx <= 1.0001; gx += gap / 2) {
    for (let gy = 0; gy <= 1.0001; gy += gap / 2) {
      if (Math.abs(gx - 0.5) < 0.01 || Math.abs(gy - 0.5) < 0.01) continue;
      gridDots.push([toX(gx), toY(gy)]);
    }
  }

  const endLabel = (
    text: string,
    x: number,
    y: number,
    align: "left" | "right" | "top" | "bottom",
    k: number,
    strong: boolean,
  ) => {
    const tx = align === "left" ? "-100%" : align === "right" ? "0%" : "-50%";
    const ty = align === "top" ? "-100%" : align === "bottom" ? "0%" : "-50%";
    const nudge = (1 - k) * 10 * u;
    const ox = align === "left" ? nudge : align === "right" ? -nudge : 0;
    const oy = align === "top" ? nudge : align === "bottom" ? -nudge : 0;
    return (
      <div
        key={text + align}
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(${tx}, ${ty}) translate(${ox}px, ${oy}px)`,
          fontFamily: mono,
          fontWeight: 400,
          fontSize: 14 * u,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: strong
            ? interpolateColors(wash, [0, 1], [p.muted, p.fg])
            : p.muted,
          opacity: k,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    );
  };

  const pad = 20 * u;
  const reveal = 0.25 + 0.75 * wash;
  const sway = interpolate(t, [LANDED - 4, 140], [0, 1], CLAMP);
  const mesh = [
    ...p.blobs.map(
      ([c, x, y, a], i) =>
        `radial-gradient(85% 95% at ${x + Math.sin(i * 1.7 + sway * 1.4) * 4}% ${y + Math.cos(i * 2.3 + sway * 1.2) * 4}%, color-mix(in oklab, ${c} ${Math.round(a * 100)}%, transparent) 0%, transparent 68%)`,
    ),
    `linear-gradient(${p.meshBg}, ${p.meshBg})`,
  ].join(", ");
  const heroDot =
    theme === "light"
      ? accent
      : interpolateColors(wash, [0, 1], [accent, p.hero]);

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${camX}px, ${camY}px) scale(${zoom})`,
          transformOrigin: "50% 50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: cx,
            top: cy - hh,
            width: hw,
            height: hh,
            background: mesh,
            opacity: wash,
            clipPath: `inset(${(1 - reveal) * 100}% ${(1 - reveal) * 100}% 0 0)`,
          }}
        />
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          {gridDots.map(([gx, gy]) => (
            <circle
              key={`${gx.toFixed(1)}-${gy.toFixed(1)}`}
              cx={gx}
              cy={gy}
              r={1.3 * u}
              fill={p.grid}
              opacity={markK}
            />
          ))}

          <line
            x1={cx - hw * axisK}
            y1={cy}
            x2={cx + hw * axisK}
            y2={cy}
            stroke={p.axis}
            strokeWidth={sw}
          />
          <line
            x1={cx}
            y1={cy - hh * axisK}
            x2={cx}
            y2={cy + hh * axisK}
            stroke={p.axis}
            strokeWidth={sw}
          />

          {corners.map(([x, y, ix, iy]) => (
            <path
              key={`${x}-${y}`}
              d={`M${x + ix * corner} ${y} L${x} ${y} L${x} ${y + iy * corner}`}
              fill="none"
              stroke={p.mark}
              strokeWidth={sw}
              opacity={markK * (ix < 0 && iy > 0 ? 1 - wash : 1)}
            />
          ))}

          {points.map((pt, i) => {
            const start = DROP + i * DROP_STAGGER;
            const s = spring({
              frame: t - start,
              fps,
              config: { damping: 14, stiffness: 170, mass: 0.7 },
            });
            const o = interpolate(t, [start, start + 6], [0, 1], CLAMP);
            const x = toX(pt.x);
            const y = toY(pt.y) - (1 - s) * 34 * u;
            return (
              <circle
                key={pt.label}
                cx={x}
                cy={y}
                r={7 * u}
                fill={p.dot}
                opacity={o * (1 - 0.62 * dim)}
              />
            );
          })}

          <g opacity={guide * 0.9}>
            <line
              x1={bx}
              y1={by}
              x2={bx}
              y2={by + (cy - by) * guide}
              stroke={p.guide}
              strokeWidth={sw}
              strokeDasharray={`${3 * u} ${5 * u}`}
            />
            <line
              x1={bx}
              y1={by}
              x2={bx + (cx - bx) * guide}
              y2={by}
              stroke={p.guide}
              strokeWidth={sw}
              strokeDasharray={`${3 * u} ${5 * u}`}
            />
          </g>

          {ghosts.map((g, i) => (
            <circle
              key={i}
              cx={g.gx}
              cy={g.gy}
              r={12 * u * brandS}
              fill={accent}
              opacity={t >= ARRIVE ? g.o : 0}
            />
          ))}
          <circle
            cx={dx}
            cy={dy}
            r={(12 + 36 * ring) * u}
            fill="none"
            stroke={heroDot}
            strokeWidth={1.5 * u}
            opacity={t >= LANDED ? (1 - ring) * 0.7 : 0}
          />
          <circle
            cx={dx}
            cy={dy}
            r={22 * u}
            fill="none"
            stroke={heroDot}
            strokeWidth={sw}
            opacity={brandLab * 0.45}
          />
          <circle
            cx={dx}
            cy={dy}
            r={12 * u * brandS}
            fill={heroDot}
            opacity={t >= ARRIVE ? brandO : 0}
          />
        </svg>

        {points.map((pt, i) => {
          const start = DROP + i * DROP_STAGGER + 5;
          const k = interpolate(t, [start, start + 14], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          return (
            <div
              key={pt.label}
              style={{
                position: "absolute",
                left: toX(pt.x) + 15 * u,
                top: toY(pt.y),
                transform: `translate(${(1 - k) * -6 * u}px, -50%)`,
                fontFamily: sans,
                fontWeight: 400,
                fontSize: 17 * u,
                letterSpacing: "-0.005em",
                color: p.muted,
                opacity: k * (1 - 0.6 * dim),
                whiteSpace: "nowrap",
              }}
            >
              {pt.label}
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: bx + 36 * u,
            top: by,
            transform: `translate(${(1 - brandLab) * -10 * u}px, -50%)`,
            opacity: brandLab,
          }}
        >
          {brand.label.toLowerCase() === "remocn" ? (
            <RemocnLogo fontSize={34 * u} color={p.heroLabel} />
          ) : (
            <div
              style={{
                fontFamily: sans,
                fontWeight: 500,
                fontSize: 32 * u,
                letterSpacing: "-0.025em",
                color: p.heroLabel,
                whiteSpace: "nowrap",
              }}
            >
              {brand.label}
            </div>
          )}
        </div>

        {endLabel(xLabels[0], cx - hw - pad, cy, "left", labelK(0), false)}
        {endLabel(xLabels[1], cx + hw + pad, cy, "right", labelK(2), true)}
        {endLabel(yLabels[1], cx, cy - hh - pad, "top", labelK(4), true)}
        {endLabel(yLabels[0], cx, cy + hh + pad, "bottom", labelK(6), false)}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.6,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
