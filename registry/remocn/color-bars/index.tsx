"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const display = sans;
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/* ------------------------------------------------------------------ */
/* Built-in placeholder shots: abstract compositions in one palette.   */
/* ------------------------------------------------------------------ */

type Tone = "dark" | "graphite" | "light" | "accent";
type Kind = "title" | "pane" | "chart" | "word";
interface SceneSpec {
  kind: Kind;
  tone: Tone;
}
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function toRgb(color: string): [number, number, number] {
  if (color.startsWith("rgb")) {
    const [r, g, b] = color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
    return [r, g, b];
  }
  const h = color.replace("#", "");
  const v =
    h.length === 3
      ? h
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : h.slice(0, 6);
  const n = Number.parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number) {
  const x = toRgb(a);
  const y = toRgb(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function palette(tone: Tone, accent: string) {
  if (tone === "light") {
    return {
      bg: "#F5F4F0",
      fg: "#121214",
      muted: "#6E6C67",
      hair: "rgba(18,18,20,0.10)",
      surface: "#FFFFFF",
      block: "#E6E3DC",
      light: "rgba(255,255,255,0.95)",
      shadow: "rgba(40,36,30,0.16)",
      dot: accent,
    };
  }
  if (tone === "accent") {
    return {
      bg: accent,
      fg: "#F7F7F5",
      muted: "rgba(247,247,245,0.7)",
      hair: "rgba(255,255,255,0.22)",
      surface: mix(accent, "#0A0A0B", 0.32),
      block: "rgba(255,255,255,0.16)",
      light: "rgba(255,255,255,0.2)",
      shadow: "rgba(0,0,0,0.35)",
      dot: "#0A0A0B",
    };
  }
  const graphite = tone === "graphite";
  return {
    bg: graphite ? "#17171A" : "#0A0A0B",
    fg: "#F3F2EF",
    muted: graphite ? "#97969C" : "#8B8A90",
    hair: "rgba(255,255,255,0.10)",
    surface: graphite ? "#1F1F23" : "#151517",
    block: graphite ? "#2B2B30" : "#232326",
    light: graphite ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.06)",
    shadow: "rgba(0,0,0,0.6)",
    dot: accent,
  };
}

type Colors = ReturnType<typeof palette>;
interface Ctx {
  W: number;
  H: number;
  u: number;
  c: Colors;
  accent: string;
  slot?: Rect;
}

const LIGHT_AT: Record<Kind, string> = {
  title: "18% 8%",
  pane: "50% -10%",
  chart: "8% 0%",
  word: "22% 0%",
};

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** The "R" mark alone (viewBox 124.06 × 134.26). Fill follows `color`. */
function RemocnR({ height, color }: { height: number; color: string }) {
  return (
    <svg
      viewBox="0 0 124.06 134.26"
      height={height}
      width={(height * 124.06) / 134.26}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden
    >
      <path fill={color} d={REMOCN_R_PATH} />
    </svg>
  );
}

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600, tracking-tight. */
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
        flexShrink: 0,
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

const abs = (r: Rect): React.CSSProperties => ({
  position: "absolute",
  left: r.x,
  top: r.y,
  width: r.w,
  height: r.h,
});

const displayType = (size: number): React.CSSProperties => ({
  fontFamily: display,
  fontWeight: 500,
  fontSize: size,
  letterSpacing: "-0.035em",
  lineHeight: 1,
  fontVariantNumeric: "tabular-nums",
});

function TitleBody({ x }: { x: Ctx }) {
  const { W, H, u, c, slot } = x;
  const left = slot ? 0.08 * W : 0;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 0,
        height: H,
        width: slot ? slot.x - left - 0.03 * W : W,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: slot ? "flex-start" : "center",
        gap: 18 * u,
      }}
    >
      <div style={{ fontSize: 22 * u, fontWeight: 400, color: c.muted }}>
        Introducing
      </div>
      <RemocnLogo fontSize={132 * u} color={c.fg} />
      <div
        style={{
          fontSize: 24 * u,
          color: c.muted,
          letterSpacing: "-0.01em",
          textAlign: slot ? "left" : "center",
        }}
      >
        Motion for the films you launch with.
      </div>
    </div>
  );
}

