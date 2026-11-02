import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const finePrintUpConfig: ComponentConfig = {
  componentName: "FinePrintUp",
  importPath: "@/components/remocn/fine-print-up",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    closing: {
      type: "text-content",
      default: "That’s all the fine print.",
      description: "Closing",
    },
    speed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 300,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
