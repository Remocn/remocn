import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const ringAlignConfig: ComponentConfig = {
  componentName: "RingAlign",
  importPath: "@/components/remocn/ring-align",
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
      default: "Aligned.",
      description: "Word",
    },
    rings: {
      type: "number",
      default: 6,
      min: 0,
      max: 18,
      step: 1,
      description: "Rings",
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
