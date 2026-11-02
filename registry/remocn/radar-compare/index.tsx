"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
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

const { fontFamily: sans } = loadSans("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
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

// gradients.sh "mesh" palette, used only inside the brand polygon.
const MESH = ["#ecdcf2", "#8796ee", "#2e45b7", "#0e1645"] as const;
const BLOBS: [number, number][] = [
  [16, 20],
  [84, 26],
  [72, 86],
  [22, 80],
  [52, 48],
  [92, 62],
];

export interface RadarCompareProps {
  axes?: string[];
  competitor?: number[];
  brand?: number[];
  brandLabel?: string;
  competitorLabel?: string;
  caption?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_AXES = [
  "Speed",
  "Quality",
  "Price",
  "Support",
  "Integrations",
  "Docs",
];
const DEFAULT_COMPETITOR = [0.58, 0.66, 0.82, 0.5, 0.62, 0.46];
const DEFAULT_BRAND = [0.94, 0.88, 0.7, 0.86, 0.9, 0.96];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const TAU = Math.PI * 2;
const RINGS = [0.25, 0.5, 0.75, 1];

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.13)",
    hairStrong: "rgba(255,255,255,0.26)",
    comp: "#8E8D93",
    compOver: "rgba(236,234,242,0.78)",
    compFill: "rgba(200,199,205,0.10)",
    meshBase: MESH[3],
    mesh: [MESH[0], MESH[1], MESH[2], MESH[3]],
    meshAlpha: [0.42, 1, 1, 0.9],
    brandFill: 0.82,
    brandStroke: "#9AA8F5",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.12)",
    hairStrong: "rgba(18,18,20,0.26)",
    comp: "#85837E",
    compOver: "rgba(18,18,20,0.55)",
    compFill: "rgba(18,18,20,0.07)",
    meshBase: "#E4E6F8",
    mesh: [MESH[0], MESH[1], "#B3BEF6", MESH[0]],
    meshAlpha: [0.95, 0.75, 0.8, 0.7],
    brandFill: 0.9,
    brandStroke: "accent",
    grain: 0.045,
  },
} as const;

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

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export function RadarCompare({
  axes = DEFAULT_AXES,
  competitor = DEFAULT_COMPETITOR,
  brand = DEFAULT_BRAND,
  brandLabel = "remocn",
  competitorLabel = "Kitebase",
  caption,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: RadarCompareProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const gid = `rc${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const list = axes.slice(0, 8);
  const n = Math.max(3, list.length);
  const comp = Array.from({ length: n }, (_, i) => clamp01(competitor[i] ?? 0));
  const mine = Array.from({ length: n }, (_, i) => clamp01(brand[i] ?? 0));
  const wins = mine.filter((v, i) => v > comp[i]).length;
  const stroke = p.brandStroke === "accent" ? accent : p.brandStroke;
  const isRemocn = brandLabel.trim().toLowerCase() === "remocn";

  const R = height * 0.28;
  const cy = height * 0.5;
  const move = interpolate(t, [86, 118], [0, 1], { ...CLAMP, easing: EASE_IO });
  const cx = interpolate(move, [0, 1], [width * 0.5, width * 0.335]);

  const ang = (i: number) => (i / n) * TAU;
  const pt = (r: number, a: number) => ({
    x: cx + r * Math.sin(a),
    y: cy - r * Math.cos(a),
  });
  const poly = (rs: number[]) =>
    `${rs
      .map((r, i) => {
        const q = pt(r, ang(i));
        return `${i === 0 ? "M" : "L"} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`;
      })
      .join(" ")} Z`;

  const stage = interpolate(t, [0, 8], [0, 1], CLAMP);
  const push = interpolate(t, [0, 150], [0, 1], { ...CLAMP, easing: EASE_IO });
  const scale = 0.965 + 0.035 * push;

  const compPts = comp.map((v) => v * R);
  let perim = 0;
  const cum: number[] = [];
  for (let i = 0; i < n; i++) {
    cum.push(perim);
    const a = pt(compPts[i], ang(i));
    const b = pt(compPts[(i + 1) % n], ang(i + 1));
    perim += Math.hypot(b.x - a.x, b.y - a.y);
  }
  const compDraw = interpolate(t, [22, 52], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const compFill = interpolate(t, [42, 60], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const settle = interpolate(t, [80, 100], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const grow = mine.map((_, i) =>
    spring({
      frame: t - 58 - i * 1.8,
      fps,
      config: { damping: 17, stiffness: 110, mass: 0.9 },
    }),
  );
  const brandOn = interpolate(t, [56, 62], [0, 1], CLAMP);
  const brandPts = mine.map((v, i) => v * R * (0.06 + 0.94 * grow[i]));

  const hero = interpolate(t, [98, 120], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const line2 = interpolate(t, [106, 126], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const line3 = interpolate(t, [112, 132], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const textLeft = width * 0.6;
  const hw = Math.max(1, u);

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transform: `scale(${scale})`, transformOrigin: "50% 50%" }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, opacity: stage }}
          aria-hidden
        >
          {list.map((ax, i) => {
            const k = interpolate(t, [2 + i * 2, 22 + i * 2], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            const q = pt(R * k, ang(i));
            return (
              <line
                key={`s${ax}`}
                x1={cx}
                y1={cy}
                x2={q.x}
                y2={q.y}
                stroke={p.hair}
                strokeWidth={hw}
              />
            );
          })}
          {RINGS.map((r, j) => {
            const k = interpolate(t, [6 + j * 3, 26 + j * 3], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            return (
              <path
                key={`r${r}`}
                d={poly(
                  Array.from({ length: n }, () => r * R * (0.9 + 0.1 * k)),
                )}
                fill="none"
                stroke={j === RINGS.length - 1 ? p.hairStrong : p.hair}
                strokeWidth={hw}
                strokeLinejoin="round"
                opacity={k}
              />
            );
          })}

          <defs>
            <clipPath id={`${gid}c`}>
              <path d={poly(brandPts)} />
            </clipPath>
            {p.mesh.map((col, i) => {
              const [bx, by] = BLOBS[i];
              const dx = Math.sin(t / 45 + i * 1.7) * 4;
              const dy = Math.cos(t / 52 + i * 2.3) * 4;
              return (
                <radialGradient
                  key={`m${col}${bx}`}
                  id={`${gid}m${i}`}
                  cx={(50 + (bx - 50) * 0.72 + dx) / 100}
                  cy={(50 + (by - 50) * 0.72 + dy) / 100}
                  r={0.58}
                >
                  <stop
                    offset={0}
                    stopColor={col}
                    stopOpacity={p.meshAlpha[i]}
                  />
                  <stop offset={0.68} stopColor={col} stopOpacity={0} />
                </radialGradient>
              );
            })}
          </defs>
          {brandOn > 0 ? (
            <g
              clipPath={`url(#${gid}c)`}
              opacity={p.brandFill * brandOn * (0.55 + 0.45 * settle)}
            >
              <rect
                x={cx - R}
                y={cy - R}
                width={2 * R}
                height={2 * R}
                fill={p.meshBase}
              />
              {p.mesh.map((col, i) => (
                <rect
                  key={`mr${col}${BLOBS[i][0]}`}
                  x={cx - R}
                  y={cy - R}
                  width={2 * R}
                  height={2 * R}
                  fill={`url(#${gid}m${i})`}
                />
              ))}
            </g>
          ) : null}
          <path
            d={poly(compPts)}
            fill={p.compFill}
            fillOpacity={compFill * (1 - 0.4 * settle)}
            stroke={interpolateColors(settle, [0, 1], [p.comp, p.compOver])}
            strokeWidth={1.75 * u}
            strokeLinejoin="round"
            strokeDasharray={`${perim * compDraw} ${perim}`}
            opacity={compDraw > 0 ? 1 - 0.3 * settle : 0}
          />
          {compPts.map((r, i) => {
            const q = pt(r, ang(i));
            const f0 = perim > 0 ? cum[i] / perim : 0;
            const k = interpolate(
              compDraw * 1.04 + (compDraw > 0 ? 0.02 : 0),
              [f0, f0 + 0.05],
              [0, 1],
              CLAMP,
            );
            return (
              <circle
                key={`cd${list[i] ?? i}`}
                cx={q.x}
                cy={q.y}
                r={3 * u}
                fill={interpolateColors(settle, [0, 1], [p.comp, p.compOver])}
                opacity={k * (1 - 0.3 * settle)}
              />
            );
          })}

          {brandOn > 0 ? (
            <path
              d={poly(brandPts)}
              fill="none"
              stroke={stroke}
              strokeWidth={2.5 * u}
              strokeLinejoin="round"
              opacity={brandOn}
            />
          ) : null}
          {brandPts.map((r, i) => {
            const q = pt(r, ang(i));
            return (
              <circle
                key={`bd${list[i] ?? i}`}
                cx={q.x}
                cy={q.y}
                r={4.5 * u}
                fill={stroke}
                stroke={p.bg}
                strokeWidth={2 * u}
                opacity={brandOn}
              />
            );
          })}
        </svg>

        {list.map((ax, i) => {
          const a = ang(i);
          const k = interpolate(t, [10 + i * 2, 30 + i * 2], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          const q = pt(R + (22 + 6 * (1 - k)) * u, a);
          const sx = Math.sin(a);
          const sy = -Math.cos(a);
          const won = mine[i] > comp[i];
          return (
            <div
              key={`l${ax}`}
              style={{
                position: "absolute",
                left: q.x,
                top: q.y,
                transform: `translate(${-50 + sx * 50}%, ${-50 + sy * 50}%)`,
                fontFamily: sans,
                fontWeight: 500,
                fontSize: 17 * u,
                letterSpacing: "-0.005em",
                color: won
                  ? interpolateColors(settle, [0, 1], [p.muted, p.fg])
                  : p.muted,
                whiteSpace: "nowrap",
                opacity: k * stage,
              }}
            >
              {ax}
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: textLeft,
            top: cy,
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              opacity: hero,
              filter: hero < 0.99 ? `blur(${(1 - hero) * 8 * u}px)` : undefined,
              transform: `translateX(${(1 - hero) * 26 * u}px)`,
            }}
          >
            {isRemocn ? (
              <RemocnLogo fontSize={104 * u} color={p.fg} />
            ) : (
              <div
                style={{
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: 108 * u,
                  lineHeight: 0.9,
                  letterSpacing: "-0.04em",
                  color: p.fg,
                  whiteSpace: "nowrap",
                }}
              >
                {brandLabel}
              </div>
            )}
          </div>
          <div
            style={{
              marginTop: 24 * u,
              fontFamily: sans,
              fontWeight: 400,
              fontSize: 28 * u,
              lineHeight: 1.25,
              letterSpacing: "-0.015em",
              color: p.fg,
              maxWidth: width * 0.34,
              textWrap: "balance",
              opacity: line2,
              transform: `translateY(${(1 - line2) * 10 * u}px)`,
            }}
          >
            {caption ?? (
              <>
                Ahead of {competitorLabel} on{" "}
                <span
                  style={{
                    fontFamily: serif,
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: "1.18em",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {wins} of {n}
                </span>
                .
              </>
            )}
          </div>
          <div
            style={{
              marginTop: 26 * u,
              display: "flex",
              alignItems: "center",
              gap: 26 * u,
              fontFamily: sans,
              fontWeight: 400,
              fontSize: 17 * u,
              color: p.muted,
              whiteSpace: "nowrap",
              opacity: line3,
              transform: `translateY(${(1 - line3) * 8 * u}px)`,
            }}
          >
            {[
              { name: brandLabel, color: stroke, w: 2.5 },
              { name: competitorLabel, color: p.comp, w: 1.75 },
            ].map((it) => (
              <div
                key={it.name}
                style={{ display: "flex", alignItems: "center", gap: 10 * u }}
              >
                <span
                  style={{
                    width: 18 * u,
                    height: it.w * u,
                    borderRadius: it.w * u,
                    background: it.color,
                  }}
                />
                {it.name}
              </div>
            ))}
          </div>
        </div>
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
