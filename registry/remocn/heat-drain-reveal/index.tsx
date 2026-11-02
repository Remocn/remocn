"use client";

import { loadFont as loadOnest } from "@remotion/google-fonts/Onest";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
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

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const DRAIN = Easing.bezier(0.55, 0, 0.45, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const SWAY = Easing.bezier(0.45, 0, 0.55, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const B = {
  words: -10,
  recede: 8,
  rise: 4,
  drain: 24,
  drainLen: 48,
  tiltEnd: 78,
  halo: 52,
  chip: 78,
  end: 126,
};

export const HEAT_DRAIN_REVEAL_DURATION = B.end;

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type CalEvent = { day: number; label: string; launch?: boolean };

export interface HeatDrainRevealProps {
  theme?: "dark" | "light";
  heat?: string[];
  accent?: string;
  headline?: string;
  monthLabel?: string;
  firstDay?: number;
  daysInPrevMonth?: number;
  daysInMonth?: number;
  events?: CalEvent[];
  upcoming?: { when: string; title: string; time: string }[];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DARK_GROUND: Partial<GradientParams> = {
  kind: "mist",
  colors: ["#ff9a5a", "#a8401a", "#3a1408", "#0d0604"],
  background: "#060302",
  speed: 0.6,
  scale: 0.9,
  blur: 0.75,
  grain: 0.14,
};

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  colors: ["#ffd9b0", "#ffb47a", "#fbeee2", "#e8d7c6"],
  background: "#f5f1ec",
  speed: 0.6,
  blur: 0.75,
  grain: 0.18,
};

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// The 4×4 Bayer matrix the gsh dither-field shader uses, as a grey tile
// holding each cell's threshold.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const BAYER_TILE = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4" shape-rendering="crispEdges">${BAYER.map(
    (b, i) => {
      const t = Math.round(((b + 0.5) / 16) * 255);
      return `<rect x="${i % 4}" y="${Math.floor(i / 4)}" width="1" height="1" fill="rgb(${t},${t},${t})"/>`;
    },
  ).join("")}</svg>`,
)}`;

/**
 * Ordered dither on the light's alpha, the dither-field look in CSS: alpha is
 * snapped to `levels` steps with a Bayer threshold, so a smooth falloff turns
 * into fine cells while its average stays put. Solid light passes untouched.
 * `amount` mixes the cells back over the smooth light.
 */
function DitherFilter({
  id,
  cell,
  levels,
  amount,
}: {
  id: string;
  cell: number;
  levels: number;
  amount: number;
}) {
  const table = Array.from({ length: levels + 1 }, (_, k) =>
    (k / levels).toFixed(4),
  ).join(" ");
  return (
    <svg width={0} height={0} aria-hidden style={{ position: "absolute" }}>
      <filter
        id={id}
        x="0"
        y="0"
        width="100%"
        height="100%"
        colorInterpolationFilters="sRGB"
      >
        <feImage
          href={BAYER_TILE}
          x={0}
          y={0}
          width={cell * 4}
          height={cell * 4}
          preserveAspectRatio="none"
          result="tile"
        />
        <feTile in="tile" result="bayer" />
        {/* Alpha into grey, nudged so the blur's ~0.98 rim at the card edge stays solid. */}
        <feColorMatrix
          in="SourceGraphic"
          values="0 0 0 1.06 0  0 0 0 1.06 0  0 0 0 1.06 0  0 0 0 0 1"
          result="alpha"
        />
        {/* (levels·a + t) / (levels + 1), so the step table reads floor(levels·a + t). */}
        <feComposite
          in="alpha"
          in2="bayer"
          operator="arithmetic"
          k2={levels / (levels + 1)}
          k3={1 / (levels + 1)}
          result="sum"
        />
        <feColorMatrix
          in="sum"
          values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1 0 0 0 0"
          result="lift"
        />
        <feComponentTransfer in="lift" result="steps">
          <feFuncA type="discrete" tableValues={table} />
        </feComponentTransfer>
        <feColorMatrix
          in="SourceGraphic"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1"
          result="solid"
        />
        <feComposite in="solid" in2="steps" operator="in" result="cells" />
        <feComposite
          in="cells"
          in2="SourceGraphic"
          operator="arithmetic"
          k2={amount}
          k3={1 - amount}
        />
      </filter>
    </svg>
  );
}

