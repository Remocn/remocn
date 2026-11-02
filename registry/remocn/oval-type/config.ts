import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const ovalTypeConfig: ComponentConfig = {
  componentName: "OvalType",
  importPath: "@/components/remocn/oval-type",
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
    accentWord: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Accent word",
      hiddenFromList: false,
    },
    beat: {
      type: "number",
      default: 9,
      min: 0,
      max: 27,
      step: 1,
      description: "Beat",
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
  durationInFrames: 115,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
