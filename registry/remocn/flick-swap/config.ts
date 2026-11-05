import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const flickSwapConfig: ComponentConfig = {
  componentName: "FlickSwap",
  importPath: "@/components/remocn/flick-swap",
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
    dwell: {
      type: "number",
      default: 28,
      min: 0,
      max: 84,
      step: 1,
      description: "Dwell",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
