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
  stirring,
  useGlide,
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
  // The word travels its own height, about 110px.
  const rising = stirring((g) => revealAt(g) * 110, f, step);
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
  const glide = useGlide();

  const beat1Opacity = interpolate(f, [0, 4, 40, 55], [0, 1, 1, 0], clamp);
  const beat2Opacity = interpolate(f, [50, 60, 100, 115], [0, 1, 1, 0], clamp);
  const beat3Opacity = interpolate(f, [113, 130], [0, 1], clamp);
  const beat3tyAt = (g: number) => interpolate(g, [113, 132], [16, 0], clamp);
  const beat3ty = beat3tyAt(f);
  const beat3Rising = stirring(beat3tyAt, f, speed);

  const line2RevealAt = (g: number) =>
    spring({
      frame: g - 52,
      fps,
      config: { damping: 18, stiffness: 110 },
    });
  const line2Reveal = line2RevealAt(f);
  // 60% of the line's height, about 64px.
  const line2Rising = stirring((g) => line2RevealAt(g) * 64, f, speed);
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
          opacity: beat2Opacity,
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
                translate: `${sp * card.dx}px ${sp * card.dy}px`,
                width: card.w,
                height: card.h,
                borderRadius: 10,
                background: "#FFFFFF",
                border: `1.5px solid ${FLOW_BORDER}`,
                opacity: cardOpacity,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
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
            translate: `0 ${line2ty}%`,
            transform: glide(line2Rising),
            filter: line2blur > 0.05 ? `blur(${line2blur}px)` : undefined,
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
          translate: `0 ${beat3ty}px`,
          transform: glide(beat3Rising),
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
