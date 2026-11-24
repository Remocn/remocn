"use client";

import { interpolate, Sequence } from "remotion";
import {
  useCompositionFrames,
  useSceneConfig,
  useSceneFrame,
} from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_LINES,
  type TerminalLine,
  type TerminalLineType,
  type TerminalSimulatorElementId,
  terminalSimulatorTimeline,
} from "./timeline";

export type { TerminalLine, TerminalLineType };

export interface TerminalSimulatorProps {
  lines?: TerminalLine[];
  prompt?: string;
  title?: string;
  background?: string;
  chromeColor?: string;
  fontSize?: number;
  /**
   * Reveal speed. Despite the name, the reveal is now CHUNKED — each
   * `1 / charsPerFrame` frames bumps the cursor by `chunkSize` characters,
   * so output appears in bursts instead of dripping char-by-char.
   */
  charsPerFrame?: number;
  /** Characters revealed per step. */
  chunkSize?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches single lines, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<TerminalSimulatorElementId>;
}

const TYPE_COLORS: Record<TerminalLineType, string> = {
  command: "#fafafa",
  log: "#a1a1aa",
  success: "#22c55e",
  error: "#ef4444",
};

export function TerminalSimulator(props: TerminalSimulatorProps) {
  const {
    lines = DEFAULT_LINES,
    prompt = "$",
    title = "~/projects/remocn",
    background = "#0a0a0a",
    chromeColor = "#1a1a1a",
    fontSize = 18,
    chunkSize = 1,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    terminalSimulatorTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  // A `<Sequence>` starts on one of the composition's own frames.
  const toFrames = useCompositionFrames();

  const lineHeight = Math.round(fontSize * 1.6);
  const visibleLines = 8;
  const windowWidth = 900;
  const windowHeight = 480;

  const rows = lines.map((_, i) => tl.get(`line:${i}`));
  const starts = rows.map((e) => e.start);

  // STEP-FUNCTION scroll. Each overflowing line snaps the buffer up by
  // exactly one lineHeight on the frame it begins. No interpolation, no
  // easing — terminals do not glide.
  let translateY = 0;
  for (let i = visibleLines; i < lines.length; i++) {
    if (frame >= starts[i]) {
      translateY -= lineHeight;
    }
  }

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: windowWidth,
          height: windowHeight,
          background,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          fontFamily:
            "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace",
        }}
      >
        {/* Chrome */}
        <div
          style={{
            height: 40,
            background: chromeColor,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 8,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Light color="#ff5f57" />
          <Light color="#febc2e" />
          <Light color="#28c840" />
          <div
            style={{
              flex: 1,
              textAlign: "center",
              color: "#71717a",
              fontSize: 13,
            }}
          >
            {title}
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: 20,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              top: 20,
              translate: `0 ${translateY}px`,
            }}
          >
            {lines.map((line, index) => (
              <Sequence
                key={index}
                from={toFrames(starts[index] / speed)}
                layout="none"
              >
                <TerminalLineRow
                  line={line}
                  prompt={prompt}
                  fontSize={fontSize}
                  lineHeight={lineHeight}
                  typeFrames={rows[index].beat("type")}
                  chunkSize={chunkSize}
                  fps={fps}
                  speed={speed}
                />
              </Sequence>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Light({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: color,
        opacity: 0.85,
      }}
    />
  );
}

function TerminalLineRow({
  line,
  prompt,
  fontSize,
  lineHeight,
  typeFrames,
  chunkSize,
  fps,
  speed,
}: {
  line: TerminalLine;
  prompt: string;
  fontSize: number;
  lineHeight: number;
  /** Frames the whole line takes to reveal. */
  typeFrames: number;
  chunkSize: number;
  fps: number;
  speed: number;
}) {
  const localFrame = useSceneFrame() * speed;
  const totalChars = line.text.length;

  // Chunked reveal: Math.floor of an interpolated count, then snapped to the
  // nearest multiple of `chunkSize`. This is what gives the bursty terminal
  // feel — text doesn't drip, it lurches.
  const linearRevealed = Math.floor(
    interpolate(localFrame, [0, typeFrames], [0, totalChars], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const revealed = Math.min(
    totalChars,
    Math.ceil(linearRevealed / chunkSize) * chunkSize,
  );
  const visible = line.text.substring(0, revealed);
  const typingDone = revealed >= totalChars;
  // 2 Hz blink at any framerate.
  const cursorVisible = Math.floor((localFrame / fps) * 2) % 2 === 0;

  return (
    <div
      style={{
        height: lineHeight,
        fontSize,
        color: TYPE_COLORS[line.type],
        display: "flex",
        alignItems: "center",
        whiteSpace: "pre",
      }}
    >
      {line.type === "command" && (
        <span style={{ color: "#22c55e", marginRight: 8 }}>{prompt}</span>
      )}
      <span>{visible}</span>
      {!typingDone && cursorVisible && (
        <span
          style={{
            display: "inline-block",
            width: fontSize * 0.55,
            height: fontSize,
            background: TYPE_COLORS[line.type],
            marginLeft: 2,
          }}
        />
      )}
    </div>
  );
}
