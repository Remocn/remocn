"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
loadDisplay("italic", { weights: ["400"], subsets: ["latin"] });

// gradients.sh "grain" palette: a warm copper plate under the etching, and
// the copper ink of the shading pass.
const GRAIN = ["#ffd8b4", "#e0703b", "#8a2c1d", "#2b1015"] as const;

export interface HatchShadeProps {
  value?: string;
  caption?: string;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const PEN = Easing.bezier(0.45, 0, 0.2, 1);

const CAP = 0.72;

const PASSES = [
  { at: 8, sweep: 30, draw: 11, angle: 45, gap: 8, ink: "fg" },
  { at: 40, sweep: 30, draw: 11, angle: -45, gap: 8, ink: "fg" },
  { at: 74, sweep: 26, draw: 10, angle: 0, gap: 6, ink: "copper" },
] as const;

const OUTLINE_AT = 100;
const OUTLINE_END = 110;
const CAPTION_AT = 112;

const THEMES = {
  dark: {
    bg: "#070505",
    fg: "#F6EEE6",
    muted: "#9A8E86",
    ink: 0.66,
    ghost: 0.05,
    grain: 0.055,
  },
  light: {
    bg: "#F5F2EC",
    fg: "#1A1210",
    muted: "#77695F",
    ink: 0.72,
    ghost: 0.045,
    grain: 0.04,
  },
} as const;

type Box = { x: number; y: number; w: number; h: number };

function hatchLines(box: Box, angleDeg: number, gap: number) {
  const a = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const nx = -dy;
  const ny = dx;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const half = Math.hypot(box.w, box.h) / 2;
  const spread = Math.abs(nx) * box.w + Math.abs(ny) * box.h;
  const n = Math.ceil(spread / gap);
  const lines: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    k: number;
  }> = [];
  for (let i = 0; i <= n; i++) {
    const off = -spread / 2 + i * gap;
    const px = cx + nx * off;
    const py = cy + ny * off;
    lines.push({
      x1: px - dx * half,
      y1: py - dy * half,
      x2: px + dx * half,
      y2: py + dy * half,
      k: n === 0 ? 0 : i / n,
    });
  }
  return lines;
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

export function HatchShade({
  value = "24",
  caption = "new components, drawn for launch week",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: HatchShadeProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const stage = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const bodyId = `b${uid}`;
  const shadeId = `s${uid}`;
  const rimId = `r${uid}`;
  const copperId = `c${uid}`;
  const isDark = theme === "dark";
  const drift = interpolate(t, [0, 160], [0, 1], CLAMP);

  const chars = Math.max(1, Array.from(value).length);
  const size = Math.min(0.68 * H, (0.8 * W) / (chars * 0.6));
  const capH = CAP * size;
  const capSize = 22 * u;
  const gapBelow = 40 * u;
  const blockH = capH + (caption ? gapBelow + capSize * 1.3 : 0);
  const top = (H - blockH) / 2;
  const baseline = top + capH;
  const cx = W / 2;
  const estW = chars * 0.66 * size;
  const box: Box = {
    x: cx - estW / 2 - 20 * u,
    y: top - 20 * u,
    w: estW + 40 * u,
    h: capH + 40 * u,
  };
  const shift = 0.034 * size;
  const hair = Math.max(1.5, 1.7 * u);

  const textProps = {
    x: cx,
    y: baseline,
    textAnchor: "middle" as const,
    fontFamily: display,
    fontWeight: 500,
    fontSize: size,
    letterSpacing: `${-0.02 * size}px`,
  };

  const outline = interpolate(t, [OUTLINE_AT, OUTLINE_END], [0, 1], CLAMP);
  const capIn = EASE_OUT(
    interpolate(t, [CAPTION_AT, CAPTION_AT + 16], [0, 1], CLAMP),
  );
  const ghost = interpolate(
    t,
    [0, 10, OUTLINE_AT, OUTLINE_END],
    [0, 1, 1, 0],
    CLAMP,
  );

  const passes = PASSES.map((pass, pi) => {
    const lines = hatchLines(box, pass.angle, pass.gap * u);
    const color = pass.ink === "copper" ? `url(#${copperId})` : stage.fg;
    const opacity = pass.ink === "copper" ? 1 : stage.ink;
    const els = lines.map((l, i) => {
      const order = pi === 1 ? l.k : l.k;
      const start = pass.at + order * pass.sweep;
      const p = PEN(interpolate(t, [start, start + pass.draw], [0, 1], CLAMP));
      if (p <= 0) return null;
      const taper = pi === 1 ? interpolate(l.k, [0.18, 0.8], [0, 1], CLAMP) : 1;
      if (taper * hair * 1.35 < 0.45) return null;
      return (
        <line
          key={i}
          strokeWidth={pi === 1 ? taper * hair * 1.35 : undefined}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          pathLength={1}
          strokeDasharray={p >= 1 ? undefined : "1 1"}
          strokeDashoffset={p >= 1 ? undefined : 1 - p}
        />
      );
    });
    return (
      <g
        key={pi}
        mask={`url(#${pi === 2 ? shadeId : bodyId})`}
        stroke={color}
        strokeWidth={hair}
        strokeLinecap="butt"
        opacity={opacity}
      >
        {els}
      </g>
    );
  });

  return (
    <AbsoluteFill style={{ background: stage.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: isDark
            ? [
                `radial-gradient(60% 45% at ${18 + drift * 4}% ${20 + drift * 3}%, ${GRAIN[2]}47 0%, transparent 62%)`,
                `linear-gradient(150deg, ${GRAIN[3]}e6 0%, ${GRAIN[3]}66 38%, transparent 70%)`,
                `radial-gradient(50% 40% at 88% 96%, ${GRAIN[2]}2e 0%, transparent 70%)`,
              ].join(", ")
            : [
                `radial-gradient(60% 45% at ${18 + drift * 4}% ${20 + drift * 3}%, ${GRAIN[0]}8c 0%, transparent 60%)`,
                `linear-gradient(150deg, ${GRAIN[0]}66 0%, transparent 60%)`,
              ].join(", "),
        }}
      />
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={copperId}
            gradientUnits="userSpaceOnUse"
            x1={box.x}
            y1={box.y}
            x2={box.x + box.w}
            y2={box.y + box.h}
          >
            <stop offset={0} stopColor={isDark ? GRAIN[0] : GRAIN[1]} />
            <stop offset={0.45} stopColor={isDark ? GRAIN[1] : GRAIN[2]} />
            <stop offset={1} stopColor={isDark ? GRAIN[2] : GRAIN[3]} />
          </linearGradient>
          <mask
            id={bodyId}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <text {...textProps} fill="#fff">
              {value}
            </text>
          </mask>
          <mask
            id={shadeId}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <text {...textProps} fill="#fff">
              {value}
            </text>
            <text
              {...textProps}
              x={cx - shift}
              y={baseline - shift}
              fill="#000"
            >
              {value}
            </text>
          </mask>
          <filter
            id={rimId}
            x={0}
            y={0}
            width={W}
            height={H}
            filterUnits="userSpaceOnUse"
          >
            <feMorphology
              in="SourceAlpha"
              operator="erode"
              radius={hair * 0.9}
              result="inner"
            />
            <feComposite
              in="SourceAlpha"
              in2="inner"
              operator="out"
              result="rim"
            />
            <feFlood floodColor={stage.fg} />
            <feComposite in2="rim" operator="in" />
          </filter>
        </defs>
        <text {...textProps} fill={accent} opacity={ghost * stage.ghost}>
          {value}
        </text>
        {passes}
        <text
          {...textProps}
          fill="#000"
          filter={`url(#${rimId})`}
          opacity={outline}
        >
          {value}
        </text>
      </svg>
      {caption ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: baseline + gapBelow + (1 - capIn) * 10 * u,
            textAlign: "center",
            fontFamily: display,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: capSize * 1.2,
            letterSpacing: "-0.005em",
            lineHeight: 1.3,
            color: stage.muted,
            opacity: capIn,
          }}
        >
          {caption}
        </div>
      ) : null}
      <Grain opacity={stage.grain} />
    </AbsoluteFill>
  );
}
