"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/SpaceGrotesk";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface TileWaveProps {
  /** Outgoing scene: a short headline string or any React node. */
  from?: React.ReactNode;
  /** Incoming scene, set on a "beam" gradient panel. */
  to?: React.ReactNode;
  /** Tile rows; columns follow the aspect ratio. */
  rows?: number;
  /** Frames the outgoing scene holds before the wave. */
  delay?: number;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  /** Stage seen between the tiles; the outgoing scene takes the other tone. */
  theme?: "dark" | "light";
}

const STAGE = { dark: "#0A0A0B", light: "#F5F4F0" } as const;
const INK = { dark: "#F3F2EF", light: "#121214" } as const;

const SPREAD = 26;
const TILE = 22;
const SHRINK_END = 0.46;
const GROW_START = 0.54;

const EASE_SHRINK = Easing.bezier(0.4, 0, 0.7, 0.5);
const EASE_GROW = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const tileWaveLength = (delay = 16) => delay + SPREAD + TILE + 30;

/* gradients.sh "beam" palette: deep indigo into the remocn blue, a cold
   highlight rising from the lower right. Drifts a few percent per shot. */
const BEAM = ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"] as const;

const mixA = (c: string, a: number) =>
  `color-mix(in oklab, ${c} ${Math.round(a * 100)}%, transparent)`;

function beamGround(d: number) {
  const [c0, c1, c2, c3] = BEAM;
  const s = Math.sin(d * Math.PI) * 4;
  return [
    `radial-gradient(70% 90% at ${(86 - s).toFixed(2)}% ${(108 - s).toFixed(2)}%, ${mixA(c0, 0.55)} 0%, ${mixA(c1, 0.45)} 30%, transparent 68%)`,
    `radial-gradient(60% 70% at ${(8 + s).toFixed(2)}% 0%, ${mixA(c3, 0.9)} 0%, transparent 72%)`,
    `linear-gradient(${(158 + s).toFixed(2)}deg, ${c3} 0%, ${c2} 52%, ${c2} 70%, ${c1} 100%)`,
  ].join(", ");
}

function Headline({
  text,
  bg,
  fg,
  dotColor,
}: {
  text: string;
  bg: string;
  fg: string;
  dotColor: string;
}) {
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const dot = text.endsWith(".");
  const body = dot ? text.slice(0, -1) : text;
  const size = Math.min(
    196 * u,
    (0.74 * W) / (Math.max(4, text.length) * 0.56),
  );
  return (
    <AbsoluteFill
      style={{
        background: bg,
        color: fg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: display,
          fontWeight: 500,
          fontSize: size,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          whiteSpace: "nowrap",
          paddingBottom: size * 0.08,
          paddingRight: size * 0.04,
        }}
      >
        {body}
        {dot ? <span style={{ color: dotColor }}>.</span> : null}
      </div>
    </AbsoluteFill>
  );
}

function Scene({
  content,
  bg,
  fg,
  dotColor,
}: {
  content: React.ReactNode;
  bg: string;
  fg: string;
  dotColor: string;
}) {
  if (typeof content === "string" || typeof content === "number") {
    return (
      <Headline text={String(content)} bg={bg} fg={fg} dotColor={dotColor} />
    );
  }
  return <AbsoluteFill style={{ background: bg }}>{content}</AbsoluteFill>;
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

export function TileWave({
  from = "Idea.",
  to = "Shipped.",
  rows = 8,
  delay = 16,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: TileWaveProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const stage = STAGE[theme];
  const aTone = theme === "dark" ? "light" : "dark";
  const aBg = STAGE[aTone];
  const aFg = INK[aTone];
  const bFg = "#FFFFFF";

  const nRows = Math.max(3, Math.round(rows));
  const nCols = Math.max(3, Math.round((W / H) * nRows));
  const cw = W / nCols;
  const ch = H / nRows;
  const minScale = (7 * u) / Math.min(cw, ch);
  const bleed = 0.6;

  const sceneA = <Scene content={from} bg={aBg} fg={aFg} dotColor={accent} />;
  const bGround = beamGround(Math.min(1, t / tileWaveLength(delay)));
  const sceneB = <Scene content={to} bg={bGround} fg={bFg} dotColor={bFg} />;
  const before = t <= delay;
  const after = t >= delay + SPREAD + TILE;

  const tiles: React.ReactNode[] = [];
  const tileB = BEAM[2];
  const restA: string[] = [];
  const restB: string[] = [];
  const cell = (x: number, y: number) => {
    const e = bleed;
    return `M${(x - e).toFixed(2)} ${(y - e).toFixed(2)}h${(cw + 2 * e).toFixed(2)}v${(ch + 2 * e).toFixed(2)}h${(-cw - 2 * e).toFixed(2)}Z`;
  };
  for (let r = 0; r < (before || after ? 0 : nRows); r++) {
    for (let c = 0; c < nCols; c++) {
      const x = c * cw;
      const y = r * ch;
      const diag = (c / (nCols - 1) + r / (nRows - 1)) / 2;
      const start = delay + diag * SPREAD;
      const p = interpolate(t, [start, start + TILE], [0, 1], CLAMP);
      const isB = p >= (SHRINK_END + GROW_START) / 2;
      let s: number;
      if (p <= SHRINK_END) {
        s = 1 - (1 - minScale) * EASE_SHRINK(p / SHRINK_END);
      } else if (p < GROW_START) {
        s = minScale;
      } else {
        s =
          minScale +
          (1 - minScale) * EASE_GROW((p - GROW_START) / (1 - GROW_START));
      }
      s = Math.min(1, s * 1.03);
      if (s >= 1) {
        (isB ? restB : restA).push(cell(x, y));
        continue;
      }
      const tw = cw * s;
      const th = ch * s;
      const round = Math.min(1, (1 - s) / (1 - minScale)) ** 1.6;
      const radius = Math.min(tw, th) * 0.5 * round;
      if (s <= 0.14) {
        tiles.push(
          <div
            key={`${r}-${c}`}
            style={{
              position: "absolute",
              left: x + (cw - tw) / 2,
              top: y + (ch - th) / 2,
              width: tw,
              height: th,
              borderRadius: radius,
              background: isB ? tileB : aBg,
            }}
          />,
        );
        continue;
      }
      const ins = [y, W - x - cw, H - y - ch, x]
        .map((v) => `${v.toFixed(2)}px`)
        .join(" ");
      tiles.push(
        <div
          key={`${r}-${c}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: W,
            height: H,
            transform: `scale(${s})`,
            transformOrigin: `${x + cw / 2}px ${y + ch / 2}px`,
            clipPath: `inset(${ins} round ${(radius / s).toFixed(2)}px)`,
          }}
        >
          {isB ? sceneB : sceneA}
        </div>,
      );
    }
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {before ? sceneA : null}
      {after ? sceneB : null}
      {restA.length ? (
        <AbsoluteFill style={{ clipPath: `path("${restA.join("")}")` }}>
          {sceneA}
        </AbsoluteFill>
      ) : null}
      {restB.length ? (
        <AbsoluteFill style={{ clipPath: `path("${restB.join("")}")` }}>
          {sceneB}
        </AbsoluteFill>
      ) : null}
      {tiles}
      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
}
