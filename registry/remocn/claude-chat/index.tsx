"use client";

import { loadFont as loadBodyFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, interpolate, spring } from "remotion";
import { Caret } from "@/components/remocn/caret";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { useTypewriter } from "@/lib/remocn-ui";
import {
  CLAUDE_CHAT_PROMPT,
  type ClaudeChatElementId,
  claudeChatTimeline,
  claudeTypingLength,
  TYPING_RATE,
  TYPING_START_AT,
} from "./timeline";

const { fontFamily: SANS_FAMILY } = loadBodyFont();

export interface ClaudeChatProps {
  greeting?: string;
  placeholder?: string;
  prompt?: string;
  modelName?: string;
  modelTier?: string;
  accentColor?: string;
  speed?: number;
  /**
   * Moves, trims or stretches the card's entrance, the typing and the send
   * button's morph, by the ids in `./timeline`. Frames on the scene
   * timeline, after `speed`.
   */
  timing?: Timing<ClaudeChatElementId>;
}

interface Theme {
  page: string;
  cardBg: string;
  cardBorder: string;
  fg: string;
  fgMuted: string;
  placeholder: string;
  iconBtnBorder: string;
}

export const THEMES: Record<"light" | "dark", Theme> = {
  light: {
    page: "#F5F4EF",
    cardBg: "#FFFFFF",
    cardBorder: "#E8E5DD",
    fg: "#1F1E1D",
    fgMuted: "#73726C",
    placeholder: "#A3A097",
    iconBtnBorder: "#E0DDD4",
  },
  dark: {
    page: "#262624",
    cardBg: "#1F1E1D",
    cardBorder: "#3A3936",
    fg: "#F0EEE6",
    fgMuted: "#9B9892",
    placeholder: "#73726C",
    iconBtnBorder: "#3A3936",
  },
};

export const TYPING_START_FRAME = TYPING_START_AT;

export const TYPING_CPS = TYPING_RATE;

export function morphProgressAt(
  frame: number,
  opts: { startFrame?: number; fps: number; speed: number },
): number {
  const startFrame = opts.startFrame ?? TYPING_START_FRAME;
  const value = spring({
    fps: opts.fps,
    frame: frame * opts.speed - startFrame,
    config: { damping: 14, stiffness: 200, mass: 0.6 },
  });
  return Math.max(0, Math.min(value, 1));
}

export function introBounceIn(
  frame: number,
  fps: number,
): { translateY: number; scale: number } {
  const s = spring({
    fps,
    frame,
    config: { damping: 14, stiffness: 110, mass: 0.7 },
  });
  const translateY = interpolate(s, [0, 1], [28, 0]);
  const scale = interpolate(s, [0, 1], [0.97, 1]);
  return { translateY, scale };
}

export function fadeUpAt(
  frame: number,
  range: [number, number],
): { opacity: number; translateY: number } {
  const opts = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  return {
    opacity: interpolate(frame, range, [0, 1], opts),
    translateY: interpolate(frame, range, [12, 0], opts),
  };
}

function ChevronDown({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>Expand</title>
      <path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>Add</title>
      <path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function MicIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>Voice input</title>
      <rect
        x={9}
        y={3}
        width={6}
        height={11}
        rx={3}
        stroke={color}
        strokeWidth={1.8}
      />
      <path
        d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M9 21h6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WaveformIcon({ size, color }: { size: number; color: string }) {
  const bars = [
    { x: 4, h: 8 },
    { x: 9, h: 16 },
    { x: 14, h: 12 },
    { x: 19, h: 20 },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>Voice</title>
      {bars.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x - 1}
          y={(24 - bar.h) / 2}
          width={2.4}
          height={bar.h}
          rx={1.2}
          fill={color}
        />
      ))}
    </svg>
  );
}

function SendIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>Send</title>
      <path
        d="M12 19V5M12 5l-6 6M12 5l6 6"
        stroke="#FFFFFF"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconButton({
  size,
  border,
  children,
}: {
  size: number;
  border: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "100%",
        border: `1px solid ${border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

export function ClaudeChat(props: ClaudeChatProps) {
  const {
    placeholder = "Try: draft an email · summarize a doc · plan your week",
    prompt = CLAUDE_CHAT_PROMPT,
    modelName = "Opus 4.8",
    modelTier = "Max",
    accentColor = "#D97757",
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const frame = useSceneFrame();
  const { width, height, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    claudeChatTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const card = tl.get("card");
  const typing = tl.get("typing");
  const send = tl.get("send");
  const cardFadeSpan: [number, number] = [
    card.start + card.beat("fade"),
    card.end,
  ];
  const t = THEMES.light;

  const refW = 1280;
  const refH = 720;
  const stageScale = Math.min(width / refW, height / refH);

  const tw = useTypewriter(prompt, {
    // A stretched or trimmed typing element types at the pace its length asks.
    cps:
      typing.length > 0
        ? TYPING_CPS * (claudeTypingLength(prompt) / typing.length)
        : TYPING_CPS,
    speed,
    startFrame: typing.start,
  });
  const visibleText = tw.text;
  const showText = tw.count > 0;
  const morph = morphProgressAt(frame, {
    fps,
    speed,
    startFrame: send.start,
  });

  const intro = introBounceIn(frame * speed - card.start, fps);
  const cardFade = fadeUpAt(frame * speed, cardFadeSpan);
  // The bounce is a spring that never quite lands, so the card's own px (its
  // rise, and its scale at the far edge) are held against the neighbouring
  // frames.
  const cardAt = (f: number) => {
    const a = introBounceIn(f * speed - card.start, fps);
    return [
      a.translateY + fadeUpAt(f * speed, cardFadeSpan).translateY,
      a.scale,
    ];
  };
  const stirs = (a: number[], b: number[]) =>
    Math.abs(a[0] - b[0]) > 1e-3 || Math.abs(a[1] - b[1]) * 430 > 1e-3;
  const cardMoving =
    stirs(cardAt(frame), cardAt(frame - 1)) ||
    stirs(cardAt(frame), cardAt(frame + 1));

  const cardWidth = 860;
  const cardLeft = (refW - cardWidth) / 2;
  const iconBtnSize = 36;
  const morphSize = 40;

  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: refW,
          height: refH,
          translate: "-50% -50%",
          scale: `${stageScale}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: cardLeft,
            top: 300,
            width: cardWidth,
            background: t.cardBg,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 24,
            boxShadow: "0 8px 30px -12px rgba(31,30,29,0.12)",
            opacity: cardFade.opacity,
            transform: `translateY(${cardFade.translateY + intro.translateY}px) scale(${intro.scale})${glide(cardMoving)}`,
            transformOrigin: "center top",
          }}
        >
          <div
            style={{
              padding: "26px 28px",
              minHeight: 58,
              fontFamily: SANS_FAMILY,
              fontSize: 21,
              lineHeight: 1.3,
              display: "flex",
              alignItems: "center",
            }}
          >
            {showText ? (
              <span style={{ color: t.fg }}>
                {visibleText}
                <Caret
                  color={t.fg}
                  blink={!tw.typing}
                  speed={speed}
                  height={24}
                  radius={0}
                  marginLeft={1}
                  style={{
                    verticalAlign: "text-bottom",
                    translate: "0 3px",
                  }}
                />
              </span>
            ) : (
              <span
                style={{
                  color: t.placeholder,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <Caret
                  color={t.fg}
                  blink={!tw.typing}
                  speed={speed}
                  height={24}
                  radius={0}
                  marginLeft={1}
                  style={{
                    verticalAlign: "text-bottom",
                    translate: "0 3px",
                  }}
                />
                <span style={{ marginLeft: 2 }}>{placeholder}</span>
              </span>
            )}
          </div>

          <div
            style={{
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <IconButton size={iconBtnSize} border={t.iconBtnBorder}>
              <PlusIcon size={20} color={t.fg} />
            </IconButton>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <span
                  style={{
                    fontFamily: SANS_FAMILY,
                    fontSize: 18,
                    fontWeight: 500,
                    color: t.fg,
                  }}
                >
                  {modelName}
                </span>
                <span
                  style={{
                    fontFamily: SANS_FAMILY,
                    fontSize: 18,
                    fontWeight: 400,
                    color: t.fgMuted,
                  }}
                >
                  {modelTier}
                </span>
                <ChevronDown size={16} color={t.fgMuted} />
              </div>

              <IconButton size={iconBtnSize} border={t.iconBtnBorder}>
                <MicIcon size={20} color={t.fg} />
              </IconButton>

              <div
                style={{
                  position: "relative",
                  width: morphSize,
                  height: morphSize,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "100%",
                    border: `1px solid ${t.iconBtnBorder}`,
                    opacity: 1 - morph,
                    scale: `${1 - 0.1 * morph}`,
                  }}
                >
                  <WaveformIcon size={22} color={t.fg} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 10,
                    background: accentColor,
                    opacity: morph,
                    scale: `${0.8 + 0.2 * morph}`,
                  }}
                >
                  <SendIcon size={22} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
