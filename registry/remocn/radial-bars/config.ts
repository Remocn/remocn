import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const radialBarsConfig: ComponentConfig = {
  componentName: "RadialBars",
  importPath: "@/components/remocn/radial-bars",
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
    value: {
      type: "text-content",
      default: "2.4M",
      description: "Value",
    },
    label: {
      type: "text-content",
      default: "renders in the peak hour",
      description: "Label",
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
