"use client";

import { loadFont } from "@remotion/google-fonts/Sora";
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
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});

/** gradients.sh "beam" (#f4f7ff #8fb4ff #3d5bff #1a1660): the hero ring's light. */
const BEAM = {
  stops: ["#C4D6FF", "#8FB4FF", "#3D5BFF", "#3A2FC4"],
  css: "linear-gradient(135deg, #C4D6FF, #8FB4FF 30%, #3D5BFF 66%, #3A2FC4)",
};

export interface ActivityRing {
  label: string;
  /** The number the label counts up to. */
  value: number;
  /** Optional suffix after the value: "h", "k". */
  unit?: string;
  /** How far past the goal the ring laps, as a fraction: 1.14 = 114%. */
  goal?: number;
}

export interface ActivityRingsProps {
  /** Up to three rings, outermost first. */
  rings?: ActivityRing[];
  /** Small heading above the readouts. */
  title?: string;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_RINGS: ActivityRing[] = [
  { label: "Renders", value: 1284, goal: 1.14 },
  { label: "Templates", value: 42, goal: 1.08 },
  { label: "Hours saved", value: 310, goal: 1.05 },
];

const EASE_FILL = Easing.bezier(0.55, 0, 0.18, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    key: "radial-gradient(ellipse 38% 62% at 36% 50%, rgba(61,91,255,0.16), rgba(26,22,96,0.10) 55%, transparent 100%)",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.12)",
    neutrals: ["#BEBCB6", "#6A686E"],
    track: 0.13,
    capShadow: "rgba(0,0,0,0.65)",
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    key: "radial-gradient(ellipse 50% 70% at 36% 46%, rgba(255,255,255,0.95), transparent 70%)",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.12)",
    neutrals: ["#5E5C57", "#B3B0A8"],
    track: 0.11,
    capShadow: "rgba(30,24,16,0.4)",
    grain: 0.045,
  },
} as const;

function rgb(hex: string): number[] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const v = Number.parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function alpha(color: string, a: number) {
  const c = rgb(color);
  if (c) return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const m = /^rgb\((\d+),(\d+),(\d+)\)$/.exec(color);
  if (m) return `rgba(${m[1]},${m[2]},${m[3]},${a})`;
  return color;
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
          seed={3}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const fmt = (v: number) => Math.round(v).toLocaleString("en-US");

/** Point on a ring at progress `p` (0 = 12 o'clock, clockwise). */
function at(cx: number, cy: number, r: number, p: number) {
  const a = p * Math.PI * 2;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a), a };
}

function Ring({
  cx,
  cy,
  r,
  sw,
  p,
  color,
  lapColor,
  track,
  shadow,
  uid,
  u,
}: {
  cx: number;
  cy: number;
  r: number;
  sw: number;
  p: number;
  color: string;
  lapColor: string;
  track: string;
  shadow: string;
  uid: string;
  u: number;
}) {
  const C = 2 * Math.PI * r;
  const clipId = `${uid}c`;
  const blurId = `${uid}b`;
  const base = Math.min(p, 1);
  const lap = Math.max(0, p - 1);
  // the end cap casts a soft shadow forward onto the ring it is about to cover
  const capP = p > 0.75 ? p : 0;
  const end = at(cx, cy, r, capP);
  const fwd = 2.6 * u;
  const capOpacity = interpolate(p, [0.8, 1], [0, 1], CLAMP);
  const rot = `rotate(-90 ${cx} ${cy})`;
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path
            clipRule="evenodd"
            d={`M ${cx - r - sw / 2} ${cy} a ${r + sw / 2} ${r + sw / 2} 0 1 0 ${2 * r + sw} 0 a ${r + sw / 2} ${r + sw / 2} 0 1 0 ${-(2 * r + sw)} 0 Z M ${cx - r + sw / 2} ${cy} a ${r - sw / 2} ${r - sw / 2} 0 1 0 ${2 * r - sw} 0 a ${r - sw / 2} ${r - sw / 2} 0 1 0 ${-(2 * r - sw)} 0 Z`}
          />
        </clipPath>
        <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={2.6 * u} />
        </filter>
      </defs>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={track}
        strokeWidth={sw}
      />
      {base > 0.001 ? (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap={base >= 1 ? "butt" : "round"}
          strokeDasharray={base >= 1 ? undefined : `${base * C} ${C}`}
          transform={rot}
        />
      ) : null}
      {capP > 0 ? (
        <g clipPath={`url(#${clipId})`} opacity={capOpacity}>
          <circle
            cx={end.x + Math.cos(end.a) * fwd}
            cy={end.y + Math.sin(end.a) * fwd}
            r={sw / 2}
            fill={shadow}
            filter={`url(#${blurId})`}
          />
        </g>
      ) : null}
      {lap > 0.0005 ? (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={lapColor}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={`${lap * C} ${C}`}
          transform={rot}
        />
      ) : capP > 0 ? (
        // redraw the cap over its own shadow while still inside the first lap
        <circle cx={end.x} cy={end.y} r={sw / 2} fill={color} />
      ) : null}
    </g>
  );
}

