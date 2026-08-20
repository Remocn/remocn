"use client";

import { interpolate, useCurrentFrame } from "remotion";

export interface VolumetricRaysProps {
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  rayColor?: string;
  background?: string;
  textColor?: string;
  intensity?: number;
  speed?: number;
  className?: string;
}

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * Layered "god rays" effect built entirely from CSS / SVG masks. The trick:
 *
 * 1. Render the same text twice. Back layer is scaled wider than tall and
 *    heavily blurred — that's the "halo" the rays bloom out of.
 * 2. Sweep an SVG conic-gradient mask above the text to look like rotating
 *    light shafts pushing through the lettering.
 * 3. The front layer is solid (silhouette) so the contrast reads as light
 *    pushing AROUND the letters rather than ON them.
 */
export function VolumetricRays({
  text = "REMOCN",
  fontSize = 240,
  fontWeight = 800,
  rayColor = "#fcd34d",
  background = "#050505",
  textColor = "#050505",
  intensity = 1,
  speed = 1,
  className,
}: VolumetricRaysProps) {
  const frame = useCurrentFrame() * speed;

  // Slow source rotation: the rays drift around their origin so the scene
  // never looks frozen even though motion is sub-conscious.
  const rotation = interpolate(frame, [0, 240], [-4, 8]);
  // Bloom intensity ramps in over the first second.
  const bloomOpacity = interpolate(frame, [0, 30], [0, 0.95 * intensity], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Halo color slowly pulses with a sine wave.
  const haloPulse = 0.6 + Math.sin(frame / 14) * 0.15;

  const sharedTextStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: FONT_FAMILY,
    fontSize,
    fontWeight,
    letterSpacing: "-0.04em",
    textAlign: "center",
    whiteSpace: "nowrap",
  };

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        background,
        overflow: "hidden",
      }}
    >
      {/* 1. The bloom: same text, scaled and blurred, anchored to bottom so
            the light "rises" from below the baseline. */}
      <div
        style={{
          ...sharedTextStyle,
          color: rayColor,
          filter: `blur(${60 * intensity}px)`,
          scale: "1.2 1.6",
          transformOrigin: "center bottom",
          opacity: bloomOpacity * haloPulse,
        }}
      >
        {text}
      </div>

      {/* 2. Conic-gradient ray mask, masked by the text shape via background-clip.
            We render a wide conic gradient inside a text-shaped clip so the
            "light shafts" only show up where letters are. */}
      <div
        style={{
          ...sharedTextStyle,
          backgroundImage: `conic-gradient(from ${rotation}deg at 50% 100%,
            transparent 0deg,
            ${rayColor} 20deg,
            transparent 40deg,
            ${rayColor} 80deg,
            transparent 100deg,
            ${rayColor} 140deg,
            transparent 160deg,
            ${rayColor} 200deg,
            transparent 220deg,
            ${rayColor} 260deg,
            transparent 280deg,
            ${rayColor} 320deg,
            transparent 360deg)`,
          color: "transparent",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          opacity: 0.5 * intensity,
          filter: "blur(2px)",
        }}
      >
        {text}
      </div>

      {/* 3. Front silhouette: solid dark text on top so the eye reads
            "letters in front of light" instead of "lit-up letters". */}
      <div
        style={{
          ...sharedTextStyle,
          color: textColor,
          textShadow: `0 0 ${30 * intensity}px ${rayColor}`,
        }}
      >
        {text}
      </div>

      {/* 4. Floor light bleed — wide horizontal radial gradient at the
            baseline so the rays feel grounded. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 200,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 100%, ${rayColor}55 0%, transparent 60%)`,
          opacity: bloomOpacity,
        }}
      />
    </div>
  );
}