function PaneBody({ x }: { x: Ctx }) {
  const { W, H, u, c, accent, slot } = x;
  const pane = { x: 0.08 * W, y: 0.1 * H, w: 0.84 * W, h: 0.8 * H };
  const canvas = slot ?? { x: 0.335 * W, y: 0.2 * H, w: 0.36 * W, h: 0.36 * H };
  const side = 0.27 * W;
  const insp = 0.765 * W;
  const bar = 0.075 * H;
  const lightPane = c.surface === "#FFFFFF";
  const tint = mix(accent, c.surface, lightPane ? 0.9 : 0.82);
  const rows = [0.62, 0.48, 0.7, 0.42, 0.56, 0.5];
  const tracks = [
    [
      [0.3, 0.42],
      [0.43, 0.62],
    ],
    [[0.34, 0.56]],
    [
      [0.29, 0.38],
      [0.39, 0.52],
      [0.53, 0.74],
    ],
  ];
  return (
    <>
      <div
        style={{
          ...abs(pane),
          background: c.surface,
          borderRadius: 16 * u,
          boxShadow: `0 0 0 1px ${c.hair}, 0 ${30 * u}px ${70 * u}px ${c.shadow}`,
          overflow: "hidden",
        }}
      />
      <div
        style={{
          ...abs({ x: pane.x, y: pane.y + bar, w: pane.w, h: 1 }),
          background: c.hair,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: pane.x + 22 * u,
          top: pane.y,
          height: bar,
          display: "flex",
          alignItems: "center",
          gap: 9 * u,
        }}
      >
        <RemocnLogo fontSize={18 * u} color={c.fg} />
        <div style={{ fontSize: 15 * u, color: c.muted, marginLeft: 6 * u }}>
          / Launch film
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: W - pane.x - pane.w + 18 * u,
          top: pane.y + bar / 2 - 15 * u,
          height: 30 * u,
          padding: `0 ${14 * u}px`,
          borderRadius: 8 * u,
          background: accent,
          color: "#FFFFFF",
          fontSize: 14 * u,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
        }}
      >
        Render
      </div>
      <div
        style={{
          ...abs({ x: side, y: pane.y + bar, w: 1, h: pane.h - bar }),
          background: c.hair,
        }}
      />
      <div
        style={{
          ...abs({ x: insp, y: pane.y + bar, w: 1, h: pane.h - bar }),
          background: c.hair,
        }}
      />
      {rows.map((w, i) => {
        const y = pane.y + bar + 26 * u + i * 0.062 * H;
        const on = i === 1;
        return (
          <div key={w}>
            {on ? (
              <div
                style={{
                  ...abs({
                    x: pane.x + 12 * u,
                    y: y - 10 * u,
                    w: side - pane.x - 24 * u,
                    h: 34 * u,
                  }),
                  background: tint,
                  borderRadius: 8 * u,
                }}
              />
            ) : null}
            <div
              style={{
                ...abs({ x: pane.x + 24 * u, y, w: 14 * u, h: 14 * u }),
                borderRadius: 4 * u,
                background: on ? accent : c.block,
              }}
            />
            <div
              style={{
                ...abs({
                  x: pane.x + 48 * u,
                  y: y + 3 * u,
                  w: (side - pane.x - 80 * u) * w,
                  h: 8 * u,
                }),
                borderRadius: 4 * u,
                background: on ? mix(accent, c.surface, 0.55) : c.block,
              }}
            />
          </div>
        );
      })}
      {[0, 1, 2, 3, 4].map((i) => {
        const y = pane.y + bar + 28 * u + i * 0.075 * H;
        return (
          <div key={i}>
            <div
              style={{
                ...abs({ x: insp + 20 * u, y, w: 0.04 * W, h: 7 * u }),
                borderRadius: 4 * u,
                background: c.block,
              }}
            />
            <div
              style={{
                ...abs({
                  x: insp + 20 * u,
                  y: y + 16 * u,
                  w: 0.155 * W - 40 * u,
                  h: 22 * u,
                }),
                borderRadius: 6 * u,
                boxShadow: `inset 0 0 0 1px ${c.hair}`,
              }}
            />
          </div>
        );
      })}
      <div
        style={{
          ...abs({
            x: side,
            y: canvas.y + canvas.h + 0.07 * H,
            w: insp - side,
            h: 1,
          }),
          background: c.hair,
        }}
      />
      {tracks.map((clips, ti) =>
        clips.map(([a, b]) => (
          <div
            key={`${ti}-${a}`}
            style={{
              ...abs({
                x: a * W,
                y: canvas.y + canvas.h + 0.1 * H + ti * 0.058 * H,
                w: (b - a) * W - 4 * u,
                h: 0.042 * H,
              }),
              borderRadius: 6 * u,
              background: ti === 1 ? accent : c.block,
              opacity: ti === 1 ? 0.9 : 1,
            }}
          />
        )),
      )}
      <div
        style={{
          ...abs({
            x: 0.47 * W,
            y: canvas.y + canvas.h + 0.085 * H,
            w: 2 * u,
            h: 0.2 * H,
          }),
          background: c.fg,
          borderRadius: u,
        }}
      />
      {slot ? null : (
        <div
          style={{
            ...abs(canvas),
            borderRadius: 10 * u,
            background: lightPane ? "#0A0A0B" : "#F5F4F0",
            boxShadow: `inset 0 0 0 1px ${c.hair}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse 80% 90% at 30% 0%, ${lightPane ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)"}, transparent 70%)`,
            }}
          />
          <RemocnR height={58 * u} color={lightPane ? "#F3F2EF" : "#121214"} />
        </div>
      )}
    </>
  );
}

