import { driftExampleCode } from "@/components/docs/examples/drift-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const driftConfig: ComponentConfig = {
  componentName: "Drift",
  importPath: "@/components/remocn/drift",
  controls: {
    grow: {
      type: "number",
      min: -0.1,
      max: 0.15,
      step: 0.005,
      default: 0.035,
      description: "Grow",
      hiddenFromList: false,
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: driftExampleCode,
};
