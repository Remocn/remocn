"use client";

import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import { TerminalSimulator } from "@/components/remocn/terminal-simulator";

export interface TerminalCursorZoomProps {
  command?: string;
  zoom?: number;
  fontSize?: number;
  prompt?: string;
  title?: string;
  charsPerFrame?: number;
  chunkSize?: number;
  speed?: number;
  className?: string;
}

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;
const WINDOW_WIDTH = 900;
const WINDOW_HEIGHT = 480;
const CONTENT_PADDING = 20;
const CHROME_HEIGHT = 40;
const PROMPT_GAP = 8;
const FIRST_LINE_FRAME = 10;

export function TerminalCursorZoom({
  command = "npx shadcn add @remocn/terminal-cursor-zoom",
  zoom = 2.8,
  fontSize = 20,
  prompt = "$",
  title = "~/code/remocn-demo",
  charsPerFrame = 1,
  chunkSize = 1,
  speed = 1,
  className,
}: TerminalCursorZoomProps) {
  const frame = useCurrentFrame();

  const charWidth = fontSize * 0.6;
  const windowLeft = (STAGE_WIDTH - WINDOW_WIDTH) / 2;
  const windowTop = (STAGE_HEIGHT - WINDOW_HEIGHT) / 2;
  const textStartX =
    windowLeft + CONTENT_PADDING + prompt.length * charWidth + PROMPT_GAP;
  const lineHeight = Math.round(fontSize * 1.6);
  const cursorY = windowTop + CHROME_HEIGHT + CONTENT_PADDING + lineHeight / 2;

  const lineStart = Math.round(FIRST_LINE_FRAME / speed);
  const localFrame = (frame - lineStart) * speed;
  const linearRevealed = Math.floor(
    interpolate(
      localFrame,
      [0, command.length / charsPerFrame],
      [0, command.length],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    ),
  );
  const revealed = Math.min(
    command.length,
    Math.ceil(linearRevealed / chunkSize) * chunkSize,
  );

  const cursorX = textStartX + revealed * charWidth;
  const tx = STAGE_WIDTH / 2 - zoom * cursorX;
  const ty = STAGE_HEIGHT / 2 - zoom * cursorY;

  return (
    <AbsoluteFill className={className} style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        <TerminalSimulator
          lines={[{ text: command, type: "command", delay: 0 }]}
          prompt={prompt}
          title={title}
          fontSize={fontSize}
          charsPerFrame={charsPerFrame}
          chunkSize={chunkSize}
          speed={speed}
        />
      </div>
    </AbsoluteFill>
  );
}
