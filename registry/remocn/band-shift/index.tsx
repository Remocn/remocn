"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/BricolageGrotesque";
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

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em, on the baseline) + "emocn" in Manrope 600. */
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

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Tone = "dark" | "light";

const TONES: Record<Tone, { bg: string; fg: string }> = {
  dark: { bg: "#0A0A0B", fg: "#F3F2EF" },
  light: { bg: "#F5F4F0", fg: "#121214" },
};

/* gradients.sh "mesh" palette. The colour blocks are windows onto one
   frame-anchored mesh field; the landed scene sits on a quieter version. */
const MESH = {
  bg: "#0a0d24",
  colors: ["#ecdcf2", "#8796ee", "#2e45b7", "#0e1645"],
  at: [
    [16, 20],
    [84, 26],
    [72, 86],
    [22, 80],
    [52, 48],
    [92, 62],
  ],
};

const mixA = (c: string, a: number) =>
  `color-mix(in oklab, ${c} ${Math.round(a * 100)}%, transparent)`;

/** Bright mesh, used inside the blocks: lilac and periwinkle blobs over the
    mesh blue, so every block reads as a lit colour. `d` drifts the blobs. */
function meshField(d: number) {
  const [c0, c1, c2, c3] = MESH.colors;
  const cols = [c0, c1, c3, c1, c0, c2];
  const alpha = [0.95, 0.9, 0.7, 0.8, 0.55, 0.9];
  const layers = MESH.at.map(([x, y], i) => {
    const dx = Math.sin(d * Math.PI * 2 + i * 1.7) * 3;
    const dy = Math.cos(d * Math.PI * 2 + i * 2.3) * 3;
    return `radial-gradient(55% 65% at ${(x + dx).toFixed(2)}% ${(y + dy).toFixed(2)}%, ${mixA(cols[i], alpha[i])} 0%, transparent 70%)`;
  });
  return `${layers.join(", ")}, linear-gradient(${c2}, ${c2})`;
}

/** Quiet mesh ground for the landed scene: dark centre, colour at the edges. */
function meshGround(tone: Tone, d: number) {
  const [c0, c1, c2] = MESH.colors;
  const s = Math.sin(d * Math.PI * 2) * 3;
  if (tone === "light") {
    return [
      `radial-gradient(60% 70% at ${(10 + s).toFixed(2)}% ${(12 - s).toFixed(2)}%, ${mixA(c1, 0.3)} 0%, transparent 70%)`,
      `radial-gradient(60% 70% at ${(90 - s).toFixed(2)}% ${(90 + s).toFixed(2)}%, ${mixA(c0, 1)} 0%, transparent 72%)`,
    ].join(", ");
  }
  return [
    `radial-gradient(60% 70% at ${(8 + s).toFixed(2)}% ${(6 - s).toFixed(2)}%, ${mixA(c2, 0.6)} 0%, transparent 70%)`,
    `radial-gradient(75% 85% at ${(92 - s).toFixed(2)}% ${(92 + s).toFixed(2)}%, ${mixA(c2, 1)} 0%, transparent 70%)`,
  ].join(", ");
}

const isLogo = (s: string) => /^remocn\.?$/i.test(s.trim());

