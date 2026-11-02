"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
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

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface BracketFocusProps {
  subject?: string;
  tag?: string;
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

const FLY_AT = 10;
const FLY_LEN = 22;
const SNAP_AT = FLY_AT + FLY_LEN;
const TAG_AT = SNAP_AT + 6;
const DIM_AT = SNAP_AT + 8;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    rest: "#6E6D73",
    dot: "rgba(255,255,255,0.2)",
    tick: "rgba(255,255,255,0.4)",
    readout: "rgba(243,242,239,0.5)",
    // gradients.sh "beam": #f4f7ff → #8fb4ff → #3d5bff
    hero: ["#F4F7FF", "#C4D5FF", "#8FB4FF", "#5C78FF"],
    grain: 0.055,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    rest: "#A3A19B",
    dot: "rgba(18,18,20,0.2)",
    tick: "rgba(18,18,20,0.4)",
    readout: "rgba(18,18,20,0.5)",
    // gradients.sh "beam", deep end first so it reads on off-white
    hero: ["#1A1660", "#2B32B8", "#3D5BFF", "#6F8FFF"],
    grain: 0.04,
  },
} as const;

const CORNERS = [
  { sx: -1, sy: -1, delay: 0 },
  { sx: 1, sy: -1, delay: 2 },
  { sx: 1, sy: 1, delay: 3 },
  { sx: -1, sy: 1, delay: 5 },
] as const;

