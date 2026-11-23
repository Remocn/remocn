"use client";

import { AbsoluteFill, Easing, interpolate } from "remotion";
import { GlassCodeBlock } from "@/components/remocn/glass-code-block";
import { useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

export interface GlassCodeWalkProps {
  code?: string;
  title?: string;
  width?: number;
  height?: number;
  fontSize?: number;
  staggerFrames?: number;
  zoom?: number;
  speed?: number;
  className?: string;
}

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;
const RING = 1;
const CHROME_HEIGHT = 40;
const BODY_PADDING_TOP = 20;
const BODY_PADDING_LEFT = 24;
const LINE_GAP = 4;
const ANCHOR_SCREEN_X = 110;
const TARGET_Y = 360;
const PULL_BACK_FRAMES = 24;

const DEFAULT_CODE = `import { AbsoluteFill } from "remotion";
import { Typewriter } from "@/components/remocn";

export function Intro() {
  return (
    <AbsoluteFill>
      <Typewriter text="Ship it" />
    </AbsoluteFill>
  );
}`;

export function GlassCodeWalk({
  code = DEFAULT_CODE,
  title = "scene.tsx",
  width = 880,
  height = 420,
  fontSize = 18,
  staggerFrames = 10,
  zoom = 2.6,
  speed = 1,
  className,
}: GlassCodeWalkProps) {
  const glide = useGlide();
  const frame = useSceneFrame();

  const lines = code.split("\n");
  const lineCount = lines.length;

  const blockLeft = (STAGE_WIDTH - width) / 2;
  const blockTop = (STAGE_HEIGHT - height) / 2;
  const bodyTop = blockTop + RING + CHROME_HEIGHT + BODY_PADDING_TOP;

  const lineHeightOf = (line: string) =>
    line.trim() === "" ? fontSize * 0.8 : fontSize * 1.55;

  const lineCenters: number[] = [];
  let walk = bodyTop;
  for (const line of lines) {
    const h = lineHeightOf(line);
    lineCenters.push(walk + h / 2);
    walk += h + LINE_GAP;
  }

  const anchorWorldX = blockLeft + RING + BODY_PADDING_LEFT;
  const scanStagger = staggerFrames / speed;
  const scanEnd = (lineCount - 1) * scanStagger;

  const camera = (f: number) => {
    const linePosition = interpolate(f, [0, scanEnd], [0, lineCount - 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const lower = Math.floor(linePosition);
    const upper = Math.min(lower + 1, lineCount - 1);
    const trackedY =
      lineCenters[lower] +
      (lineCenters[upper] - lineCenters[lower]) * (linePosition - lower);

    const pinnedX = ANCHOR_SCREEN_X - zoom * anchorWorldX;
    const pinnedY = TARGET_Y - zoom * trackedY;

    const pullBack = interpolate(
      f,
      [scanEnd, scanEnd + PULL_BACK_FRAMES / speed],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      },
    );

    return {
      scale: zoom + pullBack * (1 - zoom),
      tx: (1 - pullBack) * pinnedX,
      ty: (1 - pullBack) * pinnedY,
    };
  };
  const { scale, tx, ty } = camera(frame);
  // The camera is moving while its scale step, weighed across the stage, or
  // its travel is more than a hair on screen.
  const step = (a: number, b: number) => {
    const p = camera(a);
    const q = camera(b);
    return Math.max(
      Math.abs(p.scale - q.scale) * STAGE_WIDTH,
      Math.abs(p.ty - q.ty),
    );
  };
  const moving = step(frame + 1, frame) > 1e-3 || step(frame, frame - 1) > 1e-3;

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
          scale: `${scale}`,
          transform: glide(moving),
          transformOrigin: "0 0",
        }}
      >
        <GlassCodeBlock
          code={code}
          title={title}
          width={width}
          height={height}
          fontSize={fontSize}
          staggerFrames={staggerFrames}
          speed={speed}
        />
      </div>
    </AbsoluteFill>
  );
}
