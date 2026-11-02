"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
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

const { fontFamily: sans } = loadSans("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface SlopeLine {
  before: number;
  after: number;
}

export interface SlopeChartProps {
  lines?: SlopeLine[];
  highlight?: SlopeLine;
  value?: string;
  label?: string;
  beforeLabel?: string;
  afterLabel?: string;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_LINES: SlopeLine[] = [
  { before: 14, after: 16 },
  { before: 20, after: 18 },
  { before: 10, after: 13 },
  { before: 24, after: 22 },
  { before: 17, after: 20 },
  { before: 3, after: 5 },
  { before: 28, after: 27 },
];

const DEFAULT_HIGHLIGHT: SlopeLine = { before: 6, after: 41 };

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const DRAW_EASE = Easing.bezier(0.45, 0, 0.2, 1);
const CLIMB_EASE = Easing.bezier(0.55, 0, 0.15, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    line: "#9C9BA1",
    axis: "rgba(255,255,255,0.22)",
    tick: "rgba(255,255,255,0.08)",
    // gradients.sh "limb": brightens as the line climbs
    limb: ["accent", "#8a8bff", "#e9ecff"],
    wedge: 0.34,
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    line: "#8F8D87",
    axis: "rgba(18,18,20,0.24)",
    tick: "rgba(18,18,20,0.08)",
    limb: ["#8a8bff", "accent", "#4b2bd6"],
    wedge: 0.18,
    grain: 0.045,
  },
} as const;

const AXES = [0, 16] as const;
const GREY_AT = 12;
const GREY_STAGGER = 4;
const GREY_DRAW = 24;
const CLIMB = [60, 100] as const;
const HIT = 98;

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
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function spread(ys: number[], minGap: number) {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  for (let pass = 0; pass < 8; pass++) {
    for (let k = 1; k < order.length; k++) {
      const gap = order[k].y - order[k - 1].y;
      if (gap < minGap) {
        const push = (minGap - gap) / 2;
        order[k - 1].y -= push;
        order[k].y += push;
      }
    }
  }
  const out = [...ys];
  for (const o of order) out[o.i] = o.y;
  return out;
}

function taper(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  w0: number,
  w1: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const a = [x0 + (nx * w0) / 2, y0 + (ny * w0) / 2];
  const b = [x1 + (nx * w1) / 2, y1 + (ny * w1) / 2];
  const c = [x1 - (nx * w1) / 2, y1 - (ny * w1) / 2];
  const d = [x0 - (nx * w0) / 2, y0 - (ny * w0) / 2];
  return `M${a[0]} ${a[1]} L${b[0]} ${b[1]} L${c[0]} ${c[1]} L${d[0]} ${d[1]} Z`;
}

const fmt = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");

