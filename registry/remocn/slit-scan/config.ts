import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const slitScanConfig: ComponentConfig = {
  componentName: "SlitScan",
  importPath: "@/components/remocn/slit-scan",
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
      default: "Faster.",
      description: "Word",
    },
    caption: {
      type: "text-content",
      default: "First render in 1.8s, down from 4.7s",
      description: "Caption",
    },
    slices: {
      type: "number",
      default: 120,
      min: 0,
      max: 360,
      step: 1,
      description: "Slices",
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
  durationInFrames: 125,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
