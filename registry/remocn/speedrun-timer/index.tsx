"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
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

const { fontFamily: geist } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
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

export interface SpeedrunSplit {
  name: string;
  /** Cumulative run time at this split, in seconds. */
  time: number;
  /** Cumulative personal-best time at this split, in seconds. */
  pb: number;
}

export interface SpeedrunTimerProps {
  /** Category line in the header, after the logo. */
  category?: string;
  /** The splits, in order. The last one is the finish and goes gold. */
  splits?: SpeedrunSplit[];
  /** The banner that lands when the run finishes. */
  banner?: string;
  /** Colour of the current-split marker. */
  accent?: string;
  theme?: "dark" | "light";
  /** gradients.sh preset id for the ground. */
  ground?: GshPresetId;
  /** Overrides for the ground shader. */
  groundParams?: Partial<GradientParams>;
  speed?: number;
}

const DEFAULT_SPLITS: SpeedrunSplit[] = [
  { name: "Script", time: 521, pb: 563 },
  { name: "Edit", time: 1635, pb: 1703 },
  { name: "Captions", time: 2162, pb: 2143 },
  { name: "Render", time: 2910, pb: 3041 },
  { name: "Ship", time: 3552, pb: 3737 },
];

const BEATS = {
  rowIn: 0,
  rowGap: 3,
  run: 12,
  splits: [30, 50, 66, 84, 102],
  banner: 106,
  rise: 102,
} as const;

const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    stage: "#070302",
    ink: "#F6F1EA",
    dim: "#F6F1EA80",
    faint: "#F6F1EA52",
    rule: "#FFFFFF12",
    band: "#FFFFFF0F",
    panel: "rgba(14, 9, 7, 0.62)",
    panelShadow:
      "inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.3), 0 24px 60px -18px rgba(0,0,0,0.65)",
    ahead: "#7DDBA3",
    behind: "#FF8A7A",
    gold: "#FFCF7A",
    flash: "#FFB36B",
    flashBlend: "screen",
    flashAlpha: 0.55,
    preset: "kiln" as GshPresetId,
    params: {
      colors: ["#4A0802", "#C92E0C", "#F2802E", "#FFB25E"],
    } as Partial<GradientParams>,
    veilFrom: 0.72,
    veilTo: 0.42,
  },
  light: {
    stage: "#F3EEE7",
    ink: "#1A120C",
    dim: "#1A120C8C",
    faint: "#1A120C5C",
    rule: "#0000000F",
    band: "#0000000A",
    panel: "rgba(255, 252, 248, 0.72)",
    panelShadow:
      "0 0 0 1px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.05), 0 20px 50px -20px rgba(60,30,10,0.25)",
    ahead: "#16884A",
    behind: "#C93A2B",
    gold: "#A86A00",
    flash: "#FFC07A",
    flashBlend: "multiply",
    flashAlpha: 0.45,
    preset: "paper-crease" as GshPresetId,
    params: {
      colors: ["#FF9A4A", "#FFC89A", "#F7E4D2", "#6A2A10"],
      background: "#F3EEE7",
    } as Partial<GradientParams>,
    veilFrom: 0.6,
    veilTo: 0.15,
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
  if (d < 0 || d > 9) return { x: 0, y: 0 };
  const k = (1 - d / 9) ** 2;
  return {
    x: amp * k * Math.sin(d * 2.7 + seed),
    y: amp * 0.7 * k * Math.cos(d * 3.3 + seed * 1.7),
  };
}

function clockParts(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return {
    head: `${h}:${String(m).padStart(2, "0")}`,
    tail: `:${String(r).padStart(2, "0")}`,
  };
}

function clock(sec: number) {
  const p = clockParts(sec);
  return p.head + p.tail;
}

function delta(sec: number) {
  const a = Math.abs(Math.round(sec));
  const sign = sec < 0 ? "−" : "+";
  return `${sign}${Math.floor(a / 60)}:${String(a % 60).padStart(2, "0")}`;
}

function Tabular({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: ch === ":" ? "0.3em" : "0.6em",
            textAlign: "center",
          }}
        >
          {ch}
        </span>
      ))}
    </>
  );
}

