"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont } from "@remotion/google-fonts/Manrope";
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

export interface Step {
  title: string;
  detail?: string;
}

export interface ThreeStepsProps {
  steps?: Step[];
  eyebrow?: string;
  outcome?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_STEPS: Step[] = [
  { title: "Install", detail: "Add a component with the shadcn CLI" },
  { title: "Compose", detail: "Arrange scenes in plain React" },
  { title: "Render", detail: "Export MP4 from Remotion" },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_LAND = Easing.bezier(0.2, 1.1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    key: "rgba(255,255,255,0.05)",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.16)",
    // gradients.sh "halo": amber → rose → blue, read left to right across the steps.
    ramp: ["#ffb36b", "#e2457a", "#3d4dff"],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    key: "rgba(255,255,255,0.85)",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.16)",
    // gradients.sh "ribbon" (light): orange → pink → violet.
    ramp: ["#ff7a2e", "#ff3d9a", "#5b3dff"],
    grain: 0.045,
  },
} as const;

type Theme = (typeof THEMES)[keyof typeof THEMES];

function hexRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Sample an evenly spaced colour ramp at k ∈ [0, 1]. */
function sampleRamp(ramp: readonly string[], k: number) {
  const x = Math.min(1, Math.max(0, k)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(x));
  const f = x - i;
  const a = hexRgb(ramp[i]);
  const b = hexRgb(ramp[i + 1]);
  const m = a.map((v, j) => Math.round(v + (b[j] - v) * f));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}

function rampCss(ramp: readonly string[]) {
  return ramp
    .map((col, i) => `${col} ${(i / (ramp.length - 1)) * 100}%`)
    .join(", ");
}

const LINE_START = 2;
const LINE_DUR = 26;
const FIRST_FILL = 26;
const TRAVEL = 18;
const PAUSE = 10;

