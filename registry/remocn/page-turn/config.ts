import { pageTurnExampleCode } from "@/components/docs/examples/page-turn-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pageTurnConfig: ComponentConfig = {
  componentName: "pageTurn",
  importPath: "@/components/remocn/page-turn",
  controls: {
    angle: {
      type: "number",
      min: -20,
      max: 20,
      step: 1,
      default: -7,
      description: "Angle",
      hiddenFromList: false,
    },
    poses: {
      type: "number",
      min: 2,
      max: 16,
      step: 1,
      default: 8,
      description: "Poses",
      hiddenFromList: false,
    },
  },
  durationInFrames: 128,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#f1eee7" },
  snippet: pageTurnExampleCode,
};
