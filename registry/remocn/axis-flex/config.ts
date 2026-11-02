import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const axisFlexConfig: ComponentConfig = {
  componentName: "AxisFlex",
  importPath: "@/components/remocn/axis-flex",
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
      default: "elastic",
      description: "Word",
    },
    line: {
      type: "text-content",
      default: "One family, every width",
      description: "Line",
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
