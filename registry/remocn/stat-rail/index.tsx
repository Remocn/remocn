"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont } from "@remotion/google-fonts/InterTight";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const sans = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });
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

export interface Stat {
  value: string;
  label: string;
}

export interface StatRailProps {
  stats?: Stat[];
  image?: string;
  tagline?: string;
  theme?: "dark" | "light";
  background?: string;
  accent?: string;
  card?: string;
  faded?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const THEMES = {
  dark: {
    background: "#030806",
    accent: "#7cf2b9",
    card: "#0d1b16",
    faded: "rgba(214,240,226,0.11)",
    fadedLabel: "rgba(214,240,226,0.2)",
    label: "rgba(236,248,241,0.84)",
    payInk: "#03130c",
    shadow: "0,0,0",
    shadowAlpha: 0.5,
    hairline: "rgba(170,255,210,0.13)",
    highlight: "rgba(255,255,255,0.07)",
    groundParams: {
      kind: "mist",
      background: "#030806",
      colors: ["#b8f5d6", "#3fb58f", "#0e4a3c", "#06140f"],
      seed: 5,
    } as Partial<GradientParams>,
    groundOffset: 3,
  },
  light: {
    background: "#f3efe8",
    accent: "#5fe3a4",
    card: "#0b1a14",
    faded: "rgba(30,44,36,0.12)",
    fadedLabel: "rgba(30,44,36,0.24)",
    label: "rgba(240,250,244,0.86)",
    payInk: "#03130c",
    shadow: "60,40,30",
    shadowAlpha: 0.2,
    hairline: "rgba(255,255,255,0.08)",
    highlight: "rgba(255,255,255,0.08)",
    groundParams: {
      kind: "mist",
      background: "#f3efe8",
      colors: ["#f6c9b4", "#ecb3cf", "#cfe8d6", "#f9e6c8"],
      seed: 5,
      blur: 0.7,
    } as Partial<GradientParams>,
    groundOffset: 3,
  },
};

const DEFAULT_STATS: Stat[] = [
  { value: "120", label: "components ready to install" },
  { value: "38", label: "motion design primitives" },
  { value: "12", label: "launch templates, ready as-is" },
  { value: "4", label: "minutes from install to first render" },
];

const BEATS = [
  { name: "tagline", at: 0 },
  { name: "shrink", at: 30 },
  { name: "railIn", at: 36 },
  { name: "step0", at: 42 },
  { name: "step1", at: 66 },
  { name: "step2", at: 84 },
  { name: "step3", at: 96 },
  { name: "end", at: 144 },
] as const;

type BeatName = (typeof BEATS)[number]["name"];
const beat = (n: BeatName) => BEATS.find((b) => b.name === n)?.at ?? 0;
const STEPS: BeatName[] = ["step0", "step1", "step2", "step3"];

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const TYPE_IN = Easing.bezier(0.32, 0.72, 0, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function Tagline({
  text,
  frame,
  start,
}: {
  text: string;
  frame: number;
  start: number;
}) {
  const parts = text.split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: "0.24em",
      }}
    >
      {parts.map((raw, i) => {
        const isAccent = raw.startsWith("*") && raw.endsWith("*");
        const word = isAccent ? raw.slice(1, -1) : raw;
        const p = interpolate(
          frame,
          [start + i * 2, start + i * 2 + 13],
          [0, 1],
          { ...CLAMP, easing: TYPE_IN },
        );
        return (
          <span
            key={`${raw}-${i}`}
            style={{
              display: "inline-block",
              overflow: "hidden",
              padding: "0.05em 0.04em 0.16em",
              margin: "-0.05em -0.04em -0.16em",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 105}%)`,
                fontFamily: isAccent ? serif.fontFamily : undefined,
                fontStyle: isAccent ? "italic" : undefined,
                fontSize: isAccent ? "1.12em" : undefined,
                lineHeight: isAccent ? 0.9 : undefined,
                letterSpacing: isAccent ? "-0.01em" : undefined,
              }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function StatRail({
  stats = DEFAULT_STATS,
  image,
  tagline = "The *future* of launch video is code",
  theme = "dark",
  background,
  accent,
  card,
  faded,
  ground,
  groundParams,
}: StatRailProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = THEMES[theme];
  const acc = accent ?? t.accent;
  const cardBg = card ?? t.card;
  const fadedInk = faded ?? t.faded;
  const src = image ?? staticFile("reel/reel-2.jpg");
  const portrait = H > W;
  const last = Math.max(0, stats.length - 1);
  const sp = (at: number, config: Partial<typeof CARD>) =>
    spring({ frame: frame - at, fps, config });
  const shadow = (a: number) => `rgba(${t.shadow},${a * t.shadowAlpha})`;

  const startRect = portrait
    ? { x: W * 0.025, y: H * 0.014, w: W * 0.95, h: H * 0.972 }
    : { x: W * 0.012, y: H * 0.022, w: W * 0.976, h: H * 0.956 };
  const endRect = portrait
    ? { x: W * 0.06, y: H * 0.035, w: W * 0.88, h: H * 0.43 }
    : { x: W * 0.405, y: H * 0.06, w: W * 0.555, h: H * 0.88 };
  const shrink = sp(beat("shrink"), HEAVY);
  const shrinkPrev = spring({
    frame: frame - 1 - beat("shrink"),
    fps,
    config: HEAVY,
  });
  const lerp = (a: number, b: number) => a + (b - a) * shrink;
  const rect = {
    x: lerp(startRect.x, endRect.x),
    y: lerp(startRect.y, endRect.y),
    w: lerp(startRect.w, endRect.w),
    h: lerp(startRect.h, endRect.h),
  };
  const shrinkBlur = Math.min(5, Math.abs(shrink - shrinkPrev) * 50);
  const contentScale = lerp(1, portrait ? 0.82 : 0.64);
  const radius = portrait ? W * 0.032 : W * 0.016;
  const imgScale = interpolate(frame, [0, beat("end")], [1.14, 1.02], {
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const tagSize = portrait ? W * 0.1 : W * 0.062;
  const logoSize = portrait ? W * 0.044 : W * 0.023;

  const railX = portrait ? W * 0.07 : W * 0.06;
  const railTop = portrait ? endRect.y + endRect.h + H * 0.012 : 0;
  const railBottom = H;
  const slotY = portrait ? railTop + (railBottom - railTop) * 0.56 : H * 0.5;
  const pitch = portrait ? H * 0.205 : H * 0.235;
  const numSize = portrait ? W * 0.18 : H * 0.165;
  const labelSize = portrait ? W * 0.038 : H * 0.03;
  const cardW = portrait ? W * 0.7 : W * 0.3;
  const padY = portrait ? W * 0.034 : H * 0.034;
  const padX = portrait ? W * 0.045 : H * 0.045;

  const idx =
    -1 +
    STEPS.slice(0, last + 1).reduce((acc2, s) => acc2 + sp(beat(s), CARD), 0);
  const pay = sp(beat(STEPS[Math.min(last, 3)] as BeatName) + 2, CHIP);
  const payColor = interpolate(
    frame,
    [
      beat(STEPS[Math.min(last, 3)] as BeatName) + 1,
      beat(STEPS[Math.min(last, 3)] as BeatName) + 9,
    ],
    [0, 1],
    { ...CLAMP, easing: TYPE_IN },
  );
  const push = interpolate(frame, [0, beat("end")], [1, 1.03]);
  const fadeMask = portrait
    ? "linear-gradient(180deg, transparent 0%, black 9%, black 90%, transparent 100%)"
    : "linear-gradient(180deg, transparent 0%, black 14%, black 86%, transparent 100%)";
  const preset = ground;
  const gParams =
    groundParams ??
    (ground
      ? undefined
      : { ...t.groundParams, ...(background ? { background } : {}) });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={t.groundOffset}
        timeScale={0.5}
      />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: railTop,
            width: portrait ? W : endRect.x,
            height: railBottom - railTop,
            overflow: "hidden",
            maskImage: fadeMask,
            WebkitMaskImage: fadeMask,
          }}
        >
          {stats.map((s, i) => {
            const enter = sp(beat("railIn") + i * 3, CARD);
            const y = slotY - railTop + (i - idx) * pitch;
            const a = Math.max(0, 1 - Math.abs(idx - i));
            const isPay = i === last;
            const p = isPay ? payColor : 0;
            const bg = interpolateColors(p, [0, 1], [cardBg, acc]);
            const numColor = interpolateColors(
              p,
              [0, 1],
              [interpolateColors(a, [0, 1], [fadedInk, acc]), t.payInk],
            );
            const labelColor = interpolateColors(
              p,
              [0, 1],
              [
                interpolateColors(a, [0, 1], [t.fadedLabel, t.label]),
                "rgba(3,19,12,0.78)",
              ],
            );
            const scale = 0.94 + 0.06 * a + (isPay ? (pay - 1) * 0.06 : 0);
            return (
              <div
                key={`${s.value}-${i}`}
                style={{
                  position: "absolute",
                  left: railX,
                  top: y,
                  transform: `translateY(-50%) translateY(${(1 - enter) * H * 0.08}px) scale(${scale})`,
                  transformOrigin: "0% 50%",
                  opacity: enter,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: portrait ? "column" : "row",
                    alignItems: portrait ? "flex-start" : "center",
                    gap: portrait ? numSize * 0.08 : numSize * 0.2,
                    width: cardW,
                    boxSizing: "border-box",
                    padding: portrait
                      ? `${padY * 1.1}px ${padX}px ${padY * 1.3}px`
                      : `${padY}px ${padX}px`,
                    borderRadius: numSize * 0.2,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "inherit",
                      backgroundColor: bg,
                      backgroundImage:
                        p > 0
                          ? `radial-gradient(90% 140% at 0% 0%, rgba(255,255,255,${0.35 * p}) 0%, transparent 60%)`
                          : `radial-gradient(90% 140% at 0% 100%, color-mix(in oklab, ${acc} 16%, transparent) 0%, transparent 62%)`,
                      boxShadow: `inset 0 1px 0 ${t.highlight}, inset 0 0 0 1px ${t.hairline}, 0 1px 2px ${shadow(0.6)}, 0 ${numSize * 0.12}px ${numSize * 0.3}px ${shadow(0.7)}, 0 ${numSize * 0.4}px ${numSize * 0.9}px ${shadow(0.5)}`,
                      opacity: a,
                      transform: `scale(${0.9 + 0.1 * a})`,
                      transformOrigin: "0% 50%",
                    }}
                  />
                  <div
                    style={{
                      position: "relative",
                      fontFamily: sans.fontFamily,
                      fontWeight: 300,
                      fontSize: numSize,
                      lineHeight: 0.86,
                      letterSpacing: "-0.055em",
                      color: numColor,
                      fontVariantNumeric: "tabular-nums",
                      paddingBottom: numSize * 0.04,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      position: "relative",
                      fontFamily: sans.fontFamily,
                      fontWeight: 400,
                      fontSize: labelSize,
                      lineHeight: 1.2,
                      letterSpacing: "-0.01em",
                      color: labelColor,
                      flex: portrait ? undefined : 1,
                      textWrap: "balance",
                      maxWidth: portrait ? "11em" : undefined,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            position: "absolute",
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            borderRadius: radius,
            overflow: "hidden",
            boxShadow: `0 1px 2px ${shadow(0.5)}, 0 ${H * 0.02 * shrink}px ${H * 0.04 * shrink}px ${shadow(0.6)}, 0 ${H * 0.06 * shrink}px ${H * 0.12 * shrink}px ${shadow(0.6)}`,
            filter:
              shrinkBlur > 0.4 ? `blur(${shrinkBlur * 0.35}px)` : undefined,
          }}
        >
          <Img
            src={src}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${imgScale})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(70% 55% at 50% 46%, rgba(6,10,14,0.46) 0%, rgba(6,10,14,0) 75%), linear-gradient(180deg, rgba(6,10,14,0.18) 0%, rgba(6,10,14,0) 40%, rgba(6,10,14,0.4) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: radius,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: startRect.w,
              transform: `translate(-50%, -50%) scale(${contentScale})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: tagSize * 0.36,
              color: "#ffffff",
              fontFamily: sans.fontFamily,
              fontWeight: 400,
              fontSize: tagSize,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              textAlign: "center",
            }}
          >
            <div
              style={{
                opacity: interpolate(frame, [0, 8], [0.2, 1], CLAMP),
                transform: `translateY(${(1 - sp(-4, CARD)) * logoSize}px)`,
              }}
            >
              <RemocnLogo fontSize={logoSize} color="#ffffff" />
            </div>
            <div style={{ maxWidth: portrait ? "8.6em" : "9.6em" }}>
              <Tagline text={tagline} frame={frame} start={-3} />
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export default StatRail;
