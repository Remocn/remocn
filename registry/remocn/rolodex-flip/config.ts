import { rolodexFlipExampleCode } from "@/components/docs/examples/rolodex-flip-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rolodexFlipConfig: ComponentConfig = {
  componentName: "RolodexFlip",
  importPath: "@/components/remocn/rolodex-flip",
  controls: {
    interval: {
      type: "number",
      min: 10,
      max: 40,
      step: 2,
      default: 20,
      description: "Interval",
      hiddenFromList: false,
    },
    flipDuration: {
      type: "number",
      min: 4,
      max: 20,
      step: 1,
      default: 10,
      description: "Flip duration",
      hiddenFromList: false,
    },
  },
  dimensions: { width: 220, height: 60 },
  durationInFrames: 110,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: rolodexFlipExampleCode,
};
