"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { Fragment, useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});
const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });
const geist = loadGeist("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

/**
 * Beat sheet (30fps, speed 1):
 * 0–18    "Introducing" settles in alone at the centre (tracking closes, blur clears).
 * 18–40   it lifts into the eyebrow slot while the name rises out of a mask,
 *         tracking wide and closing in to tight display spacing.
 * 30–74   a beam of light (gradients.sh "beam") passes through the name: ahead
 *         of it the letters are dim, behind it they are lit. The ground glows
 *         where the beam is.
 * 52–78   the tagline rises word by word.
 * 78–120  poster hold.
 */

export interface IntroducingProps {
  /** Small line before the name lands. */
  eyebrow?: string;
  /** Product name. "remocn" with no `logo` renders the real remocn.dev wordmark. */
  name?: string;
  /** Mark set before the name, sized to the name's cap height. */
  logo?: React.ReactNode;
  /** One line under the lockup. */
  tagline?: string;
  /** Colour of the light passing through the name. */
  accent?: string;
  /** Stage fill. "transparent" drops the stage and its glow. */
  background?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

/** gradients.sh "beam": bg #02030a, [#f4f7ff, #8fb4ff, #3d5bff, #1a1660]. */
const BEAM = ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"] as const;

const PALETTES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F4F3F0",
    dim: "#323238",
    muted: "#8E8D94",
    beamEdge: BEAM[1],
    rim: "rgba(157,180,255,0.62)",
    rimOuter: "rgba(61,91,255,0.22)",
    haze: "rgba(26,22,96,0.55)",
    halo: "rgba(61,91,255,0.16)",
    column: "rgba(143,180,255,0.16)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    dim: "#D9D6CE",
    muted: "#6E6C67",
    beamEdge: "#7d8fff",
    rim: "rgba(61,91,255,0.42)",
    rimOuter: "rgba(143,180,255,0.22)",
    haze: "rgba(143,180,255,0.16)",
    halo: "rgba(61,91,255,0.07)",
    column: "rgba(61,91,255,0.08)",
    grain: 0.04,
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_SWEEP = Easing.bezier(0.45, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** R mark width / height. The site sets it 0.76em tall. */
const R_RATIO = 124.06 / 134.26;
const R_W = 0.76 * R_RATIO;
const R_GAP = 0.04;

/** Manrope advance widths (per 1000 em) for ASCII 32–126, weights 500 and 600. */
const MANROPE_500 = [
  200, 329, 417, 924, 602, 901, 657, 229, 435, 435, 446, 575, 278, 420, 270,
  402, 626, 406, 578, 562, 596, 580, 621, 512, 591, 621, 314, 318, 622, 750,
  622, 534, 907, 646, 619, 723, 681, 575, 510, 714, 697, 249, 476, 612, 518,
  846, 696, 732, 616, 732, 640, 630, 600, 708, 616, 949, 622, 574, 630, 412,
  402, 412, 673, 660, 506, 562, 600, 561, 600, 590, 362, 600, 604, 249, 263,
  510, 249, 865, 604, 600, 600, 600, 374, 530, 412, 604, 523, 779, 536, 538,
  531, 430, 269, 430, 680,
];
const MANROPE_600_EMOCN = (596 + 882 + 610 + 568 + 615) / 1000;
/** Geist 500 advances (per 1000 em), used to estimate how the tagline wraps. */
const GEIST_500 = [
  243, 230, 349, 513, 632, 853, 668, 174, 329, 329, 420, 563, 186, 432, 186,
  457, 677, 374, 614, 600, 629, 629, 610, 507, 629, 613, 227, 227, 547, 544,
  547, 517, 901, 678, 681, 704, 701, 610, 596, 692, 705, 281, 592, 652, 584,
  883, 738, 739, 653, 739, 673, 642, 558, 696, 688, 956, 633, 586, 557, 342,
  439, 342, 438, 532, 257, 556, 591, 549, 591, 566, 413, 591, 581, 256, 274,
  565, 283, 852, 581, 562, 592, 591, 394, 535, 414, 587, 548, 806, 559, 540,
  499, 405, 274, 406, 522,
];

function textEm(text: string, table: number[]) {
  let w = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += c >= 32 && c <= 126 ? table[c - 32] : 600;
  }
  return w / 1000;
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
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

/**
 * Horizontal fill for the lit sweep, in percent of the element it fills.
 * Lit (fg) behind the beam, the beam itself, dim ahead of it.
 */
function sweepStops(
  centre: number,
  half: number,
  fg: string,
  edge: string,
  core: string,
  dim: string,
) {
  return [
    [fg, centre - half],
    [edge, centre - half * 0.45],
    [core, centre],
    [edge, centre + half * 0.35],
    [dim, centre + half],
  ] as const;
}

export function Introducing({
  eyebrow = "Introducing",
  name = "remocn",
  logo,
  tagline = "Launch-video scenes for Remotion. Copy, paste, render.",
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: IntroducingProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const p = PALETTES[theme];
  const gid = `b${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const portrait = height > width * 1.1;
  const s = portrait
    ? (width / 1280) * 1.5
    : Math.min(width / 1280, height / 720);

  const wordmark = logo === undefined && name.trim().toLowerCase() === "remocn";

  // ---- lockup metrics (em) ------------------------------------------------
  const chars = wordmark ? 5 : [...name].length;
  const LS_END = -0.035;
  const logoEm = wordmark ? R_W + R_GAP : logo ? 0.84 + 0.2 : 0;
  const textBase = wordmark ? MANROPE_600_EMOCN : textEm(name, MANROPE_500);
  const maxW = width * (portrait ? 0.86 : 0.8);
  const endEm = logoEm + textBase + chars * LS_END;
  const nameFs = Math.min((portrait ? 150 : 176) * s, maxW / endEm);
  // open tracking only as far as the frame allows
  const lsStart = Math.max(
    LS_END,
    Math.min(0.12, (maxW / nameFs - logoEm - textBase) / chars),
  );

  // ---- timing --------------------------------------------------------------
  const eyeIn = interpolate(frame, [0, 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const lift = interpolate(frame, [12, 32], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const rise = interpolate(frame, [24, 48], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const track = interpolate(frame, [24, 68], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const sweep = interpolate(frame, [34, 78], [0, 1], {
    ...CLAMP,
    easing: EASE_SWEEP,
  });
  const settle = interpolate(frame, [0, 100], [1.035, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const ls = lsStart + (LS_END - lsStart) * track;
  const lockupEm = logoEm + textBase + chars * ls;
  const lockupW = lockupEm * nameFs;

  // ---- vertical layout -----------------------------------------------------
  const eyeFsEnd = 40 * s;
  const eyeFsStart = 58 * s;
  const tagFs = (portrait ? 34 : 30) * s;
  const tagMax = Math.min(width * 0.78, 980 * s);
  const tagLines = tagline
    ? Math.max(
        1,
        Math.ceil((textEm(tagline, GEIST_500) * 0.97 * tagFs) / tagMax),
      )
    : 0;
  const tagH = tagLines * tagFs * 1.3;
  const nameH = nameFs * 1.0;
  const gapTop = nameFs * 0.2;
  const gapBottom = nameFs * 0.24;
  const groupH = eyeFsEnd + gapTop + nameH + (tagline ? gapBottom + tagH : 0);
  const top = height / 2 - groupH / 2;
  const eyeYEnd = top + eyeFsEnd / 2;
  const nameY = top + eyeFsEnd + gapTop + nameH / 2;
  const tagTop = nameY + nameH / 2 + gapBottom;

  const eyeY = interpolate(lift, [0, 1], [height / 2, eyeYEnd]);
  const eyeFs = interpolate(lift, [0, 1], [eyeFsStart, eyeFsEnd]);

  // ---- the beam ------------------------------------------------------------
  // P = beam centre, em from the lockup's left edge.
  const half = 0.9;
  const P = interpolate(sweep, [0, 1], [-half * 1.2, lockupEm + half * 1.2]);
  const beamX = width / 2 - lockupW / 2 + P * nameFs;
  const sweeping = sweep > 0 && sweep < 1;
  const textStart = logoEm;
  const textEmW = Math.max(0.01, lockupEm - logoEm);
  const toPct = (em: number) => ((em - textStart) / textEmW) * 100;
  const fillFor = (from: number, w: number) => {
    const stops = sweepStops(
      ((P - from) / w) * 100,
      (half / w) * 100,
      p.fg,
      p.beamEdge,
      accent,
      p.dim,
    );
    return stops;
  };
  const textStops = sweepStops(
    toPct(P),
    (half / textEmW) * 100,
    p.fg,
    p.beamEdge,
    accent,
    p.dim,
  );
  const textFill =
    sweep >= 1
      ? p.fg
      : `linear-gradient(90deg, ${textStops.map(([c, o]) => `${c} ${o.toFixed(2)}%`).join(", ")})`;
  const rStops = fillFor(0, R_W);

  // ---- ground --------------------------------------------------------------
  const transparent = background === "transparent";
  const glow = interpolate(frame, [26, 80], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  // a horizon of light rises into the bottom of the frame as the name lights up
  const horizonY =
    height * interpolate(glow, [0, 1], [1.95, 0.875]) + height * 0.78;
  const column = sweeping ? Math.sin(sweep * Math.PI) : 0;

  const words = tagline.split(/\s+/).filter(Boolean);

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? p.bg),
        overflow: "hidden",
      }}
    >
      {!transparent && background === undefined ? (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: glow,
              background: [
                `radial-gradient(${width * 1.05}px ${height * 0.78}px at 50% ${horizonY}px, transparent 0%, transparent 84%, ${p.rimOuter} 88.5%, ${p.rim} 90.5%, ${p.rimOuter} 93%, transparent 100%)`,
                `radial-gradient(${width * 1.05}px ${height * 0.78}px at 50% ${horizonY}px, ${p.haze} 0%, transparent 92%)`,
                `radial-gradient(${width * 0.7}px ${height * 0.5}px at 50% ${horizonY - height * 0.78}px, ${p.halo} 0%, transparent 100%)`,
              ].join(", "),
            }}
          />
          <div
            style={{
              position: "absolute",
              left: beamX - nameFs * 1.6,
              width: nameFs * 3.2,
              top: 0,
              bottom: 0,
              opacity: column,
              background: `radial-gradient(50% 30% at 50% ${(nameY / height) * 100}%, ${p.column} 0%, transparent 100%)`,
            }}
          />
          <Grain opacity={p.grain} />
        </>
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${settle})`,
        }}
      >
        {/* eyebrow */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: eyeY,
            transform: "translateY(-50%)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: serif.fontFamily,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: eyeFs,
              lineHeight: 1,
              color: interpolateColors(lift, [0, 1], [p.fg, p.muted]),
              opacity: eyeIn,
              letterSpacing: `${interpolate(eyeIn, [0, 1], [0.14, -0.005])}em`,
              filter: `blur(${(1 - eyeIn) * 8 * s}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {eyebrow}
          </span>
        </div>

        {/* name, rising out of a mask */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            // the mask's lower edge sits just under the baseline, so the
            // letters climb out of a line rather than fade up
            top: nameY - nameFs * 0.8,
            height: nameFs * 1.44,
            paddingTop: nameFs * 0.3,
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              height: nameFs,
              transform: `translateY(${(1 - rise) * nameFs * 1.02}px)`,
              fontFamily: manrope.fontFamily,
              fontWeight: wordmark ? 600 : 500,
              fontSize: nameFs,
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {wordmark ? (
              <svg
                viewBox="0 0 124.06 134.26"
                style={{ height: "0.76em", width: `${R_W}em`, flexShrink: 0 }}
                aria-hidden
              >
                <defs>
                  <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
                    {sweep >= 1 ? (
                      <stop offset="0" stopColor={p.fg} />
                    ) : (
                      rStops.map(([c, o]) => (
                        <stop key={`${c}${o}`} offset={o / 100} stopColor={c} />
                      ))
                    )}
                  </linearGradient>
                </defs>
                <path fill={`url(#${gid})`} d={REMOCN_R_PATH} />
              </svg>
            ) : logo ? (
              <div
                style={{
                  height: "0.84em",
                  width: "0.84em",
                  marginRight: "0.2em",
                  alignSelf: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: interpolate(sweep, [0, 0.25], [0.35, 1], CLAMP),
                }}
              >
                {logo}
              </div>
            ) : null}
            <span
              style={{
                marginLeft: wordmark ? `${R_GAP}em` : 0,
                letterSpacing: `${ls}em`,
                marginRight: `${-ls}em`,
                backgroundImage: textFill.startsWith("linear")
                  ? textFill
                  : undefined,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: textFill.startsWith("linear") ? "transparent" : textFill,
                paddingBottom: "0.08em",
              }}
            >
              {wordmark ? "emocn" : name}
            </span>
          </div>
        </div>

        {/* tagline */}
        {tagline ? (
          <div
            style={{
              position: "absolute",
              left: (width - tagMax) / 2,
              width: tagMax,
              top: tagTop,
              textAlign: "center",
              textWrap: "balance",
              fontFamily: geist.fontFamily,
              fontWeight: 400,
              fontSize: tagFs,
              lineHeight: 1.3,
              letterSpacing: "-0.012em",
              color: p.muted,
            }}
          >
            {words.map((w, i) => {
              const t = interpolate(frame, [56 + i * 2, 74 + i * 2], [0, 1], {
                ...CLAMP,
                easing: EASE_OUT,
              });
              return (
                <Fragment key={i}>
                  {i > 0 ? " " : null}
                  <span
                    style={{
                      display: "inline-block",
                      opacity: t,
                      transform: `translateY(${(1 - t) * 0.45}em)`,
                      filter: `blur(${(1 - t) * 6 * s}px)`,
                    }}
                  >
                    {w}
                  </span>
                </Fragment>
              );
            })}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}