function Headline({
  text,
  tone,
  accent,
  mark,
}: {
  text: string;
  tone: Tone;
  accent: string;
  mark: boolean;
}) {
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = TONES[tone];
  const logo = mark && isLogo(text);
  const dot = mark && !logo && text.endsWith(".");
  const body = dot ? text.slice(0, -1) : text;
  const size = Math.min(220 * u, (0.78 * W) / (Math.max(4, text.length) * 0.5));
  return (
    <AbsoluteFill
      style={{
        color: c.fg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {logo ? (
        <RemocnLogo
          fontSize={Math.min(168 * u, (0.56 * W) / 3.9)}
          color={c.fg}
        />
      ) : (
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
          {dot ? <span style={{ color: accent }}>.</span> : null}
        </div>
      )}
    </AbsoluteFill>
  );
}

function Scene({
  content,
  tone,
  accent,
  mark,
  ground,
}: {
  content: React.ReactNode;
  tone: Tone;
  accent: string;
  mark: boolean;
  ground?: string;
}) {
  const text = typeof content === "string" || typeof content === "number";
  return (
    <AbsoluteFill
      style={{ backgroundColor: TONES[tone].bg, backgroundImage: ground }}
    >
      {text ? (
        <Headline
          text={String(content)}
          tone={tone}
          accent={accent}
          mark={mark}
        />
      ) : (
        content
      )}
    </AbsoluteFill>
  );
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
          seed={11}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export interface BandShiftProps {
  /** Outgoing scene: a short headline string or any React node. */
  from?: React.ReactNode;
  /** Incoming scene. `"remocn"` sets the remocn.dev logo. */
  to?: React.ReactNode;
  /** Number of horizontal bands, 5–7. */
  bands?: number;
  /** Override the colour blocks riding between the scenes (default: a mesh gradient field). */
  colors?: string[];
  /** Frames the outgoing scene holds before the shift. */
  delay?: number;
  /** Frames between neighbouring bands. */
  stagger?: number;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  /** `dark` lands on a dark scene, `light` on a light one. */
  theme?: Tone;
}

const TRAVEL = 22;
const EASE_SHIFT = Easing.bezier(0.78, 0, 0.18, 1.045);
const BLOCKS = [0.2, 0.3, 0.16, 0.26, 0.34, 0.18, 0.24];
const STAGE = "#0A0A0B";

export function BandShift({
  from = "Before.",
  to = "remocn",
  bands = 6,
  colors,
  delay = 18,
  stagger = 3,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: BandShiftProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const n = Math.round(Math.min(7, Math.max(5, bands)));
  const toneB: Tone = theme;
  const toneA: Tone = theme === "dark" ? "light" : "dark";
  const fills = colors?.length ? colors : null;
  const drift = Math.min(1, t / 150);
  const field = meshField(drift * 0.18);
  const ground = meshGround(toneB, drift * 0.12);
  const bandH = H / n;
  const lastEnd = delay + (n - 1) * stagger + TRAVEL;

  return (
    <AbsoluteFill style={{ background: STAGE, overflow: "hidden" }}>
      {Array.from({ length: n }, (_, i) => {
        const start = delay + i * stagger;
        const p = interpolate(t, [start, start + TRAVEL], [0, 1], CLAMP);
        const e = EASE_SHIFT(p);
        const d = i % 2 === 0 ? 1 : -1;
        const S = BLOCKS[i % BLOCKS.length] * W;
        const offset = d * e * (W + S);
        const xA = offset;
        const xS = d > 0 ? offset - S : offset + W;
        const xB = d > 0 ? offset - S - W : offset + W + S;
        const moving = t > start && t < lastEnd;
        const gap = moving
          ? 3 * u * Math.sin(Math.PI * Math.min(1, p * 1.15))
          : 0;
        const top = i * bandH;
        const y0 = top + (i > 0 ? gap / 2 : 0);
        const y1 = top + bandH - (i < n - 1 ? gap / 2 : 0);
        const idle = p <= 0;
        const landed = p >= 1;
        const fill = fills ? fills[i % fills.length] : null;
        const inView = (x: number, w: number) => x < W && x + w > 0;
        return (
          <div
            key={`band-${top}`}
            style={{
              position: "absolute",
              left: 0,
              top: y0,
              width: W,
              height: y1 - y0,
              overflow: "hidden",
              background: landed || !idle ? TONES[toneB].bg : TONES[toneA].bg,
            }}
          >
            {landed || !inView(xA, W) ? null : (
              <div
                style={{
                  position: "absolute",
                  left: xA,
                  top: -y0,
                  width: W,
                  height: H,
                }}
              >
                <Scene
                  content={from}
                  tone={toneA}
                  accent={accent}
                  mark={false}
                />
              </div>
            )}
            {idle || landed || !inView(xS, S) ? null : (
              <div
                style={{
                  position: "absolute",
                  left: xS,
                  top: 0,
                  width: S,
                  height: "100%",
                  ...(fill
                    ? { background: fill }
                    : {
                        backgroundImage: field,
                        backgroundSize: `${W}px ${H}px`,
                        backgroundPosition: `${(-xS).toFixed(2)}px ${(-y0).toFixed(2)}px`,
                      }),
                }}
              />
            )}
            {idle || !inView(xB, W) ? null : (
              <div
                style={{
                  position: "absolute",
                  left: landed ? 0 : xB,
                  top: -y0,
                  width: W,
                  height: H,
                }}
              >
                <Scene
                  content={to}
                  tone={toneB}
                  accent={accent}
                  mark
                  ground={ground}
                />
              </div>
            )}
          </div>
        );
      })}
      <Grain opacity={theme === "light" ? 0.035 : 0.05} />
    </AbsoluteFill>
  );
}
