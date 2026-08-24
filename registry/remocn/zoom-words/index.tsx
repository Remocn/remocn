"use client";

import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface ZoomWordsProps {
  text: string;
  fontSize?: number;
  zoom?: number;
  color?: string;
  fontWeight?: number;
  wordGap?: number;
  anchor?: number;
  blur?: number;
  blurFrames?: number;
  speed?: number;
  className?: string;
}

const CHAR_WIDTH_EM = 0.52;
const SPACE_WIDTH_EM = 0.3;
const WORD_BLUR_EM = 0.05;
const phraseEasing = Easing.bezier(0.5, 0, 0.7, 0.7);
const FADE_EARLY = 0.5;
const FADE_SLOTS = 2;

function smoothstep(t: number): number {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * (3 - 2 * x);
}
const WORD_SHIFT_X_EM = 0.16;
const WORD_SHIFT_Y_EM = 0.12;

function wordWidthEm(word: string): number {
  return Array.from(word).length * CHAR_WIDTH_EM + SPACE_WIDTH_EM;
}

export function zoomWordsLength(text: string, wordGap = 12): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length * wordGap;
}

export function ZoomWords({
  text,
  fontSize = 64,
  zoom = 2.2,
  color = "#cfc2ff",
  fontWeight = 400,
  wordGap = 12,
  anchor = 0.5,
  blur = 0.04,
  blurFrames = 60,
  speed = 1,
  className,
}: ZoomWordsProps) {
  const frame = useCurrentFrame() * speed;

  const words = text.trim().split(/\s+/).filter(Boolean);

  const phraseFrames = words.length * wordGap;
  const wordProgress =
    words.length *
    interpolate(frame, [0, phraseFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: phraseEasing,
    });

  const totalEm = words.reduce((sum, w) => sum + wordWidthEm(w), 0);
  const firstHalfEm = words.length > 0 ? wordWidthEm(words[0]) / 2 : 0;
  const lastHalfEm =
    words.length > 0 ? wordWidthEm(words[words.length - 1]) / 2 : 0;
  let revealedEm = 0;
  for (let i = 0; i < words.length; i++) {
    revealedEm +=
      wordWidthEm(words[i]) *
      smoothstep((wordProgress - i + FADE_EARLY) / FADE_SLOTS);
  }
  const travelMax = Math.max(totalEm - lastHalfEm - firstHalfEm, 0.001);
  const raw = Math.min(Math.max(revealedEm, 0), travelMax);
  const cameraEm = firstHalfEm + travelMax * smoothstep(raw / travelMax);
  const cameraPct = totalEm > 0 ? (cameraEm / totalEm) * 100 : 0;

  const blurNow =
    blur *
    fontSize *
    zoom *
    interpolate(frame, [0, blurFrames], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          scale: `${zoom}`,
          filter: blurNow > 0.05 ? `blur(${blurNow}px)` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${anchor * 100}%`,
            transform: "translateY(-50%)",
            whiteSpace: "pre",
          }}
        >
          <span
            className={className}
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              transform: `translateX(-${cameraPct.toFixed(3)}%)`,
              fontSize,
              fontWeight,
              color,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              whiteSpace: "pre",
              fontFamily:
                "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
            }}
          >
            {words.map((word, i) => {
              const p = smoothstep(
                (wordProgress - i + FADE_EARLY) / FADE_SLOTS,
              );
              const opacity = smoothstep(p * 1.2);
              const wordBlur = WORD_BLUR_EM * fontSize * (1 - p);
              const arrive = 1 - smoothstep(p * 1.6);
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    opacity,
                    filter:
                      wordBlur > 0.05 ? `blur(${wordBlur}px)` : undefined,
                    translate: `${(WORD_SHIFT_X_EM * fontSize * arrive).toFixed(1)}px ${(WORD_SHIFT_Y_EM * fontSize * arrive).toFixed(1)}px`,
                  }}
                >
                  {word}
                  {i < words.length - 1 && " "}
                </span>
              );
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
