"use client";

import { AbsoluteFill, interpolate, interpolateColors, spring } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import {
  FLOW_BG,
  FLOW_INK,
  FLOW_MUTED,
  FLOW_YELLOW,
  FONT_SERIF,
  stirring,
  useGlide,
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
  step,
}: {
  word: string;
  index: number;
  f: number;
  fps: number;
  step: number;
}) {
  const glide = useGlide();
  const revealAt = (g: number) =>
    spring({
      frame: g - index * STAGGER,
      fps,
      config: { damping: 18, stiffness: 110 },
    });
  const reveal = revealAt(f);
  // 60% of the word's height, about 55px.
  const rising = stirring((g) => revealAt(g) * 55, f, step);
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
          translate: `0 ${ty}%`,
          transform: glide(rising),
          filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
        }}
      >
        {word}
      </span>
    </span>
  );
}

export function Positioning({ speed = 1 }: { speed?: number }) {
  const f = useSceneFrame() * speed;
  const { fps } = useSceneConfig();
  const glide = useGlide();

  const headlineOpacity = interpolate(f, [55, 70], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lockupRevealAt = (g: number) =>
    spring({
      frame: g - 70,
      fps,
      config: { damping: 22, stiffness: 95 },
    });
  const lockupReveal = lockupRevealAt(f);
  // The lockup's far edge sits about 200px from the centre it scales about;
  // a twelfth of that is the whole zoom.
  const lockupZooming = stirring((g) => lockupRevealAt(g) * 24, f, speed);
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
            <WordReveal
              key={word}
              word={word}
              index={i}
              f={f}
              fps={fps}
              step={speed}
            />
          ))}
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: lockupOpacity,
          scale: `${lockupScale}`,
          transform: glide(lockupZooming),
          transformOrigin: "center",
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