function ChartBody({ x }: { x: Ctx }) {
  const { W, H, u, c, accent } = x;
  const heights = [0.14, 0.19, 0.17, 0.26, 0.31, 0.38, 0.52];
  const base = 0.84 * H;
  const bw = 0.046 * W;
  const gap = 0.018 * W;
  const x0 = 0.92 * W - heights.length * (bw + gap) + gap;
  return (
    <>
      <div style={{ position: "absolute", left: 0.08 * W, top: 0.14 * H }}>
        <div style={{ fontSize: 20 * u, color: c.muted, fontWeight: 500 }}>
          Videos shipped per week
        </div>
        <div style={{ ...displayType(110 * u), marginTop: 22 * u }}>+212%</div>
      </div>
      <div
        style={{
          ...abs({ x: 0.08 * W, y: base, w: 0.84 * W, h: 1 }),
          background: c.hair,
        }}
      />
      {heights.map((h, i) => (
        <div
          key={h}
          style={{
            ...abs({
              x: x0 + i * (bw + gap),
              y: base - h * H,
              w: bw,
              h: h * H,
            }),
            borderRadius: `${8 * u}px ${8 * u}px ${2 * u}px ${2 * u}px`,
            background: i === heights.length - 1 ? accent : c.block,
          }}
        />
      ))}
    </>
  );
}

function WordBody({ x }: { x: Ctx }) {
  const { W, H, u, c } = x;
  return (
    <>
      <div
        style={{
          ...abs({ x: 0.08 * W, y: 0.2 * H, w: 0.84 * W, h: 1 }),
          background: c.hair,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0.08 * W,
          right: 0.08 * W,
          top: 0.2 * H - 40 * u,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 19 * u,
          color: c.muted,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span>02</span>
        <span>Chapter</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0.08 * W - 12 * u,
          bottom: 0.1 * H,
          ...displayType(250 * u),
          letterSpacing: "-0.055em",
        }}
      >
        Render<span style={{ color: c.dot }}>.</span>
      </div>
    </>
  );
}

const BODIES: Record<Kind, (p: { x: Ctx }) => React.ReactElement> = {
  title: TitleBody,
  pane: PaneBody,
  chart: ChartBody,
  word: WordBody,
};

