import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

// Every timing in remocn is written in frames of a 30 fps timeline: a delay
// of 12, a rise over 20, a spring fed `fps`. Read straight from Remotion,
// those numbers mean something else in a 60 fps composition: a tween runs
// twice as fast, while a spring keeps its length, so a scene does not even
// speed up evenly.
//
// These two hooks stand in for Remotion's and answer on that 30 fps timeline
// whatever rate the composition runs at. At 60 fps the frame goes 0, 0.5, 1,
// 1.5: the scene lasts the same number of seconds and every frame in between
// is a new picture. At 30 fps they return exactly what Remotion does.
//
//   const frame = useSceneFrame();
//   const { fps, width } = useSceneConfig();
//
// What a component hands back to Remotion is still counted in the
// composition's own frames: `from` and `durationInFrames` of a `<Sequence>`,
// the length of a transition. `useCompositionFrames()` converts those.

/** The frame rate remocn timings are written in. */
export const SCENE_FPS = 30;

/** `useCurrentFrame()` in 30 fps frames; fractional above 30 fps. */
export function useSceneFrame(): number {
  const { fps } = useVideoConfig();
  return (useCurrentFrame() * SCENE_FPS) / fps;
}

/**
 * `useVideoConfig()` on the 30 fps timeline: `fps` is 30 and
 * `durationInFrames` counts 30 fps frames. Size and the rest are untouched.
 */
export function useSceneConfig(): ReturnType<typeof useVideoConfig> {
  const config = useVideoConfig();
  return useMemo(
    () => ({
      ...config,
      fps: SCENE_FPS,
      durationInFrames: (config.durationInFrames * SCENE_FPS) / config.fps,
    }),
    [config],
  );
}

/**
 * Turns a count of 30 fps frames into the composition's own, for what
 * Remotion itself reads: `<Sequence from={frames(24)}>`. Whole frames only,
 * as Remotion requires.
 */
export function useCompositionFrames(): (sceneFrames: number) => number {
  const { fps } = useVideoConfig();
  return useMemo(
    () => (sceneFrames: number) => Math.round((sceneFrames * fps) / SCENE_FPS),
    [fps],
  );
}
