"use client";

import { AbsoluteFill, interpolate } from "remotion";

import { TerminalSimulator } from "@/components/remocn/terminal-simulator";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_COMMAND,
  type TerminalCursorZoomElementId,
  terminalCursorZoomTimeline,
} from "./timeline";

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
  /**
   * Moves, trims or stretches the typed command (`line:0`), by the ids in
   * `./timeline`. The terminal and the camera both follow it. Frames on the
   * scene timeline, after `speed`.
   */
  timing?: Timing<TerminalCursorZoomElementId>;
}

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;
const WINDOW_WIDTH = 900;
const WINDOW_HEIGHT = 480;
const CONTENT_PADDING = 20;
const CHROME_HEIGHT = 40;
const PROMPT_GAP = 8;

export function TerminalCursorZoom(props: TerminalCursorZoomProps) {
  const {
    command = DEFAULT_COMMAND,
    zoom = 2.8,
    fontSize = 20,
    prompt = "$",
    title = "~/code/remocn-demo",
    charsPerFrame = 1,
    chunkSize = 1,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame();
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    terminalCursorZoomTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const line = tl.get("line:0");

  const charWidth = fontSize * 0.6;
  const windowLeft = (STAGE_WIDTH - WINDOW_WIDTH) / 2;
  const windowTop = (STAGE_HEIGHT - WINDOW_HEIGHT) / 2;
  const textStartX =
    windowLeft + CONTENT_PADDING + prompt.length * charWidth + PROMPT_GAP;
  const lineHeight = Math.round(fontSize * 1.6);
  const cursorY = windowTop + CHROME_HEIGHT + CONTENT_PADDING + lineHeight / 2;

  const lineStart = Math.round(line.start / speed);
  const localFrame = (frame - lineStart) * speed;
  const linearRevealed = Math.floor(
    interpolate(localFrame, [0, line.beat("type")], [0, command.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
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
          translate: `${tx}px ${ty}px`,
          scale: `${zoom}`,
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
          timing={timing}
        />
      </div>
    </AbsoluteFill>
  );
}
