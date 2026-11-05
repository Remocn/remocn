import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const magnitudePushConfig: ComponentConfig = {
  componentName: "MagnitudePush",
  importPath: "@/components/remocn/magnitude-push",
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
      default: "1000",
      description: "Value",
    },
    suffix: {
      type: "text-content",
      default: "×",
      description: "Suffix",
    },
    label: {
      type: "text-content",
      default: "fewer keyframes to set by hand",
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
