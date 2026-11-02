"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});
const sans = manrope.fontFamily;

export interface DepthHeadlineProps {
  /** Huge headline set behind the subject. One short word reads best. */
  title?: string;
  /** Transparent-PNG cutout that rises in front of the headline. */
  src?: string;
  /** Small line at the foot of the frame, after the logo. Pass "" to hide. */
  caption?: string;
  /** Show the remocn logo at the foot of the frame. */
  showLogo?: boolean;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F5F4F0",
    muted: "#8A8984",
    shadow: "rgba(0,0,0,0.55)",
  },
  light: {
    bg: "#F5F4F0",
    fg: "#0A0A0B",
    muted: "#6E6C67",
    shadow: "rgba(40,32,20,0.22)",
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Fraunces 400 advance per character at display tracking, in em. */
const ADVANCE = 0.48;

/** gradients.sh "mesh": lilac, periwinkle and deep blue blobs on ink. */
const MESH = {
  bg: "#0a0d24",
  colors: ["#ecdcf2", "#8796ee", "#2e45b7", "#0e1645"],
} as const;

/**
 * The mesh palette as a flat poster orb: deep blue at the crown, lilac light
 * pooling at the base, two blobs drifting a few percent. Lit from below so it
 * reads as colour, not as a shaded ball.
 */
function meshFill(t: number, accent: string) {
  const [c0, c1, , c3] = MESH.colors;
  const c2 = accent;
  const d = Math.sin(t * Math.PI) * 5;
  return [
    `radial-gradient(70% 55% at ${38 + d}% 100%, ${c0} 0%, color-mix(in oklab, ${c0} 0%, transparent) 70%)`,
    `radial-gradient(60% 70% at ${82 - d}% ${62 - d * 0.5}%, color-mix(in oklab, ${c1} 85%, transparent) 0%, transparent 70%)`,
    `radial-gradient(90% 70% at ${30 + d * 0.6}% 0%, color-mix(in oklab, ${c3} 70%, transparent) 0%, transparent 72%)`,
    `linear-gradient(180deg, ${c2} 0%, ${c1} 64%, ${c0} 100%)`,
  ].join(", ");
}

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

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

export function DepthHeadline({
  title = "Studio",
  src,
  caption = "Studio",
  showLogo = true,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: DepthHeadlineProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];

  const size = Math.min(
    H * 0.56,
    (W * 0.9) / Math.max(1, title.length * ADVANCE),
  );

  // Far plane: the headline tracks open and drifts a short distance.
  const open = interpolate(frame, [0, 54], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const tracking = -0.07 + open * 0.035;
  const headX = (1 - open) * W * 0.045;
  const headY = (1 - open) * H * 0.035;

  // Near plane: the subject rises from below and covers much more ground.
  const rise = interpolate(frame, [4, 48], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const subjectY = (1 - rise) * H * 0.78;

  // A slow push after the rise: near plane grows more than far plane.
  const push = interpolate(frame, [30, 96], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const headScale = 1 + push * 0.014;
  const subjectScale = 1 + push * 0.04;

  const captionIn = interpolate(frame, [46, 62], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const disc = H * 0.48;
  const headTop = H * 0.42;
  // Disc top lands in the lower x-height so the word stays legible.
  const discTop = headTop + size * 0.15;

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: headTop,
          textAlign: "center",
          fontFamily: display,
          fontWeight: 400,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: `${tracking}em`,
          color: c.fg,
          whiteSpace: "nowrap",
          transform: `translate(${headX}px, calc(-50% + ${headY}px)) scale(${headScale})`,
          transformOrigin: "50% 60%",
        }}
      >
        {title}
      </div>

      {src ? (
        <Img
          src={src}
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            height: H * 0.84,
            objectFit: "contain",
            transform: `translate(-50%, ${subjectY}px) scale(${subjectScale})`,
            transformOrigin: "50% 100%",
            filter: `drop-shadow(0 ${H * 0.03}px ${H * 0.05}px ${c.shadow})`,
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            left: (W - disc) / 2,
            top: discTop,
            width: disc,
            height: disc,
            borderRadius: "50%",
            background: meshFill(frame / 120, accent),
            transform: `translateY(${subjectY}px) scale(${subjectScale})`,
            transformOrigin: "50% 40%",
          }}
        />
      )}

      {showLogo || caption ? (
        <div
          style={{
            position: "absolute",
            left: H * 0.08,
            bottom: H * 0.07,
            display: "flex",
            alignItems: "baseline",
            gap: H * 0.018,
            opacity: captionIn,
            transform: `translateY(${(1 - captionIn) * H * 0.01}px)`,
          }}
        >
          {showLogo ? <RemocnLogo fontSize={H * 0.032} color={c.fg} /> : null}
          {showLogo && caption ? (
            <div
              style={{
                width: 1,
                height: H * 0.024,
                alignSelf: "center",
                backgroundColor: c.muted,
                opacity: 0.6,
              }}
            />
          ) : null}
          {caption ? (
            <div
              style={{
                fontFamily: sans,
                fontWeight: 500,
                fontSize: H * 0.028,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                color: c.muted,
              }}
            >
              {caption}
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
