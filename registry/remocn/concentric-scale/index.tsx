"use client";

import { loadFont } from "@remotion/google-fonts/Sora";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sora } = loadFont("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});

// gradients.sh "limb" palette: the final disc glows at its rim like a planet limb.
const LIMB = ["#e9ecff", "#8a8bff", "#4b2bd6", "#160c3a"] as const;

export interface ScaleStep {
  value: string;
  label?: string;
}

export interface ConcentricScaleProps {
  steps?: ScaleStep[];
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_STEPS: ScaleStep[] = [
  { value: "1" },
  { value: "10" },
  { value: "1,000" },
  { value: "100,000", label: "creators" },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_RING = Easing.bezier(0.22, 0.8, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const TAU = Math.PI * 2;
const G = 1.9;
const FIRST = 18;
const STEP = 30;
const NODE_A = (-45 * Math.PI) / 180;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.2)",
    hairStrong: "rgba(255,255,255,0.5)",
    // [offset, colour, alpha] from the centre out to the rim.
    limb: [
      [0, LIMB[3], 0],
      [0.45, LIMB[3], 0.55],
      [0.8, LIMB[2], 0.55],
      [0.95, LIMB[1], 0.7],
      [1, LIMB[0], 0.82],
    ],
    dotIn: LIMB[1],
    dotOut: LIMB[0],
    arc: LIMB[0],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.2)",
    hairStrong: "rgba(18,18,20,0.5)",
    limb: [
      [0, LIMB[0], 0],
      [0.5, LIMB[0], 0.5],
      [0.8, LIMB[1], 0.4],
      [0.94, LIMB[2], 0.55],
      [1, LIMB[2], 0.85],
    ],
    dotIn: LIMB[1],
    dotOut: LIMB[2],
    arc: LIMB[2],
    grain: 0.045,
  },
} as const;

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function beadCount(k: number) {
  return k === 1 ? 10 : Math.round(10 * 3.4 ** (k - 1));
}