export function ActivityRings({
  rings = DEFAULT_RINGS,
  title = "This month",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: ActivityRingsProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame * speed;
  const u = Math.min(width / 1280, height / 720);
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const list = rings.slice(0, 3);

  // hero ring carries the gradient; the others stay neutral so the data reads
  const gradId = `${uid}beam`;
  const colors = [accent, c.neutrals[0], c.neutrals[1]];
  const paints = [`url(#${gradId})`, c.neutrals[0], c.neutrals[1]];
  const swatches = [BEAM.css, c.neutrals[0], c.neutrals[1]];

  const cx = width * 0.355;
  const cy = height * 0.5;
  const sw = 26 * u;
  const gap = 8 * u;
  const R0 = 182 * u;
  const radius = (i: number) => R0 - i * (sw + gap);

  // timeline
  const FILL_START = 16;
  const fillEnd = (i: number) => 58 + i * 4; // every ring closes, outermost first
  const HIT = fillEnd(list.length - 1);

  const stageIn = interpolate(t, [0, 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const progress = (i: number) => {
    const goal = Math.max(1, list[i].goal ?? 1);
    const p1 = interpolate(t, [FILL_START + i * 4, fillEnd(i)], [0, 1], {
      ...CLAMP,
      easing: EASE_FILL,
    });
    if (t < HIT) return p1;
    const s = spring({
      frame: t - HIT - i * 2,
      fps,
      config: { damping: 15, mass: 0.9, stiffness: 120 },
    });
    return 1 + (goal - 1) * s;
  };

  // the hit: a small bump of the whole object and a check in the centre
  const bump = interpolate(t, [HIT, HIT + 5, HIT + 16], [0, 1, 0], {
    ...CLAMP,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const check = spring({
    frame: t - HIT - 1,
    fps,
    config: { damping: 13, mass: 0.6, stiffness: 160 },
  });
  const checkDraw = interpolate(t, [HIT + 3, HIT + 13], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const pulse = interpolate(t, [HIT, HIT + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const push = interpolate(t, [0, HIT + 60], [0, 1], CLAMP);
  const innerR = radius(list.length - 1) - sw / 2;
  const badge = Math.min(32 * u, innerR * 0.42);

  // readouts
  const rowX = width * 0.6;
  const rowH = 108 * u;
  const rowsTop = cy - (list.length * rowH) / 2 + 18 * u;
  const row = (k: number, d = 0) =>
    interpolate(t, [8 + k * 4 + d, 26 + k * 4 + d], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: c.key,
        }}
      />

      {/* rings plane: moves a touch more than the readouts for parallax */}
      <AbsoluteFill
        style={{
          transform: `translateX(${-push * 10 * u}px) scale(${(0.94 + stageIn * 0.06) * (1 + push * 0.02) * (1 + bump * 0.016)})`,
          transformOrigin: `${cx}px ${cy}px`,
          opacity: stageIn,
        }}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            {/* fixed in space, drifting a few degrees: light falls from the top right */}
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1={cx + R0 * Math.cos(-0.9 + push * 0.25)}
              y1={cy + R0 * Math.sin(-0.9 + push * 0.25)}
              x2={cx - R0 * Math.cos(-0.9 + push * 0.25)}
              y2={cy - R0 * Math.sin(-0.9 + push * 0.25)}
            >
              {BEAM.stops.map((col, k) => (
                <stop
                  key={col}
                  offset={k / (BEAM.stops.length - 1)}
                  stopColor={col}
                />
              ))}
            </linearGradient>
          </defs>
          {list.map((ring, i) => (
            <Ring
              key={ring.label}
              cx={cx}
              cy={cy}
              r={radius(i)}
              sw={sw}
              p={progress(i)}
              color={paints[i]}
              lapColor={paints[i]}
              track={alpha(i === 0 ? BEAM.stops[2] : colors[i], c.track)}
              shadow={c.capShadow}
              uid={`${uid}r${i}`}
              u={u}
            />
          ))}
          {/* hit pulse just outside the outer ring */}
          {t >= HIT ? (
            <circle
              cx={cx}
              cy={cy}
              r={R0 + sw / 2 + 6 * u + pulse * 26 * u}
              fill="none"
              stroke={accent}
              strokeWidth={Math.max(1, 1.5 * u)}
              opacity={(1 - pulse) * 0.45}
            />
          ) : null}
          {/* centre check */}
          {t >= HIT ? (
            <g
              transform={`translate(${cx} ${cy}) scale(${0.82 + check * 0.18})`}
              opacity={Math.min(1, check * 1.6)}
            >
              <circle r={badge} fill={`url(#${gradId})`} />
              <path
                d={`M ${-badge * 0.36} ${badge * 0.02} L ${-badge * 0.1} ${badge * 0.28} L ${badge * 0.38} ${-badge * 0.24}`}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={badge * 0.15}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - checkDraw}
              />
            </g>
          ) : null}
        </svg>
      </AbsoluteFill>

      {/* readouts */}
      <AbsoluteFill
        style={{
          transform: `translateX(${-push * 5 * u}px)`,
          fontFamily: sans,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: rowX,
            top: rowsTop - 58 * u,
            display: "flex",
            alignItems: "center",
            gap: 12 * u,
            opacity: row(0, -6),
            transform: `translateY(${(1 - row(0, -6)) * 10 * u}px)`,
          }}
        >
          <span
            style={{
              color: c.fg,
              fontWeight: 500,
              fontSize: 18 * u,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </span>
          <span
            style={{
              width: 200 * u * row(0, -2),
              height: Math.max(1, u),
              background: c.hair,
            }}
          />
        </div>
        {list.map((ring, i) => {
          const p = progress(i);
          const v = ring.value * Math.min(1, p);
          const over = Math.round((p - 1) * 100);
          const overIn = interpolate(
            t,
            [HIT + 4 + i * 3, HIT + 16 + i * 3],
            [0, 1],
            {
              ...CLAMP,
              easing: EASE_OUT,
            },
          );
          const r = row(i + 1);
          return (
            <div
              key={ring.label}
              style={{
                position: "absolute",
                left: rowX,
                top: rowsTop + i * rowH,
                display: "flex",
                flexDirection: "column",
                gap: 6 * u,
                overflow: "hidden",
                paddingBottom: 4 * u,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10 * u,
                  transform: `translateY(${(1 - r) * 120}%)`,
                }}
              >
                <span
                  style={{
                    width: 10 * u,
                    height: 10 * u,
                    borderRadius: "50%",
                    background: swatches[i],
                  }}
                />
                <span
                  style={{
                    color: c.muted,
                    fontWeight: 400,
                    fontSize: 17 * u,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {ring.label}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12 * u,
                  transform: `translateY(${(1 - r) * 110}%)`,
                }}
              >
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: 64 * u,
                    lineHeight: 1,
                    letterSpacing: "-0.045em",
                    fontVariantNumeric: "tabular-nums",
                    color: c.fg,
                  }}
                >
                  {fmt(v)}
                  {ring.unit ? (
                    <span style={{ color: c.muted, fontSize: 30 * u }}>
                      {ring.unit}
                    </span>
                  ) : null}
                </span>
                {over > 0 ? (
                  <span
                    style={{
                      fontWeight: 400,
                      fontSize: 16 * u,
                      color: c.muted,
                      fontVariantNumeric: "tabular-nums",
                      opacity: overIn,
                      transform: `translateY(${(1 - overIn) * 8 * u}px)`,
                    }}
                  >
                    +{over}% of goal
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>

      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
