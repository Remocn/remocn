import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const scanRevealConfig: ComponentConfig = {
  componentName: "ScanReveal",
  importPath: "@/components/remocn/scan-reveal",
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
      default: "Built frame by frame",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "Launch films from components you own.",
      description: "Subtitle",
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
  durationInFrames: 142,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