const FIELD_N = 520;
const FIELD = Array.from({ length: FIELD_N }, (_, i) => {
  const turn = (i * 0.381966 + (hash(i * 3 + 1) - 0.5) * 0.004) % 1;
  return {
    id: i,
    a: turn,
    r: Math.min(
      1,
      Math.max(0, (i + 0.5) / FIELD_N + (hash(i * 7 + 2) - 0.5) * 0.02),
    ),
    o: 0.45 + 0.4 * hash(i * 11 + 5),
  };
});

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
          seed={53}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function RingLabel({
  x,
  y,
  step,
  size,
  color,
  sub,
  opacity,
  shift,
}: {
  x: number;
  y: number;
  step: ScaleStep;
  size: number;
  color: string;
  sub: string;
  opacity: number;
  shift: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(calc(-100% + ${shift}px), -100%)`,
        display: "flex",
        alignItems: "baseline",
        gap: size * 0.32,
        whiteSpace: "nowrap",
        opacity,
      }}
    >
      <span
        style={{
          fontFamily: sora,
          fontWeight: 500,
          fontSize: size,
          letterSpacing: "-0.03em",
          fontVariantNumeric: "tabular-nums",
          color,
        }}
      >
        {step.value}
      </span>
      {step.label ? (
        <span
          style={{
            fontFamily: sora,
            fontWeight: 400,
            fontSize: size * 0.78,
            color: sub,
          }}
        >
          {step.label}
        </span>
      ) : null}
    </div>
  );
}

export function ConcentricScale({
  steps = DEFAULT_STEPS,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ConcentricScaleProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const list = steps.length >= 2 ? steps.slice(0, 7) : DEFAULT_STEPS;
  const last = list.length - 1;

  const startOf = (k: number) => FIRST + (k - 1) * STEP;
  const T_FINAL = startOf(last);
  const SWEEP = 30;
  const HIT = T_FINAL + SWEEP;

  let lc = 0;
  for (let k = 1; k < last; k++) {
    lc += interpolate(t, [startOf(k) + 12, startOf(k) + 40], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
  }
  lc += interpolate(t, [T_FINAL + 8, HIT + 22], [0, 0.14], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const pan = interpolate(t, [T_FINAL + 16, HIT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const cx = interpolate(pan, [0, 1], [width * 0.5, width * 0.34]);
  const cy = height * 0.5;
  const RH = height * 0.38;
  const screenR = (x: number) => RH * G ** (x - 1 - lc);

  const ringX = (k: number) => {
    if (k === last) return k;
    const s = startOf(k);
    const e = interpolate(t, [s, s + 28], [0, 1], {
      ...CLAMP,
      easing: EASE_RING,
    });
    const from = k === 1 ? -2.6 : k - 1;
    return from + (k - from) * e;
  };

  const dotIn = interpolate(t, [2, 16], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const sweep = interpolate(t, [T_FINAL, HIT], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const lead = interpolate(t, [HIT - 4, HIT + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const hero = interpolate(t, [HIT + 2, HIT + 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const sub = interpolate(t, [HIT + 10, HIT + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const settle = interpolate(t, [T_FINAL, T_FINAL + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const rFinal = screenR(last);
  const rInner = last > 1 ? screenR(last - 1) * 1.14 : 18 * u;
  const hw = Math.max(1, u);
  const arcEnd = TAU * sweep;
  const startA = Math.PI / 2;
  const arcPt = (a: number) => ({
    x: cx + rFinal * Math.sin(startA + a),
    y: cy - rFinal * Math.cos(startA + a),
  });
  const ae = arcPt(arcEnd);
  const as = arcPt(0);
  const arcD =
    sweep >= 0.999
      ? `M ${cx + rFinal} ${cy} A ${rFinal} ${rFinal} 0 1 1 ${cx - rFinal} ${cy} A ${rFinal} ${rFinal} 0 1 1 ${cx + rFinal} ${cy}`
      : `M ${as.x} ${as.y} A ${rFinal} ${rFinal} 0 ${arcEnd > Math.PI ? 1 : 0} 1 ${ae.x} ${ae.y}`;
  const wedgeD = `M ${cx} ${cy} L ${as.x} ${as.y} A ${rFinal} ${rFinal} 0 ${arcEnd > Math.PI ? 1 : 0} 1 ${ae.x} ${ae.y} Z`;
  const gid = `cs${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const leadX0 = cx + rFinal + 14 * u;
  const textLeft = width * 0.6;
  const leadX1 = leadX0 + (textLeft - 22 * u - leadX0) * lead;

  const rings = Array.from({ length: last - 1 }, (_, i) => i + 1);
  const finalStep = list[last];

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        {rings.map((k) => {
          const s = startOf(k);
          const vis = interpolate(t, [s, s + 8], [0, 1], CLAMP);
          if (vis <= 0) return null;
          const r = screenR(ringX(k));
          const newest = k === last - 1 || t < startOf(k + 1);
          return (
            <g key={`r${k}`} opacity={vis}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={newest && settle < 1 ? p.hairStrong : p.hair}
                strokeOpacity={newest ? 1 - 0.5 * settle : 1}
                strokeWidth={hw * 1.25}
              />
              {Array.from({ length: beadCount(k) }, (_, j) => {
                const count = beadCount(k);
                const jitter = j === 0 ? 0 : (hash(k * 97 + j) - 0.5) * 0.5;
                const a = NODE_A + ((j + jitter) / count) * TAU;
                const delay = (j / count) * 14;
                const b = interpolate(
                  t,
                  [s + 4 + delay, s + 12 + delay],
                  [0, 1],
                  {
                    ...CLAMP,
                    easing: EASE_OUT,
                  },
                );
                if (b <= 0) return null;
                return (
                  <circle
                    key={`b${j}`}
                    cx={cx + r * Math.sin(a)}
                    cy={cy - r * Math.cos(a)}
                    r={(j === 0 ? 3.4 : 2.4) * u * (0.5 + 0.5 * b)}
                    fill={p.fg}
                    opacity={(j === 0 ? 1 : 0.62) * b}
                  />
                );
              })}
            </g>
          );
        })}
        {sweep > 0 ? (
          <>
            <defs>
              <radialGradient
                id={`${gid}l`}
                gradientUnits="userSpaceOnUse"
                cx={cx + Math.sin(t / 50) * 4 * u}
                cy={cy + Math.cos(t / 60) * 4 * u}
                r={rFinal}
              >
                {p.limb.map(([o, col, a]) => (
                  <stop
                    key={`s${o}`}
                    offset={o}
                    stopColor={col}
                    stopOpacity={a}
                  />
                ))}
              </radialGradient>
              <radialGradient
                id={`${gid}d`}
                gradientUnits="userSpaceOnUse"
                cx={cx}
                cy={cy}
                r={rFinal}
              >
                <stop offset={rInner / rFinal} stopColor={p.dotIn} />
                <stop offset={1} stopColor={p.dotOut} />
              </radialGradient>
              <clipPath id={`${gid}w`}>
                <path d={wedgeD} />
              </clipPath>
            </defs>
            <circle
              cx={cx}
              cy={cy}
              r={rFinal}
              fill={`url(#${gid}l)`}
              clipPath={sweep >= 0.999 ? undefined : `url(#${gid}w)`}
              opacity={0.55 + 0.45 * lead}
            />
            <circle
              cx={cx}
              cy={cy}
              r={rFinal}
              fill="none"
              stroke={p.hair}
              strokeWidth={hw}
              strokeOpacity={0.6}
            />
            {FIELD.map((d) => {
              const k = interpolate(
                sweep,
                [d.a * 0.92, d.a * 0.92 + 0.08],
                [0, 1],
                CLAMP,
              );
              if (k <= 0) return null;
              const ro = rFinal * 0.95;
              const rr = Math.sqrt(rInner ** 2 + (ro ** 2 - rInner ** 2) * d.r);
              const a = startA + d.a * TAU;
              return (
                <circle
                  key={d.id}
                  cx={cx + rr * Math.sin(a)}
                  cy={cy - rr * Math.cos(a)}
                  r={1.6 * u}
                  fill={`url(#${gid}d)`}
                  opacity={k * d.o}
                />
              );
            })}
            <path
              d={arcD}
              fill="none"
              stroke={p.arc}
              strokeWidth={2.5 * u}
              strokeLinecap="round"
            />
            <circle
              cx={sweep >= 0.999 ? cx + rFinal : ae.x}
              cy={sweep >= 0.999 ? cy : ae.y}
              r={5 * u}
              fill={p.arc}
            />
          </>
        ) : null}
        {lead > 0 ? (
          <line
            x1={leadX0}
            y1={cy}
            x2={leadX1}
            y2={cy}
            stroke={p.hairStrong}
            strokeWidth={hw}
          />
        ) : null}
        <circle
          cx={cx}
          cy={cy}
          r={5 * u * (0.6 + 0.4 * dotIn)}
          fill={p.fg}
          opacity={dotIn}
        />
      </svg>

      <RingLabel
        x={cx - 10 * u}
        y={cy - 10 * u}
        step={list[0]}
        size={
          interpolate(t, [startOf(1), startOf(1) + 20], [40, 20], {
            ...CLAMP,
            easing: EASE_IO,
          }) * u
        }
        color={p.fg}
        sub={p.muted}
        opacity={interpolate(t, [6, 20], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        })}
        shift={0}
      />
      {rings.map((k) => {
        const s = startOf(k);
        const a = interpolate(t, [s + 10, s + 26], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        if (a <= 0) return null;
        const r = screenR(ringX(k));
        const newer = interpolate(
          t,
          [startOf(k + 1), startOf(k + 1) + 20],
          [0, 1],
          {
            ...CLAMP,
            easing: EASE_IO,
          },
        );
        const qx = cx + r * Math.sin(NODE_A) - 10 * u;
        const qy = cy - r * Math.cos(NODE_A) - 8 * u;
        return (
          <RingLabel
            key={`l${k}`}
            x={qx}
            y={qy}
            step={list[k]}
            size={(28 - 8 * newer) * u}
            color={p.fg}
            sub={p.muted}
            opacity={a}
            shift={(1 - a) * 10 * u}
          />
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
            fontFamily: sora,
            fontWeight: 300,
            fontSize: 112 * u,
            lineHeight: 0.9,
            letterSpacing: "-0.055em",
            color: p.fg,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            opacity: hero,
            filter: hero < 0.99 ? `blur(${(1 - hero) * 8 * u}px)` : undefined,
            transform: `translateX(${(1 - hero) * -22 * u}px)`,
          }}
        >
          {finalStep.value}
        </div>
        {finalStep.label ? (
          <div
            style={{
              marginTop: 18 * u,
              display: "flex",
              alignItems: "center",
              gap: 10 * u,
              fontFamily: sora,
              fontWeight: 400,
              fontSize: 26 * u,
              letterSpacing: "-0.015em",
              color: p.muted,
              whiteSpace: "nowrap",
              opacity: sub,
              transform: `translateY(${(1 - sub) * 8 * u}px)`,
            }}
          >
            <span
              style={{
                width: 10 * u,
                height: 10 * u,
                borderRadius: "50%",
                background: accent,
                flexShrink: 0,
              }}
            />
            {finalStep.label}
          </div>
        ) : null}
      </div>

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
