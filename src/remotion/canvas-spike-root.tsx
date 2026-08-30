import { loadFont } from "@remotion/google-fonts/Geist";
import type { ComponentType } from "react";
import {
  AbsoluteFill,
  Composition,
  isHtmlInCanvasSupported,
  registerRoot,
} from "remotion";
import { AsciiRenderExampleScene } from "@/components/docs/examples/ascii-render-example";
import { CameraLensExampleScene } from "@/components/docs/examples/camera-lens-example";
import { CrtScreenExampleScene } from "@/components/docs/examples/crt-screen-example";
import { DisplacementExampleScene } from "@/components/docs/examples/displacement-example";
import { EmberBurnExampleScene } from "@/components/docs/examples/ember-burn-example";
import { GlitchCutExampleScene } from "@/components/docs/examples/glitch-cut-example";
import { GridWaveExampleScene } from "@/components/docs/examples/grid-wave-example";
import { HalftonePrintExampleScene } from "@/components/docs/examples/halftone-print-example";
import { HologramExampleScene } from "@/components/docs/examples/hologram-example";
import { ParticleDissolveExampleScene } from "@/components/docs/examples/particle-dissolve-example";
import { PixelateRegionExampleScene } from "@/components/docs/examples/pixelate-region-example";
import { SecurityCamExampleScene } from "@/components/docs/examples/security-cam-example";
import { SustainedGlitchExampleScene } from "@/components/docs/examples/sustained-glitch-example";
import { UnderwaterRippleExampleScene } from "@/components/docs/examples/underwater-ripple-example";
import { VhsFilterExampleScene } from "@/components/docs/examples/vhs-filter-example";
import type { ComponentConfig } from "@/lib/customizer-config";
import { asciiRenderConfig } from "@/registry/remocn/ascii-render/config";
import { cameraLensConfig } from "@/registry/remocn/camera-lens/config";
import { crtScreenConfig } from "@/registry/remocn/crt-screen/config";
import { displacementConfig } from "@/registry/remocn/displacement/config";
import { emberBurnConfig } from "@/registry/remocn/ember-burn/config";
import { glitchCutConfig } from "@/registry/remocn/glitch-cut/config";
import { gridWaveConfig } from "@/registry/remocn/grid-wave/config";
import { halftonePrintConfig } from "@/registry/remocn/halftone-print/config";
import { hologramConfig } from "@/registry/remocn/hologram/config";
import { particleDissolveConfig } from "@/registry/remocn/particle-dissolve/config";
import { pixelateRegionConfig } from "@/registry/remocn/pixelate-region/config";
import { RushType } from "@/registry/remocn/rush-type";
import { rushTypeConfig } from "@/registry/remocn/rush-type/config";
import { securityCamConfig } from "@/registry/remocn/security-cam/config";
import { sustainedGlitchConfig } from "@/registry/remocn/sustained-glitch/config";
import { underwaterRippleConfig } from "@/registry/remocn/underwater-ripple/config";
import { vhsFilterConfig } from "@/registry/remocn/vhs-filter/config";

const { fontFamily: GEIST } = loadFont();

if (typeof document !== "undefined") {
  console.log(
    `[canvas-spike] htmlInCanvasSupported=${isHtmlInCanvasSupported()}`,
  );
  console.log(`[canvas-spike] userAgent=${navigator.userAgent}`);
}

const SCENES: Record<
  string,
  { Scene: ComponentType; config: ComponentConfig }
> = {
  "glitch-cut": { Scene: GlitchCutExampleScene, config: glitchCutConfig },
  "ember-burn": { Scene: EmberBurnExampleScene, config: emberBurnConfig },
  "particle-dissolve": {
    Scene: ParticleDissolveExampleScene,
    config: particleDissolveConfig,
  },
  "grid-wave": { Scene: GridWaveExampleScene, config: gridWaveConfig },
  displacement: {
    Scene: DisplacementExampleScene,
    config: displacementConfig,
  },
  "vhs-filter": { Scene: VhsFilterExampleScene, config: vhsFilterConfig },
  "crt-screen": { Scene: CrtScreenExampleScene, config: crtScreenConfig },
  "sustained-glitch": {
    Scene: SustainedGlitchExampleScene,
    config: sustainedGlitchConfig,
  },
  "pixelate-region": {
    Scene: PixelateRegionExampleScene,
    config: pixelateRegionConfig,
  },
  "ascii-render": { Scene: AsciiRenderExampleScene, config: asciiRenderConfig },
  "halftone-print": {
    Scene: HalftonePrintExampleScene,
    config: halftonePrintConfig,
  },
  "underwater-ripple": {
    Scene: UnderwaterRippleExampleScene,
    config: underwaterRippleConfig,
  },
  "camera-lens": { Scene: CameraLensExampleScene, config: cameraLensConfig },
  "security-cam": { Scene: SecurityCamExampleScene, config: securityCamConfig },
  hologram: { Scene: HologramExampleScene, config: hologramConfig },
  "rush-type": { Scene: RushType, config: rushTypeConfig },
};

function makeStage(Scene: ComponentType) {
  return function CanvasSpikeStage() {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#0a0a0a",
          ["--font-geist-sans" as string]: GEIST,
          fontFamily: GEIST,
        }}
      >
        <Scene />
      </AbsoluteFill>
    );
  };
}

const STAGES: Record<string, ReturnType<typeof makeStage>> = Object.fromEntries(
  Object.entries(SCENES).map(([id, entry]) => [id, makeStage(entry.Scene)]),
);

export function CanvasSpikeRoot() {
  return (
    <>
      {Object.entries(SCENES).map(([id, entry]) => (
        <Composition
          key={id}
          id={id}
          component={STAGES[id]}
          durationInFrames={entry.config.durationInFrames}
          fps={entry.config.fps}
          width={entry.config.compositionWidth}
          height={entry.config.compositionHeight}
        />
      ))}
    </>
  );
}

registerRoot(CanvasSpikeRoot);
