"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
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

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
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

export interface CountdownProps {
  /** First number of the countdown. */
  from?: number;
  /** What the countdown lands on: "Live", a product name, a date. */
  finalLabel?: string;
  /** Show the small accent dot before the final label. */
  indicator?: boolean;
  /** Small lockup under the final label. Pass "" to hide it. */
  caption?: string;
  /** Replaces the default remocn mark in the lockup. */
  logo?: React.ReactNode;
  /** Frames per number. */
  beat?: number;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    track: "rgba(255,255,255,0.10)",
    stage: "rgba(255,255,255,0.06)",
    push: "rgba(255,255,255,0.09)",
    grain: 0.06,
    /** gradients.sh "radial-glow" (#f3f1ff #9db4ff #5a46cb #1d1240) as a thick halo */
    halo: [
      "rgba(29,18,64,0)",
      "rgba(29,18,64,0.55)",
      "rgba(90,70,203,0.55)",
      "rgba(157,180,255,0.5)",
      "rgba(214,218,255,0.32)",
      "rgba(90,70,203,0.36)",
      "rgba(29,18,64,0.4)",
    ],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    track: "rgba(18,18,20,0.10)",
    stage: "rgba(255,255,255,0.85)",
    push: "rgba(255,255,255,0.75)",
    grain: 0.045,
    halo: [
      "rgba(157,180,255,0)",
      "rgba(157,180,255,0.16)",
      "rgba(90,70,203,0.22)",
      "rgba(157,180,255,0.55)",
      "rgba(243,241,255,0.9)",
      "rgba(157,180,255,0.3)",
      "rgba(90,70,203,0.08)",
    ],
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];
type Exit = "ring" | "slice" | "through";

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={13}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

/** A centred monumental numeral; everything else is styling passed in. */
function Numeral({
  n,
  size,
  color,
  style,
}: {
  n: number;
  size: number;
  color: string;
  style?: React.CSSProperties;
}) {
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: sans,
          fontWeight: 400,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color,
          fontVariantNumeric: "tabular-nums",
          // optical centring: Inter Tight figures sit high in the em box
          transform: `translateY(${size * 0.035}px)`,
        }}
      >
        {n}
      </div>
    </AbsoluteFill>
  );
}

