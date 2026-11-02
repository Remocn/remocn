"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/Saira";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sairaItalic } = loadFont("italic", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: saira } = loadFont("normal", {
  weights: ["500"],
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

export interface ComboRating {
  /** The hit count this rating kicks in at. */
  from: number;
  text: string;
}

export interface ComboCounterProps {
  /** One hit per feature, in order. The combo count is the number of hits landed. */
  hits?: string[];
  /** Ratings, swapped in as the count passes `from`. The last one is the poster's. */
  ratings?: ComboRating[];
  /** Small marker next to the rating. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (30fps, speed 1):
//   6–66   twelve feature names hit one after another, the gaps shrinking from
//          8 frames to 4; each lands as a hit-spark (star flash + gradient
//          slash + the word slamming in from 1.4×) and fades after ~10 frames
//  14–66  the combo meter on the left counts from 2 up, every hit scales and
//          shakes it a bit harder; the rating swaps Nice → Great → PERFECT
//  66     finisher: the 12th hit, the frame flashes, PERFECT slams in
//  72–86  the meter glides to the centre and scales up into the poster, the
//          number fills with the "swirl" gradient
//  92–    the logo rises in, poster hold
const HIT_GAPS = [8, 7, 7, 6, 6, 5, 5, 4, 4, 4, 4];
const FIRST_HIT = 6;
const WORD_LIFE = 11;
const GLIDE_DELAY = 6;
const GLIDE_LEN = 14;
const FILL_DELAY = 10;
const FILL_LEN = 10;
const LOGO_DELAY = 26;

const SLAM = Easing.bezier(0.12, 0.9, 0.25, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const INOUT = Easing.bezier(0.65, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "swirl": bg #07060a, [#ffe2c4, #ff9a4d, #d2456b, #3a1f6b].
const SWIRL = ["#FFE2C4", "#FF9A4D", "#D2456B", "#3A1F6B"] as const;

const THEMES = {
  dark: {
    stage: "#08070B",
    ink: "#F3F2EF",
    dim: "#8A8990",
    flash: "#FFFFFF",
    number: `linear-gradient(170deg, ${SWIRL[0]} 6%, ${SWIRL[1]} 38%, ${SWIRL[2]} 72%, #8E3A9E 100%)`,
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    dim: "#7E7D77",
    flash: "#FFFFFF",
    number: `linear-gradient(170deg, ${SWIRL[1]} 4%, ${SWIRL[2]} 50%, ${SWIRL[3]} 100%)`,
  },
} as const;

// Where each hit lands, centre of the word, in units of W and H.
const SLOTS = [
  { x: 0.67, y: 0.3, r: -4 },
  { x: 0.79, y: 0.54, r: 3 },
  { x: 0.63, y: 0.74, r: -2 },
  { x: 0.8, y: 0.22, r: 4 },
  { x: 0.66, y: 0.5, r: -3 },
  { x: 0.78, y: 0.8, r: 2 },
];

// Long hit-slashes that stay behind the poster.
const POSTER_SLASHES = [
  { dx: -0.06, dy: 0, len: 0.42, thick: 9, delay: 0, op: 0.9 },
  { dx: 0.1, dy: 0.07, len: 0.26, thick: 4, delay: 2, op: 0.7 },
  { dx: -0.16, dy: -0.08, len: 0.18, thick: 3, delay: 3, op: 0.5 },
];

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

/** A short hit: up in 1 frame, eases back over `len`. */
function kick(d: number, len = 8) {
  if (d < 0) return 0;
  if (d < 1) return d;
  const k = Math.max(0, 1 - (d - 1) / len);
  return k * k;
}

function starPath(L: number, w: number) {
  return `M0 ${-L} L${w} ${-w} L${L} 0 L${w} ${w} L0 ${L} L${-w} ${w} L${-L} 0 L${-w} ${-w} Z`;
}

export function ComboCounter({
  hits = [
    "Captions",
    "Transitions",
    "Logo reveal",
    "Backgrounds",
    "Charts",
    "Text effects",
    "Lower thirds",
    "Mockups",
    "Countdowns",
    "Kinetic type",
    "Particles",
    "Templates",
  ],
  ratings = [
    { from: 2, text: "Nice" },
    { from: 6, text: "Great" },
    { from: 12, text: "PERFECT" },
  ],
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ComboCounterProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const times: number[] = [];
  hits.forEach((_, i) => {
    times.push(
      i === 0
        ? FIRST_HIT
        : times[i - 1] + (HIT_GAPS[i - 1] ?? HIT_GAPS[HIT_GAPS.length - 1]),
    );
  });
  const lastAt = times[times.length - 1] ?? FIRST_HIT;
  const n = times.filter((h) => t >= h).length;
  const lastHit = n > 0 ? times[n - 1] : -99;
  const final = n === hits.length;

  // ── Meter ─────────────────────────────────────────────────────────────────
  const numFs = 210 * u;
  const hitFs = 66 * u;
  const comboFs = 30 * u;
  const rateFs = 70 * u;
  const meterIn = n >= 2 ? OUT(ramp(t, times[1], 6)) : 0;
  const d = t - lastHit;
  const hitAmp = final ? 0.24 : 0.08 + 0.012 * n;
  const pop = 1 + hitAmp * kick(d, final ? 10 : 6);
  const shakeAmp = (final ? 16 : 3 + 0.9 * n) * u;
  const sd = Math.floor(d);
  const shakeK = sd >= 0 && sd < 8 ? (1 - sd / 8) ** 2 : 0;
  const shx = shakeAmp * shakeK * Math.sin(sd * 2.7 + 0.4);
  const shy = shakeAmp * 0.5 * shakeK * Math.cos(sd * 3.3);

  // Glide to the poster: the meter block is laid out from its left edge, so
  // the target x centres an estimate of its width (number + label column).
  const glide = INOUT(ramp(t, lastAt + GLIDE_DELAY, GLIDE_LEN));
  const digits = String(hits.length).length;
  const blockW = digits * 0.6 * numFs + 0.24 * numFs + 2.1 * hitFs;
  const posterK = 1.65;
  const gx = interpolate(
    glide,
    [0, 1],
    [0.075 * W, W / 2 - (blockW * posterK) / 2],
  );
  const gy = interpolate(glide, [0, 1], [0.47 * H, 0.47 * H]);
  const gk = interpolate(glide, [0, 1], [1, posterK]);
  const fillP = OUT(ramp(t, lastAt + FILL_DELAY, FILL_LEN));
  const logoP = OUT(ramp(t, lastAt + LOGO_DELAY, 10));

  const numberGlyphs = (text: string, gradient: boolean) => (
    <div
      style={{
        fontFamily: sairaItalic,
        fontStyle: "italic",
        fontWeight: 500,
        fontSize: numFs,
        lineHeight: 0.8,
        letterSpacing: "-0.03em",
        paddingRight: 0.08 * numFs,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
        ...(gradient
          ? {
              backgroundImage: c.number,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }
          : { color: c.ink }),
      }}
    >
      {text}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <linearGradient id={`${id}-sw`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={SWIRL[0]} />
            <stop offset="0.45" stopColor={SWIRL[1]} />
            <stop offset="1" stopColor={SWIRL[2]} />
          </linearGradient>
        </defs>
      </svg>

      {/* Hit-sparks: one per feature. */}
      {hits.map((word, i) => {
        const h = times[i];
        const dd = t - h;
        if (dd < 0 || dd > WORD_LIFE + 4) return null;
        const slot = SLOTS[i % SLOTS.length];
        const x = slot.x * W;
        const y = slot.y * H;
        const isFinal = i === hits.length - 1;
        const wordIn = SLAM(ramp(dd, 0, 4));
        const out = ramp(dd, WORD_LIFE - 3, 5);
        const starP = ramp(dd, 0, 7);
        const L =
          interpolate(OUT(starP), [0, 1], [50, isFinal ? 190 : 120]) * u;
        const streak = OUT(ramp(dd, 0, 3));
        const streakOut = ramp(dd, 3, 6);
        const sl = 0.2 * W * streak;
        return (
          <div key={`${i}-${word}`}>
            <svg
              width={W}
              height={H}
              style={{ position: "absolute", inset: 0 }}
              aria-hidden
            >
              <g
                transform={`translate(${x} ${y}) rotate(${-22 + slot.r})`}
                opacity={1 - streakOut}
              >
                <path
                  d={`M${-sl} 0 L0 ${-5 * u} L${sl} 0 L0 ${5 * u} Z`}
                  fill={`url(#${id}-sw)`}
                />
              </g>
              <g
                transform={`translate(${x - word.length * 0.25 * 62 * u - 34 * u} ${y - 6 * u})`}
                opacity={1 - starP}
              >
                <path d={starPath(L, 7 * u)} fill={`url(#${id}-sw)`} />
                <path
                  d={starPath(L * 0.45, 4 * u)}
                  fill={c.flash}
                  transform="rotate(45)"
                />
              </g>
            </svg>
            <div
              style={{
                position: "absolute",
                left: x - 0.3 * W,
                width: 0.6 * W,
                top: y - 50 * u,
                height: 100 * u,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `translateY(${-18 * u * out}px) rotate(${slot.r}deg) scale(${interpolate(wordIn, [0, 1], [1.4, 1]) * (1 - 0.08 * out)})`,
                opacity: ramp(dd, 0, 2) * (1 - out),
                fontFamily: sairaItalic,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 62 * u,
                lineHeight: 1,
                letterSpacing: "-0.01em",
                color: c.ink,
                whiteSpace: "nowrap",
              }}
            >
              {word}
            </div>
          </div>
        );
      })}

      {/* Poster slashes behind the meter. */}
      {glide > 0 ? (
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          {POSTER_SLASHES.map((p) => {
            const g = OUT(ramp(t, lastAt + GLIDE_DELAY + 6 + p.delay, 8));
            const len = p.len * W * g;
            return (
              <g
                key={p.dy}
                transform={`translate(${W / 2 + p.dx * W} ${0.4 * H + p.dy * H}) rotate(-22)`}
              >
                <path
                  d={`M${-len} 0 L0 ${-p.thick * u} L${len} 0 L0 ${p.thick * u} Z`}
                  fill={`url(#${id}-sw)`}
                  opacity={p.op}
                />
              </g>
            );
          })}
        </svg>
      ) : null}

      {/* The combo meter. */}
      {n >= 2 ? (
        <div
          style={{
            position: "absolute",
            left: gx,
            top: gy,
            transform: `translate(${shx}px, ${shy}px) translateY(-50%) scale(${gk})`,
            transformOrigin: "0% 50%",
            opacity: meterIn,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 0.16 * numFs,
            }}
          >
            <div
              style={{
                position: "relative",
                transform: `scale(${pop * interpolate(meterIn, [0, 1], [1.5, 1])})`,
                transformOrigin: "100% 100%",
              }}
            >
              {numberGlyphs(String(n), false)}
              {fillP > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    clipPath: `inset(0 ${(1 - fillP) * 100}% 0 0)`,
                  }}
                >
                  {numberGlyphs(String(n), true)}
                </div>
              ) : null}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                paddingBottom: 0.02 * numFs,
              }}
            >
              <div
                style={{
                  fontFamily: sairaItalic,
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: hitFs,
                  lineHeight: 0.9,
                  letterSpacing: "0.01em",
                  color: c.ink,
                }}
              >
                HIT
              </div>
              <div
                style={{
                  fontFamily: saira,
                  fontWeight: 500,
                  fontSize: comboFs,
                  lineHeight: 1,
                  letterSpacing: "0.28em",
                  color: c.dim,
                  marginTop: 0.12 * hitFs,
                }}
              >
                COMBO
              </div>
            </div>
          </div>

          {/* Rating: swaps as the combo climbs. */}
          <div
            style={{
              position: "relative",
              height: rateFs * 1.2,
              marginTop: 0.14 * numFs,
            }}
          >
            {ratings.map((r, k) => {
              const startAt = times[r.from - 1];
              if (startAt === undefined) return null;
              const next = ratings[k + 1];
              const endAt = next ? times[next.from - 1] : undefined;
              if (t < startAt) return null;
              if (endAt !== undefined && t >= endAt + 2) return null;
              const inP = SLAM(ramp(t, startAt, 5));
              const outP = endAt !== undefined ? ramp(t, endAt, 2) : 0;
              const isLast = k === ratings.length - 1;
              return (
                <div
                  key={r.text}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.28 * rateFs,
                    transform: `translateY(${-0.5 * rateFs * outP}px) scale(${interpolate(inP, [0, 1], [1.45, 1])})`,
                    transformOrigin: "0% 50%",
                    opacity: ramp(t, startAt + (k > 0 ? 1 : 0), 2) * (1 - outP),
                    whiteSpace: "nowrap",
                  }}
                >
                  <div
                    style={{
                      width: 0.16 * rateFs,
                      height: 0.62 * rateFs,
                      background: accent,
                      transform: "skewX(-14deg)",
                    }}
                  />
                  <div
                    style={{
                      fontFamily: sairaItalic,
                      fontStyle: "italic",
                      fontWeight: isLast ? 500 : 400,
                      fontSize: rateFs,
                      lineHeight: 1,
                      letterSpacing: isLast ? "0.06em" : "-0.01em",
                      color: c.ink,
                    }}
                  >
                    {r.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Logo. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: 0.88 * H,
          display: "flex",
          justifyContent: "center",
          opacity: logoP,
          transform: `translateY(${(1 - logoP) * 16 * u}px)`,
        }}
      >
        <RemocnLogo fontSize={30 * u} color={c.ink} />
      </div>
    </AbsoluteFill>
  );
}
