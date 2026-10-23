import { spotlightExampleCode } from "@/components/docs/examples/spotlight-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const spotlightConfig: ComponentConfig = {
  componentName: "Spotlight",
  importPath: "@/components/remocn/spotlight",
  controls: {
    dim: {
      type: "number",
      default: 0.16,
      min: 0,
      max: 0.6,
      step: 0.01,
      description: "Unlit brightness",
      hiddenFromList: false,
    },
    beamColor: { type: "color", default: "#FFFFFF", description: "Beam" },
    stageColor: { type: "color", default: "#111111", description: "Stage" },
  },
  durationInFrames: 80,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
  snippet: spotlightExampleCode,
};