function widthEm(text: string) {
  let w = 0;
  for (const ch of text) {
    if (ch === " ") w += 0.26;
    else if (".,:;'!|".includes(ch)) w += 0.27;
    else if (ch >= "0" && ch <= "9") w += 0.6;
    else if ("ijlI".includes(ch)) w += 0.25;
    else if ("ftr".includes(ch)) w += 0.36;
    else if ("mwMW%".includes(ch)) w += 0.84;
    else if (ch >= "A" && ch <= "Z") w += 0.66;
    else w += 0.54;
    w -= 0.035;
  }
  return Math.max(w, 0.6);
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
          seed={17}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function bracketPath(x: number, y: number, sx: number, sy: number, L: number) {
  return `M ${x} ${y - sy * L} L ${x} ${y} L ${x - sx * L} ${y}`;
}

export function BracketFocus({
  subject = "1.8s",
  tag = "Render time",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: BracketFocusProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const p = THEMES[theme];
  const maskId = `m${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const cx = W / 2;
  const cy = H / 2;
  const size = Math.min(272 * u, (0.6 * W) / widthEm(subject));
  const textW = widthEm(subject) * size;
  const capH = 0.74 * size;
  const pad = 46 * u;
  const tight = { hw: textW / 2 + pad * 1.05, hh: capH / 2 + pad * 0.9 };
  const loose = { hw: tight.hw + 46 * u, hh: tight.hh + 36 * u };
  const margin = 0.07 * W;
  const far = { hw: W / 2 - margin, hh: H / 2 - margin };

  const arm = 46 * u;
  const stroke = 3 * u;

  const corner = (sx: number, sy: number, delay: number, at: number) => {
    const fly = EASE_IO(
      interpolate(at, [FLY_AT + delay, SNAP_AT + delay], [0, 1], CLAMP),
    );
    const snap = spring({
      frame: at - SNAP_AT - delay,
      fps,
      config: { damping: 13, stiffness: 320, mass: 0.55 },
    });
    const hw =
      far.hw + (loose.hw - far.hw) * fly + (tight.hw - loose.hw) * snap;
    const hh =
      far.hh + (loose.hh - far.hh) * fly + (tight.hh - loose.hh) * snap;
    return { x: cx + sx * hw, y: cy + sy * hh };
  };

  const appear = interpolate(t, [0, 8], [0.35, 1], CLAMP);
  const dim = EASE_IO(interpolate(t, [DIM_AT, DIM_AT + 22], [0, 1], CLAMP));
  const tagIn = EASE_OUT(interpolate(t, [TAG_AT, TAG_AT + 14], [0, 1], CLAMP));
  const tagText = EASE_OUT(
    interpolate(t, [TAG_AT + 4, TAG_AT + 16], [0, 1], CLAMP),
  );
  const subjectIn = EASE_OUT(interpolate(t, [0, 16], [0.25, 1], CLAMP));
  const lift = EASE_OUT(
    interpolate(t, [DIM_AT - 2, DIM_AT + 18], [0, 1], CLAMP),
  );
  const push = EASE_IO(interpolate(t, [0, DIM_AT + 50], [0, 1], CLAMP));

  const tl = corner(-1, -1, 0, t);
  const tagH = 32 * u;
  const tagFont = 14 * u;
  const tagW = tag.length * 0.6 * tagFont * 1.06 + 26 * u;
  const br = corner(1, 1, 3, t);
  const readIn = EASE_OUT(
    interpolate(t, [TAG_AT + 8, TAG_AT + 22], [0, 1], CLAMP),
  );
  const boxW = Math.round((tight.hw * 2) / u);
  const boxH = Math.round((tight.hh * 2) / u);
  const drift = interpolate(t, [0, 150], [0, 1], CLAMP);
  const heroGradient = `linear-gradient(${112 + 10 * drift}deg, ${p.hero[0]} ${-8 + 10 * drift}%, ${p.hero[1]} ${30 + 6 * drift}%, ${p.hero[2]} ${62 + 4 * drift}%, ${p.hero[3]} 104%)`;

  const gap = 32 * u;
  const cols = Math.floor((W - 2 * margin) / gap);
  const rows = Math.floor((H - 2 * margin) / gap);
  const ox = (W - cols * gap) / 2;
  const oy = (H - rows * gap) / 2;
  const dots: React.ReactNode[] = [];
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const x = ox + c * gap;
      const y = oy + r * gap;
      const d = Math.hypot((x - cx) / W, (y - cy) / H);
      const wave = interpolate(t, [d * 18, d * 18 + 10], [0, 1], CLAMP);
      dots.push(
        <circle
          key={`${r}-${c}`}
          cx={x}
          cy={y}
          r={1.4 * u}
          fill={p.dot}
          opacity={wave}
        />,
      );
    }
  }

  const ticks: React.ReactNode[] = [];
  const tickN = 24;
  for (let i = 0; i <= tickN; i++) {
    const x = margin + ((W - 2 * margin) * i) / tickN;
    const long = i % 6 === 0;
    const len = (long ? 12 : 6) * u;
    for (const yEdge of [margin - 22 * u, H - margin + 22 * u]) {
      const dir = yEdge < cy ? 1 : -1;
      ticks.push(
        <line
          key={`${i}-${yEdge}`}
          x1={x}
          x2={x}
          y1={yEdge}
          y2={yEdge + dir * len}
          stroke={p.tick}
          strokeWidth={Math.max(1, u)}
        />,
      );
    }
  }

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          opacity: appear * (1 - 0.6 * dim),
          transform: `scale(${1.02 - 0.02 * push})`,
        }}
      >
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <mask id={maskId}>
              <rect width={W} height={H} fill="white" />
              <rect
                x={cx - loose.hw}
                y={cy - loose.hh}
                width={loose.hw * 2}
                height={loose.hh * 2}
                fill="black"
              />
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>{dots}</g>
          {ticks}
        </svg>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            fontFamily: display,
            fontWeight: 500,
            fontSize: size,
            lineHeight: 1,
            letterSpacing: "-0.035em",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
            opacity: subjectIn,
            transform: `translate(${-0.02 * size}px, ${(1 - subjectIn) * 10 * u}px) scale(${0.985 + 0.015 * lift + 0.012 * push})`,
          }}
        >
          <span style={{ color: p.rest, opacity: 1 - lift }}>{subject}</span>
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              backgroundImage: heroGradient,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              opacity: lift,
            }}
          >
            {subject}
          </span>
        </div>
      </AbsoluteFill>

      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0, opacity: appear }}
      >
        {CORNERS.map(({ sx, sy, delay }) =>
          [2.4, 1.2, 0].map((lag) => {
            const c = corner(sx, sy, delay, t - lag);
            const now = corner(sx, sy, delay, t);
            const moved = Math.hypot(c.x - now.x, c.y - now.y);
            const o = lag === 0 ? 1 : lag > 2 ? 0.12 : 0.26;
            if (lag > 0 && moved < 2 * u) return null;
            return (
              <path
                key={`${sx}${sy}${lag}`}
                d={bracketPath(c.x, c.y, sx, sy, arm)}
                fill="none"
                stroke={accent}
                strokeWidth={stroke}
                strokeLinecap="square"
                opacity={o}
              />
            );
          }),
        )}
      </svg>

      <div
        style={{
          position: "absolute",
          left: tl.x - stroke / 2,
          top: tl.y - stroke / 2 - tagH,
          height: tagH,
          width: tagW,
          background: accent,
          borderRadius: `${4 * u}px ${4 * u}px ${4 * u}px 0`,
          clipPath: `inset(${(1 - tagIn) * 100}% ${(1 - tagIn) * 100}% 0 0)`,
          display: "flex",
          alignItems: "center",
          paddingLeft: 12 * u,
          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            fontFamily: mono,
            fontWeight: 500,
            fontSize: tagFont,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#FFFFFF",
            whiteSpace: "nowrap",
            opacity: tagText,
            transform: `translateX(${(1 - tagText) * -6 * u}px)`,
          }}
        >
          {tag}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          right: W - br.x - stroke / 2,
          top: br.y + 14 * u,
          fontFamily: mono,
          fontWeight: 400,
          fontSize: 13 * u,
          letterSpacing: "0.04em",
          fontVariantNumeric: "tabular-nums",
          color: p.readout,
          whiteSpace: "pre",
          opacity: readIn,
          transform: `translateY(${(1 - readIn) * 6 * u}px)`,
        }}
      >
        {`W ${boxW}  ×  H ${boxH}`}
      </div>

      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
