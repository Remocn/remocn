import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pointExpandConfig: ComponentConfig = {
  componentName: "PointExpand",
  importPath: "@/components/remocn/point-expand",
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
    pulses: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Pulses",
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
