"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const { fontFamily: grotesk } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: serifItalic } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

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

export interface MilestoneRollProps {
  /** Milestones the counter races through, ascending. The last one is the poster. */
  milestones?: number[];
  /** What is being counted, set in the serif italic on the poster and in the top label. */
  unit?: string;
  /** Kept for the shared draft API; the colour comes from the halo ground. */
  accent?: string;
  theme?: "dark" | "light";
  /** gradients.sh preset id for the ground. */
  ground?: GshPresetId;
  /** Overrides for the ground shader. */
  groundParams?: Partial<GradientParams>;
  speed?: number;
}

const RUN = 15;
const HOLD = 14;
const OUT = 6;
const SEG = RUN + HOLD + OUT;
const FIRST = -2;

const RACE = Easing.bezier(0.55, 0, 1, 0.45);
const MOVE = Easing.bezier(0.83, 0, 0.17, 1);
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const MORPH = { damping: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    stage: "#030306",
    ink: "#F7F3EE",
    flash: "#FFF6E8",
    flashAlpha: 0.7,
    preset: "iris" as GshPresetId,
    params: { background: "#030306" } as Partial<GradientParams>,
    veil: [0.5, 0.38, 0.24, 0.12],
    final: 0.08,
    ring: [0.8, 1.05, 1.35, 1.7],
    finalRing: 2.5,
  },
  light: {
    stage: "#F4F0EA",
    ink: "#16121A",
    flash: "#FFFFFF",
    flashAlpha: 0.8,
    preset: "iris" as GshPresetId,
    params: {
      background: "#F4F0EA",
      colors: ["#FFFFFF", "#FFB25A", "#EF4F86", "#4058FF"],
    } as Partial<GradientParams>,
    veil: [0.5, 0.4, 0.28, 0.16],
    final: 0.1,
    ring: [0.8, 1.05, 1.35, 1.7],
    finalRing: 2.5,
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

function kick(d: number) {
  if (d < 0) return 0;
  if (d < 2) return d / 2;
  const k = Math.max(0, 1 - (d - 2) / 8);
  return k * k;
}

function shake(d: number, amp: number, seed: number) {
  if (d < 0 || d > 7) return { x: 0, y: 0 };
  const k = (1 - d / 7) ** 2;
  return {
    x: amp * k * Math.sin(d * 2.7 + seed),
    y: amp * 0.7 * k * Math.cos(d * 3.3 + seed * 1.7),
  };
}

function abbreviate(n: number) {
  if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${+(n / 1e3).toFixed(1)}K`;
  return `${n}`;
}

function withCommas(n: number) {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function MilestoneRoll({
  milestones = [1000, 10000, 100000, 1000000],
  unit = "renders",
  theme = "dark",
  ground,
  groundParams,
  speed = 1,
}: MilestoneRollProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const tall = H > W;
  const base = tall ? W * 0.62 : H;
  const u = Math.min(W / 1280, H / 720);

  const n = milestones.length;
  const hitAt = (i: number) => FIRST + i * SEG + RUN;
  const finalAt = hitAt(n - 1);

  let hit = -1;
  for (let i = 0; i < n; i++) if (t >= hitAt(i)) hit = i;
  const isFinal = hit === n - 1;

  const step = (arr: readonly number[], i: number) =>
    arr[Math.max(0, Math.min(arr.length - 1, i))];
  let ring: number = c.ring[0];
  let veil: number = c.veil[0];
  for (let i = 0; i < n; i++) {
    const k = spring({ frame: t - hitAt(i), fps, config: HEAVY });
    const toRing = i === n - 1 ? c.finalRing : step(c.ring, i + 1);
    const toVeil = i === n - 1 ? c.final : step(c.veil, i + 1);
    ring += (toRing - step(c.ring, i)) * k;
    veil += (toVeil - step(c.veil, i)) * Math.min(1, k);
  }
  const breathe = interpolate(t, [0, 180], [0, 1], CLAMP);
  const flash = hit >= 0 ? Math.max(0, 1 - (t - hitAt(hit)) / 4) ** 2 : 0;

  const runIdx = hit + 1;
  const runStart = FIRST + runIdx * SEG;
  const from = runIdx === 0 ? 0 : milestones[runIdx - 1];
  const to = milestones[Math.min(runIdx, n - 1)];
  const race = RACE(ramp(t, runStart, RUN));
  const value = from + (to - from) * race;

  const h = hit >= 0 && !isFinal ? hitAt(hit) : -1e9;
  const pPunch = spring({ frame: Math.min(t - h, 60), fps, config: CARD });
  const push = MOVE(ramp(t, h + HOLD, OUT));
  const pushDist = 0.8 * H;
  const inHit = hit >= 0 && !isFinal && t < h + HOLD + OUT;

  let bump = 0;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    const d = t - hitAt(i) - 3;
    bump = Math.max(bump, (i === n - 1 ? 1.3 : 0.9) * kick(d));
    const s = shake(d, (i === n - 1 ? 9 : 6) * u, i * 1.9);
    sx += s.x;
    sy += s.y;
  }
  const camScale = 1 + 0.03 * bump;

  const runFs = 0.28 * base;
  const hugeFs = 0.56 * base;
  const finalText = withCommas(milestones[n - 1]);
  const digits = finalText.replace(/,/g, "").length;
  const commas = finalText.length - digits;
  const finalFs = Math.min(
    0.3 * base,
    (0.84 * W) / (digits * 0.6 + commas * 0.26),
  );

  const numberStyle = {
    fontFamily: grotesk,
    fontWeight: 300,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
    whiteSpace: "nowrap",
  } as const;

  const pFinal = spring({ frame: t - finalAt, fps, config: CARD });
  const pUnit = spring({ frame: t - finalAt - 6, fps, config: MORPH });
  const pLogo = spring({ frame: t - finalAt - 12, fps, config: MORPH });
  const creep = interpolate(t, [finalAt + 4, finalAt + 70], [1, 1.035], {
    ...CLAMP,
    easing: CAMERA,
  });

  const chromeOut = isFinal ? 1 - ENTER(ramp(t, finalAt, 6)) : 1;
  const runFill = isFinal ? 1 : inHit ? 1 : race;
  const margin = (tall ? 0.07 : 0.05) * W;
  const labelFs = (tall ? 0.017 : 0.025) * H;

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${ring * (1 + 0.04 * breathe)}) rotate(${-8 * breathe}deg)`,
        }}
      >
        <GshGround
          preset={ground ?? c.preset}
          params={groundParams ?? c.params}
          timeOffset={2}
          timeScale={0.5}
          style={{ width: "100%", height: "100%" }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: c.stage, opacity: veil }} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${sx}px, ${sy}px) scale(${camScale})`,
          transformOrigin: "50% 50%",
          color: c.ink,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: margin,
            right: margin,
            top: (tall ? 0.06 : 0.07) * H,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: mono,
            fontWeight: 400,
            fontSize: labelFs,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            opacity: chromeOut * ENTER(ramp(t, 0, 10)),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0.5 * labelFs,
            }}
          >
            <div
              style={{
                width: 0.4 * labelFs,
                height: 0.4 * labelFs,
                borderRadius: labelFs,
                background: c.ink,
              }}
            />
            {unit}
          </div>
          <div style={{ display: "flex", gap: 1.4 * labelFs }}>
            {milestones.map((m, i) => (
              <div
                key={m}
                style={{
                  opacity: i <= hit ? 1 : 0.4,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {abbreviate(m)}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: margin,
            right: margin,
            bottom: (tall ? 0.06 : 0.08) * H,
            height: Math.max(2, 2 * u),
            opacity: chromeOut * ENTER(ramp(t, 0, 10)),
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: c.ink,
              opacity: 0.2,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "100%",
              transform: `scaleX(${runFill})`,
              transformOrigin: "0% 50%",
              background: c.ink,
            }}
          />
        </div>

        {!isFinal && (!inHit || t >= h + HOLD) ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `translateY(${inHit ? (1 - push) * pushDist : 0}px)`,
            }}
          >
            <div
              style={{
                ...numberStyle,
                fontSize: runFs,
                letterSpacing: "-0.04em",
              }}
            >
              {withCommas(inHit ? milestones[hit] : value)}
            </div>
          </div>
        ) : null}

        {inHit ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `translateY(${-push * pushDist}px) scale(${1.3 - 0.3 * pPunch})`,
              filter:
                pPunch < 0.9
                  ? `blur(${Math.max(0, 1 - pPunch) ** 2 * 14 * u}px)`
                  : undefined,
            }}
          >
            <div
              style={{
                ...numberStyle,
                fontSize: hugeFs,
                letterSpacing: "-0.055em",
                paddingRight: 0.02 * hugeFs,
              }}
            >
              {abbreviate(milestones[hit])}
            </div>
          </div>
        ) : null}

        {isFinal ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${creep})`,
            }}
          >
            <div
              style={{
                ...numberStyle,
                fontSize: finalFs,
                letterSpacing: "-0.05em",
                transform: `scale(${1.25 - 0.25 * pFinal})`,
                filter:
                  pFinal < 0.9
                    ? `blur(${Math.max(0, 1 - pFinal) ** 2 * 14 * u}px)`
                    : undefined,
                opacity: ramp(t, finalAt - 1, 2),
              }}
            >
              {finalText}
            </div>
            <div
              style={{
                fontFamily: serifItalic,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 0.16 * base,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                marginTop: 0.005 * base,
                opacity: ramp(t, finalAt + 6, 4),
                transform: `translateY(${(1 - pUnit) * 0.06 * base}px)`,
              }}
            >
              {unit}
            </div>
          </div>
        ) : null}
        {isFinal ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: (tall ? 0.07 : 0.075) * H,
              display: "flex",
              justifyContent: "center",
              opacity: ramp(t, finalAt + 12, 5),
              transform: `translateY(${(1 - pLogo) * 0.04 * H}px)`,
            }}
          >
            <RemocnLogo fontSize={(tall ? 0.024 : 0.05) * H} color={c.ink} />
          </div>
        ) : null}
      </div>

      {flash > 0.01 ? (
        <AbsoluteFill
          style={{ background: c.flash, opacity: flash * c.flashAlpha }}
        />
      ) : null}
    </AbsoluteFill>
  );
}
