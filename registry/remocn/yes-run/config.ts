import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const yesRunConfig: ComponentConfig = {
  componentName: "YesRun",
  importPath: "@/components/remocn/yes-run",
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
    answer: {
      type: "text-content",
      default: "Yes.",
      description: "Answer",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
