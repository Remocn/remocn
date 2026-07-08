import { driftExampleCode } from "@/components/docs/examples/drift-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const driftConfig: ComponentConfig = {
  componentName: "Drift",
  importPath: "@/components/remocn/drift",
  controls: {
    grow: {
      type: "number",
      default: 0.035,
      min: -0.1,
      max: 0.15,
      step: 0.005,
      label: "Grow",
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: driftExampleCode,
};