export const threeStepsLength = (count = 3) =>
  FIRST_FILL + (count - 1) * (TRAVEL + PAUSE) + 30 + 40;

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
          seed={11}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function rise(t: number, start: number, dur = 14) {
  return interpolate(t, [start, start + dur], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
}

function MaskLine({
  t,
  start,
  children,
  pad,
  style,
}: {
  t: number;
  start: number;
  children: React.ReactNode;
  pad: number;
  style: React.CSSProperties;
}) {
  const e = interpolate(t, [start, start + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_LAND,
  });
  const b = interpolate(t, [start, start + 7], [1, 0], CLAMP);
  return (
    <div style={{ overflow: "hidden", paddingBottom: pad }}>
      <div
        style={{
          ...style,
          transform: `translateY(${(1 - e) * 112}%)`,
          filter: b > 0.02 ? `blur(${b * 4}px)` : undefined,
          visibility: e > 0 ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function StepText({
  index,
  step,
  t,
  start,
  ghostAt,
  last,
  outcome,
  accent,
  c,
  u,
  numSize,
  sheen,
}: {
  index: number;
  step: Step;
  t: number;
  start: number;
  ghostAt: number;
  last: boolean;
  outcome?: string;
  accent: string;
  c: Theme;
  u: number;
  numSize: number;
  /** Gradient band for the numeral: total width and this numeral's offset in it. */
  sheen: { total: number; offset: number; width: number };
}) {
  const outIn = rise(t, start + 16, 18);
  const lit = interpolate(t, [start - 2, start + 8], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const ruleIn = interpolate(t, [start + 12, start + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <MaskLine
        t={t}
        start={ghostAt}
        pad={numSize * 0.04}
        style={{
          fontFamily: sans,
          fontWeight: 400,
          fontSize: numSize,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          fontVariantNumeric: "tabular-nums",
          color: `color-mix(in srgb, ${c.fg} 14%, ${c.bg})`,
        }}
      >
        <span style={{ position: "relative", display: "inline-block" }}>
          {String(index + 1).padStart(2, "0")}
          <span
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `linear-gradient(90deg, ${rampCss(c.ramp)})`,
              backgroundSize: `${sheen.total}px 100%`,
              backgroundPosition: `${-(sheen.offset - (sheen.width - numSize * 1.12) / 2)}px 0`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              opacity: lit,
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </span>
      </MaskLine>
      <div style={{ height: 18 * u }} />
      <MaskLine
        t={t}
        start={start + 3}
        pad={8 * u}
        style={{
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 44 * u,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          color: c.fg,
          whiteSpace: "nowrap",
        }}
      >
        {step.title}
      </MaskLine>
      {step.detail ? (
        <MaskLine
          t={t}
          start={start + 6}
          pad={4 * u}
          style={{
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 20 * u,
            lineHeight: 1.35,
            letterSpacing: "-0.005em",
            color: c.muted,
            textWrap: "balance",
            maxWidth: 232 * u,
            marginTop: 2 * u,
          }}
        >
          {step.detail}
        </MaskLine>
      ) : null}
      {last && outcome ? (
        <div
          style={{
            marginTop: 22 * u,
            display: "flex",
            alignItems: "center",
            gap: 12 * u,
          }}
        >
          <div
            style={{
              width: 22 * u,
              transform: `scaleX(${ruleIn})`,
              opacity: ruleIn > 0.04 ? 1 : 0,
              transformOrigin: "right",
              height: Math.max(1.5, 2 * u),
              borderRadius: u,
              background: c.ramp[c.ramp.length - 1],
            }}
          />
          <div
            style={{
              fontFamily: serif,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 28 * u,
              lineHeight: 1,
              letterSpacing: "-0.005em",
              color: accent,
              whiteSpace: "nowrap",
              opacity: outIn,
              transform: `translateX(${(1 - outIn) * -10 * u}px)`,
              filter: `blur(${(1 - outIn) * 4 * u}px)`,
            }}
          >
            {outcome}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ThreeSteps({
  steps = DEFAULT_STEPS,
  eyebrow = "How it works",
  outcome = "Your launch video, shipped",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ThreeStepsProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const c = THEMES[theme];
  const n = Math.max(1, steps.length);

  const L = W * 0.08;
  const colW = (W - 2 * L) / n;
  const numSize = Math.min(146 * u, colW * 0.42);
  const lineY = H * 0.5 - 146 * u;
  const nodeR = 9 * u;
  const nodeX = (i: number) => L + (i + 0.5) * colW;
  const lastX = nodeX(n - 1);
  const firstX = nodeX(0);

  const fillAt = (i: number) => FIRST_FILL + i * (TRAVEL + PAUSE);
  const done = fillAt(n - 1);

  const lineP = interpolate(t, [LINE_START, LINE_START + LINE_DUR], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const lineEnd = firstX + (lastX - firstX) * lineP;

  let dotX = firstX;
  for (let i = 1; i < n; i++) {
    const p = interpolate(t, [fillAt(i) - TRAVEL, fillAt(i)], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    dotX += (nodeX(i) - nodeX(i - 1)) * p;
  }
  const dotIn = interpolate(t, [FIRST_FILL - 8, FIRST_FILL], [0, 1], CLAMP);
  const dotOut = interpolate(t, [done, done + 4], [1, 0], CLAMP);
  const travelling = n > 1 && t > fillAt(0) && t < done;
  const trail = travelling ? 1 : 0;

  const eyeIn = rise(t, 8, 18);
  const ringP = interpolate(t, [done, done + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const cam = interpolate(t, [0, done + 60], [1, 1.025], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const stroke = Math.max(1, u);
  const railId = `rail${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 65% at 42% 40%, ${c.key}, transparent 72%)`,
        }}
      />
      <AbsoluteFill
        style={{ transform: `scale(${cam})`, transformOrigin: "45% 45%" }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            textAlign: "center",
            top: lineY - 70 * u,
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 15 * u,
            lineHeight: 1,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: c.muted,
            opacity: eyeIn,
            transform: `translateY(${(1 - eyeIn) * 8 * u}px)`,
          }}
        >
          {eyebrow}
        </div>

        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          <line
            x1={firstX}
            y1={lineY}
            x2={lineEnd}
            y2={lineY}
            stroke={c.hair}
            strokeWidth={stroke}
          />
          <defs>
            <linearGradient
              id={railId}
              gradientUnits="userSpaceOnUse"
              x1={firstX}
              y1={0}
              x2={lastX}
              y2={0}
            >
              {c.ramp.map((col, i) => (
                <stop
                  key={col}
                  offset={i / (c.ramp.length - 1)}
                  stopColor={col}
                />
              ))}
            </linearGradient>
          </defs>
          <line
            x1={firstX}
            y1={lineY}
            x2={Math.max(firstX + 0.01, dotX)}
            y2={lineY}
            stroke={`url(#${railId})`}
            strokeOpacity={dotIn}
            strokeWidth={stroke * 2.5}
            strokeLinecap="round"
          />
          {steps.map((_, i) => {
            const x = nodeX(i);
            const reach = interpolate(
              lineEnd,
              [x - 30 * u, x + 4 * u],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
            const f = interpolate(t, [fillAt(i), fillAt(i) + 8], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            const pop = Math.sin(Math.PI * f);
            const fillColor = sampleRamp(
              c.ramp,
              (x - firstX) / Math.max(1, lastX - firstX),
            );
            const r = nodeR * (0.7 + 0.3 * reach) * (1 + 0.18 * pop);
            return (
              <g key={i} opacity={reach}>
                <circle
                  cx={x}
                  cy={lineY}
                  r={r}
                  fill={c.bg}
                  stroke={f > 0 ? fillColor : c.muted}
                  strokeOpacity={f > 0 ? 1 : 0.7}
                  strokeWidth={stroke * 1.5}
                />
                <circle
                  cx={x}
                  cy={lineY}
                  r={r * f}
                  fill={fillColor}
                  opacity={f}
                />
              </g>
            );
          })}
          {n > 0 ? (
            <circle
              cx={lastX}
              cy={lineY}
              r={nodeR * (1 + ringP * 2.6)}
              fill="none"
              stroke={c.ramp[c.ramp.length - 1]}
              strokeWidth={stroke * 1.5}
              opacity={(1 - ringP) * (ringP > 0 ? 0.8 : 0)}
            />
          ) : null}
          {[3, 2, 1].map((g) => (
            <circle
              key={g}
              cx={dotX - g * 7 * u * trail}
              cy={lineY}
              r={nodeR * 0.55}
              fill={c.fg}
              opacity={dotIn * dotOut * trail * (0.22 / g)}
            />
          ))}
          <circle
            cx={dotX}
            cy={lineY}
            r={nodeR * 0.55}
            fill={c.fg}
            opacity={dotIn * dotOut}
          />
        </svg>

        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: nodeX(i) - colW / 2 + 12 * u,
              top: lineY + 48 * u,
              width: colW - 24 * u,
            }}
          >
            <StepText
              index={i}
              step={step}
              t={t}
              start={fillAt(i) + 2}
              ghostAt={
                LINE_START + 4 + (i / Math.max(1, n - 1)) * LINE_DUR * 0.85
              }
              last={i === n - 1}
              outcome={outcome}
              accent={accent}
              c={c}
              u={u}
              numSize={numSize}
              sheen={{
                total: lastX - firstX + numSize * 1.12,
                offset: nodeX(i) - firstX,
                width: numSize * 1.12,
              }}
            />
          </div>
        ))}
      </AbsoluteFill>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
