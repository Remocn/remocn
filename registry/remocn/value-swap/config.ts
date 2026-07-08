import { valueSwapExampleCode } from "@/components/docs/examples/value-swap-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const valueSwapConfig: ComponentConfig = {
  componentName: "ValueSwap",
  importPath: "@/components/remocn/value-swap",
  controls: {
    duration: {
      type: "number",
      default: 10,
      min: 4,
      max: 24,
      step: 1,
      label: "Duration",
    },
    distance: {
      type: "number",
      default: 12,
      min: 4,
      max: 32,
      step: 2,
      label: "Distance",
    },
    direction: {
      type: "select",
      default: "up",
      options: ["up", "down"],
      label: "Direction",
    },
  },
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: valueSwapExampleCode,
};
