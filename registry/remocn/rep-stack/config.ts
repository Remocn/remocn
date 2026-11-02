import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const repStackConfig: ComponentConfig = {
  componentName: "RepStack",
  importPath: "@/components/remocn/rep-stack",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    word: {
      type: "text-content",
      default: "AGAIN.",
      description: "Word",
    },
    reps: {
      type: "number",
      default: 6,
      min: 0,
      max: 18,
      step: 1,
      description: "Reps",
      hiddenFromList: false,
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
  durationInFrames: 96,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
