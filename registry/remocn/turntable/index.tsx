"use client";

import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type TurntableColors = {
  background: string;
  front: string;
  back: string;
  edge: string;
  mark: string;
  shadow: string;
};

export type TurntableProps = {
  /** Front face content. Defaults to a red card with a mark. */
  children?: React.ReactNode;
  /** Back face content. Defaults to a dark card. */
  back?: React.ReactNode;
  /** Card thickness in px at 720p. */
  thickness?: number;
  /** Full rotations per spin. */
  turns?: number;
  /** Camera tilt in degrees; positive looks down on the card. */
  tilt?: number;
  colors?: Partial<TurntableColors>;
  /** Default front face color. Overrides `colors.front`. */
  frontColor?: string;
  /** Card edge color. Overrides `colors.edge`. */
  edgeColor?: string;
  /** Default back face color. Overrides `colors.back`. */
  backColor?: string;
  /** Stage background. Overrides `colors.background`. */
  backgroundColor?: string;
  speed?: number;
};

export const turntableDefaults = {
  thickness: 22,
  turns: 1,
  tilt: 8,
  colors: {
    background: "#111111",
    front: "#E5322D",
    back: "#F2F2F2",
    edge: "#A3201C",
    mark: "#FFFFFF",
    shadow: "#000000",
  } satisfies TurntableColors,
  speed: 1,
};

const START = 6;
const END = 64;

function DefaultFront({ colors }: { colors: TurntableColors }) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.front,
        padding: "9%",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          width: "22%",
          aspectRatio: "1",
          borderRadius: "50%",
          border: `0.6em solid ${colors.mark}`,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
        <div
          style={{
            height: "0.9em",
            width: "62%",
            background: colors.mark,
            borderRadius: 99,
          }}
        />
        <div
          style={{
            height: "0.9em",
            width: "38%",
            background: colors.mark,
            opacity: 0.55,
            borderRadius: 99,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

function DefaultBack({ colors }: { colors: TurntableColors }) {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.back }}>
      <div
        style={{
          position: "absolute",
          top: "16%",
          left: 0,
          right: 0,
          height: "18%",
          background: "#111111",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "9%",
          bottom: "12%",
          width: "16%",
          aspectRatio: "1",
          borderRadius: "28%",
          background: colors.front,
        }}
      />
    </AbsoluteFill>
  );
}

export function Turntable({
  children,
  back,
  thickness = turntableDefaults.thickness,
  turns = turntableDefaults.turns,
  tilt = turntableDefaults.tilt,
  colors: colorOverrides,
  frontColor,
  edgeColor,
  backColor,
  backgroundColor,
  speed = turntableDefaults.speed,
}: TurntableProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const baseColors = { ...turntableDefaults.colors, ...colorOverrides };
  const colors = {
    ...baseColors,
    front: frontColor ?? baseColors.front,
    edge: edgeColor ?? baseColors.edge,
    back: backColor ?? baseColors.back,
    background: backgroundColor ?? baseColors.background,
  };
  const t = (frame * speed * 30) / fps;
  const unit = height / 720;

  const cardH = height * 0.46;
  const cardW = cardH * 1.58;
  const depth = thickness * unit;
  const radius = Math.min(cardH * 0.06, depth * 1.2);

  const spin = interpolate(t, [START, END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.55, 0, 0.25, 1),
  });
  const angle = spin * 360 * turns;
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Lambert-ish shading for each face from a key light front-left.
  const light = (nx: number, nz: number) =>
    0.55 + 0.45 * Math.max(0, nz * 0.85 - nx * 0.5);
  const frontShade = light(sin, cos);
  const backShade = light(-sin, -cos);
  const sideShade = light(cos, -sin);
  const sheen = 50 + sin * 120;

  const footprint = Math.abs(cos) * cardW + Math.abs(sin) * depth;
  const shadowW = Math.max(footprint, depth * 3);
  const floorY = height / 2 + cardH / 2 + height * 0.075;

  const face = (
    content: React.ReactNode,
    transform: string,
    shade: number,
  ): React.ReactNode => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        overflow: "hidden",
        backfaceVisibility: "hidden",
        transform,
        fontSize: cardH / 30,
      }}
    >
      {content}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(105deg, rgba(255,255,255,0) ${sheen - 22}%, rgba(255,255,255,0.22) ${sheen}%, rgba(255,255,255,0) ${sheen + 22}%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#000",
          opacity: 1 - shade,
        }}
      />
    </div>
  );

  const slab = (
    w: number,
    h: number,
    transform: string,
    shade: number,
    key: string,
  ) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: (cardW - w) / 2,
        top: (cardH - h) / 2,
        width: w,
        height: h,
        background: colors.edge,
        filter: `brightness(${shade})`,
        transform,
      }}
    />
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        overflow: "hidden",
        background: `radial-gradient(ellipse 60% 40% at 50% ${(floorY / height) * 100}%, rgba(255,255,255,0.07), rgba(255,255,255,0) 70%), ${colors.background}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: width / 2 - shadowW / 2,
          top: floorY - height * 0.025,
          width: shadowW,
          height: height * 0.05,
          borderRadius: "50%",
          background: colors.shadow,
          opacity: 0.45 + 0.35 * Math.abs(cos),
          filter: `blur(${height * 0.018}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          perspective: height * 2.4,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: cardW,
            height: cardH,
            position: "relative",
            transformStyle: "preserve-3d",
            transform: `rotateX(${-tilt}deg) rotateY(${angle}deg)`,
          }}
        >
          {slab(
            depth,
            cardH - radius * 2,
            `rotateY(90deg) translateZ(${cardW / 2}px)`,
            sideShade,
            "r",
          )}
          {slab(
            depth,
            cardH - radius * 2,
            `rotateY(-90deg) translateZ(${cardW / 2}px)`,
            light(-cos, sin),
            "l",
          )}
          {slab(
            cardW - radius * 2,
            depth,
            `rotateX(90deg) translateZ(${cardH / 2}px)`,
            1.1,
            "t",
          )}
          {slab(
            cardW - radius * 2,
            depth,
            `rotateX(-90deg) translateZ(${cardH / 2}px)`,
            0.6,
            "b",
          )}
          {face(
            children ?? <DefaultFront colors={colors} />,
            `translateZ(${depth / 2}px)`,
            frontShade,
          )}
          {face(
            back ?? <DefaultBack colors={colors} />,
            `rotateY(180deg) translateZ(${depth / 2}px)`,
            backShade,
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
