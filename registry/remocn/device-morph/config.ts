import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const deviceMorphConfig: ComponentConfig = {
  componentName: "DeviceMorph",
  importPath: "@/components/remocn/device-morph",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    reverse: {
      type: "boolean",
      default: false,
      description: "Reverse",
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
  durationInFrames: 205,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
