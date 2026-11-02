"use client";

import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const sora = loadSora("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const SOFT = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CAM = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };

const B = {
  avatar: 2,
  name: 6,
  nameStep: 2,
  sub: 30,
  subStep: 1,
  grow: 48,
  status: 54,
  icons: 60,
  price: 60,
  delta: 66,
  chart: 66,
  tabs: 78,
  card: 84,
  list: 90,
  flood: 96,
  push: 108,
  lock: 150,
  end: 186,
};

export const DEVICE_GROWS_AROUND_DURATION = B.end;

const PW = 420;
const PH = 900;
const PR = 66;
const BZ = 9;

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

function chartPoints(n: number) {
  const pts: number[] = [];
  let v = 0.18;
  for (let i = 0; i < n; i++) {
    const trend = (i / (n - 1)) * 0.62;
    v = v * 0.55 + (0.18 + trend + (random(`dga-${i}`) - 0.5) * 0.22) * 0.45;
    pts.push(Math.min(0.96, Math.max(0.04, v)));
  }
  pts[n - 1] = 0.9;
  return pts;
}

const POINTS = chartPoints(44);

function Rise({
  t,
  children,
  style,
  dist = 14,
}: {
  t: number;
  children: ReactNode;
  style?: CSSProperties;
  dist?: number;
}) {
  return (
    <div style={{ position: "absolute", overflow: "hidden", ...style }}>
      <div
        style={{
          transform: `translateY(${(1 - t) * dist}px)`,
          opacity: Math.min(1, t * 1.6),
          filter: t < 0.98 ? `blur(${(1 - t) * 3}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Icon({
  d,
  size,
  color,
  sw = 1.6,
}: {
  d: string;
  size: number;
  color: string;
  sw?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ display: "block" }}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface DeviceGrowsAroundProps {
  theme?: "dark" | "light";
  accent?: string;
  name?: string;
  badge?: string;
  subtitle?: string;
  metric?: number;
  delta?: string;
  total?: number;
  gain?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

export function DeviceGrowsAround({
  theme = "dark",
  accent = "#3B5BFD",
  name = "Launch Film",
  badge = "v2",
  subtitle = "Remocn Studio export",
  metric = 48213,
  delta = "6,904 (16.7%) today",
  total = 1284507,
  gain = 412880,
  ground,
  groundParams,
}: DeviceGrowsAroundProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 1080 : 1280;
  const stageH = portrait ? 1920 : 720;
  const sc = width / stageW;

  const stage = dark ? "#030407" : "#eeede9";
  const ink = dark ? "#f2f3f8" : "#12141b";
  const soft = dark ? "rgba(232,236,252,0.56)" : "rgba(18,20,27,0.52)";
  const faint = dark ? "rgba(232,236,252,0.32)" : "rgba(18,20,27,0.3)";
  const green = dark ? "#41e08d" : "#0e9a52";
  const hair = dark ? "rgba(255,255,255,0.1)" : "rgba(18,20,27,0.08)";
  const screenBase = dark ? "#06070c" : "#ffffff";
  const bezel = dark ? "#0b0c11" : "#fbfbfc";
  const btnBg = dark ? "rgba(255,255,255,0.07)" : "rgba(18,20,27,0.05)";
  const cardBg = dark ? "rgba(8,10,28,0.46)" : "rgba(255,255,255,0.78)";
  const cardShadow = dark
    ? "0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 24px rgba(0,0,10,0.3)"
    : "0 0 0 1px rgba(18,20,40,0.06), 0 2px 6px rgba(30,40,90,0.05), 0 12px 28px rgba(30,40,90,0.08)";

  const nameChars = Array.from(name);
  const subChars = Array.from(subtitle);
  const subStart = Math.max(B.sub, B.name + nameChars.length * B.nameStep);
  const nameTyped = nameChars.filter(
    (_, i) => frame >= B.name + i * B.nameStep,
  ).length;
  const subTyped = subChars.filter(
    (_, i) => frame >= subStart + i * B.subStep,
  ).length;
  const badgeAt = B.name + nameChars.length * B.nameStep;
  const subEnd = subStart + subChars.length * B.subStep;

  const tint = (at: number) =>
    interpolateColors(frame, [at, at + 9], [accent, ink]);

  const nameW = nameChars.length * 23 * 0.6 + (badge ? 46 : 0);
  const subW = subChars.length * 16 * 0.56;
  const LX = (58 + 126 + Math.max(nameW, subW)) / 2;
  const LY = 112;

  const cx = stageW / 2;
  const K = portrait
    ? {
        sT: 2.55,
        aT: [cx, 900],
        s0: 1.95,
        f0: [PW / 2, 450],
        a0: [cx, 985],
        s1: 2.68,
        f1: [PW / 2, 614],
        a1: [cx, 960],
      }
    : {
        sT: 2.55,
        aT: [cx, 356],
        s0: 1.62,
        f0: [PW / 2, 0],
        a0: [cx, 40],
        s1: 3.2,
        f1: [PW / 2, 545],
        a1: [cx, 360],
      };

  const g = spring({ frame: frame - B.grow, fps, config: HEAVY });
  const p = ramp(frame, B.push, 36, CAM);
  const pPrev = ramp(frame - 1, B.push, 36, CAM);
  const drift = ramp(frame, B.push + 36, B.end - B.push - 36, MOVE);
  const sA = Math.exp(mix(Math.log(K.sT), Math.log(K.s0), g));
  const s =
    Math.exp(mix(Math.log(sA), Math.log(K.s1), p)) * (1 + 0.025 * drift);
  const fx = mix(mix(LX, K.f0[0], g), K.f1[0], p);
  const fy = mix(mix(LY, K.f0[1], g), K.f1[1], p);
  const ax = mix(mix(K.aT[0], K.a0[0], g), K.a1[0], p);
  const ay = mix(mix(K.aT[1], K.a0[1], g), K.a1[1], p);
  const camBlur = Math.min(3, Math.abs(p - pPrev) * 70);

  const bezelIn = ramp(frame, B.grow, 18, SOFT);
  const bezelScale = mix(
    1.07,
    1,
    spring({ frame: frame - B.grow, fps, config: CARD }),
  );
  const baseCol = interpolateColors(bezelIn, [0, 1], [stage, screenBase]);
  const flood = ramp(frame, B.flood, 26, MOVE);
  const bezelOut = ramp(frame, B.push + 18, 16, MOVE);

  const avatarIn = spring({ frame: frame - B.avatar, fps, config: CHIP });
  const badgeIn = spring({ frame: frame - badgeAt, fps, config: CHIP });
  const statusIn = ramp(frame, B.status, 12);
  const iconsIn = spring({ frame: frame - B.icons, fps, config: CHIP });
  const priceIn = ramp(frame, B.price, 14);
  const deltaIn = ramp(frame, B.delta, 14);
  const chartIn = ramp(frame, B.chart, 30, MOVE);
  const cardIn = spring({ frame: frame - B.card, fps, config: CARD });
  const count = ramp(frame, B.card, B.lock - B.card, MOVE);
  const lockTick = spring({ frame: frame - B.lock, fps, config: CHIP });
  const tick =
    frame >= B.lock ? 1 + 0.05 * Math.sin(Math.min(1, lockTick) * Math.PI) : 1;

  const caretOn =
    frame < subEnd + 6
      ? frame < B.name
        ? Math.floor(frame / 6) % 2 === 0
        : true
      : Math.floor((frame - subEnd) / 7) % 2 === 0 && frame < B.grow + 14;
  const caretOnSub = subTyped > 0;

  const chartX0 = 24;
  const chartX1 = 396;
  const chartY0 = 268;
  const chartY1 = 420;
  const pts = POINTS.map((v, i) => [
    chartX0 + ((chartX1 - chartX0) * i) / (POINTS.length - 1),
    chartY1 - (chartY1 - chartY0) * v,
  ]);
  const line = pts
    .map(
      (pt, i) =>
        `${i === 0 ? "M" : "L"}${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`,
    )
    .join(" ");
  const area = `${line} L${chartX1} ${chartY1 + 20} L${chartX0} ${chartY1 + 20} Z`;
  const head =
    pts[Math.min(pts.length - 1, Math.floor(chartIn * (pts.length - 1)))];

  const tabs = ["1H", "1D", "1W", "1M", "1Y", "All"];
  const sources = [
    ["Social", 0.41],
    ["Direct", 0.27],
    ["Search", 0.18],
  ] as const;

  const resolvedGround: GshPresetId | undefined = ground;
  const resolvedParams: Partial<GradientParams> | undefined =
    groundParams ??
    (ground
      ? undefined
      : dark
        ? {
            kind: "beam",
            colors: ["#e6ecff", "#8a9dff", "#3150f0", "#0a1250"],
            background: "#03050f",
            speed: 0.6,
            loopSeconds: 14,
            scale: 1.8,
            warp: 0.35,
            seed: 5,
          }
        : {
            kind: "beam",
            colors: ["#ffffff", "#c9d3ff", "#8399ff", "#e4e8fb"],
            background: "#eef0f9",
            speed: 0.6,
            loopSeconds: 14,
            scale: 1.8,
            warp: 0.35,
            seed: 5,
          });

  const screen: CSSProperties = {
    position: "absolute",
    left: BZ,
    top: BZ,
    width: PW - BZ * 2,
    height: PH - BZ * 2,
    borderRadius: PR - BZ,
  };

  const floodEdge = flood * 135;
  const floodMask = `linear-gradient(180deg, transparent ${floodEdge - 35}%, #000 ${floodEdge}%)`;

  return (
    <AbsoluteFill
      style={{
        fontFamily: sora.fontFamily,
        overflow: "hidden",
        background: stage,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <GshGround
        preset={resolvedGround}
        params={resolvedParams}
        timeOffset={3}
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
          overflow: "hidden",
          filter: camBlur > 0.1 ? `blur(${camBlur}px)` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: PW,
            height: PH,
            transformOrigin: "0 0",
            transform: `translate(${ax - fx * s}px, ${ay - fy * s}px) scale(${s})`,
          }}
        >
          <div
            style={{
              ...screen,
              boxShadow: `0 0 0 9000px ${stage}`,
              opacity: 1 - bezelOut,
            }}
          />
          <div
            style={{
              ...screen,
              left: BZ - 2,
              top: BZ - 2,
              width: PW - BZ * 2 + 4,
              height: PH - BZ * 2 + 4,
              borderRadius: PR - BZ + 2,
              background: baseCol,
              maskImage: flood > 0 ? floodMask : undefined,
              WebkitMaskImage: flood > 0 ? floodMask : undefined,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: PR,
              border: `${BZ}px solid ${bezel}`,
              boxShadow: dark
                ? "0 0 0 1px rgba(255,255,255,0.16), inset 0 0 0 1px rgba(255,255,255,0.07), 0 30px 80px rgba(0,0,0,0.6)"
                : "0 0 0 1px rgba(18,20,40,0.1), inset 0 0 0 1px rgba(18,20,40,0.05), 0 4px 10px rgba(30,40,90,0.06), 0 30px 70px rgba(30,40,90,0.12)",
              opacity: bezelIn * (1 - bezelOut),
              transform: `scale(${bezelScale})`,
              transformOrigin: `${LX}px ${LY}px`,
            }}
          />
          <div style={{ ...screen, overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                left: -BZ,
                top: -BZ,
                width: PW,
                height: PH,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: PW / 2 - 52,
                  top: 20,
                  width: 104,
                  height: 30,
                  borderRadius: 20,
                  background: "#000",
                  opacity: bezelIn,
                  transform: `scale(${mix(0.7, 1, bezelIn)})`,
                }}
              />
              <Rise
                t={statusIn}
                dist={8}
                style={{ left: 50, top: 24, height: 26 }}
              >
                <div style={{ fontSize: 16, color: ink, lineHeight: "26px" }}>
                  9:41
                </div>
              </Rise>
              <div
                style={{
                  position: "absolute",
                  right: 40,
                  top: 30,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: ramp(frame, B.status + 4, 10),
                }}
              >
                <svg width={18} height={12} viewBox="0 0 18 12" aria-hidden>
                  {[0, 1, 2, 3].map((k) => (
                    <rect
                      key={`sig${k.toString()}`}
                      x={k * 4.6}
                      y={9 - k * 3}
                      width={3.2}
                      height={3 + k * 3}
                      rx={1}
                      fill={ink}
                    />
                  ))}
                </svg>
                <svg width={17} height={12} viewBox="0 0 17 12" aria-hidden>
                  <path
                    d="M1 4.2a11 11 0 0 1 15 0M3.6 7a7 7 0 0 1 9.8 0M6.2 9.7a3 3 0 0 1 4.6 0"
                    fill="none"
                    stroke={ink}
                    strokeWidth={1.7}
                    strokeLinecap="round"
                  />
                </svg>
                <svg width={26} height={12} viewBox="0 0 26 12" aria-hidden>
                  <rect
                    x={0.7}
                    y={0.7}
                    width={22}
                    height={10.6}
                    rx={3.4}
                    fill="none"
                    stroke={faint}
                    strokeWidth={1.2}
                  />
                  <rect
                    x={2.4}
                    y={2.4}
                    width={15}
                    height={7.2}
                    rx={2}
                    fill={ink}
                  />
                  <rect
                    x={23.8}
                    y={4}
                    width={1.6}
                    height={4}
                    rx={0.8}
                    fill={faint}
                  />
                </svg>
              </div>

              <div
                style={{
                  position: "absolute",
                  left: 22,
                  top: LY - 12,
                  opacity: Math.min(1, iconsIn),
                  transform: `translateX(${(1 - Math.min(1, iconsIn)) * 8}px)`,
                }}
              >
                <Icon d="M15 5l-7 7 7 7" size={24} color={soft} sw={1.8} />
              </div>
              {[
                "M12 7v5l3 2M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4 4v3.5h3.5",
                "M12 4v11M8 8l4-4 4 4M6 12v6.5h12V12",
              ].map((d, k) => (
                <div
                  key={`btn${k.toString()}`}
                  style={{
                    position: "absolute",
                    left: 322 + k * 42,
                    top: LY - 17,
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    background: btnBg,
                    boxShadow: `inset 0 0 0 1px ${hair}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${Math.max(0, spring({ frame: frame - B.icons - 2 - k * 2, fps, config: CHIP }))})`,
                  }}
                >
                  <Icon d={d} size={17} color={ink} />
                </div>
              ))}

              <div
                style={{
                  position: "absolute",
                  left: 58,
                  top: LY - 27,
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  background: dark ? "#181a23" : "#12141b",
                  boxShadow: dark
                    ? "inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.1)"
                    : "0 2px 6px rgba(18,20,40,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${Math.max(0, avatarIn)})`,
                }}
              >
                <svg
                  viewBox="0 0 124.06 134.26"
                  height={22}
                  width={(22 * 124.06) / 134.26}
                  aria-hidden
                >
                  <path fill="#ffffff" d={REMOCN_R_PATH} />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    right: -1,
                    bottom: 1,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    background: green,
                    boxShadow: `0 0 0 3px ${baseCol}`,
                    transform: `scale(${Math.max(0, spring({ frame: frame - B.icons, fps, config: CHIP }))})`,
                  }}
                />
              </div>

              <div
                style={{
                  position: "absolute",
                  left: 126,
                  top: 84,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "pre",
                  fontSize: 23,
                  letterSpacing: "-0.02em",
                  color: ink,
                }}
              >
                {nameChars.slice(0, nameTyped).map((ch, i) => (
                  <span
                    key={`n${i.toString()}`}
                    style={{ color: tint(B.name + i * B.nameStep) }}
                  >
                    {ch}
                  </span>
                ))}
                {!caretOnSub && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 2.5,
                      height: 26,
                      marginLeft: 2,
                      borderRadius: 2,
                      background: accent,
                      opacity: caretOn ? 1 : 0,
                    }}
                  />
                )}
                {badge ? (
                  <span
                    style={{
                      marginLeft: 10,
                      fontSize: 13,
                      letterSpacing: 0,
                      lineHeight: "20px",
                      padding: "0 7px",
                      borderRadius: 6,
                      color: dark ? "#aab8ff" : accent,
                      background: dark
                        ? "rgba(90,115,255,0.2)"
                        : "rgba(59,91,253,0.1)",
                      opacity: Math.min(1, Math.max(0, badgeIn)),
                      transform: `scale(${Math.max(0, badgeIn)})`,
                    }}
                  >
                    {badge}
                  </span>
                ) : null}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 126,
                  top: 118,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "pre",
                  fontSize: 16,
                  fontWeight: 300,
                  color: soft,
                }}
              >
                {subChars.slice(0, subTyped).map((ch, i) => (
                  <span
                    key={`s${i.toString()}`}
                    style={{
                      color:
                        frame < subStart + i * B.subStep + 8
                          ? interpolateColors(
                              frame,
                              [
                                subStart + i * B.subStep,
                                subStart + i * B.subStep + 8,
                              ],
                              [accent, soft],
                            )
                          : soft,
                    }}
                  >
                    {ch}
                  </span>
                ))}
                {caretOnSub && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 19,
                      marginLeft: 2,
                      borderRadius: 2,
                      background: accent,
                      opacity: caretOn ? 1 : 0,
                    }}
                  />
                )}
              </div>

              <Rise
                t={priceIn}
                dist={30}
                style={{ left: 38, top: 160, height: 64 }}
              >
                <div
                  style={{
                    fontSize: 50,
                    lineHeight: "64px",
                    letterSpacing: "-0.035em",
                    color: ink,
                    fontWeight: 300,
                  }}
                >
                  {fmt(metric)}
                  <span
                    style={{
                      fontSize: 20,
                      color: soft,
                      marginLeft: 10,
                      letterSpacing: 0,
                    }}
                  >
                    views
                  </span>
                </div>
              </Rise>
              <Rise
                t={deltaIn}
                dist={14}
                style={{ left: 40, top: 226, height: 24 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 15,
                    lineHeight: "24px",
                    color: green,
                  }}
                >
                  <svg width={10} height={10} viewBox="0 0 10 10" aria-hidden>
                    <path d="M5 1.5L9 8H1z" fill={green} />
                  </svg>
                  <span>{delta}</span>
                </div>
              </Rise>

              <svg
                width={PW}
                height={PH}
                viewBox={`0 0 ${PW} ${PH}`}
                style={{ position: "absolute", left: 0, top: 0 }}
                aria-hidden
              >
                <defs>
                  <linearGradient id="dga-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={green} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={green} stopOpacity={0} />
                  </linearGradient>
                  <clipPath id="dga-clip">
                    <rect
                      x={0}
                      y={0}
                      width={chartX0 + (chartX1 - chartX0) * chartIn + 2}
                      height={PH}
                    />
                  </clipPath>
                </defs>
                {[0, 1, 2].map((k) => (
                  <line
                    key={`gl${k.toString()}`}
                    x1={chartX0}
                    x2={chartX1}
                    y1={chartY0 + k * 64}
                    y2={chartY0 + k * 64}
                    stroke={hair}
                    strokeDasharray="2 5"
                    opacity={ramp(frame, B.chart, 10)}
                  />
                ))}
                <g clipPath="url(#dga-clip)" opacity={chartIn > 0 ? 1 : 0}>
                  <path d={area} fill="url(#dga-fill)" />
                  <path
                    d={line}
                    fill="none"
                    stroke={green}
                    strokeWidth={2.2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </g>
                {chartIn > 0 && (
                  <circle cx={head[0]} cy={head[1]} r={4.5} fill={green} />
                )}
              </svg>

              <div
                style={{
                  position: "absolute",
                  left: 24,
                  top: 440,
                  width: 372,
                  height: 34,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {tabs.map((tb, k) => {
                  const tIn = ramp(frame, B.tabs + k * 2, 12);
                  const active = tb === "1W";
                  return (
                    <div
                      key={tb}
                      style={{
                        width: 52,
                        height: 30,
                        lineHeight: "30px",
                        textAlign: "center",
                        borderRadius: 15,
                        fontSize: 13,
                        color: active ? ink : soft,
                        background: active ? btnBg : "transparent",
                        boxShadow: active
                          ? `inset 0 0 0 1px ${hair}`
                          : undefined,
                        opacity: tIn,
                        transform: `translateY(${(1 - tIn) * 8}px)`,
                      }}
                    >
                      {tb}
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  position: "absolute",
                  left: 24,
                  top: 484,
                  width: 372,
                  height: 168,
                  borderRadius: 20,
                  background: cardBg,
                  boxShadow: cardShadow,
                  opacity: Math.min(1, cardIn * 1.4),
                  transform: `translateY(${(1 - cardIn) * 26}px)`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    top: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0 8px",
                    height: 22,
                    borderRadius: 6,
                    fontSize: 12,
                    color: green,
                    background: dark
                      ? "rgba(65,224,141,0.14)"
                      : "rgba(14,154,82,0.1)",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: green,
                      opacity: 0.55 + 0.45 * Math.cos(frame / 5),
                    }}
                  />
                  Live
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    top: 44,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <div
                    style={{
                      fontSize: 34,
                      letterSpacing: "-0.035em",
                      color: ink,
                      transform: `scale(${tick})`,
                      transformOrigin: "left center",
                    }}
                  >
                    {fmt(mix(total * 0.962, total, count))}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      letterSpacing: "-0.02em",
                      color: green,
                      transform: `scale(${tick})`,
                      transformOrigin: "right center",
                    }}
                  >
                    +{fmt(mix(gain * 0.88, gain, count))}
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    top: 92,
                    display: "flex",
                    gap: 8,
                    fontSize: 13,
                    color: soft,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>Plays</span>
                  <span style={{ color: ink }}>all time</span>
                  <span style={{ color: faint }}>(since launch)</span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    top: 120,
                    height: 1,
                    background: hair,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    top: 134,
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: soft,
                  }}
                >
                  <span>
                    Completion{" "}
                    <span style={{ color: ink, marginLeft: 6 }}>71%</span>
                  </span>
                  <span>
                    Shares{" "}
                    <span style={{ color: ink, marginLeft: 6 }}>
                      {fmt(mix(9120, 9412, count))}
                    </span>
                  </span>
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  left: 28,
                  top: 676,
                  width: 364,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: soft,
                    marginBottom: 12,
                    opacity: ramp(frame, B.list, 12),
                  }}
                >
                  Top sources
                </div>
                {sources.map(([label, v], k) => {
                  const rIn = ramp(frame, B.list + 4 + k * 3, 14);
                  const bar = ramp(frame, B.list + 8 + k * 3, 24, MOVE);
                  return (
                    <div
                      key={label}
                      style={{
                        height: 52,
                        opacity: rIn,
                        transform: `translateY(${(1 - rIn) * 10}px)`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 15,
                          color: ink,
                        }}
                      >
                        <span>{label}</span>
                        <span style={{ color: soft }}>
                          {Math.round(v * 100 * bar)}%
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 9,
                          height: 4,
                          borderRadius: 2,
                          background: hair,
                        }}
                      >
                        <div
                          style={{
                            width: `${v * 100 * bar * 2.2}%`,
                            height: 4,
                            borderRadius: 2,
                            background: k === 0 ? accent : faint,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          opacity: dark ? 0.07 : 0.05,
          mixBlendMode: dark ? "screen" : "multiply",
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <filter id="dga-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={Math.floor(frame / 2)}
          />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.4 -0.2" />
        </filter>
        <rect width="100%" height="100%" filter="url(#dga-grain)" />
      </svg>
    </AbsoluteFill>
  );
}

export default DeviceGrowsAround;
