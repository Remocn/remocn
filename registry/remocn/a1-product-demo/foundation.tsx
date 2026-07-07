"use client";

import {
  linearTiming,
  springTiming,
  type TransitionPresentation,
  type TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type { FC, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MaskRevealUp } from "@/components/remocn/mask-reveal-up";

export interface TemplateMeta {
  fps: number;
  width: number;
  height: number;
}

export interface TemplateTheme {
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  fontFamily?: string;
}

export type SceneTiming = {
  kind: "spring" | "linear";
  durationInFrames: number;
};

export interface ProductHeroContent {
  name: string;
  pitch: string;
  entrance?: "kinetic-center-build" | "per-character-rise";
}

export interface FeatureFrameContent {
  title: string;
  bullet: string;
  side: "left" | "right";
}

export interface CtaContent {
  line: string;
  domain: string;
}

export type ProductDemoScene =
  | {
      type: "product-hero";
      durationInFrames: number;
      content: ProductHeroContent;
    }
  | {
      type: "feature-frame";
      durationInFrames: number;
      content: FeatureFrameContent;
    }
  | { type: "cta-scene"; durationInFrames: number; content: CtaContent };

export interface ProductDemoConfig {
  meta: TemplateMeta;
  theme: TemplateTheme;
  scenes: ProductDemoScene[];
}

export const CAMERA_TRAVEL_EASE = Easing.out(Easing.cubic);
export const CAMERA_SPRING = { damping: 18, stiffness: 140 } as const;

export const FONT =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";
export const ACCENT = "#FF5C39";
export const TEXT = "#161616";
export const MUTED = "#8A8A8A";
export const BORDER = "#ECECEC";
export const BG_LIGHT = "#FBFBFA";
export const BG_BLACK = "#0A0A0A";
export const BG_SLACK = "#DCE7FB";
export const GREEN = "#15A34A";
export const ICON_BG = "#0E0E0E";
export const AURORA_BLUE = "#B9CCFF";
export const AURORA_PEACH = "#FFC3B0";

export const FONT_SERIF = "Georgia, 'Times New Roman', Times, serif";
export const FLOW_BG = "#FAF8EC";
export const FLOW_INK = "#1E1C16";
export const FLOW_MUTED = "#B6B2A2";
export const FLOW_BORDER = "#E8E5D6";
export const FLOW_YELLOW = "#F2D200";
export const FLOW_GREEN_TOP = "#4F6B2A";
export const FLOW_GREEN_MID = "#8DA03E";
export const FLOW_GREEN_LOW = "#C5C86A";

export interface CameraProps {
  x?: number;
  y?: number;
  scale?: number;
  blur?: number;
  children: ReactNode;
}

export function Camera({
  x = 0,
  y = 0,
  scale = 1,
  blur = 0,
  children,
}: CameraProps) {
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        transformOrigin: "center",
        filter: blur > 0.01 ? `blur(${blur}px)` : undefined,
        willChange: "transform, filter",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

export function resolveTiming(timing: SceneTiming) {
  return timing.kind === "spring"
    ? springTiming({
        durationInFrames: timing.durationInFrames,
        config: { damping: 200 },
      })
    : linearTiming({ durationInFrames: timing.durationInFrames });
}

type CameraCraneUpProps = Record<string, never>;

const CameraCraneUpPresentation: FC<
  TransitionPresentationComponentProps<CameraCraneUpProps>
> = ({ children, presentationProgress, presentationDirection }) => {
  const p = presentationProgress;
  const blur = interpolate(p, [0, 0.5, 1], [0, 7, 0]);
  const translateY =
    presentationDirection === "exiting" ? -p * 100 : (1 - p) * 100;

  return (
    <AbsoluteFill
      style={{
        transform: `translateY(${translateY}%)`,
        filter: `blur(${blur}px)`,
        willChange: "transform, filter",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export function cameraCraneUp(): TransitionPresentation<CameraCraneUpProps> {
  return { component: CameraCraneUpPresentation, props: {} };
}

type SpatialPushProps = { direction: "up" | "down" | "left" | "right" };

const SpatialPushPresentation: FC<
  TransitionPresentationComponentProps<SpatialPushProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const p = presentationProgress;
  const { direction } = passedProps;
  const blur = interpolate(p, [0, 0.5, 1], [0, 5, 0]);

  if (presentationDirection === "exiting") {
    const scale = interpolate(p, [0, 1], [1, 0.92]);
    const brightness = interpolate(p, [0, 1], [1, 0.55]);
    return (
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          filter: `brightness(${brightness}) blur(${blur}px)`,
          willChange: "transform, filter",
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  const axis = direction === "up" || direction === "down" ? "Y" : "X";
  const sign = direction === "up" || direction === "left" ? 1 : -1;
  const offset = sign * (1 - p) * 100;

  return (
    <AbsoluteFill
      style={{
        transform: `translate${axis}(${offset}%)`,
        filter: `blur(${blur}px)`,
        willChange: "transform, filter",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export function spatialPush(
  props: SpatialPushProps,
): TransitionPresentation<SpatialPushProps> {
  return { component: SpatialPushPresentation, props };
}

export interface CtaSceneProps {
  line: string;
  domain: string;
  theme: TemplateTheme;
  speed?: number;
}

export function CtaScene({ line, domain, theme, speed = 1 }: CtaSceneProps) {
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 1400,
          height: 300,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 24,
            height: 150,
          }}
        >
          <MaskRevealUp
            text={line}
            color={theme.foreground}
            fontSize={88}
            fontWeight={600}
            speed={speed}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 24,
            height: 70,
          }}
        >
          <CtaDomain domain={domain} accent={theme.accent} speed={speed} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function CtaDomain({
  domain,
  accent,
  speed,
}: {
  domain: string;
  accent: string;
  speed: number;
}) {
  const frame = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const settle = spring({
    frame: frame - 28,
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const letterSpacing = `${interpolate(settle, [0, 1], [0.4, -0.01])}em`;
  const blur = interpolate(settle, [0, 1], [10, 0]);
  const opacity = interpolate(frame, [28, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontSize: 38,
          fontWeight: 500,
          color: accent,
          letterSpacing,
          opacity,
          filter: `blur(${blur}px)`,
          fontFamily:
            "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {domain}
      </span>
    </div>
  );
}
