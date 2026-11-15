import type { ComponentType, ReactNode } from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";

// biome-ignore lint/suspicious/noExplicitAny: registry pieces each take their own props
type AnyComponent = ComponentType<any>;

/**
 * A registry piece cut into the reel: it plays from `cutIn` of its own
 * timeline at `speed`x for the beat's frames.
 */
export type PieceCut = {
  component: AnyComponent;
  props?: Record<string, unknown>;
  cutIn: number;
  /** The piece's full demo length; it reads its timing from this. */
  length: number;
  speed: number;
};

/** One beat of the reel. Beats play back to back with a hard cut between. */
export type Beat = {
  id: string;
  frames: number;
} & ({ node: ReactNode } | { piece: PieceCut });

export const reelLength = (beats: Beat[]) =>
  beats.reduce((t, b) => t + b.frames, 0);

export function Reel({ beats }: { beats: Beat[] }) {
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {beats.map((beat) => {
        const start = from;
        from += beat.frames;
        if ("piece" in beat) {
          return (
            <Speeded
              key={beat.id}
              name={beat.id}
              start={start}
              frames={beat.frames}
              {...beat.piece}
            />
          );
        }
        return (
          <Sequence
            key={beat.id}
            name={beat.id}
            from={start}
            durationInFrames={beat.frames}
          >
            {beat.node}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

/**
 * Plays a piece faster than real time without touching its code.
 *
 * Sequence `playbackRate` divides the `durationInFrames` the child reads, and
 * pieces time their beats off that. So instead the piece sits in a Sequence
 * of its full length whose `from` moves every frame, handing it frame
 * `cutIn + t * speed`. It lives at the root of the film, not inside a beat
 * Sequence, so no parent shortens the duration it reads.
 */
function Speeded({
  name,
  start,
  frames,
  component: Component,
  props,
  cutIn,
  length,
  speed,
}: PieceCut & { name: string; start: number; frames: number }) {
  const frame = useCurrentFrame();
  if (frame < start || frame >= start + frames) return null;
  const local = Math.min(
    length - 1,
    cutIn + Math.floor((frame - start) * speed),
  );
  return (
    <Sequence name={name} from={frame - local} durationInFrames={length}>
      <Component {...props} />
    </Sequence>
  );
}

/**
 * A Center Stage render. The source clips loop, so the strongest camera move
 * sits mid-clip: the window is centred on the middle.
 */
export function Clip({
  src,
  sourceFrames,
  frames,
}: {
  src: string;
  sourceFrames: number;
  frames: number;
}) {
  const trimBefore = Math.max(0, Math.round((sourceFrames - frames) / 2));
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(`clips/${src}`)}
        trimBefore={trimBefore}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
}