export function Countdown({
  from = 3,
  finalLabel = "Live",
  indicator = true,
  caption = "remocn 2.0",
  logo,
  beat = 20,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: CountdownProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = height / 720;
  const p: Palette = THEMES[theme];
  const count = Math.max(1, Math.round(from));
  const size = height * 0.66;
  const ringR = height * 0.36;
  const cxp = width / 2;
  const cyp = height / 2;
  const final = count * beat;

  const exitOf = (k: number): Exit =>
    k === count - 1 ? "through" : k % 2 === 0 ? "ring" : "slice";

  const layers: React.ReactNode[] = [];
  const overlays: React.ReactNode[] = [];

  for (let k = 0; k < count; k++) {
    const n = count - k;
    const start = k * beat;
    const end = start + beat;
    if (t < start - beat || t > end + beat) continue;

    // ---- entrance (driven by the previous numeral's exit) ----
    const prevExit: Exit | null = k === 0 ? null : exitOf(k - 1);
    let style: React.CSSProperties = {};
    let opacity = 1;
    let scale = 1;
    let blur = 0;
    let mask: string | undefined;

    if (prevExit === null) {
      const a = interpolate(t, [0, 9], [0, 1], { ...CLAMP, easing: EASE_OUT });
      opacity = 0.3 + 0.7 * a;
      scale = 1.05 - 0.05 * a;
      blur = (1 - a) * 8 * u;
    } else if (prevExit === "ring") {
      const a = interpolate(t, [start - 12, start], [0, 360], {
        ...CLAMP,
        easing: EASE_IO,
      });
      if (t < start - 12) opacity = 0;
      else if (t < start)
        mask = `conic-gradient(from 0deg at 50% 50%, #000 0deg, #000 ${a}deg, transparent ${a + 0.8}deg)`;
      const s = interpolate(t, [start - 12, start + 6], [1.04, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      scale = s;
    } else if (prevExit === "slice") {
      const a = interpolate(t, [start, start + 9], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      opacity = t < start ? 0 : a;
      scale = 1.14 - 0.14 * a;
      blur = (1 - a) * 10 * u;
    }

    // a slow breath while the numeral holds
    scale *= interpolate(t, [start, end], [1, 0.985], CLAMP);

    // ---- exit ----
    const exit = exitOf(k);
    if (exit === "ring") {
      const a = interpolate(t, [end - 12, end], [0, 360], {
        ...CLAMP,
        easing: EASE_IO,
      });
      if (t >= end) opacity = 0;
      else if (t > end - 12)
        mask = `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent ${a}deg, #000 ${a + 0.8}deg)`;

      // the ring itself: a hairline track and an accent sweep that leads the wipe
      const ringIn = interpolate(t, [end - 16, end - 10], [0, 1], CLAMP);
      const ringOut = interpolate(t, [end, end + 8], [1, 0], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      const ringScale = interpolate(t, [end, end + 8], [1, 1.06], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      const ro = ringIn * ringOut;
      if (ro > 0) {
        const circ = 2 * Math.PI * ringR;
        const hand = ((a - 90) * Math.PI) / 180;
        overlays.push(
          <svg
            key={`ring${k}`}
            width={width}
            height={height}
            style={{
              position: "absolute",
              inset: 0,
              opacity: ro,
              transform: `scale(${ringScale})`,
            }}
            aria-hidden
          >
            <circle
              cx={cxp}
              cy={cyp}
              r={ringR}
              fill="none"
              stroke={p.track}
              strokeWidth={Math.max(1, 1.2 * u)}
            />
            <circle
              cx={cxp}
              cy={cyp}
              r={ringR}
              fill="none"
              stroke={accent}
              strokeWidth={3 * u}
              strokeLinecap="round"
              strokeDasharray={`${(circ * a) / 360} ${circ}`}
              transform={`rotate(-90 ${cxp} ${cyp})`}
            />
            {a > 0 && a < 360 && (
              <line
                x1={cxp}
                y1={cyp}
                x2={cxp + Math.cos(hand) * ringR}
                y2={cyp + Math.sin(hand) * ringR}
                stroke={p.fg}
                strokeOpacity={0.35}
                strokeWidth={Math.max(1, u)}
              />
            )}
          </svg>,
        );
      }
    } else if (exit === "slice") {
      const cut = interpolate(t, [end - 9, end - 3], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      });
      const part = interpolate(t, [end - 3, end + 5], [0, 1], {
        ...CLAMP,
        easing: Easing.bezier(0.5, 0, 0.2, 1),
      });
      if (t >= end - 3) {
        // replace the whole numeral with two halves that shear apart
        const cutY = cyp + size * 0.02;
        const shift = part * width * 0.42;
        const gapY = part * size * 0.03;
        const halves: Array<[string, number]> = [
          [`inset(0 0 ${height - cutY}px 0)`, -1],
          [`inset(${cutY}px 0 0 0)`, 1],
        ];
        for (const [clip, dir] of halves) {
          // trailing ghosts: a fake motion blur along the shear
          for (let g = 2; g >= 0; g--) {
            const lag = g * 0.09;
            const sh = Math.max(0, part - lag) / Math.max(0.001, 1 - lag);
            layers.push(
              <Numeral
                key={`h${k}${dir}${g}`}
                n={n}
                size={size}
                color={p.fg}
                style={{
                  clipPath: clip,
                  transform: `translate(${dir * sh * shift}px, ${dir * gapY}px) scale(${scale})`,
                  opacity:
                    interpolate(part, [0.25, 1], [1, 0], CLAMP) *
                    (g === 0
                      ? 1
                      : 0.2 * interpolate(part, [0.1, 0.35], [0, 1], CLAMP)),
                  filter: g === 0 ? undefined : `blur(${3 * u}px)`,
                }}
              />,
            );
          }
        }
        opacity = 0;
      }
      const lineO =
        interpolate(t, [end - 9, end - 7], [0, 1], CLAMP) *
        interpolate(t, [end - 1, end + 6], [1, 0], CLAMP);
      if (lineO > 0) {
        const span = width * 0.62;
        overlays.push(
          <div
            key={`cut${k}`}
            style={{
              position: "absolute",
              left: cxp - span / 2,
              top: cyp + size * 0.02 - u,
              width: span,
              height: Math.max(1.5, 2 * u),
              background: accent,
              transformOrigin: "0% 50%",
              transform: `scaleX(${cut})`,
              opacity: lineO,
            }}
          />,
        );
      }
    } else {
      // scale-through: the last numeral rushes past the camera
      const r = interpolate(t, [end - 8, end + 2], [0, 1], CLAMP);
      const grow = (x: number) => 1 + 9 * x * x * x;
      if (r > 0) {
        for (let g = 3; g >= 1; g--) {
          const gr = Math.max(0, r - g * 0.06);
          layers.push(
            <Numeral
              key={`g${k}${g}`}
              n={n}
              size={size}
              color={p.fg}
              style={{
                transform: `scale(${scale * grow(gr)})`,
                opacity:
                  0.14 * interpolate(gr, [0, 0.2, 0.8], [0, 1, 0], CLAMP),
                filter: `blur(${(3 + gr * gr * 18) * u}px)`,
              }}
            />,
          );
        }
      }
      scale *= grow(r);
      opacity *= interpolate(r, [0.45, 0.95], [1, 0], CLAMP);
      blur += r * r * 16 * u;
    }

    if (opacity > 0.001) {
      style = {
        opacity,
        transform: `scale(${scale})`,
        filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
        WebkitMaskImage: mask,
        maskImage: mask,
      };
      layers.push(
        <Numeral key={`n${k}`} n={n} size={size} color={p.fg} style={style} />,
      );
    }
  }

  // ---- final hit ----
  const f = spring({
    frame: t - final,
    fps,
    config: { damping: 16, stiffness: 160, mass: 0.8 },
  });
  const fO = interpolate(t, [final, final + 6], [0, 1], CLAMP);
  const fBlur = interpolate(t, [final, final + 8], [10 * u, 0], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const dot = spring({
    frame: t - final - 4,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
  });
  const push = interpolate(t, [final - 2, final + 2, final + 26], [0, 1, 0], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const cap = interpolate(t, [final + 12, final + 32], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const finalIsLogo = finalLabel.trim().toLowerCase() === "remocn";
  const finalSize = Math.min(
    height * 0.3,
    (width * 0.7) / Math.max(3, Array.from(finalLabel).length * 0.56),
  );
  // rough rendered width of the final line, so the halo can open around it
  const finalW = Math.max(
    2 * ringR,
    finalSize *
      (finalIsLogo
        ? 3.9
        : Array.from(finalLabel).length * 0.55 + (indicator ? 0.4 : 0)),
  );
  // "remocn 2.0" -> the real logo followed by "2.0"
  const capMatch = /^remocn\b\s*(.*)$/i.exec(caption);
  const capText = capMatch ? capMatch[1] : caption;
  const capLogo =
    logo ??
    (finalIsLogo && !capMatch ? null : (
      <RemocnLogo fontSize={27 * u} color={p.fg} />
    ));
  // the whole stage leans in a touch at the cut, then settles
  const stageKick =
    1 + 0.02 * interpolate(t, [final, final + 3, final + 24], [0, 1, 0], CLAMP);

  // the halo sits on the countdown ring's radius, breathes in as the count
  // runs, and opens up at the hit to frame the final label
  const haloOpen = interpolate(t, [final - 4, final + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const haloScale =
    interpolate(t, [0, final], [0.94, 1], CLAMP) *
    (1 + (finalW / (2 * ringR * 0.9) - 1) * haloOpen);
  const haloIn = interpolate(t, [0, 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const hs = (k: number) => `${(ringR * k).toFixed(1)}px`;
  const h = p.halo;
  const halo = `radial-gradient(circle at 50% 50%, ${h[0]} ${hs(0.78)}, ${h[1]} ${hs(0.88)}, ${h[2]} ${hs(0.96)}, ${h[3]} ${hs(0.995)}, ${h[4]} ${hs(1.01)}, ${h[5]} ${hs(1.07)}, ${h[6]} ${hs(1.2)}, transparent ${hs(1.55)})`;
  // a slow light that travels around the halo
  const sweep = 200 + t * 1.1;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 65% at 50% 38%, ${p.stage}, transparent 75%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: halo,
          opacity: haloIn,
          transform: `scale(${haloScale})`,
          WebkitMaskImage: `conic-gradient(from ${sweep}deg at 50% 50%, rgba(0,0,0,0.55), #000 40%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.55))`,
          maskImage: `conic-gradient(from ${sweep}deg at 50% 50%, rgba(0,0,0,0.55), #000 40%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.55))`,
        }}
      />
      <AbsoluteFill style={{ transform: `scale(${stageKick})` }}>
        {layers}
        {overlays}

        {t >= final - 1 && (
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 30 * u,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: finalSize * 0.16,
                opacity: fO,
                filter: fBlur > 0.2 ? `blur(${fBlur}px)` : undefined,
                transform: `scale(${0.9 + 0.1 * f})`,
              }}
            >
              {indicator && (
                <div
                  style={{
                    width: finalSize * 0.2,
                    height: finalSize * 0.2,
                    borderRadius: "50%",
                    background: accent,
                    transform: `scale(${0.5 + 0.5 * dot})`,
                    marginTop: finalSize * 0.06,
                  }}
                />
              )}
              {finalIsLogo ? (
                <RemocnLogo fontSize={finalSize} color={p.fg} />
              ) : (
                <div
                  style={{
                    fontFamily: sans,
                    fontWeight: 500,
                    fontSize: finalSize,
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    color: p.fg,
                    whiteSpace: "nowrap",
                  }}
                >
                  {finalLabel}
                </div>
              )}
            </div>
            {caption !== "" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10 * u,
                  opacity: cap,
                  transform: `translateY(${(1 - cap) * 12 * u}px)`,
                  fontFamily: sans,
                  fontWeight: 400,
                  fontSize: 24 * u,
                  letterSpacing: "-0.01em",
                  color: p.muted,
                }}
              >
                {capLogo}
                {capText}
              </div>
            )}
          </AbsoluteFill>
        )}
      </AbsoluteFill>

      {/* exposure push at the hit: light lifts, no white flash */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 70% at 50% 50%, ${p.push}, transparent 80%)`,
          opacity: push,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 60%, ${p.bg} 100%)`,
          opacity: 0.6,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
