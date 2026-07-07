"use client";

import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  FLOW_BG,
  FLOW_INK,
  FLOW_MUTED,
  FLOW_YELLOW,
  FONT_SERIF,
} from "../foundation";

function FlowithLogo({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: FLOW_YELLOW,
        borderRadius: size * 0.24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width={size * 0.58}
        height={size * 0.58}
        viewBox="0 0 24 24"
        fill="white"
      >
        <path d="M12 2 C12 6.5 15.5 10 20 12 C15.5 14 12 17.5 12 22 C12 17.5 8.5 14 4 12 C8.5 10 12 6.5 12 2 Z" />
      </svg>
    </div>
  );
}

const WORDS = ["AI-Powered", "Work", "Operating", "System"] as const;
const STAGGER = 10;

function WordReveal({
  word,
  index,
  f,
  fps,
}: {
  word: string;
  index: number;
  f: number;
  fps: number;
}) {
  const reveal = spring({
    frame: f - index * STAGGER,
    fps,
    config: { damping: 18, stiffness: 110 },
  });
  const ty = interpolate(reveal, [0, 1], [60, 0]);
  const blur = interpolate(reveal, [0, 1], [6, 0]);

  const isWork = word === "Work";
  const settle = isWork
    ? interpolate(f, [index * STAGGER + 6, index * STAGGER + 24], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const color = isWork
    ? interpolateColors(settle, [0, 1], [FLOW_MUTED, FLOW_INK])
    : FLOW_INK;

  return (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        paddingBottom: "0.06em",
      }}
    >
      <span
        style={{
          display: "inline-block",
          color,
          transform: `translateY(${ty}%)`,
          filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          willChange: "transform, filter",
        }}
      >
        {word}
      </span>
    </span>
  );
}

export function Positioning({ speed = 1 }: { speed?: number }) {
  const f = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const headlineOpacity = interpolate(f, [55, 70], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lockupReveal = spring({
    frame: f - 70,
    fps,
    config: { damping: 22, stiffness: 95 },
  });
  const lockupOpacity = interpolate(f, [68, 84], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lockupScale = interpolate(lockupReveal, [0, 1], [0.88, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: FLOW_BG }}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: headlineOpacity,
          willChange: "opacity",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "baseline",
            gap: "0.28em",
            fontFamily: FONT_SERIF,
            fontSize: 80,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
          }}
        >
          {WORDS.map((word, i) => (
            <WordReveal key={word} word={word} index={i} f={f} fps={fps} />
          ))}
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: lockupOpacity,
          transform: `scale(${lockupScale})`,
          transformOrigin: "center",
          willChange: "transform, opacity",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 24,
          }}
        >
          <FlowithLogo size={88} />
          <span
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 76,
              fontWeight: 400,
              color: FLOW_INK,
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            Flowith
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
