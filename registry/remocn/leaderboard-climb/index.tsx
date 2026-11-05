"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadOnest } from "@remotion/google-fonts/Onest";
import type React from "react";
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

const onest = loadOnest("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CAM = Easing.bezier(0.87, 0, 0.13, 1);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const LIFT = { mass: 0.6, damping: 15, stiffness: 230 };

const B = {
  self: -6,
  steps: [16, 28, 38, 46, 53, 59],
  payoff: 68,
  end: 120,
};

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

function RemocnR({ height, color }: { height: number; color: string }) {
  return (
    <svg
      viewBox="0 0 124.06 134.26"
      height={height}
      width={(height * 124.06) / 134.26}
      style={{ display: "block" }}
      aria-hidden
    >
      <path fill={color} d={REMOCN_R_PATH} />
    </svg>
  );
}

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const line = (color: string, w = 1.5) => ({
  fill: "none",
  stroke: color,
  strokeWidth: w,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const TINTS = [
  "#e8a33d",
  "#4f8cff",
  "#a77bff",
  "#3fb37f",
  "#ff6b6b",
  "#2fc4c4",
  "#f08a4b",
  "#8f9bb3",
];

export interface LeaderboardEntry {
  name: string;
  tagline: string;
  score: number;
}

export interface LeaderboardClimbProps {
  theme?: "dark" | "light";
  accent?: string;
  title?: string;
  subtitle?: string;
  entries?: LeaderboardEntry[];
  self?: { name: string; tagline: string; from: number; to: number };
  toRank?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

export function LeaderboardClimb({
  theme = "dark",
  accent = "#3B5BFD",
  title = "Top launches",
  subtitle = "Today · Launch league",
  entries = [
    { name: "Fieldnote", tagline: "Notes that write back", score: 2140 },
    { name: "Parcel", tagline: "Ship docs as sites", score: 1866 },
    { name: "Nightjar", tagline: "A calm inbox for teams", score: 1210 },
    { name: "Orbitdesk", tagline: "Async standups", score: 1098 },
    { name: "Lumen", tagline: "Analytics without SQL", score: 964 },
    { name: "Tally Run", tagline: "Budgets for builders", score: 880 },
    { name: "Stackbird", tagline: "Previews for every branch", score: 742 },
    { name: "Coda Room", tagline: "Rooms for pair coding", score: 655 },
  ],
  self = {
    name: "remocn",
    tagline: "Launch videos from code",
    from: 598,
    to: 1284,
  },
  toRank = 3,
  ground,
  groundParams,
}: LeaderboardClimbProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 720 : 1280;
  const stageH = portrait ? 1280 : 720;
  const k = width / stageW;

  const ink = dark ? "#f1f2f8" : "#15161c";
  const muted = dark ? "rgba(236,238,248,0.52)" : "rgba(21,22,28,0.5)";
  const faint = dark ? "rgba(236,238,248,0.3)" : "rgba(21,22,28,0.3)";
  const hair = dark ? "rgba(255,255,255,0.08)" : "rgba(21,22,28,0.08)";
  const rowBg = dark ? "rgba(255,255,255,0.035)" : "rgba(21,22,28,0.025)";
  const surface = dark
    ? "linear-gradient(180deg, rgba(24,26,36,0.9) 0%, rgba(12,13,19,0.94) 100%)"
    : "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(250,250,252,0.96) 100%)";
  const shadow = dark
    ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 1px 2px rgba(0,0,0,0.5), 0 20px 44px rgba(0,0,0,0.4), 0 70px 140px rgba(0,4,30,0.6)"
    : "inset 0 1px 0 #ffffff, 0 1px 2px rgba(20,30,80,0.06), 0 18px 40px rgba(20,30,80,0.08), 0 60px 130px rgba(20,30,80,0.16)";

  const n = Math.min(8, entries.length);
  const others = entries.slice(0, n);
  const fromIdx = n;
  const toIdx = Math.max(0, Math.min(n, toRank - 1));
  const stepCount = fromIdx - toIdx;
  const steps = B.steps.slice(0, stepCount);

  const fs = portrait ? 1.12 : 1;
  const panelW = portrait ? 660 : 1040;
  const rowH = portrait ? 80 : 50;
  const slot = rowH + (portrait ? 8 : 6);
  const pad = portrait ? 24 : 26;
  const headH = portrait ? 150 : 88;
  const labelsH = 34;
  const listTop = pad + headH + labelsH;
  const panelH = listTop + slot * (n + 1) - (slot - rowH) + pad;
  const slotY = (s: number) => listTop + s * slot;

  const selfMoves = steps.map((t) =>
    spring({ frame: frame - t, fps, config: LIFT }),
  );
  const selfMovesPrev = steps.map((t) =>
    spring({ frame: frame - 1 - t, fps, config: LIFT }),
  );
  const selfSlot = fromIdx - selfMoves.reduce((a, b) => a + b, 0);
  const selfSlotPrev = fromIdx - selfMovesPrev.reduce((a, b) => a + b, 0);
  const selfV = Math.abs(selfSlot - selfSlotPrev) * slot;
  const selfBlur = Math.min(6, selfV * 0.18);
  const moving = Math.min(
    1,
    selfMoves.reduce(
      (a, m, i) =>
        a + Math.sin(Math.PI * Math.min(1, m)) * (frame >= steps[i] ? 1 : 0),
      0,
    ),
  );

  const scoreStops = [
    self.from,
    ...others
      .slice(toIdx, fromIdx)
      .reverse()
      .map((e) => e.score + 14),
  ];
  scoreStops[scoreStops.length - 1] = self.to;
  let score = self.from;
  steps.forEach((t, i) => {
    const p = ramp(frame, t - 2, 9, MOVE);
    score = mix(score, scoreStops[i + 1] ?? self.to, p);
  });
  const selfRank = Math.round(selfSlot) + 1;

  const payoff = spring({ frame: frame - B.payoff, fps, config: CHIP });
  const flash =
    ramp(frame, B.payoff, 4, MOVE) * (1 - ramp(frame, B.payoff + 4, 22, ENTER));
  const selfIn = ramp(frame, B.self, 12);

  const camPull = ramp(frame, steps[0] - 6, B.payoff + 4 - (steps[0] - 6), CAM);
  const panelCy = panelH / 2;
  const selfCenter = slotY(selfSlot) + rowH / 2;
  const z0 = portrait ? 1.08 : 1.2;
  const z1 = portrait ? 0.98 : 0.95;
  const z =
    mix(z0, z1, camPull) +
    0.02 * ramp(frame, -6, steps[0], Easing.linear) * (1 - camPull) +
    0.025 * ramp(frame, B.payoff, B.end - B.payoff, Easing.linear);
  const fy = mix(selfCenter - panelCy - (portrait ? 220 : 120), 0, camPull);
  const fx = 0;
  const rotX = mix(10, 4, camPull) + Math.sin(frame / 40) * 0.4;
  const rotY = mix(-8, -3, camPull) + 2 * moving;

  const resolvedPreset: GshPresetId | undefined =
    ground ?? (dark ? undefined : "glasswork");
  const resolvedParams: Partial<GradientParams> | undefined =
    groundParams ??
    (ground || !dark
      ? undefined
      : {
          kind: "rise",
          background: "#02030a",
          colors: ["#eef2ff", "#7d95ff", "#2c3fc9", "#0a0f3a"],
        });

  const medal = (rank: number) =>
    rank === 1
      ? "#e9b949"
      : rank === 2
        ? "#b9c0cc"
        : rank === 3
          ? "#cf8a54"
          : null;

  const rankCell = (rank: number, onAccent: boolean) => {
    const m = medal(rank);
    return (
      <div
        style={{
          width: 40 * fs,
          display: "flex",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {m ? (
          <div
            style={{
              width: 30 * fs,
              height: 30 * fs,
              borderRadius: 15 * fs,
              background: onAccent
                ? "rgba(255,255,255,0.95)"
                : `color-mix(in oklab, ${m} 22%, transparent)`,
              border: `1.5px solid ${m}`,
              color: onAccent ? "#15161c" : m,
              fontFamily: mono.fontFamily,
              fontSize: 15 * fs,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {rank}
          </div>
        ) : (
          <span
            style={{
              fontFamily: mono.fontFamily,
              fontSize: 17 * fs,
              color: onAccent ? "rgba(255,255,255,0.85)" : muted,
            }}
          >
            {rank}
          </span>
        )}
      </div>
    );
  };

  const rowInner = (
    rank: number,
    avatar: React.ReactNode,
    name: string,
    tagline: string,
    scoreText: string,
    onAccent: boolean,
    trend: "up" | "flat" | "down",
    extra?: React.ReactNode,
  ) => (
    <>
      {rankCell(rank, onAccent)}
      {avatar}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 18 * fs,
            color: onAccent ? "#ffffff" : ink,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
        >
          {name}
          {portrait || rowH > 50 ? null : (
            <span
              style={{
                fontSize: 16,
                color: onAccent ? "rgba(255,255,255,0.72)" : muted,
              }}
            >
              {tagline}
            </span>
          )}
          {extra}
        </div>
        {portrait || rowH > 50 ? (
          <div
            style={{
              fontSize: 14 * fs,
              color: onAccent ? "rgba(255,255,255,0.7)" : muted,
              marginTop: 2,
              whiteSpace: "nowrap",
            }}
          >
            {tagline}
          </div>
        ) : null}
      </div>
      <span
        style={{
          fontFamily: mono.fontFamily,
          fontSize: 18 * fs,
          color: onAccent ? "#ffffff" : ink,
          fontVariantNumeric: "tabular-nums",
          minWidth: 80 * fs,
          textAlign: "right",
        }}
      >
        {scoreText}
      </span>
      <svg
        viewBox="0 0 24 24"
        width={18 * fs}
        height={18 * fs}
        style={{ marginLeft: 10, flexShrink: 0 }}
        aria-hidden
      >
        <path
          d={
            trend === "up"
              ? "M12 18V6M7 11l5-5 5 5"
              : trend === "down"
                ? "M12 6v12M7 13l5 5 5-5"
                : "M6 12h12"
          }
          {...line(
            onAccent
              ? "#ffffff"
              : trend === "up"
                ? "#3fb37f"
                : trend === "down"
                  ? "#ff6b6b"
                  : faint,
            1.8,
          )}
        />
      </svg>
    </>
  );

  return (
    <AbsoluteFill style={{ fontFamily: onest.fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={resolvedPreset}
        params={resolvedParams}
        timeOffset={3}
        timeScale={0.45}
      />
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <filter id="lbc-self" x="-5%" y="-40%" width="110%" height="180%">
          <feGaussianBlur stdDeviation={`0 ${selfBlur}`} />
        </filter>
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: stageW,
          height: stageH,
          transform: `scale(${k})`,
          transformOrigin: "0 0",
          perspective: 2000,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: stageW / 2,
            top: stageH / 2,
            width: 0,
            height: 0,
            transformStyle: "preserve-3d",
            transform: `translate(${-fx * z}px, ${-fy * z}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${z})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -panelW / 2,
              top: -panelH / 2,
              width: panelW,
              height: panelH,
              borderRadius: 26,
              background: surface,
              border: `1px solid ${hair}`,
              boxShadow: shadow,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: pad,
                right: pad,
                top: pad,
                height: headH,
                display: "flex",
                flexDirection: portrait ? "column" : "row",
                alignItems: portrait ? "flex-start" : "center",
                gap: portrait ? 18 : 0,
              }}
            >
              <div style={{ flex: portrait ? undefined : 1 }}>
                <div
                  style={{
                    fontSize: portrait ? 48 : 44,
                    fontWeight: 300,
                    color: ink,
                    letterSpacing: "-0.045em",
                    lineHeight: 1,
                  }}
                >
                  {title}
                </div>
                <div style={{ fontSize: 16 * fs, color: muted, marginTop: 10 }}>
                  {subtitle}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["Today", "Week", "Month"].map((t, i) => (
                  <span
                    key={t}
                    style={{
                      height: 34 * fs,
                      padding: `0 ${14 * fs}px`,
                      borderRadius: 10,
                      fontSize: 15 * fs,
                      display: "flex",
                      alignItems: "center",
                      color: i === 0 ? ink : muted,
                      background: i === 0 ? rowBg : "transparent",
                      border: `1px solid ${i === 0 ? hair : "transparent"}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
                <span
                  style={{
                    height: 34 * fs,
                    padding: `0 ${12 * fs}px`,
                    borderRadius: 10,
                    border: `1px solid ${hair}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: mono.fontFamily,
                    fontSize: 14 * fs,
                    color: muted,
                    marginLeft: 6,
                  }}
                >
                  <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden>
                    <path
                      d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 8v4l2.5 2"
                      {...line(muted)}
                    />
                  </svg>
                  06:42:{String(18 - Math.floor(frame / 30)).padStart(2, "0")}
                </span>
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: pad + 14,
                right: pad + 14,
                top: pad + headH,
                height: labelsH,
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontFamily: mono.fontFamily,
                fontSize: 13 * fs,
                letterSpacing: "0.06em",
                color: faint,
                borderBottom: `1px solid ${hair}`,
              }}
            >
              <span style={{ width: 40 * fs, textAlign: "center" }}>#</span>
              <span style={{ flex: 1 }}>PRODUCT</span>
              <span style={{ marginRight: 28 * fs }}>UPVOTES</span>
            </div>

            {others.map((e, j) => {
              const stepI = fromIdx - 1 - j;
              const t =
                stepI >= 0 && stepI < steps.length ? steps[stepI] : null;
              const drop =
                t === null
                  ? 0
                  : spring({ frame: frame - t - 1, fps, config: CARD });
              const s = j + drop;
              const rank = Math.round(s) + 1;
              return (
                <div
                  key={e.name}
                  style={{
                    position: "absolute",
                    left: pad,
                    right: pad,
                    top: slotY(s),
                    height: rowH,
                    borderRadius: 14,
                    background: rowBg,
                    border: `1px solid ${hair}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "0 16px 0 14px",
                    boxSizing: "border-box",
                    opacity: 1 - 0.25 * Math.sin(Math.PI * Math.min(1, drop)),
                  }}
                >
                  {rowInner(
                    rank,
                    <div
                      style={{
                        width: (rowH > 60 ? 46 : 34) * 1,
                        height: (rowH > 60 ? 46 : 34) * 1,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: `color-mix(in oklab, ${TINTS[j % TINTS.length]} ${dark ? 26 : 18}%, transparent)`,
                        border: `1px solid color-mix(in oklab, ${TINTS[j % TINTS.length]} 40%, transparent)`,
                        color: TINTS[j % TINTS.length],
                        fontSize: 17 * fs,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {e.name.slice(0, 1)}
                    </div>,
                    e.name,
                    e.tagline,
                    fmt(e.score),
                    false,
                    t !== null && frame >= t ? "down" : j < 2 ? "up" : "flat",
                  )}
                </div>
              );
            })}

            <div
              style={{
                position: "absolute",
                left: pad - 6 * moving,
                right: pad - 6 * moving,
                top: slotY(selfSlot) - 2 * moving,
                height: rowH,
                borderRadius: 14,
                background: accent,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "0 16px 0 14px",
                boxSizing: "border-box",
                opacity: selfIn,
                transform: `scale(${1 + 0.02 * moving + 0.03 * flash})`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 ${10 + 14 * moving}px ${26 + 24 * moving}px color-mix(in oklab, ${accent} ${45 + 20 * flash}%, transparent), 0 0 0 ${6 * flash}px color-mix(in oklab, ${accent} ${30 * flash}%, transparent)`,
                filter: selfBlur > 0.4 ? "url(#lbc-self)" : undefined,
                clipPath: `inset(0 ${100 - 100 * selfIn}% 0 0 round 14px)`,
              }}
            >
              {rowInner(
                selfRank,
                <div
                  style={{
                    width: rowH > 60 ? 46 : 34,
                    height: rowH > 60 ? 46 : 34,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  }}
                >
                  <RemocnR height={rowH > 60 ? 22 : 17} color="#0b0c12" />
                </div>,
                self.name,
                self.tagline,
                fmt(score),
                true,
                "up",
                <span
                  style={{
                    height: 24 * fs,
                    padding: `0 ${9 * fs}px`,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.2)",
                    color: "#ffffff",
                    fontFamily: mono.fontFamily,
                    fontSize: 13 * fs,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    opacity: frame >= B.payoff ? Math.min(1, payoff * 2) : 0,
                    transform: `scale(${mix(0.5, 1, payoff)})`,
                  }}
                >
                  ▲ {stepCount} today
                </span>,
              )}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default LeaderboardClimb;
