import { pageTurnExampleCode } from "@/components/docs/examples/page-turn-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pageTurnConfig: ComponentConfig = {
  componentName: "pageTurn",
  importPath: "@/components/remocn/page-turn",
  controls: {
    angle: {
      type: "number",
      default: -7,
      min: -20,
      max: 20,
      step: 1,
      label: "Angle",
    },
    poses: {
      type: "number",
      default: 8,
      min: 2,
      max: 16,
      step: 1,
      label: "Poses",
    },
  },
  durationInFrames: 128,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#f1eee7" },
  snippet: pageTurnExampleCode,
};
