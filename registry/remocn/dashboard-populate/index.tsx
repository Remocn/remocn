"use client";

import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface DashboardPopulateProps {
  accentColor?: string;
  kpiTarget?: number;
  speed?: number;
  className?: string;
}

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";
const MONO_FAMILY =
  "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace";

const STRUCTURE_END = 15;

function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

const BAR_VALUES = [0.55, 0.78, 0.42, 0.92, 0.66];

// Hand-coded line chart points (in 0..100 viewBox space)
const LINE_POINTS: Array<[number, number]> = [
  [0, 70],
  [16, 55],
  [32, 62],
  [48, 38],
  [64, 45],
  [80, 22],
  [100, 12],
];

function buildLinePath() {
  return LINE_POINTS.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(
    " ",
  );
}

function Tile({
  title,
  children,
  structureOpacity,
}: {
  title: string;
  children: React.ReactNode;
  structureOpacity: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        background: "linear-gradient(180deg, #131316 0%, #0d0d10 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        opacity: structureOpacity,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 40px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        {title}
      </div>
      <div style={{ flex: 1, position: "relative" }}>{children}</div>
    </div>
  );
}

export function DashboardPopulate({
  accentColor = "#22c55e",
  kpiTarget = 128400,
  speed = 1,
  className,
}: DashboardPopulateProps) {
  const frame = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  // Phase 1: structure fade in 0..15
  const structureOpacity = interpolate(frame, [0, STRUCTURE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // KPI count up
  const kpiSpring = spring({
    frame: frame - STRUCTURE_END,
    fps,
    config: { damping: 20, stiffness: 80, mass: 1 },
    durationInFrames: 60,
  });
  const kpiValue = Math.floor(kpiSpring * kpiTarget);
  const kpiDelta = interpolate(kpiSpring, [0, 1], [0, 12.4]);

  // Bar chart springs (staggered)
  const barProgress = BAR_VALUES.map((_, i) =>
    spring({
      frame: frame - STRUCTURE_END - i * 4,
      fps,
      config: { damping: 11, stiffness: 140, mass: 1 },
      durationInFrames: 40,
    }),
  );

  // Line chart stroke-dashoffset
  const linePath = buildLinePath();
  // approx length for viewBox 100x100 — use a generous constant; we set
  // pathLength on the path so dashoffset works in normalized units
  const lineProgress = interpolate(
    frame,
    [STRUCTURE_END + 4, STRUCTURE_END + 50],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Donut
  const donutTarget = 0.72;
  const donutSpring = spring({
    frame: frame - STRUCTURE_END - 6,
    fps,
    config: { damping: 13, stiffness: 110, mass: 1 },
    durationInFrames: 50,
  });
  const donutValue = donutSpring * donutTarget;
  const donutR = 70;
  const donutCircum = 2 * Math.PI * donutR;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        background: "transparent",
        fontFamily: FONT_FAMILY,
        color: "white",
        padding: 64,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        overflow: "hidden",
      }}
    >
      {/* Subtle grid bg */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: structureOpacity,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Overview
          </div>
          <div
            style={{
              fontSize: 14,
              opacity: 0.5,
              marginTop: 4,
            }}
          >
            Last 30 days
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            fontSize: 12,
            fontFamily: MONO_FAMILY,
          }}
        >
          {["1D", "7D", "30D", "ALL"].map((l, i) => (
            <div
              key={l}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                background:
                  i === 2 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {l}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 24,
        }}
      >
        {/* KPI */}
        <Tile title="Revenue" structureOpacity={structureOpacity}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              height: "100%",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                fontVariantNumeric: "tabular-nums",
                fontFamily: MONO_FAMILY,
              }}
            >
              ${formatNumber(kpiValue)}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                color: accentColor,
              }}
            >
              <span style={{ fontWeight: 600 }}>+{kpiDelta.toFixed(1)}%</span>
              <span style={{ opacity: 0.5, color: "white" }}>
                vs last month
              </span>
            </div>
          </div>
        </Tile>

        {/* Bar chart */}
        <Tile title="Sessions" structureOpacity={structureOpacity}>
          <svg
            viewBox="0 0 200 100"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%" }}
          >
            {/* axes */}
            <line
              x1="0"
              y1="100"
              x2="200"
              y2="100"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="0.5"
            />
            {[25, 50, 75].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="200"
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
            ))}
            {BAR_VALUES.map((v, i) => {
              const barH = v * 90 * barProgress[i];
              const barW = 24;
              const x = 16 + i * 36;
              const y = 100 - barH;
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={3}
                  fill={accentColor}
                  opacity={0.85}
                />
              );
            })}
          </svg>
        </Tile>

        {/* Line chart */}
        <Tile title="Active users" structureOpacity={structureOpacity}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%" }}
          >
            <line
              x1="0"
              y1="100"
              x2="100"
              y2="100"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="0.4"
            />
            {[20, 40, 60, 80].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.4"
                strokeDasharray="1.5 1.5"
              />
            ))}
            <path
              d={linePath}
              fill="none"
              stroke={accentColor}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - lineProgress}
            />
            {/* dots */}
            {LINE_POINTS.map(([px, py], i) => {
              const dotProgress = interpolate(
                lineProgress,
                [
                  i / (LINE_POINTS.length - 1),
                  i / (LINE_POINTS.length - 1) + 0.05,
                ],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              return (
                <circle
                  key={i}
                  cx={px}
                  cy={py}
                  r={1.2}
                  fill={accentColor}
                  opacity={dotProgress}
                />
              );
            })}
          </svg>
        </Tile>

        {/* Donut */}
        <Tile title="Conversion" structureOpacity={structureOpacity}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              position: "relative",
            }}
          >
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle
                cx="90"
                cy="90"
                r={donutR}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="14"
              />
              <circle
                cx="90"
                cy="90"
                r={donutR}
                fill="none"
                stroke={accentColor}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${donutCircum * donutValue} ${donutCircum}`}
                transform="rotate(-90 90 90)"
              />
            </svg>
            <div
              style={{
                position: "absolute",
                fontSize: 36,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                fontFamily: MONO_FAMILY,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {(donutValue * 100).toFixed(1)}%
            </div>
          </div>
        </Tile>
      </div>
    </div>
  );
}
