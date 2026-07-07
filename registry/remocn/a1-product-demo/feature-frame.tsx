"use client";

import type { ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import type { TemplateTheme } from "./foundation";
import { UiSnapshotCard } from "./ui-snapshot-card";

export interface FeatureFrameProps {
  title: string;
  bullet: string;
  side: "left" | "right";
  frame: ReactNode;
  accent: string;
  theme: TemplateTheme;
  header?: string;
  speed?: number;
}

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

export function FeatureFrame({
  title,
  bullet,
  side,
  frame,
  accent,
  theme,
  header,
  speed = 1,
}: FeatureFrameProps) {
  const f = useCurrentFrame() * speed;

  const cardOpacity = interpolate(f, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const cardScale = interpolate(f, [0, 22], [0.965, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const cardShift = interpolate(f, [0, 22], [side === "left" ? -28 : 28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  const card = (
    <div
      style={{
        flex: "0 0 46%",
        display: "flex",
        opacity: cardOpacity,
        transform: `translateX(${cardShift}px) scale(${cardScale})`,
      }}
    >
      <UiSnapshotCard
        header={header}
        borderColor={`${theme.foreground}1f`}
        style={{ flex: 1, minHeight: 520 }}
      >
        {frame}
      </UiSnapshotCard>
    </div>
  );

  const text = (
    <div
      style={{
        flex: "0 0 44%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 26,
      }}
    >
      <TitleBlock
        title={title}
        accent={accent}
        color={theme.foreground}
        f={f}
      />
      <BulletLine bullet={bullet} color={theme.muted} f={f} />
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 88,
        padding: "0 132px",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {side === "left" ? (
        <>
          {card}
          {text}
        </>
      ) : (
        <>
          {text}
          {card}
        </>
      )}
    </AbsoluteFill>
  );
}

function TitleBlock({
  title,
  accent,
  color,
  f,
}: {
  title: string;
  accent: string;
  color: string;
  f: number;
}) {
  const words = title.split(" ");
  const stagger = 4;
  const underline = interpolate(f, [22, 44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <h2
        style={{
          margin: 0,
          fontSize: 64,
          fontWeight: 600,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          color,
        }}
      >
        {words.map((word, i) => {
          const local = f - i * stagger;
          const opacity = interpolate(local, [0, 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE,
          });
          const y = interpolate(local, [0, 14], [22, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE,
          });
          return (
            <span
              key={`${word}-${i}`}
              style={{
                display: "inline-block",
                marginRight: "0.26em",
                opacity,
                transform: `translateY(${y}px)`,
              }}
            >
              {word}
            </span>
          );
        })}
      </h2>
      <span
        style={{
          position: "absolute",
          left: 0,
          bottom: -10,
          height: 5,
          width: "44%",
          borderRadius: 3,
          background: accent,
          transformOrigin: "left center",
          transform: `scaleX(${underline})`,
        }}
      />
    </div>
  );
}

function BulletLine({
  bullet,
  color,
  f,
}: {
  bullet: string;
  color: string;
  f: number;
}) {
  const opacity = interpolate(f, [16, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const y = interpolate(f, [16, 34], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  return (
    <p
      style={{
        margin: 0,
        fontSize: 30,
        fontWeight: 400,
        lineHeight: 1.4,
        letterSpacing: "-0.01em",
        color,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      {bullet}
    </p>
  );
}
