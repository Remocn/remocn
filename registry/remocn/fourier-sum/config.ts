import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const fourierSumConfig: ComponentConfig = {
  componentName: "FourierSum",
  importPath: "@/components/remocn/fourier-sum",
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
    title: {
      type: "text-content",
      default: "Many parts. One signal.",
      description: "Title",
    },
    periods: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Periods",
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
