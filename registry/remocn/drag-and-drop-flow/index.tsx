"use client";

import {
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface DragAndDropFlowProps {
  accent?: string;
  dropzoneLabel?: string;
  fileName?: string;
  speed?: number;
  className?: string;
}

function FileIcon({ color }: { color: string }) {
  return (
    <svg width="44" height="56" viewBox="0 0 44 56" fill="none">
      <path
        d="M6 4a4 4 0 014-4h18l12 12v40a4 4 0 01-4 4H10a4 4 0 01-4-4V4z"
        fill="white"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M28 0v8a4 4 0 004 4h8"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="12"
        y="22"
        width="20"
        height="2"
        rx="1"
        fill={color}
        opacity="0.5"
      />
      <rect
        x="12"
        y="28"
        width="16"
        height="2"
        rx="1"
        fill={color}
        opacity="0.5"
      />
      <rect
        x="12"
        y="34"
        width="18"
        height="2"
        rx="1"
        fill={color}
        opacity="0.5"
      />
    </svg>
  );
}

export function DragAndDropFlow({
  accent = "#0ea5e9",
  dropzoneLabel = "Drop file to upload",
  fileName = "design.fig",
  speed = 1,
  className,
}: DragAndDropFlowProps) {
  const frame = useCurrentFrame() * speed;
  const { durationInFrames } = useVideoConfig();

  // Phase split
  const dragEnd = Math.round(durationInFrames * 0.45);
  const highlightEnd = Math.round(durationInFrames * 0.55);
  const progressEnd = durationInFrames;

  // Phase 1: file moves from start to center of dropzone
  const dragProgress = interpolate(frame, [0, dragEnd], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const startX = -220;
  const startY = -120;
  const fileX = interpolate(dragProgress, [0, 1], [startX, 0]);
  const fileY = interpolate(dragProgress, [0, 1], [startY, 0]);

  // Phase 2: dropzone border highlights as file approaches
  const borderColor = interpolateColors(
    frame,
    [dragEnd - 10, highlightEnd],
    ["#d4d4d8", accent],
  );

  // Phase 3: file fades, progress bar grows
  const fileOpacity = interpolate(
    frame,
    [highlightEnd - 4, highlightEnd + 8],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const progressOpacity = interpolate(
    frame,
    [highlightEnd, highlightEnd + 6],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const progress = interpolate(
    frame,
    [highlightEnd, progressEnd - 4],
    [0, 100],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const dropzoneWidth = 420;
  const dropzoneHeight = 260;

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
      <div
        style={{
          position: "relative",
          width: dropzoneWidth,
          height: dropzoneHeight,
          borderRadius: 18,
          border: `2.5px dashed ${borderColor}`,
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 14,
          color: "#71717a",
          fontSize: 16,
          fontWeight: 500,
          transition: "none",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
            stroke={borderColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{dropzoneLabel}</span>

        {/* Progress bar (after drop) */}
        <div
          style={{
            position: "absolute",
            left: 32,
            right: 32,
            bottom: 32,
            opacity: progressOpacity,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              color: "#52525b",
            }}
          >
            <span>{fileName}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: "#e4e4e7",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: accent,
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      </div>

      {/* Animated file icon that moves into the dropzone */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          marginLeft: -22,
          marginTop: -28,
          transform: `translate(${fileX}px, ${fileY}px)`,
          opacity: fileOpacity,
          filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.15))",
        }}
      >
        <FileIcon color={accent} />
      </div>
    </div>
  );
}
