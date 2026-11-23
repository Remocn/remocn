"use client";

import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const hanken = loadHanken("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface BeforeAfterProps {
  before?: string;
  after?: string;
  beforeLabel?: string;
  afterLabel?: string;
  title?: string;
  aspect?: number;
  fit?: "cover" | "contain";
  pauseAt?: number;
  /** Frames the divider rests at `pauseAt` before sweeping to the after side. */
  hold?: number;
  /** Corner radius of the frame, in px at 1280 wide. */
  radius?: number;
  accent?: string;
  /** Text color of the title and after label; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the title and labels. Load it yourself; Hanken Grotesk by default. */
  fontFamily?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  /** Size of the title, frame and labels, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    preset: "hearth" as GshPresetId,
    scrim:
      "linear-gradient(180deg, rgba(5,3,2,0.72) 0%, rgba(5,3,2,0.2) 34%, rgba(5,3,2,0) 60%)",
    fg: "#F6F1EA",
    dim: "rgba(246,241,234,0.56)",
    outline: "rgba(255,255,255,0.10)",
    shadow:
      "0 1px 0 rgba(255,255,255,0.06) inset, 0 2px 4px rgba(0,0,0,0.3), 0 18px 40px -12px rgba(0,0,0,0.6), 0 50px 110px -40px rgba(0,0,0,0.8)",
  },
  light: {
    preset: "paper-crease" as GshPresetId,
    scrim:
      "linear-gradient(180deg, rgba(238,236,232,0.7) 0%, rgba(238,236,232,0.15) 36%, rgba(238,236,232,0) 60%)",
    fg: "#16151A",
    dim: "rgba(22,21,26,0.52)",
    outline: "rgba(0,0,0,0.10)",
    shadow:
      "0 1px 2px rgba(26,31,74,0.08), 0 14px 32px -12px rgba(26,31,74,0.22), 0 44px 90px -40px rgba(26,31,74,0.35)",
  },
} as const;

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };

const BEAT = {
  frame: 0,
  title: 4,
  grip: 18,
  leg1: 24,
  leg2: 78,
  gripOut: 104,
};

const DEFAULT_SRC = "bg.jpg";
const FLAT = "grayscale(0.85) contrast(0.78) brightness(0.9)";
const GRADED = "saturate(1.18) contrast(1.06)";

function Chevrons({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.5 7.5 5 12l4.5 4.5" />
      <path d="M14.5 7.5 19 12l-4.5 4.5" />
    </svg>
  );
}

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function BeforeAfter({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  title,
  aspect,
  fit = "cover",
  pauseAt = 0.5,
  hold = BEAT.leg2 - BEAT.leg1,
  radius: radiusPx = 16,
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = hanken.fontFamily,
  ground,
  groundParams,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: BeforeAfterProps) {
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width, height, fps } = useSceneConfig();
  const p = THEMES[theme];
  const fg = ink ?? p.fg;
  const leg2At = BEAT.leg1 + hold;
  const gripOutAt = leg2At + (BEAT.gripOut - BEAT.leg2);

  const portrait = height > width * 1.1;
  const s = portrait
    ? (width / 1280) * 1.5
    : Math.min(width / 1280, height / 720);
  const ratio = aspect ?? (portrait ? 4 / 5 : 16 / 9);

  const titleFs = (portrait ? 66 : 44) * s;
  const capFs = (portrait ? 24 : 19) * s;
  const titleGap = (portrait ? 36 : 22) * s;
  const capGap = (portrait ? 26 : 18) * s;
  const titleH = title ? titleFs * 1.1 + titleGap : 0;
  const capH = capFs * 1.2 + capGap;
  const maxW = width * (portrait ? 0.8 : 0.7);
  const maxH = height * (portrait ? 0.62 : 0.86) - titleH - capH;
  const frameH = Math.min(maxH, maxW / ratio);
  const frameW = frameH * ratio;
  const groupH = titleH + frameH + capH;
  const groupTop = (height - groupH) / 2;
  const frameTop = groupTop + titleH;
  const frameLeft = (width - frameW) / 2;
  const radius = radiusPx * s;

  const at = (start: number, config: Record<string, number>) =>
    spring({ frame: frame - start, fps, config });

  const enter = at(BEAT.frame, HEAVY);
  const fadeIn = interpolate(frame, [0, 10], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const titleT = interpolate(frame, [BEAT.title, BEAT.title + 16], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const leg1 = at(BEAT.leg1, CARD);
  const leg2 = at(leg2At, MORPH);
  const pos = frame >= leg2At ? pauseAt * (1 - leg2) : 1 - (1 - pauseAt) * leg1;
  const push = interpolate(frame, [0, 150], [1, 1.02], CLAMP);

  const gripIn = at(BEAT.grip, CHIP);
  const gripOut = interpolate(frame, [gripOutAt, gripOutAt + 8], [0, 1], {
    ...CLAMP,
    easing: EXIT,
  });
  const pressed =
    1 - 0.04 * (at(BEAT.leg1 - 5, CHIP) - at(BEAT.leg1 + 1, CHIP));
  const grip = Math.min(1, gripIn) * (1 - gripOut);

  const divX = Math.max(0, Math.min(1, pos)) * frameW;
  // Layout rounds box edges to whole pixels, so a divider swept by `left`
  // clicks across pixel by pixel. Everything riding the divider is laid out
  // where the current leg comes to rest and travels there by a transform.
  const restX =
    Math.max(0, Math.min(1, frame >= leg2At ? 0 : pauseAt)) * frameW;
  const dx = divX - restX;
  const slide = Math.abs(dx) < 1e-3 ? undefined : `translateX(${dx}px)`;
  const capsIn = interpolate(frame, [BEAT.leg1, BEAT.leg1 + 12], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });

  const beforeSrc = before ?? staticFile(DEFAULT_SRC);
  const afterSrc = after ?? staticFile(DEFAULT_SRC);
  const imgStyle = (
    filter: string | undefined,
    builtIn: boolean,
  ): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: fit,
    filter,
    ...(builtIn
      ? { transform: "scale(1.45)", transformOrigin: "16% 38%" }
      : {}),
  });

  const transparent = background === "transparent";
  const gripD = (portrait ? 64 : 44) * s;
  const label: React.CSSProperties = {
    position: "absolute",
    top: frameTop + frameH + capGap,
    fontFamily,
    fontWeight: 400,
    fontSize: capFs,
    lineHeight: 1.2,
    letterSpacing: "-0.005em",
    whiteSpace: "nowrap",
    opacity: capsIn,
  };
  const tick = (color: string): React.CSSProperties => ({
    display: "inline-block",
    width: capFs * 0.42,
    height: capFs * 0.42,
    borderRadius: capFs,
    background: color,
    verticalAlign: "0.08em",
  });

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? "#050302"),
        overflow: "hidden",
        fontFamily,
      }}
    >
      {!transparent && background === undefined ? (
        <AbsoluteFill style={{ opacity: fadeIn }}>
          <GshGround
            preset={ground ?? p.preset}
            params={groundParams}
            timeOffset={3}
            timeScale={0.5}
          />
          <AbsoluteFill style={{ background: p.scrim }} />
        </AbsoluteFill>
      ) : null}

      <ScaleLayer scale={scale}>
        {title ? (
          <div
            style={{
              position: "absolute",
              left: frameLeft,
              top: groupTop,
              width: frameW,
              height: titleFs * 1.2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontWeight: 300,
                fontSize: titleFs,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: fg,
                whiteSpace: "nowrap",
                // The ease lands so softly that its last frames still move the
                // line by thousandths of a pixel: tilt until it is exactly home.
                transform: `translateY(${(1 - titleT) * 105}%)${glide(titleT > 0 && titleT < 1)}`,
              }}
            >
              {title}
            </div>
          </div>
        ) : null}

        <div
          style={{
            position: "absolute",
            left: frameLeft,
            top: frameTop,
            width: frameW,
            height: frameH,
            borderRadius: radius,
            overflow: "hidden",
            boxShadow: p.shadow,
            opacity: fadeIn,
            transform: `translateY(${(1 - enter) * 40 * s}px) scale(${(0.96 + enter * 0.04) * push})`,
            background: "#111",
          }}
        >
          <Img
            src={afterSrc}
            style={imgStyle(after ? undefined : GRADED, !after)}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `inset(0 ${(100 - (divX / frameW) * 100).toFixed(4)}% 0 0)`,
            }}
          >
            <Img
              src={beforeSrc}
              style={imgStyle(before ? undefined : FLAT, !before)}
            />
          </div>

          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: restX - 1 * s,
              width: 2 * s,
              transform: slide,
              background: "rgba(255,255,255,0.95)",
              boxShadow:
                "0 0 0 0.5px rgba(0,0,0,0.12), 0 0 12px rgba(0,0,0,0.25)",
              opacity: grip,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: restX - gripD / 2,
              top: frameH / 2 - gripD / 2,
              width: gripD,
              height: gripD,
              borderRadius: gripD,
              background: "#FFFFFF",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.25), 0 8px 20px -6px rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: grip,
              transform: `${slide ? `${slide} ` : ""}scale(${(0.6 + 0.4 * gripIn) * pressed})`,
            }}
          >
            <Chevrons size={gripD * 0.56} color="#2A2A30" />
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: radius,
              boxShadow: `inset 0 0 0 1px ${p.outline}`,
              pointerEvents: "none",
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: frameLeft,
            top: 0,
            width: frameW,
            height,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              ...label,
              right: frameW - restX + capGap * 0.9,
              color: p.dim,
              transform: slide,
            }}
          >
            {beforeLabel} <span style={tick(p.dim)} />
          </div>
          <div
            style={{
              ...label,
              left: restX + capGap * 0.9,
              color: fg,
              transform: slide,
            }}
          >
            <span style={tick(accent)} /> {afterLabel}
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
