"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadOnest } from "@remotion/google-fonts/Onest";
import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const onest = loadOnest("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const SWAY = Easing.bezier(0.45, 0, 0.55, 1);
const TILE = { mass: 0.8, damping: 18, stiffness: 160 };
const BLOOM = { mass: 0.7, damping: 13, stiffness: 170 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const DROP = { mass: 0.7, damping: 12, stiffness: 150 };

const B = {
  l1: -8,
  dot: 10,
  bloom: 20,
  l1out: 46,
  grow: 46,
  l2in: 52,
  l2out: 84,
  drop: 90,
  hook: 90,
  l3: 98,
  end: 146,
};

export const GLYPH_RELAY_DURATION = B.end;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], { ...CLAMP, easing });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const HOOK =
  "M 50 110 C 50 100, 50 93, 54 85 C 61 71, 88 63, 88 40 C 88 22, 75 6, 54 6 C 33 6, 18 20, 18 42";
const Q_W = 100;
const Q_H = 160;
const Q_DOT_Y = 140;
const Q_DOT_R = 12;
const Q_STROKE = 22;

export interface GlyphRelayProps {
  theme?: "dark" | "light";
  accent?: string;
  line1?: [string, string];
  line2?: [string, string];
  line3?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DARK_GROUND: Partial<GradientParams> = {
  kind: "mist",
  colors: ["#e9dcff", "#8f7bff", "#3a2aa6", "#0d0a26"],
  background: "#050409",
  speed: 0.8,
  loopSeconds: 16,
  scale: 0.85,
  warp: 0.4,
  blur: 0.75,
};

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "pixel-glass",
  colors: ["#f6c7e4", "#d7cbff", "#c9d6ff"],
  background: "#f6f3ef",
  grain: 0.12,
  seed: 4,
};

