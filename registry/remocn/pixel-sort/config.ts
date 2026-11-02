import { pixelSortExampleCode } from "@/components/docs/examples/pixel-sort-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pixelSortConfig: ComponentConfig = {
  componentName: "pixelSort",
  importPath: "@/components/remocn/pixel-sort",
  controls: {
    columns: {
      type: "number",
      min: 8,
      max: 96,
      step: 2,
      default: 40,
      description: "Columns",
      hiddenFromList: false,
    },
    seed: {
      type: "number",
      min: 1,
      max: 50,
      step: 1,
      default: 5,
      description: "Seed",
      hiddenFromList: false,
    },
    streakColor: {
      type: "color",
      default: "#FFFFFF",
      description: "Streak color",
    },
  },
  durationInFrames: 110,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
  snippet: pixelSortExampleCode,
};
