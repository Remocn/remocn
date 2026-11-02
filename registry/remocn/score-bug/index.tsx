"use client";

import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: condensed } = loadFont("normal", {
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

export interface ScoreBugProps {
  /** The opponent's name, set in caps on the right block. The left block is always the remocn logo. */
  away?: string;
  /** Goals remocn scores, one digit flip each. */
  score?: number;
  /** The opponent's score, shown from the start. */
  awayScore?: number;
  /** One scorer line per goal, under the remocn block. Use the prime for minutes: "Ship 47′". */
  scorers?: string[];
  /** Word on the flash band that sweeps across after the last goal. */
  flash?: string;
  /** Tab label while the match runs. */
  liveLabel?: string;
  /** Tab label once the band has passed. */
  finalLabel?: string;
  /** The live marker in the tab and the scorer ticks. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (internal clock = frame + 2, 30fps, speed 1, score 2):
//  -2–4    the white score core slams open from its centre line
//   3–13   both team blocks shoot out from behind the core; names follow
//  12–19   the "Live" tab rises from behind the panel
//  30      goal: the home digit flips 0→1 (6f), the panel kicks, the remocn
//          block flashes and the scorer line drops in under it
//  48      goal: 1→2, same mechanic
//  60–82   the gradient "Shipped" band sweeps across; while it covers the
//          panel the tab turns to "Full time" and the opponent dims
//  82–     poster scoreline holds
const GOAL_AT = 30;
const GOAL_GAP = 18;
const FLIP = 6;
const BAND_DELAY = 12;
const BAND_IN = 7;
const BAND_HOLD = 9;
const BAND_OUT = 7;

const SLAM = Easing.bezier(0.22, 1, 0.36, 1);
const FLIPEASE = Easing.bezier(0.7, 0, 0.25, 1);
const EXIT = Easing.bezier(0.6, 0, 0.9, 0.4);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "beam": #f4f7ff, #8fb4ff, #3d5bff, #1a1660.
const BEAM = ["#F4F7FF", "#8FB4FF", "#3D5BFF", "#1A1660"] as const;

const THEMES = {
  dark: {
    stage: "#0A0A0B",
    core: "#F3F2EF",
    coreInk: "#0A0A0B",
    coreRule: "#D9D7D1",
    away: "#1C1C20",
    awayOff: "#131316",
    awayInk: "#F3F2EF",
    awayDim: "#4D4C53",
    tab: "#1C1C20",
    tabInk: "#F3F2EF",
    dim: "#86858C",
  },
  light: {
    stage: "#F5F4F0",
    core: "#121214",
    coreInk: "#F5F4F0",
    coreRule: "#2A2A2E",
    away: "#E2E0D9",
    awayOff: "#EAE8E2",
    awayInk: "#121214",
    awayDim: "#B3B1AA",
    tab: "#121214",
    tabInk: "#F5F4F0",
    dim: "#7E7D77",
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

/** A short hit: up in 2 frames, eases back over 9. */
function kick(d: number) {
  if (d < 0) return 0;
  if (d < 2) return d / 2;
  const k = Math.max(0, 1 - (d - 2) / 9);
  return k * k;
}

export function ScoreBug({
  away = "Old way",
  score = 2,
  awayScore = 0,
  scorers = ["Install 12′", "Ship 47′"],
  flash = "Shipped",
  liveLabel = "Live · 2nd half",
  finalLabel = "Full time",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ScoreBugProps) {
  // Starts two frames in, so frame 0 already shows the core opening.
  const t = useCurrentFrame() * speed + 2;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);

  const goals = Math.max(0, Math.floor(score));
  const goalAt = Array.from(
    { length: goals },
    (_, i) => GOAL_AT + i * GOAL_GAP,
  );
  const bandAt = (goalAt[goals - 1] ?? GOAL_AT - GOAL_GAP) + BAND_DELAY;
  const fullTimeAt = bandAt + BAND_IN + 4;
  const fullTime = t >= fullTimeAt;

  // ── Layout ────────────────────────────────────────────────────────────────
  const panelW = 1160 * u;
  const panelH = 250 * u;
  const coreW = 360 * u;
  const gap = 8 * u;
  const blockW = (panelW - coreW - 2 * gap) / 2;
  const panelX = (W - panelW) / 2;
  const panelY = (H - panelH) / 2 - 14 * u;
  const tabH = 52 * u;
  const digitFs = 270 * u;
  const cellW = 140 * u;

  // ── Entrance ──────────────────────────────────────────────────────────────
  const coreOpen = SLAM(ramp(t, 0, 6));
  const blockOut = SLAM(ramp(t, 3, 10));
  const nameIn = SLAM(ramp(t, 8, 9));
  const digitIn = SLAM(ramp(t, 6, 8));
  const tabUp = SLAM(ramp(t, 12, 8));

  // Every hit nudges the panel up in scale for a beat.
  const hits = [5, ...goalAt.map((g) => g + 2)];
  const bump = hits.reduce((a, h) => Math.max(a, kick(t - h)), 0);
  const panelScale = 1 + 0.022 * bump;

  // Home digit: which goal is flipping, and how far.
  let home = 0;
  let flipP = 1;
  for (let i = 0; i < goals; i++) {
    if (t >= goalAt[i]) {
      home = i + 1;
      flipP = FLIPEASE(ramp(t, goalAt[i], FLIP));
    }
  }
  const prev = home - 1;

  const blockFlash = goalAt.reduce((a, g) => {
    const d = t - g - 1;
    if (d < 0 || d > 10) return a;
    return Math.max(a, (1 - d / 10) ** 2);
  }, 0);

  const awayDimP = ramp(t, fullTimeAt, 6);
  const awayBg = fullTime ? c.awayOff : c.away;
  const awayInk = awayDimP > 0 ? c.awayDim : c.awayInk;

  // Gentle drift on the home block's gradient.
  const drift = interpolate(t, [0, 120], [0, 10], CLAMP);
  const homeGround = [
    `radial-gradient(70% 140% at ${10 + drift}% 0%, ${BEAM[1]}e6 0%, transparent 62%)`,
    `radial-gradient(60% 120% at ${96 - drift * 0.6}% 110%, ${BEAM[2]} 0%, transparent 72%)`,
    `linear-gradient(115deg, ${BEAM[3]} 0%, #2B3BCF 100%)`,
  ].join(", ");

  // ── Band ──────────────────────────────────────────────────────────────────
  const rowH = 40 * u;
  const bandTop = panelY - tabH - gap - 14 * u;
  const bandBottom =
    panelY +
    panelH +
    14 * u +
    Math.max(1, Math.min(goals, scorers.length)) * rowH +
    14 * u;
  const bandH = bandBottom - bandTop;
  const slant = 0.2 * bandH;
  const bandIn = SLAM(ramp(t, bandAt, BAND_IN));
  const bandOut = EXIT(ramp(t, bandAt + BAND_IN + BAND_HOLD, BAND_OUT));
  const span = W + 2 * slant;
  const bandX = -span * (1 - bandIn) + span * bandOut;
  const hold = ramp(t, bandAt + BAND_IN, BAND_HOLD);
  const textLag =
    -0.16 * W * (1 - bandIn) + 0.025 * W * hold + 0.22 * W * bandOut;
  const bandVisible = t >= bandAt && bandOut < 1;
  const bandY = bandTop;

  const digit = (n: number, y: number, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: panelH,
        transform: `translateY(${y}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: condensed,
        fontWeight: 500,
        fontSize: digitFs,
        lineHeight: 1,
        color: c.coreInk,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.02em",
        paddingTop: 4 * u,
      }}
    >
      {n}
    </div>
  );

  const dropIn = -(1 - digitIn) * panelH * 1.05;

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${panelScale})`,
          transformOrigin: `${W / 2}px ${panelY + panelH / 2}px`,
        }}
      >
        {/* Tab, rising from behind the panel. */}
        <div
          style={{
            position: "absolute",
            left: panelX + blockW + gap,
            top: panelY - tabH - gap,
            width: coreW,
            height: tabH + gap,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: coreW,
              height: tabH,
              transform: `translateY(${(1 - tabUp) * (tabH + gap)}px)`,
              background: c.tab,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12 * u,
              fontFamily: condensed,
              fontWeight: 500,
              fontSize: 28 * u,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: c.tabInk,
            }}
          >
            {fullTime ? null : (
              <div
                style={{
                  width: 11 * u,
                  height: 11 * u,
                  background: accent,
                  opacity: Math.floor(t / 15) % 2 === 0 ? 1 : 0.35,
                }}
              />
            )}
            <span style={{ paddingTop: 2 * u }}>
              {fullTime ? finalLabel : liveLabel}
            </span>
          </div>
        </div>

        {/* Home block: emerges from behind the core to the left. */}
        <div
          style={{
            position: "absolute",
            left: panelX,
            top: panelY,
            width: blockW,
            height: panelH,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateX(${(1 - blockOut) * (blockW + gap)}px)`,
              background: homeGround,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#FFFFFF",
                opacity: 0.4 * blockFlash,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `translateX(${(1 - nameIn) * 60 * u}px)`,
                opacity: nameIn,
              }}
            >
              <RemocnLogo fontSize={86 * u} color="#FFFFFF" />
            </div>
          </div>
        </div>

        {/* Away block: emerges from behind the core to the right. */}
        <div
          style={{
            position: "absolute",
            left: panelX + blockW + coreW + 2 * gap,
            top: panelY,
            width: blockW,
            height: panelH,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateX(${-(1 - blockOut) * (blockW + gap)}px)`,
              background: awayBg,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `translateX(${-(1 - nameIn) * 60 * u}px)`,
                opacity: nameIn,
                fontFamily: condensed,
                fontWeight: 500,
                fontSize: 116 * u,
                lineHeight: 1,
                letterSpacing: "0.005em",
                textTransform: "uppercase",
                color: awayInk,
                paddingTop: 6 * u,
                whiteSpace: "nowrap",
              }}
            >
              {away}
            </div>
          </div>
        </div>

        {/* Core: the score itself. */}
        <div
          style={{
            position: "absolute",
            left: panelX + blockW + gap,
            top: panelY,
            width: coreW,
            height: panelH,
            background: c.core,
            clipPath: `inset(${50 * (1 - coreOpen)}% 0 ${50 * (1 - coreOpen)}% 0)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: coreW / 2 - 22 * u - cellW,
              top: 0,
              width: cellW,
              height: panelH,
              overflow: "hidden",
            }}
          >
            {flipP < 1 && prev >= 0
              ? [
                  digit(prev, -flipP * panelH, "out"),
                  digit(home, (1 - flipP) * panelH, "in"),
                ]
              : digit(home, dropIn, "now")}
          </div>
          <div
            style={{
              position: "absolute",
              left: coreW / 2 - 15 * u,
              top: panelH / 2 - 4 * u,
              width: 30 * u,
              height: 9 * u,
              background: c.coreRule,
              opacity: digitIn,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: coreW / 2 + 22 * u,
              top: 0,
              width: cellW,
              height: panelH,
              overflow: "hidden",
            }}
          >
            {digit(awayScore, dropIn, "away")}
          </div>
        </div>

        {/* Scorer lines under the home block. */}
        {scorers.slice(0, goals).map((line, i) => {
          const p = SLAM(ramp(t, goalAt[i] + 4, 8));
          return (
            <div
              key={`${i}-${line}`}
              style={{
                position: "absolute",
                left: panelX,
                top: panelY + panelH + 14 * u + i * rowH,
                width: blockW,
                height: rowH,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12 * u,
                  height: rowH,
                  transform: `translateY(${-(1 - p) * rowH}px)`,
                  fontFamily: condensed,
                  fontWeight: 500,
                  fontSize: 30 * u,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: c.dim,
                }}
              >
                <div
                  style={{
                    width: 4 * u,
                    height: 20 * u,
                    background: accent,
                    flexShrink: 0,
                  }}
                />
                <span style={{ paddingTop: 2 * u }}>{line}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* The flash band. */}
      {bandVisible ? (
        <div
          style={{
            position: "absolute",
            left: bandX - slant,
            top: bandY,
            width: span,
            height: bandH,
            clipPath: `polygon(${slant}px 0, 100% 0, calc(100% - ${slant}px) 100%, 0 100%)`,
            background: `linear-gradient(90deg, ${BEAM[3]} 0%, #2A3BD8 40%, ${BEAM[2]} 72%, ${BEAM[1]} 93%, ${BEAM[0]} 100%)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `translateX(${textLag}px)`,
              fontFamily: condensed,
              fontWeight: 500,
              fontSize: 340 * u,
              lineHeight: 1,
              letterSpacing: "0.01em",
              textTransform: "uppercase",
              color: "#FFFFFF",
              paddingTop: 10 * u,
              whiteSpace: "nowrap",
            }}
          >
            {flash}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
