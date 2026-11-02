"use client";

import { loadFont } from "@remotion/google-fonts/Antonio";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: antonio } = loadFont("normal", {
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

export interface MvpStat {
  /** Final value. Counts from `from` (default 0) to here. */
  value: number;
  /** Where the count starts. Set it above `value` to count down. */
  from?: number;
  decimals?: number;
  suffix?: string;
  label: string;
}

export interface MvpCardProps {
  /** The huge word behind the card. */
  title?: string;
  /** Small label at the top right. */
  kicker?: string;
  /** Event line under the kicker. */
  event?: string;
  /** Role tag next to the logo on the card. */
  role?: string;
  /** Player number in the portrait corner. */
  number?: string;
  /** Three stat rows that count up inside the card. */
  stats?: MvpStat[];
  /** Small markers: kicker tick and stat ticks. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (30fps, speed 1):
//   0–9    the card slams up and open from its centre line, a little over-scaled
//   3–14   a light sweep crosses the card face; the frame kicks on landing
//   5–20   the giant "MVP" rises letter by letter right of the card, filled
//          with the "fluted" gradient, cap bottom on the card's bottom edge
//  11–23   logo, role tag, kicker and event line slide in
//  18–62   three stats count (the bug count runs down), staggered 8f, each
//          lights its marker when it lands
//  62–     poster hold
const SLAM = Easing.bezier(0.12, 0.9, 0.25, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const COUNT = Easing.bezier(0.3, 0.6, 0.15, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "fluted": bg #050507, [#1d2a8f, #2f7bff, #ff7a3d, #ffe2c4].
const FLUTED = ["#1D2A8F", "#2F7BFF", "#FF7A3D", "#FFE2C4"] as const;

// Antonio 500 advance widths (em) for caps, plus its cap height and the
// baseline position inside a line-height: 1 box.
const ADV: Record<string, number> = {
  A: 0.445,
  B: 0.455,
  C: 0.454,
  D: 0.471,
  E: 0.373,
  F: 0.369,
  G: 0.465,
  H: 0.486,
  I: 0.247,
  J: 0.435,
  K: 0.451,
  L: 0.345,
  M: 0.645,
  N: 0.5,
  O: 0.466,
  P: 0.441,
  Q: 0.466,
  R: 0.464,
  S: 0.409,
  T: 0.315,
  U: 0.472,
  V: 0.436,
  W: 0.656,
  X: 0.399,
  Y: 0.409,
  Z: 0.343,
  " ": 0.2,
};
const CAP = 0.859;
const BASELINE = 1.008;

const THEMES = {
  dark: {
    stage: "#060608",
    card: "#111114",
    edge: "#26262C",
    rule: "#222228",
    ink: "#F3F2EF",
    dim: "#86858C",
    title: (a: number) =>
      `linear-gradient(${172 + a}deg, ${FLUTED[3]} 0%, ${FLUTED[2]} 30%, #B2507A 52%, ${FLUTED[1]} 76%, ${FLUTED[0]} 100%)`,
  },
  light: {
    stage: "#F5F4F0",
    card: "#FFFFFF",
    edge: "#E3E1DA",
    rule: "#ECEAE4",
    ink: "#121214",
    dim: "#7E7D77",
    title: (a: number) =>
      `linear-gradient(${172 + a}deg, ${FLUTED[2]} 0%, #C9466A 34%, ${FLUTED[1]} 70%, ${FLUTED[0]} 100%)`,
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

/** A hit: up in 1 frame, eases back over `len`. */
function kick(d: number, len = 8) {
  if (d < 0) return 0;
  if (d < 1) return d;
  const k = Math.max(0, 1 - (d - 1) / len);
  return k * k;
}

export function MvpCard({
  title = "MVP",
  kicker = "Most valuable player",
  event = "Grand final 2026",
  role = "Carry",
  number = "01",
  stats = [
    { value: 12.4, decimals: 1, label: "Renders / min" },
    { value: 0, from: 37, label: "Bugs" },
    { value: 100, suffix: "%", label: "Uptime" },
  ],
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: MvpCardProps) {
  const t = useCurrentFrame() * speed + 1;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);

  // ── Layout ────────────────────────────────────────────────────────────────
  const cardW = 384 * u;
  const cardH = 628 * u;
  const cardX = W / 2 - 576 * u;
  const cardY = (H - cardH) / 2;
  const pad = 26 * u;
  const portraitH = 236 * u;
  const nameH = 86 * u;
  const rowH =
    (cardH - portraitH - nameH - pad * 0.6) / Math.max(1, stats.length);
  const corner = 34 * u;

  const titleLeft = cardX + cardW + 40 * u;
  const titleRight = W - 48 * u;
  const letters = Array.from(title.toUpperCase());
  const track = -0.01;
  const advSum = letters.reduce(
    (a, ch) => a + (ADV[ch] ?? 0.45) + track,
    -track,
  );
  const titleFs = Math.min(560 * u, (titleRight - titleLeft) / advSum);
  const letterX: number[] = [];
  letters.reduce((x, ch) => {
    letterX.push(x);
    return x + ((ADV[ch] ?? 0.45) + track) * titleFs;
  }, 0);
  const titleW = advSum * titleFs;
  const capBottom = cardY + cardH;

  // ── Entrance ──────────────────────────────────────────────────────────────
  const open = SLAM(ramp(t, 0, 6));
  const settle = SLAM(ramp(t, 0, 9));
  const cardScale = 1 + 0.07 * (1 - settle);
  const cardLift = (1 - settle) * 46 * u;
  const sweep = interpolate(t, [3, 14], [-0.6, 1.6], CLAMP);
  const nameIn = OUT(ramp(t, 11, 10));
  const kickerIn = OUT(ramp(t, 13, 10));
  const lettersAt = (i: number) => 5 + i * 3;
  const lastLetter = lettersAt(letters.length - 1) + 5;
  const hit = Math.max(kick(t - 4, 8), kick(t - lastLetter, 9) * 0.8);
  const drift = interpolate(t, [0, 120], [0, 8], CLAMP);

  const statAt = (i: number) => 18 + i * 8;
  const statLen = 22;

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${1 + 0.012 * hit})`,
        }}
      >
        {/* Kicker and event line, top right. */}
        <div
          style={{
            position: "absolute",
            left: titleLeft + 6 * u,
            top: cardY + 4 * u,
            opacity: kickerIn,
            transform: `translateX(${(1 - kickerIn) * 30 * u}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14 * u,
              fontFamily: antonio,
              fontWeight: 500,
              fontSize: 24 * u,
              lineHeight: 1,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: c.dim,
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ width: 30 * u, height: 4 * u, background: accent }} />
            {kicker}
          </div>
          <div
            style={{
              marginTop: 14 * u,
              fontFamily: antonio,
              fontWeight: 400,
              fontSize: 78 * u,
              lineHeight: 1,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: c.ink,
              whiteSpace: "nowrap",
            }}
          >
            {event}
          </div>
        </div>

        {/* The giant title, rising letter by letter, cap bottom on the card bottom. */}
        <div
          style={{
            position: "absolute",
            left: titleLeft,
            width: titleW,
            top: capBottom - (CAP + 0.03) * titleFs,
            height: (CAP + 0.03) * titleFs + 2 * u,
            overflow: "hidden",
          }}
        >
          {letters.map((ch, i) => {
            const p = SLAM(ramp(t, lettersAt(i), 9));
            return (
              <span
                key={`${i}-${ch}`}
                style={{
                  position: "absolute",
                  left: letterX[i],
                  top: (CAP + 0.03) * titleFs - BASELINE * titleFs,
                  fontFamily: antonio,
                  fontWeight: 500,
                  fontSize: titleFs,
                  lineHeight: 1,
                  backgroundImage: c.title(drift),
                  backgroundSize: `${titleW}px ${titleFs * 1.1}px`,
                  backgroundPosition: `${-letterX[i]}px ${0.1 * titleFs}px`,
                  backgroundRepeat: "no-repeat",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  transform: `translateY(${(1 - p) * (CAP + 0.06) * titleFs}px)`,
                  whiteSpace: "pre",
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>

        {/* The card. */}
        <div
          style={{
            position: "absolute",
            left: cardX,
            top: cardY,
            width: cardW,
            height: cardH,
            transform: `translateY(${cardLift}px) scale(${cardScale})`,
            clipPath: `inset(${50 * (1 - open)}% 0 ${50 * (1 - open)}% 0)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `polygon(0 0, calc(100% - ${corner}px) 0, 100% ${corner}px, 100% 100%, 0 100%)`,
              background: c.card,
              boxShadow: `inset 0 0 0 ${1.5 * u}px ${c.edge}`,
              overflow: "hidden",
            }}
          >
            {/* Portrait: the R mark as the player. */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: cardW,
                height: portraitH,
                overflow: "hidden",
                background: [
                  `radial-gradient(70% 80% at ${78 - drift}% 18%, ${FLUTED[2]} 0%, transparent 62%)`,
                  `radial-gradient(60% 70% at ${70 - drift * 0.5}% 6%, ${FLUTED[3]}cc 0%, transparent 46%)`,
                  `radial-gradient(90% 90% at ${14 + drift}% 96%, ${FLUTED[1]} 0%, transparent 70%)`,
                  `linear-gradient(160deg, #B2507A 0%, ${FLUTED[0]} 100%)`,
                ].join(", "),
              }}
            >
              <svg
                viewBox="0 0 124.06 134.26"
                height={234 * u}
                width={(234 * u * 124.06) / 134.26}
                style={{
                  position: "absolute",
                  left: cardW / 2 - (234 * u * 124.06) / 134.26 / 2 + 6 * u,
                  bottom: -26 * u,
                  transform: `translateY(${(1 - nameIn) * 30 * u}px)`,
                }}
                aria-hidden
              >
                <path fill="#FFFFFF" d={REMOCN_R_PATH} />
              </svg>
              <div
                style={{
                  position: "absolute",
                  left: pad,
                  top: pad - 4 * u,
                  fontFamily: antonio,
                  fontWeight: 500,
                  fontSize: 64 * u,
                  lineHeight: 1,
                  letterSpacing: "-0.01em",
                  color: "#FFFFFF",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {number}
              </div>
            </div>

            {/* Name row. */}
            <div
              style={{
                position: "absolute",
                left: pad,
                right: pad,
                top: portraitH,
                height: nameH,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: `${1.5 * u}px solid ${c.rule}`,
                opacity: nameIn,
                transform: `translateX(${(1 - nameIn) * 24 * u}px)`,
              }}
            >
              <RemocnLogo fontSize={54 * u} color={c.ink} />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10 * u,
                  height: 36 * u,
                  padding: `0 ${14 * u}px`,
                  background: accent,
                  fontFamily: antonio,
                  fontWeight: 500,
                  fontSize: 23 * u,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#FFFFFF",
                  paddingTop: 2 * u,
                }}
              >
                {role}
              </div>
            </div>

            {/* Stats. */}
            {stats.map((s, i) => {
              const at = statAt(i);
              const p = COUNT(ramp(t, at, statLen));
              const from = s.from ?? 0;
              const v = from + (s.value - from) * p;
              const dec = s.decimals ?? 0;
              const shown = `${v.toFixed(dec)}${s.suffix ?? ""}`;
              const rowIn = OUT(ramp(t, at - 2, 8));
              const land = kick(t - at - statLen, 9);
              return (
                <div
                  key={`${i}-${s.label}`}
                  style={{
                    position: "absolute",
                    left: pad,
                    right: pad,
                    top: portraitH + nameH + i * rowH,
                    height: rowH,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom:
                      i < stats.length - 1
                        ? `${1.5 * u}px solid ${c.rule}`
                        : "none",
                    opacity: rowIn,
                    transform: `translateY(${(1 - rowIn) * 16 * u}px)`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: antonio,
                      fontWeight: 500,
                      fontSize: 78 * u,
                      lineHeight: 1,
                      letterSpacing: "-0.01em",
                      fontVariantNumeric: "tabular-nums",
                      color: c.ink,
                      paddingTop: 4 * u,
                      transform: `scale(${1 + 0.06 * land})`,
                      transformOrigin: "left center",
                    }}
                  >
                    {shown}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10 * u,
                      fontFamily: antonio,
                      fontWeight: 500,
                      fontSize: 24 * u,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: c.dim,
                    }}
                  >
                    {s.label}
                    <div
                      style={{
                        width: 8 * u,
                        height: 8 * u,
                        background: p >= 1 ? accent : c.rule,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Light sweep across the face. */}
            <div
              style={{
                position: "absolute",
                top: -cardH * 0.2,
                height: cardH * 1.4,
                left: sweep * cardW - cardW * 0.35,
                width: cardW * 0.7,
                transform: "skewX(-18deg)",
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 46%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.5) 54%, rgba(255,255,255,0) 100%)",
                opacity: sweep > -0.6 && sweep < 1.6 ? 0.85 : 0,
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
