"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const manrope = loadManrope("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});
const display = manrope.fontFamily;
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600. */
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

export interface MeasureDimProps {
  subject?: React.ReactNode;
  label?: string;
  value?: string;
  before?: string;
  beforeLabel?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const SLIDE = Easing.bezier(0.45, 0, 0.12, 1);

const BAR_AT = 2;
const EXT_A = 16;
const ARR_A = 24;
const ARR_LEN = 26;
const GHOST_AT = ARR_A + ARR_LEN - 4;
const EXT_B = GHOST_AT + 10;
const ARR_B = GHOST_AT + 16;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    line: "rgba(243,242,239,0.82)",
    ghost: "rgba(243,242,239,0.42)",
    ghostFill: "rgba(255,255,255,0.03)",
    sheen: 0.22,
    tipStop: "#E9ECFF",
    grain: 0.055,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    line: "rgba(18,18,20,0.82)",
    ghost: "rgba(18,18,20,0.42)",
    ghostFill: "rgba(18,18,20,0.03)",
    sheen: 0.16,
    tipStop: "#A9AAFF",
    grain: 0.04,
  },
} as const;

function parse(v: string) {
  const m = v.match(/-?\d[\d,]*(\.\d+)?/);
  if (!m || m.index === undefined) return null;
  const n = Number.parseFloat(m[0].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  return {
    n,
    decimals: m[1] ? m[1].length - 1 : 0,
    pre: v.slice(0, m.index),
    post: v.slice(m.index + m[0].length),
  };
}

function counted(v: string, k: number) {
  const p = parse(v);
  if (!p) return { num: v, unit: "" };
  const n = (p.n * k).toFixed(p.decimals);
  const [i, d] = n.split(".");
  const grouped = Number(i).toLocaleString("en-US");
  return { num: `${p.pre}${grouped}${d ? `.${d}` : ""}`, unit: p.post.trim() };
}

function estimateEm(text: string) {
  let w = 0;
  for (const ch of text) {
    if (ch === " ") w += 0.25;
    else if (".,:;'!|/".includes(ch)) w += 0.27;
    else if (ch >= "0" && ch <= "9") w += 0.6;
    else w += 0.52;
  }
  return w;
}

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

interface DimProps {
  x0: number;
  x1: number;
  y: number;
  k: number;
  value: string;
  size: number;
  color: string;
  textColor: string;
  unitColor: string;
  u: number;
}

function Arrow({
  side,
  k,
  color,
  u,
}: {
  side: "left" | "right";
  k: number;
  color: string;
  u: number;
}) {
  const head = 15 * u;
  const wing = 5 * u;
  const stroke = Math.max(1, 1.5 * u);
  const headOp = interpolate(k, [0, 0.08], [0, 1], CLAMP);
  const outer = side === "left" ? "left" : "right";
  const inner = side === "left" ? "right" : "left";
  return (
    <div style={{ position: "relative", flex: 1, alignSelf: "stretch" }}>
      <div
        style={{
          position: "absolute",
          [inner]: 0,
          top: "50%",
          width: `${k * 100}%`,
          height: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            [outer]: head * 0.6,
            [inner]: 0,
            top: -stroke / 2,
            height: stroke,
            background: color,
          }}
        />
        <svg
          width={head}
          height={wing * 2}
          style={{
            position: "absolute",
            [outer]: 0,
            top: -wing,
            opacity: headOp,
            transform: side === "right" ? "scaleX(-1)" : undefined,
          }}
          aria-hidden
        >
          <path
            d={`M 0 ${wing} L ${head} 0 L ${head} ${wing * 2} Z`}
            fill={color}
          />
        </svg>
      </div>
    </div>
  );
}

function Dimension({
  x0,
  x1,
  y,
  k,
  value,
  size,
  color,
  textColor,
  unitColor,
  u,
}: DimProps) {
  if (k <= 0) return null;
  const head = 15 * u;
  const finalText = counted(value, 1);
  const span = x1 - x0;
  const inline =
    span >
    estimateEm(`${finalText.num} ${finalText.unit}`) * size + 2 * head + 72 * u;
  const textOp = interpolate(k, [0, 0.18], [0, 1], CLAMP);
  const now = counted(value, k);
  const textRow = (txt: { num: string; unit: string }, hidden: boolean) => (
    <div
      style={{
        gridArea: "1 / 1",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "center",
        visibility: hidden ? "hidden" : "visible",
      }}
    >
      <span style={{ fontVariantNumeric: "tabular-nums", color: textColor }}>
        {txt.num}
      </span>
      {txt.unit ? (
        <span
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "1.04em",
            letterSpacing: "-0.01em",
            marginLeft: "0.16em",
            color: unitColor,
          }}
        >
          {txt.unit}
        </span>
      ) : null}
    </div>
  );
  const text = (
    <div
      style={{
        display: "grid",
        padding: inline ? `0 ${18 * u}px` : 0,
        fontFamily: display,
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.035em",
        whiteSpace: "nowrap",
        opacity: textOp,
      }}
    >
      {textRow(finalText, true)}
      {textRow(now, false)}
    </div>
  );
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x0,
          width: span,
          top: y - size / 2,
          height: size,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Arrow side="left" k={k} color={color} u={u} />
        {inline ? text : null}
        <Arrow side="right" k={k} color={color} u={u} />
      </div>
      {inline ? null : (
        <div
          style={{
            position: "absolute",
            left: x0 + span / 2,
            top: y - size - 14 * u,
            transform: "translateX(-50%)",
          }}
        >
          {text}
        </div>
      )}
    </>
  );
}

