"use client";

import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface AnimatedBarChartProps {
  data?: number[];
  labels?: string[];
  width?: number;
  height?: number;
  barColor?: string;
  gap?: number;
  staggerFrames?: number;
  speed?: number;
  className?: string;
}

export function AnimatedBarChart({
  data = [35, 60, 45, 80, 55, 70, 90, 65],
  labels,
  width = 1000,
  height = 500,
  barColor = "#0ea5e9",
  gap = 16,
  staggerFrames = 6,
  speed = 1,
  className,
}: AnimatedBarChartProps) {
  const frame = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const padding = 60;
  const labelSpace = labels ? 40 : 0;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2 - labelSpace;
  const max = Math.max(...data);
  const barWidth = (innerWidth - gap * (data.length - 1)) / data.length;
  const baseY = padding + innerHeight;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Baseline */}
        <line
          x1={padding}
          x2={padding + innerWidth}
          y1={baseY}
          y2={baseY}
          stroke="#27272a"
          strokeWidth={2}
        />

        {data.map((value, index) => {
          const targetHeight = (value / max) * innerHeight;
          const x = padding + index * (barWidth + gap);
          const y = baseY - targetHeight;

          const scaleY = spring({
            frame: frame - index * staggerFrames,
            fps,
            config: { damping: 12, stiffness: 100, mass: 0.8 },
            from: 0,
            to: 1,
          });

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={targetHeight}
                rx={6}
                fill={barColor}
                style={{
                  transform: `scaleY(${scaleY})`,
                  transformOrigin: `${x + barWidth / 2}px ${baseY}px`,
                  transformBox: "fill-box",
                  filter: `drop-shadow(0 4px 16px ${barColor}55)`,
                }}
              />
              {labels && labels[index] && (
                <text
                  x={x + barWidth / 2}
                  y={baseY + 28}
                  fill="#a1a1aa"
                  fontSize={16}
                  textAnchor="middle"
                  style={{
                    opacity: scaleY,
                    fontFamily:
                      "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
                  }}
                >
                  {labels[index]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
