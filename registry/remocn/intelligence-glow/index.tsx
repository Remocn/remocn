"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadSans("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

export interface IntelligenceGlowProps {
  /** Asked while the edge glow breathes. */
  question?: string;
  /** First word of the answer, set in a serif italic. */
  answerLead?: string;
  /** Rest of the answer, resolves word by word after the lead. */
  answer?: string;
  /** Show the remocn logo under the answer on the poster frame. */
  showLogo?: boolean;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark + "emocn" in Manrope 600. */
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

// gradients.sh "halo" on dark (its blue stop becomes the accent), "ribbon"
// on light. The light is the only gradient in the shot.
const THEMES = {
  dark: {
    bg: "#030306",
    fg: "#F3F2EF",
    glow: ["#FFF4EC", "#FFB36B", "#E2457A", ""],
    haze: 0.85,
    core: 0.95,
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    glow: ["#FFC83D", "#FF8A3D", "#FF3D9A", "#7A5CFF"],
    haze: 0.7,
    core: 0.85,
    grain: 0.04,
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Beats (frames at speed 1).
const Q_IN = 2;
const THINK = 32;
const RIPPLES = [36, 54];
const BLOBS = 16;
const Q_OUT = 76;
const SQUEEZE = [80, 100] as const;
const NARROW = [88, 110] as const;
const A_IN = 100;
const A_STAGGER = 4;
const LOGO_IN = 132;

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
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function rw(r: { left: number; right: number }) {
  return r.right - r.left;
}

function lerp(a: number, b: number, k: number) {
  return a + (b - a) * k;
}

export function IntelligenceGlow({
  question = "Make a launch film for Friday?",
  answerLead = "Done.",
  answer = "14 shots, cut to the beat.",
  showLogo = true,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: IntelligenceGlowProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];
  const glow = c.glow.map((col) => col || accent);

  // A looping band of the palette, drifted sideways so the colours travel
  // around the frame while it breathes.
  const loop = [glow[3], glow[2], glow[1], glow[2], glow[3]];
  const band = `linear-gradient(90deg, ${loop.join(", ")})`;
  const drift = `${((t * 0.45) % 100).toFixed(2)}% 50%`;
  // Breath: slow swell, deeper and quicker while "thinking".
  const thinking = interpolate(
    t,
    [THINK - 6, THINK + 6, Q_OUT, Q_OUT + 8],
    [0, 1, 1, 0],
    CLAMP,
  );
  const breath =
    0.5 +
    0.5 * Math.sin((t / (44 - thinking * 14)) * Math.PI * 2 - Math.PI / 2);
  const swell = 1 + breath * (0.18 + thinking * 0.22);
  const intro = interpolate(t, [0, 14], [0.55, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  // Answer metrics. Lead word in serif italic at 1.14x so the x-heights meet.
  const aWords = answer.split(" ").filter(Boolean);
  const estEm = answerLead.length * 0.42 * 1.14 + answer.length * 0.43 + 0.3;
  const aSize = Math.min(78 * u, (W * 0.86) / estEm);
  const aY = H * 0.46;
  const lineY = aY + aSize * 0.78;
  const lineW = Math.min(W * 0.8, estEm * aSize * 1.02);
  const lineT = 3 * u;

  // Collapse: top and bottom bands squeeze to the answer rule, then the
  // strip narrows to the answer's width.
  const sq = interpolate(t, [SQUEEZE[0], SQUEEZE[1]], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const nw = interpolate(t, [NARROW[0], NARROW[1]], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const ring = {
    top: lerp(0, lineY, sq),
    bottom: lerp(H, lineY, sq),
    left: lerp(0, (W - lineW) / 2, nw),
    right: lerp(W, (W + lineW) / 2, nw),
  };

  // "Thinking" pulses: the light swells inward, three times.
  const ripple = RIPPLES.reduce((acc, start) => {
    const k = interpolate(t, [start, start + 24], [0, 1], CLAMP);
    return acc + Math.sin(k * Math.PI) ** 1.6;
  }, 0);
  // Pools of light riding the ring's perimeter: long and shallow along an
  // edge, rounder at the corners. Overlapping, they read as one band of light
  // whose depth and colour keep changing.
  const rwid = rw(ring);
  const rhgt = ring.bottom - ring.top;
  const per = 2 * (rwid + rhgt);
  const zone = 160 * u;
  const blobsOut = interpolate(sq, [0.6, 1], [1, 0], CLAMP);
  const blobs = Array.from({ length: BLOBS }, (_, i) => {
    const dd = (((i + 0.5) / BLOBS + t * 0.0015) % 1) * per;
    let x: number;
    let y: number;
    let horizontal: boolean;
    let corner: number;
    if (dd < rwid) {
      x = ring.left + dd;
      y = ring.top;
      horizontal = true;
      corner = Math.min(dd, rwid - dd);
    } else if (dd < rwid + rhgt) {
      x = ring.right;
      y = ring.top + dd - rwid;
      horizontal = false;
      corner = Math.min(dd - rwid, rwid + rhgt - dd);
    } else if (dd < 2 * rwid + rhgt) {
      x = ring.right - (dd - rwid - rhgt);
      y = ring.bottom;
      horizontal = true;
      corner = Math.min(dd - rwid - rhgt, 2 * rwid + rhgt - dd);
    } else {
      x = ring.left;
      y = ring.bottom - (dd - 2 * rwid - rhgt);
      horizontal = false;
      corner = Math.min(dd - 2 * rwid - rhgt, per - dd);
    }
    const m = 0.5 + 0.5 * Math.min(1, corner / zone);
    const hw = horizontal ? m : 1 - m;
    const wob = Math.sin(t / 21 + i * 2.3);
    const depth =
      74 * u * swell * (1 + ripple * 0.9) * (0.8 + 0.3 * wob) * (1 - sq * 0.85);
    const a = lerp(depth, rwid * 0.2 + 40 * u, hw);
    const b = lerp(rhgt * 0.27 + 20 * u, depth, hw);
    return {
      key: i,
      x,
      y,
      a,
      b,
      color: glow[[3, 2, 1, 2, 3, 1, 2][i % 7]],
      opacity:
        c.haze * intro * blobsOut * (0.8 + 0.2 * wob) * (1 + ripple * 0.25),
    };
  });
  const rule = interpolate(t, [SQUEEZE[1] - 9, SQUEEZE[1] + 3], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  // Question: words rise in, shimmer while thinking, dissolve as the light
  // collapses.
  const qWords = question.split(" ").filter(Boolean);
  const qSize = Math.min(
    90 * u,
    (W * 0.74) / Math.max(6, question.length * 0.3),
  );
  const qOut = interpolate(t, [Q_OUT, Q_OUT + 16], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.5, 0, 0.75, 0),
  });
  const shimmerPos = interpolate(t, [THINK, Q_OUT], [-2, qWords.length + 4]);

  const logoIn = interpolate(t, [LOGO_IN, LOGO_IN + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      {blobs.map((bl) =>
        bl.opacity > 0.002 ? (
          <div
            key={bl.key}
            style={{
              position: "absolute",
              left: bl.x - bl.a,
              top: bl.y - bl.b,
              width: bl.a * 2,
              height: bl.b * 2,
              background: `radial-gradient(closest-side, ${bl.color} 0%, color-mix(in oklab, ${bl.color} 62%, transparent) 32%, color-mix(in oklab, ${bl.color} 20%, transparent) 66%, transparent 100%)`,
              opacity: bl.opacity,
              mixBlendMode: theme === "dark" ? "screen" : "multiply",
            }}
          />
        ) : null,
      )}

      {/* The rule the light settles into, with a soft bloom of its own. */}
      {rule > 0 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: ring.left + rw(ring) * 0.05,
              width: rw(ring) * 0.9,
              top: lineY - 12 * u,
              height: 24 * u,
              borderRadius: 999,
              backgroundImage: band,
              backgroundSize: "200% 100%",
              backgroundPosition: drift,
              filter: `blur(${16 * u}px)`,
              opacity: rule * 0.55,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: ring.left,
              width: rw(ring),
              top: lineY - lineT / 2,
              height: lineT,
              borderRadius: 999,
              backgroundImage: band,
              backgroundSize: "200% 100%",
              backgroundPosition: drift,
              opacity: rule * c.core,
            }}
          />
        </>
      ) : null}

      {/* Question */}
      {qOut < 1 ? (
        <div
          style={{
            position: "absolute",
            left: W * 0.1,
            right: W * 0.1,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 1 - qOut,
            filter: qOut > 0 ? `blur(${qOut * 14 * u}px)` : undefined,
            transform: `translateY(${-qOut * 14 * u}px) scale(${1 - qOut * 0.04})`,
          }}
        >
          <div
            style={{
              fontFamily: sans,
              fontWeight: 500,
              fontSize: qSize,
              lineHeight: 1.06,
              letterSpacing: "-0.035em",
              color: c.fg,
              textAlign: "center",
              textWrap: "balance",
              maxWidth: W * 0.72,
            }}
          >
            {qWords.map((w, i) => {
              const k = interpolate(
                t,
                [Q_IN + i * 3, Q_IN + i * 3 + 14],
                [0, 1],
                {
                  ...CLAMP,
                  easing: EASE_OUT,
                },
              );
              const d = i - shimmerPos;
              const shimmer = thinking * (1 - Math.exp(-(d * d) / 2.2));
              return (
                <span
                  key={`${i}-${w}`}
                  style={{
                    display: "inline-block",
                    marginRight: i < qWords.length - 1 ? "0.24em" : 0,
                    opacity: k * (1 - shimmer * 0.55),
                    transform: `translateY(${(1 - k) * 0.28}em)`,
                    filter: k < 1 ? `blur(${(1 - k) * 8 * u}px)` : undefined,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Answer */}
      {t >= A_IN - 1 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: aY - aSize * 0.62,
            height: aSize * 1.1,
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
            whiteSpace: "nowrap",
            color: c.fg,
          }}
        >
          {[answerLead, ...aWords].map((w, i) => {
            const lead = i === 0;
            const s = A_IN + i * A_STAGGER;
            const k = interpolate(t, [s, s + 16], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            return (
              <span
                key={`${i}-${w}`}
                style={{
                  display: "inline-block",
                  fontFamily: lead ? serif : sans,
                  fontStyle: lead ? "italic" : "normal",
                  fontWeight: lead ? 400 : 500,
                  fontSize: lead ? aSize * 1.14 : aSize,
                  letterSpacing: lead ? "-0.02em" : "-0.035em",
                  lineHeight: 1,
                  marginRight:
                    i === aWords.length ? 0 : lead ? "0.26em" : "0.22em",
                  opacity: k,
                  transform: `translateY(${(1 - k) * 0.3}em)`,
                  filter: k < 1 ? `blur(${(1 - k) * 10 * u}px)` : undefined,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ) : null}

      {showLogo && logoIn > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: H * 0.82,
            display: "flex",
            justifyContent: "center",
            opacity: logoIn,
            transform: `translateY(${(1 - logoIn) * 10 * u}px)`,
          }}
        >
          <RemocnLogo fontSize={26 * u} color={c.fg} />
        </div>
      ) : null}
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
