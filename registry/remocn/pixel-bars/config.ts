import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pixelBarsConfig: ComponentConfig = {
  componentName: "PixelBars",
  importPath: "@/components/remocn/pixel-bars",
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
    label: {
      type: "text-content",
      default: "this quarter",
      description: "Label",
    },
    metric: {
      type: "text-content",
      default: "+64%",
      description: "Metric",
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
  durationInFrames: 115,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
