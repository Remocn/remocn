"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { useReducedMotion } from "motion/react";
import { useRef } from "react";
import { AbsoluteFill } from "remotion";
import { zoomBlur } from "@/registry/remocn/zoom-blur";
import { useAutoplay } from "../use-autoplay";

const SCENE_FRAMES = 55;
const TRANSITION_FRAMES = 18;
const DURATION = SCENE_FRAMES * 2 - TRANSITION_FRAMES;
const FPS = 30;

// Bare zoomBlur between two empty color fills — the transition's own motion
// is the whole preview, no scene content to distract from it.
function BareTransitionScene() {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES}>
        <AbsoluteFill style={{ background: "#26242e" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        presentation={zoomBlur()}
      />
      <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES}>
        <AbsoluteFill style={{ background: "#141318" }} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export function TransitionsViz({ play }: { play: boolean }) {
  const reduced = useReducedMotion();
  const playerRef = useRef<PlayerRef>(null);
  const { containerRef } = useAutoplay(playerRef, play && !reduced);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 aspect-video min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 will-change-transform">
        <Player
          ref={playerRef}
          component={BareTransitionScene}
          inputProps={{}}
          durationInFrames={DURATION}
          fps={FPS}
          compositionWidth={1280}
          compositionHeight={720}
          style={{ width: "100%", height: "100%" }}
          loop
          initiallyMuted
          acknowledgeRemotionLicense
        />
      </div>
    </div>
  );
}