/** One full-frame placeholder shot. `slot` reserves room for a window. */
function PlaceholderScene({
  kind,
  tone,
  accent,
  slot,
}: SceneSpec & { accent: string; slot?: Rect }) {
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = palette(tone, accent);
  const Body = BODIES[kind];
  return (
    <AbsoluteFill
      style={{
        background: c.bg,
        color: c.fg,
        fontFamily: sans,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 85% at ${LIGHT_AT[kind]}, ${c.light}, transparent 72%)`,
        }}
      />
      <Body x={{ W, H, u, c, accent, slot }} />
    </AbsoluteFill>
  );
}

function ImageScene({ src }: { src: string }) {
  return (
    <AbsoluteFill style={{ background: "#0A0A0B" }}>
      <Img
        src={src}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Color bars                                                          */
/* ------------------------------------------------------------------ */

export interface ColorBarsProps {
  /** `[outgoing, incoming]` shots. */
  scenes?: React.ReactNode[];
  /** `[outgoing, incoming]` screenshots, used when `scenes` is not passed. */
  images?: string[];
  /** Which way the bars travel. */
  direction?: "right" | "left" | "up" | "down";
  /** Slant of the bar edges in degrees; 0 is a straight wipe. */
  angle?: number;
  /** Number of bars, 4–6. */
  bars?: number;
  /** Override the derived bar colors, leading bar first. */
  colors?: string[];
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const HOLD = 14;
const SWEEP = 24;
const STAGGER = 3;
/** A whip: almost no motion, a violent middle, a hard brake. */
const EASE_WHIP = Easing.bezier(0.82, 0, 0.12, 1);
const EASE_SETTLE = Easing.bezier(0.22, 1, 0.36, 1);
/** Extra lean of an edge at full speed, in degrees. */
const LEAN = 6;

const DARK_PAIR: SceneSpec[] = [
  { kind: "title", tone: "dark" },
  { kind: "pane", tone: "light" },
];
const LIGHT_PAIR: SceneSpec[] = [
  { kind: "chart", tone: "light" },
  { kind: "word", tone: "graphite" },
];

/**
 * Bar colours from the gradients.sh "fluted" palette (bg #050507, [#1d2a8f,
 * #2f7bff, #ff7a3d, #ffe2c4]); the accent stands in for its blue.
 */
function barColors(n: number, accent: string, theme: "dark" | "light") {
  const ramp =
    n >= 6
      ? ["#FFF1E4", "#ffe2c4", "#ff7a3d", accent, "#1d2a8f", "#050507"]
      : n === 5
        ? ["#ffe2c4", "#ff7a3d", accent, "#1d2a8f", "#050507"]
        : ["#ffe2c4", "#ff7a3d", accent, "#050507"];
  // Lead with the color that contrasts the outgoing shot, end on the one
  // that contrasts the incoming shot.
  return theme === "light" ? ramp.reverse() : ramp;
}

/** Each bar is a flute: lit at one end, deepening along its length. */
function fluteFill(c: string, alongEdge: number) {
  return `linear-gradient(${alongEdge.toFixed(1)}deg, ${mix(c, "#FFFFFF", 0.14)} 0%, ${c} 45%, ${mix(c, "#050507", 0.16)} 100%)`;
}

export function ColorBars({
  scenes,
  images,
  direction = "right",
  angle = 16,
  bars = 5,
  colors,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: ColorBarsProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const n = Math.round(Math.min(6, Math.max(4, colors?.length ?? bars)));
  const fills = colors?.length ? colors : barColors(n, accent, theme);
  const pair = theme === "light" ? LIGHT_PAIR : DARK_PAIR;

  // Work in a canonical frame where bars always travel +x.
  const horizontal = direction === "right" || direction === "left";
  const Wc = horizontal ? W : H;
  const Hc = horizontal ? H : W;
  const toScreen = (x: number, y: number): [number, number] => {
    if (direction === "left") return [W - x, y];
    if (direction === "down") return [y, x];
    if (direction === "up") return [y, H - x];
    return [x, y];
  };
  const dir = toScreen(1, 0);
  const origin = toScreen(0, 0);
  const ux = dir[0] - origin[0];
  const uy = dir[1] - origin[1];

  const rad = (angle * Math.PI) / 180;
  const maxLean = (LEAN * Math.PI) / 180;
  const slant = Math.abs(Math.tan(rad) + Math.sign(angle || 1) * maxLean) * Hc;
  const from = -slant / 2 - 6 * u;
  const to = Wc + slant / 2 + 6 * u;
  const avgSpeed = (to - from) / SWEEP;

  const progress = (i: number, f: number) =>
    EASE_WHIP(
      interpolate(
        f,
        [HOLD + i * STAGGER, HOLD + i * STAGGER + SWEEP],
        [0, 1],
        CLAMP,
      ),
    );
  const edge = (i: number) => {
    const e = from + (to - from) * progress(i, frame);
    // Speed-stretch: the edge leans into the move while it is fast.
    const v =
      ((progress(i, frame + 0.5) - progress(i, frame - 0.5)) * (to - from)) /
      (avgSpeed * 3.2);
    const lean = Math.min(1, v) * maxLean * Math.sign(angle || 1);
    return { e, tan: Math.tan(rad + lean) };
  };
  const region = ({ e, tan }: { e: number; tan: number }) => {
    const m = 40 * u;
    const ex = (y: number) => e + (y - Hc / 2) * tan;
    const left = -(slant + 3 * m);
    const pts: [number, number][] = [
      [left, -m],
      [ex(-m), -m],
      [ex(Hc + m), Hc + m],
      [left, Hc + m],
    ];
    return `polygon(${pts
      .map(([x, y]) => toScreen(x, y))
      .map(([x, y]) => `${x.toFixed(2)}px ${y.toFixed(2)}px`)
      .join(", ")})`;
  };

  const edges = Array.from({ length: n + 1 }, (_, i) => edge(i));
  // CSS gradient angle running down the bar edges (0deg points up, clockwise).
  const [ex0, ey0] = toScreen(0, 0);
  const [ex1, ey1] = toScreen(Math.tan(rad), 1);
  const alongEdge = (Math.atan2(ex1 - ex0, -(ey1 - ey0)) * 180) / Math.PI;
  const started = (i: number) => edges[i].e > from + 0.5;
  const buried = (i: number) => i < n && edges[i + 1].e >= to - 0.5;

  // The outgoing shot gets shoved along; the incoming one arrives late and settles.
  const shove = 0.05 * Wc * progress(0, frame);
  const settle = EASE_SETTLE(
    interpolate(
      frame,
      [HOLD + n * STAGGER + SWEEP * 0.35, HOLD + n * STAGGER + SWEEP + 16],
      [0, 1],
      CLAMP,
    ),
  );
  const drift = -0.07 * Wc * (1 - settle);
  const shadow = (on: boolean) =>
    on
      ? `drop-shadow(${ux * 10 * u}px ${uy * 10 * u}px ${22 * u}px rgba(0,0,0,0.28))`
      : undefined;

  const shot = (j: number) => {
    if (scenes) return <AbsoluteFill>{scenes[j]}</AbsoluteFill>;
    if (images) return <ImageScene src={images[j]} />;
    return <PlaceholderScene {...pair[j]} accent={accent} />;
  };

  return (
    <AbsoluteFill style={{ background: "#0A0A0B", overflow: "hidden" }}>
      {edges[n].e >= to - 0.5 ? null : (
        <AbsoluteFill
          style={{ transform: `translate(${ux * shove}px, ${uy * shove}px)` }}
        >
          {shot(0)}
        </AbsoluteFill>
      )}
      {fills.slice(0, n).map((fill, i) =>
        !started(i) || buried(i) ? null : (
          <AbsoluteFill key={`${fill}-${i}`} style={{ filter: shadow(true) }}>
            <AbsoluteFill
              style={{
                clipPath: region(edges[i]),
                background: fluteFill(fill, alongEdge),
              }}
            />
          </AbsoluteFill>
        ),
      )}
      {started(n) ? (
        <AbsoluteFill style={{ filter: shadow(edges[n].e < to - 0.5) }}>
          <AbsoluteFill style={{ clipPath: region(edges[n]) }}>
            <AbsoluteFill
              style={{
                transform: `translate(${ux * drift}px, ${uy * drift}px) scale(${1 + 0.03 * (1 - settle)})`,
              }}
            >
              {shot(1)}
            </AbsoluteFill>
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
      <Grain opacity={theme === "light" ? 0.04 : 0.055} />
    </AbsoluteFill>
  );
}
