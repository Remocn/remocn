import { rolodexFlipExampleCode } from "@/components/docs/examples/rolodex-flip-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rolodexFlipConfig: ComponentConfig = {
  componentName: "RolodexFlip",
  importPath: "@/components/remocn/rolodex-flip",
  controls: {
    interval: {
      type: "number",
      default: 20,
      min: 10,
      max: 40,
      step: 2,
      label: "Interval",
    },
    flipDuration: {
      type: "number",
      default: 10,
      min: 4,
      max: 20,
      step: 1,
      label: "Flip duration",
    },
  },
  durationInFrames: 110,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: rolodexFlipExampleCode,
};
