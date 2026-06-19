"use client";

import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface AnimatedLineChartProps {
  data?: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  gridColor?: string;
  showDot?: boolean;
  speed?: number;
  className?: string;
}

export function AnimatedLineChart({
  data = [12, 19, 8, 15, 22, 18, 28, 25, 32],
  width = 1000,
  height = 500,
  strokeColor = "#22c55e",
  strokeWidth = 4,
  gridColor = "#27272a",
  showDot = true,
  speed = 1,
  className,
}: AnimatedLineChartProps) {
  const frame = useCurrentFrame() * speed;
  const { fps, durationInFrames } = useVideoConfig();

  const padding = 60;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * innerWidth;
    const y = padding + innerHeight - ((value - min) / range) * innerHeight;
    return { x, y };
  });

  // Analytical path length: sum of segment distances
  let pathLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    pathLength += Math.sqrt(dx * dx + dy * dy);
  }

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  // Spring-driven progress: smooth, no bounce. Matches the "smooth" preset
  // from remotion-best-practices/timing.md.
  const progress = spring({
    frame,
    fps,
    durationInFrames: Math.round(durationInFrames * 0.85),
    config: { damping: 200 },
  });

  const dashOffset = pathLength * (1 - progress);

  // Find dot position along the path at current progress
  const targetLen = pathLength * progress;
  let traveled = 0;
  let dotX = points[0].x;
  let dotY = points[0].y;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    if (traveled + segLen >= targetLen) {
      const t = (targetLen - traveled) / segLen;
      dotX = points[i - 1].x + dx * t;
      dotY = points[i - 1].y + dy * t;
      break;
    }
    traveled += segLen;
    dotX = points[i].x;
    dotY = points[i].y;
  }

  const gridRows = 4;
  const gridCols = data.length - 1;

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
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: "visible" }}
      >
        {/* Horizontal grid */}
        {Array.from({ length: gridRows + 1 }).map((_, i) => {
          const y = padding + (i / gridRows) * innerHeight;
          return (
            <line
              key={`h-${i}`}
              x1={padding}
              x2={padding + innerWidth}
              y1={y}
              y2={y}
              stroke={gridColor}
              strokeWidth={1}
            />
          );
        })}
        {/* Vertical grid */}
        {Array.from({ length: gridCols + 1 }).map((_, i) => {
          const x = padding + (i / gridCols) * innerWidth;
          return (
            <line
              key={`v-${i}`}
              x1={x}
              x2={x}
              y1={padding}
              y2={padding + innerHeight}
              stroke={gridColor}
              strokeWidth={1}
            />
          );
        })}
        {/* Axis */}
        <line
          x1={padding}
          x2={padding}
          y1={padding}
          y2={padding + innerHeight}
          stroke={gridColor}
          strokeWidth={2}
        />
        <line
          x1={padding}
          x2={padding + innerWidth}
          y1={padding + innerHeight}
          y2={padding + innerHeight}
          stroke={gridColor}
          strokeWidth={2}
        />

        {/* Animated line */}
        <path
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={dashOffset}
          style={{
            filter: `drop-shadow(0 0 12px ${strokeColor}55)`,
          }}
        />

        {showDot && progress > 0 && progress < 1 && (
          <circle
            cx={dotX}
            cy={dotY}
            r={strokeWidth * 2}
            fill={strokeColor}
            style={{
              filter: `drop-shadow(0 0 8px ${strokeColor})`,
            }}
          />
        )}
      </svg>
    </div>
  );
}
