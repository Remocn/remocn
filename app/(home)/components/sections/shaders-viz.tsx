"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useReducedMotion } from "motion/react";
import { useRef } from "react";
import { shaderGrainGradientConfig } from "@/registry/remocn/shader-grain-gradient/config";
import { useAutoplay } from "../use-autoplay";

const SHADER_PREVIEW_WIDTH = 480;
const SHADER_PREVIEW_HEIGHT = 270;
const SHADER_PREVIEW_FPS = 20;

const loadShaderGrainGradient = () =>
  import("@/registry/remocn/shader-grain-gradient").then((m) => ({
    default: m.ShaderGrainGradient,
  }));

export function ShadersViz({ play }: { play: boolean }) {
  const reduced = useReducedMotion();
  const playerRef = useRef<PlayerRef>(null);
  const { containerRef } = useAutoplay(playerRef, play && !reduced);

  const durationInFrames = Math.round(
    (shaderGrainGradientConfig.durationInFrames * SHADER_PREVIEW_FPS) /
      shaderGrainGradientConfig.fps,
  );

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 aspect-video min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 will-change-transform">
        <Player
          ref={playerRef}
          lazyComponent={loadShaderGrainGradient}
          inputProps={{}}
          durationInFrames={durationInFrames}
          fps={SHADER_PREVIEW_FPS}
          compositionWidth={SHADER_PREVIEW_WIDTH}
          compositionHeight={SHADER_PREVIEW_HEIGHT}
          style={{ width: "100%", height: "100%" }}
          loop
          initiallyMuted
          acknowledgeRemotionLicense
        />
      </div>
    </div>
  );
}