function Chevron({
  size,
  color,
  flip,
}: {
  size: number;
  color: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
    >
      <path
        d="m9 6 6 6-6 6"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeatDrainReveal({
  theme = "dark",
  heat = ["#fff1df", "#ffc48a", "#ff9447", "#f56a22", "#d9481a"],
  accent = "#ff7a2e",
  headline = "Plan the whole launch week.",
  monthLabel = "2026 / 11",
  firstDay = 26,
  daysInPrevMonth = 31,
  daysInMonth = 30,
  events = [
    { day: 4, label: "Beta" },
    { day: 10, label: "Docs" },
    { day: 13, label: "Press" },
    { day: 19, label: "Launch", launch: true },
    { day: 24, label: "Recap" },
  ],
  upcoming = [
    { when: "Thu 19", title: "Launch day", time: "09:00" },
    { when: "Fri 13", title: "Press preview", time: "14:30" },
    { when: "Tue 24", title: "Launch recap", time: "11:00" },
  ],
  ground,
  groundParams,
}: HeatDrainRevealProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const ditherId = `hdr-dither-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const portrait = height > width * 1.2;
  const stageW = portrait ? 1080 : 1280;
  const stageH = portrait ? 1920 : 720;
  const sc = width / stageW;

  const u = portrait ? 1.48 : 1.12;
  const cw = (portrait ? 650 : 640) * u;
  const pad = 28 * u;
  const headerH = 64 * u;
  const weekH = 34 * u;
  const cellH = (portrait ? 80 : 74) * u;
  const gridH = cellH * 5;
  const upH = portrait ? 262 * u : 0;
  const ch = pad + headerH + weekH + gridH + upH + pad * 0.7;
  const radius = 24 * u;

  const ink = dark ? "#f6efe8" : "#1b1612";
  const muted = dark ? "rgba(246,236,226,0.5)" : "rgba(27,22,18,0.46)";
  const faint = dark ? "rgba(246,236,226,0.26)" : "rgba(27,22,18,0.24)";
  const hair = dark ? "rgba(255,240,226,0.09)" : "rgba(60,40,20,0.09)";

  const rise = spring({ frame: frame - B.rise, fps, config: HEAVY });
  const tilt = mix(24, 0, ramp(frame, B.rise, B.tiltEnd - B.rise, MOVE));
  const drain = ramp(frame, B.drain, B.drainLen, DRAIN);
  const feather = 84 * u;
  const front = mix(-feather * 0.6, ch + feather, drain);
  const halo = ramp(frame, B.halo, 30, LIGHT);
  const breathe = 0.9 + 0.1 * Math.sin(((frame - B.halo) / 36) * Math.PI);
  const recede = ramp(frame, B.recede, 14, EXIT);
  const lift = spring({ frame: frame - B.recede, fps, config: HEAVY });
  const push = 1 + 0.03 * ramp(frame, B.rise + 20, B.end - B.rise - 20, SWAY);
  const chipS = spring({ frame: frame - B.chip, fps, config: CHIP });
  const chipOn = ramp(frame, B.chip, 4);

  const reveal = (y: number) => clamp01((front - y) / (feather * 0.55));
  const rowStyle = (y: number) => {
    const p = reveal(y);
    return {
      opacity: mix(0.15, 1, p),
      filter: p < 1 ? `blur(${(1 - p) * 5 * u}px)` : undefined,
      transform: `translateY(${(1 - p) * 8 * u}px)`,
    };
  };

  const bands = Array.from({ length: 16 }).map((_, i) => {
    const h = 0.04 + random(`hb-h-${i}`) * 0.08;
    const a = Math.floor(random(`hb-a-${i}`) * 3);
    const b = 1 + Math.floor(random(`hb-b-${i}`) * (heat.length - 1));
    const stop = 25 + random(`hb-s-${i}`) * 50;
    const drift = (random(`hb-d-${i}`) - 0.5) * 40;
    return { h, a, b, stop, drift };
  });
  const bandSum = bands.reduce((s, b) => s + b.h, 0);

  const grid: { day: number; inMonth: boolean }[] = [];
  for (let i = 0; i < 35; i++) {
    const d = firstDay + i;
    if (d <= daysInPrevMonth) grid.push({ day: d, inMonth: false });
    else {
      const m = d - daysInPrevMonth;
      grid.push({ day: m, inMonth: m <= daysInMonth });
    }
  }

  const resolvedGround: GshPresetId = ground ?? (dark ? "hearth" : "glasswork");
  const resolvedParams = groundParams ?? (dark ? DARK_GROUND : LIGHT_GROUND);

  const surface = dark
    ? "linear-gradient(180deg, #1d1814 0%, #120f0c 100%)"
    : "linear-gradient(180deg, #ffffff 0%, #fcfaf8 100%)";

  const headerY = pad;
  const weekY = pad + headerH;
  const gridY = weekY + weekH;
  const upY = gridY + gridH + 18 * u;

  const cardTop = stageH / 2 - ch / 2 + (portrait ? 110 : 0);
  const riseY = mix(stageH * 0.75, 0, rise);

  return (
    <AbsoluteFill style={{ fontFamily: onest.fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={resolvedGround}
        params={resolvedParams}
        timeOffset={3}
        timeScale={0.5}
      />
      <AbsoluteFill
        style={{
          background: dark ? "#070403" : "#f7f3ee",
          opacity: dark ? 0.3 : 0.22,
        }}
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
            perspective: 1700 * u,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: portrait ? stageH * 0.42 : stageH * 0.44,
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              padding: `0 ${stageW * 0.08}px`,
              fontSize: portrait ? 96 : 60,
              fontWeight: 300,
              letterSpacing: "-0.035em",
              lineHeight: 1.08,
              color: ink,
              opacity: portrait ? 1 : 1 - recede,
              filter:
                !portrait && recede > 0 ? `blur(${recede * 14}px)` : undefined,
              transformOrigin: "50% 0%",
              transform: portrait
                ? `translateY(${mix(0, 190 - stageH * 0.42, lift)}px) scale(${mix(1, 0.6, lift)})`
                : `scale(${mix(1, 0.88, recede)}) translateY(${-recede * 30}px)`,
            }}
          >
            {headline.split(" ").map((w, i) => {
              const p = ramp(frame, B.words + i * 2, 14);
              return (
                <span
                  key={`${w}-${i.toString()}`}
                  style={{
                    display: "inline-block",
                    overflow: "hidden",
                    paddingBottom: "0.12em",
                    marginBottom: "-0.12em",
                    marginRight: "0.24em",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      transform: `translateY(${mix(105, 0, p)}%)`,
                      filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined,
                    }}
                  >
                    {w}
                  </span>
                </span>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: stageW / 2 - cw / 2,
              top: cardTop,
              width: cw,
              height: ch,
              transform: `translateY(${riseY}px) rotateX(${tilt}deg)`,
              transformOrigin: "50% 100%",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -cw * 0.24,
                right: -cw * 0.24,
                bottom: -ch * 0.3,
                height: ch * 0.5,
                borderRadius: "50%",
                background: `radial-gradient(50% 50% at 50% 50%, ${heat[2]} 0%, color-mix(in oklab, ${heat[3]} 70%, transparent) 38%, transparent 72%)`,
                filter: `blur(${34 * u}px)`,
                opacity: halo * breathe * (dark ? 1 : 0.8),
                transform: `scale(${mix(0.6, 1, halo)})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: radius,
                overflow: "hidden",
                background: surface,
                border: `1px solid ${hair}`,
                boxShadow: dark
                  ? `inset 0 1px 0 rgba(255,240,226,0.07), 0 2px 6px rgba(0,0,0,0.35), 0 ${30 * u}px ${70 * u}px rgba(10,4,0,0.55)`
                  : `inset 0 1px 0 #fff, 0 1px 2px rgba(60,30,10,0.06), 0 ${20 * u}px ${44 * u}px rgba(80,40,10,0.12), 0 ${60 * u}px ${110 * u}px rgba(120,60,20,0.12)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: pad,
                  right: pad,
                  top: headerY,
                  height: headerH,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  color: ink,
                  ...rowStyle(headerY + headerH / 2),
                }}
              >
                <div
                  style={{
                    fontSize: 32 * u,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {monthLabel}
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 8 * u }}
                >
                  <div
                    style={{
                      padding: `${6 * u}px ${12 * u}px`,
                      borderRadius: 99,
                      border: `1px solid ${hair}`,
                      fontSize: 16 * u,
                      color: ink,
                    }}
                  >
                    Today
                  </div>
                  <Chevron size={22 * u} color={muted} flip />
                  <Chevron size={22 * u} color={muted} />
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  left: pad,
                  right: pad,
                  top: weekY,
                  height: weekH,
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  fontSize: 15 * u,
                  color: muted,
                  ...rowStyle(weekY + weekH / 2),
                }}
              >
                {WEEKDAYS.map((d) => (
                  <div key={d} style={{ paddingLeft: 8 * u }}>
                    {d}
                  </div>
                ))}
              </div>

              {Array.from({ length: 5 }).map((_, row) => {
                const y = gridY + row * cellH;
                return (
                  <div
                    key={`row-${row.toString()}`}
                    style={{
                      position: "absolute",
                      left: pad,
                      right: pad,
                      top: y,
                      height: cellH,
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      borderTop: `1px solid ${hair}`,
                      ...rowStyle(y + cellH / 2),
                    }}
                  >
                    {grid.slice(row * 7, row * 7 + 7).map((c, col) => {
                      const ev = c.inMonth
                        ? events.find((e) => e.day === c.day)
                        : undefined;
                      const isLaunch = Boolean(ev?.launch);
                      return (
                        <div
                          key={`c-${row.toString()}-${col.toString()}`}
                          style={{
                            position: "relative",
                            padding: `${8 * u}px ${8 * u}px`,
                            display: "flex",
                            flexDirection: "column",
                            gap: 6 * u,
                          }}
                        >
                          <div
                            style={{
                              position: "relative",
                              width: 34 * u,
                              height: 30 * u,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginLeft: -2 * u,
                            }}
                          >
                            {isLaunch ? (
                              <div
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  borderRadius: 9 * u,
                                  background: `linear-gradient(180deg, ${heat[2]} 0%, ${accent} 100%)`,
                                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 ${6 * u}px ${16 * u}px color-mix(in oklab, ${accent} 45%, transparent)`,
                                  opacity: chipOn,
                                  transform: `scale(${mix(0.4, 1, chipS)})`,
                                }}
                              />
                            ) : null}
                            <span
                              style={{
                                position: "relative",
                                fontSize: 18 * u,
                                fontVariantNumeric: "tabular-nums",
                                color:
                                  isLaunch && chipOn > 0.5
                                    ? "#fff"
                                    : c.inMonth
                                      ? col > 4
                                        ? muted
                                        : ink
                                      : faint,
                              }}
                            >
                              {c.day}
                            </span>
                          </div>
                          {ev ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5 * u,
                                fontSize: 15 * u,
                                padding: `${3 * u}px ${7 * u}px`,
                                borderRadius: 6 * u,
                                alignSelf: "flex-start",
                                color: isLaunch ? accent : ink,
                                background: isLaunch
                                  ? `color-mix(in oklab, ${accent} ${Math.round(16 * chipOn)}%, transparent)`
                                  : dark
                                    ? "rgba(255,240,226,0.06)"
                                    : "rgba(60,40,20,0.05)",
                                opacity: isLaunch
                                  ? ramp(frame, B.chip + 4, 8)
                                  : 1,
                              }}
                            >
                              <div
                                style={{
                                  width: 2 * u,
                                  height: 12 * u,
                                  borderRadius: 1,
                                  background: isLaunch ? accent : muted,
                                }}
                              />
                              {ev.label}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {portrait ? (
                <div
                  style={{
                    position: "absolute",
                    left: pad,
                    right: pad,
                    top: upY,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      fontSize: 16 * u,
                      color: muted,
                      paddingBottom: 10 * u,
                      ...rowStyle(upY + 12 * u),
                    }}
                  >
                    Upcoming
                  </div>
                  {upcoming.map((e, i) => {
                    const y = upY + 40 * u + i * 64 * u;
                    const first = i === 0;
                    return (
                      <div
                        key={e.title}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14 * u,
                          height: 64 * u,
                          borderTop: `1px solid ${hair}`,
                          fontSize: 19 * u,
                          color: ink,
                          ...rowStyle(y + 32 * u),
                        }}
                      >
                        <div
                          style={{
                            width: 4 * u,
                            height: 28 * u,
                            borderRadius: 2 * u,
                            background: first ? accent : muted,
                          }}
                        />
                        <div style={{ width: 92 * u, color: muted }}>
                          {e.when}
                        </div>
                        <div style={{ flex: 1 }}>{e.title}</div>
                        <div
                          style={{
                            color: muted,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {e.time}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <DitherFilter
                id={ditherId}
                cell={2}
                levels={dark ? 5 : 3}
                amount={dark ? 0.7 : 0.9}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  filter:
                    drain > 0 && drain < 1 ? `url(#${ditherId})` : undefined,
                  opacity: drain >= 1 ? 0 : 0.94,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    maskImage: `linear-gradient(180deg, transparent ${front - feather * 0.45}px, black ${front}px)`,
                    WebkitMaskImage: `linear-gradient(180deg, transparent ${front - feather * 0.45}px, black ${front}px)`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: -20 * u,
                      display: "flex",
                      flexDirection: "column",
                      filter: `blur(${9 * u}px)`,
                    }}
                  >
                    {bands.map((b, i) => (
                      <div
                        key={`band-${i.toString()}`}
                        style={{
                          height: `${(b.h / bandSum) * 100}%`,
                          background: `linear-gradient(90deg, ${heat[b.a]} 0%, ${heat[b.b]} ${b.stop + b.drift * (frame / 60)}%, ${heat[Math.max(0, b.a - 1)]} 100%)`,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: front - feather * 1.1,
                    height: feather * 1.3,
                    background: `linear-gradient(180deg, transparent 0%, color-mix(in oklab, ${heat[0]} ${dark ? 62 : 60}%, transparent) 64%, color-mix(in oklab, ${heat[0]} ${dark ? 70 : 55}%, transparent) 84%, transparent 100%)`,
                    filter: `blur(${8 * u}px)`,
                    opacity: drain > 0 && drain < 1 ? 1 : 0,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default HeatDrainReveal;
