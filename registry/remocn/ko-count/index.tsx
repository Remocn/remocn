"use client";

import { loadFont } from "@remotion/google-fonts/BigShoulders";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadSerif } from "@remotion/google-fonts/Newsreader";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: shoulders } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
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

export interface KoCountProps {
  /** The full-frame word that slams in after the count. */
  word?: string;
  /** Serif italic line under the word. */
  subline?: string;
  /** Small label next to the count, bottom left. */
  label?: string;
  /** The count ticks. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (internal clock = frame + 1, 30fps, speed 1):
//   0–56   the count: 1 → 10, a hard cut on every number, gaps tightening
//          8 → 4 frames. Every numeral is a different crop, scale and tilt and
//          lands with a small slam; the camera kick grows with the count. 8 is
//          an inverted frame, 10 fills with the "fluted" gradient
//  64–69   hard cut: the word slams in from 1.6× with echoes
//  69–71   impact: two frames of solid gradient ground with the word knocked
//          out, then a decaying shake
//  80–98   the serif subline wipes in, the logo rises; poster hold
const GAPS = [8, 8, 7, 7, 6, 6, 5, 5, 4];
const HOLD_TEN = 8;
const SLAM_LEN = 5;
const IMPACT_LEN = 2;
const SUB_DELAY = 11;
const LOGO_DELAY = 19;

const SLAM = Easing.bezier(0.12, 0.9, 0.25, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "fluted": bg #050507, [#1d2a8f, #2f7bff, #ff7a3d, #ffe2c4].
const FLUTED = ["#1D2A8F", "#2F7BFF", "#FF7A3D", "#FFE2C4"] as const;

const THEMES = {
  dark: {
    stage: "#08080A",
    ink: "#F3F2EF",
    dim: "#86858C",
    off: "#2A2A30",
    fill: (a: number) =>
      `linear-gradient(${a}deg, ${FLUTED[1]} 0%, #6A63E6 32%, ${FLUTED[2]} 68%, ${FLUTED[3]} 100%)`,
    ground: (a: number) =>
      `linear-gradient(${a}deg, ${FLUTED[0]} 0%, ${FLUTED[1]} 35%, ${FLUTED[2]} 75%, ${FLUTED[3]} 100%)`,
    impactInk: "#08080A",
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    dim: "#7E7D77",
    off: "#DAD8D1",
    fill: (a: number) =>
      `linear-gradient(${a}deg, ${FLUTED[0]} 0%, ${FLUTED[1]} 38%, #C8552B 72%, ${FLUTED[2]} 100%)`,
    ground: (a: number) =>
      `linear-gradient(${a}deg, ${FLUTED[0]} 0%, ${FLUTED[1]} 40%, ${FLUTED[2]} 80%, ${FLUTED[3]} 100%)`,
    impactInk: "#FFFFFF",
  },
} as const;

// Big Shoulders 500: cap/figure height 0.8em, cap top 0.0855em below a
// line-height-1 box. Figures advance ~0.35em, "1" a little less.
const CAP = 0.8;
const CAP_TOP = 0.0855;
const FIG = 0.36;

// Each count is its own shot: size (× height), centre, tilt.
const SHOTS = [
  { fs: 1.05, x: 0.5, y: 0.5, r: 0 },
  { fs: 1.45, x: 0.33, y: 0.58, r: 0 },
  { fs: 0.82, x: 0.7, y: 0.47, r: -3 },
  { fs: 1.9, x: 0.56, y: 0.36, r: 0 },
  { fs: 1.25, x: 0.3, y: 0.52, r: -5 },
  { fs: 2.2, x: 0.64, y: 0.64, r: 4 },
  { fs: 1.4, x: 0.48, y: 0.5, r: -7 },
  { fs: 2.6, x: 0.4, y: 0.46, r: 6 },
  { fs: 1.75, x: 0.6, y: 0.56, r: -9 },
  { fs: 1.22, x: 0.5, y: 0.52, r: -6 },
] as const;

const WORDS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

/** Decaying camera shake that starts at `at`, stepped per frame. */
function shake(t: number, at: number, len: number, amp: number) {
  const d = Math.floor(t - at);
  if (d < 0 || d >= len) return { x: 0, y: 0 };
  const k = (1 - d / len) ** 2;
  return {
    x: amp * k * Math.sin(d * 2.4 + 0.6),
    y: amp * 0.6 * k * Math.cos(d * 3.1 + 0.3),
  };
}

export function KoCount({
  word = "Knockout",
  subline = "The old workflow did not get up.",
  label = "The count",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: KoCountProps) {
  const t = useCurrentFrame() * speed + 1;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);

  const countAt: number[] = [0];
  for (const g of GAPS) countAt.push(countAt[countAt.length - 1] + g);
  const koAt = countAt[9] + HOLD_TEN;
  const hitAt = koAt + SLAM_LEN;
  const subAt = hitAt + SUB_DELAY;
  const logoAt = hitAt + LOGO_DELAY;

  let idx = 0;
  for (let i = 0; i < 10; i++) if (t >= countAt[i]) idx = i;
  const counting = t < koAt;
  const local = t - countAt[idx];

  // ── Camera: a kick on every count, growing; a big one on the word ─────────
  const kickAmp = (3 + idx * 1.4) * u;
  const sk = counting ? shake(t, countAt[idx] + 2, 5, kickAmp) : { x: 0, y: 0 };
  const sh = shake(t, hitAt, 14, 22 * u);
  const camX = sk.x + sh.x;
  const camY = sk.y + sh.y;

  const shot = SHOTS[idx];
  const numFs = shot.fs * H;
  const numSlam = SLAM(ramp(local, 0, 3));
  const numScale = (1.16 - 0.16 * numSlam) * (1 + 0.035 * ramp(local, 3, 10));
  const inverted = counting && idx === 7;
  const stage = inverted ? c.ink : c.stage;
  const numInk = inverted ? c.stage : c.ink;
  const isTen = idx === 9;
  const digits = String(idx + 1);
  const angle = 100 + 14 * Math.sin(t / 30);

  // ── The word ──────────────────────────────────────────────────────────────
  const letters = word.length;
  const wordFs = Math.min((0.9 * W) / (letters * 0.45), 0.56 * H);
  const wordCapH = CAP * wordFs;
  const wordCy = 0.44 * H;
  const wordScale = (d: number) =>
    (1.6 - 0.6 * SLAM(ramp(d, koAt, SLAM_LEN))) *
    (1 + 0.025 * ramp(d, hitAt, 60));
  const impact = t >= hitAt && t < hitAt + IMPACT_LEN * speed;
  const subP = OUT(ramp(t, subAt, 12));
  const logoP = OUT(ramp(t, logoAt, 10));

  const hud = (ink: string, dim: string) => (
    <>
      <div
        style={{
          position: "absolute",
          left: 48 * u,
          bottom: 40 * u,
          display: "flex",
          alignItems: "baseline",
          gap: 16 * u,
        }}
      >
        <div
          style={{
            fontFamily: shoulders,
            fontWeight: 500,
            fontSize: 22 * u,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            color: dim,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 40 * u,
            letterSpacing: "-0.01em",
            color: ink,
          }}
        >
          {WORDS[idx]}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 48 * u,
          bottom: 48 * u,
          display: "flex",
          gap: 7 * u,
        }}
      >
        {WORDS.map((w, i) => (
          <div
            key={w}
            style={{
              width: 14 * u,
              height: 30 * u,
              transform: "skewX(-18deg)",
              background:
                i < idx
                  ? dim
                  : i === idx
                    ? isTen
                      ? c.fill(100)
                      : accent
                    : c.off,
              opacity: i < idx && inverted ? 0.6 : 1,
            }}
          />
        ))}
      </div>
    </>
  );

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: counting ? stage : impact ? c.ground(angle) : c.stage,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${camX}px, ${camY}px)`,
        }}
      >
        {counting ? (
          <>
            {/* The numeral, cropped by the frame. */}
            <div
              style={{
                position: "absolute",
                left: shot.x * W - W,
                width: 2 * W,
                top: shot.y * H - CAP_TOP * numFs - (CAP * numFs) / 2,
                display: "flex",
                justifyContent: "center",
                transform: `rotate(${shot.r}deg) scale(${numScale})`,
                transformOrigin: `50% ${CAP_TOP * numFs + (CAP * numFs) / 2}px`,
              }}
            >
              <div
                style={{
                  fontFamily: shoulders,
                  fontWeight: 500,
                  fontSize: numFs,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                  color: isTen ? "transparent" : numInk,
                  backgroundImage: isTen ? c.fill(angle) : undefined,
                  WebkitBackgroundClip: isTen ? "text" : undefined,
                  backgroundClip: isTen ? "text" : undefined,
                  width: digits.length * FIG * numFs * 1.1,
                  textAlign: "center",
                }}
              >
                {digits}
              </div>
            </div>
            {hud(numInk, inverted ? c.off : c.dim)}
          </>
        ) : (
          <>
            {/* The word, with echoes trailing the slam. */}
            {[4, 2, 0].map((lag) => {
              const ghost = lag > 0;
              if (ghost && t >= hitAt) return null;
              const tt = t - lag;
              const op = ramp(tt, koAt, 2) * (ghost ? 0.22 / lag : 1);
              return (
                <div
                  key={lag}
                  style={{
                    position: "absolute",
                    left: 0,
                    width: W,
                    top: wordCy - CAP_TOP * wordFs - wordCapH / 2,
                    display: "flex",
                    justifyContent: "center",
                    transform: `scale(${wordScale(tt)})`,
                    transformOrigin: `50% ${CAP_TOP * wordFs + wordCapH / 2}px`,
                    opacity: op,
                  }}
                >
                  <div
                    style={{
                      fontFamily: shoulders,
                      fontWeight: 500,
                      fontSize: wordFs,
                      lineHeight: 1,
                      letterSpacing: "-0.01em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      color: impact || ghost ? c.impactInk : "transparent",
                      backgroundImage:
                        impact || ghost ? undefined : c.fill(angle),
                      WebkitBackgroundClip:
                        impact || ghost ? undefined : "text",
                      backgroundClip: impact || ghost ? undefined : "text",
                      ...(ghost ? { color: c.ink } : {}),
                      paddingRight: 0.02 * wordFs,
                    }}
                  >
                    {word}
                  </div>
                </div>
              );
            })}

            {/* Subline wipes in from the left. */}
            {subP > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  width: W,
                  top: wordCy + wordCapH / 2 + 34 * u,
                  display: "flex",
                  justifyContent: "center",
                  fontFamily: serif,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: 50 * u,
                  lineHeight: 1.1,
                  letterSpacing: "-0.01em",
                  color: c.ink,
                  clipPath: `inset(-20% ${100 - 100 * subP}% -20% 0)`,
                  transform: `translateX(${(1 - subP) * -20 * u}px)`,
                }}
              >
                {subline}
              </div>
            ) : null}

            {logoP > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  width: W,
                  bottom: 44 * u,
                  display: "flex",
                  justifyContent: "center",
                  opacity: logoP,
                  transform: `translateY(${(1 - logoP) * 14 * u}px)`,
                }}
              >
                <RemocnLogo fontSize={34 * u} color={c.ink} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </AbsoluteFill>
  );
}