function Half({
  side,
  vertical,
  edge,
  progress,
  rise,
  fs,
  center,
  children,
}: {
  side: "a" | "b";
  vertical: boolean;
  edge: number;
  progress: number;
  rise: number;
  fs: number;
  center: number;
  children: ReactNode;
}) {
  const box: CSSProperties = vertical
    ? side === "a"
      ? { left: 0, right: 0, top: 0, height: Math.max(0, edge) }
      : { left: 0, right: 0, top: edge, bottom: 0 }
    : side === "a"
      ? {
          left: 0,
          width: Math.max(0, edge),
          top: center - fs * 0.8,
          height: fs * 1.6,
        }
      : { left: edge, right: 0, top: center - fs * 0.8, height: fs * 1.6 };
  const dir = side === "a" ? 1 : -1;
  const slide = (1 - progress) * 101 * dir;
  return (
    <div
      style={{
        position: "absolute",
        ...box,
        overflow: "hidden",
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        alignItems: vertical ? "center" : "center",
        justifyContent:
          side === "a" ? "flex-end" : vertical ? "flex-start" : "flex-start",
      }}
    >
      <div
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          lineHeight: 1,
          paddingBottom: vertical ? fs * 0.08 : 0,
          transform: vertical
            ? `translateY(${slide}%)`
            : `translate(${slide}%, ${(1 - rise) * fs * 0.9}px)`,
          filter:
            rise < 1 || progress < 1
              ? `blur(${(1 - rise) * 6 + (1 - progress) * 3}px)`
              : undefined,
          opacity: rise,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function GlyphRelay({
  theme = "dark",
  accent = "#3B5BFD",
  line1 = ["Building a", "product"],
  line2 = ["is", "easy."],
  line3 = "Launching it?",
  ground,
  groundParams,
}: GlyphRelayProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const vertical = height > width * 1.2;
  const stageW = vertical ? 1080 : 1280;
  const stageH = vertical ? 1920 : 720;
  const sc = width / stageW;

  const ink = dark ? "#f4f2fb" : "#121118";
  const fs1 = vertical ? 150 : 92;
  const fs2 = vertical ? 190 : 124;
  const fs3 = vertical ? 150 : 104;

  const qScale = vertical ? 7.2 : 3.15;
  const qW = Q_W * qScale;
  const qH = Q_H * qScale;
  const qTextY = vertical ? stageH * 0.5 : stageH * 0.5;
  const qTop = qTextY - 92 * qScale;
  const qLeft = stageW / 2 - qW / 2;
  const dotY = qTop + Q_DOT_Y * qScale;
  const dotR = Q_DOT_R * qScale;

  const cx = stageW / 2;
  const cy = stageH / 2;

  const dotIn = spring({ frame: frame - B.dot, fps, config: CHIP });
  const bloom = spring({ frame: frame - B.bloom, fps, config: BLOOM });
  const grow = spring({ frame: frame - B.grow, fps, config: TILE });
  const drop = spring({ frame: frame - B.drop, fps, config: DROP });
  const shrink = ramp(frame, B.drop, 14, LIGHT);

  const rDot = fs1 * 0.14;
  const rDisc = fs1 * 0.48;
  const rBig = fs2 * 0.5;
  let r = rDot * dotIn;
  r = mix(r, rDisc, bloom);
  r = mix(r, rBig, grow);
  r = mix(r, dotR, shrink);
  const gy = mix(cy, dotY, drop);
  const gx = cx;

  const sideGap = (fs: number) => fs * 0.13 + r * 0.32;

  const l1Rise = (i: number) => ramp(frame, B.l1 + i * 3, 14);
  const l1Out = 1 - ramp(frame, B.l1out, 10, EXIT);
  const l2In = spring({ frame: frame - B.l2in, fps, config: TILE });
  const l2Out = 1 - ramp(frame, B.l2out, 9, EXIT);
  const l2 = Math.min(l2In, l2Out);

  const discTint = ramp(frame, B.bloom, 8, LIGHT);
  const glyphColor = interpolateColors(discTint, [0, 1], [ink, accent]);
  const markIn = ramp(frame, B.bloom + 3, 10, LIGHT);

  const hook = ramp(frame, B.hook + 2, 22, LIGHT);
  const hookFade = ramp(frame, B.hook, 6, LIGHT);

  const words3 = line3.split(" ");
  const l3Lines = vertical
    ? [words3.slice(0, -1).join(" "), words3[words3.length - 1]]
    : [line3];

  const push = 1 + 0.045 * ramp(frame, 0, B.end, SWAY);

  const resolvedGround: GshPresetId | undefined = ground;
  const resolvedParams =
    groundParams ?? (ground ? undefined : dark ? DARK_GROUND : LIGHT_GROUND);

  const hookStroke = dark
    ? `color-mix(in oklab, ${accent} 60%, #d9d2ff)`
    : `color-mix(in oklab, ${accent} 55%, #ffffff)`;

  const edgeA = (fs: number) =>
    vertical ? gy - r - sideGap(fs) : gx - r - sideGap(fs);
  const edgeB = (fs: number) =>
    vertical ? gy + r + sideGap(fs) : gx + r + sideGap(fs);

  const showL1 = frame < B.l1out + 12;
  const showL2 = frame >= B.l2in - 1 && frame < B.l2out + 11;

  return (
    <AbsoluteFill style={{ fontFamily: onest.fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={resolvedGround}
        params={resolvedParams}
        timeOffset={dark ? 4 : 3}
        timeScale={0.5}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: stageW,
          height: stageH,
          transform: `scale(${sc})`,
          transformOrigin: "0 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${push})`,
            transformOrigin: "50% 50%",
            color: ink,
            fontWeight: 300,
            letterSpacing: "-0.035em",
          }}
        >
          <svg
            viewBox={`0 0 ${Q_W} ${Q_H}`}
            width={qW}
            height={qH}
            style={{
              position: "absolute",
              left: qLeft,
              top: qTop,
              overflow: "visible",
              opacity: hookFade,
            }}
            aria-hidden
          >
            <path
              d={HOOK}
              fill="none"
              stroke={hookStroke}
              strokeOpacity={dark ? 0.42 : 0.4}
              strokeWidth={Q_STROKE}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - hook}
            />
            <path
              d={HOOK}
              fill="none"
              stroke="#ffffff"
              strokeOpacity={dark ? 0.22 : 0.65}
              strokeWidth={Q_STROKE * 0.32}
              strokeLinecap="round"
              transform="translate(-2.2 -2.2)"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - hook}
            />
          </svg>
          {showL1 ? (
            <div style={{ position: "absolute", inset: 0, fontSize: fs1 }}>
              <Half
                side="a"
                vertical={vertical}
                edge={edgeA(fs1)}
                progress={l1Out}
                rise={l1Rise(0)}
                fs={fs1}
                center={gy}
              >
                {line1[0]}
              </Half>
              <Half
                side="b"
                vertical={vertical}
                edge={edgeB(fs1)}
                progress={l1Out}
                rise={l1Rise(1)}
                fs={fs1}
                center={gy}
              >
                {line1[1]}
              </Half>
            </div>
          ) : null}
          {showL2 ? (
            <div style={{ position: "absolute", inset: 0, fontSize: fs2 }}>
              <Half
                side="a"
                vertical={vertical}
                edge={edgeA(fs2)}
                progress={l2}
                rise={1}
                fs={fs2}
                center={gy}
              >
                {line2[0]}
              </Half>
              <Half
                side="b"
                vertical={vertical}
                edge={edgeB(fs2)}
                progress={l2}
                rise={1}
                fs={fs2}
                center={gy}
              >
                <span
                  style={{
                    fontFamily: serif.fontFamily,
                    fontStyle: "italic",
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                    fontSize: "1.1em",
                  }}
                >
                  {line2[1]}
                </span>
              </Half>
            </div>
          ) : null}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: qTextY - (fs3 * 1.08 * l3Lines.length) / 2,
              textAlign: "center",
              fontSize: fs3,
              lineHeight: 1.08,
              fontWeight: 400,
            }}
          >
            {l3Lines.map((ln, i) => {
              const p = ramp(frame, B.l3 + i * 4, 14);
              return (
                <div
                  key={`${ln}-${i.toString()}`}
                  style={{ overflow: "hidden", paddingBottom: "0.08em" }}
                >
                  <div
                    style={{
                      transform: `translateY(${mix(105, 0, p)}%)`,
                      filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined,
                    }}
                  >
                    {ln}
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              position: "absolute",
              left: gx - r,
              top: gy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: glyphColor,
              boxShadow:
                discTint > 0
                  ? `inset 0 ${r * 0.08}px ${r * 0.12}px rgba(255,255,255,${0.35 * discTint}), inset 0 -${r * 0.1}px ${r * 0.2}px rgba(0,0,0,${0.18 * discTint}), 0 ${r * 0.18}px ${r * 0.5}px color-mix(in oklab, ${accent} ${Math.round(38 * discTint)}%, transparent)`
                  : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              viewBox="0 0 124.06 134.26"
              height={r * 0.9}
              width={(r * 0.9 * 124.06) / 134.26}
              style={{
                display: "block",
                marginLeft: r * 0.08,
                opacity: markIn,
                transform: `scale(${mix(0.4, 1, markIn)})`,
              }}
              aria-hidden
            >
              <path fill="#ffffff" d={REMOCN_R_PATH} />
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default GlyphRelay;
