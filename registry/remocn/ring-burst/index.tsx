"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/Fraunces";
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

const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
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

const isLogo = (s: string) => /^remocn\.?$/i.test(s.trim());

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Tone = "dark" | "light";

const TONES: Record<Tone, { bg: string; fg: string }> = {
  dark: { bg: "#0A0A0B", fg: "#F3F2EF" },
  light: { bg: "#F5F4F0", fg: "#121214" },
};

/* gradients.sh "halo" palette: a thick soft ring around the landed logo. */
const HALO = {
  dark: ["#fff4ec", "#ffb36b", "#e2457a", "#3d4dff"],
  light: ["#ff9a4d", "#e2457a", "#3d4dff", "#3d4dff"],
} as const;

const mixA = (c: string, a: number) =>
  `color-mix(in oklab, ${c} ${Math.round(a * 100)}%, transparent)`;

function haloGround(tone: Tone, r: number) {
  const [c0, c1, c2, c3] = HALO[tone];
  if (tone === "light") {
    return `radial-gradient(circle ${r.toFixed(1)}px at 50% 50%, transparent 0%, transparent 75.5%, ${mixA(c0, 0.92)} 77%, ${mixA(c1, 0.6)} 82%, ${mixA(c2, 0.22)} 90%, transparent 100%)`;
  }
  return `radial-gradient(circle ${r.toFixed(1)}px at 50% 50%, transparent 0%, transparent 74%, ${mixA(c0, 0.85)} 76.5%, ${mixA(c1, 0.62)} 81%, ${mixA(c2, 0.36)} 88%, ${mixA(c3, 0.16)} 94%, transparent 100%)`;
}

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
  const size = Math.min(
    196 * u,
    (0.72 * W) / (Math.max(4, text.length) * 0.48),
  );
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
          fontSize={Math.min(116 * u, (0.36 * W) / 3.9)}
          color={c.fg}
        />
      ) : (
        <div
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: size,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            whiteSpace: "nowrap",
            paddingBottom: size * 0.1,
            paddingRight: size * 0.06,
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
      style={{
        backgroundColor: TONES[tone].bg,
        backgroundImage: ground,
      }}
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

export interface RingBurstProps {
  /** Outgoing scene: a short headline string or any React node. */
  from?: React.ReactNode;
  /** Incoming scene, carried in by the last ring. `"remocn"` sets the remocn.dev logo. */
  to?: React.ReactNode;
  /** Burst point as fractions of the frame, `[x, y]`. */
  origin?: [number, number];
  /** Ring colours, outermost first (2–3). Derived from `accent` and `theme` by default. */
  colors?: string[];
  /** Frames the outgoing scene holds before the burst. */
  delay?: number;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  /** `dark` lands on a dark scene, `light` on a light one. */
  theme?: Tone;
}

const GROW = 32;
const GAPS = [0, 4, 8, 13];
const EASE_BURST = Easing.bezier(0.25, 0.45, 0.12, 1);
const EASE_PUSH = Easing.bezier(0.45, 0, 0.55, 1);
const EASE_LAND = Easing.bezier(0.22, 1, 0.36, 1);

function ringColors(theme: Tone, accent: string) {
  return theme === "dark"
    ? [accent, "#141416", "#E2DFD8"]
    : [accent, "#E2DFD8", "#141416"];
}

export function RingBurst({
  from = "Before.",
  to = "remocn",
  origin = [0.5, 0.5],
  colors,
  delay = 20,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: RingBurstProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const toneB: Tone = theme;
  const toneA: Tone = theme === "dark" ? "light" : "dark";
  const fills = (colors?.length ? colors : ringColors(theme, accent)).slice(
    0,
    3,
  );
  const gaps = [...GAPS.slice(0, fills.length), GAPS[3]];

  const ox = origin[0] * W;
  const oy = origin[1] * H;
  const reach =
    Math.max(
      Math.hypot(ox, oy),
      Math.hypot(W - ox, oy),
      Math.hypot(ox, H - oy),
      Math.hypot(W - ox, H - oy),
    ) +
    6 * u;

  const progress = (i: number) =>
    interpolate(t, [delay + gaps[i], delay + gaps[i] + GROW], [0, 1], CLAMP);
  const radius = (i: number) => reach * EASE_BURST(progress(i));

  const last = gaps.length - 1;
  const done = progress(last) >= 1;
  const push =
    1 +
    0.06 *
      EASE_PUSH(interpolate(t, [delay, delay + GROW * 0.8], [0, 1], CLAMP));
  const land = EASE_LAND(progress(last));
  const settle = 1.08 - 0.08 * land;
  // The halo keeps breathing outward a touch after the landing.
  const drift = interpolate(
    t,
    [delay + GROW, delay + GROW + 90],
    [0, 1],
    CLAMP,
  );
  const halo = haloGround(
    toneB,
    Math.min(W, H) * (0.45 + 0.035 * land + 0.015 * drift),
  );

  const disc = (r: number, key: string, children: React.ReactNode) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: ox - r,
        top: oy - r,
        width: 2 * r,
        height: 2 * r,
        borderRadius: "50%",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );

  const coveredBy = (i: number) => radius(i) >= reach - 0.5;
  const hideA = fills.some((_, i) => coveredBy(i)) || done;

  return (
    <AbsoluteFill style={{ background: TONES[toneB].bg, overflow: "hidden" }}>
      {hideA ? null : (
        <AbsoluteFill
          style={{
            transform: `scale(${push})`,
            transformOrigin: `${ox}px ${oy}px`,
          }}
        >
          <Scene content={from} tone={toneA} accent={accent} mark={false} />
        </AbsoluteFill>
      )}
      {fills.map((fill, i) => {
        const r = radius(i);
        const buried = done || coveredBy(i + 1 <= last ? i + 1 : last);
        if (r <= 0 || buried) return null;
        return disc(
          r,
          `${fill}-${i}`,
          <div style={{ width: "100%", height: "100%", background: fill }} />,
        );
      })}
      {radius(last) > 0
        ? disc(
            done ? reach : radius(last),
            "scene-b",
            <div
              style={{
                position: "absolute",
                left: (done ? reach : radius(last)) - ox,
                top: (done ? reach : radius(last)) - oy,
                width: W,
                height: H,
                transform: `scale(${settle})`,
                transformOrigin: `${ox}px ${oy}px`,
              }}
            >
              <Scene
                content={to}
                tone={toneB}
                accent={accent}
                mark
                ground={halo}
              />
            </div>,
          )
        : null}
      <Grain opacity={theme === "light" ? 0.035 : 0.05} />
    </AbsoluteFill>
  );
}
