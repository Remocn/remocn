import { valueSwapExampleCode } from "@/components/docs/examples/value-swap-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const valueSwapConfig: ComponentConfig = {
  componentName: "ValueSwap",
  importPath: "@/components/remocn/value-swap",
  controls: {
    duration: {
      type: "number",
      min: 4,
      max: 24,
      step: 1,
      default: 10,
      description: "Duration",
      hiddenFromList: false,
    },
    distance: {
      type: "number",
      min: 4,
      max: 32,
      step: 2,
      default: 12,
      description: "Distance",
      hiddenFromList: false,
    },
    direction: {
      type: "enum",
      default: "up",
      variants: {
        up: {},
        down: {},
      },
      description: "Direction",
    },
  },
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: valueSwapExampleCode,
};
