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
  FLOW_BORDER,
  FLOW_INK,
  FLOW_MUTED,
  FONT_SERIF,
} from "../foundation";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const LINE_1_WORDS = ["Your", "team", "has", "tasks", "everywhere"];
const STAGGER = 7;

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
  const ty = interpolate(reveal, [0, 1], [100, 0]);
  const blur = interpolate(reveal, [0, 1], [6, 0]);
  const settle = interpolate(
    f,
    [index * STAGGER, index * STAGGER + 18],
    [0, 1],
    clamp,
  );
  const color = interpolateColors(settle, [0, 1], [FLOW_MUTED, FLOW_INK]);

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

function GridGlyph({ size, color }: { size: number; color: string }) {
  const pad = size * 0.12;
  const gap = size * 0.1;
  const cell = (size - 2 * pad - gap) / 2;
  const positions: [number, number][] = [
    [pad, pad],
    [pad + cell + gap, pad],
    [pad, pad + cell + gap],
    [pad + cell + gap, pad + cell + gap],
  ];
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
    >
      {positions.map(([x, y], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={cell}
          height={cell}
          rx={cell * 0.2}
          fill={color}
        />
      ))}
    </svg>
  );
}

const SCATTER_CARDS = [
  { dx: -380, dy: -150, w: 110, h: 62 },
  { dx: 320, dy: -110, w: 88, h: 54 },
  { dx: -300, dy: 160, w: 120, h: 50 },
  { dx: 360, dy: 140, w: 84, h: 58 },
  { dx: 10, dy: -220, w: 100, h: 46 },
] as const;

export function ProblemHook({ speed = 1 }: { speed?: number }) {
  const f = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const beat1Opacity = interpolate(f, [0, 4, 40, 55], [0, 1, 1, 0], clamp);
  const beat2Opacity = interpolate(f, [50, 60, 100, 115], [0, 1, 1, 0], clamp);
  const beat3Opacity = interpolate(f, [113, 130], [0, 1], clamp);
  const beat3ty = interpolate(f, [113, 132], [16, 0], clamp);

  const line2Reveal = spring({
    frame: f - 52,
    fps,
    config: { damping: 18, stiffness: 110 },
  });
  const line2ty = interpolate(line2Reveal, [0, 1], [60, 0]);
  const line2blur = interpolate(line2Reveal, [0, 1], [6, 0]);

  const scatteredSettle = interpolate(f, [57, 76], [0, 1], clamp);
  const scatteredColor = interpolateColors(
    scatteredSettle,
    [0, 1],
    [FLOW_MUTED, FLOW_INK],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: FLOW_BG }}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: beat1Opacity,
          willChange: "opacity",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "baseline",
            gap: "0.26em",
            fontFamily: FONT_SERIF,
            fontSize: 96,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
            maxWidth: 1400,
          }}
        >
          {LINE_1_WORDS.map((word, i) => (
            <WordReveal key={word} word={word} index={i} f={f} fps={fps} />
          ))}
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: beat2Opacity,
          willChange: "opacity",
        }}
      >
        {SCATTER_CARDS.map((card, i) => {
          const cardDelay = 52 + i * 4;
          const sp = spring({
            frame: f - cardDelay,
            fps,
            config: { damping: 22, stiffness: 120 },
          });
          const cardOpacity = interpolate(
            f,
            [cardDelay, cardDelay + 8, 96, 112],
            [0, 0.55, 0.42, 0],
            clamp,
          );
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: -card.w / 2,
                marginTop: -card.h / 2,
                transform: `translate(${sp * card.dx}px, ${sp * card.dy}px)`,
                width: card.w,
                height: card.h,
                borderRadius: 10,
                background: "#FFFFFF",
                border: `1.5px solid ${FLOW_BORDER}`,
                opacity: cardOpacity,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                willChange: "transform, opacity",
              }}
            />
          );
        })}

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.24em",
            fontFamily: FONT_SERIF,
            fontSize: 96,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            position: "relative",
            zIndex: 1,
            transform: `translateY(${line2ty}%)`,
            filter: line2blur > 0.05 ? `blur(${line2blur}px)` : undefined,
            willChange: "transform, filter",
          }}
        >
          <span style={{ color: FLOW_INK }}>Projects</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              paddingBottom: "0.06em",
            }}
          >
            <GridGlyph size={56} color={FLOW_MUTED} />
          </span>
          <span style={{ color: scatteredColor }}>scattered</span>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: beat3Opacity,
          transform: `translateY(${beat3ty}px)`,
          willChange: "transform, opacity",
        }}
      >
        <span
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 96,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            color: FLOW_INK,
          }}
        >
          Meet Flowith
        </span>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
