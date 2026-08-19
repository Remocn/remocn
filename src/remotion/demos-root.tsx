import { loadFont } from "@remotion/google-fonts/Geist";
import type { ComponentType } from "react";
import { AbsoluteFill, Composition, Loop, registerRoot } from "remotion";
import { examples } from "@/components/docs/examples";
import { aiExamples } from "@/components/docs/examples/ai";
import { blockExamples } from "@/components/docs/examples/blocks";

/**
 * Every renderable scene: the ui-tier `examples` (keyed `<name>-example`) plus
 * the composition `blockExamples` (keyed `<name>-flow`). Key namespaces don't
 * overlap, and both records share the timing/scene shape this root consumes.
 */
const ALL_SCENES = { ...examples, ...blockExamples, ...aiExamples };

/**
 * Demos bundle root. Auto-declares one Remotion composition per docs example
 * (the `examples` record is the single source of truth for timing + scene), so
 * `scripts/render-demos.mts` can render every example to an mp4. Kept separate
 * from `Root.tsx`/`index.ts` (the github-stars server bundle) — that entry is
 * untouched; this one is bundled only by the demos render script.
 *
 * Two fidelity bridges make the mp4 match the on-site @remotion/player preview:
 *  - white stage background (= `--card` light = the `.surface-card` the preview
 *    sits on); self-painting scenes (e.g. blur-in) just cover it.
 *  - Geist loaded via @remotion/google-fonts, exposed as `--font-geist-sans` so
 *    the CSS var the scenes reference resolves to the real face (the site gets
 *    this from next/font, which doesn't exist in a standalone Remotion bundle).
 */

const { fontFamily: GEIST } = loadFont();

interface StageProps {
  // Remotion requires composition props to extend Record<string, unknown>.
  [key: string]: unknown;
  /** One animation cycle, in frames (from the example's `durationInFrames`). */
  loopFrames: number;
  /** Repeat the cycle this many times (CLI `--loops`, default 1). */
  loops: number;
}

/**
 * Bind each example's scene at bundle time via closure — components are not
 * JSON-serializable, so they can't ride through `defaultProps`/`inputProps`.
 * Only the numeric loop knobs cross that boundary.
 */
function makeStage(Example: ComponentType) {
  return function DemoStage({ loopFrames }: StageProps) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#ffffff",
          ["--font-geist-sans" as string]: GEIST,
          fontFamily: GEIST,
        }}
      >
        <Loop durationInFrames={loopFrames}>
          <Example />
        </Loop>
      </AbsoluteFill>
    );
  };
}

// Stable component reference per composition (don't re-create inside render).
const STAGES: Record<string, ReturnType<typeof makeStage>> = Object.fromEntries(
  Object.entries(ALL_SCENES).map(([id, entry]) => [
    id,
    makeStage(entry.Component),
  ]),
);

export function DemosRoot() {
  return (
    <>
      {Object.entries(ALL_SCENES).map(([id, entry]) => (
        <Composition
          key={id}
          id={id}
          component={STAGES[id]}
          durationInFrames={entry.durationInFrames}
          fps={entry.fps}
          width={entry.width}
          height={entry.height}
          defaultProps={{ loopFrames: entry.durationInFrames, loops: 1 }}
          calculateMetadata={({ props }) => ({
            durationInFrames: props.loopFrames * Math.max(1, props.loops),
          })}
        />
      ))}
    </>
  );
}

registerRoot(DemosRoot);
