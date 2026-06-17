"use client";

import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Caret } from "@/components/remocn/caret";
import { useTypewriter } from "@/lib/remocn-ui";

const { fontFamily: MONO_FAMILY } = loadFont();

export interface ClaudeCodeProps {
  title?: string;
  userName?: string;
  model?: string;
  cwd?: string;
  placeholder?: string;
  prompt?: string;
  accentColor?: string;
  theme?: "light" | "dark";
  background?: "surface" | "transparent";
  speed?: number;
}

interface Theme {
  page: string;
  windowBar: string;
  windowBody: string;
  fg: string;
  fgMuted: string;
  fgDim: string;
  boxBorder: string;
}

export const THEMES: Record<"light" | "dark", Theme> = {
  light: {
    page: "#E8E5DD",
    windowBar: "#D8D3CA",
    windowBody: "#FBFAF7",
    fg: "#1F1E1D",
    fgMuted: "#73726C",
    fgDim: "#A3A097",
    boxBorder: "#D97757",
  },
  dark: {
    page: "#2B2A28",
    windowBar: "#3A3633",
    windowBody: "#1B1A18",
    fg: "#E8E5DD",
    fgMuted: "#8A857C",
    fgDim: "#6B6660",
    boxBorder: "#D97757",
  },
};

export const TYPING_START_FRAME = 48;

export const TYPING_CPS = 18;

export const WHATS_NEW: string[] = [
  "/agents to create subagents",
  "/security-review for review agent",
  "ctrl+b to background bashes",
];

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

function Mascot({ accent, size = 96 }: { accent: string; size?: number }) {
  return (
    <svg
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Claude Code</title>
      <path
        clipRule="evenodd"
        d="M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z"
        fill={accent}
        fillRule="evenodd"
      />
    </svg>
  );
}

export function ClaudeCode({
  title = "Claude Code v2.0.0",
  userName = "Meaghan",
  model = "Opus 4.8 • Max 20x",
  cwd = "/users/meaghan/code/apps",
  placeholder = 'Try "edit <filepath> to ..."',
  prompt = "edit src/theme.ts to add a dark mode toggle",
  accentColor = "#D97757",
  theme = "dark",
  background = "surface",
  speed = 1,
}: ClaudeCodeProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = THEMES[theme] ?? THEMES.dark;

  const refW = 1280;
  const refH = 720;
  const stageScale = Math.min(width / refW, height / refH);

  const tw = useTypewriter(prompt, {
    cps: TYPING_CPS,
    speed,
    startFrame: TYPING_START_FRAME,
  });
  const showText = tw.count > 0;

  const intro = introBounceIn(frame * speed, fps);
  const leftFade = fadeUpAt(frame * speed, [6, 22]);
  const rightFade = fadeUpAt(frame * speed, [12, 30]);
  const promptFade = fadeUpAt(frame * speed, [18, 36]);

  const pageBg = background === "transparent" ? "transparent" : t.page;
  const border = accentColor;

  const winLeft = 90;
  const winTop = 40;
  const winWidth = 1100;
  const winHeight = 620;
  const barHeight = 40;

  return (
    <AbsoluteFill style={{ background: pageBg }}>
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
            left: winLeft,
            top: winTop,
            width: winWidth,
            height: winHeight,
            background: t.windowBody,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow:
              theme === "light"
                ? "0 24px 60px -20px rgba(31,30,29,0.28)"
                : "0 24px 60px -20px rgba(0,0,0,0.6)",
            opacity: intro.scale,
            transform: `translateY(${intro.translateY}px) scale(${intro.scale})`,
            transformOrigin: "center top",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              height: barHeight,
              background: t.windowBar,
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingLeft: 16,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#FF5F57",
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#FEBC2E",
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#28C840",
              }}
            />
          </div>

          <div
            style={{
              flex: 1,
              position: "relative",
              padding: 28,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                position: "relative",
                border: `1px dashed ${border}`,
                borderRadius: 6,
                padding: "28px 24px 24px",
                opacity: leftFade.opacity,
                transform: `translateY(${leftFade.translateY}px)`,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: -11,
                  left: 22,
                  padding: "0 10px",
                  background: t.windowBody,
                  color: accentColor,
                  fontFamily: MONO_FAMILY,
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {title}
              </span>

              <div style={{ display: "flex", flexDirection: "row" }}>
                <div
                  style={{
                    width: "42%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 16,
                    paddingRight: 24,
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      fontFamily: MONO_FAMILY,
                      fontSize: 20,
                      color: t.fg,
                    }}
                  >
                    Welcome back {userName}!
                  </div>
                  <div style={{ alignSelf: "center" }}>
                    <Mascot accent={accentColor} />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: MONO_FAMILY,
                        fontSize: 15,
                        color: t.fgMuted,
                      }}
                    >
                      {model}
                    </div>
                    <div
                      style={{
                        fontFamily: MONO_FAMILY,
                        fontSize: 15,
                        color: t.fgMuted,
                      }}
                    >
                      {cwd}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    width: "58%",
                    borderLeft: `1px dashed ${border}`,
                    paddingLeft: 24,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    opacity: rightFade.opacity,
                    transform: `translateY(${rightFade.translateY}px)`,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: MONO_FAMILY,
                        fontSize: 15,
                        fontWeight: 700,
                        color: accentColor,
                        marginBottom: 10,
                      }}
                    >
                      What's new
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {WHATS_NEW.map((line) => (
                        <div
                          key={line}
                          style={{
                            fontFamily: MONO_FAMILY,
                            fontSize: 14,
                            color: t.fg,
                          }}
                        >
                          {line}
                        </div>
                      ))}
                      <div
                        style={{
                          fontFamily: MONO_FAMILY,
                          fontSize: 14,
                          color: t.fgDim,
                        }}
                      >
                        ... /help for more
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: 32 }} />

            <div
              style={{
                opacity: promptFade.opacity,
                transform: `translateY(${promptFade.translateY}px)`,
              }}
            >
              <div
                style={{
                  height: 1,
                  background: t.fgDim,
                  opacity: 0.4,
                  marginBottom: 16,
                }}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  fontFamily: MONO_FAMILY,
                  fontSize: 17,
                  whiteSpace: "pre",
                }}
              >
                <span style={{ color: t.fgMuted }}>{"> "}</span>
                {showText ? (
                  <span
                    style={{
                      position: "relative",
                      color: t.fg,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    {tw.text}
                    <span style={{ opacity: 0.55, display: "inline-flex" }}>
                      <Caret
                        width={11}
                        height={22}
                        color={t.fg}
                        blink={!tw.typing}
                        speed={speed}
                        marginLeft={2}
                      />
                    </span>
                  </span>
                ) : (
                  <span
                    style={{
                      position: "relative",
                      color: t.fgMuted,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ opacity: 0.55, display: "inline-flex" }}>
                      <Caret
                        width={11}
                        height={22}
                        color={t.fg}
                        blink={!tw.typing}
                        speed={speed}
                      />
                    </span>
                    <span style={{ marginLeft: 6 }}>{placeholder}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