export function MeasureDim({
  subject,
  label = "remocn",
  value = "184 fps",
  before = "60 fps",
  beforeLabel = "Before",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: MeasureDimProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const p = THEMES[theme];

  const a = parse(value)?.n ?? 1;
  const b = before ? (parse(before)?.n ?? a * 0.4) : 0;
  const hasGhost = Boolean(before);
  const maxW = 0.7 * W;
  const top = Math.max(a, hasGhost ? b : 0) || 1;
  const heroW = maxW * Math.max(0.18, a / top);
  const ghostW = maxW * Math.max(0.18, b / top);
  const x0 = (W - maxW) / 2;

  const heroSize = 104 * u;
  const ghostSize = 40 * u;
  const barH = 72 * u;
  const total = (hasGhost ? 376 : 240) * u;
  const dimA = H / 2 - total / 2 + heroSize / 2;
  const heroTop = dimA + 76 * u;
  const ghostTop = heroTop + barH + 28 * u;
  const dimB = ghostTop + barH + 46 * u;

  const bar = EASE_IO(interpolate(t, [BAR_AT, BAR_AT + 18], [0, 1], CLAMP));
  const extA = EASE_OUT(interpolate(t, [EXT_A, EXT_A + 12], [0, 1], CLAMP));
  const arrA = SLIDE(interpolate(t, [ARR_A, ARR_A + ARR_LEN], [0, 1], CLAMP));
  const ghost = EASE_IO(
    interpolate(t, [GHOST_AT, GHOST_AT + 16], [0, 1], CLAMP),
  );
  const extB = EASE_OUT(interpolate(t, [EXT_B, EXT_B + 12], [0, 1], CLAMP));
  const arrB = SLIDE(interpolate(t, [ARR_B, ARR_B + 22], [0, 1], CLAMP));
  const labelIn = EASE_OUT(
    interpolate(t, [BAR_AT + 14, BAR_AT + 28], [0, 1], CLAMP),
  );
  const ghostLabelIn = EASE_OUT(
    interpolate(t, [GHOST_AT + 10, GHOST_AT + 24], [0, 1], CLAMP),
  );
  const push = EASE_IO(interpolate(t, [0, ARR_B + 60], [0, 1], CLAMP));
  const drift = interpolate(t, [0, 140], [0, 1], CLAMP);

  // gradients.sh "limb" (#160c3a → #4b2bd6 → #8a8bff → #e9ecff) with the accent woven in.
  const limb = `linear-gradient(90deg, #160C3A ${-6 + 4 * drift}%, #4B2BD6 ${30 + 3 * drift}%, ${accent} ${52 + 3 * drift}%, #8A8BFF ${80 + 2 * drift}%, ${p.tipStop} 104%)`;
  const limbSheen = `radial-gradient(60% 140% at ${62 + 14 * drift}% 0%, rgba(233,236,255,${p.sheen}) 0%, transparent 70%)`;

  const stroke = Math.max(1, 1.25 * u);
  const ext = (x: number, y0: number, y1: number, k: number, c: string) =>
    k > 0 ? (
      <line
        x1={x}
        x2={x}
        y1={y0}
        y2={y0 + (y1 - y0) * k}
        stroke={c}
        strokeWidth={stroke}
      />
    ) : null;

  const barLabel: React.CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 22 * u,
    display: "flex",
    alignItems: "center",
    fontFamily: display,
    fontWeight: 500,
    fontSize: 18 * u,
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
  };

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${0.985 + 0.015 * push})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: x0,
            top: heroTop,
            width: heroW,
            height: barH,
            borderRadius: 8 * u,
            overflow: "hidden",
            backgroundImage: subject ? undefined : `${limbSheen}, ${limb}`,
            clipPath: `inset(0 ${(1 - bar) * 100}% 0 0 round ${8 * u}px)`,
          }}
        >
          {subject ?? (
            <div
              style={{
                ...barLabel,
                color: "#FFFFFF",
                opacity: labelIn,
                transform: `translateX(${(1 - labelIn) * -8 * u}px)`,
              }}
            >
              {label === "remocn" ? (
                <RemocnLogo fontSize={26 * u} color="#FFFFFF" />
              ) : (
                label
              )}
            </div>
          )}
        </div>

        {hasGhost ? (
          <div
            style={{
              position: "absolute",
              left: x0,
              top: ghostTop,
              width: ghostW,
              height: barH,
              clipPath: `inset(-2px ${(1 - ghost) * 100}% -2px -2px)`,
            }}
          >
            <svg
              width={ghostW}
              height={barH}
              style={{ position: "absolute", inset: 0, overflow: "visible" }}
            >
              <rect
                x={stroke / 2}
                y={stroke / 2}
                width={ghostW - stroke}
                height={barH - stroke}
                rx={8 * u}
                fill={p.ghostFill}
                stroke={p.ghost}
                strokeWidth={stroke}
                strokeDasharray={`${7 * u} ${5 * u}`}
              />
            </svg>
            <div
              style={{
                ...barLabel,
                color: p.muted,
                opacity: ghostLabelIn,
              }}
            >
              {beforeLabel}
            </div>
          </div>
        ) : null}

        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          {ext(x0, heroTop - 8 * u, dimA - 16 * u, extA, p.line)}
          {ext(x0 + heroW, heroTop - 8 * u, dimA - 16 * u, extA, p.line)}
          {hasGhost ? (
            <>
              {ext(x0, ghostTop + barH + 8 * u, dimB + 16 * u, extB, p.ghost)}
              {ext(
                x0 + ghostW,
                ghostTop + barH + 8 * u,
                dimB + 16 * u,
                extB,
                p.ghost,
              )}
            </>
          ) : null}
        </svg>

        <Dimension
          x0={x0}
          x1={x0 + heroW}
          y={dimA}
          k={arrA}
          value={value}
          size={heroSize}
          color={p.line}
          textColor={p.fg}
          unitColor={p.fg}
          u={u}
        />
        {hasGhost ? (
          <Dimension
            x0={x0}
            x1={x0 + ghostW}
            y={dimB}
            k={arrB}
            value={before}
            size={ghostSize}
            color={p.ghost}
            textColor={p.muted}
            unitColor={p.muted}
            u={u}
          />
        ) : null}
      </AbsoluteFill>

      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
