import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from "remotion";

/**
 * Demo reel stitched from Center Stage clips (Macro, Focus, Focus pull, Glide, Address bar, Top bar) of
 * staging.remocn.dev. Every transition is a hard cut.
 *
 * Clips are read from the public dir passed on the CLI:
 *   bunx remotion studio src/remotion/center-stage-demo-root.tsx \
 *     --public-dir ~/Downloads/remocn-center-stage-v2
 */

type Shot = {
  /** File name inside the public dir. */
  src: string;
  /** Source clip length in frames at 30fps. */
  sourceFrames: number;
  /** How long the shot stays on screen. */
  frames: number;
};

// The source clips loop, so their strongest camera move sits mid-clip.
// Each shot takes a window centred on that middle.
// Presets: Macro, Focus, Focus pull, Glide, Address bar, Top bar.
const SHOTS: Shot[] = [
  { src: "topbar-home.mp4", sourceFrames: 360, frames: 75 },
  { src: "glide-home.mp4", sourceFrames: 300, frames: 75 },
  { src: "addressbar-m-home.mp4", sourceFrames: 300, frames: 66 },
  { src: "macro-intro.mp4", sourceFrames: 270, frames: 66 },
  { src: "focuspull-m-intro.mp4", sourceFrames: 180, frames: 60 },
  { src: "glide-install.mp4", sourceFrames: 300, frames: 66 },
  { src: "focus-catalog.mp4", sourceFrames: 270, frames: 66 },
  { src: "macro-design-audit.mp4", sourceFrames: 270, frames: 66 },
  { src: "focuspull-m-design-audit.mp4", sourceFrames: 180, frames: 60 },
  { src: "glide-zoom-blur.mp4", sourceFrames: 300, frames: 66 },
  { src: "focuspull-m-zoom-blur.mp4", sourceFrames: 180, frames: 60 },
  { src: "topbar-showcases.mp4", sourceFrames: 360, frames: 66 },
  { src: "focus-showcases.mp4", sourceFrames: 270, frames: 66 },
  { src: "addressbar-m-showcases.mp4", sourceFrames: 300, frames: 66 },
  { src: "focus-changelog.mp4", sourceFrames: 270, frames: 66 },
  { src: "addressbar-m-changelog.mp4", sourceFrames: 300, frames: 66 },
  { src: "macro-home.mp4", sourceFrames: 270, frames: 96 },
];

export const centerStageDemoLength = SHOTS.reduce((t, s) => t + s.frames, 0);

export function CenterStageDemo() {
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {SHOTS.map((shot) => {
        const start = from;
        from += shot.frames;
        const trimBefore = Math.max(
          0,
          Math.round((shot.sourceFrames - shot.frames) / 2),
        );
        return (
          <Sequence key={shot.src} from={start} durationInFrames={shot.frames}>
            <OffthreadVideo
              src={staticFile(shot.src)}
              trimBefore={trimBefore}
              muted
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