export function SlopeChart({
  lines = DEFAULT_LINES,
  highlight = DEFAULT_HIGHLIGHT,
  value = "6.8×",
  label = "more launch videos shipped",
  beforeLabel = "Before",
  afterLabel = "After",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: SlopeChartProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const p = THEMES[theme];

  const greys = lines.slice(0, 8);
  const all = [...greys, highlight];
  const max = Math.max(1, ...all.flatMap((l) => [l.before, l.after]));
  const min = Math.min(0, ...all.flatMap((l) => [l.before, l.after]));

  const xL = W * 0.2;
  const xR = W * 0.58;
  const yTop = H * 0.235;
  const yBot = H * 0.8;
  const yOf = (v: number) => yBot - ((v - min) / (max - min)) * (yBot - yTop);

  const axisIn = interpolate(t, AXES, [0, 1], { ...CLAMP, easing: EASE_IO });
  const axisLabelIn = interpolate(t, [6, 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const push = interpolate(t, [0, HIT + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const camScale = 0.975 + 0.025 * push;
  // The chart sits centred alone; the frame eases over as the number lands.
  const slide = interpolate(t, [CLIMB[0] + 8, HIT + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const camX = W * 0.11 * (1 - slide);

  const climb = interpolate(t, CLIMB, [0, 1], {
    ...CLAMP,
    easing: CLIMB_EASE,
  });
  const dim = interpolate(t, [CLIMB[0] - 2, CLIMB[0] + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const leftYs = spread(
    all.map((l) => yOf(l.before)),
    20 * u,
  );
  const rightYs = spread(
    greys.map((l) => yOf(l.after)),
    20 * u,
  );

  const hx0 = xL;
  const hy0 = yOf(highlight.before);
  const hx1 = xR;
  const hy1 = yOf(highlight.after);
  const tipX = hx0 + (hx1 - hx0) * climb;
  const tipY = hy0 + (hy1 - hy0) * climb;
  const wStart = 2.2 * u;
  const wTip = (2.2 + 5.4 * climb) * u;
  const startDot = spring({
    frame: t - CLIMB[0] + 6,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.6 },
  });

  const hit = spring({
    frame: t - HIT,
    fps,
    config: { damping: 15, stiffness: 170, mass: 0.7 },
  });
  const hitO = interpolate(t, [HIT, HIT + 6], [0, 1], CLAMP);
  const ring = interpolate(t, [HIT, HIT + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const lab = interpolate(t, [HIT + 8, HIT + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const valueSize = 156 * u;
  const gradId = `${useId().replace(/[^a-zA-Z0-9_-]/g, "")}-limb`;
  const tipColor = p.limb[p.limb.length - 1];
  const stroke = Math.max(1, u);

  const greyEls: React.ReactNode[] = [];
  const greyDots: React.ReactNode[] = [];
  greys.forEach((l, i) => {
    const start = GREY_AT + i * GREY_STAGGER;
    const prog = interpolate(t, [start, start + GREY_DRAW], [0, 1], {
      ...CLAMP,
      easing: DRAW_EASE,
    });
    if (prog <= 0) return;
    const y0 = yOf(l.before);
    const y1 = yOf(l.after);
    const x = xL + (xR - xL) * prog;
    const y = y0 + (y1 - y0) * prog;
    const o = 0.95 - 0.4 * dim;
    greyEls.push(
      <line
        key={`l${i}`}
        x1={xL}
        y1={y0}
        x2={x}
        y2={y}
        stroke={p.line}
        strokeWidth={1.7 * u}
        strokeLinecap="round"
        opacity={o}
      />,
    );
    const a = interpolate(t, [start, start + 6], [0, 1], CLAMP);
    const b = interpolate(
      t,
      [start + GREY_DRAW - 4, start + GREY_DRAW + 4],
      [0, 1],
      CLAMP,
    );
    greyDots.push(
      <circle
        key={`a${i}`}
        cx={xL}
        cy={y0}
        r={3.6 * u * (0.6 + 0.4 * a)}
        fill={p.line}
        opacity={a * o}
      />,
      <circle
        key={`b${i}`}
        cx={xR}
        cy={y1}
        r={3.6 * u * (0.6 + 0.4 * b)}
        fill={p.line}
        opacity={b * o}
      />,
    );
  });

  const gridVals = [0.25, 0.5, 0.75, 1].map((k) => min + (max - min) * k);

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translateX(${camX}px) scale(${camScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1={hx0}
              y1={hy0}
              x2={hx1}
              y2={hy1}
            >
              {p.limb.map((c, i) => (
                <stop
                  key={c}
                  offset={i / (p.limb.length - 1)}
                  stopColor={c === "accent" ? accent : c}
                />
              ))}
            </linearGradient>
            <linearGradient
              id={`${gradId}-w`}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={hy1}
              x2={0}
              y2={hy0}
            >
              <stop
                offset={0}
                stopColor={p.limb[1] === "accent" ? accent : p.limb[1]}
                stopOpacity={p.wedge}
              />
              <stop offset={1} stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          {gridVals.map((v) => (
            <line
              key={v}
              x1={xL}
              x2={xL + (xR - xL) * axisIn}
              y1={yOf(v)}
              y2={yOf(v)}
              stroke={p.tick}
              strokeWidth={stroke}
              strokeDasharray={`${2 * u} ${6 * u}`}
            />
          ))}
          {[xL, xR].map((x) => (
            <line
              key={x}
              x1={x}
              x2={x}
              y1={yBot + 14 * u}
              y2={yBot + 14 * u - (yBot - yTop + 28 * u) * axisIn}
              stroke={p.axis}
              strokeWidth={stroke}
            />
          ))}
          {climb > 0 && (
            <path
              d={`M${hx0} ${hy0} L${tipX} ${tipY} L${tipX} ${hy0} Z`}
              fill={`url(#${gradId}-w)`}
            />
          )}
          {greyEls}
          {greyDots}
          {climb > 0 && (
            <>
              <path
                d={taper(hx0, hy0, tipX, tipY, wStart, wTip)}
                fill={`url(#${gradId})`}
              />
              <circle
                cx={tipX}
                cy={tipY}
                r={wTip / 2}
                fill={`url(#${gradId})`}
              />
            </>
          )}
          <circle
            cx={hx0}
            cy={hy0}
            r={5 * u * (0.6 + 0.4 * startDot)}
            fill={accent}
            opacity={Math.min(1, startDot * 1.4)}
          />
          {t >= HIT && (
            <circle
              cx={hx1}
              cy={hy1}
              r={(8 + 34 * ring) * u}
              fill="none"
              stroke={tipColor}
              strokeWidth={1.5 * u}
              opacity={(1 - ring) * 0.7}
            />
          )}
          {climb > 0 && (
            <circle
              cx={tipX}
              cy={tipY}
              r={(6.5 + 2 * hit) * u}
              fill={`url(#${gradId})`}
            />
          )}
          {climb > 0 && <circle cx={tipX} cy={tipY} r={2.4 * u} fill={p.bg} />}
        </svg>

        {all.map((l, i) => {
          const isHl = i === all.length - 1;
          const start = isHl ? CLIMB[0] - 6 : GREY_AT + i * GREY_STAGGER;
          const a = interpolate(t, [start + 2, start + 14], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          const o = isHl ? 1 : 0.9 - 0.45 * dim;
          return (
            <div
              key={`v${i}`}
              style={{
                position: "absolute",
                left: xL - 120 * u - 18 * u,
                top: leftYs[i] - 10 * u,
                width: 120 * u,
                textAlign: "right",
                fontFamily: sans,
                fontWeight: isHl ? 500 : 400,
                fontSize: 16 * u,
                lineHeight: `${20 * u}px`,
                color: isHl ? accent : p.muted,
                fontVariantNumeric: "tabular-nums",
                opacity: a * o,
                transform: `translateX(${(1 - a) * 8 * u}px)`,
              }}
            >
              {fmt(l.before)}
            </div>
          );
        })}

        {greys.map((l, i) => {
          const end = GREY_AT + i * GREY_STAGGER + GREY_DRAW;
          const a = interpolate(t, [end - 4, end + 10], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          return (
            <div
              key={`r${i}`}
              style={{
                position: "absolute",
                left: xR + 18 * u,
                top: rightYs[i] - 10 * u,
                fontFamily: sans,
                fontWeight: 400,
                fontSize: 16 * u,
                lineHeight: `${20 * u}px`,
                color: p.muted,
                fontVariantNumeric: "tabular-nums",
                opacity: a * (0.9 - 0.45 * dim),
                transform: `translateX(${(1 - a) * -8 * u}px)`,
              }}
            >
              {fmt(l.after)}
            </div>
          );
        })}

        {[
          { x: xL, text: beforeLabel },
          { x: xR, text: afterLabel },
        ].map((ax) => (
          <div
            key={ax.text}
            style={{
              position: "absolute",
              left: ax.x - 100 * u,
              width: 200 * u,
              top: yBot + 30 * u,
              textAlign: "center",
              fontFamily: sans,
              fontWeight: 500,
              fontSize: 18 * u,
              letterSpacing: "-0.01em",
              color: p.fg,
              opacity: axisLabelIn,
              transform: `translateY(${(1 - axisLabelIn) * 8 * u}px)`,
            }}
          >
            {ax.text}
          </div>
        ))}

        <div
          style={{
            position: "absolute",
            left: xR + 44 * u,
            top: hy1 - valueSize * 0.5,
            opacity: hitO,
            transform: `translateX(${(1 - hit) * -18 * u}px)`,
          }}
        >
          <div
            style={{
              fontFamily: serif,
              fontWeight: 400,
              fontSize: valueSize,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: p.fg,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {value}
          </div>
          <div
            style={{
              marginTop: 10 * u,
              fontFamily: sans,
              fontWeight: 500,
              fontSize: 20 * u,
              letterSpacing: "-0.01em",
              color: p.muted,
              opacity: lab,
              transform: `translateY(${(1 - lab) * 8 * u}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        </div>
      </AbsoluteFill>
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