export function SpeedrunTimer({
  category = "Launch video · Any%",
  splits = DEFAULT_SPLITS,
  banner = "World record",
  accent = "#3B5BFD",
  theme = "dark",
  ground,
  groundParams,
  speed = 1,
}: SpeedrunTimerProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const tall = H > W;
  const u = Math.min(W / 1280, H / 720);

  const n = splits.length;
  const last = BEATS.splits[BEATS.splits.length - 1];
  const frames = splits.map((_, i) => BEATS.splits[i] ?? last + 18 * (i - 4));
  const finishAt = frames[n - 1];
  const done = t >= finishAt;

  const runTime = interpolate(
    t,
    [BEATS.run, ...frames],
    [0, ...splits.map((s) => s.time)],
    CLAMP,
  );

  let bump = 0;
  frames.forEach((f, i) => {
    bump = Math.max(bump, (i === n - 1 ? 1.3 : 0.3) * kick(t - f));
  });
  const hit = shake(t - finishAt, 9 * u, 1.3);
  const camScale = 1 + 0.025 * bump;
  const flash = done ? Math.max(0, 1 - (t - finishAt) / 4) ** 2 : 0;

  let tint = 0;
  let tintColor: string = c.ink;
  frames.forEach((f, i) => {
    const d = t - f;
    if (d >= 0 && d < 10 && i < n - 1) {
      tint = (1 - d / 10) ** 2;
      tintColor = splits[i].time <= splits[i].pb ? c.ahead : c.behind;
    }
  });
  const timerColor = done ? c.gold : c.ink;

  const wr = spring({ frame: t - BEATS.banner, fps, config: CARD });
  const blinkOff =
    (t >= BEATS.banner + 6 && t < BEATS.banner + 8) ||
    (t >= BEATS.banner + 11 && t < BEATS.banner + 13);
  const wrOpacity =
    t < BEATS.banner ? 0 : blinkOff ? 0 : ramp(t, BEATS.banner, 2);

  const rise = LIGHT(ramp(t, BEATS.rise, 28));
  const veil = c.veilFrom + (c.veilTo - c.veilFrom) * rise;
  const groundShift = ((tall ? 0.1 : 0.08) + (1 - rise) * 0.12) * H;

  const L = tall
    ? {
        pad: 0.07 * W,
        headerTop: 0.07 * H,
        panelTop: 0.135 * H,
        panelW: 0.86 * W,
        rowH: 0.052 * H,
        rowFs: 0.024 * H,
        deltaFs: 0.019 * H,
        labelFs: 0.016 * H,
        logoFs: 0.022 * H,
        timerFs: 0.215 * W,
        timerTop: 0.555 * H,
        bannerFs: 0.072 * W,
        bannerTop: 0.49 * H,
        timeColW: 0.22 * W,
        deltaColW: 0.17 * W,
      }
    : {
        pad: 0.0625 * W,
        headerTop: 0.07 * H,
        panelTop: 0.15 * H,
        panelW: 0.56 * W,
        rowH: 0.074 * H,
        rowFs: 0.036 * H,
        deltaFs: 0.029 * H,
        labelFs: 0.024 * H,
        logoFs: 0.036 * H,
        timerFs: 0.3 * H,
        timerTop: 0.7 * H,
        bannerFs: 0.07 * H,
        bannerTop: 0.58 * H,
        timeColW: 0.12 * W,
        deltaColW: 0.1 * W,
      };
  const inset = 8 * u;
  const radius = 18 * u;

  let bandIndex = 0;
  frames.forEach((f, i) => {
    if (i < n - 1) bandIndex += spring({ frame: t - f, fps, config: CARD });
  });
  const bandOpacity =
    ramp(t, BEATS.run - 4, 6) * (1 - LIGHT(ramp(t, finishAt, 6)));

  const monoLabel: React.CSSProperties = {
    fontFamily: mono,
    fontWeight: 400,
    fontSize: L.labelFs,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: c.dim,
    lineHeight: 1,
  };

  const panelIn = spring({ frame: t - BEATS.rowIn, fps, config: HEAVY });
  const pbParts = clockParts(splits[n - 1]?.pb ?? 0);
  const pbPop = spring({ frame: t - finishAt - 2, fps, config: CHIP });
  const timerText = clock(runTime);

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          top: -0.3 * H,
          height: 1.55 * H,
          transform: `translateY(${groundShift - 0.25 * H}px) scale(1.06)`,
        }}
      >
        <GshGround
          preset={ground ?? c.preset}
          params={groundParams ?? c.params}
          timeOffset={5}
          timeScale={0.4}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: c.stage, opacity: veil }} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${hit.x}px, ${hit.y}px) scale(${camScale})`,
          transformOrigin: "60% 70%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: L.pad,
            right: L.pad,
            top: L.headerTop,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: ENTER(ramp(t, 0, 10)),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 * u }}>
            <RemocnLogo fontSize={L.logoFs} color={c.ink} />
            <span style={monoLabel}>{category}</span>
          </div>
        </div>

        {tall ? null : (
          <div
            style={{
              position: "absolute",
              right: L.pad,
              top: L.panelTop + inset + 0.012 * H,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 0.022 * H,
              opacity: ENTER(ramp(t, 4, 12)),
              transform: `translateY(${(1 - panelIn) * 0.04 * H}px)`,
            }}
          >
            <span style={monoLabel}>Personal best</span>
            <span
              style={{
                fontFamily: geist,
                fontWeight: 300,
                fontSize: 0.1 * H,
                lineHeight: 0.8,
                letterSpacing: "-0.03em",
                fontVariantNumeric: "tabular-nums",
                color: done ? c.faint : c.ink,
                textDecoration: done ? "line-through" : undefined,
                textDecorationThickness: 2 * u,
              }}
            >
              {pbParts.head}
              {pbParts.tail}
            </span>
            <span
              style={{
                fontFamily: mono,
                fontWeight: 400,
                fontSize: 0.036 * H,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                color: c.gold,
                opacity: done ? ramp(t, finishAt + 2, 3) : 0,
                transform: `scale(${1.3 - 0.3 * pbPop})`,
                transformOrigin: "100% 50%",
              }}
            >
              {delta((splits[n - 1]?.time ?? 0) - (splits[n - 1]?.pb ?? 0))}
            </span>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            left: L.pad,
            top: L.panelTop,
            width: L.panelW,
            padding: inset,
            borderRadius: radius,
            background: c.panel,
            boxShadow: c.panelShadow,
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            opacity: ramp(t, 0, 4),
            transform: `translateY(${(1 - panelIn) * 0.05 * H}px)`,
          }}
        >
          <div style={{ position: "relative", height: n * L.rowH }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: bandIndex * L.rowH,
                height: L.rowH,
                borderRadius: radius - inset,
                background: c.band,
                opacity: bandOpacity,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 9 * u,
                  top: "28%",
                  bottom: "28%",
                  width: 4 * u,
                  borderRadius: 2 * u,
                  background: accent,
                }}
              />
            </div>
            {splits.map((s, i) => {
              const at = frames[i];
              const isLast = i === n - 1;
              const completed = t >= at;
              const inK = spring({
                frame: t - BEATS.rowIn - 2 - i * BEATS.rowGap,
                fps,
                config: CARD,
              });
              const pop = spring({ frame: t - at, fps, config: CHIP });
              const ahead = s.time <= s.pb;
              const deltaColor = isLast ? c.gold : ahead ? c.ahead : c.behind;
              const rowFlash = completed
                ? Math.max(0, 1 - (t - at) / 12) ** 2
                : 0;
              const rowInk = isLast && completed ? c.gold : c.ink;
              const parts = clockParts(completed ? s.time : s.pb);
              return (
                <div
                  key={s.name}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: i * L.rowH,
                    height: L.rowH,
                    display: "flex",
                    alignItems: "center",
                    padding: `0 ${22 * u}px 0 ${26 * u}px`,
                    borderTop: i === 0 ? undefined : `1px solid ${c.rule}`,
                    opacity: ramp(t, BEATS.rowIn + 2 + i * BEATS.rowGap, 4),
                    transform: `translateY(${(1 - inK) * 0.4 * L.rowH}px)`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: radius - inset,
                      background: deltaColor,
                      opacity: 0.16 * rowFlash,
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      fontFamily: geist,
                      fontWeight: 400,
                      fontSize: L.rowFs,
                      letterSpacing: "-0.01em",
                      color: rowInk,
                      lineHeight: 1,
                    }}
                  >
                    {s.name}
                  </div>
                  <div
                    style={{
                      width: L.deltaColW,
                      textAlign: "right",
                      fontFamily: mono,
                      fontWeight: 400,
                      fontSize: L.deltaFs,
                      fontVariantNumeric: "tabular-nums",
                      color: deltaColor,
                      lineHeight: 1,
                      opacity: completed ? ramp(t, at, 2) : 0,
                      transform: `scale(${1.3 - 0.3 * pop})`,
                      transformOrigin: "100% 50%",
                    }}
                  >
                    {delta(s.time - s.pb)}
                  </div>
                  <div
                    style={{
                      width: L.timeColW,
                      textAlign: "right",
                      fontFamily: geist,
                      fontWeight: 400,
                      fontSize: L.rowFs,
                      fontVariantNumeric: "tabular-nums",
                      color: completed ? rowInk : c.faint,
                      lineHeight: 1,
                    }}
                  >
                    {parts.head}
                    <span style={{ opacity: completed ? 0.55 : 1 }}>
                      {parts.tail}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: L.pad,
            top: L.bannerTop,
            fontFamily: geist,
            fontWeight: 300,
            fontSize: L.bannerFs,
            lineHeight: 1,
            letterSpacing: "0.01em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            color: c.gold,
            opacity: wrOpacity,
            transform: `scale(${1.35 - 0.35 * wr})`,
            transformOrigin: "100% 100%",
            filter:
              wr < 0.97 ? `blur(${Math.max(0, 1 - wr) * 10 * u}px)` : undefined,
          }}
        >
          {banner}
        </div>

        <div
          style={{
            position: "absolute",
            right: L.pad - 0.02 * L.timerFs,
            top: L.timerTop,
            fontFamily: geist,
            fontWeight: 300,
            fontSize: L.timerFs,
            lineHeight: 0.8,
            letterSpacing: "-0.03em",
            color: t < BEATS.run ? c.dim : timerColor,
            whiteSpace: "nowrap",
          }}
        >
          <Tabular text={timerText} />
          {tint > 0.01 ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                color: tintColor,
                opacity: tint,
              }}
            >
              <Tabular text={timerText} />
            </div>
          ) : null}
        </div>
      </div>

      {flash > 0.01 ? (
        <AbsoluteFill
          style={{
            background: c.flash,
            mixBlendMode: c.flashBlend,
            opacity: c.flashAlpha * flash,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
}
