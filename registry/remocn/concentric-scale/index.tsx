"use client";

import { loadFont } from "@remotion/google-fonts/Sora";
import type React from "react";
import { useId } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type ConcentricScaleElementId,
  concentricScaleTimeline,
  DEFAULT_STEPS,
  stepsOf,
} from "./timeline";

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
  /** Frames between one ring and the next. */
  beat?: number;
  /** Weight of the final figure. */
  fontWeight?: number;
  /** Text color of the values; overrides the theme ink. */
  ink?: string;
  /** Background fill; "transparent" drops it. */
  background?: string;
  /** Typeface for the values and labels. Load it yourself; Sora by default. */
  fontFamily?: string;
  /** Size of the rings and copy, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  /** Film grain over the scene. */
  grain?: boolean;
  theme?: "dark" | "light";
  speed?: number;
  /**
   * Moves, trims or stretches the centre, each ring, the final sweep and the
   * hero's landing, by the ids in `./timeline`. Frames on the scene timeline,
   * after `delay` and `speed`.
   */
  timing?: Timing<ConcentricScaleElementId>;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_RING = Easing.bezier(0.22, 0.8, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const TAU = Math.PI * 2;
const G = 1.9;
/** Frames a ring's value takes to shrink once the next ring opens. */
const SHRINK = 20;
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
  fontFamily,
  moving,
  settled,
}: {
  x: number;
  y: number;
  step: ScaleStep;
  size: number;
  color: string;
  sub: string;
  opacity: number;
  shift: number;
  fontFamily: string;
  /** The label is riding its ring or changing size this frame. */
  moving: boolean;
  /** Where it ends and the size it ends at. */
  settled: { x: number; y: number; size: number };
}) {
  const glide = useGlide();
  // A label rides its ring on left/top and shrinks by font size, and layout
  // rounds a box and a baseline to whole pixels, so it clicks along pixel by
  // pixel. It is laid out once where it ends, at the size it ends at, and
  // carried and scaled about its corner by a transform all its life: handed
  // back to layout at rest it would jump to the nearest pixel.
  const k = size / settled.size;
  const box = settled.size;
  return (
    <div
      style={{
        position: "absolute",
        left: settled.x,
        top: settled.y,
        transformOrigin: "0 0",
        transform: `translate(${x - settled.x}px, ${y - settled.y}px) scale(${k})${glide(moving)} translate(calc(-100% + ${shift / k}px), -100%)`,
        display: "flex",
        alignItems: "baseline",
        gap: box * 0.32,
        whiteSpace: "nowrap",
        opacity,
      }}
    >
      <span
        style={{
          fontFamily,
          fontWeight: 500,
          fontSize: box,
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
            fontFamily,
            fontWeight: 400,
            fontSize: box * 0.78,
            color: sub,
          }}
        >
          {step.label}
        </span>
      ) : null}
    </div>
  );
}

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function ConcentricScale(props: ConcentricScaleProps) {
  const {
    steps = DEFAULT_STEPS,
    accent = "#3B5BFD",
    fontWeight = 300,
    ink,
    background,
    fontFamily = sora,
    scale = 1,
    delay = 0,
    grain = true,
    theme = "dark",
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width, height, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    concentricScaleTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const fg = ink ?? p.fg;
  const stage =
    background === "transparent" ? "transparent" : (background ?? p.bg);
  const list = stepsOf<ScaleStep>(steps, DEFAULT_STEPS);
  const last = list.length - 1;

  const centerEl = tl.get("center");
  const finalEl = tl.get("final");
  const hitEl = tl.get("hit");
  const ringEl = (k: number) => tl.get(`ring:${k}`);
  const startOf = (k: number) => (k >= last ? finalEl : ringEl(k)).start;
  const T_FINAL = finalEl.start;
  const HIT = hitEl.start;

  const lcAt = (tt: number) => {
    let lc = 0;
    for (let k = 1; k < last; k++) {
      const r = ringEl(k);
      lc += interpolate(
        tt,
        [r.start + r.beat("zoomAt"), r.start + r.beat("zoomEnd")],
        [0, 1],
        {
          ...CLAMP,
          easing: EASE_IO,
        },
      );
    }
    return (
      lc +
      interpolate(
        tt,
        [T_FINAL + finalEl.beat("zoomAt"), HIT + hitEl.beat("zoomEnd")],
        [0, 0.14],
        {
          ...CLAMP,
          easing: EASE_IO,
        },
      )
    );
  };
  const cxAt = (tt: number) => {
    const pan = interpolate(
      tt,
      [T_FINAL + finalEl.beat("panAt"), HIT + hitEl.beat("panEnd")],
      [0, 1],
      {
        ...CLAMP,
        easing: EASE_IO,
      },
    );
    return interpolate(pan, [0, 1], [width * 0.5, width * 0.34]);
  };
  const cx = cxAt(t);
  const cy = height * 0.5;
  const RH = height * 0.38;
  const screenRAt = (x: number, tt: number) => RH * G ** (x - 1 - lcAt(tt));
  const screenR = (x: number) => screenRAt(x, t);

  const ringXAt = (k: number, tt: number) => {
    if (k === last) return k;
    const r = ringEl(k);
    const e = interpolate(tt, [r.start, r.start + r.beat("grow")], [0, 1], {
      ...CLAMP,
      easing: EASE_RING,
    });
    const from = k === 1 ? -2.6 : k - 1;
    return from + (k - from) * e;
  };
  const ringX = (k: number) => ringXAt(k, t);

  // Where each ring's label sits and how big it is; label 0 is the centre's.
  const labelAt = (k: number, tt: number) => {
    const ox = cxAt(tt);
    if (k === 0)
      return {
        x: ox - 10 * u,
        y: cy - 10 * u,
        size:
          interpolate(tt, [startOf(1), startOf(1) + SHRINK], [40, 20], {
            ...CLAMP,
            easing: EASE_IO,
          }) * u,
        shift: 0,
      };
    const ring = ringEl(k);
    const a = interpolate(
      tt,
      [ring.start + ring.beat("labelAt"), ring.start + ring.beat("labelEnd")],
      [0, 1],
      {
        ...CLAMP,
        easing: EASE_OUT,
      },
    );
    const r = screenRAt(ringXAt(k, tt), tt);
    const newer = interpolate(
      tt,
      [startOf(k + 1), startOf(k + 1) + SHRINK],
      [0, 1],
      {
        ...CLAMP,
        easing: EASE_IO,
      },
    );
    return {
      x: ox + r * Math.sin(NODE_A) - 10 * u,
      y: cy - r * Math.cos(NODE_A) - 8 * u,
      size: (28 - 8 * newer) * u,
      shift: (1 - a) * 10 * u,
    };
  };
  const labelMoves = (k: number) => {
    const now = labelAt(k, t);
    return [labelAt(k, t - 1), labelAt(k, t + 1)].some(
      (o) =>
        Math.abs(o.x - now.x) > 1e-3 ||
        Math.abs(o.y - now.y) > 1e-3 ||
        Math.abs(o.size - now.size) > 1e-4 ||
        Math.abs(o.shift - now.shift) > 1e-3,
    );
  };
  const label = (k: number) => ({
    ...labelAt(k, t),
    moving: labelMoves(k),
    settled: labelAt(k, Number.MAX_SAFE_INTEGER),
  });

  const dotIn = interpolate(t, [centerEl.start, centerEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const sweep = interpolate(t, [T_FINAL, finalEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const lead = interpolate(
    t,
    [HIT + hitEl.beat("lead"), HIT + hitEl.beat("leadEnd")],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_OUT,
    },
  );
  const hero = interpolate(
    t,
    [HIT + hitEl.beat("heroAt"), HIT + hitEl.beat("heroEnd")],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_OUT,
    },
  );
  const subAt = (tt: number) =>
    interpolate(
      tt,
      [HIT + hitEl.beat("subAt"), HIT + hitEl.beat("subEnd")],
      [0, 1],
      {
        ...CLAMP,
        easing: EASE_OUT,
      },
    );
  const sub = subAt(t);
  const subMoving =
    Math.abs(subAt(t + 1) - sub) * 8 * u > 1e-3 ||
    Math.abs(sub - subAt(t - 1)) * 8 * u > 1e-3;
  const settle = interpolate(
    t,
    [T_FINAL, T_FINAL + finalEl.beat("settle")],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_IO,
    },
  );

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
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          {rings.map((k) => {
            const ring = ringEl(k);
            const s = ring.start;
            const vis = interpolate(
              t,
              [s, s + ring.beat("fade")],
              [0, 1],
              CLAMP,
            );
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
                    [
                      s + ring.beat("beadsAt") + delay,
                      s + ring.beat("beadsEnd") + delay,
                    ],
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
                const rr = Math.sqrt(
                  rInner ** 2 + (ro ** 2 - rInner ** 2) * d.r,
                );
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
          {...label(0)}
          step={list[0]}
          color={fg}
          sub={p.muted}
          fontFamily={fontFamily}
          opacity={interpolate(
            t,
            [
              centerEl.start + centerEl.beat("labelAt"),
              centerEl.start +
                centerEl.beat("labelAt") +
                centerEl.beat("label"),
            ],
            [0, 1],
            {
              ...CLAMP,
              easing: EASE_OUT,
            },
          )}
        />
        {rings.map((k) => {
          const ring = ringEl(k);
          const a = interpolate(
            t,
            [
              ring.start + ring.beat("labelAt"),
              ring.start + ring.beat("labelEnd"),
            ],
            [0, 1],
            {
              ...CLAMP,
              easing: EASE_OUT,
            },
          );
          if (a <= 0) return null;
          return (
            <RingLabel
              key={`l${k}`}
              {...label(k)}
              step={list[k]}
              color={fg}
              sub={p.muted}
              fontFamily={fontFamily}
              opacity={a}
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
              fontFamily,
              fontWeight,
              fontSize: 112 * u,
              lineHeight: 0.9,
              letterSpacing: "-0.055em",
              color: fg,
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
                fontFamily,
                fontWeight: 400,
                fontSize: 26 * u,
                letterSpacing: "-0.015em",
                color: p.muted,
                whiteSpace: "nowrap",
                opacity: sub,
                transform: `translateY(${(1 - sub) * 8 * u}px)${glide(subMoving)}`,
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
      </ScaleLayer>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${stage} 100%)`,
          opacity: 0.6,
        }}
      />
      {grain ? <Grain opacity={p.grain} /> : null}
    </AbsoluteFill>
  );
}
