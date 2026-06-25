"use client";

import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Caret } from "@/components/remocn/caret";
import { useTypewriter } from "@/lib/remocn-ui";

const { fontFamily: SANS_FAMILY } = loadFont();

export interface ChatGptProps {
  greeting?: string;
  placeholder?: string;
  prompt?: string;
  accentColor?: string;
  speed?: number;
}

interface Theme {
  page: string;
  inputBg: string;
  inputBorder: string;
  fg: string;
  fgMuted: string;
  chipBorder: string;
  chipFg: string;
  sendBg: string;
  sendArrow: string;
  iconColor: string;
}

export const THEMES: Record<"light" | "dark", Theme> = {
  light: {
    page: "#FFFFFF",
    inputBg: "#FFFFFF",
    inputBorder: "#E3E3E3",
    fg: "#0D0D0D",
    fgMuted: "#9B9B9B",
    chipBorder: "#E3E3E3",
    chipFg: "#5D5D5D",
    sendBg: "#0D0D0D",
    sendArrow: "#FFFFFF",
    iconColor: "#5D5D5D",
  },
  dark: {
    page: "#212121",
    inputBg: "#303030",
    inputBorder: "#454545",
    fg: "#ECECEC",
    fgMuted: "#9B9B9B",
    chipBorder: "#454545",
    chipFg: "#C5C5C5",
    sendBg: "#FFFFFF",
    sendArrow: "#0D0D0D",
    iconColor: "#C5C5C5",
  },
};

export const TYPING_START_FRAME = 42;

export const TYPING_CPS = 22;

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

function introBounceIn(
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

function fadeUpAt(
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

function ArrowUpIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>Send</title>
      <path
        d="M12 19V6M12 6l-6 6M12 6l6 6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ImageIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>Create an image</title>
      <rect
        x={3}
        y={4}
        width={18}
        height={16}
        rx={3}
        stroke={color}
        strokeWidth={1.7}
      />
      <circle cx={8.5} cy={9} r={1.6} stroke={color} strokeWidth={1.7} />
      <path
        d="M5 18l5-5 4 4 2-2 3 3"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>Write or edit</title>
      <path
        d="M4 20h4L19 9a2.1 2.1 0 00-3-3L5 17v3z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 7l3 3"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlobeIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>Look something up</title>
      <circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
      <path
        d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SuggestionChip({
  label,
  border,
  color,
  icon,
}: {
  label: string;
  border: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        borderRadius: 20,
        border: `1px solid ${border}`,
        color,
        fontFamily: SANS_FAMILY,
        fontSize: 15,
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

export function ChatGpt({
  greeting = "What's on your mind today?",
  placeholder = "Ask anything",
  prompt = "Make a sunset over a calm ocean",
  accentColor = "#2F6FED",
  speed = 1,
}: ChatGptProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = THEMES.light;

  const refW = 1280;
  const refH = 720;
  const stageScale = Math.min(width / refW, height / refH);

  const tw = useTypewriter(prompt, {
    cps: TYPING_CPS,
    speed,
    startFrame: TYPING_START_FRAME,
  });
  const visibleText = tw.text;
  const showText = tw.count > 0;
  const morph = morphProgressAt(frame, { fps, speed });

  const intro = introBounceIn(frame * speed, fps);
  const headingFade = fadeUpAt(frame * speed, [4, 20]);
  const pillFade = fadeUpAt(frame * speed, [10, 26]);
  const chipsFade = fadeUpAt(frame * speed, [16, 32]);


  const pillWidth = 820;
  const pillLeft = (refW - pillWidth) / 2;
  const pillTop = 300;
  const pillHeight = 64;
  const morphSize = 44;

  const chipsOpacity = chipsFade.opacity * (1 - morph);
  const chipsShift = chipsFade.translateY + 8 * morph;

  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: refW,
          height: refH,
          transform: `translate(-50%, -50%) scale(${stageScale})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 196,
            width: refW,
            textAlign: "center",
            fontFamily: SANS_FAMILY,
            fontSize: 40,
            fontWeight: 700,
            color: t.fg,
            opacity: headingFade.opacity,
            transform: `translateY(${headingFade.translateY + intro.translateY * 0.4}px)`,
          }}
        >
          {greeting}
        </div>

        <div
          style={{
            position: "absolute",
            left: pillLeft,
            top: pillTop,
            width: pillWidth,
            height: pillHeight,
            background: t.inputBg,
            border: `1px solid ${t.inputBorder}`,
            borderRadius: 32,
            boxShadow: "0 8px 30px -14px rgba(13,13,13,0.14)",
            opacity: pillFade.opacity,
            transform: `translateY(${pillFade.translateY + intro.translateY * 0.6}px) scale(${intro.scale})`,
            transformOrigin: "center top",
            display: "flex",
            alignItems: "center",
            paddingLeft: 20,
            paddingRight: 12,
            boxSizing: "border-box",
          }}
        >
          <PlusIcon size={24} color={t.fg} />

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              marginLeft: 14,
              fontFamily: SANS_FAMILY,
              fontSize: 19,
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {showText ? (
              <span
                style={{
                  color: t.fg,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {visibleText}
                <Caret
                  color={t.fg}
                  blink={!tw.typing}
                  speed={speed}
                  height={22}
                  marginLeft={2}
                />
              </span>
            ) : (
              <span
                style={{
                  color: t.fgMuted,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <Caret color={t.fg} blink={!tw.typing} speed={speed} height={22} />
                <span style={{ marginLeft: 6 }}>{placeholder}</span>
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MicIcon size={22} color={t.iconColor} />
            </div>

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
                  background: accentColor,
                  opacity: 1 - morph,
                  transform: `scale(${1 - 0.1 * morph})`,
                }}
              >
                <WaveformIcon size={22} color="#FFFFFF" />
              </div>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "100%",
                  background: t.sendBg,
                  opacity: morph,
                  transform: `scale(${0.8 + 0.2 * morph})`,
                }}
              >
                <ArrowUpIcon size={22} color={t.sendArrow} />
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            top: pillTop + pillHeight + 24,
            width: refW,
            display: "flex",
            justifyContent: "center",
            gap: 12,
            opacity: chipsOpacity,
            transform: `translateY(${chipsShift}px)`,
          }}
        >
          <SuggestionChip
            label="Create an image"
            border={t.chipBorder}
            color={t.chipFg}
            icon={<ImageIcon size={18} color={t.chipFg} />}
          />
          <SuggestionChip
            label="Write or edit"
            border={t.chipBorder}
            color={t.chipFg}
            icon={<PencilIcon size={18} color={t.chipFg} />}
          />
          <SuggestionChip
            label="Look something up"
            border={t.chipBorder}
            color={t.chipFg}
            icon={<GlobeIcon size={18} color={t.chipFg} />}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}
